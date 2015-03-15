/*
* WebCL & WebAudio Positional Demo
* Author: Scott Michaud
* License: Proprietary (so I can re-license later)
* Copyright 2015
*/

/*
*
*/

var app = window.app || {};

app.init = function () {
  "use strict";
  
  app.map = document.getElementById('map');
  app.drawCtx = app.map.getContext('2d');
  app.map.width = document.getElementById('main').clientWidth;
  app.map.height = document.getElementById('main').clientHeight;
};

app.start = function () {
  "use strict";
  
  app.drawCtx.fillStyle = "#fff";
  app.drawCtx.fillRect(0, 0, app.map.width, app.map.height);
  
  app.boid = new window.boid(40);
  app.boid.setCenter(app.map.width / 2, app.map.height / 2);
  app.boid.setTarget(app.map.width / 2, (app.map.height / 2) - 1);
  app.boid.defineBoid();
  
  app.drawCtx.beginPath();
  app.drawCtx.moveTo(app.boid.points[0], app.boid.points[1]);
  app.drawCtx.lineTo(app.boid.points[2], app.boid.points[3]);
  app.drawCtx.lineTo(app.boid.points[4], app.boid.points[5]);
  app.drawCtx.lineTo(app.boid.points[6], app.boid.points[7]);
  app.drawCtx.fillStyle = "#000";
  app.drawCtx.fill();
  
  app.drawCtx.beginPath();
  app.drawCtx.arc(app.boid.location.x, app.boid.location.y, 4, 0, 2 * Math.PI);
  app.drawCtx.fillStyle = "red";
  app.drawCtx.fill();
};

window.addEventListener('DOMContentLoaded', app.init, false);
window.addEventListener('load', app.start, false);