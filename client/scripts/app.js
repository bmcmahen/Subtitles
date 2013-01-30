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


(function(Subtitler){

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

Template.mainPlayerView.events({

  'click #main-player-drop' : function(e, t) {
    $('input.file').trigger('click');
  },

  'change input.file, drop #main-player-drop' : function(e, t) {
    e.preventDefault(); 

    // Assume it's an HTML video if we're dragging in a file. Then
    // create a videoURL, and pass this to the videoElement 
    // constructor. 
    var fileList = e.currentTarget.files || e.dataTransfer.files
      , vid = new Subtitler.Video(fileList)
      , url = vid.createVideoUrl();

      if (url) {
        Session.set('videoURL', url)
        this.videoNode = new Subtitler.VideoElement(url, {
          target: '#main-player-drop'
        }).embedVideo();
        Subtitler.videoNode = this.videoNode;
      }


  },

  'dragover #main-player-drop' : function(e, t){
    e.preventDefault(); 
  },

  'click #try-youtube' : function(e, t){
    this.videoNode = new Subtitler.VideoElement('jNwXsTJddVo', {
      target: 'main-player-drop',
      type: 'youtube'
    });
  },

  'click #try-vimeo' : function(e, t){
    this.videoNode = new Subtitler.VideoElement('58179312', {
      target: '#main-player-drop',
      type: 'vimeo'
    });
  }


});

Template.video.helpers({

  projectName : function() {
    var vid = Videos.findOne(Session.get('currentVideo'))
    if (vid)
      return vid.name
  }

});

Template.mainPlayerView.rendered = function(){
  if (Subtitler.videoNode)
    Subtitler.videoNode.embedVideo('#main-player-drop'); 
};

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

})(Subtitler); 
