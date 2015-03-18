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
window.pmAudio = window.pmAudio || {};
window.pmAudio.clAudioCtx = window.pmAudio.clAudioCtx || {};

app.init = function () {
  "use strict";
  
  app.mouse = {x: 0, y: 0};
  app.map = document.getElementById('map');
  app.drawCtx = app.map.getContext('2d');
  app.map.width = document.getElementById('main').clientWidth;
  app.map.height = document.getElementById('main').clientHeight;
  app.map.addEventListener("mousedown", app.canvasLMBDown, false);
  app.map.addEventListener("mouseup", app.canvasLMBUp, false);
  app.map.addEventListener("mousemove", app.canvasMouseMove, false);
};

app.start = function () {
  "use strict";
  var i,
    tempOption,
    tempCLSelect;
  
  tempCLSelect = document.getElementById('webclDeviceSelector');
  
  app.clCtx = new window.pmAudio.clAudioCtx();
  
  //If WebCL is present and lists devices.
  if (app.clCtx.clDevices) {
    for (i = 0; i < app.clCtx.clDevices.length; i += 1) {
      tempOption = document.createElement('option');
      tempOption.textContent = app.clCtx.clDevices[i].name;
      tempOption.setAttribute('value', i);
      tempCLSelect.appendChild(tempOption);
    }
  } else {
    document.getElementById('typeWebCL').setAttribute('disabled', 'disabled');
  }
  
  //Disable WebCL dropdown by default.
  tempCLSelect.setAttribute('disabled', 'disabled');
  document.getElementById('typeWebCL').removeAttribute('checked');
  document.getElementById('typeWebAudio').setAttribute('checked', 'checked');
  
  app.boid = new window.boid(30);
  app.boid.setCenter(app.map.width / 2, app.map.height / 2);
  app.boid.setTarget(app.map.width / 2, (app.map.height / 2) - 1);
  app.boid.defineBoid();
  
  app.boid.draw = function () {
    app.startFrame();
    app.drawCtx.beginPath();
    app.drawCtx.moveTo(app.boid.points[0], app.boid.points[1]);
    app.drawCtx.lineTo(app.boid.points[2], app.boid.points[3]);
    app.drawCtx.lineTo(app.boid.points[4], app.boid.points[5]);
    app.drawCtx.lineTo(app.boid.points[6], app.boid.points[7]);
    app.drawCtx.fillStyle = '#000';
    app.drawCtx.fill();

    app.drawCtx.beginPath();
    app.drawCtx.arc(app.boid.location.x, app.boid.location.y, 4, 0, 2 * Math.PI);
    app.drawCtx.fillStyle = 'red';
    app.drawCtx.fill();
  };
  
  app.firstDraw();
  window.requestAnimationFrame(app.draw);
};

app.startFrame = function () {
  "use strict";
  
  //Nothing needed here at the moment...
};

app.canvasLMBDown = function (e) {
  "use strict";
  
  if (e.which === 1) {
    app.boid.setCenter(app.mouse.x, app.mouse.y);
    app.boid.bIsOrienting = true;
  }
};

app.canvasLMBUp = function (e) {
  "use strict";
  
  if (e.which === 1) {
    app.boid.setTarget(app.mouse.x, app.mouse.y);
    app.boid.defineBoid();
    app.boid.bIsOrienting = false;
  }
};

app.canvasMouseMove = function (e) {
  "use strict";
  
  app.mouse.x = e.clientX - 75;
  app.mouse.y = e.clientY - 75;
};

app.noOffloadSelected = function () {
  "use strict";
  
  document.getElementById('webclDeviceSelector').setAttribute('disabled', 'disabled');
};

app.webCLOffloadSelected = function () {
  "use strict";
  
  document.getElementById('webclDeviceSelector').removeAttribute('disabled');
};

app.firstDraw = function () {
  "use strict";
  
  app.boid.defineBoid();
  app.boid.draw();
};

app.draw = function () {
  "use strict";
  
  window.requestAnimationFrame(app.draw);
  
  app.startFrame();
  if (app.boid.bIsOrienting) {
    app.drawCtx.clearRect(0, 0, app.map.width, app.map.height);
    app.boid.setTarget(app.mouse.x, app.mouse.y);
    app.boid.defineBoid();
    app.boid.draw();
  }
};

app.resize = function () {
  "use strict";
  
  app.map.width = document.getElementById('main').clientWidth;
  app.map.height = document.getElementById('main').clientHeight;
  app.boid.setCenter(app.map.width / 2, app.map.height / 2);
  app.boid.setTarget(app.map.width / 2, (app.map.height / 2) - 1);
  app.boid.defineBoid();
  app.draw();
};

window.addEventListener('DOMContentLoaded', app.init, false);
window.addEventListener('load', app.start, false);
window.addEventListener('resize', app.resize, false);