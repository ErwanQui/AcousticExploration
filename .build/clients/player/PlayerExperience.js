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

    this.audioStream = this.require('audio-streams'); // To manage plugin for the sync
    // Variable parameters

    this.parameters = {
      audioContext: audioContext,
      // Global audioContext
      order: 2,
      // Order of ambisonics
      nbClosestSources: 3,
      // Number of closest points searched
      nbClosestPoints: 3,
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
        // this.parameters.audioData = 'AudioFiles1';
        this.parameters.audioData = 'AudioFilesMusic1';
        this.parameters.dataFileName = 'scene1.json'; // this.parameters.audioData = 'AudioFilesPiano';
        // this.parameters.dataFileName = 'scenePiano.json';

        break;

      case 'ambisonic':
        this.parameters.audioData = 'AudioFiles2'; // this.parameters.audioData = 'AudioFilesSpeech1';

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

      console.log(this.Sources.sourcesData.sources_xy);
      this.Range(this.Sources.sourcesData.receivers.xyz, this.Sources.sourcesData.sources_xy); // Instanciate 'this.scale'

      this.scale = this.Scaling(this.range); // Get offset parameters of the display

      this.offset = {
        x: this.range.moyX,
        y: this.range.minY
      };
      var listenerInitPos = {
        x: this.positionRange.moyX,
        y: this.positionRange.minY
      }; // Create, start and store the listener class

      this.Listener = new _Listener.default(listenerInitPos, this.parameters);
      this.Listener.start(this.scale, this.offset);
      console.log("ici"); // Start the sources display and audio depending on listener's initial position

      this.Sources.start(this.Listener.listenerPosition); // document.addEventListener('ListenerMove', () => {
      //   this.Sources.onListenerPositionChanged(this.Listener.listenerPosition);         // Update the sound depending on listener's position
      //   this.UpdateContainer()
      //   this.render();
      // })

      document.addEventListener('Moving', () => {
        this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // Update the sound depending on listener's position

        this.UpdateContainer();
        this.render();
      }); // Add event listener for resize window event to resize the display

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

  Range(audioSourcesPositions, sourcesPositions) {
    // Store the array properties in 'this.range'
    // console.log(sourcesPositions)
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
    this.positionRange.rangeY = this.range.maxY - this.range.minY; // var D = {tempRange: this.range};
    // this.positionRange = D.tempRange;

    for (let i = 0; i < sourcesPositions.length; i++) {
      console.log(this.range.minX);

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
    this.range.rangeY = this.range.maxY - this.range.minY; // console.log(this.range.minX)
    // console.log(this.positionRange.minX)
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
            <input type="button" id="beginButton" value="Begin Game"/>Lay the phone flat and facing the app usage space
            <input type="checkbox" id="debugging" value="debug"/> Debug
          </div>
        </div>
        <div id="game" style="visibility: hidden;">
          <div id="instrumentContainer" style="text-align: center; position: absolute; left: 50%">
            <div id="selector" style="position: absolute;
              height: ${this.range.rangeY * this.scale}px;
              width: ${this.range.rangeX * this.scale}px;
              background: z-index: 0;
              transform: translate(${-this.range.rangeX / 2 * this.scale}px, ${this.parameters.circleDiameter / 2}px);">
            </div>
          </div>
          <div id="circleContainer" style="text-align: center; position: absolute; left: 50%">
            <div id="selector" style="position: absolute;
              height: ${this.positionRange.rangeY * this.scale}px;
              width: ${this.positionRange.rangeX * this.scale}px;
              background: yellow; z-index: 0;
              transform: translate(${(this.positionRange.minX - this.range.minX - this.range.rangeX / 2) * this.scale}px, ${(this.positionRange.minY - this.range.minY) * this.scale + this.parameters.circleDiameter / 2}px);">
            </div>
            
          </div>
          <script>
          function myMap() {
            console.log('caillou')
            alert('caillou')
            var mapProp= {
              center:new google.maps.LatLng(51.508742,-0.120850),
              zoom:5,
            };
            var map = new google.maps.Map(document.getElementById("googleMap"),mapProp);
            }
          </script>

          <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBZ8Od80wqf_OKYL_o623gR40wAgfe-DDE&callback=myMap">
          </script>
        </div>
      `, this.$container); // alert('caillou')

      fetch("https://maps.googleapis.com/maps/api/js?key=AIzaSyBZ8Od80wqf_OKYL_o623gR40wAgfe-DDE").then(results => alert('ok')); // Do this only at beginning

      if (this.initialising) {
        this.initialising = false; // Update initialising State
        // Assign callbacks once

        var beginButton = document.getElementById("beginButton");
        var debugging = document.getElementById('debugging');
        debugging.addEventListener("change", box => {
          console.log(box.target.checked);
          this.Listener.ChangeDebug(box.target.checked);
        });
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
    this.CreateInstruments();
    this.Sources.CreateSources(this.container, this.scale, this.offset); // Create the sources and display them

    this.Listener.Display(this.container); // Add the listener's display to the container

    this.render(); // Update the display

    document.dispatchEvent(new Event("rendered")); // Create an event when the simulation appeared
  }

  CreateInstruments() {
    var container = document.getElementById('instrumentContainer');
    var circleDiameter = this.parameters.circleDiameter;
    this.instruments = [];

    for (let i = 0; i < this.Sources.sourcesData.sources_xy.length; i++) {
      this.instruments.push(document.createElement('div')); // Create the source's display
      // this.sources.push(document.createElement('div'));        // Create a new element

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
      this.instruments[i].style.transform = "translate(" + (this.Sources.sourcesData.sources_xy[i].x - this.offset.x) * this.scale + "px, " + (this.Sources.sourcesData.sources_xy[i].y - this.offset.y) * this.scale + "px)";
      console.log(this.Sources.sourcesData);
      console.log((this.Sources.sourcesData.sources_xy[i].x - this.offset.x) * this.scale);
      console.log((this.Sources.sourcesData.sources_xy[i].y - this.offset.y) * this.scale); // Add the circle's display to the global container

      container.appendChild(this.instruments[i]);
      console.log("zblo");
    }
  }

  UpdateInstrumentsDisplay() {
    for (let i = 0; i < this.Sources.sourcesData.sources_xy.length; i++) {
      this.instruments[i].style.transform = "translate(" + (this.Sources.sourcesData.sources_xy[i].x - this.offset.x) * this.scale + "px, " + (this.Sources.sourcesData.sources_xy[i].y - this.offset.y) * this.scale + "px)";
    }
  }

  userAction(mouse) {
    // Change listener's position when the mouse has been used
    // Get the new potential listener's position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale;
    var tempY = this.range.minY + (mouse.clientY - this.parameters.circleDiameter / 2) / this.scale; // Check if the value is in the values range

    if (tempX >= this.positionRange.minX && tempX <= this.positionRange.maxX && tempY >= this.positionRange.minY && tempY <= this.positionRange.maxY) {
      console.log("Updating"); // Update objects and their display
      // this.Listener.UpdateListener(mouse, this.offset, this.scale);                   // Update the listener's position

      this.Listener.Reset(mouse, this.offset, this.scale);
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

    this.UpdateInstrumentsDisplay(); // Update listener's display
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic291cmNlc0RhdGEiLCJzb3VyY2VzX3h5IiwiUmFuZ2UiLCJyZWNlaXZlcnMiLCJ4eXoiLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJpIiwibGVuZ3RoIiwibW95WSIsInJhbmdlWCIsInJhbmdlWSIsInJhbmdlVmFsdWVzIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaHRtbCIsInR5cGUiLCJpZCIsImZldGNoIiwidGhlbiIsInJlc3VsdHMiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwiZGVidWdnaW5nIiwiYm94IiwidGFyZ2V0IiwiY2hlY2tlZCIsIkNoYW5nZURlYnVnIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNoYW5nZWRUb3VjaGVzIiwiQ3JlYXRlSW5zdHJ1bWVudHMiLCJDcmVhdGVTb3VyY2VzIiwiRGlzcGxheSIsImRpc3BhdGNoRXZlbnQiLCJFdmVudCIsImluc3RydW1lbnRzIiwicHVzaCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJtYXJnaW4iLCJ3aWR0aCIsImhlaWdodCIsImJvcmRlclJhZGl1cyIsImxpbmVIZWlnaHQiLCJiYWNrZ3JvdW5kIiwiekluZGV4IiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJSZXNldCIsIlZQb3MyUGl4ZWwiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJVcGRhdGVMaXN0ZW5lckRpc3BsYXkiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcbmltcG9ydCBTb3VyY2VzIGZyb20gJy4vU291cmNlcy5qcydcbi8vIGltcG9ydCB7IFNjaGVkdWxlciB9IGZyb20gJ3dhdmVzLW1hc3RlcnMnO1xuXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lciwgYXVkaW9Db250ZXh0KSB7XG5cbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7ICAgICAvLyBUbyBsb2FkIGF1ZGlvQnVmZmVyc1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpOyAgICAgICAgICAgICAgICAgICAgIC8vIFRvIGdldCBmaWxlc1xuICAgIHRoaXMuc3luYyA9IHRoaXMucmVxdWlyZSgnc3luYycpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIHN5bmMgYXVkaW8gc291cmNlc1xuICAgIHRoaXMucGxhdGZvcm0gPSB0aGlzLnJlcXVpcmUoJ3BsYXRmb3JtJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG4gICAgdGhpcy5hdWRpb1N0cmVhbSA9IHRoaXMucmVxdWlyZSgnYXVkaW8tc3RyZWFtcycpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuXG4gICAgLy8gVmFyaWFibGUgcGFyYW1ldGVyc1xuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgIGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LCAgICAgICAgICAgICAgIC8vIEdsb2JhbCBhdWRpb0NvbnRleHRcbiAgICAgIG9yZGVyOiAyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9yZGVyIG9mIGFtYmlzb25pY3NcbiAgICAgIG5iQ2xvc2VzdFNvdXJjZXM6IDMsICAgICAgICAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgY2xvc2VzdCBwb2ludHMgc2VhcmNoZWRcbiAgICAgIG5iQ2xvc2VzdFBvaW50czogMywgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgZ2FpbkV4cG9zYW50OiAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhwb3NhbnQgb2YgdGhlIGdhaW5zICh0byBpbmNyZWFzZSBjb250cmFzdGUpXG4gICAgICAvLyBtb2RlOiBcImRlYnVnXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJkZWJ1Z1wiLCBcInN0cmVhbWluZ1wiLCBcImFtYmlzb25pY1wiLCBcImNvbnZvbHZpbmdcIiwgXCJhbWJpQ29udm9sdmluZ1wiKVxuICAgICAgbW9kZTogXCJzdHJlYW1pbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaXNvbmljXCIsXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaUNvbnZvbHZpbmdcIixcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpYW1ldGVyIG9mIHNvdXJjZXMnIGRpc3BsYXlcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgICAgYXVkaW9EYXRhOiBcIlwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgYXVkaW9EYXRhcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3UgYXJlIHVzaW5nIFwiICsgdGhpcy5wYXJhbWV0ZXJzLm1vZGUgKyBcIiBtb2RlLlwiKTtcblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc011c2ljMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNQaWFubyc7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmVQaWFuby5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczInO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNTcGVlY2gxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTIuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUzLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXM0JztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTQuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIHN0b3JlciBmb3Igc291cmNlcyBhbmQgbG9hZCB0aGVpciBmaWxlRGF0YXNcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycywgdGhpcy5wbGF0Zm9ybSwgdGhpcy5zeW5jLCB0aGlzLmF1ZGlvU3RyZWFtKVxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgIGNvbnNvbGUubG9nKFwianNvbiBmaWxlczogXCIgKyB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lICsgXCIgaGFzIGJlZW4gcmVhZFwiKTtcblxuICAgICAgLy8gTG9hZCBzb3VyY2VzJyBzb3VuZCBkZXBlbmRpbmcgb24gbW9kZSAoc29tZSBtb2RlcyBuZWVkIFJJUnMgaW4gYWRkaXRpb24gb2Ygc291bmRzKVxuICAgICAgLy8gc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgLy8gICBjYXNlICdkZWJ1Zyc6XG4gICAgICAvLyAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAvLyAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAvLyAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcbiAgICAgIC8vICAgICBicmVhaztcblxuICAgICAgLy8gICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgIC8vICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgLy8gICAgIHRoaXMuU291cmNlcy5Mb2FkUmlycygpO1xuICAgICAgLy8gICAgIGJyZWFrO1xuXG4gICAgICAvLyAgIGRlZmF1bHQ6XG4gICAgICAvLyAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgICAgLy8gfVxuXG4gICAgICAvLyBXYWl0IHVudGlsIGF1ZGlvQnVmZmVyIGhhcyBiZWVuIGxvYWRlZCAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZFNvdW5kQmFuaygpJylcbiAgICAgIC8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJhdWRpb0xvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJBdWRpbyBidWZmZXJzIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBzb3VyY2U6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSk7XG5cbiAgICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5KVxuICAgICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6LCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSk7XG5cbiAgICAgICAgLy8gSW5zdGFuY2lhdGUgJ3RoaXMuc2NhbGUnXG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG5cbiAgICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICAgIHRoaXMub2Zmc2V0ID0ge1xuICAgICAgICAgIHg6IHRoaXMucmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbGlzdGVuZXJJbml0UG9zID0ge1xuICAgICAgICAgIHg6IHRoaXMucG9zaXRpb25SYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzXG4gICAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIobGlzdGVuZXJJbml0UG9zLCB0aGlzLnBhcmFtZXRlcnMpO1xuICAgICAgICB0aGlzLkxpc3RlbmVyLnN0YXJ0KHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTtcbiAgICAgICAgY29uc29sZS5sb2coXCJpY2lcIilcbiAgICAgICAgLy8gU3RhcnQgdGhlIHNvdXJjZXMgZGlzcGxheSBhbmQgYXVkaW8gZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgaW5pdGlhbCBwb3NpdGlvblxuICAgICAgICB0aGlzLlNvdXJjZXMuc3RhcnQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTtcblxuICAgICAgICAvLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdMaXN0ZW5lck1vdmUnLCAoKSA9PiB7XG4gICAgICAgIC8vICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICAgIC8vICAgdGhpcy5VcGRhdGVDb250YWluZXIoKVxuICAgICAgICAvLyAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIC8vIH0pXG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTW92aW5nJywgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKClcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgd2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICBjb25zb2xlLmxvZyhcImJhaCBvdWlcIilcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcblxuICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAvLyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIFJhbmdlKGF1ZGlvU291cmNlc1Bvc2l0aW9ucywgc291cmNlc1Bvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcbiAgICAvLyBjb25zb2xlLmxvZyhzb3VyY2VzUG9zaXRpb25zKVxuXG4gICAgdGhpcy5yYW5nZSA9IHtcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuICAgIHRoaXMucG9zaXRpb25SYW5nZSA9IHtcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhdWRpb1NvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcblxuICAgIC8vIHZhciBEID0ge3RlbXBSYW5nZTogdGhpcy5yYW5nZX07XG4gICAgLy8gdGhpcy5wb3NpdGlvblJhbmdlID0gRC50ZW1wUmFuZ2U7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UubWluWClcblxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBzb3VyY2VzUG9zaXRpb25zW2ldLng7XG5cbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gc291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5yYW5nZS5taW5YKVxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucG9zaXRpb25SYW5nZS5taW5YKVxuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdGhhdCBkaXNwbGF5cyBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVgsICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG5cbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPkxheSB0aGUgcGhvbmUgZmxhdCBhbmQgZmFjaW5nIHRoZSBhcHAgdXNhZ2Ugc3BhY2VcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cImRlYnVnZ2luZ1wiIHZhbHVlPVwiZGVidWdcIi8+IERlYnVnXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXYgaWQ9XCJpbnN0cnVtZW50Q29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWC8yKSp0aGlzLnNjYWxlfXB4LCAke3RoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoKHRoaXMucG9zaXRpb25SYW5nZS5taW5YIC0gdGhpcy5yYW5nZS5taW5YIC0gdGhpcy5yYW5nZS5yYW5nZVgvMikqdGhpcy5zY2FsZSl9cHgsICR7KHRoaXMucG9zaXRpb25SYW5nZS5taW5ZIC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlICsgdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c2NyaXB0PlxuICAgICAgICAgIGZ1bmN0aW9uIG15TWFwKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NhaWxsb3UnKVxuICAgICAgICAgICAgYWxlcnQoJ2NhaWxsb3UnKVxuICAgICAgICAgICAgdmFyIG1hcFByb3A9IHtcbiAgICAgICAgICAgICAgY2VudGVyOm5ldyBnb29nbGUubWFwcy5MYXRMbmcoNTEuNTA4NzQyLC0wLjEyMDg1MCksXG4gICAgICAgICAgICAgIHpvb206NSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvb2dsZU1hcFwiKSxtYXBQcm9wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICA8L3NjcmlwdD5cblxuICAgICAgICAgIDxzY3JpcHQgYXN5bmMgZGVmZXIgc3JjPVwiaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lCWjhPZDgwd3FmX09LWUxfbzYyM2dSNDB3QWdmZS1EREUmY2FsbGJhY2s9bXlNYXBcIj5cbiAgICAgICAgICA8L3NjcmlwdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAvLyBhbGVydCgnY2FpbGxvdScpXG4gICAgICBmZXRjaChcImh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9rZXk9QUl6YVN5Qlo4T2Q4MHdxZl9PS1lMX282MjNnUjQwd0FnZmUtRERFXCIpLnRoZW4ocmVzdWx0cyA9PiBhbGVydCgnb2snKSlcblxuICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7ICAgICAgICAgIC8vIFVwZGF0ZSBpbml0aWFsaXNpbmcgU3RhdGVcblxuICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICB2YXIgZGVidWdnaW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlYnVnZ2luZycpO1xuXG4gICAgICAgIGRlYnVnZ2luZy5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChib3gpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhib3gudGFyZ2V0LmNoZWNrZWQpXG4gICAgICAgICAgdGhpcy5MaXN0ZW5lci5DaGFuZ2VEZWJ1Zyhib3gudGFyZ2V0LmNoZWNrZWQpO1xuICAgICAgICB9KVxuXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cbiAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9hYmwgY29udGFpbmVyc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgLy8gQWRkIG1vdXNlRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7ICAgICAgICAgLy8gVXBkYXRlIGJlZ2luIFN0YXRlIFxuXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIGF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBzb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIENyZWF0ZSBhbmQgZGlzcGxheSBvYmplY3RzXG4gICAgdGhpcy5DcmVhdGVJbnN0cnVtZW50cygpO1xuICAgIHRoaXMuU291cmNlcy5DcmVhdGVTb3VyY2VzKHRoaXMuY29udGFpbmVyLCB0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZXMgYW5kIGRpc3BsYXkgdGhlbVxuICAgIHRoaXMuTGlzdGVuZXIuRGlzcGxheSh0aGlzLmNvbnRhaW5lcik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyJ3MgZGlzcGxheSB0byB0aGUgY29udGFpbmVyXG4gICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVuZGVyZWRcIikpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBldmVudCB3aGVuIHRoZSBzaW11bGF0aW9uIGFwcGVhcmVkXG4gIH1cblxuICBDcmVhdGVJbnN0cnVtZW50cygpIHtcbiAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2luc3RydW1lbnRDb250YWluZXInKVxuICAgIHZhciBjaXJjbGVEaWFtZXRlciA9IHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcjtcbiAgICB0aGlzLmluc3RydW1lbnRzID0gW11cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5Lmxlbmd0aDsgaSsrKSB7XG5cbiAgICAgIHRoaXMuaW5zdHJ1bWVudHMucHVzaChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSlcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZSdzIGRpc3BsYXlcbiAgICAgIC8vIHRoaXMuc291cmNlcy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKTsgICAgICAgIC8vIENyZWF0ZSBhIG5ldyBlbGVtZW50XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLmlkID0gXCJpbnN0cnVtZW50XCIgKyBpOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgaWRcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaW5uZXJIVE1MID0gXCJTXCI7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSB2YWx1ZSAoaSsxKVxuXG4gICAgICAvLyBDaGFuZ2UgZm9ybSBhbmQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQgdG8gZ2V0IGEgY2lyY2xlIGF0IHRoZSBnb29kIHBsYWNlO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUubWFyZ2luID0gXCIwIFwiICsgKC1jaXJjbGVEaWFtZXRlci8yKSArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUud2lkdGggPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuaGVpZ2h0ID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJvcmRlclJhZGl1cyA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5saW5lSGVpZ2h0ID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJhY2tncm91bmQgPSBcInJlZFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS56SW5kZXggPSAxO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcblxuICAgICAgY29uc29sZS5sb2coKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YSkpXG4gICAgICBjb25zb2xlLmxvZygodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpXG4gICAgICBjb25zb2xlLmxvZygodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpXG5cbiAgICAgIC8vIEFkZCB0aGUgY2lyY2xlJ3MgZGlzcGxheSB0byB0aGUgZ2xvYmFsIGNvbnRhaW5lclxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuaW5zdHJ1bWVudHNbaV0pO1xuICAgICAgY29uc29sZS5sb2coXCJ6YmxvXCIpXG4gICAgfVxuICB9XG5cbiAgVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5KCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSkgKyBcInB4LCBcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnkgLSB0aGlzLm9mZnNldC55KSp0aGlzLnNjYWxlKSArIFwicHgpXCI7XG4gICAgfVxuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgbGlzdGVuZXIncyBwb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG5cbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcblxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXG4gICAgaWYgKHRlbXBYID49IHRoaXMucG9zaXRpb25SYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucG9zaXRpb25SYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucG9zaXRpb25SYW5nZS5tYXhZKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nXCIpXG5cbiAgICAgIC8vIFVwZGF0ZSBvYmplY3RzIGFuZCB0aGVpciBkaXNwbGF5XG4gICAgICAvLyB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyKG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5MaXN0ZW5lci5SZXNldChtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpO1xuICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uIFVwZGF0ZVxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cbiAgICAvLyBDaGFuZ2Ugc2l6ZSBvZiBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMub2Zmc2V0LnkqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5vZmZzZXQueCp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG5cbiAgICB0aGlzLlNvdXJjZXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAvLyBVcGRhdGUgc291cmNlcycgZGlzcGxheVxuICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICB0aGlzLlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7QUFDQTtBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDQyxZQUFsQyxFQUFnRDtJQUV6RCxNQUFNSCxNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLRSxLQUFMLEdBQWEsSUFBYixDQU55RCxDQVF6RDs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FUeUQsQ0FTUzs7SUFDbEUsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVZ5RCxDQVVTOztJQUNsRSxLQUFLRSxJQUFMLEdBQVksS0FBS0YsT0FBTCxDQUFhLE1BQWIsQ0FBWixDQVh5RCxDQVdTOztJQUNsRSxLQUFLRyxR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