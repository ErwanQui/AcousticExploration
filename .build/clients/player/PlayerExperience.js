"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _client = require("@soundworks/core/client");

var _litHtml = require("lit-html");

var _renderInitializationScreens = _interopRequireDefault(require("@soundworks/template-helpers/client/render-initialization-screens.js"));

var _Listener = _interopRequireDefault(require("./Listener.js"));

var _Sources = _interopRequireDefault(require("./Sources.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PlayerExperience extends _client.AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);
    this.config = config;
    this.$container = $container;
    this.rafId = null; // Require plugins if needed

    this.audioBufferLoader = this.require('audio-buffer-loader'); // this.ambisonics = require('ambisonics');

    this.filesystem = this.require('filesystem'); // Initialisation variables

    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false; // Global values

    this.range; // Values of the array data (creates in start())

    this.scale; // General Scales (initialised in start())

    this.circleDiameter = 20; // Sources size

    this.audioData = 'AudioFiles0'; // Set the audio data to use

    this.dataFileName = "scene2.json";
    this.jsonObj;
    this.jsonObjloaded; // this.dataLoaded = false;
    // Positions of the sources

    this.truePositions = []; // Sounds of the sources

    this.audioFilesName = [];
    this.ClosestPointsId = []; // Ids of closest Sources

    this.previousClosestPointsId = []; // Ids of previous closest Sources

    this.nbClosestPoints = 4; // Number of avtive sources

    this.positions = []; // Array of sources positions (built in start())

    this.nbPos; // Number of Sources

    this.distanceValue = [0, 0, 0, 0]; // Distance of closest Sources

    this.distanceSum = 0; // Sum of distances of closest Sources

    this.gainsValue = [1, 1, 1]; // Array of Gains

    this.gainNorm = 0; // Norm of the Gains

    this.gainExposant = 4; // Esposant to increase Gains' gap

    this.container; // // Creating AudioContext
    // this.audioContext = new AudioContext();
    // this.playingSounds = [];                    // BufferSources
    // this.gains = [];                            // Gains

    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    super.start(); // // Load all Datas
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

    this.Sources = new _Sources.default(this.filesystem, this.audioBufferLoader);
    console.log(this.filesystem);
    this.Sources.LoadData(this.dataFileName);
    this.Sources.LoadSoundbank(this.audioData); // this.Sources.start()

    document.addEventListener("dataLoaded", () => {
      console.log(this.Sources.sourcesData);
      this.positions = this.Sources.sourcesData.receivers.xyz;
      this.audioFilesName = this.Sources.sourcesData.receivers.files;
      this.nbPos = this.truePositions.length; // Initialising of Sources positions data
      // for (let i = 0; i < this.nbPos; i++) {
      //   this.positions.push({x: this.truePositions[i][0], y:this.truePositions[i][1]});
      // }

      this.Range(this.positions); // Initialising 'this.scale'

      this.scale = this.Scaling(this.range); // this.Sources.UpdateScale(this.scale)

      this.offset = {
        x: this.range.moyX,
        y: this.range.minY
      }; // console.log("hhhhh")

      this.Listener = new _Listener.default(this.offset);
      this.Listener.start();
      this.Sources.start(this.Listener.listenerPosition); // console.log("hyyyyy")
      // Initialising Closest Points
      // this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);
      // subscribe to display loading state
      // this.audioBufferLoader.subscribe(() => this.render());
      // Add Event listener for resize Window event to resize the display

      window.addEventListener('resize', () => {
        this.scale = this.Scaling(this.range); // Change the scale
        // this.Sources.UpdateScale(this.scale);

        if (this.beginPressed) {
          // Check the begin State
          this.UpdateContainer(); // Resize the display
        } // Display


        this.render();
      });
      this.render();
    }); // // init with current content
    // await this.loadSoundbank();
  }

  Range(positions) {
    // Store the array properties in 'this.range'
    this.range = {
      minX: positions[0].x,
      maxX: positions[0].x,
      minY: positions[0].y,
      maxY: positions[0].y
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

    this.range.moyX = (this.range.maxX + this.range.minX) / 2;
    this.range.moyY = (this.range.maxY + this.range.minY) / 2;
    this.range.rangeX = this.range.maxX - this.range.minX;
    this.range.rangeY = this.range.maxY - this.range.minY;
  }

  Scaling(rangeValues) {
    // Store the greatest scale to display all the elements in 'this.scale'
    var scale = Math.min((window.innerWidth - this.circleDiameter) / rangeValues.rangeX, (window.innerHeight - this.circleDiameter) / rangeValues.rangeY);
    return scale;
  } // loadSoundbank() { // Load the audioData to use
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
      const loading = false; // Begin the render only when audioData ara loaded

      if (!loading) {
        (0, _litHtml.render)((0, _litHtml.html)`
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
                height: ${this.range.rangeY * this.scale}px;
                width: ${this.range.rangeX * this.scale}px;
                background: yellow; z-index: 0;
                transform: translate(${-this.range.rangeX * this.scale / 2}px, ${this.circleDiameter / 2}px);">
              </div>
              
            </div>
          </div>
        `, this.$container); // Do this only at beginning

        if (this.initialising) {
          // Assign callbacks once
          var beginButton = document.getElementById("beginButton");
          beginButton.addEventListener("click", () => {
            // Change the display to begin the simulation
            document.getElementById("begin").style.visibility = "hidden";
            document.getElementById("begin").style.position = "absolute";
            document.getElementById("game").style.visibility = "visible"; // Create circles to display Sources
            // Assign mouse and touch callbacks to change the user Position

            this.container = document.getElementById('circleContainer');
            this.onBeginButtonClicked(); // Using mouse

            this.container.addEventListener("mousedown", mouse => {
              this.mouseDown = true;
              this.userAction(mouse);
            }, false);
            this.container.addEventListener("mousemove", mouse => {
              if (this.mouseDown) {
                this.userAction(mouse);
              }
            }, false);
            this.container.addEventListener("mouseup", mouse => {
              this.mouseDown = false;
            }, false); // Using touch

            this.container.addEventListener("touchstart", evt => {
              this.touched = true;
              console.log(evt.changedTouches[0]);
              this.userAction(evt.changedTouches[0]);
            }, false);
            this.container.addEventListener("touchmove", evt => {
              if (this.touched) {
                this.userAction(evt.changedTouches[0]);
              }
            }, false);
            this.container.addEventListener("touchend", evt => {
              this.touched = false;
            }, false); // Initialising audioNodes
            // for (let i = 0; i < this.nbClosestPoints; i++) {
            //   this.playingSounds.push(this.LoadNewSound(this.audioBufferLoader.data[this.audioFilesName[this.ClosestPointsId[i]]], i));
            //   this.gains[i].connect(this.audioContext.destination);
            //   if (i != this.nbClosestPoints - 1) {
            //     this.playingSounds[i].start();
            //   }
            // }
            // // Get all the data and set the display to begin
            // this.PositionChanged(); 

            this.beginPressed = true; // Update begin State 
          });
          this.initialising = false; // Update initialising State
        }
      }
    });
  }

  onBeginButtonClicked() {
    // Begin AudioContext and add the Sources display to the display
    // Begin AudioContext
    // this.audioContext.resume();
    // Initialising a temporary circle
    // var tempCircle;
    this.Sources.CreateSources(this.container, this.scale, this.offset);
    this.Listener.Display(this.container);
    this.render();
    console.log(this.container); // console.lof
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

  userAction(mouse) {
    // Change Listener's Position when the mouse has been used
    // console.log("bonjour")
    // Get the new potential Listener's Position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale;
    var tempY = this.range.minY + (mouse.clientY - this.circleDiameter / 2) / this.scale; // console.log(tempX, tempY)
    // Check if the value is in the values range

    if (tempX >= this.range.minX && tempX <= this.range.maxX && tempY >= this.range.minY && tempY <= this.range.maxY) {
      // console.log("ici")
      // Set the value to the Listener's Position
      // this.listenerPosition.x = this.offset.x + (mouse.clientX - window.innerWidth/2)/(this.scale);
      // this.listenerPosition.y = this.offset.y + (mouse.clientY - this.circleSize/2)/(this.scale);
      // Update Listener
      this.Listener.UpdateListener(mouse, this.offset, this.scale, this.circleDiameter / 2);
      this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // console.log(this.Listener.listenerPosition)

      this.render();
    } else {
      // When the value is out of range, stop the Listener's Position Update
      this.mouseDown = false;
      this.touched = false;
    }
  }

  UpdateContainer() {
    // Change the display when the window is resized
    // Change size
    document.getElementById("circleContainer").height = this.range.rangeY * this.scale.VPos2Pixel + "px";
    document.getElementById("circleContainer").width = this.range.rangeX * this.scale.VPos2Pixel + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.circleSize / 2 - this.range.rangeX * this.scale.VPos2Pixel / 2) + "px, 10px)"; // this.UpdateListener();            // Update Listener

    this.Sources.UpdateSourcesPosition(this.scale, this.offset); // Update Sources' display
  } // UpdateListener() { // Update Listener
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

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsInJhbmdlIiwic2NhbGUiLCJjaXJjbGVEaWFtZXRlciIsImF1ZGlvRGF0YSIsImRhdGFGaWxlTmFtZSIsImpzb25PYmoiLCJqc29uT2JqbG9hZGVkIiwidHJ1ZVBvc2l0aW9ucyIsImF1ZGlvRmlsZXNOYW1lIiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJuYlBvcyIsImRpc3RhbmNlVmFsdWUiLCJkaXN0YW5jZVN1bSIsImdhaW5zVmFsdWUiLCJnYWluTm9ybSIsImdhaW5FeHBvc2FudCIsImNvbnRhaW5lciIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiU291cmNlcyIsImNvbnNvbGUiLCJsb2ciLCJMb2FkRGF0YSIsIkxvYWRTb3VuZGJhbmsiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJzb3VyY2VzRGF0YSIsInJlY2VpdmVycyIsInh5eiIsImZpbGVzIiwibGVuZ3RoIiwiUmFuZ2UiLCJTY2FsaW5nIiwib2Zmc2V0IiwieCIsIm1veVgiLCJ5IiwibWluWSIsIkxpc3RlbmVyIiwibGlzdGVuZXJQb3NpdGlvbiIsIndpbmRvdyIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiaHRtbCIsInR5cGUiLCJpZCIsImJlZ2luQnV0dG9uIiwiZ2V0RWxlbWVudEJ5SWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbiIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwibW91c2UiLCJ1c2VyQWN0aW9uIiwiZXZ0IiwiY2hhbmdlZFRvdWNoZXMiLCJDcmVhdGVTb3VyY2VzIiwiRGlzcGxheSIsInRlbXBYIiwiY2xpZW50WCIsInRlbXBZIiwiY2xpZW50WSIsIlVwZGF0ZUxpc3RlbmVyIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsImhlaWdodCIsIlZQb3MyUGl4ZWwiLCJ3aWR0aCIsInRyYW5zZm9ybSIsImNpcmNsZVNpemUiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcbmltcG9ydCBTb3VyY2VzIGZyb20gJy4vU291cmNlcy5qcydcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7XG4gICAgLy8gdGhpcy5hbWJpc29uaWNzID0gcmVxdWlyZSgnYW1iaXNvbmljcycpO1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpO1xuXG4gICAgLy8gSW5pdGlhbGlzYXRpb24gdmFyaWFibGVzXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcblxuICAgIC8vIEdsb2JhbCB2YWx1ZXNcbiAgICB0aGlzLnJhbmdlOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhbHVlcyBvZiB0aGUgYXJyYXkgZGF0YSAoY3JlYXRlcyBpbiBzdGFydCgpKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYWxpc2VkIGluIHN0YXJ0KCkpXG4gICAgdGhpcy5jaXJjbGVEaWFtZXRlciA9IDIwOyAgICAgICAgICAgICAgICAgLy8gU291cmNlcyBzaXplXG4gICAgdGhpcy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczAnOyAgICAgICAvLyBTZXQgdGhlIGF1ZGlvIGRhdGEgdG8gdXNlXG4gICAgdGhpcy5kYXRhRmlsZU5hbWUgPSBcInNjZW5lMi5qc29uXCI7XG4gICAgdGhpcy5qc29uT2JqO1xuICAgIHRoaXMuanNvbk9iamxvYWRlZDtcbiAgICAvLyB0aGlzLmRhdGFMb2FkZWQgPSBmYWxzZTtcblxuICAgIC8vIFBvc2l0aW9ucyBvZiB0aGUgc291cmNlc1xuICAgIHRoaXMudHJ1ZVBvc2l0aW9ucyA9IFtdO1xuXG4gICAgLy8gU291bmRzIG9mIHRoZSBzb3VyY2VzXG4gICAgdGhpcy5hdWRpb0ZpbGVzTmFtZSA9IFtdO1xuXG5cblxuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gW107ICAgICAgICAgICAgICAgICAgLy8gSWRzIG9mIGNsb3Nlc3QgU291cmNlc1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTsgICAgICAgICAgLy8gSWRzIG9mIHByZXZpb3VzIGNsb3Nlc3QgU291cmNlc1xuICAgIHRoaXMubmJDbG9zZXN0UG9pbnRzID0gNDsgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGF2dGl2ZSBzb3VyY2VzXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBbXTsgICAgICAgICAgICAgICAgICAgICAgICAvLyBBcnJheSBvZiBzb3VyY2VzIHBvc2l0aW9ucyAoYnVpbHQgaW4gc3RhcnQoKSlcbiAgICB0aGlzLm5iUG9zOyAgICAgLy8gTnVtYmVyIG9mIFNvdXJjZXNcbiAgICB0aGlzLmRpc3RhbmNlVmFsdWUgPSBbMCwgMCwgMCwgMF07ICAgICAgICAgIC8vIERpc3RhbmNlIG9mIGNsb3Nlc3QgU291cmNlc1xuICAgIHRoaXMuZGlzdGFuY2VTdW0gPSAwOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU3VtIG9mIGRpc3RhbmNlcyBvZiBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLmdhaW5zVmFsdWUgPSBbMSwgMSwgMV07ICAgICAgICAgICAgICAgIC8vIEFycmF5IG9mIEdhaW5zXG4gICAgdGhpcy5nYWluTm9ybSA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3JtIG9mIHRoZSBHYWluc1xuICAgIHRoaXMuZ2FpbkV4cG9zYW50ID0gNDsgICAgICAgICAgICAgICAgICAgICAgLy8gRXNwb3NhbnQgdG8gaW5jcmVhc2UgR2FpbnMnIGdhcFxuXG4gICAgdGhpcy5jb250YWluZXI7XG4gICAgLy8gLy8gQ3JlYXRpbmcgQXVkaW9Db250ZXh0XG4gICAgLy8gdGhpcy5hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgLy8gdGhpcy5wbGF5aW5nU291bmRzID0gW107ICAgICAgICAgICAgICAgICAgICAvLyBCdWZmZXJTb3VyY2VzXG4gICAgLy8gdGhpcy5nYWlucyA9IFtdOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHYWluc1xuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuICAgIHN1cGVyLnN0YXJ0KCk7XG4gICAgLy8gLy8gTG9hZCBhbGwgRGF0YXNcbiAgICAvLyBhd2FpdCB0aGlzLmxvYWREYXRhKCk7XG5cbiAgICAvLyAvLyBDcmVhdGluZyBHYWluc1xuICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgIC8vICAgdGhpcy5nYWlucy5wdXNoKGF3YWl0IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKSk7XG4gICAgLy8gfVxuXG4gICAgLy8gV2FpdCBqc29uIGRhdGEgdG8gYmUgbG9hZGVkIChhbiBldmVudCBpcyBkaXNwYXRjaCBieSAnbG9hZERhdGEoKScpXG4gICAgLy8gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRhdGFMb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICAvLyBVcGRhdGUgZGF0YSB2YWx1ZXNcbiAgICAgIC8vIHRoaXMudHJ1ZVBvc2l0aW9ucyA9IHRoaXMuanNvbk9iai5yZWNlaXZlcnMueHl6O1xuICAgICAgLy8gdGhpcy5hdWRpb0ZpbGVzTmFtZSA9IHRoaXMuanNvbk9iai5yZWNlaXZlcnMuZmlsZXM7XG4gICAgICAvLyB0aGlzLm5iUG9zID0gdGhpcy50cnVlUG9zaXRpb25zLmxlbmd0aDtcblxuICAgICAgLy8gLy8gSW5pdGlhbGlzaW5nIG9mIFNvdXJjZXMgcG9zaXRpb25zIGRhdGFcbiAgICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYlBvczsgaSsrKSB7XG4gICAgICAvLyAgIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IHRoaXMudHJ1ZVBvc2l0aW9uc1tpXVswXSwgeTp0aGlzLnRydWVQb3NpdGlvbnNbaV1bMV19KTtcbiAgICAgIC8vIH1cblxuICAgICAgLy8gQ3JlYXRpbmcgJ3RoaXMucmFuZ2UnXG5cblxuICAgICAgLy8gSW5pdGlhbGlzaW5nIFVzZXIncyBQb3NpdGlvblxuICAgICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzLnJhbmdlLm1veVg7XG4gICAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHRoaXMucmFuZ2UubWluWTtcbiAgICAgIHRoaXMuU291cmNlcyA9IG5ldyBTb3VyY2VzKHRoaXMuZmlsZXN5c3RlbSwgdGhpcy5hdWRpb0J1ZmZlckxvYWRlcilcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSh0aGlzLmRhdGFGaWxlTmFtZSk7XG4gICAgICB0aGlzLlNvdXJjZXMuTG9hZFNvdW5kYmFuayh0aGlzLmF1ZGlvRGF0YSk7XG4gICAgICAvLyB0aGlzLlNvdXJjZXMuc3RhcnQoKVxuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgY29uc29sZS5sb2codGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhKVxuXG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnJlY2VpdmVycy54eXo7XG4gICAgICAgIHRoaXMuYXVkaW9GaWxlc05hbWUgPSB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLmZpbGVzO1xuICAgICAgICB0aGlzLm5iUG9zID0gdGhpcy50cnVlUG9zaXRpb25zLmxlbmd0aDtcblxuICAgICAgICAvLyBJbml0aWFsaXNpbmcgb2YgU291cmNlcyBwb3NpdGlvbnMgZGF0YVxuICAgICAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJQb3M7IGkrKykge1xuICAgICAgICAvLyAgIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IHRoaXMudHJ1ZVBvc2l0aW9uc1tpXVswXSwgeTp0aGlzLnRydWVQb3NpdGlvbnNbaV1bMV19KTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHRoaXMuUmFuZ2UodGhpcy5wb3NpdGlvbnMpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpc2luZyAndGhpcy5zY2FsZSdcbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcbiAgICAgICAgLy8gdGhpcy5Tb3VyY2VzLlVwZGF0ZVNjYWxlKHRoaXMuc2NhbGUpXG5cbiAgICAgICAgdGhpcy5vZmZzZXQgPSB7XG4gICAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucmFuZ2UubWluWVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJoaGhoaFwiKVxuICAgICAgICB0aGlzLkxpc3RlbmVyID0gbmV3IExpc3RlbmVyKHRoaXMub2Zmc2V0LCApXG4gICAgICAgIHRoaXMuTGlzdGVuZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbilcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcImh5eXl5eVwiKVxuXG4gICAgICAgIC8vIEluaXRpYWxpc2luZyBDbG9zZXN0IFBvaW50c1xuICAgICAgICAvLyB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XG5cbiAgICAgICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxuICAgICAgICAvLyB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlbmRlcigpKTtcblxuICAgICAgICAvLyBBZGQgRXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSBXaW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG4gICAgICAgICAgLy8gdGhpcy5Tb3VyY2VzLlVwZGF0ZVNjYWxlKHRoaXMuc2NhbGUpO1xuICAgICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuXG4gICAgLy8gLy8gaW5pdCB3aXRoIGN1cnJlbnQgY29udGVudFxuICAgIC8vIGF3YWl0IHRoaXMubG9hZFNvdW5kYmFuaygpO1xuICB9XG5cbiAgUmFuZ2UocG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0byBkaXNwbGF5IGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoIC0gdGhpcy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIC8vIGxvYWRTb3VuZGJhbmsoKSB7IC8vIExvYWQgdGhlIGF1ZGlvRGF0YSB0byB1c2VcbiAgLy8gICBjb25zdCBzb3VuZGJhbmtUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCh0aGlzLmF1ZGlvRGF0YSk7XG4gIC8vICAgY29uc3QgZGVmT2JqID0ge307XG4gIC8vICAgc291bmRiYW5rVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xuICAvLyAgICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gIC8vICAgICAgIGRlZk9ialtsZWFmLm5hbWVdID0gbGVhZi51cmw7XG4gIC8vICAgICB9XG4gIC8vICAgfSk7XG4gIC8vICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5sb2FkKGRlZk9iaiwgdHJ1ZSk7XG4gIC8vIH1cblxuICAvLyBsb2FkRGF0YSgpIHsgLy8gTG9hZCB0aGUgZGF0YVxuICAvLyAgIGNvbnN0IGRhdGEgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0KCdQb3NpdGlvbicpO1xuXG4gIC8vICAgLy8gQ2hlY2sgZmlsZXMgdG8gZ2V0IGNvbmZpZ1xuICAvLyAgIGRhdGEuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcbiAgLy8gICAgIGlmIChsZWFmLm5hbWUgPT09IHRoaXMuZGF0YUZpbGVOYW1lKSB7XG5cbiAgLy8gICAgICAgLy8gQ3JlYXRpbmcgdGhlIGRhdGEgcmVjZWl2ZXIgKEkgbmVlZCB0byB1c2UgdGhlICdsZWFmLnVybCcgdG8gcmVhZCB0aGUganNvbilcbiAgLy8gICAgICAgdmFyIGpzb25EYXRhID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgLy8gICAgICAgLy8gV2FpdCB0aGUganNvbiBmaWxlIHRvIGJlIGxvYWRlZFxuICAvLyAgICAgICBqc29uRGF0YS5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XG5cbiAgLy8gICAgICAgICAvLyBHZXQgdGhlIHRleHQgZnJvbSBkYXRhXG4gIC8vICAgICAgICAgdmFyIGpzb25UZXh0ID0gSlNPTi5zdHJpbmdpZnkoanNvbkRhdGEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIFxuICAvLyAgICAgICAgIC8vIE1vZGlmeSB0aGUgdGV4dCB0byBiZSB1c2FibGUgZm9yIGFuIG9iamVjdFxuICAvLyAgICAgICAgIGpzb25UZXh0ID0ganNvblRleHQucmVwbGFjZUFsbCgvWy9dWy9dWyBcXHcnXCJdKy9nLCcnKTtcbiAgLy8gICAgICAgICBqc29uVGV4dCA9IGpzb25UZXh0LnJlcGxhY2VBbGwoJ1xcXFxuJywgJycpO1xuICAvLyAgICAgICAgIGpzb25UZXh0ID0ganNvblRleHQucmVwbGFjZSgvXi4vLCcnKTtcbiAgLy8gICAgICAgICBqc29uVGV4dCA9IGpzb25UZXh0LnJlcGxhY2UoLy4kLywnJyk7XG4gIC8vICAgICAgICAganNvblRleHQgPSBqc29uVGV4dC5yZXBsYWNlQWxsKCdcXFxcJywnJyk7XG4gIC8vICAgICAgICAganNvblRleHQgPSBqc29uVGV4dC5yZXBsYWNlQWxsKCcuMCcsJycpO1xuXG4gIC8vICAgICAgICAgLy8gQ3JlYXRlIHRoZSBkYXRhIG9iamVjdFxuICAvLyAgICAgICAgIHRoaXMuanNvbk9iaiA9IEpTT04ucGFyc2UoanNvblRleHQpO1xuXG4gIC8vICAgICAgICAgLy8gRGlzcGF0Y2ggYW4gZXZlbnQgdG8gaW5mb3JtIHRoYXQgdGhlIGRhdGEgaGFzIGJlZW4gbG9hZGVkXG4gIC8vICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJkYXRhTG9hZGVkXCIpKTtcbiAgLy8gICAgICAgICB9LCBmYWxzZSk7XG5cbiAgLy8gICAgICAgLy8gR2V0IHRoZSBkYXRhIG9mIHRoZSBqc29uIGZyb20gdGhlICdsZWFmLnVybCdcbiAgLy8gICAgICAganNvbkRhdGEub3BlbihcImdldFwiLCBsZWFmLnVybCwgdHJ1ZSk7XG4gIC8vICAgICAgIGpzb25EYXRhLnNlbmQoKTtcbiAgLy8gICAgIH1cbiAgLy8gICB9KTtcbiAgLy8gfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcInJlbmRlclwiKVxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICAvLyBjb25zdCBsb2FkaW5nID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5nZXQoJ2xvYWRpbmcnKTtcbiAgICAgIGNvbnN0IGxvYWRpbmcgPSBmYWxzZTtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIGlmICghbG9hZGluZykge1xuICAgICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogeWVsbG93OyB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlKS8yfXB4LCAke3RoaXMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGNpcmNsZXMgdG8gZGlzcGxheSBTb3VyY2VzXG5cbiAgICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG5cbiAgICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgICAvLyBVc2luZyBtb3VzZVxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIHRvdWNoXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSlcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGlzaW5nIGF1ZGlvTm9kZXNcbiAgICAgICAgICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgICAgICAgLy8gICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbdGhpcy5hdWRpb0ZpbGVzTmFtZVt0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXV1dLCBpKSk7XG4gICAgICAgICAgICAvLyAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICAgICAgICAvLyAgIGlmIChpICE9IHRoaXMubmJDbG9zZXN0UG9pbnRzIC0gMSkge1xuICAgICAgICAgICAgLy8gICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpO1xuICAgICAgICAgICAgLy8gICB9XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgIC8vIC8vIEdldCBhbGwgdGhlIGRhdGEgYW5kIHNldCB0aGUgZGlzcGxheSB0byBiZWdpblxuICAgICAgICAgICAgLy8gdGhpcy5Qb3NpdGlvbkNoYW5nZWQoKTsgXG5cbiAgICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gQXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIFNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQmVnaW4gQXVkaW9Db250ZXh0XG4gICAgLy8gdGhpcy5hdWRpb0NvbnRleHQucmVzdW1lKCk7XG5cbiAgICAvLyBJbml0aWFsaXNpbmcgYSB0ZW1wb3JhcnkgY2lyY2xlXG4gICAgLy8gdmFyIHRlbXBDaXJjbGU7XG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTtcbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgY29uc29sZS5sb2codGhpcy5jb250YWluZXIpXG4gICAgLy8gY29uc29sZS5sb2ZcbiAgICAvLyAvLyBDcmVhdGUgdGhlIGNpcmNsZSBmb3IgdGhlIFNvdXJjZXNcbiAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7ICAgICAvLyBmb3JlYWNoIFNvdXJjZXNcbiAgICAvLyAgIHRlbXBDaXJjbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgZWxlbWVudFxuICAgIC8vICAgdGVtcENpcmNsZS5pZCA9IFwiY2lyY2xlXCIgKyBpOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgaWRcbiAgICAvLyAgIHRlbXBDaXJjbGUuaW5uZXJIVE1MID0gaSArIDE7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSB2YWx1ZSAoaSsxKVxuXG4gICAgLy8gICAvLyBDaGFuZ2UgZm9ybSBhbmQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgdG8gZ2V0IGEgY2lyY2xlIGF0IHRoZSBnb29kIHBsYWNlO1xuICAgIC8vICAgdGVtcENpcmNsZS5zdHlsZSA9IFwicG9zaXRpb246IGFic29sdXRlOyBtYXJnaW46IDAgLTEwcHg7IHdpZHRoOiBcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGhlaWdodDogXCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBib3JkZXItcmFkaXVzOlwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgbGluZS1oZWlnaHQ6IFwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgYmFja2dyb3VuZDogZ3JleTtcIjtcbiAgICAvLyAgIHRlbXBDaXJjbGUuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4LCBcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgpXCI7XG4gICAgICBcbiAgICAvLyAgIC8vIEFkZCB0aGUgY2lyY2xlIHRvIHRoZSBkaXNwbGF5XG4gICAgLy8gICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcENpcmNsZSk7XG4gICAgLy8gfVxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgTGlzdGVuZXIncyBQb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG4gIC8vIGNvbnNvbGUubG9nKFwiYm9uam91clwiKVxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBMaXN0ZW5lcidzIFBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcbiAgICAvLyBjb25zb2xlLmxvZyh0ZW1wWCwgdGVtcFkpXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5yYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcImljaVwiKVxuICAgICAgLy8gU2V0IHRoZSB2YWx1ZSB0byB0aGUgTGlzdGVuZXIncyBQb3NpdGlvblxuICAgICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzLm9mZnNldC54ICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHRoaXMub2Zmc2V0LnkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMuY2lyY2xlU2l6ZS8yKS8odGhpcy5zY2FsZSk7XG5cbiAgICAgIC8vIFVwZGF0ZSBMaXN0ZW5lclxuICAgICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUsIHRoaXMuY2lyY2xlRGlhbWV0ZXIvMik7XG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuICAgICAgLy8gY29uc29sZS5sb2codGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKVxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLmNpcmNsZVNpemUvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG4gICAgXG4gICAgLy8gdGhpcy5VcGRhdGVMaXN0ZW5lcigpOyAgICAgICAgICAgIC8vIFVwZGF0ZSBMaXN0ZW5lclxuICAgIHRoaXMuU291cmNlcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24odGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgLy8gVXBkYXRlIFNvdXJjZXMnIGRpc3BsYXlcbiAgfVxuXG4gIC8vIFVwZGF0ZUxpc3RlbmVyKCkgeyAvLyBVcGRhdGUgTGlzdGVuZXJcblxuICAvLyAgIC8vIFVwZGF0ZSBMaXN0ZW5lcidzIGRpcHNsYXlcbiAgLy8gICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxpc3RlbmVyXCIpLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsIC0gdGhpcy5jaXJjbGVTaXplLzIpICsgXCJweCwgXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweCkgcm90YXRlKDQ1ZGVnKVwiO1xuICAgIFxuICAvLyAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheSBmb3IgdGhlIGN1cnJlbnQgUG9zaXRpb24gb2YgTGlzdGVuZXJcbiAgLy8gICB0aGlzLlBvc2l0aW9uQ2hhbmdlZCgpOyAgXG4gIC8vIH1cblxuICAvLyBQb3NpdGlvbkNoYW5nZWQoKSB7IC8vIFVwZGF0ZSB0aGUgY2xvc2VzdCBTb3VyY2VzIHRvIHVzZSB3aGVuIExpc3RlbmVyJ3MgUG9zaXRpb24gY2hhbmdlZFxuXG4gIC8vICAgLy8gSW5pdGlhbGlzaW5nIHZhcmlhYmxlc1xuICAvLyAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RQb2ludHNJZDtcblxuICAvLyAgIC8vIFVwZGF0ZSB0aGUgY2xvc2VzdCBQb2ludHNcbiAgLy8gICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XG4gICAgXG4gIC8vICAgLy8gQ2hlY2sgYWxsIHRoZSBuZXcgY2xvc2VzdCBQb2ludHNcbiAgLy8gICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzIC0gMTsgaSsrKSB7XG5cbiAgLy8gICAgIC8vIENoZWNrIGlmIHRoZSBJZCBpcyBuZXcgaW4gJ3RoaXMuQ2xvc2VzdFBvaW50c0lkJ1xuICAvLyAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pIHtcblxuICAvLyAgICAgICAvLyBVcGRhdGUgdGhlIERpc3BsYXkgZm9yIFNvdXJjZXMgdGhhdCBhcmUgbm90IGFjdGl2ZVxuICAvLyAgICAgICBpZiAodGhpcy5Ob3RJbih0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldLCB0aGlzLkNsb3Nlc3RQb2ludHNJZCkgfHwgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSA9PSB0aGlzLkNsb3Nlc3RQb2ludHNJZFt0aGlzLm5iQ2xvc2VzdFBvaW50cyAtIDFdKSB7XG4gIC8vICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcImdyZXlcIjtcbiAgLy8gICAgICAgfVxuXG4gIC8vICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdG9wKCk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3AgdGhlIHByZXZpb3VzIFNvdXJjZVxuICAvLyAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zW2ldKTsgICAgICAvLyBEaXNjb25uZWN0IHRoZSBTb3VyY2UgZnJvbSB0aGUgYXVkaW9cblxuICAvLyAgICAgICAvLyBVcGRhdGUgdGhlIG5ldyBTb3VuZCBmb3IgdGhlIG5ldyBTb3VyY2VzXG4gIC8vICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXSA9IHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YVt0aGlzLmF1ZGlvRmlsZXNOYW1lW3RoaXMuQ2xvc2VzdFBvaW50c0lkW2ldXV0sIGkpO1xuICAvLyAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RhcnQoKTsgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdGFydCB0aGUgbmV3IFNvdXJjZVxuICAvLyAgICAgfVxuXG4gIC8vICAgLy8gVXBkYXRlIFNvdXJjZSBwYXJhbWV0ZXJzXG4gIC8vICAgdGhpcy5VcGRhdGVTb3VyY2VzU291bmQoaSk7XG4gIC8vICAgfVxuICAvLyB9ICBcblxuICAvLyBVcGRhdGVTb3VyY2VzUG9zaXRpb24oKSB7IC8vIFVwZGF0ZSB0aGUgUG9zaXRpb25zIG9mIGNpcmNsZXMgd2hlbiB3aW5kb3cgaXMgcmVzaXplZFxuICAvLyAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgLy8gICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyBpKS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweClcIjtcbiAgLy8gICB9XG4gIC8vIH1cblxuICAvLyBVcGRhdGVTb3VyY2VzU291bmQoaW5kZXgpIHsgLy8gVXBkYXRlIEdhaW4gYW5kIERpc3BsYXkgb2YgdGhlIFNvdXJjZSBkZXBlbmRpbmcgb24gTGlzdGVuZXIncyBQb3NpdGlvblxuXG4gIC8vICAgLy8gU2V0IGEgdXNpbmcgdmFsdWUgdG8gdGhlIFNvdXJjZVxuICAvLyAgIHZhciBzb3VyY2VWYWx1ZSA9IHRoaXMuZ2FpbnNWYWx1ZVtpbmRleF0vdGhpcy5nYWluTm9ybTtcblxuICAvLyAgIC8vIFVwZGF0ZSB0aGUgRGlzcGxheSBvZiB0aGUgU291cmNlXG4gIC8vICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMuQ2xvc2VzdFBvaW50c0lkW2luZGV4XSkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmdiKDAsIFwiICsgMjU1Kig0Kk1hdGgucG93KHNvdXJjZVZhbHVlLCAyKSkgKyBcIiwgMClcIjtcbiAgICBcbiAgLy8gICAvLyBVcGRhdGUgdGhlIEdhaW4gb2YgdGhlIFNvdXJjZVxuICAvLyAgIHRoaXMuZ2FpbnNbaW5kZXhdLmdhaW4uc2V0VmFsdWVBdFRpbWUoc291cmNlVmFsdWUsIDApO1xuICAvLyB9XG5cbiAgLy8gQ2xvc2VzdFNvdXJjZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludCwgbmJDbG9zZXN0KSB7IC8vIGdldCBjbG9zZXN0IFNvdXJjZXMgdG8gdGhlIExpc3RlbmVyXG4gICAgXG4gIC8vICAgLy8gSW5pdGlhbGlzaW5nIHRlbXBvcmFyeSB2YXJpYWJsZXM7XG4gIC8vICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcbiAgLy8gICB2YXIgY3VycmVudENsb3Nlc3RJZDtcblxuICAvLyAgIC8vIFJlc2V0IENvdW50XG4gIC8vICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7XG4gIC8vICAgdGhpcy5nYWluTm9ybSA9IDA7XG5cbiAgLy8gICAvLyBHZXQgdGhlICduYkNsb3Nlc3QnIGNsb3Nlc3QgSWRzXG4gIC8vICAgZm9yIChsZXQgaiA9IDA7IGogPCBuYkNsb3Nlc3Q7IGorKykge1xuXG4gIC8vICAgICAvLyBTZXQgJ3VuZGVmaW5lZCcgdG8gdGhlIGN1cnJlbnRDbG9zZXN0SWQgdG8gaWdub3JlIGRpZmZpY3VsdGllcyB3aXRoIGluaXRpYWwgdmFsdWVzXG4gIC8vICAgICBjdXJyZW50Q2xvc2VzdElkID0gdW5kZWZpbmVkO1xuXG4gIC8vICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RPZlBvaW50Lmxlbmd0aDsgaSsrKSB7XG5cbiAgLy8gICAgICAgLy8gQ2hlY2sgaWYgdGhlIElkIGlzIG5vdCBhbHJlYWR5IGluIHRoZSBjbG9zZXN0IElkcyBhbmQgaWYgdGhlIFNvdXJjZSBvZiB0aGlzIElkIGlzIGNsb3Nlc3RcbiAgLy8gICAgICAgaWYgKHRoaXMuTm90SW4oaSwgY2xvc2VzdElkcykgJiYgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtpXSkgPCB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKSkge1xuICAvLyAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xuICAvLyAgICAgICB9XG4gIC8vICAgICB9XG5cbiAgLy8gICAgIGlmIChqICE9IG5iQ2xvc2VzdCAtIDEpIHtcbiAgLy8gICAgICAgLy8gR2V0IHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBMaXN0ZW5lciBhbmQgdGhlIFNvdXJjZVxuICAvLyAgICAgICB0aGlzLmRpc3RhbmNlVmFsdWVbal0gPSB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKTtcblxuICAvLyAgICAgICAvLyBJbmNyZW1lbnQgJ3RoaXMuZGlzdGFuY2VTdW0nXG4gIC8vICAgICAgIHRoaXMuZGlzdGFuY2VTdW0gKz0gdGhpcy5kaXN0YW5jZVZhbHVlW2pdO1xuICAvLyAgICAgfVxuXG4gIC8vICAgICAvLyBQdXNoIHRoZSBJZCBpbiB0aGUgY2xvc2VzdFxuICAvLyAgICAgY2xvc2VzdElkcy5wdXNoKGN1cnJlbnRDbG9zZXN0SWQpO1xuICAvLyAgIH1cblxuICAvLyAgIC8vIFNldCB0aGUgR2FpbnMgYW5kIHRoZSBHYWlucyBub3JtXG4gIC8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmdhaW5zVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgLy8gICAgIHRoaXMuZ2FpbnNWYWx1ZVtpXSA9IE1hdGgucG93KCgxIC0gdGhpcy5kaXN0YW5jZVZhbHVlW2ldL3RoaXMuZGlzdGFuY2VTdW0pLCB0aGlzLmdhaW5FeHBvc2FudCk7XG4gIC8vICAgICB0aGlzLmdhaW5Ob3JtICs9IHRoaXMuZ2FpbnNWYWx1ZVtpXTtcbiAgLy8gICB9XG5cbiAgLy8gICByZXR1cm4gKGNsb3Nlc3RJZHMpO1xuICAvLyB9XG5cbiAgLy8gTm90SW4ocG9pbnRJZCwgbGlzdE9mSWRzKSB7IC8vIENoZWNrIGlmIGFuIElkIGlzIG5vdCBpbiBhbiBJZHMnIGFycmF5XG4gIC8vICAgdmFyIGl0ZXJhdG9yID0gMDtcbiAgLy8gICB3aGlsZSAoaXRlcmF0b3IgPCBsaXN0T2ZJZHMubGVuZ3RoICYmIHBvaW50SWQgIT0gbGlzdE9mSWRzW2l0ZXJhdG9yXSkge1xuICAvLyAgICAgaXRlcmF0b3IgKz0gMTtcbiAgLy8gICB9XG4gIC8vICAgcmV0dXJuKGl0ZXJhdG9yID49IGxpc3RPZklkcy5sZW5ndGgpO1xuICAvLyB9XG5cbiAgLy8gRGlzdGFuY2UocG9pbnRBLCBwb2ludEIpIHsgLy8gR2V0IHRoZSBkaXN0YW5jZSBiZXR3ZWVuIDIgcG9pbnRzXG4gIC8vICAgaWYgKHBvaW50QiAhPSB1bmRlZmluZWQpIHtcbiAgLy8gICAgIHJldHVybiAoTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50QS54IC0gcG9pbnRCLngsIDIpICsgTWF0aC5wb3cocG9pbnRBLnkgLSBwb2ludEIueSwgMikpKTtcbiAgLy8gICB9XG4gIC8vICAgZWxzZSB7XG4gIC8vICAgICByZXR1cm4gKEluZmluaXR5KTtcbiAgLy8gICB9XG4gIC8vIH1cblxuICAvLyBMb2FkTmV3U291bmQoYnVmZmVyLCBpbmRleCkgeyAvLyBDcmVhdGUgYW5kIGxpbmsgdGhlIHNvdW5kIHRvIHRoZSBBdWRpb0NvbnRleHRcbiAgLy8gICAvLyBTb3VuZCBpbml0aWFsaXNhdGlvblxuICAvLyAgIHZhciBzb3VuZCA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpOyAgIC8vIENyZWF0ZSB0aGUgc291bmRcbiAgLy8gICBzb3VuZC5sb29wID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIHNvdW5kIHRvIGxvb3BcbiAgLy8gICBzb3VuZC5idWZmZXIgPSBidWZmZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIHNvdW5kIGJ1ZmZlclxuICAvLyAgIHNvdW5kLmNvbm5lY3QodGhpcy5nYWluc1tpbmRleF0pOyAgICAgICAgICAgICAgICAgICAgIC8vIENvbm5lY3QgdGhlIHNvdW5kIHRvIHRoZSBvdGhlciBub2Rlc1xuICAvLyAgIHJldHVybiAoc291bmQpO1xuICAvLyB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQztJQUMzQyxNQUFNRixNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLQyxLQUFMLEdBQWEsSUFBYixDQUwyQyxDQU8zQzs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FSMkMsQ0FTM0M7O0lBQ0EsS0FBS0MsVUFB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