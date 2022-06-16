/////////////////////////
/// AmbiConvolving.js ///
/////////////////////////

class AmbiConvolving {

	constructor (audioContext, order, soundIndex) {

	    // Create global variables
	    this.audioContext = audioContext;						// AudioContext
	    this.order = order;										// Ambisonic order
	    this.nbFiles = Math.ceil(Math.pow(order + 1, 2)/8);		// Get the number of 8 channels' files
	    this.nbAudios;											// Number of sources (instanciate in 'start()')

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

		// Connect nodes of global branch
		this.mirror.out.connect(this.rotator.in)
    	this.rotator.out.connect(this.decoder.in);
    	this.decoder.out.connect(this.gain);
    	this.gain.connect(this.audioContext.destination);

	    // Set current and global values
    	this.gain.gain.setValueAtTime(value/(5*norm), 0);
    	this.nbAudios = files.Sounds.length;

    	// Create branch for each source
    	for (let i = 0; i < this.nbAudios; i++) {

    		// Addd a bufferSource
		    this.playingSounds.push(this.LoadNewSound(data[files.Sounds[i]]));

		    // Add a convolver and his parameters in an object
	    	this.convolvers.push({
	    		convolver: new this.ambisonic.convolver(this.audioContext, this.order),		// Convolver
	    		bufferSource: undefined,													// Convolver's buffer
	    		channels: []																// List of channels for each file associate to this rirs
	    	});

	    	// Set the liste of channels for each file associate to the rirs
			for (let j = 0; j < this.nbFiles; j++) {
		    	if (j != this.nbFiles - 1) {
		    		this.convolvers[i].channels.push(
		    			[this.addLeadingZeros(8*j + 1, 2), this.addLeadingZeros(8*(j + 1), 2)]  
		    		);
		    	}
		    	else {
		    		this.convolvers[i].channels.push(
		    			[this.addLeadingZeros(8*j + 1, 2), this.addLeadingZeros(Math.pow(this.order + 1, 2), 2)]
					);
		    	}
		    }

		    // Connect the branch to the global branch
	    	this.playingSounds[i].connect(this.convolvers[i].convolver.in);
	    	this.convolvers[i].convolver.out.connect(this.mirror.in);

	    	// Set the rir for the new convolver
	    	this.UpdateRirs(data, files.Rirs["source" + i][rirIndex], i);
		}

    	// Wait that the simulation screen appeared before playing sounds
    	document.addEventListener("rendered", () => {
	    	for (let i = 0; i < this.nbAudios; i++) {
			    this.playingSounds[i].start();
	    	}
	    });
	}

	addLeadingZeros(num, totalLength) { // Add zeros to a number
		
  		return String(num).padStart(totalLength, '0');
	}

	SlicePath(path, sourceIndex) { // Slice the path and return concatenate paths with channels' infos

		return (this.ConcatenatePath(path.slice(0, path.length - 4), path.slice(path.length - 4, path.length), sourceIndex));
	}

	ConcatenatePath(fileWithoutExt, fileExt, sourceIndex) { // Add the channels' infos in the paths to get the good files
		var files = [];
		for (let j = 0; j < this.nbFiles; j++) {
			files.push(fileWithoutExt + "_" + this.convolvers[sourceIndex].channels[j][0] + "-" + this.convolvers[sourceIndex].channels[j][1] + "ch" + fileExt)
		}
		return (files);
	}

	LoadNewSound(buffer) { // Create the sound

	    var sound = this.audioContext.createBufferSource();			// Create the sound
	    sound.loop = true;                                    		// Set the sound to loop
	    sound.buffer = buffer;                                		// Set the sound buffer
	    return (sound);
	}

	UpdateRirs(data, file, sourceIndex) { // Update convolvers' rirs

	    // Get 8 channels files
    	var slicedFiles = this.SlicePath(file, sourceIndex);

    	// Get buffer with concatenate files
	    this.convolvers[sourceIndex].bufferSource = this.concatBuffers(data, slicedFiles);

	    // Update convolver
	    this.convolvers[sourceIndex].convolver.updateFilters(this.convolvers[sourceIndex].bufferSource);
	}

	UpdateAudioSource(data, file, rirIndex) { // Change convolver's buffer when listener's position changes

		// Change the convlvers' rirs
		for (let i = 0; i < this.nbAudios; i++) {
			this.UpdateRirs(data, file["source" + i][rirIndex], i);
		}
	}

	UpdateGain(value, norm) { // Update gain and display of the source depending on listener's position
	    
	    // @note: the sound was inaudible, so I divide gain by 5
	    // Update the gain of the source
	    this.gain.gain.setValueAtTime(value/(5*norm), 0);
  	}

  	concatBuffers(data, files) { // Get concatenate channels buffer

        var length = 0;
        for (let j = 0; j < this.nbFiles; j++) {
        	length = Math.max(length, data[files[j]].length)
        }
        var remap8ChanFile = [1,2,3,4,5,6,7,8];
        var srate = data[files[0]].sampleRate;

        var concatBuffer = this.audioContext.createBuffer(Math.pow(this.order + 1, 2), length, srate);
        for (let i = 0; i < this.nbFiles; i++) {
            for (let j = 0; j < data[files[i]].numberOfChannels; j++) {
                concatBuffer.getChannelData(i*8 + j).set(data[files[i]].getChannelData(remap8ChanFile[j]-1));
            }
        }
        return(concatBuffer);
  	}
}

export default AmbiConvolving;
