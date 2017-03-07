goog.provide('anychart.core.ChartWithSeries');

goog.require('anychart.core.SeparateChart');
goog.require('anychart.core.reporting');
goog.require('anychart.palettes.DistinctColors');
goog.require('anychart.palettes.HatchFills');
goog.require('anychart.palettes.Markers');
goog.require('anychart.palettes.RangeColors');
goog.require('goog.array');



/**
 * A base class for the chart with series.
 * @constructor
 * @extends {anychart.core.SeparateChart}
 */
anychart.core.ChartWithSeries = function() {
  anychart.core.ChartWithSeries.base(this, 'constructor');

  /**
   * @type {!Array.<anychart.core.series.Cartesian>}
   * @protected
   */
  this.seriesList = [];

  /**
   * Palette for series colors.
   * @type {anychart.palettes.RangeColors|anychart.palettes.DistinctColors}
   * @private
   */
  this.palette_ = null;

  /**
   * @type {anychart.palettes.Markers}
   * @private
   */
  this.markerPalette_ = null;

  /**
   * @type {anychart.palettes.HatchFills}
   * @private
   */
  this.hatchFillPalette_ = null;

  /**
   * Max size for all bubbles on the chart.
   * @type {string|number}
   * @private
   */
  this.maxBubbleSize_;

  /**
   * Min size for all bubbles on the chart.
   * @type {string|number}
   * @private
   */
  this.minBubbleSize_;

  /**
   * Cache of chart data bounds.
   * @type {anychart.math.Rect}
   * @protected
   */
  this.dataBounds = null;
};
goog.inherits(anychart.core.ChartWithSeries, anychart.core.SeparateChart);


//region --- Static props and methods
//----------------------------------------------------------------------------------------------------------------------
//
//  Static props and methods
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Supported consistency states.
 * @type {number}
 */
anychart.core.ChartWithSeries.prototype.SUPPORTED_CONSISTENCY_STATES =
    anychart.core.SeparateChart.prototype.SUPPORTED_CONSISTENCY_STATES |
    anychart.ConsistencyState.SERIES_CHART_PALETTE |
    anychart.ConsistencyState.SERIES_CHART_MARKER_PALETTE |
    anychart.ConsistencyState.SERIES_CHART_HATCH_FILL_PALETTE |
    anychart.ConsistencyState.SERIES_CHART_SERIES;


/**
 * Creates proper public constructor functions.
 * @param {!Function} chartConstructor
 * @param {!Object} configs
 */
anychart.core.ChartWithSeries.generateSeriesConstructors = function(chartConstructor, configs) {
  var proto = chartConstructor.prototype;
  var methodsGenerator = function(name) {
    return function(data, opt_csvSettings) {
      return this.createSeriesByType(
          name,
          data,
          opt_csvSettings);
    };
  };
  for (var i in configs) {
    /**
     * @param {!(anychart.data.View|anychart.data.Set|Array|string)} data Data for the series.
     * @param {Object.<string, (string|boolean)>=} opt_csvSettings If CSV string is passed, you can pass CSV parser settings
     *    here as a hash map.
     * @return {anychart.core.series.Cartesian}
     * @this {anychart.core.ChartWithSeries}
     */
    proto[i] = methodsGenerator(i);
  }
};


/**
 * Series z-index in chart root layer.
 * @type {number}
 */
anychart.core.ChartWithSeries.ZINDEX_SERIES = 30;


/**
 * Line-like series should have bigger zIndex value than other series.
 * @type {number}
 */
anychart.core.ChartWithSeries.ZINDEX_LINE_SERIES = 31;


/**
 * Z-index increment multiplier.
 * @type {number}
 */
anychart.core.ChartWithSeries.ZINDEX_INCREMENT_MULTIPLIER = 0.001;


//endregion
//region --- Series infrastructure methods
//----------------------------------------------------------------------------------------------------------------------
//
//  Series infrastructure methods
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Series config for the chart.
 * @type {!Object.<string, anychart.core.series.TypeConfig>}
 */
anychart.core.ChartWithSeries.prototype.seriesConfig = ({});


/**
 * Getter/setter for series default settings.
 * @param {Object=} opt_value Object with default series settings.
 * @return {Object}
 */
anychart.core.ChartWithSeries.prototype.defaultSeriesSettings = function(opt_value) {
  if (goog.isDef(opt_value)) {
    this.defaultSeriesSettings_ = opt_value;
    return this;
  }
  return this.defaultSeriesSettings_ || {};
};


/**
 * Normalizes series type.
 * @param {*} type
 * @return {string}
 */
anychart.core.ChartWithSeries.prototype.normalizeSeriesType = function(type) {
  return String(type);
};


/**
 * Getter/setter for defaultSeriesType.
 * @param {(string|anychart.enums.CartesianSeriesType|anychart.enums.ScatterSeriesType|anychart.enums.MapSeriesType)=} opt_value Default series type.
 * @return {anychart.core.ChartWithSeries|anychart.enums.CartesianSeriesType|anychart.enums.ScatterSeriesType|anychart.enums.MapSeriesType} Default series type or self for chaining.
 */
anychart.core.ChartWithSeries.prototype.defaultSeriesType = function(opt_value) {
  if (goog.isDef(opt_value)) {
    opt_value = this.normalizeSeriesType(opt_value);
    this.defaultSeriesType_ = opt_value;
    return this;
  }
  return this.defaultSeriesType_;
};


/**
 * Returns normalized series type and a config for this series type.
 * @param {string} type
 * @return {?Array.<string|anychart.core.series.TypeConfig>}
 */
anychart.core.ChartWithSeries.prototype.getConfigByType = function(type) {
  type = this.normalizeSeriesType(type);
  var config = this.seriesConfig[type];
  var res;
  if (config && (config.drawerType in anychart.core.drawers.AvailableDrawers)) {
    res = [type, config];
  } else {
    anychart.core.reporting.error(anychart.enums.ErrorCode.NO_FEATURE_IN_MODULE, null, [type + ' series']);
    res = null;
  }
  return res;
};


/**
 * Actual series constructor.
 * @param {string} type
 * @param {anychart.core.series.TypeConfig} config
 * @return {!anychart.core.series.Cartesian}
 */
anychart.core.ChartWithSeries.prototype.createSeriesInstance = goog.abstractMethod;


/**
 * Returns base series z-index.
 * @param {anychart.core.series.Cartesian|anychart.core.series.Map} series .
 * @return {number}
 */
anychart.core.ChartWithSeries.prototype.getBaseSeriesZIndex = function(series) {
  return series.isLineBased() ?
      anychart.core.ChartWithSeries.ZINDEX_LINE_SERIES :
      anychart.core.ChartWithSeries.ZINDEX_SERIES;
};


/**
 * Setup series.
 * @param {!(anychart.core.series.Cartesian|anychart.core.series.Map)} series .
 */
anychart.core.ChartWithSeries.prototype.setupSeries = function(series) {
  var lastSeries = this.seriesList[this.seriesList.length - 1];
  var index = lastSeries ? /** @type {number} */(lastSeries.autoIndex()) + 1 : 0;
  this.seriesList.push(series);
  var inc = index * anychart.core.ChartWithSeries.ZINDEX_INCREMENT_MULTIPLIER;
  var seriesZIndex = this.getBaseSeriesZIndex(series) + inc;

  series.autoIndex(index);
  series.setAutoZIndex(seriesZIndex);
  series.setAutoColor(this.palette().itemAt(index));
  series.setAutoMarkerType(/** @type {anychart.enums.MarkerType} */(this.markerPalette().itemAt(index)));
  series.setAutoHatchFill(/** @type {acgraph.vector.HatchFill|acgraph.vector.PatternFill} */(this.hatchFillPalette().itemAt(index)));
  series.setParentEventTarget(this);
  series.listenSignals(this.seriesInvalidated, this);
};


/**
 * @param {string} type Series type.
 * @param {?(anychart.data.View|anychart.data.Set|Array|string)} data Data for the series.
 * @param {Object.<string, (string|boolean)>=} opt_csvSettings If CSV string is passed, you can pass CSV parser settings
 *    here as a hash map.
 * @protected
 * @return {anychart.core.series.Cartesian}
 */
anychart.core.ChartWithSeries.prototype.createSeriesByType = function(type, data, opt_csvSettings) {
  var configAndType = this.getConfigByType(type);
  if (configAndType) {
    type = /** @type {string} */(configAndType[0]);
    var config = /** @type {anychart.core.series.TypeConfig} */(configAndType[1]);
    var series = this.createSeriesInstance(type, config);
    series.data(data, opt_csvSettings);

    this.setupSeries(series);

    this.invalidate(
        // When you add 3D series, bounds may change (eg. afterDraw case).
        (series.check(anychart.core.drawers.Capabilities.IS_3D_BASED) ? anychart.ConsistencyState.BOUNDS : 0) |
        anychart.ConsistencyState.SERIES_CHART_SERIES |
        anychart.ConsistencyState.CHART_LEGEND |
        anychart.ConsistencyState.SCALE_CHART_SCALES |
        anychart.ConsistencyState.SCALE_CHART_Y_SCALES |
        anychart.ConsistencyState.SCALE_CHART_SCALE_MAPS,
        anychart.Signal.NEEDS_REDRAW);
  } else {
    series = null;
  }

  return series;
};


/**
 * Add series to chart.
 * @param {...(anychart.data.View|anychart.data.Set|Array)} var_args Chart series data.
 * @return {Array.<anychart.core.series.Cartesian>} Array of created series.
 */
anychart.core.ChartWithSeries.prototype.addSeries = function(var_args) {
  var rv = [];
  var type = /** @type {string} */ (this.defaultSeriesType());
  var count = arguments.length;
  this.suspendSignalsDispatching();
  if (!count)
    rv.push(this.createSeriesByType(type, null));
  else {
    for (var i = 0; i < count; i++) {
      rv.push(this.createSeriesByType(type, arguments[i]));
    }
  }
  this.resumeSignalsDispatching(true);
  return rv;
};


/**
 * Find series index by its id.
 * @param {number|string} id Series id.
 * @return {number} Series index or -1 if didn't find.
 */
anychart.core.ChartWithSeries.prototype.getSeriesIndexBySeriesId = function(id) {
  return goog.array.findIndex(this.seriesList, function(item) {
    return item.id() == id;
  });
};


/**
 * Gets series by its id.
 * @param {number|string} id Id of the series.
 * @return {anychart.core.series.Cartesian} Series instance.
 */
anychart.core.ChartWithSeries.prototype.getSeries = function(id) {
  return this.getSeriesAt(this.getSeriesIndexBySeriesId(id));
};


/**
 * Gets series by its index.
 * @param {number} index Index of the series.
 * @return {?anychart.core.series.Cartesian} Series instance.
 */
anychart.core.ChartWithSeries.prototype.getSeriesAt = function(index) {
  return this.seriesList[index] || null;
};


/**
 * Returns series count.
 * @return {number} Number of series.
 */
anychart.core.ChartWithSeries.prototype.getSeriesCount = function() {
  return this.seriesList.length;
};


/**
 * Removes one of series from chart by its id.
 * @param {number|string} id Series id.
 * @return {anychart.core.ChartWithSeries}
 */
anychart.core.ChartWithSeries.prototype.removeSeries = function(id) {
  return this.removeSeriesAt(this.getSeriesIndexBySeriesId(id));
};


/**
 * Removes one of series from chart by its index.
 * @param {number} index Series index.
 * @return {anychart.core.ChartWithSeries}
 */
anychart.core.ChartWithSeries.prototype.removeSeriesAt = function(index) {
  var series = this.seriesList[index];
  if (series) {
    anychart.globalLock.lock();
    this.suspendSignalsDispatching();
    goog.array.splice(this.seriesList, index, 1);
    goog.dispose(series);
    this.invalidate(
        anychart.ConsistencyState.APPEARANCE |
        anychart.ConsistencyState.SERIES_CHART_SERIES |
        anychart.ConsistencyState.CHART_LEGEND |
        anychart.ConsistencyState.SCALE_CHART_SCALES |
        anychart.ConsistencyState.SCALE_CHART_Y_SCALES |
        anychart.ConsistencyState.SCALE_CHART_SCALE_MAPS,
        anychart.Signal.NEEDS_REDRAW);
    this.resumeSignalsDispatching(true);
    anychart.globalLock.unlock();
  }
  return this;
};


/**
 * Removes all series from chart.
 * @return {anychart.core.ChartWithSeries} Self for method chaining.
 */
anychart.core.ChartWithSeries.prototype.removeAllSeries = function() {
  if (this.seriesList.length) {
    anychart.globalLock.lock();
    this.suspendSignalsDispatching();
    var series = this.seriesList;
    this.seriesList = [];
    goog.disposeAll(series);
    this.invalidate(
        anychart.ConsistencyState.APPEARANCE |
        anychart.ConsistencyState.SERIES_CHART_SERIES |
        anychart.ConsistencyState.CHART_LEGEND |
        anychart.ConsistencyState.SCALE_CHART_SCALES |
        anychart.ConsistencyState.SCALE_CHART_Y_SCALES |
        anychart.ConsistencyState.SCALE_CHART_SCALE_MAPS,
        anychart.Signal.NEEDS_REDRAW);
    this.resumeSignalsDispatching(true);
    anychart.globalLock.unlock();
  }
  return this;
};


/**
 * Series signals handler.
 * @param {anychart.SignalEvent} event Event object.
 * @protected
 */
anychart.core.ChartWithSeries.prototype.seriesInvalidated = function(event) {
  var state = 0;
  if (event.hasSignal(anychart.Signal.NEEDS_REDRAW)) {
    state = anychart.ConsistencyState.SERIES_CHART_SERIES;
  }
  if (event.hasSignal(anychart.Signal.NEEDS_UPDATE_A11Y)) {
    state = anychart.ConsistencyState.A11Y;
  }
  if (event.hasSignal(anychart.Signal.DATA_CHANGED)) {
    if (this.legend().itemsSourceMode() == anychart.enums.LegendItemsSourceMode.CATEGORIES) {
      state |= anychart.ConsistencyState.CHART_LEGEND;
    }
    this.annotations().invalidateAnnotations();
  }
  if (event.hasSignal(anychart.Signal.NEEDS_RECALCULATION)) {
    state |= anychart.ConsistencyState.SCALE_CHART_SCALES |
        anychart.ConsistencyState.SCALE_CHART_Y_SCALES |
        anychart.ConsistencyState.SCALE_CHART_SCALE_MAPS;
  }
  if (event.hasSignal(anychart.Signal.NEED_UPDATE_LEGEND)) {
    state |= anychart.ConsistencyState.CHART_LEGEND;
    if (event.hasSignal(anychart.Signal.BOUNDS_CHANGED))
      state |= anychart.ConsistencyState.BOUNDS;
  }
  this.invalidate(state, anychart.Signal.NEEDS_REDRAW);
};


/**
 * @inheritDoc
 */
anychart.core.ChartWithSeries.prototype.getAllSeries = function() {
  return this.seriesList;
};


/**
 * Invalidates APPEARANCE for all width-based series.
 * @protected
 */
anychart.core.ChartWithSeries.prototype.invalidateWidthBasedSeries = function() {
  for (var i = this.seriesList.length; i--;) {
    if (this.seriesList[i].isWidthBased())
      this.seriesList[i].invalidate(anychart.ConsistencyState.SERIES_POINTS);
  }
};


/**
 * Invalidates APPEARANCE for all size-based series.
 * @protected
 */
anychart.core.ChartWithSeries.prototype.invalidateSizeBasedSeries = function() {
  for (var i = this.seriesList.length; i--;) {
    if (this.seriesList[i].isSizeBased())
      this.seriesList[i].invalidate(anychart.ConsistencyState.SERIES_POINTS | anychart.ConsistencyState.BOUNDS);
  }
};


/**
 * Returns if the chart is vertical.
 * @return {boolean}
 */
anychart.core.ChartWithSeries.prototype.isVertical = function() {
  return this.barChartMode;
};


//endregion
//region --- Series specific settings
//----------------------------------------------------------------------------------------------------------------------
//
//  Series specific settings
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Sets max size for all bubbles on the charts.
 * @param {(number|string)=} opt_value
 * @return {number|string|anychart.core.ChartWithSeries}
 */
anychart.core.ChartWithSeries.prototype.maxBubbleSize = function(opt_value) {
  if (goog.isDef(opt_value)) {
    if (this.maxBubbleSize_ != opt_value) {
      this.maxBubbleSize_ = opt_value;
      this.invalidateSizeBasedSeries();
      this.invalidate(anychart.ConsistencyState.SERIES_CHART_SERIES, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.maxBubbleSize_;
};


/**
 * Sets min size for all bubbles on the charts.
 * @param {(number|string)=} opt_value
 * @return {number|string|anychart.core.ChartWithSeries}
 */
anychart.core.ChartWithSeries.prototype.minBubbleSize = function(opt_value) {
  if (goog.isDef(opt_value)) {
    if (this.minBubbleSize_ != opt_value) {
      this.minBubbleSize_ = opt_value;
      this.invalidateSizeBasedSeries();
      this.invalidate(anychart.ConsistencyState.SERIES_CHART_SERIES, anychart.Signal.NEEDS_REDRAW);
    }
    return this;
  }
  return this.minBubbleSize_;
};


//endregion
//region --- Palettes
//----------------------------------------------------------------------------------------------------------------------
//
//  Palettes
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Getter/setter for palette.
 * @param {(anychart.palettes.RangeColors|anychart.palettes.DistinctColors|Object|Array.<string>)=} opt_value .
 * @return {!(anychart.palettes.RangeColors|anychart.palettes.DistinctColors|anychart.core.ChartWithSeries)} .
 */
anychart.core.ChartWithSeries.prototype.palette = function(opt_value) {
  if (opt_value instanceof anychart.palettes.RangeColors) {
    this.setupPalette_(anychart.palettes.RangeColors, opt_value);
    return this;
  } else if (opt_value instanceof anychart.palettes.DistinctColors) {
    this.setupPalette_(anychart.palettes.DistinctColors, opt_value);
    return this;
  } else if (goog.isObject(opt_value) && opt_value['type'] == 'range') {
    this.setupPalette_(anychart.palettes.RangeColors);
  } else if (goog.isObject(opt_value) || this.palette_ == null)
    this.setupPalette_(anychart.palettes.DistinctColors);

  if (goog.isDef(opt_value)) {
    this.palette_.setup(opt_value);
    return this;
  }
  return /** @type {!(anychart.palettes.RangeColors|anychart.palettes.DistinctColors)} */(this.palette_);
};


/**
 * Chart markers palette settings.
 * @param {(anychart.palettes.Markers|Object|Array.<anychart.enums.MarkerType>)=} opt_value Chart marker palette settings to set.
 * @return {!(anychart.palettes.Markers|anychart.core.ChartWithSeries)} Return current chart markers palette or itself for chaining call.
 */
anychart.core.ChartWithSeries.prototype.markerPalette = function(opt_value) {
  if (!this.markerPalette_) {
    this.markerPalette_ = new anychart.palettes.Markers();
    this.markerPalette_.listenSignals(this.markerPaletteInvalidated_, this);
    this.registerDisposable(this.markerPalette_);
  }

  if (goog.isDef(opt_value)) {
    this.markerPalette_.setup(opt_value);
    return this;
  } else {
    return this.markerPalette_;
  }
};


/**
 * Chart hatch fill palette settings.
 * @param {(Array.<acgraph.vector.HatchFill.HatchFillType>|Object|anychart.palettes.HatchFills)=} opt_value Chart
 * hatch fill palette settings to set.
 * @return {!(anychart.palettes.HatchFills|anychart.core.ChartWithSeries)} Return current chart hatch fill palette or itself
 * for chaining call.
 */
anychart.core.ChartWithSeries.prototype.hatchFillPalette = function(opt_value) {
  if (!this.hatchFillPalette_) {
    this.hatchFillPalette_ = new anychart.palettes.HatchFills();
    this.hatchFillPalette_.listenSignals(this.hatchFillPaletteInvalidated_, this);
    this.registerDisposable(this.hatchFillPalette_);
  }

  if (goog.isDef(opt_value)) {
    this.hatchFillPalette_.setup(opt_value);
    return this;
  } else {
    return this.hatchFillPalette_;
  }
};


/**
 * @param {Function} cls Palette constructor.
 * @param {(anychart.palettes.RangeColors|anychart.palettes.DistinctColors)=} opt_cloneFrom Settings to clone from.
 * @private
 */
anychart.core.ChartWithSeries.prototype.setupPalette_ = function(cls, opt_cloneFrom) {
  if (this.palette_ instanceof cls) {
    if (opt_cloneFrom)
      this.palette_.setup(opt_cloneFrom);
  } else {
    // we dispatch only if we replace existing palette.
    var doDispatch = !!this.palette_;
    goog.dispose(this.palette_);
    this.palette_ = new cls();
    if (opt_cloneFrom)
      this.palette_.setup(opt_cloneFrom);
    this.palette_.listenSignals(this.paletteInvalidated_, this);
    this.registerDisposable(this.palette_);
    if (doDispatch)
      this.invalidate(anychart.ConsistencyState.SERIES_CHART_PALETTE | anychart.ConsistencyState.CHART_LEGEND, anychart.Signal.NEEDS_REDRAW);
  }
};


/**
 * Internal palette invalidation handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.core.ChartWithSeries.prototype.paletteInvalidated_ = function(event) {
  if (event.hasSignal(anychart.Signal.NEEDS_REAPPLICATION)) {
    this.invalidate(anychart.ConsistencyState.SERIES_CHART_PALETTE | anychart.ConsistencyState.CHART_LEGEND, anychart.Signal.NEEDS_REDRAW);
  }
};


/**
 * Internal marker palette invalidation handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.core.ChartWithSeries.prototype.markerPaletteInvalidated_ = function(event) {
  if (event.hasSignal(anychart.Signal.NEEDS_REAPPLICATION)) {
    this.invalidate(anychart.ConsistencyState.SERIES_CHART_MARKER_PALETTE | anychart.ConsistencyState.CHART_LEGEND, anychart.Signal.NEEDS_REDRAW);
  }
};


/**
 * Internal marker palette invalidation handler.
 * @param {anychart.SignalEvent} event Event object.
 * @private
 */
anychart.core.ChartWithSeries.prototype.hatchFillPaletteInvalidated_ = function(event) {
  if (event.hasSignal(anychart.Signal.NEEDS_REAPPLICATION)) {
    this.invalidate(anychart.ConsistencyState.SERIES_CHART_HATCH_FILL_PALETTE | anychart.ConsistencyState.CHART_LEGEND, anychart.Signal.NEEDS_REDRAW);
  }
};


//endregion
//region --- Calculations
//----------------------------------------------------------------------------------------------------------------------
//
//  Calculations
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * Calculates bubble sizes for series.
 * @protected
 */
anychart.core.ChartWithSeries.prototype.calcBubbleSizes = function() {
  var i;
  var minMax = [Number.MAX_VALUE, -Number.MAX_VALUE];
  for (i = this.seriesList.length; i--;) {
    if (this.seriesList[i].isSizeBased())
      this.seriesList[i].calculateSizeScale(minMax);
  }
  for (i = this.seriesList.length; i--;) {
    if (this.seriesList[i].isSizeBased()) {
      this.seriesList[i].setAutoSizeScale(minMax[0], minMax[1], this.minBubbleSize_, this.maxBubbleSize_);
    }
  }
};


//endregion
//region --- Data
//----------------------------------------------------------------------------------------------------------------------
//
//  Data
//
//----------------------------------------------------------------------------------------------------------------------
/** @type {Object.<string, Array.<string>>} */
anychart.core.ChartWithSeries.seriesReferenceValues = {
  'bar': ['value'],
  'line': ['value'],
  'area': ['value'],
  'column': ['value'],
  'spline': ['value'],
  'marker': ['value'],
  'stepArea': ['value'],
  'stepLine:': ['value'],
  'splineArea': ['value'],
  'jumpLine': ['value'],
  'stick': ['value'],
  'bubble': ['value', 'size'],
  'rangeBar': ['high', 'low'],
  'rangeArea': ['high', 'low'],
  'rangeColumn': ['high', 'low'],
  'rangeStepArea': ['high', 'low'],
  'rangeSplineArea': ['high', 'low'],
  'ohlc': ['open', 'high', 'low', 'close'],
  'candlestick': ['open', 'high', 'low', 'close'],
  'box': ['lowest', 'q1', 'median', 'q3', 'highest'],
  'connector': ['points'],
  'choropleth': ['id', 'value'],
  'markerMap': ['id', 'long', 'lat'],
  'bubbleMap': ['id', 'long', 'lat', 'size']
};


/**
 * @param {(anychart.data.Set|anychart.data.TableData|Array)=} opt_value
 * @return {anychart.data.View|anychart.core.ChartWithSeries}
 */
anychart.core.ChartWithSeries.prototype.data = function(opt_value) {
  if (goog.isDef(opt_value)) {

    // handle HTML table data
    var seriesNames = null;
    if (opt_value) {
      if (opt_value['caption']) this.title(opt_value['caption']);
      if (opt_value['header'] && opt_value['header'].length) seriesNames = opt_value['header'];
      if (opt_value['rows']) this.rawData_ = opt_value['rows'];
      else this.rawData_ = opt_value;
    } else this.rawData_ = opt_value;

    /** @type {anychart.data.Set} */
    var dataSet = opt_value instanceof anychart.data.Set ?
        opt_value :
        anychart.data.set(this.rawData_);

    // define cols count
    var firstRow = dataSet.row(0);
    var colsCount = 1;
    var keys = null;

    if (goog.isArray(firstRow)) {
      colsCount = firstRow.length;
    } else if (goog.isObject(firstRow)) {
      keys = goog.object.getKeys(firstRow);
      colsCount = keys.length;
    }

    var seriesCount = this.getSeriesCount();
    var usedColsCount = 1; // we assume that first col is always X
    var seriesIndex = 0;
    var series, names, allocCount, mapping;

    this.suspendSignalsDispatching();

    for (var i = 0; i < seriesCount; i++) {
      series = this.getSeriesAt(seriesIndex);
      names = series.getYValueNames();
      allocCount = usedColsCount + names.length;

      if (allocCount <= colsCount) {
        mapping = anychart.data.buildMapping(dataSet, usedColsCount, allocCount, names, keys);
        series.data(mapping);
        if (seriesNames) series.name(seriesNames[seriesIndex + 1]);
        usedColsCount = allocCount;
      } else {
        var seriesId = /** @type {string} */(series.id());
        this.removeSeries(seriesId);
        seriesIndex--;
      }
      seriesIndex++;
    }

    var type = /** @type {string} */(this.defaultSeriesType());
    names = anychart.core.ChartWithSeries.seriesReferenceValues[type];

    do {
      allocCount = usedColsCount + names.length;

      if (allocCount <= colsCount) {
        mapping = anychart.data.buildMapping(dataSet, usedColsCount, allocCount, names, keys);
        series = this.addSeries(mapping)[0];
        if (seriesNames) series.name(seriesNames[seriesIndex + 1]);
        seriesIndex++;
        usedColsCount = allocCount;
      } else {
        break;
      }
    } while (usedColsCount <= colsCount);

    this.resumeSignalsDispatching(true);
    return this;
  } else {
    return this.rawData_;
  }
};


//endregion
//region --- Drawing
//----------------------------------------------------------------------------------------------------------------------
//
//  Drawing
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * @inheritDoc
 */
anychart.core.ChartWithSeries.prototype.beforeDraw = function() {
  if (this.isConsistent())
    return;

  if (this.hasInvalidationState(anychart.ConsistencyState.SERIES_CHART_PALETTE |
          anychart.ConsistencyState.SERIES_CHART_MARKER_PALETTE |
          anychart.ConsistencyState.SERIES_CHART_HATCH_FILL_PALETTE)) {
    anychart.core.Base.suspendSignalsDispatching(this.seriesList);

    var state = 0;
    if (this.hasInvalidationState(anychart.ConsistencyState.SERIES_CHART_PALETTE | anychart.ConsistencyState.SERIES_CHART_HATCH_FILL_PALETTE)) {
      state |= anychart.ConsistencyState.SERIES_COLOR;
    }
    if (this.hasInvalidationState(anychart.ConsistencyState.SERIES_CHART_MARKER_PALETTE)) {
      state |= anychart.ConsistencyState.SERIES_MARKERS;
    }

    for (var i = this.seriesList.length; i--;) {
      var series = this.seriesList[i];
      var index = /** @type {number} */(series.autoIndex());
      series.setAutoColor(this.palette().itemAt(index));
      series.setAutoMarkerType(/** @type {anychart.enums.MarkerType} */(this.markerPalette().itemAt(index)));
      series.setAutoHatchFill(/** @type {acgraph.vector.HatchFill|acgraph.vector.PatternFill} */(this.hatchFillPalette().itemAt(index)));
      series.invalidate(state);
    }
    this.invalidate(anychart.ConsistencyState.SERIES_CHART_SERIES);
    this.markConsistent(anychart.ConsistencyState.SERIES_CHART_PALETTE |
        anychart.ConsistencyState.SERIES_CHART_MARKER_PALETTE |
        anychart.ConsistencyState.SERIES_CHART_HATCH_FILL_PALETTE);
    anychart.core.Base.resumeSignalsDispatchingFalse(this.seriesList);
  }
};


/**
 * Draws series.
 * @param {number=} opt_topAxisPadding
 * @param {number=} opt_rightAxisPadding
 * @param {number=} opt_bottomAxisPadding
 * @param {number=} opt_leftAxisPadding
 */
anychart.core.ChartWithSeries.prototype.drawSeries = function(opt_topAxisPadding, opt_rightAxisPadding, opt_bottomAxisPadding, opt_leftAxisPadding) {
  anychart.performance.start('Series drawing');
  var i, count;
  if (this.hasInvalidationState(anychart.ConsistencyState.SERIES_CHART_SERIES)) {
    anychart.core.Base.suspendSignalsDispatching(this.seriesList);
    for (i = 0, count = this.seriesList.length; i < count; i++) {
      var series = this.seriesList[i];
      series.container(this.rootElement);
      series.axesLinesSpace(
          opt_topAxisPadding || 0,
          opt_rightAxisPadding || 0,
          opt_bottomAxisPadding || 0,
          opt_leftAxisPadding || 0);
      series.parentBounds(this.dataBounds);
    }

    this.prepare3d();
    this.distributeSeries();
    this.calcBubbleSizes();
    for (i = 0; i < this.seriesList.length; i++) {
      this.seriesList[i].draw();
    }

    this.markConsistent(anychart.ConsistencyState.SERIES_CHART_SERIES);
    anychart.core.Base.resumeSignalsDispatchingFalse(this.seriesList);
  }
  anychart.performance.end('Series drawing');
};


//endregion
//region --- Legend
//----------------------------------------------------------------------------------------------------------------------
//
//  Legend
//
//----------------------------------------------------------------------------------------------------------------------
/** @inheritDoc */
anychart.core.ChartWithSeries.prototype.createLegendItemsProvider = function(sourceMode, itemsTextFormatter) {
  var i, count;
  /**
   * @type {!Array.<anychart.core.ui.Legend.LegendItemProvider>}
   */
  var data = [];
  // we need to calculate statistics
  this.calculate();
  if (this.allowLegendCategoriesMode() &&
      sourceMode == anychart.enums.LegendItemsSourceMode.CATEGORIES &&
      (this.xScale() instanceof anychart.scales.Ordinal)) {
    var names = this.xScale().names();

    if (goog.isFunction(itemsTextFormatter)) {
      var values = this.xScale().values();
      var itemText;
      var format;
      for (i = 0, count = values.length; i < count; i++) {
        format = {
          'value': values[i],
          'name': names[i]
        };
        itemText = itemsTextFormatter.call(format, format);
        if (!goog.isString(itemText))
          itemText = String(names[i]);
        data.push({
          'text': itemText,
          'iconEnabled': false,
          'sourceUid': goog.getUid(this),
          'sourceKey': i
        });
      }
    } else {
      for (i = 0, count = names.length; i < count; i++) {
        data.push({
          'text': String(names[i]),
          'iconEnabled': false,
          'sourceUid': goog.getUid(this),
          'sourceKey': i
        });
      }
    }
  } else {
    for (i = 0, count = this.seriesList.length; i < count; i++) {
      /** @type {anychart.core.series.Cartesian} */
      var series = this.seriesList[i];
      var itemData = series.getLegendItemData(itemsTextFormatter);
      itemData['sourceUid'] = goog.getUid(this);
      itemData['sourceKey'] = series.id();
      data.push(itemData);
    }
  }
  return data;
};


//endregion
//region --- Serialization / Deserialization / Disposing
//----------------------------------------------------------------------------------------------------------------------
//
//  Serialization / Deserialization / Disposing
//
//----------------------------------------------------------------------------------------------------------------------
/**
 * @inheritDoc
 */
anychart.core.ChartWithSeries.prototype.setupByJSON = function(config, opt_default) {
  anychart.core.ChartWithSeries.base(this, 'setupByJSON', config, opt_default);

  this.defaultSeriesType(config['defaultSeriesType']);
  this.minBubbleSize(config['minBubbleSize']);
  this.maxBubbleSize(config['maxBubbleSize']);
  this.palette(config['palette']);
  this.markerPalette(config['markerPalette']);
  this.hatchFillPalette(config['hatchFillPalette']);
  this.defaultSeriesSettings(config['defaultSeriesSettings']);
};


/**
 * @inheritDoc
 */
anychart.core.ChartWithSeries.prototype.serialize = function() {
  var json = anychart.core.ChartWithSeries.base(this, 'serialize');

  json['defaultSeriesType'] = this.defaultSeriesType();
  json['minBubbleSize'] = this.minBubbleSize();
  json['maxBubbleSize'] = this.maxBubbleSize();
  json['palette'] = this.palette().serialize();
  json['markerPalette'] = this.markerPalette().serialize();
  json['hatchFillPalette'] = this.hatchFillPalette().serialize();

  return json;
};


/** @inheritDoc */
anychart.core.ChartWithSeries.prototype.disposeInternal = function() {
  this.suspendSignalsDispatching();
  this.removeAllSeries();
  this.resumeSignalsDispatching(false);

  goog.dispose(this.hatchFillPalette_);
  this.hatchFillPalette_ = null;

  anychart.core.ChartWithSeries.base(this, 'disposeInternal');
};


//endregion


