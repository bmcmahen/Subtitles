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

// Determines if supplied video-type is 
// compatible with browser.
var canPlayVideo = function(type) {
 var types = supportedFormats(); 
  if (_.contains(types, type))
    return true
  else
    return false
};

// Creates a Video URL and alerts the user 
// if file type is not supported.
var createVideoURL = function(file) {
  var URL = window.URL || window.webkitURL;

  if (! URL) {
    Session.set('displayMessage', 
      'Error Loading File & Your web browser does not support loading local files.');
    return false
  }

  var type = file.type
    , fileURL = URL.createObjectURL(file);

  if (canPlayVideo(type))
    return fileURL
  else {
    var supportedString = supportedFormats().join(', '); 
    new ui.Dialog({ 
      title: 'Unsupported Video Format', 
      message:  'Please select a video file encoded in a supported format. Your browser supports ' + supportedString + '.' 
    })
      .show()
      .effect('scale')
      .closable(); 
  }

  return false
};

/**
 * [embedVideo takes a supplied template and video file and embeds it into the #dropzone id]
 * @param  {[object]} t   [template data]
 * @param  {[file]} vid [presumably a video file]
 */

var embedVideo = function(t, vid) {
  var projectName = t.find('#project-name')
    , fileURL = createVideoURL(vid);

  if (projectName.value === '') 
    projectName.value = vid.name;

  if (fileURL) { 

    t.fileURL = fileURL;

    var dropzone = document.getElementById('dropzone')
      , vidDom = document.createElement('video');

    $(dropzone).html(vidDom);

    vidDom.src = fileURL;
  }
}

Template.library.rendered = function(){
  $('#myCarousel').carousel('pause'); 
}


Template.library.events({

  'change #video-file, drop #dropzone' : function(e, t) {
    e.preventDefault(); 
    var files = e.currentTarget.files || e.dataTransfer.files
      , file = files[0]

    embedVideo(t, file);
  },

  'loadedmetadata #dropzone video' : function(e, t) {
    e.currentTarget.currentTime = e.currentTarget.duration / 3; 
    this.videoNode = e.currentTarget;
  },

  'click #create-project' : function(e, t) {
    var self = t; 
    if (! self.fileURL) {
      Session.set('displayMessage', 'Error Creating Project & Please select a video file from your hard disk.')
      return false
    }

    console.log(self)

    var duration = t.find('#dropzone video').duration
      , name = t.find('#project-name').value;

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

  'click a.project-name' : function(e, t) {
    var self = this; 
    var i = $(e.currentTarget).closest('li').index();
    $('#myCarousel').carousel(i + 1);

     Meteor.setTimeout(function () {
      selectProject.call(self);
    }, 1000); 

    return false;
  }
})

Template.library.helpers({
  project : function(){
    return Videos.find({});
  }
});

Template.projectSubmenu.events({

  'change .video-select, drop .select-video-file' : function(e, t) {

    e.preventDefault();

    var fileList = e.currentTarget.files || e.dataTransfer.files
      , file = fileList[0]
      , url = createVideoURL(file);

    if (url) {
      Session.set('videoURL', url);
      Session.set('currentView', 'third');
      Router.navigate('project/' + Session.get('currentVideo'));
    }

  },

  'click .select-video-file .select' : function(e, t) {

    var vid = t.find('input.video-select');
    $(vid).trigger('click');

  },

  'click button.delete-sub' : function(e, t) {

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
            $('#myCarousel').carousel(0);
          } 
        });
    return false; 
  },

  'click button.go-back' : function(e, t) {
    $('#myCarousel').carousel(0);
  }

});


})();