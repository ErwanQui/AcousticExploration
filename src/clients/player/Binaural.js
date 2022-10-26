////////////////////
/// Binaural.js ///
////////////////////

class Binaural {

	constructor (audioContext, sourceIndex, audioStream, playingState) {
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.audioStream = audioStream			// Get streaming plugin
	    // this.gain;                            	// Gain's object
		this.syncAudio;							// Store the syncObject for the scheduler (in "Sources.js")
		this.sourceIndex = sourceIndex;			// Set the index of the audioSource
		// this.initialized = false;
		// this.previousBuffer = [];
		// this.restBuffer = [];
		// this.count = 0;
		// this.arrayValue = []
		// this.begin = true
		// this.fileHead = []
		// this.globalBuffer = [];
		this.playingState = playingState; 		// Set the state of the audioSource (active or not)
		this.audio;								// Audio buffer of the file played
		this.initiate = true;					// Attribute to tell if it's the first audio to be played

		// Create the gain
	    this.gain = this.audioContext.createGain();

	}

	async start (url, value, norm) {

		console.info("Starting source: " + this.sourceIndex)

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

	// @note: this function and the corresponding attribute are only useful when you detect more sources than you will played
	ChangePlayingState(state) { // Change the playing state of the audioSource (active or not)
		if (this.playingState != state) {
			// if (state) {
			// 	console.log("AudioSource " + this.sourceIndex + " is now active")
			// }
			// else {
			// 	console.log("AudioSource " + this.sourceIndex + " is inactive")
			// }
			this.playingState = state;
		}
	}

	StopAudio() {
		this.audio.stop();
	}


	UpdateAudioSource(url) { // Stop the current playing to play an other source's audioBuffer

		this.changing = true;
		var tempPlayingSound;

   		this.syncAudio = {

		    advanceTime: (currentTime, audioTime, dt) => {

		    	if (this.changing) {

		    		var tempAudio = this.audioStream.createStreamSource();
			      	tempAudio.streamId = url;
			      	this.audioDuration = tempAudio.duration

			        if (!this.initiate) {
			        	this.audio.stop()
			        }
			        else {
			        	this.initiate = false
			        }


			        this.audio = tempAudio;

				    this.audio.start(audioTime, audioTime - this.audioDuration*(Math.ceil(audioTime/this.audioDuration) - 1));

		      		this.audio.connect(this.gain);
		      		// console.log("AudioSources " + this.sourceIndex + " is now connected")
				    
				    this.audio.stop(this.audioDuration*Math.ceil(audioTime/this.audioDuration));

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

   		document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));

	}

	// function to load samples
	loadSample(url) {
      	// console.log("File played: " + url)
      	this.UpdateAudioSource(url);

	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}

  	GetSyncBuffer() {
  		return(this.syncAudio)
  	}
}

export default Binaural;
