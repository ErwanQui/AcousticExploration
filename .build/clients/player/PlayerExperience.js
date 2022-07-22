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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsIkxpc3RlbmVyIiwiU291cmNlcyIsInJhbmdlIiwic2NhbGUiLCJvZmZzZXQiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImNvbnNvbGUiLCJsb2ciLCJhbGVydCIsIkxvYWREYXRhIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwic291cmNlc0RhdGEiLCJzb3VyY2VzX3h5IiwiUmFuZ2UiLCJyZWNlaXZlcnMiLCJ4eXoiLCJTY2FsaW5nIiwieCIsIm1veVgiLCJ5IiwibWluWSIsImxpc3RlbmVySW5pdFBvcyIsInBvc2l0aW9uUmFuZ2UiLCJsaXN0ZW5lclBvc2l0aW9uIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIndpbmRvdyIsImF1ZGlvU291cmNlc1Bvc2l0aW9ucyIsInNvdXJjZXNQb3NpdGlvbnMiLCJtaW5YIiwibWF4WCIsIm1heFkiLCJpIiwibGVuZ3RoIiwibW95WSIsInJhbmdlWCIsInJhbmdlWSIsInJhbmdlVmFsdWVzIiwiTWF0aCIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaHRtbCIsInR5cGUiLCJpZCIsImlzSU9TIiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwibWF0Y2giLCJpbml0IiwiY29tcGFzcyIsImdlb2xvY2F0aW9uIiwiZ2V0Q3VycmVudFBvc2l0aW9uIiwibG9jYXRpb25IYW5kbGVyIiwiaGFuZGxlciIsInN0YXJ0Q29tcGFzcyIsIkRldmljZU9yaWVudGF0aW9uRXZlbnQiLCJyZXF1ZXN0UGVybWlzc2lvbiIsInRoZW4iLCJyZXNwb25zZSIsImNhdGNoIiwiZSIsIndlYmtpdENvbXBhc3NIZWFkaW5nIiwiYWJzIiwiYWxwaGEiLCJwb2ludERlZ3JlZSIsInBvc2l0aW9uIiwibGF0aXR1ZGUiLCJsb25naXR1ZGUiLCJjb29yZHMiLCJjYWxjRGVncmVlVG9Qb2ludCIsInBvaW50IiwibGF0IiwibG5nIiwicGhpSyIsIlBJIiwibGFtYmRhSyIsInBoaSIsImxhbWJkYSIsInBzaSIsImF0YW4yIiwic2luIiwiY29zIiwidGFuIiwicm91bmQiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwiZGVidWdnaW5nIiwiYm94IiwidGFyZ2V0IiwiY2hlY2tlZCIsIkNoYW5nZURlYnVnIiwic3R5bGUiLCJ2aXNpYmlsaXR5Iiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZUluc3RydW1lbnRzIiwiQ3JlYXRlU291cmNlcyIsIkRpc3BsYXkiLCJkaXNwYXRjaEV2ZW50IiwiRXZlbnQiLCJpbnN0cnVtZW50cyIsInB1c2giLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwibWFyZ2luIiwid2lkdGgiLCJoZWlnaHQiLCJib3JkZXJSYWRpdXMiLCJsaW5lSGVpZ2h0IiwiYmFja2dyb3VuZCIsInpJbmRleCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwiVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiUmVzZXQiLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XHJcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcclxuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XHJcblxyXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcclxuaW1wb3J0IFNvdXJjZXMgZnJvbSAnLi9Tb3VyY2VzLmpzJ1xyXG4vLyBpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcclxuXHJcbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xyXG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xyXG5cclxuICAgIHN1cGVyKGNsaWVudCk7XHJcblxyXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XHJcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xyXG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XHJcblxyXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxyXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpOyAgICAgLy8gVG8gbG9hZCBhdWRpb0J1ZmZlcnNcclxuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpOyAgICAgICAgICAgICAgICAgICAgIC8vIFRvIGdldCBmaWxlc1xyXG4gICAgdGhpcy5zeW5jID0gdGhpcy5yZXF1aXJlKCdzeW5jJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3luYyBhdWRpbyBzb3VyY2VzXHJcbiAgICB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xyXG4gICAgdGhpcy5hdWRpb1N0cmVhbSA9IHRoaXMucmVxdWlyZSgnYXVkaW8tc3RyZWFtcycpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xyXG5cclxuICAgIC8vIFZhcmlhYmxlIHBhcmFtZXRlcnNcclxuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcclxuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxyXG4gICAgICBvcmRlcjogMiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcmRlciBvZiBhbWJpc29uaWNzXHJcbiAgICAgIG5iQ2xvc2VzdFNvdXJjZXM6IDMsICAgICAgICAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgY2xvc2VzdCBwb2ludHMgc2VhcmNoZWRcclxuICAgICAgbmJDbG9zZXN0UG9pbnRzOiAzLCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXHJcbiAgICAgIGdhaW5FeHBvc2FudDogMywgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4cG9zYW50IG9mIHRoZSBnYWlucyAodG8gaW5jcmVhc2UgY29udHJhc3RlKVxyXG4gICAgICAvLyBtb2RlOiBcImRlYnVnXCIsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJkZWJ1Z1wiLCBcInN0cmVhbWluZ1wiLCBcImFtYmlzb25pY1wiLCBcImNvbnZvbHZpbmdcIiwgXCJhbWJpQ29udm9sdmluZ1wiKVxyXG4gICAgICBtb2RlOiBcInN0cmVhbWluZ1wiLFxyXG4gICAgICAvLyBtb2RlOiBcImFtYmlzb25pY1wiLFxyXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIixcclxuICAgICAgLy8gbW9kZTogXCJhbWJpQ29udm9sdmluZ1wiLFxyXG4gICAgICBjaXJjbGVEaWFtZXRlcjogMjAsICAgICAgICAgICAgICAgICAgICAgICAvLyBEaWFtZXRlciBvZiBzb3VyY2VzJyBkaXNwbGF5XHJcbiAgICAgIGxpc3RlbmVyU2l6ZTogMTYsICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpemUgb2YgbGlzdGVuZXIncyBkaXNwbGF5XHJcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIHNvdXJjZXMnIHBvc2l0aW9uIGFuZCBhdWRpb0RhdGFzJyBmaWxlbmFtZXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXHJcbiAgICAgIGF1ZGlvRGF0YTogXCJcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIGF1ZGlvRGF0YXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGlzYXRpb24gdmFyaWFibGVzXHJcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XHJcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcclxuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vIEluc3RhbmNpYXRlIGNsYXNzZXMnIHN0b3JlclxyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xyXG4gICAgdGhpcy5Tb3VyY2VzOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ1NvdXJjZXMnIGNsYXNzXHJcblxyXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xyXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gJ3N0YXJ0KCknKVxyXG4gICAgdGhpcy5zY2FsZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIFNjYWxlcyAoaW5pdGlhdGVkIGluICdzdGFydCgpJylcclxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XHJcbiAgICB0aGlzLmNvbnRhaW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgY29udGFpbmVyIG9mIGRpc3BsYXkgZWxlbWVudHMgKGNyZWF0ZXMgaW4gJ3JlbmRlcigpJylcclxuXHJcbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgc3RhcnQoKSB7XHJcblxyXG4gICAgc3VwZXIuc3RhcnQoKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZyhcIllvdSBhcmUgdXNpbmcgXCIgKyB0aGlzLnBhcmFtZXRlcnMubW9kZSArIFwiIG1vZGUuXCIpO1xyXG5cclxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxyXG4gICAgc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xyXG4gICAgICBjYXNlICdkZWJ1Zyc6XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTAuanNvbic7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlICdzdHJlYW1pbmcnOlxyXG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczEnO1xyXG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc011c2ljMSc7XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTEuanNvbic7XHJcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzUGlhbm8nO1xyXG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmVQaWFuby5qc29uJztcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMic7XHJcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzU3BlZWNoMSc7XHJcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTIuanNvbic7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlICdjb252b2x2aW5nJzpcclxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMzJztcclxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMy5qc29uJztcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcclxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXM0JztcclxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lNC5qc29uJztcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENyZWF0ZSB0aGUgb2JqZWN0cyBzdG9yZXIgZm9yIHNvdXJjZXMgYW5kIGxvYWQgdGhlaXIgZmlsZURhdGFzXHJcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycywgdGhpcy5wbGF0Zm9ybSwgdGhpcy5zeW5jLCB0aGlzLmF1ZGlvU3RyZWFtKVxyXG4gICAgdGhpcy5Tb3VyY2VzLkxvYWREYXRhKCk7XHJcblxyXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkYXRhTG9hZGVkXCIsICgpID0+IHtcclxuXHJcbiAgICAgIGNvbnNvbGUubG9nKFwianNvbiBmaWxlczogXCIgKyB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lICsgXCIgaGFzIGJlZW4gcmVhZFwiKTtcclxuXHJcbiAgICAgIC8vIExvYWQgc291cmNlcycgc291bmQgZGVwZW5kaW5nIG9uIG1vZGUgKHNvbWUgbW9kZXMgbmVlZCBSSVJzIGluIGFkZGl0aW9uIG9mIHNvdW5kcylcclxuICAgICAgLy8gc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xyXG4gICAgICAvLyAgIGNhc2UgJ2RlYnVnJzpcclxuICAgICAgLy8gICBjYXNlICdzdHJlYW1pbmcnOlxyXG4gICAgICAvLyAgIGNhc2UgJ2FtYmlzb25pYyc6XHJcbiAgICAgIC8vICAgICB0aGlzLlNvdXJjZXMuTG9hZFNvdW5kYmFuaygpO1xyXG4gICAgICAvLyAgICAgYnJlYWs7XHJcblxyXG4gICAgICAvLyAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxyXG4gICAgICAvLyAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcclxuICAgICAgLy8gICAgIHRoaXMuU291cmNlcy5Mb2FkUmlycygpO1xyXG4gICAgICAvLyAgICAgYnJlYWs7XHJcblxyXG4gICAgICAvLyAgIGRlZmF1bHQ6XHJcbiAgICAgIC8vICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XHJcbiAgICAgIC8vIH1cclxuXHJcbiAgICAgIC8vIFdhaXQgdW50aWwgYXVkaW9CdWZmZXIgaGFzIGJlZW4gbG9hZGVkIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkU291bmRCYW5rKCknKVxyXG4gICAgICAvLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYXVkaW9Mb2FkZWRcIiwgKCkgPT4ge1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkF1ZGlvIGJ1ZmZlcnMgaGF2ZSBiZWVuIGxvYWRlZCBmcm9tIHNvdXJjZTogXCIgKyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhKTtcclxuXHJcbiAgICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXHJcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkpXHJcbiAgICAgICAgdGhpcy5SYW5nZSh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLnh5eiwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkpO1xyXG5cclxuICAgICAgICAvLyBJbnN0YW5jaWF0ZSAndGhpcy5zY2FsZSdcclxuICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xyXG5cclxuICAgICAgICAvLyBHZXQgb2Zmc2V0IHBhcmFtZXRlcnMgb2YgdGhlIGRpc3BsYXlcclxuICAgICAgICB0aGlzLm9mZnNldCA9IHtcclxuICAgICAgICAgIHg6IHRoaXMucmFuZ2UubW95WCxcclxuICAgICAgICAgIHk6IHRoaXMucmFuZ2UubWluWVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBsaXN0ZW5lckluaXRQb3MgPSB7XHJcbiAgICAgICAgICB4OiB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WCxcclxuICAgICAgICAgIHk6IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzXHJcbiAgICAgICAgdGhpcy5MaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcihsaXN0ZW5lckluaXRQb3MsIHRoaXMucGFyYW1ldGVycyk7XHJcbiAgICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCh0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJpY2lcIilcclxuICAgICAgICAvLyBTdGFydCB0aGUgc291cmNlcyBkaXNwbGF5IGFuZCBhdWRpbyBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBpbml0aWFsIHBvc2l0aW9uXHJcbiAgICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7XHJcblxyXG4gICAgICAgIC8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0xpc3RlbmVyTW92ZScsICgpID0+IHtcclxuICAgICAgICAvLyAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxyXG4gICAgICAgIC8vICAgdGhpcy5VcGRhdGVDb250YWluZXIoKVxyXG4gICAgICAgIC8vICAgdGhpcy5yZW5kZXIoKTtcclxuICAgICAgICAvLyB9KVxyXG5cclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdNb3ZpbmcnLCAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cclxuICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKClcclxuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICBcclxuICAgICAgICAvLyBBZGQgZXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSB3aW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJiYWggb3VpXCIpXHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcclxuXHJcbiAgICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcclxuXHJcbiAgICAgICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBTdGF0ZVxyXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBEaXNwbGF5XHJcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLy8gRGlzcGxheVxyXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgIC8vIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBSYW5nZShhdWRpb1NvdXJjZXNQb3NpdGlvbnMsIHNvdXJjZXNQb3NpdGlvbnMpIHsgLy8gU3RvcmUgdGhlIGFycmF5IHByb3BlcnRpZXMgaW4gJ3RoaXMucmFuZ2UnXHJcbiAgICAvLyBjb25zb2xlLmxvZyhzb3VyY2VzUG9zaXRpb25zKVxyXG5cclxuICAgIHRoaXMucmFuZ2UgPSB7XHJcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxyXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcclxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxyXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcclxuICAgIH07XHJcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UgPSB7XHJcbiAgICAgIG1pblg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxyXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcclxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxyXG4gICAgICBtYXhZOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueSxcclxuICAgIH07XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhdWRpb1NvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1pblggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcclxuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueDtcclxuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xyXG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XHJcbiAgICAgICAgdGhpcy5wb3NpdGlvblJhbmdlLm1heFkgPSBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbaV0ueTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcclxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcclxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XHJcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xyXG5cclxuICAgIC8vIHZhciBEID0ge3RlbXBSYW5nZTogdGhpcy5yYW5nZX07XHJcbiAgICAvLyB0aGlzLnBvc2l0aW9uUmFuZ2UgPSBELnRlbXBSYW5nZTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZXNQb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgY29uc29sZS5sb2codGhpcy5yYW5nZS5taW5YKVxyXG5cclxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcclxuXHJcbiAgICAgIH1cclxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcclxuICAgICAgfVxyXG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcclxuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XHJcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xyXG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XHJcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcclxuXHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnJhbmdlLm1pblgpXHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWClcclxuICB9XHJcblxyXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcclxuXHJcbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcclxuICAgIHJldHVybiAoc2NhbGUpO1xyXG4gIH1cclxuXHJcbiAgcmVuZGVyKCkge1xyXG5cclxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXHJcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XHJcblxyXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG5cclxuICAgICAgLy8gQmVnaW4gdGhlIHJlbmRlciBvbmx5IHdoZW4gYXVkaW9EYXRhIGFyYSBsb2FkZWRcclxuICAgICAgcmVuZGVyKGh0bWxgXHJcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XHJcbiAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxyXG4gICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+TGF5IHRoZSBwaG9uZSBmbGF0IGFuZCBmYWNpbmcgdGhlIGFwcCB1c2FnZSBzcGFjZVxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJkZWJ1Z2dpbmdcIiB2YWx1ZT1cImRlYnVnXCIvPiBEZWJ1Z1xyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cclxuICAgICAgICAgIDxkaXYgaWQ9XCJpbnN0cnVtZW50Q29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XHJcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xyXG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XHJcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogei1pbmRleDogMDtcclxuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgvMikqdGhpcy5zY2FsZX1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XHJcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xyXG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XHJcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xyXG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcclxuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygodGhpcy5wb3NpdGlvblJhbmdlLm1pblggLSB0aGlzLnJhbmdlLm1pblggLSB0aGlzLnJhbmdlLnJhbmdlWC8yKSp0aGlzLnNjYWxlKX1weCwgJHsodGhpcy5wb3NpdGlvblJhbmdlLm1pblkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUgKyB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPHNjcmlwdD5cclxuICAgICAgICAgIGZ1bmN0aW9uIG15TWFwKCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY2FpbGxvdScpXHJcbiAgICAgICAgICAgIGFsZXJ0KCdjYWlsbG91JylcclxuICAgICAgICAgICAgdmFyIG1hcFByb3A9IHtcclxuICAgICAgICAgICAgICBjZW50ZXI6bmV3IGdvb2dsZS5tYXBzLkxhdExuZyg1MS41MDg3NDIsLTAuMTIwODUwKSxcclxuICAgICAgICAgICAgICB6b29tOjUsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHZhciBtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ29vZ2xlTWFwXCIpLG1hcFByb3ApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICA8L3NjcmlwdD5cclxuXHJcbiAgICAgICAgICA8c2NyaXB0IGFzeW5jIGRlZmVyIHNyYz1cImh0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9rZXk9QUl6YVN5Qlo4T2Q4MHdxZl9PS1lMX282MjNnUjQwd0FnZmUtRERFJmNhbGxiYWNrPW15TWFwXCI+XHJcbiAgICAgICAgICA8L3NjcmlwdD5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcclxuXHJcbiAgICAgIC8vIC8vIGFsZXJ0KCdjYWlsbG91JylcclxuICAgICAgLy8gZmV0Y2goXCJodHRwczovL2FnaWxlLXdhdGVycy02OTg3OC5oZXJva3VhcHAuY29tL2h0dHBzOi8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcz9rZXk9QUl6YVN5Qlo4T2Q4MHdxZl9PS1lMX282MjNnUjQwd0FnZmUtRERFXCIpXHJcbiAgICAgIC8vIC50aGVuKHJlc3VsdHMgPT4ge1xyXG4gICAgICAvLyAgIC8vIGFsZXJ0KCdvaycpXHJcbiAgICAgIC8vICAgY29uc29sZS5sb2cocmVzdWx0cylcclxuXHJcbiAgICAgIC8vICAgLy8gdGhpcy5vayA9IHJlcXVpcmUocmVzdWx0cy51cmwpXHJcbiAgICAgIC8vICAgdGhpcy5tYXAgPSBuZXcgcmVzdWx0cy5nb29nbGUubWFwcy5NYXAoKTtcclxuICAgICAgLy8gICBjb25zb2xlLmxvZyh0aGlzLm1hcClcclxuICAgICAgLy8gfSlcclxuXHJcbiAgICAgIGNvbnN0IGlzSU9TID1cclxuICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvKGlQb2R8aVBob25lfGlQYWQpLykgJiZcclxuICAgICAgbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvQXBwbGVXZWJLaXQvKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgICB2YXIgY29tcGFzcztcclxuICAgICAgLy8gc3RhcnRCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHN0YXJ0Q29tcGFzcyk7XHJcbiAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24obG9jYXRpb25IYW5kbGVyKTtcclxuXHJcbiAgICAgIGlmICghaXNJT1MpIHtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImRldmljZW9yaWVudGF0aW9uYWJzb2x1dGVcIiwgaGFuZGxlciwgdHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzdGFydENvbXBhc3MoKSB7XHJcbiAgICAgIGlmIChpc0lPUykge1xyXG4gICAgICAgIERldmljZU9yaWVudGF0aW9uRXZlbnQucmVxdWVzdFBlcm1pc3Npb24oKVxyXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZSA9PT0gXCJncmFudGVkXCIpIHtcclxuICAgICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImRldmljZW9yaWVudGF0aW9uXCIsIGhhbmRsZXIsIHRydWUpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGFsZXJ0KFwiaGFzIHRvIGJlIGFsbG93ZWQhXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLmNhdGNoKCgpID0+IGFsZXJ0KFwibm90IHN1cHBvcnRlZFwiKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVyKGUpIHtcclxuICAgICAgdmFyIGNvbXBhc3MgPSBlLndlYmtpdENvbXBhc3NIZWFkaW5nIHx8IE1hdGguYWJzKGUuYWxwaGEgLSAzNjApO1xyXG4gICAgICAvLyBjb21wYXNzQ2lyY2xlLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGUoLTUwJSwgLTUwJSkgcm90YXRlKCR7LWNvbXBhc3N9ZGVnKWA7XHJcbiAgICAgIGNvbnNvbGUubG9nKGNvbXBhc3MpXHJcbiAgICAgIC8vIMKxMTUgZGVncmVlXHJcbiAgICAgIGlmIChcclxuICAgICAgICAocG9pbnREZWdyZWUgPCBNYXRoLmFicyhjb21wYXNzKSAmJlxyXG4gICAgICAgICAgcG9pbnREZWdyZWUgKyAxNSA+IE1hdGguYWJzKGNvbXBhc3MpKSB8fFxyXG4gICAgICAgIHBvaW50RGVncmVlID4gTWF0aC5hYnMoY29tcGFzcyArIDE1KSB8fFxyXG4gICAgICAgIHBvaW50RGVncmVlIDwgTWF0aC5hYnMoY29tcGFzcylcclxuICAgICAgKSB7XHJcbiAgICAgICAgLy8gbXlQb2ludC5zdHlsZS5vcGFjaXR5ID0gMDtcclxuICAgICAgfSBlbHNlIGlmIChwb2ludERlZ3JlZSkge1xyXG4gICAgICAgIC8vIG15UG9pbnQuc3R5bGUub3BhY2l0eSA9IDE7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBsZXQgcG9pbnREZWdyZWU7XHJcblxyXG4gICAgZnVuY3Rpb24gbG9jYXRpb25IYW5kbGVyKHBvc2l0aW9uKSB7XHJcbiAgICAgIGNvbnN0IHsgbGF0aXR1ZGUsIGxvbmdpdHVkZSB9ID0gcG9zaXRpb24uY29vcmRzO1xyXG4gICAgICBwb2ludERlZ3JlZSA9IGNhbGNEZWdyZWVUb1BvaW50KGxhdGl0dWRlLCBsb25naXR1ZGUpO1xyXG5cclxuICAgICAgaWYgKHBvaW50RGVncmVlIDwgMCkge1xyXG4gICAgICAgIHBvaW50RGVncmVlID0gcG9pbnREZWdyZWUgKyAzNjA7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjYWxjRGVncmVlVG9Qb2ludChsYXRpdHVkZSwgbG9uZ2l0dWRlKSB7XHJcbiAgICAgIC8vIFFpYmxhIGdlb2xvY2F0aW9uXHJcbiAgICAgIGNvbnN0IHBvaW50ID0ge1xyXG4gICAgICAgIGxhdDogMjEuNDIyNDg3LFxyXG4gICAgICAgIGxuZzogMzkuODI2MjA2XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBjb25zdCBwaGlLID0gKHBvaW50LmxhdCAqIE1hdGguUEkpIC8gMTgwLjA7XHJcbiAgICAgIGNvbnN0IGxhbWJkYUsgPSAocG9pbnQubG5nICogTWF0aC5QSSkgLyAxODAuMDtcclxuICAgICAgY29uc3QgcGhpID0gKGxhdGl0dWRlICogTWF0aC5QSSkgLyAxODAuMDtcclxuICAgICAgY29uc3QgbGFtYmRhID0gKGxvbmdpdHVkZSAqIE1hdGguUEkpIC8gMTgwLjA7XHJcbiAgICAgIGNvbnN0IHBzaSA9XHJcbiAgICAgICAgKDE4MC4wIC8gTWF0aC5QSSkgKlxyXG4gICAgICAgIE1hdGguYXRhbjIoXHJcbiAgICAgICAgICBNYXRoLnNpbihsYW1iZGFLIC0gbGFtYmRhKSxcclxuICAgICAgICAgIE1hdGguY29zKHBoaSkgKiBNYXRoLnRhbihwaGlLKSAtXHJcbiAgICAgICAgICAgIE1hdGguc2luKHBoaSkgKiBNYXRoLmNvcyhsYW1iZGFLIC0gbGFtYmRhKVxyXG4gICAgICAgICk7XHJcbiAgICAgIHJldHVybiBNYXRoLnJvdW5kKHBzaSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpXHJcblxyXG4gICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXHJcbiAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7ICAgICAgICAgIC8vIFVwZGF0ZSBpbml0aWFsaXNpbmcgU3RhdGVcclxuXHJcbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXHJcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcclxuXHJcbiAgICAgICAgdmFyIGRlYnVnZ2luZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWJ1Z2dpbmcnKTtcclxuXHJcbiAgICAgICAgZGVidWdnaW5nLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGJveCkgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coYm94LnRhcmdldC5jaGVja2VkKVxyXG4gICAgICAgICAgdGhpcy5MaXN0ZW5lci5DaGFuZ2VEZWJ1Zyhib3gudGFyZ2V0LmNoZWNrZWQpO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHRvIGJlZ2luIHRoZSBzaW11bGF0aW9uXHJcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xyXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XHJcblxyXG4gICAgICAgICAgLy8gQXNzaWduIGdsb2FibCBjb250YWluZXJzXHJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXHJcbiAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKClcclxuXHJcbiAgICAgICAgICAvLyBBZGQgbW91c2VFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXHJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChtb3VzZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XHJcbiAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcclxuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcclxuICAgICAgICAgIH0sIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXHJcbiAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xyXG4gICAgICAgICAgfSwgZmFsc2UpO1xyXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcclxuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSwgZmFsc2UpO1xyXG4gICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcclxuICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XHJcbiAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIGF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBzb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcclxuXHJcbiAgICAvLyBDcmVhdGUgYW5kIGRpc3BsYXkgb2JqZWN0c1xyXG4gICAgdGhpcy5DcmVhdGVJbnN0cnVtZW50cygpO1xyXG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlcyBhbmQgZGlzcGxheSB0aGVtXHJcbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBsaXN0ZW5lcidzIGRpc3BsYXkgdG8gdGhlIGNvbnRhaW5lclxyXG4gICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxyXG4gICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJyZW5kZXJlZFwiKSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGFuIGV2ZW50IHdoZW4gdGhlIHNpbXVsYXRpb24gYXBwZWFyZWRcclxuICB9XHJcblxyXG4gIENyZWF0ZUluc3RydW1lbnRzKCkge1xyXG4gICAgdmFyIGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdpbnN0cnVtZW50Q29udGFpbmVyJylcclxuICAgIHZhciBjaXJjbGVEaWFtZXRlciA9IHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcjtcclxuICAgIHRoaXMuaW5zdHJ1bWVudHMgPSBbXVxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xyXG5cclxuICAgICAgdGhpcy5pbnN0cnVtZW50cy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZSdzIGRpc3BsYXlcclxuICAgICAgLy8gdGhpcy5zb3VyY2VzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpOyAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGVsZW1lbnRcclxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pZCA9IFwiaW5zdHJ1bWVudFwiICsgaTsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIGlkXHJcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaW5uZXJIVE1MID0gXCJTXCI7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSB2YWx1ZSAoaSsxKVxyXG5cclxuICAgICAgLy8gQ2hhbmdlIGZvcm0gYW5kIHBvc2l0aW9uIG9mIHRoZSBlbGVtZW50IHRvIGdldCBhIGNpcmNsZSBhdCB0aGUgZ29vZCBwbGFjZTtcclxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcclxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5tYXJnaW4gPSBcIjAgXCIgKyAoLWNpcmNsZURpYW1ldGVyLzIpICsgXCJweFwiO1xyXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLndpZHRoID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XHJcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuaGVpZ2h0ID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XHJcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYm9yZGVyUmFkaXVzID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XHJcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUubGluZUhlaWdodCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xyXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmJhY2tncm91bmQgPSBcInJlZFwiO1xyXG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnpJbmRleCA9IDE7XHJcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBcclxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXHJcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xyXG5cclxuICAgICAgY29uc29sZS5sb2coKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YSkpXHJcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSlcclxuICAgICAgY29uc29sZS5sb2coKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnkgLSB0aGlzLm9mZnNldC55KSp0aGlzLnNjYWxlKVxyXG5cclxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUncyBkaXNwbGF5IHRvIHRoZSBnbG9iYWwgY29udGFpbmVyXHJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmluc3RydW1lbnRzW2ldKTtcclxuICAgICAgY29uc29sZS5sb2coXCJ6YmxvXCIpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKSB7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyBcclxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXHJcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgbGlzdGVuZXIncyBwb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXHJcblxyXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIGxpc3RlbmVyJ3MgcG9zaXRpb25cclxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xyXG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMikvKHRoaXMuc2NhbGUpO1xyXG5cclxuICAgIC8vIENoZWNrIGlmIHRoZSB2YWx1ZSBpcyBpbiB0aGUgdmFsdWVzIHJhbmdlXHJcbiAgICBpZiAodGVtcFggPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFkpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxyXG5cclxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXlcclxuICAgICAgLy8gdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGxpc3RlbmVyJ3MgcG9zaXRpb25cclxuICAgICAgdGhpcy5MaXN0ZW5lci5SZXNldChtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpO1xyXG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cclxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgdGhlIGRpc3BsYXlcclxuICAgIH1cclxuXHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uIFVwZGF0ZVxyXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xyXG4gICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXHJcblxyXG4gICAgLy8gQ2hhbmdlIHNpemUgb2YgZGlzcGxheVxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMub2Zmc2V0LnkqdGhpcy5zY2FsZSkgKyBcInB4XCI7XHJcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLm9mZnNldC54KnRoaXMuc2NhbGUpICsgXCJweFwiO1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xyXG5cclxuICAgIHRoaXMuU291cmNlcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24odGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgIC8vIFVwZGF0ZSBzb3VyY2VzJyBkaXNwbGF5XHJcbiAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyRGlzcGxheSh0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XHJcbiAgICB0aGlzLlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0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