////////////////////
/// Ambisonic.js ///
////////////////////

class Streaming {

	constructor (audioContext, sourceIndex, audioStream, playingState, order) {

	    // Get audioContext and streaming
	    this.audioContext = audioContext;						// Get audioContext
	    this.audioStream = audioStream;							// Get streaming plugin
	    this.ambisonic = require("ambisonics");					// Get ambisonic constructor
	
		// Create global parameters and objects
		this.sourceIndex = sourceIndex;							// Set the index of the audioSource
		this.playingState = playingState;						// Set the state of the audioSource (active or not)
		this.order = order;										// Set the order of the ambisonic files
		this.nbFiles = Math.ceil(Math.pow(order + 1, 2)/8);		// Get the number of 8-channels' files
	    this.fileObjects = [];									// Object to store the 8-channels' datas and status

	    // Create the audioNodes
	    this.gain = this.audioContext.createGain();
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	}

	async start (url, value, norm) {

		console.info("Starting source: " + this.sourceIndex);

		// Create an object to store and play the 8-channels' audio files
		for (let i = 0; i < this.nbFiles; i++) {
	    	if (i != this.nbFiles - 1) {
	    		this.fileObjects.push({
	    			syncAudio: undefined,						// Store the syncObject for the scheduler (in "Sources.js")
	    			audio: undefined,							// Audio buffer of the file
	    			initiate: true,								// Attribute to tell if it's the first audio to be played
	    			changing: undefined,						// Attribute to tell if the audio file is a new one
	    			ready: false,								// Attribute to tell if the audio file is ready to be played
	    			channels: [this.addLeadingZeros(8*i + 1, 2), this.addLeadingZeros(8*(i + 1), 2)]	// Store the channel's index of the audio file
	    		});
	    	}
	    	else {
	    		this.fileObjects.push({
	    			syncAudio: undefined,						// Store the syncObject for the scheduler (in "Sources.js")
	    			audio: undefined,							// Audio buffer of the file
	    			initiate: true,								// Attribute to tell if it's the first audio to be played
	    			changing: undefined,						// Attribute to tell if the audio file is a new one
	    			ready: false,								// Attribute to tell if the audio file is ready to be played
	    			channels: [this.addLeadingZeros(8*i + 1, 2), this.addLeadingZeros(Math.pow(this.order + 1, 2), 2)]	// Store the channel's index of the audio file
				});
	    	}
	    }

	    // Initiate with current gain's value if this audioSource is active
    	if (this.playingState) {
    		this.gain.gain.setValueAtTime(value/norm, 0);
    	}
    	else {
    		this.gain.gain.setValueAtTime(0, 0);
    	}

    	// Connect the audioNodes
    	this.gain.connect(this.rotator.in);
    	this.rotator.out.connect(this.decoder.in);
    	this.decoder.out.connect(this.audioContext.destination);

    	// Add an event listener to update the orientation when it changes
    	// @note: an other "deviceorientation" listener runs in "Listener.js"
    	window.addEventListener("deviceorientation", event => this.UpdateOrientation(event.alpha));

    	// Load and play the sound (ie: add to the scheduler)
    	this.loadSample(url);
	}

	ChangePlayingState(state) { // Change the playing state of the audioSource (active or not)

		if (this.playingState != state) {
			if (state) {
			    console.log("AudioSources " + this.sourceIndex + " is now playing");
			}
			else {
				console.log("AudioSources " + this.sourceIndex + " is no more playing");
			}
			this.playingState = state;
		}
	}

	addLeadingZeros(num, totalLength) { // Add zeros before a number
		
  		return String(num).padStart(totalLength, '0');
	}

	SlicePath(path) { // Slice the path and return concatenate paths with channels' infos

		return (this.ConcatenatePath(path.slice(0, path.length - 4), path.slice(path.length - 4, path.length)));
	}

	ConcatenatePath(fileWithoutExt, fileExt) { // Add the channels' infos in the paths to get the good files
		var files = [];
		for (let i = 0; i < this.nbFiles; i++) {
			files.push(fileWithoutExt + "_" + this.fileObjects[i].channels[0] + "-" + this.fileObjects[i].channels[1] + "ch" + fileExt)
		}
		return (files);
	}

	UpdateOrientation(orientation) { // Update the orientation of the ambisonic audio
		this.rotator.yaw = orientation;
		this.rotator.updateRotMtx();
	}

	loadSample(url) { // Load the samples and update the audioSource to add them to the scheduler

		// Get the 8-channels sliced files
		var urls = this.SlicePath(url);

      	console.log("File played: " + url);

      	// Change the "ready" attribute to be played of the audio files to "false"
      	for (let i = 0; i < this.nbFiles; i++) {
      		this.fileObjects[i].ready = false;
      	}

      	// Upadte the audioSources by adding the new files to the scheduler
		for (let i = 0; i < this.nbFiles; i++) {
      		this.UpdateAudioSource(urls[i], this.fileObjects[i]);
      	}
	}

	UpdateAudioSource(url, partFile) { // Stop the current playing to play an other source's audioBuffer

		// Set the changing attribute of the audio file to "true"
		partFile.changing = true;

		// Define the syncAudio attribute
   		partFile.syncAudio = {

   			// Create the "advanceTime" attribute
   			// @note: It's what called the scheduler (in "Sources.js") to play the sound
		    advanceTime: (currentTime, audioTime, dt) => {

		    	// If it's a new audio file (=> it will not necessarily start at beginning)
		    	if (partFile.changing) {

		    		// Get the audio with the streaming plugin
		    		var tempAudio = this.audioStream.createStreamSource();
			      	tempAudio.streamId = url;

			      	// Get the duration of the audio file
			      	this.audioDuration = tempAudio.duration;

			      	// If it's not the first audio file to be played, dtop the previous one
			        if (!partFile.initiate) {
			        	partFile.audio.stop();
			        }
			        else {
			        	partFile.initiate = false;
			        }

			        // Set the new audio file to the corresponding audio of the 8-channels object
			        partFile.audio = tempAudio;

			        // Start the audio at the good moment to be synced (so not necessarily at beginning)
				    partFile.audio.start(audioTime, audioTime - this.audioDuration*(Math.ceil(audioTime/this.audioDuration) - 1));

				    // Connect it to others audioNodes
		      		partFile.audio.connect(this.gain);

					// Stop the audio at the good time				    
				    partFile.audio.stop(this.audioDuration*Math.ceil(audioTime/this.audioDuration));

				    // Reset the changing file attribute
			        partFile.changing = false;

			        // Return the global time of the next call for the scheduler
			        return currentTime + this.audioDuration*Math.ceil(audioTime/this.audioDuration) - audioTime;
			    }
			    else {

			    	// Get the audio with the streaming plugin
			    	partFile.audio = this.audioStream.createStreamSource();
			      	partFile.audio.streamId = url;

			      	// Start and stop audio at the good time and connect it to others audioNodes
				    partFile.audio.start(audioTime);
				    partFile.audio.connect(this.gain);
				    partFile.audio.stop(audioTime + this.audioDuration);

					// Return the global time of the next call for the scheduler
			        return currentTime + this.audioDuration;
			    }
	    	}
    	}

    	// Set this 8-channels file to ready to be played
    	partFile.ready = true

    	// Check if all 8-channels files of this audioSource are ready to be played.
    	// In this case, dispatch an event in "Sources.js" to update the scheduler
    	if (this.fileObjects.every((file) => file.ready)) {
		    console.log("AudioSources " + this.sourceIndex + " is now connected");
   			document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));
    	}
	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}

  	GetSyncBuffer() { // Get all syncAudios attributes in an array to add them to the scheduler
  		var syncAudios = [];

  		for (let i = 0; i < this.nbFiles; i++) {
  			syncAudios.push(this.fileObjects[i].syncAudio);
  		}
  		return(syncAudios);
  	}
}

export default Streaming;