////////////////////
/// Binaural.js ///
////////////////////

class Binaural {

	constructor (audioContext, sourceIndex, audioStream, playingState) {
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.audioStream = audioStream;			// Get streaming plugin
		this.syncAudio;							// Store the syncObject for the scheduler (in "Sources.js")
		this.sourceIndex = sourceIndex;			// Set the index of the audioSource
		this.playingState = playingState; 		// Set the state of the audioSource (active or not)
		this.audio;								// Audio buffer of the file played
		this.initiate = true;					// Attribute to tell if it's the first audio to be played

		// Create the gain
	    this.gain = this.audioContext.createGain();
	}

	async start (url, value, norm) {

		console.info("Starting source: " + this.sourceIndex);

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

	UpdateAudioSource(url) { // Stop the current playing to play an other source's audioBuffer

		// Set the changing attribute of the audio file to "true"
		this.changing = true;

		// Define the syncAudio attribute
   		this.syncAudio = {

   			// Create the "advanceTime" attribute
   			// @note: It's what called the scheduler (in "Sources.js") to play the sound
   		    advanceTime: (currentTime, audioTime, dt) => {

		    	// If it's a new audio file (=> it will not necessarily start at beginning)
		    	if (this.changing) {

		    		// Get the audio with the streaming plugin
		    		var tempAudio = this.audioStream.createStreamSource();
			      	tempAudio.streamId = url;

			      	// Get the duration of the audio file
			      	this.audioDuration = tempAudio.duration;

			      	// If it's not the first audio file to be played, dtop the previous one
			        if (!this.initiate) {
			        	this.audio.stop();
			        }
			        else {
			        	this.initiate = false;
			        }

			        // Set the new audio file to the corresponding audio of the 8-channels object
			        this.audio = tempAudio;

			        // Start the audio at the good moment to be synced (so not necessarily at beginning)
				    this.audio.start(audioTime, audioTime - this.audioDuration*(Math.ceil(audioTime/this.audioDuration) - 1));

				    // Connect it to others audioNodes
		      		this.audio.connect(this.gain);

		      		// console.log("AudioSources " + this.sourceIndex + " is now connected")

					// Stop the audio at the good time				    
				    this.audio.stop(this.audioDuration*Math.ceil(audioTime/this.audioDuration));

				    // Reset the changing file attribute
			        this.changing = false;

			        // Return the global time of the next call for the scheduler
			        return currentTime + this.audioDuration*Math.ceil(audioTime/this.audioDuration) - audioTime;
			    }
			    else {
			    	// Get the audio with the streaming plugin
			    	this.audio = this.audioStream.createStreamSource();
			      	this.audio.streamId = url;

			      	// Start and stop audio at the good time and connect it to others audioNodes
			        this.audio.start(audioTime);
			        this.audio.connect(this.gain);
			        this.audio.stop(audioTime + this.audioDuration);

			        return currentTime + this.audioDuration;
			    }
	    	}
    	}

   		document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));

	}

	// function to load samples
	loadSample(url) { // Load the samples and update the audioSource to add them to the scheduler
      	// console.log("File played: " + url)
      	this.UpdateAudioSource(url);
	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}

  	GetSyncBuffer() { // Return syncAudio
  		return(this.syncAudio);
  	}
}

export default Binaural;
