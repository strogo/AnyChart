goog.provide('anychart.data.ConcatView');

goog.require('anychart.data.View');
goog.require('goog.array');



/**
 * Composition view, that concatenates two different views.
 * @param {!anychart.data.IView} parentView Parent view. The last view is a mapping.
 * @param {!anychart.data.IView} secondView Other parent view to concat with. The last view is a mapping.
 * @constructor
 * @name anychart.data.ConcatView
 * @extends {anychart.data.View}
 */
anychart.data.ConcatView = function(parentView, secondView) {
  goog.base(this, parentView);

  /**
   * The second parent view to ask for data from.
   * @type {!anychart.data.IView}
   * @private
   */
  this.secondView_ = secondView;

  secondView.listen(anychart.utils.Invalidatable.INVALIDATED, this.parentViewChangedHandler, false, this);
};
goog.inherits(anychart.data.ConcatView, anychart.data.View);


/**
 * ConcatView doesn't support DATA dirty state.
 * @type {number}
 */
anychart.data.ConcatView.prototype.SUPPORTED_CONSISTENCY_STATES = 0;


/** @inheritDoc */
anychart.data.ConcatView.prototype.getRowMapping = function(rowIndex) {
  var count = this.parentView.getRowsCount();
  if (rowIndex < count)
    return this.parentView.getRowMapping(rowIndex);
  return this.secondView_.getRowMapping(rowIndex - count);
};


/** @inheritDoc */
anychart.data.ConcatView.prototype.row = function(rowIndex, opt_value) {
  var count = this.parentView.getRowsCount();
  if (rowIndex < count)
    return this.parentView.row.apply(this.parentView, arguments);
  rowIndex -= count;
  return this.secondView_.row.apply(this.secondView_, arguments);
};


/** @inheritDoc */
anychart.data.ConcatView.prototype.getRowsCount = function() {
  return this.parentView.getRowsCount() + this.secondView_.getRowsCount();
};


/** @inheritDoc */
anychart.data.ConcatView.prototype.parentViewChangedHandler = function(event) {
  if (event.invalidated(anychart.utils.ConsistencyState.DATA))
    this.dispatchEvent(new anychart.utils.InvalidatedStatesEvent(this, anychart.utils.ConsistencyState.DATA));
};


/** @inheritDoc */
anychart.data.ConcatView.prototype.parentMeta = function(index, name, opt_value) {
  var count = this.parentView.getRowsCount();
  var parentView;
  if (index < count) {
    parentView = this.parentView;
  } else {
    index -= count;
    parentView = this.secondView_;
  }
  if (arguments.length > 2) {
    parentView.meta(index, name, opt_value);
    return this;
  } else {
    return parentView.meta(index, name);
  }
};
