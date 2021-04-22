/// https://github.com/zenozeng/p5.js-svg/issues/172

p5.prototype.createCanvas = function(w, h, renderer) {
  //p5._validateParameters('createCanvas', arguments);
  //optional: renderer, otherwise defaults to p2d
  const r = renderer;
  console.log('patch')
  let c;
	
	if (!this._defaultGraphicsCreated) {
		c = document.createElement('canvas');
		let i = 0;
		while (document.getElementById(`defaultCanvas${i}`)) {
			i++;
		}
		defaultId = `defaultCanvas${i}`;
		c.id = defaultId;
		//c.classList.add(defaultClass);
	} else {
		// resize the default canvas if new one is created
		c = this.canvas;
	}

  // set to invisible if still in setup (to prevent flashing with manipulate)
  if (!this._setupDone) {
    c.dataset.hidden = true; // tag to show later
    c.style.visibility = 'hidden';
  }

  if (this._userNode) {
    // user input node case
    this._userNode.appendChild(c);
  } else {
    document.body.appendChild(c);
  }

  // Init our graphics renderer
	if (!this._defaultGraphicsCreated) {
		this._setProperty('_renderer', new p5.Renderer2D(c, this, true));
		this._defaultGraphicsCreated = true;
		this._elements.push(this._renderer);
	}
	
  this._renderer.resize(w, h);
  this._renderer._applyDefaults();
  return this._renderer;
};

/// Added by Christian Frisson

p5.prototype.createGraphics = function(w, h, renderer) {
  //_main.default._validateParameters('createGraphics', arguments);
  return new p5.Graphics(w, h, renderer, this);
};