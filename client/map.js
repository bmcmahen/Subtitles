Template.map.rendered = function () {
  var self = this; 
  self.node = self.find('#video-map')

  // need to ensure that a video has loaded. should save video duration in database
  // so that we can still show this even if video hasn't loaded.
  var multiplyBy = self.node.clientWidth / 600;

/**
 * [setAxisPoints take width and duration and draw time-axis-points]
 */
var setAxisPoints = function(){

  var width = self.node.clientWidth;
  var spaceBetweenPixels = width / 12;
  var timeBetweenPoints = 600 / 12; 
  var axisLabelArray = [];

  for (x = 0; x <= 12; x++) {
    var axisPoint = {};
    axisPoint.left = spaceBetweenPixels * x;
    axisPoint.text = secondsToHms(timeBetweenPoints * x);
    axisLabelArray.push(axisPoint);
  } 
  console.log(axisLabelArray)
  return axisLabelArray;
};

// draw each axis point with left and text attributes.
var drawAxis = function(axisPoint) {
  axisPoint
    .attr('x', function(p) { return p.left })
    .text(function(p) { return p.text })
};

// Link below for lines + value
// http://mbostock.github.com/d3/tutorial/bar-1.html
//
// svg needs to have greater height, and background should not be set on svg
// but should be a rectangle.

var x = d3.scale.linear()
  .domain([0, 600])
  .range(['0px', self.node.clientWidth - 80]);

d3.select(self.node).select('rect.map-background')
  .attr('x', 0)
  .attr('y', 5)
  .attr('width', self.node.clientWidth - 80)
  .attr('height', 20)
  .style('fill', '#B0B8D6')

d3.select(self.node).select('.tick-bars').selectAll('line')
  .data(x.ticks(7))
  .enter().append('line')
    .attr('x1', x)
    .attr('x2', x)
    .attr('y1', 0)
    .attr('y2', 30)
    .style('stroke', '#fff')
    .style('stroke-width', '2')

d3.select(self.node).select('.time-labels').selectAll('.rule')
  .data(x.ticks(7))
  .enter().append('text')
  .attr('class', 'rule')
  .attr('x', x)
  .attr('y', 50)
  .attr('dy', -3)
  .attr('text-anchor', 'middle')
  .text(function(d){
    return secondsToHms(d)
  });

// var axisLabels = d3.select(self.node).select('.timeAxis-labels').selectAll('p').data(setAxisPoints());
// console.log(axisLabels)
// drawAxis(axisLabels.enter().append('text'));

/**
 * [Draw (and update, remove) the captions on the mini-map]
 */
  if (! self.handle) {

    self.handle = Meteor.autorun(function () {
      var current = Session.get('currentSub');
      var currentSub = Subtitles.findOne(current);

      // need function for drawing each caption span
      var drawSubs = function (caption) {
        caption.attr('id', function (cap) { return cap._id; })
          .attr('fill', '#E9E9F4')
          .attr('stroke', '#999')
          .attr('class', 'video-map-caption')
          .attr('x', function (cap) { return cap.startTime * multiplyBy; })
          .attr('y', 2)
          .attr('width', function (cap) { 
            var endPosition = cap.endTime * multiplyBy;
            var startPosition = cap.startTime * multiplyBy;
            return endPosition - startPosition;
          })
          .attr('height', 25);
      };

      var captions = d3.select(self.node).select('.caption-spans').selectAll('rect')
        .data(Subtitles.find().fetch(), function (sub) { return sub._id; })

      drawSubs(captions.enter().append('rect'));
      drawSubs(captions.transition().duration(250).ease('cubic-out'));
      captions.exit().transition().duration(250).style('opacity', 0).remove(); 
    })
  }
}