goog.provide('anychart.core.drawers.radarPolar.Line');



/**
 *
 * @constructor
 * @extends {}
 */
anychart.core.drawers.radarPolar.Line = function() {
  this.radius = Math.min(bounds.width, bounds.height) / 2;
  this.cx = Math.round(bounds.left + bounds.width / 2);
  this.cy = Math.round(bounds.top + bounds.height / 2);
};
