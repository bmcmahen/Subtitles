  // New Video Events
Template.newVideo.events({

  'click a.local': function(){
    Session.set('videoSource', 'local');
    Router.navigate('new-project/html');
    return false;
  },

  'click a.youtube': function(){
    Session.set('videoSource', 'youtube');
    Router.navigate('new-project/youtube');
    return false;
  },

  'click a.vimeo' : function(){
    Session.set('videoSource', 'vimeo');
    Router.navigate('new-project/vimeo');
    return false;
  },

  'submit #youtube-project' : function(e, t){
    var url = $(t.find('.url')).val();
    // Ensure we have a URL
    if (!url){
      Session.set('displayMessage', 'Error Creating Project & Please Enter a Valid URL.');
      return false;
    }
    // Instantiate new Youtube Movie
    var vid = { url: url, type: 'youtube' };
    createOrDeferToLogin(vid, 'youtube');
    return false;
  },

  'submit #vimeo-project' : function(e, t){
    var url = $(t.find('.url')).val();
    if (!url){
      Session.set('displayMessage', 'Error Creating Project & Please Enter a Valid URL.');
      return false;
    }
    // Instantiate new Vimeo Movie Project
    var vid = {
      url: url,
      type: 'vimeo'
    };
    createOrDeferToLogin(vid, 'vimeo');
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
      vid.url = url;
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
    if (!t.vid) {
      Session.set('displayMessage', 'Error Creating Project & Please Select a Video File.');
      return false;
    }
    createOrDeferToLogin(t.vid, 'html');
    return false;
  }

});

// Either create our app view, or continue to login
// or registration if not logged in. Add option to caption
// without being logged in?
function createOrDeferToLogin(videoObject, type){
  // We need to store the current VideoObject, and remember
  // that we are in the 'create video' flow.
  if (!Meteor.user()) {
    Session.set('overlay', 'loginForm');
    videoObject.type = type;
    Session.set('createProjectFlow', videoObject);
    Router.navigate('login');
    return;
  }

  console.log(Meteor.userId());

  var newProject = {
    user: Meteor.userId(),
    created: new Date(),
    type: type,
    url : videoObject.url
  };

  if (type === 'html') {
    newProject.name = videoObject.name;
  }

  // actually insert new object into database
  var newVideo = Videos.insert(newProject);
  Router.navigate('project/' + newVideo);

  delete Subtitler.videoNode;
  Session.set('currentVideo', newVideo);
  Session.set('loadingError', null);
  Session.set('currentView', 'app');
  Session.set('overlay', null);
}

Template.localVideo.destroyed = function(){
  Session.set('videoSelected', null);
};

Template.localVideo.helpers({
  videoSelected : function() {
    return Session.get('videoSelected');
  }
});