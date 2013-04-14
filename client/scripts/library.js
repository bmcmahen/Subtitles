// Library Modal View

var Confirmation = window.require('bmcmahen-confirmation');

Template.viewLibrary.created = function(){
  Session.set('editLibrary', null);
};

Template.viewLibrary.helpers({
  project : function(){
    return Videos.find({}, { sort: ['name', 'asc' ]});
  }
});

Template.viewLibrary.events({
  'click .edit-project' : function(){
    Session.set('editLibrary', true);
    return false;
  }
});

Template.projectList.events({
  'click a.project-name' : function(e,t){
    delete Subtitler.videoNode;
    Session.set('loadingError', null);
    Session.set('currentVideo', this._id);
    Session.set('currentView', 'app');
    Session.set('overlay', null);
    Router.navigate('project/'+ this._id);
    return false;
  },

  'click button.delete-project' : function(e, t){
    var self = this;

    this.confirmation = Confirmation({
      title: 'Delete Project',
      content: 'Are you sure you want to delete this project?',
      okay: 'Delete Project',
      cancel: 'Cancel'
    }).effect('fade')
      .show()
      .okay(function(e){
        // Remove both project and associated subtitles
        Subtitles.remove({videoId: self._id});
        Videos.remove(self._id);

        if (Session.equals('currentVideo', self._id)) {
          Session.set('currentVideo', null);
          Session.set('currentView', 'app');
        }
      });
  }
});

Template.projectList.helpers({
  editProject : function(){
    return Session.get('editLibrary');
  }
});