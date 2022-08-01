//////////////////
/// Sources.js ///
//////////////////

import Streaming from './Streaming.js'
import Ambisonic from './Ambisonic.js'
import Convolving from './Convolving.js'
import AmbiConvolving from './AmbiConvolving.js'

import { Scheduler } from 'waves-masters';

// Class used to implement all the sources seen and heared by user

class Sources {

	constructor (filesystem, audioBufferLoader, parameters, platform, sync, audioStream) {

	    // Create the datas' storer
	    this.sourcesData;

	    // Get audioContext
	    this.audioContext = parameters.audioContext;

	    // Create plugins
	    this.audioBufferLoader = audioBufferLoader;
	   	this.filesystem = filesystem;
	   	this.audioStream = audioStream
	    this.platform = platform;
	    this.sync = sync;

	    // Global parameters
	    this.nbSources;												// Create the number of sources object
	    // this.mode = parameters.mode;								// Get the used mode
	    this.circleDiameter = parameters.circleDiameter;			// Get the circles' diameter
	    this.nbActiveSources = parameters.nbClosestActivSources;	// Get the number of active sources
	    this.nbDetectSources = parameters.nbClosestDetectSources;	// Get the number of detect sources
	    // this.ambiOrder = parameters.order;						// Get the ambisonic's order
	    this.fileData = {											// Create the fileDatas' storer
	    	file: parameters.dataFileName,
	    	// audio: parameters.audioData
	    }
	    this.audioSources = []										// Store the audioSources (I will then associate a source to each audioSource)
	    this.sources = [];											// Create the array of sources' display's elements

		// Create used variables
	    this.closestSourcesId;										// Array of the closest sources from listener
	    this.audio2Source = [] 										// Associate ths index in 'this.closestSourcesId' to the corresponding audioSource
	    this.distanceValue = [1, 1, 1];								// Distance of each source with listener
	    this.distanceSum = 0;										// Sum of the sources' distance
	    this.scheduler;												// Used to sync the audioSources
		this.syncBuffers = [];										// Array to store the syncAudios of the audioSources. Used by the scheduler

	    // Set gain's datas
	    this.gainsData = {
	    	value: [],
	    	norm: 0,
	    	exposant: parameters.gainExposant
	    }
	}

	async start (listenerPosition) {

	    // Provide a conversion function that allows the scheduler to compute
	    // the audio time from it own scheduling time reference.
	    // As `currentTime` is in the sync time reference we gave in
	    // `getTimeFunction` and that the sync plugin is configured to use
	    // the audio clock as a local reference, we therefore just need to convert
	    // back to the local time.
	    const getTimeFunction = () => this.sync.getSyncTime();
	    const currentTimeToAudioTimeFunction = currentTime => this.sync.getLocalTime(currentTime);
	    
	    // Create the scheduler
	    this.scheduler = new Scheduler(getTimeFunction, {
	      currentTimeToAudioTimeFunction
	    });

		// Add the audioSources depending on the mode
		for (let i = 0; i < this.nbDetectSources; i++) {
			this.audio2Source.push(i);
			switch (this.sourcesData.mode) {

				case 'debug':
				case 'streaming':
					this.audioSources.push(new Streaming(this.audioContext, i, this.audioStream, (i < this.nbActiveSources)));
					break;

				case 'ambisonic':
					this.audioSources.push(new Ambisonic(this.audioContext, i, this.audioStream, (i < this.nbActiveSources), this.sourcesData.order));
					break;

				// case 'convolving':
				// 	this.audioSources.push(new Convolving(this.audioContext, this.sourcesData.order));
				// 	break;

				// case 'ambiConvolving':
				// 	this.audioSources.push(new AmbiConvolving(this.audioContext, this.sourcesData.order));
				// 	break;

				default:
					alert("No valid mode");
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
    	for (let i = 0; i < this.nbDetectSources; i++) {

    		// Set sources' color for the starting position of the listener
			if (i < this.nbActiveSources) {
				this.UpdateClosestSourcesColor(i);
			}

			// Start sources
			switch (this.sourcesData.mode) {
		    	case 'debug':
		    	case 'streaming':

		    		// Add an event listener to detect that a new audio is ready to be played
			    	document.addEventListener("audioLoaded" + i, () => {
			    		// console.log("audioDispatched")

			    		// Remove previous audio from the scheduler
			    		if (this.syncBuffers[i] != undefined) {
			    			this.UpdateEngines(i, false);
			    		}

			    		// Add the new audio to the scheduler
			    		this.syncBuffers[i] = this.audioSources[i].GetSyncBuffer()
		    			this.UpdateEngines(i, true);
		    		});
		    		
		    		// Start audioSource
		    		this.audioSources[i].start(this.sourcesData.receivers.files[this.closestSourcesId[i]], this.gainsData.value[i], this.gainsData.norm);  	
			    	this.syncBuffers.push(undefined);

					break;

		    	case 'ambisonic':

					// Add an event listener to detect that a new audio is ready to be played
		    		document.addEventListener("audioLoaded" + i, () => {
		    			// console.log("audioDispatched")

		    			// Remove previous audio from the scheduler
			    		if (this.syncBuffers[i] != undefined) {
			    			this.UpdateEnginesAmbi(i, false);
			    		}

			    		// Add the new audio to the scheduler
			    		this.syncBuffers[i] = this.audioSources[i].GetSyncBuffer()
		    			this.UpdateEnginesAmbi(i, true);

		    		});

					// Start audioSources
        			this.audioSources[i].start(this.sourcesData.receivers.files[this.closestSourcesId[i]], this.gainsData.value[i], this.gainsData.norm);    	
		    		this.syncBuffers.push(undefined)

		    		break;

				// case 'convolving':
				// 	this.audioSources[i].start(this.audioBufferLoader.data, this.sourcesData.receivers.files, this.closestSourcesId[i], this.gainsData.value[i], this.gainsData.norm);    	
				// 	this.UpdateEngines(i, true)
				// 	break;

				// case 'ambiConvolving':
				// 	this.audioSources[i].start(this.audioBufferLoader.data, this.sourcesData.receivers.files, this.closestSourcesId[i], this.gainsData.value[i], this.gainsData.norm);    	
				// 	this.UpdateEngines(i, true)
				// 	break;

				default:
					console.log("no valid mode");
					break;
			}
		}
	}

  	LoadData() { // Load the data from the json file

  		// Get all assets' datas
	    const data = this.filesystem.get('Assets');

	    data.children.forEach(leaf => {
	      	if (leaf.name === this.fileData.file) {

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

		        	var tempInstrumentsPositions = [];
		        	for (let i = 0; i < this.sourcesData.sources_xy.length; i++) {
		          		tempInstrumentsPositions.push({x: this.sourcesData.sources_xy[i][0], y:this.sourcesData.sources_xy[i][1]});
		        	}

		        	// Update sourcesData object
		        	this.sourcesData.receivers.xyz = tempSourcesPosition;
		        	this.sourcesData.sources_xy = tempInstrumentsPositions;

		        	console.log("json files: " + this.fileData.file + " has been read");
    				console.log("You are using " + this.sourcesData.mode + " mode.");

		        	// Create an event to inform that the file's data can be used
		          	document.dispatchEvent(new Event("dataLoaded"));
	        	})
      		}
    	});
  	}

  	onListenerPositionChanged(listenerPosition) { // Update the closest sources to use when listener's position updated

	    // Initialising variables
	    var previousClosestSourcesId = this.closestSourcesId;	// Keep the previous closest sources ids
	    var currentClosestInPrevious;							// Create the object to get the index of a closest source in the previous closest sources array

	    // @note: we need to use the 'slice()' method, otherwise it creates a reference of the array
	    var tempAudio2Source = this.audio2Source.slice();		// remove the reference
	    var availableAudioSources = [];							// AudioSources where source have been removed
	    var sources2Attribuate = [];							// Sources to attribuate to an audioSource

	    // Update the closest points ids
	    this.closestSourcesId = this.ClosestSource(listenerPosition, this.sourcesData.receivers.xyz);
	    
	    // Check all new closest points
	    for (let i = 0; i < this.nbDetectSources; i++) {

		    // Check if the id had been updated in 'this.closestPointsId'
		    if (previousClosestSourcesId[i] != this.closestSourcesId[i]) {

		        // Update the display for sources that were active and are not anymore
		        // (Check if the source was closest enough to be a playing source)
		        if (!this.Index(previousClosestSourcesId[i], this.closestSourcesId)[0] || this.Index(previousClosestSourcesId[i], this.closestSourcesId)[1] >= this.nbActiveSources) {
		          	
					// Change the color of inactive sources to grey
		          	this.sources[previousClosestSourcesId[i]].style.background = "grey";

		          	// Update the playing state of the corresponding audioSource to "inactive"
			    	this.audioSources[this.audio2Source[i]].ChangePlayingState(false, this.sync.getLocalTime(this.sync.getSyncTime()));
		          	
		          	console.log("Source " + i + " is now inactive")
		          	
		          	// Reset the gain of the corresponding audioSource
		          	this.audioSources[this.audio2Source[i]].UpdateGain(0, 1);

		          	// If the previous playing source is not playing anymore, the attached audioSource is added to "availableAudioSource" to be reattached to a new closest source
		          	if (!this.Index(previousClosestSourcesId[i], this.closestSourcesId)[0]) {
		          		availableAudioSources.push(this.audio2Source[i]);						// Set the audioSource as waiting for a source
		          	}
		        }

		        // Instantiate 'currentClosestInPrevious': if the sources was in the 'previousClosestSourcesId', it gets the position in the array
		        currentClosestInPrevious = this.Index(this.closestSourcesId[i], previousClosestSourcesId);

		        // Check if the sources wasn't in 'previousClosestSourcesId'
		       	if (!currentClosestInPrevious[0]) {

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

	    // Instantite the variable to store the available audio source's id
	    var audioSourceId;

	    // Update the audioSources with new sources ('sources2Attribuate') (=create new couples of source and audioSource)
	    for (let i = 0; i < availableAudioSources.length; i++) {

	    	// Get the available audio source's id
	    	audioSourceId = availableAudioSources[i];

	    	// Add a new association between 'this.closestSourceId' and the corresponding Source
	    	this.audio2Source[sources2Attribuate[i][1]] = audioSourceId;

	    	// Load and play the new sources in the audioSource objects
		    switch (this.sourcesData.mode) {
		    	case "debug":
		    	case "streaming":
			    	this.audioSources[audioSourceId].loadSample(this.sourcesData.receivers.files[sources2Attribuate[i][0]])
		    		break;

		    	case "ambisonic":
		    		this.audioSources[audioSourceId].loadSample(this.sourcesData.receivers.files[sources2Attribuate[i][0]])
		    		break;

		    	case "convolving":
			    	this.UpdateEngines(audioSourceId, false)
			    	this.audioSources[audioSourceId].UpdateAudioSource(this.audioBufferLoader.data[this.sourcesData.receivers.files.Rirs["source" + audioSourceId][this.closestSourcesId[sources2Attribuate[i][1]]]])
			    	this.UpdateEngines(audioSourceId, true)
			    	break;

		    	case "ambiConvolving":
			    	this.UpdateEngines(audioSourceId, false)
			    	this.audioSources[audioSourceId].UpdateAudioSource(this.audioBufferLoader.data, this.sourcesData.receivers.files.Rirs, this.closestSourcesId[sources2Attribuate[i][1]])
			    	this.UpdateEngines(audioSourceId, true)
			    	break;

		    	default:
		    		console.log("no valid mode");
		    		break;
	    	}
	    }

	    // Update display and gain of activ sources
	    // console.warn("Current closestIds are:")
	    // console.warn(this.closestSourcesId)
	    // console.log("Current corresponding between AudioSources and Sources in closestSourcesId is :")
	    // console.log(this.audio2Source)

	    // Update sources and audioSources
	    for (let i = 0; i < this.nbActiveSources; i++) {

		    console.log("AudioSource " + this.audio2Source[i] + " is active with the value " + (this.gainsData.value[i]/this.gainsData.norm) + " and the Source " + (this.closestSourcesId[i] + 1) + " is now playing")
		    
		    // Update the coloration of sources
		    this.UpdateClosestSourcesColor(i);

		    // Update the playingState to active
		    this.audioSources[this.audio2Source[i]].ChangePlayingState(true);

		    // Update audioSources' gain
		    this.audioSources[this.audio2Source[i]].UpdateGain(this.gainsData.value[i], this.gainsData.norm);
		}
	}

  	ClosestSource(listenerPosition, listOfPoint) { // Get closest sources to the listener
    
	    // Initialising temporary variables;
	    var closestIds = [];
	    var currentClosestId;

	    // Reset variables
	    this.distanceSum = 0;
	    this.gainsData.norm = 0;

	    // Get the 'nbClosest' closest ids
	    for (let j = 0; j < this.nbDetectSources; j++) {

		    // Set 'undefined' to the currentClosestId to ignore difficulties with initial values
		    currentClosestId = undefined;

		    for (let i = 0; i < listOfPoint.length; i++) {

		        // Check if the id is not already in the closest ids and then if the source of this id is closest than the previous one
		        if (!this.Index(i, closestIds)[0] && this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[currentClosestId])) {
		          
		        	// Update closest id
		        	currentClosestId = i;
		        }
		    }

		    // Check if it's the source is close enough to be playing
		    if (j < this.nbActiveSources) {

		        // Get the distance between the listener and the source
		        this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]);

		        // Increment 'this.distanceSum'
		        this.distanceSum += this.distanceValue[j];
		    }

		    // Push the id in the closestId attribute
		    closestIds.push(currentClosestId);
	    }

	    // Set the gains and the gains' norm
	    for (let i = 0; i < this.nbActiveSources; i++) {
		    this.gainsData.value[i] = Math.pow((1 - this.distanceValue[i]/this.distanceSum), this.gainsData.exposant);
		    this.gainsData.norm += this.gainsData.value[i];
	    }
	    return (closestIds);
  	}

  	UpdateSourcesPosition(scale, offset) { // Update the positions of sources circles when the window is resized

	    for (let i = 0; i < this.nbSources; i++) {
	      	this.sources[i].style.transform = "translate(" + 
	      		((this.sourcesData.receivers.xyz[i].x - offset.x)*scale) + "px, " + 
	      		((this.sourcesData.receivers.xyz[i].y - offset.y)*scale) + "px)";
    	}
  	}

  	UpdateClosestSourcesColor(index) { // Update source's display depending on listener's position

	    // Set a using value to the source
	    var sourceValue = this.gainsData.value[index]/this.gainsData.norm;

	    this.sources[this.closestSourcesId[index]].style.background = "rgb(0, " + 255*(4*Math.pow(sourceValue, 2)) + ", 0)";
  	}

	Index(pointId, listOfIds) { // Check if an id is in an ids' array and return the corresponding id if it's the case

	    var iterator = 0;
	    while (iterator < listOfIds.length && pointId != listOfIds[iterator]) {
	      iterator += 1;
	    }
	    return ([iterator < listOfIds.length, iterator]);
	}

	Distance(pointA, pointB) { // Get the distance between 2 points

	    if (pointB != undefined) {
	      	return (Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)));
	    }
	    else {
	      	return (Infinity);
		}
  	}

  	UpdateEngines(sourceIndex, adding) { // Update the scheduler to sync new audioSources
  		
		// If we are adding a new audio to sync
  		if (adding) {

  			// Add the syncAudio of the corresponding audioSource and play it at the good time
			const nextTime = Math.ceil(this.sync.getSyncTime());
			this.scheduler.add(this.syncBuffers[sourceIndex], nextTime);
		}
		else {

			// Remove the syncAudio of the audioSource from the scheduler
			if (this.scheduler.has(this.syncBuffers[sourceIndex])) {
				this.scheduler.remove(this.syncBuffers[sourceIndex]);
			}
		}
  	}

  	UpdateEnginesAmbi(sourceIndex, adding) { // Update the scheduler to sync new audioSources (but in ambisonic)
  		if (adding) {

  			// Add the syncAudios of the corresponding audioSource and play them at the good time
			const nextTime = Math.ceil(this.sync.getSyncTime());
			for (let i = 0; i < this.audioSources[sourceIndex].nbFiles; i++) {
				this.scheduler.add(this.syncBuffers[sourceIndex][i], nextTime);
			}
		}
		else {

			// Remove the syncAudios of the audioSource from the scheduler
			for (let i = 0; i < this.audioSources[sourceIndex].nbFiles; i++) {
				if (this.scheduler.has(this.syncBuffers[sourceIndex][i])) {
					this.scheduler.remove(this.syncBuffers[sourceIndex][i]);
				}
			}
		}
  	}
}

export default Sources;