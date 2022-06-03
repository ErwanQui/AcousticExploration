//////////////////
/// Audio.js ///
//////////////////

class Audio {

	constructor (data, audioContext, player) {

    	// Require plugins if needed
    	this.audioBufferLoader = this.require('audio-buffer-loader');
    	this.filesystem = this.require('filesystem');		

	    // Creating AudioContext
	    this.audioContext = new AudioContext();
	    this.playingSounds = [];                    // BufferSources
	    this.gains = [];                            // Gains

	    this.audioData = audioData;
	    this.nbSources = nbSources;
	}

	async start () {

	    // Creating Gains
	    for (let i = 0; i < this.nbSources; i++) {
	      this.gains.push(await this.audioContext.createGain());
	    }

	    // init with current content
    	await this.loadSoundbank();
	}

	loadSoundbank() { // Load the audioData to use
	    const soundbankTree = this.filesystem.get(this.audioData);
	    const defObj = {};
	    soundbankTree.children.forEach(leaf => {
	      if (leaf.type === 'file') {
	        defObj[leaf.name] = leaf.url;
	      }
	    });
	    this.audioBufferLoader.load(defObj, true);
  	}

	LoadNewSound(buffer, index) { // Create and link the sound to the AudioContext
	    // Sound initialisation
	    var sound = this.audioContext.createBufferSource();   // Create the sound
	    sound.loop = true;                                    // Set the sound to loop
	    sound.buffer = buffer;                                // Set the sound buffer
	    sound.connect(this.gains[index]);                     // Connect the sound to the other nodes
	    return (sound);
	}

	PositionChanged() { // Update the closest Sources to use when Listener's Position changed

	    // Initialising variables
	    this.previousClosestPointsId = this.ClosestPointsId;

	    // Update the closest Points
	    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);
	    
	    // Check all the new closest Points
	    for (let i = 0; i < this.nbClosestPoints - 1; i++) {

	      	// Check if the Id is new in 'this.ClosestPointsId'
	      	if (this.previousClosestPointsId[i] != this.ClosestPointsId[i]) {

		        // Update the Display for Sources that are not active
		        if (this.NotIn(this.previousClosestPointsId[i], this.ClosestPointsId) || this.previousClosestPointsId[i] == this.ClosestPointsId[this.nbClosestPoints - 1]) {
		          document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "grey";
		        }

		        this.playingSounds[i].stop();                         // Stop the previous Source
		        this.playingSounds[i].disconnect(this.gains[i]);      // Disconnect the Source from the audio

		        // Update the new Sound for the new Sources
		        this.playingSounds[i] = this.LoadNewSound(this.audioBufferLoader.data[this.audioFilesName[this.ClosestPointsId[i]]], i);
		        this.playingSounds[i].start();                        // Start the new Source
	      	}

		    // Update Source parameters
		    this.UpdateSourcesSound(i);
	    }
  	}  

	UpdateSourcesSound(index) { // Update Gain and Display of the Source depending on Listener's Position

	    // Set a using value to the Source
	    var sourceValue = this.gainsValue[index]/this.gainNorm;

	    // Update the Display of the Source
	    document.getElementById("circle" + this.ClosestPointsId[index]).style.background = "rgb(0, " + 255*(4*Math.pow(sourceValue, 2)) + ", 0)";
	    
	    // Update the Gain of the Source
	    this.gains[index].gain.setValueAtTime(sourceValue, 0);
  	}
}

export default Audio;
