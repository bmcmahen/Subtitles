(function(){

  /**
   * Allows basic server-side routing in Meteor using connect and imports fs
   * which allows me to write SRT files to the server. 
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


/**
 * [buildSRT formats array of times/descriptions into SRT format]
 * @param  {[array]} subs [fetched, sorted array of subtitle objects]
 * @return {[string]}      [string of the array in SRT format]
 */

    buildSRT = function(subs) {

      var buf = [ 'hello\n']

      _.each(subs, function(value, index){
        var bufLength = buf.length
        buf[bufLength] = index + 1; 
        buf[bufLength + 1] = secondsToHms(value.startTime) + ' --> ' + secondsToHms(value.endTime);
        buf[bufLength + 2] = value.description + '\n'
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

      /**
       * [export takes the current video and builds a subtitle file]
       * @param  {[video ID]} currentVideo [id of the current video project]
       * @return {[url]}            [return url when finished, telling the client where it can
       *                                        GET the srt file on the server]
       */
      
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