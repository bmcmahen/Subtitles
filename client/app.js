// Global Namespace of Subtitler
Subtitler = {};

Videos = new Meteor.Collection('videos')

Subtitles = new Meteor.Collection('subtitles')


// Router

var myRouter = Backbone.Router.extend({
  routes : {
    '': 'home',
    'reset-password' : 'resetPassword',
    'reset-password/:id' : 'newPassword',
    'library' : 'library',
    'project/:id' : 'project'
  },

  home : function() {
    Session.set('currentView', 'first');
  },

  resetPassword : function() {
    console.log('reset pass');
    Session.set('currentView', 'password')
  },

  newPassword : function(id) {
    console.log('newpw');
    Session.set('currentView', 'password');
    Session.set('resetPassword', id);
  },

  library : function() {
    if (Meteor.user()) {
      Session.set('currentView', 'second');
    } else {
      Session.set('currentView', 'first');
      Router.navigate('');
    }
  },

  project : function(id) {
    // also need to test if the user owns this particular
    // project!

      Session.set('currentView', 'third');
      Session.set('currentVideo', id);
  }
});

Router = new myRouter;

Meteor.startup(function () {
  Backbone.history.start({ pushState : true });
});


// Session variables, reactive

Session.set('looping', true)
Session.set('loopDuration', 5)
Session.set('playbackRate', 1)
Session.set('videoPlaying', false)
Session.set('currentTime', null)

Session.set('startTime', 0)
Session.set('endTime', null)

Session.set('currentVideo', null)
Session.set('currentSub', null)

Session.set('isLooping', null)

Session.set('saving', null)

Session.set('videoURL', null)

Session.set('currentView', 'first');


/**
 * Subscriptions
 */

Meteor.subscribe('videos')

Meteor.autosubscribe(function () {
  var selectedVideo = Session.get('currentVideo')
  if (selectedVideo) 
    Meteor.subscribe('subtitles', selectedVideo)
})

/**
 * Main view
 */


Template.body.helpers({
  currentView: function(){
    return Session.get('currentView');
  }
})

Template.body.preserve['.intro', '.library', '.app']


/**
 * video
 */
  
Subtitler.syncCaptions = function(time, options) {

  var options = options || {}; 
  options.silence = options.silent || false; 

  var binarySearch = function(array, currentTime) {

    var low = 0;
    var high = array.length - 1;
    var i;

    while (low <= high) {
      i = Math.floor((low + high) / 2);

      if (array[i].startTime <= currentTime) {

        if (array[i].endTime >= currentTime ){
          // this is the one
          return array[i]._id; 

        } else {
          low = i + 1;
        }
      }

      else {
        high = i - 1;
      }
    } 

    return null;
  }


// Only run the search if its not playing on the same caption.

if (time > Session.get('endTime') || time < Session.get('startTime')) {
  var result = Subtitles.findOne({startTime: {$lte : time}, endTime: {$gte: time}})
  if (result) {
    if (options.silent)
      Session.set('silentFocus', true)
    document.getElementById(result._id).focus(); 
    Session.set('currentSub', result)
  }
}

}

Template.video.events({

  'timeupdate #video-display': function(e, t){

    console.log(t.node.currentTime)

    // if dragging, dont run the below logic. It slows things down.     
    if (Subtitler.draggingCursor)
      return

    // Updates timeline cursor position
    Session.set('currentTime', t.node.currentTime)

    // loop the video, if looping true and if currently playing
    // this logic should go into reactive function for efficiency
    if (! Session.get('endTime')) {
      Session.set('endTime', t.node.currentTime + Session.get('loopDuration'))
      Session.set('startTime', t.node.currentTime)
    } 
    else if (Session.get('looping') && Session.get('videoPlaying')) {
      if (t.node.currentTime > Session.get('endTime')){
        t.node.currentTime = Session.get('startTime')
      }
    }
  },

  'playing #video-display': function(e,t){
    Session.set('videoPlaying', true)
  },

  'pause, ended, error #video-display': function(e,t){
    Session.set('videoPlaying', false)
  }
})

Template.video.helpers({
  fileURL : function() {
    return Session.get('videoURL');
  }
})

Template.video.rendered = function() {
  var self = this;
  self.node = self.find('#video-display');
  Subtitler.videoNode = self.node; 

  // update play status of video when 'videoPlaying' changes
  if (! self.handlePlayback) {
    self.handle = Meteor.autorun(function () {
      var playStatus = Session.get('videoPlaying')
      playStatus ? self.node.play() : self.node.pause(); 
    })
  }

  // update video playback rate when 'playbackRate' changes
  if (! self.handlePlaybackRate) {
    self.handlePlaybackRate = Meteor.autorun(function () {
      self.node.playbackRate = Session.get('playbackRate');
    })
  }

}

Template.video.destroyed = function () {
  var self = this; 
  self.handlePlayback && self.handlePlayback.stop();
  self.handlePlaybackRate && self.handlePlaybackRate.stop(); 
  self.handleVideoSync && self.handleVideoSync.stop();
  self.handleCaptionSync && self.handleCaptionSync.stop(); 
}


