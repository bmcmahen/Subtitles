/**
 * Meteor Timeline events / templates
 *
 * Timeline Class is in timeline_class.js
 * 
 */

/*jshint laxcomma:true */

(function(Subtitler, d3){

Template.map.events({

  // Clicking a timeline caption will sync our captions and video.
  'click .timelineEvent' : function(e) {

    var id = e.currentTarget.getAttribute('data-id')
      , currentSub = Subtitles.findOne(id);

    Session.set('startTime', currentSub.startTime);
    Session.set('endTime', currentSub.endTime);
    Session.set('currentTime', currentSub.startTime);

    if (Subtitler.videoNode && Subtitler.videoNode.getCurrentTime())
      Subtitler.videoNode.seekTo(currentSub.startTime);
    
    document.getElementById(id).focus(); 
    return false;
  },

  // Initiates a marker dragging event
  'mousedown #current-position' : function (e, t) {
    t.timeline.draggingCursor = true; 
    return false;
  }

});

// Instantiate our d3 powered timeline and setup
// a reactive context for the data sources that will
// alter our timeline, including captions, current time,
// and current video. 
Template.map.rendered = function () {

  var self = this
    , timeline;

  var constructTimeline = function(){
   timeline = self.timeline = new Subtitler.Timeline({
      node : self.find('#video-map'),
      marker : self.find('#current-position'),
      wrapper : self.find('.timeline-wrapper'),
      project : Videos.findOne(Session.get('currentVideo'))
    });
  }

  // DRAW TIMELINE
  // if Subtitles collection changes, redraw changed captions. In effect,
  // this also runs if the selected video changes.
  if (! this.drawTimeline) {
    this.drawTimeline = Meteor.autorun(function() {

      var subtitles = Subtitles.find().fetch();

      if (!timeline)
        return;
      
      timeline.captions = d3.select(timeline.node)
        .select('.caption-spans')
        .selectAll('rect')
        .data(subtitles, function (sub) {
          return sub._id; 
        });

      timeline.drawTimeline(); 

    });
  }

  // DRAW CAPTIONS
  // if the selected video file changes, redraw the entire timeline
  if (! this.drawCaptions) {
    this.drawCaptions = Meteor.autorun(function() {
      var video = Videos.findOne(Session.get('currentVideo'));
      if (video) {

        if (!timeline) constructTimeline(); 

        timeline
          .setDuration(video.duration)
          .setXScale()
          .drawClickZone();
      }
    });
  }

  // PLAYBACK POSITION
  // if Session.get('currentTime') changes, redraw the playback position marker
  if (! this.playbackPosition) {
      this.playbackPosition = Meteor.autorun(function () {
        var currentTime = Session.get('currentTime');

        if (!timeline)
          return;
        
        if (timeline.draggingCursor)
          return; 

        timeline.updateMarkerPosition(currentTime);
      });
  }

}; // End of Template Rendered

Template.map.destroyed = function () {
  this.handle && this.handle.stop();
  this.drawCaptions && this.drawCaptions.stop(); 
  this.playbackPosition && this.playbackPosition.stop(); 
};

})(Subtitler, d3); 