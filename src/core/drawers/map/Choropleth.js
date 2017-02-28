goog.provide('anychart.core.drawers.map.Choropleth');
goog.require('anychart.core.drawers');
goog.require('anychart.core.drawers.Base');
goog.require('anychart.enums');



/**
 * Choropleth drawer.
 * @param {anychart.core.series.Base} series
 * @constructor
 * @extends {anychart.core.drawers.Choropleth}
 */
anychart.core.drawers.map.Choropleth = function(series) {
  anychart.core.drawers.map.Choropleth.base(this, 'constructor', series);
};
goog.inherits(anychart.core.drawers.map.Choropleth, anychart.core.drawers.Base);
anychart.core.drawers.AvailableDrawers[anychart.enums.SeriesDrawerTypes.CHOROPLETH] = anychart.core.drawers.map.Choropleth;


/** @inheritDoc */
anychart.core.drawers.map.Choropleth.prototype.type = anychart.enums.SeriesDrawerTypes.CHOROPLETH;


/** @inheritDoc */
anychart.core.drawers.map.Choropleth.prototype.flags = (
    // anychart.core.drawers.Capabilities.NEEDS_ZERO |
    // anychart.core.drawers.Capabilities.NEEDS_SIZE_SCALE |
    anychart.core.drawers.Capabilities.USES_CONTAINER_AS_ROOT |
    // anychart.core.drawers.Capabilities.USES_STROKE_AS_FILL |
    anychart.core.drawers.Capabilities.SUPPORTS_CONNECTING_MISSING |
    // anychart.core.drawers.Capabilities.SUPPORTS_STACK |
    // anychart.core.drawers.Capabilities.SUPPORTS_COMPARISON |
    // anychart.core.drawers.Capabilities.SUPPORTS_ERROR |
    // anychart.core.drawers.Capabilities.SUPPORTS_OUTLIERS |
    // anychart.core.drawers.Capabilities.SUPPORTS_OUTLIERS |
    anychart.core.drawers.Capabilities.IS_DISCRETE_BASED |
    // anychart.core.drawers.Capabilities.IS_WIDTH_BASED |
    // anychart.core.drawers.Capabilities.IS_3D_BASED |
    // anychart.core.drawers.Capabilities.IS_VERTICAL |
    // anychart.core.drawers.Capabilities.IS_MARKER_BASED |
    // anychart.core.drawers.Capabilities.IS_OHLC_BASED |
    // anychart.core.drawers.Capabilities.IS_LINE_BASED |
    // anychart.core.drawers.Capabilities.IS_RANGE_BASED |
    // anychart.core.drawers.Capabilities.SUPPORTS_STEP_DIRECTION |
    // anychart.core.drawers.Capabilities.SUPPORTS_DISTRIBUTION |
    0);


/**
 * Y values list that are required by this drawer.
 * @type {Array.<string>}
 */
anychart.core.drawers.map.Choropleth.prototype.yValueNames = (['id', 'value']);


/** @inheritDoc */
anychart.core.drawers.map.Choropleth.prototype.requiredShapes = (function() {
  var res = {};
  res['foreignFill'] = anychart.enums.ShapeType.NONE;
  res['hatchFill'] = anychart.enums.ShapeType.PATH;
  return res;
})();


/** @inheritDoc */
anychart.core.drawers.map.Choropleth.prototype.drawSubsequentPoint = function(point, state) {
  var features = point.meta('features');
  if (!features)
    return;

  for (var i = 0, len = features.length; i < len; i++) {
    var feature = features[i];
    if (goog.isDef(feature.domElement)) {
      this.series.getChart().featureTraverser(feature, function(shape) {
        var element = shape.domElement;
        if (!element)
          return;

        element.visible(true);
        var shapes = this.shapesManager.getShapesGroup(state, undefined, undefined, element);

        var hatchFillElement = /** @type {!acgraph.vector.Path} */(shapes['hatchFill']);
        hatchFillElement.deserialize(element.serializePathArgs());
        // var tx = this.series.getChart().getMapLayer().getFullTransformation();
        // hatchFillElement.setTransformationMatrix(tx.getScaleX(), tx.getShearX(), tx.getShearY(), tx.getScaleY(), tx.getTranslateX(), tx.getTranslateY());
      }, this);
    }
  }
};
