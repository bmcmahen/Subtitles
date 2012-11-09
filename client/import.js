(function(){


  /**
   * [Imports Constructor for importing a file]
   * @param {[type]} file [FileReader file]
   *
   * General Use Pattern: 
   *
   * constructor: var imported = new Subtitler.Imports(file)
   * imported.readAsText(function(){
   *  // Callback when done reading text
   *  // Chooese format you want to parse, based on the imported.type attribute
   *  imported.parseSRT();
   *  imported.insertSubs(); 
   * })
   */
  
  var Imports = Subtitler.Imports = function(file) {

    var reader = this.reader = new FileReader(file);
    this.file = file; 
    this.type = file.name.split('.').pop(); 
    this.project = {};
    this.subtitles = [];
  }

  /**
   * METHODS
   */
  
  _.extend(Imports.prototype, {
    trim : function(val) {
      return val.replace(/^\s*|\s*$/g, "");
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

    // If confirmed, removes all current subtitles for the project and insert a provided subtitle object
    // which contains text, starTime, and endTime. 

    insertSubs : function(subtitles) {
      // As confirmation before removing all of the current subtitles
      var self = this
        , subs = subtitles || self.subtitles
        , usr = Meteor.userId();

      var removeAndInsert = function(){
        Subtitles.remove({});

        _.each(subs, function(sub){

          _.extend(sub, {
            saved : true,
            user : usr,
            videoId : Session.get('currentVideo')
          });
          
          Subtitles.insert(sub);
        })
      }

      if (Subtitles.find().count() > 0) {

          new ui.Confirmation(
        { title: 'Delete Current Entries?',
          message: 'Importing captions will delete your current subtitles for this project. Are you sure you want to continue?'
        }).ok('Continue')
          .cancel('Cancel')
          .effect('scale')
          .show(function(ok){
            if (ok) {
              removeAndInsert(); 
            }
        });

      } else {
        removeAndInsert(); 
      }

     
    },

    readAsText : function(callback){
      var self = this; 
      self.reader.readAsText(self.file);
      self.reader.onloadend = function(e) {
        self.string = self.reader.result;
        callback();  
      }
    },

    hmsToSeconds : function(string) {
      var parts = string.split(':')
        , hours = Number(parts[0]) * 3600
        , minutes = Number(parts[1]) * 60
        , seconds = Number(parts[2].replace(',', '.'));

      return hours + minutes + seconds;
    }

  })

})()