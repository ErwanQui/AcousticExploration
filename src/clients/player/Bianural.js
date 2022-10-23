////////////////////
/// Binaural.js ///
////////////////////

class Binaural {

	constructor (audioContext, sourceIndex, audioStream, playingState) {
		// console.log(audioStream)
	    // Creating AudioContext
	    this.audioContext = audioContext;		// Get audioContext
	    this.playingSound;                    	// BufferSource's object
	    this.audioStream = audioStream
	    this.gain;                            	// Gain's object
		this.syncAudio;
		// this.filesPath = "AudioFiles0/";
		// this.filesPath = "AudioFiles1/";
		this.filesPath = "AudioFilesMusic1/";
		// this.filesPath = "AudioFilesPiano/";
		this.sourceIndex = sourceIndex;
		this.initialized = false;
		// this.connect = false;
		this.previousBuffer = [];
		this.restBuffer = [];
		this.count = 0;
		this.arrayValue = []
		this.begin = true
		this.fileHead = []
		this.globalBuffer = [];
		this.playingState = playingState
		this.audio;
		this.initiate = true;

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

	StopAudio() {
		this.audio.stop();
	}


	UpdateAudioSource(url) { // Stop the current playing to play an other source's audioBuffer

		this.changing = true;
		var tempPlayingSound;
		// console.log('bonjour')
		// console.log(url)

   		this.syncAudio = {

		    advanceTime: (currentTime, audioTime, dt) => {
		    	// var duration = 6
		    	// console.log(this.sourceIndex)
		    	// console.log(audioTime)

		    	if (this.changing) {

		    		var tempAudio = this.audioStream.createStreamSource();
					// console.log(url)
			      	tempAudio.streamId = url;
			      	this.audioDuration = tempAudio.duration


			        // if (this.connect) {
			        // 	this.audio.disconnect(this.gain)
			        // 	// console.log()
			        // 	this.connect = false;
			        // }
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
			        // console.log(true)
			        return currentTime + this.audioDuration*Math.ceil(audioTime/this.audioDuration) - audioTime;
			    }
			    else {
			    	this.audio = this.audioStream.createStreamSource();
					// console.log(url)
			      	this.audio.streamId = url;
			      	// var duration = this.audio.duration

			      	// if (this.playingState) {
			      		this.audio.connect(this.gain);
			      	// }

			        // console.log(false, this.audio)
			        // console.log(audioTime, this.audioDuration*Math.ceil(audioTime/this.audioDuration))
			        // console.log(audioTime, this.audioDuration)

			        // if (this.playingState) {
				        this.audio.start(audioTime);
				        this.audio.stop(audioTime + this.audioDuration);
				    // }

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

export default Streaming;
