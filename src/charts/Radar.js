goog.provide('anychart.charts.Radar');

goog.require('anychart.core.RadarPolarChart');
goog.require('anychart.enums');


/**
 * Radar chart class.<br/>
 * To get the chart use method {@link anychart.radar}.<br/>
 * Chart can contain any number of series.<br/>
 * Each series is interactive, you can customize click and hover behavior and other params.
 * @extends {anychart.core.RadarPolarChart}
 * @constructor
 */
anychart.charts.Radar = function() {
  anychart.charts.Radar.base(this, 'constructor', true);
};
goog.inherits(anychart.charts.Radar, anychart.core.RadarPolarChart);


//region --- Infrastructure overrides
//------------------------------------------------------------------------------
//
//  Infrastructure overrides
//
//------------------------------------------------------------------------------
/** @inheritDoc */
anychart.charts.Radar.prototype.getType = function() {
  return anychart.enums.ChartTypes.RADAR;
};


/** @inheritDoc */
anychart.charts.Radar.prototype.normalizeSeriesType = function(type) {
  return anychart.enums.normalizeRadarSeriesType(type);
};


/** @inheritDoc */
anychart.charts.Radar.prototype.createGridInstance = function() {
  return new anychart.core.grids.Radar();
};


/** @inheritDoc */
anychart.charts.Radar.prototype.createXAxisInstance = function() {
  return new anychart.core.axes.Radar();
};


/** @inheritDoc */
anychart.charts.Radar.prototype.checkXScaleType = function(scale) {
  var res = (scale instanceof anychart.scales.Ordinal);
  if (!res)
    anychart.core.reporting.error(anychart.enums.ErrorCode.INCORRECT_SCALE_TYPE, undefined, ['Radar chart X scale', 'ordinal']);
  return res;
};


/** @inheritDoc */
anychart.charts.Radar.prototype.checkYScaleType = function(scale) {
  return scale instanceof anychart.scales.Base;
};


/** @inheritDoc */
anychart.charts.Radar.prototype.createScaleByType = function(value, isXScale, returnNullOnError) {
  if (isXScale) {
    value = String(value).toLowerCase();
    return (returnNullOnError && value != 'ordinal' && value != 'ord' && value != 'discrete') ?
        null :
        anychart.scales.ordinal();
  }
  return anychart.scales.Base.fromString(value, false);
};


/** @inheritDoc */
anychart.charts.Radar.prototype.createSeriesInstance = function(type, config) {
  return new anychart.core.series.Cartesian(this, this, type, config, true);
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
  var proto = anychart.charts.Radar.prototype;
  proto['getType'] = proto.getType;
})();
//endregion
