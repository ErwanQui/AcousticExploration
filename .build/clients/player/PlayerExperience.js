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
      console.log("json files: " + this.parameters.dataFileName + " has been read"); // Instantiate the attribute 'this.range' to get datas' parameters

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

      this.Sources.start(this.Listener.listenerPosition);
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
    this.positionRange.rangeY = this.range.maxY - this.range.minY;

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
      `, this.$container); // Do this only at beginning

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic291cmNlc0RhdGEiLCJzb3VyY2VzX3h5IiwiUmFuZ2UiLCJyZWNlaXZlcnMiLCJ4eXoiLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJpIiwibGVuZ3RoIiwibW95WSIsInJhbmdlWCIsInJhbmdlWSIsInJhbmdlVmFsdWVzIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaHRtbCIsInR5cGUiLCJpZCIsImJlZ2luQnV0dG9uIiwiZ2V0RWxlbWVudEJ5SWQiLCJkZWJ1Z2dpbmciLCJib3giLCJ0YXJnZXQiLCJjaGVja2VkIiwiQ2hhbmdlRGVidWciLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbiIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwibW91c2UiLCJ1c2VyQWN0aW9uIiwiZXZ0IiwiY2hhbmdlZFRvdWNoZXMiLCJDcmVhdGVJbnN0cnVtZW50cyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwiZGlzcGF0Y2hFdmVudCIsIkV2ZW50IiwiaW5zdHJ1bWVudHMiLCJwdXNoIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsIm1hcmdpbiIsIndpZHRoIiwiaGVpZ2h0IiwiYm9yZGVyUmFkaXVzIiwibGluZUhlaWdodCIsImJhY2tncm91bmQiLCJ6SW5kZXgiLCJ0cmFuc2Zvcm0iLCJhcHBlbmRDaGlsZCIsIlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSIsInRlbXBYIiwiY2xpZW50WCIsInRlbXBZIiwiY2xpZW50WSIsIlJlc2V0IiwiVlBvczJQaXhlbCIsIlVwZGF0ZVNvdXJjZXNQb3NpdGlvbiIsIlVwZGF0ZUxpc3RlbmVyRGlzcGxheSJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuL0xpc3RlbmVyLmpzJ1xuaW1wb3J0IFNvdXJjZXMgZnJvbSAnLi9Tb3VyY2VzLmpzJ1xuLy8gaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSAnd2F2ZXMtbWFzdGVycyc7XG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyLCBhdWRpb0NvbnRleHQpIHtcblxuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTsgICAgIC8vIFRvIGxvYWQgYXVkaW9CdWZmZXJzXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7ICAgICAgICAgICAgICAgICAgICAgLy8gVG8gZ2V0IGZpbGVzXG4gICAgdGhpcy5zeW5jID0gdGhpcy5yZXF1aXJlKCdzeW5jJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3luYyBhdWRpbyBzb3VyY2VzXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHRoaXMucmVxdWlyZSgncGxhdGZvcm0nKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcbiAgICB0aGlzLmF1ZGlvU3RyZWFtID0gdGhpcy5yZXF1aXJlKCdhdWRpby1zdHJlYW1zJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0U291cmNlczogMywgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgbmJDbG9zZXN0UG9pbnRzOiAzLCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiLCBcImFtYmlDb252b2x2aW5nXCIpXG4gICAgICBtb2RlOiBcInN0cmVhbWluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpc29uaWNcIixcbiAgICAgIC8vIG1vZGU6IFwiY29udm9sdmluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpQ29udm9sdmluZ1wiLFxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlhbWV0ZXIgb2Ygc291cmNlcycgZGlzcGxheVxuICAgICAgbGlzdGVuZXJTaXplOiAxNiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2l6ZSBvZiBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIHNvdXJjZXMnIHBvc2l0aW9uIGFuZCBhdWRpb0RhdGFzJyBmaWxlbmFtZXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgICBhdWRpb0RhdGE6IFwiXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBhdWRpb0RhdGFzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG5cbiAgICAvLyBJbnN0YW5jaWF0ZSBjbGFzc2VzJyBzdG9yZXJcbiAgICB0aGlzLkxpc3RlbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnTGlzdGVuZXInIGNsYXNzXG4gICAgdGhpcy5Tb3VyY2VzOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ1NvdXJjZXMnIGNsYXNzXG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5vZmZzZXQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPZmZzZXQgb2YgdGhlIGRpc3BsYXlcbiAgICB0aGlzLmNvbnRhaW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgY29udGFpbmVyIG9mIGRpc3BsYXkgZWxlbWVudHMgKGNyZWF0ZXMgaW4gJ3JlbmRlcigpJylcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcblxuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICBjb25zb2xlLmxvZyhcIllvdSBhcmUgdXNpbmcgXCIgKyB0aGlzLnBhcmFtZXRlcnMubW9kZSArIFwiIG1vZGUuXCIpO1xuXG4gICAgLy8gU3dpdGNoIGZpbGVzJyBuYW1lcyBhbmQgYXVkaW9zLCBkZXBlbmRpbmcgb24gdGhlIG1vZGUgY2hvc2VuXG4gICAgc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgY2FzZSAnZGVidWcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTAuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzTXVzaWMxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTEuanNvbic7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc1BpYW5vJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZVBpYW5vLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc1NwZWVjaDEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMi5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMzJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhbWJpQ29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczQnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lNC5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgdGhlIG9iamVjdHMgc3RvcmVyIGZvciBzb3VyY2VzIGFuZCBsb2FkIHRoZWlyIGZpbGVEYXRhc1xuICAgIHRoaXMuU291cmNlcyA9IG5ldyBTb3VyY2VzKHRoaXMuZmlsZXN5c3RlbSwgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciwgdGhpcy5wYXJhbWV0ZXJzLCB0aGlzLnBsYXRmb3JtLCB0aGlzLnN5bmMsIHRoaXMuYXVkaW9TdHJlYW0pXG4gICAgdGhpcy5Tb3VyY2VzLkxvYWREYXRhKCk7XG5cbiAgICAvLyBXYWl0IHVudGlsIGRhdGEgaGF2ZSBiZWVuIGxvYWRlZCBmcm9tIGpzb24gZmlsZXMgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWREYXRhKCknKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkYXRhTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgY29uc29sZS5sb2coXCJqc29uIGZpbGVzOiBcIiArIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgKyBcIiBoYXMgYmVlbiByZWFkXCIpO1xuXG4gICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBhdHRyaWJ1dGUgJ3RoaXMucmFuZ2UnIHRvIGdldCBkYXRhcycgcGFyYW1ldGVyc1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSlcbiAgICAgICAgdGhpcy5SYW5nZSh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLnh5eiwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkpO1xuXG4gICAgICAgIC8vIEluc3RhbmNpYXRlICd0aGlzLnNjYWxlJ1xuICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuXG4gICAgICAgIC8vIEdldCBvZmZzZXQgcGFyYW1ldGVycyBvZiB0aGUgZGlzcGxheVxuICAgICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgICB4OiB0aGlzLnJhbmdlLm1veVgsXG4gICAgICAgICAgeTogdGhpcy5yYW5nZS5taW5ZXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGxpc3RlbmVySW5pdFBvcyA9IHtcbiAgICAgICAgICB4OiB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENyZWF0ZSwgc3RhcnQgYW5kIHN0b3JlIHRoZSBsaXN0ZW5lciBjbGFzc1xuICAgICAgICB0aGlzLkxpc3RlbmVyID0gbmV3IExpc3RlbmVyKGxpc3RlbmVySW5pdFBvcywgdGhpcy5wYXJhbWV0ZXJzKTtcbiAgICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCh0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaWNpXCIpXG4gICAgICAgIC8vIFN0YXJ0IHRoZSBzb3VyY2VzIGRpc3BsYXkgYW5kIGF1ZGlvIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIGluaXRpYWwgcG9zaXRpb25cbiAgICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7XG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTW92aW5nJywgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKClcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgd2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICBjb25zb2xlLmxvZyhcImJhaCBvdWlcIilcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcblxuICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuXG4gICAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAvLyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIFJhbmdlKGF1ZGlvU291cmNlc1Bvc2l0aW9ucywgc291cmNlc1Bvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcblxuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYXVkaW9Tb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG5cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlc1Bvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc29sZS5sb2codGhpcy5yYW5nZS5taW5YKVxuXG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcblxuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBzb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcblxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVkpO1xuICAgIHJldHVybiAoc2NhbGUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5MYXkgdGhlIHBob25lIGZsYXQgYW5kIGZhY2luZyB0aGUgYXBwIHVzYWdlIHNwYWNlXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJkZWJ1Z2dpbmdcIiB2YWx1ZT1cImRlYnVnXCIvPiBEZWJ1Z1xuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwiaW5zdHJ1bWVudENvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgvMikqdGhpcy5zY2FsZX1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KCh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAtIHRoaXMucmFuZ2UubWluWCAtIHRoaXMucmFuZ2UucmFuZ2VYLzIpKnRoaXMuc2NhbGUpfXB4LCAkeyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZSArIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHNjcmlwdD5cbiAgICAgICAgICBmdW5jdGlvbiBteU1hcCgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjYWlsbG91JylcbiAgICAgICAgICAgIGFsZXJ0KCdjYWlsbG91JylcbiAgICAgICAgICAgIHZhciBtYXBQcm9wPSB7XG4gICAgICAgICAgICAgIGNlbnRlcjpuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDUxLjUwODc0MiwtMC4xMjA4NTApLFxuICAgICAgICAgICAgICB6b29tOjUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb29nbGVNYXBcIiksbWFwUHJvcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgPC9zY3JpcHQ+XG5cbiAgICAgICAgICA8c2NyaXB0IGFzeW5jIGRlZmVyIHNyYz1cImh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9rZXk9QUl6YVN5Qlo4T2Q4MHdxZl9PS1lMX282MjNnUjQwd0FnZmUtRERFJmNhbGxiYWNrPW15TWFwXCI+XG4gICAgICAgICAgPC9zY3JpcHQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuXG4gICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuXG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgIHZhciBkZWJ1Z2dpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVidWdnaW5nJyk7XG5cbiAgICAgICAgZGVidWdnaW5nLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGJveCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGJveC50YXJnZXQuY2hlY2tlZClcbiAgICAgICAgICB0aGlzLkxpc3RlbmVyLkNoYW5nZURlYnVnKGJveC50YXJnZXQuY2hlY2tlZCk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcblxuICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgLy8gQXNzaWduIGdsb2FibCBjb250YWluZXJzXG4gICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZCgpXG5cbiAgICAgICAgICAvLyBBZGQgbW91c2VFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIC8vIEFkZCB0b3VjaEV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG5cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gYXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIHNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gQ3JlYXRlIGFuZCBkaXNwbGF5IG9iamVjdHNcbiAgICB0aGlzLkNyZWF0ZUluc3RydW1lbnRzKCk7XG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlcyBhbmQgZGlzcGxheSB0aGVtXG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgbGlzdGVuZXIncyBkaXNwbGF5IHRvIHRoZSBjb250YWluZXJcbiAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZW5kZXJlZFwiKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGV2ZW50IHdoZW4gdGhlIHNpbXVsYXRpb24gYXBwZWFyZWRcbiAgfVxuXG4gIENyZWF0ZUluc3RydW1lbnRzKCkge1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5zdHJ1bWVudENvbnRhaW5lcicpXG4gICAgdmFyIGNpcmNsZURpYW1ldGVyID0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyO1xuICAgIHRoaXMuaW5zdHJ1bWVudHMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkubGVuZ3RoOyBpKyspIHtcblxuICAgICAgdGhpcy5pbnN0cnVtZW50cy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlJ3MgZGlzcGxheVxuICAgICAgLy8gdGhpcy5zb3VyY2VzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpOyAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGVsZW1lbnRcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaWQgPSBcImluc3RydW1lbnRcIiArIGk7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pbm5lckhUTUwgPSBcIlNcIjsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIHZhbHVlIChpKzEpXG5cbiAgICAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5tYXJnaW4gPSBcIjAgXCIgKyAoLWNpcmNsZURpYW1ldGVyLzIpICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS53aWR0aCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5oZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYm9yZGVyUmFkaXVzID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmxpbmVIZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnpJbmRleCA9IDE7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuXG4gICAgICBjb25zb2xlLmxvZygodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhKSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSlcblxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUncyBkaXNwbGF5IHRvIHRoZSBnbG9iYWwgY29udGFpbmVyXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnN0cnVtZW50c1tpXSk7XG4gICAgICBjb25zb2xlLmxvZyhcInpibG9cIilcbiAgICB9XG4gIH1cblxuICBVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcbiAgICB9XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBsaXN0ZW5lcidzIHBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMikvKHRoaXMuc2NhbGUpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmdcIilcblxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXlcbiAgICAgIHRoaXMuTGlzdGVuZXIuUmVzZXQobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTtcbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIHZhbHVlIGlzIG91dCBvZiByYW5nZSwgc3RvcCB0aGUgTGlzdGVuZXIncyBQb3NpdGlvbiBVcGRhdGVcbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuXG4gICAgLy8gQ2hhbmdlIHNpemUgb2YgZGlzcGxheVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLm9mZnNldC55KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgLy8gVXBkYXRlIHNvdXJjZXMnIGRpc3BsYXlcbiAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyRGlzcGxheSh0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgdGhpcy5VcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOzs7O0FBQ0E7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQ0MsWUFBbEMsRUFBZ0Q7SUFFekQsTUFBTUgsTUFBTjtJQUVBLEtBQUtDLE1BQUwsR0FBY0EsTUFBZDtJQUNBLEtBQUtDLFVBQUwsR0FBa0JBLFVBQWxCO0lBQ0EsS0FBS0Us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