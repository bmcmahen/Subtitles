 secondsToHms = function(num) {
      // Convert seconds into hours, minutes, seconds (rounded to three decimals)
      var h = Math.floor(num / 3600)
        , m = Math.floor(num % 3600 / 60)
        , s = (num % 2600 % 60).toFixed(1)

      // function to build proper hour, minute, second strings
      var timeStrings = function(num, isSeconds) {
        var separator = isSeconds ? '' : ':'
        if (num > 0 && num > 9) return num + separator
        else if (num > 0 && num < 10) {
          return '0' + num + separator
        }
        else if (num === 0) {
          return '00' + separator
        }
        else if (num === '0.0') return '00.0'
      }

      // Construct numbers intro formatted strings
      var hourString = timeStrings(h)
        , minuteString = timeStrings(m)
        , seconds = timeStrings(s, true)

      return hourString + minuteString + seconds
    }

