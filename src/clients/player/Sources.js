//////////////////
/// Sources.js ///
//////////////////

import Streaming from './Streaming.js'
import Ambisonic from './Ambisonic.js'
import Convolving from './Convolving.js'
import AmbiConvolving from './AmbiConvolving.js'

import { Scheduler } from 'waves-masters';


class Sources {

	constructor (filesystem, audioBufferLoader, parameters, platform, sync, audioStream) {

	    // Create the datas' storer
	    this.sourcesData;

	    // Get audioContext
	    this.audioContext = parameters.audioContext;

	    // Create the audioBufferLoaders
	    this.audioBufferLoader = audioBufferLoader;

		// Get files
	   	this.filesystem = filesystem;

	   	this.audioStream = audioStream



	    this.platform = platform;
	    this.sync = sync;
	    this.duration = 0
	    this.syncBuffers = []



	    // Global parameters
	    this.nbSources;											// Create the number of sources object
	    this.mode = parameters.mode								// Get the used mode
	    this.circleDiameter = parameters.circleDiameter;		// Get the circles' diameter
	    this.nbActiveSources = parameters.nbClosestSources;		// Get the number of activ sources
	    this.nbDetectSources = parameters.nbClosestPoints;		// Get the number of activ sources
	    this.ambiOrder = parameters.order;						// Get the ambisonic's order
	    this.fileData = {										// Create the fileDatas' storer
	    	File: parameters.dataFileName,
	    	Audio: parameters.audioData
	    }
	    this.audioSources = []									// Store the audioSources (I will then associate a source to each audioSource)
	    this.sources = [];										// Create the array of sources' display's elements

		// Create used variables
	    this.closestSourcesId;									// Array of the closest sources from listener
	    this.audio2Source = [] 							// Associate ths index in 'this.closestSourcesId' to the corresponding audioSource
	    this.distanceValue = [1, 1, 1];							// Distance of each source with listener
	    this.distanceSum = 0;									// Sum of the sources' distance

	    // Set gain's datas
	    this.gainsData = {
	    	Value: [],
	    	Norm: 0,
	    	Exposant: parameters.gainExposant
	    }
	}


	async start (listenerPosition) {


	    const getTimeFunction = () => this.sync.getSyncTime();
	    // Provide a conversion function that allows the scheduler to compute
	    // the audio time from it own scheduling time reference.
	    // As `currentTime` is in the sync time reference we gave in
	    // `getTimeFunction` and that the sync plugin is configured to use
	    // the audio clock as a local reference, we therefore just need to convert
	    // back to the local time.
	    const currentTimeToAudioTimeFunction = currentTime => this.sync.getLocalTime(currentTime);
		// console.log(this.sync.getSyncTime())
	    
	    this.scheduler = new Scheduler(getTimeFunction, {
	      currentTimeToAudioTimeFunction
	    });

	    // console.log(currentTimeToAudioTimeFunction())
	    // console.log(this.scheduler)
	    // console.log(this.sync.getLocalTime(this.sync.getSyncTime()))

		// Add the audioSources depending on the mode chosen
		for (let i = 0; i < this.nbDetectSources; i++) {
		// for (let i = 0; i < 1; i++) {
			this.audio2Source.push(i);
			switch (this.mode) {

				case 'debug':
				case 'streaming':
				console.log(this.nbActiveSources)
					this.audioSources.push(new Streaming(this.audioContext, this.duration, i, this.audioStream, (i < this.nbActiveSources)));
					break;

				case 'ambisonic':
					this.audioSources.push(new Ambisonic(this.audioContext, this.ambiOrder));
					break;

				case 'convolving':
					this.audioSources.push(new Convolving(this.audioContext, this.ambiOrder));
					break;

				case 'ambiConvolving':
					this.audioSources.push(new AmbiConvolving(this.audioContext, this.ambiOrder));
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
    	for (let i = 0; i < this.nbDetectSources; i++) {
    	// for (let i = 0; i < 1; i++) {

    		// Set sources' color for the starting position of the listener
			if (i < this.nbActiveSources) {
				this.UpdateClosestSourcesColor(i);
			}

			// Start sources
			switch (this.mode) {
		    	case 'debug':
		    	case 'streaming':

			    	document.addEventListener("audioLoaded" + i, () => {
			    		console.log("audioDispatched")
			    		if (this.syncBuffers[i] != undefined) {
			    			this.UpdateEngines(i, false);
			    		}
			    		// console.log(this.audioSources[i].GetSyncBuffer())
			    		this.syncBuffers[i] = this.audioSources[i].GetSyncBuffer()
		    			this.UpdateEngines(i, true);
		    		});
		    	
		    		// console.log("hey")
		    		// console.log(this.sourcesData.receivers.files)
		    		// console.log(this.closestSourcesId)
	        		// this.audioSources[i].start(this.audioBufferLoader.data[this.sourcesData.receivers.files[this.closestSourcesId[i]]], this.gainsData.Value[i], this.gainsData.Norm);  	
	        		this.audioSources[i].start(this.sourcesData.receivers.files[this.closestSourcesId[i]], this.gainsData.Value[i], this.gainsData.Norm);  	
			    	this.syncBuffers.push(undefined)
			    	// console.log("rehey")

					break;

		    	case 'ambisonic':
        			this.audioSources[i].start(this.audioBufferLoader.data, this.sourcesData.receivers.files, this.closestSourcesId[i], this.gainsData.Value[i], this.gainsData.Norm);    	
		    		this.UpdateEngines(i, true)
		    		break;

		    	case 'convolving':
        			this.audioSources[i].start(this.audioBufferLoader.data, this.sourcesData.receivers.files, this.closestSourcesId[i], this.gainsData.Value[i], this.gainsData.Norm);    	
		    		this.UpdateEngines(i, true)
		    		break;

		    	case 'ambiConvolving':
        			this.audioSources[i].start(this.audioBufferLoader.data, this.sourcesData.receivers.files, this.closestSourcesId[i], this.gainsData.Value[i], this.gainsData.Norm);    	
		    		this.UpdateEngines(i, true)
		    		break;

				default:
					console.log("no valid mode");
					break;
			}
		}
	}

 //  	LoadSoundbank() { // Load the audio datas to use

 //  		// Get all audio datas
	//     const soundbankTree = this.filesystem.get(this.fileData.Audio);

	//     // Initiate an object to store audios' paths
	//     var defObj = {};

	//     // Get all audio files' paths
	//     soundbankTree.children.forEach(leaf => {
	//       	if (leaf.type === 'file') {
	//         	defObj[leaf.name] = leaf.url;
	//       	}
	//     });

	//     // Load audioBuffer
	//     this.audioBufferLoader.load(defObj, true);

	//     // Set an interval to get the loading state of the audioBuffer and create an event when it's finished
 //    	var loader = setInterval(() => {
 //      		if (this.audioBufferLoader.get('loading')) {
 //      			console.log("loading...");
 //      		}
 //      		else {
 //      			this.sourcesData.receivers.files.forEach(buffer => {
 //      				console.log(this.audioBufferLoader.data[buffer].duration)
 //      				if (this.audioBufferLoader.data[buffer].duration > this.duration) {
 //      					this.duration = this.audioBufferLoader.data[buffer].duration;
 //      				}
 //      			})
 //      			console.log(this.duration)
 //        		console.log("loaded");       
 //        		document.dispatchEvent(new Event("audioLoaded"));
 //        		clearInterval(loader)
 //      		}
 //    	}, 50);
 //  	}

 //  	LoadRirs() { // Load the rirs to use

 //  		// Get all rirs' datas
	//     const rirbankTree = this.filesystem.get(this.fileData.Audio);

	//     // Initiate an object to store audios' paths
	//     var defObj = {};

	//     // Get all rirs' files' paths
	//     rirbankTree.children.forEach(leaf => {
	//       	if (leaf.type === 'file') {
	//         	defObj[leaf.name] = leaf.url;
	//       	}
	//     });

	//     // Get all audio dats
	//     defObj = this.LoadSound4Rirs(defObj);

	//     // Load all audio datas
	//     this.audioBufferLoader.load(defObj, true);

	// 	// Set an interval to get the loading state of the audioBuffer and create an event when it's finished
 //    	var loader = setInterval(() => {
 //      		if (this.audioBufferLoader.get('loading')) {
 //      			console.log("loading...");
 //      		}
 //      		else {
 //        		console.log("loaded");       
 //        		document.dispatchEvent(new Event("audioLoaded"));
 //        		clearInterval(loader)
 //      		}
 //    	}, 50);
	// }

 //  	LoadSound4Rirs(defObj) { // Load audio datas to use with rirs

 //  		// Get all assets
	//     const soundbankTree = this.filesystem.get('Assets');

	//     // Read 'soundbankTree' to find the audio files
	//     soundbankTree.children.forEach(branch => {
	//       	if (branch.type === 'directory') {
	//       		branch.children.forEach(leaf => {
	//         		defObj[leaf.name] = leaf.url;	
	//            	});
	//       	}
	//     });

 //  		return(defObj)
	// }

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

  		// console.log(this.sync.getSyncTime())

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
	    for (let i = 0; i < this.nbDetectSources; i++) {

		    // Check if the id is new in 'this.ClosestPointsId'
		    if (previousClosestSourcesId[i] != this.closestSourcesId[i]) {


		    	// console.warn(i, previousClosestSourcesId)
		    	// console.warn(this.closestSourcesId)

		        // Update the display for sources that are not active  (//Check if the point is the fourth point)
		        if (this.Index(previousClosestSourcesId[i], this.closestSourcesId)[0] || this.Index(previousClosestSourcesId[i], this.closestSourcesId)[1] >= this.nbActiveSources) {
		          	this.sources[previousClosestSourcesId[i]].style.background = "grey";	// Change the color of inactiv sources to grey
			    	this.audioSources[this.audio2Source[i]].ChangePlayingState(false, this.sync.getLocalTime(this.sync.getSyncTime()));
		          	console.log("Source " + i + " is now inactive")
		          	this.audioSources[this.audio2Source[i]].UpdateGain(0, 1);


		          	if (this.Index(previousClosestSourcesId[i], this.closestSourcesId)[0]) {
		          		availableAudioSources.push(this.audio2Source[i]);						// Set the audioSource as waiting for a source
		          	}
		        }

		        // Instantiate 'currentClosestInPrevious': if the sources was in the 'previousClosestSourcesId', it get the index in the array
		        currentClosestInPrevious = this.Index(this.closestSourcesId[i], previousClosestSourcesId);

		        // Check if the sources wasn't in 'previousClosestSourcesId'
		       	if (currentClosestInPrevious[0]) {

		       		// Set the source as waiting for an AudioSource
		          	sources2Attribuate.push([this.closestSourcesId[i], i]);
		        }

		        // If it was, update the association between the source and the audioSource
		        else {

		        	// Change the association between 'this.closestSourceId' and the corresponding Source
		        	tempAudio2Source[i] = this.audio2Source[currentClosestInPrevious[1]];
		        	// console.log(tempAudio2Source)
		        	// console.log(this.audio2Source)
		        	// console.log(currentClosestInPrevious[1])
		        	// console.log(i)
			    	// if (i < this.nbActiveSources) {
			    	// 	console.error("wesh")
			    	// 	this.audioSources[i].ChangePlayingState(true, this.sync.getLocalTime(this.sync.getSyncTime()));
			    	// }
			    	// else {
			    	// 	console.error("dewesh")
			    	// 	this.audioSources[i].ChangePlayingState(false, this.sync.getLocalTime(this.sync.getSyncTime()));
			    	// }
	        	
		        }
		    }
	    }

	    // Store the association's array in the corresponding class' object
	    this.audio2Source = tempAudio2Source.slice();

	    // Variable to store the available audio source's id
	    var audioSourceId;
	    // console.log(availableAudioSources)

	    // Update the audioSources with new Sources ('sources2Attribuate')
	    for (let i = 0; i < availableAudioSources.length; i++) {
	    // for (let i = 0; i < 1; i++) {

	    	// Get the available audio source's id
	    	audioSourceId = availableAudioSources[i];
	    	// console.log(this.audioSources, audioSourceId)
	    	// console.log(sources2Attribuate)
	    	// console.log(sources2Attribuate[i])

	    	// Add a new association between 'this.closestSourceId' and the corresponding Source
	    	this.audio2Source[sources2Attribuate[i][1]] = audioSourceId;

	    	// if (sources2Attribuate[i][1] < this.nbDetectSources) {
	    	// 	this.audioSources[audioSourceId].ChangePlayingState(true, this.sync.getLocalTime(this.sync.getSyncTime()));
	    	// }
	    	// else {
	    	// 	this.audioSources[audioSourceId].ChangePlayingState(false, this.sync.getLocalTime(this.sync.getSyncTime()));
	    	// }

	    	// Update audioSources corresponding to the association ('this.audioSources')
		    switch (this.mode) {
		    	case "debug":
		    	case "streaming":
		    	console.warn("change")
		    		// this.UpdateEngines(audioSourceId, false)
			    	// this.audioSources[audioSourceId].UpdateAudioSource(this.audioBufferLoader.data[this.sourcesData.receivers.files[sources2Attribuate[i][0]]])
			    	this.audioSources[audioSourceId].loadSample(this.sourcesData.receivers.files[sources2Attribuate[i][0]])
			    	// this.UpdateEngines(audioSourceId, true)
		    		break;

		    	case "ambisonic":
		    		this.UpdateEngines(audioSourceId, false)
		    		this.audioSources[audioSourceId].UpdateAudioSource(this.audioBufferLoader.data, this.sourcesData.receivers.files[sources2Attribuate[i][0]])
		    		this.UpdateEngines(audioSourceId, true)
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
	    console.warn("Current closestIds are:")
	    console.warn(this.closestSourcesId)
	    console.log("Current corresponding between AudioSources and Sources in closestSourcesId is :")
	    console.log(this.audio2Source)
	    for (let i = 0; i < this.nbActiveSources; i++) {
	    // for (let i = 0; i < 1; i++) {
		    // console.log(i, this.gainsData)
		    // console.log(this.audio2Source)
		    // console.log(this.Index(i, this.audio2Source))
		    console.log("AudioSource " + this.audio2Source[i] + " is active")
		    this.UpdateClosestSourcesColor(i);
		    this.audioSources[this.audio2Source[i]].ChangePlayingState(true);
		    // if ((this.Index(i, this.audio2Source)[1]) < this.nbActiveSources) {
		    console.log(this.audio2Source[i])
		    // console.log(this.gainsData)
		    this.audioSources[this.audio2Source[i]].UpdateGain(this.gainsData.Value[i], this.gainsData.Norm);
	    	// }
	    	// else {
		    // 	this.audioSources[i].UpdateGain(0, 1);
	    	// }
		}
	   	// console.warn(this.audioSources)
	}

  	ClosestSource(listenerPosition, listOfPoint) { // Get closest sources from the listener
    
	    // Initialising temporary variables;
	    var closestIds = [];
	    var currentClosestId;

	    // Reset the count
	    this.distanceSum = 0;
	    this.gainsData.Norm = 0;

	    // Get the 'nbClosest' closest ids
	    for (let j = 0; j < this.nbDetectSources; j++) {

	      // Set 'undefined' to the currentClosestId to ignore difficulties with initial values
	      currentClosestId = undefined;

	      for (let i = 0; i < listOfPoint.length; i++) {

	        // Check if the id is not already in the closest ids and if the source of this id is closest
	        if (this.Index(i, closestIds)[0] && this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[currentClosestId])) {
	          currentClosestId = i;
	        }
	      }

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
	    console.log("Source " + this.closestSourcesId[index] + " is now colored with the init gainValue:" + sourceValue)
	    this.sources[this.closestSourcesId[index]].style.background = "rgb(0, " + 255*(4*Math.pow(sourceValue, 2)) + ", 0)";
  	}

	Index(pointId, listOfIds) { // Check if an id is not in an ids' array and return the corresponding id if it's not the case

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

  	UpdateEngines(sourceIndex, adding) {
  		// console.log("hello")
  		// console.log(this.audioSources)
  		if (adding) {
			const nextTime = Math.ceil(this.sync.getSyncTime());
			// console.log(this.syncBuffers[sourceIndex], sourceIndex)
			this.scheduler.add(this.syncBuffers[sourceIndex], nextTime);
			// console.log(this.syncBuffers[sourceIndex], sourceIndex)
		}
		else {
			// console.log(this.syncBuffers[sourceIndex], sourceIndex)
			// console.log(this.scheduler.has(this.syncBuffers[sourceIndex]))
			if (this.scheduler.has(this.syncBuffers[sourceIndex])) {
				// console.log("oui")
				this.scheduler.remove(this.syncBuffers[sourceIndex]);
			}
		}
  	}
}

export default Sources;