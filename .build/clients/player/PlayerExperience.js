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
      `, this.$container); // // alert('caillou')
      // fetch("https://agile-waters-69878.herokuapp.com/https://maps.googleapis.com/maps/api/js?key=AIzaSyBZ8Od80wqf_OKYL_o623gR40wAgfe-DDE")
      // .then(results => {
      //   // alert('ok')
      //   console.log(results)
      //   // this.ok = require(results.url)
      //   this.map = new results.google.maps.Map();
      //   console.log(this.map)
      // })

      const isIOS = navigator.userAgent.match(/(iPod|iPhone|iPad)/) && navigator.userAgent.match(/AppleWebKit/);

      function init() {
        var compass; // startBtn.addEventListener("click", startCompass);

        navigator.geolocation.getCurrentPosition(locationHandler);

        if (!isIOS) {
          window.addEventListener("deviceorientationabsolute", handler, true);
        }
      }

      function startCompass() {
        if (isIOS) {
          DeviceOrientationEvent.requestPermission().then(response => {
            if (response === "granted") {
              window.addEventListener("deviceorientation", handler, true);
            } else {
              alert("has to be allowed!");
            }
          }).catch(() => alert("not supported"));
        }
      }

      function handler(e) {
        var compass = e.webkitCompassHeading || Math.abs(e.alpha - 360); // compassCircle.style.transform = `translate(-50%, -50%) rotate(${-compass}deg)`;

        console.log(compass); // ±15 degree

        if (pointDegree < Math.abs(compass) && pointDegree + 15 > Math.abs(compass) || pointDegree > Math.abs(compass + 15) || pointDegree < Math.abs(compass)) {// myPoint.style.opacity = 0;
        } else if (pointDegree) {// myPoint.style.opacity = 1;
        }
      }

      let pointDegree;

      function locationHandler(position) {
        const {
          latitude,
          longitude
        } = position.coords;
        pointDegree = calcDegreeToPoint(latitude, longitude);

        if (pointDegree < 0) {
          pointDegree = pointDegree + 360;
        }
      }

      function calcDegreeToPoint(latitude, longitude) {
        // Qibla geolocation
        const point = {
          lat: 21.422487,
          lng: 39.826206
        };
        const phiK = point.lat * Math.PI / 180.0;
        const lambdaK = point.lng * Math.PI / 180.0;
        const phi = latitude * Math.PI / 180.0;
        const lambda = longitude * Math.PI / 180.0;
        const psi = 180.0 / Math.PI * Math.atan2(Math.sin(lambdaK - lambda), Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda));
        return Math.round(psi);
      }

      init(); // Do this only at beginning

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic291cmNlc0RhdGEiLCJzb3VyY2VzX3h5IiwiUmFuZ2UiLCJyZWNlaXZlcnMiLCJ4eXoiLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJpIiwibGVuZ3RoIiwibW95WSIsInJhbmdlWCIsInJhbmdlWSIsInJhbmdlVmFsdWVzIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaHRtbCIsInR5cGUiLCJpZCIsImlzSU9TIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwibWF0Y2giLCJpbml0IiwiY29tcGFzcyIsImdlb2xvY2F0aW9uIiwiZ2V0Q3VycmVudFBvc2l0aW9uIiwibG9jYXRpb25IYW5kbGVyIiwiaGFuZGxlciIsInN0YXJ0Q29tcGFzcyIsIkRldmljZU9yaWVudGF0aW9uRXZlbnQiLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRoZW4iLCJyZXNwb25zZSIsImNhdGNoIiwiZSIsIndlYmtpdENvbXBhc3NIZWFkaW5nIiwiYWJzIiwiYWxwaGEiLCJwb2ludERlZ3JlZSIsInBvc2l0aW9uIiwibGF0aXR1ZGUiLCJsb25naXR1ZGUiLCJjb29yZHMiLCJjYWxjRGVncmVlVG9Qb2ludCIsInBvaW50IiwibGF0IiwibG5nIiwicGhpSyIsIlBJIiwibGFtYmRhSyIsInBoaSIsImxhbWJkYSIsInBzaSIsImF0YW4yIiwic2luIiwiY29zIiwidGFuIiwicm91bmQiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwiZGVidWdnaW5nIiwiYm94IiwidGFyZ2V0IiwiY2hlY2tlZCIsIkNoYW5nZURlYnVnIiwic3R5bGUiLCJ2aXNpYmlsaXR5Iiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZUluc3RydW1lbnRzIiwiQ3JlYXRlU291cmNlcyIsIkRpc3BsYXkiLCJkaXNwYXRjaEV2ZW50IiwiRXZlbnQiLCJpbnN0cnVtZW50cyIsInB1c2giLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwibWFyZ2luIiwid2lkdGgiLCJoZWlnaHQiLCJib3JkZXJSYWRpdXMiLCJsaW5lSGVpZ2h0IiwiYmFja2dyb3VuZCIsInpJbmRleCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwiVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiUmVzZXQiLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG4vLyBpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpOyAgICAgLy8gVG8gbG9hZCBhdWRpb0J1ZmZlcnNcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTsgICAgICAgICAgICAgICAgICAgICAvLyBUbyBnZXQgZmlsZXNcbiAgICB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBzeW5jIGF1ZGlvIHNvdXJjZXNcbiAgICB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuICAgIHRoaXMuYXVkaW9TdHJlYW0gPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLXN0cmVhbXMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcblxuICAgIC8vIFZhcmlhYmxlIHBhcmFtZXRlcnNcbiAgICB0aGlzLnBhcmFtZXRlcnMgPSB7XG4gICAgICBhdWRpb0NvbnRleHQ6IGF1ZGlvQ29udGV4dCwgICAgICAgICAgICAgICAvLyBHbG9iYWwgYXVkaW9Db250ZXh0XG4gICAgICBvcmRlcjogMiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcmRlciBvZiBhbWJpc29uaWNzXG4gICAgICBuYkNsb3Nlc3RTb3VyY2VzOiAzLCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXG4gICAgICBuYkNsb3Nlc3RQb2ludHM6IDMsICAgICAgICAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgY2xvc2VzdCBwb2ludHMgc2VhcmNoZWRcbiAgICAgIGdhaW5FeHBvc2FudDogMywgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4cG9zYW50IG9mIHRoZSBnYWlucyAodG8gaW5jcmVhc2UgY29udHJhc3RlKVxuICAgICAgLy8gbW9kZTogXCJkZWJ1Z1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJzdHJlYW1pbmdcIiwgXCJhbWJpc29uaWNcIiwgXCJjb252b2x2aW5nXCIsIFwiYW1iaUNvbnZvbHZpbmdcIilcbiAgICAgIG1vZGU6IFwic3RyZWFtaW5nXCIsXG4gICAgICAvLyBtb2RlOiBcImFtYmlzb25pY1wiLFxuICAgICAgLy8gbW9kZTogXCJjb252b2x2aW5nXCIsXG4gICAgICAvLyBtb2RlOiBcImFtYmlDb252b2x2aW5nXCIsXG4gICAgICBjaXJjbGVEaWFtZXRlcjogMjAsICAgICAgICAgICAgICAgICAgICAgICAvLyBEaWFtZXRlciBvZiBzb3VyY2VzJyBkaXNwbGF5XG4gICAgICBsaXN0ZW5lclNpemU6IDE2LCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaXplIG9mIGxpc3RlbmVyJ3MgZGlzcGxheVxuICAgICAgZGF0YUZpbGVOYW1lOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgc291cmNlcycgcG9zaXRpb24gYW5kIGF1ZGlvRGF0YXMnIGZpbGVuYW1lcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICAgIGF1ZGlvRGF0YTogXCJcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIGF1ZGlvRGF0YXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGlzYXRpb24gdmFyaWFibGVzXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcblxuICAgIC8vIEluc3RhbmNpYXRlIGNsYXNzZXMnIHN0b3JlclxuICAgIHRoaXMuTGlzdGVuZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdMaXN0ZW5lcicgY2xhc3NcbiAgICB0aGlzLlNvdXJjZXM7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnU291cmNlcycgY2xhc3NcblxuICAgIC8vIEdsb2JhbCB2YWx1ZXNcbiAgICB0aGlzLnJhbmdlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhbHVlcyBvZiB0aGUgYXJyYXkgZGF0YSAoY3JlYXRlcyBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5zY2FsZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIFNjYWxlcyAoaW5pdGlhdGVkIGluICdzdGFydCgpJylcbiAgICB0aGlzLm9mZnNldDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9mZnNldCBvZiB0aGUgZGlzcGxheVxuICAgIHRoaXMuY29udGFpbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBjb250YWluZXIgb2YgZGlzcGxheSBlbGVtZW50cyAoY3JlYXRlcyBpbiAncmVuZGVyKCknKVxuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuXG4gICAgc3VwZXIuc3RhcnQoKTtcblxuICAgIGNvbnNvbGUubG9nKFwiWW91IGFyZSB1c2luZyBcIiArIHRoaXMucGFyYW1ldGVycy5tb2RlICsgXCIgbW9kZS5cIik7XG5cbiAgICAvLyBTd2l0Y2ggZmlsZXMnIG5hbWVzIGFuZCBhdWRpb3MsIGRlcGVuZGluZyBvbiB0aGUgbW9kZSBjaG9zZW5cbiAgICBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XG4gICAgICBjYXNlICdkZWJ1Zyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczAnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMC5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNNdXNpYzEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMS5qc29uJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzUGlhbm8nO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lUGlhbm8uanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMyJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzU3BlZWNoMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUyLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczMnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMy5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzNCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmU0Lmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgb2JqZWN0cyBzdG9yZXIgZm9yIHNvdXJjZXMgYW5kIGxvYWQgdGhlaXIgZmlsZURhdGFzXG4gICAgdGhpcy5Tb3VyY2VzID0gbmV3IFNvdXJjZXModGhpcy5maWxlc3lzdGVtLCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLCB0aGlzLnBhcmFtZXRlcnMsIHRoaXMucGxhdGZvcm0sIHRoaXMuc3luYywgdGhpcy5hdWRpb1N0cmVhbSlcbiAgICB0aGlzLlNvdXJjZXMuTG9hZERhdGEoKTtcblxuICAgIC8vIFdhaXQgdW50aWwgZGF0YSBoYXZlIGJlZW4gbG9hZGVkIGZyb20ganNvbiBmaWxlcyAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZERhdGEoKScpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRhdGFMb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICBjb25zb2xlLmxvZyhcImpzb24gZmlsZXM6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSArIFwiIGhhcyBiZWVuIHJlYWRcIik7XG5cbiAgICAgIC8vIExvYWQgc291cmNlcycgc291bmQgZGVwZW5kaW5nIG9uIG1vZGUgKHNvbWUgbW9kZXMgbmVlZCBSSVJzIGluIGFkZGl0aW9uIG9mIHNvdW5kcylcbiAgICAgIC8vIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIC8vICAgY2FzZSAnZGVidWcnOlxuICAgICAgLy8gICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgLy8gICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgLy8gICAgIHRoaXMuU291cmNlcy5Mb2FkU291bmRiYW5rKCk7XG4gICAgICAvLyAgICAgYnJlYWs7XG5cbiAgICAgIC8vICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAvLyAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgIC8vICAgICB0aGlzLlNvdXJjZXMuTG9hZFJpcnMoKTtcbiAgICAgIC8vICAgICBicmVhaztcblxuICAgICAgLy8gICBkZWZhdWx0OlxuICAgICAgLy8gICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICAgIC8vIH1cblxuICAgICAgLy8gV2FpdCB1bnRpbCBhdWRpb0J1ZmZlciBoYXMgYmVlbiBsb2FkZWQgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWRTb3VuZEJhbmsoKScpXG4gICAgICAvLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYXVkaW9Mb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQXVkaW8gYnVmZmVycyBoYXZlIGJlZW4gbG9hZGVkIGZyb20gc291cmNlOiBcIiArIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEpO1xuXG4gICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBhdHRyaWJ1dGUgJ3RoaXMucmFuZ2UnIHRvIGdldCBkYXRhcycgcGFyYW1ldGVyc1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSlcbiAgICAgICAgdGhpcy5SYW5nZSh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLnh5eiwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkpO1xuXG4gICAgICAgIC8vIEluc3RhbmNpYXRlICd0aGlzLnNjYWxlJ1xuICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuXG4gICAgICAgIC8vIEdldCBvZmZzZXQgcGFyYW1ldGVycyBvZiB0aGUgZGlzcGxheVxuICAgICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgICB4OiB0aGlzLnJhbmdlLm1veVgsXG4gICAgICAgICAgeTogdGhpcy5yYW5nZS5taW5ZXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGxpc3RlbmVySW5pdFBvcyA9IHtcbiAgICAgICAgICB4OiB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENyZWF0ZSwgc3RhcnQgYW5kIHN0b3JlIHRoZSBsaXN0ZW5lciBjbGFzc1xuICAgICAgICB0aGlzLkxpc3RlbmVyID0gbmV3IExpc3RlbmVyKGxpc3RlbmVySW5pdFBvcywgdGhpcy5wYXJhbWV0ZXJzKTtcbiAgICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCh0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaWNpXCIpXG4gICAgICAgIC8vIFN0YXJ0IHRoZSBzb3VyY2VzIGRpc3BsYXkgYW5kIGF1ZGlvIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIGluaXRpYWwgcG9zaXRpb25cbiAgICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7XG5cbiAgICAgICAgLy8gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTGlzdGVuZXJNb3ZlJywgKCkgPT4ge1xuICAgICAgICAvLyAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgICAvLyAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKClcbiAgICAgICAgLy8gICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAvLyB9KVxuXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ01vdmluZycsICgpID0+IHtcbiAgICAgICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpXG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfSlcbiAgICAgICAgXG4gICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIHdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgY29uc29sZS5sb2coXCJiYWggb3VpXCIpXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG5cbiAgICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcblxuICAgICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH1cblxuICBSYW5nZShhdWRpb1NvdXJjZXNQb3NpdGlvbnMsIHNvdXJjZXNQb3NpdGlvbnMpIHsgLy8gU3RvcmUgdGhlIGFycmF5IHByb3BlcnRpZXMgaW4gJ3RoaXMucmFuZ2UnXG4gICAgLy8gY29uc29sZS5sb2coc291cmNlc1Bvc2l0aW9ucylcblxuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYXVkaW9Tb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgICAvLyB2YXIgRCA9IHt0ZW1wUmFuZ2U6IHRoaXMucmFuZ2V9O1xuICAgIC8vIHRoaXMucG9zaXRpb25SYW5nZSA9IEQudGVtcFJhbmdlO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zb2xlLmxvZyh0aGlzLnJhbmdlLm1pblgpXG5cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gc291cmNlc1Bvc2l0aW9uc1tpXS54O1xuXG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcblxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UubWluWClcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWClcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcblxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVkpO1xuICAgIHJldHVybiAoc2NhbGUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5MYXkgdGhlIHBob25lIGZsYXQgYW5kIGZhY2luZyB0aGUgYXBwIHVzYWdlIHNwYWNlXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJkZWJ1Z2dpbmdcIiB2YWx1ZT1cImRlYnVnXCIvPiBEZWJ1Z1xuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwiaW5zdHJ1bWVudENvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgvMikqdGhpcy5zY2FsZX1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KCh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAtIHRoaXMucmFuZ2UubWluWCAtIHRoaXMucmFuZ2UucmFuZ2VYLzIpKnRoaXMuc2NhbGUpfXB4LCAkeyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZSArIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPHNjcmlwdD5cbiAgICAgICAgICBmdW5jdGlvbiBteU1hcCgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjYWlsbG91JylcbiAgICAgICAgICAgIGFsZXJ0KCdjYWlsbG91JylcbiAgICAgICAgICAgIHZhciBtYXBQcm9wPSB7XG4gICAgICAgICAgICAgIGNlbnRlcjpuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDUxLjUwODc0MiwtMC4xMjA4NTApLFxuICAgICAgICAgICAgICB6b29tOjUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnb29nbGVNYXBcIiksbWFwUHJvcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgPC9zY3JpcHQ+XG5cbiAgICAgICAgICA8c2NyaXB0IGFzeW5jIGRlZmVyIHNyYz1cImh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9rZXk9QUl6YVN5Qlo4T2Q4MHdxZl9PS1lMX282MjNnUjQwd0FnZmUtRERFJmNhbGxiYWNrPW15TWFwXCI+XG4gICAgICAgICAgPC9zY3JpcHQ+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgLy8gLy8gYWxlcnQoJ2NhaWxsb3UnKVxuICAgICAgLy8gZmV0Y2goXCJodHRwczovL2FnaWxlLXdhdGVycy02OTg3OC5oZXJva3VhcHAuY29tL2h0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9rZXk9QUl6YVN5Qlo4T2Q4MHdxZl9PS1lMX282MjNnUjQwd0FnZmUtRERFXCIpXG4gICAgICAvLyAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgIC8vICAgLy8gYWxlcnQoJ29rJylcbiAgICAgIC8vICAgY29uc29sZS5sb2cocmVzdWx0cylcblxuICAgICAgLy8gICAvLyB0aGlzLm9rID0gcmVxdWlyZShyZXN1bHRzLnVybClcbiAgICAgIC8vICAgdGhpcy5tYXAgPSBuZXcgcmVzdWx0cy5nb29nbGUubWFwcy5NYXAoKTtcbiAgICAgIC8vICAgY29uc29sZS5sb2codGhpcy5tYXApXG4gICAgICAvLyB9KVxuXG4gICAgICBjb25zdCBpc0lPUyA9XG4gICAgICBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC8oaVBvZHxpUGhvbmV8aVBhZCkvKSAmJlxuICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQXBwbGVXZWJLaXQvKTtcblxuICAgIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICB2YXIgY29tcGFzcztcbiAgICAgIC8vIHN0YXJ0QnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBzdGFydENvbXBhc3MpO1xuICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmdldEN1cnJlbnRQb3NpdGlvbihsb2NhdGlvbkhhbmRsZXIpO1xuXG4gICAgICBpZiAoIWlzSU9TKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiZGV2aWNlb3JpZW50YXRpb25hYnNvbHV0ZVwiLCBoYW5kbGVyLCB0cnVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydENvbXBhc3MoKSB7XG4gICAgICBpZiAoaXNJT1MpIHtcbiAgICAgICAgRGV2aWNlT3JpZW50YXRpb25FdmVudC5yZXF1ZXN0UGVybWlzc2lvbigpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UgPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiZGV2aWNlb3JpZW50YXRpb25cIiwgaGFuZGxlciwgdHJ1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhbGVydChcImhhcyB0byBiZSBhbGxvd2VkIVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoKSA9PiBhbGVydChcIm5vdCBzdXBwb3J0ZWRcIikpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhhbmRsZXIoZSkge1xuICAgICAgdmFyIGNvbXBhc3MgPSBlLndlYmtpdENvbXBhc3NIZWFkaW5nIHx8IE1hdGguYWJzKGUuYWxwaGEgLSAzNjApO1xuICAgICAgLy8gY29tcGFzc0NpcmNsZS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKC01MCUsIC01MCUpIHJvdGF0ZSgkey1jb21wYXNzfWRlZylgO1xuICAgICAgY29uc29sZS5sb2coY29tcGFzcylcbiAgICAgIC8vIMKxMTUgZGVncmVlXG4gICAgICBpZiAoXG4gICAgICAgIChwb2ludERlZ3JlZSA8IE1hdGguYWJzKGNvbXBhc3MpICYmXG4gICAgICAgICAgcG9pbnREZWdyZWUgKyAxNSA+IE1hdGguYWJzKGNvbXBhc3MpKSB8fFxuICAgICAgICBwb2ludERlZ3JlZSA+IE1hdGguYWJzKGNvbXBhc3MgKyAxNSkgfHxcbiAgICAgICAgcG9pbnREZWdyZWUgPCBNYXRoLmFicyhjb21wYXNzKVxuICAgICAgKSB7XG4gICAgICAgIC8vIG15UG9pbnQuc3R5bGUub3BhY2l0eSA9IDA7XG4gICAgICB9IGVsc2UgaWYgKHBvaW50RGVncmVlKSB7XG4gICAgICAgIC8vIG15UG9pbnQuc3R5bGUub3BhY2l0eSA9IDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHBvaW50RGVncmVlO1xuXG4gICAgZnVuY3Rpb24gbG9jYXRpb25IYW5kbGVyKHBvc2l0aW9uKSB7XG4gICAgICBjb25zdCB7IGxhdGl0dWRlLCBsb25naXR1ZGUgfSA9IHBvc2l0aW9uLmNvb3JkcztcbiAgICAgIHBvaW50RGVncmVlID0gY2FsY0RlZ3JlZVRvUG9pbnQobGF0aXR1ZGUsIGxvbmdpdHVkZSk7XG5cbiAgICAgIGlmIChwb2ludERlZ3JlZSA8IDApIHtcbiAgICAgICAgcG9pbnREZWdyZWUgPSBwb2ludERlZ3JlZSArIDM2MDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjYWxjRGVncmVlVG9Qb2ludChsYXRpdHVkZSwgbG9uZ2l0dWRlKSB7XG4gICAgICAvLyBRaWJsYSBnZW9sb2NhdGlvblxuICAgICAgY29uc3QgcG9pbnQgPSB7XG4gICAgICAgIGxhdDogMjEuNDIyNDg3LFxuICAgICAgICBsbmc6IDM5LjgyNjIwNlxuICAgICAgfTtcblxuICAgICAgY29uc3QgcGhpSyA9IChwb2ludC5sYXQgKiBNYXRoLlBJKSAvIDE4MC4wO1xuICAgICAgY29uc3QgbGFtYmRhSyA9IChwb2ludC5sbmcgKiBNYXRoLlBJKSAvIDE4MC4wO1xuICAgICAgY29uc3QgcGhpID0gKGxhdGl0dWRlICogTWF0aC5QSSkgLyAxODAuMDtcbiAgICAgIGNvbnN0IGxhbWJkYSA9IChsb25naXR1ZGUgKiBNYXRoLlBJKSAvIDE4MC4wO1xuICAgICAgY29uc3QgcHNpID1cbiAgICAgICAgKDE4MC4wIC8gTWF0aC5QSSkgKlxuICAgICAgICBNYXRoLmF0YW4yKFxuICAgICAgICAgIE1hdGguc2luKGxhbWJkYUsgLSBsYW1iZGEpLFxuICAgICAgICAgIE1hdGguY29zKHBoaSkgKiBNYXRoLnRhbihwaGlLKSAtXG4gICAgICAgICAgICBNYXRoLnNpbihwaGkpICogTWF0aC5jb3MobGFtYmRhSyAtIGxhbWJkYSlcbiAgICAgICAgKTtcbiAgICAgIHJldHVybiBNYXRoLnJvdW5kKHBzaSk7XG4gICAgfVxuXG4gICAgaW5pdCgpXG5cbiAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG5cbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG5cbiAgICAgICAgdmFyIGRlYnVnZ2luZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWJ1Z2dpbmcnKTtcblxuICAgICAgICBkZWJ1Z2dpbmcuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoYm94KSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coYm94LnRhcmdldC5jaGVja2VkKVxuICAgICAgICAgIHRoaXMuTGlzdGVuZXIuQ2hhbmdlRGVidWcoYm94LnRhcmdldC5jaGVja2VkKTtcbiAgICAgICAgfSlcblxuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuXG4gICAgICAgICAgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHRvIGJlZ2luIHRoZSBzaW11bGF0aW9uXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cbiAgICAgICAgICAvLyBBc3NpZ24gZ2xvYWJsIGNvbnRhaW5lcnNcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKClcblxuICAgICAgICAgIC8vIEFkZCBtb3VzZUV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgLy8gQWRkIHRvdWNoRXZlbnRzIHRvIGRvIGFjdGlvbnMgd2hlbiB0aGUgdXNlciBkb2VzIGFjdGlvbnMgb24gdGhlIHNjcmVlblxuICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChldnQpID0+IHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKCkgeyAvLyBCZWdpbiBhdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgc291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XG5cbiAgICAvLyBDcmVhdGUgYW5kIGRpc3BsYXkgb2JqZWN0c1xuICAgIHRoaXMuQ3JlYXRlSW5zdHJ1bWVudHMoKTtcbiAgICB0aGlzLlNvdXJjZXMuQ3JlYXRlU291cmNlcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgICAgLy8gQ3JlYXRlIHRoZSBzb3VyY2VzIGFuZCBkaXNwbGF5IHRoZW1cbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBsaXN0ZW5lcidzIGRpc3BsYXkgdG8gdGhlIGNvbnRhaW5lclxuICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcInJlbmRlcmVkXCIpKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYW4gZXZlbnQgd2hlbiB0aGUgc2ltdWxhdGlvbiBhcHBlYXJlZFxuICB9XG5cbiAgQ3JlYXRlSW5zdHJ1bWVudHMoKSB7XG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnN0cnVtZW50Q29udGFpbmVyJylcbiAgICB2YXIgY2lyY2xlRGlhbWV0ZXIgPSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXI7XG4gICAgdGhpcy5pbnN0cnVtZW50cyA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuXG4gICAgICB0aGlzLmluc3RydW1lbnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpXG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBzb3VyY2UncyBkaXNwbGF5XG4gICAgICAvLyB0aGlzLnNvdXJjZXMucHVzaChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSk7ICAgICAgICAvLyBDcmVhdGUgYSBuZXcgZWxlbWVudFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pZCA9IFwiaW5zdHJ1bWVudFwiICsgaTsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIGlkXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLmlubmVySFRNTCA9IFwiU1wiOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBjaXJjbGUgdmFsdWUgKGkrMSlcblxuICAgICAgLy8gQ2hhbmdlIGZvcm0gYW5kIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IHRvIGdldCBhIGNpcmNsZSBhdCB0aGUgZ29vZCBwbGFjZTtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLm1hcmdpbiA9IFwiMCBcIiArICgtY2lyY2xlRGlhbWV0ZXIvMikgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLndpZHRoID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmhlaWdodCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5ib3JkZXJSYWRpdXMgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUubGluZUhlaWdodCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZWRcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuekluZGV4ID0gMTtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSkgKyBcInB4LCBcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnkgLSB0aGlzLm9mZnNldC55KSp0aGlzLnNjYWxlKSArIFwicHgpXCI7XG5cbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEpKVxuICAgICAgY29uc29sZS5sb2coKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKVxuICAgICAgY29uc29sZS5sb2coKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnkgLSB0aGlzLm9mZnNldC55KSp0aGlzLnNjYWxlKVxuXG4gICAgICAvLyBBZGQgdGhlIGNpcmNsZSdzIGRpc3BsYXkgdG8gdGhlIGdsb2JhbCBjb250YWluZXJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmluc3RydW1lbnRzW2ldKTtcbiAgICAgIGNvbnNvbGUubG9nKFwiemJsb1wiKVxuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuICAgIH1cbiAgfVxuXG4gIHVzZXJBY3Rpb24obW91c2UpIHsgLy8gQ2hhbmdlIGxpc3RlbmVyJ3MgcG9zaXRpb24gd2hlbiB0aGUgbW91c2UgaGFzIGJlZW4gdXNlZFxuXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICB2YXIgdGVtcFggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yKS8odGhpcy5zY2FsZSk7XG5cbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WSkge1xuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxuXG4gICAgICAvLyBVcGRhdGUgb2JqZWN0cyBhbmQgdGhlaXIgZGlzcGxheVxuICAgICAgLy8gdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIHRoaXMuTGlzdGVuZXIuUmVzZXQobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTtcbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIC8vIFdoZW4gdGhlIHZhbHVlIGlzIG91dCBvZiByYW5nZSwgc3RvcCB0aGUgTGlzdGVuZXIncyBQb3NpdGlvbiBVcGRhdGVcbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7IC8vIENoYW5nZSB0aGUgZGlzcGxheSB3aGVuIHRoZSB3aW5kb3cgaXMgcmVzaXplZFxuXG4gICAgLy8gQ2hhbmdlIHNpemUgb2YgZGlzcGxheVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLm9mZnNldC55KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgLy8gVXBkYXRlIHNvdXJjZXMnIGRpc3BsYXlcbiAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyRGlzcGxheSh0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gICAgdGhpcy5VcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlOyJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOzs7O0FBQ0E7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQ0MsWUFBbEMsRUFBZ0Q7SUFFekQsTUFBTUgsTUFBTjtJQUVB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