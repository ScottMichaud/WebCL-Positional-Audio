var app = window.app || {};
app.math = app.map || {};

app.math.lerp = function (min, max, tween) {
  'use strict';
  return min + tween * (max - min);
};

app.math.randomRange = function (min, max) {
  'use strict';
  return app.math.lerp(min, max, Math.random());
};