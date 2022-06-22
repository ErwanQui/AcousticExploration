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
    // Variable parameters

    this.parameters = {
      audioContext: audioContext,
      // Global audioContext
      order: 2,
      // Order of ambisonics
      nbClosestPoints: 4,
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
        this.parameters.audioData = 'AudioFiles1';
        this.parameters.dataFileName = 'scene1.json';
        break;

      case 'ambisonic':
        this.parameters.audioData = 'AudioFiles2';
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


    this.Sources = new _Sources.default(this.filesystem, this.audioBufferLoader, this.parameters, this.platform, this.sync);
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

      this.Range(this.Sources.sourcesData.receivers.xyz); // Instanciate 'this.scale'

      this.scale = this.Scaling(this.range); // Get offset parameters of the display

      this.offset = {
        x: this.range.moyX,
        y: this.range.minY
      }; // Create, start and store the listener class

      this.Listener = new _Listener.default(this.offset, this.parameters);
      this.Listener.start();
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
          <div id="circleContainer" style="text-align: center; position: absolute; left: 50%">
            <div id="selector" style="position: absolute;
              height: ${this.range.rangeY * this.scale}px;
              width: ${this.range.rangeX * this.scale}px;
              background: yellow; z-index: 0;
              transform: translate(${-this.range.rangeX * this.scale / 2}px, ${this.parameters.circleDiameter / 2}px);">
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
    this.Sources.CreateSources(this.container, this.scale, this.offset); // Create the sources and display them

    this.Listener.Display(this.container); // Add the listener's display to the container

    this.render(); // Update the display

    document.dispatchEvent(new Event("rendered")); // Create an event when the simulation appeared
  }

  userAction(mouse) {
    // Change listener's position when the mouse has been used
    // Get the new potential listener's position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale;
    var tempY = this.range.minY + (mouse.clientY - this.parameters.circleDiameter / 2) / this.scale; // Check if the value is in the values range

    if (tempX >= this.range.minX && tempX <= this.range.maxX && tempY >= this.range.minY && tempY <= this.range.maxY) {
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
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwicGFyYW1ldGVycyIsIm9yZGVyIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiUmFuZ2UiLCJzb3VyY2VzRGF0YSIsInJlY2VpdmVycyIsInh5eiIsIlNjYWxpbmciLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwibGlzdGVuZXJQb3NpdGlvbiIsIndpbmRvdyIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsInBvc2l0aW9ucyIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJsZW5ndGgiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwiZGlzcGF0Y2hFdmVudCIsIkV2ZW50IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0cmFuc2Zvcm0iLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG4vLyBpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpOyAgICAgLy8gVG8gbG9hZCBhdWRpb0J1ZmZlcnNcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTsgICAgICAgICAgICAgICAgICAgICAvLyBUbyBnZXQgZmlsZXNcbiAgICB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBzeW5jIGF1ZGlvIHNvdXJjZXNcbiAgICB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuXG4gICAgLy8gVmFyaWFibGUgcGFyYW1ldGVyc1xuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgIGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LCAgICAgICAgICAgICAgIC8vIEdsb2JhbCBhdWRpb0NvbnRleHRcbiAgICAgIG9yZGVyOiAyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9yZGVyIG9mIGFtYmlzb25pY3NcbiAgICAgIG5iQ2xvc2VzdFBvaW50czogNCwgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgZ2FpbkV4cG9zYW50OiAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhwb3NhbnQgb2YgdGhlIGdhaW5zICh0byBpbmNyZWFzZSBjb250cmFzdGUpXG4gICAgICAvLyBtb2RlOiBcImRlYnVnXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJkZWJ1Z1wiLCBcInN0cmVhbWluZ1wiLCBcImFtYmlzb25pY1wiLCBcImNvbnZvbHZpbmdcIiwgXCJhbWJpQ29udm9sdmluZ1wiKVxuICAgICAgbW9kZTogXCJzdHJlYW1pbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaXNvbmljXCIsXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaUNvbnZvbHZpbmdcIixcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpYW1ldGVyIG9mIHNvdXJjZXMnIGRpc3BsYXlcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgICAgYXVkaW9EYXRhOiBcIlwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgYXVkaW9EYXRhcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3UgYXJlIHVzaW5nIFwiICsgdGhpcy5wYXJhbWV0ZXJzLm1vZGUgKyBcIiBtb2RlLlwiKTtcblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUyLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczMnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMy5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzNCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmU0Lmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgb2JqZWN0cyBzdG9yZXIgZm9yIHNvdXJjZXMgYW5kIGxvYWQgdGhlaXIgZmlsZURhdGFzXG4gICAgdGhpcy5Tb3VyY2VzID0gbmV3IFNvdXJjZXModGhpcy5maWxlc3lzdGVtLCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLCB0aGlzLnBhcmFtZXRlcnMsIHRoaXMucGxhdGZvcm0sIHRoaXMuc3luYylcbiAgICB0aGlzLlNvdXJjZXMuTG9hZERhdGEoKTtcblxuICAgIC8vIFdhaXQgdW50aWwgZGF0YSBoYXZlIGJlZW4gbG9hZGVkIGZyb20ganNvbiBmaWxlcyAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZERhdGEoKScpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRhdGFMb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICBjb25zb2xlLmxvZyhcImpzb24gZmlsZXM6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSArIFwiIGhhcyBiZWVuIHJlYWRcIik7XG5cbiAgICAgIC8vIExvYWQgc291cmNlcycgc291bmQgZGVwZW5kaW5nIG9uIG1vZGUgKHNvbWUgbW9kZXMgbmVlZCBSSVJzIGluIGFkZGl0aW9uIG9mIHNvdW5kcylcbiAgICAgIC8vIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIC8vICAgY2FzZSAnZGVidWcnOlxuICAgICAgLy8gICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgLy8gICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgLy8gICAgIHRoaXMuU291cmNlcy5Mb2FkU291bmRiYW5rKCk7XG4gICAgICAvLyAgICAgYnJlYWs7XG5cbiAgICAgIC8vICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAvLyAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgIC8vICAgICB0aGlzLlNvdXJjZXMuTG9hZFJpcnMoKTtcbiAgICAgIC8vICAgICBicmVhaztcblxuICAgICAgLy8gICBkZWZhdWx0OlxuICAgICAgLy8gICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICAgIC8vIH1cblxuICAgICAgLy8gV2FpdCB1bnRpbCBhdWRpb0J1ZmZlciBoYXMgYmVlbiBsb2FkZWQgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWRTb3VuZEJhbmsoKScpXG4gICAgICAvLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYXVkaW9Mb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQXVkaW8gYnVmZmVycyBoYXZlIGJlZW4gbG9hZGVkIGZyb20gc291cmNlOiBcIiArIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEpO1xuXG4gICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBhdHRyaWJ1dGUgJ3RoaXMucmFuZ2UnIHRvIGdldCBkYXRhcycgcGFyYW1ldGVyc1xuICAgICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6KTtcblxuICAgICAgICAvLyBJbnN0YW5jaWF0ZSAndGhpcy5zY2FsZSdcbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgICAgICAvLyBHZXQgb2Zmc2V0IHBhcmFtZXRlcnMgb2YgdGhlIGRpc3BsYXlcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB7XG4gICAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucmFuZ2UubWluWVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENyZWF0ZSwgc3RhcnQgYW5kIHN0b3JlIHRoZSBsaXN0ZW5lciBjbGFzc1xuICAgICAgICB0aGlzLkxpc3RlbmVyID0gbmV3IExpc3RlbmVyKHRoaXMub2Zmc2V0LCB0aGlzLnBhcmFtZXRlcnMpO1xuICAgICAgICB0aGlzLkxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaWNpXCIpXG4gICAgICAgIC8vIFN0YXJ0IHRoZSBzb3VyY2VzIGRpc3BsYXkgYW5kIGF1ZGlvIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIGluaXRpYWwgcG9zaXRpb25cbiAgICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7XG4gICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIHdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgY29uc29sZS5sb2coXCJiYWggb3VpXCIpXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG5cbiAgICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcblxuICAgICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH1cblxuICBSYW5nZShwb3NpdGlvbnMpIHsgLy8gU3RvcmUgdGhlIGFycmF5IHByb3BlcnRpZXMgaW4gJ3RoaXMucmFuZ2UnXG5cbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IHBvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IHBvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdGhhdCBkaXNwbGF5cyBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVgsICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG5cbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoLXRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUpLzJ9cHgsICR7dGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuXG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cbiAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9hYmwgY29udGFpbmVyc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgLy8gQWRkIG1vdXNlRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7ICAgICAgICAgLy8gVXBkYXRlIGJlZ2luIFN0YXRlIFxuXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIGF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBzb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIENyZWF0ZSBhbmQgZGlzcGxheSBvYmplY3RzXG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlcyBhbmQgZGlzcGxheSB0aGVtXG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIncyBkaXNwbGF5IHRvIHRoZSBjb250YWluZXJcbiAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZW5kZXJlZFwiKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGV2ZW50IHdoZW4gdGhlIHNpbXVsYXRpb24gYXBwZWFyZWRcbiAgfVxuXG4gIHVzZXJBY3Rpb24obW91c2UpIHsgLy8gQ2hhbmdlIGxpc3RlbmVyJ3MgcG9zaXRpb24gd2hlbiB0aGUgbW91c2UgaGFzIGJlZW4gdXNlZFxuXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICB2YXIgdGVtcFggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yKS8odGhpcy5zY2FsZSk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5yYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmdcIilcblxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXlcbiAgICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXIobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplIG9mIGRpc3BsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5vZmZzZXQueSp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLm9mZnNldC54KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweClcIjtcblxuICAgIHRoaXMuU291cmNlcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24odGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgIC8vIFVwZGF0ZSBzb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lckRpc3BsYXkodGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7QUFDQTtBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDQyxZQUFsQyxFQUFnRDtJQUV6RCxNQUFNSCxNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLRSxLQUFMLEdBQWEsSUFBYixDQU55RCxDQVF6RDs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FUeUQsQ0FTUzs7SUFDbEUsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVZ5RCxDQVVTOztJQUNsRSxLQUFLRSxJQUFMLEdBQVksS0FBS0YsT0FBTCxDQUFhLE1BQWIsQ0FBWixDQVh5RCxDQVdTOztJQUNsRSxLQUFLRyxRQUFMLEdBQWdCLEtBQUtILE9BQUwsQ0FBYSxVQUFiLENBQWhCLENBWnlELENBWVM7SUFFbEU7O0lBQ0EsS0FBS0ksVUFBTCxHQUFrQjtNQUNoQlAsWUFBWSxFQUFFQSxZQURFO01BQzBCO01BQzFDUSxLQUFLLEVBQUUsQ0FGUztNQUUwQjtNQUMxQ0MsZUFBZSxFQUFFLENBSEQ7TUFHMEI7TUFDMUNDLFlBQVksRUFBRSxDQUpFO01BSTBCO01BQzFDO01BQ0FDLElBQUksRUFBRSxXQU5VO01B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