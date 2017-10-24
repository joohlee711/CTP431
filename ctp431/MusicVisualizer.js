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

function setup(){

	canvas = createCanvas(WIDTH, HEIGHT)
	canvas.parent('sketch-holder')
	colorMode(HSB)
	angleMode(DEGREES)
	FFT_front = new p5.FFT(0.7, 128)
	FFT_back = new p5.FFT(0.85, 32)
	amplitude = new p5.Amplitude(0.8)
	//button setting
	for(var i = 0; i <= numberOfSong; i++){
		buttons[i] = select('#button'+ String(i))
	}
	buttons[0].position(20, HEIGHT-70)
	for(var i = 1; i <= numberOfSong; i++){
		buttons[i].position(buttons[i-1].x + buttons[i-1].width + 5, HEIGHT-70)
	}
}



function draw_styleOne() {
	//start_angle = (start_angle + 0.3) % 360
	// center : 0,0
	translate(WIDTH/2, HEIGHT/2)
	// fft analyze
	var spectrum = fft.analyze();
	var spectrum2 = fft2.analyze();
	var level = amplitude.getLevel()

	// background
	image(bg, -(WIDTH/2), -(HEIGHT/2), WIDTH, HEIGHT)

	// down EQ
	Start = 2;
	End = spectrum2.length - 3
	var w = (WIDTH/2) / (End - Start)

	noStroke();
	for (var i = Start; i < End; i++){
		var amp = spectrum2[i]**2
		var x = map(i, Start, End, (WIDTH/2), 0)
		var h = map(amp, 0, 256**2, 0, 300)
		var y = - h / 2
		fill(0,0,60)
		rect(x, y, w*0.9, h)
		rect(-x-w, y, w*0.9, h)
	}

	// center circle spectrums
	strokeWeight(5.5)
	Start = 20
	End = spectrum.length - 20
	// right half
	for (var i = Start; i < End; i++){
		// set r and angle
		// amp : **2 to make dynamic changes
		// map : lower freq -> smaller, high freq -> bigger changes
		var amp = (spectrum[i]**3) * map(i, Start, End, 0.6, 1.0)
		var angle = map(i, Start, End, -90, 90)
		var r = map(amp, 0, 256**3, 205, 550);
		// x, y from r, angle
		var x = r*cos(angle)
		var y = r*sin(angle)
		// draw line
		stroke(map(i, Start, End, 0, 255), 255, 255)
		line(0, 0, x, y)
	}
	for (var i = Start; i < End; i++){
		// set r and angle
		var amp = (spectrum[i]**3) * map(i, Start, End, 0.6, 1.0)
		var angle = map(i, Start, End, 270, 90)
		var r = map(amp, 0, 256**3, 205, 550);
		// x, y from r, angle
		var x = r*cos(angle)
		var y = r*sin(angle)
		// draw line
		stroke(map(i, Start, End, 0, 255), 255, 255)
		line(0, 0, x, y)
	}



	level_over_4 = Math.max(0.4, level)

	// center circle
	fill(0,0,0)
	noStroke()
	var c_size = map(level_over_4, 0.4, 1.0, 400, 450)
	ellipse(0, 0, c_size, c_size)

	// cener title
	fill(0,0,255)
	stroke(0,0,0)
	textAlign(CENTER)
	var t_size = map(level_over_4, 0.4, 1.0, 40, 50)
	textSize(t_size)
	text(title, 0, 0)


}



function draw_styleTwo() {
	// get samples 
	var data_array = new Float32Array(analyser.frequencyBinCount);
	analyser.getFloatFrequencyData(data_array);

	var octaveband_level_db = freq_slice(data_array)

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
		var sound_level = (octaveband_level_db[i]-SOUND_METER_MIN_LEVEL)/(0.0-SOUND_METER_MIN_LEVEL)*20;
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
		var rgb = freq_slice(hue, saturation, value);
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


