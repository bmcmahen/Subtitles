// Library Modal

Template.viewLibrary.helpers({
  project : function(){
    return Videos.find({}, { sort: ['name', 'asc' ]});
  }
});