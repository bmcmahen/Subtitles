
Videos = new Meteor.Collection('videos')

Subtitles = new Meteor.Collection('subtitles')


  // Session variables, reactive
  
  Session.set('looping', true)
  Session.set('loopDuration', 5)
  Session.set('videoPlaying', false)
  Session.set('currentTime', 0)

  Session.set('startTime', null)
  Session.set('endTime', null)

  Session.set('currentVideo', null)
  Session.set('currentSub', null)

  Session.set('isLooping', null)

  Session.set('saving', null)

  // XXX too many global variables -- get namespacing going
  var videoNode, videoFile, loopTime, draggingCursor = false;


/**
 * Subscriptions
 */

Meteor.subscribe('videos')

Meteor.autosubscribe(function () {
  var selectedVideo = Session.get('currentVideo')
  if (selectedVideo) 
    Meteor.subscribe('subtitles', selectedVideo)
})

/**
 * Stats (for Dev purposes)
 */

Template.stats.helpers({
  currentTime: function(){
    return Session.get('currentTime')
  },

  startTime: function(){
    return Session.get('startTime')
  },

  endTime: function(){
    return Session.get('endTime')
  },

  looping: function(){
    return Session.get('looping')
  },

  videoPlaying: function(){
    return Session.get('videoPlaying')
  },

  saving: function() {
    return Session.get('saving')
  }
})

Template.body.helpers({
  currentVideo: function(){
    return Session.get('currentVideo')
  }
})


Template.navigation.events({
 'click #create-new-project' : function( e, t ) {
    var currentVid = Videos.insert({
      creationDate: new Date()
    })
    Session.set('currentVideo', currentVid)
  }
})


/**
 * video
 */

Template.video.events({

  'change #video-input': function(event, template) {

    var URL = window.URL || window.webkitURL

    videoFile = event.currentTarget.files[0]
    videoNode = document.getElementById('video-display')

    var type = videoFile.type
      , fileURL = URL.createObjectURL(videoFile)

      videoNode.src = fileURL



  },

  'timeupdate #video-display': function(e, t){

    // Sync the timeline Bar

    // XXX its a little too much for the browser to handle if 'currentTime' is set, triggering reactive
    // functions. What will need to happen is currentTime should be set once dragging _ends_. 
      if (!draggingCursor) {

          // Determine if looping should occur on Time Update
          var looping = Session.get('looping')
            , playing = Session.get('videoPlaying');

          Session.set('currentTime', videoNode.currentTime)

          // loop the video, if looping true and if currently playing
          // this logic should go into reactive function for efficiency
          if (looping && playing) {
            if (!Session.get('endTime')) {
              var endtime = Session.get('startTime') + Session.get('loopDuration')
              Session.set('endTime', endtime)
            }
            if (videoNode.currentTime > Session.get('endTime')){
              videoNode.currentTime = Session.get('startTime')
            }
          } 
      }
  },

  'loadeddata #video-display':function(e,t){
    syncVideo()
    syncTextareas()
  },

  'seeking #video-display': function(e,t){
    console.log('seeking')
  },

  'playing #video-display': function(e,t){
    Session.set('videoPlaying', true)
  },

  'pause, ended, error #video-display': function(e,t){
    Session.set('videoPlaying', false)
  }
})


/**
 * REACTIVE
 * [syncVideo automatically syncs video currentTime to 'startTime' session var]
 * @return {[none]} 
 */
var syncVideo = function () {
  var update = function () {
    var ctx = new Meteor.deps.Context();  // invalidation context
    ctx.onInvalidate(update);             // rerun update() on invalidation
    ctx.run(function () {
      var startTime = Session.get("startTime")
      if (videoNode && startTime != null)
        videoNode.currentTime = startTime
    });
  };
  update();
};

// as the video plays, highlight position of corresponding caption
var syncTextareas = function(){

  var update = function() {

    var ctx = new Meteor.deps.Context()
      , startTime = Session.get('startTime')
      , endTime = Session.get('endTime')

      var round = function(int) {
        return Math.round(int * 1000) / 1000
      }

    ctx.onInvalidate(update)

    ctx.run(function(){

      var currentTime = Session.get('currentTime')

      if (currentTime >= endTime || currentTime <= startTime) {
        var sub = Subtitles.findOne({startTime: {$lte : currentTime}, endTime: {$gte: currentTime}})
        if (sub) {
          Session.set('currentSub', sub._id)
          // Session.set('startTime', sub.startTime)
          // Session.set('endTime', sub.endTime)
          console.log('SUB', sub)        
       } 
      }
    })
  }
  update()
}