////////////////////
/// Ambisonic.js ///
////////////////////

// @note: voir si il faudrait pas utiliser un autre décodeur

class Ambisonic {

	constructor (audioContext, order) {
		
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.order = order;						// get ambisonic's order

	    // Get ambisonic's objects
	    this.ambisonic = require("ambisonics");

	    // Create the audioNodes
	    this.playingSound1_8 = this.audioContext.createBufferSource();
	    this.playingSound9_9 = this.audioContext.createBufferSource();
	   	this.mirror = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	    this.gain = this.audioContext.createGain();

	}

	async start (data, file, index, value, norm) {

		var files = this.SlicePath(file[index]);

	    // Connect the audioNodes
    	this.playingSound1_8.connect(this.mirror.in);
    	this.playingSound9_9.connect(this.mirror.in);
    	this.mirror.out.connect(this.rotator.in);
    	this.rotator.out.connect(this.decoder.in);
    	this.decoder.out.connect(this.gain);
    	this.gain.connect(this.audioContext.destination);



	    // init with current content
    	this.gain.gain.setValueAtTime(value/norm, 0)

    	// Load the sound from the buffer
    	this.playingSound1_8 = this.LoadNewSound(data[files.file1_8])
    	this.playingSound9_9 = this.LoadNewSound(data[files.file9_9])

    	// Play the sound
    	this.playingSound1_8.start()
    	this.playingSound9_9.start()
	}

	SlicePath(path) {
		return (this.ConcatenatePath(path.slice(0, path.length - 4), path.slice(path.length - 4, path.length)));
	}

	ConcatenatePath(fileWithoutExt, fileExt) {
		var files = {
			file1_8: fileWithoutExt + "_01-08ch" + fileExt,
			file9_9: fileWithoutExt + "_09-09ch" + fileExt
		}
		return (files);
	}

	LoadNewSound(buffer) { // Create and link the sound to the AudioContext
	    var sound = this.audioContext.createBufferSource();		// Create the sound
	    sound.loop = true;                                    	// Set the sound to loop
	    sound.buffer = buffer;                                	// Set the sound buffer
	    sound.connect(this.mirror.in);								// Connect the sound to the other nodes
	    return (sound);
	}

	UpdateAudioSource(data, file) { // Stop the current playing to play an other source's audioBuffer

		var files = this.SlicePath(file);

		this.playingSound1_8.stop();							// Stop the audio
		this.playingSound9_9.stop();							// Stop the audio
		this.playingSound1_8.disconnect(this.mirror.in);			// Disconnect it from the tree
		this.playingSound9_9.disconnect(this.mirror.in);			// Disconnect it from the tree
		this.playingSound1_8 = this.LoadNewSound(data[files.file1_8]);		// Load the new audioBuffer and link the new node
		this.playingSound9_9 = this.LoadNewSound(data[files.file9_9]);		// Load the new audioBuffer and link the new node
		this.playingSound1_8.start();							// Play the new audio
		this.playingSound9_9.start();							// Play the new audio
	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}
}

export default Ambisonic;
