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
      mode: "ambisonic",
      // mode: "convolving",
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

      default:
        alert("No valid mode");
    } // const getTimeFunction = () => this.sync.getSyncTime();
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
    // Create the objects storer for sources and load their fileDatas


    this.Sources = new _Sources.default(this.filesystem, this.audioBufferLoader, this.parameters);
    this.Sources.LoadData(); // Wait until data have been loaded from json files ("dataLoaded" event is create 'this.Sources.LoadData()')

    document.addEventListener("dataLoaded", () => {
      // Load sources' sound depending on mode (some modes need RIRs in addition of sounds)
      switch (this.parameters.mode) {
        case 'debug':
        case 'streaming':
          this.Sources.LoadSoundbank();
          break;

        case 'ambisonic':
          this.Sources.LoadAmbiSoundbank(); // this.Sources.LoadSoundbank();

          break;

        case 'convolving':
          this.Sources.LoadRirs();
          break;

        default:
          alert("No valid mode");
      }

      document.addEventListener("audioLoaded", () => {
        console.log("AudioFiles: " + this.Sources.sourcesData); // Instantiate the attribute 'this.range' to get datas' parameters

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
            console.log(evt.changedTouches[0]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwicGFyYW1ldGVycyIsIm9yZGVyIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiTG9hZFNvdW5kYmFuayIsIkxvYWRBbWJpU291bmRiYW5rIiwiTG9hZFJpcnMiLCJzb3VyY2VzRGF0YSIsIlJhbmdlIiwicmVjZWl2ZXJzIiwieHl6IiwiU2NhbGluZyIsIngiLCJtb3lYIiwieSIsIm1pblkiLCJsaXN0ZW5lclBvc2l0aW9uIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwicmVuZGVyIiwicG9zaXRpb25zIiwibWluWCIsIm1heFgiLCJtYXhZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImh0bWwiLCJ0eXBlIiwiaWQiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNoYW5nZWRUb3VjaGVzIiwiQ3JlYXRlU291cmNlcyIsIkRpc3BsYXkiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJVcGRhdGVMaXN0ZW5lciIsIm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQiLCJoZWlnaHQiLCJ3aWR0aCIsInRyYW5zZm9ybSIsIlZQb3MyUGl4ZWwiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJVcGRhdGVMaXN0ZW5lckRpc3BsYXkiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcbmltcG9ydCBTb3VyY2VzIGZyb20gJy4vU291cmNlcy5qcydcbi8vIGltcG9ydCB7IFNjaGVkdWxlciB9IGZyb20gJ3dhdmVzLW1hc3RlcnMnO1xuXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lciwgYXVkaW9Db250ZXh0KSB7XG5cbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7ICAgICAvLyBUbyBsb2FkIGF1ZGlvQnVmZmVyc1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpOyAgICAgICAgICAgICAgICAgICAgIC8vIFRvIGdldCBmaWxlc1xuICAgIC8vIHRoaXMuc3luYyA9IHRoaXMucmVxdWlyZSgnc3luYycpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIHN5bmMgYXVkaW8gc291cmNlc1xuICAgIC8vIHRoaXMucGxhdGZvcm0gPSB0aGlzLnJlcXVpcmUoJ3BsYXRmb3JtJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0UG9pbnRzOiA0LCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiKVxuICAgICAgLy8gbW9kZTogXCJzdHJlYW1pbmdcIixcbiAgICAgIG1vZGU6IFwiYW1iaXNvbmljXCIsXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIixcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpYW1ldGVyIG9mIHNvdXJjZXMnIGRpc3BsYXlcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgICAgYXVkaW9EYXRhOiBcIlwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgYXVkaW9EYXRhcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3UgYXJlIHVzaW5nIFwiICsgdGhpcy5wYXJhbWV0ZXJzLm1vZGUgKyBcIiBtb2RlLlwiKTtcblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMS5qc29uJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMyJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTIuanNvbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczMnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMy5qc29uJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgfVxuXG5cbiAgICAvLyBjb25zdCBnZXRUaW1lRnVuY3Rpb24gPSAoKSA9PiB0aGlzLnN5bmMuZ2V0U3luY1RpbWUoKTtcbiAgICAvLyBjb25zdCBjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb24gPVxuICAgIC8vICAgY3VycmVudFRpbWUgPT4gdGhpcy5zeW5jLmdldExvY2FsVGltZShjdXJyZW50VGltZSk7XG5cbiAgICAvLyB0aGlzLnNjaGVkdWxlciA9IG5ldyBTY2hlZHVsZXIoZ2V0VGltZUZ1bmN0aW9uLCB7XG4gICAgLy8gICBjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb25cbiAgICAvLyB9KTtcblxuICAgIC8vIC8vIGRlZmluZSBzaW1wbGUgZW5naW5lcyBmb3IgdGhlIHNjaGVkdWxlclxuICAgIC8vIHRoaXMubWV0cm9BdWRpbyA9IHtcbiAgICAvLyAgIC8vIGBjdXJyZW50VGltZWAgaXMgdGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgc2NoZWR1bGVyIChha2EgdGhlIHN5bmNUaW1lKVxuICAgIC8vICAgLy8gYGF1ZGlvVGltZWAgaXMgdGhlIGF1ZGlvVGltZSBhcyBjb21wdXRlZCBieSBgY3VycmVudFRpbWVUb0F1ZGlvVGltZUZ1bmN0aW9uYFxuICAgIC8vICAgLy8gYGR0YCBpcyB0aGUgdGltZSBiZXR3ZWVuIHRoZSBhY3R1YWwgY2FsbCBvZiB0aGUgZnVuY3Rpb24gYW5kIHRoZSB0aW1lIG9mIHRoZVxuICAgIC8vICAgLy8gc2NoZWR1bGVkIGV2ZW50XG4gICAgLy8gICBhZHZhbmNlVGltZTogKGN1cnJlbnRUaW1lLCBhdWRpb1RpbWUsIGR0KSA9PiB7XG4gICAgLy8gICAgIGNvbnN0IGVudiA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAvLyAgICAgZW52LmNvbm5lY3QodGhpcy5hdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuICAgIC8vICAgICBlbnYuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKFwiYXVkaW9cIilcbiAgICAvLyAgICAgY29uc3Qgc2luZSA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICAvLyAgICAgc2luZS5jb25uZWN0KGVudik7XG4gICAgLy8gICAgIHNpbmUuZnJlcXVlbmN5LnZhbHVlID0gMjAwICogKHRoaXMuY2xpZW50LmlkICUgMTAgKyAxKTtcblxuICAgIC8vICAgICBlbnYuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLCBhdWRpb1RpbWUpO1xuICAgIC8vICAgICBlbnYuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgxLCBhdWRpb1RpbWUgKyAwLjAxKTtcbiAgICAvLyAgICAgZW52LmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSgwLjAwMDEsIGF1ZGlvVGltZSArIDAuMSk7XG5cbiAgICAvLyAgICAgc2luZS5zdGFydChhdWRpb1RpbWUpO1xuICAgIC8vICAgICBzaW5lLnN0b3AoYXVkaW9UaW1lICsgMC4xKTtcblxuICAgIC8vICAgICByZXR1cm4gY3VycmVudFRpbWUgKyAxO1xuICAgIC8vICAgfVxuICAgIC8vIH1cblxuICAgIC8vIHRoaXMubWV0cm9WaXN1YWwgPSB7XG4gICAgLy8gICBhZHZhbmNlVGltZTogKGN1cnJlbnRUaW1lLCBhdWRpb1RpbWUsIGR0KSA9PiB7XG4gICAgLy8gICAgIGlmICghdGhpcy4kYmVhdCkge1xuICAgIC8vICAgICAgIHRoaXMuJGJlYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjYmVhdC0ke3RoaXMuY2xpZW50LmlkfWApO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgLy8gY29uc29sZS5sb2coYGdvIGluICR7ZHQgKiAxMDAwfWApXG4gICAgLy8gICAgIC8vIHRoaXMuJGJlYXQuYWN0aXZlID0gdHJ1ZTtcbiAgICAvLyAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLiRiZWF0LmFjdGl2ZSA9IHRydWUsIE1hdGgucm91bmQoZHQgKiAxMDAwKSk7XG5cbiAgICAvLyAgICAgcmV0dXJuIGN1cnJlbnRUaW1lICsgMTtcbiAgICAvLyAgIH1cbiAgICAvLyB9O1xuXG5cbiAgICAvLyAvLyB0aGlzLmdsb2JhbHMuc3Vic2NyaWJlKHVwZGF0ZXMgPT4ge1xuICAgIC8vIC8vICAgdGhpcy51cGRhdGVFbmdpbmVzKCk7XG4gICAgLy8gLy8gICB0aGlzLnJlbmRlcigpO1xuICAgIC8vIC8vIH0pO1xuICAgIC8vIC8vIHRoaXMudXBkYXRlRW5naW5lcygpO1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIG9iamVjdHMgc3RvcmVyIGZvciBzb3VyY2VzIGFuZCBsb2FkIHRoZWlyIGZpbGVEYXRhc1xuICAgIHRoaXMuU291cmNlcyA9IG5ldyBTb3VyY2VzKHRoaXMuZmlsZXN5c3RlbSwgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciwgdGhpcy5wYXJhbWV0ZXJzKVxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuXG5cbiAgICAvLyBXYWl0IHVudGlsIGRhdGEgaGF2ZSBiZWVuIGxvYWRlZCBmcm9tIGpzb24gZmlsZXMgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWREYXRhKCknKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkYXRhTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgLy8gTG9hZCBzb3VyY2VzJyBzb3VuZCBkZXBlbmRpbmcgb24gbW9kZSAoc29tZSBtb2RlcyBuZWVkIFJJUnMgaW4gYWRkaXRpb24gb2Ygc291bmRzKVxuICAgICAgc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgICBjYXNlICdkZWJ1Zyc6XG4gICAgICAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgICB0aGlzLlNvdXJjZXMuTG9hZEFtYmlTb3VuZGJhbmsoKTtcbiAgICAgICAgICAvLyB0aGlzLlNvdXJjZXMuTG9hZFNvdW5kYmFuaygpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgICB0aGlzLlNvdXJjZXMuTG9hZFJpcnMoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgICB9XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJhdWRpb0xvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJBdWRpb0ZpbGVzOiBcIiArIHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YSk7XG5cbiAgICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICAgIHRoaXMuUmFuZ2UodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnJlY2VpdmVycy54eXopO1xuXG4gICAgICAgIC8vIEluc3RhbmNpYXRlICd0aGlzLnNjYWxlJ1xuICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuXG4gICAgICAgIC8vIEdldCBvZmZzZXQgcGFyYW1ldGVycyBvZiB0aGUgZGlzcGxheVxuICAgICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgICB4OiB0aGlzLnJhbmdlLm1veVgsXG4gICAgICAgICAgeTogdGhpcy5yYW5nZS5taW5ZXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzXG4gICAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIodGhpcy5vZmZzZXQsIHRoaXMucGFyYW1ldGVycyk7XG4gICAgICAgIHRoaXMuTGlzdGVuZXIuc3RhcnQoKTtcblxuICAgICAgICAvLyBTdGFydCB0aGUgc291cmNlcyBkaXNwbGF5IGFuZCBhdWRpbyBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBpbml0aWFsIHBvc2l0aW9uXG4gICAgICAgIHRoaXMuU291cmNlcy5zdGFydCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuXG4gICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIHdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcblxuICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIFJhbmdlKHBvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcblxuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0aGF0IGRpc3BsYXlzIGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG5cbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcblxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogeWVsbG93OyB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZSkvMn1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIFxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuXG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHRvIGJlZ2luIHRoZSBzaW11bGF0aW9uXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cbiAgICAgICAgICAvLyBBc3NpZ24gZ2xvYWJsIGNvbnRhaW5lcnNcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKClcblxuICAgICAgICAgIC8vIEFkZCBtb3VzZUV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgLy8gQWRkIHRvdWNoRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhldnQuY2hhbmdlZFRvdWNoZXNbMF0pXG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7ICAgICAgICAgIC8vIFVwZGF0ZSBpbml0aWFsaXNpbmcgU3RhdGVcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKCkgeyAvLyBCZWdpbiBhdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgc291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XG5cbiAgICAvLyBDcmVhdGUgYW5kIGRpc3BsYXkgb2JqZWN0c1xuICAgIHRoaXMuU291cmNlcy5DcmVhdGVTb3VyY2VzKHRoaXMuY29udGFpbmVyLCB0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZXMgYW5kIGRpc3BsYXkgdGhlbVxuICAgIHRoaXMuTGlzdGVuZXIuRGlzcGxheSh0aGlzLmNvbnRhaW5lcik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyJ3MgZGlzcGxheSB0byB0aGUgY29udGFpbmVyXG4gICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgbGlzdGVuZXIncyBwb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG5cbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5yYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxuXG4gICAgICAvLyBVcGRhdGUgb2JqZWN0cyBhbmQgdGhlaXIgZGlzcGxheVxuICAgICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIHZhbHVlIGlzIG91dCBvZiByYW5nZSwgc3RvcCB0aGUgTGlzdGVuZXIncyBQb3NpdGlvbiBVcGRhdGVcbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuXG4gICAgLy8gQ2hhbmdlIHNpemUgb2YgZGlzcGxheVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLm9mZnNldC55KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgLy8gVXBkYXRlIHNvdXJjZXMnIGRpc3BsYXlcbiAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyRGlzcGxheSh0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUNBO0FBRUEsTUFBTUEsZ0JBQU4sU0FBK0JDLDBCQUEvQixDQUFrRDtFQUNoREMsV0FBVyxDQUFDQyxNQUFELEVBQVNDLE1BQU0sR0FBRyxFQUFsQixFQUFzQkMsVUFBdEIsRUFBa0NDLFlBQWxDLEVBQWdEO0lBRXpELE1BQU1ILE1BQU47SUFFQSxL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