/**
 * Video Playback Controls
 */

Template.controls.events({

  'click #loop-checked': function(e,t){
    e.currentTarget.checked ? 
      Session.set('looping', true) : Session.set('looping', false)
  },

  'change #loop-duration' : function (e, t) {
    Session.set('loopDuration', Number(e.currentTarget.value))
  },

  'click #skip-to-beginning' : function (e, t) {
    t.node.currentTime = 0;
  },

  'click #skip-to-end' : function (e, t) {
    t.node.currentTime = t.node.duration;
  },

  'click #play-video' : function (e, t) {
    Session.get('videoPlaying') ?
      Session.set('videoPlaying', false) : Session.set('videoPlaying', true)
  },

  'change #playback-rate' : function (e, t) {
    Session.set('playbackRate', e.currentTarget.value)
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
