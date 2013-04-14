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
};

/**
 * METHODS
 */

_.extend(Imports.prototype, {
  trim : function(val) {
    return val.replace(/^\s*|\s*$/g, "");
  },

  parseSRT : function(callback){
    var self = this;
    Meteor.call('parse', self.string, function(err, result){
      if (!err) {
        self.subtitles = result;
        callback();
      }
    });
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
      });
    };

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
    };
  },

  hmsToSeconds : function(string) {
    var parts = string.split(':')
      , hours = Number(parts[0]) * 3600
      , minutes = Number(parts[1]) * 60
      , seconds = Number(parts[2].replace(',', '.'));

    return hours + minutes + seconds;
  }

});