class slider{
  button;
  slider;
  constructor(){
  }

  setup(p, settings){
    // should be overridden to set up the slider
  }

  propertyValue(){
    // override with any calculations to derive the property value from the slider value
    return this.slider.value();
  }

  updateValue(p){
    this.settings[this.propName] = this.propertyValue();
    this.displayVal = this.calcDisplayVal();
    this.textBox.value(this.displayVal);
    this.textLabel.html(this.name+': ');
  }

  makeSlider(p){
    this.slider = p.createSlider(this.min, this.max, this.initial, this.step);
    this.textLabel = p.createP();
    this.slider.input(p.draw);
    this.slider.mousePressed(p.draw);
    this.slider.mouseReleased(p.draw);
    this.textBox = p.createInput();
    this.textBox.size(300);
    this.button = p.createButton("Update");
    // this.button.size(200)
    this.button.mousePressed(this.buttonPressed.bind(this));
    this.button.mouseReleased(p.draw);
  }

  resize(x, y, w, p){
    this.width = w;
    let width = w - 40;
    let labelWidth = this.smallWidth() ? 10 : 200;
    width -= labelWidth;
    let sliderWidth = width * 0.6;
    width -= sliderWidth;
    let textboxWidth = width * 0.6;
    width -= textboxWidth;
    let buttonWidth = width;

    this.slider.style('width', Math.round(sliderWidth).toString() + "px");
    this.slider.position(x, y);
    this.textLabel.position(x + this.slider.width + 10, y - 15);
    if (this.smallWidth()) this.textLabel.hide();
    else this.textLabel.show();
    this.textBox.position(x+this.slider.width + labelWidth,y);
    this.textBox.style('width', Math.round(textboxWidth).toString() + "px");
    this.button.position(this.textBox.x+this.textBox.width+5,y);
    this.button.style('width', Math.round(buttonWidth).toString() + "px");
  }

  smallWidth(){
    return this.width < 600;
  }

  buttonPressed(){
    this.slider.value(this.calcSliderVal());  }

  calcSliderVal(){
    // override this with any calculations needed to convert textbox val to slider val (%, etc)
    // TODO: we could provide more robust parsing to extract a number from the input here...
    let text = this.textBox.value();
    let word_boundary = text.indexOf(" ");
    if (word_boundary != -1) text = text.substr(0, word_boundary);
    return text;
  }

  displayValSuffix(){
    return this.smallWidth() ? " " + this.propName : "";
  }

  calcDisplayVal(){
    // override this with any calculations needed to convert stored variable to display val (%, etc)
    return this.settings[this.propName] + this.displayValSuffix();
  }
}


class freqSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name = "Frequency";
    this.unit = "Hz";
    this.propName = "fundFreq";
    this.min = 0;
    this.max = this.settings.sampleRate / 4 ;
    this.initial = 440;
    this.step = 1.0;
    this.displayVal = this.initial;
    this.makeSlider(p);
  }

}

class numHarmSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Number of harmonics";
    this.unit = "";
    this.propName="numHarm"
    this.min = 1;
    this.max = 20;
    this.initial = 1;
    this.step = 1;
    this.displayVal = this.initial;
    this.oddEvenSel = p.createSelect();
    this.oddEvenSel.option("Odd");
    this.oddEvenSel.option("Even");
    this.oddEvenSel.option("All");
    this.oddEvenSel.selected(this.settings.harmType);
    this.oddEvenSel.changed(()=>this.settings.harmType = this.oddEvenSel.value());

    this.slopeSel = p.createSelect();
    this.slopeSel.option("1/x");
    this.slopeSel.option("1/x2");
    this.slopeSel.option("lin");
    this.slopeSel.option("flat");
    this.slopeSel.selected(this.settings.harmSlope);
    this.slopeSel.changed(()=>this.settings.harmSlope = this.slopeSel.value());

    this.makeSlider(p);
  }

  resize(x, y, w, p) {
    super.resize(x, y, w, p);
    let dropDownWidth = this.slider.width * .5-10; // Make slider + dropdown the same width as other sliders.
    this.slider.style('width', Math.round(this.slider.width * 0.5).toString() + "px");
    this.oddEvenSel.style('width', Math.round(dropDownWidth/2).toString() + "px");
    this.oddEvenSel.position(x+this.slider.width+10,y);
    this.slopeSel.style('width', Math.round(dropDownWidth/2).toString() + "px");
    this.slopeSel.position(x+this.slider.width+dropDownWidth/2+10,y);
  }
}


class sampleRateSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Sample Rate";
    this.unit = "Hz";
    this.propName="downsamplingFactor";
    this.min = p.log(500)/p.log(2);
    this.max =  p.log(48000)/p.log(2);
    this.initial = p.log(48000)/p.log(2);
    this.step = 0.1
    this.makeSlider(p);
  }
  calcDisplayVal(){
    return this.displayVal = Math.round(this.settings.sampleRate / this.settings.downsamplingFactor , 3) + this.displayValSuffix();
  }

  calcSliderVal(){
    let text = super.calcSliderVal();
    return Math.log(text)/Math.log(2);
  }

  propertyValue(){
    return Math.round(WEBAUDIO_MAX_SAMPLERATE/Math.pow(2, this.slider.value()));
  }
}

class ditherSlider extends slider {
  setup(p,settings){
    this.settings = settings;
    this.name ="Dither";
    this.propName="dither";
    this.min = 0.0;
    this.max =  1.0;
    this.initial = 0.0;
    this.step = 0.01;
    this.makeSlider(p);
  }

}

class bitDepthSlider extends slider {
  setup(p,settings){
    this.settings = settings;
    this.name ="Bit Depth";
    this.propName = "bitDepth";
    this.min = 1;
    this.max =  BIT_DEPTH_MAX;
    this.initial = BIT_DEPTH_MAX;
    this.step = 1;
    this.makeSlider(p);
  }

}

class amplitudeSlider extends slider {
  setup(p,settings){
    this.settings = settings;
    this.propName ="amplitude";
    this.name = "Amplitude";
    this.min = 0.0;
    this.max =  1.0;
    this.initial = 1.0;
    this.step = 0.01;
    this.makeSlider(p);
  }

}

class antialiasingSlider extends slider {
  setup(p, settings){
    this.settings = settings;
    this.propName ="antialiasing";
    this.name = "Antialiasing filter order";
    this.min = 0.0;
    this.max =  200;
    this.initial = 0;
    this.step = 10;
    this.makeSlider(p);
  }
}

class phaseSlider extends slider{
  setup(p,settings){
    this.settings = settings;
    this.propName ="phase";
    this.name = "Phase (Degrees)";
    this.min = 0;
    this.max =  360; //pi
    this.initial = 0.0;
    this.step = 1; //pi/8
    this.makeSlider(p);
}

}
class zoomSlider extends slider{
  calcDisplayVal() {
    return this.settings[this.propName]*100 + this.displayValSuffix();
  }

  calcSliderVal(){
    let text = super.calcSliderVal();
    return text/100;
  }
}
class ampZoomSlider extends zoomSlider{
  setup(p,settings){
    this.settings = settings;
    this.name ="Amp. Zoom (%)";
    this.propName="ampZoom";
    this.min = .1;
    this.max = 4.0;
    this.initial =1.0;
    this.step = .01;
    this.makeSlider(p);
}
}

const minTimeZoom = .25;
class timeZoomSlider extends zoomSlider{
  setup(p,settings){
    this.settings = settings;
    this.propName ="timeZoom";
    this.name = "Time zoom (%)"
    this.min = minTimeZoom;
    this.max =  3;
    this.initial = 1.0;
    this.step = .01;
    this.makeSlider(p);
}

}

const minFreqZoom = 0.5;
class freqZoomSlider extends zoomSlider{
  setup(p,settings){
    this.settings = settings;
    this.name = "Frequency zoom (%)";
    this.propName ="freqZoom";
    this.min = minFreqZoom;
    this.max =  3;
    this.initial = 1.0;
    this.step = .01;
    this.makeSlider(p);
  }

  updateValue(p){
    super.updateValue(p);
    this.settings.maxVisibleFrequency = WEBAUDIO_MAX_SAMPLERATE/2/this.settings.freqZoom;
  }
}
