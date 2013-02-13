/**
 * Timeline Class for rendering captions w/ d3. 
 * 
 */

/*jshint laxcomma:true */

(function(Subtitler, d3){

  // Timeline Constructor
  var Timeline = function(attr){
    attr = attr || {};

    this.node = attr.node;
    this.marker = attr.marker;
    this.wrapper = attr.wrapper;
    this.project = attr.project;

    this.setDuration(attr.duration);

    // Keep track of when we are dragging our cursor 
    // to ensure better performance in some circumstances.
    this.draggingCursor = false; 

    this.setYScale().setXScale(); 
    this.bindEvents(); 

    Subtitler.timeline = this; 
  };

  // Timeline Functions
  _.extend(Timeline.prototype, {

    // determine our Y scale. Constant...
    setYScale : function(){
      this.yScale = d3.scale.linear()
        .domain([0, 4])
        .range([10, 60]);
      return this;
    },

    // determine our X scale. This is dependent
    // upon our wrapper width and the duration of the video.
    setXScale : function(){
      this.xScale = d3.scale.linear()
        .domain([0, this.duration])
        .range([0, $(this.wrapper).width()]);
      return this;
    },

    setDuration: function(time){
      this.duration = time; 
      return this;
    },

    // Determine the WPM of a supplied caption
    getWPMRatio : function(cap){
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
          return self.xScale(cap.endTime) - self.xScale(cap.startTime);
        })
        .attr('height', function (cap) {
          return self.yScale(self.getWPMRatio(cap)); 
        });
        
      return this; 
    },

    // Ensures that we have an invisible click-zone, allowing seeking
    // on the timeline.
    drawClickZone : function(){
      d3.select(this.node)
        .select('rect.timeline-click-zone')
        .attr('width', $(this.wrapper).width());
      return this; 
    },

    // Our basic drawing logic. 
    drawTimeline : function(){
      this.drawSubtitles(this.captions.enter().append('rect'));
      this.drawSubtitles(this.captions.transition().duration(400));
      this.captions
        .exit()
        .transition()
        .duration(400)
        .style('opacity', 0)
        .remove(); 
      return this; 
    },

    updateMarkerPosition : function(currentTime){
      var xAxis = this.xScale ? this.xScale(currentTime) : 0; 
      d3.select(this.marker)
        .transition()
        .duration(200)
        .attr('x1', xAxis)
        .attr('x2', xAxis);
      return this;
    },

    // Appends our subtitles reactive data source to our
    // d3 captions.
    appendData : function(subtitles){
      this.captions = d3.select(this.node)
        .select('#caption-spans')
        .selectAll('rect')
        .data(subtitles, function(sub){
          return sub._id;
        });
      return this; 
    },

    // Events:

    // Our basic events start here. If we are dragging our cursor
    // on the timeline, we run this. 
    setMarkerPosition: function(opts) {
      var self = this
        , opts = opts || false 
        , xPosition = d3.mouse(self.wrapper)[0];

      if (xPosition >= 0 && xPosition <= $(self.wrapper).width()) {

        // Don't animate while dragging
        if (opts.animate)
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
        
        Session.set('startTime', null);
        Session.set('endTime', null);

        if (opts.sync && Subtitler.videoNode) {
          Subtitler.videoNode.syncCaptions(self.xScale.invert(xPosition));
        }
      }
      return this;
    },

    onMouseUp: function(){
      if (this.draggingCursor) {
        this.draggingCursor = false;
        var x = d3.select(this.marker).attr('x1');

        if (x >= 0 && x <= $(this.node).width()) {
          Session.set('currentTime', this.xScale.invert(x));
        }

        Subtitler.videoNode.syncCaptions(this.xScale.invert(x), {
          silent: true
        });
      } 
    },

    onWindowResize: function(){
      this.setXScale();
      this.drawClickZone();
      if (this.captions)
        this.drawSubtitles(this.captions.transition().duration(400));
      this.updateMarkerPosition(Session.get('currentTime'));
    },

    bindEvents: function(){
      var self = this; 

      d3.select(window).on('mousemove', function(){
        if (!self.draggingCursor) return;
        self.setMarkerPosition();
      });

      d3.select(window).on('mouseup', _.bind(this.onMouseUp, this));

      d3.select(self.node).select('.timeline-click-zone').on('click', function(){
        self.setMarkerPosition({ animate: true, sync: true });
      });

      d3.select(window).on('resize', _.debounce(_.bind(this.onWindowResize, this), 300));
    }

  });

  // Attach to our global.
  Subtitler.Timeline = Timeline;  
  
})(Subtitler, d3);