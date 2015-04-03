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
  app.rain.decay = 300; //Milliseconds
  app.rain.timestep = 512; //Not relevant for WebAudio, just offloading.
  
  app.elMap = document.getElementById('main'); //Container for various canvas layers.
  
  app.elWebAudio = document.getElementById('typeWebAudio');
  app.elWebCL = document.getElementById('typeWebCL');
  app.elDeviceSelector = document.getElementById('webclDeviceSelector');
  
  app.elStart = document.getElementById('startStop');
  app.elRain = document.getElementById('glPoints');
  app.elRain.width = app.elMap.clientWidth;
  app.elRain.height = app.elMap.clientHeight;
  
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
  app.elBoid.width = app.elMap.clientWidth;
  app.elBoid.height = app.elMap.clientHeight;
  app.elMap.addEventListener('mousedown', app.canvasLMBDown, false);
  app.elMap.addEventListener('mouseup', app.canvasLMBUp, false);
  app.elMap.addEventListener('mousemove', app.canvasMouseMove, false);
  
  app.audio = new window.AudioContext();
  app.generateInitialParticles(app.rain.max);
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
  
  //Set "No Offloading" as default
  app.elDeviceSelector.setAttribute('disabled', 'disabled');
  app.elWebCL.removeAttribute('checked');
  app.elWebAudio.setAttribute('checked', 'checked');
  
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
  
  app.firstDraw();
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

app.beginPress = function () {
  "use strict";
  
  app.bIsRunning = true;
  app.elStart.textContent = 'Stop';
  app.elStart.onclick = app.stopPress;
  
  app.lastFrame = window.performance.now();
  
  if (app.elWebCL.hasAttribute('checked')) {
    app.clGetter.selectProcessor(app.elDeviceSelector.selectedIndex);
    app.getKernel();
    app.setupKernel(app.rain.timestep);
    app.scriptNode = app.audio.createScriptProcessor(app.rain.timestep, 2, 2);
    app.scriptNode.onaudioprocess = app.audioProcess;
    app.scriptNode.connect(app.audio.destination);
  }
};

app.stopPress = function () {
  "use strict";
  
  app.bIsRunning = false;
  app.elStart.textContent = 'Begin';
  app.elStart.onclick = app.beginPress;
  app.gl.clear(app.gl.COLOR_BUFFER_BIT);
  
  if (app.audio.clStream) {
    app.audio.clStream.disconnect();
  }
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

app.pingReady = function () {
  "use strict";
  
  //Only need to wait for sample(s) load/decode to complete.
  app.unlockBegin();
};

app.unlockBegin = function () {
  "use strict";
  
  app.elStart.removeAttribute('disabled');
};

app.firstDraw = function () {
  "use strict";
  
  app.boid.defineBoid();
  app.boid.draw();
};

app.draw = function (timestamp) {
  "use strict";
  
  window.requestAnimationFrame(app.draw);
  
  //pragma region Simulating Rain
  if (app.bIsRunning) {
    
    if (app.elWebAudio.hasAttribute('checked')) {
      app.webAudioSimulateRain(timestamp);
    } else if (app.elWebCL.hasAttribute('checked')) {
      app.webclSimulateRain(timestamp);
    }
    
    app.rain.draw();
  }
  //pragma endregion
  
  //pragma region Animating Boids
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
  //pragma endregion
  
  //pragma region Animating Resize
  if (app.bWasResized) {
    
    app.bWasResized = false;
    
    app.elRain.width = app.elMap.clientWidth;
    app.elRain.height = app.elMap.clientHeight;
    app.gl.viewport(0, 0, app.elRain.width, app.elRain.height);
    app.elBoid.width = app.elMap.clientWidth;
    app.elBoid.height = app.elMap.clientHeight;
    
    app.c2d.clearRect(0, 0, app.elBoid.width, app.elBoid.height);
    app.boid.setCenter(app.elBoid.width / 2, app.elBoid.height / 2);
    app.boid.setTarget(app.elBoid.width / 2, (app.elBoid.height / 2) - 1);
    app.boid.defineBoid();
    app.boid.draw();
  }
  //pragma endregion
  
  app.lastFrame = timestamp;
};

app.generateInitialParticles = function (number) {
  "use strict";
  var i;
  
  app.rain.max = number;
  
  //Web Audio: AOS: {float x, float y, float life}
  //WebCL: AOS: {float x, float y, int32 sampleStart, int32 sampleEnd, int32 samplePosition}
    
  app.rain.webAudioCalls = new window.ArrayBuffer(number * 12);
  app.rain.webclCalls = new window.ArrayBuffer(number * 20);
  
  app.rain.webAudioView = new window.Float32Array(app.rain.webAudioCalls);
  
  for (i = 0; i < 3 * app.rain.max; i += 1) {
    app.rain.webAudioView[i] = Math.random();
  }
};

app.webAudioSimulateRain = function (timestamp) {
  "use strict";
  var i,
    deltaTime;
  
  deltaTime = timestamp - app.lastFrame;
  for (i = 0; i < 3 * app.rain.max; i += 3) {
    app.rain.webAudioView[i + 2] -= (deltaTime / app.rain.decay);
    
    //Triggers a new sound call.
    if (app.rain.webAudioView[i + 2] <= 0) {
      app.rain.webAudioView[i] = Math.random();
      app.rain.webAudioView[i + 1] = Math.random();
      app.rain.webAudioView[i + 2] = 1;
    }
  }
};

app.webclSimulateRain = function (timestamp) {
  "use strict";
  var i,
    deltaTime;
  
  deltaTime = timestamp - app.lastFrame;
  
  for (i = 0; i < 3 * app.rain.max; i += 3) {
    app.rain.webAudioView[i + 2] -= (deltaTime / app.rain.decay);
    
    //Triggers a new sound call.
    if (app.rain.webAudioView[i + 2] <= 0) {
      app.rain.webAudioView[i] = Math.random();
      app.rain.webAudioView[i + 1] = Math.random();
      app.rain.webAudioView[i + 2] = 1;
    }
  }
};

app.rain.draw = function () {
  "use strict";
  
  app.gl.clear(app.gl.COLOR_BUFFER_BIT);
  app.gl.bindBuffer(app.gl.ARRAY_BUFFER, app.vtxRainBuffer);
  app.gl.bufferData(app.gl.ARRAY_BUFFER, app.rain.webAudioView, app.gl.STATIC_DRAW);
  app.gl.vertexAttribPointer(app.vtxPositionAttribute, 3, app.gl.FLOAT, false, 0, 0);
  app.gl.drawArrays(app.gl.POINTS, 0, app.rain.max);
};

app.resize = function () {
  "use strict";
  
  app.bWasResized = true;
};

//region Window Event Listeners
window.addEventListener('DOMContentLoaded', app.init, false);
window.addEventListener('load', app.load, false);
window.addEventListener('resize', app.resize, false);
//endregion
