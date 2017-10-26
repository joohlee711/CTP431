var soundNum = 3
var soundArray = new Array(soundNum)
var buttons = new Array(soundNum)


var mic, fft, fft2;
var amplitude, gain;



var titles = ["Mic On","Play Audio Sample", "Select File.."]
var files = ["1", "SlippyCut.mp3", "3"]
var currentId = 0


function preload(){
	for(var i = 0; i < soundNum; i++){
		soundArray[i] = loadSound(files[i])
	}
}




function playSound(index){
	if(index == soundNum){
		soundArray[currentId].stop()
		title = "Click Button to Play"
	}
	else{
		soundArray[currentId].stop()
		soundArray[index].play()
		currentId = index
		title = titles[currentId]
	}
	
}


function setup() {
   createCanvas(710,400);
   noFill();

   mic = new p5.AudioIn();
   mic.start();
   fft = new p5.FFT();
   fft.setInput(mic);

   file = new p5.AudioIn();
   mic.start();
   fft2 = new p5.FFT();
   fft2.setInput(file)

}



function draw() {
   background(200);

   var spectrum = fft.analyze();

   beginShape();
   for (i = 0; i<spectrum.length; i++) {
    vertex(i, map(spectrum[i], 0, 255, height, 0) );
   }
   endShape();


  var vol = mic.getLevel();
  fill(127);
  stroke(0);

  // Draw an ellipse with height based on volume
  var h = map(vol, 0, 1, height, 0);
  ellipse(width/2, h - 25, 50, 50);

}



