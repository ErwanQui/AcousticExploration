//////////////////
/// Audio.js ///
//////////////////

class Sources {

	constructor (data, audioContext, player) {

	    // User positions
	    this.nbSources;
	    this.circleDiameter = 20;
	    this.container = container;
	    this.sources = [];
	    this.sourcesData;
	    this.scale;

	    this.filesystem = this.require('filesystem');

	}

	async start () {

		// Load all Datas
	    await this.loadData();

	    // Wait json data to be loaded (an event is dispatch by 'loadData()')
	    document.addEventListener("dataLoaded", () => {
	    	CreateSources();
		})
  	}

  	CreateSources() {
  		// Create the circle for the Sources
	    for (let i = 0; i < this.nbSources; i++) {     // foreach Sources
	      	this.sources.push(document.createElement('div'));         // Create a new element
	      	this.sources[i].id = "circle" + i;                       // Set the circle id
	      	this.sources[i].innerHTML = i + 1;                       // Set the circle value (i+1)

	      	// Change form and position of the element to get a circle at the good place;
	      	this.sources[i].style.position = "absolute";
	      	this.sources[i].style.margin = "0 " + (-this.circleDiameter/2) + "px";
	       	this.sources[i].style.width = this.circleSize + "px";
	       	this.sources[i].style.height =  this.circleSize + "px";
	       	this.sources[i].style.borderRadius =  this.circleSize + "px";
	       	this.sources[i].style.lineHeight =  this.circleSize + "px";
	       	this.sources[i].style.background =  "grey";
	      	this.sources[i].style.transform = "translate(" + 
	   			((this.sourcesData.xyz[i][0] - offset.X)*this.scale) + "px, " + 
	   			((this.sourcesData.xyz[i][1] - offset.Y)*this.scale) + "px)";
	      
	      	// Add the circle to the display
	      	this.container.appendChild(this.sources[i]);
    	}
  	}

  	loadData() { // Load the data
	    const data = this.filesystem.get('Position');

	    // Check files to get config
	    data.children.forEach(leaf => {
	      	if (leaf.name === this.dataFileName) {

		        // Creating the data receiver (I need to use the 'leaf.url' to read the json)
		        var jsonData = new XMLHttpRequest();

		        // Wait the json file to be loaded
		        jsonData.addEventListener("load", () => {

			        // Get the text from data
			        var jsonText = JSON.stringify(jsonData.responseText);
			            
			        // Modify the text to be usable for an object
			        jsonText = jsonText.replaceAll(/[/][/][ \w'"]+/g,'');
			        jsonText = jsonText.replaceAll('\\n', '');
			        jsonText = jsonText.replace(/^./,'');
			        jsonText = jsonText.replace(/.$/,'');
			        jsonText = jsonText.replaceAll('\\','');
			        jsonText = jsonText.replaceAll('.0','');

			        // Create the data object
			        this.sourcesData = JSON.parse(jsonText);

			        // Dispatch an event to inform that the data has been loaded
			        document.dispatchEvent(new Event("dataLoaded"));
			        }, false);

		        // Get the data of the json from the 'leaf.url'
		        jsonData.open("get", leaf.url, true);
		        jsonData.send();
      		}
    	});
  	}

  	ClosestSource(listenerPosition, listOfPoint, nbClosest) { // get closest Sources to the Listener
    
	    // Initialising temporary variables;
	    var closestIds = [];
	    var currentClosestId;

	    // Reset Count
	    this.distanceSum = 0;
	    this.gainNorm = 0;

	    // Get the 'nbClosest' closest Ids
	    for (let j = 0; j < nbClosest; j++) {

	      // Set 'undefined' to the currentClosestId to ignore difficulties with initial values
	      currentClosestId = undefined;

	      for (let i = 0; i < listOfPoint.length; i++) {

	        // Check if the Id is not already in the closest Ids and if the Source of this Id is closest
	        if (this.NotIn(i, closestIds) && this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[currentClosestId])) {
	          currentClosestId = i;
	        }
	      }

	      if (j != nbClosest - 1) {
	        // Get the distance between the Listener and the Source
	        this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]);

	        // Increment 'this.distanceSum'
	        this.distanceSum += this.distanceValue[j];
	      }

	      // Push the Id in the closest
	      closestIds.push(currentClosestId);
	    }

	    // Set the Gains and the Gains norm
	    for (let i = 0; i < this.gainsValue.length; i++) {
	      this.gainsValue[i] = Math.pow((1 - this.distanceValue[i]/this.distanceSum), this.gainExposant);
	      this.gainNorm += this.gainsValue[i];
	    }

	    return (closestIds);
  	}

  	UpdateSourcesPosition() { // Update the Positions of circles when window is resized
	    for (let i = 0; i < this.positions.length; i++) {
	      	this.sources[i].style.transform = "translate(" + 
	      		((this.sourcesData.xyz[i][0] - offset.X)*this.scale) + "px, " + 
	      		((this.sourcesData.xyz[i][1] - offset.Y)*this.scale) + "px)";
    	}
  	}

  	// UpdateSourcesSound(index) { // Update Gain and Display of the Source depending on Listener's Position

	  //   // Set a using value to the Source
	  //   var sourceValue = this.gainsValue[index]/this.gainNorm;

	  //   // Update the Display of the Source
	  //   document.getElementById("circle" + this.ClosestPointsId[index]).style.background = "rgb(0, " + 255*(4*Math.pow(sourceValue, 2)) + ", 0)";
	    
	  //   // Update the Gain of the Source
	  //   this.gains[index].gain.setValueAtTime(sourceValue, 0);
  	// }
  	UpdateListenerPosition() {
  		this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);
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