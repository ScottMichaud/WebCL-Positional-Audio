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
  app.webclDistanceScale = 1000;
  
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

app.beginPress = function () {
  "use strict";
  
  app.bIsRunning = true;
  app.elStart.textContent = 'Stop';
  app.elStart.onclick = app.stopPress;
  
  app.lastFrame = window.performance.now();
  
  app.parseInputParticleCount();
  
  app.generateInitialParticles(app.rain.max);
  
  if (app.elWebCL.hasAttribute('checked')) {
    app.clGetter.selectProcessor(app.elDeviceSelector.selectedIndex);
    app.getKernel();
    app.setupKernel();
    app.scriptNode = app.audio.createScriptProcessor(app.rain.timestep, 2, 2);
    app.scriptNode.onaudioprocess = app.webclSimulateRainAudio;
    app.scriptNode.connect(app.audio.destination);
  }
};

app.stopPress = function () {
  "use strict";
  
  app.bIsRunning = false;
  app.elStart.textContent = 'Begin';
  app.elStart.onclick = app.beginPress;
  app.gl.clear(app.gl.COLOR_BUFFER_BIT);
  
  if (app.scriptNode) {
    app.scriptNode.disconnect();
  }
  if (app.clGetter.clCtx) {
    window.setTimeout(function () {
      app.clGetter.clCtx.releaseAll();
    }, ((app.rain.timestep + 100) * 1000 / 44100));
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
  
  app.elRain.width = app.elMap.clientWidth;
  app.elRain.height = app.elMap.clientHeight;
  app.gl.viewport(0, 0, app.gl.drawingBufferWidth, app.gl.drawingBufferHeight);
  app.elBoid.width = app.elMap.clientWidth;
  app.elBoid.height = app.elMap.clientHeight;
  
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
      app.webclSimulateRainVideo(timestamp);
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
    app.gl.viewport(0, 0, app.gl.drawingBufferWidth, app.gl.drawingBufferHeight);
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
  var i,
    cueSamples,
    cuePosition;
  
  //app.rain.max = number;
  
  //Web Audio: AOS: {float x, float y, float life}
  //WebCL: AOS: {float x, float y, int32 sampleStart, int32 sampleEnd, int32 samplePosition}
  //CHANGE: Now two: {float x, float y} & {int32 sampleStart, int32 sampleEnd, int32 samplePosition}
  //Structures are not allowed in kernel params for WebCL.
    
  app.rain.webAudioCalls = new window.ArrayBuffer(number * 12);
  app.rain.webclCallsFloat = new window.ArrayBuffer(number * 8);
  app.rain.webclCallsInt = new window.ArrayBuffer(number * 12);
  
  app.rain.webAudioView = new window.Float32Array(app.rain.webAudioCalls);
  
  app.rain.webclFloatView = new window.Float32Array(app.rain.webclCallsFloat);
  app.rain.webclIntView = new window.Int32Array(app.rain.webclCallsInt);
  
  cueSamples = app.rain.samples.length;
  
  for (i = 0; i < 3 * app.rain.max; i += 1) {
    app.rain.webAudioView[i] = Math.random();
  }
  
  //Replacement for below.
  for (i = 0; i < app.rain.max; i += 1) {
    app.rain.webclFloatView[2 * i] = app.rain.webAudioView[3 * i] * app.webclDistanceScale;
    app.rain.webclFloatView[2 * i + 1] = app.rain.webAudioView[3 * i + 1] * app.webclDistanceScale;
    
    app.rain.webclIntView[3 * i] = 0; //TODO: Multiple Samples
    app.rain.webclIntView[3 * i + 1] = cueSamples;
    cuePosition = app.rain.webAudioView[3 * i + 2] * Math.round(44100 * app.rain.decay / 1000);
    app.rain.webclIntView[3 * i + 2] = cuePosition;
  }
};

app.webAudioSimulateRain = function (timestamp) {
  "use strict";
  var i,
    deltaTime,
    audioTime,
    srcNode,
    pannerNode;
  
  audioTime = app.audio.currentTime;
  app.audio.listener.setPosition(app.boid.location.x / app.elBoid.width,
                                 app.boid.location.y / app.elBoid.height,
                                 0);
  app.audio.listener.setOrientation(-app.boid.direction.x,
                                    -app.boid.direction.y,
                                    0,
                                    0, 0, 1);
  
  deltaTime = timestamp - app.lastFrame;
  for (i = 0; i < 3 * app.rain.max; i += 3) {
    app.rain.webAudioView[i + 2] -= deltaTime / app.rain.decay;
    
    //Triggers a new sound call.
    if (app.rain.webAudioView[i + 2] <= 0 && app.rain.probability > Math.random()) {
      app.rain.webAudioView[i] = Math.random();
      app.rain.webAudioView[i + 1] = Math.random();
      app.rain.webAudioView[i + 2] = 1;
      
      srcNode = app.audio.createBufferSource();
      srcNode.buffer = app.rain.samples;
      pannerNode = app.audio.createPanner();
      pannerNode.panningModel = 'equalpower';
      pannerNode.setPosition(app.rain.webAudioView[i],
                             app.rain.webAudioView[i + 1],
                             0);
      srcNode.connect(pannerNode);
      pannerNode.connect(app.audio.destination);
      srcNode.start(audioTime + (0.03 * Math.random()));
    }
  }
};

app.webclSimulateRainAudio = function (e) {
  "use strict";
  var i,
    response,
    outputFullBuffer,
    outputLeft,
    outputRight;
  
  for (i = 0; i < app.rain.max; i += 1) {
    //If "life" has been reset: start a new sound.
    //Else: Keep simulating current one.
    
    if (app.rain.webAudioView[3 * i + 2] === 1) {
      app.rain.webclFloatView[2 * i] = app.rain.webAudioView[3 * i] * app.webclDistanceScale;
      app.rain.webclFloatView[2 * i + 1] = app.rain.webAudioView[3 * i + 1] * app.webclDistanceScale;
      
      //Set the current sample to the start.
      app.rain.webclIntView[3 * i + 2] = app.rain.webclIntView[3 * i];
      //TODO: Adjust sampleStart (3i) and sampleEnd (2i + 1) for new sound cue, if multiple.
      app.rain.webAudioView[3 * i + 2] = 0.99;
      
    } else {
      app.rain.webclIntView[3 * i + 2] += app.rain.timestep;
    }
  }
  
  response = app.runKernel();
  
  outputFullBuffer = e.outputBuffer;
  outputLeft = outputFullBuffer.getChannelData(0);
  outputRight = outputFullBuffer.getChannelData(1);
  
  for (i = 0; i < 2 * app.rain.timestep; i += 2) {
    outputLeft[i / 2] = response[i];
    outputRight[i / 2] = response[i + 1];
  }
};

app.webclSimulateRainVideo = function (timestamp) {
  "use strict";
  var i,
    deltaTime;
  
  deltaTime = timestamp - app.lastFrame;
  
  for (i = 0; i < 3 * app.rain.max; i += 3) {
    app.rain.webAudioView[i + 2] -= deltaTime / app.rain.decay;
    
    //Triggers a new sound call.
    if (app.rain.webAudioView[i + 2] <= 0 && app.rain.probability > Math.random()) {
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

app.getKernel = function () {
  "use strict";
  
  app.kernelSrc = document.getElementById('clMixSamples').text;
};

app.setupKernel = function () {
  "use strict";
  var cl;
  
  cl = app.clGetter.clCtx;
  app.ioQueue = app.clGetter.clCtx.createCommandQueue(app.device);
  app.cmdQueue = app.clGetter.clCtx.createCommandQueue(app.device);
  app.bufParticlesFloat = cl.createBuffer(window.WebCL.MEM_READ_ONLY, app.rain.webclCallsFloat.byteLength);
  app.bufParticlesInt = cl.createBuffer(window.WebCL.MEM_READ_ONLY, app.rain.webclCallsInt.byteLength);
  app.bufOutput = cl.createBuffer(window.WebCL.MEM_WRITE_ONLY, 8 * app.rain.timestep);
  app.bufSoundCues = cl.createBuffer(window.WebCL.MEM_READ_ONLY, app.rain.samples.getChannelData(0).byteLength);
  app.clProgram = cl.createProgram(app.kernelSrc);
  app.device = cl.getInfo(window.WebCL.CONTEXT_DEVICES)[0];
  app.clProgram.build([app.device], "");
  app.kernel = app.clProgram.createKernel('clMixSamples');
  app.kernel.setArg(0, app.bufParticlesFloat);
  app.kernel.setArg(1, app.bufParticlesInt);
  app.kernel.setArg(2, app.bufOutput);
  app.kernel.setArg(3, app.bufSoundCues);
  app.kernel.setArg(6, new window.Int32Array([app.rain.max]));
  app.kernel.setArg(7, new window.Int32Array([app.rain.timestep]));
};

app.runKernel = function () {
  "use strict";
  var cl,
    output;
  
  cl = app.clGetter.clCtx;
  app.kernel.setArg(4, new window.Float32Array([(app.boid.location.x / app.elMap.clientWidth) * app.webclDistanceScale, (app.boid.location.y / app.elMap.clientHeight) * app.webclDistanceScale]));
  app.kernel.setArg(5, new window.Float32Array([app.boid.direction.x, app.boid.direction.y]));
  
  //app.cmdQueue = cl.createCommandQueue(app.device);
  app.cmdQueue.enqueueWriteBuffer(app.bufParticlesFloat, false, 0, app.rain.webclCallsFloat.byteLength, app.rain.webclFloatView);
  app.cmdQueue.enqueueWriteBuffer(app.bufParticlesInt, false, 0, app.rain.webclCallsInt.byteLength, app.rain.webclIntView);
  app.cmdQueue.enqueueWriteBuffer(app.bufSoundCues, false, 0, app.rain.samples.getChannelData(0).byteLength, app.rain.samples.getChannelData(0));
  
  app.cmdQueue.enqueueNDRangeKernel(app.kernel, 1, null, [app.rain.timestep]);
  
  output = new window.Float32Array(app.rain.timestep * 2);
  app.cmdQueue.enqueueReadBuffer(app.bufOutput, false, 0, output.byteLength, output);
  //app.cmdQueue.enqueueReadBuffer(app.bufOutput, false, 0, app.rain.timestep * 2, output);
  
  return output;
};

//region Window Event Listeners
window.addEventListener('DOMContentLoaded', app.init, false);
window.addEventListener('load', app.load, false);
window.addEventListener('resize', app.resize, false);
//endregion
