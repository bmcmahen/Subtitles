secondsToHms = function(num, options) {

  var options = options || {};
  _.defaults(options, {
    format : 'full'
  })

  // Convert seconds into hours, minutes, seconds (rounded to three decimals)
  var h = Math.floor(num / 3600);
  var m = Math.floor(num % 3600 / 60);
  var s = (num % 2600 % 60).toFixed(1);


  // function to build proper hour, minute, second strings
  var timeStrings = function(num, isSeconds) {

    // only print the numbers that are necessary, without milliseconds.
    // For instance, if hour is 0 then don't print hours.
    if (options.format === 'short') {
      if (num === 0 && h === 0) return '';
    }

    var separator = isSeconds ? '' : ':'
    if (num > 0 && num > 9) return num + separator
    else if (num > 0 && num < 10) {
      return '0' + num + separator
    }
    else if (num === 0) {
      return '00' + separator
    }
    else if (num === '0.0') {
      return '00.0'
    }
  }


  // Construct numbers intro formatted strings
  var hourString = timeStrings(h)
  var minuteString = timeStrings(m)
  var  seconds = timeStrings(s, true)

  return hourString + minuteString + seconds
}

