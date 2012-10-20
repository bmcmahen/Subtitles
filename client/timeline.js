Template.map.events({

  'click .timelineEvent' : function(e, t) {
    var id = e.currentTarget.id;
    Session.set('currentSub', id);
    var currentSub = Subtitles.findOne(id);
    Session.set('startTime', currentSub.startTime)
    Session.set('endTime', currentSub.endTime)
    Session.set('currentTime', currentSub.startTime)
  },

  'mousedown #current-position' : function (e, t) {
    var self = this; 
    draggingCursor = true; 
    return false

    // establish that i'm in dragging mode, which means i need to track mouse
    // movement.  Can this be done through d3? 
    console.log(this, e, t)
  }
})

Template.map.rendered = function () {
  var self = this; 
  self.node = self.find('#video-map')
  self.marker = self.find('#current-position')
  self.timelineWrapper = self.find('.map-wrap')

  var videoDuration = 600; // this needs to be set dynamically
  var timelineWidth = self.node.clientWidth - 80;
  var multiplyBy = timelineWidth / videoDuration;
  var divideBy = videoDuration / timelineWidth;


  // Draw timeline frame, labels, background, etc.
  var x = d3.scale.linear()
    .domain([0, videoDuration])
    .range(['0px', self.node.clientWidth - 80]);

  d3.select(self.node).select('rect.map-background')
    .attr('x', 0)
    .attr('y', 10)
    .attr('width', timelineWidth)
    .attr('height', 10)
    .style('fill', '#B0B8D6')

  d3.select(self.node).select('.tick-bars').selectAll('line')
    .data(x.ticks(7))
    .enter().append('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', 0)
      .attr('y2', 30)
      .style('stroke', '#fff')
      .style('stroke-linecap', 'round')
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

  // Reactively draw or redraw captions as they are added or removed
  if (! self.handle) {

    self.handle = Meteor.autorun(function () {
      var current = Session.get('currentSub');
      var currentSub = Subtitles.findOne(current);

      // need function for drawing each caption span
      var drawSubs = function (caption) {
        caption.attr('id', function (cap) { return cap._id; })
          .attr('fill', 'rgba(255,255,255,0.5)')
          .attr('stroke', '#999')
          .attr('class', 'timelineEvent')
          .attr('x', function (cap) { return cap.startTime * multiplyBy; })
          .attr('y', 2.5)
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

// Reactively draw playback position during play
if (! self.handle2) {

  if (! draggingCursor) {
    self.handle2 = Meteor.autorun(function () {
      var currentTime = Session.get('currentTime');
      var xAxis = currentTime * multiplyBy; 

      d3.select(self.marker).attr('x1', xAxis).attr('x2', xAxis)
    })
  }
}

  // setup dragging event handlers which Meteor doesn't deal with very well. 
  // these should be unbinded upon the template being destroyed. 
  // does d3 have a similar 'off' to jquery?
  // XXX potentially use reactivity here, instead of updating directly. It depends
  // on the efficiency of it. My guess is that this is more efficient than
  // using Session.set('currentTime') but I could be wrong.
      d3.select(window).on('mousemove', function(e, d) {
        if (!draggingCursor) return;
        var xPosition = d3.mouse(self.timelineWrapper)[0];

        if (xPosition >= 0 && xPosition <= timelineWidth) {
          d3.select(self.marker).attr('x1', xPosition).attr('x2', xPosition);
          var val = xPosition * divideBy;

          if (typeof videoNode != 'undefined') videoNode.currentTime = val; 
        }
      });

      d3.select(window).on('mouseup', function(){
        if (draggingCursor) {
          draggingCursor = false;
          var x = d3.select(self.marker).attr('x1');
          if (x >= 0 && x <= timelineWidth) {
            Session.set('currentTime', x * divideBy);
          }
        } 
      });


}