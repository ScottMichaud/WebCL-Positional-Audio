/*
* WebCL & WebAudio Context Manager
* Author: Scott Michaud
* License: Proprietary (so I can re-license later)
* Copyright 2015
*/

window.pmAudio.clAudioCtx = function () {
  "use strict";
  
  
};

//Initialization of Static Components
(function () {
  "use strict";
  var pmAudio = window.pmAudio,
    console = window.console,
    i,
    j,
    platformDevices;

  pmAudio.clAudioCtx.prototype.selectProcessor = function (id) {
    this.clCtx = window.webcl.createContext(this.clDevices[id].device);
  };
  
  try {
    pmAudio.clAudioCtx.prototype.audioCtx = new window.AudioContext();
  } catch (e1) {
    console.log('Failed to create WebAudio context. Terminated with exception: ' + e1);
    return;
  }

  if (!window.webcl) {
    console.error('WebCL is not detected. Terminating without exception.');
    return;
  }

  try {
    pmAudio.clAudioCtx.prototype.clPlatforms = window.webcl.getPlatforms();
  } catch (e2) {
    console.log('Failed to detect an OpenCL driver. Terminated with exception: ' + e2);
    return;
  }

  pmAudio.clAudioCtx.prototype.clDevices = [];

  for (i = 0; i < pmAudio.clAudioCtx.prototype.clPlatforms.length; i += 1) {
    platformDevices = pmAudio.clAudioCtx.prototype.clPlatforms[i].getDevices(window.webcl.DEVICE_TYPE_ALL);
    for (j = 0; j < platformDevices.length; j += 1) {
      pmAudio.clAudioCtx.prototype.clDevices.push({
        platform: pmAudio.clAudioCtx.prototype.clPlatforms[i],
        device: platformDevices[j],
        type: platformDevices[j].getInfo(window.webcl.DEVICE_TYPE),
        name: platformDevices[j].getInfo(window.webcl.DEVICE_NAME).replace(/\s{2,}/g, ''),
        pID: i,
        dID: j
      });
    }
  }
  
  //WebCL Context is default to null because device (GPU/etc.) isn't yet selected.
  //Still want to give the compiler a clue for memory management, though.
  pmAudio.clAudioCtx.prototype.clCtx = null;
}());

