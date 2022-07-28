////////////////////
/// Ambisonic.js ///
////////////////////

class Streaming {

	constructor (audioContext, duration, sourceIndex, audioStream, playingState, order) {
		// console.log(audioStream)
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.audioStream = audioStream
	    this.gain;                            	// Gain's object
		this.syncAudio
		this.duration = duration;
		// this.filesPath = "AudioFiles0/";
		// this.filesPath = "AudioFiles1/";
		this.filesPath = "AudioFiles2/";
		// this.filesPath = "AudioFilesMusic1/";
		// this.filesPath = "AudioFilesPiano/";
		this.sourceIndex = sourceIndex;
		// this.connect = false;
		this.playingState = playingState
		this.audio;
		this.initiate = true;

		this.order = order;
		this.nbFiles = Math.ceil(Math.pow(order + 1, 2)/8);		// Get the number of 8 channels' files

	    // Get ambisonic's objects
	    this.ambisonic = require("ambisonics");
	    console.log("dfs")
	    // Create the audioNodes
	   	this.mirror = new this.ambisonic.sceneMirror(this.audioContext, this.order);
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	    this.gain = this.audioContext.createGain();
	    console.log("dfg")

	}

	async start (url, value, norm) {
		// console.log(this.playingState)

		console.info("Starting source: " + this.sourceIndex)

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
    	this.gain.connect(this.audioContext.destination);

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
			files.push(fileWithoutExt + "_" + this.playingSounds[i].channels[0] + "-" + this.playingSounds[i].channels[1] + "ch" + fileExt)
		}
		return (files);
	}

	StopAudio() {
		this.audio.stop();
	}


	UpdateAudioSource(url) { // Stop the current playing to play an other source's audioBuffer

		this.changing = true;
		var tempPlayingSound;
		console.log('cacahuètes enfet')

   		this.syncAudio = {

		    advanceTime: (currentTime, audioTime, dt) => {

		    	if (this.changing) {

		    		var tempAudio = this.audioStream.createStreamSource();
					// console.log(url)
			      	tempAudio.streamId = url;
			      	this.audioDuration = tempAudio.duration

			        console.log(this.audio)
			        if (!this.initiate) {
			        	this.audio.stop()
			        }
			        else {
			        	this.initiate = false
			        }

			        this.audio = tempAudio;

				    this.audio.start(audioTime, audioTime - this.audioDuration*(Math.ceil(audioTime/this.audioDuration) - 1));

		      		this.audio.connect(this.gain);
		      		console.log("AudioSources " + this.sourceIndex + " is now connected")
				    
				    this.audio.stop(this.audioDuration*Math.ceil(audioTime/this.audioDuration));
					// }


			        this.changing = false;
			        return currentTime + this.audioDuration*Math.ceil(audioTime/this.audioDuration) - audioTime;
			    }
			    else {
			    	this.audio = this.audioStream.createStreamSource();
			      	this.audio.streamId = url;
			      	
			      	this.audio.connect(this.gain);

				    this.audio.start(audioTime);
				    this.audio.stop(audioTime + this.audioDuration);

			        return currentTime + this.audioDuration;
			    }
	    	}
    	}

    	// console.log(this.syncAudio, this.sourceIndex)
   		document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));

	}

	// function to load samples
	loadSample(url) {
      	console.log("File played: " + url)

		for (let i = 0; i < this.nbFiles; i++) {
      		this.UpdateAudioSource(url);
      	}
	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}

  	GetSyncBuffer() {
  		return(this.syncAudio)
  	}
}

export default Streaming;
