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

      this.Sources.start(this.Listener.listenerPosition);
      document.addEventListener('ListenerMove', () => {
        this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // Update the sound depending on listener's position

        this.UpdateContainer();
        this.render();
      }); // Add event listener for resize window event to resize the display

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic291cmNlc0RhdGEiLCJzb3VyY2VzX3h5IiwiUmFuZ2UiLCJyZWNlaXZlcnMiLCJ4eXoiLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJpIiwibGVuZ3RoIiwibW95WSIsInJhbmdlWCIsInJhbmdlWSIsInJhbmdlVmFsdWVzIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaHRtbCIsInR5cGUiLCJpZCIsImJlZ2luQnV0dG9uIiwiZ2V0RWxlbWVudEJ5SWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbiIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwibW91c2UiLCJ1c2VyQWN0aW9uIiwiZXZ0IiwiY2hhbmdlZFRvdWNoZXMiLCJDcmVhdGVJbnN0cnVtZW50cyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwiZGlzcGF0Y2hFdmVudCIsIkV2ZW50IiwiaW5zdHJ1bWVudHMiLCJwdXNoIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsIm1hcmdpbiIsIndpZHRoIiwiaGVpZ2h0IiwiYm9yZGVyUmFkaXVzIiwibGluZUhlaWdodCIsImJhY2tncm91bmQiLCJ6SW5kZXgiLCJ0cmFuc2Zvcm0iLCJhcHBlbmRDaGlsZCIsIlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSIsInRlbXBYIiwiY2xpZW50WCIsInRlbXBZIiwiY2xpZW50WSIsIlVwZGF0ZUxpc3RlbmVyIiwiVlBvczJQaXhlbCIsIlVwZGF0ZVNvdXJjZXNQb3NpdGlvbiIsIlVwZGF0ZUxpc3RlbmVyRGlzcGxheSJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuL0xpc3RlbmVyLmpzJ1xuaW1wb3J0IFNvdXJjZXMgZnJvbSAnLi9Tb3VyY2VzLmpzJ1xuLy8gaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSAnd2F2ZXMtbWFzdGVycyc7XG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyLCBhdWRpb0NvbnRleHQpIHtcblxuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTsgICAgIC8vIFRvIGxvYWQgYXVkaW9CdWZmZXJzXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7ICAgICAgICAgICAgICAgICAgICAgLy8gVG8gZ2V0IGZpbGVzXG4gICAgdGhpcy5zeW5jID0gdGhpcy5yZXF1aXJlKCdzeW5jJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3luYyBhdWRpbyBzb3VyY2VzXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHRoaXMucmVxdWlyZSgncGxhdGZvcm0nKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcbiAgICB0aGlzLmF1ZGlvU3RyZWFtID0gdGhpcy5yZXF1aXJlKCdhdWRpby1zdHJlYW1zJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0U291cmNlczogMywgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgbmJDbG9zZXN0UG9pbnRzOiAzLCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiLCBcImFtYmlDb252b2x2aW5nXCIpXG4gICAgICBtb2RlOiBcInN0cmVhbWluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpc29uaWNcIixcbiAgICAgIC8vIG1vZGU6IFwiY29udm9sdmluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpQ29udm9sdmluZ1wiLFxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlhbWV0ZXIgb2Ygc291cmNlcycgZGlzcGxheVxuICAgICAgbGlzdGVuZXJTaXplOiAxNiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2l6ZSBvZiBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIHNvdXJjZXMnIHBvc2l0aW9uIGFuZCBhdWRpb0RhdGFzJyBmaWxlbmFtZXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgICBhdWRpb0RhdGE6IFwiXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBhdWRpb0RhdGFzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG5cbiAgICAvLyBJbnN0YW5jaWF0ZSBjbGFzc2VzJyBzdG9yZXJcbiAgICB0aGlzLkxpc3RlbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnTGlzdGVuZXInIGNsYXNzXG4gICAgdGhpcy5Tb3VyY2VzOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ1NvdXJjZXMnIGNsYXNzXG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5vZmZzZXQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPZmZzZXQgb2YgdGhlIGRpc3BsYXlcbiAgICB0aGlzLmNvbnRhaW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgY29udGFpbmVyIG9mIGRpc3BsYXkgZWxlbWVudHMgKGNyZWF0ZXMgaW4gJ3JlbmRlcigpJylcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcblxuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICBjb25zb2xlLmxvZyhcIllvdSBhcmUgdXNpbmcgXCIgKyB0aGlzLnBhcmFtZXRlcnMubW9kZSArIFwiIG1vZGUuXCIpO1xuXG4gICAgLy8gU3dpdGNoIGZpbGVzJyBuYW1lcyBhbmQgYXVkaW9zLCBkZXBlbmRpbmcgb24gdGhlIG1vZGUgY2hvc2VuXG4gICAgc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgY2FzZSAnZGVidWcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTAuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzTXVzaWMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTEuanNvbic7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc1BpYW5vJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZVBpYW5vLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc1NwZWVjaDEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMi5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMzJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhbWJpQ29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczQnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lNC5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgdGhlIG9iamVjdHMgc3RvcmVyIGZvciBzb3VyY2VzIGFuZCBsb2FkIHRoZWlyIGZpbGVEYXRhc1xuICAgIHRoaXMuU291cmNlcyA9IG5ldyBTb3VyY2VzKHRoaXMuZmlsZXN5c3RlbSwgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciwgdGhpcy5wYXJhbWV0ZXJzLCB0aGlzLnBsYXRmb3JtLCB0aGlzLnN5bmMsIHRoaXMuYXVkaW9TdHJlYW0pXG4gICAgdGhpcy5Tb3VyY2VzLkxvYWREYXRhKCk7XG5cbiAgICAvLyBXYWl0IHVudGlsIGRhdGEgaGF2ZSBiZWVuIGxvYWRlZCBmcm9tIGpzb24gZmlsZXMgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWREYXRhKCknKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkYXRhTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgY29uc29sZS5sb2coXCJqc29uIGZpbGVzOiBcIiArIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgKyBcIiBoYXMgYmVlbiByZWFkXCIpO1xuXG4gICAgICAvLyBMb2FkIHNvdXJjZXMnIHNvdW5kIGRlcGVuZGluZyBvbiBtb2RlIChzb21lIG1vZGVzIG5lZWQgUklScyBpbiBhZGRpdGlvbiBvZiBzb3VuZHMpXG4gICAgICAvLyBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XG4gICAgICAvLyAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgIC8vICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgIC8vICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgIC8vICAgICB0aGlzLlNvdXJjZXMuTG9hZFNvdW5kYmFuaygpO1xuICAgICAgLy8gICAgIGJyZWFrO1xuXG4gICAgICAvLyAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxuICAgICAgLy8gICBjYXNlICdhbWJpQ29udm9sdmluZyc6XG4gICAgICAvLyAgICAgdGhpcy5Tb3VyY2VzLkxvYWRSaXJzKCk7XG4gICAgICAvLyAgICAgYnJlYWs7XG5cbiAgICAgIC8vICAgZGVmYXVsdDpcbiAgICAgIC8vICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgICAvLyB9XG5cbiAgICAgIC8vIFdhaXQgdW50aWwgYXVkaW9CdWZmZXIgaGFzIGJlZW4gbG9hZGVkIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkU291bmRCYW5rKCknKVxuICAgICAgLy8gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImF1ZGlvTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkF1ZGlvIGJ1ZmZlcnMgaGF2ZSBiZWVuIGxvYWRlZCBmcm9tIHNvdXJjZTogXCIgKyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhKTtcblxuICAgICAgICAvLyBJbnN0YW50aWF0ZSB0aGUgYXR0cmlidXRlICd0aGlzLnJhbmdlJyB0byBnZXQgZGF0YXMnIHBhcmFtZXRlcnNcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkpXG4gICAgICAgIHRoaXMuUmFuZ2UodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnJlY2VpdmVycy54eXosIHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5KTtcblxuICAgICAgICAvLyBJbnN0YW5jaWF0ZSAndGhpcy5zY2FsZSdcbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgICAgICAvLyBHZXQgb2Zmc2V0IHBhcmFtZXRlcnMgb2YgdGhlIGRpc3BsYXlcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB7XG4gICAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucmFuZ2UubWluWVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBsaXN0ZW5lckluaXRQb3MgPSB7XG4gICAgICAgICAgeDogdGhpcy5wb3NpdGlvblJhbmdlLm1veVgsXG4gICAgICAgICAgeTogdGhpcy5wb3NpdGlvblJhbmdlLm1pbllcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDcmVhdGUsIHN0YXJ0IGFuZCBzdG9yZSB0aGUgbGlzdGVuZXIgY2xhc3NcbiAgICAgICAgdGhpcy5MaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcihsaXN0ZW5lckluaXRQb3MsIHRoaXMucGFyYW1ldGVycyk7XG4gICAgICAgIHRoaXMuTGlzdGVuZXIuc3RhcnQodGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpO1xuICAgICAgICBjb25zb2xlLmxvZyhcImljaVwiKVxuICAgICAgICAvLyBTdGFydCB0aGUgc291cmNlcyBkaXNwbGF5IGFuZCBhdWRpbyBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBpbml0aWFsIHBvc2l0aW9uXG4gICAgICAgIHRoaXMuU291cmNlcy5zdGFydCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0xpc3RlbmVyTW92ZScsICgpID0+IHtcbiAgICAgICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpXG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIHdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgY29uc29sZS5sb2coXCJiYWggb3VpXCIpXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG5cbiAgICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcblxuICAgICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH1cblxuICBSYW5nZShhdWRpb1NvdXJjZXNQb3NpdGlvbnMsIHNvdXJjZXNQb3NpdGlvbnMpIHsgLy8gU3RvcmUgdGhlIGFycmF5IHByb3BlcnRpZXMgaW4gJ3RoaXMucmFuZ2UnXG4gICAgLy8gY29uc29sZS5sb2coc291cmNlc1Bvc2l0aW9ucylcblxuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYXVkaW9Tb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgICAvLyB2YXIgRCA9IHt0ZW1wUmFuZ2U6IHRoaXMucmFuZ2V9O1xuICAgIC8vIHRoaXMucG9zaXRpb25SYW5nZSA9IEQudGVtcFJhbmdlO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zb2xlLmxvZyh0aGlzLnJhbmdlLm1pblgpXG5cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gc291cmNlc1Bvc2l0aW9uc1tpXS54O1xuXG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcblxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UubWluWClcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWClcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcblxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVkpO1xuICAgIHJldHVybiAoc2NhbGUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdiBpZD1cImluc3RydW1lbnRDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoLXRoaXMucmFuZ2UucmFuZ2VYLzIpKnRoaXMuc2NhbGV9cHgsICR7dGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucG9zaXRpb25SYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogeWVsbG93OyB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygodGhpcy5wb3NpdGlvblJhbmdlLm1pblggLSB0aGlzLnJhbmdlLm1pblggLSB0aGlzLnJhbmdlLnJhbmdlWC8yKSp0aGlzLnNjYWxlKX1weCwgJHsodGhpcy5wb3NpdGlvblJhbmdlLm1pblkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUgKyB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG5cbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG5cbiAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcblxuICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgLy8gQXNzaWduIGdsb2FibCBjb250YWluZXJzXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZCgpXG5cbiAgICAgICAgICAvLyBBZGQgbW91c2VFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIC8vIEFkZCB0b3VjaEV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG5cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gYXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIHNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQ3JlYXRlIGFuZCBkaXNwbGF5IG9iamVjdHNcbiAgICB0aGlzLkNyZWF0ZUluc3RydW1lbnRzKCk7XG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlcyBhbmQgZGlzcGxheSB0aGVtXG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIncyBkaXNwbGF5IHRvIHRoZSBjb250YWluZXJcbiAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZW5kZXJlZFwiKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGV2ZW50IHdoZW4gdGhlIHNpbXVsYXRpb24gYXBwZWFyZWRcbiAgfVxuXG4gIENyZWF0ZUluc3RydW1lbnRzKCkge1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5zdHJ1bWVudENvbnRhaW5lcicpXG4gICAgdmFyIGNpcmNsZURpYW1ldGVyID0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyO1xuICAgIHRoaXMuaW5zdHJ1bWVudHMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkubGVuZ3RoOyBpKyspIHtcblxuICAgICAgdGhpcy5pbnN0cnVtZW50cy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlJ3MgZGlzcGxheVxuICAgICAgLy8gdGhpcy5zb3VyY2VzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpOyAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGVsZW1lbnRcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaWQgPSBcImluc3RydW1lbnRcIiArIGk7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pbm5lckhUTUwgPSBcIlNcIjsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIHZhbHVlIChpKzEpXG5cbiAgICAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5tYXJnaW4gPSBcIjAgXCIgKyAoLWNpcmNsZURpYW1ldGVyLzIpICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS53aWR0aCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5oZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYm9yZGVyUmFkaXVzID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmxpbmVIZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnpJbmRleCA9IDE7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuXG4gICAgICBjb25zb2xlLmxvZygodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhKSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSlcblxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUncyBkaXNwbGF5IHRvIHRoZSBnbG9iYWwgY29udGFpbmVyXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnN0cnVtZW50c1tpXSk7XG4gICAgICBjb25zb2xlLmxvZyhcInpibG9cIilcbiAgICB9XG4gIH1cblxuICBVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcbiAgICB9XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBsaXN0ZW5lcidzIHBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMikvKHRoaXMuc2NhbGUpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmdcIilcblxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXlcbiAgICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXIobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplIG9mIGRpc3BsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5vZmZzZXQueSp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLm9mZnNldC54KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweClcIjtcblxuICAgIHRoaXMuU291cmNlcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24odGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgIC8vIFVwZGF0ZSBzb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lckRpc3BsYXkodGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICAgIHRoaXMuVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5KCk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUNBO0FBRUEsTUFBTUEsZ0JBQU4sU0FBK0JDLDBCQUEvQixDQUFrRDtFQUNoREMsV0FBVyxDQUFDQyxNQUFELEVBQVNDLE1BQU0sR0FBRyxFQUFsQixFQUFzQkMsVUFBdEIsRUFBa0NDLFlBQWxD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