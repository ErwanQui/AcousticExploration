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
      console.log("json files: " + this.parameters.dataFileName + " has been read"); // Wait until audioBuffer has been loaded ("dataLoaded" event is create 'this.Sources.LoadSoundBank()')
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

      this.Sources.start(this.Listener.listenerPosition); // document.addEventListener('ListenerMove', () => {
      //   this.Sources.onListenerPositionChanged(this.Listener.listenerPosition);         // Update the sound depending on listener's position
      //   this.UpdateContainer()
      //   this.render();
      // })

      document.addEventListener('Moving', () => {
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
      // this.Listener.UpdateListener(mouse, this.offset, this.scale);                   // Update the listener's position

      this.Listener.Reset(mouse, this.offset, this.scale);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic291cmNlc0RhdGEiLCJzb3VyY2VzX3h5IiwiUmFuZ2UiLCJyZWNlaXZlcnMiLCJ4eXoiLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJpIiwibGVuZ3RoIiwibW95WSIsInJhbmdlWCIsInJhbmdlWSIsInJhbmdlVmFsdWVzIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaHRtbCIsInR5cGUiLCJpZCIsImJlZ2luQnV0dG9uIiwiZ2V0RWxlbWVudEJ5SWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbiIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwibW91c2UiLCJ1c2VyQWN0aW9uIiwiZXZ0IiwiY2hhbmdlZFRvdWNoZXMiLCJDcmVhdGVJbnN0cnVtZW50cyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwiZGlzcGF0Y2hFdmVudCIsIkV2ZW50IiwiaW5zdHJ1bWVudHMiLCJwdXNoIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsIm1hcmdpbiIsIndpZHRoIiwiaGVpZ2h0IiwiYm9yZGVyUmFkaXVzIiwibGluZUhlaWdodCIsImJhY2tncm91bmQiLCJ6SW5kZXgiLCJ0cmFuc2Zvcm0iLCJhcHBlbmRDaGlsZCIsIlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSIsInRlbXBYIiwiY2xpZW50WCIsInRlbXBZIiwiY2xpZW50WSIsIlJlc2V0IiwiVlBvczJQaXhlbCIsIlVwZGF0ZVNvdXJjZXNQb3NpdGlvbiIsIlVwZGF0ZUxpc3RlbmVyRGlzcGxheSJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuL0xpc3RlbmVyLmpzJ1xuaW1wb3J0IFNvdXJjZXMgZnJvbSAnLi9Tb3VyY2VzLmpzJ1xuLy8gaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSAnd2F2ZXMtbWFzdGVycyc7XG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyLCBhdWRpb0NvbnRleHQpIHtcblxuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTsgICAgIC8vIFRvIGxvYWQgYXVkaW9CdWZmZXJzXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7ICAgICAgICAgICAgICAgICAgICAgLy8gVG8gZ2V0IGZpbGVzXG4gICAgdGhpcy5zeW5jID0gdGhpcy5yZXF1aXJlKCdzeW5jJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3luYyBhdWRpbyBzb3VyY2VzXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHRoaXMucmVxdWlyZSgncGxhdGZvcm0nKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcbiAgICB0aGlzLmF1ZGlvU3RyZWFtID0gdGhpcy5yZXF1aXJlKCdhdWRpby1zdHJlYW1zJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0U291cmNlczogMywgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgbmJDbG9zZXN0UG9pbnRzOiAzLCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiLCBcImFtYmlDb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcInN0cmVhbWluZ1wiLFxuICAgICAgbW9kZTogXCJhbWJpc29uaWNcIixcbiAgICAgIC8vIG1vZGU6IFwiY29udm9sdmluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpQ29udm9sdmluZ1wiLFxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlhbWV0ZXIgb2Ygc291cmNlcycgZGlzcGxheVxuICAgICAgbGlzdGVuZXJTaXplOiAxNiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2l6ZSBvZiBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIHNvdXJjZXMnIHBvc2l0aW9uIGFuZCBhdWRpb0RhdGFzJyBmaWxlbmFtZXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgICBhdWRpb0RhdGE6IFwiXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBhdWRpb0RhdGFzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG5cbiAgICAvLyBJbnN0YW5jaWF0ZSBjbGFzc2VzJyBzdG9yZXJcbiAgICB0aGlzLkxpc3RlbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnTGlzdGVuZXInIGNsYXNzXG4gICAgdGhpcy5Tb3VyY2VzOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ1NvdXJjZXMnIGNsYXNzXG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5vZmZzZXQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPZmZzZXQgb2YgdGhlIGRpc3BsYXlcbiAgICB0aGlzLmNvbnRhaW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgY29udGFpbmVyIG9mIGRpc3BsYXkgZWxlbWVudHMgKGNyZWF0ZXMgaW4gJ3JlbmRlcigpJylcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcblxuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICBjb25zb2xlLmxvZyhcIllvdSBhcmUgdXNpbmcgXCIgKyB0aGlzLnBhcmFtZXRlcnMubW9kZSArIFwiIG1vZGUuXCIpO1xuXG4gICAgLy8gU3dpdGNoIGZpbGVzJyBuYW1lcyBhbmQgYXVkaW9zLCBkZXBlbmRpbmcgb24gdGhlIG1vZGUgY2hvc2VuXG4gICAgc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgY2FzZSAnZGVidWcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTAuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzTXVzaWMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTEuanNvbic7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc1BpYW5vJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZVBpYW5vLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc1NwZWVjaDEnO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNNdXNpYzEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMi5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMzJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhbWJpQ29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczQnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lNC5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgdGhlIG9iamVjdHMgc3RvcmVyIGZvciBzb3VyY2VzIGFuZCBsb2FkIHRoZWlyIGZpbGVEYXRhc1xuICAgIHRoaXMuU291cmNlcyA9IG5ldyBTb3VyY2VzKHRoaXMuZmlsZXN5c3RlbSwgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciwgdGhpcy5wYXJhbWV0ZXJzLCB0aGlzLnBsYXRmb3JtLCB0aGlzLnN5bmMsIHRoaXMuYXVkaW9TdHJlYW0pXG4gICAgdGhpcy5Tb3VyY2VzLkxvYWREYXRhKCk7XG5cbiAgICAvLyBXYWl0IHVudGlsIGRhdGEgaGF2ZSBiZWVuIGxvYWRlZCBmcm9tIGpzb24gZmlsZXMgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWREYXRhKCknKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkYXRhTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgY29uc29sZS5sb2coXCJqc29uIGZpbGVzOiBcIiArIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgKyBcIiBoYXMgYmVlbiByZWFkXCIpO1xuXG4gICAgICAvLyBXYWl0IHVudGlsIGF1ZGlvQnVmZmVyIGhhcyBiZWVuIGxvYWRlZCAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZFNvdW5kQmFuaygpJylcbiAgICAgIC8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJhdWRpb0xvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJBdWRpbyBidWZmZXJzIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBzb3VyY2U6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSk7XG5cbiAgICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5KVxuICAgICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6LCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSk7XG5cbiAgICAgICAgLy8gSW5zdGFuY2lhdGUgJ3RoaXMuc2NhbGUnXG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG5cbiAgICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICAgIHRoaXMub2Zmc2V0ID0ge1xuICAgICAgICAgIHg6IHRoaXMucmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbGlzdGVuZXJJbml0UG9zID0ge1xuICAgICAgICAgIHg6IHRoaXMucG9zaXRpb25SYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzXG4gICAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIobGlzdGVuZXJJbml0UG9zLCB0aGlzLnBhcmFtZXRlcnMpO1xuICAgICAgICB0aGlzLkxpc3RlbmVyLnN0YXJ0KHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTtcbiAgICAgICAgY29uc29sZS5sb2coXCJpY2lcIilcbiAgICAgICAgLy8gU3RhcnQgdGhlIHNvdXJjZXMgZGlzcGxheSBhbmQgYXVkaW8gZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgaW5pdGlhbCBwb3NpdGlvblxuICAgICAgICB0aGlzLlNvdXJjZXMuc3RhcnQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTtcblxuICAgICAgICAvLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdMaXN0ZW5lck1vdmUnLCAoKSA9PiB7XG4gICAgICAgIC8vICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICAgIC8vICAgdGhpcy5VcGRhdGVDb250YWluZXIoKVxuICAgICAgICAvLyAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIC8vIH0pXG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTW92aW5nJywgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKClcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgd2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICBjb25zb2xlLmxvZyhcImJhaCBvdWlcIilcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcblxuICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAvLyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIFJhbmdlKGF1ZGlvU291cmNlc1Bvc2l0aW9ucywgc291cmNlc1Bvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcbiAgICAvLyBjb25zb2xlLmxvZyhzb3VyY2VzUG9zaXRpb25zKVxuXG4gICAgdGhpcy5yYW5nZSA9IHtcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuICAgIHRoaXMucG9zaXRpb25SYW5nZSA9IHtcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhdWRpb1NvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcblxuICAgIC8vIHZhciBEID0ge3RlbXBSYW5nZTogdGhpcy5yYW5nZX07XG4gICAgLy8gdGhpcy5wb3NpdGlvblJhbmdlID0gRC50ZW1wUmFuZ2U7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UubWluWClcblxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBzb3VyY2VzUG9zaXRpb25zW2ldLng7XG5cbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gc291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5yYW5nZS5taW5YKVxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucG9zaXRpb25SYW5nZS5taW5YKVxuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdGhhdCBkaXNwbGF5cyBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVgsICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG5cbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwiaW5zdHJ1bWVudENvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgvMikqdGhpcy5zY2FsZX1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KCh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAtIHRoaXMucmFuZ2UubWluWCAtIHRoaXMucmFuZ2UucmFuZ2VYLzIpKnRoaXMuc2NhbGUpfXB4LCAkeyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZSArIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7ICAgICAgICAgIC8vIFVwZGF0ZSBpbml0aWFsaXNpbmcgU3RhdGVcblxuICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuXG4gICAgICAgICAgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHRvIGJlZ2luIHRoZSBzaW11bGF0aW9uXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cbiAgICAgICAgICAvLyBBc3NpZ24gZ2xvYmFsIGNvbnRhaW5lcnNcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKClcblxuICAgICAgICAgIC8vIEFkZCBtb3VzZUV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgLy8gQWRkIHRvdWNoRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKCkgeyAvLyBCZWdpbiBhdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgc291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XG5cbiAgICAvLyBDcmVhdGUgYW5kIGRpc3BsYXkgb2JqZWN0c1xuICAgIHRoaXMuQ3JlYXRlSW5zdHJ1bWVudHMoKTtcbiAgICB0aGlzLlNvdXJjZXMuQ3JlYXRlU291cmNlcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgICAgLy8gQ3JlYXRlIHRoZSBzb3VyY2VzIGFuZCBkaXNwbGF5IHRoZW1cbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBsaXN0ZW5lcidzIGRpc3BsYXkgdG8gdGhlIGNvbnRhaW5lclxuICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInJlbmRlcmVkXCIpKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYW4gZXZlbnQgd2hlbiB0aGUgc2ltdWxhdGlvbiBhcHBlYXJlZFxuICB9XG5cbiAgQ3JlYXRlSW5zdHJ1bWVudHMoKSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnN0cnVtZW50Q29udGFpbmVyJylcbiAgICB2YXIgY2lyY2xlRGlhbWV0ZXIgPSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXI7XG4gICAgdGhpcy5pbnN0cnVtZW50cyA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuXG4gICAgICB0aGlzLmluc3RydW1lbnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpXG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzb3VyY2UncyBkaXNwbGF5XG4gICAgICAvLyB0aGlzLnNvdXJjZXMucHVzaChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSk7ICAgICAgICAvLyBDcmVhdGUgYSBuZXcgZWxlbWVudFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pZCA9IFwiaW5zdHJ1bWVudFwiICsgaTsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIGlkXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLmlubmVySFRNTCA9IFwiU1wiOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgdmFsdWUgKGkrMSlcblxuICAgICAgLy8gQ2hhbmdlIGZvcm0gYW5kIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IHRvIGdldCBhIGNpcmNsZSBhdCB0aGUgZ29vZCBwbGFjZTtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLm1hcmdpbiA9IFwiMCBcIiArICgtY2lyY2xlRGlhbWV0ZXIvMikgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLndpZHRoID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmhlaWdodCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5ib3JkZXJSYWRpdXMgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUubGluZUhlaWdodCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZWRcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuekluZGV4ID0gMTtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSkgKyBcInB4LCBcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnkgLSB0aGlzLm9mZnNldC55KSp0aGlzLnNjYWxlKSArIFwicHgpXCI7XG5cbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEpKVxuICAgICAgY29uc29sZS5sb2coKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKVxuICAgICAgY29uc29sZS5sb2coKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnkgLSB0aGlzLm9mZnNldC55KSp0aGlzLnNjYWxlKVxuXG4gICAgICAvLyBBZGQgdGhlIGNpcmNsZSdzIGRpc3BsYXkgdG8gdGhlIGdsb2JhbCBjb250YWluZXJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmluc3RydW1lbnRzW2ldKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiemJsb1wiKVxuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuICAgIH1cbiAgfVxuXG4gIHVzZXJBY3Rpb24obW91c2UpIHsgLy8gQ2hhbmdlIGxpc3RlbmVyJ3MgcG9zaXRpb24gd2hlbiB0aGUgbW91c2UgaGFzIGJlZW4gdXNlZFxuXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICB2YXIgdGVtcFggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yKS8odGhpcy5zY2FsZSk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WSkge1xuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxuXG4gICAgICAvLyBVcGRhdGUgb2JqZWN0cyBhbmQgdGhlaXIgZGlzcGxheVxuICAgICAgLy8gdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMuTGlzdGVuZXIuUmVzZXQobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTtcbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIHZhbHVlIGlzIG91dCBvZiByYW5nZSwgc3RvcCB0aGUgTGlzdGVuZXIncyBQb3NpdGlvbiBVcGRhdGVcbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuXG4gICAgLy8gQ2hhbmdlIHNpemUgb2YgZGlzcGxheVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLm9mZnNldC55KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgLy8gVXBkYXRlIHNvdXJjZXMnIGRpc3BsYXlcbiAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyRGlzcGxheSh0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgdGhpcy5VcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOzs7O0FBQ0E7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQ0MsWUFBbEMsRUFBZ0Q7SUFFekQsTUFBTUgsTUFBTjtJQUVBLEtBQUtDLE1BQUwsR0FBY0EsTUFBZDtJQUNBLEtBQUtDLFVBQUwsR0FBa0JBLFVBQWxCO0lBQ0EsS0FBS0Us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