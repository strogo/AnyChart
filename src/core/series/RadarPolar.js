goog.provide('anychart.core.series.RadarPolar');
goog.require('anychart.core.series.Cartesian');



/**
 * Class that represents a radar/polar series for the user.
 * @param {!anychart.core.IChart} chart
 * @param {!anychart.core.IPlot} plot
 * @param {string} type
 * @param {anychart.core.series.TypeConfig} config
 * @param {boolean} sortedMode
 * @constructor
 * @extends {anychart.core.series.Cartesian}
 */
anychart.core.series.RadarPolar = function(chart, plot, type, config, sortedMode) {
  anychart.core.series.RadarPolar.base(this, 'constructor', chart, plot, type, config, sortedMode);
};
goog.inherits(anychart.core.series.RadarPolar, anychart.core.series.Cartesian);


/**
 * @type {number}
 * @protected
 */
anychart.core.series.RadarPolar.prototype.radius;


/**
 * @type {number}
 * @protected
 */
anychart.core.series.RadarPolar.prototype.cx;


/**
 * @type {number}
 * @protected
 */
anychart.core.series.RadarPolar.prototype.cy;


/**
 * Properties that should be defined in series.RadarPolar prototype.
 * @type {!Object.<string, anychart.core.settings.PropertyDescriptor>}
 */
anychart.core.series.RadarPolar.PROPERTY_DESCRIPTORS = (function() {
  /** @type {!Object.<string, anychart.core.settings.PropertyDescriptor>} */
  var map = {};
  map['startAngle'] = anychart.core.settings.createDescriptor(
      anychart.enums.PropertyHandlerType.SINGLE_ARG,
      'startAngle',
      anychart.core.settings.numberNormalizer,
      anychart.ConsistencyState.SERIES_POINTS,
      anychart.Signal.NEEDS_REDRAW,
      anychart.core.series.Capabilities.ANY);

  return map;
})();
anychart.core.settings.populate(anychart.core.series.RadarPolar, anychart.core.series.RadarPolar.PROPERTY_DESCRIPTORS);


/**
 * Transforms values to pix coords.
 * @param {*} xVal
 * @param {*} yVal
 * @param {number=} opt_xSubRangeRatio
 * @return {Object.<string, number>} Pix values.
 */
anychart.core.series.RadarPolar.prototype.transformXY = function(xVal, yVal, opt_xSubRangeRatio) {
  var xScale = /** @type {anychart.scales.Base} */(this.xScale());
  var yScale = /** @type {anychart.scales.Base} */(this.yScale());

  var xRatio = xScale.transform(xVal, opt_xSubRangeRatio || 0);
  var yRatio = yScale.transform(yVal, .5);
  var angleRad = goog.math.toRadians(goog.math.modulo(this.startAngle_ - 90 + 360 * xRatio, 360));
  var currRadius = this.radius * yRatio;
  var xPix, yPix;

  xPix = xScale.isMissing(xVal) ? NaN : this.cx + currRadius * Math.cos(angleRad);
  yPix = this.cy + currRadius * Math.sin(angleRad);
  return {'x': xPix, 'y': yPix};
};


/** @inheritDoc */
anychart.core.series.RadarPolar.prototype.serialize = function() {
  var json = anychart.core.series.RadarPolar.base(this, 'serialize');
  anychart.core.settings.serialize(this, anychart.core.series.RadarPolar.PROPERTY_DESCRIPTORS, json);
  return json;
};


/** @inheritDoc */
anychart.core.series.RadarPolar.prototype.setupByJSON = function(config, opt_default) {
  anychart.core.settings.deserialize(this, anychart.core.series.RadarPolar.PROPERTY_DESCRIPTORS, config);
  anychart.core.series.RadarPolar.base(this, 'setupByJSON', config, opt_default);
};


//exports
(function() {
  var proto = anychart.core.series.RadarPolar.prototype;
  proto['transformXY'] = proto.transformXY;
})();
