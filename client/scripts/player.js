/**
 * Subtitle Player Class abstracts video playback for
 * different formats, including embedded HTML 5, Youtube, Vimeo
 * etc.,
 *
 * Best with HTML 5 > YouTube > Vimeo...
 *
 */

/*jshint laxcomma:true */

var Emitter = require('component-emitter');

// Constructor
var VideoElement = function(src, options){
  var options = options || {};

  this.src = src;
  this.type = options.type || 'html';
  this.target = options.target ? '#' + options.target : '#player';
  $('.dropzone').toggleClass('active');
  this.isReady = false;

  // YOUTUBE
  if (this.type === 'youtube') {
    this.isYoutube = true;
    this.target = options.target;
    var self = this;

    if (typeof(YT) === 'undefined') {
      // Async load our youtube api js
      window.onYouTubeIframeAPIReady = function() {
        self.buildYouTubeVideo();
      };
      $.getScript('//www.youtube.com/iframe_api');
    } else {
      this.buildYouTubeVideo();
    }
  }

  // HTML 5
  if (this.type === 'html') {
    this.isHTML = true;
    this.buildHTMLVideo();
  }

  // VIMEO
  if (this.type === 'vimeo') {
    this.isVimeo = true;
    this.buildVimeoVideo();
  }

  Subtitler.videoNode = this;
};

VideoElement.prototype = new Emitter();

// Functions
_.extend(VideoElement.prototype, {

   buildYouTubeVideo: function(){
    var self = this;

    // Build the iframe
    this.videoNode = new YT.Player(this.target, {
      width: $('.video-dropzone').width(),
      height: '300',
      videoId: this.getId(this.src),
      playerVars: {
        controls: 0
      }
    });

    this.bindReady();

    window.youtubeFeedCallback = function(json){
      self.name = json.data.title;
      self.duration = json.data.duration;
      self.emit('metaDataReceived', json);
    };

    $.getScript('http://gdata.youtube.com/feeds/api/videos/'+ this.getId(this.src) + '?v=2&alt=jsonc&callback=youtubeFeedCallback&prettyprint=true');
    return this;
  },

  buildVimeoVideo: function(){
    var self = this
      , iframe = document.createElement('iframe')
      , id = this.getId(this.src);

    $(iframe).attr({
        src: 'http://player.vimeo.com/video/'+ id +'?api=1&player_id=vimeoPlayer',
        frameborder: 0,
        width: '100%',
        height: '300px',
        id: 'vimeoPlayer'
      });
    $(this.target).html(iframe);
    this.videoNode = $f(iframe);
    this.bindReady();

    window.vimeoFeedCallback = function(json){
      self.name = json[0].title;
      self.duration = json[0].duration;
      self.emit('metaDataReceived', json);
    };

    $.getScript('http://vimeo.com/api/v2/video/'+ id +'.json?callback=vimeoFeedCallback');
    return this;
  },

  buildHTMLVideo: function() {
    var el = this.videoNode = document.createElement('video');

    // For backwards compatibility
    if (!this.src){
      _.defer(_.bind(this.onLoadingError, this));
      return;
    }

    $(el)
      .attr({ id: 'video-display', src: this.src })
      .on('error', _.bind(this.onLoadingError, this));

    $(this.target).html(el);
    this.bindReady();
    return this;
  },


  // Events
  //
  // Determine if we should loop.
  onTimeUpdate: function(data){
    if (Subtitler.draggingCursor)
      return;

    var end = Session.get('endTime')
      , duration = Session.get('loopDuration')
      , start = Session.get('startTime')
      , currentTime = data && data.seconds
        ? +data.seconds
        : this.getCurrentTime();

    Session.set('currentTime', currentTime);

    if (!end) {
      Session.set('endTime', currentTime + duration);
      Session.set('startTime', currentTime);
    } else if (Session.get('looping')
        && Session.get('videoPlaying')
        && currentTime > end) {
      this.seekTo(start);
    }
  },

  onPlayback: function(){
    Session.set('videoPlaying', true);
    if (this.isYoutube)
      this.youtubeTimeUpdate();
  },

  onLoadingError: function(){
    this.emit('loadingError');
  },

  onPauseOrError: function(){
    Session.set('videoPlaying', false);
    if (this.isYoutube && this.youtubeInterval)
      Meteor.clearInterval(this.youtubeInterval);
  },

  onReady: function(){
    this.isReady = true;
    this.bindEvents();
    this.emit('ready');
    if (this.isHTML){
      this.emit('metaDataReceived');
    }
  },

  // A YouTube polyfill for timeUpdate.
  youtubeTimeUpdate: function(stop){
    var update = _.bind(this.onTimeUpdate, this);
    if (this.youtubeInterval) Meteor.clearInterval(this.youtubeInterval);
    this.youtubeInterval = Meteor.setInterval(update, 250);
  },

  // Bind our events
  bindEvents: function(){
    var vid = this.videoNode
      , self = this;

    // Youtube Events
    if (this.isYoutube) {
      vid.addEventListener('onStateChange', function(state){
        if (state.data === 1) self.onPlayback();
        if (state.data === 0 || state.data === 2) self.onPauseOrError();
      });
      vid.addEventListener('onError', _.bind(this.onPauseOrError, this));

    // HTML5 Events
    } else if (this.isHTML) {
      vid.addEventListener('playing', _.bind(this.onPlayback, this));
      vid.addEventListener('pause', _.bind(this.onPauseOrError, this));
      vid.addEventListener('error', _.bind(this.onPauseOrError, this));
      vid.addEventListener('timeupdate', _.bind(this.onTimeUpdate, this));

    // Vimeo Events
    } else if (this.isVimeo) {
      vid.addEvent('playProgress', _.bind(this.onTimeUpdate, this));
      vid.addEvent('seek', _.bind(this.onTimeUpdate, this));
      vid.addEvent('play', _.bind(this.onPlayback, this));
      vid.addEvent('pause', _.bind(this.onPauseOrError, this));
      vid.addEvent('finish', _.bind(this.onPauseOrError, this));
    }
  },

  // Bind onReady events with unified onReady function
  bindReady: function(){
    var vid = this.videoNode;
    if (this.isYoutube)
      vid.addEventListener('onReady', _.bind(this.onReady, this));
    else if (this.isHTML)
      vid.addEventListener('loadedmetadata', _.bind(this.onReady, this));
    else if (this.isVimeo)
      vid.addEvent('ready', _.bind(this.onReady, this));
  },

  // Playback Control / State
  getCurrentTime: function(){
    if (this.isYoutube) return this.videoNode.getCurrentTime();
    else if (this.isVimeo) return this.videoNode.api('getCurrentTime');
    else if (this.isHTML) return this.videoNode.currentTime;
  },

  pauseVideo: function(){
    if (this.isYoutube) this.videoNode.pauseVideo();
    else if (this.isVimeo) this.videoNode.api('pause');
    else if (this.isHTML) this.videoNode.pause();
  },

  playVideo: function(){
    if (this.isYoutube) this.videoNode.playVideo();
    else if (this.isVimeo) this.videoNode.api('play');
    else if (this.isHTML) this.videoNode.play();
  },

  // Vimeo's function is async, so for consistency we'll
  // make each function return via callback.
  getVideoDuration: function(callback){
    if (this.isYoutube) callback(this.videoNode.getDuration());
    else if (this.isVimeo) {
      this.videoNode.api('getDuration', function(time){
        callback(time);
      });
    }
    else if (this.isHTML) callback(this.videoNode.duration);
  },

  seekTo: function(number){
    if (this.isYoutube) this.videoNode.seekTo(number);
    else if (this.isVimeo) this.videoNode.api('seekTo', number);
    else if (this.isHTML) this.videoNode.currentTime = number;
  },

  // Vimeo doesn't support it. Firefox doesn't support
  // html5 playback rate.
  setPlaybackRate: function(rate){
    if (this.isYoutube) this.videoNode.setPlaybackRate(rate);
    else if (this.isHTML) this.videoNode.playbackRate = rate;
  },

  setTarget: function(target){
    this.target = target;
    return this;
  },

  getId: function(url){
    // Thanks to: http://stackoverflow.com/a/9102270/1198166
    if (this.isYoutube) {
      var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/
        , match = url.match(regExp);
      if (match && match[2].length==11){
        return match[2];
      }
    }
    if (this.isVimeo) {
      return _.last(url.split('/'));
    }
  },

  // Sync our video with our captions
  syncCaptions: function(time, options) {
    var end = Session.get('endTime')
      , start = Session.get('startTime')
      , options = options || {};

    options.silence = options.silent || false;

    if (time > end || time < start) {
      var result = Subtitles.findOne({startTime: {$lte : time}, endTime: {$gte: time}});
      if (result) {
        if (options.silent)
          Session.set('silentFocus', true);
        document.getElementById(result._id).focus();
        Session.set('currentSub', result);
      }
    }
  }

});

// Expose this class to THE WORLD.
Subtitler.VideoElement = VideoElement;
