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
    this.previousClosestPointsId = this.ClosestPointsId;
    this.distanceSum = 0; // Update the closest Points

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
    var sourceValue = (this.distanceSum - this.distanceValue[index]) / ((this.nbClosestPoints - 2) * this.distanceSum); // Update the Display of the Source

    document.getElementById("circle" + this.ClosestPointsId[index]).style.background = "rgb(0, " + 255 * (4 * Math.pow(sourceValue, 2)) + ", 0)"; // Update the Gain of the Source

    this.gains[index].gain.setValueAtTime(sourceValue, 0);
    console.log(sourceValue);
  }

  ClosestSource(listenerPosition, listOfPoint, nbClosest) {
    // get closest Sources to the Listener
    // Initialising temporary variables;
    var closestIds = [];
    var currentClosestId; // Get the 'nbClosest' closest Ids

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
        // Get the distance between the listener ant the source
        this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]); // Increment 'this.distanceSum'

        this.distanceSum += this.distanceValue[j];
      } // Push the Id in the closest


      closestIds.push(currentClosestId);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsInJhbmdlIiwic2NhbGUiLCJjaXJjbGVTaXplIiwiYXVkaW9EYXRhIiwidHJ1ZVBvc2l0aW9ucyIsImF1ZGlvRmlsZXNOYW1lIiwibGlzdGVuZXJQb3NpdGlvbiIsIngiLCJ5IiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJuYlBvcyIsImxlbmd0aCIsImRpc3RhbmNlVmFsdWUiLCJkaXN0YW5jZVN1bSIsImF1ZGlvQ29udGV4dCIsIkF1ZGlvQ29udGV4dCIsInBsYXlpbmdTb3VuZHMiLCJnYWlucyIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiaSIsInB1c2giLCJSYW5nZSIsIlNjYWxpbmciLCJtb3lYIiwibWluWSIsIkNsb3Nlc3RTb3VyY2UiLCJjcmVhdGVHYWluIiwic3Vic2NyaWJlIiwicmVuZGVyIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsIlVwZGF0ZUNvbnRhaW5lciIsImxvYWRTb3VuZGJhbmsiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJWUG9zMlBpeGVsIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsInNvdW5kYmFua1RyZWUiLCJnZXQiLCJkZWZPYmoiLCJjaGlsZHJlbiIsImZvckVhY2giLCJsZWFmIiwidHlwZSIsIm5hbWUiLCJ1cmwiLCJsb2FkIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiaHRtbCIsImlkIiwiYmVnaW5CdXR0b24iLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsImNhbnZhcyIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNvbnNvbGUiLCJsb2ciLCJjaGFuZ2VkVG91Y2hlcyIsIkxvYWROZXdTb3VuZCIsImRhdGEiLCJjb25uZWN0IiwiZGVzdGluYXRpb24iLCJQb3NpdGlvbkNoYW5nZWQiLCJjb250YWluZXIiLCJyZXN1bWUiLCJ0ZW1wQ2lyY2xlIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJoZWlnaHQiLCJ3aWR0aCIsIlVwZGF0ZVNvdXJjZXNQb3NpdGlvbiIsIk5vdEluIiwiYmFja2dyb3VuZCIsInN0b3AiLCJkaXNjb25uZWN0IiwiVXBkYXRlU291cmNlc1NvdW5kIiwiaW5kZXgiLCJzb3VyY2VWYWx1ZSIsInBvdyIsImdhaW4iLCJzZXRWYWx1ZUF0VGltZSIsImxpc3RPZlBvaW50IiwibmJDbG9zZXN0IiwiY2xvc2VzdElkcyIsImN1cnJlbnRDbG9zZXN0SWQiLCJqIiwidW5kZWZpbmVkIiwiRGlzdGFuY2UiLCJwb2ludElkIiwibGlzdE9mSWRzIiwiaXRlcmF0b3IiLCJwb2ludEEiLCJwb2ludEIiLCJzcXJ0IiwiSW5maW5pdHkiLCJidWZmZXIiLCJzb3VuZCIsImNyZWF0ZUJ1ZmZlclNvdXJjZSIsImxvb3AiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTtcbiAgICAvLyB0aGlzLmFtYmlzb25pY3MgPSByZXF1aXJlKCdhbWJpc29uaWNzJyk7XG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluIHN0YXJ0KCkpXG4gICAgdGhpcy5zY2FsZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIFNjYWxlcyAoaW5pdGlhbGlzZWQgaW4gc3RhcnQoKSlcbiAgICB0aGlzLmNpcmNsZVNpemUgPSAyMDsgICAgICAgICAgICAgICAgIC8vIFNvdXJjZXMgc2l6ZVxuICAgIHRoaXMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJzsgICAgICAgLy8gU2V0IHRoZSBhdWRpbyBkYXRhIHRvIHVzZVxuXG4gICAgLy8gUG9zaXRpb25zIG9mIHRoZSBzb3VyY2VzXG4gICAgdGhpcy50cnVlUG9zaXRpb25zID0gW1xuICAgICAgWzMxLjAsIDQxLjVdLFxuICAgICAgWzMxLjAsIDM5LjBdLFxuICAgICAgWzMxLjAsIDM2LjJdLFxuICAgICAgWzM0LjUsIDM2LjJdLFxuICAgICAgWzM2LjgsIDM2LjJdLFxuICAgICAgWzM2LjgsIDMzLjZdLFxuICAgICAgWzM0LjUsIDMzLjZdLFxuICAgICAgWzMxLjAsIDMzLjZdLFxuICAgICAgWzMxLjAsIDMxLjBdLFxuICAgICAgWzM0LjUsIDMxLjBdLFxuICAgICAgWzM0LjUsIDI4LjBdLFxuICAgICAgWzMxLjAsIDI4LjBdLFxuICAgICAgWzMxLjAsIDI1LjhdLFxuICAgICAgWzM0LjUsIDI1LjhdLFxuICAgICAgWzM2LjgsIDI1LjhdLFxuICAgICAgWzM2LjgsIDIzLjZdLFxuICAgICAgWzM0LjUsIDIzLjZdLFxuICAgICAgWzMxLjAsIDIzLjZdLFxuICAgIF07XG5cbiAgICAvLyBTb3VuZHMgb2YgdGhlIHNvdXJjZXNcbiAgICB0aGlzLmF1ZGlvRmlsZXNOYW1lID0gW1xuICAgICAgXCIwMS53YXZcIiwgXG4gICAgICBcIjAyLndhdlwiLCBcbiAgICAgIFwiMDMud2F2XCIsIFxuICAgICAgXCIwNC53YXZcIiwgXG4gICAgICBcIjA1LndhdlwiLCBcbiAgICAgIFwiMDYud2F2XCIsIFxuICAgICAgXCIwNy53YXZcIiwgXG4gICAgICBcIjA4LndhdlwiLCBcbiAgICAgIFwiMDkud2F2XCIsIFxuICAgICAgXCIxMC53YXZcIiwgXG4gICAgICBcIjExLndhdlwiLCBcbiAgICAgIFwiMTIud2F2XCIsIFxuICAgICAgXCIxMy53YXZcIiwgXG4gICAgICBcIjE0LndhdlwiLCBcbiAgICAgIFwiMTUud2F2XCIsIFxuICAgICAgXCIxNi53YXZcIiwgXG4gICAgICBcIjE3LndhdlwiLCBcbiAgICAgIFwiMTgud2F2XCIsIFxuICAgIF07XG5cbiAgICAvLyBVc2VyIHBvc2l0aW9uc1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH07XG5cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdOyAgICAgICAgICAgICAgICAgIC8vIElkcyBvZiBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gW107ICAgICAgICAgIC8vIElkcyBvZiBwcmV2aW91cyBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7ICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBhdnRpdmUgc291cmNlc1xuICAgIHRoaXMucG9zaXRpb25zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2Ygc291cmNlcyBwb3NpdGlvbnMgKGJ1aWx0IGluIHN0YXJ0KCkpXG4gICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7ICAgICAvLyBOdW1iZXIgb2YgU291cmNlc1xuICAgIHRoaXMuZGlzdGFuY2VWYWx1ZSA9IFswLCAwLCAwLCAwXTsgICAgICAgICAgLy8gRGlzdGFuY2Ugb2YgY2xvc2VzdCBTb3VyY2VzXG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTdW0gb2YgZGlzdGFuY2VzIG9mIGNsb3Nlc3QgU291cmNlc1xuXG4gICAgLy8gQ3JlYXRpbmcgQXVkaW9Db250ZXh0XG4gICAgdGhpcy5hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgdGhpcy5wbGF5aW5nU291bmRzID0gW107ICAgICAgICAgICAgICAgICAgICAvLyBCdWZmZXJTb3VyY2VzXG4gICAgdGhpcy5nYWlucyA9IFtdOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHYWluc1xuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBJbml0aWFsaXNpbmcgb2YgU291cmNlcyBwb3NpdGlvbnMgZGF0YVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYlBvczsgaSsrKSB7XG4gICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKHt4OiB0aGlzLnRydWVQb3NpdGlvbnNbaV1bMF0sIHk6dGhpcy50cnVlUG9zaXRpb25zW2ldWzFdfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRpbmcgJ3RoaXMucmFuZ2UnXG4gICAgdGhpcy5SYW5nZSh0aGlzLnBvc2l0aW9ucyk7XG5cbiAgICAvLyBJbml0aWFsaXNpbmcgJ3RoaXMuc2NhbGUnXG4gICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgIC8vIEluaXRpYWxpc2luZyBVc2VyJ3MgUG9zaXRpb25cbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHRoaXMucmFuZ2UubW95WDtcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHRoaXMucmFuZ2UubWluWTtcblxuICAgIC8vIEluaXRpYWxpc2luZyBDbG9zZXN0IFBvaW50c1xuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMsIHRoaXMubmJDbG9zZXN0UG9pbnRzKTtcblxuICAgIC8vIENyZWF0aW5nIEdhaW5zXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICB0aGlzLmdhaW5zLnB1c2goYXdhaXQgdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpKTtcbiAgICB9XG5cbiAgICAvLyBzdWJzY3JpYmUgdG8gZGlzcGxheSBsb2FkaW5nIHN0YXRlXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW5kZXIoKSk7XG5cbiAgICAvLyBBZGQgRXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSBXaW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBTdGF0ZVxuICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgIH1cblxuICAgICAgLy8gRGlzcGxheVxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcblxuICAgIC8vIGluaXQgd2l0aCBjdXJyZW50IGNvbnRlbnRcbiAgICBhd2FpdCB0aGlzLmxvYWRTb3VuZGJhbmsoKTtcbiAgfVxuXG4gIFJhbmdlKHBvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IHBvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IHBvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdG8gZGlzcGxheSBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuICAgIHZhciBzY2FsZSA9IHtWUG9zMlBpeGVsOiBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLmNpcmNsZVNpemUpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMuY2lyY2xlU2l6ZSkvcmFuZ2VWYWx1ZXMucmFuZ2VZKX07XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICBsb2FkU291bmRiYW5rKCkgeyAvLyBMb2FkIHRoZSBhdWRpb0RhdGEgdG8gdXNlXG4gICAgY29uc3Qgc291bmRiYW5rVHJlZSA9IHRoaXMuZmlsZXN5c3RlbS5nZXQodGhpcy5hdWRpb0RhdGEpO1xuICAgIGNvbnN0IGRlZk9iaiA9IHt9O1xuICAgIHNvdW5kYmFua1RyZWUuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcbiAgICAgIGlmIChsZWFmLnR5cGUgPT09ICdmaWxlJykge1xuICAgICAgICBkZWZPYmpbbGVhZi5uYW1lXSA9IGxlYWYudXJsO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZChkZWZPYmosIHRydWUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICBjb25zdCBsb2FkaW5nID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5nZXQoJ2xvYWRpbmcnKTtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIGlmICghbG9hZGluZykge1xuICAgICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWx9cHg7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKS8yfXB4LCAke3RoaXMuY2lyY2xlU2l6ZS8yfXB4KTtcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgaWQ9XCJsaXN0ZW5lclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDE2cHg7IHdpZHRoOiAxNnB4OyBiYWNrZ3JvdW5kOiBibHVlOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHotaW5kZXg6IDE7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weCwgJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weCkgcm90YXRlKDQ1ZGVnKVwiOz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGNpcmNsZXMgdG8gZGlzcGxheSBTb3VyY2VzXG4gICAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKSlcblxuICAgICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuXG4gICAgICAgICAgICAvLyBVc2luZyBtb3VzZVxuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIHRvdWNoXG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhldnQuY2hhbmdlZFRvdWNoZXNbMF0pXG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGlzaW5nIGF1ZGlvTm9kZXNcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbdGhpcy5hdWRpb0ZpbGVzTmFtZVt0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXV1dLCBpKSk7XG4gICAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICAgICAgICAgIGlmIChpICE9IHRoaXMubmJDbG9zZXN0UG9pbnRzIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEdldCBhbGwgdGhlIGRhdGEgYW5kIHNldCB0aGUgZGlzcGxheSB0byBiZWdpblxuICAgICAgICAgICAgdGhpcy5Qb3NpdGlvbkNoYW5nZWQoKTsgXG5cbiAgICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZChjb250YWluZXIpIHsgLy8gQmVnaW4gQXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIFNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQmVnaW4gQXVkaW9Db250ZXh0XG4gICAgdGhpcy5hdWRpb0NvbnRleHQucmVzdW1lKCk7XG5cbiAgICAvLyBJbml0aWFsaXNpbmcgYSB0ZW1wb3JhcnkgY2lyY2xlXG4gICAgdmFyIHRlbXBDaXJjbGU7XG5cbiAgICAvLyBDcmVhdGUgdGhlIGNpcmNsZSBmb3IgdGhlIFNvdXJjZXNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7ICAgICAvLyBmb3JlYWNoIFNvdXJjZXNcbiAgICAgIHRlbXBDaXJjbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgZWxlbWVudFxuICAgICAgdGVtcENpcmNsZS5pZCA9IFwiY2lyY2xlXCIgKyBpOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgaWRcbiAgICAgIHRlbXBDaXJjbGUuaW5uZXJIVE1MID0gaSArIDE7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSB2YWx1ZSAoaSsxKVxuXG4gICAgICAvLyBDaGFuZ2UgZm9ybSBhbmQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgdG8gZ2V0IGEgY2lyY2xlIGF0IHRoZSBnb29kIHBsYWNlO1xuICAgICAgdGVtcENpcmNsZS5zdHlsZSA9IFwicG9zaXRpb246IGFic29sdXRlOyBtYXJnaW46IDAgLTEwcHg7IHdpZHRoOiBcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGhlaWdodDogXCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBib3JkZXItcmFkaXVzOlwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgbGluZS1oZWlnaHQ6IFwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgYmFja2dyb3VuZDogZ3JleTtcIjtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4LCBcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgpXCI7XG4gICAgICBcbiAgICAgIC8vIEFkZCB0aGUgY2lyY2xlIHRvIHRoZSBkaXNwbGF5XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcENpcmNsZSk7XG4gICAgfVxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgTGlzdGVuZXIncyBQb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG5cbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgTGlzdGVuZXIncyBQb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLmNpcmNsZVNpemUvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5yYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgIFxuICAgICAgLy8gU2V0IHRoZSB2YWx1ZSB0byB0aGUgTGlzdGVuZXIncyBQb3NpdGlvblxuICAgICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuICAgICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMuY2lyY2xlU2l6ZS8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcblxuICAgICAgLy8gVXBkYXRlIExpc3RlbmVyXG4gICAgICB0aGlzLlVwZGF0ZUxpc3RlbmVyKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uIFVwZGF0ZVxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cbiAgICAvLyBDaGFuZ2Ugc2l6ZVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5jaXJjbGVTaXplLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuICAgIFxuICAgIHRoaXMuVXBkYXRlTGlzdGVuZXIoKTsgICAgICAgICAgICAvLyBVcGRhdGUgTGlzdGVuZXJcbiAgICB0aGlzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbigpOyAgICAgLy8gVXBkYXRlIFNvdXJjZXMnIGRpc3BsYXlcbiAgfVxuXG4gIFVwZGF0ZUxpc3RlbmVyKCkgeyAvLyBVcGRhdGUgTGlzdGVuZXJcblxuICAgIC8vIFVwZGF0ZSBMaXN0ZW5lcidzIGRpcHNsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxpc3RlbmVyXCIpLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsIC0gdGhpcy5jaXJjbGVTaXplLzIpICsgXCJweCwgXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweCkgcm90YXRlKDQ1ZGVnKVwiO1xuICAgIFxuICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheSBmb3IgdGhlIGN1cnJlbnQgUG9zaXRpb24gb2YgTGlzdGVuZXJcbiAgICB0aGlzLlBvc2l0aW9uQ2hhbmdlZCgpOyAgXG4gIH1cblxuICBQb3NpdGlvbkNoYW5nZWQoKSB7IC8vIFVwZGF0ZSB0aGUgY2xvc2VzdCBTb3VyY2VzIHRvIHVzZSB3aGVuIExpc3RlbmVyJ3MgUG9zaXRpb24gY2hhbmdlZFxuXG4gICAgLy8gSW5pdGlhbGlzaW5nIHZhcmlhYmxlc1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RQb2ludHNJZDtcbiAgICB0aGlzLmRpc3RhbmNlU3VtID0gMDtcblxuICAgIC8vIFVwZGF0ZSB0aGUgY2xvc2VzdCBQb2ludHNcbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XG4gICAgXG4gICAgLy8gQ2hlY2sgYWxsIHRoZSBuZXcgY2xvc2VzdCBQb2ludHNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzIC0gMTsgaSsrKSB7XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZSBJZCBpcyBuZXcgaW4gJ3RoaXMuQ2xvc2VzdFBvaW50c0lkJ1xuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pIHtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIERpc3BsYXkgZm9yIFNvdXJjZXMgdGhhdCBhcmUgbm90IGFjdGl2ZVxuICAgICAgICBpZiAodGhpcy5Ob3RJbih0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldLCB0aGlzLkNsb3Nlc3RQb2ludHNJZCkgfHwgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSA9PSB0aGlzLkNsb3Nlc3RQb2ludHNJZFt0aGlzLm5iQ2xvc2VzdFBvaW50cyAtIDFdKSB7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcImdyZXlcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdG9wKCk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3AgdGhlIHByZXZpb3VzIFNvdXJjZVxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zW2ldKTsgICAgICAvLyBEaXNjb25uZWN0IHRoZSBTb3VyY2UgZnJvbSB0aGUgYXVkaW9cblxuICAgICAgICAvLyBVcGRhdGUgdGhlIG5ldyBTb3VuZCBmb3IgdGhlIG5ldyBTb3VyY2VzXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXSA9IHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YVt0aGlzLmF1ZGlvRmlsZXNOYW1lW3RoaXMuQ2xvc2VzdFBvaW50c0lkW2ldXV0sIGkpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RhcnQoKTsgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdGFydCB0aGUgbmV3IFNvdXJjZVxuICAgICAgfVxuXG4gICAgLy8gVXBkYXRlIFNvdXJjZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5VcGRhdGVTb3VyY2VzU291bmQoaSk7XG4gICAgfVxuICB9ICBcblxuICBVcGRhdGVTb3VyY2VzUG9zaXRpb24oKSB7IC8vIFVwZGF0ZSB0aGUgUG9zaXRpb25zIG9mIGNpcmNsZXMgd2hlbiB3aW5kb3cgaXMgcmVzaXplZFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyBpKS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweClcIjtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVTb3VyY2VzU291bmQoaW5kZXgpIHsgLy8gVXBkYXRlIEdhaW4gYW5kIERpc3BsYXkgb2YgdGhlIFNvdXJjZSBkZXBlbmRpbmcgb24gTGlzdGVuZXIncyBQb3NpdGlvblxuXG4gICAgLy8gU2V0IGEgdXNpbmcgdmFsdWUgdG8gdGhlIFNvdXJjZVxuICAgIHZhciBzb3VyY2VWYWx1ZSA9ICh0aGlzLmRpc3RhbmNlU3VtIC0gdGhpcy5kaXN0YW5jZVZhbHVlW2luZGV4XSkvKCh0aGlzLm5iQ2xvc2VzdFBvaW50cyAtIDIpKnRoaXMuZGlzdGFuY2VTdW0pO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBEaXNwbGF5IG9mIHRoZSBTb3VyY2VcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaW5kZXhdKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZ2IoMCwgXCIgKyAyNTUqKDQqTWF0aC5wb3coc291cmNlVmFsdWUsIDIpKSArIFwiLCAwKVwiO1xuICAgIFxuICAgIC8vIFVwZGF0ZSB0aGUgR2FpbiBvZiB0aGUgU291cmNlXG4gICAgdGhpcy5nYWluc1tpbmRleF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZShzb3VyY2VWYWx1ZSwgMCk7XG4gICAgY29uc29sZS5sb2coc291cmNlVmFsdWUpXG4gIH1cblxuICBDbG9zZXN0U291cmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50LCBuYkNsb3Nlc3QpIHsgLy8gZ2V0IGNsb3Nlc3QgU291cmNlcyB0byB0aGUgTGlzdGVuZXJcbiAgICBcbiAgICAvLyBJbml0aWFsaXNpbmcgdGVtcG9yYXJ5IHZhcmlhYmxlcztcbiAgICB2YXIgY2xvc2VzdElkcyA9IFtdO1xuICAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xuXG4gICAgLy8gR2V0IHRoZSAnbmJDbG9zZXN0JyBjbG9zZXN0IElkc1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbmJDbG9zZXN0OyBqKyspIHtcblxuICAgICAgLy8gU2V0ICd1bmRlZmluZWQnIHRvIHRoZSBjdXJyZW50Q2xvc2VzdElkIHRvIGlnbm9yZSBkaWZmaWN1bHRpZXMgd2l0aCBpbml0aWFsIHZhbHVlc1xuICAgICAgY3VycmVudENsb3Nlc3RJZCA9IHVuZGVmaW5lZDtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0T2ZQb2ludC5sZW5ndGg7IGkrKykge1xuXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSBJZCBpcyBub3QgYWxyZWFkeSBpbiB0aGUgY2xvc2VzdCBJZHMgYW5kIGlmIHRoZSBTb3VyY2Ugb2YgdGhpcyBJZCBpcyBjbG9zZXN0XG4gICAgICAgIGlmICh0aGlzLk5vdEluKGksIGNsb3Nlc3RJZHMpICYmIHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbaV0pIDwgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSkpIHtcbiAgICAgICAgICBjdXJyZW50Q2xvc2VzdElkID0gaTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaiAhPSBuYkNsb3Nlc3QgLSAxKSB7XG4gICAgICAgIC8vIEdldCB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgbGlzdGVuZXIgYW50IHRoZSBzb3VyY2VcbiAgICAgICAgdGhpcy5kaXN0YW5jZVZhbHVlW2pdID0gdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSk7XG4gICAgICAgIFxuICAgICAgICAvLyBJbmNyZW1lbnQgJ3RoaXMuZGlzdGFuY2VTdW0nXG4gICAgICAgIHRoaXMuZGlzdGFuY2VTdW0gKz0gdGhpcy5kaXN0YW5jZVZhbHVlW2pdO1xuICAgICAgfVxuXG4gICAgICAvLyBQdXNoIHRoZSBJZCBpbiB0aGUgY2xvc2VzdFxuICAgICAgY2xvc2VzdElkcy5wdXNoKGN1cnJlbnRDbG9zZXN0SWQpO1xuICAgIH1cbiAgICByZXR1cm4gKGNsb3Nlc3RJZHMpO1xuICB9XG5cbiAgTm90SW4ocG9pbnRJZCwgbGlzdE9mSWRzKSB7IC8vIENoZWNrIGlmIGFuIElkIGlzIG5vdCBpbiBhbiBJZHMnIGFycmF5XG4gICAgdmFyIGl0ZXJhdG9yID0gMDtcbiAgICB3aGlsZSAoaXRlcmF0b3IgPCBsaXN0T2ZJZHMubGVuZ3RoICYmIHBvaW50SWQgIT0gbGlzdE9mSWRzW2l0ZXJhdG9yXSkge1xuICAgICAgaXRlcmF0b3IgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuKGl0ZXJhdG9yID49IGxpc3RPZklkcy5sZW5ndGgpO1xuICB9XG5cbiAgRGlzdGFuY2UocG9pbnRBLCBwb2ludEIpIHsgLy8gR2V0IHRoZSBkaXN0YW5jZSBiZXR3ZWVuIDIgcG9pbnRzXG4gICAgaWYgKHBvaW50QiAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAoTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50QS54IC0gcG9pbnRCLngsIDIpICsgTWF0aC5wb3cocG9pbnRBLnkgLSBwb2ludEIueSwgMikpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gKEluZmluaXR5KTtcbiAgICB9XG4gIH1cblxuICBMb2FkTmV3U291bmQoYnVmZmVyLCBpbmRleCkgeyAvLyBDcmVhdGUgYW5kIGxpbmsgdGhlIHNvdW5kIHRvIHRoZSBBdWRpb0NvbnRleHRcbiAgICAvLyBTb3VuZCBpbml0aWFsaXNhdGlvblxuICAgIHZhciBzb3VuZCA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpOyAgIC8vIENyZWF0ZSB0aGUgc291bmRcbiAgICBzb3VuZC5sb29wID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIHNvdW5kIHRvIGxvb3BcbiAgICBzb3VuZC5idWZmZXIgPSBidWZmZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIHNvdW5kIGJ1ZmZlclxuICAgIHNvdW5kLmNvbm5lY3QodGhpcy5nYWluc1tpbmRleF0pOyAgICAgICAgICAgICAgICAgICAgIC8vIENvbm5lY3QgdGhlIHNvdW5kIHRvIHRoZSBvdGhlciBub2Rlc1xuICAgIHJldHVybiAoc291bmQpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQztJQUMzQyxNQUFNRixNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLQyxLQUFMLEdBQWEsSUFBYixDQUwyQyxDQU8zQzs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FSMkMsQ0FTM0M7O0lBQ0EsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVYyQyxDQVkzQzs7SUFDQSxLQUFLRSxZQUFMLEdBQW9CLElBQXBCO0lBQ0EsS0FBS0MsWUFBTCxHQUFvQixLQUFwQjtJQUNBLEtBQUtDLFNBQUwsR0FBaUIsS0FBakI7SUFDQSxLQUFLQyxPQUFMLEdBQWUsS0FBZixDQWhCMkMsQ0FrQjNDOztJQUNBLEtBQUtDLEtBQUwsQ0FuQjJDLENBbUJMOztJQUN0QyxLQUFLQyxLQUFMLENBcEIyQyxDQW9CTDs7SUFDdEMsS0FBS0MsVUFBTCxHQUFrQixFQUFsQixDQXJCMkMsQ0FxQkw7O0lBQ3RDLEtBQUtDLFNBQUwsR0FBaUIsYUFBakIsQ0F0QjJDLENBc0JMO0lBRXRDOztJQUNBLEtBQUtDLGFBQUwsR0FBcUIsQ0FDbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQURtQixFQUVuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBRm1CLEVBR25CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FIbUIs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