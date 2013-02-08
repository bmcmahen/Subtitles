(function () {

// Takes a session variable and splits it at '&' to
// alert the user. Used for error messages, primarily. 
Meteor.autorun(function() {
  var message = Session.get('displayMessage');
  if (message) {
    var stringArray = message.split('&');
    ui.notify(stringArray[0], stringArray[1])
      .effect('slide')
      .closable();

    Session.set('displayMessage', null);
  }
});

})();