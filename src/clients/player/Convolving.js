/////////////////////
/// Convolving.js ///
/////////////////////

class Convolving {

	constructor (audioContext, order) {
		

	    // Creating AudioContext
	    this.audioContext = audioContext;
	    this.order = order;

	    this.ambisonic = require("ambisonics");
	    this.convolvers = [];
	   	this.mirror = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	    this.gain = this.audioContext.createGain();

	    this.playingSounds = [];
	    this.nbAudios;
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
    	
    	for (let i = 0; i < this.nbAudios; i++) {
		    this.playingSounds.push(this.LoadNewSound(data[files.Sounds[i]]));
		    this.convolvers.push(this.audioContext.createConvolver());
	    	this.playingSounds[i].connect(this.convolvers[i]);					// Connect the sound to the other nodes
	    	this.convolvers[i].connect(this.mirror.in);
	    	this.UpdateRir(data[files.Rirs["source" + i][rirIndex]], i);

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

	UpdateAudioSource(buffer) {

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
