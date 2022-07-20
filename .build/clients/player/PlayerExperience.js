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

      fetch("https://agile-waters-69878.herokuapp.com/https://maps.googleapis.com/maps/api/js?key=AIzaSyBZ8Od80wqf_OKYL_o623gR40wAgfe-DDE").then(results => alert('ok')); // Do this only at beginning

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic291cmNlc0RhdGEiLCJzb3VyY2VzX3h5IiwiUmFuZ2UiLCJyZWNlaXZlcnMiLCJ4eXoiLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJpIiwibGVuZ3RoIiwibW95WSIsInJhbmdlWCIsInJhbmdlWSIsInJhbmdlVmFsdWVzIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaHRtbCIsInR5cGUiLCJpZCIsImZldGNoIiwidGhlbiIsInJlc3VsdHMiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwiZGVidWdnaW5nIiwiYm94IiwidGFyZ2V0IiwiY2hlY2tlZCIsIkNoYW5nZURlYnVnIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNoYW5nZWRUb3VjaGVzIiwiQ3JlYXRlSW5zdHJ1bWVudHMiLCJDcmVhdGVTb3VyY2VzIiwiRGlzcGxheSIsImRpc3BhdGNoRXZlbnQiLCJFdmVudCIsImluc3RydW1lbnRzIiwicHVzaCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJtYXJnaW4iLCJ3aWR0aCIsImhlaWdodCIsImJvcmRlclJhZGl1cyIsImxpbmVIZWlnaHQiLCJiYWNrZ3JvdW5kIiwiekluZGV4IiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkiLCJ0ZW1wWCIsImNsaWVudFgiLCJ0ZW1wWSIsImNsaWVudFkiLCJSZXNldCIsIlZQb3MyUGl4ZWwiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJVcGRhdGVMaXN0ZW5lckRpc3BsYXkiXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcbmltcG9ydCBTb3VyY2VzIGZyb20gJy4vU291cmNlcy5qcydcbi8vIGltcG9ydCB7IFNjaGVkdWxlciB9IGZyb20gJ3dhdmVzLW1hc3RlcnMnO1xuXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lciwgYXVkaW9Db250ZXh0KSB7XG5cbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7ICAgICAvLyBUbyBsb2FkIGF1ZGlvQnVmZmVyc1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpOyAgICAgICAgICAgICAgICAgICAgIC8vIFRvIGdldCBmaWxlc1xuICAgIHRoaXMuc3luYyA9IHRoaXMucmVxdWlyZSgnc3luYycpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIHN5bmMgYXVkaW8gc291cmNlc1xuICAgIHRoaXMucGxhdGZvcm0gPSB0aGlzLnJlcXVpcmUoJ3BsYXRmb3JtJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG4gICAgdGhpcy5hdWRpb1N0cmVhbSA9IHRoaXMucmVxdWlyZSgnYXVkaW8tc3RyZWFtcycpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuXG4gICAgLy8gVmFyaWFibGUgcGFyYW1ldGVyc1xuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgIGF1ZGlvQ29udGV4dDogYXVkaW9Db250ZXh0LCAgICAgICAgICAgICAgIC8vIEdsb2JhbCBhdWRpb0NvbnRleHRcbiAgICAgIG9yZGVyOiAyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9yZGVyIG9mIGFtYmlzb25pY3NcbiAgICAgIG5iQ2xvc2VzdFNvdXJjZXM6IDMsICAgICAgICAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgY2xvc2VzdCBwb2ludHMgc2VhcmNoZWRcbiAgICAgIG5iQ2xvc2VzdFBvaW50czogMywgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgZ2FpbkV4cG9zYW50OiAzLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXhwb3NhbnQgb2YgdGhlIGdhaW5zICh0byBpbmNyZWFzZSBjb250cmFzdGUpXG4gICAgICAvLyBtb2RlOiBcImRlYnVnXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJkZWJ1Z1wiLCBcInN0cmVhbWluZ1wiLCBcImFtYmlzb25pY1wiLCBcImNvbnZvbHZpbmdcIiwgXCJhbWJpQ29udm9sdmluZ1wiKVxuICAgICAgbW9kZTogXCJzdHJlYW1pbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaXNvbmljXCIsXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIixcbiAgICAgIC8vIG1vZGU6IFwiYW1iaUNvbnZvbHZpbmdcIixcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpYW1ldGVyIG9mIHNvdXJjZXMnIGRpc3BsYXlcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgICBkYXRhRmlsZU5hbWU6IFwiXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBzb3VyY2VzJyBwb3NpdGlvbiBhbmQgYXVkaW9EYXRhcycgZmlsZW5hbWVzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgICAgYXVkaW9EYXRhOiBcIlwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgYXVkaW9EYXRhcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3UgYXJlIHVzaW5nIFwiICsgdGhpcy5wYXJhbWV0ZXJzLm1vZGUgKyBcIiBtb2RlLlwiKTtcblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc011c2ljMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNQaWFubyc7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmVQaWFuby5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczInO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNTcGVlY2gxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTIuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUzLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXM0JztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTQuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIHN0b3JlciBmb3Igc291cmNlcyBhbmQgbG9hZCB0aGVpciBmaWxlRGF0YXNcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycywgdGhpcy5wbGF0Zm9ybSwgdGhpcy5zeW5jLCB0aGlzLmF1ZGlvU3RyZWFtKVxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgIGNvbnNvbGUubG9nKFwianNvbiBmaWxlczogXCIgKyB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lICsgXCIgaGFzIGJlZW4gcmVhZFwiKTtcblxuICAgICAgLy8gTG9hZCBzb3VyY2VzJyBzb3VuZCBkZXBlbmRpbmcgb24gbW9kZSAoc29tZSBtb2RlcyBuZWVkIFJJUnMgaW4gYWRkaXRpb24gb2Ygc291bmRzKVxuICAgICAgLy8gc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgLy8gICBjYXNlICdkZWJ1Zyc6XG4gICAgICAvLyAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAvLyAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAvLyAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcbiAgICAgIC8vICAgICBicmVhaztcblxuICAgICAgLy8gICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgIC8vICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgLy8gICAgIHRoaXMuU291cmNlcy5Mb2FkUmlycygpO1xuICAgICAgLy8gICAgIGJyZWFrO1xuXG4gICAgICAvLyAgIGRlZmF1bHQ6XG4gICAgICAvLyAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgICAgLy8gfVxuXG4gICAgICAvLyBXYWl0IHVudGlsIGF1ZGlvQnVmZmVyIGhhcyBiZWVuIGxvYWRlZCAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZFNvdW5kQmFuaygpJylcbiAgICAgIC8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJhdWRpb0xvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJBdWRpbyBidWZmZXJzIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBzb3VyY2U6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSk7XG5cbiAgICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5KVxuICAgICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6LCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSk7XG5cbiAgICAgICAgLy8gSW5zdGFuY2lhdGUgJ3RoaXMuc2NhbGUnXG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG5cbiAgICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICAgIHRoaXMub2Zmc2V0ID0ge1xuICAgICAgICAgIHg6IHRoaXMucmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbGlzdGVuZXJJbml0UG9zID0ge1xuICAgICAgICAgIHg6IHRoaXMucG9zaXRpb25SYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzXG4gICAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIobGlzdGVuZXJJbml0UG9zLCB0aGlzLnBhcmFtZXRlcnMpO1xuICAgICAgICB0aGlzLkxpc3RlbmVyLnN0YXJ0KHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTtcbiAgICAgICAgY29uc29sZS5sb2coXCJpY2lcIilcbiAgICAgICAgLy8gU3RhcnQgdGhlIHNvdXJjZXMgZGlzcGxheSBhbmQgYXVkaW8gZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgaW5pdGlhbCBwb3NpdGlvblxuICAgICAgICB0aGlzLlNvdXJjZXMuc3RhcnQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTtcblxuICAgICAgICAvLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdMaXN0ZW5lck1vdmUnLCAoKSA9PiB7XG4gICAgICAgIC8vICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICAgIC8vICAgdGhpcy5VcGRhdGVDb250YWluZXIoKVxuICAgICAgICAvLyAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIC8vIH0pXG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTW92aW5nJywgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKClcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgd2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICBjb25zb2xlLmxvZyhcImJhaCBvdWlcIilcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcblxuICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAvLyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIFJhbmdlKGF1ZGlvU291cmNlc1Bvc2l0aW9ucywgc291cmNlc1Bvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcbiAgICAvLyBjb25zb2xlLmxvZyhzb3VyY2VzUG9zaXRpb25zKVxuXG4gICAgdGhpcy5yYW5nZSA9IHtcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuICAgIHRoaXMucG9zaXRpb25SYW5nZSA9IHtcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhdWRpb1NvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcblxuICAgIC8vIHZhciBEID0ge3RlbXBSYW5nZTogdGhpcy5yYW5nZX07XG4gICAgLy8gdGhpcy5wb3NpdGlvblJhbmdlID0gRC50ZW1wUmFuZ2U7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UubWluWClcblxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBzb3VyY2VzUG9zaXRpb25zW2ldLng7XG5cbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gc291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5yYW5nZS5taW5YKVxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucG9zaXRpb25SYW5nZS5taW5YKVxuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdGhhdCBkaXNwbGF5cyBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVgsICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG5cbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPkxheSB0aGUgcGhvbmUgZmxhdCBhbmQgZmFjaW5nIHRoZSBhcHAgdXNhZ2Ugc3BhY2VcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cImRlYnVnZ2luZ1wiIHZhbHVlPVwiZGVidWdcIi8+IERlYnVnXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXYgaWQ9XCJpbnN0cnVtZW50Q29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWC8yKSp0aGlzLnNjYWxlfXB4LCAke3RoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoKHRoaXMucG9zaXRpb25SYW5nZS5taW5YIC0gdGhpcy5yYW5nZS5taW5YIC0gdGhpcy5yYW5nZS5yYW5nZVgvMikqdGhpcy5zY2FsZSl9cHgsICR7KHRoaXMucG9zaXRpb25SYW5nZS5taW5ZIC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlICsgdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8c2NyaXB0PlxuICAgICAgICAgIGZ1bmN0aW9uIG15TWFwKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NhaWxsb3UnKVxuICAgICAgICAgICAgYWxlcnQoJ2NhaWxsb3UnKVxuICAgICAgICAgICAgdmFyIG1hcFByb3A9IHtcbiAgICAgICAgICAgICAgY2VudGVyOm5ldyBnb29nbGUubWFwcy5MYXRMbmcoNTEuNTA4NzQyLC0wLjEyMDg1MCksXG4gICAgICAgICAgICAgIHpvb206NSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvb2dsZU1hcFwiKSxtYXBQcm9wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICA8L3NjcmlwdD5cblxuICAgICAgICAgIDxzY3JpcHQgYXN5bmMgZGVmZXIgc3JjPVwiaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lCWjhPZDgwd3FmX09LWUxfbzYyM2dSNDB3QWdmZS1EREUmY2FsbGJhY2s9bXlNYXBcIj5cbiAgICAgICAgICA8L3NjcmlwdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAvLyBhbGVydCgnY2FpbGxvdScpXG4gICAgICBmZXRjaChcImh0dHBzOi8vYWdpbGUtd2F0ZXJzLTY5ODc4Lmhlcm9rdWFwcC5jb20vaHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lCWjhPZDgwd3FmX09LWUxfbzYyM2dSNDB3QWdmZS1EREVcIikudGhlbihyZXN1bHRzID0+IGFsZXJ0KCdvaycpKVxuXG4gICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuXG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgIHZhciBkZWJ1Z2dpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVidWdnaW5nJyk7XG5cbiAgICAgICAgZGVidWdnaW5nLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGJveCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGJveC50YXJnZXQuY2hlY2tlZClcbiAgICAgICAgICB0aGlzLkxpc3RlbmVyLkNoYW5nZURlYnVnKGJveC50YXJnZXQuY2hlY2tlZCk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcblxuICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgLy8gQXNzaWduIGdsb2FibCBjb250YWluZXJzXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZCgpXG5cbiAgICAgICAgICAvLyBBZGQgbW91c2VFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIC8vIEFkZCB0b3VjaEV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG5cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gYXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIHNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQ3JlYXRlIGFuZCBkaXNwbGF5IG9iamVjdHNcbiAgICB0aGlzLkNyZWF0ZUluc3RydW1lbnRzKCk7XG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlcyBhbmQgZGlzcGxheSB0aGVtXG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIncyBkaXNwbGF5IHRvIHRoZSBjb250YWluZXJcbiAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZW5kZXJlZFwiKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGV2ZW50IHdoZW4gdGhlIHNpbXVsYXRpb24gYXBwZWFyZWRcbiAgfVxuXG4gIENyZWF0ZUluc3RydW1lbnRzKCkge1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5zdHJ1bWVudENvbnRhaW5lcicpXG4gICAgdmFyIGNpcmNsZURpYW1ldGVyID0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyO1xuICAgIHRoaXMuaW5zdHJ1bWVudHMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkubGVuZ3RoOyBpKyspIHtcblxuICAgICAgdGhpcy5pbnN0cnVtZW50cy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlJ3MgZGlzcGxheVxuICAgICAgLy8gdGhpcy5zb3VyY2VzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpOyAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGVsZW1lbnRcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaWQgPSBcImluc3RydW1lbnRcIiArIGk7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pbm5lckhUTUwgPSBcIlNcIjsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIHZhbHVlIChpKzEpXG5cbiAgICAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5tYXJnaW4gPSBcIjAgXCIgKyAoLWNpcmNsZURpYW1ldGVyLzIpICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS53aWR0aCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5oZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYm9yZGVyUmFkaXVzID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmxpbmVIZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnpJbmRleCA9IDE7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuXG4gICAgICBjb25zb2xlLmxvZygodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhKSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSlcblxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUncyBkaXNwbGF5IHRvIHRoZSBnbG9iYWwgY29udGFpbmVyXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnN0cnVtZW50c1tpXSk7XG4gICAgICBjb25zb2xlLmxvZyhcInpibG9cIilcbiAgICB9XG4gIH1cblxuICBVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcbiAgICB9XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBsaXN0ZW5lcidzIHBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMikvKHRoaXMuc2NhbGUpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmdcIilcblxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXlcbiAgICAgIC8vIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXIobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLkxpc3RlbmVyLlJlc2V0KG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7XG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplIG9mIGRpc3BsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5vZmZzZXQueSp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLm9mZnNldC54KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweClcIjtcblxuICAgIHRoaXMuU291cmNlcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24odGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgIC8vIFVwZGF0ZSBzb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lckRpc3BsYXkodGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICAgIHRoaXMuVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5KCk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUNBO0FBRUEsTUFBTUEsZ0JBQU4sU0FBK0JDLDBCQUEvQixDQUFrRDtFQUNoREMsV0FBVyxDQUFDQyxNQUFELEVBQVNDLE1BQU0sR0FBRyxFQUFsQixFQUFzQkMsVUFBdEIsRUFBa0NDLFlBQWxDLEVBQWdEO0lBRXpELE1BQU1ILE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtFLEtBQUwsR0FBYSxJQUFiLENBTnlELENBUXpEOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QixDQVR5RCxDQVNTOztJQUNsRSxLQUFLQyxVQUFMLEdBQWtCLEtBQUtELE9BQUwsQ0FBYSxZQUFiLENBQWxCLENBVnlELENBVVM7O0lBQ2xFLEtBQUtFLElBQUwsR0FBWSxLQUFLRixPQUFM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