//////////////////
/// Audio.js ///
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
	    console.log(this.filesystem)
	    this.distanceValue = [1, 1, 1];
	    this.distanceSum = 0;
	    this.gainsData = {
	    	Value: [0, 0, 0],
	    	Norm: 1,
	    	Exposant: 1
	    }

	}

	async start (listenerPosition) {


		for (let i = 0; i < this.nbActiveSources - 1; i++) {
			this.audioSources.push(new Audio(this.audioContext));
		}

		this.closestSourcesId = this.ClosestSource(listenerPosition, this.sourcesData.receivers.xyz) // get closest Sources to the Listener
		console.log(this.closestSourcesId)
		// for (let i = 0; i < this.nbActiveSources - 1; i++) {
		//         this.UpdateClosestSourcesColor(i);
		//     }

		// Load all Datas
	    // this.loadData();
	    console.log("ggg")
	    // Wait json data to be loaded (an event is dispatch by 'loadData()')
	 //    document.addEventListener("dataLoaded", () => {
	 //    	CreateSources();
		// })
  	}

  	// UpdateScale(scale) {
  	// 	this.scale = scale;
  	// }

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
	       	// if (this.NotIn(i, this.closestSourcesId)) {
	       		this.sources[i].style.background =  "grey";
	       	// }
	       	// else {
	       	// // 	console.log(this.sources)
	       	// // 	console.log(i)
	       	// 	console.log(this.gainsData)
	       	// }
	      	this.sources[i].style.transform = "translate(" + 
	      	((this.sourcesData.receivers.xyz[i].x - offset.x)*scale) + "px, " + 
	      	((this.sourcesData.receivers.xyz[i].y - offset.y)*scale) + "px)";

	      	// Add the circle to the display
	      	container.appendChild(this.sources[i]);
    	}
    	for (let i = 0; i < this.nbActiveSources - 1; i++) {
		    this.sources[this.closestSourcesId[i]].style.background = "rgb(0, " + 255*(4*Math.pow(this.gainsData.Value[i]/this.gainsData.Norm, 2)) + ", 0)"
        	console.log(this.audioSources)
        	// console.log(this.sourcesData.receivers.files[this.ClosestPointsId[i]])
        	this.audioSources[i].start(this.audioBufferLoader.data[this.sourcesData.receivers.files[this.closestSourcesId[i]]])    	
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
  		console.log(this.filesystem)
	    const data = this.filesystem.get('Position');

	    // Check files to get config
	    data.children.forEach(leaf => {
	      	if (leaf.name === dataFileName) {

		        // // Creating the data receiver (I need to use the 'leaf.url' to read the json)
		        // var jsonData = new XMLHttpRequest();

		        // // Wait the json file to be loaded
		        // jsonData.addEventListener("load", () => {

			       //  // Get the text from data
			       //  var jsonText = JSON.stringify(jsonData.responseText);
			            
			       //  // Modify the text to be usable for an object
			       //  jsonText = jsonText.replaceAll(/[/][/][ \w'"]+/g,'');
			       //  jsonText = jsonText.replaceAll('\\n', '');
			       //  jsonText = jsonText.replace(/^./,'');
			       //  jsonText = jsonText.replace(/.$/,'');
			       //  jsonText = jsonText.replaceAll('\\','');
			       //  jsonText = jsonText.replaceAll('.0','');

			       //  // Create the data object
			       //  this.sourcesData = JSON.parse(jsonText);

			       //  // Dispatch an event to inform that the data has been loaded
			       //  document.dispatchEvent(new Event("dataLoaded"));
			       //  }, false);

		        // // Get the data of the json from the 'leaf.url'
		        // jsonData.open("get", leaf.url, true);
		        // jsonData.send();
		    fetch(leaf.url).then(results => results.json()).then(jsonObj => {
	          // console.log(jsonObj)
	          // console.log(jsonObj.receivers.xyz)

	          this.sourcesData = jsonObj;
	          var tempSourcesPosition = [];
	        for (let i = 0; i < this.nbSources; i++) {
          		tempSourcesPosition.push({x: this.sourcesData.receivers.xyz[i][0], y:this.sourcesData.receivers.xyz[i][1]});
        	}
        	this.sourcesData.receivers.xyz = tempSourcesPosition
        	// console.log(tempSourcesPosition)
        	// console.log(this.sourcesData)
	          document.dispatchEvent(new Event("dataLoaded"));
	          // console.log("hey")
        })
      		}
    	});
  	}

  	onListenerPositionChanged(listenerPosition) { // Update the closest Sources to use when Listener's Position changed

    // Initialising variables
    var previousClosestSourcesId = this.closestSourcesId;
    // console.log(this.closestSourcesId)
    // Update the closest Points
    this.closestSourcesId = this.ClosestSource(listenerPosition, this.sourcesData.receivers.xyz);
    
    // Check all the new closest Points
    for (let i = 0; i < this.nbActiveSources - 1; i++) {
    	// console.log(previousClosestSourcesId)
      // Check if the Id is new in 'this.ClosestPointsId'
      if (previousClosestSourcesId[i] != this.closestSourcesId[i]) {

        // Update the Display for Sources that are not active
        if (this.NotIn(previousClosestSourcesId[i], this.closestSourcesId) || previousClosestSourcesId[i] == this.closestSourcesId[this.nbActiveSources - 1]) {
          // console.log(this.sources)
          // console.log(previousClosestSourcesId[i])
          this.sources[previousClosestSourcesId[i]].style.background = "grey";
        }

        this.UpdateClosestSourcesColor(i);
        this.audioSources[i].UpdateAudioSource(this.audioBufferLoader.data[this.sourcesData.receivers.files[this.closestSourcesId[i]]], this.gainsData.Value[i], this.gainsData.Norm)

        // this.Audio[i].Stop();                         // Stop the previous Source
        // // this.Audio[i].disconnect(this.gains[i]);      // Disconnect the Source from the audio

        // // Update the new Sound for the new Sources
        // this.Audio[i].LoadNewSound(this.audioBufferLoader.data[this.receivers.files[this.ClosestPointsId[i]]], i);
        // this.Audio[i].Play();                        // Start the new Source
      }
      // console.log("juikol")
	// console.log(this.closestSourcesId)
    // Update Source parameters
    // this.UpdateSourcesSound(i);
    }
}

  	ClosestSource(listenerPosition, listOfPoint) { // get closest Sources to the Listener
    
	    // Initialising temporary variables;
	    var closestIds = [];
	    var currentClosestId;

	    // Reset Count
	    this.distanceSum = 0;
	    this.gainsData.Norm = 0;
	    // console.log(listenerPosition, listOfPoint)
	    // Get the 'nbClosest' closest Ids
	    for (let j = 0; j < this.nbActiveSources; j++) {

	      // Set 'undefined' to the currentClosestId to ignore difficulties with initial values
	      currentClosestId = undefined;

	      for (let i = 0; i < listOfPoint.length; i++) {
	      	// console.log(this.Distance(listenerPosition, listOfPoint[i]))
	      	// console.log(this.Distance(listenerPosition, listOfPoint[currentClosestId]))
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
	    // console.log(closestIds)
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
	    // console.log(index)
	    var sourceValue = this.gainsData.Value[index]/this.gainsData.Norm;
	    // console.log(sourceValue)

	    // Update the Display of the Source
	    this.sources[this.closestSourcesId[index]].style.background = "rgb(0, " + 255*(4*Math.pow(sourceValue, 2)) + ", 0)";
	    
	    // Update the Gain of the Source
	    // this.gains[index].gain.setValueAtTime(sourceValue, 0);
  	}

  	// UpdateListenerPosition() {
  	// 	this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);
  	// }

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