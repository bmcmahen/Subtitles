// Library Modal

Template.viewLibrary.helpers({
  project : function(){
    return Videos.find({}, { sort: ['name', 'asc' ]});
  }
});

Template.projectList.events({
  'click a.project-name' : function(e,t){
    delete Subtitler.videoNode; 
    Session.set('currentVideo', this._id);
    Session.set('currentView', 'app');
    Session.set('overlay', null);
    Router.navigate('project/'+ this._id);
    return false;
  }
});