(function(){

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

var Exports = Subtitler.Exports = function(subs, options) {
  this.subs = subs; 
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
      if (value.text.match(/\S/)) {
        var bufLength = buf.length
        buf[bufLength] = index + 1; 
        buf[bufLength + 1] = Subtitler.utilities.secondsToHms(value.startTime) + ' --> ' + Subtitler.utilities.secondsToHms(value.endTime);
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
      buf[bufLength] = Subtitler.utilities.secondsToHms(value.startTime) + ' --> ' + Subtitler.subtitles.secondsToHms(value.endTime);
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
})

})()