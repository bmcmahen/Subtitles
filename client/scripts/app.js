// Global Namespace of Subtitler
Subtitler = {};

Videos = new Meteor.Collection('videos')

Subtitles = new Meteor.Collection('subtitles')


// Router
// 


var myRouter = Backbone.Router.extend({
  routes : {
    '': 'home',
    'reset-password' : 'resetPassword',
    'library' : 'library',
    'project/:id' : 'project',
    'help' : 'help'
  },

  home : function() {
    if (! Accounts._resetPasswordToken) {
      Session.set('passwordView', null);
    if (Meteor.user()) {
      Router.navigate('library', {trigger: true})
    } else 
      Session.set('currentView', 'introduction');
    }
  },

  resetPassword : function() {
    Session.set('currentView', 'introduction');
    Session.set('passwordView', 'password');
  },

  library : function() {
    if (Meteor.user()) {
      Session.set('currentView', 'library');
    } else {
      Session.set('currentView', 'introduction');
      Router.navigate('');
    }
  },

  project : function(id) {
    // also need to test if the user owns this particular
    // project!

      Session.set('currentView', 'app');
      Session.set('currentVideo', id);
  },

  help : function(){
    Session.set('currentView', 'help');
  }
});

Router = new myRouter;


(function(){

Meteor.startup(function () {
  Backbone.history.start({ pushState : true });
});

if (Accounts._resetPasswordToken) {
  Session.set('currentView', 'introduction')
  Session.set('passwordView', 'password')
  Session.set('resetPassword', Accounts._resetPasswordToken);
}



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

Session.set('currentView', 'introduction');

Session.set('loading', null)


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
  introduction: function(){
    return Session.equals('currentView', 'introduction');
  },
  library: function(){
    return Session.equals('currentView', 'library');
  },
  app : function(){
    return Session.equals('currentView', 'app');
  },
  help: function(){
    return Session.equals('currentView', 'help');
  }
})

Template.body.preserve['.intro', '.library', '.app']


/**
 * video
 */
  
Subtitler.syncCaptions = function(time, options) {

  var options = options || {}; 
  options.silence = options.silent || false; 

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

  'pause, error #video-display': function(e,t){
    Session.set('videoPlaying', false)
  },

  'click #main-player-drop' : function(e, t) {
    $('input.file').trigger('click');
  },

  'change input.file, drop #main-player-drop' : function(e, t) {
    e.preventDefault(); 

    var fileList = e.currentTarget.files || e.dataTransfer.files
      , vid = new Subtitler.Video(fileList)
      , url = vid.createVideoUrl();

      if (url) {
        t.videoURL = url;
        Session.set('videoURL', url)
      }


  },

  'dragover #main-player-drop' : function(e, t){
    e.preventDefault(); 
  }

});

Template.video.helpers({
  fileURL : function() {
    return Session.get('videoURL');
  },

  projectName : function() {
    var vid = Videos.findOne(Session.get('currentVideo'))
    if (vid)
      return vid.name
  }
});

// Canvas Loading Animation
Template.loading.rendered = function(){
  var loading = require('bmcmahen-canvas-loading-animation')
    , spinner = new loading({
        width: 40,
        height: 40,
        radius: 9,
        dotRadius: 1.8
      });

  var wrapper = this.find('#loading-wrapper');

  wrapper.appendChild(spinner.canvas);
}

})(); 
