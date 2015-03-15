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
  app.map.w = document.getElementById('main').clientWidth;
  app.map.h = document.getElementById('main').clientHeight;
};

app.start = function () {
  "use strict";
  app.drawCtx.fillStyle = "#fff";
  app.drawCtx.fillRect(0, 0, app.map.w, app.map.h);
};

window.addEventListener('DOMContentLoaded', app.init, false);
window.addEventListener('load', app.start, false);