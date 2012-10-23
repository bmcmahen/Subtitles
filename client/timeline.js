// XXX To do: draggingCursor shouldn't be global variable.

Template.map.events({

  'click .timelineEvent' : function(e, t) {
    var id = e.currentTarget.getAttribute('data-id');
    Session.set('currentSub', id);
    var currentSub = Subtitles.findOne(id);
    Session.set('startTime', currentSub.startTime)
    Session.set('endTime', currentSub.endTime)
    Session.set('currentTime', currentSub.startTime)
  },

  'mousedown #current-position' : function (e, t) {
    Subtitler.draggingCursor = true; 
    return false
  }
})

Template.map.rendered = function () {
  var self = this; 
  self.node = self.find('#video-map')
  self.marker = self.find('#current-position')
  self.timelineWrapper = self.find('.map-wrap')

  var videoDuration = 600; // XXX this needs to be set dynamically
  var timelineWidth = self.node.clientWidth - 80;
  var multiplyBy = timelineWidth / videoDuration;
  var divideBy = videoDuration / timelineWidth;


  // Draw Timeline 
  var x = d3.scale.linear()
    .domain([0, videoDuration])
    .range(['0px', self.node.clientWidth - 80]);

  d3.select(self.node).select('line.timeline-background')
    .attr('x1', 0)
    .attr('x2', timelineWidth)
    .attr('y1', 0)

  // Draw Click Zone
  d3.select(self.node).select('rect.timeline-click-zone')
    .attr('width', timelineWidth)

  // Draw Time-Interval Lines
  d3.select(self.node).select('.tick-bars').selectAll('line')
    .data(x.ticks(7))
    .enter().append('line')
      .attr('class', 'tick-bar')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', 1)
      .attr('y2', -50)

// Draw Time-Interval Line Labels
  d3.select(self.node).select('.time-labels').selectAll('.rule')
    .data(x.ticks(7))
    .enter().append('text')
    .attr('class', 'rule')
    .attr('x', x)
    .attr('y', -55)
    .attr('dy', -3)
    .attr('text-anchor', 'middle')
    .text(function(d){
      return secondsToHms(d, { format : 'short' } )
    });

  // Reactively draw or redraw captions as they are added or removed
  if (! self.handle) {

  // Height scale
  var yScale = d3.scale.linear()
    .domain([0, 4])
    .range([10, 55]);


    self.handle = Meteor.autorun(function () {

      var currentSubId = Session.get('currentSub')
        , currentSub = Subtitles.findOne(currentSubId);

      // Determine the ratio of words to seconds
      // 140 words / minute (BBC Recommendation) is 2.3
      // 180 / minute, 3, is sometime acceptable
      var getRatio = function(cap) {
        var dataLength = typeof cap.text === 'undefined' ? 11 : cap.text.split(' ').length
          , duration = cap.endTime - cap.startTime;
        
        return dataLength / duration;
      }


      // need function for drawing each caption span
      var drawSubs = function (caption) {
        caption
          .attr('data-id', function (cap) { return cap._id; })
          .attr('class', 'timelineEvent')
          .attr('fill', function (cap) { 
            // Provide colour warnings if too fast rate / second
            var rate = getRatio(cap);
            if (rate <= 2.3)
              return 'rgb(254, 226, 255)';
            else if (rate > 2.3 && rate < 3.1)
              return '#fbb450'; // warning
            else
              return '#ea8787'; // danger
          })
          .attr('x', function (cap) { return x(cap.startTime); })
          .attr('y', function (cap) { return '-' + yScale(getRatio(cap)); })
          .attr('width', function (cap) { 
            return x(cap.endTime) - x(cap.startTime)
          })
          .attr('height', function (cap) {
            return yScale(getRatio(cap)); 
          });
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

  if (! Subtitler.draggingCursor) {
    self.handle2 = Meteor.autorun(function () {
      var currentTime = Session.get('currentTime');
      var xAxis = currentTime * multiplyBy; 

      d3.select(self.marker).transition().duration(250).attr('x1', xAxis).attr('x2', xAxis)
    })
  }
}

// Timeline event handlers in d3 which don't work well with native Meteor
  var setMarkerPostion = function(options) {
    var options = options || false; 
    var xPosition = d3.mouse(self.timelineWrapper)[0];

        if (xPosition >= 0 && xPosition <= timelineWidth) {

          // Don't animate while dragging
          if (options.animate)
            d3.select(self.marker).transition().duration(250).attr('x1', xPosition).attr('x2', xPosition);
          else
            d3.select(self.marker).attr('x1', xPosition).attr('x2', xPosition);

          var val = xPosition * divideBy;
          if (typeof videoNode != 'undefined')
            videoNode.currentTime = val; 
        }
  };

      // If dragging the cursor during mouse movement, set position of marker.
      d3.select(window).on('mousemove', function(e, d) {

        if (! Subtitler.draggingCursor) 
          return;
        setMarkerPostion();
      });

      // If releasing mouse while dragging cursor, set marker position and disable
      // dragging (draggingCursor = false)
      d3.select(window).on('mouseup', function(){

        if (Subtitler.draggingCursor) {
          Subtitler.draggingCursor = false;
          var x = d3.select(self.marker).attr('x1');

          if (x >= 0 && x <= timelineWidth) {
            Session.set('currentTime', x * divideBy);
          }
        } 
      });

      d3.select(self.node).select('.timeline-click-zone').on('click', function(){
        setMarkerPostion({animate : true});
      });
};

Template.map.destroyed = function () {
  this.handle && this.handle.stop();
  this.handle2 && this.handle2.stop(); 
};