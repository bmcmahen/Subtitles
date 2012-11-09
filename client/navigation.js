(function(){

Template.navigation.helpers({
  displayName: function(){
    var user = Meteor.user();
    return user.username || (user.emails && user.emails[0] && user.emails[0].address)
  },

  loading : function() {
    return Session.get('loading');
  }
})

Template.navigation.events({
  'click .logout' : function() {
    Meteor.logout(); 
    Session.set('currentView', 'introduction');
    Session.set('currentVideo', null);
    Session.set('videoURL', null);
    Subtitler.videoNode = null; 
    Router.navigate('');
    return false; 
  },

  'click .view-library' : function() {
    Session.set('currentVideo', null);
    Session.set('currentView', 'library');
    Session.set('videoURL', null);
    Subtitler.videoNode = null; 
    Router.navigate('library');
    return false;
  }
})

})();