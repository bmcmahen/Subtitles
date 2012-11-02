/**
 * CAPTIONS
 */

// Load video
Template.application.helpers({
  currentVideo : function(){
    return Session.get('currentVideo');
  }
});

// Caption Wrapper
Template.captionList.helpers({
  caption : function(){
    return Subtitles.find( {} , { sort: ['startTime', 'asc' ]} )  
  }
});

// "BEGIN CAPTIONING" button
Template.beginProcess.helpers({
  new : function() {
    var count = Subtitles.find({}).count();
    if (count === 0) 
      return true
  }
})

var setSessions = function(start, end, time, sub) {
  Session.set('startTime', start)
  Session.set('endTime', end)
  Session.set('currentTime', time)
  Session.set('currentSub', sub)
}

Template.beginProcess.events({
  
  'click .start-captioning a' : function () {
    var newSub = Subtitles.insert({
      startTime : 0,
      endTime : Session.get('loopDuration'),
      videoId : Session.get('currentVideo'),
      saved : true,
      user : Meteor.userId()
    });

    setSessions(0, Session.get('loopDuration'), 0, newSub)

    Subtitler.videoNode.play(); 
  }
})

// Set height of Div to maximum screen size
Template.captions.rendered = function() {
  var captionList = this.find('#captions');
  captionList.style.height = (window.innerHeight - 210) + 'px'
}

// Helper to set cursor at the end of a textarea's content
function moveCaretToEnd(el) {
    if (typeof el.selectionStart == "number") {
        el.selectionStart = el.selectionEnd = el.value.length;
    } else if (typeof el.createTextRange != "undefined") {
        el.focus();
        var range = el.createTextRange();
        range.collapse(false);
        range.select();
    }
}

Template.captions.preserve(['.captions']);

Template.captions.events({

  'click #insert-new-caption' : function ( e, t ) {
    
    if (Session.get('currentVideo')) {
    
      var currentTime = Session.get('currentTime')
        , endTime = currentTime + Session.get('loopDuration')

      var newSub = Subtitles.insert({
        startTime : currentTime,
        endTime : endTime,
        videoId : Session.get('currentVideo'),
        saved : true,
        user : Meteor.userId()
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

    //XXX This is a bit of a hack
    if (Session.get('silentFocus')) {

      Session.set('silentFocus', false);

      if (Session.get('videoPlaying')) {
        return false
      }

      return;
    };

    if (Subtitler.videoNode)
      Subtitler.videoNode.currentTime =  self.startTime; 
  },

  'keydown textarea' : function(e, t){

    var key = e.which
      , self = this; 

    switch(key) {

      // Return key
      case 13:

        // If a subtitle already exists afterwards, focus on that one
        // instead of creating another. 
        // Threshold is for 1 second after.
        var target = e.currentTarget
          , next = Subtitles.findOne({ 
            startTime :{ $gt : self.endTime, $lt : self.endTime + 1} 
          })

        if (next) {
          setSessions(next.startTime, next.endTime, next.startTime, next._id)
          document.getElementById(next._id).focus()
          return false
        }

        var newStart = self.endTime + 0.01
          , newEnd = newStart + Session.get('loopDuration')
          , sub = Subtitles.insert({
              startTime : newStart,
              endTime : newEnd,
              videoId : Session.get('currentVideo'),
              saved : true,
              user : Meteor.userId()
            })

        setSessions(newStart, newEnd, newStart, sub)


        // Empty? Remove. Else, save.
        if (target.value === '') 
          Subtitles.remove(t.data._id)
        else {
          Subtitles.update(t.data._id, {
            $set : {
              text : target.value, 
              saved : true 
            }}, function(err){
              if (!err) 
                Session.set('saving', 'All Changes Saved.')
              else 
                Session.set('saving', 'Error Saving.')
          })
        }

        return false

      // Delete & Empty : Delete current, return to end of previous.
      case 8:

        if (e.currentTarget.value === '') {

          var textareas = document.querySelectorAll('textarea.caption-text')
            , index = $('#' + t.data._id).closest('tr').index()
          
          Subtitles.remove(t.data._id, function(err){
            if (! err)
              Session.set('saving','All Changes Saved.')
          })

          if (index > 0) {
            moveCaretToEnd(textareas[index -1])
            return false
          }
        }

    }

    if (e.metaKey) {

      switch(key) {
        // Cmd P : Lengthen end time
        case 80:
          var endTime = Session.get('endTime')
          // This should probably be on a timer, like auto-save
          Subtitles.update({_id: this._id}, {$set: {endTime: endTime + 0.5}})
          Session.set('endTime', endTime + 0.5)

          // sync video 1 seconds before new endTime
          var node = Subtitler.videoNode; 
          if (node && node.currentTime) {
            node.currentTime = endTime - 1;
          }

          return false;
    
        // Cmd O : shorten end time
        case 79:
          var endTime = Session.get('endTime')

          if (endTime > Session.get('startTime')) {
            // This should probably be on a timer, too
            Subtitles.update({_id : this._id}, {$set: {endTime: endTime - 0.5}})
            Session.set('endTime', endTime - 0.5)

            var node = Subtitler.videoNode;
            if (node && node.currentTime) {
              node.currentTime = endTime - 1.5;          
            }
          }
          return false;

        // cmd + i : lengthen beginning time
        case 73:
          var startTime = Session.get('startTime')

          Subtitles.update({_id: this._id}, {$set: {startTime: startTime + 0.5}})
          Session.set('startTime', startTime + 0.5)

          var node = Subtitler.videoNode;
          if (node)
            node.currentTime = startTime + 0.5

          return false;

        // cmd + u : shorten beginning time
        case 85:
          var startTime = Session.get('startTime')

          Subtitles.update({_id: this._id}, {$set: {startTime: startTime - 0.5}})
          Session.set('startTime', startTime - 0.5)

          var node = Subtitler.videoNode;
          if (node)
            node.currentTime = startTime - 0.5;

          return false
  
        // cmd + return/enter : insert newline 
        case 13:

          var target = e.currentTarget
            , val = target.value

          target.value = val + '\n'
          t.find('span').textContent = target.value
          return false
      }
    }; // end If MetaKey

  },

  'input textarea' : function( e , t){

      t.span.textContent = t.area.value

      // Save user input after 3 seconds of not typing
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
  var self = this
    , area = this.find('textarea')
    , span = this.find('span')

  span.textContent = area.value

  self.area = area
  self.span = span

  // focus on current subtitle
  if (Session.equals('currentSub', this.data._id))  {
    area.focus(); 
  }
}

Template.saving.helpers({
  saveState: function(){
    return Session.get('saving');
  }
})
