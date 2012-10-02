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

  /**
   * Methods
   */

    Meteor.methods({

      export: function(){
        fs.writeFile('subs/superSub.srt', 'Hello Node', function(err, file){
          if (err) throw err;
          console.log('it saved apparently', file)
          // Meteor.http.get('/subtitles/ + userId + / + subId')
        })
      }

    });


})(); 