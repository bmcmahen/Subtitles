// Try creating a separate Collection of subtitles (from the video) and then do
// a findOne on that collection to see if it's more efficient. Upon finding an element,
// get the end-time of that element. Then, if the currentTime > endTime, perform
// another search. 

(function(){
  
  // Session variables, reactive
  
  Session.set('looping', true)
  Session.set('loopDuration', 5)
  Session.set('videoPlaying', false)
  Session.set('currentTime', 0)

  Session.set('startTime', null)
  Session.set('endTime', null)

  Session.set('currentVideo', null)
  Session.set('currentSub', null)

  var videoNode, videoFile, loopTime

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

    var looping = Session.get('looping')
      , playing = Session.get('videoPlaying')

    Session.set('currentTime', videoNode.currentTime)

    // loop the video, if looping true and if currently playing
    if (looping && playing) {
      if (!Session.get('endTime')) {
        var endtime = Session.get('startTime') + Session.get('loopDuration')
        Session.set('endTime', endtime)
      }
      if (videoNode.currentTime > Session.get('endTime')){
        videoNode.currentTime = Session.get('startTime')
      }
    } 
  },

  'loadeddata #video-display':function(e,t){
    syncVideo()
  },

  'seeking #video-display': function(e,t){
  },

  'playing #video-display': function(e,t){
    Session.set('videoPlaying', true)
  },

  'pause, ended, error #video-display': function(e,t){
    Session.set('videoPlaying', false)
  }
})

/**
 * Controls
 */

Template.controls.events({
  'click #loop-checked': function(e,t){
    e.currentTarget.checked ? Session.set('looping', true) : Session.set('looping', false)
    // set startTime & endTime to null
    if (!e.currentTarget.checked) {
      Session.set('startTime', null)
      Session.set('endTime', null)
    } else {
      Session.set('startTime', Session.get('currentTime'))
      Session.set('endTime', Session.get('currentTime') + Session.get('loopDuration'))
    }
  },

  'keyup #loop-duration-input': function (e, t) {
    var input = e.currentTarget.value
    if (typeof input === 'number') {
      console.log('input', input)
      Session.set('loopDuration', e.currentTarget.value)
    }
  }
})

Template.controls.helpers({

  looping: function(){
    return Session.get('looping')
  },

  loopDuration: function(){
    return Session.get('loopDuration')
  }

})

/**
 * Captions
 */

Template.caption.helpers({
  currentClass: function(){
    return Session.equals('selectedSubtitle', this._id) ?  'selected' : ''
  }
})

Template.captions.helpers({

  caption : function(){
    var currentVid = Videos.findOne(Session.get('currentVideo'))
    var subs = currentVid ? currentVid.subtitles : null
    if (subs)
      return Subtitles.find({ _id: { $in : subs }}, {sort: ['startTime', 'asc']})
  }
})

Template.caption.events({

  'focus textarea' : function(e, t){
    var self = this
    Session.set('startTime', self.startTime)
    Session.set('endTime', self.endTime)
  },

  'keydown textarea' : function(e, t){

    // if return key is pressed within textarea, interpret as creating a new
    // subtitle, directly after the current one. 
    if (e.which === 13) {

      var newStart = this.endTime + 0.01
      var newEnd = newStart + Session.get('loopDuration')
      var sub = Subtitles.insert({
        startTime : newStart,
        endTime : newEnd
      })

      Videos.update(Session.get('currentVideo'), { $push: { subtitles: sub }})

      Session.set('startTime', newStart)
      Session.set('endTime', newEnd)
      Session.set('currentTime', newStart)
      Session.set('currentSub', sub)

      return false
    }

    var area = e.currentTarget
      , span = t.find('span')
      span.textContent = area.value
  },

  'click .delete-sub' : function( e, t) {

    var self = this

    console.log(self)

    Videos.update(Session.get('currentVideo'), { $pull : { subtitles : self._id }})
    Subtitles.remove({ _id: self._id })
  }

})

Template.caption.rendered = function(e, t){
  var area = this.find('textarea')
    , span = this.find('span')

  span.textContent = area.value

  console.log(this, Session.get('currentSub'))

  if (Session.equals('currentSub', this.data._id))  {
    console.log(this, area)
    area.focus()
  }
}

Template.captions.events({

  'click #create-new-project' : function( e, t ) {

    var currentVid = Videos.insert({
      creationDate: new Date()
    })

    Session.set('currentVideo', currentVid)
  },

  'click #insert-new-caption' : function ( e, t ) {
    // This should be made more flexible. Potentially allow the user to type
    // until they want to skip to the next one, and then enter an 'endTime'
    // Currently just made for looping option. 
    
    var currentTime = Session.get('currentTime')
      , endTime = currentTime + Session.get('loopDuration')

    var newSub = Subtitles.insert({
      startTime : currentTime,
      endTime: endTime
    })

    Videos.update(Session.get('currentVideo'), {$push : { subtitles : newSub }})
  },

  'click #export-subtitles' : function ( e, t ) {
    console.log('export clicked')
    console.log(Session.get('currentVideo'))
    Meteor.call('export', Session.get('currentVideo'), function(error, result){
      if (error) console.log(error)
      console.log(result)
    })
  }
})

Template.controls.preserve(['#loop-duration-input'])

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
      if (videoNode && startTime)
        videoNode.currentTime = startTime
    });
  };
  update();
};

// var syncTextareas = function(){

//   var update = function() {

//     var ctx = new Meteor.deps.Context()
//       , startTime = Session.get('startTime')
//       , endTime = Session.get('endTime')

//     ctx.onInvalidate(update)

//     ctx.run(function(){
//       var currentTime = Session.get('currentTime')
//       if (currentTime >= endTime || currentTime <= startTime) {
//         var sub = Subtitles.findOne({startTime: {$lte : currentTime}, endTime: {$gte: currentTime}})
//         if (sub) Session.set('currentSub', sub._id)
//         else Session.set('currentSub', null)
//       }
//     })
//   }
//   update()
// }

})()