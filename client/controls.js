/**
 * Video Playback Controls
 */


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
    Subtitler.videoNode.currentTime = 0;
  },

  'click #skip-to-end' : function (e, t) {
    Subtitler.videoNode.currentTime = Subtitler.videoNode.duration;

  },

  'click #play-video' : function (e, t) {
    var node = Subtitler.videoNode;
    Session.get('videoPlaying') ? 
      node.pause() : node.play(); 
  },

  'change #playback-rate' : function (e, t) {
    Session.set('playbackRate', e.currentTarget.value)
    Subtitler.videoNode.playbackRate = e.currentTarget.value
  }

})

Template.controls.helpers({

  looping: function(){
    console.log('looping', Session.get('looping'));
    return Session.get('looping')
  },

  loopDuration: function(){
    return Session.get('loopDuration')
  },

  playing: function() {
    if (Session.get('videoPlaying'))
      return 'paused'
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
