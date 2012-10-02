// // TO DO:
// // (1) Implement Parser for SRT file on the server-side (http://stackoverflow.com/questions/2496710/nodejs-write-to-file)
// // (2) Implement auto-save, textfield auto-resize
// // (3) Support using 'return' to skip to next time period
// // (4) Allow skimming of video, and auto-selection of inputs based on time.
// // (5) Support an 'outlined' box of a subtitle input, which if clicked, will create 
// //      a subtitle at that particular point. That way, you could skim to 20 min, and 
// //      then hit the 'create subtitle' box, which would insert a subtitle at that point.

// /**
//  * When the user selects a subtitle, automatically set the startTime and endTime
//  * (from the array) and set video to play back accordingly, and loop. 
//  *
//  * if the user presses return in a subtitle box, create a new subtitle with startTime
//  * = endTime, + endTime and loop duration. 
//  *
//  * Question: How do I handle insertion of embedded captions? Sorting of captions?
//  */

// Session.set('currentSubtitles', null)
// Session.set('videoElement', null)
// Session.set('selectedSubtitle', null)

// Session.set('looping', true)
// Session.set('loopDuration', 3)

// Session.set('startTime', null)
// Session.set('endTime', null)
// Session.set('currentTime', null)


// /**
//  * Controls
//  */

// Template.controls.helpers({

//   looping: function(){
//     return Session.get('looping')
//   },

//   loopDuration: function(){
//     return Session.get('loopDuration')
//   },

//   startTime: function(){
//     return Session.get('startTime')
//   },

//   endTime: function(){
//     return Session.get('endTime')
//   }

// })

// Template.controls.events({
//   'click #loop-checked': function(e, t){
//     e.currentTarget.checked ? Session.set('looping', true) : Session.set('looping', false)
//   },

//   'keyup #loop-duration-input':function(e,t){
//     Session.set('loopDuration', e.currentTarget.value)
//   }
// })

// /**
//  * Video
//  */

// Template.video.events({

//   'change #video-input': function(event, template) {

//     var URL = window.URL || window.webkitURL

//     var file = event.currentTarget.files[0]
//       , type = file.type
//       , videoNode = document.getElementById('video-display')
//       , fileURL = URL.createObjectURL(file)

//       videoNode.src = fileURL
//       Session.set('videoElement', videoNode)
//   },

//   'timeupdate #video-display': function(e, t){

//     var video = Session.get('videoElement')
//     var looping = Session.get('looping')
//     var playing = Session.get('videoPlaying')

//     Session.set('currentTime', video.currentTime)

//     if (looping && playing) {
//       if (e.currentTarget.currentTime > Session.get('endTime')){
//         video.currentTime = Session.get('startTime')
//       }
//     } else {

//     }


//   },

//   'loadeddata #video-display':function(e,t){
//     var file = document.getElementById('video-input').files[0]
//     var subtitle = Subtitles.insert(
//       {
//         name: file.name,
//         subtitles: [
//           {startTime: 0, endTime: 5, text: '', _id: Meteor.uuid()}
//         ]
//     })

//     Session.set('currentSubtitles', subtitle)
//     Session.set('startTime', 0)
//     Session.set('endTime', 5)

//     var video = Session.get('videoElement')
//     syncVideo()
//     syncTextareas()
//   },

//   'seeking #video-display': function(e,t){
//     var video = Session.get('videoElement')
//   },

//   'playing #video-display': function(e,t){
//     Session.set('videoPlaying', true)
//   },

//   'pause, ended, error #video-display': function(e,t){
//     Session.set('videoPlaying', false)
//     console.log('stopped, paused, ended')
//   }
// })

// /**
//  * Captions
//  */

// Template.caption.helpers({
//   currentClass: function(){
//     var self = this
//     if (Session.equals('selectedSubtitle', self._id)) {
//       return 'selected'
//     }
//   }
// })
// Template.captions.helpers({

//   caption : function(t){
//     var sub = Subtitles.findOne(Session.get('currentSubtitles'))
//     if (sub) return sub.subtitles
//   }

// })


// Template.captions.events({
//   'focus textarea': function(e, t){
//     var self = this
//     Session.set('startTime', self.startTime)
//     Session.set('endTime', self.endTime)
//     Session.set('currentTime', self.startTime)
//   },

//   'click #add-new-caption': function(e,t){
//     var endTime = Session.get('endTime') + 5

//     Subtitles.update(Session.get('currentSubtitles'), {$push: {
//       subtitles: {
//         _id: Meteor.uuid(),
//         startTime: Session.get('endTime'),
//         endTime: endTime
//       }
//     }})
//   }
// })

// /**
//  * REACTIVE
//  * [syncVideo automatically syncs video currentTime to 'startTime' session var]
//  * @return {[none]} 
//  */
// var syncVideo = function () {
//   var update = function () {
//     var ctx = new Meteor.deps.Context();  // invalidation context
//     ctx.onInvalidate(update);             // rerun update() on invalidation
//     ctx.run(function () {
//       var startTime = Session.get("startTime")
//       var video = Session.get('videoElement')
//       video.currentTime = startTime
//     });
//   };
//   update();
// };

// /**
//  * REACTIVE - is this even necessary?
//  * [syncTextareas focuses textarea associated with current position of video]
//  * @return {[type]} [description]
//  * This needs to be much, much more efficient. Shouldn't do a find every time. 
//  */
// var syncTextareas = function(){

//   var video = Session.get('videoElement')

//   var update = function(){

//     var subArray = Subtitles.findOne(Session.get('currentSubtitles')).subtitles
//     var ctx = new Meteor.deps.Context();
//     ctx.onInvalidate(update);
//     console.log('update')
//     ctx.run(function(){

//       var currentTime = Session.get('currentTime')
//         , startTime = Session.get('startTime')
//         , endTime = Session.get('endTime')

//       console.log('run', currentTime, startTime, endTime)

//         if ((currentTime <= startTime || currentTime >= endTime) || typeof startTime === 'null') {

//           console.log('im in!')
//             var arrayLength = subArray.length

//             loop:
//             for (i = 0; i < arrayLength; i++) {

//               var item = subArray[i]

//               console.log(currentTime, item.startTime, item.endTime)
//               if (currentTime >= item.startTime && currentTime <= item.endTime) {
//                 console.log('selected', item._id, item.startTime, item.endTime)
//                 Session.set('selectedSubtitle',  item._id)
//                 Session.set('startTime', item.startTime)
//                 Session.set('endTime', item.endTime)
//                break loop;
//               } 
//             }
//         }

//     })
//   }

//   update()
  
// }




