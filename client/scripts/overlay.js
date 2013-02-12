
// Overlay helpers to distinguish between new project
// or select previous project.
Template.overlay.helpers({

  overlay: function(){
    return Session.get('overlay');
  },

  newVideo: function(){
    return Session.equals('overlay', 'newVideo');
  },

  viewLibrary: function(){
    return Session.equals('overlay', 'viewLibrary');
  },

  loginForm: function(){
    return Session.equals('overlay', 'loginForm');
  }

});

// Overlay Events
Template.overlay.events({

  'click .close' : function(e, t){

    if (!Session.get('currentView')) {
      Router.navigate('');
    } else {
      var currentId = Session.get('currentVideo');
      Router.navigate('project/'+currentId);
    }

    $('#overlay').removeClass('active');
    Meteor.setTimeout(function(){
      Session.set('overlay', null);
    }, 400);
    
    return false; 
  },

});

Template.overlay.preserve['#panel'];