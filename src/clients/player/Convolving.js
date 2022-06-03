//////////////////
/// Convolving.js ///
//////////////////

class Convolving {

	constructor (audioContext, order) {
		

	    // Creating AudioContext
	    this.audioContext = audioContext;
	    this.order = order;

	    this.ambisonic = require("ambisonics")
	    this.convolver = new ambisonics.convolver(this.audioContext, this.order)
	   	this.mirror = new ambisonics.sceneRotator(this.audioContext, this.order);
		this.rotator = new ambisonics.sceneRotator(this.audioContext, this.order);
		this.decoder = new ambisonics.binDecoder(this.audioContext, this.order);
	    this.gain = await this.audioContext.createGain();

	    this.hoaLoaderConvolver;
	}

	async start (buffer, value, norm) {

	    // Creating Gains
	    this.convolver = new ambisonics.convolver(this.audioContext, this.order)
	   	this.mirror = new ambisonics.sceneRotator(this.audioContext, this.order);
		this.rotator = new ambisonics.sceneRotator(this.audioContext, this.order);
		this.decoder = new ambisonics.binDecoder(this.audioContext, this.order);
	    this.gain = await this.audioContext.createGain();

	    // init with current content
    	this.gain.gain.setValueAtTime(value/norm, 0)

    	this.LoadNewSound(buffer)

    	this.convolver.out.connect(this.mirror.in)
    	this.mirror.out.connect(this.rotator)
    	this.rotator.out.connect(this.decoder.in)
    	this.decoder.out.connect(this.gain)
    	this.gain.connect(this.audioContext.destination)

    	this.playingSound.start()
	}

	hoaAssignFiltersOnLoad(buffer) {}

	LoadNewSound(buffer) { // Create and link the sound to the AudioContext
	    // Sound initialisation
	    this.hoaLoaderConvolver = new ambisonics.HOAloader(this.audioContext, this.order, buffer, this.hoaAssignFiltersOnLoad)		// Create the sound
	    console.log(this.hoaLoaderConvolver)
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

export default Convolving;
