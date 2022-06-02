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

    this.audioBufferLoader = this.require('audio-buffer-loader'); // this.ambisonics = require('ambisonics');

    this.filesystem = this.require('filesystem'); // Initialisation variables

    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false; // Global values

    this.range; // Values of the array data (creates in start())

    this.scale; // General Scales (initialised in start())

    this.circleSize = 20; // Sources size

    this.audioData = 'AudioFiles0'; // Set the audio data to use
    // Positions of the sources

    this.truePositions = [[31.0, 41.5], [31.0, 39.0], [31.0, 36.2], [34.5, 36.2], [36.8, 36.2], [36.8, 33.6], [34.5, 33.6], [31.0, 33.6], [31.0, 31.0], [34.5, 31.0], [34.5, 28.0], [31.0, 28.0], [31.0, 25.8], [34.5, 25.8], [36.8, 25.8], [36.8, 23.6], [34.5, 23.6], [31.0, 23.6]]; // Sounds of the sources

    this.audioFilesName = ["01.wav", "02.wav", "03.wav", "04.wav", "05.wav", "06.wav", "07.wav", "08.wav", "09.wav", "10.wav", "11.wav", "12.wav", "13.wav", "14.wav", "15.wav", "16.wav", "17.wav", "18.wav"]; // User positions

    this.listenerPosition = {
      x: 0,
      y: 0
    };
    this.ClosestPointsId = []; // Ids of closest Sources

    this.previousClosestPointsId = []; // Ids of previous closest Sources

    this.nbClosestPoints = 4; // Number of avtive sources

    this.positions = []; // Array of sources positions (built in start())

    this.nbPos = this.truePositions.length; // Number of Sources

    this.distanceValue = [0, 0, 0, 0]; // Distance of closest Sources

    this.distanceSum = 0; // Sum of distances of closest Sources

    this.gainsValue = [1, 1, 1]; // Array of Gains

    this.gainNorm = 0; // Norm of the Gains

    this.gainExposant = 3; // Esposant to increase Gains' gap
    // Creating AudioContext

    this.audioContext = new AudioContext();
    this.playingSounds = []; // BufferSources

    this.gains = []; // Gains

    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    super.start(); // Initialising of Sources positions data

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

    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints); // Creating Gains

    for (let i = 0; i < this.nbClosestPoints; i++) {
      this.gains.push(await this.audioContext.createGain());
    } // subscribe to display loading state


    this.audioBufferLoader.subscribe(() => this.render()); // Add Event listener for resize Window event to resize the display

    window.addEventListener('resize', () => {
      this.scale = this.Scaling(this.range); // Change the scale

      if (this.beginPressed) {
        // Check the begin State
        this.UpdateContainer(); // Resize the display
      } // Display


      this.render();
    }); // init with current content

    await this.loadSoundbank();
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
  }

  loadSoundbank() {
    // Load the audioData to use
    const soundbankTree = this.filesystem.get(this.audioData);
    const defObj = {};
    soundbankTree.children.forEach(leaf => {
      if (leaf.type === 'file') {
        defObj[leaf.name] = leaf.url;
      }
    });
    this.audioBufferLoader.load(defObj, true);
  }

  render() {
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
              <div id="listener" style="position: absolute; height: 16px; width: 16px; background: blue; text-align: center; z-index: 1;
                transform: translate(${(this.listenerPosition.x - this.range.moyX) * this.scale.VPos2Pixel}px, ${(this.listenerPosition.y - this.range.minY) * this.scale.VPos2Pixel}px) rotate(45deg)";>
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

    var tempCircle; // Create the circle for the Sources

    for (let i = 0; i < this.positions.length; i++) {
      // foreach Sources
      tempCircle = document.createElement('div'); // Create a new element

      tempCircle.id = "circle" + i; // Set the circle id

      tempCircle.innerHTML = i + 1; // Set the circle value (i+1)
      // Change form and position of the element to get a circle at the good place;

      tempCircle.style = "position: absolute; margin: 0 -10px; width: " + this.circleSize + "px; height: " + this.circleSize + "px; border-radius:" + this.circleSize + "px; line-height: " + this.circleSize + "px; background: grey;";
      tempCircle.style.transform = "translate(" + (this.positions[i].x - this.range.moyX) * this.scale.VPos2Pixel + "px, " + (this.positions[i].y - this.range.minY) * this.scale.VPos2Pixel + "px)"; // Add the circle to the display

      container.appendChild(tempCircle);
    }
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
  }

  UpdateListener() {
    // Update Listener
    // Update Listener's dipslay
    document.getElementById("listener").style.transform = "translate(" + ((this.listenerPosition.x - this.range.moyX) * this.scale.VPos2Pixel - this.circleSize / 2) + "px, " + (this.listenerPosition.y - this.range.minY) * this.scale.VPos2Pixel + "px) rotate(45deg)"; // Update the display for the current Position of Listener

    this.PositionChanged();
  }

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
  }

  UpdateSourcesPosition() {
    // Update the Positions of circles when window is resized
    for (let i = 0; i < this.positions.length; i++) {
      document.getElementById("circle" + i).style.transform = "translate(" + (this.positions[i].x - this.range.moyX) * this.scale.VPos2Pixel + "px, " + (this.positions[i].y - this.range.minY) * this.scale.VPos2Pixel + "px)";
    }
  }

  UpdateSourcesSound(index) {
    // Update Gain and Display of the Source depending on Listener's Position
    // Set a using value to the Source
    var sourceValue = this.gainsValue[index] / this.gainNorm; // Update the Display of the Source

    document.getElementById("circle" + this.ClosestPointsId[index]).style.background = "rgb(0, " + 255 * (4 * Math.pow(sourceValue, 2)) + ", 0)"; // Update the Gain of the Source

    this.gains[index].gain.setValueAtTime(sourceValue, 0);
    console.log(sourceValue);
  }

  ClosestSource(listenerPosition, listOfPoint, nbClosest) {
    // get closest Sources to the Listener
    // Initialising temporary variables;
    var closestIds = [];
    var currentClosestId; // Reset Count

    this.distanceSum = 0;
    this.gainNorm = 0; // Get the 'nbClosest' closest Ids

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
        this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]); // Increment 'this.distanceSum'

        this.distanceSum += this.distanceValue[j];
      } // Push the Id in the closest


      closestIds.push(currentClosestId);
    } // Set the Gains and the Gains norm


    for (let i = 0; i < this.gainsValue.length; i++) {
      this.gainsValue[i] = Math.pow(1 - this.distanceValue[i] / this.distanceSum, this.gainExposant);
      this.gainNorm += this.gainsValue[i];
    }

    return closestIds;
  }

  NotIn(pointId, listOfIds) {
    // Check if an Id is not in an Ids' array
    var iterator = 0;

    while (iterator < listOfIds.length && pointId != listOfIds[iterator]) {
      iterator += 1;
    }

    return iterator >= listOfIds.length;
  }

  Distance(pointA, pointB) {
    // Get the distance between 2 points
    if (pointB != undefined) {
      return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
    } else {
      return Infinity;
    }
  }

  LoadNewSound(buffer, index) {
    // Create and link the sound to the AudioContext
    // Sound initialisation
    var sound = this.audioContext.createBufferSource(); // Create the sound

    sound.loop = true; // Set the sound to loop

    sound.buffer = buffer; // Set the sound buffer

    sound.connect(this.gains[index]); // Connect the sound to the other nodes

    return sound;
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsInJhbmdlIiwic2NhbGUiLCJjaXJjbGVTaXplIiwiYXVkaW9EYXRhIiwidHJ1ZVBvc2l0aW9ucyIsImF1ZGlvRmlsZXNOYW1lIiwibGlzdGVuZXJQb3NpdGlvbiIsIngiLCJ5IiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJuYlBvcyIsImxlbmd0aCIsImRpc3RhbmNlVmFsdWUiLCJkaXN0YW5jZVN1bSIsImdhaW5zVmFsdWUiLCJnYWluTm9ybSIsImdhaW5FeHBvc2FudCIsImF1ZGlvQ29udGV4dCIsIkF1ZGlvQ29udGV4dCIsInBsYXlpbmdTb3VuZHMiLCJnYWlucyIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiaSIsInB1c2giLCJSYW5nZSIsIlNjYWxpbmciLCJtb3lYIiwibWluWSIsIkNsb3Nlc3RTb3VyY2UiLCJjcmVhdGVHYWluIiwic3Vic2NyaWJlIiwicmVuZGVyIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsIlVwZGF0ZUNvbnRhaW5lciIsImxvYWRTb3VuZGJhbmsiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJWUG9zMlBpeGVsIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsInNvdW5kYmFua1RyZWUiLCJnZXQiLCJkZWZPYmoiLCJjaGlsZHJlbiIsImZvckVhY2giLCJsZWFmIiwidHlwZSIsIm5hbWUiLCJ1cmwiLCJsb2FkIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiaHRtbCIsImlkIiwiYmVnaW5CdXR0b24iLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsImNhbnZhcyIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNvbnNvbGUiLCJsb2ciLCJjaGFuZ2VkVG91Y2hlcyIsIkxvYWROZXdTb3VuZCIsImRhdGEiLCJjb25uZWN0IiwiZGVzdGluYXRpb24iLCJQb3NpdGlvbkNoYW5nZWQiLCJjb250YWluZXIiLCJyZXN1bWUiLCJ0ZW1wQ2lyY2xlIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJoZWlnaHQiLCJ3aWR0aCIsIlVwZGF0ZVNvdXJjZXNQb3NpdGlvbiIsIk5vdEluIiwiYmFja2dyb3VuZCIsInN0b3AiLCJkaXNjb25uZWN0IiwiVXBkYXRlU291cmNlc1NvdW5kIiwiaW5kZXgiLCJzb3VyY2VWYWx1ZSIsInBvdyIsImdhaW4iLCJzZXRWYWx1ZUF0VGltZSIsImxpc3RPZlBvaW50IiwibmJDbG9zZXN0IiwiY2xvc2VzdElkcyIsImN1cnJlbnRDbG9zZXN0SWQiLCJqIiwidW5kZWZpbmVkIiwiRGlzdGFuY2UiLCJwb2ludElkIiwibGlzdE9mSWRzIiwiaXRlcmF0b3IiLCJwb2ludEEiLCJwb2ludEIiLCJzcXJ0IiwiSW5maW5pdHkiLCJidWZmZXIiLCJzb3VuZCIsImNyZWF0ZUJ1ZmZlclNvdXJjZSIsImxvb3AiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTtcbiAgICAvLyB0aGlzLmFtYmlzb25pY3MgPSByZXF1aXJlKCdhbWJpc29uaWNzJyk7XG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluIHN0YXJ0KCkpXG4gICAgdGhpcy5zY2FsZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIFNjYWxlcyAoaW5pdGlhbGlzZWQgaW4gc3RhcnQoKSlcbiAgICB0aGlzLmNpcmNsZVNpemUgPSAyMDsgICAgICAgICAgICAgICAgIC8vIFNvdXJjZXMgc2l6ZVxuICAgIHRoaXMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJzsgICAgICAgLy8gU2V0IHRoZSBhdWRpbyBkYXRhIHRvIHVzZVxuXG4gICAgLy8gUG9zaXRpb25zIG9mIHRoZSBzb3VyY2VzXG4gICAgdGhpcy50cnVlUG9zaXRpb25zID0gW1xuICAgICAgWzMxLjAsIDQxLjVdLFxuICAgICAgWzMxLjAsIDM5LjBdLFxuICAgICAgWzMxLjAsIDM2LjJdLFxuICAgICAgWzM0LjUsIDM2LjJdLFxuICAgICAgWzM2LjgsIDM2LjJdLFxuICAgICAgWzM2LjgsIDMzLjZdLFxuICAgICAgWzM0LjUsIDMzLjZdLFxuICAgICAgWzMxLjAsIDMzLjZdLFxuICAgICAgWzMxLjAsIDMxLjBdLFxuICAgICAgWzM0LjUsIDMxLjBdLFxuICAgICAgWzM0LjUsIDI4LjBdLFxuICAgICAgWzMxLjAsIDI4LjBdLFxuICAgICAgWzMxLjAsIDI1LjhdLFxuICAgICAgWzM0LjUsIDI1LjhdLFxuICAgICAgWzM2LjgsIDI1LjhdLFxuICAgICAgWzM2LjgsIDIzLjZdLFxuICAgICAgWzM0LjUsIDIzLjZdLFxuICAgICAgWzMxLjAsIDIzLjZdLFxuICAgIF07XG5cbiAgICAvLyBTb3VuZHMgb2YgdGhlIHNvdXJjZXNcbiAgICB0aGlzLmF1ZGlvRmlsZXNOYW1lID0gW1xuICAgICAgXCIwMS53YXZcIiwgXG4gICAgICBcIjAyLndhdlwiLCBcbiAgICAgIFwiMDMud2F2XCIsIFxuICAgICAgXCIwNC53YXZcIiwgXG4gICAgICBcIjA1LndhdlwiLCBcbiAgICAgIFwiMDYud2F2XCIsIFxuICAgICAgXCIwNy53YXZcIiwgXG4gICAgICBcIjA4LndhdlwiLCBcbiAgICAgIFwiMDkud2F2XCIsIFxuICAgICAgXCIxMC53YXZcIiwgXG4gICAgICBcIjExLndhdlwiLCBcbiAgICAgIFwiMTIud2F2XCIsIFxuICAgICAgXCIxMy53YXZcIiwgXG4gICAgICBcIjE0LndhdlwiLCBcbiAgICAgIFwiMTUud2F2XCIsIFxuICAgICAgXCIxNi53YXZcIiwgXG4gICAgICBcIjE3LndhdlwiLCBcbiAgICAgIFwiMTgud2F2XCIsIFxuICAgIF07XG5cbiAgICAvLyBVc2VyIHBvc2l0aW9uc1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH07XG5cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdOyAgICAgICAgICAgICAgICAgIC8vIElkcyBvZiBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gW107ICAgICAgICAgIC8vIElkcyBvZiBwcmV2aW91cyBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7ICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBhdnRpdmUgc291cmNlc1xuICAgIHRoaXMucG9zaXRpb25zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2Ygc291cmNlcyBwb3NpdGlvbnMgKGJ1aWx0IGluIHN0YXJ0KCkpXG4gICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7ICAgICAvLyBOdW1iZXIgb2YgU291cmNlc1xuICAgIHRoaXMuZGlzdGFuY2VWYWx1ZSA9IFswLCAwLCAwLCAwXTsgICAgICAgICAgLy8gRGlzdGFuY2Ugb2YgY2xvc2VzdCBTb3VyY2VzXG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTdW0gb2YgZGlzdGFuY2VzIG9mIGNsb3Nlc3QgU291cmNlc1xuICAgIHRoaXMuZ2FpbnNWYWx1ZSA9IFsxLCAxLCAxXTsgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2YgR2FpbnNcbiAgICB0aGlzLmdhaW5Ob3JtID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vcm0gb2YgdGhlIEdhaW5zXG4gICAgdGhpcy5nYWluRXhwb3NhbnQgPSAzOyAgICAgICAgICAgICAgICAgICAgICAvLyBFc3Bvc2FudCB0byBpbmNyZWFzZSBHYWlucycgZ2FwXG5cbiAgICAvLyBDcmVhdGluZyBBdWRpb0NvbnRleHRcbiAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICB0aGlzLnBsYXlpbmdTb3VuZHMgPSBbXTsgICAgICAgICAgICAgICAgICAgIC8vIEJ1ZmZlclNvdXJjZXNcbiAgICB0aGlzLmdhaW5zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdhaW5zXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG4gICAgc3VwZXIuc3RhcnQoKTtcblxuICAgIC8vIEluaXRpYWxpc2luZyBvZiBTb3VyY2VzIHBvc2l0aW9ucyBkYXRhXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcbiAgICAgIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IHRoaXMudHJ1ZVBvc2l0aW9uc1tpXVswXSwgeTp0aGlzLnRydWVQb3NpdGlvbnNbaV1bMV19KTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGluZyAndGhpcy5yYW5nZSdcbiAgICB0aGlzLlJhbmdlKHRoaXMucG9zaXRpb25zKTtcblxuICAgIC8vIEluaXRpYWxpc2luZyAndGhpcy5zY2FsZSdcbiAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuXG4gICAgLy8gSW5pdGlhbGlzaW5nIFVzZXIncyBQb3NpdGlvblxuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdGhpcy5yYW5nZS5tb3lYO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgLy8gSW5pdGlhbGlzaW5nIENsb3Nlc3QgUG9pbnRzXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuXG4gICAgLy8gQ3JlYXRpbmcgR2FpbnNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzOyBpKyspIHtcbiAgICAgIHRoaXMuZ2FpbnMucHVzaChhd2FpdCB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCkpO1xuICAgIH1cblxuICAgIC8vIHN1YnNjcmliZSB0byBkaXNwbGF5IGxvYWRpbmcgc3RhdGVcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlbmRlcigpKTtcblxuICAgIC8vIEFkZCBFdmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIFdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG5cbiAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgfVxuXG4gICAgICAvLyBEaXNwbGF5XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuXG4gICAgLy8gaW5pdCB3aXRoIGN1cnJlbnQgY29udGVudFxuICAgIGF3YWl0IHRoaXMubG9hZFNvdW5kYmFuaygpO1xuICB9XG5cbiAgUmFuZ2UocG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0byBkaXNwbGF5IGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG4gICAgdmFyIHNjYWxlID0ge1ZQb3MyUGl4ZWw6IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMuY2lyY2xlU2l6ZSkvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5jaXJjbGVTaXplKS9yYW5nZVZhbHVlcy5yYW5nZVkpfTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIGxvYWRTb3VuZGJhbmsoKSB7IC8vIExvYWQgdGhlIGF1ZGlvRGF0YSB0byB1c2VcbiAgICBjb25zdCBzb3VuZGJhbmtUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCh0aGlzLmF1ZGlvRGF0YSk7XG4gICAgY29uc3QgZGVmT2JqID0ge307XG4gICAgc291bmRiYW5rVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xuICAgICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gICAgICAgIGRlZk9ialtsZWFmLm5hbWVdID0gbGVhZi51cmw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5sb2FkKGRlZk9iaiwgdHJ1ZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpO1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgaWYgKCFsb2FkaW5nKSB7XG4gICAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weDtcbiAgICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWx9cHg7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogeWVsbG93OyB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpLzJ9cHgsICR7dGhpcy5jaXJjbGVTaXplLzJ9cHgpO1wiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBpZD1cImxpc3RlbmVyXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IGhlaWdodDogMTZweDsgd2lkdGg6IDE2cHg7IGJhY2tncm91bmQ6IGJsdWU7IHRleHQtYWxpZ246IGNlbnRlcjsgei1pbmRleDogMTtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeyh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4LCAkeyh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4KSByb3RhdGUoNDVkZWcpXCI7PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgY2lyY2xlcyB0byBkaXNwbGF5IFNvdXJjZXNcbiAgICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpKVxuXG4gICAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIG1vdXNlXG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgICAgLy8gVXNpbmcgdG91Y2hcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSlcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXNpbmcgYXVkaW9Ob2Rlc1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICAgICAgICAgIHRoaXMucGxheWluZ1NvdW5kcy5wdXNoKHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YVt0aGlzLmF1ZGlvRmlsZXNOYW1lW3RoaXMuQ2xvc2VzdFBvaW50c0lkW2ldXV0sIGkpKTtcbiAgICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgICAgICAgaWYgKGkgIT0gdGhpcy5uYkNsb3Nlc3RQb2ludHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0YXJ0KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gR2V0IGFsbCB0aGUgZGF0YSBhbmQgc2V0IHRoZSBkaXNwbGF5IHRvIGJlZ2luXG4gICAgICAgICAgICB0aGlzLlBvc2l0aW9uQ2hhbmdlZCgpOyBcblxuICAgICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKGNvbnRhaW5lcikgeyAvLyBCZWdpbiBBdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgU291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XG5cbiAgICAvLyBCZWdpbiBBdWRpb0NvbnRleHRcbiAgICB0aGlzLmF1ZGlvQ29udGV4dC5yZXN1bWUoKTtcblxuICAgIC8vIEluaXRpYWxpc2luZyBhIHRlbXBvcmFyeSBjaXJjbGVcbiAgICB2YXIgdGVtcENpcmNsZTtcblxuICAgIC8vIENyZWF0ZSB0aGUgY2lyY2xlIGZvciB0aGUgU291cmNlc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHsgICAgIC8vIGZvcmVhY2ggU291cmNlc1xuICAgICAgdGVtcENpcmNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOyAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBlbGVtZW50XG4gICAgICB0ZW1wQ2lyY2xlLmlkID0gXCJjaXJjbGVcIiArIGk7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgICAgdGVtcENpcmNsZS5pbm5lckhUTUwgPSBpICsgMTsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIHZhbHVlIChpKzEpXG5cbiAgICAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlID0gXCJwb3NpdGlvbjogYWJzb2x1dGU7IG1hcmdpbjogMCAtMTBweDsgd2lkdGg6IFwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgaGVpZ2h0OiBcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGJvcmRlci1yYWRpdXM6XCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBsaW5lLWhlaWdodDogXCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBiYWNrZ3JvdW5kOiBncmV5O1wiO1xuICAgICAgdGVtcENpcmNsZS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweClcIjtcbiAgICAgIFxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUgdG8gdGhlIGRpc3BsYXlcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZW1wQ2lyY2xlKTtcbiAgICB9XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBMaXN0ZW5lcidzIFBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBMaXN0ZW5lcidzIFBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMuY2lyY2xlU2l6ZS8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5yYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgXG4gICAgICAvLyBTZXQgdGhlIHZhbHVlIHRvIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uXG4gICAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG4gICAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5jaXJjbGVTaXplLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuXG4gICAgICAvLyBVcGRhdGUgTGlzdGVuZXJcbiAgICAgIHRoaXMuVXBkYXRlTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLmNpcmNsZVNpemUvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG4gICAgXG4gICAgdGhpcy5VcGRhdGVMaXN0ZW5lcigpOyAgICAgICAgICAgIC8vIFVwZGF0ZSBMaXN0ZW5lclxuICAgIHRoaXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKCk7ICAgICAvLyBVcGRhdGUgU291cmNlcycgZGlzcGxheVxuICB9XG5cbiAgVXBkYXRlTGlzdGVuZXIoKSB7IC8vIFVwZGF0ZSBMaXN0ZW5lclxuXG4gICAgLy8gVXBkYXRlIExpc3RlbmVyJ3MgZGlwc2xheVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGlzdGVuZXJcIikuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwgLSB0aGlzLmNpcmNsZVNpemUvMikgKyBcInB4LCBcIiArICgodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4KSByb3RhdGUoNDVkZWcpXCI7XG4gICAgXG4gICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5IGZvciB0aGUgY3VycmVudCBQb3NpdGlvbiBvZiBMaXN0ZW5lclxuICAgIHRoaXMuUG9zaXRpb25DaGFuZ2VkKCk7ICBcbiAgfVxuXG4gIFBvc2l0aW9uQ2hhbmdlZCgpIHsgLy8gVXBkYXRlIHRoZSBjbG9zZXN0IFNvdXJjZXMgdG8gdXNlIHdoZW4gTGlzdGVuZXIncyBQb3NpdGlvbiBjaGFuZ2VkXG5cbiAgICAvLyBJbml0aWFsaXNpbmcgdmFyaWFibGVzXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFBvaW50c0lkO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjbG9zZXN0IFBvaW50c1xuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMsIHRoaXMubmJDbG9zZXN0UG9pbnRzKTtcbiAgICBcbiAgICAvLyBDaGVjayBhbGwgdGhlIG5ldyBjbG9zZXN0IFBvaW50c1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHMgLSAxOyBpKyspIHtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIElkIGlzIG5ldyBpbiAndGhpcy5DbG9zZXN0UG9pbnRzSWQnXG4gICAgICBpZiAodGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSAhPSB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSkge1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgRGlzcGxheSBmb3IgU291cmNlcyB0aGF0IGFyZSBub3QgYWN0aXZlXG4gICAgICAgIGlmICh0aGlzLk5vdEluKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0sIHRoaXMuQ2xvc2VzdFBvaW50c0lkKSB8fCB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldID09IHRoaXMuQ2xvc2VzdFBvaW50c0lkW3RoaXMubmJDbG9zZXN0UG9pbnRzIC0gMV0pIHtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwiZ3JleVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0b3AoKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcCB0aGUgcHJldmlvdXMgU291cmNlXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5kaXNjb25uZWN0KHRoaXMuZ2FpbnNbaV0pOyAgICAgIC8vIERpc2Nvbm5lY3QgdGhlIFNvdXJjZSBmcm9tIHRoZSBhdWRpb1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbmV3IFNvdW5kIGZvciB0aGUgbmV3IFNvdXJjZXNcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldID0gdGhpcy5Mb2FkTmV3U291bmQodGhpcy5hdWRpb0J1ZmZlckxvYWRlci5kYXRhW3RoaXMuYXVkaW9GaWxlc05hbWVbdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV1dXSwgaSk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXJ0IHRoZSBuZXcgU291cmNlXG4gICAgICB9XG5cbiAgICAvLyBVcGRhdGUgU291cmNlIHBhcmFtZXRlcnNcbiAgICB0aGlzLlVwZGF0ZVNvdXJjZXNTb3VuZChpKTtcbiAgICB9XG4gIH0gIFxuXG4gIFVwZGF0ZVNvdXJjZXNQb3NpdGlvbigpIHsgLy8gVXBkYXRlIHRoZSBQb3NpdGlvbnMgb2YgY2lyY2xlcyB3aGVuIHdpbmRvdyBpcyByZXNpemVkXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIGkpLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweCwgXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4KVwiO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZVNvdXJjZXNTb3VuZChpbmRleCkgeyAvLyBVcGRhdGUgR2FpbiBhbmQgRGlzcGxheSBvZiB0aGUgU291cmNlIGRlcGVuZGluZyBvbiBMaXN0ZW5lcidzIFBvc2l0aW9uXG5cbiAgICAvLyBTZXQgYSB1c2luZyB2YWx1ZSB0byB0aGUgU291cmNlXG4gICAgdmFyIHNvdXJjZVZhbHVlID0gdGhpcy5nYWluc1ZhbHVlW2luZGV4XS90aGlzLmdhaW5Ob3JtO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBEaXNwbGF5IG9mIHRoZSBTb3VyY2VcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaW5kZXhdKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZ2IoMCwgXCIgKyAyNTUqKDQqTWF0aC5wb3coc291cmNlVmFsdWUsIDIpKSArIFwiLCAwKVwiO1xuICAgIFxuICAgIC8vIFVwZGF0ZSB0aGUgR2FpbiBvZiB0aGUgU291cmNlXG4gICAgdGhpcy5nYWluc1tpbmRleF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZShzb3VyY2VWYWx1ZSwgMCk7XG4gICAgY29uc29sZS5sb2coc291cmNlVmFsdWUpXG4gIH1cblxuICBDbG9zZXN0U291cmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50LCBuYkNsb3Nlc3QpIHsgLy8gZ2V0IGNsb3Nlc3QgU291cmNlcyB0byB0aGUgTGlzdGVuZXJcbiAgICBcbiAgICAvLyBJbml0aWFsaXNpbmcgdGVtcG9yYXJ5IHZhcmlhYmxlcztcbiAgICB2YXIgY2xvc2VzdElkcyA9IFtdO1xuICAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xuXG4gICAgLy8gUmVzZXQgQ291bnRcbiAgICB0aGlzLmRpc3RhbmNlU3VtID0gMDtcbiAgICB0aGlzLmdhaW5Ob3JtID0gMDtcblxuICAgIC8vIEdldCB0aGUgJ25iQ2xvc2VzdCcgY2xvc2VzdCBJZHNcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5iQ2xvc2VzdDsgaisrKSB7XG5cbiAgICAgIC8vIFNldCAndW5kZWZpbmVkJyB0byB0aGUgY3VycmVudENsb3Nlc3RJZCB0byBpZ25vcmUgZGlmZmljdWx0aWVzIHdpdGggaW5pdGlhbCB2YWx1ZXNcbiAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdE9mUG9pbnQubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgSWQgaXMgbm90IGFscmVhZHkgaW4gdGhlIGNsb3Nlc3QgSWRzIGFuZCBpZiB0aGUgU291cmNlIG9mIHRoaXMgSWQgaXMgY2xvc2VzdFxuICAgICAgICBpZiAodGhpcy5Ob3RJbihpLCBjbG9zZXN0SWRzKSAmJiB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2ldKSA8IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pKSB7XG4gICAgICAgICAgY3VycmVudENsb3Nlc3RJZCA9IGk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGogIT0gbmJDbG9zZXN0IC0gMSkge1xuICAgICAgICAvLyBHZXQgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIExpc3RlbmVyIGFuZCB0aGUgU291cmNlXG4gICAgICAgIHRoaXMuZGlzdGFuY2VWYWx1ZVtqXSA9IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pO1xuXG4gICAgICAgIC8vIEluY3JlbWVudCAndGhpcy5kaXN0YW5jZVN1bSdcbiAgICAgICAgdGhpcy5kaXN0YW5jZVN1bSArPSB0aGlzLmRpc3RhbmNlVmFsdWVbal07XG4gICAgICB9XG5cbiAgICAgIC8vIFB1c2ggdGhlIElkIGluIHRoZSBjbG9zZXN0XG4gICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBHYWlucyBhbmQgdGhlIEdhaW5zIG5vcm1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZ2FpbnNWYWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5nYWluc1ZhbHVlW2ldID0gTWF0aC5wb3coKDEgLSB0aGlzLmRpc3RhbmNlVmFsdWVbaV0vdGhpcy5kaXN0YW5jZVN1bSksIHRoaXMuZ2FpbkV4cG9zYW50KTtcbiAgICAgIHRoaXMuZ2Fpbk5vcm0gKz0gdGhpcy5nYWluc1ZhbHVlW2ldO1xuICAgIH1cblxuICAgIHJldHVybiAoY2xvc2VzdElkcyk7XG4gIH1cblxuICBOb3RJbihwb2ludElkLCBsaXN0T2ZJZHMpIHsgLy8gQ2hlY2sgaWYgYW4gSWQgaXMgbm90IGluIGFuIElkcycgYXJyYXlcbiAgICB2YXIgaXRlcmF0b3IgPSAwO1xuICAgIHdoaWxlIChpdGVyYXRvciA8IGxpc3RPZklkcy5sZW5ndGggJiYgcG9pbnRJZCAhPSBsaXN0T2ZJZHNbaXRlcmF0b3JdKSB7XG4gICAgICBpdGVyYXRvciArPSAxO1xuICAgIH1cbiAgICByZXR1cm4oaXRlcmF0b3IgPj0gbGlzdE9mSWRzLmxlbmd0aCk7XG4gIH1cblxuICBEaXN0YW5jZShwb2ludEEsIHBvaW50QikgeyAvLyBHZXQgdGhlIGRpc3RhbmNlIGJldHdlZW4gMiBwb2ludHNcbiAgICBpZiAocG9pbnRCICE9IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIChNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnRBLnggLSBwb2ludEIueCwgMikgKyBNYXRoLnBvdyhwb2ludEEueSAtIHBvaW50Qi55LCAyKSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiAoSW5maW5pdHkpO1xuICAgIH1cbiAgfVxuXG4gIExvYWROZXdTb3VuZChidWZmZXIsIGluZGV4KSB7IC8vIENyZWF0ZSBhbmQgbGluayB0aGUgc291bmQgdG8gdGhlIEF1ZGlvQ29udGV4dFxuICAgIC8vIFNvdW5kIGluaXRpYWxpc2F0aW9uXG4gICAgdmFyIHNvdW5kID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7ICAgLy8gQ3JlYXRlIHRoZSBzb3VuZFxuICAgIHNvdW5kLmxvb3AgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgc291bmQgdG8gbG9vcFxuICAgIHNvdW5kLmJ1ZmZlciA9IGJ1ZmZlcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgc291bmQgYnVmZmVyXG4gICAgc291bmQuY29ubmVjdCh0aGlzLmdhaW5zW2luZGV4XSk7ICAgICAgICAgICAgICAgICAgICAgLy8gQ29ubmVjdCB0aGUgc291bmQgdG8gdGhlIG90aGVyIG5vZGVzXG4gICAgcmV0dXJuIChzb3VuZCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDO0lBQzNDLE1BQU1GLE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxJQUFiLENBTDJDLENBTzNDOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtB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