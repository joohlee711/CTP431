
	var context;
	var myAudioBuffer = null;

	window.onload=function(){
		var control = document.getElementById("fileChooseInput");
		control.addEventListener("change", fileChanged, false);
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();
	}
	
	function fileChanged(e){
		var file = e.target.files[0];
		var fileReader = new FileReader();
		fileReader.onload = fileLoaded;
		fileReader.readAsArrayBuffer(file);
	}
	function fileLoaded(e){
	    context.decodeAudioData(e.target.result, function(buffer) {
	      myAudioBuffer = buffer;
	    });
	    console.log("File has been loaded.")
	}
	var source = null;
	function playSound(anybuffer) {
	  source = context.createBufferSource();
	  source.buffer = anybuffer;
	  source.connect(context.destination);
	  source.start();
	}
	function stopSound() {
	  if (source) {
	    source.stop();
	  }
	}	   	