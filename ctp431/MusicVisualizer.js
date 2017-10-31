

var context;
var source = null;

var myAudioBuffer = null;
var myAudioBuffer_localplayer;

var sourceNode = null;
var mediaSourceNode = null;
var analyser = null;

var vis_view;
var vis_value;

var WIDTH = 600;
var HEIGHT = 380;
var SOUND_METER_GAP = 10;
var SOUND_METER_WIDTH = 40;
var SOUND_METER_HEIGHT = HEIGHT;
var SOUND_METER_MIN_LEVEL = -96.0;  // dB

var micOn = false;
var demoPlayOn = false;
var filePlayOn = false;

var animation_function;
var animation_id;

var prev_band_level = new Array(10); 
for (var i=0; i <10;i++ ) {
	prev_band_level[i] = 0;		
}



var demo_buffer;

window.onload=function(){
	var MicAudio = document.getElementById("micInput");
	MicAudio.addEventListener("click", playMic, false);

	var DemoAudio = document.getElementById("demoAudioInput");
	DemoAudio.addEventListener("click", playDemo, false);

	var FileAudio = document.getElementById("fileChooseInput");
	FileAudio.addEventListener("change", fileChanged, false);
	window.AudioContext = window.AudioContext || window.webkitAudioContext;


	vis_view = document.getElementById("loudnessView");
	vis_value = document.getElementById("loudnessValue");
	vis_view.width =  WIDTH;
	vis_view.height = HEIGHT;

	
	// create audio context
	context = new AudioContext();
	
	// analyzer
	analyser = context.createAnalyser();
	analyser.fftSize = 2048;
	analyser.smoothingTimeConstant = 0;		


	var demoReq = new XMLHttpRequest();
	demoReq.open("Get","SlippyCut.mp3",true);
	demoReq.responseType = "arraybuffer";
	demoReq.onload = function(){
		context.decodeAudioData(demoReq.response, function(buffer)
			{demo_buffer = buffer;});
		}

	demoReq.send();
	animation_function = drawBand;
}

function calc_octaveband(input_array) {
	var lower_freqs = [22, 44, 88, 177, 355, 710, 1420, 2840, 5680, 11360];
	var upper_freqs = [44, 88, 177, 355, 710, 1420, 2840, 5680, 11360, 22720];
	var center_freqs = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

	// compute FFT power (linear scale) 
	var fft_power = new Array(input_array.length);
	for (var i = 0; i < input_array.length; i++) {
		fft_power[i] = Math.pow(10.0, input_array[i]/10.0);
	}

	var band_power = new Array(center_freqs.length);


	for (var i = 0; i < center_freqs.length; i++) {
		var sum = 0;
		for (var n = Math.floor(lower_freqs[i]*1024/22050);
			n < Math.min(Math.floor(upper_freqs[i]*1024/22050), 1023);
			n++) {
			sum = sum + fft_power[n];
		}
		band_power[i] = sum;

		// i=9일때 n의 범위 527~1055로 1024를 초과한다.

	}

	var band_level_db = new Array(band_power.length);

	for (var i = 0; i < band_level_db.length; i++) {
		band_level_db[i] = 10.0*Math.log10(band_power[i]);

		if (band_level_db[i] < SOUND_METER_MIN_LEVEL) {
			band_level_db[i] = SOUND_METER_MIN_LEVEL;
		}

	}

	return band_level_db;

}


function fileChanged(e){
		var file = e.target.files[0];
		var fileReader = new FileReader();
		fileReader.onload = fileLoaded;
		fileReader.readAsArrayBuffer(file);
}
	
function fileLoaded(e){
	    context.decodeAudioData(e.target.result, function(buffer) {
	      myAudioBuffer_localplayer = buffer;

	    });
	    console.log("File has been loaded.")
}


function playSound(anybuffer) {
	  source = context.createBufferSource();
	  source.buffer = anybuffer;
	  source.connect(context.destination);
	  source.start();
}

function stopSound(anybuffer) {
	  if (source) {
	    source.stop();
	  }
}	




function drawBand() {
	// get samples 
	var data_array = new Float32Array(analyser.frequencyBinCount);
	analyser.getFloatFrequencyData(data_array);

	var octaveband_level_db = calc_octaveband(data_array)


	// display the loudness value (this is for verifying if the level is correctly computed.)
	var loudness = octaveband_level_db[0];
	vis_value.innerHTML = '32Hz-Band Level (dB): ' + loudness + ' dB'

	// 2d canvas context
	var drawContext = vis_view.getContext('2d');
	
	// fill rectangular (for the entire canvas)
	drawContext.fillStyle = 'rgb(20, 30, 100)';
	drawContext.fillRect(0, 0, WIDTH, HEIGHT);


	for (var i=0; i<10; i++) {

		// fill rectangular (for the sound level)
		var sound_level = (octaveband_level_db[i]-SOUND_METER_MIN_LEVEL)/(0.0-SOUND_METER_MIN_LEVEL)*SOUND_METER_HEIGHT;
		var sound_level_env;

		if (sound_level < prev_band_level[i]) {
			sound_level_env = prev_band_level[i];
			
			prev_band_level[i] = prev_band_level[i]*0.9;
			
		}
		else {
			sound_level_env = sound_level;
			prev_band_level[i] = sound_level;
		}

		// shape
		drawContext.beginPath();
		var radius = SOUND_METER_WIDTH
		var x = SOUND_METER_GAP + radius + (SOUND_METER_WIDTH+SOUND_METER_GAP)*i;
		drawContext.arc(x, SOUND_METER_HEIGHT-sound_level_env, radius, 0, 2 * Math.PI, true);

		// color
		var intensity = new Array(3);
		if (SOUND_METER_HEIGHT-sound_level_env > SOUND_METER_HEIGHT*1/4) {
			for (var j=0; j<3; j++) {
				intensity[j] = Math.floor(Math.pow(sound_level_env,1.5)/Math.pow(SOUND_METER_HEIGHT,1.5)*255);
			}
		}

		else {
			intensity[0] = 200;
			intensity[1] = 100;
			intensity[2] = 150;
		}

		drawContext.fillStyle='rgb(' + intensity[0] + ',' + intensity[1] + ',' + intensity[2] + ')'; 
		drawContext.fill();
	}

}



function playMic()
{

	if (micOn) {
		turnOffMicAudio();
		return;
	}
	if (demoPlayOn) {
		turnOffDemoAudio();
	}
	if (filePlayOn) {
		turnOffFileAudio();
	}


	if (!navigator.getUserMedia)
		navigator.getUserMedia = (navigator.getUserMedia({audio: true}) || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
							  
	if (!navigator.getUserMedia)
		alert("Error: getUserMedia not supported!");
						
	// get audio input streaming 				 
	navigator.getUserMedia({audio: true}, onStream, onStreamError)

	micOn = true;

	var mic = document.getElementById("micInput");
	mic.innerHTML = 'Mic Off'

}


function playDemo() {
	
	if (micOn) {
		turnOffMicAudio();
	}
	if (demoPlayOn) {
		turnOffDemoAudio();
		return;
	}
	if (filePlayOn) {
		turnOffFileAudio();
	}

	sourceNode = context.createBufferSource();

	sourceNode.buffer = demo_buffer;
	sourceNode.connect(context.destination);
	sourceNode.start(0);

	sourceNode.connect(analyser);

	// visualize audio animation
	animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);

	demoPlayOn = true;
	
	var Demo = document.getElementById("demoAudioInput");
	Demo.innerHTML = 'Sample Audio Stop'
}




function playFile() {
	
	if (micOn) {
		turnOffMicAudio();
	}
	if (demoPlayOn) {
		turnOffDemoAudio();
	}
	if (filePlayOn) {
		turnOffFileAudio();
		return;
	}


	sourceNode = context.createBufferSource();

	sourceNode.buffer = file_buffer;
	sourceNode.connect(context.destination);
	sourceNode.start(0);

	sourceNode.connect(analyser);

	// visualize audio animation
	animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);

	filePlayOn = true;
	
	var FileAudio = document.getElementById("FileAudio");
	FileAudio.innerHTML = 'Selected File Stop'
}





function turnOffMicAudio() {
	var MicAudio = document.getElementById("micInput");		
	MicAudio.innerHTML = 'Mic On'
	mediaSourceNode = null;
	micOn = false;

	stopAnimation();
}


function turnOffDemoAudio() {
	var DemoAudio = document.getElementById("demoAudioInput");
	DemoAudio.innerHTML = 'Demo Audio Play'
	sourceNode.stop(0);
	sourceNode = null;
	demoPlayOn = false;

	stopAnimation();
}



function turnOffFileAudio() {
	var FileAudio = document.getElementById("fileChooseInput");
	DemoAudio.innerHTML = 'File Play'
	sourceNode.stop(0);
	sourceNode = null;
	filePlayOn = false;

	stopAnimation();
}





// mic success callback
function onStream(stream) {
	mediaSourceNode = context.createMediaStreamSource(stream);
	
	// Connect graph
	mediaSourceNode.connect(analyser);
						  
	// visualize audio animation
	animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);
}


// mic errorCallback			 
function onStreamError(error) {
	console.error('Error getting microphone', error);
	micOn = false;
}




function stopAnimation() { 
	clearInterval(animation_id);
}

