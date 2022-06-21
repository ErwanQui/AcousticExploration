////////////////////
/// Ambisonic.js ///
////////////////////

class Ambisonic {

	constructor (audioContext, order) {
		
	    // Creating AudioContext
	    this.audioContext = audioContext;						// Get audioContext
	    this.order = order;										// get ambisonic's order
	   	this.playingSounds = [];								// Instantiate the container for the bufferSources
	    this.nbFiles = Math.ceil(Math.pow(order + 1, 2)/8);		// Get the number of 8 channels' files

	    // Get ambisonic's objects
	    this.ambisonic = require("ambisonics");

	    // Create the audioNodes
	   	this.mirror = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	    this.gain = this.audioContext.createGain();

	    this.syncAudio
		this.duration = duration
	}

	async start (data, file, index, value, norm) {

		// Set the object for the multiple 8 channels' sources
		for (let i = 0; i < this.nbFiles; i++) {
	    	if (i != this.nbFiles - 1) {
	    		this.playingSounds.push({
	    			bufferSource: undefined,
	    			channels: [this.addLeadingZeros(8*i + 1, 2), this.addLeadingZeros(8*(i + 1), 2)]  
	    		});
	    	}
	    	else {
	    		this.playingSounds.push({
	    			bufferSource: undefined,
	    			channels: [this.addLeadingZeros(8*i + 1, 2), this.addLeadingZeros(Math.pow(this.order + 1, 2), 2)]
				});
	    	}
	    }

		// Change the path to get audios of 8 channels
		var files = this.SlicePath(file[index]);

	    // Connect the audioNodes
    	this.mirror.out.connect(this.rotator.in);
    	this.rotator.out.connect(this.decoder.in);
    	this.decoder.out.connect(this.gain);
    	this.gain.connect(this.audioContext.destination);

	    // init with current content
    	this.gain.gain.setValueAtTime(value/norm, 0)

    	// Load the sound from the buffers and play them
    	for (let i = 0; i < this.nbFiles; i++) {
	    	this.playingSounds[i].bufferSource = this.LoadNewSound(data[files[i]]);
	    	this.playingSounds[i].bufferSource.start();
	    }
	}

	addLeadingZeros(num, totalLength) { // Add zeros to a number
		
  		return String(num).padStart(totalLength, '0');
	}

	SlicePath(path) { // Slice the path and return concatenate paths with channels' infos

		return (this.ConcatenatePath(path.slice(0, path.length - 4), path.slice(path.length - 4, path.length)));
	}

	ConcatenatePath(fileWithoutExt, fileExt) { // Add the channels' infos in the paths to get the good files
		var files = [];
		for (let i = 0; i < this.nbFiles; i++) {
			files.push(fileWithoutExt + "_" + this.playingSounds[i].channels[0] + "-" + this.playingSounds[i].channels[1] + "ch" + fileExt)
		}
		return (files);
	}

	LoadNewSound(buffer) { // Create and link the sound to the AudioContext

	    var sound = this.audioContext.createBufferSource();			// Create the sound
	    sound.loop = true;                                    		// Set the sound to loop
	    sound.buffer = buffer;                                		// Set the sound buffer
	    sound.connect(this.mirror.in);								// Connect the sound to the other nodes
	    return (sound);
	}

	UpdateAudioSource(data, file) { // Stop the current playing to play an other source's audioBuffer

		// Change the path to get audio of 8 channels
		var files = this.SlicePath(file);

		// Change the buffer and play the new audio file
		for (let i = 0; i < this.nbFiles; i++) {
			this.playingSounds[i].bufferSource.stop();									// Stop the audio
			this.playingSounds[i].bufferSource.disconnect(this.mirror.in);				// Disconnect it from the tree
			this.playingSounds[i].bufferSource = this.LoadNewSound(data[files[i]]);		// Load the new audioBuffer and link the new node
			this.playingSounds[i].bufferSource.start();									// Play the new audio	
		}
	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}
}

export default Ambisonic;
