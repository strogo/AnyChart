goog.provide('anychart.core.polar.series.Base');
goog.require('acgraph');
goog.require('anychart.core.SeriesBase');
goog.require('anychart.core.utils.SeriesPointContextProvider');
goog.require('anychart.data');
goog.require('anychart.enums');


/**
 * Namespace anychart.core.polar
 * @namespace
 * @name anychart.core.polar
 */



/**
 * Base class for all polar series.<br/>
 * Base class defines common methods, such as those for:
 * <ul>
 *   <li>Binding series to a scale: <i>xScale, yScale</i></li>
 *   <li>Base color settings: <i>color</i></li>
 * </ul>
 * You can also obtain <i>getIterator, getResetIterator</i> iterators here
 * @param {(anychart.data.View|anychart.data.Set|Array|string)=} opt_data Data for the series.
 * @param {Object.<string, (string|boolean)>=} opt_csvSettings If CSV string is passed, you can pass CSV parser settings
 *    here as a hash map.
 * @constructor
 * @extends {anychart.core.SeriesBase}
 */
anychart.core.polar.series.Base = function(opt_data, opt_csvSettings) {
  anychart.core.polar.series.Base.base(this, 'constructor', opt_data, opt_csvSettings);
};
goog.inherits(anychart.core.polar.series.Base, anychart.core.SeriesBase);


/**
 * Approximate curve.
 * @param {Array.<number>} startPoint .
 * @param {Array.<number>} endPoint .
 * @param {boolean} newSegment .
 * @protected
 * @return {Array.<number>} .
 */
anychart.core.polar.series.Base.prototype.approximateCurve = function(startPoint, endPoint, newSegment) {
  //x coord, y coord, angle, raduis
  var Ax, Ay, Aa, Ar;
  var Bx, By, Ba, Br;
  var Cx, Cy, Ca, Cr;
  var Dx, Dy, Da, Dr;


  var xScale = /** @type {anychart.scales.Base} */(this.xScale());

  if (startPoint) {
    Ax = startPoint[0];
    Ay = startPoint[1];
    Aa = startPoint[2];
    Ar = startPoint[3];
  } else {
    Ax = NaN;
    Ay = NaN;
    Ar = NaN;
    Aa = NaN;
  }

  if (endPoint) {
    Dx = endPoint[0];
    Dy = endPoint[1];
    Da = endPoint[2];
    Dr = endPoint[3];
  } else {
    Dx = NaN;
    Dy = NaN;
    Dr = NaN;
    Da = NaN;
  }

  var zeroAngle = goog.math.modulo(goog.math.toRadians(this.startAngle_ - 90), Math.PI * 2);

  //Angle of point A relative zero angle.
  var AaRZ = goog.math.modulo(Aa - zeroAngle, Math.PI * 2);
  var rounded2Pi = anychart.math.round(Math.PI * 2, 4);
  var roundedARZ = anychart.math.round(AaRZ, 4);

  if (roundedARZ == rounded2Pi || !roundedARZ)
    AaRZ = 0;

  //Angle of point D relative zero angle.
  var DaRZ = goog.math.modulo(Da - zeroAngle, Math.PI * 2);
  var roundedDRZ = anychart.math.round(DaRZ, 4);
  if (roundedDRZ == rounded2Pi || !roundedDRZ)
    DaRZ = 0;

  var isAcrossZeroLine = xScale.inverted() ? AaRZ < DaRZ && AaRZ > 0 : AaRZ > DaRZ && DaRZ > 0;

  var sweep, i;
  if (xScale.inverted()) {
    if (Da > Aa) Da -= Math.PI * 2;
    sweep = Aa - Da;
  } else {
    if (Aa > Da) Aa -= Math.PI * 2;
    sweep = Da - Aa;
  }

  sweep = isNaN(sweep) ? sweep : anychart.math.round(sweep, 4);
  if (!sweep && !isNaN(sweep)) return null;

  var a90 = Math.PI / 2;
  a90 = anychart.math.round(a90, 4);

  var parts = Math.ceil(sweep / a90);
  var isSegmentOverA90 = parts > 1;

  var angles, angle, angleStep, segments;

  if (isAcrossZeroLine) {
    angles = [];
    segments = [];
    var firstSweep, secondSweep;
    if (isAcrossZeroLine) {
      if (xScale.inverted()) {
        firstSweep = AaRZ;
        secondSweep = Math.PI * 2 - DaRZ;
      } else {
        firstSweep = Math.PI * 2 - AaRZ;
        secondSweep = DaRZ;
      }
    }

    parts = firstSweep ? Math.ceil(firstSweep / a90) : 0;
    for (i = 0; i < parts; i++) {
      angleStep = (i == parts - 1 && firstSweep % a90 != 0) ? firstSweep % a90 : a90;
      angle = xScale.inverted() ? -angleStep : angleStep;
      angles.push(angle);
      segments.push(false);
    }

    parts = secondSweep ? Math.ceil(secondSweep / a90) : 0;
    for (i = 0; i < parts; i++) {
      angleStep = (i == parts - 1 && secondSweep % a90 != 0) ? secondSweep % a90 : a90;
      angle = xScale.inverted() ? -angleStep : angleStep;
      angles.push(angle);
      segments.push(!i);
    }
  } else if (isSegmentOverA90) {
    angles = [];
    for (i = 0; i < parts; i++) {
      angleStep = (i == parts - 1 && sweep % a90 != 0) ? sweep % a90 : a90;
      angle = xScale.inverted() ? -angleStep : angleStep;
      angles.push(angle);
    }
  }

  var res = [];
  var P1x, P1y, P2x, P2y, P3x, P3y, P4x, P4y;
  if (angles) {
    var Sx = Ax, Sy = Ay, Sa = Aa, Sr = Ar;
    var Ex, Ey, Ea, Er;
    var sPoint, ePoint;

    for (i = 0; i < angles.length; i++) {
      Ea = Sa + angles[i];
      Er = (Ea - Sa) * (Dr - Sr) / (Da - Sa) + Sr;
      Ex = this.cx + Er * Math.cos(Ea);
      Ey = this.cy + Er * Math.sin(Ea);

      sPoint = [Sx, Sy, Sa, Sr];
      ePoint = [Ex, Ey, Ea, Er];

      res.push.apply(res, this.approximateCurve(sPoint, ePoint, segments ? segments[i] : false));

      Sx = Ex; Sy = Ey; Sa = Ea; Sr = Er;
    }
  } else {
    angleStep = sweep / 3;

    if (xScale.inverted()) {
      Ba = Da + angleStep;
      Br = (Ba - Da) * (Ar - Dr) / (Aa - Da) + Dr;
      Bx = this.cx + Br * Math.cos(Ba);
      By = this.cy + Br * Math.sin(Ba);

      Ca = Da + angleStep * 2;
      Cr = (Ca - Da) * (Ar - Dr) / (Aa - Da) + Dr;
      Cx = this.cx + Cr * Math.cos(Ca);
      Cy = this.cy + Cr * Math.sin(Ca);

      P2x = (2 * Dx - 9 * Bx + 18 * Cx - 5 * Ax) / 6;
      P2y = (2 * Dy - 9 * By + 18 * Cy - 5 * Ay) / 6;

      P3x = (-5 * Dx + 18 * Bx - 9 * Cx + 2 * Ax) / 6;
      P3y = (-5 * Dy + 18 * By - 9 * Cy + 2 * Ay) / 6;
    } else {
      Ba = Aa + angleStep;
      Br = (Ba - Aa) * (Dr - Ar) / (Da - Aa) + Ar;
      Bx = this.cx + Br * Math.cos(Ba);
      By = this.cy + Br * Math.sin(Ba);

      Ca = Aa + angleStep * 2;
      Cr = (Ca - Aa) * (Dr - Ar) / (Da - Aa) + Ar;
      Cx = this.cx + Cr * Math.cos(Ca);
      Cy = this.cy + Cr * Math.sin(Ca);

      P2x = (-5 * Ax + 18 * Bx - 9 * Cx + 2 * Dx) / 6;
      P2y = (-5 * Ay + 18 * By - 9 * Cy + 2 * Dy) / 6;

      P3x = (2 * Ax - 9 * Bx + 18 * Cx - 5 * Dx) / 6;
      P3y = (2 * Ay - 9 * By + 18 * Cy - 5 * Dy) / 6;
    }

    P1x = Ax;
    P1y = Ay;

    P4x = Dx;
    P4y = Dy;

    res.push(Aa == zeroAngle || newSegment, P1x, P1y, P2x, P2y, P3x, P3y, P4x, P4y);
  }

  return res;
};


/**
 * Gets an array of reference 'y' fields from the row iterator point to
 * and gets pixel values.
 * If there is only one field - a value is returned.
 * If there are several - array.
 * If any of the two is undefined - returns null.
 *
 * @return {?Array.<number>} Array with values or null, any of the two is undefined.
 *    (we do so to avoid reiterating to check on missing).
 * @protected
 */
anychart.core.polar.series.Base.prototype.getValuePointCoords = function() {
  if (!this.enabled())
    return null;

  var yScale = /** @type {anychart.scales.Base} */(this.yScale());
  var xScale = /** @type {anychart.scales.Base} */(this.xScale());
  var iterator = this.getIterator();
  var fail = false;

  var xVal = iterator.get('x');
  var yVal = iterator.get('value');

  if (!goog.isDef(xVal) || !goog.isDef(yVal))
    return null;

  if (yScale.isMissing(yVal))
    yVal = NaN;

  //x coord, y coord, angle, raduis
  var Dx, Dy, Da, Dr;

  var xRatio = xScale.transform(xVal, 0);
  var yRatio = yScale.transform(yVal, .5);

  Da = goog.math.modulo(goog.math.toRadians(this.startAngle_ - 90 + 360 * xRatio), Math.PI * 2);
  Dr = this.radius * yRatio;
  Dx = xScale.isMissing(xVal) ? NaN : this.cx + Dr * Math.cos(Da);
  Dy = this.cy + Dr * Math.sin(Da);

  if (isNaN(Dx) || isNaN(Dy)) fail = true;

  var res = this.approximateCurve(this.prevValuePointCoords, [Dx, Dy, Da, Dr], false);

  if (!fail) {
    if (!this.prevValuePointCoords)
      this.prevValuePointCoords = [];

    this.prevValuePointCoords[0] = Dx;
    this.prevValuePointCoords[1] = Dy;
    this.prevValuePointCoords[2] = Da;
    this.prevValuePointCoords[3] = Dr;
  }

  return fail ? null : res;
};
