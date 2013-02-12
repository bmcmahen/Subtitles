// XXX if window.saveAs() and web worker and blob builder,
// then do it all on the client. Chrome, IE10, Firefox(?). 
// 
// otherwise, send the json to an express server. Express will
// build string, and respond with a file. IE9, Safari, Firefox.
// 

(function(){

Meteor.methods({
	export : function(subs, options){
		var file = new Exports(subs, options);
		return file.toSRT(); 
	}
});

  /**
   * [buildSRT formats array of times/descriptions into SRT format]
   * @param  {[array]} subs [fetched, sorted array of subtitle objects]
   * @return {[string]}      [string of the array in SRT format]
   *
   *
   * Typical Use:
   *
   * var file = new Subtitler.Exports(subtitles, {format : 'srt'})
   * file.toSRT(); // or whatever format is selected
   * file.saveAs(); 
   * 
   */

var Exports = function(subs, options) {
  this.subs = subs; 
  options || (options = {});
  this.format = options.format || 'srt';
  this.formattedString = '';
}

_.extend(Exports.prototype, {

// 4
// 00:00:23,880 --> 00:00:28,749
// My name is Yuri Zhary.

  toSRT : function(subs){
    var self = this
      , subtitles = subs || self.subs
      , buf = ['']

    _.each(subtitles, function(value, index){
      // Don't include empty boxes
      if (typeof value.text !== 'undefined' && value.text.match(/\S/)) {
        var bufLength = buf.length
        buf[bufLength] = index + 1; 
        buf[bufLength + 1] = secondsToHms(value.startTime) + ' --> ' + secondsToHms(value.endTime);
        buf[bufLength + 2] = value.text + '\n'
      }
    })

    var formatted = buf.join('\n');
    self.formattedString = formatted;
    return formatted; 
  },

// WEBVTT
//
// 00:11.000 --> 00:13.000
// <v Roger Bingham>We are in New York City

// 00:13.000 --> 00:16.000
// <v Roger Bingham>Were actually at the Lucern Hotel, just down the street

  toWebVTT : function(subs) {
    var self = this
      , subtitles = subs || self.subs
      , buf = ['']

    _.each(subtitles, function(value, index) {
      var bufLength = buf.length
      buf[bufLength] = secondsToHms(value.startTime) + ' --> ' + Subtitler.subtitles.secondsToHms(value.endTime);
      buf[bufLength + 1] = value.text + '\n'
    })

    var formatted = buf.join('\n');
    self.formattedString = formatted;
    return formatted; 
  },

  saveAs : function(){
    var self = this
      , name = Videos.findOne(Session.get('currentVideo')).name
      , blob = new Blob([self.formattedString], {'type' : 'text/plain'})

    window.saveAs(blob, name + '.' + self.format);
  }
});

var secondsToHms = function(num, decimals) {

    var decimals = decimals || 3; 

    // Convert seconds into hours, minutes, seconds (rounded to three decimals)
    var h = Math.floor(num / 3600)
      , m = Math.floor(num % 3600 / 60)
      , s = (num % 2600 % 60).toFixed(decimals);


    var timeStrings = function(n, seconds) {
      var sep = seconds ? '' : ':';

        if (n > 0 && n > 9) {
          return n + sep
      } else if (n > 0 && n < 10) {
          return '0' + n + sep
      } else if (n === 0) {
          return '00' + sep
      } else if (n === '0.000') {
          return '00.000'
      }
    }

  if (_.isNull(num))
    return '00:00:00,000';

  // Construct numbers intro formatted strings
  var hourString = timeStrings(h)
    , minuteString = timeStrings(m)
    , seconds = timeStrings(s, true)

  return hourString + minuteString + seconds

 }

})()