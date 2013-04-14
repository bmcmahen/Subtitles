/**
 * Confirmation Module
 *
 * Super simple confirmation dialogue following in the footsteps
 * of https://github.com/component/dialog but without jquery. 
 *
 * I'm generally of the opinion that a dialogue should always have a confirmation
 * button of some sort, so I've wrapped dialogue & confirmation into one module. 
 */

var Emitter = require('emitter');

module.exports = function(attributes, options){
	return new Confirmation(attributes, options);
}

var active; 

// Constructor
var Confirmation = function (attributes, options) {
	this.attributes = attributes || {};

	options = options || {}; 
	this.template = options.template || require('./template');
	this.isShown = false; 

	this.el = this._render(); 

	if (active && active.isShown)
		active.hide();

	active = this; 

	if (attributes.okay) this.okay();
	if (attributes.cancel) this.cancel(); 

}

Confirmation.prototype = new Emitter();

// Functions
Confirmation.prototype._render = function(){
	var self = this
		, el = document.createElement('div')
		, html = self.template(self.attributes);

	el.className = 'confirmation hide';
	el.innerHTML = html;
	el.setAttribute('tabindex', '-1');

	setTimeout(function(){
    el.className = el.className.replace( /(?:^|\s)hide(?!\S)/g , '' );
  }, 0);

  return el; 
};

Confirmation.prototype.show = function(){
	if (this.isShown)
		return

	var el = this.el; 

	document.querySelector('body').appendChild(el);

	this.isShown = true; 
	this.emit('show');
	el.focus();

	return this; 
};

Confirmation.prototype.hide = function(){
	var self = this
		, el = self.el; 

	if (!this.isShown)
		return

	if (self.animate) {
		el.className += ' hide';
		clearTimeout(this.timer);
		this.timer = setTimeout(function(){
			self.remove();
		}, 400);
	} else {
		self.remove(); 
	}

	self.isShown = false; 
	self.emit('hide');

};

Confirmation.prototype.remove = function(){
	var self = this
		, el = self.el; 
		
	el.parentNode.removeChild(self.el);
	self.emit('hidden');
};

Confirmation.prototype.okay = function(callback){
	var self = this
		, el = self.el; 

	el.querySelector('.ok').onclick = function(e){
		if (callback) callback(e);
		self.emit('okay');
		self.hide(); 
	}

	return this; 
};

Confirmation.prototype.cancel = function(callback){
	var self = this
		, el = self.el; 

	el.querySelector('.cancel').onclick = function(e){
		if (callback) callback(e);
		self.emit('cancel');
		self.hide(); 
	}

	return this; 
};

Confirmation.prototype.addClass = function(name){
	this.el.className += ' '+name; 
	return this; 
};

Confirmation.prototype.effect = function(type){
	this.animate = type; 
	this.el.className += ' '+type; 
	return this; 
}
