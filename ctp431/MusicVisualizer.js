

var context;
var source = null;
var myAudioBuffer = null;

var sourceNode = null;
var mediaSourceNode = null;
var analyser = null;

var vis_view;
var vis_value;

var WIDTH = 600;
var HEIGHT = 380;
var SOUND_METER_GAP = 15;
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




	var visMod1 = document.getElementById("visMode1");
	visMod1.addEventListener("click", function(){
			setAnimationFunction(1)	
	}, false); 

	var visMod2 = document.getElementById("visMode2");
	visMod2.addEventListener("click", function(){
			setAnimationFunction(2)	
	}, false); 



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




function setAnimationFunction (mode_num) {
	if (mode_num == 1) {
		animation_function = drawBand;
	}
	else if(mode_num == 2) {
		animation_function = drawWaterfall;		
	}

	if (demoPlayOn || micOn) {
		stopAnimation();

		// restart visualize audio animation
		animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);
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
	drawContext.fillStyle = 'rgb(255, 222, 208)';
	drawContext.fillRect(0, 0, WIDTH, HEIGHT);


	for (var i=0; i<10; i++) {

		// fill rectangular (for the sound level)
		var sound_level = (octaveband_level_db[i]-SOUND_METER_MIN_LEVEL)/(0.0-SOUND_METER_MIN_LEVEL)*SOUND_METER_HEIGHT;
		var sound_level_env;
		
		///// asymmetric envelope detector
		if (sound_level < prev_band_level[i]) {
			sound_level_env = prev_band_level[i];

			prev_band_level[i] = prev_band_level[i]*0.95;
		} 
		else {
			sound_level_env = sound_level;

			prev_band_level[i] = sound_level;
		}
		
		// shape
		drawContext.beginPath();
		var x = SOUND_METER_GAP + (SOUND_METER_WIDTH+SOUND_METER_GAP)*i;
		drawContext.rect(x, SOUND_METER_HEIGHT, SOUND_METER_WIDTH, -sound_level_env);

		// color
		var hue = Math.floor(255/9*i);
		var saturation = 255;
		var value = 255;
		var rgb = hsvToRgb(hue, saturation, value);
		drawContext.fillStyle='rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; 
		drawContext.fill();
	}

}



function drawWaterfall() {

	
}


function playMic()
{

	if (micOn) {
		turnOffMicAudio();
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


}


function playDemo() {
	
	if (micOn) {
		turnOffMicAudio();
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
	
	var DemoAudio = document.getElementById("demoAudioInput");
	DemoAudio.innerHTML = 'Sample Audio Stop'
}




function playFile() {
	
	if (demoPlayOn) {
		turnOffDemoAudio();
	}

	if (micOn) {
		turnOfMicAudio();
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








function turnOffDemoAudio() {
	var DemoAudio = document.getElementById("demoAudioInput");
	DemoAudio.innerHTML = 'Demo Audio Play'
	sourceNode.stop(0);
	sourceNode = null;
	demoPlayOn = false;

	stopAnimation();
}


function turnOffMicAudio() {
	var MicAudio = document.getElementById("micInput");		
	MicAudio.innerHTML = 'Mic On'
	mediaSourceNode = null;
	micOn = false;

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

