Template.intro.events({
  'click .watch-video' : function(e, t){
    $(e.currentTarget).parent().html('<iframe src="http://player.vimeo.com/video/53719196?badge=0&autoplay=1" width="620" height="349" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>');
    return false;
  },
  'click .create-project': function(e, t){
    Session.set('overlay', 'newVideo');
    Router.navigate('new-project');
    return false;
  }
});