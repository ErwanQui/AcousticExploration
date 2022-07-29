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

// import { Scheduler } from 'waves-masters';
class PlayerExperience extends _client.AbstractExperience {
  constructor(client, config = {}, $container, audioContext) {
    super(client);
    this.config = config;
    this.$container = $container;
    this.rafId = null; // Require plugins

    this.audioBufferLoader = this.require('audio-buffer-loader'); // To load audioBuffers

    this.filesystem = this.require('filesystem'); // To get files

    this.sync = this.require('sync'); // To sync audio sources

    this.platform = this.require('platform'); // To manage plugin for the sync

    this.audioStream = this.require('audio-streams'); // To manage plugin for the sync
    // Variable parameters

    this.parameters = {
      audioContext: audioContext,
      // Global audioContext
      order: 2,
      // Order of ambisonics
      nbClosestDetectSources: 3,
      // Number of closest points detected
      nbClosestActivSources: 3,
      // Number of closest points used as active audioSources
      gainExposant: 3,
      // Exposant of the gains (to increase contraste)
      // mode: "debug",                         // Choose audio mode (possible: "debug", "streaming", "ambisonic", "convolving", "ambiConvolving")
      // mode: "streaming",
      mode: "ambisonic",
      // mode: "convolving",
      // mode: "ambiConvolving",
      circleDiameter: 20,
      // Diameter of sources' display
      listenerSize: 16,
      // Size of listener's display
      dataFileName: "",
      // All sources' position and audioDatas' filenames (instantiated in 'start()')
      audioData: "" // All audioDatas (instantiated in 'start()')

    }; // Initialisation variables

    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false; // Instanciate classes' storer

    this.Listener; // Store the 'Listener' class

    this.Sources; // Store the 'Sources' class
    // Global values

    this.range; // Values of the array data (creates in 'start()')

    this.scale; // General Scales (initiated in 'start()')

    this.offset; // Offset of the display

    this.container; // General container of display elements (creates in 'render()')

    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    if (this.parameters.nbClosestDetectSources < this.parameters.nbClosestActivSources) {
      console.error("The number of detected sources must be higher than the number of used sources");
    }

    super.start();
    console.log("You are using " + this.parameters.mode + " mode."); // Switch files' names and audios, depending on the mode chosen

    switch (this.parameters.mode) {
      case 'debug':
        this.parameters.audioData = 'AudioFiles0';
        this.parameters.dataFileName = 'scene0.json';
        break;

      case 'streaming':
        // this.parameters.audioData = 'AudioFiles1';
        this.parameters.audioData = 'AudioFilesMusic1';
        this.parameters.dataFileName = 'scene1.json'; // this.parameters.audioData = 'AudioFilesPiano';
        // this.parameters.dataFileName = 'scenePiano.json';

        break;

      case 'ambisonic':
        this.parameters.audioData = 'AudioFiles2'; // this.parameters.audioData = 'AudioFilesSpeech1';
        // this.parameters.audioData = 'AudioFilesMusic1';

        this.parameters.dataFileName = 'scene2.json';
        break;

      case 'convolving':
        this.parameters.audioData = 'AudioFiles3';
        this.parameters.dataFileName = 'scene3.json';
        break;

      case 'ambiConvolving':
        this.parameters.audioData = 'AudioFiles4';
        this.parameters.dataFileName = 'scene4.json';
        break;

      default:
        alert("No valid mode");
    } // Create the objects storer for sources and load their fileDatas


    this.Sources = new _Sources.default(this.filesystem, this.audioBufferLoader, this.parameters, this.platform, this.sync, this.audioStream);
    this.Sources.LoadData(); // Wait until data have been loaded from json files ("dataLoaded" event is create 'this.Sources.LoadData()')

    document.addEventListener("dataLoaded", () => {
      console.log("json files: " + this.parameters.dataFileName + " has been read"); // Instantiate the attribute 'this.range' to get datas' parameters

      this.Range(this.Sources.sourcesData.receivers.xyz, this.Sources.sourcesData.sources_xy); // Instanciate 'this.scale'

      this.scale = this.Scaling(this.range); // Get offset parameters of the display

      this.offset = {
        x: this.range.moyX,
        y: this.range.minY
      };
      var listenerInitPos = {
        x: this.positionRange.moyX,
        y: this.positionRange.minY
      }; // Create, start and store the listener class

      this.Listener = new _Listener.default(listenerInitPos, this.parameters);
      this.Listener.start(this.scale, this.offset); // Start the sources display and audio depending on listener's initial position

      this.Sources.start(this.Listener.listenerPosition); // Add an event listener dispatched from "Listener.js" when the position of the user changed

      document.addEventListener('Moving', () => {
        this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // Update the sound depending on listener's position

        this.UpdateContainer();
        this.render();
      }); // Add event listener for resize window event to resize the display

      window.addEventListener('resize', () => {
        this.scale = this.Scaling(this.range); // Change the scale

        if (this.beginPressed) {
          // Check the begin State
          this.UpdateContainer(); // Resize the display
        } // Display


        this.render();
      }); // Display

      this.render();
    });
  }

  Range(audioSourcesPositions, sourcesPositions) {
    // Store the array properties in 'this.range'
    // @note: that can be probably be done in a more pretty way
    this.range = {
      minX: audioSourcesPositions[0].x,
      maxX: audioSourcesPositions[0].x,
      minY: audioSourcesPositions[0].y,
      maxY: audioSourcesPositions[0].y
    };
    this.positionRange = {
      minX: audioSourcesPositions[0].x,
      maxX: audioSourcesPositions[0].x,
      minY: audioSourcesPositions[0].y,
      maxY: audioSourcesPositions[0].y
    };

    for (let i = 1; i < audioSourcesPositions.length; i++) {
      if (audioSourcesPositions[i].x < this.range.minX) {
        this.range.minX = audioSourcesPositions[i].x;
        this.positionRange.minX = audioSourcesPositions[i].x;
      }

      if (audioSourcesPositions[i].x > this.range.maxX) {
        this.range.maxX = audioSourcesPositions[i].x;
        this.positionRange.maxX = audioSourcesPositions[i].x;
      }

      if (audioSourcesPositions[i].y < this.range.minY) {
        this.range.minY = audioSourcesPositions[i].y;
        this.positionRange.minY = audioSourcesPositions[i].y;
      }

      if (audioSourcesPositions[i].y > this.range.maxY) {
        this.range.maxY = audioSourcesPositions[i].y;
        this.positionRange.maxY = audioSourcesPositions[i].y;
      }
    }

    this.positionRange.moyX = (this.range.maxX + this.range.minX) / 2;
    this.positionRange.moyY = (this.range.maxY + this.range.minY) / 2;
    this.positionRange.rangeX = this.range.maxX - this.range.minX;
    this.positionRange.rangeY = this.range.maxY - this.range.minY;

    for (let i = 0; i < sourcesPositions.length; i++) {
      if (sourcesPositions[i].x < this.range.minX) {
        this.range.minX = sourcesPositions[i].x;
      }

      if (sourcesPositions[i].x > this.range.maxX) {
        this.range.maxX = sourcesPositions[i].x;
      }

      if (sourcesPositions[i].y < this.range.minY) {
        this.range.minY = sourcesPositions[i].y;
      }

      if (sourcesPositions[i].y > this.range.maxY) {
        this.range.maxY = sourcesPositions[i].y;
      }
    }

    this.range.moyX = (this.range.maxX + this.range.minX) / 2;
    this.range.moyY = (this.range.maxY + this.range.minY) / 2;
    this.range.rangeX = this.range.maxX - this.range.minX;
    this.range.rangeY = this.range.maxY - this.range.minY;
  }

  Scaling(rangeValues) {
    // Store the greatest scale that displays all the elements in 'this.scale'
    var scale = Math.min((window.innerWidth - this.parameters.circleDiameter) / rangeValues.rangeX, (window.innerHeight - this.parameters.circleDiameter) / rangeValues.rangeY);
    return scale;
  }

  render() {
    // Debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);
    this.rafId = window.requestAnimationFrame(() => {
      // Begin the render only when audioData ara loaded
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
          <div id="instrumentContainer" style="text-align: center; position: absolute; left: 50%">
            <div id="selector" style="position: absolute;
              height: ${this.range.rangeY * this.scale}px;
              width: ${this.range.rangeX * this.scale}px;
              background: z-index: 0;
              transform: translate(${-this.range.rangeX / 2 * this.scale}px, ${this.parameters.circleDiameter / 2}px);">
            </div>
          </div>
          <div id="circleContainer" style="text-align: center; position: absolute; left: 50%">
            <div id="selector" style="position: absolute;
              height: ${this.positionRange.rangeY * this.scale}px;
              width: ${this.positionRange.rangeX * this.scale}px;
              background: yellow; z-index: 0;
              transform: translate(${(this.positionRange.minX - this.range.minX - this.range.rangeX / 2) * this.scale}px, ${(this.positionRange.minY - this.range.minY) * this.scale + this.parameters.circleDiameter / 2}px);">
            </div>
            
          </div>
        </div>
      `, this.$container); // Do this only at beginning

      if (this.initialising) {
        this.initialising = false; // Update initialising State
        // Assign callbacks once

        var beginButton = document.getElementById("beginButton");
        beginButton.addEventListener("click", () => {
          // Change the display to begin the simulation
          document.getElementById("begin").style.visibility = "hidden";
          document.getElementById("begin").style.position = "absolute";
          document.getElementById("game").style.visibility = "visible"; // Assign global containers

          this.container = document.getElementById('circleContainer'); // Assign mouse and touch callbacks to change the user Position

          this.onBeginButtonClicked(); // Add mouseEvents to do actions when the user does actions on the screen

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
          }, false); // Add touchEvents to do actions when the user does actions on the screen

          this.container.addEventListener("touchstart", evt => {
            this.touched = true;
            this.userAction(evt.changedTouches[0]);
          }, false);
          this.container.addEventListener("touchmove", evt => {
            if (this.touched) {
              this.userAction(evt.changedTouches[0]);
            }
          }, false);
          this.container.addEventListener("touchend", evt => {
            this.touched = false;
          }, false);
          this.beginPressed = true; // Update begin State 
        });
      }
    });
  }

  onBeginButtonClicked() {
    // Begin audioContext and add the sources display to the display
    // Create and display objects
    this.CreateInstruments();
    this.Sources.CreateSources(this.container, this.scale, this.offset); // Create the sources and display them

    this.Listener.Display(this.container); // Add the listener's display to the container

    this.render(); // Update the display

    document.dispatchEvent(new Event("rendered")); // Create an event when the simulation appeared
  }

  CreateInstruments() {
    // Create the instruments and add them to the scene display
    var container = document.getElementById('instrumentContainer');
    var circleDiameter = this.parameters.circleDiameter;
    this.instruments = [];

    for (let i = 0; i < this.Sources.sourcesData.sources_xy.length; i++) {
      this.instruments.push(document.createElement('div')); // Create a new element

      this.instruments[i].id = "instrument" + i; // Set the circle id

      this.instruments[i].innerHTML = "S"; // Set the circle value (i+1)
      // Change form and position of the element to get a circle at the good place;

      this.instruments[i].style.position = "absolute";
      this.instruments[i].style.margin = "0 " + -circleDiameter / 2 + "px";
      this.instruments[i].style.width = circleDiameter + "px";
      this.instruments[i].style.height = circleDiameter + "px";
      this.instruments[i].style.borderRadius = circleDiameter + "px";
      this.instruments[i].style.lineHeight = circleDiameter + "px";
      this.instruments[i].style.background = "red";
      this.instruments[i].style.zIndex = 1;
      this.instruments[i].style.transform = "translate(" + (this.Sources.sourcesData.sources_xy[i].x - this.offset.x) * this.scale + "px, " + (this.Sources.sourcesData.sources_xy[i].y - this.offset.y) * this.scale + "px)"; // Add the circle's display to the global container

      container.appendChild(this.instruments[i]);
    }
  }

  userAction(mouse) {
    // Change listener's position when the mouse/touch has been used
    // Get the new potential listener's position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale;
    var tempY = this.range.minY + (mouse.clientY - this.parameters.circleDiameter / 2) / this.scale; // Check if the value is in the values range

    if (tempX >= this.positionRange.minX && tempX <= this.positionRange.maxX && tempY >= this.positionRange.minY && tempY <= this.positionRange.maxY) {
      console.log("Updating"); // Update objects and their display              

      this.Listener.Reset(mouse, this.offset, this.scale); // Reset the listener at the new position

      this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // Update the sound depending on listener's position

      this.render(); // Display
    } else {
      // When the value is out of range, stop the action
      this.mouseDown = false;
      this.touched = false;
    }
  }

  UpdateContainer() {
    // Change the display when the window is resized
    // Change size of the selector display
    document.getElementById("circleContainer").height = this.offset.y * this.scale + "px";
    document.getElementById("circleContainer").width = this.offset.x * this.scale + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.parameters.circleDiameter / 2 - this.range.rangeX * this.scale.VPos2Pixel / 2) + "px, 10px)"; // Change other global displays

    this.Sources.UpdateSourcesPosition(this.scale, this.offset); // Update sources' display

    this.Listener.UpdateListenerDisplay(this.offset, this.scale); // Update listener's display

    this.UpdateInstrumentsDisplay(); // Update instrument's display
  }

  UpdateInstrumentsDisplay() {
    // Update the position of the instruments
    for (let i = 0; i < this.Sources.sourcesData.sources_xy.length; i++) {
      this.instruments[i].style.transform = "translate(" + (this.Sources.sourcesData.sources_xy[i].x - this.offset.x) * this.scale + "px, " + (this.Sources.sourcesData.sources_xy[i].y - this.offset.y) * this.scale + "px)";
    }
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3REZXRlY3RTb3VyY2VzIiwibmJDbG9zZXN0QWN0aXZTb3VyY2VzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJlcnJvciIsImxvZyIsImFsZXJ0IiwiTG9hZERhdGEiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJSYW5nZSIsInNvdXJjZXNEYXRhIiwicmVjZWl2ZXJzIiwieHl6Iiwic291cmNlc194eSIsIlNjYWxpbmciLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwibGlzdGVuZXJJbml0UG9zIiwicG9zaXRpb25SYW5nZSIsImxpc3RlbmVyUG9zaXRpb24iLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiVXBkYXRlQ29udGFpbmVyIiwicmVuZGVyIiwid2luZG93IiwiYXVkaW9Tb3VyY2VzUG9zaXRpb25zIiwic291cmNlc1Bvc2l0aW9ucyIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJsZW5ndGgiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZUluc3RydW1lbnRzIiwiQ3JlYXRlU291cmNlcyIsIkRpc3BsYXkiLCJkaXNwYXRjaEV2ZW50IiwiRXZlbnQiLCJpbnN0cnVtZW50cyIsInB1c2giLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwibWFyZ2luIiwid2lkdGgiLCJoZWlnaHQiLCJib3JkZXJSYWRpdXMiLCJsaW5lSGVpZ2h0IiwiYmFja2dyb3VuZCIsInpJbmRleCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiUmVzZXQiLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5IiwiVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG4vLyBpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnNcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7ICAgICAvLyBUbyBsb2FkIGF1ZGlvQnVmZmVyc1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpOyAgICAgICAgICAgICAgICAgICAgIC8vIFRvIGdldCBmaWxlc1xuICAgIHRoaXMuc3luYyA9IHRoaXMucmVxdWlyZSgnc3luYycpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIHN5bmMgYXVkaW8gc291cmNlc1xuICAgIHRoaXMucGxhdGZvcm0gPSB0aGlzLnJlcXVpcmUoJ3BsYXRmb3JtJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG4gICAgdGhpcy5hdWRpb1N0cmVhbSA9IHRoaXMucmVxdWlyZSgnYXVkaW8tc3RyZWFtcycpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuXG4gICAgLy8gVmFyaWFibGUgcGFyYW1ldGVyc1xuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgIGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LCAgICAgICAgICAgICAgIC8vIEdsb2JhbCBhdWRpb0NvbnRleHRcbiAgICAgIG9yZGVyOiAyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9yZGVyIG9mIGFtYmlzb25pY3NcbiAgICAgIG5iQ2xvc2VzdERldGVjdFNvdXJjZXM6IDMsICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBkZXRlY3RlZFxuICAgICAgbmJDbG9zZXN0QWN0aXZTb3VyY2VzOiAzLCAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHVzZWQgYXMgYWN0aXZlIGF1ZGlvU291cmNlc1xuICAgICAgZ2FpbkV4cG9zYW50OiAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhwb3NhbnQgb2YgdGhlIGdhaW5zICh0byBpbmNyZWFzZSBjb250cmFzdGUpXG4gICAgICAvLyBtb2RlOiBcImRlYnVnXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJkZWJ1Z1wiLCBcInN0cmVhbWluZ1wiLCBcImFtYmlzb25pY1wiLCBcImNvbnZvbHZpbmdcIiwgXCJhbWJpQ29udm9sdmluZ1wiKVxuICAgICAgLy8gbW9kZTogXCJzdHJlYW1pbmdcIixcbiAgICAgIG1vZGU6IFwiYW1iaXNvbmljXCIsXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaUNvbnZvbHZpbmdcIixcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpYW1ldGVyIG9mIHNvdXJjZXMnIGRpc3BsYXlcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgICAgYXVkaW9EYXRhOiBcIlwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgYXVkaW9EYXRhcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBpZiAodGhpcy5wYXJhbWV0ZXJzLm5iQ2xvc2VzdERldGVjdFNvdXJjZXMgPCB0aGlzLnBhcmFtZXRlcnMubmJDbG9zZXN0QWN0aXZTb3VyY2VzKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiVGhlIG51bWJlciBvZiBkZXRlY3RlZCBzb3VyY2VzIG11c3QgYmUgaGlnaGVyIHRoYW4gdGhlIG51bWJlciBvZiB1c2VkIHNvdXJjZXNcIilcbiAgICB9XG5cbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3UgYXJlIHVzaW5nIFwiICsgdGhpcy5wYXJhbWV0ZXJzLm1vZGUgKyBcIiBtb2RlLlwiKTtcblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc011c2ljMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNQaWFubyc7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmVQaWFuby5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczInO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNTcGVlY2gxJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzTXVzaWMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTIuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUzLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXM0JztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTQuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIHN0b3JlciBmb3Igc291cmNlcyBhbmQgbG9hZCB0aGVpciBmaWxlRGF0YXNcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycywgdGhpcy5wbGF0Zm9ybSwgdGhpcy5zeW5jLCB0aGlzLmF1ZGlvU3RyZWFtKVxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgIGNvbnNvbGUubG9nKFwianNvbiBmaWxlczogXCIgKyB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lICsgXCIgaGFzIGJlZW4gcmVhZFwiKTtcblxuICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6LCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSk7XG5cbiAgICAgIC8vIEluc3RhbmNpYXRlICd0aGlzLnNjYWxlJ1xuICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgIH07XG5cbiAgICAgIHZhciBsaXN0ZW5lckluaXRQb3MgPSB7XG4gICAgICAgIHg6IHRoaXMucG9zaXRpb25SYW5nZS5tb3lYLFxuICAgICAgICB5OiB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWVxuICAgICAgfTtcblxuICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzXG4gICAgICB0aGlzLkxpc3RlbmVyID0gbmV3IExpc3RlbmVyKGxpc3RlbmVySW5pdFBvcywgdGhpcy5wYXJhbWV0ZXJzKTtcbiAgICAgIHRoaXMuTGlzdGVuZXIuc3RhcnQodGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpO1xuICAgICAgLy8gU3RhcnQgdGhlIHNvdXJjZXMgZGlzcGxheSBhbmQgYXVkaW8gZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgaW5pdGlhbCBwb3NpdGlvblxuICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7XG5cbiAgICAgIC8vIEFkZCBhbiBldmVudCBsaXN0ZW5lciBkaXNwYXRjaGVkIGZyb20gXCJMaXN0ZW5lci5qc1wiIHdoZW4gdGhlIHBvc2l0aW9uIG9mIHRoZSB1c2VyIGNoYW5nZWRcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ01vdmluZycsICgpID0+IHtcbiAgICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKClcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pXG4gICAgICBcbiAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIHdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG5cbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG5cbiAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pXG4gICAgICAvLyBEaXNwbGF5XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuICB9XG5cbiAgUmFuZ2UoYXVkaW9Tb3VyY2VzUG9zaXRpb25zLCBzb3VyY2VzUG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIC8vIEBub3RlOiB0aGF0IGNhbiBiZSBwcm9iYWJseSBiZSBkb25lIGluIGEgbW9yZSBwcmV0dHkgd2F5XG5cbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlID0ge1xuICAgICAgbWluWDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LFxuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGF1ZGlvU291cmNlc1Bvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gc291cmNlc1Bvc2l0aW9uc1tpXS54O1xuXG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcblxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVkpO1xuICAgIHJldHVybiAoc2NhbGUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdiBpZD1cImluc3RydW1lbnRDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoLXRoaXMucmFuZ2UucmFuZ2VYLzIpKnRoaXMuc2NhbGV9cHgsICR7dGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucG9zaXRpb25SYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogeWVsbG93OyB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygodGhpcy5wb3NpdGlvblJhbmdlLm1pblggLSB0aGlzLnJhbmdlLm1pblggLSB0aGlzLnJhbmdlLnJhbmdlWC8yKSp0aGlzLnNjYWxlKX1weCwgJHsodGhpcy5wb3NpdGlvblJhbmdlLm1pblkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUgKyB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG5cbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG5cbiAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcblxuICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgLy8gQXNzaWduIGdsb2JhbCBjb250YWluZXJzXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZCgpXG5cbiAgICAgICAgICAvLyBBZGQgbW91c2VFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIC8vIEFkZCB0b3VjaEV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG5cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gYXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIHNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQ3JlYXRlIGFuZCBkaXNwbGF5IG9iamVjdHNcbiAgICB0aGlzLkNyZWF0ZUluc3RydW1lbnRzKCk7XG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlcyBhbmQgZGlzcGxheSB0aGVtXG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIncyBkaXNwbGF5IHRvIHRoZSBjb250YWluZXJcbiAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZW5kZXJlZFwiKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGV2ZW50IHdoZW4gdGhlIHNpbXVsYXRpb24gYXBwZWFyZWRcbiAgfVxuXG4gIENyZWF0ZUluc3RydW1lbnRzKCkgeyAvLyBDcmVhdGUgdGhlIGluc3RydW1lbnRzIGFuZCBhZGQgdGhlbSB0byB0aGUgc2NlbmUgZGlzcGxheVxuXG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnN0cnVtZW50Q29udGFpbmVyJylcbiAgICB2YXIgY2lyY2xlRGlhbWV0ZXIgPSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXI7XG4gICAgdGhpcy5pbnN0cnVtZW50cyA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuXG4gICAgICB0aGlzLmluc3RydW1lbnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpOyAgICAgICAvLyBDcmVhdGUgYSBuZXcgZWxlbWVudFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pZCA9IFwiaW5zdHJ1bWVudFwiICsgaTsgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pbm5lckhUTUwgPSBcIlNcIjsgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSB2YWx1ZSAoaSsxKVxuXG4gICAgICAvLyBDaGFuZ2UgZm9ybSBhbmQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgdG8gZ2V0IGEgY2lyY2xlIGF0IHRoZSBnb29kIHBsYWNlO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUubWFyZ2luID0gXCIwIFwiICsgKC1jaXJjbGVEaWFtZXRlci8yKSArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUud2lkdGggPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuaGVpZ2h0ID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJvcmRlclJhZGl1cyA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5saW5lSGVpZ2h0ID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJhY2tncm91bmQgPSBcInJlZFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS56SW5kZXggPSAxO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcblxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUncyBkaXNwbGF5IHRvIHRoZSBnbG9iYWwgY29udGFpbmVyXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnN0cnVtZW50c1tpXSk7XG4gICAgfVxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgbGlzdGVuZXIncyBwb3NpdGlvbiB3aGVuIHRoZSBtb3VzZS90b3VjaCBoYXMgYmVlbiB1c2VkXG5cbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucG9zaXRpb25SYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucG9zaXRpb25SYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucG9zaXRpb25SYW5nZS5tYXhZKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nXCIpO1xuXG4gICAgICAvLyBVcGRhdGUgb2JqZWN0cyBhbmQgdGhlaXIgZGlzcGxheSAgICAgICAgICAgICAgXG4gICAgICB0aGlzLkxpc3RlbmVyLlJlc2V0KG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBsaXN0ZW5lciBhdCB0aGUgbmV3IHBvc2l0aW9uXG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlzcGxheVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBhY3Rpb25cbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuXG4gICAgLy8gQ2hhbmdlIHNpemUgb2YgdGhlIHNlbGVjdG9yIGRpc3BsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5vZmZzZXQueSp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLm9mZnNldC54KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweClcIjtcblxuICAgIC8vIENoYW5nZSBvdGhlciBnbG9iYWwgZGlzcGxheXNcbiAgICB0aGlzLlNvdXJjZXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAvLyBVcGRhdGUgc291cmNlcycgZGlzcGxheVxuICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICB0aGlzLlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgaW5zdHJ1bWVudCdzIGRpc3BsYXlcbiAgfVxuXG4gIFVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpIHsgLy8gVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgaW5zdHJ1bWVudHNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOzs7O0FBQ0E7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQ0MsWUFBbEMsRUFBZ0Q7SUFFekQsTUFBTUgsTUFBTjtJQUVBLEtBQUtDLE1BQUwsR0FBY0EsTUFBZDtJQUNBLEtB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