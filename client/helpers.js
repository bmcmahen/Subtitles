Handlebars.registerHelper('formatTime', function(caption){
  var dates = {};
  dates.start = Subtitler.utilities.secondsToHms(caption.startTime);
  dates.end = Subtitler.utilities.secondsToHms(caption.endTime);
  return dates; 
});

Handlebars.registerHelper('totalDuration', function(video){
  var stats = {};
  stats.duration = Subtitler.utilities.secondsToHms(video.duration);
  return stats;
})

Handlebars.registerHelper('formatDate', function(video) {
  var dates = {};

  if (video.created) {
    var dateObject = new Date(video.created)
      , dd = dateObject.getDate()
      , mm = dateObject.getMonth()+1 //January is 0!
      , yyyy = dateObject.getFullYear();

    if(dd<10){dd='0'+dd} if(mm<10){mm='0'+mm} dates.created = mm+'/'+dd+'/'+yyyy;
    return dates; 
  }

  dates.created = 'unknown';
  return dates; 
})