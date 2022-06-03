"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _client = require("@soundworks/core/client");

var _litHtml = require("lit-html");

var _renderInitializationScreens = _interopRequireDefault(require("@soundworks/template-helpers/client/render-initialization-screens.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PlayerExperience extends _client.AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);
    this.config = config;
    this.$container = $container;
    this.rafId = null; // Require plugins if needed
    // this.audioBufferLoader = this.require('audio-buffer-loader');
    // this.ambisonics = require('ambisonics');

    this.filesystem = this.require('filesystem'); // Initialisation variables

    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false; // Global values

    this.range; // Values of the array data (creates in start())

    this.scale; // General Scales (initialised in start())

    this.circleSize = 20; // Sources size

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
    // // Creating AudioContext
    // this.audioContext = new AudioContext();
    // this.playingSounds = [];                    // BufferSources
    // this.gains = [];                            // Gains

    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    super.start(); // // Load all Datas
    // await this.loadData();
    // Creating Gains

    for (let i = 0; i < this.nbClosestPoints; i++) {
      this.gains.push(await this.audioContext.createGain());
    } // Wait json data to be loaded (an event is dispatch by 'loadData()')


    document.addEventListener("dataLoaded", () => {
      // Update data values
      this.truePositions = this.jsonObj.receivers.xyz;
      this.audioFilesName = this.jsonObj.receivers.files;
      this.nbPos = this.truePositions.length; // Initialising of Sources positions data

      for (let i = 0; i < this.nbPos; i++) {
        this.positions.push({
          x: this.truePositions[i][0],
          y: this.truePositions[i][1]
        });
      } // Creating 'this.range'


      this.Range(this.positions); // Initialising 'this.scale'

      this.scale = this.Scaling(this.range); // Initialising User's Position

      this.listenerPosition.x = this.range.moyX;
      this.listenerPosition.y = this.range.minY; // Initialising Closest Points

      this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints); // subscribe to display loading state

      this.audioBufferLoader.subscribe(() => this.render()); // Add Event listener for resize Window event to resize the display

      window.addEventListener('resize', () => {
        this.scale = this.Scaling(this.range); // Change the scale

        if (this.beginPressed) {
          // Check the begin State
          this.UpdateContainer(); // Resize the display
        } // Display


        this.render();
      });
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
    var scale = {
      VPos2Pixel: Math.min((window.innerWidth - this.circleSize) / rangeValues.rangeX, (window.innerHeight - this.circleSize) / rangeValues.rangeY)
    };
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
      const loading = this.audioBufferLoader.get('loading'); // Begin the render only when audioData ara loaded

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
                height: ${this.range.rangeY * this.scale.VPos2Pixel}px;
                width: ${this.range.rangeX * this.scale.VPos2Pixel}px;
                background: yellow; z-index: 0;
                transform: translate(${-this.range.rangeX * this.scale.VPos2Pixel / 2}px, ${this.circleSize / 2}px);">
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

            this.onBeginButtonClicked(document.getElementById('circleContainer')); // Assign mouse and touch callbacks to change the user Position

            var canvas = document.getElementById('circleContainer'); // Using mouse

            canvas.addEventListener("mousedown", mouse => {
              this.mouseDown = true;
              this.userAction(mouse);
            }, false);
            canvas.addEventListener("mousemove", mouse => {
              if (this.mouseDown) {
                this.userAction(mouse);
              }
            }, false);
            canvas.addEventListener("mouseup", mouse => {
              this.mouseDown = false;
            }, false); // Using touch

            canvas.addEventListener("touchstart", evt => {
              this.touched = true;
              console.log(evt.changedTouches[0]);
              this.userAction(evt.changedTouches[0]);
            }, false);
            canvas.addEventListener("touchmove", evt => {
              if (this.touched) {
                this.userAction(evt.changedTouches[0]);
              }
            }, false);
            canvas.addEventListener("touchend", evt => {
              this.touched = false;
            }, false); // Initialising audioNodes

            for (let i = 0; i < this.nbClosestPoints; i++) {
              this.playingSounds.push(this.LoadNewSound(this.audioBufferLoader.data[this.audioFilesName[this.ClosestPointsId[i]]], i));
              this.gains[i].connect(this.audioContext.destination);

              if (i != this.nbClosestPoints - 1) {
                this.playingSounds[i].start();
              }
            } // Get all the data and set the display to begin


            this.PositionChanged();
            this.beginPressed = true; // Update begin State 
          });
          this.initialising = false; // Update initialising State
        }
      }
    });
  }

  onBeginButtonClicked(container) {
    // Begin AudioContext and add the Sources display to the display
    // Begin AudioContext
    this.audioContext.resume(); // Initialising a temporary circle

    var tempCircle; // // Create the circle for the Sources
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
    // Get the new potential Listener's Position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale.VPos2Pixel;
    var tempY = this.range.minY + (mouse.clientY - this.circleSize / 2) / this.scale.VPos2Pixel; // Check if the value is in the values range

    if (tempX >= this.range.minX && tempX <= this.range.maxX && tempY >= this.range.minY && tempY <= this.range.maxY) {
      // Set the value to the Listener's Position
      this.listenerPosition.x = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale.VPos2Pixel;
      this.listenerPosition.y = this.range.minY + (mouse.clientY - this.circleSize / 2) / this.scale.VPos2Pixel; // Update Listener

      this.UpdateListener();
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
    document.getElementById("circleContainer").transform = "translate(" + (this.circleSize / 2 - this.range.rangeX * this.scale.VPos2Pixel / 2) + "px, 10px)";
    this.UpdateListener(); // Update Listener

    this.UpdateSourcesPosition(); // Update Sources' display
  } // UpdateListener() { // Update Listener
  //   // Update Listener's dipslay
  //   document.getElementById("listener").style.transform = "translate(" + ((this.listenerPosition.x - this.range.moyX)*this.scale.VPos2Pixel - this.circleSize/2) + "px, " + ((this.listenerPosition.y - this.range.minY)*this.scale.VPos2Pixel) + "px) rotate(45deg)";
  //   // Update the display for the current Position of Listener
  //   this.PositionChanged();  
  // }


  PositionChanged() {
    // Update the closest Sources to use when Listener's Position changed
    // Initialising variables
    this.previousClosestPointsId = this.ClosestPointsId; // Update the closest Points

    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints); // Check all the new closest Points

    for (let i = 0; i < this.nbClosestPoints - 1; i++) {
      // Check if the Id is new in 'this.ClosestPointsId'
      if (this.previousClosestPointsId[i] != this.ClosestPointsId[i]) {
        // Update the Display for Sources that are not active
        if (this.NotIn(this.previousClosestPointsId[i], this.ClosestPointsId) || this.previousClosestPointsId[i] == this.ClosestPointsId[this.nbClosestPoints - 1]) {
          document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "grey";
        }

        this.playingSounds[i].stop(); // Stop the previous Source

        this.playingSounds[i].disconnect(this.gains[i]); // Disconnect the Source from the audio
        // Update the new Sound for the new Sources

        this.playingSounds[i] = this.LoadNewSound(this.audioBufferLoader.data[this.audioFilesName[this.ClosestPointsId[i]]], i);
        this.playingSounds[i].start(); // Start the new Source
      } // Update Source parameters


      this.UpdateSourcesSound(i);
    }
  } // UpdateSourcesPosition() { // Update the Positions of circles when window is resized
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJmaWxlc3lzdGVtIiwicmVxdWlyZSIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsIm1vdXNlRG93biIsInRvdWNoZWQiLCJyYW5nZSIsInNjYWxlIiwiY2lyY2xlU2l6ZSIsImF1ZGlvRGF0YSIsImRhdGFGaWxlTmFtZSIsImpzb25PYmoiLCJqc29uT2JqbG9hZGVkIiwidHJ1ZVBvc2l0aW9ucyIsImF1ZGlvRmlsZXNOYW1lIiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJuYlBvcyIsImRpc3RhbmNlVmFsdWUiLCJkaXN0YW5jZVN1bSIsImdhaW5zVmFsdWUiLCJnYWluTm9ybSIsImdhaW5FeHBvc2FudCIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiaSIsImdhaW5zIiwicHVzaCIsImF1ZGlvQ29udGV4dCIsImNyZWF0ZUdhaW4iLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZWNlaXZlcnMiLCJ4eXoiLCJmaWxlcyIsImxlbmd0aCIsIngiLCJ5IiwiUmFuZ2UiLCJTY2FsaW5nIiwibGlzdGVuZXJQb3NpdGlvbiIsIm1veVgiLCJtaW5ZIiwiQ2xvc2VzdFNvdXJjZSIsImF1ZGlvQnVmZmVyTG9hZGVyIiwic3Vic2NyaWJlIiwicmVuZGVyIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwibWluWCIsIm1heFgiLCJtYXhZIiwibW95WSIsInJhbmdlWCIsInJhbmdlWSIsInJhbmdlVmFsdWVzIiwiVlBvczJQaXhlbCIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImxvYWRpbmciLCJnZXQiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJjYW52YXMiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjb25zb2xlIiwibG9nIiwiY2hhbmdlZFRvdWNoZXMiLCJwbGF5aW5nU291bmRzIiwiTG9hZE5ld1NvdW5kIiwiZGF0YSIsImNvbm5lY3QiLCJkZXN0aW5hdGlvbiIsIlBvc2l0aW9uQ2hhbmdlZCIsImNvbnRhaW5lciIsInJlc3VtZSIsInRlbXBDaXJjbGUiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJVcGRhdGVMaXN0ZW5lciIsImhlaWdodCIsIndpZHRoIiwidHJhbnNmb3JtIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiTm90SW4iLCJiYWNrZ3JvdW5kIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJVcGRhdGVTb3VyY2VzU291bmQiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIC8vIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTtcbiAgICAvLyB0aGlzLmFtYmlzb25pY3MgPSByZXF1aXJlKCdhbWJpc29uaWNzJyk7XG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluIHN0YXJ0KCkpXG4gICAgdGhpcy5zY2FsZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIFNjYWxlcyAoaW5pdGlhbGlzZWQgaW4gc3RhcnQoKSlcbiAgICB0aGlzLmNpcmNsZVNpemUgPSAyMDsgICAgICAgICAgICAgICAgIC8vIFNvdXJjZXMgc2l6ZVxuICAgIHRoaXMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJzsgICAgICAgLy8gU2V0IHRoZSBhdWRpbyBkYXRhIHRvIHVzZVxuICAgIHRoaXMuZGF0YUZpbGVOYW1lID0gXCJzY2VuZTIuanNvblwiO1xuICAgIHRoaXMuanNvbk9iajtcbiAgICB0aGlzLmpzb25PYmpsb2FkZWQ7XG4gICAgLy8gdGhpcy5kYXRhTG9hZGVkID0gZmFsc2U7XG5cbiAgICAvLyBQb3NpdGlvbnMgb2YgdGhlIHNvdXJjZXNcbiAgICB0aGlzLnRydWVQb3NpdGlvbnMgPSBbXTtcblxuICAgIC8vIFNvdW5kcyBvZiB0aGUgc291cmNlc1xuICAgIHRoaXMuYXVkaW9GaWxlc05hbWUgPSBbXTtcblxuXG5cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdOyAgICAgICAgICAgICAgICAgIC8vIElkcyBvZiBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gW107ICAgICAgICAgIC8vIElkcyBvZiBwcmV2aW91cyBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7ICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBhdnRpdmUgc291cmNlc1xuICAgIHRoaXMucG9zaXRpb25zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2Ygc291cmNlcyBwb3NpdGlvbnMgKGJ1aWx0IGluIHN0YXJ0KCkpXG4gICAgdGhpcy5uYlBvczsgICAgIC8vIE51bWJlciBvZiBTb3VyY2VzXG4gICAgdGhpcy5kaXN0YW5jZVZhbHVlID0gWzAsIDAsIDAsIDBdOyAgICAgICAgICAvLyBEaXN0YW5jZSBvZiBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLmRpc3RhbmNlU3VtID0gMDsgICAgICAgICAgICAgICAgICAgICAgIC8vIFN1bSBvZiBkaXN0YW5jZXMgb2YgY2xvc2VzdCBTb3VyY2VzXG4gICAgdGhpcy5nYWluc1ZhbHVlID0gWzEsIDEsIDFdOyAgICAgICAgICAgICAgICAvLyBBcnJheSBvZiBHYWluc1xuICAgIHRoaXMuZ2Fpbk5vcm0gPSAwOyAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9ybSBvZiB0aGUgR2FpbnNcbiAgICB0aGlzLmdhaW5FeHBvc2FudCA9IDQ7ICAgICAgICAgICAgICAgICAgICAgIC8vIEVzcG9zYW50IHRvIGluY3JlYXNlIEdhaW5zJyBnYXBcblxuICAgIC8vIC8vIENyZWF0aW5nIEF1ZGlvQ29udGV4dFxuICAgIC8vIHRoaXMuYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICAgIC8vIHRoaXMucGxheWluZ1NvdW5kcyA9IFtdOyAgICAgICAgICAgICAgICAgICAgLy8gQnVmZmVyU291cmNlc1xuICAgIC8vIHRoaXMuZ2FpbnMgPSBbXTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2FpbnNcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuICAgIC8vIC8vIExvYWQgYWxsIERhdGFzXG4gICAgLy8gYXdhaXQgdGhpcy5sb2FkRGF0YSgpO1xuXG4gICAgLy8gQ3JlYXRpbmcgR2FpbnNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzOyBpKyspIHtcbiAgICAgIHRoaXMuZ2FpbnMucHVzaChhd2FpdCB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCkpO1xuICAgIH1cblxuICAgIC8vIFdhaXQganNvbiBkYXRhIHRvIGJlIGxvYWRlZCAoYW4gZXZlbnQgaXMgZGlzcGF0Y2ggYnkgJ2xvYWREYXRhKCknKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkYXRhTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgLy8gVXBkYXRlIGRhdGEgdmFsdWVzXG4gICAgICB0aGlzLnRydWVQb3NpdGlvbnMgPSB0aGlzLmpzb25PYmoucmVjZWl2ZXJzLnh5ejtcbiAgICAgIHRoaXMuYXVkaW9GaWxlc05hbWUgPSB0aGlzLmpzb25PYmoucmVjZWl2ZXJzLmZpbGVzO1xuICAgICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XG5cbiAgICAgIC8vIEluaXRpYWxpc2luZyBvZiBTb3VyY2VzIHBvc2l0aW9ucyBkYXRhXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJQb3M7IGkrKykge1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKHt4OiB0aGlzLnRydWVQb3NpdGlvbnNbaV1bMF0sIHk6dGhpcy50cnVlUG9zaXRpb25zW2ldWzFdfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0aW5nICd0aGlzLnJhbmdlJ1xuICAgICAgdGhpcy5SYW5nZSh0aGlzLnBvc2l0aW9ucyk7XG5cbiAgICAgIC8vIEluaXRpYWxpc2luZyAndGhpcy5zY2FsZSdcbiAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG5cbiAgICAgIC8vIEluaXRpYWxpc2luZyBVc2VyJ3MgUG9zaXRpb25cbiAgICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdGhpcy5yYW5nZS5tb3lYO1xuICAgICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgICAgIC8vIEluaXRpYWxpc2luZyBDbG9zZXN0IFBvaW50c1xuICAgICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuXG4gICAgICAvLyBzdWJzY3JpYmUgdG8gZGlzcGxheSBsb2FkaW5nIHN0YXRlXG4gICAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlbmRlcigpKTtcblxuICAgICAgLy8gQWRkIEV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgV2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG5cbiAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gLy8gaW5pdCB3aXRoIGN1cnJlbnQgY29udGVudFxuICAgIC8vIGF3YWl0IHRoaXMubG9hZFNvdW5kYmFuaygpO1xuICB9XG5cbiAgUmFuZ2UocG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0byBkaXNwbGF5IGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG4gICAgdmFyIHNjYWxlID0ge1ZQb3MyUGl4ZWw6IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMuY2lyY2xlU2l6ZSkvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5jaXJjbGVTaXplKS9yYW5nZVZhbHVlcy5yYW5nZVkpfTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIC8vIGxvYWRTb3VuZGJhbmsoKSB7IC8vIExvYWQgdGhlIGF1ZGlvRGF0YSB0byB1c2VcbiAgLy8gICBjb25zdCBzb3VuZGJhbmtUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCh0aGlzLmF1ZGlvRGF0YSk7XG4gIC8vICAgY29uc3QgZGVmT2JqID0ge307XG4gIC8vICAgc291bmRiYW5rVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xuICAvLyAgICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gIC8vICAgICAgIGRlZk9ialtsZWFmLm5hbWVdID0gbGVhZi51cmw7XG4gIC8vICAgICB9XG4gIC8vICAgfSk7XG4gIC8vICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5sb2FkKGRlZk9iaiwgdHJ1ZSk7XG4gIC8vIH1cblxuICAvLyBsb2FkRGF0YSgpIHsgLy8gTG9hZCB0aGUgZGF0YVxuICAvLyAgIGNvbnN0IGRhdGEgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0KCdQb3NpdGlvbicpO1xuXG4gIC8vICAgLy8gQ2hlY2sgZmlsZXMgdG8gZ2V0IGNvbmZpZ1xuICAvLyAgIGRhdGEuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcbiAgLy8gICAgIGlmIChsZWFmLm5hbWUgPT09IHRoaXMuZGF0YUZpbGVOYW1lKSB7XG5cbiAgLy8gICAgICAgLy8gQ3JlYXRpbmcgdGhlIGRhdGEgcmVjZWl2ZXIgKEkgbmVlZCB0byB1c2UgdGhlICdsZWFmLnVybCcgdG8gcmVhZCB0aGUganNvbilcbiAgLy8gICAgICAgdmFyIGpzb25EYXRhID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgLy8gICAgICAgLy8gV2FpdCB0aGUganNvbiBmaWxlIHRvIGJlIGxvYWRlZFxuICAvLyAgICAgICBqc29uRGF0YS5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XG5cbiAgLy8gICAgICAgICAvLyBHZXQgdGhlIHRleHQgZnJvbSBkYXRhXG4gIC8vICAgICAgICAgdmFyIGpzb25UZXh0ID0gSlNPTi5zdHJpbmdpZnkoanNvbkRhdGEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIFxuICAvLyAgICAgICAgIC8vIE1vZGlmeSB0aGUgdGV4dCB0byBiZSB1c2FibGUgZm9yIGFuIG9iamVjdFxuICAvLyAgICAgICAgIGpzb25UZXh0ID0ganNvblRleHQucmVwbGFjZUFsbCgvWy9dWy9dWyBcXHcnXCJdKy9nLCcnKTtcbiAgLy8gICAgICAgICBqc29uVGV4dCA9IGpzb25UZXh0LnJlcGxhY2VBbGwoJ1xcXFxuJywgJycpO1xuICAvLyAgICAgICAgIGpzb25UZXh0ID0ganNvblRleHQucmVwbGFjZSgvXi4vLCcnKTtcbiAgLy8gICAgICAgICBqc29uVGV4dCA9IGpzb25UZXh0LnJlcGxhY2UoLy4kLywnJyk7XG4gIC8vICAgICAgICAganNvblRleHQgPSBqc29uVGV4dC5yZXBsYWNlQWxsKCdcXFxcJywnJyk7XG4gIC8vICAgICAgICAganNvblRleHQgPSBqc29uVGV4dC5yZXBsYWNlQWxsKCcuMCcsJycpO1xuXG4gIC8vICAgICAgICAgLy8gQ3JlYXRlIHRoZSBkYXRhIG9iamVjdFxuICAvLyAgICAgICAgIHRoaXMuanNvbk9iaiA9IEpTT04ucGFyc2UoanNvblRleHQpO1xuXG4gIC8vICAgICAgICAgLy8gRGlzcGF0Y2ggYW4gZXZlbnQgdG8gaW5mb3JtIHRoYXQgdGhlIGRhdGEgaGFzIGJlZW4gbG9hZGVkXG4gIC8vICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJkYXRhTG9hZGVkXCIpKTtcbiAgLy8gICAgICAgICB9LCBmYWxzZSk7XG5cbiAgLy8gICAgICAgLy8gR2V0IHRoZSBkYXRhIG9mIHRoZSBqc29uIGZyb20gdGhlICdsZWFmLnVybCdcbiAgLy8gICAgICAganNvbkRhdGEub3BlbihcImdldFwiLCBsZWFmLnVybCwgdHJ1ZSk7XG4gIC8vICAgICAgIGpzb25EYXRhLnNlbmQoKTtcbiAgLy8gICAgIH1cbiAgLy8gICB9KTtcbiAgLy8gfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcInJlbmRlclwiKVxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICBjb25zdCBsb2FkaW5nID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5nZXQoJ2xvYWRpbmcnKTtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIGlmICghbG9hZGluZykge1xuICAgICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWx9cHg7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKS8yfXB4LCAke3RoaXMuY2lyY2xlU2l6ZS8yfXB4KTtcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgY2lyY2xlcyB0byBkaXNwbGF5IFNvdXJjZXNcbiAgICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpKVxuXG4gICAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIG1vdXNlXG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgICAgLy8gVXNpbmcgdG91Y2hcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSlcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXNpbmcgYXVkaW9Ob2Rlc1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICAgICAgICAgIHRoaXMucGxheWluZ1NvdW5kcy5wdXNoKHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YVt0aGlzLmF1ZGlvRmlsZXNOYW1lW3RoaXMuQ2xvc2VzdFBvaW50c0lkW2ldXV0sIGkpKTtcbiAgICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgICAgICAgaWYgKGkgIT0gdGhpcy5uYkNsb3Nlc3RQb2ludHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0YXJ0KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gR2V0IGFsbCB0aGUgZGF0YSBhbmQgc2V0IHRoZSBkaXNwbGF5IHRvIGJlZ2luXG4gICAgICAgICAgICB0aGlzLlBvc2l0aW9uQ2hhbmdlZCgpOyBcblxuICAgICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKGNvbnRhaW5lcikgeyAvLyBCZWdpbiBBdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgU291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XG5cbiAgICAvLyBCZWdpbiBBdWRpb0NvbnRleHRcbiAgICB0aGlzLmF1ZGlvQ29udGV4dC5yZXN1bWUoKTtcblxuICAgIC8vIEluaXRpYWxpc2luZyBhIHRlbXBvcmFyeSBjaXJjbGVcbiAgICB2YXIgdGVtcENpcmNsZTtcblxuICAgIC8vIC8vIENyZWF0ZSB0aGUgY2lyY2xlIGZvciB0aGUgU291cmNlc1xuICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHsgICAgIC8vIGZvcmVhY2ggU291cmNlc1xuICAgIC8vICAgdGVtcENpcmNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOyAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBlbGVtZW50XG4gICAgLy8gICB0ZW1wQ2lyY2xlLmlkID0gXCJjaXJjbGVcIiArIGk7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgIC8vICAgdGVtcENpcmNsZS5pbm5lckhUTUwgPSBpICsgMTsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIHZhbHVlIChpKzEpXG5cbiAgICAvLyAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XG4gICAgLy8gICB0ZW1wQ2lyY2xlLnN0eWxlID0gXCJwb3NpdGlvbjogYWJzb2x1dGU7IG1hcmdpbjogMCAtMTBweDsgd2lkdGg6IFwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgaGVpZ2h0OiBcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGJvcmRlci1yYWRpdXM6XCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBsaW5lLWhlaWdodDogXCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBiYWNrZ3JvdW5kOiBncmV5O1wiO1xuICAgIC8vICAgdGVtcENpcmNsZS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweClcIjtcbiAgICAgIFxuICAgIC8vICAgLy8gQWRkIHRoZSBjaXJjbGUgdG8gdGhlIGRpc3BsYXlcbiAgICAvLyAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZW1wQ2lyY2xlKTtcbiAgICAvLyB9XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBMaXN0ZW5lcidzIFBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBMaXN0ZW5lcidzIFBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMuY2lyY2xlU2l6ZS8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5yYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgXG4gICAgICAvLyBTZXQgdGhlIHZhbHVlIHRvIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uXG4gICAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG4gICAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5jaXJjbGVTaXplLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuXG4gICAgICAvLyBVcGRhdGUgTGlzdGVuZXJcbiAgICAgIHRoaXMuVXBkYXRlTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLmNpcmNsZVNpemUvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG4gICAgXG4gICAgdGhpcy5VcGRhdGVMaXN0ZW5lcigpOyAgICAgICAgICAgIC8vIFVwZGF0ZSBMaXN0ZW5lclxuICAgIHRoaXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKCk7ICAgICAvLyBVcGRhdGUgU291cmNlcycgZGlzcGxheVxuICB9XG5cbiAgLy8gVXBkYXRlTGlzdGVuZXIoKSB7IC8vIFVwZGF0ZSBMaXN0ZW5lclxuXG4gIC8vICAgLy8gVXBkYXRlIExpc3RlbmVyJ3MgZGlwc2xheVxuICAvLyAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGlzdGVuZXJcIikuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwgLSB0aGlzLmNpcmNsZVNpemUvMikgKyBcInB4LCBcIiArICgodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4KSByb3RhdGUoNDVkZWcpXCI7XG4gICAgXG4gIC8vICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5IGZvciB0aGUgY3VycmVudCBQb3NpdGlvbiBvZiBMaXN0ZW5lclxuICAvLyAgIHRoaXMuUG9zaXRpb25DaGFuZ2VkKCk7ICBcbiAgLy8gfVxuXG4gIFBvc2l0aW9uQ2hhbmdlZCgpIHsgLy8gVXBkYXRlIHRoZSBjbG9zZXN0IFNvdXJjZXMgdG8gdXNlIHdoZW4gTGlzdGVuZXIncyBQb3NpdGlvbiBjaGFuZ2VkXG5cbiAgICAvLyBJbml0aWFsaXNpbmcgdmFyaWFibGVzXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFBvaW50c0lkO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjbG9zZXN0IFBvaW50c1xuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMsIHRoaXMubmJDbG9zZXN0UG9pbnRzKTtcbiAgICBcbiAgICAvLyBDaGVjayBhbGwgdGhlIG5ldyBjbG9zZXN0IFBvaW50c1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHMgLSAxOyBpKyspIHtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIElkIGlzIG5ldyBpbiAndGhpcy5DbG9zZXN0UG9pbnRzSWQnXG4gICAgICBpZiAodGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSAhPSB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSkge1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgRGlzcGxheSBmb3IgU291cmNlcyB0aGF0IGFyZSBub3QgYWN0aXZlXG4gICAgICAgIGlmICh0aGlzLk5vdEluKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0sIHRoaXMuQ2xvc2VzdFBvaW50c0lkKSB8fCB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldID09IHRoaXMuQ2xvc2VzdFBvaW50c0lkW3RoaXMubmJDbG9zZXN0UG9pbnRzIC0gMV0pIHtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwiZ3JleVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0b3AoKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcCB0aGUgcHJldmlvdXMgU291cmNlXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5kaXNjb25uZWN0KHRoaXMuZ2FpbnNbaV0pOyAgICAgIC8vIERpc2Nvbm5lY3QgdGhlIFNvdXJjZSBmcm9tIHRoZSBhdWRpb1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbmV3IFNvdW5kIGZvciB0aGUgbmV3IFNvdXJjZXNcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldID0gdGhpcy5Mb2FkTmV3U291bmQodGhpcy5hdWRpb0J1ZmZlckxvYWRlci5kYXRhW3RoaXMuYXVkaW9GaWxlc05hbWVbdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV1dXSwgaSk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXJ0IHRoZSBuZXcgU291cmNlXG4gICAgICB9XG5cbiAgICAvLyBVcGRhdGUgU291cmNlIHBhcmFtZXRlcnNcbiAgICB0aGlzLlVwZGF0ZVNvdXJjZXNTb3VuZChpKTtcbiAgICB9XG4gIH0gIFxuXG4gIC8vIFVwZGF0ZVNvdXJjZXNQb3NpdGlvbigpIHsgLy8gVXBkYXRlIHRoZSBQb3NpdGlvbnMgb2YgY2lyY2xlcyB3aGVuIHdpbmRvdyBpcyByZXNpemVkXG4gIC8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAvLyAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIGkpLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweCwgXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4KVwiO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIC8vIFVwZGF0ZVNvdXJjZXNTb3VuZChpbmRleCkgeyAvLyBVcGRhdGUgR2FpbiBhbmQgRGlzcGxheSBvZiB0aGUgU291cmNlIGRlcGVuZGluZyBvbiBMaXN0ZW5lcidzIFBvc2l0aW9uXG5cbiAgLy8gICAvLyBTZXQgYSB1c2luZyB2YWx1ZSB0byB0aGUgU291cmNlXG4gIC8vICAgdmFyIHNvdXJjZVZhbHVlID0gdGhpcy5nYWluc1ZhbHVlW2luZGV4XS90aGlzLmdhaW5Ob3JtO1xuXG4gIC8vICAgLy8gVXBkYXRlIHRoZSBEaXNwbGF5IG9mIHRoZSBTb3VyY2VcbiAgLy8gICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaW5kZXhdKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZ2IoMCwgXCIgKyAyNTUqKDQqTWF0aC5wb3coc291cmNlVmFsdWUsIDIpKSArIFwiLCAwKVwiO1xuICAgIFxuICAvLyAgIC8vIFVwZGF0ZSB0aGUgR2FpbiBvZiB0aGUgU291cmNlXG4gIC8vICAgdGhpcy5nYWluc1tpbmRleF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZShzb3VyY2VWYWx1ZSwgMCk7XG4gIC8vIH1cblxuICAvLyBDbG9zZXN0U291cmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50LCBuYkNsb3Nlc3QpIHsgLy8gZ2V0IGNsb3Nlc3QgU291cmNlcyB0byB0aGUgTGlzdGVuZXJcbiAgICBcbiAgLy8gICAvLyBJbml0aWFsaXNpbmcgdGVtcG9yYXJ5IHZhcmlhYmxlcztcbiAgLy8gICB2YXIgY2xvc2VzdElkcyA9IFtdO1xuICAvLyAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xuXG4gIC8vICAgLy8gUmVzZXQgQ291bnRcbiAgLy8gICB0aGlzLmRpc3RhbmNlU3VtID0gMDtcbiAgLy8gICB0aGlzLmdhaW5Ob3JtID0gMDtcblxuICAvLyAgIC8vIEdldCB0aGUgJ25iQ2xvc2VzdCcgY2xvc2VzdCBJZHNcbiAgLy8gICBmb3IgKGxldCBqID0gMDsgaiA8IG5iQ2xvc2VzdDsgaisrKSB7XG5cbiAgLy8gICAgIC8vIFNldCAndW5kZWZpbmVkJyB0byB0aGUgY3VycmVudENsb3Nlc3RJZCB0byBpZ25vcmUgZGlmZmljdWx0aWVzIHdpdGggaW5pdGlhbCB2YWx1ZXNcbiAgLy8gICAgIGN1cnJlbnRDbG9zZXN0SWQgPSB1bmRlZmluZWQ7XG5cbiAgLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdE9mUG9pbnQubGVuZ3RoOyBpKyspIHtcblxuICAvLyAgICAgICAvLyBDaGVjayBpZiB0aGUgSWQgaXMgbm90IGFscmVhZHkgaW4gdGhlIGNsb3Nlc3QgSWRzIGFuZCBpZiB0aGUgU291cmNlIG9mIHRoaXMgSWQgaXMgY2xvc2VzdFxuICAvLyAgICAgICBpZiAodGhpcy5Ob3RJbihpLCBjbG9zZXN0SWRzKSAmJiB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2ldKSA8IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pKSB7XG4gIC8vICAgICAgICAgY3VycmVudENsb3Nlc3RJZCA9IGk7XG4gIC8vICAgICAgIH1cbiAgLy8gICAgIH1cblxuICAvLyAgICAgaWYgKGogIT0gbmJDbG9zZXN0IC0gMSkge1xuICAvLyAgICAgICAvLyBHZXQgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIExpc3RlbmVyIGFuZCB0aGUgU291cmNlXG4gIC8vICAgICAgIHRoaXMuZGlzdGFuY2VWYWx1ZVtqXSA9IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pO1xuXG4gIC8vICAgICAgIC8vIEluY3JlbWVudCAndGhpcy5kaXN0YW5jZVN1bSdcbiAgLy8gICAgICAgdGhpcy5kaXN0YW5jZVN1bSArPSB0aGlzLmRpc3RhbmNlVmFsdWVbal07XG4gIC8vICAgICB9XG5cbiAgLy8gICAgIC8vIFB1c2ggdGhlIElkIGluIHRoZSBjbG9zZXN0XG4gIC8vICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XG4gIC8vICAgfVxuXG4gIC8vICAgLy8gU2V0IHRoZSBHYWlucyBhbmQgdGhlIEdhaW5zIG5vcm1cbiAgLy8gICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZ2FpbnNWYWx1ZS5sZW5ndGg7IGkrKykge1xuICAvLyAgICAgdGhpcy5nYWluc1ZhbHVlW2ldID0gTWF0aC5wb3coKDEgLSB0aGlzLmRpc3RhbmNlVmFsdWVbaV0vdGhpcy5kaXN0YW5jZVN1bSksIHRoaXMuZ2FpbkV4cG9zYW50KTtcbiAgLy8gICAgIHRoaXMuZ2Fpbk5vcm0gKz0gdGhpcy5nYWluc1ZhbHVlW2ldO1xuICAvLyAgIH1cblxuICAvLyAgIHJldHVybiAoY2xvc2VzdElkcyk7XG4gIC8vIH1cblxuICAvLyBOb3RJbihwb2ludElkLCBsaXN0T2ZJZHMpIHsgLy8gQ2hlY2sgaWYgYW4gSWQgaXMgbm90IGluIGFuIElkcycgYXJyYXlcbiAgLy8gICB2YXIgaXRlcmF0b3IgPSAwO1xuICAvLyAgIHdoaWxlIChpdGVyYXRvciA8IGxpc3RPZklkcy5sZW5ndGggJiYgcG9pbnRJZCAhPSBsaXN0T2ZJZHNbaXRlcmF0b3JdKSB7XG4gIC8vICAgICBpdGVyYXRvciArPSAxO1xuICAvLyAgIH1cbiAgLy8gICByZXR1cm4oaXRlcmF0b3IgPj0gbGlzdE9mSWRzLmxlbmd0aCk7XG4gIC8vIH1cblxuICAvLyBEaXN0YW5jZShwb2ludEEsIHBvaW50QikgeyAvLyBHZXQgdGhlIGRpc3RhbmNlIGJldHdlZW4gMiBwb2ludHNcbiAgLy8gICBpZiAocG9pbnRCICE9IHVuZGVmaW5lZCkge1xuICAvLyAgICAgcmV0dXJuIChNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnRBLnggLSBwb2ludEIueCwgMikgKyBNYXRoLnBvdyhwb2ludEEueSAtIHBvaW50Qi55LCAyKSkpO1xuICAvLyAgIH1cbiAgLy8gICBlbHNlIHtcbiAgLy8gICAgIHJldHVybiAoSW5maW5pdHkpO1xuICAvLyAgIH1cbiAgLy8gfVxuXG4gIC8vIExvYWROZXdTb3VuZChidWZmZXIsIGluZGV4KSB7IC8vIENyZWF0ZSBhbmQgbGluayB0aGUgc291bmQgdG8gdGhlIEF1ZGlvQ29udGV4dFxuICAvLyAgIC8vIFNvdW5kIGluaXRpYWxpc2F0aW9uXG4gIC8vICAgdmFyIHNvdW5kID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7ICAgLy8gQ3JlYXRlIHRoZSBzb3VuZFxuICAvLyAgIHNvdW5kLmxvb3AgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgc291bmQgdG8gbG9vcFxuICAvLyAgIHNvdW5kLmJ1ZmZlciA9IGJ1ZmZlcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgc291bmQgYnVmZmVyXG4gIC8vICAgc291bmQuY29ubmVjdCh0aGlzLmdhaW5zW2luZGV4XSk7ICAgICAgICAgICAgICAgICAgICAgLy8gQ29ubmVjdCB0aGUgc291bmQgdG8gdGhlIG90aGVyIG5vZGVzXG4gIC8vICAgcmV0dXJuIChzb3VuZCk7XG4gIC8vIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDO0lBQzNDLE1BQU1GLE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxJQUFiLENBTDJDLENBTzNDO0lBQ0E7SUFDQTs7SUFDQSxLQUFLQyxVQUFMLEdBQWtCLEtBQUtDLE9BQUwsQ0FBYSxZQUFiLENBQWxCLENBVjJDLENBWTNDOztJQUNBLEtBQUtDLFlBQUwsR0FBb0IsSUFBcEI7SUFDQSxLQUFLQyxZQUFMLEdBQW9CLEtBQXBCO0lBQ0EsS0FBS0MsU0FBTCxH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