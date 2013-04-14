/**
 * Video View
 */

Template.mainPlayerView.destroyed = function(){
  Session.set('videoPlaying', false);
  delete Subtitler.videoNode;
};

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
      this.videoNode = new Subtitler.VideoElement(url, {
        target: '#main-player-drop'
      });
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
    var vid = Videos.findOne(Session.get('currentVideo'));
    if (vid) return vid.name;
  }
});

// We check to see if we have a videoSource object here,
// and if we do, we construct our video. Vimeo and YouTube seem
// to require that the DOM element is present in order to
// construct the iFrame. With HTML5, we can build it and then
// append it to the DOM.
Template.mainPlayerView.rendered = function(){
  Session.set('videoPlaying', false);
  var vidSource = Videos.findOne(Session.get('currentVideo'));
  createVideo.call(this, vidSource);
};

Template.mainPlayerView.events({

  'click #main-player-drop': function(e){
    $('#video-select-input').trigger('click');
  },

  'dragover .dropzone' : function(e){
      e.preventDefault();
    },

  'dragenter .dropzone' : function(e){
    e.preventDefault();
    $(e.currentTarget).addClass('dragover');
  },

  'dragleave .dropzone' : function(e){
    $(e.currentTarget).removeClass('dragover');
  },

  'change .hidden, drop .dropzone' : function(e, t){
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

    // update the video object with new url.
    Videos.update(Session.get('currentVideo'), { $set : { url : url }});
    Session.set('loadingError', null);
  }
});

Template.mainPlayerView.helpers({
  error: function(){
    return Session.get('loadingError');
  }
});

function createVideo(vidSource){
  var self = this, target;

  if (vidSource && !Session.get('loadingError')) {
    Session.set('loading', true);

    // Establish our target.
    if (vidSource.type === 'youtube'){
      $('#main-player-drop').html('<div id="youtube-player-drop"></div>');
      target = 'youtube-player-drop';
    } else {
      target = 'main-player-drop';
    }

    // Create our Video Node
    var videoNode = new Subtitler.VideoElement(vidSource.url, {
      target: target,
      type: vidSource.type
    });

    // Establish Events
    //
    // When our metaData is received, we can draw the timeline
    // and update the video name.
    videoNode.on('metaDataReceived', function(){
      // We need to update our video document for youtube
      // and vimeo once the metadata has loaded using our
      // data api.
      if (this.isYoutube || this.isVimeo) {
        Videos.update(Session.get('currentVideo'), {$set: {
          name : this.name,
          duration: this.duration
        }});
      }
      // Determine our videoDuration prior to constructing the
      // timeline
      if (this.duration) {
        Session.set('videoDuration', this.duration);
      } else {
        this.getVideoDuration(function(duration){
          Session.set('videoDuration', duration);
        });
      }
      Session.set('loading', null);
    });

    // Primarily for local HTML videos when a page has been
    // reloaded, or loaded from the library, and the blob url
    // has been revoked. In those cases, users must reload the
    // video.
    videoNode.on('loadingError', function(){
      delete Subtitler.videoNode;
      Session.set('loading', null);
      Session.set('loadingError', true);
    });
  }
}

// Canvas Loading Animation
Template.loading.rendered = function(){
  var loading = require('bmcmahen-canvas-loading-animation')
    , spinner = new loading({
        color: '220, 220, 220',
        width: 40,
        height: 40,
        radius: 9,
        dotRadius: 1.8
      });

  var wrapper = this.find('#loading-wrapper');
  if (wrapper) wrapper.appendChild(spinner.canvas);
};
