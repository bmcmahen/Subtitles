(function(){

Template.navigation.helpers({
  displayName: function(){
    var user = Meteor.user();
    return (user.profile && user.profile.name) || user.username || (user.emails && user.emails[0] && user.emails[0].address)
  },

  loading : function() {
    return Session.get('loading');
  }
})

Template.navigation.events({

  'click .brand' : function() {
    Session.set('currentView', 'introduction');
    Session.set('currentVideo', null);
    Session.set('videoURL', null);
    Subtitler.videoNode = null; 
    Router.navigate('');
    return false; 
  },
  'click .logout' : function() {
    Meteor.logout(); 
    Session.set('currentView', 'introduction');
    Session.set('currentVideo', null);
    Session.set('videoURL', null);
    Subtitler.videoNode = null; 
    Router.navigate('');
    return false; 
  },

  'click .view-library' : function() {
    Session.set('overlay', 'viewLibrary');
    Router.navigate('library');
    return false;
  },

  'click .view-help' : function() {
    Session.set('currentVideo', null);
    Session.set('currentView', 'help');
    Session.set('videoURL', null);
    Subtitler.videoNode = null; 
    Router.navigate('help');
    return false; 
  },

  'click .new-project' : function(){
    Session.set('overlay', 'newVideo');
    return false;
  },

  'click .login' : function(){
    Session.set('overlay', 'loginForm');
    return false; 
  }
});

// Overlay helpers to distinguish between new project
// or select previous project.
Template.overlay.helpers({

  overlay: function(){
    return Session.get('overlay');
  },

  newVideo: function(){
    return Session.equals('overlay', 'newVideo');
  },

  viewLibrary: function(){
    return Session.equals('overlay', 'viewLibrary');
  },

  loginForm: function(){
    return Session.equals('overlay', 'loginForm');
  }

});

// Overlay Events
Template.overlay.events({

  'click .close' : function(e, t){
    $('#overlay').removeClass('active');
    Meteor.setTimeout(function(){
      Session.set('overlay', null);
    }, 400);
    return false; 
  },

});

Template.overlay.preserve['#panel'];

// New Video Events
Template.newVideo.events({

  'click a.local': function(){
    Session.set('videoSource', 'local');
    return false;
  },

  'click a.youtube': function(){
    Session.set('videoSource', 'youtube');
    return false;
  },

  'click a.vimeo' : function(){
    Session.set('videoSource', 'vimeo');
    return false;
  },

  'submit #youtube-project' : function(e, t){
    var url = $(t.find('.url')).val();

    // Instantiate new Youtube Movie
    return false;
  },

  'submit #vimeo-project' : function(e, t){
    var url = $(t.find('.url')).val();
    // Instantiate new Vimeo Movie Project
    return false;
  }
});

// New Video Helpers
Template.newVideo.helpers({

  videoSource: function(){
    return Session.get('videoSource');
  },

  local: function(){
    return Session.equals('videoSource', 'local');
  },

  youtube: function(){
    return Session.equals('videoSource', 'youtube');
  },

  vimeo: function(){
    return Session.equals('videoSource', 'vimeo');
  }

});

Template.newVideo.destroyed = function(){
  Session.set('videoSource', null);
};

function addClass(){
  $('#overlay').addClass('active');
};

// When rendered, add the 'active' class. This allows
// us to animate the fade/scale. Defer forces a redraw
// to ensure the animation happens. 
Template.overlay.rendered = function(){
    
  if (Session.get('overlay')) {
    _.defer(addClass);
  }
  
};

// Local Video Drag & Drop
Template.localVideo.events({

  'dragover .select-video-file' : function(e){
    e.preventDefault();
  },

  'dragenter .select-video-file' : function(e){
    e.preventDefault();
    $(e.currentTarget).addClass('dragover');
  },

  'dragleave .select-video-file' : function(e){
    $(e.currentTarget).removeClass('dragover');
  },

  'change .hidden, drop .select-video-file' : function(e, t){
    e.preventDefault();
    $(e.currentTarget).removeClass('dragover');

    var fileList = e.currentTarget.files || e.dataTransfer.files
      , vid = new Subtitler.Video(fileList)
      , url = vid.createVideoUrl(); 

    if (url) {
      t.videoURL = url; 
      t.vid = vid; 
      Session.set('videoSelected', vid);
    }
  },

  'click .select-video-file' : function(e, t){
    $(t.find('.hidden')).trigger('click');
  },

  // Show a random point in the video.
  'loadedmetadata video' : function(e){
    e.currentTarget.currentTime = e.currentTarget.duration / 3; 
  },

  'click #create-project' : function(e, t){

    if (!Meteor.user()) {
      promptUserLogin(t.vid);
    }

    return false;
  }

});

// Prompt User Login if the user isn't logged in. 
function promptUserLogin(videoObject){
  // We need to store the current VideoObject, and remember
  // that we are in the 'create video' flow. 
  Session.set('overlay', 'loginForm');
  Session.set('videoSource', videoObject);
}

Template.localVideo.destroyed = function(){
  Session.set('videoSelected', null);
}

Template.localVideo.helpers({

  videoSelected : function() {
    return Session.get('videoSelected');
  }

});


Template.viewLibrary.helpers({
  project : function(){
    return Videos.find({}, { sort: ['name', 'asc' ]});
  }
});





})();