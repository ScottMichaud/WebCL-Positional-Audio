/*
* A Simple Boid Class
* Author: Scott Michaud
* License: Proprietary (so I can re-license later)
* Copyright 2015
*/

/*
* It's a data structure to create a boid.
* Points are defined as (x,y) pairs on an eight-element array.
* Pairs are listed clockwise: Forward, Starboard, Rear, Port.
* Origin is the rear point.
*/

(function () {
  "use strict";
  window.boid = function (size) {
    this.size = size;
    this.halfWidth = this.size * 0.5;
    this.location = {x: 0, y: 0};
    this.target = {x: 0, y: 1};
    this.points = [0, 0, 0, 0, 0, 0, 0, 0];
    
    this.defineBoid();
  };
  
  window.boid.prototype.setCenter = function (x, y) {
    this.location.x = x;
    this.location.y = y;
    
    //this.defineBoid();
  };
  
  window.boid.prototype.setTarget = function (x, y) {
    this.target.x = x;
    this.target.y = y;
    
    //this.defineBoid();
  };
  
  window.boid.prototype.defineBoid = function () {
    var direction,
      normalizeFactor,
      rotatedDirection;
    
    //Handle case where location = target
    if (this.target.x === this.location.x &&
        this.target.y === this.location.y) {
      this.target.y -= 1;
    }
    
    direction = {
      x: this.target.x - this.location.x,
      y: this.target.y - this.location.y
    };
    
    normalizeFactor = Math.sqrt(
      Math.pow(direction.x, 2) + Math.pow(direction.y, 2)
    );
    
    direction.x = direction.x / normalizeFactor;
    direction.y = direction.y / normalizeFactor;
    
    this.points[4] = this.location.x;
    this.points[5] = this.location.y;
    
    //75% of the size goes forward. 25% goes backwards.
    this.points[0] = (this.size * 0.75 * direction.x) + this.location.x;
    this.points[1] = (this.size * 0.75 * direction.y) + this.location.y;
    
    /*
    * 90 deg to the right is:
    *                         [0 -1]
    *                         [1  0]
    */
    
    rotatedDirection = {
      x: -direction.y,
      y: direction.x
    };
    
    //Wings
    //Move 25% of total size away from origin, in minus-forward direction.
    //Then move half-of-a-width orthogonal to forward.
    
    //Starboard wing
    this.points[2] = this.location.x - (this.size * 0.25 * direction.x);
    this.points[2] = this.points[2] + (rotatedDirection.x * this.halfWidth);
    this.points[3] = this.location.y - (this.size * 0.25 * direction.y);
    this.points[3] = this.points[3] + (rotatedDirection.y * this.halfWidth);
    
    //Port wing
    this.points[6] = this.location.x - (this.size * 0.25 * direction.x);
    this.points[6] = this.points[6] - (rotatedDirection.x * this.halfWidth);
    this.points[7] = this.location.y - (this.size * 0.25 * direction.y);
    this.points[7] = this.points[7] - (rotatedDirection.y * this.halfWidth);
  };
}());