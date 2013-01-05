// XXX To do: draggingCursor shouldn't be global variable.
(function(){

Template.map.events({

  'click .timelineEvent' : function(e, t) {

    var id = e.currentTarget.getAttribute('data-id')
      , currentSub = Subtitles.findOne(id);

    Session.set('startTime', currentSub.startTime)
    Session.set('endTime', currentSub.endTime)
    Session.set('currentTime', currentSub.startTime)

    if (Subtitler.videoNode && Subtitler.videoNode.currentTime)
      Subtitler.videoNode.currentTime = currentSub.startTime;
    
    document.getElementById(id).focus(); 
    return false
  },

  'mousedown #current-position' : function (e, t) {
    Subtitler.draggingCursor = true; 
    return false
  }
})

// D3 Goodness. 
Template.map.rendered = function () {
  var self = this;

  self.node = self.find('#video-map')
  self.marker = self.find('#current-position')
  self.timelineWrapper = self.find('.timeline-wrapper')
  self.project = Videos.findOne(Session.get('currentVideo'))

  var yScale = d3.scale.linear()
    .domain([0, 4])
    .range([10, 60]);


  // Sets the xScale, which should change depending on window size.
  var setXScale = function(duration){
    self.xScale = d3.scale.linear()
      .domain([0, self.duration])
      .range([0, $(self.timelineWrapper).width()])
  }


  // Draws the captions
  var drawSubs = function (caption) {
    caption
      .attr('data-id', function (cap) { return cap._id; })
      .attr('class', 'timelineEvent')
      .attr('fill', function (cap) { 

        // Provide colour warnings if too fast rate / second
        var rate = getRatio(cap);
        if (rate <= 2.3)
          return '#50ddfb';
        else if (rate > 2.3 && rate < 3.1)
          return '#fbb450'; // warning
        else
          return '#ea8787'; // danger
      })
      .attr('x', function (cap) { return self.xScale(cap.startTime); })
      .attr('y', function (cap) { return '-' + yScale(getRatio(cap)); })
      .attr('width', function (cap) { 
        return self.xScale(cap.endTime) - self.xScale(cap.startTime)
      })
      .attr('height', function (cap) {
        return yScale(getRatio(cap)); 
      });
  };

  // Gets word per minute ratio to determine colour of caption in timeline
  var getRatio = function(cap) {
    var dataLength = typeof cap.text === 'undefined' ? 11 : cap.text.split(' ').length
      , duration = cap.endTime - cap.startTime;
    
    return dataLength / duration;
  }

  // Resizes the click-zone based on window-width
  var drawClickZone = function() {
    d3.select(self.node).select('rect.timeline-click-zone')
      .attr('width', $(self.timelineWrapper).width())
  }

  // Basic drawing that is triggered by removal, enter, and changes to data set.
  var drawTimeline = function(){

      drawSubs(self.captions.enter().append('rect'));
      drawSubs(self.captions.transition().duration(400));
      self.captions
        .exit()
        .transition()
        .duration(400)
        .style('opacity', 0)
        .remove(); 
  }

  // DRAW TIMELINE
  // if Subtitles collection changes, redraw changed captions
  if (! self.drawTimeline) {
    self.drawTimeline = Meteor.autorun(function() {

      var subtitles = Subtitles.find().fetch(); 

      if (typeof xScale === 'undefined' && typeof self.project != 'undefined')
        setXScale(self.project.duration)

      var captions = self.captions = d3.select(self.node).select('.caption-spans').selectAll('rect')
        .data(subtitles, function (sub) {
          return sub._id; 
        })

      // drawSubs(self.captions.transition().duration(400));

      drawTimeline(); 



    });
  }


  // DRAW CAPTIONS
  // if the selected video file changes, redraw the entire timeline
  if (! self.drawCaptions) {
    self.drawCaptions = Meteor.autorun(function() {
      var video = Videos.findOne(Session.get('currentVideo'));
      if (video) {
        
        self.duration = video.duration; 
        setXScale();
        drawClickZone(); 
        
      }
    })
  }

  // I need video druation set; 
  // This allows me to set xScale
  // Once I have both of these, then I can draw the timeline. 
  // Once I have all of the subtitles loaded, then i can draw the subtitles. 

  var updateMarkerPosition = function(currentTime) {
     var xAxis = self.xScale ? self.xScale(currentTime) : 0; 

        d3.select(self.marker)
          .transition()
          .duration(200)
          .attr('x1', xAxis)
          .attr('x2', xAxis)
  }

  // PLAYBACK POSITION
  // if Session.get('currentTime') changes, redraw the playback position marker
  if (! self.playbackPosition) {
    if (! Subtitler.draggingCursor) {
      self.playbackPosition = Meteor.autorun(function () {

        var currentTime = Session.get('currentTime')
        updateMarkerPosition(currentTime);

      })
    }
  }

  // Timeline event handlers in d3 which don't work well with native Meteor
  var setMarkerPostion = function(options) {
    var options = options || false 
      , xPosition = d3.mouse(self.timelineWrapper)[0];

        if (xPosition >= 0 && xPosition <= $(self.timelineWrapper).width()) {

          // Don't animate while dragging
          if (options.animate)
            d3.select(self.marker)
              .transition()
              .duration(200)
              .attr('x1', xPosition)
              .attr('x2', xPosition);
          else
            d3.select(self.marker)
              .attr('x1', xPosition)
              .attr('x2', xPosition);

          if (Subtitler.videoNode)
            Subtitler.videoNode.currentTime = self.xScale.invert(xPosition);
          
          Session.set('startTime', null)
          Session.set('endTime', null)

          if (options.sync) {
            Subtitler.syncCaptions(self.xScale.invert(xPosition));
          }

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

        if (x >= 0 && x <= self.node.clientWidth) {
          Session.set('currentTime', self.xScale.invert(x));
        }

        Subtitler.syncCaptions(self.xScale.invert(x));
      } 
    });

    d3.select(self.node).select('.timeline-click-zone').on('click', function(){
      setMarkerPostion({animate : true, sync : true });
    });

    // Redraw the timeline AFTER window has been resized, otherwise it might kill my computer.
    $(window).on('resize', function() {
      clearTimeout(this.id);
      this.id = setTimeout(function(){
        setXScale();
        drawClickZone(); 
        drawSubs(self.captions.transition().duration(400));
        updateMarkerPosition(Session.get('currentTime'));
      }, 300);
    });

};

Template.map.destroyed = function () {
  var self = this;
  self.handle && self.handle.stop();
  self.drawCaptions && self.drawCaptions.stop(); 
  self.playbackPosition && self.playbackPosition.stop(); 
};

})(); 