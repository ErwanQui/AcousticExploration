//////////////////
/// Streming.js ///
//////////////////

class Streaming {

	constructor (audioContext) {
		
	    // Creating AudioContext
	    this.audioContext = audioContext;
	    this.playingSound;                    // BufferSources
	    this.gain;                            // Gains
	}

	async start (buffer, value, norm) {

	    // Creating Gains
	    this.gain = await this.audioContext.createGain();

	    // init with current content
    	this.gain.gain.setValueAtTime(value/norm, 0)

    	this.playingSound = this.LoadNewSound(buffer)

    	this.gain.connect(this.audioContext.destination)
    	this.playingSound.connect(this.gain)

    	this.playingSound.start()
	}

	LoadNewSound(buffer) { // Create and link the sound to the AudioContext
	    // Sound initialisation
	    var sound = this.audioContext.createBufferSource();		// Create the sound
	    sound.loop = true;                                    	// Set the sound to loop
	    sound.buffer = buffer;                                	// Set the sound buffer
	    sound.connect(this.gain);								// Connect the sound to the other nodes
	    return (sound);
	}

	UpdateAudioSource(buffer, value, norm) {
		this.playingSound.stop();
		this.playingSound.disconnect(this.gain);
		this.playingSound = this.LoadNewSound(buffer);
		// console.log(value/norm)
		// this.gain.gain.setValueAtTime(value/norm, 0)
		this.playingSound.start();
	}

	UpdateGain(value, norm) { // Update Gain and Display of the Source depending on Listener's Position
	    
	    // Update the Gain of the Source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}
}

export default Streaming;
