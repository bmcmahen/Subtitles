

Videos = new Meteor.Collection('videos')
Subtitles = new Meteor.Collection('subtitles')

/**
 * Permissions
 */

// XXX both should have shared functions, since permissions are the same
// Basically, only owners of the documents are allowed to write
Videos.allow({

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
   * EMAIL
   */
  
  Accounts.emailTemplates.siteName = "Bento Subtitles";
  Accounts.emailTemplates.from = "Bento Subtitles <no-reply@meteor.com";

