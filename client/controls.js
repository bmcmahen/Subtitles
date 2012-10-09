/**
 * Controls
 */

Template.controls.events({

  'click #loop-checked': function(e,t){
    e.currentTarget.checked ? Session.set('looping', true) : Session.set('looping', false)
    // set startTime & endTime to null
    // if (e.currentTarget.checked) {
    //   Session.set( 'startTime', null )
    //   Session.set( 'endTime', null )
    // } else {
    //   Session.set('startTime', Session.get('currentTime'))
    //   Session.set('endTime', Session.get('currentTime') + Session.get('loopDuration'))
    // }
  },

  'keyup #loop-duration-input': function (e, t) {
    var input = e.currentTarget.value

    function isNumber(o) {
      return ! isNaN (o-0)
    }

    if (isNumber(input) && input != '') {
      console.log(input)
      Session.set('loopDuration', input)
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
