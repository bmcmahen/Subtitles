
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
