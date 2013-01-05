// A polyfill for window.saveAs. It uses native saveAs if available, or msSaveBlob (if IE 10) and if the function doesnt exist
// then it attempts to use the Chrome method of setting a download blob on a link. If neither of these work, then open the resource
// in a new tab. 

window.saveAs || ( window.saveAs = (window.navigator.msSaveBlob ? function(b,n)
  { return window.navigator.msSaveBlob(b,n); } : false) || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs || (function(){

  // URL's
  window.URL || (window.URL = window.webkitURL);

  if(!window.URL){
    return false;
  }

  return function(blob,name){
    var url = URL.createObjectURL(blob);

    // Test for download link support
    if( "download" in document.createElement('a') ){

      var a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', name);

      // Create Click event
      var clickEvent = document.createEvent ("MouseEvent");
      clickEvent.initMouseEvent ("click", true, true, window, 0, 
        event.screenX, event.screenY, event.clientX, event.clientY, 
        event.ctrlKey, event.altKey, event.shiftKey, event.metaKey, 
        0, null);

      // dispatch click event to simulate download
      a.dispatchEvent (clickEvent);

    }
    else{
      // fallover, open resource in new tab.
      window.open(url, '_blank', '');
    }
  };

})() );