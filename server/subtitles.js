(function(){

  /**
   * Allows basic server-side routing
   */

    var require = __meteor_bootstrap__.require

    var fs = require('fs')
    var connect = require('connect')

    __meteor_bootstrap__.app
      .use(connect.query())
      .use(function(req, res, next){

        Fiber(function(){
          path(req) ? res.end(subtitle) : next()
        }).run(); 

      })

      var path = function(req) {
        var splitPath = req.url.split('/')
        return splitPath[1] === 'subtitles' ? 'subtitle present in url' : null
      }

    buildSRT = function(subs) {

      var buf = [ 'hello\n']

      _.each(subs, function(value, index){
        buf[buf.length] = index + 1; 
        buf[buf.length] = secondsToHms(value.startTime) + ' --> ' + secondsToHms(value.endTime);
      })

      return buf.join('\n')
    }


    /**
     * [secondsToHms transforms seconds into SRT standard num string]
     * @param  {[number]} num [number in seconds]
     * @return {[string]}           [HH:MM:SS,SSS]
     */
    secondsToHms = function(num) {

      // Convert seconds into hours, minutes, seconds (rounded to three decimals)
      var h = Math.floor(num / 3600)
        , m = Math.floor(num % 3600 / 60)
        , s = Math.round(( num % 2600 % 60 ) * 1000 ) / 1000

      // function to build proper hour, minute, second strings
      var timeStrings = function(num, isSeconds) {
        var separator = isSeconds ? '' : ':'
        if (num > 0 && num > 9) return num + separator
        else if (num > 0 && num < 10) return '0' + num + separator
        else if (num === 0) return '00' + separator
      }

      // Construct numbers intro formatted strings
      var hourString = timeStrings(h)
        , minuteString = timeStrings(m)
        , seconds = timeStrings(s, true)

      // Replaces period with comma
      var sFormatted = seconds.toString().replace( /\./ , ','  )

      return hourString + minuteString + sFormatted
    }

  /**
   * Methods
   */

    Meteor.methods({

      export: function(currentVideo){

        var subsId = Videos.findOne(currentVideo).subtitles

        var subtitles = Subtitles.find({ _id: { $in : subsId }}, {sort: ['startTime', 'asc']} ).fetch()
        var srt  = buildSRT(subtitles)

        fs.writeFile('subs/superSub.srt', srt, function(err, file){
          if (err) throw err;
          console.log('it saved apparently', file)
          // Meteor.http.get('/subtitles/ + userId + / + subId')
        })
      }

    });


})(); 