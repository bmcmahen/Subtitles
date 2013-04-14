// Subtitles
//
// MIT. By Ben Mcmahen.
//
// Enjoy.


// Our Collections are Global, which kinda stinks.
Videos = new Meteor.Collection('videos');
Subtitles = new Meteor.Collection('subtitles');

(function(){

  var root = this
    , Subtitler = {};

  // Our Backbone Router. It'd be nice to use something
  // that didn't require backbone since I don't use Backbone
  // anywhere els.e
  var Router = Backbone.Router.extend({

    routes : {
      '': 'home',
      'reset-password' : 'resetPassword',
      'library' : 'library',
      'new-project': 'newProject',
      'new-project/vimeo' : 'newVimeoProject',
      'new-project/html' : 'newHTMLProject',
      'new-project/youtube' : 'newYoutubeProject',
      'project/:id' : 'project',
      'help' : 'help',
      'login' : 'login'
    },

    home : function() {
      Session.set('currentView', null);
      Session.set('overlay', null);
    },

    login: function(){
      Session.set('overlay', 'loginForm');
    },

    resetPassword : function() {
      Session.set('passwordView', 'password');
    },

    newProject : function() {
      Session.set('overlay', 'newVideo');
      Session.set('videoSource', null);
    },

    newVimeoProject: function(){
      Session.set('overlay', 'newVideo');
      Session.set('videoSource', 'vimeo');
    },

    newYoutubeProject: function(){
      Session.set('overlay', 'newVideo');
      Session.set('videoSource', 'youtube');
    },

    newHTMLProject: function(){
      Session.set('overlay', 'newVideo');
      Session.set('videoSource', 'local');
    },

    library : function() {
      if (Meteor.user()) {
        Session.set('overlay', 'viewLibrary');
      } else {
        Session.set('overlay', 'loginForm');
        Router.navigate('login');
      }
    },

    project : function(id) {
      Session.set('currentView', 'app');
      Session.set('currentVideo', id);
    },

    help : function(){
      Session.set('currentView', 'help');
    }

  });

  // Create our Router. Another global....
  root.Router = new Router();

  Meteor.startup(function () {
    Backbone.history.start({ pushState : true });
  });

  // The HUGE LIST of Session Variables. There should be a better
  // way to do this. Consider making a local, reactive model?
  Session.setDefault('looping', true);
  Session.setDefault('loopDuration', 5);
  Session.setDefault('playbackRate', 1);
  Session.setDefault('videoPlaying', false);
  Session.setDefault('currentTime', null);
  Session.setDefault('startTime', 0);
  Session.setDefault('endTime', null);
  Session.setDefault('currentVideo', null);
  Session.setDefault('currentSub', null);
  Session.setDefault('isLooping', null);
  Session.setDefault('saving', null);
  Session.setDefault('currentView', null);
  Session.setDefault('overlay', null);
  Session.setDefault('loading', null);
  Session.setDefault('createProjectFlow', null);

  // Handle the presence of a resetToken separately, since
  // this doesn't work well with Backbone's router.
  if (Accounts._resetPasswordToken) {
    Session.set('overlay', 'loginView');
    Session.set('resetPassword', Accounts._resetPasswordToken);
  }

  // Subscriptions.
  //
  // Videos.
  Deps.autorun(function() {
    if (Meteor.user()) Meteor.subscribe('videos', Meteor.user()._id);
  });

  // Subtitles.
  Deps.autorun(function () {
    var selectedVideo = Session.get('currentVideo');
    if (selectedVideo) Meteor.subscribe('subtitles', selectedVideo);
  });

  root.Subtitler = Subtitler;

}).call(this);



