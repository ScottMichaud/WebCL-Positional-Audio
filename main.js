/*
* WebCL & WebAudio Positional Demo
* Author: Scott Michaud
* License: Proprietary (so I can re-license later)
* Copyright 2015
*/

/*
* Main program logic
*/

//region Forward Declares
var app = window.app || {};
app.rain = app.rain || {};
window.pmAudio = window.pmAudio || {};
window.pmAudio.clAudioCtx = window.pmAudio.clAudioCtx || {};
//endregion

app.init = function () {
  "use strict";
  var fs,
    vs;
  
  app.mouse = {x: 0, y: 0};
  app.bIsRunning = false;
  
  app.rain.max = 50;
  app.rain.decay = 500; //Milliseconds
  app.rain.probability = 1 / ((app.rain.decay / 1000) * 60);
  app.rain.timestep = 512; //Not relevant for WebAudio, just WebCL.
  app.rain.outBuffer = window.Float32Array(app.rain.timestep * 2);
  app.webclDistanceScale = 100;
  
  app.elMap = document.getElementById('main');
  app.elWebAudio = document.getElementById('typeWebAudio');
  app.elWebCL = document.getElementById('typeWebCL');
  app.elDeviceSelector = document.getElementById('webclDeviceSelector');
  app.elStart = document.getElementById('startStop');
  app.elLoad = document.getElementById('load');
  app.elRain = document.getElementById('glPoints');
  
  try {
    app.gl = app.elRain.getContext('webgl') || app.elRain.getContext('experimental-webgl');
  } catch (e) {}
  
  if (!app.gl) {
    window.console.error('Could not acquire a WebGL context');
  }
  
  app.gl.clearColor(0.0, 0.0, 0.0, 0.0);
  app.gl.clear(app.gl.COLOR_BUFFER_BIT);
  
  fs = window.getShader(app.gl, 'pxRainPoints');
  vs = window.getShader(app.gl, 'vtxRainPoints');
  
  app.shaderProgram = app.gl.createProgram();
  app.gl.attachShader(app.shaderProgram, vs);
  app.gl.attachShader(app.shaderProgram, fs);
  app.gl.linkProgram(app.shaderProgram);
  
  app.gl.useProgram(app.shaderProgram);
  
  app.vtxPositionAttribute = app.gl.getAttribLocation(app.shaderProgram, 'points');
  app.gl.enableVertexAttribArray(app.vtxPositionAttribute);
  app.vtxRainBuffer = app.gl.createBuffer();
  
  app.elBoid = document.getElementById('boid');
  app.c2d = app.elBoid.getContext('2d');
  app.elMap.addEventListener('mousedown', app.canvasLMBDown, false);
  app.elMap.addEventListener('mouseup', app.canvasLMBUp, false);
  app.elMap.addEventListener('mousemove', app.canvasMouseMove, false);
  
  app.audio = new window.AudioContext();
};

app.load = function () {
  "use strict";
  var i,
    currentOption,
    sampleLoader;
  
  app.clGetter = new window.pmAudio.clAudioCtx();
  
  if (app.clGetter.clDevices) {
    for (i = 0; i < app.clGetter.clDevices.length; i += 1) {
      currentOption = document.createElement('option');
      currentOption.textContent = app.clGetter.clDevices[i].name;
      currentOption.setAttribute('value', i);
      app.elDeviceSelector.appendChild(currentOption);
    }
  } else {
    app.elWebCL.setAttribute('disabled', 'disabled');
  }
  
  app.elDeviceSelector.setAttribute('disabled', 'disabled');
  app.elWebCL.removeAttribute('checked');
  app.elWebAudio.setAttribute('checked', 'checked');
  
  app.elRain.width = app.elMap.clientWidth;
  app.elRain.height = app.elMap.clientHeight;
  app.gl.viewport(0, 0, app.gl.drawingBufferWidth, app.gl.drawingBufferHeight);
  app.elBoid.width = app.elMap.clientWidth;
  app.elBoid.height = app.elMap.clientHeight;
  
  sampleLoader = new window.AudioSampleLoader();
  sampleLoader.src = 'assets/Water-Dirt-01.ogg';
  sampleLoader.onload = function () {
    app.rain.samples = sampleLoader.response;
    app.pingReady();
  };
  sampleLoader.send();
  
  app.boid = new window.boid(30);
  app.boid.setCenter(app.elMap.clientWidth / 2, app.elMap.clientHeight / 2);
  app.boid.setTarget(app.elMap.clientWidth / 2, (app.elMap.clientHeight / 2) - 1);
  app.boid.defineBoid();
  
  app.boid.draw = function () {
    app.boid.defineBoid();
    
    app.c2d.beginPath();
    app.c2d.moveTo(app.boid.points[0], app.boid.points[1]);
    app.c2d.lineTo(app.boid.points[2], app.boid.points[3]);
    app.c2d.lineTo(app.boid.points[4], app.boid.points[5]);
    app.c2d.lineTo(app.boid.points[6], app.boid.points[7]);
    app.c2d.fillStyle = '#000';
    app.c2d.fill();
    
    app.c2d.beginPath();
    app.c2d.arc(app.boid.location.x, app.boid.location.y, 4, 0, 2 * Math.PI);
    app.c2d.fillStyle = 'red';
    app.c2d.fill();
  };
  
  window.requestAnimationFrame(app.draw);
};

app.canvasMouseMove = function (e) {
  "use strict";
  
  app.mouse.x = e.clientX - 75;
  app.mouse.y = e.clientY - 75;
};

app.canvasLMBDown = function (e) {
  "use strict";
  
  if (e.which === 1) {
    app.boid.setCenter(app.mouse.x, app.mouse.y);
    app.boid.bIsOrienting = true;
    app.boid.bNeedsRedraw = true;
  }
};

app.canvasLMBUp = function (e) {
  "use strict";
  
  if (e.which === 1) {
    app.boid.bIsOrienting = false;
  }
};

app.parseInputParticleCount = function () {
  "use strict";
  var i,
    value,
    isValid;
  
  value = document.getElementById("inputParticleCount").value;
  isValid = true;
  
  //Only allow direct integer input.
  //If not an integer, use previous amount.
  for (i = 0; i < value.length; i += 1) {
    switch (value.charAt(i)) {
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      break;
    default:
      isValid = false;
    }
  }
  
  if (value.length < 1) {
    isValid = false;
  }
  
  if (isValid) {
    app.rain.max = window.parseInt(value, 10);
  }
};

app.loadPress = function () {
  "use strict";
  
  app.clGetter.selectProcessor(app.elDeviceSelector.selectedIndex);
  app.getKernel();
  app.initWebCL();
};

app.beginPress = function () {
  "use strict";
  
};

app.pingReady = function () {
  "use strict";
  
  //Only need to wait for sample(s) load/decode to complete.
  app.unlockBegin();
};

app.unlockBegin = function () {
  "use strict";
  
  app.elStart.removeAttribute('disabled');
};

app.selectNoOffload = function () {
  "use strict";
  
  app.elDeviceSelector.setAttribute('disabled', 'disabled');
  app.elWebCL.removeAttribute('checked');
  app.elWebAudio.setAttribute('checked', 'checked');
};

app.selectWebCL = function () {
  "use strict";
  
  app.elDeviceSelector.removeAttribute('disabled');
  app.elWebCL.setAttribute('checked', 'checked');
  app.elWebAudio.removeAttribute('checked');
};

app.draw = function (timestamp) {
  "use strict";
  
  window.requestAnimationFrame(app.draw);
  
  if (app.bIsRunning) {
    
    if (app.elWebAudio.hasAttribute('checked')) {
      app.webAudioSimulateRain(timestamp);
    } else if (app.elWebCL.hasAttribute('checked')) {
      app.webclSimulateRainVideo(timestamp);
    }
    
    app.rain.draw();
  }
  
  if (app.boid.bNeedsRedraw) {
    app.c2d.clearRect(0, 0, app.elBoid.width, app.elBoid.height);
    app.boid.setTarget(app.mouse.x, app.mouse.y);
    app.boid.defineBoid();
    app.boid.draw();
    
    //If the above redraw was the last one for this reorientation.
    if (!app.boid.bIsOrienting) {
      app.boid.bNeedsRedraw = false;
    }
  }
  if (app.bWasResized) {
    
    app.bWasResized = false;
    
    app.elRain.width = app.elMap.clientWidth;
    app.elRain.height = app.elMap.clientHeight;
    app.gl.viewport(0, 0, app.gl.drawingBufferWidth, app.gl.drawingBufferHeight);
    app.elBoid.width = app.elMap.clientWidth;
    app.elBoid.height = app.elMap.clientHeight;
    
    app.c2d.clearRect(0, 0, app.elBoid.width, app.elBoid.height);
    app.boid.setCenter(app.elBoid.width / 2, app.elBoid.height / 2);
    app.boid.setTarget(app.elBoid.width / 2, (app.elBoid.height / 2) - 1);
    app.boid.defineBoid();
    app.boid.draw();
  }
  app.lastFrame = timestamp;
};

app.resize = function () {
  "use strict";
  
  app.bWasResized = true;
};

app.getKernelSrc = function () {
  "use strict";
  
  app.kernelSrc = document.getElementById('clMixSamples').text;
};

//Runs when device is selected, but not number of particles.
app.initWebCL = function () {
  "use strict";
  
};

//Runs when number of particles are selected, just after play pressed.
app.primeWebCL = function () {
  "use strict";
  
  
};

//region Window Event Listeners
window.addEventListener('DOMContentLoaded', app.init, false);
window.addEventListener('load', app.load, false);
window.addEventListener('resize', app.resize, false);
//endregion
