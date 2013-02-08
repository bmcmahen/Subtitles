/**
 * Subtitle Player Class abstracts video playback for
 * different formats, including embedded HTML 5, Youtube, Vimeo
 * etc.,
 *
 * Best with HTML 5 > YouTube > Vimeo... 
 * 
 */

/*jshint laxcomma:true */

(function(Subtitler, window){

  var Emitter = require('component-emitter');

  // Constructor
  // 
  // src = either a video URL, or Blob URL (if embedding locally)
  // type = either 'youtube' or 'html'
  var VideoElement = function(src, options){
    var options = options || {};

    this.src = src; 
    this.type = options.type || 'html';
    this.target = options.target ? '#' + options.target : '#player';
    this.isReady = false; 

    // If we're embedding a youtube video, use the 
    // following constructor.
    // 
    // NOTE: This actually embeds the youtube video. So if
    // we go to another page, we'll have to use this constructor
    // again. Embeds should be in a separate function.
    if (this.type === 'youtube') {
      // Async load the required script for youtube
      var tag = document.createElement('script');
      tag.src = "//www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // The async callback provided by YouTube
      var self = this; 
      window.onYouTubeIframeAPIReady = function(){
        // Build the iframe
        self.isYoutube = true;
        self.videoNode = new YT.Player(options.target, {
          width: $('.video-dropzone').width(),
          height: '500',
          videoId: self.getId(src),
          playerVars: {
            controls: 0
          }
        });
        self.bindReady(); 
      };
    }

    // If we're embedding an HTML video, use the 
    // following constructor.
    // 
    // Will this work if we supply a regular HTML5 URL
    // instead of constructing the blob url?
    if (this.type === 'html') {
      this.isHTML = true; 
      var el = this.videoNode = document.createElement('video');
      el.setAttribute('id', 'video-display');
      el.src = src;
      this.embedVideo(); 
    }

    // Vimeo embed. 
    if (this.type === 'vimeo') {
      this.isVimeo = true; 
      var iframe = document.createElement('iframe');
      $(iframe).attr({
          src: 'http://player.vimeo.com/video/'+ src +'?api=1',
          frameborder: 0,
          width: '100%',
          height: '350px'
        });
      $(this.target).html(iframe);
      this.videoNode = $f(iframe);
      this.bindReady(); 
    }

    Subtitler.videoNode = this; 

  };

  VideoElement.prototype = new Emitter(); 


  // Functions
  _.extend(VideoElement.prototype, {

    // Events
    
    // Loop the video if need be. 
    // Will this be triggered during 'seeking' with vimeo
    // and youtube?
    onTimeUpdate: function(data){

      if (Subtitler.draggingCursor)
        return;

      var end = Session.get('endTime')
        , duration = Session.get('loopDuration')
        , start = Session.get('startTime');

      var currentTime = data && data.seconds ? +data.seconds : this.getCurrentTime(); 

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

    onPauseOrError: function(){
      Session.set('videoPlaying', false);
      if (this.isYoutube && this.youtubeInterval)
        Meteor.clearInterval(this.youtubeInterval);
    },

    onReady: function(){
      this.isReady = true; 
      this.bindEvents(); 
      this.emit('ready');
    },

    // The youtube api (unfortunately) doesn't have a time update
    // event like the HTML 5 player does. But we can emulate
    // it. When the video is playing, set an interval that calls
    // onTimeUpdate every 300 ms or so. If the video is
    // paused, stopped, or ended, stop the interval. Typically the
    // timeupdate interval fires (i think) at different rates 
    // depending on system load. We'll just stick with a conservative(?) 250. 
    youtubeTimeUpdate: function(stop){
      var update = _.bind(this.onTimeUpdate, this);
      this.youtubeInterval && Meteor.clearInterval(this.youtubeInterval);
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
      else if (this.isVimeo) {
        return this.videoNode.api('getCurrentTime');
      }
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

    getVideoDuration: function(){
      if (this.isYoutube) return this.videoNode.getDuration();
      else if (this.isVimeo) return this.videoNode.api('getDuration');
      else if (this.isHTML) return this.videoNode.duration; 
    },

    // If we want to get the video duration without playing the
    // video (for YouTube) then we need to run this. Sucks.
    getYoutubeMetadata: function(callback){
      var tag = document.createElement('script');
      tag.src = 'http://gdata.youtube.com/feeds/api/videos/'+ this.getId(this.src) + '?v=2&alt=jsonc&callback=youtubeFeedCallback&prettyprint=true';
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      
      window.youtubeFeedCallback = function(json){
        console.log(json);
        callback(json); 
      }
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

    // Thanks to: http://stackoverflow.com/a/9102270/1198166
    getId: function(url){
      var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/;
      var match = url.match(regExp);
      if (match && match[2].length==11){
        return match[2];
      }
    },

    // Embeds an HTML Video into a target DOM element.
    embedVideo: function(target) {
      target && this.setTarget(target);
      $(this.target).html(this.videoNode);
      this.bindReady(); 
      return this;
    },

    // Sync our video with our captions
    // XXX Do I even use this??
    syncCaptions: function(time, options) {
      var end = Session.get('endTime')
        , start = Session.get('startTime')
        , options = options || {};

      options.silence = options.silent || false; 

      if (time > end || time < start) {
        var result = Subtitles.findOne({startTime: {$lte : time}, endTime: {$gte: time}})
        if (result) {
          if (options.silent)
            Session.set('silentFocus', true);
          document.getElementById(result._id).focus(); 
          Session.set('currentSub', result)
        };
      }
    }

  });

  // Expose this class to the world.
  Subtitler.VideoElement = VideoElement; 

})(Subtitler, window);