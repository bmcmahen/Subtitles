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
      'project/:id' : 'project',
      'help' : 'help',
      'login' : 'login'
    },

    home : function() {
      Session.set('currentView', null);
    },

    login: function(){
      Session.set('overlay', 'loginForm');
    },

    resetPassword : function() {
      Session.set('passwordView', 'password');
    },

    newProject : function() {
      Session.set('overlay', 'newVideo');
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
  root.Router = new Router; 

  Meteor.startup(function () {
    Backbone.history.start({ pushState : true });
  });

  // Handle the presence of a resetToken separately, since
  // this doesn't work well with Backbone's router. 
  if (Accounts._resetPasswordToken) {
    Session.set('overlay', 'loginView')
    Session.set('resetPassword', Accounts._resetPasswordToken);
  }

  // The HUGE LIST of Session Variables. There should be a better
  // way to do this. Consider making a local, reactive model? 
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

  // Subscriptions.
  // 
  // Videos.
  Meteor.autosubscribe(function() {
    Meteor.user() && Meteor.subscribe('videos', Meteor.user()._id);
  });

  // Subtitles.
  Meteor.autosubscribe(function () {
    var selectedVideo = Session.get('currentVideo')
    selectedVideo && Meteor.subscribe('subtitles', selectedVideo);
  });

  root.Subtitler = Subtitler; 

}).call(this);


/**
 * video
 */

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

// We check to see if we have a videoSource object here,
// and if we do, we construct our video. Vimeo and YouTube seem
// to require that the DOM element is present in order to
// construct the iFrame. With HTML5, we can build it and then
// append it to the DOM. 
Template.mainPlayerView.rendered = function(){

  var vidSource = Videos.findOne(Session.get('currentVideo'))
    , self = this;
  
  if (vidSource && !Session.get('videoDuration')) {
    var videoNode = new Subtitler.VideoElement(vidSource.url, {
      target: 'main-player-drop',
      type: vidSource.type
    }).on('ready', function(){

      // With YouTube, we need to retrieve metaData either
      // by playing the video (and repeatedly checking for
      // the metadata), or by using the gData api. This calls
      // the gData api and retreives the necessary info.
      if (this.isYoutube) {
        this.getYoutubeMetadata(function(json){
          Videos.update(Session.get('currentVideo'), {$set: {
            name : json.data.title
          }});
          Session.set('videoDuration', json.data.duration);
        });
      } else {
        Session.set('videoDuration', this.getVideoDuration());
      }
    });
  }
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

