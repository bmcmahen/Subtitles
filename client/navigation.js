Template.navigation.helpers({
  displayName: function(){
    var user = Meteor.user();
    return user.username || (user.emails && user.emails[0] && user.emails[0].address)
  }
})

Template.navigation.events({
  'click .logout' : function() {
    Meteor.logout(); 
    Session.set('currentView', 'first');
    Session.set('currentVideo', null);
    Router.navigate('');
    return false; 
  },

  'click .view-library' : function() {
    Session.set('currentVideo', null);
    Session.set('currentView', 'second');
    Router.navigate('library');
    return false;
  }
})