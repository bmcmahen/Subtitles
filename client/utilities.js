(function(){

  /**
   * Universal Utility functions
   */

  var utilities = Subtitler.utilities = {

    // Converts seconds into HMS string
    secondsToHms : function(num, decimals) {

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

    },

    saveAs: function(string, format){
			var name = Videos.findOne(Session.get('currentVideo')).name
	      , blob = utilities.buildBlob(string, {'type' : 'text/plain' });

	    window.saveAs(blob, name + '.' + format);
 	 },

 	 buildBlob: function(value, type){
 	 	var prefixedBB = window.MSBlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

 	 	if (typeof Blob !== "undefined") {
			return new Blob([value], type);
		} else if (prefixedBB) {
			var bb = new prefixedBB();
			bb.append(value);
			return bb.getBlob('text/plain');
		} else {
			return false; 
		}
 	 }

 	};


})(); 