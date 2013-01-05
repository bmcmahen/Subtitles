/**
 * Video Playback Controls
 */

(function(){

Template.controls.events({

  'click #loop-checked': function(e,t){
    e.currentTarget.checked ? 
      Session.set('looping', true) : Session.set('looping', false)

    return false
  },

  'change #loop-duration' : function (e, t) {
    Session.set('loopDuration', Number(e.currentTarget.value))
  },

  'click #skip-to-beginning' : function (e, t) {
    if (Subtitler.videoNode)
      Subtitler.videoNode.currentTime = 0;
  },

  'click #skip-to-end' : function (e, t) {
    if (Subtitler.videoNode)
      Subtitler.videoNode.currentTime = Subtitler.videoNode.duration;

  },

  'click #play-video' : function (e, t) {
    var node = Subtitler.videoNode;
    if (node) {
      Session.get('videoPlaying') ? 
        node.pause() : node.play(); 
    }
  },

  'change #playback-rate' : function (e, t) {
    Session.set('playbackRate', e.currentTarget.value)
    if (Subtitler.videoNode)
      Subtitler.videoNode.playbackRate = e.currentTarget.value
  }

})

Template.controls.helpers({

  looping: function(){
    return Session.get('looping')
  },

  loopDuration: function(){
    return Session.get('loopDuration')
  },

  playing: function() {
    if (Session.get('videoPlaying'))
      return 'paused'
  },

  supported: function() {
    // Test if playbackRate is supported
    var vid = document.createElement('video')
      , playbackRate = vid.playbackRate; 

    if (!_.isUndefined(playbackRate))
      return true 
  }
})

Template.controls.rendered = function() {
  var self = this;
  var loop = self.find('#loop-duration');
  loop.value = Session.get('loopDuration');

  var pRate = self.find('#playback-rate');
  pRate.value = Session.get('playbackRate');

  var vid = document.getElementById('video-display');
  self.node = vid; 

}

})();
