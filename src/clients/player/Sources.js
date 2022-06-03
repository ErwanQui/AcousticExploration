//////////////////
/// Sources.js ///
//////////////////

import Audio from './Audio.js'

class Sources {

	constructor (filesystem, audioBufferLoader) {

	    // User positions
	    this.nbSources = 18;
	    this.circleDiameter = 20;
	    // this.container = container;
	    this.sources = [];
	    this.closestSourcesId = undefined;
	    this.nbActiveSources = 4;
	    this.sourcesData;
	    this.scale;
	    // this.dataFileName = "scene2.json"
	    this.audioSources = []
	    this.filesystem = filesystem;
	    this.audioBufferLoader = audioBufferLoader;
	    this.audioContext = new AudioContext();
	    this.distanceValue = [1, 1, 1];
	    this.distanceSum = 0;
	    this.gainsData = {
	    	Value: [],
	    	Norm: 0,
	    	Exposant: 3
	    }
	}

	async start (listenerPosition) {
		for (let i = 0; i < this.nbActiveSources - 1; i++) {
			this.audioSources.push(new Audio(this.audioContext));
		}

		this.closestSourcesId = this.ClosestSource(listenerPosition, this.sourcesData.receivers.xyz) // get closest Sources to the Listener
  	}

  	CreateSources(container, scale, offset) {
  		// Create the circle for the Sources
	    for (let i = 0; i < this.nbSources; i++) {     // foreach Sources
	      	this.sources.push(document.createElement('div'));         // Create a new element
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
		    this.sources[this.closestSourcesId[i]].style.background = "rgb(0, " + 255*(4*Math.pow(this.gainsData.Value[i]/this.gainsData.Norm, 2)) + ", 0)"
        	this.audioSources[i].start(this.audioBufferLoader.data[this.sourcesData.receivers.files[this.closestSourcesId[i]]], this.gainsData.Value[i], this.gainsData.Norm)    	
    	}
  	}

  	LoadSoundbank(audioData) { // Load the audioData to use
	    const soundbankTree = this.filesystem.get(audioData);
	    const defObj = {};
	    soundbankTree.children.forEach(leaf => {
	      	if (leaf.type === 'file') {
	        	defObj[leaf.name] = leaf.url;
	      	}
	    });
	    this.audioBufferLoader.load(defObj, true);
  	}

  	LoadData(dataFileName) { // Load the data
	    const data = this.filesystem.get('Position');

	    // Check files to get config
	    data.children.forEach(leaf => {
	      	if (leaf.name === dataFileName) {

			    fetch(leaf.url).then(results => results.json()).then(jsonObj => {

			        this.sourcesData = jsonObj;
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
	    // Update the closest Points
	    this.closestSourcesId = this.ClosestSource(listenerPosition, this.sourcesData.receivers.xyz);
	    
	    // Check all the new closest Points
	    for (let i = 0; i < this.nbActiveSources - 1; i++) {
		    // Check if the Id is new in 'this.ClosestPointsId'
		    if (previousClosestSourcesId[i] != this.closestSourcesId[i]) {

		        // Update the Display for Sources that are not active
		        if (this.NotIn(previousClosestSourcesId[i], this.closestSourcesId) || previousClosestSourcesId[i] == this.closestSourcesId[this.nbActiveSources - 1]) {

		          	this.sources[previousClosestSourcesId[i]].style.background = "grey";
		        }

		        this.UpdateClosestSourcesColor(i);
		        this.audioSources[i].UpdateAudioSource(this.audioBufferLoader.data[this.sourcesData.receivers.files[this.closestSourcesId[i]]], this.gainsData.Value[i], this.gainsData.Norm)
		    }
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
	        if (this.NotIn(i, closestIds) && this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[currentClosestId])) {
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


	NotIn(pointId, listOfIds) { // Check if an Id is not in an Ids' array
	    var iterator = 0;
	    while (iterator < listOfIds.length && pointId != listOfIds[iterator]) {
	      iterator += 1;
	    }
	    return(iterator >= listOfIds.length);
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