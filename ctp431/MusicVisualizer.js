

var context;
var source = null;
var sourceNode = null;
var mediaSourceNode = null;
var analyser = null;

var chosenFileBuffer = null;
var demoFileBuffer = null;

var vis_view;
var vis_value;

var WIDTH = 600;
var HEIGHT = 380;
var SOUND_METER_GAP = 15;
var SOUND_METER_WIDTH = 40;
var SOUND_METER_HEIGHT = HEIGHT;
var SOUND_METER_MIN_LEVEL = -96.0;  // dB

var micPlayOn = false;
var demoPlayOn = false;
var filePlayOn = false;

var animation_function;
var animation_id;

var prev_band_level = new Array(10); 
for (var i=0; i <10;i++ ) {
	prev_band_level[i] = 0;		
}








window.onload=function(){
	var MicAudio = document.getElementById("micInput");
	MicAudio.addEventListener("click", playMic, false);

	var DemoAudio = document.getElementById("demoFileInput");
	DemoAudio.addEventListener("click", playDemo, false);

	var FileAudio = document.getElementById("chosenFileInput");
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
			{demoFileBuffer = buffer;});
		}

	demoReq.send();
	animation_function = vis_MyStyle;
}


function fileLoaded(e){
	    context.decodeAudioData(e.target.result, function(buffer) {
	      chosenFileBuffer = buffer;
	    });
	    console.log("File has been loaded.")
}


function fileChanged(e){
		var file = e.target.files[0];
		var fileReader = new FileReader();
		fileReader.onload = fileLoaded;
		fileReader.readAsArrayBuffer(file);
}
	

/*
function stopSound() {
	  if (source) {
	    source.stop();
	  }
}	
*/








function vis_MyStyle() {

	// get samples 
	var data_array = new Float32Array(analyser.frequencyBinCount);
	analyser.getFloatFrequencyData(data_array);

	var octaveband_level_db = freq_slice(data_array)


	// display the loudness value
	var loudness = octaveband_level_db[0];
	vis_value.innerHTML = 'Currently' + loudness + ' dB'


	// 2d canvas context
	var drawContext = vis_view.getContext('2d');


	// fill rectangular (for the entire canvas)
	drawContext.fillStyle = 'rgb(255, 222, 208)'; //light salmon
	drawContext.fillRect(0, 0, WIDTH, HEIGHT);



	for (var i=0; i<10; i++) {

		// fill rectangular (for the sound level)
		var sound_level = (octaveband_level_db[i]-SOUND_METER_MIN_LEVEL)/
			(0.0-SOUND_METER_MIN_LEVEL)*20;
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


		//shape
		drawContext.beginPath();
		var r = 30 + (10-i)*sound_level_env;
		drawContext.arc(WIDTH/2, HEIGHT/2, r, 0, 2*Math.PI, true);


		//color
		var hue = Math.floor(255/9*i);
		var saturation = 255;
		var value = 255;
		var rgb = hsvToRgb(hue, saturation, value);
		drawContext.fillStyle='rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; 
		drawContext.fill();
	}
	


	drawContext.beginPath();
	drawContext.arc(WIDTH/2, HEIGHT/2, 30, 0, 2*Math.PI, true);
	drawContext.fillStyle='rgb(255, 222, 208)';
	drawContext.fill();
	


	var image = new Image();
	image.src = 'musicalnote2.png';
	image.addEventListener('load', eventimageLoaded, false);
	function eventimageLoaded(){
		drawContext.drawImage(image, (WIDTH/2)-40, (HEIGHT/2)-40);
	}
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

function stopAnimation() { 
	clearInterval(animation_id);
}








function playMicAudio()
{
	if (demoPlayOn) {
		turnOffDemoAudio();
		return;
	}
	if (micPlayOn) {
		turnOffMicAudio();
		return;
	}

	if (!navigator.getUserMedia)
		navigator.getUserMedia = (navigator.getUserMedia({audio: true}) || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
							  
	if (!navigator.getUserMedia)
		alert("Error: getUserMedia not supported!");
						
	// get audio input streaming 				 
	navigator.getUserMedia({audio: true}, onStream, onStreamError)

	micPlayOn = true;

	var mic = document.getElementById("micInput");
	mic.innerHTML = 'Mic Off'
}


function playDemoAudio() {
	
	if (filePlayOn) {
		turnOffFileAudio();
		return;
	}
	if (micPlayOn) {
		turnOffMicAudio();
		return;
	}

	sourceNode = context.createBufferSource();

	sourceNode.buffer = demoFileBuffer;
	sourceNode.connect(context.destination);
	sourceNode.start(0);

	sourceNode.connect(analyser);

	// visualize audio animation
	animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);

	demoPlayOn = true;
	
	var DemoAudio = document.getElementById("DemoAudio");
	DemoAudio.innerHTML = 'Demo Audio Stop'
}


function playFileAudio() {
	
	if (demoPlayOn) {
		turnOffFileAudio();
		return;
	}
	if (micPlayOn) {
		turnOfMicAudio();
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
	micPlayOn = false;

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
	var FileAudio = document.getElementById("chosenFileInput");
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
	micPlayOn = false;
}






