/**
 * CAPTIONS
 */

// Autosave Timer
var saveTimer = function(){
  var timer;
  this.set = function(saveFormCB) {
    timer = Meteor.setTimeout(function() {
      saveFormCB();
    }, 3000);
  };
  this.clear = function() {
    Meteor.clearInterval(timer);
  };
  return this;
}();

// Load video
Template.application.helpers({
  currentVideo : function(){
    return Session.get('currentVideo');
  }
});

// Caption Wrapper
Template.captionList.helpers({
  caption : function(){
    return Subtitles.find( {} , { sort: ['startTime', 'asc' ]} );
  }
});

// "BEGIN CAPTIONING" button
Template.beginProcess.helpers({
  'new' : function() {
    var count = Subtitles.find({}).count();
    if (count === 0) return true;
  }
});

var setSessions = function(start, end, time, sub) {
  Session.set('startTime', start);
  Session.set('endTime', end);
  Session.set('currentTime', time);
  Session.set('currentSub', sub);
};

Template.beginProcess.events({

  'click #start-captioning' : function () {
    var newSub = Subtitles.insert({
      startTime : 0,
      endTime : Session.get('loopDuration'),
      videoId : Session.get('currentVideo'),
      saved : true,
      user : Meteor.userId()
    });

    setSessions(0, Session.get('loopDuration'), 0, newSub);

    if (Subtitler.videoNode) Subtitler.videoNode.playVideo();
    return false;
  }
});


Template.captions.created = function(){
  this.firstRender = true;
};

// Set our caption height and cache our dom elements
// upon first render.
Template.captions.rendered = function() {
  if (this.firstRender) {
    var $list = this.$node = $(this.find('#captions'));

    var setCaptionHeight = function(){
      this.height = $(window).height() - 200;
      $list.height(this.height);
    };

    // On resize, reset our caption box height.
    $(window).on('resize', _.debounce(_.bind(setCaptionHeight, this), 50));
    setCaptionHeight();
    this.firstRender = false;
  } else {
    this.$node.height(this.height);
  }
};

Template.captions.destroyed = function() {
  $(window).off('resize');
};

Template.captions.preserve(['#captions']);

// Helper to set cursor at the end of a textarea's content
function moveCaretToEnd(el) {
  var $el = $(el)
    , value =  $el.val(); //store the value of the element
  $el.focus().val("");
  $el.focus().val(value);
  $el.unbind();
}

Template.captions.preserve(['.captions']);

Template.captions.events({

  'click #insert-new-caption' : function ( e, t ) {
    if (Session.get('currentVideo')) {
      var currentTime = Session.get('currentTime')
        , endTime = currentTime + Session.get('loopDuration')
        , newSub = Subtitles.insert({
            startTime : currentTime,
            endTime : endTime,
            videoId : Session.get('currentVideo'),
            saved : true,
            user : Meteor.userId()
          });
   }
  },

  'click #export-subtitles' : function ( e, t ) {
    var subtitles = Subtitles.find({}).fetch();

    Session.set('loading', true);
    Meteor.call('export', subtitles, function(err, result){
      Session.set('loading', false);
      if (!err)
        Subtitler.utilities.saveAs(result, 'srt');
    });

    return false;
  },

  'click #import-subtitles' : function (e, t) {
      $('#import-subtitles-file').trigger('click');
  },

  'change #import-subtitles-file' : function (e, t) {
    var file = e.currentTarget.files[0]
      , imported = new Subtitler.Imports(file);

    Session.set('loading', true);
    if (imported.type === 'srt') {
      imported.readAsText(function(){
        imported.parseSRT(function(){
          imported.insertSubs();
          Session.set('loading', false);
        });
      });
    } else {
      Session.set('loading', false);
      Session.set('displayMessage', 'File Type not Supported & At this time, only SRT files are supported.');
    }

  },

  'click #hints' : function(e, t) {
    var offset = $(e.currentTarget).offset()
      , $tip = $(t.find('.popover'));
    $tip.css({
      left : offset.left - ($tip.width() / 2) + ($(e.currentTarget).width() / 2)  + 'px',
      top : offset.top + $(e.currentTarget).height() + 20 + 'px'
    }).toggleClass('in');
  }
});

// Save our form by finding documents that are unsaved,
// and then retrieving their values.
function updateForm(){
  Subtitles.find({ saved : false }).forEach(function(sub){
    Subtitles.update(sub._id, {
      $set : { text : $('#'+ sub._id).val(), saved : true }},
      function(err){
        if (err) Session.set('saving', 'Error Saving');
        else Session.set('saving', 'All Changes Saved.');
      });
  });
}

Template.caption.events({

  'focus textarea' : function(e, t){
    Session.set('startTime', this.startTime);
    Session.set('endTime', this.endTime);
    Session.set('currentSub', this._id);

    //XXX This is a bit of a hack
    if (Session.get('silentFocus')) {
      Session.set('silentFocus', false);

      if (Session.get('videoPlaying')) {
        return false;
      }

      return;
    }

    if (!Session.get('videoPlaying') && Subtitler.timeline)
      Subtitler.timeline.updateMarkerPosition(Session.get('startTime'));

    if (Subtitler.videoNode)
      Subtitler.videoNode.seekTo(this.startTime);
  },

  'keydown textarea' : function(e, t){

    var key = e.which
      , self = this;

    switch(key) {

      // Return key
      case 13:

        if (e.metaKey)
          break;

        // If a subtitle already exists afterwards, focus on that one
        // instead of creating another.
        // Threshold is for 1 second after.
        var target = e.currentTarget
          , next = Subtitles.findOne({
              startTime :{ $gt : self.endTime, $lt : self.endTime + 1}
            });

        if (next) {
          setSessions(next.startTime, next.endTime, next.startTime, next._id);
          document.getElementById(next._id).focus();
          return false;
        }

        var newStart = self.endTime + 0.01
          , newEnd = newStart + Session.get('loopDuration')
          , sub = Subtitles.insert({
              startTime : newStart,
              endTime : newEnd,
              videoId : Session.get('currentVideo'),
              saved : true,
              user : Meteor.userId()
            });

        setSessions(newStart, newEnd, newStart, sub);

        // Empty? Remove. Else, save.
        if (!target.value){
          Subtitles.remove(t.data._id);
        } else {
          Subtitles.update(t.data._id, {
            $set : { text : target.value, saved : true }},
            function(err){
              if (!err) Session.set('saving', 'All Changes Saved.');
              else Session.set('saving', 'Error Saving.');
          });
        }

        return false;

      // Delete & Empty : Delete current, return to end of previous.
      case 8:

        if (e.currentTarget.value === '') {

          var textareas = document.querySelectorAll('textarea.caption-text')
            , index = $('#' + t.data._id).closest('tr').index();

           // In IE10, the cursor gets screwed up if there arent any other textareas
           // to focus on. So we need to manually blur it before removing it.
          if (index === 0)
            $(e.currentTarget).blur();

          Subtitles.remove(t.data._id, function(err){
            if (! err)
              Session.set('saving','All Changes Saved.');
          });

          if (index > 0) {
            moveCaretToEnd(textareas[index -1]);
            return false;
          }
        }

    }

    if (e.metaKey) {

      switch(key) {

        // Cmd P : Lengthen end time
        case 80:
          e.preventDefault();
          var endTime = Session.get('endTime')
            , newEnd = endTime + 0.5;

          // This should probably be on a timer, like auto-save
          Subtitles.update({_id: this._id}, {$set: {endTime: newEnd}});
          Session.set('endTime', newEnd);

          // sync video 1 seconds before new endTime
          var node = Subtitler.videoNode;
          if (node && node.getCurrentTime()) {
            node.seekTo(endTime - 1);
          }

          return false;

        // Cmd O : shorten end time
        case 79:
          e.preventDefault();
          var endTime = Session.get('endTime');

          if (endTime > Session.get('startTime')) {
            // This should probably be on a timer, too
            Subtitles.update({_id : this._id}, {$set: {endTime: endTime - 0.5}});
            Session.set('endTime', endTime - 0.5);

            var node = Subtitler.videoNode;
            if (node && node.getCurrentTime()) {
              node.seekTo(endTime - 1.5);
            }
          }
          return false;

        // cmd + i : lengthen beginning time
        case 73:
          e.preventDefault();
          var startTime = Session.get('startTime')
            , newStart = startTime + 0.5;

          Subtitles.update({_id: this._id}, {$set: {startTime: newStart}});
          Session.set('startTime', newStart);
          if (Subtitler.videoNode) Subtitler.videoNode.seekTo(newStart);
          return false;

        // cmd + u : shorten beginning time
        case 85:
          e.preventDefault();
          var startTime = Session.get('startTime')
            , newStart = startTime - 0.5;

          // Ensure non-numbers don't get saved
          if (newStart < 0 || isNaN(newStart)) {
            return false;
          }

          Subtitles.update({_id: this._id}, {$set: {startTime: newStart}});
          Session.set('startTime', newStart);
          if (Subtitler.videoNode) Subtitler.videoNode.seekTo(newStart);
          return false;

        // cmd + return/enter : insert newline
        case 13:
          e.preventDefault();
          var target = e.currentTarget
            , val = target.value;

          target.value = val + '\n';
          t.find('span').textContent = target.value;
          return false;
      }
    }

  },

  'input textarea' : function( e , t){

      t.span.textContent = t.area.value;
      Session.set('saving', 'Saving...');
      // Save user input after 3 seconds of not typing
      saveTimer.clear();

      if (t.data.saved) {
        Subtitles.update(t.data._id, {$set : { saved : false }});
      }

      saveTimer.set(function() {
        updateForm();
     });
  },

  'click .delete-sub' : function( e, t) {
    var self = this;
    t.find('tr').classList.add('deleted');

    // Delay removal of caption so that we can show an animation. This is
    // kinda crappy, but is an important visual indicator.
    Meteor.setTimeout(function () {
      Subtitles.remove({ _id: self._id });
    }, 200);
  }

});

var isValidStartTime = function(num, end) {
    // Ensure non-numbers don't get saved
    if (num < 0 || isNaN(num)) {
      return false;
    }

    if (num >= end) {
      return false;
    }

    return true;
};

function isValidEndTime(num, start) {
  if (num <= start) return false;
  return true;
}


Template.caption.rendered = function(){

  var self = this
    , area = self.area = self.find('textarea')
    , span = self.span = self.find('span');

  // Ensure that all of our text is showing
  span.textContent = area.value;

  // Ensure that focus is on the current subtitle
  if (Session.equals('currentSub', self.data._id))  {
    area.focus();
  }

  // Create slider to adjust startTime and endTime
  // I'm using the jQuery UI slider because I'm lazy and it works. There
  // aren't many great alternatives either.
  var range = self.find('.time-slider');
  $(range).slider({
    range: true,
    step: 0.1,
    min: self.data.startTime - 3,
    max: self.data.endTime + 3,
    values: [self.data.startTime, self.data.endTime],
    change : function(e, ui){
      var text = self.find('textarea').value;
      if (isValidStartTime(ui.values[0], self.data.endTime) && isValidEndTime(ui.values[1], self.data.startTime)) {
        Subtitles.update({_id : self.data._id}, {$set : {startTime : ui.values[0], endTime : ui.values[1], text : text}});
      }
    },
    slide: function(e, ui){
      if (Subtitler.videoNode) {
        var v = ui.value;

        // startTime changed
        if (v === ui.values[0]){
          if (! isValidStartTime(v, self.data.endTime))
            return false;
          Subtitler.videoNode.seekTo(v);
        } else {
          if (! isValidEndTime(v, self.data.startTime))
            return false;
          Subtitler.videoNode.seekTo(ui.value -1.5);
        }

        Session.set('startTime', ui.values[0]);
        Session.set('endTime', ui.values[1]);
      }
    }
  });

};

Template.caption.helpers({
  selected: function(){
    return Session.equals('currentSub', this._id);
  }
});

Template.saving.helpers({
  saveState: function(){
    return Session.get('saving');
  }
});

Template.captions.preserve({
  'textarea[id]' : function (node) { return node.id; }
});
