/**
 * Timer for saving
 */

var myTimer = function(){
  var timer;
  this.set = function(saveFormCB) {
    Session.set('saving', 'Saving...')
    timer = setTimeout(function() {
      saveFormCB()
    }, 3000)
  }
  this.clear = function() {
    clearInterval(timer)
  }
  return this
}()