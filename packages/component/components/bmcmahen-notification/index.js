/**
 * Notification Module
 *
 * REALLY basic growl-like notificaitons. 
 * 
 */

// Append UL to Body on load
var list = document.createElement("ul");
list.id = 'notifications';

window.onload = function(){
	document.querySelector('body').appendChild(list);	
}

// API

module.exports = function(attributes, options){
    return new Notification(attributes, options).show()
}

// Constructor accepts attributes and options
var Notification = function(attributes, options) {

    this.attributes = attributes || {};

    options || (options = {});
    this.duration = options.duration || 5000; 
    this.template = options.template || require('./template');

};

Notification.prototype =  {
    
    show: function() {

        var self = this
        ,   li = self.el = document.createElement('li')
        ,   html = self.template(self.attributes);

        li.className = 'notification';
        li.innerHTML = html;
        
        // Cant append string so we need to create an <li> and append that
        list.appendChild(li);
        self.hide(); 
        return this; 
    },

    // Removes element after timer expires.
    hide : function() {

        var self = this; 
        clearTimeout(this.timer);
        this.timer = setTimeout(function(){
            self.remove(); 
        }, self.duration);

        return this; 
    },

    // Remove element.
    remove : function(){

        var self = this;
        self.el.className += ' hide';
        setTimeout(function(){
             self.el.parentNode.removeChild(self.el);
        }, 400);

        return this; 

    }
}; 