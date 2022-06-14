////////////////////
/// Streaming.js ///
////////////////////

class Streaming {

	constructor (audioContext) {
		
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.gain;                            	// Gain's object
	}

	async start (buffer, value, norm) {

	    // Create the gain
	    this.gain = this.audioContext.createGain();

	    // Initiate with current gain's value
    	this.gain.gain.setValueAtTime(value/norm, 0);

    	// Load the sound from the buffer
    	this.playingSound = this.LoadNewSound(buffer);

    	// Connect the audioNodes
    	this.gain.connect(this.audioContext.destination);
    	this.playingSound.connect(this.gain);

    	// Play the sound
    	this.playingSound.start();
	}

	LoadNewSound(buffer) { // Create and link the sound to the audioContext

	    var sound = this.audioContext.createBufferSource();		// Create the sound
	    sound.loop = true;                                    	// Set the sound to loop
	    sound.buffer = buffer;                                	// Set the sound buffer
	    sound.connect(this.gain);								// Connect the sound to the other nodes
	    return (sound);
	}

	UpdateAudioSource(buffer) { // Stop the current playing to play an other source's audioBuffer

		this.playingSound.stop();							// Stop the audio
		this.playingSound.disconnect(this.gain);			// Disconnect it from the tree
		this.playingSound = this.LoadNewSound(buffer);		// Load the new audioBuffer and link the new node
		this.playingSound.start();							// Play the new audio
	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}
}

export default Streaming;
