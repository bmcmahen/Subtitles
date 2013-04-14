/**
 * Meteor Timeline events / templates
 *
 * Timeline Class is in timeline_class.js
 *
 */

/*jshint laxcomma:true */

Session.set('videoDuration', null);

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

Template.map.helpers({
  // Only render our timeline once we have a video duration.
  // This is necessary for our xScale.
  videoDuration: function(){
    return Session.get('videoDuration');
  }
});

// Instantiate our d3 powered timeline and setup
// a reactive context for the data sources that will
// alter our timeline, including captions, current time,
// and current video.
Template.map.rendered = function () {
  var self = this
    , timeline
    , videoDuration = Session.get('videoDuration');

  // We need to ensure that we have a video duration before
  // constructing the timeline.
  if (videoDuration) {

    var constructTimeline = function(){
     timeline = self.timeline = new Subtitler.Timeline({
        node : self.find('#video-map'),
        marker : self.find('#current-position'),
        wrapper : self.find('.timeline-wrapper'),
        project : Videos.findOne(Session.get('currentVideo')),
        duration: videoDuration
      }).setXScale()
        .drawClickZone();
    };

    // UPDATE CHANGED CAPTIONS

    // HERES THE ISSUE. WE NEED TO UPDATE OUR DATA
    //

    // d3 doesn't have a Changed() so we, in effect, implement
    // it here.
    if (! this.updateChangedCaptions) {
      this.updateChangedCaptions = Subtitles.find().observeChanges({
        changed: function(id){
          if (timeline) {
            timeline
              .appendData(Subtitles.find().fetch())
              .changeCaption(id);
          }
        }
      });
    }

    // DRAW TIMELINE
    // Uses Enter() and Exit()
    if (! this.drawTimeline) {
      this.drawTimeline = Deps.autorun(function() {
        var subtitles = Subtitles.find().fetch();
        if (!timeline) constructTimeline();
        timeline
          .appendData(subtitles)
          .drawTimeline();
      });
    }

    // PLAYBACK POSITION
    if (! this.playbackPosition) {
      this.playbackPosition = Deps.autorun(function () {
        var currentTime = Session.get('currentTime');

        if (!timeline)
          return;

        if (timeline.draggingCursor)
          return;

        timeline.updateMarkerPosition(currentTime);
      });
    }

    // DURATION CHANGE
    if (! this.videoDuration) {
      this.videoDuration = Deps.autorun(function () {
        timeline
          .setDuration(Session.get('videoDuration'))
          .setXScale()
          .redraw();
      });
    }
  }
};

Template.map.destroyed = function () {
  if (this.playbackPosition) this.playbackPosition.stop();
  if (this.videoDuration) this.videoDuration.stop();
  if (this.drawTimeline) this.drawTimeline.stop();
  if (this.updateChangedCaptions) this.updateChangedCaptions.stop();
};