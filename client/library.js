(function(){

// Select new Project Flow
var selectProject = function() {
  Session.set('videoURL', null);
  Session.set('currentVideo', this._id);
};


Template.library.rendered = function(){
  $('#myCarousel').carousel('pause'); 
}


Template.library.events({

  'click .dismiss' : function(e, t) {
    $('#myModal').removeClass('in');
  },

  'click .close' : function(e, t) {
    $('#myModal').removeClass('in');
  },

  'change #video-file, drop #dropzone' : function(e, t) {
    e.preventDefault(); 
    var fileList = e.currentTarget.files || e.dataTransfer.files
      , vid = new Subtitler.Video(fileList)
      , url = vid.createVideoUrl();

    if (url) {
      t.videoURL = url; 
      vid.embedVideo('#dropzone', {projectName : '#project-name'})
      Session.set('videoURL', url)
    }     

  },

  'dragenter #dropzone' : function(e, t) {
    e.currentTarget.classList.add('target')
    e.currentTarget.innerHTML = '';
  },

  'dragleave #dropzone, dragend #dropzone' : function(e, t){
    e.currentTarget.classList.remove('target');
    e.currentTarget.innerHTML = '<p> <strong>Drop video</strong> or <strong>click</strong> to select video source.</p>'
  },

  'loadedmetadata #dropzone video' : function(e, t) {
    e.currentTarget.currentTime = e.currentTarget.duration / 3; 
    this.videoNode = e.currentTarget;
  },

  'click #create-project' : function(e, t) {
    var self = t; 
    if (! self.videoURL) {
      Session.set('displayMessage', 'Error Creating Project & Please select a video file from your hard disk.')
      return false
    }

    var duration = t.find('#dropzone video').duration
      , name = t.find('#project-name').value;

    if (!name || name === '') {
      Session.set('displayMessage', 'Error Creating Project & Please provide a project name.');
      return false; 
    }

    var newProject = Videos.insert({
      user : Meteor.userId(),
      name : name,
      duration : duration,
      created : new Date()
    });

    Session.set('videoURL', self.videoURL);
    Session.set('currentVideo', newProject);
    Session.set('currentView', 'app');
    Router.navigate('project/' + newProject);
    return false
  },

  'click .dropzone' : function(e, t) {
    $('#video-file').trigger('click');
  },

  'click a.project-name' : function(e, t) {
    var self = this; 
    var i = $(e.currentTarget).closest('li').index();
    $('#myCarousel').carousel(i + 1);

     Meteor.setTimeout(function () {
      selectProject.call(self);
    }, 300); 

    return false;
  }
})

Template.library.helpers({
  project : function(){
    return Videos.find({});
  },

  supportedFormats : function() {
    var types = new Subtitler.Video()

    return types.supportedFormats().join(', ')
  }
});

Template.projectSubmenu.events({

  'change .video-select, drop .select-video-file' : function(e, t) {

    e.preventDefault();

    var fileList = e.currentTarget.files || e.dataTransfer.files
      , vid = new Subtitler.Video(fileList)
      , url = vid.createVideoUrl();

    if (url) {
      t.videoURL = url; 
      vid.embedVideo(t.find('.select-video-file'));
      Session.set('videoURL', url)
    }     

    return false

  },

  'dragenter a.select' : function(e, t) {
    e.currentTarget.classList.add('target');
    e.currentTarget.innerHTML = 'Drop Video Here';
  },

  'dragleave a.select, dragend a.select' : function(e, t){
    e.currentTarget.classList.remove('target');
  },

  'dragleave a.select' : function(e, t){
    e.currentTarget.innerHTML = '<strong>Drop video</strong> or <strong> click </strong> to select video source.'
  },

  'loadedmetadata #drop video' : function(e, t) {
    var vid = e.currentTarget
    t.videoNode = vid; 
    vid.currentTime = vid.duration / 3; 
  },

  'click #drop' : function(e, t) {
    var vid = t.find('input.video-select');
    $(vid).trigger('click');
  },

  'click button.delete-project' : function(e, t) {

    var self = this; 
    new ui.Confirmation(
      { title: 'Delete Project',
        message: 'Are you sure you want to delete ' + self.name + '?' 
      }).ok('Delete')
        .cancel('Cancel')
        .effect('scale')
        .show(function(ok){
          if (ok) {
            Videos.remove(self._id);
            Session.set('displayMessage', 'Project Deleted & ' + self.name + ' deleted.');
            $('#myCarousel').carousel(0);
          } 
        });
    return false; 
  },

  'click button.go-back' : function(e, t) {
    $('#myCarousel').carousel(0);
  },

  'click .submenu-header button.export-subs' : function(e, t) {
    var subtitles = Subtitles.find({}).fetch()
      , file = new Subtitler.Exports(subtitles, {format : 'srt'})

    file.toSRT();
    file.saveAs(); 

    return false
  },

  'click .submenu-content button.open-project' : function(e, t) {


    var transitionToMain = function() {   
      if (t.videoURL) {
        Session.set('currentView', 'app');
        Session.set('videoURL', t.videoURL);
        Router.navigate('project/' + Session.get('currentVideo'));
      } else {
        Session.set('displayMessage', 'Error Opening Project & Please select a video file from your hard disk.')
      }  
    };

    // compare duration of videos, to determine if they are the same.
    // provide warning if they aren't. 
    if (typeof t.videoNode === 'undefined') {
      transitionToMain(); 
      return false;       
    }

    if (t.data.duration !== t.videoNode.duration) {

      new ui.Confirmation(
      { title: 'Video Duration Changed',
        message: 'This video has a different duration than the last video that you used for this project. Are you sure you want to continue?'
      }).ok('Continue')
        .cancel('Cancel')
        .effect('scale')
        .show(function(ok){
          if (ok) {
            Videos.update({_id: Session.get('currentVideo')}, {$set : { duration : t.videoNode.duration }});
            transitionToMain(); 
          }
      });

    } else {

      transitionToMain(); 

    }

    return false

}

});

})();