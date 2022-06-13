////////////////////
/// Ambisonic.js ///
////////////////////

// @note: voir si il faudrait pas utiliser un autre décodeur

class Ambisonic {

	constructor (audioContext, order) {
		
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.order = order;						// get ambisonic's order

	    // Get ambisnic's objects
	    this.ambisonic = require("ambisonics");

	    // Create the audioNodes
	    this.playingSound = this.audioContext.createBufferSource();
	    this.encoder = new this.ambisonic.monoEncoder(this.audioContext, this.order);
	   	this.mirror = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	    this.gain = this.audioContext.createGain();

	}

	async start (buffer, value, norm) {

	    // Connect the audioNodes
    	this.playingSound.connect(this.decoder.in);
    	// this.encoder.out.connect(this.mirror.in);
    	// this.mirror.out.connect(this.rotator.in);
    	// this.rotator.out.connect(this.decoder.in);
    	this.decoder.out.connect(this.gain);
    	this.gain.connect(this.audioContext.destination);



	    // init with current content
    	this.gain.gain.setValueAtTime(value/norm, 0)

    	// Load the sound from the buffer
    	this.playingSound = this.LoadNewSound(buffer)

    	// this.gain.connect(this.audioContext.destination)
    	// this.playingSound.connect(this.gain)
 	console.log(buffer)
    	console.log(this.playingSound)
    	console.log(this.encoder)
    	console.log(this.mirror)
    	console.log(this.rotator)
    	console.log(this.decoder)

    	// Play the sound
    	this.playingSound.start()
	}

	LoadNewSound(buffer) { // Create and link the sound to the AudioContext
	    var sound = this.audioContext.createBufferSource();		// Create the sound
	    sound.loop = true;                                    	// Set the sound to loop
	    sound.buffer = buffer;                                	// Set the sound buffer
	    sound.connect(this.gain);								// Connect the sound to the other nodes
	    return (sound);
	}

	UpdateAudioSource(buffer, value, norm) { // Stop the current playing to play an other source's audioBuffer

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

export default Ambisonic;
