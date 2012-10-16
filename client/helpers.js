Handlebars.registerHelper('formatTime', function(caption){
  var dates = {};
  dates.start = secondsToHms(caption.startTime);
  dates.end = secondsToHms(caption.endTime);
  return dates; 
});