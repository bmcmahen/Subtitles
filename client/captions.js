/**
 * CAPTIONS
 */

// Caption Wrapper
Template.captions.helpers({
  caption : function(){
    return Subtitles.find( {} , { sort: ['startTime', 'asc' ]} )  
  }
})

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
        videoId : Session.get('currentVideo')
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

updateForm = function(t){
   Subtitles.update(t.data._id, {$set : {text : t.find('textarea').value}}, function(err){
          if (!err) Session.set('saving', 'All Changes Saved')
          else Sessionset('saving', 'Error Saving.')
        })
}

Template.caption.events({

  'focus textarea' : function(e, t){
    var self = this
    Session.set('startTime', self.startTime)
    Session.set('endTime', self.endTime)
    Session.set('currentSub', self._id)
  },

  'keydown textarea' : function(e, t){


    //cmd + p
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

    //cmd + o
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

      // cmd + i
    if (e.which === 73 && e.metaKey) {
      var startTime = Session.get('startTime')

      Subtitles.update({_id: this._id}, {$set: {startTime: startTime + 0.5}})
      Session.set('startTime', startTime + 0.5)
      return false
    }

    if (e.which === 85 && e.metaKey ) {
      var startTime = Session.get('startTime')

      Subtitles.update({_id: this._id}, {$set: {startTime: startTime - 0.5}})
      Session.set('startTime', startTime - 0.5)
      return false
    }



    // if return key is pressed within textarea, interpret as creating a new
    // subtitle, directly after the current one. 
    if (e.which === 13) {

      var newStart = this.endTime + 0.001
        , newEnd = newStart + Session.get('loopDuration')

      var sub = Subtitles.insert({
        startTime : newStart,
        endTime : newEnd,
        videoId : Session.get('currentVideo')
      })

      Session.set('startTime', newStart)
      Session.set('endTime', newEnd)
      Session.set('currentTime', newStart)
      Session.set('currentSub', sub)

      // if empty when hitting return, remove that caption
      if (e.currentTarget.value === '') Subtitles.remove(t.data._id)

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
      myTimer.set(function() {   
        updateForm(t);  
     });
  },

  'click .delete-sub' : function( e, t) {
    var self = this;
    t.find('li').classList.add('deleted');
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

