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


Meteor.autosubscribe(function() {
  var currentUser = Meteor.user(); 
  if (currentUser)
    Meteor.subscribe('videos', currentUser._id)
})

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

  'loadedmetadata #video-display' : function(e, t) {
    Subtitler.videoNode = e.currentTarget;
  },

  'timeupdate #video-display': function(e, t){

    var node = Subtitler.videoNode; 

    // if dragging, dont run the below logic. It slows things down.     
    if (Subtitler.draggingCursor)
      return

    // Updates timeline cursor position
    Session.set('currentTime', node.currentTime)

    // loop the video, if looping true and if currently playing
    // this logic should go into reactive function for efficiency
    var end = Session.get('endTime')
    if (! end) {
      Session.set('endTime', node.currentTime + Session.get('loopDuration'))
      Session.set('startTime', node.currentTime)
    } 
    else if (Session.get('looping') && Session.get('videoPlaying')) {
      if (node.currentTime > end){
        node.currentTime = Session.get('startTime')
      }
    }
  },

  'playing #video-display': function(e,t){
    Session.set('videoPlaying', true)
  },

  'pause, ended, error #video-display': function(e,t){
    Session.set('videoPlaying', false)
  }

});

Template.video.helpers({
  fileURL : function() {
    return Session.get('videoURL');
  }
});
