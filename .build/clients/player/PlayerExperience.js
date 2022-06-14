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
      // mode: "debug",                         // Choose audio mode (possible: "debug", "streaming", "ambisonic", "convolving")
      // mode: "streaming",
      // mode: "ambisonic",
      mode: "convolving",
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
        this.parameters.dataFileName = 'scene3.json';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwicGFyYW1ldGVycyIsIm9yZGVyIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiTG9hZFNvdW5kYmFuayIsIkxvYWRSaXJzIiwiUmFuZ2UiLCJzb3VyY2VzRGF0YSIsInJlY2VpdmVycyIsInh5eiIsIlNjYWxpbmciLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwibGlzdGVuZXJQb3NpdGlvbiIsIndpbmRvdyIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsInBvc2l0aW9ucyIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJsZW5ndGgiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0cmFuc2Zvcm0iLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG4vLyBpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpOyAgICAgLy8gVG8gbG9hZCBhdWRpb0J1ZmZlcnNcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTsgICAgICAgICAgICAgICAgICAgICAvLyBUbyBnZXQgZmlsZXNcbiAgICAvLyB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBzeW5jIGF1ZGlvIHNvdXJjZXNcbiAgICAvLyB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuXG4gICAgLy8gVmFyaWFibGUgcGFyYW1ldGVyc1xuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgIGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LCAgICAgICAgICAgICAgIC8vIEdsb2JhbCBhdWRpb0NvbnRleHRcbiAgICAgIG9yZGVyOiAyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9yZGVyIG9mIGFtYmlzb25pY3NcbiAgICAgIG5iQ2xvc2VzdFBvaW50czogNCwgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgZ2FpbkV4cG9zYW50OiAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhwb3NhbnQgb2YgdGhlIGdhaW5zICh0byBpbmNyZWFzZSBjb250cmFzdGUpXG4gICAgICAvLyBtb2RlOiBcImRlYnVnXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJkZWJ1Z1wiLCBcInN0cmVhbWluZ1wiLCBcImFtYmlzb25pY1wiLCBcImNvbnZvbHZpbmdcIilcbiAgICAgIC8vIG1vZGU6IFwic3RyZWFtaW5nXCIsXG4gICAgICAvLyBtb2RlOiBcImFtYmlzb25pY1wiLFxuICAgICAgbW9kZTogXCJjb252b2x2aW5nXCIsXG4gICAgICBtb2RlOiBcImFtYmlDb252b2x2aW5nXCIsXG4gICAgICBjaXJjbGVEaWFtZXRlcjogMjAsICAgICAgICAgICAgICAgICAgICAgICAvLyBEaWFtZXRlciBvZiBzb3VyY2VzJyBkaXNwbGF5XG4gICAgICBsaXN0ZW5lclNpemU6IDE2LCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaXplIG9mIGxpc3RlbmVyJ3MgZGlzcGxheVxuICAgICAgZGF0YUZpbGVOYW1lOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgc291cmNlcycgcG9zaXRpb24gYW5kIGF1ZGlvRGF0YXMnIGZpbGVuYW1lcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICAgIGF1ZGlvRGF0YTogXCJcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIGF1ZGlvRGF0YXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGlzYXRpb24gdmFyaWFibGVzXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcblxuICAgIC8vIEluc3RhbmNpYXRlIGNsYXNzZXMnIHN0b3JlclxuICAgIHRoaXMuTGlzdGVuZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdMaXN0ZW5lcicgY2xhc3NcbiAgICB0aGlzLlNvdXJjZXM7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnU291cmNlcycgY2xhc3NcblxuICAgIC8vIEdsb2JhbCB2YWx1ZXNcbiAgICB0aGlzLnJhbmdlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhbHVlcyBvZiB0aGUgYXJyYXkgZGF0YSAoY3JlYXRlcyBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5zY2FsZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIFNjYWxlcyAoaW5pdGlhdGVkIGluICdzdGFydCgpJylcbiAgICB0aGlzLm9mZnNldDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9mZnNldCBvZiB0aGUgZGlzcGxheVxuICAgIHRoaXMuY29udGFpbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBjb250YWluZXIgb2YgZGlzcGxheSBlbGVtZW50cyAoY3JlYXRlcyBpbiAncmVuZGVyKCknKVxuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuXG4gICAgc3VwZXIuc3RhcnQoKTtcblxuICAgIGNvbnNvbGUubG9nKFwiWW91IGFyZSB1c2luZyBcIiArIHRoaXMucGFyYW1ldGVycy5tb2RlICsgXCIgbW9kZS5cIik7XG5cbiAgICAvLyBTd2l0Y2ggZmlsZXMnIG5hbWVzIGFuZCBhdWRpb3MsIGRlcGVuZGluZyBvbiB0aGUgbW9kZSBjaG9zZW5cbiAgICBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XG4gICAgICBjYXNlICdkZWJ1Zyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczAnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMC5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMS5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczInO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMi5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMzJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhbWJpQ29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczQnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMy5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICB9XG5cbi8vIFN5bmMgP1xuICAgIC8vIGNvbnN0IGdldFRpbWVGdW5jdGlvbiA9ICgpID0+IHRoaXMuc3luYy5nZXRTeW5jVGltZSgpO1xuICAgIC8vIGNvbnN0IGN1cnJlbnRUaW1lVG9BdWRpb1RpbWVGdW5jdGlvbiA9XG4gICAgLy8gICBjdXJyZW50VGltZSA9PiB0aGlzLnN5bmMuZ2V0TG9jYWxUaW1lKGN1cnJlbnRUaW1lKTtcblxuICAgIC8vIHRoaXMuc2NoZWR1bGVyID0gbmV3IFNjaGVkdWxlcihnZXRUaW1lRnVuY3Rpb24sIHtcbiAgICAvLyAgIGN1cnJlbnRUaW1lVG9BdWRpb1RpbWVGdW5jdGlvblxuICAgIC8vIH0pO1xuXG4gICAgLy8gLy8gZGVmaW5lIHNpbXBsZSBlbmdpbmVzIGZvciB0aGUgc2NoZWR1bGVyXG4gICAgLy8gdGhpcy5tZXRyb0F1ZGlvID0ge1xuICAgIC8vICAgLy8gYGN1cnJlbnRUaW1lYCBpcyB0aGUgY3VycmVudCB0aW1lIG9mIHRoZSBzY2hlZHVsZXIgKGFrYSB0aGUgc3luY1RpbWUpXG4gICAgLy8gICAvLyBgYXVkaW9UaW1lYCBpcyB0aGUgYXVkaW9UaW1lIGFzIGNvbXB1dGVkIGJ5IGBjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb25gXG4gICAgLy8gICAvLyBgZHRgIGlzIHRoZSB0aW1lIGJldHdlZW4gdGhlIGFjdHVhbCBjYWxsIG9mIHRoZSBmdW5jdGlvbiBhbmQgdGhlIHRpbWUgb2YgdGhlXG4gICAgLy8gICAvLyBzY2hlZHVsZWQgZXZlbnRcbiAgICAvLyAgIGFkdmFuY2VUaW1lOiAoY3VycmVudFRpbWUsIGF1ZGlvVGltZSwgZHQpID0+IHtcbiAgICAvLyAgICAgY29uc3QgZW52ID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpO1xuICAgIC8vICAgICBlbnYuY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgLy8gICAgIGVudi5nYWluLnZhbHVlID0gMDtcbiAgICAvLyAgICAgY29uc29sZS5sb2coXCJhdWRpb1wiKVxuICAgIC8vICAgICBjb25zdCBzaW5lID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlT3NjaWxsYXRvcigpO1xuICAgIC8vICAgICBzaW5lLmNvbm5lY3QoZW52KTtcbiAgICAvLyAgICAgc2luZS5mcmVxdWVuY3kudmFsdWUgPSAyMDAgKiAodGhpcy5jbGllbnQuaWQgJSAxMCArIDEpO1xuXG4gICAgLy8gICAgIGVudi5nYWluLnNldFZhbHVlQXRUaW1lKDAsIGF1ZGlvVGltZSk7XG4gICAgLy8gICAgIGVudi5nYWluLmxpbmVhclJhbXBUb1ZhbHVlQXRUaW1lKDEsIGF1ZGlvVGltZSArIDAuMDEpO1xuICAgIC8vICAgICBlbnYuZ2Fpbi5leHBvbmVudGlhbFJhbXBUb1ZhbHVlQXRUaW1lKDAuMDAwMSwgYXVkaW9UaW1lICsgMC4xKTtcblxuICAgIC8vICAgICBzaW5lLnN0YXJ0KGF1ZGlvVGltZSk7XG4gICAgLy8gICAgIHNpbmUuc3RvcChhdWRpb1RpbWUgKyAwLjEpO1xuXG4gICAgLy8gICAgIHJldHVybiBjdXJyZW50VGltZSArIDE7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuXG4gICAgLy8gdGhpcy5tZXRyb1Zpc3VhbCA9IHtcbiAgICAvLyAgIGFkdmFuY2VUaW1lOiAoY3VycmVudFRpbWUsIGF1ZGlvVGltZSwgZHQpID0+IHtcbiAgICAvLyAgICAgaWYgKCF0aGlzLiRiZWF0KSB7XG4gICAgLy8gICAgICAgdGhpcy4kYmVhdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYCNiZWF0LSR7dGhpcy5jbGllbnQuaWR9YCk7XG4gICAgLy8gICAgIH1cblxuICAgIC8vICAgICAvLyBjb25zb2xlLmxvZyhgZ28gaW4gJHtkdCAqIDEwMDB9YClcbiAgICAvLyAgICAgLy8gdGhpcy4kYmVhdC5hY3RpdmUgPSB0cnVlO1xuICAgIC8vICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMuJGJlYXQuYWN0aXZlID0gdHJ1ZSwgTWF0aC5yb3VuZChkdCAqIDEwMDApKTtcblxuICAgIC8vICAgICByZXR1cm4gY3VycmVudFRpbWUgKyAxO1xuICAgIC8vICAgfVxuICAgIC8vIH07XG5cblxuICAgIC8vIC8vIHRoaXMuZ2xvYmFscy5zdWJzY3JpYmUodXBkYXRlcyA9PiB7XG4gICAgLy8gLy8gICB0aGlzLnVwZGF0ZUVuZ2luZXMoKTtcbiAgICAvLyAvLyAgIHRoaXMucmVuZGVyKCk7XG4gICAgLy8gLy8gfSk7XG4gICAgLy8gLy8gdGhpcy51cGRhdGVFbmdpbmVzKCk7XG4vL1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIHN0b3JlciBmb3Igc291cmNlcyBhbmQgbG9hZCB0aGVpciBmaWxlRGF0YXNcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycylcbiAgICB0aGlzLlNvdXJjZXMuTG9hZERhdGEoKTtcblxuICAgIC8vIFdhaXQgdW50aWwgZGF0YSBoYXZlIGJlZW4gbG9hZGVkIGZyb20ganNvbiBmaWxlcyAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZERhdGEoKScpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRhdGFMb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICBjb25zb2xlLmxvZyhcImpzb24gZmlsZXM6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSArIFwiIGhhcyBiZWVuIHJlYWRcIik7XG5cbiAgICAgIC8vIExvYWQgc291cmNlcycgc291bmQgZGVwZW5kaW5nIG9uIG1vZGUgKHNvbWUgbW9kZXMgbmVlZCBSSVJzIGluIGFkZGl0aW9uIG9mIHNvdW5kcylcbiAgICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgICAgY2FzZSAnZGVidWcnOlxuICAgICAgICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgICAgIHRoaXMuU291cmNlcy5Mb2FkU291bmRiYW5rKCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRSaXJzKCk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgICB9XG5cbiAgICAgIC8vIFdhaXQgdW50aWwgYXVkaW9CdWZmZXIgaGFzIGJlZW4gbG9hZGVkIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkU291bmRCYW5rKCknKVxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImF1ZGlvTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIkF1ZGlvIGJ1ZmZlcnMgaGF2ZSBiZWVuIGxvYWRlZCBmcm9tIHNvdXJjZTogXCIgKyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhKTtcblxuICAgICAgICAvLyBJbnN0YW50aWF0ZSB0aGUgYXR0cmlidXRlICd0aGlzLnJhbmdlJyB0byBnZXQgZGF0YXMnIHBhcmFtZXRlcnNcbiAgICAgICAgdGhpcy5SYW5nZSh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLnh5eik7XG5cbiAgICAgICAgLy8gSW5zdGFuY2lhdGUgJ3RoaXMuc2NhbGUnXG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG5cbiAgICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICAgIHRoaXMub2Zmc2V0ID0ge1xuICAgICAgICAgIHg6IHRoaXMucmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDcmVhdGUsIHN0YXJ0IGFuZCBzdG9yZSB0aGUgbGlzdGVuZXIgY2xhc3NcbiAgICAgICAgdGhpcy5MaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcih0aGlzLm9mZnNldCwgdGhpcy5wYXJhbWV0ZXJzKTtcbiAgICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCgpO1xuXG4gICAgICAgIC8vIFN0YXJ0IHRoZSBzb3VyY2VzIGRpc3BsYXkgYW5kIGF1ZGlvIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIGluaXRpYWwgcG9zaXRpb25cbiAgICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7XG5cbiAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgd2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuXG4gICAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG5cbiAgICAgICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBTdGF0ZVxuICAgICAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTsgICAgICAgICAgICAgICAgICAgLy8gUmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgUmFuZ2UocG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuXG4gICAgdGhpcy5yYW5nZSA9IHtcbiAgICAgIG1pblg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBwb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBwb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gcG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gcG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gcG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gcG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcblxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVkpO1xuICAgIHJldHVybiAoc2NhbGUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlKS8yfXB4LCAke3RoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG5cbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG5cbiAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcblxuICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgLy8gQXNzaWduIGdsb2FibCBjb250YWluZXJzXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZCgpXG5cbiAgICAgICAgICAvLyBBZGQgbW91c2VFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIC8vIEFkZCB0b3VjaEV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gYXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIHNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQ3JlYXRlIGFuZCBkaXNwbGF5IG9iamVjdHNcbiAgICB0aGlzLlNvdXJjZXMuQ3JlYXRlU291cmNlcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgICAgLy8gQ3JlYXRlIHRoZSBzb3VyY2VzIGFuZCBkaXNwbGF5IHRoZW1cbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBsaXN0ZW5lcidzIGRpc3BsYXkgdG8gdGhlIGNvbnRhaW5lclxuICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgfVxuXG4gIHVzZXJBY3Rpb24obW91c2UpIHsgLy8gQ2hhbmdlIGxpc3RlbmVyJ3MgcG9zaXRpb24gd2hlbiB0aGUgbW91c2UgaGFzIGJlZW4gdXNlZFxuXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICB2YXIgdGVtcFggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yKS8odGhpcy5zY2FsZSk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5yYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmdcIilcblxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXlcbiAgICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXIobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplIG9mIGRpc3BsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5vZmZzZXQueSp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLm9mZnNldC54KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweClcIjtcblxuICAgIHRoaXMuU291cmNlcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24odGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgIC8vIFVwZGF0ZSBzb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lckRpc3BsYXkodGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7QUFDQTtBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDQyxZQUFsQyxFQUFnRDtJQUV6RCxNQUFNSCxNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLRSxLQUFMLEdBQWEsSUFBYixDQU55RCxDQVF6RDs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FUeUQsQ0FTUzs7SUFDbEUsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVZ5RCxDQVVTO0lBQ2xFO0lBQ0E7SUFFQTs7SUFDQSxLQUFLRSxVQUFMLEdBQWtCO01BQ2hCTCxZQUFZLEVBQUVBLFlBREU7TUFDMEI7TUFDMUNNLEtBQUssRUFBRSxDQUZTO01BRTBCO01BQzFDQyxlQUFlLEVBQUUsQ0FIRDtNQUcwQjtNQUMxQ0MsWUFBWSxFQUFFLENBSkU7TUFJMEI7TUFDMUM7TUFDQTtNQUNBO01BQ0FDLElBQUksRUFBRSxZQVJVO01BU2hCQSxJQUFJLEVBQUUsZ0JBVFU7TUFVaEJDLGNBQWMsRUFBRSxFQVZBO01BVTBCO01BQzFDQyxZQUFZLEVBQUUsRUFYRTtNQVcwQjtNQUMxQ0MsWUFBWSxFQUFFLEVBWkU7TUFZMEI7TUFDMUNDLFNBQVMsRUFBRSxFQWJLLENBYTBCOztJQWIxQixDQUFsQixDQWZ5RCxDQStCekQ7O0lBQ0EsS0FBS0MsWUFBTCxHQUFvQixJQUFwQjtJQUNBLEtBQUtDLFlBQUwsR0FBb0IsS0FBcEI7SUFDQSxL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