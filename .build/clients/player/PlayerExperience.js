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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwibmJDbG9zZXN0RGV0ZWN0U291cmNlcyIsIm5iQ2xvc2VzdEFjdGl2U291cmNlcyIsImdhaW5FeHBvc2FudCIsIm1vZGUiLCJjaXJjbGVEaWFtZXRlciIsImxpc3RlbmVyU2l6ZSIsImRhdGFGaWxlTmFtZSIsImF1ZGlvRGF0YSIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsIm1vdXNlRG93biIsInRvdWNoZWQiLCJMaXN0ZW5lciIsIlNvdXJjZXMiLCJyYW5nZSIsInNjYWxlIiwib2Zmc2V0IiwiY29udGFpbmVyIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJjb25zb2xlIiwiZXJyb3IiLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic2NlbmUiLCJpbWFnZSIsIlJhbmdlIiwic291cmNlc0RhdGEiLCJyZWNlaXZlcnMiLCJ4eXoiLCJzb3VyY2VzX3h5IiwiZXh0cmVtdW0iLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImxvZyIsIlVwZGF0ZVNjZW5lRGlzcGxheSIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJpbWFnZUV4dHJlbXVtIiwibWluWCIsIm1heFgiLCJtYXhZIiwicmFuZ2VYIiwicmFuZ2VZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImh0bWwiLCJ0eXBlIiwiaWQiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNoYW5nZWRUb3VjaGVzIiwiQ3JlYXRlSW5zdHJ1bWVudHMiLCJDcmVhdGVTb3VyY2VzIiwiRGlzcGxheSIsImluc3RydW1lbnRzIiwicHVzaCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJtYXJnaW4iLCJ3aWR0aCIsImhlaWdodCIsImJvcmRlclJhZGl1cyIsImxpbmVIZWlnaHQiLCJiYWNrZ3JvdW5kIiwiekluZGV4IiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJSZXNldCIsIlZQb3MyUGl4ZWwiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJVcGRhdGVMaXN0ZW5lckRpc3BsYXkiLCJVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcbmltcG9ydCBTb3VyY2VzIGZyb20gJy4vU291cmNlcy5qcydcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnNcbiAgICAvLyBAbm90ZTogY291bGQgYmUgYSBnb29kIGlkZWEgdG8gY3JlYXRlIGEgcGx1Z2luIG9iamVjdFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTsgICAgIC8vIFRvIGxvYWQgYXVkaW9CdWZmZXJzXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7ICAgICAgICAgICAgICAgICAgICAgLy8gVG8gZ2V0IGZpbGVzXG4gICAgdGhpcy5zeW5jID0gdGhpcy5yZXF1aXJlKCdzeW5jJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3luYyBhdWRpbyBzb3VyY2VzXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHRoaXMucmVxdWlyZSgncGxhdGZvcm0nKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcbiAgICB0aGlzLmF1ZGlvU3RyZWFtID0gdGhpcy5yZXF1aXJlKCdhdWRpby1zdHJlYW1zJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgLy8gb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0RGV0ZWN0U291cmNlczogMywgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIGRldGVjdGVkXG4gICAgICBuYkNsb3Nlc3RBY3RpdlNvdXJjZXM6IDMsICAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgY2xvc2VzdCBwb2ludHMgdXNlZCBhcyBhY3RpdmUgYXVkaW9Tb3VyY2VzXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiLCBcImFtYmlDb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcInN0cmVhbWluZ1wiLFxuICAgICAgbW9kZTogXCJhbWJpc29uaWNcIixcbiAgICAgIC8vIG1vZGU6IFwiY29udm9sdmluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpQ29udm9sdmluZ1wiLFxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlhbWV0ZXIgb2Ygc291cmNlcycgZGlzcGxheVxuICAgICAgbGlzdGVuZXJTaXplOiAxNiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2l6ZSBvZiBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIHNvdXJjZXMnIHBvc2l0aW9uIGFuZCBhdWRpb0RhdGFzJyBmaWxlbmFtZXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgICBhdWRpb0RhdGE6IFwiXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBhdWRpb0RhdGFzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTsgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIGV2ZW50IGxpc3RlbmVyIGhhdm4ndCBiZWVuIGluaXRpYXRlZFxuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIGJlZ2luQnV0dG9uIGhhcyBhbHJlYWR5IGJlZW4gcHJlc3NlZFxuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIG1vdXNlIGlzIHByZXNzZWQgKGNvbXB1dGVyKVxuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlOyAgICAgICAgICAgICAgICAgICAgICAgLy8gQXR0cmlidXRlIHRvIGtub3cgaWYgdGhlIHNjcmVlbiBpcyB0b3VjaGVkIChkZXZpY2UpXG5cbiAgICAvLyBJbnN0YW5jaWF0ZSBjbGFzc2VzJyBzdG9yZXJcbiAgICB0aGlzLkxpc3RlbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnTGlzdGVuZXInIGNsYXNzXG4gICAgdGhpcy5Tb3VyY2VzOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ1NvdXJjZXMnIGNsYXNzXG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5vZmZzZXQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPZmZzZXQgb2YgdGhlIGRpc3BsYXlcbiAgICB0aGlzLmNvbnRhaW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgY29udGFpbmVyIG9mIGRpc3BsYXkgZWxlbWVudHMgKGNyZWF0ZXMgaW4gJ3JlbmRlcigpJylcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcblxuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBDaGVja1xuICAgIGlmICh0aGlzLnBhcmFtZXRlcnMubmJDbG9zZXN0RGV0ZWN0U291cmNlcyA8IHRoaXMucGFyYW1ldGVycy5uYkNsb3Nlc3RBY3RpdlNvdXJjZXMpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJUaGUgbnVtYmVyIG9mIGRldGVjdGVkIHNvdXJjZXMgbXVzdCBiZSBoaWdoZXIgdGhhbiB0aGUgbnVtYmVyIG9mIHVzZWQgc291cmNlc1wiKVxuICAgIH1cblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc011c2ljMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNQaWFubyc7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmVQaWFuby5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczInO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNTcGVlY2gxJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzTXVzaWMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTIuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUzLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXM0JztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTQuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIHN0b3JlciBmb3Igc291cmNlcyBhbmQgbG9hZCB0aGVpciBmaWxlRGF0YXNcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycywgdGhpcy5wbGF0Zm9ybSwgdGhpcy5zeW5jLCB0aGlzLmF1ZGlvU3RyZWFtKVxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgIC8vIEdldCBiYWNrZ3JvdW5kIGh0bWwgY29kZVxuICAgICAgdGhpcy5zY2VuZSA9IHRoaXMuU291cmNlcy5pbWFnZTtcblxuICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6LCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLmV4dHJlbXVtKTtcblxuICAgICAgLy8gSW5zdGFuY2lhdGUgJ3RoaXMuc2NhbGUnXG4gICAgICAvLyB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLmV4dHJlbXVtKTsgXG5cbiAgICAgIC8vIEdldCBvZmZzZXQgcGFyYW1ldGVycyBvZiB0aGUgZGlzcGxheVxuICAgICAgdGhpcy5vZmZzZXQgPSB7XG4gICAgICAgIHg6IHRoaXMuZXh0cmVtdW0ubW95WCxcbiAgICAgICAgeTogdGhpcy5leHRyZW11bS5taW5ZXG4gICAgICB9O1xuXG4gICAgICB2YXIgbGlzdGVuZXJJbml0UG9zID0ge1xuICAgICAgICB4OiB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WCxcbiAgICAgICAgeTogdGhpcy5wb3NpdGlvblJhbmdlLm1pbllcbiAgICAgIH07XG5cbiAgICAgIC8vIENyZWF0ZSwgc3RhcnQgYW5kIHN0b3JlIHRoZSBsaXN0ZW5lciBjbGFzcyBvYmplY3RcbiAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIobGlzdGVuZXJJbml0UG9zLCB0aGlzLnBhcmFtZXRlcnMpO1xuICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCh0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7XG4gICAgICAvLyBTdGFydCB0aGUgc291cmNlcyBkaXNwbGF5IGFuZCBhdWRpbyBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBpbml0aWFsIHBvc2l0aW9uXG4gICAgICB0aGlzLlNvdXJjZXMuc3RhcnQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTtcblxuICAgICAgLy8gQWRkIGFuIGV2ZW50IGxpc3RlbmVyIGRpc3BhdGNoZWQgZnJvbSBcIkxpc3RlbmVyLmpzXCIgd2hlbiB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIgY2hhbmdlZFxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTW92aW5nJywgKCkgPT4ge1xuICAgICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKVxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSlcbiAgICAgIFxuICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgd2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcblxuICAgICAgICAvLyB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLmV4dHJlbXVtKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuc2NhbGUpXG5cbiAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gc3RhdGVcbiAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pXG5cbiAgICAgIC8vIFJlc2l6ZSBiYWNrZ3JvdW5kXG4gICAgICB0aGlzLlVwZGF0ZVNjZW5lRGlzcGxheSgpXG5cbiAgICAgIC8vIERpc3BsYXlcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG4gIH1cblxuICBSYW5nZShhdWRpb1NvdXJjZXNQb3NpdGlvbnMsIHNvdXJjZXNQb3NpdGlvbnMsIGltYWdlRXh0cmVtdW0pIHsgLy8gU3RvcmUgdGhlIGFycmF5IHByb3BlcnRpZXMgaW4gJ3RoaXMucmFuZ2UnXG4gICAgLy8gQG5vdGU6IHRoYXQgY2FuIGJlIHByb2JhYmx5IGJlIGRvbmUgaW4gYSBtb3JlIHByZXR0eSB3YXlcblxuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBjb25zb2xlLmxvZyhpbWFnZUV4dHJlbXVtKVxuICAgIHRoaXMuZXh0cmVtdW0gPSB7XG4gICAgICBtaW5YOiBpbWFnZUV4dHJlbXVtWzBdLngsXG4gICAgICBtYXhYOiBpbWFnZUV4dHJlbXVtWzFdLngsXG4gICAgICBtaW5ZOiBpbWFnZUV4dHJlbXVtWzBdLnksIFxuICAgICAgbWF4WTogaW1hZ2VFeHRyZW11bVsxXS55LFxuICAgIH1cblxuICAgIHRoaXMuZXh0cmVtdW0ucmFuZ2VYID0gdGhpcy5leHRyZW11bS5tYXhYIC0gdGhpcy5leHRyZW11bS5taW5YO1xuICAgIHRoaXMuZXh0cmVtdW0ubW95WCA9ICh0aGlzLmV4dHJlbXVtLm1heFggKyB0aGlzLmV4dHJlbXVtLm1pblgpLzI7XG4gICAgdGhpcy5leHRyZW11bS5yYW5nZVkgPSB0aGlzLmV4dHJlbXVtLm1heFkgLSB0aGlzLmV4dHJlbXVtLm1pblk7XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGF1ZGlvU291cmNlc1Bvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gc291cmNlc1Bvc2l0aW9uc1tpXS54O1xuXG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcblxuICAgIC8vIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVkpO1xuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCkvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0KS9yYW5nZVZhbHVlcy5yYW5nZVkpO1xuICAgIHJldHVybiAoc2NhbGUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdiBpZD1cImluc3RydW1lbnRDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsodGhpcy5yYW5nZS5taW5YIC0gdGhpcy5leHRyZW11bS5taW5YIC0gdGhpcy5leHRyZW11bS5yYW5nZVgvMikqdGhpcy5zY2FsZX1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwic2NlbmVcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgbGVmdDogNTAlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoLXRoaXMuZXh0cmVtdW0ucmFuZ2VYLzIpKnRoaXMuc2NhbGV9cHgsIDBweCk7XCI+XG4gICAgICAgICAgICAke3RoaXMuc2NlbmV9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucG9zaXRpb25SYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoKHRoaXMucG9zaXRpb25SYW5nZS5taW5YIC0gdGhpcy5leHRyZW11bS5taW5YIC0gdGhpcy5leHRyZW11bS5yYW5nZVgvMikqdGhpcy5zY2FsZSl9cHgsICR7KHRoaXMucG9zaXRpb25SYW5nZS5taW5ZIC0gdGhpcy5leHRyZW11bS5taW5ZKSp0aGlzLnNjYWxlICsgdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7ICAgICAgICAgIC8vIFVwZGF0ZSBpbml0aWFsaXNpbmcgc3RhdGVcblxuICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuXG4gICAgICAgICAgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHRvIGJlZ2luIHRoZSBzaW11bGF0aW9uXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cbiAgICAgICAgICAvLyBBc3NpZ24gZ2xvYmFsIGNvbnRhaW5lcnNcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKClcblxuICAgICAgICAgIC8vIEFkZCBtb3VzZUV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgLy8gQWRkIHRvdWNoRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBzdGF0ZSBcblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKCkgeyAvLyBCZWdpbiBhdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgc291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XG5cbiAgICAvLyBDcmVhdGUgYW5kIGRpc3BsYXkgb2JqZWN0c1xuICAgIHRoaXMuQ3JlYXRlSW5zdHJ1bWVudHMoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIGluc3RydW1lbnRzIGFuZCBkaXNwbGF5IHRoZW1cbiAgICB0aGlzLlNvdXJjZXMuQ3JlYXRlU291cmNlcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgICAgLy8gQ3JlYXRlIHRoZSBzb3VyY2VzIGFuZCBkaXNwbGF5IHRoZW1cbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBsaXN0ZW5lcidzIGRpc3BsYXkgdG8gdGhlIGNvbnRhaW5lclxuICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgfVxuXG4gIENyZWF0ZUluc3RydW1lbnRzKCkgeyAvLyBDcmVhdGUgdGhlIGluc3RydW1lbnRzIGFuZCBhZGQgdGhlbSB0byB0aGUgc2NlbmUgZGlzcGxheVxuXG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnN0cnVtZW50Q29udGFpbmVyJylcbiAgICB2YXIgY2lyY2xlRGlhbWV0ZXIgPSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXI7XG4gICAgdGhpcy5pbnN0cnVtZW50cyA9IFtdXG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5Lmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgIHRoaXMuaW5zdHJ1bWVudHMucHVzaChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSk7ICAgICAgIC8vIENyZWF0ZSBhIG5ldyBlbGVtZW50XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLmlkID0gXCJpbnN0cnVtZW50XCIgKyBpOyAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIGlkXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLmlubmVySFRNTCA9IFwiU1wiOyAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIHZhbHVlIChpKzEpXG5cbiAgICAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5tYXJnaW4gPSBcIjAgXCIgKyAoLWNpcmNsZURpYW1ldGVyLzIpICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS53aWR0aCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5oZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYm9yZGVyUmFkaXVzID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmxpbmVIZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnpJbmRleCA9IDE7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuXG4gICAgICAvLyBBZGQgdGhlIGNpcmNsZSdzIGRpc3BsYXkgdG8gdGhlIGdsb2JhbCBjb250YWluZXJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmluc3RydW1lbnRzW2ldKTtcbiAgICB9XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBsaXN0ZW5lcidzIHBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlL3RvdWNoIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5leHRyZW11bS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5leHRyZW11bS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMikvKHRoaXMuc2NhbGUpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmdcIik7XG5cbiAgICAgIC8vIFVwZGF0ZSBvYmplY3RzIGFuZCB0aGVpciBkaXNwbGF5ICAgICAgICAgICAgICBcbiAgICAgIHRoaXMuTGlzdGVuZXIuUmVzZXQobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgdGhlIGxpc3RlbmVyIGF0IHRoZSBuZXcgcG9zaXRpb25cbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEaXNwbGF5XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIGFjdGlvblxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cbiAgICAvLyBDaGFuZ2Ugc2l6ZSBvZiB0aGUgc2VsZWN0b3IgZGlzcGxheVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLm9mZnNldC55KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuXG4gICAgLy8gQ2hhbmdlIG90aGVyIGdsb2JhbCBkaXNwbGF5c1xuICAgIHRoaXMuU291cmNlcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24odGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgIC8vIFVwZGF0ZSBzb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lckRpc3BsYXkodGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICAgIHRoaXMuVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5KCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBpbnN0cnVtZW50J3MgZGlzcGxheVxuICAgIHRoaXMuVXBkYXRlU2NlbmVEaXNwbGF5KCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBzY2VuZSdzIGRpc3BsYXlcbiAgfVxuXG4gIFVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpIHsgLy8gVXBkYXRlIHRoZSBwb3NpdGlvbiBvZiB0aGUgaW5zdHJ1bWVudHNcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuICAgIH1cbiAgfVxuICBVcGRhdGVTY2VuZURpc3BsYXkoKSB7IC8vIFVwZGF0ZSB0aGUgcG9zaXRpb24gb2YgdGhlIGluc3RydW1lbnRzXG4gICAgICB0aGlzLnNjZW5lLndpZHRoID0gdGhpcy5leHRyZW11bS5yYW5nZVgqdGhpcy5zY2FsZVxuICAgICAgdGhpcy5zY2VuZS5oZWlnaHQgPSB0aGlzLmV4dHJlbXVtLnJhbmdlWSp0aGlzLnNjYWxlXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDQyxZQUFsQyxFQUFnRDtJQUV6RCxNQUFNSCxNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLRSxLQUFMLEdBQWEsSUFBYixDQU55RCxDQVF6RDtJQUNBOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QixD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