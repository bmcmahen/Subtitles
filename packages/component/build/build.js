
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

require = function(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("bmcmahen-confirmation/index.js", function(exports, require, module){
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

});
require.register("bmcmahen-confirmation/template.js", function(exports, require, module){
module.exports = function anonymous(obj) {

  function escape(html) {
    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  function section(obj, prop, negate, str) {
    var val = obj[prop];
    if ('function' == typeof val) return val.call(obj, str);
    if (negate) val = !val;
    if (val) return str;
    return '';
  };

  return "\n	<div class='dialog-content " + escape(obj.className) + "'>\n		<span class='title'> " + escape(obj.title) + " </span>\n		<div class='body'>\n			<p>\n				" + escape(obj.content) + "\n			</p>\n		</div>\n		<div class='confirmation-actions'>\n			" + section(obj, "cancel", false, "\n				<button class='cancel'>" + escape(obj.cancel) + "</button>\n			") + "\n			" + section(obj, "okay", false, "\n			<button class='ok main'>" + escape(obj.okay) + "</button>\n			") + "\n		</div>\n	</div>\n"
}
});
require.register("component-indexof/index.js", function(exports, require, module){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("bmcmahen-notification/index.js", function(exports, require, module){
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
});
require.register("bmcmahen-notification/template.js", function(exports, require, module){
module.exports = function anonymous(obj) {

  function escape(html) {
    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  function section(obj, prop, negate, str) {
    var val = obj[prop];
    if ('function' == typeof val) return val.call(obj, str);
    if (negate) val = !val;
    if (val) return str;
    return '';
  };

  return "<div class='content'>\n	<span class='title'>" + escape(obj.title) + "</span>\n	<p>" + escape(obj.content) + "</p>\n</div>"
}
});
require.register("bmcmahen-request_animation_polyfill/index.js", function(exports, require, module){

module.exports = function(){

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };

};
});
require.register("bmcmahen-canvas-loading-animation/index.js", function(exports, require, module){

require('request_animation_polyfill')();


// API
var createSpinner = module.exports =  function(attributes) {
  return new Spinner(attributes).build().draw();
}


// Spinner Model / Dot Collection Constructor
var Spinner = function(attributes){

  attributes || (attributes = {});

  this.canvas = document.createElement('canvas');
  this.ctx = this.canvas.getContext('2d');
  this.width = attributes.width || 100;
  this.height = attributes.height || 100;

  this.canvas.width = this.width;
  this.canvas.height = this.height;

  this.color = attributes.color || '1, 1, 1';
  this.maxOpacity = (attributes.maxOpacity || 0.7) * 100;
  this.minOpacity = (attributes.minOpacity || 0.1) * 100;
  this.number = attributes.number || 12;
  this.radius = attributes.radius || 10;
  this.dotRadius = attributes.dotRadius || 2;
  this.speed = attributes.speed || 1.6;

}

Spinner.prototype.build = function(){
  this.children = [];
  for (var i = 0, x = this.number; i < x; i++) {
    this.children.push(new LoadingDot(i));
  }
  return this;
}

// Draw function (Should make this pluggable, so that other drawing logic could
// be used for different shapes, styles, etc.)
Spinner.prototype.draw = function(){
  var ctx = this.ctx
    , height = this.height / 2
    , width = this.width / 2;

  ctx.translate(width, height);

  var self = this;

  function animate() {
    window.requestAnimationFrame(animate);
    ctx.clearRect(-width, -height, width * 2, height * 2);
    ctx.save();

    for ( var x = 0, l = self.children.length; x < l; x++ ) {
      var dot = self.children[x];
      ctx.fillStyle = 'rgba('+self.color+','+dot.opacity / 100+')';
      ctx.rotate(Math.PI * 2 / self.number);
      ctx.beginPath();
      ctx.arc(0, self.radius, self.dotRadius, 0, Math.PI * 2, true );
      ctx.fill();

      dot.opacity -= self.speed;
      if (dot.opacity < self.minOpacity)
        dot.opacity = self.maxOpacity;
    }
  }

  animate();
  return this;
}


// Dot Model
var LoadingDot = function(i){
  Spinner.call(this);

  this.opacity =  Math.floor(this.determineOpacity((100 / this.number) * i));

}


// Liner Scale (This probably isn't necessary)
LoadingDot.prototype.determineOpacity = function(v){
  var oldRange = 100 - 0
    , newRange = this.maxOpacity - this.minOpacity;

  return Math.floor(( (v - 0) * newRange / oldRange) + this.minOpacity );
}

});
require.alias("bmcmahen-confirmation/index.js", "undefined/deps/confirmation/index.js");
require.alias("bmcmahen-confirmation/template.js", "undefined/deps/confirmation/template.js");
require.alias("component-emitter/index.js", "bmcmahen-confirmation/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-emitter/index.js", "undefined/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("bmcmahen-notification/index.js", "undefined/deps/notification/index.js");
require.alias("bmcmahen-notification/template.js", "undefined/deps/notification/template.js");

require.alias("bmcmahen-canvas-loading-animation/index.js", "undefined/deps/canvas-loading-animation/index.js");
require.alias("bmcmahen-request_animation_polyfill/index.js", "bmcmahen-canvas-loading-animation/deps/request_animation_polyfill/index.js");

