(function(){

	Meteor.methods({
		parse: function(string){
			var parsed = new parseSRT(string);
			return parsed.parseSRT(); 
		}
	});

  // Constructor
  var parseSRT = function(string) {
    this.string = string; 
    this.subtitles = [];
  }

  /**
   * METHODS
   */
  
  _.extend(parseSRT.prototype, {

    trim : function(val) {
      return val.replace(/^\s*|\s*$/g, "");
    },

    hmsToSeconds : function(string) {
      var parts = string.split(':')
        , hours = Number(parts[0]) * 3600
        , minutes = Number(parts[1]) * 60
        , seconds = Number(parts[2].replace(',', '.'));

      return hours + minutes + seconds;
    },

     parseSRT : function(){
      // first split at empty line-break and make array of each subtitle
      var self = this
        , captions = self.string.split('\n\n');

      _.each(captions, function(cap, i){
        var part = cap.split('\n')
          , sub = {};

        // remove any extra newlines or empty space
        var filteredParts = _.reject(part, function(p){
          if (!p.match(/\S/))
           return true
        })

        if (! _.isEmpty(filteredParts)) {

          // TEXT -------
          sub.text = '';

          // Assume that everything after the time is text.
          // If its in on a separate line, create a newline
          var length = filteredParts.length;
          for (var x = 2; x < length; x++) {
            sub.text = sub.text + self.trim(filteredParts[x]);
            if (x !== length - 1)
              sub.text = sub.text + '\n'
          }

          // Only perform and push if text isn't empty
          if (sub.text.length > 0) {
            var times = filteredParts[1].split('-->');

            sub.startTime = self.hmsToSeconds(self.trim(times[0]));
            sub.endTime = self.hmsToSeconds(self.trim(times[1]));

            self.subtitles.push(sub);
          }
        }
      }); 

      return self.subtitles; 

    },

  })

})()