////////////////////
/// Ambisonic.js ///
////////////////////

class Streaming {

	constructor (audioContext, sourceIndex, audioStream, playingState, order) {
	    // Creating AudioContext
	    this.audioContext = audioContext;						// Get audioContext
	    this.audioStream = audioStream;							// Get streaming plugin
		
		this.sourceIndex = sourceIndex;							// Set the index of the audioSource
		this.playingState = playingState;						// Set the state of the audioSource (active or not)

		this.order = order;										// Set the order of the ambisonic files
		this.nbFiles = Math.ceil(Math.pow(order + 1, 2)/8);		// Get the number of 8-channels' files

	    // Get ambisonic's objects
	    this.ambisonic = require("ambisonics");
	    this.fileObjects = [];									// Object to store the 8-channels' datas and status

	    // Create the audioNodes
	    this.gain = this.audioContext.createGain();
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	    this.gain = this.audioContext.createGain();

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

	    // Initiate with current gain's value
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

    	// Play the sound
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
		// console.log(this.sourceIndex, this.playingState)
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
			files.push(fileWithoutExt + "_" + this.fileObjects[i].channels[0] + "-" + this.fileObjects[i].channels[1] + "ch" + fileExt)
		}
		return (files);
	}

	UpdateOrientation(orientation) { // Update the orientation of the ambisonic audio
		this.rotator.yaw = orientation;
		this.rotator.updateRotMtx();
	}


	UpdateAudioSource(url, partFile) { // Stop the current playing to play an other source's audioBuffer

		partFile.changing = true;
		var tempPlayingSound;

   		partFile.syncAudio = {

		    advanceTime: (currentTime, audioTime, dt) => {

		    	if (partFile.changing) {

		    		var tempAudio = this.audioStream.createStreamSource();
					// console.log(url)
			      	tempAudio.streamId = url;
			      	this.audioDuration = tempAudio.duration;

			        if (!partFile.initiate) {
			        	partFile.audio.stop();
			        }
			        else {
			        	partFile.initiate = false;
			        }

			        partFile.audio = tempAudio;

				    partFile.audio.start(audioTime, audioTime - this.audioDuration*(Math.ceil(audioTime/this.audioDuration) - 1));

		      		partFile.audio.connect(this.gain);
				    
				    partFile.audio.stop(this.audioDuration*Math.ceil(audioTime/this.audioDuration));

			        partFile.changing = false;
			        return currentTime + this.audioDuration*Math.ceil(audioTime/this.audioDuration) - audioTime;
			    }
			    else {
			    	partFile.audio = this.audioStream.createStreamSource();
			      	partFile.audio.streamId = url;
			      	
			      	partFile.audio.connect(this.gain);

				    partFile.audio.start(audioTime);
				    partFile.audio.stop(audioTime + this.audioDuration);

			        return currentTime + this.audioDuration;
			    }
	    	}
    	}

    	partFile.ready = true
    	if (this.fileObjects.every((file) => file.ready)) {
		    console.log("AudioSources " + this.sourceIndex + " is now connected");
   			document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));
    	}
	}

	// function to load samples
	loadSample(url) {

		var urls = this.SlicePath(url);

      	console.log("File played: " + url);

      	for (let i = 0; i < this.nbFiles; i++) {
      		this.fileObjects[i].ready = false;
      	}

		for (let i = 0; i < this.nbFiles; i++) {
      		this.UpdateAudioSource(urls[i], this.fileObjects[i]);
      	}
	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}

  	GetSyncBuffer() {
  		var syncAudios = [];

  		for (let i = 0; i < this.nbFiles; i++) {
  			syncAudios.push(this.fileObjects[i].syncAudio);
  		}
  		// console.log(syncAudios)
  		return(syncAudios)
  	}
}

export default Streaming;
