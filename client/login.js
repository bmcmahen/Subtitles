(function () {

// Universal Messaging system using & as split between title and body
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

// trim helper
var trimInput = function(val) {
  return val.replace(/^\s*|\s*$/g, "");
}

/**
 * validations
 */
var isEmail = function(val, field) {
  if (val.indexOf('@') !== -1) {
      return true;
    } else {
      Session.set('displayMessage', 'Error & Please enter a valid email address.')
      return false;
    }
};

var isValidPassword = function(val, field) {
  if (val.length >= 6) {
    return true;
  } else {
    Session.set('displayMessage', 'Error & Your password should be 6 characters or longer.')
    return false; 
  }
}

var isNotEmpty = function(val, field) {
  // if null or empty, return false
  if (!val || val === ''){
    Session.set('displayMessage', 'Error & Please fill in all required fields.')
    return false; 
  }
  else
    return true; 
}



Template.intro.rendered = function() {
  var self = this; 
  self.wrapper = self.find('.intro');
}

Template.intro.events({
  'submit #login-form' : function(e, t) {

    var email = trimInput(t.find('#login-email').value)
    var password = t.find('#login-password').value

    if (isNotEmpty(email, 'loginError') && isNotEmpty(password, 'loginError')) {

      var loader = document.getElementById('loader');
      loader.classList.add('visible');

      Meteor.loginWithPassword(email, password, function(err){
        
        if(err && err.error === 403)
          Session.set('displayMessage', 'Login Error &' + err.reason);
        else {
          Session.set('currentView', 'second')
          Router.navigate('library');
        }

        loader.classList.remove('visible');

      });

    };

    return false
  },

  'submit #register-form' : function(e, t) {
    var email = trimInput(t.find('#account-email').value)
    var password = t.find('#account-password').value

    if (isNotEmpty(email, 'accountError')
      && isNotEmpty(password, 'accountError')
      && isEmail(email, 'accountError')
      && isValidPassword(password, 'accountError')) {

      var loader = document.getElementById('loader');
      loader.classList.add('visible');

      Accounts.createUser({email: email, password : password}, function(err){
        if (err && err.error === 403)
          Session.set('displayMessage', 'Account Creation Error &' + err.reason)
        else {
          Session.set('currentView', 'second');
          Router.navigate('library');
        }
        loader.classList.remove('visible');
      })
    }
    return false
  },

  'click #forgot-password' : function(e, t) {
    Session.set('currentView', 'password');
    Router.navigate('reset-password');
  }
  
})

Template.passwordRecovery.helpers({
  resetPassword : function(t) {
    return Session.get('resetPassword');
  }
})

Template.passwordRecovery.events({

    'submit #recovery-form' : function(e, t) {
      var email = trimInput(t.find('#recovery-email').value)

      if (isNotEmpty(email, 'recoveryError') && isEmail(email, 'recoveryError')) {
        
        var loader = document.getElementById('loader');
        loader.classList.add('visible');

        Accounts.forgotPassword({email: email}, function(err){
        if (err)
          Session.set('displayMessage', 'Password Reset Error & ' + err.reason)
        else {
          Session.set('displayMessage', 'Email Sent & Please check your email to reset your password.')
          Session.set('currentView', 'first')
          Router.navigate('');
        }
        loader.classList.remove('visible');
      });
      }
      return false; 
    },

    'submit #new-password' : function(e, t) {

      var pw = t.find('#new-password-password').value;

      if (isNotEmpty(pw) && isValidPassword(pw)) {
        var loader = document.getElementById('loader');
      loader.classList.add('visible');

        Accounts.resetPassword(Session.get('resetPassword'), pw, function(err){
          if (err)
            Session.set('displayMessage', 'Password Reset Error & '+ err.reason);
          else {
            Session.set('currentView', 'second');
            Router.navigate('library');
          }
          loader.classList.remove('visible');
        })
      }
    return false; 
    }
});

Template.intro.preserve(['#intro-login-form', '#intro-password-form', '#intro-register-form'])

})();