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
        // // Creating the data receiver (I need to use the 'leaf.url' to read the json)
        // var jsonData = new XMLHttpRequest();
        // // Wait the json file to be loaded
        // jsonData.addEventListener("load", () => {
        //   // Get the text from data
        //   var jsonText = JSON.stringify(jsonData.responseText);
        //   // Modify the text to be usable for an object
        //   jsonText = jsonText.replaceAll(/[/][/][ \w'"]+/g,'');
        //   jsonText = jsonText.replaceAll('\\n', '');
        //   jsonText = jsonText.replace(/^./,'');
        //   jsonText = jsonText.replace(/.$/,'');
        //   jsonText = jsonText.replaceAll('\\','');
        //   jsonText = jsonText.replaceAll('.0','');
        //   // Create the data object
        //   this.jsonObj = JSON.parse(jsonText);
        //   // Dispatch an event to inform that the data has been loaded
        //   document.dispatchEvent(new Event("dataLoaded"));
        //   }, false);
        // // Get the data of the json from the 'leaf.url'
        // jsonData.open("get", leaf.url, true);
        // jsonData.send();
        var url = leaf.url;
        fetch(url).then(results => results.json()).then(jsonObj => {
          console.log(jsonObj);
          console.log(jsonObj.receivers.xyz);
          this.jsonObj = jsonObj;
          document.dispatchEvent(new Event("dataLoaded"));
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsInJhbmdlIiwic2NhbGUiLCJjaXJjbGVTaXplIiwiYXVkaW9EYXRhIiwiZGF0YUZpbGVOYW1lIiwianNvbk9iaiIsImpzb25PYmpsb2FkZWQiLCJ0cnVlUG9zaXRpb25zIiwiYXVkaW9GaWxlc05hbWUiLCJsaXN0ZW5lclBvc2l0aW9uIiwieCIsInkiLCJDbG9zZXN0UG9pbnRzSWQiLCJwcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCIsIm5iQ2xvc2VzdFBvaW50cyIsInBvc2l0aW9ucyIsIm5iUG9zIiwiZGlzdGFuY2VWYWx1ZSIsImRpc3RhbmNlU3VtIiwiZ2FpbnNWYWx1ZSIsImdhaW5Ob3JtIiwiZ2FpbkV4cG9zYW50IiwiYXVkaW9Db250ZXh0IiwiQXVkaW9Db250ZXh0IiwicGxheWluZ1NvdW5kcyIsImdhaW5zIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJsb2FkRGF0YSIsImkiLCJwdXNoIiwiY3JlYXRlR2FpbiIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlY2VpdmVycyIsInh5eiIsImZpbGVzIiwibGVuZ3RoIiwiUmFuZ2UiLCJTY2FsaW5nIiwibW95WCIsIm1pblkiLCJDbG9zZXN0U291cmNlIiwic3Vic2NyaWJlIiwicmVuZGVyIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwibG9hZFNvdW5kYmFuayIsIm1pblgiLCJtYXhYIiwibWF4WSIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIlZQb3MyUGl4ZWwiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0Iiwic291bmRiYW5rVHJlZSIsImdldCIsImRlZk9iaiIsImNoaWxkcmVuIiwiZm9yRWFjaCIsImxlYWYiLCJ0eXBlIiwibmFtZSIsInVybCIsImxvYWQiLCJkYXRhIiwiZmV0Y2giLCJ0aGVuIiwicmVzdWx0cyIsImpzb24iLCJjb25zb2xlIiwibG9nIiwiZGlzcGF0Y2hFdmVudCIsIkV2ZW50IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiaHRtbCIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJjYW52YXMiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkxvYWROZXdTb3VuZCIsImNvbm5lY3QiLCJkZXN0aW5hdGlvbiIsIlBvc2l0aW9uQ2hhbmdlZCIsImNvbnRhaW5lciIsInJlc3VtZSIsInRlbXBDaXJjbGUiLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJVcGRhdGVMaXN0ZW5lciIsImhlaWdodCIsIndpZHRoIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiTm90SW4iLCJiYWNrZ3JvdW5kIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJVcGRhdGVTb3VyY2VzU291bmQiLCJpbmRleCIsInNvdXJjZVZhbHVlIiwicG93IiwiZ2FpbiIsInNldFZhbHVlQXRUaW1lIiwibGlzdE9mUG9pbnQiLCJuYkNsb3Nlc3QiLCJjbG9zZXN0SWRzIiwiY3VycmVudENsb3Nlc3RJZCIsImoiLCJ1bmRlZmluZWQiLCJEaXN0YW5jZSIsInBvaW50SWQiLCJsaXN0T2ZJZHMiLCJpdGVyYXRvciIsInBvaW50QSIsInBvaW50QiIsInNxcnQiLCJJbmZpbml0eSIsImJ1ZmZlciIsInNvdW5kIiwiY3JlYXRlQnVmZmVyU291cmNlIiwibG9vcCJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpO1xuICAgIC8vIHRoaXMuYW1iaXNvbmljcyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gc3RhcnQoKSlcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWFsaXNlZCBpbiBzdGFydCgpKVxuICAgIHRoaXMuY2lyY2xlU2l6ZSA9IDIwOyAgICAgICAgICAgICAgICAgLy8gU291cmNlcyBzaXplXG4gICAgdGhpcy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczAnOyAgICAgICAvLyBTZXQgdGhlIGF1ZGlvIGRhdGEgdG8gdXNlXG4gICAgdGhpcy5kYXRhRmlsZU5hbWUgPSBcInNjZW5lMi5qc29uXCI7XG4gICAgdGhpcy5qc29uT2JqO1xuICAgIHRoaXMuanNvbk9iamxvYWRlZDtcbiAgICAvLyB0aGlzLmRhdGFMb2FkZWQgPSBmYWxzZTtcblxuICAgIC8vIFBvc2l0aW9ucyBvZiB0aGUgc291cmNlc1xuICAgIHRoaXMudHJ1ZVBvc2l0aW9ucyA9IFtdO1xuXG4gICAgLy8gU291bmRzIG9mIHRoZSBzb3VyY2VzXG4gICAgdGhpcy5hdWRpb0ZpbGVzTmFtZSA9IFtdO1xuXG4gICAgLy8gVXNlciBwb3NpdGlvbnNcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24gPSB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICB9O1xuXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSBbXTsgICAgICAgICAgICAgICAgICAvLyBJZHMgb2YgY2xvc2VzdCBTb3VyY2VzXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IFtdOyAgICAgICAgICAvLyBJZHMgb2YgcHJldmlvdXMgY2xvc2VzdCBTb3VyY2VzXG4gICAgdGhpcy5uYkNsb3Nlc3RQb2ludHMgPSA0OyAgICAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgYXZ0aXZlIHNvdXJjZXNcbiAgICB0aGlzLnBvc2l0aW9ucyA9IFtdOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFycmF5IG9mIHNvdXJjZXMgcG9zaXRpb25zIChidWlsdCBpbiBzdGFydCgpKVxuICAgIHRoaXMubmJQb3M7ICAgICAvLyBOdW1iZXIgb2YgU291cmNlc1xuICAgIHRoaXMuZGlzdGFuY2VWYWx1ZSA9IFswLCAwLCAwLCAwXTsgICAgICAgICAgLy8gRGlzdGFuY2Ugb2YgY2xvc2VzdCBTb3VyY2VzXG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTdW0gb2YgZGlzdGFuY2VzIG9mIGNsb3Nlc3QgU291cmNlc1xuICAgIHRoaXMuZ2FpbnNWYWx1ZSA9IFsxLCAxLCAxXTsgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2YgR2FpbnNcbiAgICB0aGlzLmdhaW5Ob3JtID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vcm0gb2YgdGhlIEdhaW5zXG4gICAgdGhpcy5nYWluRXhwb3NhbnQgPSA0OyAgICAgICAgICAgICAgICAgICAgICAvLyBFc3Bvc2FudCB0byBpbmNyZWFzZSBHYWlucycgZ2FwXG5cbiAgICAvLyBDcmVhdGluZyBBdWRpb0NvbnRleHRcbiAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICB0aGlzLnBsYXlpbmdTb3VuZHMgPSBbXTsgICAgICAgICAgICAgICAgICAgIC8vIEJ1ZmZlclNvdXJjZXNcbiAgICB0aGlzLmdhaW5zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdhaW5zXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG4gICAgc3VwZXIuc3RhcnQoKTtcbiAgICAvLyBMb2FkIGFsbCBEYXRhc1xuICAgIGF3YWl0IHRoaXMubG9hZERhdGEoKTtcblxuICAgIC8vIENyZWF0aW5nIEdhaW5zXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICB0aGlzLmdhaW5zLnB1c2goYXdhaXQgdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpKTtcbiAgICB9XG5cbiAgICAvLyBXYWl0IGpzb24gZGF0YSB0byBiZSBsb2FkZWQgKGFuIGV2ZW50IGlzIGRpc3BhdGNoIGJ5ICdsb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgIC8vIFVwZGF0ZSBkYXRhIHZhbHVlc1xuICAgICAgdGhpcy50cnVlUG9zaXRpb25zID0gdGhpcy5qc29uT2JqLnJlY2VpdmVycy54eXo7XG4gICAgICB0aGlzLmF1ZGlvRmlsZXNOYW1lID0gdGhpcy5qc29uT2JqLnJlY2VpdmVycy5maWxlcztcbiAgICAgIHRoaXMubmJQb3MgPSB0aGlzLnRydWVQb3NpdGlvbnMubGVuZ3RoO1xuXG4gICAgICAvLyBJbml0aWFsaXNpbmcgb2YgU291cmNlcyBwb3NpdGlvbnMgZGF0YVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogdGhpcy50cnVlUG9zaXRpb25zW2ldWzBdLCB5OnRoaXMudHJ1ZVBvc2l0aW9uc1tpXVsxXX0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGluZyAndGhpcy5yYW5nZSdcbiAgICAgIHRoaXMuUmFuZ2UodGhpcy5wb3NpdGlvbnMpO1xuXG4gICAgICAvLyBJbml0aWFsaXNpbmcgJ3RoaXMuc2NhbGUnXG4gICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuXG4gICAgICAvLyBJbml0aWFsaXNpbmcgVXNlcidzIFBvc2l0aW9uXG4gICAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHRoaXMucmFuZ2UubW95WDtcbiAgICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgICAvLyBJbml0aWFsaXNpbmcgQ2xvc2VzdCBQb2ludHNcbiAgICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMsIHRoaXMubmJDbG9zZXN0UG9pbnRzKTtcblxuICAgICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxuICAgICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW5kZXIoKSk7XG5cbiAgICAgIC8vIEFkZCBFdmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIFdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTsgICAgICAgICAgICAgICAgICAgLy8gUmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIGluaXQgd2l0aCBjdXJyZW50IGNvbnRlbnRcbiAgICBhd2FpdCB0aGlzLmxvYWRTb3VuZGJhbmsoKTtcbiAgfVxuXG4gIFJhbmdlKHBvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IHBvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IHBvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdG8gZGlzcGxheSBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuICAgIHZhciBzY2FsZSA9IHtWUG9zMlBpeGVsOiBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLmNpcmNsZVNpemUpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMuY2lyY2xlU2l6ZSkvcmFuZ2VWYWx1ZXMucmFuZ2VZKX07XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICBsb2FkU291bmRiYW5rKCkgeyAvLyBMb2FkIHRoZSBhdWRpb0RhdGEgdG8gdXNlXG4gICAgY29uc3Qgc291bmRiYW5rVHJlZSA9IHRoaXMuZmlsZXN5c3RlbS5nZXQodGhpcy5hdWRpb0RhdGEpO1xuICAgIGNvbnN0IGRlZk9iaiA9IHt9O1xuICAgIHNvdW5kYmFua1RyZWUuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcbiAgICAgIGlmIChsZWFmLnR5cGUgPT09ICdmaWxlJykge1xuICAgICAgICBkZWZPYmpbbGVhZi5uYW1lXSA9IGxlYWYudXJsO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZChkZWZPYmosIHRydWUpO1xuICB9XG5cbiAgbG9hZERhdGEoKSB7IC8vIExvYWQgdGhlIGRhdGFcbiAgICBjb25zdCBkYXRhID0gdGhpcy5maWxlc3lzdGVtLmdldCgnUG9zaXRpb24nKTtcblxuICAgIC8vIENoZWNrIGZpbGVzIHRvIGdldCBjb25maWdcbiAgICBkYXRhLmNoaWxkcmVuLmZvckVhY2gobGVhZiA9PiB7XG4gICAgICBpZiAobGVhZi5uYW1lID09PSB0aGlzLmRhdGFGaWxlTmFtZSkge1xuXG4gICAgICAgIC8vIC8vIENyZWF0aW5nIHRoZSBkYXRhIHJlY2VpdmVyIChJIG5lZWQgdG8gdXNlIHRoZSAnbGVhZi51cmwnIHRvIHJlYWQgdGhlIGpzb24pXG4gICAgICAgIC8vIHZhciBqc29uRGF0YSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICAgIC8vIC8vIFdhaXQgdGhlIGpzb24gZmlsZSB0byBiZSBsb2FkZWRcbiAgICAgICAgLy8ganNvbkRhdGEuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgKCkgPT4ge1xuXG4gICAgICAgIC8vICAgLy8gR2V0IHRoZSB0ZXh0IGZyb20gZGF0YVxuICAgICAgICAvLyAgIHZhciBqc29uVGV4dCA9IEpTT04uc3RyaW5naWZ5KGpzb25EYXRhLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICBcbiAgICAgICAgLy8gICAvLyBNb2RpZnkgdGhlIHRleHQgdG8gYmUgdXNhYmxlIGZvciBhbiBvYmplY3RcbiAgICAgICAgLy8gICBqc29uVGV4dCA9IGpzb25UZXh0LnJlcGxhY2VBbGwoL1svXVsvXVsgXFx3J1wiXSsvZywnJyk7XG4gICAgICAgIC8vICAganNvblRleHQgPSBqc29uVGV4dC5yZXBsYWNlQWxsKCdcXFxcbicsICcnKTtcbiAgICAgICAgLy8gICBqc29uVGV4dCA9IGpzb25UZXh0LnJlcGxhY2UoL14uLywnJyk7XG4gICAgICAgIC8vICAganNvblRleHQgPSBqc29uVGV4dC5yZXBsYWNlKC8uJC8sJycpO1xuICAgICAgICAvLyAgIGpzb25UZXh0ID0ganNvblRleHQucmVwbGFjZUFsbCgnXFxcXCcsJycpO1xuICAgICAgICAvLyAgIGpzb25UZXh0ID0ganNvblRleHQucmVwbGFjZUFsbCgnLjAnLCcnKTtcblxuICAgICAgICAvLyAgIC8vIENyZWF0ZSB0aGUgZGF0YSBvYmplY3RcbiAgICAgICAgLy8gICB0aGlzLmpzb25PYmogPSBKU09OLnBhcnNlKGpzb25UZXh0KTtcblxuICAgICAgICAvLyAgIC8vIERpc3BhdGNoIGFuIGV2ZW50IHRvIGluZm9ybSB0aGF0IHRoZSBkYXRhIGhhcyBiZWVuIGxvYWRlZFxuICAgICAgICAvLyAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiZGF0YUxvYWRlZFwiKSk7XG4gICAgICAgIC8vICAgfSwgZmFsc2UpO1xuXG4gICAgICAgIC8vIC8vIEdldCB0aGUgZGF0YSBvZiB0aGUganNvbiBmcm9tIHRoZSAnbGVhZi51cmwnXG4gICAgICAgIC8vIGpzb25EYXRhLm9wZW4oXCJnZXRcIiwgbGVhZi51cmwsIHRydWUpO1xuICAgICAgICAvLyBqc29uRGF0YS5zZW5kKCk7XG4gICAgICAgIHZhciB1cmwgPSBsZWFmLnVybDtcbiAgICAgICAgZmV0Y2godXJsKS50aGVuKHJlc3VsdHMgPT4gcmVzdWx0cy5qc29uKCkpLnRoZW4oanNvbk9iaiA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coanNvbk9iailcbiAgICAgICAgICBjb25zb2xlLmxvZyhqc29uT2JqLnJlY2VpdmVycy54eXopXG4gICAgICAgICAgdGhpcy5qc29uT2JqID0ganNvbk9iajtcbiAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImRhdGFMb2FkZWRcIikpO1xuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIGNvbnNvbGUubG9nKFwicmVuZGVyXCIpXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpO1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgaWYgKCFsb2FkaW5nKSB7XG4gICAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weDtcbiAgICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWx9cHg7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogeWVsbG93OyB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpLzJ9cHgsICR7dGhpcy5jaXJjbGVTaXplLzJ9cHgpO1wiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdiBpZD1cImxpc3RlbmVyXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IGhlaWdodDogMTZweDsgd2lkdGg6IDE2cHg7IGJhY2tncm91bmQ6IGJsdWU7IHRleHQtYWxpZ246IGNlbnRlcjsgei1pbmRleDogMTtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeyh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4LCAkeyh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4KSByb3RhdGUoNDVkZWcpXCI7PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgY2lyY2xlcyB0byBkaXNwbGF5IFNvdXJjZXNcbiAgICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpKVxuXG4gICAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIG1vdXNlXG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgICAgLy8gVXNpbmcgdG91Y2hcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSlcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAvLyBJbml0aWFsaXNpbmcgYXVkaW9Ob2Rlc1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICAgICAgICAgIHRoaXMucGxheWluZ1NvdW5kcy5wdXNoKHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YVt0aGlzLmF1ZGlvRmlsZXNOYW1lW3RoaXMuQ2xvc2VzdFBvaW50c0lkW2ldXV0sIGkpKTtcbiAgICAgICAgICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgICAgICAgICAgaWYgKGkgIT0gdGhpcy5uYkNsb3Nlc3RQb2ludHMgLSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0YXJ0KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gR2V0IGFsbCB0aGUgZGF0YSBhbmQgc2V0IHRoZSBkaXNwbGF5IHRvIGJlZ2luXG4gICAgICAgICAgICB0aGlzLlBvc2l0aW9uQ2hhbmdlZCgpOyBcblxuICAgICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKGNvbnRhaW5lcikgeyAvLyBCZWdpbiBBdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgU291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XG5cbiAgICAvLyBCZWdpbiBBdWRpb0NvbnRleHRcbiAgICB0aGlzLmF1ZGlvQ29udGV4dC5yZXN1bWUoKTtcblxuICAgIC8vIEluaXRpYWxpc2luZyBhIHRlbXBvcmFyeSBjaXJjbGVcbiAgICB2YXIgdGVtcENpcmNsZTtcblxuICAgIC8vIENyZWF0ZSB0aGUgY2lyY2xlIGZvciB0aGUgU291cmNlc1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHsgICAgIC8vIGZvcmVhY2ggU291cmNlc1xuICAgICAgdGVtcENpcmNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpOyAgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBlbGVtZW50XG4gICAgICB0ZW1wQ2lyY2xlLmlkID0gXCJjaXJjbGVcIiArIGk7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgICAgdGVtcENpcmNsZS5pbm5lckhUTUwgPSBpICsgMTsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIHZhbHVlIChpKzEpXG5cbiAgICAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlID0gXCJwb3NpdGlvbjogYWJzb2x1dGU7IG1hcmdpbjogMCAtMTBweDsgd2lkdGg6IFwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgaGVpZ2h0OiBcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGJvcmRlci1yYWRpdXM6XCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBsaW5lLWhlaWdodDogXCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBiYWNrZ3JvdW5kOiBncmV5O1wiO1xuICAgICAgdGVtcENpcmNsZS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweClcIjtcbiAgICAgIFxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUgdG8gdGhlIGRpc3BsYXlcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZW1wQ2lyY2xlKTtcbiAgICB9XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBMaXN0ZW5lcidzIFBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBMaXN0ZW5lcidzIFBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMuY2lyY2xlU2l6ZS8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5yYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgXG4gICAgICAvLyBTZXQgdGhlIHZhbHVlIHRvIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uXG4gICAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG4gICAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5jaXJjbGVTaXplLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuXG4gICAgICAvLyBVcGRhdGUgTGlzdGVuZXJcbiAgICAgIHRoaXMuVXBkYXRlTGlzdGVuZXIoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLmNpcmNsZVNpemUvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG4gICAgXG4gICAgdGhpcy5VcGRhdGVMaXN0ZW5lcigpOyAgICAgICAgICAgIC8vIFVwZGF0ZSBMaXN0ZW5lclxuICAgIHRoaXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKCk7ICAgICAvLyBVcGRhdGUgU291cmNlcycgZGlzcGxheVxuICB9XG5cbiAgVXBkYXRlTGlzdGVuZXIoKSB7IC8vIFVwZGF0ZSBMaXN0ZW5lclxuXG4gICAgLy8gVXBkYXRlIExpc3RlbmVyJ3MgZGlwc2xheVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGlzdGVuZXJcIikuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwgLSB0aGlzLmNpcmNsZVNpemUvMikgKyBcInB4LCBcIiArICgodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4KSByb3RhdGUoNDVkZWcpXCI7XG4gICAgXG4gICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5IGZvciB0aGUgY3VycmVudCBQb3NpdGlvbiBvZiBMaXN0ZW5lclxuICAgIHRoaXMuUG9zaXRpb25DaGFuZ2VkKCk7ICBcbiAgfVxuXG4gIFBvc2l0aW9uQ2hhbmdlZCgpIHsgLy8gVXBkYXRlIHRoZSBjbG9zZXN0IFNvdXJjZXMgdG8gdXNlIHdoZW4gTGlzdGVuZXIncyBQb3NpdGlvbiBjaGFuZ2VkXG5cbiAgICAvLyBJbml0aWFsaXNpbmcgdmFyaWFibGVzXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFBvaW50c0lkO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBjbG9zZXN0IFBvaW50c1xuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMsIHRoaXMubmJDbG9zZXN0UG9pbnRzKTtcbiAgICBcbiAgICAvLyBDaGVjayBhbGwgdGhlIG5ldyBjbG9zZXN0IFBvaW50c1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHMgLSAxOyBpKyspIHtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIElkIGlzIG5ldyBpbiAndGhpcy5DbG9zZXN0UG9pbnRzSWQnXG4gICAgICBpZiAodGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSAhPSB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSkge1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgRGlzcGxheSBmb3IgU291cmNlcyB0aGF0IGFyZSBub3QgYWN0aXZlXG4gICAgICAgIGlmICh0aGlzLk5vdEluKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0sIHRoaXMuQ2xvc2VzdFBvaW50c0lkKSB8fCB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldID09IHRoaXMuQ2xvc2VzdFBvaW50c0lkW3RoaXMubmJDbG9zZXN0UG9pbnRzIC0gMV0pIHtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwiZ3JleVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0b3AoKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcCB0aGUgcHJldmlvdXMgU291cmNlXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5kaXNjb25uZWN0KHRoaXMuZ2FpbnNbaV0pOyAgICAgIC8vIERpc2Nvbm5lY3QgdGhlIFNvdXJjZSBmcm9tIHRoZSBhdWRpb1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgbmV3IFNvdW5kIGZvciB0aGUgbmV3IFNvdXJjZXNcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldID0gdGhpcy5Mb2FkTmV3U291bmQodGhpcy5hdWRpb0J1ZmZlckxvYWRlci5kYXRhW3RoaXMuYXVkaW9GaWxlc05hbWVbdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV1dXSwgaSk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXJ0IHRoZSBuZXcgU291cmNlXG4gICAgICB9XG5cbiAgICAvLyBVcGRhdGUgU291cmNlIHBhcmFtZXRlcnNcbiAgICB0aGlzLlVwZGF0ZVNvdXJjZXNTb3VuZChpKTtcbiAgICB9XG4gIH0gIFxuXG4gIFVwZGF0ZVNvdXJjZXNQb3NpdGlvbigpIHsgLy8gVXBkYXRlIHRoZSBQb3NpdGlvbnMgb2YgY2lyY2xlcyB3aGVuIHdpbmRvdyBpcyByZXNpemVkXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIGkpLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweCwgXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4KVwiO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZVNvdXJjZXNTb3VuZChpbmRleCkgeyAvLyBVcGRhdGUgR2FpbiBhbmQgRGlzcGxheSBvZiB0aGUgU291cmNlIGRlcGVuZGluZyBvbiBMaXN0ZW5lcidzIFBvc2l0aW9uXG5cbiAgICAvLyBTZXQgYSB1c2luZyB2YWx1ZSB0byB0aGUgU291cmNlXG4gICAgdmFyIHNvdXJjZVZhbHVlID0gdGhpcy5nYWluc1ZhbHVlW2luZGV4XS90aGlzLmdhaW5Ob3JtO1xuXG4gICAgLy8gVXBkYXRlIHRoZSBEaXNwbGF5IG9mIHRoZSBTb3VyY2VcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaW5kZXhdKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZ2IoMCwgXCIgKyAyNTUqKDQqTWF0aC5wb3coc291cmNlVmFsdWUsIDIpKSArIFwiLCAwKVwiO1xuICAgIFxuICAgIC8vIFVwZGF0ZSB0aGUgR2FpbiBvZiB0aGUgU291cmNlXG4gICAgdGhpcy5nYWluc1tpbmRleF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZShzb3VyY2VWYWx1ZSwgMCk7XG4gIH1cblxuICBDbG9zZXN0U291cmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50LCBuYkNsb3Nlc3QpIHsgLy8gZ2V0IGNsb3Nlc3QgU291cmNlcyB0byB0aGUgTGlzdGVuZXJcbiAgICBcbiAgICAvLyBJbml0aWFsaXNpbmcgdGVtcG9yYXJ5IHZhcmlhYmxlcztcbiAgICB2YXIgY2xvc2VzdElkcyA9IFtdO1xuICAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xuXG4gICAgLy8gUmVzZXQgQ291bnRcbiAgICB0aGlzLmRpc3RhbmNlU3VtID0gMDtcbiAgICB0aGlzLmdhaW5Ob3JtID0gMDtcblxuICAgIC8vIEdldCB0aGUgJ25iQ2xvc2VzdCcgY2xvc2VzdCBJZHNcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5iQ2xvc2VzdDsgaisrKSB7XG5cbiAgICAgIC8vIFNldCAndW5kZWZpbmVkJyB0byB0aGUgY3VycmVudENsb3Nlc3RJZCB0byBpZ25vcmUgZGlmZmljdWx0aWVzIHdpdGggaW5pdGlhbCB2YWx1ZXNcbiAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSB1bmRlZmluZWQ7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdE9mUG9pbnQubGVuZ3RoOyBpKyspIHtcblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgSWQgaXMgbm90IGFscmVhZHkgaW4gdGhlIGNsb3Nlc3QgSWRzIGFuZCBpZiB0aGUgU291cmNlIG9mIHRoaXMgSWQgaXMgY2xvc2VzdFxuICAgICAgICBpZiAodGhpcy5Ob3RJbihpLCBjbG9zZXN0SWRzKSAmJiB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2ldKSA8IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pKSB7XG4gICAgICAgICAgY3VycmVudENsb3Nlc3RJZCA9IGk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGogIT0gbmJDbG9zZXN0IC0gMSkge1xuICAgICAgICAvLyBHZXQgdGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIExpc3RlbmVyIGFuZCB0aGUgU291cmNlXG4gICAgICAgIHRoaXMuZGlzdGFuY2VWYWx1ZVtqXSA9IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pO1xuXG4gICAgICAgIC8vIEluY3JlbWVudCAndGhpcy5kaXN0YW5jZVN1bSdcbiAgICAgICAgdGhpcy5kaXN0YW5jZVN1bSArPSB0aGlzLmRpc3RhbmNlVmFsdWVbal07XG4gICAgICB9XG5cbiAgICAgIC8vIFB1c2ggdGhlIElkIGluIHRoZSBjbG9zZXN0XG4gICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBHYWlucyBhbmQgdGhlIEdhaW5zIG5vcm1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZ2FpbnNWYWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5nYWluc1ZhbHVlW2ldID0gTWF0aC5wb3coKDEgLSB0aGlzLmRpc3RhbmNlVmFsdWVbaV0vdGhpcy5kaXN0YW5jZVN1bSksIHRoaXMuZ2FpbkV4cG9zYW50KTtcbiAgICAgIHRoaXMuZ2Fpbk5vcm0gKz0gdGhpcy5nYWluc1ZhbHVlW2ldO1xuICAgIH1cblxuICAgIHJldHVybiAoY2xvc2VzdElkcyk7XG4gIH1cblxuICBOb3RJbihwb2ludElkLCBsaXN0T2ZJZHMpIHsgLy8gQ2hlY2sgaWYgYW4gSWQgaXMgbm90IGluIGFuIElkcycgYXJyYXlcbiAgICB2YXIgaXRlcmF0b3IgPSAwO1xuICAgIHdoaWxlIChpdGVyYXRvciA8IGxpc3RPZklkcy5sZW5ndGggJiYgcG9pbnRJZCAhPSBsaXN0T2ZJZHNbaXRlcmF0b3JdKSB7XG4gICAgICBpdGVyYXRvciArPSAxO1xuICAgIH1cbiAgICByZXR1cm4oaXRlcmF0b3IgPj0gbGlzdE9mSWRzLmxlbmd0aCk7XG4gIH1cblxuICBEaXN0YW5jZShwb2ludEEsIHBvaW50QikgeyAvLyBHZXQgdGhlIGRpc3RhbmNlIGJldHdlZW4gMiBwb2ludHNcbiAgICBpZiAocG9pbnRCICE9IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIChNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnRBLnggLSBwb2ludEIueCwgMikgKyBNYXRoLnBvdyhwb2ludEEueSAtIHBvaW50Qi55LCAyKSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiAoSW5maW5pdHkpO1xuICAgIH1cbiAgfVxuXG4gIExvYWROZXdTb3VuZChidWZmZXIsIGluZGV4KSB7IC8vIENyZWF0ZSBhbmQgbGluayB0aGUgc291bmQgdG8gdGhlIEF1ZGlvQ29udGV4dFxuICAgIC8vIFNvdW5kIGluaXRpYWxpc2F0aW9uXG4gICAgdmFyIHNvdW5kID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7ICAgLy8gQ3JlYXRlIHRoZSBzb3VuZFxuICAgIHNvdW5kLmxvb3AgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgc291bmQgdG8gbG9vcFxuICAgIHNvdW5kLmJ1ZmZlciA9IGJ1ZmZlcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgc291bmQgYnVmZmVyXG4gICAgc291bmQuY29ubmVjdCh0aGlzLmdhaW5zW2luZGV4XSk7ICAgICAgICAgICAgICAgICAgICAgLy8gQ29ubmVjdCB0aGUgc291bmQgdG8gdGhlIG90aGVyIG5vZGVzXG4gICAgcmV0dXJuIChzb3VuZCk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDO0lBQzNDLE1BQU1GLE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxJQUFiLENBTDJDLENBTzNDOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QixDQVIyQyxDQVMzQzs7SUFDQSxLQUFLQyxVQUFMLEdBQWtCLEtBQUtELE9BQUwsQ0FBYSxZQUFiLENBQWxCLENBVjJDLENBWTNDOztJQUNBLEtBQUtFLFlBQUwsR0FBb0IsSUFBcEI7SUFDQSxLQUFLQyxZQUFMLEdBQW9CLEtBQXBCO0lBQ0EsS0FBS0MsU0FBTCxHQUFpQixLQUFqQjtJQUNBLEtBQUtDLE9B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