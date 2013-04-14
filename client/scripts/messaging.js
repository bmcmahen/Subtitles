// Takes a session variable and splits it at '&' to
// alert the user. Used for error messages, primarily.
var notify = require('bmcmahen-notification');

Deps.autorun(function() {
  var message = Session.get('displayMessage');
  if (message) {
    var stringArray = message.split('&');
    notify({
      title : stringArray[0],
      content: stringArray[1]
    });

    Session.set('displayMessage', null);
  }
});