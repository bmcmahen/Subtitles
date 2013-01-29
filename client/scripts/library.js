(function(Subtitler){

Session.set('columnClass', null);

// Select new Project Flow
var selectProject = function() {
  Session.set('videoURL', null);
  Session.set('currentVideo', this._id);
};


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
      Subtitler.videoNode = new Subtitler.VideoElement(url, {
        type: 'html',
        target: '#dropzone'
      }).embedVideo(); 
      console.log(Subtitler.videoNode);
      Session.set('videoURL', url)
    }     

  },

  'dragover #dropzone' : function(e, t) {
    e.preventDefault(); 
  },

  'dragenter #dropzone' : function(e, t) {
    e.currentTarget.classList.add('target')
    e.currentTarget.innerHTML = '';
  },

  'dragleave #dropzone, dragend #dropzone' : function(e, t){
    e.currentTarget.classList.remove('target');
    e.currentTarget.innerHTML = '<p> <strong>Drop video</strong> or <strong>click</strong> to select video source.</p>'
  },

  'error #dropzone video' : function(e, t){
  	Session.set('displayMessage', 'Error Loading Video && There was an error loading your video.');
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
    Session.set('columnClass', 'sub');

     Meteor.setTimeout(function () {
      selectProject.call(self);
    }, 300); 

    return false;
  }
});

Template.library.preserve(['.menu', '.submenu']);

Template.library.helpers({

  project : function(){
    return Videos.find({});
  },

  supportedFormats : function() {
    var types = new Subtitler.Video()

    return types.supportedFormats().join(', ')
  },

  columnClass : function(){
  	return Session.get('columnClass');
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

  'dragover .select-video-file' : function(e, t) {

    e.preventDefault(); 

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

  'error #drop video' : function(e, t){
  	Session.set('displayMessage', 'Error Loading Video && There was an error loading your video.');
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
            Subtitles.remove({videoId : self._id});
            Session.set('displayMessage', 'Project Deleted & ' + self.name + ' deleted.');
            Session.set('columnClass', null);
          } 
        });
    return false; 
  },

  'click button.go-back' : function(e, t) {
    Session.set('columnClass', null);
  },

  'click .submenu-header button.export-subs' : function(e, t) {
    var subtitles = Subtitles.find({}).fetch();
    Session.set('loading', true);
    Meteor.call('export', subtitles, function(err, result){
    	Session.set('loading', false);
    	if (!err)
    		Subtitler.utilities.saveAs(result, 'srt')
    });
    
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

    transitionToMain(); 

    return false

}

});

Template.projectSubmenu.helpers({
	project: function(){
		if (Session.get('currentVideo'))
			return Videos.findOne(Session.get('currentVideo'));
	}
})

})(Subtitler);