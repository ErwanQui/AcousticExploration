////////////////////
/// Ambisonic.js ///
////////////////////

class Streaming {

	constructor (audioContext, duration, sourceIndex, audioStream, playingState, order) {
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.audioStream = audioStream
	    this.gain;                            	// Gain's object
		this.duration = duration;
		this.filesPath = "AudioFiles2/";
		this.sourceIndex = sourceIndex;
		this.playingState = playingState
		this.audio;

		this.order = order;
		this.nbFiles = Math.ceil(Math.pow(order + 1, 2)/8);		// Get the number of 8 channels' files

	    // Get ambisonic's objects
	    this.ambisonic = require("ambisonics");
	    this.fileObjects = []

	    // Create the audioNodes
	   	this.mirror = new this.ambisonic.sceneMirror(this.audioContext, this.order);
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	    this.gain = this.audioContext.createGain();

	}

	async start (url, value, norm) {

		console.info("Starting source: " + this.sourceIndex)


		// Set the object for the multiple 8 channels' sources
		for (let i = 0; i < this.nbFiles; i++) {
	    	if (i != this.nbFiles - 1) {
	    		this.fileObjects.push({
	    			syncAudio: undefined,
	    			changing: undefined,
	    			initiate: true,
	    			audio: undefined,
	    			ready: false,
	    			channels: [this.addLeadingZeros(8*i + 1, 2), this.addLeadingZeros(8*(i + 1), 2)]  
	    		});
	    	}
	    	else {
	    		this.fileObjects.push({
	    			syncAudio: undefined,
	    			changing: undefined,
	    			initiate: true,
	    			audio: undefined,
	    			ready: false,
	    			channels: [this.addLeadingZeros(8*i + 1, 2), this.addLeadingZeros(Math.pow(this.order + 1, 2), 2)]
				});
	    	}
	    }

	    // Create the gain
	    this.gain = this.audioContext.createGain();

	    // Initiate with current gain's value
    	
    	if (this.playingState) {
    		this.gain.gain.setValueAtTime(value/norm, 0);
    	}
    	else {
    		this.gain.gain.setValueAtTime(0, 0);
    	}

    	// Connect the audioNodes
    	this.gain.connect(this.mirror.in);
    	this.mirror.out.connect(this.rotator.in);
    	this.rotator.out.connect(this.decoder.in);
    	this.decoder.out.connect(this.audioContext.destination);

    	window.addEventListener("deviceorientation", event => this.UpdateOrientation(event.alpha))

    	// Play the sound
    	this.loadSample(url);
	}

	ChangePlayingState(state) {
		if (this.playingState != state) {
			if (state) {
			    console.log("AudioSources " + this.sourceIndex + " is now playing")
			}
			else {
				console.log("AudioSources " + this.sourceIndex + " is no more playing")
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

	StopAudio() {
		this.audio.stop();
	}

	UpdateOrientation(orientation) {
		this.rotator.yaw = orientation;
		console.log(orientation)
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
			      	this.audioDuration = tempAudio.duration

			        if (!partFile.initiate) {
			        	partFile.audio.stop()
			        }
			        else {
			        	partFile.initiate = false
			        }

			        partFile.audio = tempAudio;

				    partFile.audio.start(audioTime, audioTime - this.audioDuration*(Math.ceil(audioTime/this.audioDuration) - 1));

		      		partFile.audio.connect(this.gain);
				    
				    partFile.audio.stop(this.audioDuration*Math.ceil(audioTime/this.audioDuration));
					// }


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
		    console.log("AudioSources " + this.sourceIndex + " is now connected")
   			document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));
    	}
	}

	// function to load samples
	loadSample(url) {

		var urls = this.SlicePath(url)

      	console.log("File played: " + url)

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
