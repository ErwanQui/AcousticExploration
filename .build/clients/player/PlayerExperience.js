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
    // this.sync = this.require('sync');                                 // To sync audio sources
    // this.platform = this.require('platform');                         // To manage plugin for the sync
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
      // mode: "convolving",
      mode: "ambiConvolving",
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
    } // Sync ?
    // const getTimeFunction = () => this.sync.getSyncTime();
    // const currentTimeToAudioTimeFunction =
    //   currentTime => this.sync.getLocalTime(currentTime);
    // this.scheduler = new Scheduler(getTimeFunction, {
    //   currentTimeToAudioTimeFunction
    // });
    // // define simple engines for the scheduler
    // this.metroAudio = {
    //   // `currentTime` is the current time of the scheduler (aka the syncTime)
    //   // `audioTime` is the audioTime as computed by `currentTimeToAudioTimeFunction`
    //   // `dt` is the time between the actual call of the function and the time of the
    //   // scheduled event
    //   advanceTime: (currentTime, audioTime, dt) => {
    //     const env = this.audioContext.createGain();
    //     env.connect(this.audioContext.destination);
    //     env.gain.value = 0;
    //     console.log("audio")
    //     const sine = this.audioContext.createOscillator();
    //     sine.connect(env);
    //     sine.frequency.value = 200 * (this.client.id % 10 + 1);
    //     env.gain.setValueAtTime(0, audioTime);
    //     env.gain.linearRampToValueAtTime(1, audioTime + 0.01);
    //     env.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.1);
    //     sine.start(audioTime);
    //     sine.stop(audioTime + 0.1);
    //     return currentTime + 1;
    //   }
    // }
    // this.metroVisual = {
    //   advanceTime: (currentTime, audioTime, dt) => {
    //     if (!this.$beat) {
    //       this.$beat = document.querySelector(`#beat-${this.client.id}`);
    //     }
    //     // console.log(`go in ${dt * 1000}`)
    //     // this.$beat.active = true;
    //     setTimeout(() => this.$beat.active = true, Math.round(dt * 1000));
    //     return currentTime + 1;
    //   }
    // };
    // // this.globals.subscribe(updates => {
    // //   this.updateEngines();
    // //   this.render();
    // // });
    // // this.updateEngines();
    //
    // Create the objects storer for sources and load their fileDatas


    this.Sources = new _Sources.default(this.filesystem, this.audioBufferLoader, this.parameters);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwicGFyYW1ldGVycyIsIm9yZGVyIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiTG9hZFNvdW5kYmFuayIsIkxvYWRSaXJzIiwiUmFuZ2UiLCJzb3VyY2VzRGF0YSIsInJlY2VpdmVycyIsInh5eiIsIlNjYWxpbmciLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwibGlzdGVuZXJQb3NpdGlvbiIsIndpbmRvdyIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsInBvc2l0aW9ucyIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJsZW5ndGgiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwiZGlzcGF0Y2hFdmVudCIsIkV2ZW50IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0cmFuc2Zvcm0iLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG4vLyBpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpOyAgICAgLy8gVG8gbG9hZCBhdWRpb0J1ZmZlcnNcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTsgICAgICAgICAgICAgICAgICAgICAvLyBUbyBnZXQgZmlsZXNcbiAgICAvLyB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBzeW5jIGF1ZGlvIHNvdXJjZXNcbiAgICAvLyB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuXG4gICAgLy8gVmFyaWFibGUgcGFyYW1ldGVyc1xuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgIGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LCAgICAgICAgICAgICAgIC8vIEdsb2JhbCBhdWRpb0NvbnRleHRcbiAgICAgIG9yZGVyOiAyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9yZGVyIG9mIGFtYmlzb25pY3NcbiAgICAgIG5iQ2xvc2VzdFBvaW50czogNCwgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgZ2FpbkV4cG9zYW50OiAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhwb3NhbnQgb2YgdGhlIGdhaW5zICh0byBpbmNyZWFzZSBjb250cmFzdGUpXG4gICAgICAvLyBtb2RlOiBcImRlYnVnXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJkZWJ1Z1wiLCBcInN0cmVhbWluZ1wiLCBcImFtYmlzb25pY1wiLCBcImNvbnZvbHZpbmdcIiwgXCJhbWJpQ29udm9sdmluZ1wiKVxuICAgICAgLy8gbW9kZTogXCJzdHJlYW1pbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaXNvbmljXCIsXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIixcbiAgICAgIG1vZGU6IFwiYW1iaUNvbnZvbHZpbmdcIixcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpYW1ldGVyIG9mIHNvdXJjZXMnIGRpc3BsYXlcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgICAgYXVkaW9EYXRhOiBcIlwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgYXVkaW9EYXRhcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3UgYXJlIHVzaW5nIFwiICsgdGhpcy5wYXJhbWV0ZXJzLm1vZGUgKyBcIiBtb2RlLlwiKTtcblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUyLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczMnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMy5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzNCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmU0Lmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgIH1cblxuLy8gU3luYyA/XG4gICAgLy8gY29uc3QgZ2V0VGltZUZ1bmN0aW9uID0gKCkgPT4gdGhpcy5zeW5jLmdldFN5bmNUaW1lKCk7XG4gICAgLy8gY29uc3QgY3VycmVudFRpbWVUb0F1ZGlvVGltZUZ1bmN0aW9uID1cbiAgICAvLyAgIGN1cnJlbnRUaW1lID0+IHRoaXMuc3luYy5nZXRMb2NhbFRpbWUoY3VycmVudFRpbWUpO1xuXG4gICAgLy8gdGhpcy5zY2hlZHVsZXIgPSBuZXcgU2NoZWR1bGVyKGdldFRpbWVGdW5jdGlvbiwge1xuICAgIC8vICAgY3VycmVudFRpbWVUb0F1ZGlvVGltZUZ1bmN0aW9uXG4gICAgLy8gfSk7XG5cbiAgICAvLyAvLyBkZWZpbmUgc2ltcGxlIGVuZ2luZXMgZm9yIHRoZSBzY2hlZHVsZXJcbiAgICAvLyB0aGlzLm1ldHJvQXVkaW8gPSB7XG4gICAgLy8gICAvLyBgY3VycmVudFRpbWVgIGlzIHRoZSBjdXJyZW50IHRpbWUgb2YgdGhlIHNjaGVkdWxlciAoYWthIHRoZSBzeW5jVGltZSlcbiAgICAvLyAgIC8vIGBhdWRpb1RpbWVgIGlzIHRoZSBhdWRpb1RpbWUgYXMgY29tcHV0ZWQgYnkgYGN1cnJlbnRUaW1lVG9BdWRpb1RpbWVGdW5jdGlvbmBcbiAgICAvLyAgIC8vIGBkdGAgaXMgdGhlIHRpbWUgYmV0d2VlbiB0aGUgYWN0dWFsIGNhbGwgb2YgdGhlIGZ1bmN0aW9uIGFuZCB0aGUgdGltZSBvZiB0aGVcbiAgICAvLyAgIC8vIHNjaGVkdWxlZCBldmVudFxuICAgIC8vICAgYWR2YW5jZVRpbWU6IChjdXJyZW50VGltZSwgYXVkaW9UaW1lLCBkdCkgPT4ge1xuICAgIC8vICAgICBjb25zdCBlbnYgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgLy8gICAgIGVudi5jb25uZWN0KHRoaXMuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAvLyAgICAgZW52LmdhaW4udmFsdWUgPSAwO1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcImF1ZGlvXCIpXG4gICAgLy8gICAgIGNvbnN0IHNpbmUgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gICAgLy8gICAgIHNpbmUuY29ubmVjdChlbnYpO1xuICAgIC8vICAgICBzaW5lLmZyZXF1ZW5jeS52YWx1ZSA9IDIwMCAqICh0aGlzLmNsaWVudC5pZCAlIDEwICsgMSk7XG5cbiAgICAvLyAgICAgZW52LmdhaW4uc2V0VmFsdWVBdFRpbWUoMCwgYXVkaW9UaW1lKTtcbiAgICAvLyAgICAgZW52LmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMSwgYXVkaW9UaW1lICsgMC4wMSk7XG4gICAgLy8gICAgIGVudi5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoMC4wMDAxLCBhdWRpb1RpbWUgKyAwLjEpO1xuXG4gICAgLy8gICAgIHNpbmUuc3RhcnQoYXVkaW9UaW1lKTtcbiAgICAvLyAgICAgc2luZS5zdG9wKGF1ZGlvVGltZSArIDAuMSk7XG5cbiAgICAvLyAgICAgcmV0dXJuIGN1cnJlbnRUaW1lICsgMTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyB0aGlzLm1ldHJvVmlzdWFsID0ge1xuICAgIC8vICAgYWR2YW5jZVRpbWU6IChjdXJyZW50VGltZSwgYXVkaW9UaW1lLCBkdCkgPT4ge1xuICAgIC8vICAgICBpZiAoIXRoaXMuJGJlYXQpIHtcbiAgICAvLyAgICAgICB0aGlzLiRiZWF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2JlYXQtJHt0aGlzLmNsaWVudC5pZH1gKTtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIC8vIGNvbnNvbGUubG9nKGBnbyBpbiAke2R0ICogMTAwMH1gKVxuICAgIC8vICAgICAvLyB0aGlzLiRiZWF0LmFjdGl2ZSA9IHRydWU7XG4gICAgLy8gICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy4kYmVhdC5hY3RpdmUgPSB0cnVlLCBNYXRoLnJvdW5kKGR0ICogMTAwMCkpO1xuXG4gICAgLy8gICAgIHJldHVybiBjdXJyZW50VGltZSArIDE7XG4gICAgLy8gICB9XG4gICAgLy8gfTtcblxuXG4gICAgLy8gLy8gdGhpcy5nbG9iYWxzLnN1YnNjcmliZSh1cGRhdGVzID0+IHtcbiAgICAvLyAvLyAgIHRoaXMudXBkYXRlRW5naW5lcygpO1xuICAgIC8vIC8vICAgdGhpcy5yZW5kZXIoKTtcbiAgICAvLyAvLyB9KTtcbiAgICAvLyAvLyB0aGlzLnVwZGF0ZUVuZ2luZXMoKTtcbi8vXG5cbiAgICAvLyBDcmVhdGUgdGhlIG9iamVjdHMgc3RvcmVyIGZvciBzb3VyY2VzIGFuZCBsb2FkIHRoZWlyIGZpbGVEYXRhc1xuICAgIHRoaXMuU291cmNlcyA9IG5ldyBTb3VyY2VzKHRoaXMuZmlsZXN5c3RlbSwgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciwgdGhpcy5wYXJhbWV0ZXJzKVxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgIGNvbnNvbGUubG9nKFwianNvbiBmaWxlczogXCIgKyB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lICsgXCIgaGFzIGJlZW4gcmVhZFwiKTtcblxuICAgICAgLy8gTG9hZCBzb3VyY2VzJyBzb3VuZCBkZXBlbmRpbmcgb24gbW9kZSAoc29tZSBtb2RlcyBuZWVkIFJJUnMgaW4gYWRkaXRpb24gb2Ygc291bmRzKVxuICAgICAgc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgICBjYXNlICdkZWJ1Zyc6XG4gICAgICAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgICAgIHRoaXMuU291cmNlcy5Mb2FkUmlycygpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgICAgfVxuXG4gICAgICAvLyBXYWl0IHVudGlsIGF1ZGlvQnVmZmVyIGhhcyBiZWVuIGxvYWRlZCAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZFNvdW5kQmFuaygpJylcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJhdWRpb0xvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJBdWRpbyBidWZmZXJzIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBzb3VyY2U6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSk7XG5cbiAgICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICAgIHRoaXMuUmFuZ2UodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnJlY2VpdmVycy54eXopO1xuXG4gICAgICAgIC8vIEluc3RhbmNpYXRlICd0aGlzLnNjYWxlJ1xuICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuXG4gICAgICAgIC8vIEdldCBvZmZzZXQgcGFyYW1ldGVycyBvZiB0aGUgZGlzcGxheVxuICAgICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgICB4OiB0aGlzLnJhbmdlLm1veVgsXG4gICAgICAgICAgeTogdGhpcy5yYW5nZS5taW5ZXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzXG4gICAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIodGhpcy5vZmZzZXQsIHRoaXMucGFyYW1ldGVycyk7XG4gICAgICAgIHRoaXMuTGlzdGVuZXIuc3RhcnQoKTtcblxuICAgICAgICAvLyBTdGFydCB0aGUgc291cmNlcyBkaXNwbGF5IGFuZCBhdWRpbyBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBpbml0aWFsIHBvc2l0aW9uXG4gICAgICAgIHRoaXMuU291cmNlcy5zdGFydCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuXG4gICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIHdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcblxuICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIFJhbmdlKHBvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcblxuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0aGF0IGRpc3BsYXlzIGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG5cbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcblxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogeWVsbG93OyB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZSkvMn1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuXG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cbiAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9hYmwgY29udGFpbmVyc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgLy8gQWRkIG1vdXNlRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7ICAgICAgICAgLy8gVXBkYXRlIGJlZ2luIFN0YXRlIFxuXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gYXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIHNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQ3JlYXRlIGFuZCBkaXNwbGF5IG9iamVjdHNcbiAgICB0aGlzLlNvdXJjZXMuQ3JlYXRlU291cmNlcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgICAgLy8gQ3JlYXRlIHRoZSBzb3VyY2VzIGFuZCBkaXNwbGF5IHRoZW1cbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBsaXN0ZW5lcidzIGRpc3BsYXkgdG8gdGhlIGNvbnRhaW5lclxuICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInJlbmRlcmVkXCIpKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYW4gZXZlbnQgd2hlbiB0aGUgc2ltdWxhdGlvbiBhcHBlYXJlZFxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgbGlzdGVuZXIncyBwb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG5cbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5yYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxuXG4gICAgICAvLyBVcGRhdGUgb2JqZWN0cyBhbmQgdGhlaXIgZGlzcGxheVxuICAgICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIHZhbHVlIGlzIG91dCBvZiByYW5nZSwgc3RvcCB0aGUgTGlzdGVuZXIncyBQb3NpdGlvbiBVcGRhdGVcbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuXG4gICAgLy8gQ2hhbmdlIHNpemUgb2YgZGlzcGxheVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLm9mZnNldC55KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgLy8gVXBkYXRlIHNvdXJjZXMnIGRpc3BsYXlcbiAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyRGlzcGxheSh0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUNBO0FBRUEsTUFBTUEsZ0JBQU4sU0FBK0JDLDBCQUEvQixDQUFrRDtFQUNoREMsV0FBVyxDQUFDQyxNQUFELEVBQVNDLE1BQU0sR0FBRyxFQUFsQixFQUFzQkMsVUFBdEIsRUFBa0NDLFlBQWxDLEVBQWdEO0lBRXpELE1BQU1ILE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtFLEtBQUwsR0FBYSxJQUFiLENBTnlELENBUXpEOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QixDQVR5RCxDQVNTOztJQUNsRSxLQUFLQyxVQUFMLEdBQWtCLEtBQUtELE9BQUwsQ0FBYSxZQUFiLENBQWxCLENBVnlELENBVVM7SUFDbEU7SUFDQTtJQUVBOztJQUNBLEtBQUtFLFVBQUwsR0FBa0I7TUFDaEJMLFlBQVksRUFBRUEsWUFERTtNQUMwQjtNQUMxQ00sS0FBSyxFQUFFLENBRlM7TUFFMEI7TUFDMUNDLGVBQWUsRUFBRSxDQUhEO01BRzBCO01BQzFDQyxZQUFZLEVBQUUsQ0FKRTtNQUkwQjtNQUMxQztNQUNBO01BQ0E7TUFDQTtNQUNBQyxJQUFJLEVBQUUsZ0JBVFU7TUFVaEJD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