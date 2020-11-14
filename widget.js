const BIT_DEPTH_MAX = 16;
const WEBAUDIO_MAX_SAMPLERATE = 96000;
const NUM_COLUMNS = 2;
const MAX_HARMONICS = 20;
function new_widget(panels, sliders, elem_id, width_factor=1.0, height_factor=1.0) { const sketch = p => {

var element = undefined;
if (elem_id) {
  element = document.getElementById(elem_id);
}

var canvas;
var numPanels = panels.length;
var numSliders = sliders.length;
let panelHeight, panelWidth, sliderWidth, sliderHeight, numColumns, widgetHeight, widgetWidth;
resize(1080, 1920);

// set display and fftSize to ensure there is enough data to fill the panels when zoomed all the way out
let fftSize = p.pow(2, p.round(p.log(panelWidth/minFreqZoom) / p.log(2)));
let displaySignalSize = p.max(fftSize, panelWidth/minTimeZoom) * 1.1; // 1.1 for 10% extra safety margin
let fft = new FFTJS(fftSize);
var settings =
    { amplitude : 1.0
    , fundFreq : 1250 // input signal fundamental freq
    , sampleRate : WEBAUDIO_MAX_SAMPLERATE
    , downsamplingFactor : 2
    , numHarm : 1 //Number of harmonics
    , harmType : "Odd" // Harmonic series to evaluate - Odd, even or all
    , harmSlope : "1/x" // Amplitude scaling for harmonics. can be used to create different shapes like saw or square
    , harmonicFreqs : new Float32Array(MAX_HARMONICS) //Array storing harmonic frequency in hz
    , harmonicAmps  : new Float32Array(MAX_HARMONICS) //Array storing harmonic amp  (0-1.0)
    , phase : 0.0 // phase offset for input signal
    , fftSize : fftSize
    , bitDepth : BIT_DEPTH_MAX //quantization bit depth
    , quantType : "midRise" // type of quantization
    , dither : 0.0 // amplitude of white noise added to signal before quantization
    , antialiasing : 0 // antialiasing filter order
    , original: new Float32Array(displaySignalSize)
    , downsampled: new Float32Array(1) // this gets re-inited when rendering waves
    , reconstructed: new Float32Array(displaySignalSize)
    , quantNoise: new Float32Array(displaySignalSize)
    , original_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , reconstructed_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , quantNoise_pb: new Float32Array(p.floor(WEBAUDIO_MAX_SAMPLERATE*soundTimeSeconds))
    , originalFreq : fft.createComplexArray()
    , reconstructedFreq : fft.createComplexArray()
    , quantNoiseFreq : fft.createComplexArray()
    , snd : undefined
    , maxVisibleFrequency : WEBAUDIO_MAX_SAMPLERATE / 2
    , freqZoom : 1.0 //X axis zoom for frequency panels
    , ampZoom : 1.0 // Y axis zoom for all panels
    , timeZoom: 1.0 // X axis zoom for signal panels
    };

p.setup = function () {
  canvas = p.createCanvas(p.windowWidth, p.windowHeight);
  if (element) canvas.parent(element);
  p.textAlign(p.CENTER);
  panels.forEach(panel => panel.setup(p, panelHeight, panelWidth, settings));
  sliders.forEach(slider => slider.setup(p, settings));
  buttonSetup();
  p.windowResized();
  p.noLoop();
  setTimeout(p.draw, 250);
};

p.draw = function() {
  sliders.forEach(slider => slider.updateValue(p)); // read sliders

  renderWaves();

  panels.forEach(panel => panel.drawPanel());

  panels.forEach( (panel, index) => {
    let y = p.floor(index / numColumns) * panelHeight;
    let x = p.floor(index % numColumns) * panelWidth;
    p.image(panel.buffer, x, y);
  });
};

p.windowResized = function() {
  let w, h;
  w = width_factor * p.windowWidth - 20;
  h = height_factor * p.windowHeight - 20;
  resize(w, h);
  p.resizeCanvas(widgetWidth, widgetHeight);
  panels.forEach(panel => panel.resize(panelHeight, panelWidth));

  let yoffset = canvas.position().y + panelHeight * p.ceil(numPanels/numColumns) + 20;
  let xoffset = canvas.position().x;
  sliders.forEach( (slider, index) => {
    let y = yoffset + p.floor(index / numColumns) * sliderHeight;
    let x = xoffset + p.floor(index % numColumns) * panelWidth;
    slider.resize(x + 20, y, sliderWidth,p);
  });

  let y = yoffset + p.floor((numSliders)/ numColumns) * sliderHeight;
  let x = xoffset + p.floor((numSliders) % numColumns) * panelWidth;
  let buttonWidth = (Math.round((sliderWidth - 20) / 3) - 20).toString() + "px";
  originalButton.position(x + 20, y);
  originalButton.style('width', buttonWidth);
  reconstructedButton.position(originalButton.x + originalButton.width + 20 , originalButton.y);
  reconstructedButton.style('width', buttonWidth);
  quantNoiseButton.position(reconstructedButton.x + reconstructedButton.width + 20, reconstructedButton.y);
  quantNoiseButton.style('width', buttonWidth);
};

function resize(w, h) {
  if (numPanels == 1 || w < 800) numColumns = 1;
  else numColumns = 2;
  let panelRows = Math.ceil(numPanels/numColumns) + 1; // + 1 because a panelHeight is for sliders
  let sliderRows = Math.ceil((numSliders+1)/numColumns); // + 1 for the buttons
  panelWidth   = p.constrain(w / numColumns, 400, 1920);
  sliderWidth  = panelWidth;
  panelHeight  = p.constrain(h / panelRows, 100, 1080); 
  sliderHeight = p.constrain(panelHeight / sliderRows, 30, 80);

  widgetHeight = panelHeight * (panelRows-1) + sliderHeight * (sliderRows + 1);
  widgetWidth = panelWidth * numColumns;
}

function buttonSetup() {

  originalButton = p.createButton("play original");
  originalButton.position(p.width/2 + 10, p.height - p.height / numPanels + 90);
  originalButton.mousePressed( () => {
    renderWaves(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.original_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });

  reconstructedButton = p.createButton("reconstructed");
  reconstructedButton.position(originalButton.x + originalButton.width * 1.1, originalButton.y);
  reconstructedButton.mousePressed( () => {
    renderWaves(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.reconstructed_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
  quantNoiseButton = p.createButton("quantiz. noise");
  quantNoiseButton.position(reconstructedButton.x + reconstructedButton.width * 1.1, reconstructedButton.y);
  quantNoiseButton.mousePressed( () => {
    renderWaves(true);
    if (!settings.snd) settings.snd = new (window.AudioContext || window.webkitAudioContext)();
    playWave(settings.quantNoise_pb, WEBAUDIO_MAX_SAMPLERATE, settings.snd);
  });
}

var renderWaves = renderWavesImpl(settings, fft, p);

function playWave(wave, sampleRate, audioctx) {
  var buffer = audioctx.createBuffer(1, wave.length, sampleRate);
  buffer.copyToChannel(wave, 0, 0);
  var source = audioctx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioctx.destination);
  source.start();
}


};
return new p5(sketch); } // end function new_widget() { var sketch = p => {
