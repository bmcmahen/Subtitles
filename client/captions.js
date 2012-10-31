/**
 * CAPTIONS
 */

// Load video

Template.application.helpers({
  currentVideo : function(){
    return Session.get('currentVideo');
  }
})

// Caption Wrapper
Template.captions.helpers({
  caption : function(){
    return Subtitles.find( {} , { sort: ['startTime', 'asc' ]} )  
  }
})

Template.captions.rendered = function() {
  var self = this; 
  var captionList = self.find('#captions');
  captionList.style.height = (window.innerHeight - 210) + 'px'
}



Template.captions.events({

  'click #insert-new-caption' : function ( e, t ) {
    // This should be made more flexible. Potentially allow the user to type
    // until they want to skip to the next one, and then enter an 'endTime'
    // Currently just made for looping option. 
    
    if (Session.get('currentVideo')) {
    
      var currentTime = Session.get('currentTime')
        , endTime = currentTime + Session.get('loopDuration')

      var newSub = Subtitles.insert({
        startTime : currentTime,
        endTime : endTime,
        videoId : Session.get('currentVideo'),
        saved : true
      })

   }
  },

  'click #export-subtitles' : function ( e, t ) {
    Meteor.call('export', Session.get('currentVideo'), function(error, result){
      if (error) console.log(error)
      console.log(result)
    })
  }
})


// Each individual Caption node
Template.caption.helpers({

  currentClass: function(){
    return Session.equals('currentSub', this._id) ?  'selected' : ''
  }

})

var updateForm = function(t){

  var subsToSave = Subtitles.find({ saved : false }).fetch(); 

  _.each(subsToSave, function(sub) {
    var content = document.getElementById(sub._id)
    Subtitles.update(sub._id, {$set : {text : content.value, saved : true }}, function(err){
      if (!err) 
        Session.set('saving', 'All Changes Saved.')
      else
        Session.set('saving', 'Error Saving.')
    })
  })
}

Template.caption.events({

  'focus textarea' : function(e, t){

    var self = this;
    Session.set('startTime', self.startTime)
    Session.set('endTime', self.endTime)
    Session.set('currentSub', self._id)

    //XXX This is a bit of a hack
    if (Session.get('silentFocus')) {

      Session.set('silentFocus', false);

      if (Session.get('videoPlaying')) {
        return false
      }

      return;
    };

    if (Session.get('videoURL'))
      Subtitler.videoNode.currentTime = self.startTime; 
  },

  'keydown textarea' : function(e, t){

    var self = this; 

    // XXX Turn this into a Switch statement?

    // delete + empty? : return to end of previous, delete current.
    if (e.which === 8) {
      var textNode = e.currentTarget;
      if (textNode.value === '') {
        Subtitles.remove(t.data._id)

        // There should be a better way to do this!
        var textareas = document.getElementsByTagName('textarea')
          , totalAreas = textareas.length

        var toFocus = textareas[totalAreas - 2];
        if (typeof toFocus != 'undefined') {
          textareas[totalAreas - 2].focus();
          return false 
        }
      }
    }

    //cmd + p : lengthen end time
    if (e.which === 80 && e.metaKey) {
      var endTime = Session.get('endTime')
      // This should probably be on a timer, like auto-save
      Subtitles.update({_id: this._id}, {$set: {endTime: endTime + 0.5}})
      Session.set('endTime', endTime + 0.5)

      // sync video 2 seconds before new endTime 
      if (typeof videoNode != 'undefined') {
        videoNode.currentTime = endTime - 1;
      }
      return false
    }

    //cmd + o : shorten end time
    if (e.which === 79 && e.metaKey){
      var endTime = Session.get('endTime')

      if (endTime > Session.get('startTime')) {
        // This should probably be on a timer, too
        Subtitles.update({_id : this._id}, {$set: {endTime: endTime - 0.5}})
        Session.set('endTime', endTime - 0.5)

        if (typeof videoNode != 'undefined') {
          videoNode.currentTime = endTime - 1.5;          
        }
      }
      return false
    }

    // cmd + return/enter : insert newline
    
    if (e.which === 13 && e.metaKey) {
      var currentInput = e.currentTarget.value
      e.currentTarget.value = currentInput + '\n'
      t.find('span').textContent = e.currentTarget.value
      return false
    }

    // cmd + i : lengthen beginning time
    if (e.which === 73 && e.metaKey) {
      var startTime = Session.get('startTime')

      Subtitles.update({_id: this._id}, {$set: {startTime: startTime + 0.5}})
      Session.set('startTime', startTime + 0.5)
      return false
    }

    // cmd + u : shorten beginning time
    if (e.which === 85 && e.metaKey ) {
      var startTime = Session.get('startTime')

      Subtitles.update({_id: this._id}, {$set: {startTime: startTime - 0.5}})
      Session.set('startTime', startTime - 0.5)
      return false
    }


    // if return key is pressed within textarea, interpret as creating a new
    // subtitle, directly after the current one. 
    if (e.which === 13) {

      // If a subtitle already exists afterwards, focus on that one
      // instead of creating another. 
      // Threshold is for 1 second after.
      
      var followingCaption = Subtitles.findOne({ 
        startTime :{ $gt : self.endTime, $lt : self.endTime + 1} 
      })

      if (followingCaption) {
        Session.set('startTime', followingCaption.startTime)
        Session.set('endTime', followingCaption.endTime)
        Session.set('currentTime', followingCaption.startTime)
        Session.set('currentSub', followingCaption._id)
        return false
      }

      var newStart = self.endTime + 0.01
        , newEnd = newStart + Session.get('loopDuration')

      var sub = Subtitles.insert({
        startTime : newStart,
        endTime : newEnd,
        videoId : Session.get('currentVideo'),
        saved : true
      })

      Session.set('startTime', newStart)
      Session.set('endTime', newEnd)
      Session.set('currentTime', newStart)
      Session.set('currentSub', sub)

      // if empty when hitting return, remove that caption
      // if not empty, then save it.
      if (e.currentTarget.value === '') Subtitles.remove(t.data._id)
      else {
        Subtitles.update(t.data._id, {$set : {text : e.currentTarget.value, saved : true }}, function(err){
          if (!err) Session.set('saving', 'All Changes Saved.')
          else Session.set('saving', 'Error Saving.')
        })
      }
      return false
    }
  },

  'input textarea' : function( e , t){
    // expand input area as user types
    var area = e.currentTarget
      ,  span = t.find('span')

      span.textContent = area.value

      // Save the user input after 3 seconds of inactivity typing
      Session.set('saving', 'Saving...')
      myTimer.clear()

      if (t.data.saved === true)
        Subtitles.update(t.data._id, {$set : { saved : false }})

      myTimer.set(function() {   
        updateForm();  
     });
  },

  'click .delete-sub' : function( e, t) {
    var self = this;
    t.find('tr').classList.add('deleted');
    Meteor.setTimeout(function () {
      Subtitles.remove({ _id: self._id })
    }, 200); 
  }

})

Template.caption.rendered = function(){
  // set input height to height of text content upon first render
  var area = this.find('textarea')
    , span = this.find('span')

  span.textContent = area.value

  // focus on current subtitle
  if (Session.equals('currentSub', this.data._id))  {
    area.focus(); 
  }
}


