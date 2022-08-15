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

class PlayerExperience extends _client.AbstractExperience {
  constructor(client, config = {}, $container, audioContext) {
    super(client);
    this.config = config;
    this.$container = $container;
    this.rafId = null; // Require plugins
    // @note: could be a good idea to create a plugin object

    this.audioBufferLoader = this.require('audio-buffer-loader'); // To load audioBuffers

    this.filesystem = this.require('filesystem'); // To get files

    this.sync = this.require('sync'); // To sync audio sources

    this.platform = this.require('platform'); // To manage plugin for the sync

    this.audioStream = this.require('audio-streams'); // To manage plugin for the sync
    // Variable parameters

    this.parameters = {
      audioContext: audioContext,
      // Global audioContext
      // order: 2,                                 // Order of ambisonics
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

    this.initialising = true; // Attribute to know if the event listener havn't been initiated

    this.beginPressed = false; // Attribute to know if the beginButton has already been pressed

    this.mouseDown = false; // Attribute to know if the mouse is pressed (computer)

    this.touched = false; // Attribute to know if the screen is touched (device)
    // Instanciate classes' storer

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
    super.start(); // Check

    if (this.parameters.nbClosestDetectSources < this.parameters.nbClosestActivSources) {
      console.error("The number of detected sources must be higher than the number of used sources");
    } // Switch files' names and audios, depending on the mode chosen


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
      // Get background html code
      this.scene = this.Sources.image; // Instantiate the attribute 'this.range' to get datas' parameters

      this.Range(this.Sources.sourcesData.receivers.xyz, this.Sources.sourcesData.sources_xy, this.Sources.sourcesData.extremum); // Instanciate 'this.scale'

      this.scale = this.Scaling(this.extremum); // Get offset parameters of the display

      this.offset = {
        x: this.extremum.moyX,
        y: this.extremum.minY
      };
      var listenerInitPos = {
        x: this.positionRange.moyX,
        y: this.positionRange.minY
      }; // Resize background

      this.UpdateSceneDisplay(); // Create, start and store the listener class object

      this.Listener = new _Listener.default(listenerInitPos, this.parameters);
      this.Listener.start(this.scale, this.offset); // Start the sources display and audio depending on listener's initial position

      this.Sources.start(this.Listener.listenerPosition); // Add an event listener dispatched from "Listener.js" when the position of the user changed

      document.addEventListener('Moving', () => {
        this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // Update the sound depending on listener's position

        this.UpdateContainer();
        this.render();
      }); // Add event listener for resize window event to resize the display

      window.addEventListener('resize', () => {
        this.scale = this.Scaling(this.extremum); // Change the scale

        if (this.beginPressed) {
          // Check the begin state
          this.UpdateContainer(); // Resize the display
        } // Display


        this.render();
      }); // Display

      this.render();
    });
  }

  Range(audioSourcesPositions, sourcesPositions, imageExtremum) {
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
    this.extremum = {
      minX: imageExtremum[0].x,
      maxX: imageExtremum[1].x,
      minY: imageExtremum[0].y,
      maxY: imageExtremum[1].y
    };
    this.extremum.rangeX = this.extremum.maxX - this.extremum.minX;
    this.extremum.moyX = (this.extremum.maxX + this.extremum.minX) / 2;
    this.extremum.rangeY = this.extremum.maxY - this.extremum.minY;

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
    var scale = Math.min(window.innerWidth / rangeValues.rangeX, window.innerHeight / rangeValues.rangeY);
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
              z-index: 0;
              transform: translate(${(this.range.minX - this.extremum.minX - this.extremum.rangeX / 2) * this.scale}px, ${this.parameters.circleDiameter / 2}px);">
            </div>
          </div>
          <div id="scene" style="position: absolute;
              left: 50%;
              height: ${this.range.rangeY * this.scale}px;
              width: ${this.range.rangeX * this.scale}px;
              transform: translate(${-this.extremum.rangeX / 2 * this.scale}px, 0px);">
            ${this.scene}
          </div>
          <div id="circleContainer" style="text-align: center; position: absolute; left: 50%">
            <div id="selector" style="position: absolute;
              height: ${this.positionRange.rangeY * this.scale}px;
              width: ${this.positionRange.rangeX * this.scale}px;
              z-index: 0;
              transform: translate(${(this.positionRange.minX - this.extremum.minX - this.extremum.rangeX / 2) * this.scale}px, ${(this.positionRange.minY - this.extremum.minY) * this.scale + this.parameters.circleDiameter / 2}px);">
            </div>
          </div>
        </div>
      `, this.$container); // Do this only at beginning

      if (this.initialising) {
        this.initialising = false; // Update initialising state
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
          this.beginPressed = true; // Update begin state 
        });
      }
    });
  }

  onBeginButtonClicked() {
    // Begin audioContext and add the sources display to the display
    // Create and display objects
    this.CreateInstruments(); // Create the instruments and display them

    this.Sources.CreateSources(this.container, this.scale, this.offset); // Create the sources and display them

    this.Listener.Display(this.container); // Add the listener's display to the container

    this.render(); // Update the display
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
    var tempX = this.extremum.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale;
    var tempY = this.extremum.minY + (mouse.clientY - this.parameters.circleDiameter / 2) / this.scale; // Check if the value is in the values range

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

    this.UpdateSceneDisplay(); // Update scene's display
  }

  UpdateInstrumentsDisplay() {
    // Update the position of the instruments
    for (let i = 0; i < this.Sources.sourcesData.sources_xy.length; i++) {
      this.instruments[i].style.transform = "translate(" + (this.Sources.sourcesData.sources_xy[i].x - this.offset.x) * this.scale + "px, " + (this.Sources.sourcesData.sources_xy[i].y - this.offset.y) * this.scale + "px)";
    }
  }

  UpdateSceneDisplay() {
    // Update the scale of the scene
    this.scene.width = this.extremum.rangeX * this.scale;
    this.scene.height = this.extremum.rangeY * this.scale;
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwibmJDbG9zZXN0RGV0ZWN0U291cmNlcyIsIm5iQ2xvc2VzdEFjdGl2U291cmNlcyIsImdhaW5FeHBvc2FudCIsIm1vZGUiLCJjaXJjbGVEaWFtZXRlciIsImxpc3RlbmVyU2l6ZSIsImRhdGFGaWxlTmFtZSIsImF1ZGlvRGF0YSIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsIm1vdXNlRG93biIsInRvdWNoZWQiLCJMaXN0ZW5lciIsIlNvdXJjZXMiLCJyYW5nZSIsInNjYWxlIiwib2Zmc2V0IiwiY29udGFpbmVyIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJjb25zb2xlIiwiZXJyb3IiLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic2NlbmUiLCJpbWFnZSIsIlJhbmdlIiwic291cmNlc0RhdGEiLCJyZWNlaXZlcnMiLCJ4eXoiLCJzb3VyY2VzX3h5IiwiZXh0cmVtdW0iLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJVcGRhdGVTY2VuZURpc3BsYXkiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJpbWFnZUV4dHJlbXVtIiwibWluWCIsIm1heFgiLCJtYXhZIiwicmFuZ2VYIiwicmFuZ2VZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImh0bWwiLCJ0eXBlIiwiaWQiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNoYW5nZWRUb3VjaGVzIiwiQ3JlYXRlSW5zdHJ1bWVudHMiLCJDcmVhdGVTb3VyY2VzIiwiRGlzcGxheSIsImluc3RydW1lbnRzIiwicHVzaCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJtYXJnaW4iLCJ3aWR0aCIsImhlaWdodCIsImJvcmRlclJhZGl1cyIsImxpbmVIZWlnaHQiLCJiYWNrZ3JvdW5kIiwiekluZGV4IiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJsb2ciLCJSZXNldCIsIlZQb3MyUGl4ZWwiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJVcGRhdGVMaXN0ZW5lckRpc3BsYXkiLCJVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcclxuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xyXG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcclxuXHJcbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuL0xpc3RlbmVyLmpzJ1xyXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXHJcblxyXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcclxuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyLCBhdWRpb0NvbnRleHQpIHtcclxuXHJcbiAgICBzdXBlcihjbGllbnQpO1xyXG5cclxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcclxuICAgIHRoaXMucmFmSWQgPSBudWxsO1xyXG5cclxuICAgIC8vIFJlcXVpcmUgcGx1Z2luc1xyXG4gICAgLy8gQG5vdGU6IGNvdWxkIGJlIGEgZ29vZCBpZGVhIHRvIGNyZWF0ZSBhIHBsdWdpbiBvYmplY3RcclxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTsgICAgIC8vIFRvIGxvYWQgYXVkaW9CdWZmZXJzXHJcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTsgICAgICAgICAgICAgICAgICAgICAvLyBUbyBnZXQgZmlsZXNcclxuICAgIHRoaXMuc3luYyA9IHRoaXMucmVxdWlyZSgnc3luYycpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIHN5bmMgYXVkaW8gc291cmNlc1xyXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHRoaXMucmVxdWlyZSgncGxhdGZvcm0nKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcclxuICAgIHRoaXMuYXVkaW9TdHJlYW0gPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLXN0cmVhbXMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcclxuXHJcbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXHJcbiAgICB0aGlzLnBhcmFtZXRlcnMgPSB7XHJcbiAgICAgIGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LCAgICAgICAgICAgICAgIC8vIEdsb2JhbCBhdWRpb0NvbnRleHRcclxuICAgICAgLy8gb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xyXG4gICAgICBuYkNsb3Nlc3REZXRlY3RTb3VyY2VzOiAzLCAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgY2xvc2VzdCBwb2ludHMgZGV0ZWN0ZWRcclxuICAgICAgbmJDbG9zZXN0QWN0aXZTb3VyY2VzOiAzLCAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHVzZWQgYXMgYWN0aXZlIGF1ZGlvU291cmNlc1xyXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcclxuICAgICAgLy8gbW9kZTogXCJkZWJ1Z1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJzdHJlYW1pbmdcIiwgXCJhbWJpc29uaWNcIiwgXCJjb252b2x2aW5nXCIsIFwiYW1iaUNvbnZvbHZpbmdcIilcclxuICAgICAgLy8gbW9kZTogXCJzdHJlYW1pbmdcIixcclxuICAgICAgbW9kZTogXCJhbWJpc29uaWNcIixcclxuICAgICAgLy8gbW9kZTogXCJjb252b2x2aW5nXCIsXHJcbiAgICAgIC8vIG1vZGU6IFwiYW1iaUNvbnZvbHZpbmdcIixcclxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlhbWV0ZXIgb2Ygc291cmNlcycgZGlzcGxheVxyXG4gICAgICBsaXN0ZW5lclNpemU6IDE2LCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaXplIG9mIGxpc3RlbmVyJ3MgZGlzcGxheVxyXG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxyXG4gICAgICBhdWRpb0RhdGE6IFwiXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBhdWRpb0RhdGFzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xyXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlOyAgICAgICAgICAgICAgICAgICAvLyBBdHRyaWJ1dGUgdG8ga25vdyBpZiB0aGUgZXZlbnQgbGlzdGVuZXIgaGF2bid0IGJlZW4gaW5pdGlhdGVkXHJcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlOyAgICAgICAgICAgICAgICAgIC8vIEF0dHJpYnV0ZSB0byBrbm93IGlmIHRoZSBiZWdpbkJ1dHRvbiBoYXMgYWxyZWFkeSBiZWVuIHByZXNzZWRcclxuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIG1vdXNlIGlzIHByZXNzZWQgKGNvbXB1dGVyKVxyXG4gICAgdGhpcy50b3VjaGVkID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgICAgICAvLyBBdHRyaWJ1dGUgdG8ga25vdyBpZiB0aGUgc2NyZWVuIGlzIHRvdWNoZWQgKGRldmljZSlcclxuXHJcbiAgICAvLyBJbnN0YW5jaWF0ZSBjbGFzc2VzJyBzdG9yZXJcclxuICAgIHRoaXMuTGlzdGVuZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdMaXN0ZW5lcicgY2xhc3NcclxuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xyXG5cclxuICAgIC8vIEdsb2JhbCB2YWx1ZXNcclxuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcclxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYXRlZCBpbiAnc3RhcnQoKScpXHJcbiAgICB0aGlzLm9mZnNldDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9mZnNldCBvZiB0aGUgZGlzcGxheVxyXG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXHJcblxyXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHN0YXJ0KCkge1xyXG5cclxuICAgIHN1cGVyLnN0YXJ0KCk7XHJcblxyXG4gICAgLy8gQ2hlY2tcclxuICAgIGlmICh0aGlzLnBhcmFtZXRlcnMubmJDbG9zZXN0RGV0ZWN0U291cmNlcyA8IHRoaXMucGFyYW1ldGVycy5uYkNsb3Nlc3RBY3RpdlNvdXJjZXMpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihcIlRoZSBudW1iZXIgb2YgZGV0ZWN0ZWQgc291cmNlcyBtdXN0IGJlIGhpZ2hlciB0aGFuIHRoZSBudW1iZXIgb2YgdXNlZCBzb3VyY2VzXCIpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3dpdGNoIGZpbGVzJyBuYW1lcyBhbmQgYXVkaW9zLCBkZXBlbmRpbmcgb24gdGhlIG1vZGUgY2hvc2VuXHJcbiAgICBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XHJcbiAgICAgIGNhc2UgJ2RlYnVnJzpcclxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJztcclxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMC5qc29uJztcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgJ3N0cmVhbWluZyc6XHJcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzTXVzaWMxJztcclxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMS5qc29uJztcclxuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNQaWFubyc7XHJcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZVBpYW5vLmpzb24nO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcclxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMyJztcclxuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNTcGVlY2gxJztcclxuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNNdXNpYzEnO1xyXG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUyLmpzb24nO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSAnY29udm9sdmluZyc6XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlICdhbWJpQ29udm9sdmluZyc6XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzNCc7XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTQuanNvbic7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIG9iamVjdHMgc3RvcmVyIGZvciBzb3VyY2VzIGFuZCBsb2FkIHRoZWlyIGZpbGVEYXRhc1xyXG4gICAgdGhpcy5Tb3VyY2VzID0gbmV3IFNvdXJjZXModGhpcy5maWxlc3lzdGVtLCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLCB0aGlzLnBhcmFtZXRlcnMsIHRoaXMucGxhdGZvcm0sIHRoaXMuc3luYywgdGhpcy5hdWRpb1N0cmVhbSlcclxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xyXG5cclxuICAgIC8vIFdhaXQgdW50aWwgZGF0YSBoYXZlIGJlZW4gbG9hZGVkIGZyb20ganNvbiBmaWxlcyAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZERhdGEoKScpXHJcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XHJcblxyXG4gICAgICAvLyBHZXQgYmFja2dyb3VuZCBodG1sIGNvZGVcclxuICAgICAgdGhpcy5zY2VuZSA9IHRoaXMuU291cmNlcy5pbWFnZTtcclxuXHJcbiAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBhdHRyaWJ1dGUgJ3RoaXMucmFuZ2UnIHRvIGdldCBkYXRhcycgcGFyYW1ldGVyc1xyXG4gICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6LCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLmV4dHJlbXVtKTtcclxuXHJcbiAgICAgIC8vIEluc3RhbmNpYXRlICd0aGlzLnNjYWxlJ1xyXG4gICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMuZXh0cmVtdW0pOyBcclxuXHJcbiAgICAgIC8vIEdldCBvZmZzZXQgcGFyYW1ldGVycyBvZiB0aGUgZGlzcGxheVxyXG4gICAgICB0aGlzLm9mZnNldCA9IHtcclxuICAgICAgICB4OiB0aGlzLmV4dHJlbXVtLm1veVgsXHJcbiAgICAgICAgeTogdGhpcy5leHRyZW11bS5taW5ZXHJcbiAgICAgIH07XHJcblxyXG4gICAgICB2YXIgbGlzdGVuZXJJbml0UG9zID0ge1xyXG4gICAgICAgIHg6IHRoaXMucG9zaXRpb25SYW5nZS5tb3lYLFxyXG4gICAgICAgIHk6IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZXHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBSZXNpemUgYmFja2dyb3VuZFxyXG4gICAgICB0aGlzLlVwZGF0ZVNjZW5lRGlzcGxheSgpO1xyXG5cclxuICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzIG9iamVjdFxyXG4gICAgICB0aGlzLkxpc3RlbmVyID0gbmV3IExpc3RlbmVyKGxpc3RlbmVySW5pdFBvcywgdGhpcy5wYXJhbWV0ZXJzKTtcclxuICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCh0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7XHJcblxyXG4gICAgICAvLyBTdGFydCB0aGUgc291cmNlcyBkaXNwbGF5IGFuZCBhdWRpbyBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBpbml0aWFsIHBvc2l0aW9uXHJcbiAgICAgIHRoaXMuU291cmNlcy5zdGFydCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xyXG5cclxuICAgICAgLy8gQWRkIGFuIGV2ZW50IGxpc3RlbmVyIGRpc3BhdGNoZWQgZnJvbSBcIkxpc3RlbmVyLmpzXCIgd2hlbiB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIgY2hhbmdlZFxyXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNb3ZpbmcnLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXHJcbiAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKVxyXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgIH0pXHJcbiAgICAgIFxyXG4gICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSB3aW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XHJcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XHJcblxyXG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5leHRyZW11bSk7ICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxyXG5cclxuICAgICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBzdGF0ZVxyXG4gICAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTsgICAgICAgICAgICAgICAgICAgLy8gUmVzaXplIHRoZSBkaXNwbGF5XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEaXNwbGF5XHJcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcclxuICAgICAgfSlcclxuXHJcbiAgICAgIC8vIERpc3BsYXlcclxuICAgICAgdGhpcy5yZW5kZXIoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgUmFuZ2UoYXVkaW9Tb3VyY2VzUG9zaXRpb25zLCBzb3VyY2VzUG9zaXRpb25zLCBpbWFnZUV4dHJlbXVtKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xyXG4gICAgLy8gQG5vdGU6IHRoYXQgY2FuIGJlIHByb2JhYmx5IGJlIGRvbmUgaW4gYSBtb3JlIHByZXR0eSB3YXlcclxuXHJcbiAgICB0aGlzLnJhbmdlID0ge1xyXG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcclxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXHJcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcclxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXHJcbiAgICB9O1xyXG4gICAgdGhpcy5wb3NpdGlvblJhbmdlID0ge1xyXG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcclxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXHJcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcclxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZXh0cmVtdW0gPSB7XHJcbiAgICAgIG1pblg6IGltYWdlRXh0cmVtdW1bMF0ueCxcclxuICAgICAgbWF4WDogaW1hZ2VFeHRyZW11bVsxXS54LFxyXG4gICAgICBtaW5ZOiBpbWFnZUV4dHJlbXVtWzBdLnksIFxyXG4gICAgICBtYXhZOiBpbWFnZUV4dHJlbXVtWzFdLnksXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5leHRyZW11bS5yYW5nZVggPSB0aGlzLmV4dHJlbXVtLm1heFggLSB0aGlzLmV4dHJlbXVtLm1pblg7XHJcbiAgICB0aGlzLmV4dHJlbXVtLm1veVggPSAodGhpcy5leHRyZW11bS5tYXhYICsgdGhpcy5leHRyZW11bS5taW5YKS8yO1xyXG4gICAgdGhpcy5leHRyZW11bS5yYW5nZVkgPSB0aGlzLmV4dHJlbXVtLm1heFkgLSB0aGlzLmV4dHJlbXVtLm1pblk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhdWRpb1NvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcclxuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcclxuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xyXG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcclxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcclxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XHJcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlc1Bvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcclxuXHJcbiAgICAgIH1cclxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcclxuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XHJcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xyXG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XHJcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcclxuICB9XHJcblxyXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcclxuXHJcbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGgpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCkvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcclxuICAgIHJldHVybiAoc2NhbGUpO1xyXG4gIH1cclxuXHJcbiAgcmVuZGVyKCkge1xyXG5cclxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXHJcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XHJcblxyXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG5cclxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcclxuICAgICAgcmVuZGVyKGh0bWxgXHJcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XHJcbiAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxyXG4gICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxyXG4gICAgICAgICAgPGRpdiBpZD1cImluc3RydW1lbnRDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cclxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XHJcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcclxuICAgICAgICAgICAgICB6LWluZGV4OiAwO1xyXG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KHRoaXMucmFuZ2UubWluWCAtIHRoaXMuZXh0cmVtdW0ubWluWCAtIHRoaXMuZXh0cmVtdW0ucmFuZ2VYLzIpKnRoaXMuc2NhbGV9cHgsICR7dGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBpZD1cInNjZW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XHJcbiAgICAgICAgICAgICAgbGVmdDogNTAlO1xyXG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xyXG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XHJcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoLXRoaXMuZXh0cmVtdW0ucmFuZ2VYLzIpKnRoaXMuc2NhbGV9cHgsIDBweCk7XCI+XHJcbiAgICAgICAgICAgICR7dGhpcy5zY2VuZX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxyXG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcclxuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xyXG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucG9zaXRpb25SYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcclxuICAgICAgICAgICAgICB6LWluZGV4OiAwO1xyXG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KCh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAtIHRoaXMuZXh0cmVtdW0ubWluWCAtIHRoaXMuZXh0cmVtdW0ucmFuZ2VYLzIpKnRoaXMuc2NhbGUpfXB4LCAkeyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAtIHRoaXMuZXh0cmVtdW0ubWluWSkqdGhpcy5zY2FsZSArIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcclxuXHJcbiAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcclxuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBzdGF0ZVxyXG5cclxuICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcclxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xyXG5cclxuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG5cclxuICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxyXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcclxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xyXG5cclxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9iYWwgY29udGFpbmVyc1xyXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxyXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZCgpXHJcblxyXG4gICAgICAgICAgLy8gQWRkIG1vdXNlRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxyXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xyXG4gICAgICAgICAgfSwgZmFsc2UpO1xyXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgZmFsc2UpO1xyXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XHJcbiAgICAgICAgICB9LCBmYWxzZSk7XHJcblxyXG4gICAgICAgICAgLy8gQWRkIHRvdWNoRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxyXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcclxuICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIGZhbHNlKTtcclxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gc3RhdGUgXHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKCkgeyAvLyBCZWdpbiBhdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgc291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuZCBkaXNwbGF5IG9iamVjdHNcclxuICAgIHRoaXMuQ3JlYXRlSW5zdHJ1bWVudHMoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGluc3RydW1lbnRzIGFuZCBkaXNwbGF5IHRoZW1cclxuICAgIHRoaXMuU291cmNlcy5DcmVhdGVTb3VyY2VzKHRoaXMuY29udGFpbmVyLCB0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZXMgYW5kIGRpc3BsYXkgdGhlbVxyXG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIncyBkaXNwbGF5IHRvIHRoZSBjb250YWluZXJcclxuICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcclxuICB9XHJcblxyXG4gIENyZWF0ZUluc3RydW1lbnRzKCkgeyAvLyBDcmVhdGUgdGhlIGluc3RydW1lbnRzIGFuZCBhZGQgdGhlbSB0byB0aGUgc2NlbmUgZGlzcGxheVxyXG5cclxuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5zdHJ1bWVudENvbnRhaW5lcicpXHJcbiAgICB2YXIgY2lyY2xlRGlhbWV0ZXIgPSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXI7XHJcbiAgICB0aGlzLmluc3RydW1lbnRzID0gW11cclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5Lmxlbmd0aDsgaSsrKSB7XHJcblxyXG4gICAgICB0aGlzLmluc3RydW1lbnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpOyAgICAgICAvLyBDcmVhdGUgYSBuZXcgZWxlbWVudFxyXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLmlkID0gXCJpbnN0cnVtZW50XCIgKyBpOyAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIGlkXHJcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaW5uZXJIVE1MID0gXCJTXCI7ICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgdmFsdWUgKGkrMSlcclxuXHJcbiAgICAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XHJcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUubWFyZ2luID0gXCIwIFwiICsgKC1jaXJjbGVEaWFtZXRlci8yKSArIFwicHhcIjtcclxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS53aWR0aCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xyXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmhlaWdodCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xyXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJvcmRlclJhZGl1cyA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xyXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmxpbmVIZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcclxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZWRcIjtcclxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS56SW5kZXggPSAxO1xyXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXHJcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSkgKyBcInB4LCBcIiArIFxyXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcclxuXHJcbiAgICAgIC8vIEFkZCB0aGUgY2lyY2xlJ3MgZGlzcGxheSB0byB0aGUgZ2xvYmFsIGNvbnRhaW5lclxyXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnN0cnVtZW50c1tpXSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBsaXN0ZW5lcidzIHBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlL3RvdWNoIGhhcyBiZWVuIHVzZWRcclxuXHJcbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgbGlzdGVuZXIncyBwb3NpdGlvblxyXG4gICAgdmFyIHRlbXBYID0gdGhpcy5leHRyZW11bS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XHJcbiAgICB2YXIgdGVtcFkgPSB0aGlzLmV4dHJlbXVtLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yKS8odGhpcy5zY2FsZSk7XHJcblxyXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcclxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nXCIpO1xyXG5cclxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXkgICAgICAgICAgICAgIFxyXG4gICAgICB0aGlzLkxpc3RlbmVyLlJlc2V0KG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBsaXN0ZW5lciBhdCB0aGUgbmV3IHBvc2l0aW9uXHJcbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxyXG4gICAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERpc3BsYXlcclxuICAgIH1cclxuXHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBhY3Rpb25cclxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcclxuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxyXG5cclxuICAgIC8vIENoYW5nZSBzaXplIG9mIHRoZSBzZWxlY3RvciBkaXNwbGF5XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5vZmZzZXQueSp0aGlzLnNjYWxlKSArIFwicHhcIjtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XHJcblxyXG4gICAgLy8gQ2hhbmdlIG90aGVyIGdsb2JhbCBkaXNwbGF5c1xyXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgLy8gVXBkYXRlIHNvdXJjZXMnIGRpc3BsYXlcclxuICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcclxuICAgIHRoaXMuVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5KCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBpbnN0cnVtZW50J3MgZGlzcGxheVxyXG4gICAgdGhpcy5VcGRhdGVTY2VuZURpc3BsYXkoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHNjZW5lJ3MgZGlzcGxheVxyXG4gIH1cclxuXHJcbiAgVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5KCkgeyAvLyBVcGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBpbnN0cnVtZW50c1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xyXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXHJcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSkgKyBcInB4LCBcIiArIFxyXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcclxuICAgIH1cclxuICB9XHJcbiAgVXBkYXRlU2NlbmVEaXNwbGF5KCkgeyAvLyBVcGRhdGUgdGhlIHNjYWxlIG9mIHRoZSBzY2VuZVxyXG4gICAgICB0aGlzLnNjZW5lLndpZHRoID0gdGhpcy5leHRyZW11bS5yYW5nZVgqdGhpcy5zY2FsZVxyXG4gICAgICB0aGlzLnNjZW5lLmhlaWdodCA9IHRoaXMuZXh0cmVtdW0ucmFuZ2VZKnRoaXMuc2NhbGVcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQ0MsWUFBbEMsRUFBZ0Q7SUFFekQsTUFBTUgsTUFBTjtJQUVBLEtBQUtDLE1BQUwsR0FBY0EsTUFBZDtJQUNBLEtBQUtDLFVBQUwsR0FBa0JBLFVBQWxCO0lBQ0EsS0FBS0UsS0FBTCxHQUFhLElBQWIsQ0FOeUQsQ0FRekQ7SUFDQTs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FWeUQsQ0FVUzs7SUFDbEUsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVh5RCxDQVdTOztJQUNsRSxLQUFLRSxJQUFMLEdBQVksS0FBS0YsT0FBTCxDQUFhLE1BQWIsQ0FBWixDQVp5RCxDQVlTOztJQUNsRSxLQUFLRyxRQUFMLEdBQWdCLEtBQUtILE9BQUwsQ0FBYSxVQUFiLENBQWhCLENBYnlELENBYVM7O0lBQ2xFLEtBQUtJLFdBQUwsR0FBbUIsS0FBS0osT0FBTCxDQUFhLGVBQWIsQ0FBbkIsQ0FkeUQsQ0FjaUI7SUFFMUU7O0lBQ0EsS0FBS0ssVUFBTCxHQUFrQjtNQUNoQlIsWUFBWSxFQUFFQSxZQURFO01BQzBCO01BQzFDO01BQ0FTLHNCQUFzQixFQUFFLENBSFI7TUFHMEI7TUFDMUNDLHFCQUFxQixFQUFFLENBSlA7TUFJMEI7TUFDMUNDLFlBQVksRUFBRSxDQUxFO01B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