////////////////////
/// Streaming.js ///
////////////////////

class Streaming {

	constructor (audioContext, duration, sourceIndex, audioStream) {
		// console.log(audioStream)
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.audioStream = audioStream
	    this.gain;                            	// Gain's object
		this.syncAudio
		this.duration = duration;
		// this.filesPath = "AudioFiles0/";
		// this.filesPath = "AudioFiles1/";
		this.filesPath = "AudioFilesPiano/";
		this.sourceIndex = sourceIndex;
		this.initialized = false;
		this.connect = false;
		this.previousBuffer = [];
		this.restBuffer = [];
		this.count = 0;
		this.arrayValue = []
		this.begin = true
		this.fileHead = []
		this.globalBuffer = [];

	}

	async start (url, value, norm) {

	    // Create the gain
	    this.gain = this.audioContext.createGain();

	    // Initiate with current gain's value
    	this.gain.gain.setValueAtTime(value/norm, 0);

    	// Load the sound from the buffer
    	// this.playingSound = this.LoadNewSound(buffer);

    	// Connect the audioNodes
    	this.gain.connect(this.audioContext.destination);
    	// this.playingSound.connect(this.gain);

    	// Play the sound
    	// this.playingSound.start();
    	// this.UpdateAudioSource(buffer);
    	this.loadSample(url);
	}

	LoadNewSound(buffer) { // Create and link the sound to the audioContext

	    var sound = this.audioContext.createBufferSource();		// Create the sound
	    sound.loop = true;                                    	// Set the sound to loop
	    sound.buffer = buffer;                                	// Set the sound buffer
	    sound.connect(this.gain);								// Connect the sound to the other nodes
	    return (sound);
	}

	ConcatBuffer(buffer1, buffer2) {
		var intArray1 = new Uint8Array(buffer1)
		console.log(buffer1)
		console.log(intArray1)
		console.log("jackkkiie")
		var intArray2 = new Uint8Array(buffer2)
 		var concatArray = intArray1.concat(this.intArray2);
		var concatBuffer = new ArrayBuffer(concatArray.length - 44)

     	var globalView = new DataView(concatBuffer);

 		for(let i = 0; i < intArray1.length; i++) {
 			globalView.setUint8(i, concatArray[i])
 		}
 		for(let i = intArray1.length; i < concatBuffer.length; i++) {
 			globalView.setUint8(i, concatArray[i + 44])
 		}
 		return(concatBuffer)
	}


	UpdateAudioSource(audio) { // Stop the current playing to play an other source's audioBuffer

		this.changing = true;
		var tempPlayingSound;
		console.log('bonjour')

   		this.syncAudio = {

		    advanceTime: (currentTime, audioTime, dt) => {
		    	var duration = audio.duration
		    	// var duration = 6

		    	if (this.changing) {

			        if (this.connect) {
			        	audio.disconnect(this.gain)
			        	this.connect = false;
			        } 


			      	this.connect = true

			        console.log(audioTime, duration*Math.ceil(audioTime/duration))
			        console.log(audioTime - duration*(Math.ceil(audioTime/duration) - 1))
			        console.log(duration*Math.ceil(audioTime/duration))

			        audio.start(audioTime, audioTime - duration*(Math.ceil(audioTime/duration) - 1));
			        audio.stop(duration*Math.ceil(audioTime/duration));



			        this.changing = false;
			        console.log(true)
			        return currentTime + duration*Math.ceil(audioTime/duration) - audioTime;
			    }
			    else {

			        console.log(false, audio)
			        console.log(audioTime, duration*Math.ceil(audioTime/duration))


			        audio.start(audioTime);
			        audio.stop(audioTime + duration);

			        return currentTime + duration;
			    }
	    	}
    	}

    	console.log(this.syncAudio, this.sourceIndex)
   		document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));

	}

	// function to load samples
	loadSample2(url) {
		// console.log(url)
	    var fetchSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
	    fetchSound.open("GET",this.filesPath + url, true); // Path to Audio File
	    fetchSound.responseType = "arraybuffer"; // Read as Binary Data
	    fetchSound.timeout = 10000;
	    fetchSound.ontimeout = (() => {console.log('timeout', fetchSound)});
	    fetchSound.onload = (() => { // ∆∆∆∆∆∆∆∆ c'est lui qu'il faut améliorer ∆∆∆∆∆∆∆∆
	    	console.log("e")
	        this.audioContext.decodeAudioData(fetchSound.response, ((buffer) => {
	        	console.log(buffer)
	        	this.UpdateAudioSource(buffer);
	        }), (() => {console.error("hmmm...")}));
	    })
	    fetchSound.send();
	}

	// function to load samples
	loadSample(url) {
		// console.log(url)

		var src = this.audioStream.createStreamSource();
		console.log(url)
      	src.streamId = url;
      	src.connect(this.gain);

      	// this.streamSource.set(url, src);
      	// src.addEventListener('ended', () => this.streamSources.delete(streamId));
      	console.log(src)
      	// src.start()
      	// src.loop = true;
      	this.UpdateAudioSource(src);
      	// src.start();
      	// const src = this.streamSources.get(streamId);
      	// this.streamSources.delete(streamId);

      	// src.stop();
	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    console.log(this.gain)
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}

  	GetSyncBuffer() {
  		return(this.syncAudio)
  	}
}

export default Streaming;
