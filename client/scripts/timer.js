/**
 * Timer for saving
 */

// XXX This is a global variable! And I should be using the Meteor timers!

var myTimer = function(){
  var timer;

  this.nodes = []

  this.set = function(saveFormCB) {
    timer = Meteor.setTimeout(function() {
      saveFormCB()
    }, 3000)
  };

  this.clear = function() {
    Meteor.clearInterval(timer);
  };

  return this;
  
}();