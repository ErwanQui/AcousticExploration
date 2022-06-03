import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import Listener from './Listener.js'
import Sources from './Sources.js'

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    // Require plugins if needed
    this.audioBufferLoader = this.require('audio-buffer-loader');
    // this.ambisonics = require('ambisonics');
    this.filesystem = this.require('filesystem');

    // Initialisation variables
    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false;

    // Global values
    this.range;                           // Values of the array data (creates in start())
    this.scale;                           // General Scales (initialised in start())
    this.circleDiameter = 20;                 // Sources size
    this.audioData = 'AudioFiles0';       // Set the audio data to use
    this.dataFileName = "scene2.json";
    this.jsonObj;
    this.jsonObjloaded;
    // this.dataLoaded = false;

    // Positions of the sources
    this.truePositions = [];

    // Sounds of the sources
    this.audioFilesName = [];



    this.ClosestPointsId = [];                  // Ids of closest Sources
    this.previousClosestPointsId = [];          // Ids of previous closest Sources
    this.nbClosestPoints = 4;                   // Number of avtive sources
    this.positions = [];                        // Array of sources positions (built in start())
    this.nbPos;     // Number of Sources
    this.distanceValue = [0, 0, 0, 0];          // Distance of closest Sources
    this.distanceSum = 0;                       // Sum of distances of closest Sources
    this.gainsValue = [1, 1, 1];                // Array of Gains
    this.gainNorm = 0;                          // Norm of the Gains
    this.gainExposant = 4;                      // Esposant to increase Gains' gap

    this.container;
    // // Creating AudioContext
    // this.audioContext = new AudioContext();
    // this.playingSounds = [];                    // BufferSources
    // this.gains = [];                            // Gains

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();
    // // Load all Datas
    // await this.loadData();

    // // Creating Gains
    // for (let i = 0; i < this.nbClosestPoints; i++) {
    //   this.gains.push(await this.audioContext.createGain());
    // }

    // Wait json data to be loaded (an event is dispatch by 'loadData()')
    // document.addEventListener("dataLoaded", () => {

      // Update data values
      // this.truePositions = this.jsonObj.receivers.xyz;
      // this.audioFilesName = this.jsonObj.receivers.files;
      // this.nbPos = this.truePositions.length;

      // // Initialising of Sources positions data
      // for (let i = 0; i < this.nbPos; i++) {
      //   this.positions.push({x: this.truePositions[i][0], y:this.truePositions[i][1]});
      // }

      // Creating 'this.range'


      // Initialising User's Position
      // this.listenerPosition.x = this.range.moyX;
      // this.listenerPosition.y = this.range.minY;
      this.Sources = new Sources(this.filesystem, this.audioBufferLoader)
      console.log(this.filesystem)
      this.Sources.LoadData(this.dataFileName);
      this.Sources.LoadSoundbank(this.audioData);
      // this.Sources.start()

      document.addEventListener("dataLoaded", () => {

        console.log(this.Sources.sourcesData)

        this.positions = this.Sources.sourcesData.receivers.xyz;
        this.audioFilesName = this.Sources.sourcesData.receivers.files;
        this.nbPos = this.truePositions.length;

        // Initialising of Sources positions data
        // for (let i = 0; i < this.nbPos; i++) {
        //   this.positions.push({x: this.truePositions[i][0], y:this.truePositions[i][1]});
        // }

        this.Range(this.positions);

        // Initialising 'this.scale'
        this.scale = this.Scaling(this.range);
        // this.Sources.UpdateScale(this.scale)

        this.offset = {
          x: this.range.moyX,
          y: this.range.minY
        }

        // console.log("hhhhh")
        this.Listener = new Listener(this.offset, )
        this.Listener.start();
        this.Sources.start(this.Listener.listenerPosition)

        // console.log("hyyyyy")

        // Initialising Closest Points
        // this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);

        // subscribe to display loading state
        // this.audioBufferLoader.subscribe(() => this.render());

        // Add Event listener for resize Window event to resize the display
        window.addEventListener('resize', () => {
          this.scale = this.Scaling(this.range);      // Change the scale
          // this.Sources.UpdateScale(this.scale);
          if (this.beginPressed) {                    // Check the begin State
            this.UpdateContainer();                   // Resize the display
          }

          // Display
          this.render();
      });
        this.render();
    });

    // // init with current content
    // await this.loadSoundbank();
  }

  Range(positions) { // Store the array properties in 'this.range'
    this.range = {
      minX: positions[0].x,
      maxX: positions[0].x,
      minY: positions[0].y, 
      maxY: positions[0].y,
    };
    for (let i = 1; i < positions.length; i++) {
      if (positions[i].x < this.range.minX) {
        this.range.minX = positions[i].x;
      }
      if (positions[i].x > this.range.maxX) {
        this.range.maxX = positions[i].x;
      }
      if (positions[i].y < this.range.minY) {
        this.range.minY = positions[i].y;
      }
      if (positions[i].y > this.range.maxY) {
        this.range.maxY = positions[i].y;
      }
    }
    this.range.moyX = (this.range.maxX + this.range.minX)/2;
    this.range.moyY = (this.range.maxY + this.range.minY)/2;
    this.range.rangeX = this.range.maxX - this.range.minX;
    this.range.rangeY = this.range.maxY - this.range.minY;
  }

  Scaling(rangeValues) { // Store the greatest scale to display all the elements in 'this.scale'
    var scale = Math.min((window.innerWidth - this.circleDiameter)/rangeValues.rangeX, (window.innerHeight - this.circleDiameter)/rangeValues.rangeY);
    return (scale);
  }

  // loadSoundbank() { // Load the audioData to use
  //   const soundbankTree = this.filesystem.get(this.audioData);
  //   const defObj = {};
  //   soundbankTree.children.forEach(leaf => {
  //     if (leaf.type === 'file') {
  //       defObj[leaf.name] = leaf.url;
  //     }
  //   });
  //   this.audioBufferLoader.load(defObj, true);
  // }

  // loadData() { // Load the data
  //   const data = this.filesystem.get('Position');

  //   // Check files to get config
  //   data.children.forEach(leaf => {
  //     if (leaf.name === this.dataFileName) {

  //       // Creating the data receiver (I need to use the 'leaf.url' to read the json)
  //       var jsonData = new XMLHttpRequest();

  //       // Wait the json file to be loaded
  //       jsonData.addEventListener("load", () => {

  //         // Get the text from data
  //         var jsonText = JSON.stringify(jsonData.responseText);
            
  //         // Modify the text to be usable for an object
  //         jsonText = jsonText.replaceAll(/[/][/][ \w'"]+/g,'');
  //         jsonText = jsonText.replaceAll('\\n', '');
  //         jsonText = jsonText.replace(/^./,'');
  //         jsonText = jsonText.replace(/.$/,'');
  //         jsonText = jsonText.replaceAll('\\','');
  //         jsonText = jsonText.replaceAll('.0','');

  //         // Create the data object
  //         this.jsonObj = JSON.parse(jsonText);

  //         // Dispatch an event to inform that the data has been loaded
  //         document.dispatchEvent(new Event("dataLoaded"));
  //         }, false);

  //       // Get the data of the json from the 'leaf.url'
  //       jsonData.open("get", leaf.url, true);
  //       jsonData.send();
  //     }
  //   });
  // }

  render() {
    // console.log("render")
    // Debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {

      // const loading = this.audioBufferLoader.get('loading');
      const loading = false;

      // Begin the render only when audioData ara loaded
      if (!loading) {
        render(html`
          <div id="begin">
            <div style="padding: 20px">
              <h1 style="margin: 20px 0">${this.client.type} [id: ${this.client.id}]</h1>
            </div>
            <div>
              <input type="button" id="beginButton" value="Begin Game"/>
            </div>
          </div>
          <div id="game" style="visibility: hidden;">
            <div id="circleContainer" style="text-align: center; position: absolute; left: 50%">
              <div id="selector" style="position: absolute;
                height: ${this.range.rangeY*this.scale}px;
                width: ${this.range.rangeX*this.scale}px;
                background: yellow; z-index: 0;
                transform: translate(${(-this.range.rangeX*this.scale)/2}px, ${this.circleDiameter/2}px);">
              </div>
              
            </div>
          </div>
        `, this.$container);

        // Do this only at beginning
        if (this.initialising) {
          // Assign callbacks once
          var beginButton = document.getElementById("beginButton");

          beginButton.addEventListener("click", () => {
            // Change the display to begin the simulation
            document.getElementById("begin").style.visibility = "hidden";
            document.getElementById("begin").style.position = "absolute";
            document.getElementById("game").style.visibility = "visible";

            // Create circles to display Sources

            // Assign mouse and touch callbacks to change the user Position
            this.container = document.getElementById('circleContainer');

            this.onBeginButtonClicked()

            // Using mouse
            this.container.addEventListener("mousedown", (mouse) => {
              this.mouseDown = true;
              this.userAction(mouse);
            }, false);
            this.container.addEventListener("mousemove", (mouse) => {
              if (this.mouseDown) {
                this.userAction(mouse);
              }
            }, false);
            this.container.addEventListener("mouseup", (mouse) => {
              this.mouseDown = false;
            }, false);

            // Using touch
            this.container.addEventListener("touchstart", (evt) => {
              this.touched = true;
              console.log(evt.changedTouches[0])
              this.userAction(evt.changedTouches[0]);
            }, false);
            this.container.addEventListener("touchmove", (evt) => {
              if (this.touched) {
                this.userAction(evt.changedTouches[0]);
              }
            }, false);
            this.container.addEventListener("touchend", (evt) => {
              this.touched = false;
            }, false);            

            // Initialising audioNodes
            // for (let i = 0; i < this.nbClosestPoints; i++) {
            //   this.playingSounds.push(this.LoadNewSound(this.audioBufferLoader.data[this.audioFilesName[this.ClosestPointsId[i]]], i));
            //   this.gains[i].connect(this.audioContext.destination);
            //   if (i != this.nbClosestPoints - 1) {
            //     this.playingSounds[i].start();
            //   }
            // }

            // // Get all the data and set the display to begin
            // this.PositionChanged(); 

            this.beginPressed = true;         // Update begin State 
          });
          this.initialising = false;          // Update initialising State
        }
      }
    });
  }

  onBeginButtonClicked() { // Begin AudioContext and add the Sources display to the display

    // Begin AudioContext
    // this.audioContext.resume();

    // Initialising a temporary circle
    // var tempCircle;
    this.Sources.CreateSources(this.container, this.scale, this.offset);
    this.Listener.Display(this.container);
    this.render();
    console.log(this.container)
    // console.lof
    // // Create the circle for the Sources
    // for (let i = 0; i < this.positions.length; i++) {     // foreach Sources
    //   tempCircle = document.createElement('div');         // Create a new element
    //   tempCircle.id = "circle" + i;                       // Set the circle id
    //   tempCircle.innerHTML = i + 1;                       // Set the circle value (i+1)

    //   // Change form and position of the element to get a circle at the good place;
    //   tempCircle.style = "position: absolute; margin: 0 -10px; width: " + this.circleSize + "px; height: " + this.circleSize + "px; border-radius:" + this.circleSize + "px; line-height: " + this.circleSize + "px; background: grey;";
    //   tempCircle.style.transform = "translate(" + ((this.positions[i].x - this.range.moyX)*this.scale.VPos2Pixel) + "px, " + ((this.positions[i].y - this.range.minY)*this.scale.VPos2Pixel) + "px)";
      
    //   // Add the circle to the display
    //   container.appendChild(tempCircle);
    // }
  }

  userAction(mouse) { // Change Listener's Position when the mouse has been used
  // console.log("bonjour")
    // Get the new potential Listener's Position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth/2)/(this.scale);
    var tempY = this.range.minY + (mouse.clientY - this.circleDiameter/2)/(this.scale);
    // console.log(tempX, tempY)
    // Check if the value is in the values range
    if (tempX >= this.range.minX && tempX <= this.range.maxX && tempY >= this.range.minY && tempY <= this.range.maxY) {
      // console.log("ici")
      // Set the value to the Listener's Position
      // this.listenerPosition.x = this.offset.x + (mouse.clientX - window.innerWidth/2)/(this.scale);
      // this.listenerPosition.y = this.offset.y + (mouse.clientY - this.circleSize/2)/(this.scale);

      // Update Listener
      this.Listener.UpdateListener(mouse, this.offset, this.scale, this.circleDiameter/2);
      this.Sources.onListenerPositionChanged(this.Listener.listenerPosition);
      // console.log(this.Listener.listenerPosition)
      this.render();
    }
    else {
      // When the value is out of range, stop the Listener's Position Update
      this.mouseDown = false;
      this.touched = false;
    }
  }

  UpdateContainer() { // Change the display when the window is resized

    // Change size
    document.getElementById("circleContainer").height = (this.range.rangeY*this.scale.VPos2Pixel) + "px";
    document.getElementById("circleContainer").width = (this.range.rangeX*this.scale.VPos2Pixel) + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.circleSize/2 - this.range.rangeX*this.scale.VPos2Pixel/2) + "px, 10px)";
    
    // this.UpdateListener();            // Update Listener
    this.Sources.UpdateSourcesPosition(this.scale, this.offset);     // Update Sources' display
  }

  // UpdateListener() { // Update Listener

  //   // Update Listener's dipslay
  //   document.getElementById("listener").style.transform = "translate(" + ((this.listenerPosition.x - this.range.moyX)*this.scale.VPos2Pixel - this.circleSize/2) + "px, " + ((this.listenerPosition.y - this.range.minY)*this.scale.VPos2Pixel) + "px) rotate(45deg)";
    
  //   // Update the display for the current Position of Listener
  //   this.PositionChanged();  
  // }

  // PositionChanged() { // Update the closest Sources to use when Listener's Position changed

  //   // Initialising variables
  //   this.previousClosestPointsId = this.ClosestPointsId;

  //   // Update the closest Points
  //   this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);
    
  //   // Check all the new closest Points
  //   for (let i = 0; i < this.nbClosestPoints - 1; i++) {

  //     // Check if the Id is new in 'this.ClosestPointsId'
  //     if (this.previousClosestPointsId[i] != this.ClosestPointsId[i]) {

  //       // Update the Display for Sources that are not active
  //       if (this.NotIn(this.previousClosestPointsId[i], this.ClosestPointsId) || this.previousClosestPointsId[i] == this.ClosestPointsId[this.nbClosestPoints - 1]) {
  //         document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "grey";
  //       }

  //       this.playingSounds[i].stop();                         // Stop the previous Source
  //       this.playingSounds[i].disconnect(this.gains[i]);      // Disconnect the Source from the audio

  //       // Update the new Sound for the new Sources
  //       this.playingSounds[i] = this.LoadNewSound(this.audioBufferLoader.data[this.audioFilesName[this.ClosestPointsId[i]]], i);
  //       this.playingSounds[i].start();                        // Start the new Source
  //     }

  //   // Update Source parameters
  //   this.UpdateSourcesSound(i);
  //   }
  // }  

  // UpdateSourcesPosition() { // Update the Positions of circles when window is resized
  //   for (let i = 0; i < this.positions.length; i++) {
  //     document.getElementById("circle" + i).style.transform = "translate(" + ((this.positions[i].x - this.range.moyX)*this.scale.VPos2Pixel) + "px, " + ((this.positions[i].y - this.range.minY)*this.scale.VPos2Pixel) + "px)";
  //   }
  // }

  // UpdateSourcesSound(index) { // Update Gain and Display of the Source depending on Listener's Position

  //   // Set a using value to the Source
  //   var sourceValue = this.gainsValue[index]/this.gainNorm;

  //   // Update the Display of the Source
  //   document.getElementById("circle" + this.ClosestPointsId[index]).style.background = "rgb(0, " + 255*(4*Math.pow(sourceValue, 2)) + ", 0)";
    
  //   // Update the Gain of the Source
  //   this.gains[index].gain.setValueAtTime(sourceValue, 0);
  // }

  // ClosestSource(listenerPosition, listOfPoint, nbClosest) { // get closest Sources to the Listener
    
  //   // Initialising temporary variables;
  //   var closestIds = [];
  //   var currentClosestId;

  //   // Reset Count
  //   this.distanceSum = 0;
  //   this.gainNorm = 0;

  //   // Get the 'nbClosest' closest Ids
  //   for (let j = 0; j < nbClosest; j++) {

  //     // Set 'undefined' to the currentClosestId to ignore difficulties with initial values
  //     currentClosestId = undefined;

  //     for (let i = 0; i < listOfPoint.length; i++) {

  //       // Check if the Id is not already in the closest Ids and if the Source of this Id is closest
  //       if (this.NotIn(i, closestIds) && this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[currentClosestId])) {
  //         currentClosestId = i;
  //       }
  //     }

  //     if (j != nbClosest - 1) {
  //       // Get the distance between the Listener and the Source
  //       this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]);

  //       // Increment 'this.distanceSum'
  //       this.distanceSum += this.distanceValue[j];
  //     }

  //     // Push the Id in the closest
  //     closestIds.push(currentClosestId);
  //   }

  //   // Set the Gains and the Gains norm
  //   for (let i = 0; i < this.gainsValue.length; i++) {
  //     this.gainsValue[i] = Math.pow((1 - this.distanceValue[i]/this.distanceSum), this.gainExposant);
  //     this.gainNorm += this.gainsValue[i];
  //   }

  //   return (closestIds);
  // }

  // NotIn(pointId, listOfIds) { // Check if an Id is not in an Ids' array
  //   var iterator = 0;
  //   while (iterator < listOfIds.length && pointId != listOfIds[iterator]) {
  //     iterator += 1;
  //   }
  //   return(iterator >= listOfIds.length);
  // }

  // Distance(pointA, pointB) { // Get the distance between 2 points
  //   if (pointB != undefined) {
  //     return (Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)));
  //   }
  //   else {
  //     return (Infinity);
  //   }
  // }

  // LoadNewSound(buffer, index) { // Create and link the sound to the AudioContext
  //   // Sound initialisation
  //   var sound = this.audioContext.createBufferSource();   // Create the sound
  //   sound.loop = true;                                    // Set the sound to loop
  //   sound.buffer = buffer;                                // Set the sound buffer
  //   sound.connect(this.gains[index]);                     // Connect the sound to the other nodes
  //   return (sound);
  // }
}

export default PlayerExperience;