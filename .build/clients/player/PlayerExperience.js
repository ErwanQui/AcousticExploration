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
              this.playingSounds[i].start();
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

    for (let i = 0; i < this.nbClosestPoints; i++) {
      // Check if the Id is new in 'this.ClosestPointsId'
      if (this.previousClosestPointsId[i] != this.ClosestPointsId[i]) {
        // Update the Display for Sources that are not active
        if (this.NotIn(this.previousClosestPointsId[i], this.ClosestPointsId)) {
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
    var sourceValue = this.distanceValue[index] / this.distanceSum; // Update the Display of the Source

    document.getElementById("circle" + this.ClosestPointsId[index]).style.background = "rgb(0, " + 255 * (1 - 2 * sourceValue) + ", 0)"; // Update the Gain of the Source

    this.gains[index].gain.setValueAtTime(1 - 3 * sourceValue, 0);
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
      } // Get the distance between the listener ant the source


      this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]); // Increment 'this.distanceSum'

      this.distanceSum += this.distanceValue[j]; // Push the Id in the closest

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsInJhbmdlIiwic2NhbGUiLCJjaXJjbGVTaXplIiwiYXVkaW9EYXRhIiwidHJ1ZVBvc2l0aW9ucyIsImF1ZGlvRmlsZXNOYW1lIiwibGlzdGVuZXJQb3NpdGlvbiIsIngiLCJ5IiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJuYlBvcyIsImxlbmd0aCIsImRpc3RhbmNlVmFsdWUiLCJkaXN0YW5jZVN1bSIsImF1ZGlvQ29udGV4dCIsIkF1ZGlvQ29udGV4dCIsInBsYXlpbmdTb3VuZHMiLCJnYWlucyIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiaSIsInB1c2giLCJSYW5nZSIsIlNjYWxpbmciLCJtb3lYIiwibWluWSIsIkNsb3Nlc3RTb3VyY2UiLCJjcmVhdGVHYWluIiwic3Vic2NyaWJlIiwicmVuZGVyIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsIlVwZGF0ZUNvbnRhaW5lciIsImxvYWRTb3VuZGJhbmsiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJWUG9zMlBpeGVsIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsInNvdW5kYmFua1RyZWUiLCJnZXQiLCJkZWZPYmoiLCJjaGlsZHJlbiIsImZvckVhY2giLCJsZWFmIiwidHlwZSIsIm5hbWUiLCJ1cmwiLCJsb2FkIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiaHRtbCIsImlkIiwiYmVnaW5CdXR0b24iLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsImNhbnZhcyIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNvbnNvbGUiLCJsb2ciLCJjaGFuZ2VkVG91Y2hlcyIsIkxvYWROZXdTb3VuZCIsImRhdGEiLCJjb25uZWN0IiwiZGVzdGluYXRpb24iLCJQb3NpdGlvbkNoYW5nZWQiLCJjb250YWluZXIiLCJyZXN1bWUiLCJ0ZW1wQ2lyY2xlIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJoZWlnaHQiLCJ3aWR0aCIsIlVwZGF0ZVNvdXJjZXNQb3NpdGlvbiIsIk5vdEluIiwiYmFja2dyb3VuZCIsInN0b3AiLCJkaXNjb25uZWN0IiwiVXBkYXRlU291cmNlc1NvdW5kIiwiaW5kZXgiLCJzb3VyY2VWYWx1ZSIsImdhaW4iLCJzZXRWYWx1ZUF0VGltZSIsImxpc3RPZlBvaW50IiwibmJDbG9zZXN0IiwiY2xvc2VzdElkcyIsImN1cnJlbnRDbG9zZXN0SWQiLCJqIiwidW5kZWZpbmVkIiwiRGlzdGFuY2UiLCJwb2ludElkIiwibGlzdE9mSWRzIiwiaXRlcmF0b3IiLCJwb2ludEEiLCJwb2ludEIiLCJzcXJ0IiwicG93IiwiSW5maW5pdHkiLCJidWZmZXIiLCJzb3VuZCIsImNyZWF0ZUJ1ZmZlclNvdXJjZSIsImxvb3AiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTtcbiAgICAvLyB0aGlzLmFtYmlzb25pY3MgPSByZXF1aXJlKCdhbWJpc29uaWNzJyk7XG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluIHN0YXJ0KCkpXG4gICAgdGhpcy5zY2FsZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIFNjYWxlcyAoaW5pdGlhbGlzZWQgaW4gc3RhcnQoKSlcbiAgICB0aGlzLmNpcmNsZVNpemUgPSAyMDsgICAgICAgICAgICAgICAgIC8vIFNvdXJjZXMgc2l6ZVxuICAgIHRoaXMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJzsgICAgICAgLy8gU2V0IHRoZSBhdWRpbyBkYXRhIHRvIHVzZVxuXG4gICAgLy8gUG9zaXRpb25zIG9mIHRoZSBzb3VyY2VzXG4gICAgdGhpcy50cnVlUG9zaXRpb25zID0gW1xuICAgICAgWzMxLjAsIDQxLjVdLFxuICAgICAgWzMxLjAsIDM5LjBdLFxuICAgICAgWzMxLjAsIDM2LjJdLFxuICAgICAgWzM0LjUsIDM2LjJdLFxuICAgICAgWzM2LjgsIDM2LjJdLFxuICAgICAgWzM2LjgsIDMzLjZdLFxuICAgICAgWzM0LjUsIDMzLjZdLFxuICAgICAgWzMxLjAsIDMzLjZdLFxuICAgICAgWzMxLjAsIDMxLjBdLFxuICAgICAgWzM0LjUsIDMxLjBdLFxuICAgICAgWzM0LjUsIDI4LjBdLFxuICAgICAgWzMxLjAsIDI4LjBdLFxuICAgICAgWzMxLjAsIDI1LjhdLFxuICAgICAgWzM0LjUsIDI1LjhdLFxuICAgICAgWzM2LjgsIDI1LjhdLFxuICAgICAgWzM2LjgsIDIzLjZdLFxuICAgICAgWzM0LjUsIDIzLjZdLFxuICAgICAgWzMxLjAsIDIzLjZdLFxuICAgIF07XG5cbiAgICAvLyBTb3VuZHMgb2YgdGhlIHNvdXJjZXNcbiAgICB0aGlzLmF1ZGlvRmlsZXNOYW1lID0gW1xuICAgICAgXCIwMS53YXZcIiwgXG4gICAgICBcIjAyLndhdlwiLCBcbiAgICAgIFwiMDMud2F2XCIsIFxuICAgICAgXCIwNC53YXZcIiwgXG4gICAgICBcIjA1LndhdlwiLCBcbiAgICAgIFwiMDYud2F2XCIsIFxuICAgICAgXCIwNy53YXZcIiwgXG4gICAgICBcIjA4LndhdlwiLCBcbiAgICAgIFwiMDkud2F2XCIsIFxuICAgICAgXCIxMC53YXZcIiwgXG4gICAgICBcIjExLndhdlwiLCBcbiAgICAgIFwiMTIud2F2XCIsIFxuICAgICAgXCIxMy53YXZcIiwgXG4gICAgICBcIjE0LndhdlwiLCBcbiAgICAgIFwiMTUud2F2XCIsIFxuICAgICAgXCIxNi53YXZcIiwgXG4gICAgICBcIjE3LndhdlwiLCBcbiAgICAgIFwiMTgud2F2XCIsIFxuICAgIF07XG5cbiAgICAvLyBVc2VyIHBvc2l0aW9uc1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH07XG5cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdOyAgICAgICAgICAgICAgICAgIC8vIElkcyBvZiBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gW107ICAgICAgICAgIC8vIElkcyBvZiBwcmV2aW91cyBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7ICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBhdnRpdmUgc291cmNlc1xuICAgIHRoaXMucG9zaXRpb25zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2Ygc291cmNlcyBwb3NpdGlvbnMgKGJ1aWx0IGluIHN0YXJ0KCkpXG4gICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7ICAgICAvLyBOdW1iZXIgb2YgU291cmNlc1xuICAgIHRoaXMuZGlzdGFuY2VWYWx1ZSA9IFswLCAwLCAwLCAwXTsgICAgICAgICAgLy8gRGlzdGFuY2Ugb2YgY2xvc2VzdCBTb3VyY2VzXG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTdW0gb2YgZGlzdGFuY2VzIG9mIGNsb3Nlc3QgU291cmNlc1xuXG4gICAgLy8gQ3JlYXRpbmcgQXVkaW9Db250ZXh0XG4gICAgdGhpcy5hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgdGhpcy5wbGF5aW5nU291bmRzID0gW107ICAgICAgICAgICAgICAgICAgICAvLyBCdWZmZXJTb3VyY2VzXG4gICAgdGhpcy5nYWlucyA9IFtdOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHYWluc1xuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBJbml0aWFsaXNpbmcgb2YgU291cmNlcyBwb3NpdGlvbnMgZGF0YVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYlBvczsgaSsrKSB7XG4gICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKHt4OiB0aGlzLnRydWVQb3NpdGlvbnNbaV1bMF0sIHk6dGhpcy50cnVlUG9zaXRpb25zW2ldWzFdfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRpbmcgJ3RoaXMucmFuZ2UnXG4gICAgdGhpcy5SYW5nZSh0aGlzLnBvc2l0aW9ucyk7XG5cbiAgICAvLyBJbml0aWFsaXNpbmcgJ3RoaXMuc2NhbGUnXG4gICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgIC8vIEluaXRpYWxpc2luZyBVc2VyJ3MgUG9zaXRpb25cbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHRoaXMucmFuZ2UubW95WDtcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHRoaXMucmFuZ2UubWluWTtcblxuICAgIC8vIEluaXRpYWxpc2luZyBDbG9zZXN0IFBvaW50c1xuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMsIHRoaXMubmJDbG9zZXN0UG9pbnRzKTtcblxuICAgIC8vIENyZWF0aW5nIEdhaW5zXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICB0aGlzLmdhaW5zLnB1c2goYXdhaXQgdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpKTtcbiAgICB9XG5cbiAgICAvLyBzdWJzY3JpYmUgdG8gZGlzcGxheSBsb2FkaW5nIHN0YXRlXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW5kZXIoKSk7XG5cbiAgICAvLyBBZGQgRXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSBXaW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBTdGF0ZVxuICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgIH1cblxuICAgICAgLy8gRGlzcGxheVxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcblxuICAgIC8vIGluaXQgd2l0aCBjdXJyZW50IGNvbnRlbnRcbiAgICBhd2FpdCB0aGlzLmxvYWRTb3VuZGJhbmsoKTtcbiAgfVxuXG4gIFJhbmdlKHBvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IHBvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IHBvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdG8gZGlzcGxheSBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuICAgIHZhciBzY2FsZSA9IHtWUG9zMlBpeGVsOiBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLmNpcmNsZVNpemUpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMuY2lyY2xlU2l6ZSkvcmFuZ2VWYWx1ZXMucmFuZ2VZKX07XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICBsb2FkU291bmRiYW5rKCkgeyAvLyBMb2FkIHRoZSBhdWRpb0RhdGEgdG8gdXNlXG4gICAgY29uc3Qgc291bmRiYW5rVHJlZSA9IHRoaXMuZmlsZXN5c3RlbS5nZXQodGhpcy5hdWRpb0RhdGEpO1xuICAgIGNvbnN0IGRlZk9iaiA9IHt9O1xuICAgIHNvdW5kYmFua1RyZWUuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcbiAgICAgIGlmIChsZWFmLnR5cGUgPT09ICdmaWxlJykge1xuICAgICAgICBkZWZPYmpbbGVhZi5uYW1lXSA9IGxlYWYudXJsO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZChkZWZPYmosIHRydWUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICBjb25zdCBsb2FkaW5nID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5nZXQoJ2xvYWRpbmcnKTtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIGlmICghbG9hZGluZykge1xuICAgICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWx9cHg7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKS8yfXB4LCAke3RoaXMuY2lyY2xlU2l6ZS8yfXB4KTtcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgaWQ9XCJsaXN0ZW5lclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDE2cHg7IHdpZHRoOiAxNnB4OyBiYWNrZ3JvdW5kOiBibHVlOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHotaW5kZXg6IDE7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weCwgJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weCkgcm90YXRlKDQ1ZGVnKVwiOz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGNpcmNsZXMgdG8gZGlzcGxheSBTb3VyY2VzXG4gICAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKSlcblxuICAgICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuXG4gICAgICAgICAgICAvLyBVc2luZyBtb3VzZVxuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIHRvdWNoXG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhldnQuY2hhbmdlZFRvdWNoZXNbMF0pXG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGlzaW5nIGF1ZGlvTm9kZXNcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbdGhpcy5hdWRpb0ZpbGVzTmFtZVt0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXV1dLCBpKSk7XG4gICAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICAgICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBHZXQgYWxsIHRoZSBkYXRhIGFuZCBzZXQgdGhlIGRpc3BsYXkgdG8gYmVnaW5cbiAgICAgICAgICAgIHRoaXMuUG9zaXRpb25DaGFuZ2VkKCk7IFxuXG4gICAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7ICAgICAgICAgLy8gVXBkYXRlIGJlZ2luIFN0YXRlIFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7ICAgICAgICAgIC8vIFVwZGF0ZSBpbml0aWFsaXNpbmcgU3RhdGVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoY29udGFpbmVyKSB7IC8vIEJlZ2luIEF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBTb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIEJlZ2luIEF1ZGlvQ29udGV4dFxuICAgIHRoaXMuYXVkaW9Db250ZXh0LnJlc3VtZSgpO1xuXG4gICAgLy8gSW5pdGlhbGlzaW5nIGEgdGVtcG9yYXJ5IGNpcmNsZVxuICAgIHZhciB0ZW1wQ2lyY2xlO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBjaXJjbGUgZm9yIHRoZSBTb3VyY2VzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvc2l0aW9ucy5sZW5ndGg7IGkrKykgeyAgICAgLy8gZm9yZWFjaCBTb3VyY2VzXG4gICAgICB0ZW1wQ2lyY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7ICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGVsZW1lbnRcbiAgICAgIHRlbXBDaXJjbGUuaWQgPSBcImNpcmNsZVwiICsgaTsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIGlkXG4gICAgICB0ZW1wQ2lyY2xlLmlubmVySFRNTCA9IGkgKyAxOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgdmFsdWUgKGkrMSlcblxuICAgICAgLy8gQ2hhbmdlIGZvcm0gYW5kIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IHRvIGdldCBhIGNpcmNsZSBhdCB0aGUgZ29vZCBwbGFjZTtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUgPSBcInBvc2l0aW9uOiBhYnNvbHV0ZTsgbWFyZ2luOiAwIC0xMHB4OyB3aWR0aDogXCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBoZWlnaHQ6IFwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgYm9yZGVyLXJhZGl1czpcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGxpbmUtaGVpZ2h0OiBcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGJhY2tncm91bmQ6IGdyZXk7XCI7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweCwgXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4KVwiO1xuICAgICAgXG4gICAgICAvLyBBZGQgdGhlIGNpcmNsZSB0byB0aGUgZGlzcGxheVxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBDaXJjbGUpO1xuICAgIH1cbiAgfVxuXG4gIHVzZXJBY3Rpb24obW91c2UpIHsgLy8gQ2hhbmdlIExpc3RlbmVyJ3MgUG9zaXRpb24gd2hlbiB0aGUgbW91c2UgaGFzIGJlZW4gdXNlZFxuXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIExpc3RlbmVyJ3MgUG9zaXRpb25cbiAgICB2YXIgdGVtcFggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5jaXJjbGVTaXplLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5yYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICBcbiAgICAgIC8vIFNldCB0aGUgdmFsdWUgdG8gdGhlIExpc3RlbmVyJ3MgUG9zaXRpb25cbiAgICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcbiAgICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLmNpcmNsZVNpemUvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG5cbiAgICAgIC8vIFVwZGF0ZSBMaXN0ZW5lclxuICAgICAgdGhpcy5VcGRhdGVMaXN0ZW5lcigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIHZhbHVlIGlzIG91dCBvZiByYW5nZSwgc3RvcCB0aGUgTGlzdGVuZXIncyBQb3NpdGlvbiBVcGRhdGVcbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuXG4gICAgLy8gQ2hhbmdlIHNpemVcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMuY2lyY2xlU2l6ZS8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweClcIjtcbiAgICBcbiAgICB0aGlzLlVwZGF0ZUxpc3RlbmVyKCk7ICAgICAgICAgICAgLy8gVXBkYXRlIExpc3RlbmVyXG4gICAgdGhpcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24oKTsgICAgIC8vIFVwZGF0ZSBTb3VyY2VzJyBkaXNwbGF5XG4gIH1cblxuICBVcGRhdGVMaXN0ZW5lcigpIHsgLy8gVXBkYXRlIExpc3RlbmVyXG5cbiAgICAvLyBVcGRhdGUgTGlzdGVuZXIncyBkaXBzbGF5XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsaXN0ZW5lclwiKS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5saXN0ZW5lclBvc2l0aW9uLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCAtIHRoaXMuY2lyY2xlU2l6ZS8yKSArIFwicHgsIFwiICsgKCh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgpIHJvdGF0ZSg0NWRlZylcIjtcbiAgICBcbiAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXkgZm9yIHRoZSBjdXJyZW50IFBvc2l0aW9uIG9mIExpc3RlbmVyXG4gICAgdGhpcy5Qb3NpdGlvbkNoYW5nZWQoKTsgIFxuICB9XG5cbiAgUG9zaXRpb25DaGFuZ2VkKCkgeyAvLyBVcGRhdGUgdGhlIGNsb3Nlc3QgU291cmNlcyB0byB1c2Ugd2hlbiBMaXN0ZW5lcidzIFBvc2l0aW9uIGNoYW5nZWRcblxuICAgIC8vIEluaXRpYWxpc2luZyB2YXJpYWJsZXNcbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0UG9pbnRzSWQ7XG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7XG5cbiAgICAvLyBVcGRhdGUgdGhlIGNsb3Nlc3QgUG9pbnRzXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuICAgIFxuICAgIC8vIENoZWNrIGFsbCB0aGUgbmV3IGNsb3Nlc3QgUG9pbnRzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZSBJZCBpcyBuZXcgaW4gJ3RoaXMuQ2xvc2VzdFBvaW50c0lkJ1xuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pIHtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIERpc3BsYXkgZm9yIFNvdXJjZXMgdGhhdCBhcmUgbm90IGFjdGl2ZVxuICAgICAgICBpZiAodGhpcy5Ob3RJbih0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldLCB0aGlzLkNsb3Nlc3RQb2ludHNJZCkpIHtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwiZ3JleVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0b3AoKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcCB0aGUgcHJldmlvdXMgU291cmNlXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5kaXNjb25uZWN0KHRoaXMuZ2FpbnNbaV0pOyAgICAgIC8vIERpc2Nvbm5lY3QgdGhlIFNvdXJjZSBmcm9tIHRoZSBhdWRpb1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbmV3IFNvdW5kIGZvciB0aGUgbmV3IFNvdXJjZXNcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldID0gdGhpcy5Mb2FkTmV3U291bmQodGhpcy5hdWRpb0J1ZmZlckxvYWRlci5kYXRhW3RoaXMuYXVkaW9GaWxlc05hbWVbdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV1dXSwgaSk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXJ0IHRoZSBuZXcgU291cmNlXG4gICAgICB9XG5cbiAgICAvLyBVcGRhdGUgU291cmNlIHBhcmFtZXRlcnNcbiAgICB0aGlzLlVwZGF0ZVNvdXJjZXNTb3VuZChpKTtcbiAgICB9XG4gIH0gIFxuXG4gIFVwZGF0ZVNvdXJjZXNQb3NpdGlvbigpIHsgLy8gVXBkYXRlIHRoZSBQb3NpdGlvbnMgb2YgY2lyY2xlcyB3aGVuIHdpbmRvdyBpcyByZXNpemVkXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIGkpLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweCwgXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4KVwiO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZVNvdXJjZXNTb3VuZChpbmRleCkgeyAvLyBVcGRhdGUgR2FpbiBhbmQgRGlzcGxheSBvZiB0aGUgU291cmNlIGRlcGVuZGluZyBvbiBMaXN0ZW5lcidzIFBvc2l0aW9uXG5cbiAgICAvLyBTZXQgYSB1c2luZyB2YWx1ZSB0byB0aGUgU291cmNlXG4gICAgdmFyIHNvdXJjZVZhbHVlID0gdGhpcy5kaXN0YW5jZVZhbHVlW2luZGV4XS90aGlzLmRpc3RhbmNlU3VtO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBEaXNwbGF5IG9mIHRoZSBTb3VyY2VcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaW5kZXhdKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZ2IoMCwgXCIgKyAyNTUqKDEgLSAyKnNvdXJjZVZhbHVlKSArIFwiLCAwKVwiO1xuICAgIFxuICAgIC8vIFVwZGF0ZSB0aGUgR2FpbiBvZiB0aGUgU291cmNlXG4gICAgdGhpcy5nYWluc1tpbmRleF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSgxLSAzKnNvdXJjZVZhbHVlLCAwKTtcbiAgfVxuXG4gIENsb3Nlc3RTb3VyY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnQsIG5iQ2xvc2VzdCkgeyAvLyBnZXQgY2xvc2VzdCBTb3VyY2VzIHRvIHRoZSBMaXN0ZW5lclxuICAgIFxuICAgIC8vIEluaXRpYWxpc2luZyB0ZW1wb3JhcnkgdmFyaWFibGVzO1xuICAgIHZhciBjbG9zZXN0SWRzID0gW107XG4gICAgdmFyIGN1cnJlbnRDbG9zZXN0SWQ7XG5cbiAgICAvLyBHZXQgdGhlICduYkNsb3Nlc3QnIGNsb3Nlc3QgSWRzXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuYkNsb3Nlc3Q7IGorKykge1xuXG4gICAgICAvLyBTZXQgJ3VuZGVmaW5lZCcgdG8gdGhlIGN1cnJlbnRDbG9zZXN0SWQgdG8gaWdub3JlIGRpZmZpY3VsdGllcyB3aXRoIGluaXRpYWwgdmFsdWVzXG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gdW5kZWZpbmVkO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RPZlBvaW50Lmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIElkIGlzIG5vdCBhbHJlYWR5IGluIHRoZSBjbG9zZXN0IElkcyBhbmQgaWYgdGhlIFNvdXJjZSBvZiB0aGlzIElkIGlzIGNsb3Nlc3RcbiAgICAgICAgaWYgKHRoaXMuTm90SW4oaSwgY2xvc2VzdElkcykgJiYgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtpXSkgPCB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKSkge1xuICAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEdldCB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgbGlzdGVuZXIgYW50IHRoZSBzb3VyY2VcbiAgICAgIHRoaXMuZGlzdGFuY2VWYWx1ZVtqXSA9IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pO1xuICAgICAgXG4gICAgICAvLyBJbmNyZW1lbnQgJ3RoaXMuZGlzdGFuY2VTdW0nXG4gICAgICB0aGlzLmRpc3RhbmNlU3VtICs9IHRoaXMuZGlzdGFuY2VWYWx1ZVtqXTtcblxuICAgICAgLy8gUHVzaCB0aGUgSWQgaW4gdGhlIGNsb3Nlc3RcbiAgICAgIGNsb3Nlc3RJZHMucHVzaChjdXJyZW50Q2xvc2VzdElkKTtcbiAgICB9XG4gICAgcmV0dXJuIChjbG9zZXN0SWRzKTtcbiAgfVxuXG4gIE5vdEluKHBvaW50SWQsIGxpc3RPZklkcykgeyAvLyBDaGVjayBpZiBhbiBJZCBpcyBub3QgaW4gYW4gSWRzJyBhcnJheVxuICAgIHZhciBpdGVyYXRvciA9IDA7XG4gICAgd2hpbGUgKGl0ZXJhdG9yIDwgbGlzdE9mSWRzLmxlbmd0aCAmJiBwb2ludElkICE9IGxpc3RPZklkc1tpdGVyYXRvcl0pIHtcbiAgICAgIGl0ZXJhdG9yICs9IDE7XG4gICAgfVxuICAgIHJldHVybihpdGVyYXRvciA+PSBsaXN0T2ZJZHMubGVuZ3RoKTtcbiAgfVxuXG4gIERpc3RhbmNlKHBvaW50QSwgcG9pbnRCKSB7IC8vIEdldCB0aGUgZGlzdGFuY2UgYmV0d2VlbiAyIHBvaW50c1xuICAgIGlmIChwb2ludEIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gKE1hdGguc3FydChNYXRoLnBvdyhwb2ludEEueCAtIHBvaW50Qi54LCAyKSArIE1hdGgucG93KHBvaW50QS55IC0gcG9pbnRCLnksIDIpKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIChJbmZpbml0eSk7XG4gICAgfVxuICB9XG5cbiAgTG9hZE5ld1NvdW5kKGJ1ZmZlciwgaW5kZXgpIHsgLy8gQ3JlYXRlIGFuZCBsaW5rIHRoZSBzb3VuZCB0byB0aGUgQXVkaW9Db250ZXh0XG4gICAgLy8gU291bmQgaW5pdGlhbGlzYXRpb25cbiAgICB2YXIgc291bmQgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTsgICAvLyBDcmVhdGUgdGhlIHNvdW5kXG4gICAgc291bmQubG9vcCA9IHRydWU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBzb3VuZCB0byBsb29wXG4gICAgc291bmQuYnVmZmVyID0gYnVmZmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBzb3VuZCBidWZmZXJcbiAgICBzb3VuZC5jb25uZWN0KHRoaXMuZ2FpbnNbaW5kZXhdKTsgICAgICAgICAgICAgICAgICAgICAvLyBDb25uZWN0IHRoZSBzb3VuZCB0byB0aGUgb3RoZXIgbm9kZXNcbiAgICByZXR1cm4gKHNvdW5kKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0FBRUEsTUFBTUEsZ0JBQU4sU0FBK0JDLDBCQUEvQixDQUFrRDtFQUNoREMsV0FBVyxDQUFDQyxNQUFELEVBQVNDLE1BQU0sR0FBRyxFQUFsQixFQUFzQkMsVUFBdEIsRUFBa0M7SUFDM0MsTUFBTUYsTUFBTjtJQUVBLEtBQUtDLE1B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