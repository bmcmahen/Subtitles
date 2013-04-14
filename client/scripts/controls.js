/**
 * Video Playback Controls
 */

Template.controls.events({

  'click #loop-checked': function(e,t){
    e.currentTarget.checked ?
      Session.set('looping', true) : Session.set('looping', false);

    return false;
  },

  'change #loop-duration' : function (e, t) {
    Session.set('loopDuration', +e.currentTarget.value);
  },

  'click #skip-to-beginning' : function (e, t) {
    if (Subtitler.videoNode)
      Subtitler.videoNode.seekTo(0);
  },

  'click #skip-to-end' : function (e, t) {
    if (Subtitler.videoNode)
      Subtitler.videoNode.seekTo(Subtitler.videoNode.getVideoDuration());
  },

  'click #play-video' : function (e, t) {
    var node = Subtitler.videoNode;
    if (node) {
      Session.get('videoPlaying') ?
        node.pauseVideo() : node.playVideo();
    }
  },

  'change #playback-rate' : function (e, t) {
    Session.set('playbackRate', e.currentTarget.value);
    if (Subtitler.videoNode)
      Subtitler.videoNode.setPlaybackRate(e.currentTarget.value);
  }

});

Template.controls.helpers({

  looping: function(){
    return Session.get('looping');
  },

  loopDuration: function(){
    return Session.get('loopDuration');
  },

  playing: function() {
    if (Session.get('videoPlaying'))
      return 'paused';
  },

  supported: function() {
    // Test if playbackRate is supported
    var vid = document.createElement('video')
      , playbackRate = vid.playbackRate;

    if (!_.isUndefined(playbackRate))
      return true;
  }
});

Template.controls.rendered = function() {
  var loop = this.find('#loop-duration')
    , pRate = this.find('#playback-rate')
    , vid = document.getElementById('video-display');

  loop.value = Session.get('loopDuration');
  pRate.value = Session.get('playbackRate');
  this.node = vid;
};
