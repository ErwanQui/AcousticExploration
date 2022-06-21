////////////////////
/// Streaming.js ///
////////////////////

class Streaming {

	constructor (audioContext, duration) {
		
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.gain;                            	// Gain's object
		this.syncAudio
		this.duration = duration
	}

	async start (buffer, value, norm) {

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
    	this.UpdateAudioSource(buffer);
	}

	LoadNewSound(buffer) { // Create and link the sound to the audioContext

	    var sound = this.audioContext.createBufferSource();		// Create the sound
	    sound.loop = true;                                    	// Set the sound to loop
	    sound.buffer = buffer;                                	// Set the sound buffer
	    sound.connect(this.gain);								// Connect the sound to the other nodes
	    return (sound);
	}

	UpdateAudioSource(buffer) { // Stop the current playing to play an other source's audioBuffer

   		this.syncAudio = {

		    advanceTime: (currentTime, audioTime, dt) => {

		        const env = this.audioContext.createGain();
		        env.connect(this.gain);
		        env.gain.value = 0;

		        const sine = this.LoadNewSound(buffer);
		        sine.connect(env);

		        env.gain.setValueAtTime(0, audioTime);
		        env.gain.linearRampToValueAtTime(1, audioTime + 0.01);
		        env.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.1);

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
