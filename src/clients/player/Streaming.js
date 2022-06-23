////////////////////
/// Streaming.js ///
////////////////////

class Streaming {

	constructor (audioContext, duration, sourceIndex) {
		
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.gain;                            	// Gain's object
		this.syncAudio
		this.duration = duration;
		// this.filesPath = "AudioFiles0/";
		this.filesPath = "AudioFiles1/";
		// this.filesPath = "AudioFilesPiano/";
		this.sourceIndex = sourceIndex;
		this.initialized = false;
		this.connect = false;
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

	UpdateAudioSource(buffer) { // Stop the current playing to play an other source's audioBuffer

		this.changing = true;
		var tempPlayingSound;

   		this.syncAudio = {

		    advanceTime: (currentTime, audioTime, dt) => {
		    	var duration = buffer.duration
		    	// var duration = 6

		    	if (this.changing) {
			        // const env = this.audioContext.createGain();
			        // env.connect(this.gain);
			        // env.gain.value = 0;

			        tempPlayingSound = this.LoadNewSound(buffer);
			        tempPlayingSound.connect(this.gain);

			        if (this.connect) {
			        	this.playingSound.disconnect(this.gain)
			        	this.connect = false;
			        } 

			        this.playingSound = tempPlayingSound;
			        this.playingSound.connect(this.gain);
			      	this.connect = true
			      	// tempPlayingSound.disconnect(this.gain);

			        // env.gain.setValueAtTime(0, audioTime);
			        // env.gain.linearRampToValueAtTime(1, audioTime + 0.01);
			        // env.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.1);

			        // sine.start(buffer.duration*Math.ceil(audioTime/buffer.duration));
			        // sine.stop(buffer.duration*Math.ceil(audioTime/buffer.duration) + buffer.duration);

			        console.log(audioTime, duration*Math.ceil(audioTime/duration))
			        console.log(duration*(Math.ceil(audioTime/duration) - 1))
			        console.log(duration*Math.ceil(audioTime/duration))

			        this.playingSound.start(audioTime, audioTime - duration*(Math.ceil(audioTime/duration) - 1));
			        this.playingSound.stop(duration*Math.ceil(audioTime/duration));



			        this.changing = false;
			        console.log(true)
			        return currentTime + duration*Math.ceil(audioTime/duration) - audioTime;
			    }
			    else {

			        this.playingSound = this.LoadNewSound(buffer);
			        this.playingSound.connect(this.gain);

			        console.log(false, buffer)
			        console.log(audioTime, duration*Math.ceil(audioTime/duration))


			        this.playingSound.start(audioTime);
			        this.playingSound.stop(audioTime + duration);

			        return currentTime + duration;
			    }
	    	}
    	}

    	// console.log(this.syncAudio)
   		document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));

	}

	// function to load samples
	loadSample(url) {
		// console.log(url)
	    var fetchSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
	    fetchSound.open("GET",this.filesPath + url, true); // Path to Audio File
	    fetchSound.responseType = "arraybuffer"; // Read as Binary Data
	    fetchSound.onload = (() => { // ∆∆∆∆∆∆∆∆ c'est lui qu'il faut améliorer ∆∆∆∆∆∆∆∆
	    	console.log("e")
	        this.audioContext.decodeAudioData(fetchSound.response, ((buffer) => {
	        	console.log(buffer)
	        	this.UpdateAudioSource(buffer);
	        }), (() => {console.error("hmmm...")}));
	    })
	    fetchSound.send();
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
