// -------- Variables -------

var bgColor

var WIDTH = 970;
var HEIGHT = 350;
// var SOUND_METER_GAP = 15;
// var SOUND_METER_WIDTH = 40;
// var SOUND_METER_HEIGHT = HEIGHT;
// var SOUND_METER_MIN_LEVEL = -96.0;  // dB

var FFT_front
var FFT_back
var amplitude
var canvas
var gain

var context;
var source = null;

// no mic buffer
var demoFileBuffer;
var chosenFileBuffer = null; // myaudiobuffer in localplayer example

var sourceNode = null;
var mediaSourceNode = null;
var analyser = null;

var vis_view;
var vis_value;

var micPlayOn = false;
var demoPlayOn = false;
var filePlayOn = false;

var animation_function;
var animation_id;

var prev_band_level = new Array(10); 
for (var i=0; i <10;i++ ) {
	prev_band_level[i] = 0;		
}


// --------- Controlling part --------


window.onload=function(){
	var MicAudio = document.getElementById("micFileInput");
	MicAudio.addEventListener("click", playMicAudio, false);
	var DemoAudio = document.getElementById("demoFileInput");
	DemoAudio.addEventListener("click", playDemoAudio, false);
	var FileAudio = document.getElementById("chosenFileInput");
	FileAudio.addEventListener("change", fileChanged, false);
	window.AudioContext = window.AudioContext || window.webkitAudioContext;

	// create audio context
	context = new AudioContext();

	var visMod1 = document.getElementById("visMode1");
	visMod1.addEventListener("click", function(){
			setAnimationFunction(1)}, false); 
	var visMod2 = document.getElementById("visMode2");
	visMod2.addEventListener("click", function(){
			setAnimationFunction(2)}, false); 

	vis_view = document.getElementById("loudnessView");
	vis_value = document.getElementById("loudnessValue");
	vis_view.width =  WIDTH;
	vis_view.height = HEIGHT;
	
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
	animation_function = draw_styleOne;
}


function fileChanged(e){
		var file = e.target.files[0];
		var fileReader = new FileReader();
		fileReader.onload = fileLoaded;
		fileReader.readAsArrayBuffer(file);
}
	
function fileLoaded(e){
	    context.decodeAudioData(e.target.result, function(buffer) {
	      chosenFileBuffer = buffer;
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

function stopAnimation() { 
	clearInterval(animation_id);
}



function setAnimationFunction (mode_num) {
	if (mode_num == 1) {
		animation_function = draw_styleOne;
	}
	else if(mode_num == 2) {
		animation_function = draw_styleTwo;		
	}

	if (demoPlayOn || micPlayOn) {
		stopAnimation();

		// restart visualize audio animation
		animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);
	}
}




// ---------------- Visualization Part ---------



function color() {
	//처음에는 랜덤으로 bgColor 색을 해놓기
}




function draw_styleOne() {

}



function draw_styleTwo() {


}






// ------------ Playing Part -----------

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

	var mic = document.getElementById("micFileInput");
	mic.innerHTML = 'Mic Off'
}


function playDemoAudio() {
	
	if (filePlayOn) {
		turnOffFileAudio();
		//return;
	}

	if (micPlayOn) {
		turnOffMicAudio();
		//return;
	}

	if (demoPlayOn) {
		turnOffDemoAudio();
		return;
	}

	sourceNode = context.createBufferSource();

	sourceNode.buffer = demo_buffer;
	sourceNode.connect(context.destination);
	sourceNode.start(0);

	sourceNode.connect(analyser);

	// visualize audio animation
	animation_id = setInterval(animation_function, context.sampleRate/analyser.fftSize);

	demoPlayOn = true;
	
	var DemoAudio = document.getElementById("demoFileInput");
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
	
	var FileAudio = document.getElementById("chosenFileInput");

}




function turnOffMicAudio() {
	var MicAudio = document.getElementById("micFileInput");		
	MicAudio.innerHTML = 'Mic On'
	mediaSourceNode = null;
	micPlayOn = false;

	stopAnimation();
}

function turnOffDemoAudio() {
	var DemoAudio = document.getElementById("demoFileInput");
	DemoAudio.innerHTML = 'Demo Audio Play'
	sourceNode.stop(0);
	sourceNode = null;
	demoPlayOn = false;

	stopAnimation();
}


function turnOffFileAudio() {
	var FileAudio = document.getElementById("chosenFileInput");
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


