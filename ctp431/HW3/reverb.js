var Reverb = function(context, parameters) {

	this.context = context;
	this.input = context.createGain();

	// create nodes
	this.convolver = context.createConvolver();
	this.drygain = context.createGain();
	this.wetgain = context.createGain();

	

	//connect

	this.input.connect(this.convolver);
	this.convolver.connect(this.wetgain);

	this.input.connect(this.drygain);

	this.wetgain.connect(this.context.destination);
	this.drygain.connect(this.context.destination);

	this.wetgain.gain.value = parameters.reverbWetDry;
	this.drygain.gain.value = (1-parameters.reverbWetDry);

	this.parameters = parameters;
}

function loadImpulseResponse(reverb) {
		var request = new XMLHttpRequest();
		var url = "reverb.wav";
	  	request.open('GET', url, true);
	  	request.responseType = 'arraybuffer';
	  	request.onload = function() {
	    context.decodeAudioData(request.response, function(buffer) {
			reverb.convolver.buffer = buffer;
	    });
	  }
	  request.send();
	}



Reverb.prototype.updateParams = function (params, value) {

	switch (params) {
		case 'reverb_dry_wet':
			this.parameters.reverbWetDry = value;
			this.wetgain.gain.value = value;
			this.drygain.gain.value = 1 - value;
			break;		
	}
}
