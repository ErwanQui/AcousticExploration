/////////////////////
/// Convolving.js ///
/////////////////////

class Convolving {

	constructor (audioContext, order) {
		

	    // Create global variables
	    this.audioContext = audioContext;			// AudioContext
	    this.order = order;							// Ambisonic order
	    this.nbAudios;								// Number of sources (instanciate in 'start()')

	    // Get ambisonic library
	    this.ambisonic = require("ambisonics");

	    // Create audioNodes and their containers
	    this.playingSounds = [];
	    this.convolvers = [];
	   	this.mirror = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	    this.gain = this.audioContext.createGain();
	}

	async start (data, files, rirIndex, value, norm) {

		//Link audioNodes
		this.mirror.out.connect(this.rotator.in);
    	this.rotator.out.connect(this.decoder.in);
    	this.decoder.out.connect(this.gain);
    	this.gain.connect(this.audioContext.destination);

	    // Set current and global values
    	this.gain.gain.setValueAtTime(value/norm, 0);
    	this.nbAudios = files.Sounds.length;

    	// Create branch for each source
    	for (let i = 0; i < this.nbAudios; i++) {
		    this.playingSounds.push(this.LoadNewSound(data[files.Sounds[i]]));	// Add a bufferSource
		    this.convolvers.push(this.audioContext.createConvolver());			// Add a convolver

		    // Connect the new branch to the global branch
	    	this.playingSounds[i].connect(this.convolvers[i]);
	    	this.convolvers[i].connect(this.mirror.in);	

	    	// Set the rir for the new convolver						
	    	this.UpdateRir(data[files.Rirs["source" + i][rirIndex]], i);

	    	// Play sound
    		this.playingSounds[i].start();
    	}
	}

	LoadNewSound(buffer) { // Create the sound

	    var sound = this.audioContext.createBufferSource();			// Create the sound
	    sound.loop = true;                                    		// Set the sound to loop
	    sound.buffer = buffer;                                		// Set the sound buffer
	    return (sound);
	}

	UpdateRir(buffer, index) { // Update convolvers' rirs

	    this.convolvers[index].buffer = buffer;
	}

	UpdateAudioSource(buffer) { // Change convolver's buffer when listener's position changes

	    // Update sources' rirs
		for (let i = 0; i < this.nbAudios; i++) {
			this.UpdateRir(buffer, i);
		}
	}

	UpdateGain(value, norm) { // Update gain and display of the Ssurce depending on listener's position
	    
	    // Update the sain of the source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}
}

export default Convolving;
