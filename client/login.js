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

	'click .watch-video' : function(e, t){
		$(e.currentTarget).parent().html('<iframe src="http://player.vimeo.com/video/53719196?badge=0&autoplay=1" width="620" height="349" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>');
		return false; 
	},
  'submit #login-form' : function(e, t) {

    var email = trimInput(t.find('#login-email').value.toLowerCase())
    var password = t.find('#login-password').value

    if (isNotEmpty(email, 'loginError') && isNotEmpty(password, 'loginError')) {

      Meteor.loginWithPassword(email, password, function(err){
        
        if(err && err.error === 403) {
          Session.set('displayMessage', 'Login Error &' + err.reason);
        } else {
          Session.set('currentView', 'library')
          Router.navigate('library');
        }


      });

    };

    return false
  },

  'submit #register-form' : function(e, t) {
    var email = trimInput(t.find('#account-email').value.toLowerCase())
    var password = t.find('#account-password').value

    if (isNotEmpty(email, 'accountError')
      && isNotEmpty(password, 'accountError')
      && isEmail(email, 'accountError')
      && isValidPassword(password, 'accountError')) {

      Session.set('loading', true)

      Accounts.createUser({email: email, password : password}, function(err){
        if (err && err.error === 403) {
          Session.set('displayMessage', 'Account Creation Error &' + err.reason)
          Session.set('loading', false);
        } else {
          Session.set('currentView', 'library');
          Router.navigate('library');
        }
        Session.set('loading', false);
      })
    }
    return false
  },

  'click #forgot-password' : function(e, t) {
    Session.set('passwordView', 'password')
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
        
        Session.set('loading', true);

        Accounts.forgotPassword({email: email}, function(err){

        if (err)
          Session.set('displayMessage', 'Password Reset Error & ' + err.reason)
        else {
          Session.set('displayMessage', 'Email Sent & Please check your email to reset your password.')
          Session.set('passwordView', null)
          Router.navigate('');
        }

        Session.set('loading', false);

      });
      }
      return false; 
    },

    'submit #new-password' : function(e, t) {

      var pw = t.find('#new-password-password').value;

      if (isNotEmpty(pw) && isValidPassword(pw)) {
        Session.set('loading', true);

        Accounts.resetPassword(Session.get('resetPassword'), pw, function(err){
          if (err)
            Session.set('displayMessage', 'Password Reset Error & '+ err.reason);
          else {
            Session.set('currentView', 'library');
            Session.set('resetPassword', null);
            Router.navigate('library');
          }
          Session.set('loading', false);
        })
      }
    return false; 
    }
});

Template.intro.preserve(['#intro-login-form', '#intro-password-form', '#intro-register-form'])

Template.intro.helpers({
  passwordView : function(){
    return Session.get('passwordView');
  }
})

})();