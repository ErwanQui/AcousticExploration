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
    console.log(this.audioBufferLoader.data);
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


    var a = setInterval(() => {
      if (this.audioBufferLoader.get('loading')) {
        console.log("loading...");
      } else {
        console.log("loaded");
        document.dispatchEvent(new Event("audioLoaded"));
        clearInterval(a);
      }
    }, 50); // Create the objects storer for sources and load their fileDatas

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
          // this.Sources.LoadAmbiSoundbank();
          this.Sources.LoadSoundbank();
          break;

        case 'convolving':
          this.Sources.LoadRirs();
          break;

        default:
          alert("No valid mode");
      }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwicGFyYW1ldGVycyIsIm9yZGVyIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJkYXRhIiwiYWxlcnQiLCJhIiwic2V0SW50ZXJ2YWwiLCJnZXQiLCJkb2N1bWVudCIsImRpc3BhdGNoRXZlbnQiLCJFdmVudCIsImNsZWFySW50ZXJ2YWwiLCJMb2FkRGF0YSIsImFkZEV2ZW50TGlzdGVuZXIiLCJMb2FkU291bmRiYW5rIiwiTG9hZFJpcnMiLCJzb3VyY2VzRGF0YSIsIlJhbmdlIiwicmVjZWl2ZXJzIiwieHl6IiwiU2NhbGluZyIsIngiLCJtb3lYIiwieSIsIm1pblkiLCJsaXN0ZW5lclBvc2l0aW9uIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwicmVuZGVyIiwicG9zaXRpb25zIiwibWluWCIsIm1heFgiLCJtYXhZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImh0bWwiLCJ0eXBlIiwiaWQiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNoYW5nZWRUb3VjaGVzIiwiQ3JlYXRlU291cmNlcyIsIkRpc3BsYXkiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJVcGRhdGVMaXN0ZW5lciIsIm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQiLCJoZWlnaHQiLCJ3aWR0aCIsInRyYW5zZm9ybSIsIlZQb3MyUGl4ZWwiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJVcGRhdGVMaXN0ZW5lckRpc3BsYXkiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcbmltcG9ydCBTb3VyY2VzIGZyb20gJy4vU291cmNlcy5qcydcbi8vIGltcG9ydCB7IFNjaGVkdWxlciB9IGZyb20gJ3dhdmVzLW1hc3RlcnMnO1xuXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lciwgYXVkaW9Db250ZXh0KSB7XG5cbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7ICAgICAvLyBUbyBsb2FkIGF1ZGlvQnVmZmVyc1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpOyAgICAgICAgICAgICAgICAgICAgIC8vIFRvIGdldCBmaWxlc1xuICAgIC8vIHRoaXMuc3luYyA9IHRoaXMucmVxdWlyZSgnc3luYycpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIHN5bmMgYXVkaW8gc291cmNlc1xuICAgIC8vIHRoaXMucGxhdGZvcm0gPSB0aGlzLnJlcXVpcmUoJ3BsYXRmb3JtJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0UG9pbnRzOiA0LCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiKVxuICAgICAgLy8gbW9kZTogXCJzdHJlYW1pbmdcIixcbiAgICAgIG1vZGU6IFwiYW1iaXNvbmljXCIsXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIixcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpYW1ldGVyIG9mIHNvdXJjZXMnIGRpc3BsYXlcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgICAgYXVkaW9EYXRhOiBcIlwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgYXVkaW9EYXRhcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBzdXBlci5zdGFydCgpO1xuICAgIGNvbnNvbGUubG9nKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YSlcblxuICAgIGNvbnNvbGUubG9nKFwiWW91IGFyZSB1c2luZyBcIiArIHRoaXMucGFyYW1ldGVycy5tb2RlICsgXCIgbW9kZS5cIik7XG5cbiAgICAvLyBTd2l0Y2ggZmlsZXMnIG5hbWVzIGFuZCBhdWRpb3MsIGRlcGVuZGluZyBvbiB0aGUgbW9kZSBjaG9zZW5cbiAgICBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XG4gICAgICBjYXNlICdkZWJ1Zyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczAnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMC5qc29uJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTEuanNvbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUyLmpzb24nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMzJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgIH1cblxuXG4gICAgLy8gY29uc3QgZ2V0VGltZUZ1bmN0aW9uID0gKCkgPT4gdGhpcy5zeW5jLmdldFN5bmNUaW1lKCk7XG4gICAgLy8gY29uc3QgY3VycmVudFRpbWVUb0F1ZGlvVGltZUZ1bmN0aW9uID1cbiAgICAvLyAgIGN1cnJlbnRUaW1lID0+IHRoaXMuc3luYy5nZXRMb2NhbFRpbWUoY3VycmVudFRpbWUpO1xuXG4gICAgLy8gdGhpcy5zY2hlZHVsZXIgPSBuZXcgU2NoZWR1bGVyKGdldFRpbWVGdW5jdGlvbiwge1xuICAgIC8vICAgY3VycmVudFRpbWVUb0F1ZGlvVGltZUZ1bmN0aW9uXG4gICAgLy8gfSk7XG5cbiAgICAvLyAvLyBkZWZpbmUgc2ltcGxlIGVuZ2luZXMgZm9yIHRoZSBzY2hlZHVsZXJcbiAgICAvLyB0aGlzLm1ldHJvQXVkaW8gPSB7XG4gICAgLy8gICAvLyBgY3VycmVudFRpbWVgIGlzIHRoZSBjdXJyZW50IHRpbWUgb2YgdGhlIHNjaGVkdWxlciAoYWthIHRoZSBzeW5jVGltZSlcbiAgICAvLyAgIC8vIGBhdWRpb1RpbWVgIGlzIHRoZSBhdWRpb1RpbWUgYXMgY29tcHV0ZWQgYnkgYGN1cnJlbnRUaW1lVG9BdWRpb1RpbWVGdW5jdGlvbmBcbiAgICAvLyAgIC8vIGBkdGAgaXMgdGhlIHRpbWUgYmV0d2VlbiB0aGUgYWN0dWFsIGNhbGwgb2YgdGhlIGZ1bmN0aW9uIGFuZCB0aGUgdGltZSBvZiB0aGVcbiAgICAvLyAgIC8vIHNjaGVkdWxlZCBldmVudFxuICAgIC8vICAgYWR2YW5jZVRpbWU6IChjdXJyZW50VGltZSwgYXVkaW9UaW1lLCBkdCkgPT4ge1xuICAgIC8vICAgICBjb25zdCBlbnYgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XG4gICAgLy8gICAgIGVudi5jb25uZWN0KHRoaXMuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAvLyAgICAgZW52LmdhaW4udmFsdWUgPSAwO1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcImF1ZGlvXCIpXG4gICAgLy8gICAgIGNvbnN0IHNpbmUgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVPc2NpbGxhdG9yKCk7XG4gICAgLy8gICAgIHNpbmUuY29ubmVjdChlbnYpO1xuICAgIC8vICAgICBzaW5lLmZyZXF1ZW5jeS52YWx1ZSA9IDIwMCAqICh0aGlzLmNsaWVudC5pZCAlIDEwICsgMSk7XG5cbiAgICAvLyAgICAgZW52LmdhaW4uc2V0VmFsdWVBdFRpbWUoMCwgYXVkaW9UaW1lKTtcbiAgICAvLyAgICAgZW52LmdhaW4ubGluZWFyUmFtcFRvVmFsdWVBdFRpbWUoMSwgYXVkaW9UaW1lICsgMC4wMSk7XG4gICAgLy8gICAgIGVudi5nYWluLmV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUoMC4wMDAxLCBhdWRpb1RpbWUgKyAwLjEpO1xuXG4gICAgLy8gICAgIHNpbmUuc3RhcnQoYXVkaW9UaW1lKTtcbiAgICAvLyAgICAgc2luZS5zdG9wKGF1ZGlvVGltZSArIDAuMSk7XG5cbiAgICAvLyAgICAgcmV0dXJuIGN1cnJlbnRUaW1lICsgMTtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyB0aGlzLm1ldHJvVmlzdWFsID0ge1xuICAgIC8vICAgYWR2YW5jZVRpbWU6IChjdXJyZW50VGltZSwgYXVkaW9UaW1lLCBkdCkgPT4ge1xuICAgIC8vICAgICBpZiAoIXRoaXMuJGJlYXQpIHtcbiAgICAvLyAgICAgICB0aGlzLiRiZWF0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgI2JlYXQtJHt0aGlzLmNsaWVudC5pZH1gKTtcbiAgICAvLyAgICAgfVxuXG4gICAgLy8gICAgIC8vIGNvbnNvbGUubG9nKGBnbyBpbiAke2R0ICogMTAwMH1gKVxuICAgIC8vICAgICAvLyB0aGlzLiRiZWF0LmFjdGl2ZSA9IHRydWU7XG4gICAgLy8gICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy4kYmVhdC5hY3RpdmUgPSB0cnVlLCBNYXRoLnJvdW5kKGR0ICogMTAwMCkpO1xuXG4gICAgLy8gICAgIHJldHVybiBjdXJyZW50VGltZSArIDE7XG4gICAgLy8gICB9XG4gICAgLy8gfTtcblxuXG4gICAgLy8gLy8gdGhpcy5nbG9iYWxzLnN1YnNjcmliZSh1cGRhdGVzID0+IHtcbiAgICAvLyAvLyAgIHRoaXMudXBkYXRlRW5naW5lcygpO1xuICAgIC8vIC8vICAgdGhpcy5yZW5kZXIoKTtcbiAgICAvLyAvLyB9KTtcbiAgICAvLyAvLyB0aGlzLnVwZGF0ZUVuZ2luZXMoKTtcbiAgICB2YXIgYSA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpKSB7Y29uc29sZS5sb2coXCJsb2FkaW5nLi4uXCIpO31cbiAgICAgIGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhcImxvYWRlZFwiKTsgICAgICAgXG4gICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwiYXVkaW9Mb2FkZWRcIikpO1xuICAgICAgICBjbGVhckludGVydmFsKGEpXG4gICAgICB9XG4gICAgfSwgNTApO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIHN0b3JlciBmb3Igc291cmNlcyBhbmQgbG9hZCB0aGVpciBmaWxlRGF0YXNcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycylcbiAgICB0aGlzLlNvdXJjZXMuTG9hZERhdGEoKTtcblxuXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAvLyBMb2FkIHNvdXJjZXMnIHNvdW5kIGRlcGVuZGluZyBvbiBtb2RlIChzb21lIG1vZGVzIG5lZWQgUklScyBpbiBhZGRpdGlvbiBvZiBzb3VuZHMpXG4gICAgc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgY2FzZSAnZGVidWcnOlxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgICAvLyB0aGlzLlNvdXJjZXMuTG9hZEFtYmlTb3VuZGJhbmsoKTtcbiAgICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRSaXJzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgIH1cblxuICAgICAgY29uc29sZS5sb2coXCJBdWRpb0ZpbGVzOiBcIiArIHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YSk7XG5cbiAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBhdHRyaWJ1dGUgJ3RoaXMucmFuZ2UnIHRvIGdldCBkYXRhcycgcGFyYW1ldGVyc1xuICAgICAgdGhpcy5SYW5nZSh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLnh5eik7XG5cbiAgICAgIC8vIEluc3RhbmNpYXRlICd0aGlzLnNjYWxlJ1xuICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgIH07XG5cbiAgICAgIC8vIENyZWF0ZSwgc3RhcnQgYW5kIHN0b3JlIHRoZSBsaXN0ZW5lciBjbGFzc1xuICAgICAgdGhpcy5MaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcih0aGlzLm9mZnNldCwgdGhpcy5wYXJhbWV0ZXJzKTtcbiAgICAgIHRoaXMuTGlzdGVuZXIuc3RhcnQoKTtcblxuICAgICAgLy8gU3RhcnQgdGhlIHNvdXJjZXMgZGlzcGxheSBhbmQgYXVkaW8gZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgaW5pdGlhbCBwb3NpdGlvblxuICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7XG5cbiAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIHdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG5cbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG5cbiAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pXG4gICAgICAvLyBEaXNwbGF5XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuICB9XG5cbiAgUmFuZ2UocG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuXG4gICAgdGhpcy5yYW5nZSA9IHtcbiAgICAgIG1pblg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBwb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBwb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gcG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gcG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gcG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gcG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcblxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVkpO1xuICAgIHJldHVybiAoc2NhbGUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlKS8yfXB4LCAke3RoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG5cbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG5cbiAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9hYmwgY29udGFpbmVyc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgLy8gQWRkIG1vdXNlRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSlcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7ICAgICAgICAgLy8gVXBkYXRlIGJlZ2luIFN0YXRlIFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIGF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBzb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIENyZWF0ZSBhbmQgZGlzcGxheSBvYmplY3RzXG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlcyBhbmQgZGlzcGxheSB0aGVtXG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIncyBkaXNwbGF5IHRvIHRoZSBjb250YWluZXJcbiAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBsaXN0ZW5lcidzIHBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMikvKHRoaXMuc2NhbGUpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5yYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nXCIpXG5cbiAgICAgIC8vIFVwZGF0ZSBvYmplY3RzIGFuZCB0aGVpciBkaXNwbGF5XG4gICAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyKG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uIFVwZGF0ZVxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cbiAgICAvLyBDaGFuZ2Ugc2l6ZSBvZiBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMub2Zmc2V0LnkqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5vZmZzZXQueCp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG5cbiAgICB0aGlzLlNvdXJjZXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAvLyBVcGRhdGUgc291cmNlcycgZGlzcGxheVxuICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgfVxufVxuXG5leHBvcnQgZGVm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