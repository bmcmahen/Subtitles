Template.navigation.helpers({
  displayName: function(){
    var user = Meteor.user();
    return (user.profile && user.profile.name) || user.username || (user.emails && user.emails[0] && user.emails[0].address);
  },

  loading : function() {
    return Session.get('loading');
  }
});

Template.navigation.events({

  'click .brand' : function() {
    Session.set('currentView', null);
    Session.set('currentVideo', null);
    Router.navigate('');
    return false;
  },

  'click .logout' : function() {
    Meteor.logout();
    Session.set('currentView', null);
    Session.set('currentVideo', null);
    Router.navigate('');
    return false;
  },

  'click .view-library' : function() {
    Session.set('overlay', 'viewLibrary');
    Router.navigate('library');
    return false;
  },

  'click .view-help' : function() {
    Session.set('currentVideo', null);
    Session.set('currentView', 'help');
    Router.navigate('help');
    return false;
  },

  'click .new-project' : function(){
    Session.set('overlay', 'newVideo');
    Router.navigate('new-project');
    return false;
  },

  'click .login' : function(){
    Session.set('overlay', 'loginForm');
    Router.navigate('login');
    return false;
  }
});


function addClass() {
  $('#overlay').addClass('active');
}

// When rendered, add the 'active' class. This allows
// us to animate the fade/scale. Defer forces a redraw
// to ensure the animation happens.
Template.overlay.rendered = function(){
  if (Session.get('overlay')) {
    _.defer(addClass);
  }
};