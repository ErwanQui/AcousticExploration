//////////////////
/// Sources.js ///
//////////////////

import Streaming from './Streaming.js'
import Convolving from './Convolving.js'
import Ambisonic from './Ambisonic.js'

class Sources {

	constructor (filesystem, audioBufferLoader, parameters) {

	    // Create the datas' storer
	    this.sourcesData;

	    // Get audioContext
	    this.audioContext = parameters.audioContext;

	    // Create the audioBufferLoaders
	    this.audioBufferLoader = audioBufferLoader;

		// Get files
	   	this.filesystem = filesystem;

	    // Global parameters
	    this.nbSources;											// Create the number of sources object
	    this.mode = parameters.mode								// Get the used mode
	    this.circleDiameter = parameters.circleDiameter;		// Get the circles' diameter
	    this.nbActiveSources = parameters.nbClosestPoints;		// Get the number of activ sources
	    this.ambiOrder = parameters.order;						// Get the ambisonic's order
	    this.fileData = {										// Create the fileDatas' storer
	    	File: parameters.dataFileName,
	    	Audio: parameters.audioData
	    }
	    this.audioSources = []									// Store the audioSources (I will then associate a source to each audioSource)
	    this.sources = [];										// Create the array of sources' display's elements

		// Create used variables
	    this.closestSourcesId;									// Array of the closest sources from listener
	    this.audio2Source = [0, 1, 2] 							// Associate ths index in 'this.closestSourcesId' to the corresponding audioSource
	    this.distanceValue = [1, 1, 1];							// Distance of each source with listener
	    this.distanceSum = 0;									// Sum of the sources' distance

	    // Set gain's datas
	    this.gainsData = {
	    	Value: [],
	    	Norm: 0,
	    	Exposant: parameters.gainExposant
	    }

	    // Add RIRs for convolving mode
	    if (this.mode == "convolving") {
	    	this.Rirs = {};
	    }

	    this.ambisonic = require("ambisonics");
	    this.ambiSoundbankTree = {};
	}

	async start (listenerPosition) {

		// Add the audioSources depending on the mode chosen
		for (let i = 0; i < this.nbActiveSources - 1; i++) {
			switch (this.mode) {

				case 'debug':
				console.log("Debugging")
					this.audioSources.push(new Streaming(this.audioContext));
					break;

				case 'streaming':
				console.log("Streaming")
					this.audioSources.push(new Streaming(this.audioContext));
					break;

				case 'ambisonic':
				console.log("Ambisonics")
					this.audioSources.push(new Ambisonic(this.audioContext, this.ambiOrder));
					break;

				case 'convolving':
				console.log("Convolving")
					this.audioSources.push(new Convolving(this.audioContext, this.ambiOrder, i));
					break;

				default:
					console.log("No valid mode");
			}
		}

		// Get closest sources from listener
		this.closestSourcesId = this.ClosestSource(listenerPosition, this.sourcesData.receivers.xyz);
  	}

  	CreateSources(container, scale, offset) { // Create the display for sources, add them to the gloabl container and start the audio

  		// Create a circle as a display for each source
	    for (let i = 0; i < this.nbSources; i++) {

	    	// Create the source's display
	      	this.sources.push(document.createElement('div'));        // Create a new element
	      	this.sources[i].id = "circle" + i;                       // Set the circle id
	      	this.sources[i].innerHTML = i + 1;                       // Set the circle value (i+1)

	      	// Change form and position of the element to get a circle at the good place;
	      	this.sources[i].style.position = "absolute";
	      	this.sources[i].style.margin = "0 " + (-this.circleDiameter/2) + "px";
	       	this.sources[i].style.width = this.circleDiameter + "px";
	       	this.sources[i].style.height = this.circleDiameter + "px";
	       	this.sources[i].style.borderRadius = this.circleDiameter + "px";
	       	this.sources[i].style.lineHeight =  this.circleDiameter + "px";
	       	this.sources[i].style.background =  "grey";
	      	this.sources[i].style.transform = "translate(" + 
	      		((this.sourcesData.receivers.xyz[i].x - offset.x)*scale) + "px, " + 
	      		((this.sourcesData.receivers.xyz[i].y - offset.y)*scale) + "px)";

	      	// Add the circle's display to the global container
	      	container.appendChild(this.sources[i]);
    	}

    	// Start each source
    	for (let i = 0; i < this.nbActiveSources - 1; i++) {

    		// Set sources' color for the starting position of the listener
			this.UpdateClosestSourcesColor(i);

			// // Check if the mode is 'convolving' and then start audio sources
		 //    if (this.mode == "convolving") {

	  //    	this.audioSources[i].start(this.audioBufferLoader.data, this.sourcesData.receivers.files, this.Rirs, this.closestSourcesId[i], this.gainsData.Value[i], this.gainsData.Norm)    	

		 //    else {
		 //    	console.log(this.audioBufferLoader.data)
		 //    	console.log(this.sourcesData.receivers.files[this.closestSourcesId[i]])
	  //    	this.audioSources[i].start(this.audioBufferLoader.data[this.sourcesData.receivers.files[this.closestSourcesId[i]]], this.gainsData.Value[i], this.gainsData.Norm)    	
			// }
			switch (this.mode) {
		    	case 'convolving':
        			this.audioSources[i].start(this.audioBufferLoader.data, this.sourcesData.receivers.files, this.Rirs, this.closestSourcesId[i], this.gainsData.Value[i], this.gainsData.Norm);    	
		    		break;
		    	case 'ambisonic':
		    		// this.audioS 
		    	case 'debug':
		    	case 'streaming':
			    	console.log(this.audioBufferLoader.data)
			    	console.log(this.sourcesData.receivers.files[this.closestSourcesId[i]])
	        		this.audioSources[i].start(this.audioBufferLoader.data[this.sourcesData.receivers.files[this.closestSourcesId[i]]], this.gainsData.Value[i], this.gainsData.Norm);  	
					break;
				default:
					console.log("no valid mode");
					break;
			}
		}
	}

  	LoadSoundbank() { // Load the audio datas to use

  		// Get all audio datas
	    const soundbankTree = this.filesystem.get(this.fileData.Audio);

	    // Initiate an object to store audios' paths
	    var defObj = {};

	    // Get all audio files' paths
	    soundbankTree.children.forEach(leaf => {

	      	if (leaf.type === 'file') {

	        	defObj[leaf.name] = leaf.url;
	      	}
	    });


	    this.audioBufferLoader.load(defObj, true);
    var a = setInterval(() => {
      if (this.audioBufferLoader.get('loading')) {console.log("loading...");}
      else {
        console.log("loaded");       
        document.dispatchEvent(new Event("audioLoaded"));
        clearInterval(a)
      }
    }, 50);
	    // fetch(this.audioBufferLoader.data["steliz_octamic_m02_(ACN-SN3D-2).wav"]).then((response) => {
	    // 	console.log(response)
	    // 	console.log("a")
	    // })
    document.addEventListener("audioLoaded", () => {

		    console.log(this.audioBufferLoader.data)
		    // Load all audio datas
		    console.log(defObj)
		    console.log(this.audioBufferLoader.data["steliz_octamic_m17_(ACN-SN3D-2).wav"])

		    this.playingSound = this.audioContext.createBufferSource();
		    this.playingSound.buffer = this.audioBufferLoader.data["steliz_octamic_m17_(ACN-SN3D-2)_01-08ch.wav"];
		    this.playingSound.loop = true;
			this.decoder = new this.ambisonic.binDecoder(this.audioContext, this.ambiOrder);
		    this.gain = this.audioContext.createGain();

	    	this.gain.gain.setValueAtTime(1, 0)
	    	console.log(this.playingSound)

		    this.playingSound.connect(this.decoder.in)
		    this.decoder.out.connect(this.gain);
	    	this.gain.connect(this.audioContext.destination);

	    	// this.playingSound.start()
	    });
  	}

  	LoadAmbiSoundbank() { // Load the audio datas to use

  		// Get all audio datas
	    const ambiSoundbankTree = this.filesystem.get(this.fileData.Audio);

	    // Initiate an object to store audios' paths
	    // var defObj = {};
	    // var bufferLoader
	    // console.log(ambiSoundbankTree)
	    // const data = this.sourcesData.receivers.files;
	    // // Get all audio files' paths
	    // // data.forEach(leaf => {

	    //   	// if (leaf.type === 'file') {
	    //   		var leaf = data[0]
		   //  	var add2toBufferArray = function(buffer) {
		   //  		console.log("xed")
	    // 			this.ambiSoundbankTree[leaf] = buffer;
	    // 		}
	    // 		console.log(this.path)
	    // 		console.log(ambiSoundbankTree.children[0])
	    // 		console.log(ambiSoundbankTree.children[0].path)
	    // 		var path = ""
	    // 		console.log(ambiSoundbankTree.children[0].url)

	    // 		bufferLoader = new this.ambisonic.HOAloader(this.audioContext, this.ambiOrder, ambiSoundbankTree.children[0].url, add2toBufferArray);
	    // 		bufferLoader.load();
	    // 		console.log(this.ambiSoundbankTree)
	    //   	// }
	    // // });

	    // Load all audio datas

	    console.log(defObj)

	    var bufferLoader;
	    var path;

	    for (let i = 0; i < defObj.length; i++) {
	    	path = defObj[i];
	    	// bufferLoader = new this.ambisonic.HOAloader(this.audioContext, this.order, path, add2toBufferArray);
	    	// bufferLoader.load();
	    	// SetInterval(() => {
	    	// 	console.log(this.audioBufferLoader.get('loading'))
	    	// }, 1000);
	    }
  	}

  	LoadRirs() { // Load the rirs to use

  		// Get all rirs' datas
	    const rirbankTree = this.filesystem.get(this.fileData.Audio);

	    // Initiate an object to store audios' paths
	    var defObj = {};

	    // Get all rirs' files' paths
	    rirbankTree.children.forEach(leaf => {

	      	if (leaf.type === 'file') {

	        	this.Rirs[leaf.name] = leaf.url;
	      	}
	    });

	    // Get all audio dats
	    defObj = this.LoadSound4Rirs(defObj);

	    // Load all audio datas
	    this.audioBufferLoader.load(defObj, true);
	}

  	LoadSound4Rirs(defObj) { // Load the audio datas to use with rirs

  		// Get all assets
	    const soundbankTree = this.filesystem.get('Assets');

	    // Read 'soundbankTree' to find the audio files
	    soundbankTree.children.forEach(branch => {

	      	if (branch.type === 'directory') {

	      		branch.children.forEach(leaf => {

	        		defObj[leaf.name] = leaf.url;	
	           	});
	      	}
	    });

  		return(defObj)
	}

  	LoadData() { // Load the data from the json file

  		// Get all assets' datas
	    const data = this.filesystem.get('Assets');

	    data.children.forEach(leaf => {

	      	if (leaf.name === this.fileData.File) {

	      		// Wait that the json file has been getting before using it
			    fetch(leaf.url).then(results => results.json()).then(jsonObj => {

			    	// Create the sourcesData object from the json file
			        this.sourcesData = jsonObj;

			        // Get the number of sources
			        this.nbSources = this.sourcesData.receivers.xyz.length;

			        // Change sources' positions format
			        var tempSourcesPosition = [];
			        for (let i = 0; i < this.nbSources; i++) {
		          		tempSourcesPosition.push({x: this.sourcesData.receivers.xyz[i][0], y:this.sourcesData.receivers.xyz[i][1]});
		        	}

		        	// Update sourcesData object
		        	this.sourcesData.receivers.xyz = tempSourcesPosition;

		        	// Create an event to inform that the file's data can be used
		          	document.dispatchEvent(new Event("dataLoaded"));
	        	})
      		}
    	});
  	}

  	onListenerPositionChanged(listenerPosition) { // Update the closest sources to use when listener's position changed

	    // Initialising variables
	    var previousClosestSourcesId = this.closestSourcesId;	// Keep the previous closest sources
	    var currentClosestInPrevious;							// Create the object to get the index of a closest source in the previous closest sources array

	    // @note: I have to use the 'slice()' method, otherwise it creates a reference of the array
	    var tempAudio2Source = this.audio2Source.slice();		// remove the reference
	    var availableAudioSources = [];							// AudioSources where source have been removed
	    var sources2Attribuate = [];							// Sources to attribuate to an audioSource

	    // Update the closest points
	    this.closestSourcesId = this.ClosestSource(listenerPosition, this.sourcesData.receivers.xyz);
	    
	    // Check all the new closest points
	    for (let i = 0; i < this.nbActiveSources - 1; i++) {

		    // Check if the id is new in 'this.ClosestPointsId'
		    if (previousClosestSourcesId[i] != this.closestSourcesId[i]) {

		        // Update the display for sources that are not active  (//Check if the point is the fourth point)
		        if (this.Index(previousClosestSourcesId[i], this.closestSourcesId)[0] || previousClosestSourcesId[i] == this.closestSourcesId[this.nbActiveSources - 1]) {

		          	this.sources[previousClosestSourcesId[i]].style.background = "grey";	// Change the color of inactiv sources to grey
		          	availableAudioSources.push(this.audio2Source[i]);						// Set the audioSource as waiting for a source
		        }

		        // Instantiate 'currentClosestInPrevious': if the sources was in the 'previousClosestSourcesId', it get the index in the array
		        currentClosestInPrevious = this.Index(this.closestSourcesId[i], previousClosestSourcesId);

		        // Check if the sources wasn't in 'previousClosestSourcesId'
		       	if (currentClosestInPrevious[0] || this.closestSourcesId[i] == previousClosestSourcesId[this.nbActiveSources - 1]) {

		       		// Set the source as waiting for an AudioSource
		          	sources2Attribuate.push([this.closestSourcesId[i], i]);
		        }

		        // If it was, update the association between the source and the audioSource
		        else {

		        	// Change the association between 'this.closestSourceId' and the corresponding Source
		        	tempAudio2Source[i] = this.audio2Source[currentClosestInPrevious[1]];
		        }
		    }
	    }

	    // Store the association's array in the corresponding class' object
	    this.audio2Source = tempAudio2Source.slice();

	    // Variable to store the available audio source's id
	    var audioSourceId;

	    // Update the audioSources with new Sources ('sources2Attribuate')
	    for (let i = 0; i < availableAudioSources.length; i++) {

	    	// Get the available audio source's id
	    	audioSourceId = availableAudioSources[i];

	    	// Add a new association between 'this.closestSourceId' and the corresponding Source
	    	this.audio2Source[sources2Attribuate[i][1]] = audioSourceId;

	    	// Update audioSources corresponding to the association ('this.audioSources')
	    	// For convolving mode
		    if (this.mode == "convolving") {
		    	this.audioSources[audioSourceId].UpdateAudioSource(this.Rirs[this.sourcesData.receivers.files.Rirs["source" + audioSourceId][this.closestSourcesId[sources2Attribuate[i][1]]]], this.gainsData.Value[audioSourceId], this.gainsData.Norm)
	    	}

	    	// For other modes 
	    	else {
		    	this.audioSources[audioSourceId].UpdateAudioSource(this.audioBufferLoader.data[this.sourcesData.receivers.files[sources2Attribuate[i][0]]], this.gainsData.Value[audioSourceId], this.gainsData.Norm)
	    	}
	    }

	    // Update display and gain of activ sources
	    for (let i = 0; i < this.nbActiveSources - 1; i++) {
		    this.UpdateClosestSourcesColor(i);
		    this.audioSources[i].UpdateGain(this.gainsData.Value[this.Index(i, this.audio2Source)[1]], this.gainsData.Norm);
	    }
	}

  	ClosestSource(listenerPosition, listOfPoint) { // Get closest sources from the listener
    
	    // Initialising temporary variables;
	    var closestIds = [];
	    var currentClosestId;

	    // Reset the count
	    this.distanceSum = 0;
	    this.gainsData.Norm = 0;

	    // Get the 'nbClosest' closest ids
	    for (let j = 0; j < this.nbActiveSources; j++) {

	      // Set 'undefined' to the currentClosestId to ignore difficulties with initial values
	      currentClosestId = undefined;

	      for (let i = 0; i < listOfPoint.length; i++) {

	        // Check if the id is not already in the closest ids and if the source of this id is closest
	        if (this.Index(i, closestIds)[0] && this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[currentClosestId])) {
	          currentClosestId = i;
	        }
	      }

	      if (j != this.nbActiveSources - 1) {

	        // Get the distance between the listener and the source
	        this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]);

	        // Increment 'this.distanceSum'
	        this.distanceSum += this.distanceValue[j];
	      }

	      // Push the id in the closestId attribute
	      closestIds.push(currentClosestId);
	    }

	    // Set the gains and the gains' norm
	    for (let i = 0; i < this.nbActiveSources - 1; i++) {

	      this.gainsData.Value[i] = Math.pow((1 - this.distanceValue[i]/this.distanceSum), this.gainsData.Exposant);
	      this.gainsData.Norm += this.gainsData.Value[i];
	    }
	    return (closestIds);
  	}

  	UpdateSourcesPosition(scale, offset) { // Update the Positions of circles when window is resized

	    for (let i = 0; i < this.nbSources; i++) {
	      	this.sources[i].style.transform = "translate(" + 
	      		((this.sourcesData.receivers.xyz[i].x - offset.x)*scale) + "px, " + 
	      		((this.sourcesData.receivers.xyz[i].y - offset.y)*scale) + "px)";
    	}
  	}

  	UpdateClosestSourcesColor(index) { // Update source's display depending on listener's position

	    // Set a using value to the source
	    var sourceValue = this.gainsData.Value[index]/this.gainsData.Norm;

	    // Update source's display
	    this.sources[this.closestSourcesId[index]].style.background = "rgb(0, " + 255*(4*Math.pow(sourceValue, 2)) + ", 0)";
  	}

	Index(pointId, listOfIds) { // Check if an id is not in an ids' array and return the corresponding id if it's not the cas

	    var iterator = 0;
	    while (iterator < listOfIds.length && pointId != listOfIds[iterator]) {
	      iterator += 1;
	    }
	    return ([iterator >= listOfIds.length, iterator]);
	}

	Distance(pointA, pointB) { // Get the distance between 2 points

	    if (pointB != undefined) {
	      	return (Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)));
	    }
	    else {
	      	return (Infinity);
		}
  	}
}

export default Sources;