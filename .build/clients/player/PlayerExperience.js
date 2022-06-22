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
      // mode: "streaming",
      // mode: "ambisonic",
      mode: "convolving",
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
      console.log("json files: " + this.parameters.dataFileName + " has been read"); // Instantiate the attribute 'this.range' to get datas' parameters

      this.Range(this.Sources.sourcesData.receivers.xyz); // Instanciate 'this.scale'

      this.scale = this.Scaling(this.range); // Get offset parameters of the display

      this.offset = {
        x: this.range.moyX,
        y: this.range.minY
      }; // Create, start and store the listener class

      this.Listener = new _Listener.default(this.offset, this.parameters);
      this.Listener.start(); // Start the sources display and audio depending on listener's initial position

      this.Sources.start(this.Listener.listenerPosition); // Load sources' sound depending on mode (some modes need RIRs in addition of sounds)

      switch (this.parameters.mode) {
        case 'debug':
        case 'streaming':
        case 'ambisonic':
          this.Sources.LoadSoundbank();
          break;

        case 'convolving':
        case 'ambiConvolving':
          this.Sources.LoadRirs();
          break;

        default:
          alert("No valid mode");
      } // Wait until audioBuffer has been loaded ("dataLoaded" event is create 'this.Sources.LoadSoundBank()')


      document.addEventListener("audioLoaded", () => {
        console.log("Audio buffers have been loaded from source: " + this.parameters.audioData); // Add event listener for resize window event to resize the display

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
        this.initialising = false; // Update initialising State
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwicGFyYW1ldGVycyIsIm9yZGVyIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiUmFuZ2UiLCJzb3VyY2VzRGF0YSIsInJlY2VpdmVycyIsInh5eiIsIlNjYWxpbmciLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwibGlzdGVuZXJQb3NpdGlvbiIsIkxvYWRTb3VuZGJhbmsiLCJMb2FkUmlycyIsIndpbmRvdyIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsInBvc2l0aW9ucyIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJsZW5ndGgiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwiZGlzcGF0Y2hFdmVudCIsIkV2ZW50IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0cmFuc2Zvcm0iLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG4vLyBpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpOyAgICAgLy8gVG8gbG9hZCBhdWRpb0J1ZmZlcnNcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTsgICAgICAgICAgICAgICAgICAgICAvLyBUbyBnZXQgZmlsZXNcbiAgICB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBzeW5jIGF1ZGlvIHNvdXJjZXNcbiAgICB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuXG4gICAgLy8gVmFyaWFibGUgcGFyYW1ldGVyc1xuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgIGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LCAgICAgICAgICAgICAgIC8vIEdsb2JhbCBhdWRpb0NvbnRleHRcbiAgICAgIG9yZGVyOiAyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9yZGVyIG9mIGFtYmlzb25pY3NcbiAgICAgIG5iQ2xvc2VzdFBvaW50czogNCwgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgZ2FpbkV4cG9zYW50OiAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhwb3NhbnQgb2YgdGhlIGdhaW5zICh0byBpbmNyZWFzZSBjb250cmFzdGUpXG4gICAgICAvLyBtb2RlOiBcImRlYnVnXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJkZWJ1Z1wiLCBcInN0cmVhbWluZ1wiLCBcImFtYmlzb25pY1wiLCBcImNvbnZvbHZpbmdcIiwgXCJhbWJpQ29udm9sdmluZ1wiKVxuICAgICAgLy8gbW9kZTogXCJzdHJlYW1pbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaXNvbmljXCIsXG4gICAgICBtb2RlOiBcImNvbnZvbHZpbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaUNvbnZvbHZpbmdcIixcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpYW1ldGVyIG9mIHNvdXJjZXMnIGRpc3BsYXlcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgICAgYXVkaW9EYXRhOiBcIlwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgYXVkaW9EYXRhcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3UgYXJlIHVzaW5nIFwiICsgdGhpcy5wYXJhbWV0ZXJzLm1vZGUgKyBcIiBtb2RlLlwiKTtcblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUyLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczMnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMy5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzNCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmU0Lmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgb2JqZWN0cyBzdG9yZXIgZm9yIHNvdXJjZXMgYW5kIGxvYWQgdGhlaXIgZmlsZURhdGFzXG4gICAgdGhpcy5Tb3VyY2VzID0gbmV3IFNvdXJjZXModGhpcy5maWxlc3lzdGVtLCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLCB0aGlzLnBhcmFtZXRlcnMsIHRoaXMucGxhdGZvcm0sIHRoaXMuc3luYylcbiAgICB0aGlzLlNvdXJjZXMuTG9hZERhdGEoKTtcblxuICAgIC8vIFdhaXQgdW50aWwgZGF0YSBoYXZlIGJlZW4gbG9hZGVkIGZyb20ganNvbiBmaWxlcyAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZERhdGEoKScpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRhdGFMb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICBjb25zb2xlLmxvZyhcImpzb24gZmlsZXM6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSArIFwiIGhhcyBiZWVuIHJlYWRcIik7XG5cbiAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBhdHRyaWJ1dGUgJ3RoaXMucmFuZ2UnIHRvIGdldCBkYXRhcycgcGFyYW1ldGVyc1xuICAgICAgdGhpcy5SYW5nZSh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLnh5eik7XG5cbiAgICAgIC8vIEluc3RhbmNpYXRlICd0aGlzLnNjYWxlJ1xuICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgIH07XG5cbiAgICAgIC8vIENyZWF0ZSwgc3RhcnQgYW5kIHN0b3JlIHRoZSBsaXN0ZW5lciBjbGFzc1xuICAgICAgdGhpcy5MaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcih0aGlzLm9mZnNldCwgdGhpcy5wYXJhbWV0ZXJzKTtcbiAgICAgIHRoaXMuTGlzdGVuZXIuc3RhcnQoKTtcblxuICAgICAgLy8gU3RhcnQgdGhlIHNvdXJjZXMgZGlzcGxheSBhbmQgYXVkaW8gZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgaW5pdGlhbCBwb3NpdGlvblxuICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7XG5cbiAgICAgIC8vIExvYWQgc291cmNlcycgc291bmQgZGVwZW5kaW5nIG9uIG1vZGUgKHNvbWUgbW9kZXMgbmVlZCBSSVJzIGluIGFkZGl0aW9uIG9mIHNvdW5kcylcbiAgICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgICAgY2FzZSAnZGVidWcnOlxuICAgICAgICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgICAgIHRoaXMuU291cmNlcy5Mb2FkU291bmRiYW5rKCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgICAgICB0aGlzLlNvdXJjZXMuTG9hZFJpcnMoKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2FpdCB1bnRpbCBhdWRpb0J1ZmZlciBoYXMgYmVlbiBsb2FkZWQgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWRTb3VuZEJhbmsoKScpXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYXVkaW9Mb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQXVkaW8gYnVmZmVycyBoYXZlIGJlZW4gbG9hZGVkIGZyb20gc291cmNlOiBcIiArIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEpO1xuXG4gICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIHdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcblxuICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIFJhbmdlKHBvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcblxuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0aGF0IGRpc3BsYXlzIGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG5cbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcblxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogeWVsbG93OyB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZSkvMn1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuXG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cbiAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9hYmwgY29udGFpbmVyc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgLy8gQWRkIG1vdXNlRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7ICAgICAgICAgLy8gVXBkYXRlIGJlZ2luIFN0YXRlIFxuXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gYXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIHNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQ3JlYXRlIGFuZCBkaXNwbGF5IG9iamVjdHNcbiAgICB0aGlzLlNvdXJjZXMuQ3JlYXRlU291cmNlcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgICAgLy8gQ3JlYXRlIHRoZSBzb3VyY2VzIGFuZCBkaXNwbGF5IHRoZW1cbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBsaXN0ZW5lcidzIGRpc3BsYXkgdG8gdGhlIGNvbnRhaW5lclxuICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInJlbmRlcmVkXCIpKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYW4gZXZlbnQgd2hlbiB0aGUgc2ltdWxhdGlvbiBhcHBlYXJlZFxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgbGlzdGVuZXIncyBwb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG5cbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5yYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxuXG4gICAgICAvLyBVcGRhdGUgb2JqZWN0cyBhbmQgdGhlaXIgZGlzcGxheVxuICAgICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIHZhbHVlIGlzIG91dCBvZiByYW5nZSwgc3RvcCB0aGUgTGlzdGVuZXIncyBQb3NpdGlvbiBVcGRhdGVcbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuXG4gICAgLy8gQ2hhbmdlIHNpemUgb2YgZGlzcGxheVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLm9mZnNldC55KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgLy8gVXBkYXRlIHNvdXJjZXMnIGRpc3BsYXlcbiAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyRGlzcGxheSh0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUNBO0FBRUEsTUFBTUEsZ0JBQU4sU0FBK0JDLDBCQUEvQixDQUFrRDtFQUNoREMsV0FBVyxDQUFDQyxNQUFELEVBQVNDLE1BQU0sR0FBRyxFQUFsQixFQUFzQkMsVUFBdEIsRUFBa0NDLFlBQWxDLEVBQWdEO0lBRXpELE1BQU1ILE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtFLEtBQUwsR0FBYSxJQUFiLENBTnlELENBUXpEOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QixDQVR5RCxDQVNTOztJQUNsRSxLQUFLQyxVQUFMLEdBQWtCLEtBQUtELE9BQUwsQ0FBYSxZQUFiLENBQWxCLENBVnlELENBVVM7O0lBQ2xFLEtBQUtFLElBQUwsR0FBWSxLQUFLRixPQUFMLENBQWEsTUFBYixDQUFaLENBWHlELENBV1M7O0lBQ2xFLEtBQUtHLFFBQUwsR0FBZ0IsS0FBS0gsT0FBTCxDQUFhLFVBQWIsQ0FBaEIsQ0FaeUQsQ0FZUztJQUVsRTs7SUFDQSxLQUFLSSxVQUFMLEdBQWtCO01BQ2hCUCxZQUFZLEVBQUVBLFlBREU7TUFDMEI7TUFDMUNRLEtBQUssRUFBRSxDQUZTO01BRTBCO01BQzFDQyxlQUFlLEVBQUUsQ0FIRDtNQUcwQjtNQUMxQ0MsWUFBWSxFQUFFLENBSkU7TUFJMEI7TUFDMUM7TUFDQTtNQUNBO01BQ0FDLElBQUksRUFBRSxZQVJVO01BU2hCO01BQ0FDLGNBQWMsRUFBRSxFQVZBO01BVTBCO01BQzFDQyxZQUFZLEVBQUUsRUFYRTtNQVcwQjtNQUMxQ0MsWUFBWSxFQUFFLEVBWkU7TUFZMEI7TUFDMUNDLFNBQVMs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