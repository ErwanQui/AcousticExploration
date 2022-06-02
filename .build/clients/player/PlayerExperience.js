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

    this.dataFileName = "scene2.json";
    this.jsonObj;
    this.jsonObjloaded; // this.dataLoaded = false;
    // Positions of the sources

    this.truePositions = []; // Sounds of the sources

    this.audioFilesName = []; // User positions

    this.listenerPosition = {
      x: 0,
      y: 0
    };
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
    // Creating AudioContext

    this.audioContext = new AudioContext();
    this.playingSounds = []; // BufferSources

    this.gains = []; // Gains

    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    super.start(); // Load all Datas

    await this.loadData(); // Creating Gains

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

  loadData() {
    // Load the data
    const data = this.filesystem.get('Position'); // Check files to get config

    data.children.forEach(leaf => {
      if (leaf.name === this.dataFileName) {
        // Creating the data receiver (I need to use the 'leaf.url' to read the json)
        var jsonData = new XMLHttpRequest(); // Wait the json file to be loaded

        jsonData.addEventListener("load", () => {
          // Get the text from data
          var jsonText = JSON.stringify(jsonData.responseText); // Modify the text to be usable for an object

          jsonText = jsonText.replaceAll(/[/][/][ \w'"]+/g, '');
          jsonText = jsonText.replaceAll('\\n', '');
          jsonText = jsonText.replace(/^./, '');
          jsonText = jsonText.replace(/.$/, '');
          jsonText = jsonText.replaceAll('\\', '');
          jsonText = jsonText.replaceAll('.0', ''); // Create the data object

          this.jsonObj = JSON.parse(jsonText); // Dispatch an event to inform that the data has been loaded

          document.dispatchEvent(new Event("dataLoaded"));
        }, false); // Get the data of the json from the 'leaf.url'

        jsonData.open("get", leaf.url, true);
        jsonData.send();
      }
    });
  }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsInJhbmdlIiwic2NhbGUiLCJjaXJjbGVTaXplIiwiYXVkaW9EYXRhIiwiZGF0YUZpbGVOYW1lIiwianNvbk9iaiIsImpzb25PYmpsb2FkZWQiLCJ0cnVlUG9zaXRpb25zIiwiYXVkaW9GaWxlc05hbWUiLCJsaXN0ZW5lclBvc2l0aW9uIiwieCIsInkiLCJDbG9zZXN0UG9pbnRzSWQiLCJwcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCIsIm5iQ2xvc2VzdFBvaW50cyIsInBvc2l0aW9ucyIsIm5iUG9zIiwiZGlzdGFuY2VWYWx1ZSIsImRpc3RhbmNlU3VtIiwiZ2FpbnNWYWx1ZSIsImdhaW5Ob3JtIiwiZ2FpbkV4cG9zYW50IiwiYXVkaW9Db250ZXh0IiwiQXVkaW9Db250ZXh0IiwicGxheWluZ1NvdW5kcyIsImdhaW5zIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJsb2FkRGF0YSIsImkiLCJwdXNoIiwiY3JlYXRlR2FpbiIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlY2VpdmVycyIsInh5eiIsImZpbGVzIiwibGVuZ3RoIiwiUmFuZ2UiLCJTY2FsaW5nIiwibW95WCIsIm1pblkiLCJDbG9zZXN0U291cmNlIiwic3Vic2NyaWJlIiwicmVuZGVyIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwibG9hZFNvdW5kYmFuayIsIm1pblgiLCJtYXhYIiwibWF4WSIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIlZQb3MyUGl4ZWwiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0Iiwic291bmRiYW5rVHJlZSIsImdldCIsImRlZk9iaiIsImNoaWxkcmVuIiwiZm9yRWFjaCIsImxlYWYiLCJ0eXBlIiwibmFtZSIsInVybCIsImxvYWQiLCJkYXRhIiwianNvbkRhdGEiLCJYTUxIdHRwUmVxdWVzdCIsImpzb25UZXh0IiwiSlNPTiIsInN0cmluZ2lmeSIsInJlc3BvbnNlVGV4dCIsInJlcGxhY2VBbGwiLCJyZXBsYWNlIiwicGFyc2UiLCJkaXNwYXRjaEV2ZW50IiwiRXZlbnQiLCJvcGVuIiwic2VuZCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwibG9hZGluZyIsImh0bWwiLCJpZCIsImJlZ2luQnV0dG9uIiwiZ2V0RWxlbWVudEJ5SWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbiIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwiY2FudmFzIiwibW91c2UiLCJ1c2VyQWN0aW9uIiwiZXZ0IiwiY29uc29sZSIsImxvZyIsImNoYW5nZWRUb3VjaGVzIiwiTG9hZE5ld1NvdW5kIiwiY29ubmVjdCIsImRlc3RpbmF0aW9uIiwiUG9zaXRpb25DaGFuZ2VkIiwiY29udGFpbmVyIiwicmVzdW1lIiwidGVtcENpcmNsZSIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJ0cmFuc2Zvcm0iLCJhcHBlbmRDaGlsZCIsInRlbXBYIiwiY2xpZW50WCIsInRlbXBZIiwiY2xpZW50WSIsIlVwZGF0ZUxpc3RlbmVyIiwiaGVpZ2h0Iiwid2lkdGgiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJOb3RJbiIsImJhY2tncm91bmQiLCJzdG9wIiwiZGlzY29ubmVjdCIsIlVwZGF0ZVNvdXJjZXNTb3VuZCIsImluZGV4Iiwic291cmNlVmFsdWUiLCJwb3ciLCJnYWluIiwic2V0VmFsdWVBdFRpbWUiLCJsaXN0T2ZQb2ludCIsIm5iQ2xvc2VzdCIsImNsb3Nlc3RJZHMiLCJjdXJyZW50Q2xvc2VzdElkIiwiaiIsInVuZGVmaW5lZCIsIkRpc3RhbmNlIiwicG9pbnRJZCIsImxpc3RPZklkcyIsIml0ZXJhdG9yIiwicG9pbnRBIiwicG9pbnRCIiwic3FydCIsIkluZmluaXR5IiwiYnVmZmVyIiwic291bmQiLCJjcmVhdGVCdWZmZXJTb3VyY2UiLCJsb29wIl0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7XG4gICAgLy8gdGhpcy5hbWJpc29uaWNzID0gcmVxdWlyZSgnYW1iaXNvbmljcycpO1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpO1xuXG4gICAgLy8gSW5pdGlhbGlzYXRpb24gdmFyaWFibGVzXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcblxuICAgIC8vIEdsb2JhbCB2YWx1ZXNcbiAgICB0aGlzLnJhbmdlOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhbHVlcyBvZiB0aGUgYXJyYXkgZGF0YSAoY3JlYXRlcyBpbiBzdGFydCgpKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYWxpc2VkIGluIHN0YXJ0KCkpXG4gICAgdGhpcy5jaXJjbGVTaXplID0gMjA7ICAgICAgICAgICAgICAgICAvLyBTb3VyY2VzIHNpemVcbiAgICB0aGlzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7ICAgICAgIC8vIFNldCB0aGUgYXVkaW8gZGF0YSB0byB1c2VcbiAgICB0aGlzLmRhdGFGaWxlTmFtZSA9IFwic2NlbmUyLmpzb25cIjtcbiAgICB0aGlzLmpzb25PYmo7XG4gICAgdGhpcy5qc29uT2JqbG9hZGVkO1xuICAgIC8vIHRoaXMuZGF0YUxvYWRlZCA9IGZhbHNlO1xuXG4gICAgLy8gUG9zaXRpb25zIG9mIHRoZSBzb3VyY2VzXG4gICAgdGhpcy50cnVlUG9zaXRpb25zID0gW107XG5cbiAgICAvLyBTb3VuZHMgb2YgdGhlIHNvdXJjZXNcbiAgICB0aGlzLmF1ZGlvRmlsZXNOYW1lID0gW107XG5cbiAgICAvLyBVc2VyIHBvc2l0aW9uc1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH07XG5cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdOyAgICAgICAgICAgICAgICAgIC8vIElkcyBvZiBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gW107ICAgICAgICAgIC8vIElkcyBvZiBwcmV2aW91cyBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7ICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBhdnRpdmUgc291cmNlc1xuICAgIHRoaXMucG9zaXRpb25zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2Ygc291cmNlcyBwb3NpdGlvbnMgKGJ1aWx0IGluIHN0YXJ0KCkpXG4gICAgdGhpcy5uYlBvczsgICAgIC8vIE51bWJlciBvZiBTb3VyY2VzXG4gICAgdGhpcy5kaXN0YW5jZVZhbHVlID0gWzAsIDAsIDAsIDBdOyAgICAgICAgICAvLyBEaXN0YW5jZSBvZiBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLmRpc3RhbmNlU3VtID0gMDsgICAgICAgICAgICAgICAgICAgICAgIC8vIFN1bSBvZiBkaXN0YW5jZXMgb2YgY2xvc2VzdCBTb3VyY2VzXG4gICAgdGhpcy5nYWluc1ZhbHVlID0gWzEsIDEsIDFdOyAgICAgICAgICAgICAgICAvLyBBcnJheSBvZiBHYWluc1xuICAgIHRoaXMuZ2Fpbk5vcm0gPSAwOyAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9ybSBvZiB0aGUgR2FpbnNcbiAgICB0aGlzLmdhaW5FeHBvc2FudCA9IDQ7ICAgICAgICAgICAgICAgICAgICAgIC8vIEVzcG9zYW50IHRvIGluY3JlYXNlIEdhaW5zJyBnYXBcblxuICAgIC8vIENyZWF0aW5nIEF1ZGlvQ29udGV4dFxuICAgIHRoaXMuYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICAgIHRoaXMucGxheWluZ1NvdW5kcyA9IFtdOyAgICAgICAgICAgICAgICAgICAgLy8gQnVmZmVyU291cmNlc1xuICAgIHRoaXMuZ2FpbnMgPSBbXTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2FpbnNcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuICAgIC8vIExvYWQgYWxsIERhdGFzXG4gICAgYXdhaXQgdGhpcy5sb2FkRGF0YSgpO1xuXG4gICAgLy8gQ3JlYXRpbmcgR2FpbnNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzOyBpKyspIHtcbiAgICAgIHRoaXMuZ2FpbnMucHVzaChhd2FpdCB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCkpO1xuICAgIH1cblxuICAgIC8vIFdhaXQganNvbiBkYXRhIHRvIGJlIGxvYWRlZCAoYW4gZXZlbnQgaXMgZGlzcGF0Y2ggYnkgJ2xvYWREYXRhKCknKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkYXRhTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgLy8gVXBkYXRlIGRhdGEgdmFsdWVzXG4gICAgICB0aGlzLnRydWVQb3NpdGlvbnMgPSB0aGlzLmpzb25PYmoucmVjZWl2ZXJzLnh5ejtcbiAgICAgIHRoaXMuYXVkaW9GaWxlc05hbWUgPSB0aGlzLmpzb25PYmoucmVjZWl2ZXJzLmZpbGVzO1xuICAgICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XG5cbiAgICAgIC8vIEluaXRpYWxpc2luZyBvZiBTb3VyY2VzIHBvc2l0aW9ucyBkYXRhXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJQb3M7IGkrKykge1xuICAgICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKHt4OiB0aGlzLnRydWVQb3NpdGlvbnNbaV1bMF0sIHk6dGhpcy50cnVlUG9zaXRpb25zW2ldWzFdfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0aW5nICd0aGlzLnJhbmdlJ1xuICAgICAgdGhpcy5SYW5nZSh0aGlzLnBvc2l0aW9ucyk7XG5cbiAgICAgIC8vIEluaXRpYWxpc2luZyAndGhpcy5zY2FsZSdcbiAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG5cbiAgICAgIC8vIEluaXRpYWxpc2luZyBVc2VyJ3MgUG9zaXRpb25cbiAgICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdGhpcy5yYW5nZS5tb3lYO1xuICAgICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgICAgIC8vIEluaXRpYWxpc2luZyBDbG9zZXN0IFBvaW50c1xuICAgICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuXG4gICAgICAvLyBzdWJzY3JpYmUgdG8gZGlzcGxheSBsb2FkaW5nIHN0YXRlXG4gICAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlbmRlcigpKTtcblxuICAgICAgLy8gQWRkIEV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgV2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG5cbiAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gaW5pdCB3aXRoIGN1cnJlbnQgY29udGVudFxuICAgIGF3YWl0IHRoaXMubG9hZFNvdW5kYmFuaygpO1xuICB9XG5cbiAgUmFuZ2UocG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0byBkaXNwbGF5IGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG4gICAgdmFyIHNjYWxlID0ge1ZQb3MyUGl4ZWw6IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMuY2lyY2xlU2l6ZSkvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5jaXJjbGVTaXplKS9yYW5nZVZhbHVlcy5yYW5nZVkpfTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIGxvYWRTb3VuZGJhbmsoKSB7IC8vIExvYWQgdGhlIGF1ZGlvRGF0YSB0byB1c2VcbiAgICBjb25zdCBzb3VuZGJhbmtUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCh0aGlzLmF1ZGlvRGF0YSk7XG4gICAgY29uc3QgZGVmT2JqID0ge307XG4gICAgc291bmRiYW5rVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xuICAgICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gICAgICAgIGRlZk9ialtsZWFmLm5hbWVdID0gbGVhZi51cmw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5sb2FkKGRlZk9iaiwgdHJ1ZSk7XG4gIH1cblxuICBsb2FkRGF0YSgpIHsgLy8gTG9hZCB0aGUgZGF0YVxuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0KCdQb3NpdGlvbicpO1xuXG4gICAgLy8gQ2hlY2sgZmlsZXMgdG8gZ2V0IGNvbmZpZ1xuICAgIGRhdGEuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcbiAgICAgIGlmIChsZWFmLm5hbWUgPT09IHRoaXMuZGF0YUZpbGVOYW1lKSB7XG5cbiAgICAgICAgLy8gQ3JlYXRpbmcgdGhlIGRhdGEgcmVjZWl2ZXIgKEkgbmVlZCB0byB1c2UgdGhlICdsZWFmLnVybCcgdG8gcmVhZCB0aGUganNvbilcbiAgICAgICAgdmFyIGpzb25EYXRhID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgLy8gV2FpdCB0aGUganNvbiBmaWxlIHRvIGJlIGxvYWRlZFxuICAgICAgICBqc29uRGF0YS5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgICAvLyBHZXQgdGhlIHRleHQgZnJvbSBkYXRhXG4gICAgICAgICAgdmFyIGpzb25UZXh0ID0gSlNPTi5zdHJpbmdpZnkoanNvbkRhdGEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgIC8vIE1vZGlmeSB0aGUgdGV4dCB0byBiZSB1c2FibGUgZm9yIGFuIG9iamVjdFxuICAgICAgICAgIGpzb25UZXh0ID0ganNvblRleHQucmVwbGFjZUFsbCgvWy9dWy9dWyBcXHcnXCJdKy9nLCcnKTtcbiAgICAgICAgICBqc29uVGV4dCA9IGpzb25UZXh0LnJlcGxhY2VBbGwoJ1xcXFxuJywgJycpO1xuICAgICAgICAgIGpzb25UZXh0ID0ganNvblRleHQucmVwbGFjZSgvXi4vLCcnKTtcbiAgICAgICAgICBqc29uVGV4dCA9IGpzb25UZXh0LnJlcGxhY2UoLy4kLywnJyk7XG4gICAgICAgICAganNvblRleHQgPSBqc29uVGV4dC5yZXBsYWNlQWxsKCdcXFxcJywnJyk7XG4gICAgICAgICAganNvblRleHQgPSBqc29uVGV4dC5yZXBsYWNlQWxsKCcuMCcsJycpO1xuXG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSBkYXRhIG9iamVjdFxuICAgICAgICAgIHRoaXMuanNvbk9iaiA9IEpTT04ucGFyc2UoanNvblRleHQpO1xuXG4gICAgICAgICAgLy8gRGlzcGF0Y2ggYW4gZXZlbnQgdG8gaW5mb3JtIHRoYXQgdGhlIGRhdGEgaGFzIGJlZW4gbG9hZGVkXG4gICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJkYXRhTG9hZGVkXCIpKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBkYXRhIG9mIHRoZSBqc29uIGZyb20gdGhlICdsZWFmLnVybCdcbiAgICAgICAganNvbkRhdGEub3BlbihcImdldFwiLCBsZWFmLnVybCwgdHJ1ZSk7XG4gICAgICAgIGpzb25EYXRhLnNlbmQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcInJlbmRlclwiKVxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICBjb25zdCBsb2FkaW5nID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5nZXQoJ2xvYWRpbmcnKTtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIGlmICghbG9hZGluZykge1xuICAgICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWx9cHg7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKS8yfXB4LCAke3RoaXMuY2lyY2xlU2l6ZS8yfXB4KTtcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxkaXYgaWQ9XCJsaXN0ZW5lclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDE2cHg7IHdpZHRoOiAxNnB4OyBiYWNrZ3JvdW5kOiBibHVlOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHotaW5kZXg6IDE7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weCwgJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weCkgcm90YXRlKDQ1ZGVnKVwiOz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGNpcmNsZXMgdG8gZGlzcGxheSBTb3VyY2VzXG4gICAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKSlcblxuICAgICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuXG4gICAgICAgICAgICAvLyBVc2luZyBtb3VzZVxuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIHRvdWNoXG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhldnQuY2hhbmdlZFRvdWNoZXNbMF0pXG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgICAgLy8gSW5pdGlhbGlzaW5nIGF1ZGlvTm9kZXNcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbdGhpcy5hdWRpb0ZpbGVzTmFtZVt0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXV1dLCBpKSk7XG4gICAgICAgICAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICAgICAgICAgIGlmIChpICE9IHRoaXMubmJDbG9zZXN0UG9pbnRzIC0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEdldCBhbGwgdGhlIGRhdGEgYW5kIHNldCB0aGUgZGlzcGxheSB0byBiZWdpblxuICAgICAgICAgICAgdGhpcy5Qb3NpdGlvbkNoYW5nZWQoKTsgXG5cbiAgICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZChjb250YWluZXIpIHsgLy8gQmVnaW4gQXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIFNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQmVnaW4gQXVkaW9Db250ZXh0XG4gICAgdGhpcy5hdWRpb0NvbnRleHQucmVzdW1lKCk7XG5cbiAgICAvLyBJbml0aWFsaXNpbmcgYSB0ZW1wb3JhcnkgY2lyY2xlXG4gICAgdmFyIHRlbXBDaXJjbGU7XG5cbiAgICAvLyBDcmVhdGUgdGhlIGNpcmNsZSBmb3IgdGhlIFNvdXJjZXNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7ICAgICAvLyBmb3JlYWNoIFNvdXJjZXNcbiAgICAgIHRlbXBDaXJjbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgZWxlbWVudFxuICAgICAgdGVtcENpcmNsZS5pZCA9IFwiY2lyY2xlXCIgKyBpOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgaWRcbiAgICAgIHRlbXBDaXJjbGUuaW5uZXJIVE1MID0gaSArIDE7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSB2YWx1ZSAoaSsxKVxuXG4gICAgICAvLyBDaGFuZ2UgZm9ybSBhbmQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgdG8gZ2V0IGEgY2lyY2xlIGF0IHRoZSBnb29kIHBsYWNlO1xuICAgICAgdGVtcENpcmNsZS5zdHlsZSA9IFwicG9zaXRpb246IGFic29sdXRlOyBtYXJnaW46IDAgLTEwcHg7IHdpZHRoOiBcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGhlaWdodDogXCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBib3JkZXItcmFkaXVzOlwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgbGluZS1oZWlnaHQ6IFwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgYmFja2dyb3VuZDogZ3JleTtcIjtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4LCBcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgpXCI7XG4gICAgICBcbiAgICAgIC8vIEFkZCB0aGUgY2lyY2xlIHRvIHRoZSBkaXNwbGF5XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcENpcmNsZSk7XG4gICAgfVxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgTGlzdGVuZXIncyBQb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG5cbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgTGlzdGVuZXIncyBQb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLmNpcmNsZVNpemUvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5yYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgIFxuICAgICAgLy8gU2V0IHRoZSB2YWx1ZSB0byB0aGUgTGlzdGVuZXIncyBQb3NpdGlvblxuICAgICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuICAgICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMuY2lyY2xlU2l6ZS8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcblxuICAgICAgLy8gVXBkYXRlIExpc3RlbmVyXG4gICAgICB0aGlzLlVwZGF0ZUxpc3RlbmVyKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uIFVwZGF0ZVxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cbiAgICAvLyBDaGFuZ2Ugc2l6ZVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5jaXJjbGVTaXplLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuICAgIFxuICAgIHRoaXMuVXBkYXRlTGlzdGVuZXIoKTsgICAgICAgICAgICAvLyBVcGRhdGUgTGlzdGVuZXJcbiAgICB0aGlzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbigpOyAgICAgLy8gVXBkYXRlIFNvdXJjZXMnIGRpc3BsYXlcbiAgfVxuXG4gIFVwZGF0ZUxpc3RlbmVyKCkgeyAvLyBVcGRhdGUgTGlzdGVuZXJcblxuICAgIC8vIFVwZGF0ZSBMaXN0ZW5lcidzIGRpcHNsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxpc3RlbmVyXCIpLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsIC0gdGhpcy5jaXJjbGVTaXplLzIpICsgXCJweCwgXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweCkgcm90YXRlKDQ1ZGVnKVwiO1xuICAgIFxuICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheSBmb3IgdGhlIGN1cnJlbnQgUG9zaXRpb24gb2YgTGlzdGVuZXJcbiAgICB0aGlzLlBvc2l0aW9uQ2hhbmdlZCgpOyAgXG4gIH1cblxuICBQb3NpdGlvbkNoYW5nZWQoKSB7IC8vIFVwZGF0ZSB0aGUgY2xvc2VzdCBTb3VyY2VzIHRvIHVzZSB3aGVuIExpc3RlbmVyJ3MgUG9zaXRpb24gY2hhbmdlZFxuXG4gICAgLy8gSW5pdGlhbGlzaW5nIHZhcmlhYmxlc1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RQb2ludHNJZDtcblxuICAgIC8vIFVwZGF0ZSB0aGUgY2xvc2VzdCBQb2ludHNcbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XG4gICAgXG4gICAgLy8gQ2hlY2sgYWxsIHRoZSBuZXcgY2xvc2VzdCBQb2ludHNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzIC0gMTsgaSsrKSB7XG5cbiAgICAgIC8vIENoZWNrIGlmIHRoZSBJZCBpcyBuZXcgaW4gJ3RoaXMuQ2xvc2VzdFBvaW50c0lkJ1xuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pIHtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIERpc3BsYXkgZm9yIFNvdXJjZXMgdGhhdCBhcmUgbm90IGFjdGl2ZVxuICAgICAgICBpZiAodGhpcy5Ob3RJbih0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldLCB0aGlzLkNsb3Nlc3RQb2ludHNJZCkgfHwgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSA9PSB0aGlzLkNsb3Nlc3RQb2ludHNJZFt0aGlzLm5iQ2xvc2VzdFBvaW50cyAtIDFdKSB7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcImdyZXlcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdG9wKCk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3AgdGhlIHByZXZpb3VzIFNvdXJjZVxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zW2ldKTsgICAgICAvLyBEaXNjb25uZWN0IHRoZSBTb3VyY2UgZnJvbSB0aGUgYXVkaW9cblxuICAgICAgICAvLyBVcGRhdGUgdGhlIG5ldyBTb3VuZCBmb3IgdGhlIG5ldyBTb3VyY2VzXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXSA9IHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YVt0aGlzLmF1ZGlvRmlsZXNOYW1lW3RoaXMuQ2xvc2VzdFBvaW50c0lkW2ldXV0sIGkpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RhcnQoKTsgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdGFydCB0aGUgbmV3IFNvdXJjZVxuICAgICAgfVxuXG4gICAgLy8gVXBkYXRlIFNvdXJjZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5VcGRhdGVTb3VyY2VzU291bmQoaSk7XG4gICAgfVxuICB9ICBcblxuICBVcGRhdGVTb3VyY2VzUG9zaXRpb24oKSB7IC8vIFVwZGF0ZSB0aGUgUG9zaXRpb25zIG9mIGNpcmNsZXMgd2hlbiB3aW5kb3cgaXMgcmVzaXplZFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyBpKS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweClcIjtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVTb3VyY2VzU291bmQoaW5kZXgpIHsgLy8gVXBkYXRlIEdhaW4gYW5kIERpc3BsYXkgb2YgdGhlIFNvdXJjZSBkZXBlbmRpbmcgb24gTGlzdGVuZXIncyBQb3NpdGlvblxuXG4gICAgLy8gU2V0IGEgdXNpbmcgdmFsdWUgdG8gdGhlIFNvdXJjZVxuICAgIHZhciBzb3VyY2VWYWx1ZSA9IHRoaXMuZ2FpbnNWYWx1ZVtpbmRleF0vdGhpcy5nYWluTm9ybTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgRGlzcGxheSBvZiB0aGUgU291cmNlXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMuQ2xvc2VzdFBvaW50c0lkW2luZGV4XSkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmdiKDAsIFwiICsgMjU1Kig0Kk1hdGgucG93KHNvdXJjZVZhbHVlLCAyKSkgKyBcIiwgMClcIjtcbiAgICBcbiAgICAvLyBVcGRhdGUgdGhlIEdhaW4gb2YgdGhlIFNvdXJjZVxuICAgIHRoaXMuZ2FpbnNbaW5kZXhdLmdhaW4uc2V0VmFsdWVBdFRpbWUoc291cmNlVmFsdWUsIDApO1xuICB9XG5cbiAgQ2xvc2VzdFNvdXJjZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludCwgbmJDbG9zZXN0KSB7IC8vIGdldCBjbG9zZXN0IFNvdXJjZXMgdG8gdGhlIExpc3RlbmVyXG4gICAgXG4gICAgLy8gSW5pdGlhbGlzaW5nIHRlbXBvcmFyeSB2YXJpYWJsZXM7XG4gICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcbiAgICB2YXIgY3VycmVudENsb3Nlc3RJZDtcblxuICAgIC8vIFJlc2V0IENvdW50XG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7XG4gICAgdGhpcy5nYWluTm9ybSA9IDA7XG5cbiAgICAvLyBHZXQgdGhlICduYkNsb3Nlc3QnIGNsb3Nlc3QgSWRzXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuYkNsb3Nlc3Q7IGorKykge1xuXG4gICAgICAvLyBTZXQgJ3VuZGVmaW5lZCcgdG8gdGhlIGN1cnJlbnRDbG9zZXN0SWQgdG8gaWdub3JlIGRpZmZpY3VsdGllcyB3aXRoIGluaXRpYWwgdmFsdWVzXG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gdW5kZWZpbmVkO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RPZlBvaW50Lmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIElkIGlzIG5vdCBhbHJlYWR5IGluIHRoZSBjbG9zZXN0IElkcyBhbmQgaWYgdGhlIFNvdXJjZSBvZiB0aGlzIElkIGlzIGNsb3Nlc3RcbiAgICAgICAgaWYgKHRoaXMuTm90SW4oaSwgY2xvc2VzdElkcykgJiYgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtpXSkgPCB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKSkge1xuICAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChqICE9IG5iQ2xvc2VzdCAtIDEpIHtcbiAgICAgICAgLy8gR2V0IHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBMaXN0ZW5lciBhbmQgdGhlIFNvdXJjZVxuICAgICAgICB0aGlzLmRpc3RhbmNlVmFsdWVbal0gPSB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKTtcblxuICAgICAgICAvLyBJbmNyZW1lbnQgJ3RoaXMuZGlzdGFuY2VTdW0nXG4gICAgICAgIHRoaXMuZGlzdGFuY2VTdW0gKz0gdGhpcy5kaXN0YW5jZVZhbHVlW2pdO1xuICAgICAgfVxuXG4gICAgICAvLyBQdXNoIHRoZSBJZCBpbiB0aGUgY2xvc2VzdFxuICAgICAgY2xvc2VzdElkcy5wdXNoKGN1cnJlbnRDbG9zZXN0SWQpO1xuICAgIH1cblxuICAgIC8vIFNldCB0aGUgR2FpbnMgYW5kIHRoZSBHYWlucyBub3JtXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmdhaW5zVmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuZ2FpbnNWYWx1ZVtpXSA9IE1hdGgucG93KCgxIC0gdGhpcy5kaXN0YW5jZVZhbHVlW2ldL3RoaXMuZGlzdGFuY2VTdW0pLCB0aGlzLmdhaW5FeHBvc2FudCk7XG4gICAgICB0aGlzLmdhaW5Ob3JtICs9IHRoaXMuZ2FpbnNWYWx1ZVtpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gKGNsb3Nlc3RJZHMpO1xuICB9XG5cbiAgTm90SW4ocG9pbnRJZCwgbGlzdE9mSWRzKSB7IC8vIENoZWNrIGlmIGFuIElkIGlzIG5vdCBpbiBhbiBJZHMnIGFycmF5XG4gICAgdmFyIGl0ZXJhdG9yID0gMDtcbiAgICB3aGlsZSAoaXRlcmF0b3IgPCBsaXN0T2ZJZHMubGVuZ3RoICYmIHBvaW50SWQgIT0gbGlzdE9mSWRzW2l0ZXJhdG9yXSkge1xuICAgICAgaXRlcmF0b3IgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuKGl0ZXJhdG9yID49IGxpc3RPZklkcy5sZW5ndGgpO1xuICB9XG5cbiAgRGlzdGFuY2UocG9pbnRBLCBwb2ludEIpIHsgLy8gR2V0IHRoZSBkaXN0YW5jZSBiZXR3ZWVuIDIgcG9pbnRzXG4gICAgaWYgKHBvaW50QiAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAoTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50QS54IC0gcG9pbnRCLngsIDIpICsgTWF0aC5wb3cocG9pbnRBLnkgLSBwb2ludEIueSwgMikpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gKEluZmluaXR5KTtcbiAgICB9XG4gIH1cblxuICBMb2FkTmV3U291bmQoYnVmZmVyLCBpbmRleCkgeyAvLyBDcmVhdGUgYW5kIGxpbmsgdGhlIHNvdW5kIHRvIHRoZSBBdWRpb0NvbnRleHRcbiAgICAvLyBTb3VuZCBpbml0aWFsaXNhdGlvblxuICAgIHZhciBzb3VuZCA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpOyAgIC8vIENyZWF0ZSB0aGUgc291bmRcbiAgICBzb3VuZC5sb29wID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIHNvdW5kIHRvIGxvb3BcbiAgICBzb3VuZC5idWZmZXIgPSBidWZmZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIHNvdW5kIGJ1ZmZlclxuICAgIHNvdW5kLmNvbm5lY3QodGhpcy5nYWluc1tpbmRleF0pOyAgICAgICAgICAgICAgICAgICAgIC8vIENvbm5lY3QgdGhlIHNvdW5kIHRvIHRoZSBvdGhlciBub2Rlc1xuICAgIHJldHVybiAoc291bmQpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQztJQUMzQyxNQUFNRixNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLQyxLQUFMLEdBQWEsSUFBYixDQUwyQyxDQU8zQzs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FSMkMsQ0FTM0M7O0lBQ0EsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVYyQyxDQVkzQzs7SUFDQSxLQUFLRSxZQUFMLEdBQW9CLElBQXBCO0lBQ0EsS0FBS0MsWUFBTCxHQUFvQixLQUFwQjtJQUNBLEtBQUtDLFNBQUwsR0FBaUIsS0FBakI7SUFDQSxLQUFLQyxPQUFMLEdBQWUsS0FBZixDQWhCMkMsQ0FrQjNDOztJQUNBLEtBQUtDLEtBQUwsQ0FuQjJDLENBbUJMOztJQUN0QyxLQUFLQyxLQUFMLENBcEIyQyxDQW9CTDs7SUFDdEMsS0FBS0MsVUFBTCxHQUFrQixFQUFsQixDQXJCMkMsQ0FxQkw7O0lBQ3RDLEtBQUtDLFNBQUwsR0FBaUIsYUFBakIsQ0F0QjJDLENBc0JMOztJQUN0QyxLQUFLQyxZQUFMLEdBQW9CLGFBQXBCO0lBQ0EsS0FBS0MsT0FBTDtJQUNBLEtBQUtDLGFBQUwsQ0F6QjJDLENBMEIzQztJQUVBOztJQUNBLEtB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