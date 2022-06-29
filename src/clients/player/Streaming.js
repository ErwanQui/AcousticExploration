////////////////////
/// Streaming.js ///
////////////////////

class Streaming {

	constructor (audioContext, duration, sourceIndex, audioStream) {
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
		this.filesPath = "AudioFilesPiano/";
		this.sourceIndex = sourceIndex;
		this.initialized = false;
		this.connect = false;
		this.previousBuffer = [];
		this.restBuffer = [];
		this.count = 0;
		this.arrayValue = []
		this.begin = true
		this.fileHead = []
		this.globalBuffer = [];

	}

	async start (url, value, norm) {

	    // Create the gain
	    this.gain = this.audioContext.createGain();

	    // Initiate with current gain's value
    	this.gain.gain.setValueAtTime(value/norm, 0);

    	// Load the sound from the buffer
    	// this.playingSound = this.LoadNewSound(buffer);

    	// Connect the audioNodes
    	this.gain.connect(this.audioContext.destination);
    	// this.playingSound.connect(this.gain);

    	// Play the sound
    	// this.playingSound.start();
    	// this.UpdateAudioSource(buffer);
    	this.loadSample(url);
	}

	LoadNewSound(buffer) { // Create and link the sound to the audioContext

	    var sound = this.audioContext.createBufferSource();		// Create the sound
	    sound.loop = true;                                    	// Set the sound to loop
	    sound.buffer = buffer;                                	// Set the sound buffer
	    sound.connect(this.gain);								// Connect the sound to the other nodes
	    return (sound);
	}

	ConcatBuffer(buffer1, buffer2) {
		var intArray1 = new Uint8Array(buffer1)
		console.log(buffer1)
		console.log(intArray1)
		console.log("jackkkiie")
		var intArray2 = new Uint8Array(buffer2)
 		var concatArray = intArray1.concat(this.intArray2);
		var concatBuffer = new ArrayBuffer(concatArray.length - 44)

     	var globalView = new DataView(concatBuffer);

 		for(let i = 0; i < intArray1.length; i++) {
 			globalView.setUint8(i, concatArray[i])
 		}
 		for(let i = intArray1.length; i < concatBuffer.length; i++) {
 			globalView.setUint8(i, concatArray[i + 44])
 		}
 		return(concatBuffer)
	}

	// UpdateAudioSource(buffer) { // Stop the current playing to play an other source's audioBuffer

	// 	this.changing = true;
	// 	var tempPlayingSound;

 //   		this.syncAudio = {

	// 	    advanceTime: (currentTime, audioTime, dt) => {
	// 	    	var duration = buffer.duration
	// 	    	// var duration = 6

	// 	    	if (this.changing) {
	// 		        // const env = this.audioContext.createGain();
	// 		        // env.connect(this.gain);
	// 		        // env.gain.value = 0;

	// 		        tempPlayingSound = this.LoadNewSound(buffer);
	// 		        tempPlayingSound.connect(this.gain);

	// 		        if (this.connect) {
	// 		        	this.playingSound.disconnect(this.gain)
	// 		        	this.connect = false;
	// 		        } 

	// 		        this.playingSound = tempPlayingSound;
	// 		        this.playingSound.connect(this.gain);
	// 		      	this.connect = true
	// 		      	// tempPlayingSound.disconnect(this.gain);

	// 		        // env.gain.setValueAtTime(0, audioTime);
	// 		        // env.gain.linearRampToValueAtTime(1, audioTime + 0.01);
	// 		        // env.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.1);

	// 		        // sine.start(buffer.duration*Math.ceil(audioTime/buffer.duration));
	// 		        // sine.stop(buffer.duration*Math.ceil(audioTime/buffer.duration) + buffer.duration);

	// 		        console.log(audioTime, duration*Math.ceil(audioTime/duration))
	// 		        console.log(duration*(Math.ceil(audioTime/duration) - 1))
	// 		        console.log(duration*Math.ceil(audioTime/duration))

	// 		        this.playingSound.start(audioTime, audioTime - duration*(Math.ceil(audioTime/duration) - 1));
	// 		        this.playingSound.stop(duration*Math.ceil(audioTime/duration));



	// 		        this.changing = false;
	// 		        console.log(true)
	// 		        return currentTime + duration*Math.ceil(audioTime/duration) - audioTime;
	// 		    }
	// 		    else {

	// 		        this.playingSound = this.LoadNewSound(buffer);
	// 		        this.playingSound.connect(this.gain);

	// 		        console.log(false, buffer)
	// 		        console.log(audioTime, duration*Math.ceil(audioTime/duration))


	// 		        this.playingSound.start(audioTime);
	// 		        this.playingSound.stop(audioTime + duration);

	// 		        return currentTime + duration;
	// 		    }
	//     	}
 //    	}

 //    	// console.log(this.syncAudio)
 //   		document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));

	// }

	UpdateAudioSource(audio) { // Stop the current playing to play an other source's audioBuffer

		this.changing = true;
		var tempPlayingSound;
		console.log('bonjour')

   		this.syncAudio = {

		    advanceTime: (currentTime, audioTime, dt) => {
		    	var duration = audio.duration
		    	// var duration = 6

		    	if (this.changing) {
			        // const env = this.audioContext.createGain();
			        // env.connect(this.gain);
			        // env.gain.value = 0;

			        // tempPlayingSound = this.LoadNewSound(buffer);
			        // tempPlayingSound.connect(this.gain);

			        // if (this.connect) {
			        // 	this.playingSound.disconnect(this.gain)
			        // 	this.connect = false;
			        // } 

			       //  this.playingSound = tempPlayingSound;
			       //  this.playingSound.connect(this.gain);
			      	// this.connect = true
			      	// tempPlayingSound.disconnect(this.gain);

			        // env.gain.setValueAtTime(0, audioTime);
			        // env.gain.linearRampToValueAtTime(1, audioTime + 0.01);
			        // env.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.1);

			        // sine.start(buffer.duration*Math.ceil(audioTime/buffer.duration));
			        // sine.stop(buffer.duration*Math.ceil(audioTime/buffer.duration) + buffer.duration);

			        console.log(audioTime, duration*Math.ceil(audioTime/duration))
			        console.log(duration*(Math.ceil(audioTime/duration) - 1))
			        console.log(duration*Math.ceil(audioTime/duration))

			        audio.start(audioTime, audioTime - duration*(Math.ceil(audioTime/duration) - 1));
			        audio.stop(duration*Math.ceil(audioTime/duration));



			        this.changing = false;
			        console.log(true)
			        return currentTime + duration*Math.ceil(audioTime/duration) - audioTime;
			    }
			    else {

			        this.playingSound = this.LoadNewSound(buffer);
			        this.playingSound.connect(this.gain);

			        console.log(false, buffer)
			        console.log(audioTime, duration*Math.ceil(audioTime/duration))


			        this.playingSound.start(audioTime);
			        this.playingSound.stop(audioTime + duration);

			        return currentTime + duration;
			    }
	    	}
    	}

    	console.log(this.syncAudio, this.sourceIndex)
   		document.dispatchEvent(new Event("audioLoaded" + this.sourceIndex));

	}

	// function to load samples
	loadSample2(url) {
		// console.log(url)
	    var fetchSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
	    fetchSound.open("GET",this.filesPath + url, true); // Path to Audio File
	    fetchSound.responseType = "arraybuffer"; // Read as Binary Data
	    fetchSound.timeout = 10000;
	    fetchSound.ontimeout = (() => {console.log('timeout', fetchSound)});
	    fetchSound.onload = (() => { // ∆∆∆∆∆∆∆∆ c'est lui qu'il faut améliorer ∆∆∆∆∆∆∆∆
	    	console.log("e")
	        this.audioContext.decodeAudioData(fetchSound.response, ((buffer) => {
	        	console.log(buffer)
	        	this.UpdateAudioSource(buffer);
	        }), (() => {console.error("hmmm...")}));
	    })
	    fetchSound.send();
	}

	// function to load samples
	loadSample(url) {
		// console.log(url)

		var src = this.audioStream.createStreamSource();
		console.log(url)
      	src.streamId = url;
      	src.connect(this.gain);

      	// this.streamSource.set(url, src);
      	// src.addEventListener('ended', () => this.streamSources.delete(streamId));
      	console.log(src)
      	// src.start()
      	// src.loop = true;
      	this.UpdateAudioSource(src);
      	// src.start();
      	// const src = this.streamSources.get(streamId);
      	// this.streamSources.delete(streamId);

      	// src.stop();
		// fetch(this.filesPath + url)
		// .then(res => {
		// 	console.log("La réponse : ")
		// 	console.log(res)
	 //     	let reader = res.body.getReader()
	 //     	console.log("Le reader : ")
	 //     	console.log(reader)
	 //     	let pump = () => {
		//         reader.read()
		//         .then(({value, done}) => {
		//          	if(!done) {
		//          		var counter = this.count
		//          		this.count += 1;
		//          		// console.log(value.buffer)
		//          		this.arrayValue.push(new Uint8Array(value.buffer))
		//          		// this.arrayValue = new Uint8Array([0,1,2,3,4,5,6,7,8,9])
		//          		// console.log(this.arrayValue)
		// 	         	// var tS = new TransformStream(value.buffer)
		// 	         	// console.log(tS)
		// 	         	// console.log("Le readable : ")
		// 	         	// console.log(tS.readable)
		// 	         	// var choco = tS.readable.getReader()
		// 	         	// console.log("Le reader du readable : ")
		// 	         	// console.log(choco)
		// 	         	// console.log("Et son type : " + typeof(choco))
		// 	         	// tS.readable.getReader().then((buffer) => {
		// 	         	var Success = (audio) => {
		// 		        	console.log(this.sourceIndex, counter, this.arrayValue[counter].length)
		// 	         		console.log(this.sourceIndex, audio)
		// 	         		if (this.globalBuffer.length == 0) {
		// 	         			this.globalBuffer = audio.buffer;
		// 	         		}
		// 	         		else {
		// 	         			this.globalBuffer = this.ConcatBuffer(this.globalBuffer, audio.buffer)
		// 	         		}
		// 	         		// this.UpdateAudioSource(audio);
		// 	         		// this.LoadNewSound(audio);
		// 	         	}
		// 	         	var Echec = () => {
		// 	         		// this.count += 1;
		// 	         		// console.log(this.count)
		// 	         		// console.log("Echec")
		// 	         		// var zarb = new Uint8Array(buff)
		// 	         		// console.log(this.arrayValue[this.arrayValue.length - 1])
		// 	         		this.restBuffer.push(this.arrayValue[counter][this.arrayValue[counter].length - 1])
		// 	         		this.arrayValue[counter] = this.arrayValue[counter].slice(0, this.arrayValue[counter].length - 1)
		// 	         		// console.log(counter, this.arrayValue[counter].length)
		// 	         		// console.log(zarb[0])
		// 	         		// console.log(this.sourceIndex, this.restBuffer)
		// 	         		Try()
		// 	         	}

		// 	         	var Try = () => {
		// 	         		// console.log(buff)
		// 	         		console.log(this.previousBuffer)
		// 	         		var buffy = this.previousBuffer.concat(this.arrayValue[counter]);
		// 	         		if (this.begin) {
		// 		         		this.trye = new ArrayBuffer(buffy[0].length)
		// 		         	}
		// 		         	else {
		// 		         		this.trye = new ArrayBuffer(buffy[0].length + 44)
		// 		         	}

		// 		         	var view1 = new DataView(this.trye);

		// 		         	if (this.begin) {
		// 		         		for (let i = 0; i < 44; i++) {
		// 		         			this.fileHead.push(buffy[0][i])
		// 		         		}
		// 		         		this.begin = false
		// 		         	}

		// 	         		if (buffy[0].length > 0) {
		// 		         		if (!this.begin) {
		// 			         		for(let i = 0; i < 44; i++) {
		// 			         			view1.setUint8(i, this.fileHead[i])
		// 			         		}
		// 		         		}
		// 		         		for(let i = 44; i < buffy[0].length; i++) {
		// 		         			view1.setUint8(i, buffy[0][i])
		// 		         		}
		// 		         		// console.log(view1)
		// 		         		// for(let i = 0; i < buffy[0].length; i++) {
		// 		         		// 	console.log(trye[i], buffy[0][i])
		// 		         		// 	trye[i] = buffy[0][i]
		// 		         		// }
		// 		         		// var trye = new ArrayBuffer(buffy.length)
		// 		         		// console.log(buffy)
		// 		         		// console.log(trye)
		// 		         		// console.log(typeof(trye))
		// 			         	// this.audioContext.decodeAudioData(buffy, (buffer) => Success(buffer), Echec())
		// 			         	this.audioContext.decodeAudioData(this.trye, (buffer) => Success(buffer), Echec)
		// 			         	// var buffer = this.audioContext.createBufferSource(buffy)
		// 			         	// console.log(buffer)
		// 			         	// console.log(typeof(buffer))
		// 			        }
		// 			        else {
		// 		         		return;
		// 		         	}
		// 		        }
		// 		        console.log(this.sourceIndex, counter, this.arrayValue[counter])
		// 		        Try();
		// 		        this.previousBuffer = this.restBuffer;
		// 		        this.restBuffer = []


		// 	         	// console.log(buffer)
		// 	         	// console.log(typeof(buffer))
		// 	         	// this.LoadNewSound(buffer);
		// 	         	// this.UpdateAudioSource(value.buffer);
		// 	        	// })
		// 	            // value // chunk of data (push chunk to audio context)
		//             }
		//             if(!done) {
		//             	pump()
	 //            	}
	 //            	else {
	 //            		// this.LoadNewSound(this.globalBuffer)
	 //            	}
	 //            })
	 //        }
	 //    pump()
		// })
		// .then(stream => new Response(stream))
	 // 	// Create an object URL for the response
	 //  	.then(response => response.blob())
	 //  	.then(blob => {URL.createObjectURL(blob); console.log(blob)})

	    // var fetchSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
	    // fetchSound.open("GET",this.filesPath + url, true); // Path to Audio File
	    // fetchSound.responseType = "arraybuffer"; // Read as Binary Data
	    // fetchSound.timeout = 10000;
	    // fetchSound.ontimeout = (() => {console.log('timeout', fetchSound)});
	    // fetchSound.onload = (() => { // ∆∆∆∆∆∆∆∆ c'est lui qu'il faut améliorer ∆∆∆∆∆∆∆∆
	    // 	console.log("e")
	    //     this.audioContext.decodeAudioData(fetchSound.response, ((buffer) => {
	    //     	console.log(buffer)
	    //     	this.UpdateAudioSource(buffer);
	    //     }), (() => {console.error("hmmm...")}));
	    // })
	    // fetchSound.send();
	}

	UpdateGain(value, norm) { // Update gain
	    
	    // Update the gain of the source
	    console.log(this.gain)
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}

  	GetSyncBuffer() {
  		return(this.syncAudio)
  	}
}

export default Streaming;
