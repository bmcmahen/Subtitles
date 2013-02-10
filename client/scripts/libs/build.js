

/**
 * hasOwnProperty.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
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
    if (has.call(require.modules, path)) return path;
  }

  if (has.call(require.aliases, index)) {
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
  if (!has.call(require.modules, from)) {
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
    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    if ('.' != path.charAt(0)) {
      var segs = parent.split('/');
      var i = lastIndexOf(segs, 'deps') + 1;
      if (!i) i = 0;
      path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
      return path;
    }
    return require.normalize(p, path);
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return has.call(require.modules, localRequire.resolve(path));
  };

  return localRequire;
};
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
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("component-event-manager/index.js", function(exports, require, module){


/**
 * Expose `EventManager`.
 */

module.exports = EventManager;

/**
 * Initialize an `EventManager` with the given
 * `target` object which events will be bound to,
 * and the `obj` which will receive method calls.
 *
 * @param {Object} target
 * @param {Object} obj
 * @api public
 */

function EventManager(target, obj) {
  this.target = target;
  this.obj = obj;
  this._bindings = {};
}

/**
 * Register bind function.
 *
 * @param {Function} fn
 * @return {EventManager} self
 * @api public
 */

EventManager.prototype.onbind = function(fn){
  this._bind = fn;
  return this;
};

/**
 * Register unbind function.
 *
 * @param {Function} fn
 * @return {EventManager} self
 * @api public
 */

EventManager.prototype.onunbind = function(fn){
  this._unbind = fn;
  return this;
};

/**
 * Bind to `event` with optional `method` name.
 * When `method` is undefined it becomes `event`
 * with the "on" prefix.
 *
 *    events.bind('login') // implies "onlogin"
 *    events.bind('login', 'onLogin')
 *
 * @param {String} event
 * @param {String} [method]
 * @return {Function} callback
 * @api public
 */

EventManager.prototype.bind = function(event, method){
  var fn = this.addBinding.apply(this, arguments);
  if (this._onbind) this._onbind(event, method, fn);
  this._bind(event, fn);
  return fn;
};

/**
 * Add event binding.
 *
 * @param {String} event
 * @param {String} method
 * @return {Function} callback
 * @api private
 */

EventManager.prototype.addBinding = function(event, method){
  var obj = this.obj;
  var method = method || 'on' + event;
  var args = [].slice.call(arguments, 2);

  // callback
  function callback() {
    var a = [].slice.call(arguments).concat(args);
    obj[method].apply(obj, a);
  }

  // subscription
  this._bindings[event] = this._bindings[event] || {};
  this._bindings[event][method] = callback;

  return callback;
};

/**
 * Unbind a single binding, all bindings for `event`,
 * or all bindings within the manager.
 *
 *     evennts.unbind('login', 'onLogin')
 *     evennts.unbind('login')
 *     evennts.unbind()
 *
 * @param {String} [event]
 * @param {String} [method]
 * @return {Function} callback
 * @api public
 */

EventManager.prototype.unbind = function(event, method){
  if (0 == arguments.length) return this.unbindAll();
  if (1 == arguments.length) return this.unbindAllOf(event);
  var fn = this._bindings[event][method];
  if (this._onunbind) this._onunbind(event, method, fn);
  this._unbind(event, fn);
  return fn;
};

/**
 * Unbind all events.
 *
 * @api private
 */

EventManager.prototype.unbindAll = function(){
  for (var event in this._bindings) {
    this.unbindAllOf(event);
  }
};

/**
 * Unbind all events for `event`.
 *
 * @param {String} event
 * @api private
 */

EventManager.prototype.unbindAllOf = function(event){
  var bindings = this._bindings[event];
  if (!bindings) return;
  for (var method in bindings) {
    this.unbind(event, method);
  }
};

});
require.register("component-events/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Manager = require('event-manager')
  , event = require('event');

/**
 * Return a new event manager.
 */

module.exports = function(target, obj){
  var manager = new Manager(target, obj);

  manager.onbind(function(name, fn){
    event.bind(target, name, fn);
  });

  manager.onunbind(function(name, fn){
    event.unbind(target, name, fn);
  });

  return manager;
};

});
require.register("bmcmahen-swipe/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var events = require('events')
	, Emitter = require('emitter');

/**
 * Expose `Swipe`.
 */

module.exports = Swipe;

/**
 * Turn `el` into a swipeable list.
 *
 * @param {Element} el
 * @api public
 */

function Swipe(el) {
	Emitter.call(this);
  if (!(this instanceof Swipe)) return new Swipe(el);
  if (!el) throw new TypeError('Swipe() requires an element');
  this.el = el;
  this.child = el.children[0];
  this.total = this.child.children.length;
  this.determineSize(); 
  this.interval(5000);
  this.duration(300);
  this.show(0, 0);
  this.bind();
}


Swipe.prototype = new Emitter(); 


/**
 * Determine list width
 * 
 */

Swipe.prototype.determineSize = function(){
  var rect = this.el.getBoundingClientRect();
  this.childWidth = rect.right - rect.left; 
	this.width = this.childWidth * this.total | 0;
	this.child.style.width = this.width + 'px';
};

/**
 * Bind event handlers.
 *
 * @api public
 */


Swipe.prototype.bind = function(){
  this.events = events(this.child, this);
  this.events.bind('mousedown', 'ontouchstart');
  this.events.bind('mousemove', 'ontouchmove');
  this.events.bind('touchstart');
  this.events.bind('touchmove');

  this.docEvents = events(document, this);
  this.docEvents.bind('mouseup', 'ontouchend');
  this.docEvents.bind('touchend');

  this.windowEvents = events(window, this);
  this.windowEvents.bind('resize');
};

/**
 * Unbind event handlers.
 *
 * @api public
 */

Swipe.prototype.unbind = function(){
  this.events.unbind();
  this.docEvents.unbind();
};

/**
 * determine Size redraw on window resize.
 *
 */

Swipe.prototype.onresize = function(e){
	this.determineSize(); 
	var self = this; 
	clearInterval(this.timer); 
	this.timer = setTimeout(function(){
		self.show(self.current);
	}, 100);
};


/**
 * Handle touchstart.
 *
 * @api private
 */

Swipe.prototype.ontouchstart = function(e){
  if (!e.stopPropagation)
    return
  
  e.stopPropagation();
  if (e.touches) e = e.touches[0];

  this.transitionDuration(0);
  this.dx = 0;

  this.down = {
    x: e.pageX,
    at: new Date
  };
};

/**
 * Handle touchmove.
 *
 * For the first and last slides
 * we apply some resistence to help
 * indicate that you're at the edges.
 *
 * @api private
 */

Swipe.prototype.ontouchmove = function(e){
  if (!this.down) return;
  if (e.touches && e.touches.length > 1) return;
  e.stopPropagation();
  e.preventDefault();
  if (e.touches) e = e.touches[0];
  var s = this.down;
  var x = e.pageX;
  var w = this.childWidth;
  var i = this.current;
  this.dx = x - s.x;
  var dir = this.dx < 0 ? 1 : 0;
  if (this.isFirst() && 0 == dir) this.dx /= 2;
  if (this.isLast() && 1 == dir) this.dx /= 2;
  this.translate((i * w) + -this.dx);
};

/**
 * Handle touchend.
 *
 * @api private
 */

Swipe.prototype.ontouchend = function(e){
  if (!this.down) return;
  e.stopPropagation();

  // touches
  if (e.changedTouches) e = e.changedTouches[0];

  // setup
  var dx = this.dx;
  var x = e.pageX;
  var w = this.childWidth;

  // < 200ms swipe
  var ms = new Date - this.down.at;
  var threshold = ms < 300 ? w / 10 : w / 2;
  var dir = dx < 0 ? 1 : 0;
  var half = Math.abs(dx) >= threshold;

  // clear
  this.down = null;

  // first -> next
  if (this.isFirst() && 1 == dir && half) return this.next();

  // first -> first
  if (this.isFirst()) return this.prev();

  // last -> last
  if (this.isLast() && 1 == dir) return this.next();

  // N -> N + 1
  if (1 == dir && half) return this.next();

  // N -> N - 1
  if (0 == dir && half) return this.prev();

  // N -> N
  this.show(this.current);
};

/**
 * Set transition duration to `ms`.
 *
 * @param {Number} ms
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.duration = function(ms){
  this._duration = ms;
  return this;
};

/**
 * Set cycle interval to `ms`.
 *
 * @param {Number} ms
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.interval = function(ms){
  this._interval = ms;
  return this;
};

/**
 * Play through all the elements.
 *
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.play = function(){
  if (this.timer) return;
  this.timer = setInterval(this.cycle.bind(this), this._interval);
  this.emit('play');
  return this;
};

/**
 * Stop playing.
 *
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.stop = function(){
  clearInterval(this.timer);
  this.emit('stop');
  return this;
};

/**
 * Show the next slide, when the end
 * is reached start from the beginning.
 *
 * @api public
 */

Swipe.prototype.cycle = function(){
  if (this.isLast()) {
    this.current = -1;
    this.next();
  } else {
    this.next();
  }
};

/**
 * Check if we're on the first slide.
 *
 * @return {Boolean}
 * @api public
 */

Swipe.prototype.isFirst = function(){
  return this.current == 0;
};

/**
 * Check if we're on the last slide.
 *
 * @return {Boolean}
 * @api public
 */

Swipe.prototype.isLast = function(){
  return this.current == this.total - 1;
};

/**
 * Show the previous slide, if any.
 *
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.prev = function(){
  this.show(this.current - 1);
  return this;
};

/**
 * Show the next slide, if any.
 *
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.next = function(){
  this.show(this.current + 1);
  return this;
};

/**
 * Show slide `i`.
 *
 * @param {Number} i
 * @return {Swipe} self
 * @api public
 */

Swipe.prototype.show = function(i, ms){
  if (null == ms) ms = this._duration;
  i = Math.max(0, Math.min(i, this.total - 1));
  var x = this.childWidth * i;
  this.current = i;

  this.transitionDuration(ms);
  this.translate(x);
  this.emit('show', i);
  return this;
};

/**
 * Set transition duration.
 *
 * @api private
 */

Swipe.prototype.transitionDuration = function(ms){
  var s = this.child.style;
  s.webkitTransitionDuration =
  s.MozTransitionDuration =
  s.msTransitionDuration =
  s.OTransitionDuration =
  s.transitionDuration = ms + 'ms';
};

/**
 * Translate to `x`.
 *
 * @api private
 */

Swipe.prototype.translate = function(x){
  var s = this.child.style;
  x = -x;
  s.webkitTransform = s.MozTransform = 'translate3d(' + x + 'px, 0, 0)';
  s.msTransform = s.OTransform = 'translateX(' + x + 'px)';

  var transform = this.testTransform(); 
  if (!transform)
  	s.marginLeft = x + 'px';
};

/**
 * Test to determine if any transform css attribute 
 * is supported, and if not, we can
 * then set the marginLeft attribute. 
 */

Swipe.prototype.testTransform = function(){
  var prefixes = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' ');
  for(var i = 0; i < prefixes.length; i++) {
      if(document.createElement('div').style[prefixes[i]] !== undefined) {
          return prefixes[i];
      }
  }
  return false;
}


});
require.register("component-emitter/index.js", function(exports, require, module){

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
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = callbacks.indexOf(fn._off || fn);
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
require.register("component-classes/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var arr = this.el.className.split(re);
  if ('' === arr[0]) arr.pop();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("bmcmahen-swap-elements/index.js", function(exports, require, module){
// animate carousel

var Emitter = require('emitter')
	, classes = require('classes');

module.exports = function(selector, options){
	options || (options = {});
	return new swapElements(selector, options);
}

var swapElements = function(selector, options) {
	Emitter.call(this);
	this.list = document.querySelectorAll(selector);
	this.length = this.list.length; 
	this.currentIndex = options.startIndex || 0;
	this.active = this.list[this.currentIndex];
	classes(this.active).add('active');
	this.animationDuration = options.animationDuration || 600;
	this.duration = 7000; 
}

swapElements.prototype = new Emitter(); 

swapElements.prototype.play = function(duration){
	var self = this; 
	if (self.timer)
		return

	duration = duration || self.duration; 
	self.timer = window.setInterval(function(){
		self.next();
	}, duration);
	self.emit('play');
	return this; 
};

swapElements.prototype.stop = function(){
	window.clearInterval(this.timer);
	this.emit('stop');
	return this; 
}

swapElements.prototype.isFirst = function(){
	return this.currentIndex === 0; 
}

swapElements.prototype.isLast = function(){
	return this.currentIndex === this.length - 1; 
}

swapElements.prototype.next = function(){
	var nextIndex = this.isLast() ? 0 : this.currentIndex + 1;
	this.emit('next');
	this.goto(nextIndex);
};

swapElements.prototype.prev = function(){
	var prev = this.isFirst() ? this.length - 1 : this.currentIndex - 1;
	this.emit('prev');
	this.goto(prev);
	return this; 
};

swapElements.prototype.goto = function(i) {

	var self = this
		, prevElement = self.active; 

	if (self.currentIndex === i)
		return

	// if we are moving forward, then add a 'left' class to the element
	// otherwise, add a 'right' class
	var direction = self.currentIndex < i ? 'left' : 'right';
	classes(prevElement).add(direction);

	// after the animation has finished, remove the active tag. 
	setTimeout(function() {
		classes(prevElement).remove('active').remove(direction);
	}, self.animationDuration);

	// for the new div, add 'next' and 'left' and after a set duration, remove them
	// and add active
	
	var el = self.active = self.list[i]
		, side = (direction === 'left') ? 'next' : 'prev';

	classes(el).add(side);
	el.offsetWidth; // force reflow to get slide-in animation working
	classes(el).add(direction);

	setTimeout(function() { 
		classes(el).remove(direction).remove(side).add('active');
	}, self.animationDuration);

	self.emit('indexChanged', i);
	
	self.currentIndex = i; 
	return this; 
};
});
require.alias("bmcmahen-canvas-loading-animation/index.js", "undefined/deps/canvas-loading-animation/index.js");
require.alias("bmcmahen-request_animation_polyfill/index.js", "bmcmahen-canvas-loading-animation/deps/request_animation_polyfill/index.js");

require.alias("bmcmahen-swipe/index.js", "undefined/deps/swipe/index.js");
require.alias("component-events/index.js", "bmcmahen-swipe/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-event-manager/index.js", "component-events/deps/event-manager/index.js");

require.alias("component-emitter/index.js", "bmcmahen-swipe/deps/emitter/index.js");

require.alias("bmcmahen-swap-elements/index.js", "undefined/deps/swap-elements/index.js");
require.alias("component-emitter/index.js", "bmcmahen-swap-elements/deps/emitter/index.js");

require.alias("component-classes/index.js", "bmcmahen-swap-elements/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

