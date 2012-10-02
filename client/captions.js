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

Template.caption.events({

  'focus textarea' : function(e, t){
    var self = this
    Session.set('startTime', self.startTime)
    Session.set('endTime', self.endTime)
    Session.set('currentSub', self._id)
  },

  'keydown textarea' : function(e, t){

    // if return key is pressed within textarea, interpret as creating a new
    // subtitle, directly after the current one. 
    if (e.which === 13) {

      var newStart = this.endTime + 0.01
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

      return false
    }

    var area = e.currentTarget
      , span = t.find('span')
      span.textContent = area.value
  },

  'click .delete-sub' : function( e, t) {
    Subtitles.remove({ _id: this._id })
  }

})

Template.caption.rendered = function(){
  var area = this.find('textarea')
    , span = this.find('span')

  span.textContent = area.value

  if (Session.equals('currentSub', this.data._id))  {
    console.log(this, area)
    area.focus()
  }
}

