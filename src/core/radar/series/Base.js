goog.provide('anychart.core.radar.series.Base');
goog.require('acgraph');
goog.require('anychart.core.SeriesBase');
goog.require('anychart.core.utils.SeriesPointContextProvider');
goog.require('anychart.data');
goog.require('anychart.enums');


/**
 * Namespace anychart.core.radar
 * @namespace
 * @name anychart.core.radar
 */



/**
 * Base class for all radar series.<br/>
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
anychart.core.radar.series.Base = function(opt_data, opt_csvSettings) {
  anychart.core.radar.series.Base.base(this, 'constructor', opt_data, opt_csvSettings);
};
goog.inherits(anychart.core.radar.series.Base, anychart.core.SeriesBase);


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
anychart.core.radar.series.Base.prototype.getValuePointCoords = function() {
  if (!this.enabled()) return null;
  var res = [];
  var yScale = /** @type {anychart.scales.Base} */(this.yScale());
  var xScale = /** @type {anychart.scales.Base} */(this.xScale());
  var iterator = this.getIterator();
  var fail = false;
  var stacked = yScale.stackMode() != anychart.enums.ScaleStackMode.NONE;

  var xVal = iterator.get('x');
  var yVal = iterator.get('value');

  if (!goog.isDef(xVal) || !goog.isDef(yVal)) {
    if (stacked && this.referenceValuesSupportStack)
      fail = true;
    else
      return null;
  }

  if (this.referenceValuesSupportStack)
    yVal = yScale.applyStacking(yVal);
  else if (yScale.isMissing(yVal))
    yVal = NaN;

  var xRatio = xScale.transform(xVal, 0);
  var yRatio = yScale.transform(yVal, .5);
  var angleRad = goog.math.toRadians(this.startAngle_ - 90 + 360 * xRatio);
  var currRadius = this.radius * yRatio;
  var xPix, yPix;

  xPix = xScale.isMissing(xVal) ? NaN : this.cx + currRadius * Math.cos(angleRad);
  yPix = this.cy + currRadius * Math.sin(angleRad);

  if (isNaN(xPix) || isNaN(yPix)) fail = true;
  res.push(xPix, yPix);

  return fail ? null : res;
};


/**
 * @return {?Array.<number>} .
 * @protected
 */
anychart.core.radar.series.Base.prototype.getZeroPointCoords = function() {
  if (!this.enabled()) return null;
  var res = [];
  var yScale = /** @type {anychart.scales.Base} */(this.yScale());
  var xScale = /** @type {anychart.scales.Base} */(this.xScale());
  var iterator = this.getIterator();
  var fail = false;
  var stacked = yScale.stackMode() != anychart.enums.ScaleStackMode.NONE;

  var xVal = iterator.get('x');
  var yVal = iterator.get('value');

  if (!goog.isDef(xVal) || !goog.isDef(yVal)) {
    if (stacked && this.referenceValuesSupportStack)
      fail = true;
    else
      return null;
  }

  var yRatio;
  var xRatio = xScale.transform(xVal, 0);

  if (stacked) {
    if (this.referenceValuesSupportStack) {
      if (isNaN(yVal)) yVal = 1;  //scale hack!
      yVal = yScale.getPrevVal(yVal);
    } else if (yScale.isMissing(yVal))
      yVal = NaN;
    yRatio = goog.math.clamp(yScale.transform(yVal, 0.5), 0, 1);
  } else {
    yRatio = yScale.transform(0);
    if (isNaN(yRatio)) yRatio = 0;
    yRatio = goog.math.clamp(yRatio, 0, 1);
  }

  var angleRad = goog.math.toRadians(this.startAngle_ - 90 + 360 * xRatio);
  var currRadius = this.radius * yRatio;
  var xPix, yPix;

  xPix = xScale.isMissing(xVal) ? NaN : this.cx + currRadius * Math.cos(angleRad);
  yPix = this.cy + currRadius * Math.sin(angleRad);


  if (isNaN(xPix) || isNaN(yPix)) fail = true;
  res.push(xPix, yPix);

  return fail ? null : res;
};
