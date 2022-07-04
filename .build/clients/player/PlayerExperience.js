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
    this.rafId = null; // Require plugins if needed

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
      nbClosestSources: 3,
      // Number of closest points searched
      nbClosestPoints: 3,
      // Number of closest points searched
      gainExposant: 3,
      // Exposant of the gains (to increase contraste)
      // mode: "debug",                         // Choose audio mode (possible: "debug", "streaming", "ambisonic", "convolving", "ambiConvolving")
      mode: "streaming",
      // mode: "ambisonic",
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
      console.log("json files: " + this.parameters.dataFileName + " has been read"); // Load sources' sound depending on mode (some modes need RIRs in addition of sounds)
      // switch (this.parameters.mode) {
      //   case 'debug':
      //   case 'streaming':
      //   case 'ambisonic':
      //     this.Sources.LoadSoundbank();
      //     break;
      //   case 'convolving':
      //   case 'ambiConvolving':
      //     this.Sources.LoadRirs();
      //     break;
      //   default:
      //     alert("No valid mode");
      // }
      // Wait until audioBuffer has been loaded ("dataLoaded" event is create 'this.Sources.LoadSoundBank()')
      // document.addEventListener("audioLoaded", () => {
      // console.log("Audio buffers have been loaded from source: " + this.parameters.audioData);
      // Instantiate the attribute 'this.range' to get datas' parameters

      console.log(this.Sources.sourcesData.sources_xy);
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
      this.Listener.start(this.scale, this.offset);
      console.log("ici"); // Start the sources display and audio depending on listener's initial position

      this.Sources.start(this.Listener.listenerPosition); // Add event listener for resize window event to resize the display

      console.log("bah oui");
      window.addEventListener('resize', () => {
        this.scale = this.Scaling(this.range); // Change the scale

        if (this.beginPressed) {
          // Check the begin State
          this.UpdateContainer(); // Resize the display
        } // Display


        this.render();
      }); // Display

      this.render(); // });
    });
  }

  Range(audioSourcesPositions, sourcesPositions) {
    // Store the array properties in 'this.range'
    // console.log(sourcesPositions)
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
    this.positionRange.rangeY = this.range.maxY - this.range.minY; // var D = {tempRange: this.range};
    // this.positionRange = D.tempRange;

    for (let i = 0; i < sourcesPositions.length; i++) {
      console.log(this.range.minX);

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
    this.range.rangeY = this.range.maxY - this.range.minY; // console.log(this.range.minX)
    // console.log(this.positionRange.minX)
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
          document.getElementById("game").style.visibility = "visible"; // Assign gloabl containers

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
    var container = document.getElementById('instrumentContainer');
    var circleDiameter = this.parameters.circleDiameter;
    this.instruments = [];

    for (let i = 0; i < this.Sources.sourcesData.sources_xy.length; i++) {
      this.instruments.push(document.createElement('div')); // Create the source's display
      // this.sources.push(document.createElement('div'));        // Create a new element

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
      this.instruments[i].style.transform = "translate(" + (this.Sources.sourcesData.sources_xy[i].x - this.offset.x) * this.scale + "px, " + (this.Sources.sourcesData.sources_xy[i].y - this.offset.y) * this.scale + "px)";
      console.log(this.Sources.sourcesData);
      console.log((this.Sources.sourcesData.sources_xy[i].x - this.offset.x) * this.scale);
      console.log((this.Sources.sourcesData.sources_xy[i].y - this.offset.y) * this.scale); // Add the circle's display to the global container

      container.appendChild(this.instruments[i]);
      console.log("zblo");
    }
  }

  UpdateInstrumentsDisplay() {
    for (let i = 0; i < this.Sources.sourcesData.sources_xy.length; i++) {
      this.instruments[i].style.transform = "translate(" + (this.Sources.sourcesData.sources_xy[i].x - this.offset.x) * this.scale + "px, " + (this.Sources.sourcesData.sources_xy[i].y - this.offset.y) * this.scale + "px)";
    }
  }

  userAction(mouse) {
    // Change listener's position when the mouse has been used
    // Get the new potential listener's position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale;
    var tempY = this.range.minY + (mouse.clientY - this.parameters.circleDiameter / 2) / this.scale; // Check if the value is in the values range

    if (tempX >= this.positionRange.minX && tempX <= this.positionRange.maxX && tempY >= this.positionRange.minY && tempY <= this.positionRange.maxY) {
      console.log("Updating"); // Update objects and their display

      this.Listener.UpdateListener(mouse, this.offset, this.scale); // Update the listener's position

      this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // Update the sound depending on listener's position

      this.render(); // Update the display
    } else {
      // When the value is out of range, stop the Listener's Position Update
      this.mouseDown = false;
      this.touched = false;
    }
  }

  UpdateContainer() {
    // Change the display when the window is resized
    // Change size of display
    document.getElementById("circleContainer").height = this.offset.y * this.scale + "px";
    document.getElementById("circleContainer").width = this.offset.x * this.scale + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.parameters.circleDiameter / 2 - this.range.rangeX * this.scale.VPos2Pixel / 2) + "px, 10px)";
    this.Sources.UpdateSourcesPosition(this.scale, this.offset); // Update sources' display

    this.Listener.UpdateListenerDisplay(this.offset, this.scale); // Update listener's display

    this.UpdateInstrumentsDisplay(); // Update listener's display
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic291cmNlc0RhdGEiLCJzb3VyY2VzX3h5IiwiUmFuZ2UiLCJyZWNlaXZlcnMiLCJ4eXoiLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwicmVuZGVyIiwiYXVkaW9Tb3VyY2VzUG9zaXRpb25zIiwic291cmNlc1Bvc2l0aW9ucyIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJsZW5ndGgiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZUluc3RydW1lbnRzIiwiQ3JlYXRlU291cmNlcyIsIkRpc3BsYXkiLCJkaXNwYXRjaEV2ZW50IiwiRXZlbnQiLCJpbnN0cnVtZW50cyIsInB1c2giLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwibWFyZ2luIiwid2lkdGgiLCJoZWlnaHQiLCJib3JkZXJSYWRpdXMiLCJsaW5lSGVpZ2h0IiwiYmFja2dyb3VuZCIsInpJbmRleCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwiVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiVlBvczJQaXhlbCIsIlVwZGF0ZVNvdXJjZXNQb3NpdGlvbiIsIlVwZGF0ZUxpc3RlbmVyRGlzcGxheSJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuL0xpc3RlbmVyLmpzJ1xuaW1wb3J0IFNvdXJjZXMgZnJvbSAnLi9Tb3VyY2VzLmpzJ1xuLy8gaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSAnd2F2ZXMtbWFzdGVycyc7XG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyLCBhdWRpb0NvbnRleHQpIHtcblxuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTsgICAgIC8vIFRvIGxvYWQgYXVkaW9CdWZmZXJzXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7ICAgICAgICAgICAgICAgICAgICAgLy8gVG8gZ2V0IGZpbGVzXG4gICAgdGhpcy5zeW5jID0gdGhpcy5yZXF1aXJlKCdzeW5jJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3luYyBhdWRpbyBzb3VyY2VzXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHRoaXMucmVxdWlyZSgncGxhdGZvcm0nKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcbiAgICB0aGlzLmF1ZGlvU3RyZWFtID0gdGhpcy5yZXF1aXJlKCdhdWRpby1zdHJlYW1zJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0U291cmNlczogMywgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgbmJDbG9zZXN0UG9pbnRzOiAzLCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiLCBcImFtYmlDb252b2x2aW5nXCIpXG4gICAgICBtb2RlOiBcInN0cmVhbWluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpc29uaWNcIixcbiAgICAgIC8vIG1vZGU6IFwiY29udm9sdmluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpQ29udm9sdmluZ1wiLFxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlhbWV0ZXIgb2Ygc291cmNlcycgZGlzcGxheVxuICAgICAgbGlzdGVuZXJTaXplOiAxNiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2l6ZSBvZiBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIHNvdXJjZXMnIHBvc2l0aW9uIGFuZCBhdWRpb0RhdGFzJyBmaWxlbmFtZXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgICBhdWRpb0RhdGE6IFwiXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBhdWRpb0RhdGFzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG5cbiAgICAvLyBJbnN0YW5jaWF0ZSBjbGFzc2VzJyBzdG9yZXJcbiAgICB0aGlzLkxpc3RlbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnTGlzdGVuZXInIGNsYXNzXG4gICAgdGhpcy5Tb3VyY2VzOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ1NvdXJjZXMnIGNsYXNzXG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5vZmZzZXQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPZmZzZXQgb2YgdGhlIGRpc3BsYXlcbiAgICB0aGlzLmNvbnRhaW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgY29udGFpbmVyIG9mIGRpc3BsYXkgZWxlbWVudHMgKGNyZWF0ZXMgaW4gJ3JlbmRlcigpJylcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcblxuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICBjb25zb2xlLmxvZyhcIllvdSBhcmUgdXNpbmcgXCIgKyB0aGlzLnBhcmFtZXRlcnMubW9kZSArIFwiIG1vZGUuXCIpO1xuXG4gICAgLy8gU3dpdGNoIGZpbGVzJyBuYW1lcyBhbmQgYXVkaW9zLCBkZXBlbmRpbmcgb24gdGhlIG1vZGUgY2hvc2VuXG4gICAgc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgY2FzZSAnZGVidWcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTAuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzTXVzaWMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTEuanNvbic7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc1BpYW5vJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZVBpYW5vLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc1NwZWVjaDEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMi5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMzJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhbWJpQ29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczQnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lNC5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgdGhlIG9iamVjdHMgc3RvcmVyIGZvciBzb3VyY2VzIGFuZCBsb2FkIHRoZWlyIGZpbGVEYXRhc1xuICAgIHRoaXMuU291cmNlcyA9IG5ldyBTb3VyY2VzKHRoaXMuZmlsZXN5c3RlbSwgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciwgdGhpcy5wYXJhbWV0ZXJzLCB0aGlzLnBsYXRmb3JtLCB0aGlzLnN5bmMsIHRoaXMuYXVkaW9TdHJlYW0pXG4gICAgdGhpcy5Tb3VyY2VzLkxvYWREYXRhKCk7XG5cbiAgICAvLyBXYWl0IHVudGlsIGRhdGEgaGF2ZSBiZWVuIGxvYWRlZCBmcm9tIGpzb24gZmlsZXMgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWREYXRhKCknKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkYXRhTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgY29uc29sZS5sb2coXCJqc29uIGZpbGVzOiBcIiArIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgKyBcIiBoYXMgYmVlbiByZWFkXCIpO1xuXG4gICAgICAvLyBMb2FkIHNvdXJjZXMnIHNvdW5kIGRlcGVuZGluZyBvbiBtb2RlIChzb21lIG1vZGVzIG5lZWQgUklScyBpbiBhZGRpdGlvbiBvZiBzb3VuZHMpXG4gICAgICAvLyBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XG4gICAgICAvLyAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgIC8vICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgIC8vICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgIC8vICAgICB0aGlzLlNvdXJjZXMuTG9hZFNvdW5kYmFuaygpO1xuICAgICAgLy8gICAgIGJyZWFrO1xuXG4gICAgICAvLyAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxuICAgICAgLy8gICBjYXNlICdhbWJpQ29udm9sdmluZyc6XG4gICAgICAvLyAgICAgdGhpcy5Tb3VyY2VzLkxvYWRSaXJzKCk7XG4gICAgICAvLyAgICAgYnJlYWs7XG5cbiAgICAgIC8vICAgZGVmYXVsdDpcbiAgICAgIC8vICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgICAvLyB9XG5cbiAgICAgIC8vIFdhaXQgdW50aWwgYXVkaW9CdWZmZXIgaGFzIGJlZW4gbG9hZGVkIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkU291bmRCYW5rKCknKVxuICAgICAgLy8gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImF1ZGlvTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkF1ZGlvIGJ1ZmZlcnMgaGF2ZSBiZWVuIGxvYWRlZCBmcm9tIHNvdXJjZTogXCIgKyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhKTtcblxuICAgICAgICAvLyBJbnN0YW50aWF0ZSB0aGUgYXR0cmlidXRlICd0aGlzLnJhbmdlJyB0byBnZXQgZGF0YXMnIHBhcmFtZXRlcnNcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkpXG4gICAgICAgIHRoaXMuUmFuZ2UodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnJlY2VpdmVycy54eXosIHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5KTtcblxuICAgICAgICAvLyBJbnN0YW5jaWF0ZSAndGhpcy5zY2FsZSdcbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgICAgICAvLyBHZXQgb2Zmc2V0IHBhcmFtZXRlcnMgb2YgdGhlIGRpc3BsYXlcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB7XG4gICAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucmFuZ2UubWluWVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBsaXN0ZW5lckluaXRQb3MgPSB7XG4gICAgICAgICAgeDogdGhpcy5wb3NpdGlvblJhbmdlLm1veVgsXG4gICAgICAgICAgeTogdGhpcy5wb3NpdGlvblJhbmdlLm1pbllcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDcmVhdGUsIHN0YXJ0IGFuZCBzdG9yZSB0aGUgbGlzdGVuZXIgY2xhc3NcbiAgICAgICAgdGhpcy5MaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcihsaXN0ZW5lckluaXRQb3MsIHRoaXMucGFyYW1ldGVycyk7XG4gICAgICAgIHRoaXMuTGlzdGVuZXIuc3RhcnQodGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpO1xuICAgICAgICBjb25zb2xlLmxvZyhcImljaVwiKVxuICAgICAgICAvLyBTdGFydCB0aGUgc291cmNlcyBkaXNwbGF5IGFuZCBhdWRpbyBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBpbml0aWFsIHBvc2l0aW9uXG4gICAgICAgIHRoaXMuU291cmNlcy5zdGFydCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuICAgICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSB3aW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgIGNvbnNvbGUubG9nKFwiYmFoIG91aVwiKVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuXG4gICAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG5cbiAgICAgICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBTdGF0ZVxuICAgICAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTsgICAgICAgICAgICAgICAgICAgLy8gUmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIC8vIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgUmFuZ2UoYXVkaW9Tb3VyY2VzUG9zaXRpb25zLCBzb3VyY2VzUG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIC8vIGNvbnNvbGUubG9nKHNvdXJjZXNQb3NpdGlvbnMpXG5cbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlID0ge1xuICAgICAgbWluWDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LFxuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGF1ZGlvU291cmNlc1Bvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgLy8gdmFyIEQgPSB7dGVtcFJhbmdlOiB0aGlzLnJhbmdlfTtcbiAgICAvLyB0aGlzLnBvc2l0aW9uUmFuZ2UgPSBELnRlbXBSYW5nZTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlc1Bvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc29sZS5sb2codGhpcy5yYW5nZS5taW5YKVxuXG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcblxuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBzb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnJhbmdlLm1pblgpXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5wb3NpdGlvblJhbmdlLm1pblgpXG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0aGF0IGRpc3BsYXlzIGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG5cbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcblxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXYgaWQ9XCJpbnN0cnVtZW50Q29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWC8yKSp0aGlzLnNjYWxlfXB4LCAke3RoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoKHRoaXMucG9zaXRpb25SYW5nZS5taW5YIC0gdGhpcy5yYW5nZS5taW5YIC0gdGhpcy5yYW5nZS5yYW5nZVgvMikqdGhpcy5zY2FsZSl9cHgsICR7KHRoaXMucG9zaXRpb25SYW5nZS5taW5ZIC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlICsgdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuXG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cbiAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9hYmwgY29udGFpbmVyc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgLy8gQWRkIG1vdXNlRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7ICAgICAgICAgLy8gVXBkYXRlIGJlZ2luIFN0YXRlIFxuXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIGF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBzb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIENyZWF0ZSBhbmQgZGlzcGxheSBvYmplY3RzXG4gICAgdGhpcy5DcmVhdGVJbnN0cnVtZW50cygpO1xuICAgIHRoaXMuU291cmNlcy5DcmVhdGVTb3VyY2VzKHRoaXMuY29udGFpbmVyLCB0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZXMgYW5kIGRpc3BsYXkgdGhlbVxuICAgIHRoaXMuTGlzdGVuZXIuRGlzcGxheSh0aGlzLmNvbnRhaW5lcik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyJ3MgZGlzcGxheSB0byB0aGUgY29udGFpbmVyXG4gICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVuZGVyZWRcIikpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBldmVudCB3aGVuIHRoZSBzaW11bGF0aW9uIGFwcGVhcmVkXG4gIH1cblxuICBDcmVhdGVJbnN0cnVtZW50cygpIHtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2luc3RydW1lbnRDb250YWluZXInKVxuICAgIHZhciBjaXJjbGVEaWFtZXRlciA9IHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcjtcbiAgICB0aGlzLmluc3RydW1lbnRzID0gW11cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5Lmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgIHRoaXMuaW5zdHJ1bWVudHMucHVzaChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSlcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZSdzIGRpc3BsYXlcbiAgICAgIC8vIHRoaXMuc291cmNlcy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKTsgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBlbGVtZW50XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLmlkID0gXCJpbnN0cnVtZW50XCIgKyBpOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgaWRcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaW5uZXJIVE1MID0gXCJTXCI7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSB2YWx1ZSAoaSsxKVxuXG4gICAgICAvLyBDaGFuZ2UgZm9ybSBhbmQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgdG8gZ2V0IGEgY2lyY2xlIGF0IHRoZSBnb29kIHBsYWNlO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUubWFyZ2luID0gXCIwIFwiICsgKC1jaXJjbGVEaWFtZXRlci8yKSArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUud2lkdGggPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuaGVpZ2h0ID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJvcmRlclJhZGl1cyA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5saW5lSGVpZ2h0ID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJhY2tncm91bmQgPSBcInJlZFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS56SW5kZXggPSAxO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcblxuICAgICAgY29uc29sZS5sb2coKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YSkpXG4gICAgICBjb25zb2xlLmxvZygodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpXG4gICAgICBjb25zb2xlLmxvZygodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpXG5cbiAgICAgIC8vIEFkZCB0aGUgY2lyY2xlJ3MgZGlzcGxheSB0byB0aGUgZ2xvYmFsIGNvbnRhaW5lclxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuaW5zdHJ1bWVudHNbaV0pO1xuICAgICAgY29uc29sZS5sb2coXCJ6YmxvXCIpXG4gICAgfVxuICB9XG5cbiAgVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5KCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSkgKyBcInB4LCBcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnkgLSB0aGlzLm9mZnNldC55KSp0aGlzLnNjYWxlKSArIFwicHgpXCI7XG4gICAgfVxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgbGlzdGVuZXIncyBwb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG5cbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucG9zaXRpb25SYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucG9zaXRpb25SYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucG9zaXRpb25SYW5nZS5tYXhZKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nXCIpXG5cbiAgICAgIC8vIFVwZGF0ZSBvYmplY3RzIGFuZCB0aGVpciBkaXNwbGF5XG4gICAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyKG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uIFVwZGF0ZVxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cbiAgICAvLyBDaGFuZ2Ugc2l6ZSBvZiBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMub2Zmc2V0LnkqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5vZmZzZXQueCp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG5cbiAgICB0aGlzLlNvdXJjZXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAvLyBVcGRhdGUgc291cmNlcycgZGlzcGxheVxuICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICB0aGlzLlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7QUFDQTtBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDQyxZQUFsQyxFQUFnRDtJQUV6RCxNQUFNSCxNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLRSxLQUFMLEdBQWEsSUFBYixDQU55RCxDQVF6RDs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FUeUQsQ0FTUzs7SUFDbEUsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVZ5RCxDQVVTOztJQUNsRSxLQUFLRSxJQUFMLEdBQVksS0FBS0YsT0FBTCxDQUFhLE1BQWIs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