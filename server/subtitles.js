

Videos = new Meteor.Collection('videos')
Subtitles = new Meteor.Collection('subtitles')

/**
 * Permissions
 */

// XXX both should have shared functions, since permissions are the same
// Basically, only owners of the documents are allowed to write
Videos.allow({

  insert : function(userId, doc) {
    console.log(userId, doc);
    return (userId && doc.user === userId);
  },

  update : function(id, docs) {
     return _.all(docs, function(doc) {
      return doc.user === id
     })
  },

  remove : function(id, docs) {
    return _.all(docs, function(doc) {
      return doc.user === id
    })
  },

  fetch: ['user']
})

Subtitles.allow({

  insert : function(userId, doc) {
    return (userId && doc.user === userId);
  },

  update : function(id, docs) {
     return _.all(docs, function(doc) {
      return doc.user === id
     })
  },

  remove : function(id, docs) {
    return _.all(docs, function(doc) {
      return doc.user === id
    })
  },

  fetch: ['user']

})


  /**
   * PUBLISH
   */
  
  Meteor.publish('subtitles', function(videoId) {
    return Subtitles.find({ videoId: videoId }, {sort: ['startTime', 'asc']})
  })

  Meteor.publish('videos', function(userId){
    return Videos.find({ user: userId })
  })

  /**
   * Allows basic server-side routing in Meteor using connect and imports fs
   * which allows me to write SRT files to 8the server. 
   */

    var require = __meteor_bootstrap__.require

    var fs = require('fs')
    var connect = require('connect')

    __meteor_bootstrap__.app
      .use(connect.query())
      .use(function(req, res, next){

        Fiber(function(){
          path(req) ? res.end('subtitle requested') : next()
        }).run(); 

      })

      var path = function(req) {
        var splitPath = req.url.split('/')
        return splitPath[1] === 'subtitles' ? 'subtitle present in url' : null
      }

      // XXX check to ensure that UserId == logged in user

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
        buf[bufLength + 2] = value.text + '\n'
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

        var subtitles = Subtitles.find({ videoId : currentVideo } , {sort: ['startTime', 'asc']} ).fetch()
        var srt  = buildSRT(subtitles)

        var path = 'public/subtitles/' + Meteor.userId() + '/' + subtitles.name + '.srt';

        // it should write to /public/subtitles/userId/projectName.srt
        // and then return this link on the callback, which will then
        // create a link - which will then allow user to download file
        fs.writeFile(path, srt, function(err, file){
          if (err) throw err;
          return path
        })
      }

    });

