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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwibmJDbG9zZXN0RGV0ZWN0U291cmNlcyIsIm5iQ2xvc2VzdEFjdGl2U291cmNlcyIsImdhaW5FeHBvc2FudCIsIm1vZGUiLCJjaXJjbGVEaWFtZXRlciIsImxpc3RlbmVyU2l6ZSIsImRhdGFGaWxlTmFtZSIsImF1ZGlvRGF0YSIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsIm1vdXNlRG93biIsInRvdWNoZWQiLCJMaXN0ZW5lciIsIlNvdXJjZXMiLCJyYW5nZSIsInNjYWxlIiwib2Zmc2V0IiwiY29udGFpbmVyIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJjb25zb2xlIiwiZXJyb3IiLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic2NlbmUiLCJpbWFnZSIsIlJhbmdlIiwic291cmNlc0RhdGEiLCJyZWNlaXZlcnMiLCJ4eXoiLCJzb3VyY2VzX3h5IiwiZXh0cmVtdW0iLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJVcGRhdGVTY2VuZURpc3BsYXkiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJpbWFnZUV4dHJlbXVtIiwibWluWCIsIm1heFgiLCJtYXhZIiwicmFuZ2VYIiwicmFuZ2VZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImh0bWwiLCJ0eXBlIiwiaWQiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNoYW5nZWRUb3VjaGVzIiwiQ3JlYXRlSW5zdHJ1bWVudHMiLCJDcmVhdGVTb3VyY2VzIiwiRGlzcGxheSIsImluc3RydW1lbnRzIiwicHVzaCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJtYXJnaW4iLCJ3aWR0aCIsImhlaWdodCIsImJvcmRlclJhZGl1cyIsImxpbmVIZWlnaHQiLCJiYWNrZ3JvdW5kIiwiekluZGV4IiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJsb2ciLCJSZXNldCIsIlZQb3MyUGl4ZWwiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJVcGRhdGVMaXN0ZW5lckRpc3BsYXkiLCJVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcbmltcG9ydCBTb3VyY2VzIGZyb20gJy4vU291cmNlcy5qcydcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnNcbiAgICAvLyBAbm90ZTogY291bGQgYmUgYSBnb29kIGlkZWEgdG8gY3JlYXRlIGEgcGx1Z2luIG9iamVjdFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTsgICAgIC8vIFRvIGxvYWQgYXVkaW9CdWZmZXJzXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7ICAgICAgICAgICAgICAgICAgICAgLy8gVG8gZ2V0IGZpbGVzXG4gICAgdGhpcy5zeW5jID0gdGhpcy5yZXF1aXJlKCdzeW5jJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3luYyBhdWRpbyBzb3VyY2VzXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHRoaXMucmVxdWlyZSgncGxhdGZvcm0nKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcbiAgICB0aGlzLmF1ZGlvU3RyZWFtID0gdGhpcy5yZXF1aXJlKCdhdWRpby1zdHJlYW1zJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgLy8gb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0RGV0ZWN0U291cmNlczogMywgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIGRldGVjdGVkXG4gICAgICBuYkNsb3Nlc3RBY3RpdlNvdXJjZXM6IDMsICAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgY2xvc2VzdCBwb2ludHMgdXNlZCBhcyBhY3RpdmUgYXVkaW9Tb3VyY2VzXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiLCBcImFtYmlDb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcInN0cmVhbWluZ1wiLFxuICAgICAgbW9kZTogXCJhbWJpc29uaWNcIixcbiAgICAgIC8vIG1vZGU6IFwiY29udm9sdmluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpQ29udm9sdmluZ1wiLFxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlhbWV0ZXIgb2Ygc291cmNlcycgZGlzcGxheVxuICAgICAgbGlzdGVuZXJTaXplOiAxNiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2l6ZSBvZiBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIHNvdXJjZXMnIHBvc2l0aW9uIGFuZCBhdWRpb0RhdGFzJyBmaWxlbmFtZXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgICBhdWRpb0RhdGE6IFwiXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBhdWRpb0RhdGFzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIGV2ZW50IGxpc3RlbmVyIGhhdm4ndCBiZWVuIGluaXRpYXRlZFxuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIGJlZ2luQnV0dG9uIGhhcyBhbHJlYWR5IGJlZW4gcHJlc3NlZFxuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIG1vdXNlIGlzIHByZXNzZWQgKGNvbXB1dGVyKVxuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlOyAgICAgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIHNjcmVlbiBpcyB0b3VjaGVkIChkZXZpY2UpXG5cbiAgICAvLyBJbnN0YW5jaWF0ZSBjbGFzc2VzJyBzdG9yZXJcbiAgICB0aGlzLkxpc3RlbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnTGlzdGVuZXInIGNsYXNzXG4gICAgdGhpcy5Tb3VyY2VzOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ1NvdXJjZXMnIGNsYXNzXG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5vZmZzZXQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPZmZzZXQgb2YgdGhlIGRpc3BsYXlcbiAgICB0aGlzLmNvbnRhaW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgY29udGFpbmVyIG9mIGRpc3BsYXkgZWxlbWVudHMgKGNyZWF0ZXMgaW4gJ3JlbmRlcigpJylcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcblxuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBDaGVja1xuICAgIGlmICh0aGlzLnBhcmFtZXRlcnMubmJDbG9zZXN0RGV0ZWN0U291cmNlcyA8IHRoaXMucGFyYW1ldGVycy5uYkNsb3Nlc3RBY3RpdlNvdXJjZXMpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJUaGUgbnVtYmVyIG9mIGRldGVjdGVkIHNvdXJjZXMgbXVzdCBiZSBoaWdoZXIgdGhhbiB0aGUgbnVtYmVyIG9mIHVzZWQgc291cmNlc1wiKVxuICAgIH1cblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc011c2ljMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNQaWFubyc7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmVQaWFuby5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczInO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNTcGVlY2gxJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzTXVzaWMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTIuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUzLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXM0JztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTQuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIHN0b3JlciBmb3Igc291cmNlcyBhbmQgbG9hZCB0aGVpciBmaWxlRGF0YXNcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycywgdGhpcy5wbGF0Zm9ybSwgdGhpcy5zeW5jLCB0aGlzLmF1ZGlvU3RyZWFtKVxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgIC8vIEdldCBiYWNrZ3JvdW5kIGh0bWwgY29kZVxuICAgICAgdGhpcy5zY2VuZSA9IHRoaXMuU291cmNlcy5pbWFnZTtcblxuICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6LCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLmV4dHJlbXVtKTtcblxuICAgICAgLy8gSW5zdGFuY2lhdGUgJ3RoaXMuc2NhbGUnXG4gICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMuZXh0cmVtdW0pOyBcblxuICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgeDogdGhpcy5leHRyZW11bS5tb3lYLFxuICAgICAgICB5OiB0aGlzLmV4dHJlbXVtLm1pbllcbiAgICAgIH07XG5cbiAgICAgIHZhciBsaXN0ZW5lckluaXRQb3MgPSB7XG4gICAgICAgIHg6IHRoaXMucG9zaXRpb25SYW5nZS5tb3lYLFxuICAgICAgICB5OiB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWVxuICAgICAgfTtcblxuICAgICAgLy8gUmVzaXplIGJhY2tncm91bmRcbiAgICAgIHRoaXMuVXBkYXRlU2NlbmVEaXNwbGF5KCk7XG5cbiAgICAgIC8vIENyZWF0ZSwgc3RhcnQgYW5kIHN0b3JlIHRoZSBsaXN0ZW5lciBjbGFzcyBvYmplY3RcbiAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIobGlzdGVuZXJJbml0UG9zLCB0aGlzLnBhcmFtZXRlcnMpO1xuICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCh0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7XG5cbiAgICAgIC8vIFN0YXJ0IHRoZSBzb3VyY2VzIGRpc3BsYXkgYW5kIGF1ZGlvIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIGluaXRpYWwgcG9zaXRpb25cbiAgICAgIHRoaXMuU291cmNlcy5zdGFydCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuXG4gICAgICAvLyBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgZGlzcGF0Y2hlZCBmcm9tIFwiTGlzdGVuZXIuanNcIiB3aGVuIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlciBjaGFuZ2VkXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNb3ZpbmcnLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KVxuICAgICAgXG4gICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSB3aW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuXG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5leHRyZW11bSk7ICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIHN0YXRlXG4gICAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTsgICAgICAgICAgICAgICAgICAgLy8gUmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KVxuXG4gICAgICAvLyBEaXNwbGF5XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuICB9XG5cbiAgUmFuZ2UoYXVkaW9Tb3VyY2VzUG9zaXRpb25zLCBzb3VyY2VzUG9zaXRpb25zLCBpbWFnZUV4dHJlbXVtKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIC8vIEBub3RlOiB0aGF0IGNhbiBiZSBwcm9iYWJseSBiZSBkb25lIGluIGEgbW9yZSBwcmV0dHkgd2F5XG5cbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlID0ge1xuICAgICAgbWluWDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LFxuICAgIH07XG5cbiAgICB0aGlzLmV4dHJlbXVtID0ge1xuICAgICAgbWluWDogaW1hZ2VFeHRyZW11bVswXS54LFxuICAgICAgbWF4WDogaW1hZ2VFeHRyZW11bVsxXS54LFxuICAgICAgbWluWTogaW1hZ2VFeHRyZW11bVswXS55LCBcbiAgICAgIG1heFk6IGltYWdlRXh0cmVtdW1bMV0ueSxcbiAgICB9XG5cbiAgICB0aGlzLmV4dHJlbXVtLnJhbmdlWCA9IHRoaXMuZXh0cmVtdW0ubWF4WCAtIHRoaXMuZXh0cmVtdW0ubWluWDtcbiAgICB0aGlzLmV4dHJlbXVtLm1veVggPSAodGhpcy5leHRyZW11bS5tYXhYICsgdGhpcy5leHRyZW11bS5taW5YKS8yO1xuICAgIHRoaXMuZXh0cmVtdW0ucmFuZ2VZID0gdGhpcy5leHRyZW11bS5tYXhZIC0gdGhpcy5leHRyZW11bS5taW5ZO1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhdWRpb1NvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlc1Bvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuXG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcblxuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBzb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0aGF0IGRpc3BsYXlzIGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG5cbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGgpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCkvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcblxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXYgaWQ9XCJpbnN0cnVtZW50Q29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KHRoaXMucmFuZ2UubWluWCAtIHRoaXMuZXh0cmVtdW0ubWluWCAtIHRoaXMuZXh0cmVtdW0ucmFuZ2VYLzIpKnRoaXMuc2NhbGV9cHgsICR7dGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cInNjZW5lXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGxlZnQ6IDUwJTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLmV4dHJlbXVtLnJhbmdlWC8yKSp0aGlzLnNjYWxlfXB4LCAwcHgpO1wiPlxuICAgICAgICAgICAgJHt0aGlzLnNjZW5lfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KCh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAtIHRoaXMuZXh0cmVtdW0ubWluWCAtIHRoaXMuZXh0cmVtdW0ucmFuZ2VYLzIpKnRoaXMuc2NhbGUpfXB4LCAkeyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAtIHRoaXMuZXh0cmVtdW0ubWluWSkqdGhpcy5zY2FsZSArIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIHN0YXRlXG5cbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG5cbiAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcblxuICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgLy8gQXNzaWduIGdsb2JhbCBjb250YWluZXJzXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZCgpXG5cbiAgICAgICAgICAvLyBBZGQgbW91c2VFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIC8vIEFkZCB0b3VjaEV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gc3RhdGUgXG5cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gYXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIHNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQ3JlYXRlIGFuZCBkaXNwbGF5IG9iamVjdHNcbiAgICB0aGlzLkNyZWF0ZUluc3RydW1lbnRzKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHRoZSBpbnN0cnVtZW50cyBhbmQgZGlzcGxheSB0aGVtXG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlcyBhbmQgZGlzcGxheSB0aGVtXG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIncyBkaXNwbGF5IHRvIHRoZSBjb250YWluZXJcbiAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gIH1cblxuICBDcmVhdGVJbnN0cnVtZW50cygpIHsgLy8gQ3JlYXRlIHRoZSBpbnN0cnVtZW50cyBhbmQgYWRkIHRoZW0gdG8gdGhlIHNjZW5lIGRpc3BsYXlcblxuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5zdHJ1bWVudENvbnRhaW5lcicpXG4gICAgdmFyIGNpcmNsZURpYW1ldGVyID0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyO1xuICAgIHRoaXMuaW5zdHJ1bWVudHMgPSBbXVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuXG4gICAgICB0aGlzLmluc3RydW1lbnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpOyAgICAgICAvLyBDcmVhdGUgYSBuZXcgZWxlbWVudFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pZCA9IFwiaW5zdHJ1bWVudFwiICsgaTsgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pbm5lckhUTUwgPSBcIlNcIjsgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSB2YWx1ZSAoaSsxKVxuXG4gICAgICAvLyBDaGFuZ2UgZm9ybSBhbmQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgdG8gZ2V0IGEgY2lyY2xlIGF0IHRoZSBnb29kIHBsYWNlO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUubWFyZ2luID0gXCIwIFwiICsgKC1jaXJjbGVEaWFtZXRlci8yKSArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUud2lkdGggPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuaGVpZ2h0ID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJvcmRlclJhZGl1cyA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5saW5lSGVpZ2h0ID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJhY2tncm91bmQgPSBcInJlZFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS56SW5kZXggPSAxO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcblxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUncyBkaXNwbGF5IHRvIHRoZSBnbG9iYWwgY29udGFpbmVyXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnN0cnVtZW50c1tpXSk7XG4gICAgfVxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgbGlzdGVuZXIncyBwb3NpdGlvbiB3aGVuIHRoZSBtb3VzZS90b3VjaCBoYXMgYmVlbiB1c2VkXG5cbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMuZXh0cmVtdW0ubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMuZXh0cmVtdW0ubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucG9zaXRpb25SYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucG9zaXRpb25SYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucG9zaXRpb25SYW5nZS5tYXhZKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nXCIpO1xuXG4gICAgICAvLyBVcGRhdGUgb2JqZWN0cyBhbmQgdGhlaXIgZGlzcGxheSAgICAgICAgICAgICAgXG4gICAgICB0aGlzLkxpc3RlbmVyLlJlc2V0KG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IHRoZSBsaXN0ZW5lciBhdCB0aGUgbmV3IHBvc2l0aW9uXG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlzcGxheVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBhY3Rpb25cbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuXG4gICAgLy8gQ2hhbmdlIHNpemUgb2YgdGhlIHNlbGVjdG9yIGRpc3BsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5vZmZzZXQueSp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLm9mZnNldC54KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweClcIjtcblxuICAgIC8vIENoYW5nZSBvdGhlciBnbG9iYWwgZGlzcGxheXNcbiAgICB0aGlzLlNvdXJjZXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAvLyBVcGRhdGUgc291cmNlcycgZGlzcGxheVxuICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICB0aGlzLlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgaW5zdHJ1bWVudCdzIGRpc3BsYXlcbiAgICB0aGlzLlVwZGF0ZVNjZW5lRGlzcGxheSgpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgc2NlbmUncyBkaXNwbGF5XG4gIH1cblxuICBVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKSB7IC8vIFVwZGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIGluc3RydW1lbnRzXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcbiAgICB9XG4gIH1cbiAgVXBkYXRlU2NlbmVEaXNwbGF5KCkgeyAvLyBVcGRhdGUgdGhlIHNjYWxlIG9mIHRoZSBzY2VuZVxuICAgICAgdGhpcy5zY2VuZS53aWR0aCA9IHRoaXMuZXh0cmVtdW0ucmFuZ2VYKnRoaXMuc2NhbGVcbiAgICAgIHRoaXMuc2NlbmUuaGVpZ2h0ID0gdGhpcy5leHRyZW11bS5yYW5nZVkqdGhpcy5zY2FsZVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQ0MsWUFBbEMsRUFBZ0Q7SUFFekQsTUFBTUgsTUFBTjtJQUVBLEtBQUtDLE1BQUwsR0FBY0EsTUFBZDtJQUNBLEtBQUtDLFVBQUwsR0FBa0JBLFVBQWxCO0lBQ0EsS0FBS0UsS0FBTCxHQUFhLElBQWIsQ0FOeUQsQ0FRekQ7SUFDQTs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FWeUQsQ0FVUzs7SUFDbEUsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVh5RCxDQVdTOztJQUNsRSxLQUFLRSxJQUFMLEdBQVksS0FBS0YsT0FBTCxDQUFhLE1BQWIsQ0FBWixDQVp5RCxDQVlTOztJQUNsRSxLQUFLRyxRQUFMLEdBQWdCLEtBQUtILE9BQUwsQ0FBYSxVQUFiLENBQWhCLENBYnlELENBYVM7O0lBQ2xFLEtBQUtJLFdBQUwsR0FBbUIsS0FBS0osT0FBTCxDQUFhLGVBQWIsQ0FBbkIsQ0FkeUQsQ0FjaUI7SUFFMUU7O0lBQ0EsS0FBS0ssVUFBTCxHQUFrQjtNQUNoQlIsWUFBWSxFQUFFQSxZQURFO01BQzBCO01BQzFDO01BQ0FTLHNCQUFzQixFQUFFLENBSFI7TUFHMEI7TUFDMUNDLHFCQUFxQixFQUFFLENBSlA7TUFJMEI7TUFDMUNDLFlBQVksRUFBRSxDQUxFO01BSzBCO01BQzFDO01BQ0E7TUFDQUMsSUFBSSxFQUFFLFdBUlU7TUFTaEI7TUFDQTtNQUNBQyxjQUFjLEVBQUUsRUFYQTtNQVcwQjtNQUMxQ0MsWUFBWSxFQUFFLEVBWkU7TUFZMEI7TUFDMUNDLFlBQVksRUFBRSxFQWJFO01BYTBCO01BQzFDQyxTQUFTLEVBQUUsRUFkSyxDQWMwQjs7SUFkMUIsQ0FBbEIsQ0FqQnlELENBa0N6RDs7SUFDQSxLQUFLQyxZQUFMLEdBQW9CLElBQXBCLENBbkN5RCxDQW1DYjs7SUFDNUMsS0FBS0MsWUFBTCxHQUFvQixLQUFwQixDQXBDeUQsQ0FvQ2I7O0lBQzVDLEtBQUtDLFNBQUwsR0FBaUIsS0FBakIsQ0FyQ3lELENBcUNiOztJQUM1QyxLQUFLQyxPQUFMLEdBQWUsS0FBZixDQXRDeUQsQ0FzQ2I7SUFFNUM7O0lBQ0EsS0FBS0MsUUFBTCxDQXpDeUQsQ0F5Q2I7O0lBQzVDLEtBQUtDLE9BQUwsQ0ExQ3lELENBMENiO0lBRTVDOztJQUNBLEtBQUtDLEtBQUwsQ0E3Q3lELENBNkNiOztJQUM1QyxLQUFLQyxLQUFMLENBOUN5RCxDQThDYjs7SUFDNUMsS0FBS0MsTUFBTCxDQS9DeUQsQ0ErQ2I7O0lBQzVDLEtBQUtDLFNBQUwsQ0FoRHlELENBZ0RiOztJQUU1QyxJQUFBQyxvQ0FBQSxFQUE0QjlCLE1BQTVCLEVBQW9DQyxNQUFwQyxFQUE0Q0MsVUFBNUM7RUFDRDs7RUFFVSxNQUFMNkIsS0FBSyxHQUFHO0lBRVosTUFBTUEsS0FBTixHQUZZLENBSVo7O0lBQ0EsSUFBSSxLQUFLcEIsVUFBTCxDQUFnQkMsc0JBQWhCLEdBQXlDLEtBQUtELFVBQUwsQ0FBZ0JFLHFCQUE3RCxFQUFvRjtNQUNsRm1CLE9BQU8sQ0FBQ0MsS0FBUixDQUFjLCtFQUFkO0lBQ0QsQ0FQVyxDQVNaOzs7SUFDQSxRQUFRLEtBQUt0QixVQUFMLENBQWdCSSxJQUF4QjtNQUNFLEtBQUssT0FBTDtRQUNFLEtBQUtKLFVBQUwsQ0FBZ0JRLFNBQWhCLEdBQTRCLGFBQTVCO1FBQ0EsS0FBS1IsVUFBTCxDQUFnQk8sWUFBaEIsR0FBK0IsYUFBL0I7UUFDQTs7TUFFRixLQUFLLFdBQUw7UUFDRTtRQUNBLEtBQUtQLFVBQUwsQ0FBZ0JRLFNBQWhCLEdBQTRCLGtCQUE1QjtRQUNBLEtBQUtSLFVBQUwsQ0FBZ0JPLFlBQWhCLEdBQStCLGFBQS9CLENBSEYsQ0FJRTtRQUNBOztRQUNBOztNQUVGLEtBQUssV0FBTDtRQUNFLEtBQUtQLFVBQUwsQ0FBZ0JRLFNBQWhCLEdBQTRCLGFBQTVCLENBREYsQ0FFRTtRQUNBOztRQUNBLEtBQUtSLFVBQUwsQ0FBZ0JPLFlBQWhCLEdBQStCLGFBQS9CO1FBQ0E7O01BRUYsS0FBSyxZQUFMO1FBQ0UsS0FBS1AsVUFBTCxDQUFnQlEsU0FBaEIsR0FBNEIsYUFBNUI7UUFDQSxLQUFLUixVQUFMLENBQWdCTyxZQUFoQixHQUErQixhQUEvQjtRQUNBOztNQUVGLEtBQUssZ0JBQUw7UUFDRSxLQUFLUCxVQUFMLENBQWdCUSxTQUFoQixHQUE0QixhQUE1QjtRQUNBLEtBQUtSLFVBQUwsQ0FBZ0JPLFlBQWhCLEdBQStCLGFBQS9CO1FBQ0E7O01BRUY7UUFDRWdCLEtBQUssQ0FBQyxlQUFELENBQUw7SUFoQ0osQ0FWWSxDQTZDWjs7O0lBQ0EsS0FBS1QsT0FBTCxHQUFlLElBQUlBLGdCQUFKLENBQVksS0FBS2xCLFVBQWpCLEVBQTZCLEtBQUtGLGlCQUFsQyxFQUFxRCxLQUFLTSxVQUExRCxFQUFzRSxLQUFLRixRQUEzRSxFQUFxRixLQUFLRCxJQUExRixFQUFnRyxLQUFLRSxXQUFyRyxDQUFmO0lBQ0EsS0FBS2UsT0FBTCxDQUFhVSxRQUFiLEdBL0NZLENBaURaOztJQUNBQyxRQUFRLENBQUNDLGdCQUFULENBQTBCLFlBQTFCLEVBQXdDLE1BQU07TUFFNUM7TUFDQSxLQUFLQyxLQUFMLEdBQWEsS0FBS2IsT0FBTCxDQUFhYyxLQUExQixDQUg0QyxDQUs1Qzs7TUFDQSxLQUFLQyxLQUFMLENBQVcsS0FBS2YsT0FBTCxDQUFhZ0IsV0FBYixDQUF5QkMsU0FBekIsQ0FBbUNDLEdBQTlDLEVBQW1ELEtBQUtsQixPQUFMLENBQWFnQixXQUFiLENBQXlCRyxVQUE1RSxFQUF3RixLQUFLbkIsT0FBTCxDQUFhZ0IsV0FBYixDQUF5QkksUUFBakgsRUFONEMsQ0FRNUM7O01BQ0EsS0FBS2xCLEtBQUwsR0FBYSxLQUFLbUIsT0FBTCxDQUFhLEtBQUtELFFBQWxCLENBQWIsQ0FUNEMsQ0FXNUM7O01BQ0EsS0FBS2pCLE1BQUwsR0FBYztRQUNabUIsQ0FBQyxFQUFFLEtBQUtGLFFBQUwsQ0FBY0csSUFETDtRQUVaQyxDQUFDLEVBQUUsS0FBS0osUUFBTCxDQUFjSztNQUZMLENBQWQ7TUFLQSxJQUFJQyxlQUFlLEdBQUc7UUFDcEJKLENBQUMsRUFBRSxLQUFLSyxhQUFMLENBQW1CSixJQURGO1FBRXBCQyxDQUFDLEVBQUUsS0FBS0csYUFBTCxDQUFtQkY7TUFGRixDQUF0QixDQWpCNEMsQ0FzQjVDOztNQUNBLEtBQUtHLGtCQUFMLEdBdkI0QyxDQXlCNUM7O01BQ0EsS0FBSzdCLFFBQUwsR0FBZ0IsSUFBSUEsaUJBQUosQ0FBYTJCLGVBQWIsRUFBOEIsS0FBS3hDLFVBQW5DLENBQWhCO01BQ0EsS0FBS2EsUUFBTCxDQUFjTyxLQUFkLENBQW9CLEtBQUtKLEtBQXpCLEVBQWdDLEtBQUtDLE1BQXJDLEVBM0I0QyxDQTZCNUM7O01BQ0EsS0FBS0gsT0FBTCxDQUFhTSxLQUFiLENBQW1CLEtBQUtQLFFBQUwsQ0FBYzhCLGdCQUFqQyxFQTlCNEMsQ0FnQzVDOztNQUNBbEIsUUFBUSxDQUFDQyxnQkFBVCxDQUEwQixRQUExQixFQUFvQyxNQUFNO1FBQ3hDLEtBQUtaLE9BQUwsQ0FBYThCLHlCQUFiLENBQXVDLEtBQUsvQixRQUFMLENBQWM4QixnQkFBckQsRUFEd0MsQ0FDd0M7O1FBQ2hGLEtBQUtFLGVBQUw7UUFDQSxLQUFLQyxNQUFMO01BQ0QsQ0FKRCxFQWpDNEMsQ0F1QzVDOztNQUNBQyxNQUFNLENBQUNyQixnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxNQUFNO1FBRXRDLEtBQUtWLEtBQUwsR0FBYSxLQUFLbUIsT0FBTCxDQUFhLEtBQUtELFFBQWxCLENBQWIsQ0FGc0MsQ0FFTTs7UUFFNUMsSUFBSSxLQUFLeEIsWUFBVCxFQUF1QjtVQUFxQjtVQUMxQyxLQUFLbUMsZUFBTCxHQURxQixDQUNxQjtRQUMzQyxDQU5xQyxDQVF0Qzs7O1FBQ0EsS0FBS0MsTUFBTDtNQUNELENBVkQsRUF4QzRDLENBb0Q1Qzs7TUFDQSxLQUFLQSxNQUFMO0lBQ0QsQ0F0REQ7RUF1REQ7O0VBRURqQixLQUFLLENBQUNtQixxQkFBRCxFQUF3QkMsZ0JBQXhCLEVBQTBDQyxhQUExQyxFQUF5RDtJQUFFO0lBQzlEO0lBRUEsS0FBS25DLEtBQUwsR0FBYTtNQUNYb0MsSUFBSSxFQUFFSCxxQkFBcUIsQ0FBQyxDQUFELENBQXJCLENBQXlCWixDQURwQjtNQUVYZ0IsSUFBSSxFQUFFSixxQkFBcUIsQ0FBQyxDQUFELENBQXJCLENBQXlCWixDQUZwQjtNQUdYRyxJQUFJLEVBQUVTLHFCQUFxQixDQUFDLENBQUQsQ0FBckIsQ0FBeUJWLENBSHBCO01BSVhlLElBQUksRUFBRUwscUJBQXFCLENBQUMsQ0FBRCxDQUFyQixDQUF5QlY7SUFKcEIsQ0FBYjtJQU1BLEtBQUtHLGFBQUwsR0FBcUI7TUFDbkJVLElBQUksRUFBRUgscUJBQXFCLENBQUMsQ0FBRCxDQUFyQixDQUF5QlosQ0FEWjtNQUVuQmdCLElBQUksRUFBRUoscUJBQXFCLENBQUMsQ0FBRCxDQUFyQixDQUF5QlosQ0FGWjtNQUduQkcsSUFBSSxFQUFFUyxxQkFBcUIsQ0FBQyxDQUFELENBQXJCLENBQXlCVixDQUhaO01BSW5CZSxJQUFJLEVBQUVMLHFCQUFxQixDQUFDLENBQUQsQ0FBckIsQ0FBeUJWO0lBSlosQ0FBckI7SUFPQSxLQUFLSixRQUFMLEdBQWdCO01BQ2RpQixJQUFJLEVBQUVELGFBQWEsQ0FBQyxDQUFELENBQWIsQ0FBaUJkLENBRFQ7TUFFZGdCLElBQUksRUFBRUYsYUFBYSxDQUFDLENBQUQsQ0FBYixDQUFpQmQsQ0FGVDtNQUdkRyxJQUFJLEVBQUVXLGFBQWEsQ0FBQyxDQUFELENBQWIsQ0FBaUJaLENBSFQ7TUFJZGUsSUFBSSxFQUFFSCxhQUFhLENBQUMsQ0FBRCxDQUFiLENBQWlCWjtJQUpULENBQWhCO0lBT0EsS0FBS0osUUFBTCxDQUFjb0IsTUFBZCxHQUF1QixLQUFLcEIsUUFBTCxDQUFja0IsSUFBZCxHQUFxQixLQUFLbEIsUUFBTCxDQUFjaUIsSUFBMUQ7SUFDQSxLQUFLakIsUUFBTCxDQUFjRyxJQUFkLEdBQXFCLENBQUMsS0FBS0gsUUFBTCxDQUFja0IsSUFBZCxHQUFxQixLQUFLbEIsUUFBTCxDQUFjaUIsSUFBcEMsSUFBMEMsQ0FBL0Q7SUFDQSxLQUFLakIsUUFBTCxDQUFjcUIsTUFBZCxHQUF1QixLQUFLckIsUUFBTCxDQUFjbUIsSUFBZCxHQUFxQixLQUFLbkIsUUFBTCxDQUFjSyxJQUExRDs7SUFFQSxLQUFLLElBQUlpQixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHUixxQkFBcUIsQ0FBQ1MsTUFBMUMsRUFBa0RELENBQUMsRUFBbkQsRUFBdUQ7TUFDckQsSUFBSVIscUJBQXFCLENBQUNRLENBQUQsQ0FBckIsQ0FBeUJwQixDQUF6QixHQUE2QixLQUFLckIsS0FBTCxDQUFXb0MsSUFBNUMsRUFBa0Q7UUFDaEQsS0FBS3BDLEtBQUwsQ0FBV29DLElBQVgsR0FBa0JILHFCQUFxQixDQUFDUSxDQUFELENBQXJCLENBQXlCcEIsQ0FBM0M7UUFDQSxLQUFLSyxhQUFMLENBQW1CVSxJQUFuQixHQUEwQkgscUJBQXFCLENBQUNRLENBQUQsQ0FBckIsQ0FBeUJwQixDQUFuRDtNQUNEOztNQUNELElBQUlZLHFCQUFxQixDQUFDUSxDQUFELENBQXJCLENBQXlCcEIsQ0FBekIsR0FBNkIsS0FBS3JCLEtBQUwsQ0FBV3FDLElBQTVDLEVBQWtEO1FBQ2hELEtBQUtyQyxLQUFMLENBQVdxQyxJQUFYLEdBQWtCSixxQkFBcUIsQ0FBQ1EsQ0FBRCxDQUFyQixDQUF5QnBCLENBQTNDO1FBQ0EsS0FBS0ssYUFBTCxDQUFtQlcsSUFBbkIsR0FBMEJKLHFCQUFxQixDQUFDUSxDQUFELENBQXJCLENBQXlCcEIsQ0FBbkQ7TUFDRDs7TUFDRCxJQUFJWSxxQkFBcUIsQ0FBQ1EsQ0FBRCxDQUFyQixDQUF5QmxCLENBQXpCLEdBQTZCLEtBQUt2QixLQUFMLENBQVd3QixJQUE1QyxFQUFrRDtRQUNoRCxLQUFLeEIsS0FBTCxDQUFXd0IsSUFBWCxHQUFrQlMscUJBQXFCLENBQUNRLENBQUQsQ0FBckIsQ0FBeUJsQixDQUEzQztRQUNBLEtBQUtHLGFBQUwsQ0FBbUJGLElBQW5CLEdBQTBCUyxxQkFBcUIsQ0FBQ1EsQ0FBRCxDQUFyQixDQUF5QmxCLENBQW5EO01BQ0Q7O01BQ0QsSUFBSVUscUJBQXFCLENBQUNRLENBQUQsQ0FBckIsQ0FBeUJsQixDQUF6QixHQUE2QixLQUFLdkIsS0FBTCxDQUFXc0MsSUFBNUMsRUFBa0Q7UUFDaEQsS0FBS3RDLEtBQUwsQ0FBV3NDLElBQVgsR0FBa0JMLHFCQUFxQixDQUFDUSxDQUFELENBQXJCLENBQXlCbEIsQ0FBM0M7UUFDQSxLQUFLRyxhQUFMLENBQW1CWSxJQUFuQixHQUEwQkwscUJBQXFCLENBQUNRLENBQUQsQ0FBckIsQ0FBeUJsQixDQUFuRDtNQUNEO0lBQ0Y7O0lBRUQsS0FBS0csYUFBTCxDQUFtQkosSUFBbkIsR0FBMEIsQ0FBQyxLQUFLdEIsS0FBTCxDQUFXcUMsSUFBWCxHQUFrQixLQUFLckMsS0FBTCxDQUFXb0MsSUFBOUIsSUFBb0MsQ0FBOUQ7SUFDQSxLQUFLVixhQUFMLENBQW1CaUIsSUFBbkIsR0FBMEIsQ0FBQyxLQUFLM0MsS0FBTCxDQUFXc0MsSUFBWCxHQUFrQixLQUFLdEMsS0FBTCxDQUFXd0IsSUFBOUIsSUFBb0MsQ0FBOUQ7SUFDQSxLQUFLRSxhQUFMLENBQW1CYSxNQUFuQixHQUE0QixLQUFLdkMsS0FBTCxDQUFXcUMsSUFBWCxHQUFrQixLQUFLckMsS0FBTCxDQUFXb0MsSUFBekQ7SUFDQSxLQUFLVixhQUFMLENBQW1CYyxNQUFuQixHQUE0QixLQUFLeEMsS0FBTCxDQUFXc0MsSUFBWCxHQUFrQixLQUFLdEMsS0FBTCxDQUFXd0IsSUFBekQ7O0lBRUEsS0FBSyxJQUFJaUIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR1AsZ0JBQWdCLENBQUNRLE1BQXJDLEVBQTZDRCxDQUFDLEVBQTlDLEVBQWtEO01BRWhELElBQUlQLGdCQUFnQixDQUFDTyxDQUFELENBQWhCLENBQW9CcEIsQ0FBcEIsR0FBd0IsS0FBS3JCLEtBQUwsQ0FBV29DLElBQXZDLEVBQTZDO1FBQzNDLEtBQUtwQyxLQUFMLENBQVdvQyxJQUFYLEdBQWtCRixnQkFBZ0IsQ0FBQ08sQ0FBRCxDQUFoQixDQUFvQnBCLENBQXRDO01BRUQ7O01BQ0QsSUFBSWEsZ0JBQWdCLENBQUNPLENBQUQsQ0FBaEIsQ0FBb0JwQixDQUFwQixHQUF3QixLQUFLckIsS0FBTCxDQUFXcUMsSUFBdkMsRUFBNkM7UUFDM0MsS0FBS3JDLEtBQUwsQ0FBV3FDLElBQVgsR0FBa0JILGdCQUFnQixDQUFDTyxDQUFELENBQWhCLENBQW9CcEIsQ0FBdEM7TUFDRDs7TUFDRCxJQUFJYSxnQkFBZ0IsQ0FBQ08sQ0FBRCxDQUFoQixDQUFvQmxCLENBQXBCLEdBQXdCLEtBQUt2QixLQUFMLENBQVd3QixJQUF2QyxFQUE2QztRQUMzQyxLQUFLeEIsS0FBTCxDQUFXd0IsSUFBWCxHQUFrQlUsZ0JBQWdCLENBQUNPLENBQUQsQ0FBaEIsQ0FBb0JsQixDQUF0QztNQUNEOztNQUNELElBQUlXLGdCQUFnQixDQUFDTyxDQUFELENBQWhCLENBQW9CbEIsQ0FBcEIsR0FBd0IsS0FBS3ZCLEtBQUwsQ0FBV3NDLElBQXZDLEVBQTZDO1FBQzNDLEtBQUt0QyxLQUFMLENBQVdzQyxJQUFYLEdBQWtCSixnQkFBZ0IsQ0FBQ08sQ0FBRCxDQUFoQixDQUFvQmxCLENBQXRDO01BQ0Q7SUFDRjs7SUFDRCxLQUFLdkIsS0FBTCxDQUFXc0IsSUFBWCxHQUFrQixDQUFDLEtBQUt0QixLQUFMLENBQVdxQyxJQUFYLEdBQWtCLEtBQUtyQyxLQUFMLENBQVdvQyxJQUE5QixJQUFvQyxDQUF0RDtJQUNBLEtBQUtwQyxLQUFMLENBQVcyQyxJQUFYLEdBQWtCLENBQUMsS0FBSzNDLEtBQUwsQ0FBV3NDLElBQVgsR0FBa0IsS0FBS3RDLEtBQUwsQ0FBV3dCLElBQTlCLElBQW9DLENBQXREO0lBQ0EsS0FBS3hCLEtBQUwsQ0FBV3VDLE1BQVgsR0FBb0IsS0FBS3ZDLEtBQUwsQ0FBV3FDLElBQVgsR0FBa0IsS0FBS3JDLEtBQUwsQ0FBV29DLElBQWpEO0lBQ0EsS0FBS3BDLEtBQUwsQ0FBV3dDLE1BQVgsR0FBb0IsS0FBS3hDLEtBQUwsQ0FBV3NDLElBQVgsR0FBa0IsS0FBS3RDLEtBQUwsQ0FBV3dCLElBQWpEO0VBQ0Q7O0VBRURKLE9BQU8sQ0FBQ3dCLFdBQUQsRUFBYztJQUFFO0lBRXJCLElBQUkzQyxLQUFLLEdBQUc0QyxJQUFJLENBQUNDLEdBQUwsQ0FBVWQsTUFBTSxDQUFDZSxVQUFSLEdBQW9CSCxXQUFXLENBQUNMLE1BQXpDLEVBQWtEUCxNQUFNLENBQUNnQixXQUFSLEdBQXFCSixXQUFXLENBQUNKLE1BQWxGLENBQVo7SUFDQSxPQUFRdkMsS0FBUjtFQUNEOztFQUVEOEIsTUFBTSxHQUFHO0lBRVA7SUFDQUMsTUFBTSxDQUFDaUIsb0JBQVAsQ0FBNEIsS0FBS3ZFLEtBQWpDO0lBRUEsS0FBS0EsS0FBTCxHQUFhc0QsTUFBTSxDQUFDa0IscUJBQVAsQ0FBNkIsTUFBTTtNQUU5QztNQUNBLElBQUFuQixlQUFBLEVBQU8sSUFBQW9CLGFBQUEsQ0FBSztBQUNsQjtBQUNBO0FBQ0EseUNBQXlDLEtBQUs3RSxNQUFMLENBQVk4RSxJQUFLLFNBQVEsS0FBSzlFLE1BQUwsQ0FBWStFLEVBQUc7QUFDakY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixLQUFLckQsS0FBTCxDQUFXd0MsTUFBWCxHQUFrQixLQUFLdkMsS0FBTTtBQUNyRCx1QkFBdUIsS0FBS0QsS0FBTCxDQUFXdUMsTUFBWCxHQUFrQixLQUFLdEMsS0FBTTtBQUNwRDtBQUNBLHFDQUFxQyxDQUFDLEtBQUtELEtBQUwsQ0FBV29DLElBQVgsR0FBa0IsS0FBS2pCLFFBQUwsQ0FBY2lCLElBQWhDLEdBQXVDLEtBQUtqQixRQUFMLENBQWNvQixNQUFkLEdBQXFCLENBQTdELElBQWdFLEtBQUt0QyxLQUFNLE9BQU0sS0FBS2hCLFVBQUwsQ0FBZ0JLLGNBQWhCLEdBQStCLENBQUU7QUFDdko7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsS0FBS1UsS0FBTCxDQUFXd0MsTUFBWCxHQUFrQixLQUFLdkMsS0FBTTtBQUNyRCx1QkFBdUIsS0FBS0QsS0FBTCxDQUFXdUMsTUFBWCxHQUFrQixLQUFLdEMsS0FBTTtBQUNwRCxxQ0FBc0MsQ0FBQyxLQUFLa0IsUUFBTCxDQUFjb0IsTUFBZixHQUFzQixDQUF2QixHQUEwQixLQUFLdEMsS0FBTTtBQUMxRSxjQUFjLEtBQUtXLEtBQU07QUFDekI7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLEtBQUtjLGFBQUwsQ0FBbUJjLE1BQW5CLEdBQTBCLEtBQUt2QyxLQUFNO0FBQzdELHVCQUF1QixLQUFLeUIsYUFBTCxDQUFtQmEsTUFBbkIsR0FBMEIsS0FBS3RDLEtBQU07QUFDNUQ7QUFDQSxxQ0FBc0MsQ0FBQyxLQUFLeUIsYUFBTCxDQUFtQlUsSUFBbkIsR0FBMEIsS0FBS2pCLFFBQUwsQ0FBY2lCLElBQXhDLEdBQStDLEtBQUtqQixRQUFMLENBQWNvQixNQUFkLEdBQXFCLENBQXJFLElBQXdFLEtBQUt0QyxLQUFPLE9BQU0sQ0FBQyxLQUFLeUIsYUFBTCxDQUFtQkYsSUFBbkIsR0FBMEIsS0FBS0wsUUFBTCxDQUFjSyxJQUF6QyxJQUErQyxLQUFLdkIsS0FBcEQsR0FBNEQsS0FBS2hCLFVBQUwsQ0FBZ0JLLGNBQWhCLEdBQStCLENBQUU7QUFDN047QUFDQTtBQUNBO0FBQ0EsT0FsQ00sRUFrQ0csS0FBS2QsVUFsQ1IsRUFIOEMsQ0F1QzlDOztNQUNBLElBQUksS0FBS2tCLFlBQVQsRUFBdUI7UUFDckIsS0FBS0EsWUFBTCxHQUFvQixLQUFwQixDQURxQixDQUNlO1FBRXBDOztRQUNBLElBQUk0RCxXQUFXLEdBQUc1QyxRQUFRLENBQUM2QyxjQUFULENBQXdCLGFBQXhCLENBQWxCO1FBRUFELFdBQVcsQ0FBQzNDLGdCQUFaLENBQTZCLE9BQTdCLEVBQXNDLE1BQU07VUFFMUM7VUFDQUQsUUFBUSxDQUFDNkMsY0FBVCxDQUF3QixPQUF4QixFQUFpQ0MsS0FBakMsQ0FBdUNDLFVBQXZDLEdBQW9ELFFBQXBEO1VBQ0EvQyxRQUFRLENBQUM2QyxjQUFULENBQXdCLE9BQXhCLEVBQWlDQyxLQUFqQyxDQUF1Q0UsUUFBdkMsR0FBa0QsVUFBbEQ7VUFDQWhELFFBQVEsQ0FBQzZDLGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0NDLEtBQWhDLENBQXNDQyxVQUF0QyxHQUFtRCxTQUFuRCxDQUwwQyxDQU8xQzs7VUFDQSxLQUFLdEQsU0FBTCxHQUFpQk8sUUFBUSxDQUFDNkMsY0FBVCxDQUF3QixpQkFBeEIsQ0FBakIsQ0FSMEMsQ0FVMUM7O1VBQ0EsS0FBS0ksb0JBQUwsR0FYMEMsQ0FhMUM7O1VBQ0EsS0FBS3hELFNBQUwsQ0FBZVEsZ0JBQWYsQ0FBZ0MsV0FBaEMsRUFBOENpRCxLQUFELElBQVc7WUFDdEQsS0FBS2hFLFNBQUwsR0FBaUIsSUFBakI7WUFDQSxLQUFLaUUsVUFBTCxDQUFnQkQsS0FBaEI7VUFDRCxDQUhELEVBR0csS0FISDtVQUlBLEtBQUt6RCxTQUFMLENBQWVRLGdCQUFmLENBQWdDLFdBQWhDLEVBQThDaUQsS0FBRCxJQUFXO1lBQ3RELElBQUksS0FBS2hFLFNBQVQsRUFBb0I7Y0FDbEIsS0FBS2lFLFVBQUwsQ0FBZ0JELEtBQWhCO1lBQ0Q7VUFDRixDQUpELEVBSUcsS0FKSDtVQUtBLEtBQUt6RCxTQUFMLENBQWVRLGdCQUFmLENBQWdDLFNBQWhDLEVBQTRDaUQsS0FBRCxJQUFXO1lBQ3BELEtBQUtoRSxTQUFMLEdBQWlCLEtBQWpCO1VBQ0QsQ0FGRCxFQUVHLEtBRkgsRUF2QjBDLENBMkIxQzs7VUFDQSxLQUFLTyxTQUFMLENBQWVRLGdCQUFmLENBQWdDLFlBQWhDLEVBQStDbUQsR0FBRCxJQUFTO1lBQ3JELEtBQUtqRSxPQUFMLEdBQWUsSUFBZjtZQUNBLEtBQUtnRSxVQUFMLENBQWdCQyxHQUFHLENBQUNDLGNBQUosQ0FBbUIsQ0FBbkIsQ0FBaEI7VUFDRCxDQUhELEVBR0csS0FISDtVQUlBLEtBQUs1RCxTQUFMLENBQWVRLGdCQUFmLENBQWdDLFdBQWhDLEVBQThDbUQsR0FBRCxJQUFTO1lBQ3BELElBQUksS0FBS2pFLE9BQVQsRUFBa0I7Y0FDaEIsS0FBS2dFLFVBQUwsQ0FBZ0JDLEdBQUcsQ0FBQ0MsY0FBSixDQUFtQixDQUFuQixDQUFoQjtZQUNEO1VBQ0YsQ0FKRCxFQUlHLEtBSkg7VUFLQSxLQUFLNUQsU0FBTCxDQUFlUSxnQkFBZixDQUFnQyxVQUFoQyxFQUE2Q21ELEdBQUQsSUFBUztZQUNuRCxLQUFLakUsT0FBTCxHQUFlLEtBQWY7VUFDRCxDQUZELEVBRUcsS0FGSDtVQUlBLEtBQUtGLFlBQUwsR0FBb0IsSUFBcEIsQ0F6QzBDLENBeUNSO1FBRW5DLENBM0NEO01BNENEO0lBQ0YsQ0EzRlksQ0FBYjtFQTRGRDs7RUFFRGdFLG9CQUFvQixHQUFHO0lBQUU7SUFFdkI7SUFDQSxLQUFLSyxpQkFBTCxHQUhxQixDQUd1RDs7SUFDNUUsS0FBS2pFLE9BQUwsQ0FBYWtFLGFBQWIsQ0FBMkIsS0FBSzlELFNBQWhDLEVBQTJDLEtBQUtGLEtBQWhELEVBQXVELEtBQUtDLE1BQTVELEVBSnFCLENBSXVEOztJQUM1RSxLQUFLSixRQUFMLENBQWNvRSxPQUFkLENBQXNCLEtBQUsvRCxTQUEzQixFQUxxQixDQUt1RDs7SUFDNUUsS0FBSzRCLE1BQUwsR0FOcUIsQ0FNdUQ7RUFDN0U7O0VBRURpQyxpQkFBaUIsR0FBRztJQUFFO0lBRXBCLElBQUk3RCxTQUFTLEdBQUdPLFFBQVEsQ0FBQzZDLGNBQVQsQ0FBd0IscUJBQXhCLENBQWhCO0lBQ0EsSUFBSWpFLGNBQWMsR0FBRyxLQUFLTCxVQUFMLENBQWdCSyxjQUFyQztJQUNBLEtBQUs2RSxXQUFMLEdBQW1CLEVBQW5COztJQUVBLEtBQUssSUFBSTFCLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBSzFDLE9BQUwsQ0FBYWdCLFdBQWIsQ0FBeUJHLFVBQXpCLENBQW9Dd0IsTUFBeEQsRUFBZ0VELENBQUMsRUFBakUsRUFBcUU7TUFFbkUsS0FBSzBCLFdBQUwsQ0FBaUJDLElBQWpCLENBQXNCMUQsUUFBUSxDQUFDMkQsYUFBVCxDQUF1QixLQUF2QixDQUF0QixFQUZtRSxDQUVQOztNQUM1RCxLQUFLRixXQUFMLENBQWlCMUIsQ0FBakIsRUFBb0JZLEVBQXBCLEdBQXlCLGVBQWVaLENBQXhDLENBSG1FLENBR1A7O01BQzVELEtBQUswQixXQUFMLENBQWlCMUIsQ0FBakIsRUFBb0I2QixTQUFwQixHQUFnQyxHQUFoQyxDQUptRSxDQUlQO01BRTVEOztNQUNBLEtBQUtILFdBQUwsQ0FBaUIxQixDQUFqQixFQUFvQmUsS0FBcEIsQ0FBMEJFLFFBQTFCLEdBQXFDLFVBQXJDO01BQ0EsS0FBS1MsV0FBTCxDQUFpQjFCLENBQWpCLEVBQW9CZSxLQUFwQixDQUEwQmUsTUFBMUIsR0FBbUMsT0FBUSxDQUFDakYsY0FBRCxHQUFnQixDQUF4QixHQUE2QixJQUFoRTtNQUNBLEtBQUs2RSxXQUFMLENBQWlCMUIsQ0FBakIsRUFBb0JlLEtBQXBCLENBQTBCZ0IsS0FBMUIsR0FBa0NsRixjQUFjLEdBQUcsSUFBbkQ7TUFDQSxLQUFLNkUsV0FBTCxDQUFpQjFCLENBQWpCLEVBQW9CZSxLQUFwQixDQUEwQmlCLE1BQTFCLEdBQW1DbkYsY0FBYyxHQUFHLElBQXBEO01BQ0EsS0FBSzZFLFdBQUwsQ0FBaUIxQixDQUFqQixFQUFvQmUsS0FBcEIsQ0FBMEJrQixZQUExQixHQUF5Q3BGLGNBQWMsR0FBRyxJQUExRDtNQUNBLEtBQUs2RSxXQUFMLENBQWlCMUIsQ0FBakIsRUFBb0JlLEtBQXBCLENBQTBCbUIsVUFBMUIsR0FBdUNyRixjQUFjLEdBQUcsSUFBeEQ7TUFDQSxLQUFLNkUsV0FBTCxDQUFpQjFCLENBQWpCLEVBQW9CZSxLQUFwQixDQUEwQm9CLFVBQTFCLEdBQXVDLEtBQXZDO01BQ0EsS0FBS1QsV0FBTCxDQUFpQjFCLENBQWpCLEVBQW9CZSxLQUFwQixDQUEwQnFCLE1BQTFCLEdBQW1DLENBQW5DO01BQ0EsS0FBS1YsV0FBTCxDQUFpQjFCLENBQWpCLEVBQW9CZSxLQUFwQixDQUEwQnNCLFNBQTFCLEdBQXNDLGVBQ25DLENBQUMsS0FBSy9FLE9BQUwsQ0FBYWdCLFdBQWIsQ0FBeUJHLFVBQXpCLENBQW9DdUIsQ0FBcEMsRUFBdUNwQixDQUF2QyxHQUEyQyxLQUFLbkIsTUFBTCxDQUFZbUIsQ0FBeEQsSUFBMkQsS0FBS3BCLEtBRDdCLEdBQ3NDLE1BRHRDLEdBRW5DLENBQUMsS0FBS0YsT0FBTCxDQUFhZ0IsV0FBYixDQUF5QkcsVUFBekIsQ0FBb0N1QixDQUFwQyxFQUF1Q2xCLENBQXZDLEdBQTJDLEtBQUtyQixNQUFMLENBQVlxQixDQUF4RCxJQUEyRCxLQUFLdEIsS0FGN0IsR0FFc0MsS0FGNUUsQ0FmbUUsQ0FtQm5FOztNQUNBRSxTQUFTLENBQUM0RSxXQUFWLENBQXNCLEtBQUtaLFdBQUwsQ0FBaUIxQixDQUFqQixDQUF0QjtJQUNEO0VBQ0Y7O0VBRURvQixVQUFVLENBQUNELEtBQUQsRUFBUTtJQUFFO0lBRWxCO0lBQ0EsSUFBSW9CLEtBQUssR0FBRyxLQUFLN0QsUUFBTCxDQUFjRyxJQUFkLEdBQXFCLENBQUNzQyxLQUFLLENBQUNxQixPQUFOLEdBQWdCakQsTUFBTSxDQUFDZSxVQUFQLEdBQWtCLENBQW5DLElBQXVDLEtBQUs5QyxLQUE3RTtJQUNBLElBQUlpRixLQUFLLEdBQUcsS0FBSy9ELFFBQUwsQ0FBY0ssSUFBZCxHQUFxQixDQUFDb0MsS0FBSyxDQUFDdUIsT0FBTixHQUFnQixLQUFLbEcsVUFBTCxDQUFnQkssY0FBaEIsR0FBK0IsQ0FBaEQsSUFBb0QsS0FBS1csS0FBMUYsQ0FKZ0IsQ0FNaEI7O0lBQ0EsSUFBSStFLEtBQUssSUFBSSxLQUFLdEQsYUFBTCxDQUFtQlUsSUFBNUIsSUFBb0M0QyxLQUFLLElBQUksS0FBS3RELGFBQUwsQ0FBbUJXLElBQWhFLElBQXdFNkMsS0FBSyxJQUFJLEtBQUt4RCxhQUFMLENBQW1CRixJQUFwRyxJQUE0RzBELEtBQUssSUFBSSxLQUFLeEQsYUFBTCxDQUFtQlksSUFBNUksRUFBa0o7TUFDaEpoQyxPQUFPLENBQUM4RSxHQUFSLENBQVksVUFBWixFQURnSixDQUdoSjs7TUFDQSxLQUFLdEYsUUFBTCxDQUFjdUYsS0FBZCxDQUFvQnpCLEtBQXBCLEVBQTJCLEtBQUsxRCxNQUFoQyxFQUF3QyxLQUFLRCxLQUE3QyxFQUpnSixDQUloRTs7TUFDaEYsS0FBS0YsT0FBTCxDQUFhOEIseUJBQWIsQ0FBdUMsS0FBSy9CLFFBQUwsQ0FBYzhCLGdCQUFyRCxFQUxnSixDQUtoRTs7TUFDaEYsS0FBS0csTUFBTCxHQU5nSixDQU1oRTtJQUNqRixDQVBELE1BU0s7TUFDSDtNQUNBLEtBQUtuQyxTQUFMLEdBQWlCLEtBQWpCO01BQ0EsS0FBS0MsT0FBTCxHQUFlLEtBQWY7SUFDRDtFQUNGOztFQUVEaUMsZUFBZSxHQUFHO0lBQUU7SUFFbEI7SUFDQXBCLFFBQVEsQ0FBQzZDLGNBQVQsQ0FBd0IsaUJBQXhCLEVBQTJDa0IsTUFBM0MsR0FBcUQsS0FBS3ZFLE1BQUwsQ0FBWXFCLENBQVosR0FBYyxLQUFLdEIsS0FBcEIsR0FBNkIsSUFBakY7SUFDQVMsUUFBUSxDQUFDNkMsY0FBVCxDQUF3QixpQkFBeEIsRUFBMkNpQixLQUEzQyxHQUFvRCxLQUFLdEUsTUFBTCxDQUFZbUIsQ0FBWixHQUFjLEtBQUtwQixLQUFwQixHQUE2QixJQUFoRjtJQUNBUyxRQUFRLENBQUM2QyxjQUFULENBQXdCLGlCQUF4QixFQUEyQ3VCLFNBQTNDLEdBQXVELGdCQUFnQixLQUFLN0YsVUFBTCxDQUFnQkssY0FBaEIsR0FBK0IsQ0FBL0IsR0FBbUMsS0FBS1UsS0FBTCxDQUFXdUMsTUFBWCxHQUFrQixLQUFLdEMsS0FBTCxDQUFXcUYsVUFBN0IsR0FBd0MsQ0FBM0YsSUFBZ0csV0FBdkosQ0FMZ0IsQ0FPaEI7O0lBQ0EsS0FBS3ZGLE9BQUwsQ0FBYXdGLHFCQUFiLENBQW1DLEtBQUt0RixLQUF4QyxFQUErQyxLQUFLQyxNQUFwRCxFQVJnQixDQVFrRDs7SUFDbEUsS0FBS0osUUFBTCxDQUFjMEYscUJBQWQsQ0FBb0MsS0FBS3RGLE1BQXpDLEVBQWlELEtBQUtELEtBQXRELEVBVGdCLENBU2tEOztJQUNsRSxLQUFLd0Ysd0JBQUwsR0FWZ0IsQ0FVa0Q7O0lBQ2xFLEtBQUs5RCxrQkFBTCxHQVhnQixDQVc0QztFQUM3RDs7RUFFRDhELHdCQUF3QixHQUFHO0lBQUU7SUFDM0IsS0FBSyxJQUFJaEQsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLMUMsT0FBTCxDQUFhZ0IsV0FBYixDQUF5QkcsVUFBekIsQ0FBb0N3QixNQUF4RCxFQUFnRUQsQ0FBQyxFQUFqRSxFQUFxRTtNQUNuRSxLQUFLMEIsV0FBTCxDQUFpQjFCLENBQWpCLEVBQW9CZSxLQUFwQixDQUEwQnNCLFNBQTFCLEdBQXNDLGVBQ25DLENBQUMsS0FBSy9FLE9BQUwsQ0FBYWdCLFdBQWIsQ0FBeUJHLFVBQXpCLENBQW9DdUIsQ0FBcEMsRUFBdUNwQixDQUF2QyxHQUEyQyxLQUFLbkIsTUFBTCxDQUFZbUIsQ0FBeEQsSUFBMkQsS0FBS3BCLEtBRDdCLEdBQ3NDLE1BRHRDLEdBRW5DLENBQUMsS0FBS0YsT0FBTCxDQUFhZ0IsV0FBYixDQUF5QkcsVUFBekIsQ0FBb0N1QixDQUFwQyxFQUF1Q2xCLENBQXZDLEdBQTJDLEtBQUtyQixNQUFMLENBQVlxQixDQUF4RCxJQUEyRCxLQUFLdEIsS0FGN0IsR0FFc0MsS0FGNUU7SUFHRDtFQUNGOztFQUNEMEIsa0JBQWtCLEdBQUc7SUFBRTtJQUNuQixLQUFLZixLQUFMLENBQVc0RCxLQUFYLEdBQW1CLEtBQUtyRCxRQUFMLENBQWNvQixNQUFkLEdBQXFCLEtBQUt0QyxLQUE3QztJQUNBLEtBQUtXLEtBQUwsQ0FBVzZELE1BQVgsR0FBb0IsS0FBS3RELFFBQUwsQ0FBY3FCLE1BQWQsR0FBcUIsS0FBS3ZDLEtBQTlDO0VBQ0g7O0FBemErQzs7ZUE0YW5DOUIsZ0IifQ==