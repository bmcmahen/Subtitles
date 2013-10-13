Meteor.methods({
  removeProject: function(id){
    return Subtitles.remove({videoId: self._id});
  }
})