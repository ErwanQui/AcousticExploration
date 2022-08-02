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
      // this.scale = this.Scaling(this.range);

      this.scale = this.Scaling(this.extremum); // Get offset parameters of the display

      this.offset = {
        x: this.extremum.moyX,
        y: this.extremum.minY
      };
      var listenerInitPos = {
        x: this.positionRange.moyX,
        y: this.positionRange.minY
      }; // Create, start and store the listener class object

      this.Listener = new _Listener.default(listenerInitPos, this.parameters);
      this.Listener.start(this.scale, this.offset); // Start the sources display and audio depending on listener's initial position

      this.Sources.start(this.Listener.listenerPosition); // Add an event listener dispatched from "Listener.js" when the position of the user changed

      document.addEventListener('Moving', () => {
        this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // Update the sound depending on listener's position

        this.UpdateContainer();
        this.render();
      }); // Add event listener for resize window event to resize the display

      window.addEventListener('resize', () => {
        // this.scale = this.Scaling(this.range);      // Change the scale
        this.scale = this.Scaling(this.extremum); // Change the scale

        console.log(this.scale);

        if (this.beginPressed) {
          // Check the begin state
          this.UpdateContainer(); // Resize the display
        } // Display


        this.render();
      }); // Resize background

      this.UpdateSceneDisplay(); // Display

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
    console.log(imageExtremum);
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
    // var scale = Math.min((window.innerWidth - this.parameters.circleDiameter)/rangeValues.rangeX, (window.innerHeight - this.parameters.circleDiameter)/rangeValues.rangeY);
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
    // Update the position of the instruments
    this.scene.width = this.extremum.rangeX * this.scale;
    this.scene.height = this.extremum.rangeY * this.scale;
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwibmJDbG9zZXN0RGV0ZWN0U291cmNlcyIsIm5iQ2xvc2VzdEFjdGl2U291cmNlcyIsImdhaW5FeHBvc2FudCIsIm1vZGUiLCJjaXJjbGVEaWFtZXRlciIsImxpc3RlbmVyU2l6ZSIsImRhdGFGaWxlTmFtZSIsImF1ZGlvRGF0YSIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsIm1vdXNlRG93biIsInRvdWNoZWQiLCJMaXN0ZW5lciIsIlNvdXJjZXMiLCJyYW5nZSIsInNjYWxlIiwib2Zmc2V0IiwiY29udGFpbmVyIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJjb25zb2xlIiwiZXJyb3IiLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic2NlbmUiLCJpbWFnZSIsIlJhbmdlIiwic291cmNlc0RhdGEiLCJyZWNlaXZlcnMiLCJ4eXoiLCJzb3VyY2VzX3h5IiwiZXh0cmVtdW0iLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImxvZyIsIlVwZGF0ZVNjZW5lRGlzcGxheSIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJpbWFnZUV4dHJlbXVtIiwibWluWCIsIm1heFgiLCJtYXhZIiwicmFuZ2VYIiwicmFuZ2VZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImh0bWwiLCJ0eXBlIiwiaWQiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNoYW5nZWRUb3VjaGVzIiwiQ3JlYXRlSW5zdHJ1bWVudHMiLCJDcmVhdGVTb3VyY2VzIiwiRGlzcGxheSIsImluc3RydW1lbnRzIiwicHVzaCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJtYXJnaW4iLCJ3aWR0aCIsImhlaWdodCIsImJvcmRlclJhZGl1cyIsImxpbmVIZWlnaHQiLCJiYWNrZ3JvdW5kIiwiekluZGV4IiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJSZXNldCIsIlZQb3MyUGl4ZWwiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJVcGRhdGVMaXN0ZW5lckRpc3BsYXkiLCJVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcbmltcG9ydCBTb3VyY2VzIGZyb20gJy4vU291cmNlcy5qcydcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnNcbiAgICAvLyBAbm90ZTogY291bGQgYmUgYSBnb29kIGlkZWEgdG8gY3JlYXRlIGEgcGx1Z2luIG9iamVjdFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTsgICAgIC8vIFRvIGxvYWQgYXVkaW9CdWZmZXJzXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7ICAgICAgICAgICAgICAgICAgICAgLy8gVG8gZ2V0IGZpbGVzXG4gICAgdGhpcy5zeW5jID0gdGhpcy5yZXF1aXJlKCdzeW5jJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3luYyBhdWRpbyBzb3VyY2VzXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHRoaXMucmVxdWlyZSgncGxhdGZvcm0nKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcbiAgICB0aGlzLmF1ZGlvU3RyZWFtID0gdGhpcy5yZXF1aXJlKCdhdWRpby1zdHJlYW1zJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgLy8gb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0RGV0ZWN0U291cmNlczogMywgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIGRldGVjdGVkXG4gICAgICBuYkNsb3Nlc3RBY3RpdlNvdXJjZXM6IDMsICAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgY2xvc2VzdCBwb2ludHMgdXNlZCBhcyBhY3RpdmUgYXVkaW9Tb3VyY2VzXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiLCBcImFtYmlDb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcInN0cmVhbWluZ1wiLFxuICAgICAgbW9kZTogXCJhbWJpc29uaWNcIixcbiAgICAgIC8vIG1vZGU6IFwiY29udm9sdmluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpQ29udm9sdmluZ1wiLFxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlhbWV0ZXIgb2Ygc291cmNlcycgZGlzcGxheVxuICAgICAgbGlzdGVuZXJTaXplOiAxNiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2l6ZSBvZiBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIHNvdXJjZXMnIHBvc2l0aW9uIGFuZCBhdWRpb0RhdGFzJyBmaWxlbmFtZXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgICBhdWRpb0RhdGE6IFwiXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBhdWRpb0RhdGFzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIGV2ZW50IGxpc3RlbmVyIGhhdm4ndCBiZWVuIGluaXRpYXRlZFxuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIGJlZ2luQnV0dG9uIGhhcyBhbHJlYWR5IGJlZW4gcHJlc3NlZFxuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIG1vdXNlIGlzIHByZXNzZWQgKGNvbXB1dGVyKVxuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlOyAgICAgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIHNjcmVlbiBpcyB0b3VjaGVkIChkZXZpY2UpXG5cbiAgICAvLyBJbnN0YW5jaWF0ZSBjbGFzc2VzJyBzdG9yZXJcbiAgICB0aGlzLkxpc3RlbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnTGlzdGVuZXInIGNsYXNzXG4gICAgdGhpcy5Tb3VyY2VzOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ1NvdXJjZXMnIGNsYXNzXG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5vZmZzZXQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPZmZzZXQgb2YgdGhlIGRpc3BsYXlcbiAgICB0aGlzLmNvbnRhaW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgY29udGFpbmVyIG9mIGRpc3BsYXkgZWxlbWVudHMgKGNyZWF0ZXMgaW4gJ3JlbmRlcigpJylcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcblxuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBDaGVja1xuICAgIGlmICh0aGlzLnBhcmFtZXRlcnMubmJDbG9zZXN0RGV0ZWN0U291cmNlcyA8IHRoaXMucGFyYW1ldGVycy5uYkNsb3Nlc3RBY3RpdlNvdXJjZXMpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJUaGUgbnVtYmVyIG9mIGRldGVjdGVkIHNvdXJjZXMgbXVzdCBiZSBoaWdoZXIgdGhhbiB0aGUgbnVtYmVyIG9mIHVzZWQgc291cmNlc1wiKVxuICAgIH1cblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc011c2ljMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNQaWFubyc7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmVQaWFuby5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczInO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNTcGVlY2gxJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzTXVzaWMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTIuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUzLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXM0JztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTQuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIHN0b3JlciBmb3Igc291cmNlcyBhbmQgbG9hZCB0aGVpciBmaWxlRGF0YXNcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycywgdGhpcy5wbGF0Zm9ybSwgdGhpcy5zeW5jLCB0aGlzLmF1ZGlvU3RyZWFtKVxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgIC8vIEdldCBiYWNrZ3JvdW5kIGh0bWwgY29kZVxuICAgICAgdGhpcy5zY2VuZSA9IHRoaXMuU291cmNlcy5pbWFnZTtcblxuICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6LCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLmV4dHJlbXVtKTtcblxuICAgICAgLy8gSW5zdGFuY2lhdGUgJ3RoaXMuc2NhbGUnXG4gICAgICAvLyB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLmV4dHJlbXVtKTtcblxuICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgeDogdGhpcy5leHRyZW11bS5tb3lYLFxuICAgICAgICB5OiB0aGlzLmV4dHJlbXVtLm1pbllcbiAgICAgIH07XG5cbiAgICAgIHZhciBsaXN0ZW5lckluaXRQb3MgPSB7XG4gICAgICAgIHg6IHRoaXMucG9zaXRpb25SYW5nZS5tb3lYLFxuICAgICAgICB5OiB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWVxuICAgICAgfTtcblxuICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzIG9iamVjdFxuICAgICAgdGhpcy5MaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcihsaXN0ZW5lckluaXRQb3MsIHRoaXMucGFyYW1ldGVycyk7XG4gICAgICB0aGlzLkxpc3RlbmVyLnN0YXJ0KHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTtcbiAgICAgIC8vIFN0YXJ0IHRoZSBzb3VyY2VzIGRpc3BsYXkgYW5kIGF1ZGlvIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIGluaXRpYWwgcG9zaXRpb25cbiAgICAgIHRoaXMuU291cmNlcy5zdGFydCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuXG4gICAgICAvLyBBZGQgYW4gZXZlbnQgbGlzdGVuZXIgZGlzcGF0Y2hlZCBmcm9tIFwiTGlzdGVuZXIuanNcIiB3aGVuIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlciBjaGFuZ2VkXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNb3ZpbmcnLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KVxuICAgICAgXG4gICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSB3aW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuXG4gICAgICAgIC8vIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMuZXh0cmVtdW0pOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5zY2FsZSlcblxuICAgICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBzdGF0ZVxuICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSlcblxuICAgICAgLy8gUmVzaXplIGJhY2tncm91bmRcbiAgICAgIHRoaXMuVXBkYXRlU2NlbmVEaXNwbGF5KClcblxuICAgICAgLy8gRGlzcGxheVxuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcbiAgfVxuXG4gIFJhbmdlKGF1ZGlvU291cmNlc1Bvc2l0aW9ucywgc291cmNlc1Bvc2l0aW9ucywgaW1hZ2VFeHRyZW11bSkgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcbiAgICAvLyBAbm90ZTogdGhhdCBjYW4gYmUgcHJvYmFibHkgYmUgZG9uZSBpbiBhIG1vcmUgcHJldHR5IHdheVxuXG4gICAgdGhpcy5yYW5nZSA9IHtcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuICAgIHRoaXMucG9zaXRpb25SYW5nZSA9IHtcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuICAgIGNvbnNvbGUubG9nKGltYWdlRXh0cmVtdW0pXG4gICAgdGhpcy5leHRyZW11bSA9IHtcbiAgICAgIG1pblg6IGltYWdlRXh0cmVtdW1bMF0ueCxcbiAgICAgIG1heFg6IGltYWdlRXh0cmVtdW1bMV0ueCxcbiAgICAgIG1pblk6IGltYWdlRXh0cmVtdW1bMF0ueSwgXG4gICAgICBtYXhZOiBpbWFnZUV4dHJlbXVtWzFdLnksXG4gICAgfVxuXG4gICAgdGhpcy5leHRyZW11bS5yYW5nZVggPSB0aGlzLmV4dHJlbXVtLm1heFggLSB0aGlzLmV4dHJlbXVtLm1pblg7XG4gICAgdGhpcy5leHRyZW11bS5tb3lYID0gKHRoaXMuZXh0cmVtdW0ubWF4WCArIHRoaXMuZXh0cmVtdW0ubWluWCkvMjtcbiAgICB0aGlzLmV4dHJlbXVtLnJhbmdlWSA9IHRoaXMuZXh0cmVtdW0ubWF4WSAtIHRoaXMuZXh0cmVtdW0ubWluWTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYXVkaW9Tb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcblxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBzb3VyY2VzUG9zaXRpb25zW2ldLng7XG5cbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gc291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdGhhdCBkaXNwbGF5cyBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuXG4gICAgLy8gdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVgsICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoKS9yYW5nZVZhbHVlcy5yYW5nZVgsICh3aW5kb3cuaW5uZXJIZWlnaHQpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG5cbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwiaW5zdHJ1bWVudENvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeyh0aGlzLnJhbmdlLm1pblggLSB0aGlzLmV4dHJlbXVtLm1pblggLSB0aGlzLmV4dHJlbXVtLnJhbmdlWC8yKSp0aGlzLnNjYWxlfXB4LCAke3RoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJzY2VuZVwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBsZWZ0OiA1MCU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5leHRyZW11bS5yYW5nZVgvMikqdGhpcy5zY2FsZX1weCwgMHB4KTtcIj5cbiAgICAgICAgICAgICR7dGhpcy5zY2VuZX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygodGhpcy5wb3NpdGlvblJhbmdlLm1pblggLSB0aGlzLmV4dHJlbXVtLm1pblggLSB0aGlzLmV4dHJlbXVtLnJhbmdlWC8yKSp0aGlzLnNjYWxlKX1weCwgJHsodGhpcy5wb3NpdGlvblJhbmdlLm1pblkgLSB0aGlzLmV4dHJlbXVtLm1pblkpKnRoaXMuc2NhbGUgKyB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBzdGF0ZVxuXG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cbiAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9iYWwgY29udGFpbmVyc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgLy8gQWRkIG1vdXNlRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7ICAgICAgICAgLy8gVXBkYXRlIGJlZ2luIHN0YXRlIFxuXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIGF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBzb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIENyZWF0ZSBhbmQgZGlzcGxheSBvYmplY3RzXG4gICAgdGhpcy5DcmVhdGVJbnN0cnVtZW50cygpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSB0aGUgaW5zdHJ1bWVudHMgYW5kIGRpc3BsYXkgdGhlbVxuICAgIHRoaXMuU291cmNlcy5DcmVhdGVTb3VyY2VzKHRoaXMuY29udGFpbmVyLCB0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZXMgYW5kIGRpc3BsYXkgdGhlbVxuICAgIHRoaXMuTGlzdGVuZXIuRGlzcGxheSh0aGlzLmNvbnRhaW5lcik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyJ3MgZGlzcGxheSB0byB0aGUgY29udGFpbmVyXG4gICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICB9XG5cbiAgQ3JlYXRlSW5zdHJ1bWVudHMoKSB7IC8vIENyZWF0ZSB0aGUgaW5zdHJ1bWVudHMgYW5kIGFkZCB0aGVtIHRvIHRoZSBzY2VuZSBkaXNwbGF5XG5cbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2luc3RydW1lbnRDb250YWluZXInKVxuICAgIHZhciBjaXJjbGVEaWFtZXRlciA9IHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcjtcbiAgICB0aGlzLmluc3RydW1lbnRzID0gW11cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkubGVuZ3RoOyBpKyspIHtcblxuICAgICAgdGhpcy5pbnN0cnVtZW50cy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKTsgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGVsZW1lbnRcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaWQgPSBcImluc3RydW1lbnRcIiArIGk7ICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgaWRcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaW5uZXJIVE1MID0gXCJTXCI7ICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgdmFsdWUgKGkrMSlcblxuICAgICAgLy8gQ2hhbmdlIGZvcm0gYW5kIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IHRvIGdldCBhIGNpcmNsZSBhdCB0aGUgZ29vZCBwbGFjZTtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLm1hcmdpbiA9IFwiMCBcIiArICgtY2lyY2xlRGlhbWV0ZXIvMikgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLndpZHRoID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmhlaWdodCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5ib3JkZXJSYWRpdXMgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUubGluZUhlaWdodCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZWRcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuekluZGV4ID0gMTtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSkgKyBcInB4LCBcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnkgLSB0aGlzLm9mZnNldC55KSp0aGlzLnNjYWxlKSArIFwicHgpXCI7XG5cbiAgICAgIC8vIEFkZCB0aGUgY2lyY2xlJ3MgZGlzcGxheSB0byB0aGUgZ2xvYmFsIGNvbnRhaW5lclxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuaW5zdHJ1bWVudHNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHVzZXJBY3Rpb24obW91c2UpIHsgLy8gQ2hhbmdlIGxpc3RlbmVyJ3MgcG9zaXRpb24gd2hlbiB0aGUgbW91c2UvdG91Y2ggaGFzIGJlZW4gdXNlZFxuXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICB2YXIgdGVtcFggPSB0aGlzLmV4dHJlbXVtLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLmV4dHJlbXVtLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yKS8odGhpcy5zY2FsZSk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WSkge1xuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKTtcblxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXkgICAgICAgICAgICAgIFxuICAgICAgdGhpcy5MaXN0ZW5lci5SZXNldChtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB0aGUgbGlzdGVuZXIgYXQgdGhlIG5ldyBwb3NpdGlvblxuICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERpc3BsYXlcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIHZhbHVlIGlzIG91dCBvZiByYW5nZSwgc3RvcCB0aGUgYWN0aW9uXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplIG9mIHRoZSBzZWxlY3RvciBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMub2Zmc2V0LnkqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5vZmZzZXQueCp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG5cbiAgICAvLyBDaGFuZ2Ugb3RoZXIgZ2xvYmFsIGRpc3BsYXlzXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgLy8gVXBkYXRlIHNvdXJjZXMnIGRpc3BsYXlcbiAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyRGlzcGxheSh0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgdGhpcy5VcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIGluc3RydW1lbnQncyBkaXNwbGF5XG4gICAgdGhpcy5VcGRhdGVTY2VuZURpc3BsYXkoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHNjZW5lJ3MgZGlzcGxheVxuICB9XG5cbiAgVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5KCkgeyAvLyBVcGRhdGUgdGhlIHBvc2l0aW9uIG9mIHRoZSBpbnN0cnVtZW50c1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSkgKyBcInB4LCBcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnkgLSB0aGlzLm9mZnNldC55KSp0aGlzLnNjYWxlKSArIFwicHgpXCI7XG4gICAgfVxuICB9XG4gIFVwZGF0ZVNjZW5lRGlzcGxheSgpIHsgLy8gVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgaW5zdHJ1bWVudHNcbiAgICAgIHRoaXMuc2NlbmUud2lkdGggPSB0aGlzLmV4dHJlbXVtLnJhbmdlWCp0aGlzLnNjYWxlXG4gICAgICB0aGlzLnNjZW5lLmhlaWdodCA9IHRoaXMuZXh0cmVtdW0ucmFuZ2VZKnRoaXMuc2NhbGVcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOzs7O0FBRUEsTUFBTUEsZ0JBQU4sU0FBK0JDLDBCQUEvQixDQUFrRDtFQUNoREMsV0FBVyxDQUFDQyxNQUFELEVBQVNDLE1BQU0sR0FBRyxFQUFsQixFQUFzQkMsVUFBdEIsRUFBa0NDLFlBQWxDLEVBQWdEO0lBRXpELE1BQU1ILE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtFLEtBQUwsR0FBYSxJQUFiLENBTnlELENBUXpEO0lBQ0E7O0lBQ0EsS0FBS0MsaUJBQUwsR0FBeUIsS0FBS0MsT0FBTCxDQUFhLHFCQUFiLENBQXpCLENB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