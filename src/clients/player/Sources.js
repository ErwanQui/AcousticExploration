//////////////////
/// Sources.js ///
//////////////////

import Streaming from './Streaming.js'
import Convolving from './Convolving.js'
import Ambisonic from './Ambisonic.js'

class Sources {

	constructor (filesystem, audioBufferLoader, parameters) {

	    // User positions
	    this.nbSources;
	    this.mode = parameters.mode
	    this.circleDiameter = parameters.circleDiameter;
	    // this.container = container;
	    this.sources = [];
	    this.closestSourcesId = undefined;
	    this.nbActiveSources = parameters.nbClosestPoints;
	    this.sourcesData;
	    // this.scale;
	    // this.dataFileName = "scene2.json"
	    this.audioSources = []
	    this.filesystem = filesystem;
	    this.audioBufferLoader = audioBufferLoader;
	    this.audio4RirsBufferLoader = audioBufferLoader;
	    // this.ambisonic = ambisonic;
	    this.audioContext = parameters.audioContext;
	    this.distanceValue = [1, 1, 1];
	    this.distanceSum = 0;
	    this.fileData = {
	    	File: parameters.dataFileName,
	    	Audio: parameters.audioData
	    }
	    this.gainsData = {
	    	Value: [],
	    	Norm: 0,
	    	Exposant: parameters.gainExposant
	    }
	    this.audio2Source = [0, 1, 2] 				// Associate ths index in 'this.closestSourcesId' to the corresponding audioSource
	    this.ambiOrder = parameters.order;
	}

	async start (listenerPosition) {
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
		this.closestSourcesId = this.ClosestSource(listenerPosition, this.sourcesData.receivers.xyz) // get closest Sources to the Listener
  	}

  	CreateSources(container, scale, offset) {
  		// Create the circle for the Sources
	    for (let i = 0; i < this.nbSources; i++) {     // foreach Sources
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

	      	// Add the circle to the display
	      	container.appendChild(this.sources[i]);
    	}
    	for (let i = 0; i < this.nbActiveSources - 1; i++) {
		    this.sources[this.closestSourcesId[i]].style.background = "rgb(0, " + 255*(4*Math.pow(this.gainsData.Value[i]/this.gainsData.Norm, 2)) + ", 0)";
		    if (this.mode == "convolving") {
		    	// console.log(this.sourcesData.receivers.files)
		    	// console.log(this.sourcesData.receivers.files)
		    	// console.log(this.Rirs)
		    	// console.log(this.Rirs[i])
		    	// console.log(this.audioBufferLoader.data[this.sourcesData.receivers.files])
        		this.audioSources[i].start(this.audioBufferLoader.data, this.sourcesData.receivers.files, this.Rirs, this.closestSourcesId[i], this.gainsData.Value[i], this.gainsData.Norm)    	
		    }
		    else {
        		this.audioSources[i].start(this.audioBufferLoader.data[this.sourcesData.receivers.files[this.closestSourcesId[i]]], this.gainsData.Value[i], this.gainsData.Norm)    	
			}
    	}
  	}

  	LoadSoundbank() { // Load the audioData to use
	    const soundbankTree = this.filesystem.get(this.fileData.Audio);
	    var defObj = {};
	    soundbankTree.children.forEach(leaf => {
	      	if (leaf.type === 'file') {
	        	defObj[leaf.name] = leaf.url;
	      	}
	    });
	    if (this.mode == "convolving") {
	    	defObj = this.LoadSound4Rirs(defObj);
	    }
	    this.audioBufferLoader.load(defObj, true);
  	}

  	LoadRirs() { // Load the audioData to use
	    const soundbankTree = this.filesystem.get(this.fileData.Audio);
	    this.Rirs = {};
	    var defObj = {};
	    soundbankTree.children.forEach(leaf => {
	      	if (leaf.type === 'file') {
	        	this.Rirs[leaf.name] = leaf.url;
	      	}
	    });
	    if (this.mode == "convolving") {
	    	defObj = this.LoadSound4Rirs(defObj);
	    }
	    this.audioBufferLoader.load(defObj, true);
	}

  	LoadSound4Rirs(defObj) { // Load the audioData to use
	    const soundbankTree = this.filesystem.get('Assets');

	    soundbankTree.children.forEach(branch => {
	      	if (branch.type === 'directory') {
	      		branch.children.forEach(leaf => {
	        		defObj[leaf.name] = leaf.url;	
	           	});
	      	}
	    });
  		return(defObj)
	}

  	LoadData() { // Load the data
	    const data = this.filesystem.get('Assets');
	    // Check files to get config
	    data.children.forEach(leaf => {
	      	if (leaf.name === this.fileData.File) {

			    fetch(leaf.url).then(results => results.json()).then(jsonObj => {

			        this.sourcesData = jsonObj;
			        this.nbSources = this.sourcesData.receivers.xyz.length;
			        var tempSourcesPosition = [];
			        for (let i = 0; i < this.nbSources; i++) {
		          		tempSourcesPosition.push({x: this.sourcesData.receivers.xyz[i][0], y:this.sourcesData.receivers.xyz[i][1]});
		        	}
		        	this.sourcesData.receivers.xyz = tempSourcesPosition
		          	document.dispatchEvent(new Event("dataLoaded"));
	        	})
      		}
    	});
  	}

  	onListenerPositionChanged(listenerPosition) { // Update the closest Sources to use when Listener's Position changed

	    // Initialising variables
	    var previousClosestSourcesId = this.closestSourcesId;
	    var currentClosestInPrevious;
	    var tempAudio2Source = this.audio2Source.slice();	// remove the reference
	    // console.log(tempAudio2Source, this.audio2Source)
	    var availableAudioSources = [];						// AudioSources where source have been removed
	    var sources2Attribuate = [];						// Sources to attribuate to an audioSource
	    // Update the closest Points
	    this.closestSourcesId = this.ClosestSource(listenerPosition, this.sourcesData.receivers.xyz);
	    
	    // Check all the new closest Points
	    for (let i = 0; i < this.nbActiveSources - 1; i++) {
		    // Check if the Id is new in 'this.ClosestPointsId'
		    if (previousClosestSourcesId[i] != this.closestSourcesId[i]) {

		        // Update the Display for Sources that are not active  (//Check if the point is the fourth point)
		        if (this.Index(previousClosestSourcesId[i], this.closestSourcesId)[0] || previousClosestSourcesId[i] == this.closestSourcesId[this.nbActiveSources - 1]) {

		          	this.sources[previousClosestSourcesId[i]].style.background = "grey";
		          	availableAudioSources.push(this.audio2Source[i]);				// Set the audioSource as waiting for a source
		        }

		        currentClosestInPrevious = this.Index(this.closestSourcesId[i], previousClosestSourcesId);

		       	if (currentClosestInPrevious[0] || this.closestSourcesId[i] == previousClosestSourcesId[this.nbActiveSources - 1]) {
		          	sources2Attribuate.push([this.closestSourcesId[i], i])			// Set the source as waiting for an AudioSource
		        }
		        else {
		        	// Change the association between 'this.closestSourceId' and the corresponding Source
		        	tempAudio2Source[i] = this.audio2Source[currentClosestInPrevious[1]];
		        }
		    }
	    }
	    this.audio2Source = tempAudio2Source.slice();

	    // 
	    var k = 0;

	    // Update the audioSources with new Sources ('sources2Attribuate')
	    availableAudioSources.forEach(audioSourceId => {
	    	// Add a new association between 'this.closestSourceId' and the corresponding Source
	    	this.audio2Source[sources2Attribuate[k][1]] = audioSourceId;
	    	// Update audioSources corresponding to the association ('this.audioSources')
		    if (this.mode == "convolving") {
		    	console.log(this.closestSourcesId[sources2Attribuate[k][1]])
		    	console.log(this.Rirs)
		    	console.log(this.sourcesData.receivers.files)
		    	console.log(this.sourcesData.receivers.files.Rirs["source" + audioSourceId])
		    	this.audioSources[audioSourceId].UpdateAudioSource(this.Rirs[this.sourcesData.receivers.files.Rirs["source" + audioSourceId][this.closestSourcesId[sources2Attribuate[k][1]]]], this.gainsData.Value[audioSourceId], this.gainsData.Norm)
	    	}
	    	else {
	    		console.log(this.audioBufferLoader.data)
	    		console.log(this.sourcesData.receivers.files)
	    		console.log(this.sourcesData.receivers.files[audioSourceId])
	    		console.log(sources2Attribuate[k][0])
	    		console.log(sources2Attribuate[k])
	    		console.log([audioSourceId][sources2Attribuate[k][0]])
	    		console.log(this.audioBufferLoader.data[this.sourcesData.receivers.files[audioSourceId][sources2Attribuate[k][0]]])
		    	this.audioSources[audioSourceId].UpdateAudioSource(this.audioBufferLoader.data[this.sourcesData.receivers.files["source" + audioSourceId][sources2Attribuate[k][0]]], this.gainsData.Value[audioSourceId], this.gainsData.Norm)
	    	}
	    	k += 1;
	    });

	    // Update display and gain of activ sources
	    for (let i = 0; i < this.nbActiveSources - 1; i++) {
		    this.UpdateClosestSourcesColor(i);
		    this.audioSources[i].UpdateGain(this.gainsData.Value[this.Index(i, this.audio2Source)[1]], this.gainsData.Norm);
	    }
	}

  	ClosestSource(listenerPosition, listOfPoint) { // get closest Sources to the Listener
    
	    // Initialising temporary variables;
	    var closestIds = [];
	    var currentClosestId;

	    // Reset Count
	    this.distanceSum = 0;
	    this.gainsData.Norm = 0;
	    // Get the 'nbClosest' closest Ids
	    for (let j = 0; j < this.nbActiveSources; j++) {

	      // Set 'undefined' to the currentClosestId to ignore difficulties with initial values
	      currentClosestId = undefined;

	      for (let i = 0; i < listOfPoint.length; i++) {
	        // Check if the Id is not already in the closest Ids and if the Source of this Id is closest
	        if (this.Index(i, closestIds)[0] && this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[currentClosestId])) {
	          currentClosestId = i;
	        }
	      }

	      if (j != this.nbActiveSources - 1) {
	        // Get the distance between the Listener and the Source
	        this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]);

	        // Increment 'this.distanceSum'
	        this.distanceSum += this.distanceValue[j];
	      }

	      // Push the Id in the closest
	      closestIds.push(currentClosestId);
	    }

	    // Set the Gains and the Gains norm
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

  	UpdateClosestSourcesColor(index) { // Update Gain and Display of the Source depending on Listener's Position

	    // Set a using value to the Source
	    var sourceValue = this.gainsData.Value[index]/this.gainsData.Norm;

	    // Update the Display of the Source
	    this.sources[this.closestSourcesId[index]].style.background = "rgb(0, " + 255*(4*Math.pow(sourceValue, 2)) + ", 0)";
  	}


	Index(pointId, listOfIds) { // Check if an Id is not in an Ids' array
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