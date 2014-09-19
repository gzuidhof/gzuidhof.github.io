var t = new Trianglify({noiseIntensity: 0.1, cellsize: 85});
var pattern = t.generate(2048, 420);
document.querySelector("#feat-image").src = pattern.dataUri;