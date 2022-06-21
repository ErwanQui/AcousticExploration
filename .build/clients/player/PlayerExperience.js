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
        console.log("Audio buffers have been loaded from source: " + this.parameters.audioData); // Instantiate the attribute 'this.range' to get datas' parameters

        this.Range(this.Sources.sourcesData.receivers.xyz); // Instanciate 'this.scale'

        this.scale = this.Scaling(this.range); // Get offset parameters of the display

        this.offset = {
          x: this.range.moyX,
          y: this.range.minY
        }; // Create, start and store the listener class

        this.Listener = new _Listener.default(this.offset, this.parameters);
        this.Listener.start(); // Start the sources display and audio depending on listener's initial position

        this.Sources.start(this.Listener.listenerPosition); // Add event listener for resize window event to resize the display

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwicGFyYW1ldGVycyIsIm9yZGVyIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiTG9hZFNvdW5kYmFuayIsIkxvYWRSaXJzIiwiUmFuZ2UiLCJzb3VyY2VzRGF0YSIsInJlY2VpdmVycyIsInh5eiIsIlNjYWxpbmciLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwibGlzdGVuZXJQb3NpdGlvbiIsIndpbmRvdyIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsInBvc2l0aW9ucyIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJsZW5ndGgiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwiZGlzcGF0Y2hFdmVudCIsIkV2ZW50IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0cmFuc2Zvcm0iLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG4vLyBpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpOyAgICAgLy8gVG8gbG9hZCBhdWRpb0J1ZmZlcnNcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTsgICAgICAgICAgICAgICAgICAgICAvLyBUbyBnZXQgZmlsZXNcbiAgICB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBzeW5jIGF1ZGlvIHNvdXJjZXNcbiAgICB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuXG4gICAgLy8gVmFyaWFibGUgcGFyYW1ldGVyc1xuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgIGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LCAgICAgICAgICAgICAgIC8vIEdsb2JhbCBhdWRpb0NvbnRleHRcbiAgICAgIG9yZGVyOiAyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9yZGVyIG9mIGFtYmlzb25pY3NcbiAgICAgIG5iQ2xvc2VzdFBvaW50czogNCwgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgZ2FpbkV4cG9zYW50OiAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhwb3NhbnQgb2YgdGhlIGdhaW5zICh0byBpbmNyZWFzZSBjb250cmFzdGUpXG4gICAgICAvLyBtb2RlOiBcImRlYnVnXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJkZWJ1Z1wiLCBcInN0cmVhbWluZ1wiLCBcImFtYmlzb25pY1wiLCBcImNvbnZvbHZpbmdcIiwgXCJhbWJpQ29udm9sdmluZ1wiKVxuICAgICAgbW9kZTogXCJzdHJlYW1pbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaXNvbmljXCIsXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaUNvbnZvbHZpbmdcIixcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpYW1ldGVyIG9mIHNvdXJjZXMnIGRpc3BsYXlcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgICAgYXVkaW9EYXRhOiBcIlwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgYXVkaW9EYXRhcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3UgYXJlIHVzaW5nIFwiICsgdGhpcy5wYXJhbWV0ZXJzLm1vZGUgKyBcIiBtb2RlLlwiKTtcblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUyLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczMnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMy5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzNCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmU0Lmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgb2JqZWN0cyBzdG9yZXIgZm9yIHNvdXJjZXMgYW5kIGxvYWQgdGhlaXIgZmlsZURhdGFzXG4gICAgdGhpcy5Tb3VyY2VzID0gbmV3IFNvdXJjZXModGhpcy5maWxlc3lzdGVtLCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLCB0aGlzLnBhcmFtZXRlcnMsIHRoaXMucGxhdGZvcm0sIHRoaXMuc3luYylcbiAgICB0aGlzLlNvdXJjZXMuTG9hZERhdGEoKTtcblxuICAgIC8vIFdhaXQgdW50aWwgZGF0YSBoYXZlIGJlZW4gbG9hZGVkIGZyb20ganNvbiBmaWxlcyAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZERhdGEoKScpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRhdGFMb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICBjb25zb2xlLmxvZyhcImpzb24gZmlsZXM6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSArIFwiIGhhcyBiZWVuIHJlYWRcIik7XG5cbiAgICAgIC8vIExvYWQgc291cmNlcycgc291bmQgZGVwZW5kaW5nIG9uIG1vZGUgKHNvbWUgbW9kZXMgbmVlZCBSSVJzIGluIGFkZGl0aW9uIG9mIHNvdW5kcylcbiAgICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgICAgY2FzZSAnZGVidWcnOlxuICAgICAgICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgICAgIHRoaXMuU291cmNlcy5Mb2FkU291bmRiYW5rKCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgICAgICB0aGlzLlNvdXJjZXMuTG9hZFJpcnMoKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2FpdCB1bnRpbCBhdWRpb0J1ZmZlciBoYXMgYmVlbiBsb2FkZWQgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWRTb3VuZEJhbmsoKScpXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYXVkaW9Mb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQXVkaW8gYnVmZmVycyBoYXZlIGJlZW4gbG9hZGVkIGZyb20gc291cmNlOiBcIiArIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEpO1xuXG4gICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBhdHRyaWJ1dGUgJ3RoaXMucmFuZ2UnIHRvIGdldCBkYXRhcycgcGFyYW1ldGVyc1xuICAgICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6KTtcblxuICAgICAgICAvLyBJbnN0YW5jaWF0ZSAndGhpcy5zY2FsZSdcbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgICAgICAvLyBHZXQgb2Zmc2V0IHBhcmFtZXRlcnMgb2YgdGhlIGRpc3BsYXlcbiAgICAgICAgdGhpcy5vZmZzZXQgPSB7XG4gICAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucmFuZ2UubWluWVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENyZWF0ZSwgc3RhcnQgYW5kIHN0b3JlIHRoZSBsaXN0ZW5lciBjbGFzc1xuICAgICAgICB0aGlzLkxpc3RlbmVyID0gbmV3IExpc3RlbmVyKHRoaXMub2Zmc2V0LCB0aGlzLnBhcmFtZXRlcnMpO1xuICAgICAgICB0aGlzLkxpc3RlbmVyLnN0YXJ0KCk7XG5cbiAgICAgICAgLy8gU3RhcnQgdGhlIHNvdXJjZXMgZGlzcGxheSBhbmQgYXVkaW8gZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgaW5pdGlhbCBwb3NpdGlvblxuICAgICAgICB0aGlzLlNvdXJjZXMuc3RhcnQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTtcblxuICAgICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSB3aW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG5cbiAgICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcblxuICAgICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBSYW5nZShwb3NpdGlvbnMpIHsgLy8gU3RvcmUgdGhlIGFycmF5IHByb3BlcnRpZXMgaW4gJ3RoaXMucmFuZ2UnXG5cbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IHBvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IHBvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdGhhdCBkaXNwbGF5cyBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVgsICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG5cbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoLXRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUpLzJ9cHgsICR7dGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcblxuICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuXG4gICAgICAgICAgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHRvIGJlZ2luIHRoZSBzaW11bGF0aW9uXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cbiAgICAgICAgICAvLyBBc3NpZ24gZ2xvYWJsIGNvbnRhaW5lcnNcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKClcblxuICAgICAgICAgIC8vIEFkZCBtb3VzZUV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgLy8gQWRkIHRvdWNoRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcblxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIGF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBzb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIENyZWF0ZSBhbmQgZGlzcGxheSBvYmplY3RzXG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlcyBhbmQgZGlzcGxheSB0aGVtXG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIncyBkaXNwbGF5IHRvIHRoZSBjb250YWluZXJcbiAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZW5kZXJlZFwiKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGV2ZW50IHdoZW4gdGhlIHNpbXVsYXRpb24gYXBwZWFyZWRcbiAgfVxuXG4gIHVzZXJBY3Rpb24obW91c2UpIHsgLy8gQ2hhbmdlIGxpc3RlbmVyJ3MgcG9zaXRpb24gd2hlbiB0aGUgbW91c2UgaGFzIGJlZW4gdXNlZFxuXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICB2YXIgdGVtcFggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yKS8odGhpcy5zY2FsZSk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5yYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmdcIilcblxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXlcbiAgICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXIobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplIG9mIGRpc3BsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5vZmZzZXQueSp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLm9mZnNldC54KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweClcIjtcblxuICAgIHRoaXMuU291cmNlcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24odGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgIC8vIFVwZGF0ZSBzb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lckRpc3BsYXkodGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7QUFDQTtBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDQyxZQUFsQyxFQUFnRDtJQUV6RCxNQUFNSCxNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLRSxLQUFMLEdBQWEsSUFBYixDQU55RCxDQVF6RDs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FUeUQsQ0FTUzs7SUFDbEUsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVZ5RCxDQVVTOztJQUNsRSxLQUFLRSxJQUFMLEdBQVksS0FBS0YsT0FBTCxDQUFhLE1BQWIsQ0FBWixDQVh5RCxDQVdTOztJQUNsRSxLQUFLRyxRQUFMLEdBQWdCLEtBQUtILE9BQUwsQ0FBYSxVQUFiLENBQWhCLENBWnlELENBWVM7SUFFbEU7O0lBQ0EsS0FBS0ksVUFBTCxHQUFrQjtNQUNoQlAsWUFBWSxFQUFFQSxZQURFO01BQzBCO01BQzFDUSxLQUFLLEVBQUUsQ0FGUztNQUUwQjtNQUMxQ0MsZUFBZSxFQUFFLENBSEQ7TUFHMEI7TUFDMUNDLFlBQVksRUFBRSxDQUpFO01BSTBCO01BQzFDO01BQ0FDLElBQUksRUFBRSxXQU5VO01BT2hCO01BQ0E7TUFDQTtNQUNBQyxjQUFjLEVBQUUsRUFWQTtNQVUwQjtNQUMxQ0MsWUFBWSxFQUFFLEVBWEU7TUFXMEI7TUFDMUNDLFlBQVks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