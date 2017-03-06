goog.provide('anychart.charts.Polar');

goog.require('anychart.core.RadarPolarChart');
goog.require('anychart.core.axes.Polar');
goog.require('anychart.core.grids.Polar');
goog.require('anychart.core.series.Cartesian');
goog.require('anychart.enums');



/**
 * Polar chart class.<br/>
 * To get the chart use method {@link anychart.polar}.<br/>
 * Chart can contain any number of series.<br/>
 * Each series is interactive, you can customize click and hover behavior and other params.
 * @extends {anychart.core.RadarPolarChart}
 * @constructor
 */
anychart.charts.Polar = function() {
  anychart.charts.Polar.base(this, 'constructor', false);
};
goog.inherits(anychart.charts.Polar, anychart.core.RadarPolarChart);


//region --- Infrastructure overrides
//------------------------------------------------------------------------------
//
//  Infrastructure overrides
//
//------------------------------------------------------------------------------
/** @inheritDoc */
anychart.charts.Polar.prototype.getType = function() {
  return anychart.enums.ChartTypes.POLAR;
};


/** @inheritDoc */
anychart.charts.Polar.prototype.normalizeSeriesType = function(type) {
  return anychart.enums.normalizeRadarSeriesType(type);
};


/** @inheritDoc */
anychart.charts.Polar.prototype.createGridInstance = function() {
  return new anychart.core.grids.Polar();
};


/** @inheritDoc */
anychart.charts.Polar.prototype.createXAxisInstance = function() {
  return new anychart.core.axes.Polar();
};


/** @inheritDoc */
anychart.charts.Polar.prototype.allowLegendCategoriesMode = function() {
  return false;
};


/** @inheritDoc */
anychart.charts.Polar.prototype.checkXScaleType = function(scale) {
  var res = (scale instanceof anychart.scales.ScatterBase);
  if (!res)
    anychart.core.reporting.error(anychart.enums.ErrorCode.INCORRECT_SCALE_TYPE, undefined, ['Polar chart scales', 'scatter', 'linear, log']);
  return res;
};


/** @inheritDoc */
anychart.charts.Polar.prototype.createScaleByType = function(value, isXScale, returnNullOnError) {
  return anychart.scales.ScatterBase.fromString(value, returnNullOnError);
};


/** @inheritDoc */
anychart.charts.Polar.prototype.createSeriesInstance = function(type, config) {
  return new anychart.core.series.Cartesian(this, this, type, config, false);
};


//endregion
//region --- Exports
//------------------------------------------------------------------------------
//
//  Exports
//
//------------------------------------------------------------------------------
//exports
(function() {
  var proto = anychart.charts.Polar.prototype;
  proto['getType'] = proto.getType;
})();
//endregion
