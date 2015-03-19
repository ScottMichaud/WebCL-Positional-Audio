/*
* Module Loader
* Author: Scott Michaud
* License: Proprietary (so I can re-license later)
* Copyright 2015
*/

//Declare namespace
window.pmAudio = window.pmAudio || {};

//Declare utility namespace
window.pmAudio.modules = window.pmAudio.modules || {};

//This is a list of modules
window.pmAudio.modules.list = ["src/core/clAudioCtx.js", "src/core/AudioSampleLoader.js"];

//This loads the scripts in pmAudio.modules.list
//It adds them to the DOM below the first script it sees
(function () {
  "use strict";
  
  if (!Array.isArray(window.pmAudio.modules.list)) {
    window.console.error('No Modules Loaded');
    return;
  }
  
  var script,
    existingScript = document.getElementsByTagName('script')[0],
    i;
  
  for (i = 0; i < window.pmAudio.modules.list.length; i = i + 1) {
    script = document.createElement('script');
    script.async = 'async';
    script.src = window.pmAudio.modules.list[i];
    existingScript.parentNode.insertBefore(script, existingScript);
  }
}());