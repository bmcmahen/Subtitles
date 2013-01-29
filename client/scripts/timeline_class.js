/**
 * A new Timeline Class
 */

(function(Subtitler, d3){

  var Timeline = function(attr){
    attr = attr || {};

    this.node = attr.node;
    this.marker = attr.marker;
    this.wrapper = attr.wrapper;
    this.project = attr.project;

    this.draggingCursor = false; 

    // Duration?
  }

  _.extend(Timeline.prototype, {

    setYScale : function(){
      this.yScale = d3.scale.liner()
        .domain([0, 4])
        .range([10, 60]);
    },

    setXScale : function(){
      this.xScale = d3.scale.linear()
        .domain([0, this.duration])
        .range([0, $(this.wrapper).width()]);
    },

    // Determine the WPM of a supplied caption
    getWPMRatio : function(caption){
      var dataLength = typeof cap.text === 'undefined' ? 11 : cap.text.split(' ').length
      , duration = cap.endTime - cap.startTime;
    
      return dataLength / duration;
    },

    // Our primary subtitle drawing logic. Pass in a caption.
    drawSubtitles : function(caption){
      var self = this;

      caption
        .attr('data-id', function (cap) { return cap._id; })
        .attr('class', 'timelineEvent')
        .attr('fill', function (cap) { 

          // Provide colour warnings if too fast rate / second
          var rate = self.getWPMRatio(cap);
          if (rate <= 2.3)
            return '#50ddfb';
          else if (rate > 2.3 && rate < 3.1)
            return '#fbb450'; // warning
          else
            return '#ea8787'; // danger
        })
        .attr('x', function (cap) { return self.xScale(cap.startTime); })
        .attr('y', function (cap) { return '-' + self.yScale(self.getWPMRatio(cap)); })
        .attr('width', function (cap) { 
          return self.xScale(cap.endTime) - self.xScale(cap.startTime)
        })
        .attr('height', function (cap) {
          return self.yScale(self.getWPMRatio(cap)); 
        });
    },

    // Ensures that we have an invisible click-zone, allowing seeking
    // on the timeline.
    drawClickZone : function(){
      var self = this;

      d3.select(self.node).select('rect.timeline-click-zone')
        .attr('width', $(self.wrapper).width());
    },

    // Our basic drawing logic. 
    drawTimeline : function(){
      var self = this;

      self.drawSubs(self.captions.enter().append('rect'));
      self.drawSubs(self.captions.transition().duration(400));
      self.captions
        .exit()
        .transition()
        .duration(400)
        .style('opacity', 0)
        .remove(); 
    },

    updateMarkerPosition : function(currentTime){
      var self = this
        , xAxis = self.xScale ? self.xScale(currentTime) : 0; 

      d3.select(self.marker)
        .transition()
        .duration(200)
        .attr('x1', xAxis)
        .attr('x2', xAxis);
    },

    // Events:

    // Our basic events start here. If we are dragging our cursor
    // on the timeline, we run this. 
    setMarkerPosition: function(options) {
      var self = this
        , options = options || false 
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
          Subtitler.videoNode.seekTo(self.xScale.invert(xPosition));
        
        Session.set('startTime', null)
        Session.set('endTime', null)

        if (options.sync) {
          Subtitler.syncCaptions(self.xScale.invert(xPosition));
        }
      }
    },

    onMouseUp: function(){
      if (this.draggingCursor) {
        this.draggingCursor = false;
        var x = d3.select(self.marker).attr('x1');

        if (x >= 0 && x <= self.node.clientWidth) {
          Session.set('currentTime', self.xScale.invert(x));
        }

        Subtitler.videoNode.syncCaptions(self.xScale.invert(x));
      } 
    },

    onWindowResize: function(){
      this.setXScale();
      this.drawClickZone();
      this.drawSubs(this.captions.transition().duration(400));
      this.updateMarkerPosition(Session.get('currentTime'));
    },

    bindEvents: function(){
      d3.select(window).on('mousemove', function(){
        if (!this.draggingCursor) return;
        this.setMarkerPosition();
      }, this);

      d3.select(window).on('mouseup', _.bind(this.onMouseUp, this));

      d3.select(self.node).select('.timeline-click-zone').on('click', function(){
        this.setMarkerPosition({ animate: true, sync: true });
      }, this);

      d3.select(window).on('resize', _.debounce(_.bind(this.onWindowResize, this), 300));
    }




  })
  
})(Subtitler, d3);