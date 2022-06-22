////////////////////
/// Streaming.js ///
////////////////////

class Streaming {

	constructor (audioContext) {
		
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.gain;                            	// Gain's object
		this.syncAudio
		this.duration;
	}

	async start (buffer, value, norm, duration) {

	    // Create the gain
	    this.gain = this.audioContext.createGain();

	    this.duration = duration

	    // Initiate with current gain's value
    	this.gain.gain.setValueAtTime(value/norm, 0);

    	// Load the sound from the buffer
    	// this.playingSound = this.LoadNewSound(buffer);

    	// Connect the audioNodes
    	this.gain.connect(this.audioContext.destination);
    	// this.playingSound.connect(this.gain);

    	// Play the sound
    	// this.playingSound.start();
    	this.UpdateAudioSource(buffer);
	}

	LoadNewSound(buffer) { // Create and link the sound to the audioContext

	    var sound = this.audioContext.createBufferSource();		// Create the sound
	    sound.loop = true;                                    	// Set the sound to loop
	    sound.buffer = buffer;                                	// Set the sound buffer
	    return (sound);
	}

	UpdateAudioSource(buffer) { // Stop the current playing to play an other source's audioBuffer

   		this.syncAudio = {

		    advanceTime: (currentTime, audioTime, dt) => {

		        const sine = this.LoadNewSound(buffer);
		        sine.connect(this.gain);

		        sine.start(this.duration*Math.ceil(audioTime/this.duration));
		        sine.stop(this.duration*Math.ceil(audioTime/this.duration) + buffer.duration);

		        return currentTime + this.duration;
	    	}
    	}
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
