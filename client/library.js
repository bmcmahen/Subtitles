(function(){

// Select new Project Flow

var selectProject = function() {
  console.log(this);
  Session.set('videoURL', null);
  Session.set('currentVideo', this._id);
};


// Determines which formats this browser can play. 

var supportedFormats = function(){
  var mpeg4
    , h264
    , ogg
    , webm
    , compatibleTypes = []
    , testVideo = document.createElement('video');

  if (testVideo.canPlayType) {

    // H264
    h264 = "" !== ( testVideo.canPlayType( 'video/mp4; codecs="avc1.42E01E"' )
    || testVideo.canPlayType( 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"' ) );
    if (h264) compatibleTypes.push('video/mp4');

    // Check for Ogg support
    ogg = "" !== testVideo.canPlayType( 'video/ogg; codecs="theora"' );
    if (ogg) compatibleTypes.push('video/ogg');

    // Check for Webm support
    webm = "" !== testVideo.canPlayType( 'video/webm; codecs="vp8, vorbis"' );
    if (webm) compatibleTypes.push('video/webm');
  }
  return compatibleTypes;
};

// Determines if supplied video-type is compatible with browser.

var canPlayVideo = function(type) {
 var types = supportedFormats(); 
  if (_.contains(types, type))
    return true
  else
    return false
};

// Creates a Video URL and alerts the user if file type is not supported.

var createVideoURL = function(file) {
  var URL = window.URL || window.webkitURL;

  if (! URL) {
    Session.set('displayMessage', 'Error Loading File & Your web browser does not support loading local files.');
    return false
  }

  var type = file.type
    , fileURL = URL.createObjectURL(file);

  if (canPlayVideo(type))
    return fileURL
  else {
    var supportedString = supportedFormats().join(', '); 
    new ui.Dialog({ title: 'Unsupported Video Format' , message:  'Please select a video file encoded in a supported format. Your browser supports ' + supportedString + '.' })
      .show()
      .effect('scale')
      .closable(); 
  }

  return false
};


Template.library.events({
  'change #video-file' : function(e, t) {
    var self = t
      , videoFile = e.currentTarget.files[0];

    var fileURL = createVideoURL(videoFile);

    if (fileURL) {

      self.fileURL = fileURL; 

      // replace contents of dropzone with video
      var dropzone = self.find('#dropzone')
        , vid = document.createElement('video');

       while(dropzone.hasChildNodes()) {
          dropzone.removeChild(dropzone.lastChild);
        }
        dropzone.appendChild(vid);

      
      vid.src = fileURL; 
      self.videoNode = vid; 

    }
  },

  'loadedmetadata video' : function(e, t) {
    t.videoNode.currentTime = t.videoNode.duration / 3; 
  },

  'click #create-project' : function(e, t) {
    var self = t; 
    if (! self.fileURL) {
      Session.set('displayMessage', 'Error Creating Project & Please select a video file from your hard disk.')
      return false
    }

    var duration = self.videoNode.duration;
    var name = t.find('#project-name').value;

    if (!name || name === '') {
      Session.set('displayMessage', 'Error Creating Project & Please provide a project name.');
      return false; 
    }

    var newProject = Videos.insert({
      user : Meteor.userId(),
      name : name,
      duration : duration
    });

    Session.set('videoURL', self.fileURL);
    Session.set('currentVideo', newProject);
    Session.set('currentView', 'third');
    Router.navigate('project/' + newProject);
    return false
  },


  'click .dropzone' : function(e, t) {
    $('#video-file').trigger('click');
  },

  'click .file-list a.project-name' : function(e, t) {
    selectProject.call(this);
    return false;
  },

  'click .file-list td.delete-project' : function(e, t) {
    var self = this; 
    new ui.Confirmation(
      { title: 'Delete Project',
        message: 'Are you sure you want to delete ' + self.name + '?' 
      }).ok('Delete')
        .cancel('Cancel')
        .effect('scale')
        .show(function(ok){
          if (ok) {
            Videos.remove(self._id);
            Session.set('displayMessage', 'Project Deleted & ' + self.name + ' deleted.');
          } 
        });
    return false; 
  }
})

Template.library.helpers({
  project : function(){
    return Videos.find({});
  }
});

Template.projectList.helpers({
  clicked : function() {
    if (Session.equals('currentVideo', this._id))
      return 'selected'
  }
});

Template.projectList.preserve(['.select-video-file']);

Template.projectList.events({

  'change .video-select' : function(e, t) {
    if (e.currentTarget.files) {
      var file = e.currentTarget.files[0];
      if (file) {
        var URL = createVideoURL(file);
        if (URL) {
          Session.set('videoURL', URL);
          Session.set('currentView', 'third');
          Router.navigate('project/' + Session.get('currentVideo'));
        }
      }
    }
  },

  // because you can't really style file inputs
  'click .select-video-file' : function(e, t) {
    var vid = t.find('input.video-select');
    $(vid).trigger('click');
  }

})


})();