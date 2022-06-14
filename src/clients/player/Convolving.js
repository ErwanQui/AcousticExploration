/////////////////////
/// Convolving.js ///
/////////////////////

// @note: c'est un peu le bordel et ça marche pas trop... (voir comment faire pour décoder les rirs)

class Convolving {

	constructor (audioContext, order, soundIndex) {
		

	    // Creating AudioContext
	    this.audioContext = audioContext;
	    this.order = order;
	    // this.soundIndex = soundIndex;

	    this.ambisonic = require("ambisonics");
	    this.convolvers = [];
	   	this.mirror = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	    this.gain = this.audioContext.createGain();

	    this.playingSounds = [];
	    this.hoaLoaderConvolver;
	    this.updatersCount = 0;
	}

	async start (data, files, rirs, rirIndex, value, norm) {

	    // Creating Gains
	    // this.convolver = [];

	 //   	this.mirror = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		// this.rotator = new this.ambisonic.sceneRotator(this.audioContext, this.order);
		// this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.order);
	 //    this.gain = this.audioContext.createGain();

	    // init with current content
    	this.gain.gain.setValueAtTime(value/norm, 0);
    	// console.log(data)
    	// console.log(files.Sounds[0])
    	// console.log(files.Rirs["source" + 0][rirIndex])

    	// this.playingSounds = this.LoadNewSound(data[files.Sounds[this.soundIndex]]);
    	
    	for (let i = 0; i < files.Sounds.length; i++) {
		    this.playingSounds.push(this.LoadNewSound(data[files.Sounds[i]]));
		    this.convolvers.push(new this.ambisonic.convolver(this.audioContext, this.order));
		    // this.gains.push(this.audioContext.createGain());
	    	// console.log(rirs)
	    	this.playingSounds[i].connect(this.convolvers[i].in);					// Connect the sound to the other nodes
	    	// this.playingSounds[i].connect(this.mirror.in);					// Connect the sound to the other nodes
	    	this.convolvers[i].out.connect(this.mirror.in);
	    	// this.gains[i].out.connect(this.mirror.in);
	    	// console.log(Files.Rirs)
	    	// console.log(rirIndex)
	    	console.log()
	    	this.LoadNewRir(data[files.Rirs["source" + i][rirIndex]], i);
		}
		console.log(this.playingSounds)

		// for (let i = 0; i <)

      	// this.playingSound.connect(this.convolver.in)
  	// this.playingSound.connect(this.mirror.in)
    	this.mirror.out.connect(this.rotator.in);
    	this.rotator.out.connect(this.decoder.in);
    	this.decoder.out.connect(this.gain);
    	this.gain.connect(this.audioContext.destination);

    	for (let i = 0; i < files.Sounds.length; i++) {
    		this.playingSounds[i].start();
    	}
	}

	hoaAssignFiltersOnLoad(buffer) {
		// console.log("peut-être")
		this.convolver[this.updatersCount].updateFilters(buffer);
		// console.log("oui")
		this.updatersCount += 1;
	}

	// LoadNewSounds(buffersData, sounds) { // Create and link the sound to the AudioContext
	//     // Sound initialisation
	//     var sources = []
	//     for (let i = 0; i < sounds.length; i++) {
	// 	    sources.push(this.audioContext.createBufferSource());		// Create the sound
	// 	    sources[i].loop = true;                                    	// Set the sound to loop
	// 	    sources[i].buffer = buffersData[sounds[i]];                             	// Set the sound buffer
	// 	}
	// 	// console.log(sources)							
	//     return (sources);
	// }

	LoadNewSound(buffer) { // Create the sound

	    var sound = this.audioContext.createBufferSource();			// Create the sound
	    sound.loop = true;                                    		// Set the sound to loop
	    sound.buffer = buffer;                                		// Set the sound buffer
	    return (sound);
	}

	LoadNewRir(buffer, index) { // Create and link the sound to the AudioContext
	    // Sound initialisation
	    console.log(buffer)
	    console.log(index)
	    this.convolvers[index].updateFilters(buffer);
	    console.log("ouep")

//////////// cassé ici .....

		// this.hoaLoaderConvolver = new this.ambisonic.HOAloader(this.audioContext, this.order, bufferUrl, this.hoaAssignFiltersOnLoad)
		// this.hoaLoaderConvolver.load();		// Create the sound
		// console.log(this.hoaLoaderConvolver)
	}

	UpdateAudioSource(bufferUrl, value, norm) {
		this.updatersCount = 0;
		// this.playingSound.stop();
		// this.playingSound.disconnect(this.gain);
		console.log(bufferUrl)
		this.LoadNewRir(bufferUrl)
		// console.log(value/norm)
		// this.gain.gain.setValueAtTime(value/norm, 0)
		// this.playingSound.start();

	}

	UpdateGain(value, norm) { // Update Gain and Display of the Source depending on Listener's Position
	    
	    // Update the Gain of the Source
	    this.gain.gain.setValueAtTime(value/norm, 0);
  	}
}

export default Convolving;
