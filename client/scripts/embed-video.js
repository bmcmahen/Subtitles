  /**
   * Class for creating a video element from file
   *
   * General Use:
   *
   * var vid = new Subtitler.embedVideo(filelist);
   * var url = vid.createVideoUrl()
   * if (url) vid.embedVideo('#target');
   */

  var Video = Subtitler.Video = function(filelist, options) {
    this.filelist = filelist || null;

    if (filelist) {
      this.file = filelist[0];
      this.type = this.file.type;
      this.name = this.file.name;
      this.fileURL = null;
    }

  };

  _.extend(Video.prototype, {

    createVideoUrl : function() {
      var self = this
        , URL = window.URL || window.webkitURL
        , file = self.file;

      if (! URL) {
        Session.set('displayMessage',
          'Error Loading File & Your web browser does not support loading local files.');
        return false;
      }

      if (typeof URL.createObjectURL === 'undefined') {
        Session.set('displayMessage',
          'Error Loading File & Your web browser does not support this feature.');
          return false;
      }

      var fileURL = self.fileURL = URL.createObjectURL(file);

      if (self.canPlayVideo(self.type))
        return fileURL;
      else {
        $('#myModal').addClass('in');
      }
    },

    canPlayVideo : function(type) {
      var self = this
        , type = type || this.type;

      return _.contains(self.supportedFormats(), type) ? true : false;

    },

    supportedFormats : function() {
      var self = this
        , mpeg4
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
      self.supportedFormats = compatibleTypes;
      return compatibleTypes;
    },

    embedVideo : function(target, options) {
      var self = this
        , options = options || {};

      if (options.projectName) {
        var pname = document.querySelector(options.projectName);
        if (pname.value === '') {
          pname.value = self.name;
        }
      }

      if (self.fileURL) {
        var videoElement = document.createElement('video');
        $(target).html(videoElement);
        videoElement.src = self.fileURL;
      }

    }
  });