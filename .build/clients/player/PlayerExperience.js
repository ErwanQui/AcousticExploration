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
      nbClosestPoints: 5,
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

    };
    this.playerAutoMove = {
      on: false,
      speed: 1,
      // Speed in meter/second
      interval: 100
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

      this.Sources.start(this.Listener.listenerPosition); // Add event listener for resize window event to resize the display

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
            <input type="button" id="beginButton" value="Begin Game"/>
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
        </div>
      `, this.$container); // Do this only at beginning

      if (this.initialising) {
        this.initialising = false; // Update initialising State
        // Assign callbacks once

        var beginButton = document.getElementById("beginButton");
        beginButton.addEventListener("click", () => {
          // Change the display to begin the simulation
          document.getElementById("begin").style.visibility = "hidden";
          document.getElementById("begin").style.position = "absolute";
          document.getElementById("game").style.visibility = "visible"; // Assign gloabl containers

          this.container = document.getElementById('circleContainer'); // Assign mouse and touch callbacks to change the user Position

          this.onBeginButtonClicked(); // if (!this.playerAutoMove) {
          // Add mouseEvents to do actions when the user does actions on the screen

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
          // }
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

    if (this.playerAutoMove.on) {
      setInterval(() => {
        console.log("Updating");
        this.Listener.AutoMove(this.playerAutoMove.speed, this.playerAutoMove.interval, [this.positionRange.minX, this.positionRange.minY], [this.positionRange.maxX, this.positionRange.maxY]);
        this.Listener.UpdateListenerDisplay(this.offset, this.scale); // Update listener's display

        this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // Update the sound depending on listener's position

        this.render();
      }, this.playerAutoMove.interval);
    }

    document.addEventListener("Moving", () => {
      this.Sources.onListenerPositionChanged(this.Listener.listenerPosition); // Update the sound depending on listener's position

      this.render();
    });
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

      this.Listener.UpdateListener(mouse, this.offset, this.scale); // Update the listener's position
      // this.Sources.onListenerPositionChanged(this.Listener.listenerPosition);         // Update the sound depending on listener's position
      // this.render();                                                                  // Update the display
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwicGxheWVyQXV0b01vdmUiLCJvbiIsInNwZWVkIiwiaW50ZXJ2YWwiLCJpbml0aWFsaXNpbmciLCJiZWdpblByZXNzZWQiLCJtb3VzZURvd24iLCJ0b3VjaGVkIiwiTGlzdGVuZXIiLCJTb3VyY2VzIiwicmFuZ2UiLCJzY2FsZSIsIm9mZnNldCIsImNvbnRhaW5lciIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiY29uc29sZSIsImxvZyIsImFsZXJ0IiwiTG9hZERhdGEiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJzb3VyY2VzRGF0YSIsInNvdXJjZXNfeHkiLCJSYW5nZSIsInJlY2VpdmVycyIsInh5eiIsIlNjYWxpbmciLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwibGlzdGVuZXJJbml0UG9zIiwicG9zaXRpb25SYW5nZSIsImxpc3RlbmVyUG9zaXRpb24iLCJ3aW5kb3ciLCJVcGRhdGVDb250YWluZXIiLCJyZW5kZXIiLCJhdWRpb1NvdXJjZXNQb3NpdGlvbnMiLCJzb3VyY2VzUG9zaXRpb25zIiwibWluWCIsIm1heFgiLCJtYXhZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImh0bWwiLCJ0eXBlIiwiaWQiLCJiZWdpbkJ1dHRvbiIsImdldEVsZW1lbnRCeUlkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb24iLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsIm1vdXNlIiwidXNlckFjdGlvbiIsImV2dCIsImNoYW5nZWRUb3VjaGVzIiwiQ3JlYXRlSW5zdHJ1bWVudHMiLCJDcmVhdGVTb3VyY2VzIiwiRGlzcGxheSIsImRpc3BhdGNoRXZlbnQiLCJFdmVudCIsInNldEludGVydmFsIiwiQXV0b01vdmUiLCJVcGRhdGVMaXN0ZW5lckRpc3BsYXkiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaW5zdHJ1bWVudHMiLCJwdXNoIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsIm1hcmdpbiIsIndpZHRoIiwiaGVpZ2h0IiwiYm9yZGVyUmFkaXVzIiwibGluZUhlaWdodCIsImJhY2tncm91bmQiLCJ6SW5kZXgiLCJ0cmFuc2Zvcm0iLCJhcHBlbmRDaGlsZCIsIlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSIsInRlbXBYIiwiY2xpZW50WCIsInRlbXBZIiwiY2xpZW50WSIsIlVwZGF0ZUxpc3RlbmVyIiwiVlBvczJQaXhlbCIsIlVwZGF0ZVNvdXJjZXNQb3NpdGlvbiJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmltcG9ydCBMaXN0ZW5lciBmcm9tICcuL0xpc3RlbmVyLmpzJ1xuaW1wb3J0IFNvdXJjZXMgZnJvbSAnLi9Tb3VyY2VzLmpzJ1xuLy8gaW1wb3J0IHsgU2NoZWR1bGVyIH0gZnJvbSAnd2F2ZXMtbWFzdGVycyc7XG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyLCBhdWRpb0NvbnRleHQpIHtcblxuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTsgICAgIC8vIFRvIGxvYWQgYXVkaW9CdWZmZXJzXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7ICAgICAgICAgICAgICAgICAgICAgLy8gVG8gZ2V0IGZpbGVzXG4gICAgdGhpcy5zeW5jID0gdGhpcy5yZXF1aXJlKCdzeW5jJyk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gc3luYyBhdWRpbyBzb3VyY2VzXG4gICAgdGhpcy5wbGF0Zm9ybSA9IHRoaXMucmVxdWlyZSgncGxhdGZvcm0nKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcbiAgICB0aGlzLmF1ZGlvU3RyZWFtID0gdGhpcy5yZXF1aXJlKCdhdWRpby1zdHJlYW1zJyk7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIG1hbmFnZSBwbHVnaW4gZm9yIHRoZSBzeW5jXG5cbiAgICAvLyBWYXJpYWJsZSBwYXJhbWV0ZXJzXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgYXVkaW9Db250ZXh0OiBhdWRpb0NvbnRleHQsICAgICAgICAgICAgICAgLy8gR2xvYmFsIGF1ZGlvQ29udGV4dFxuICAgICAgb3JkZXI6IDIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT3JkZXIgb2YgYW1iaXNvbmljc1xuICAgICAgbmJDbG9zZXN0U291cmNlczogMywgICAgICAgICAgICAgICAgICAgICAgIC8vIE51bWJlciBvZiBjbG9zZXN0IHBvaW50cyBzZWFyY2hlZFxuICAgICAgbmJDbG9zZXN0UG9pbnRzOiA1LCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFeHBvc2FudCBvZiB0aGUgZ2FpbnMgKHRvIGluY3JlYXNlIGNvbnRyYXN0ZSlcbiAgICAgIC8vIG1vZGU6IFwiZGVidWdcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwic3RyZWFtaW5nXCIsIFwiYW1iaXNvbmljXCIsIFwiY29udm9sdmluZ1wiLCBcImFtYmlDb252b2x2aW5nXCIpXG4gICAgICBtb2RlOiBcInN0cmVhbWluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpc29uaWNcIixcbiAgICAgIC8vIG1vZGU6IFwiY29udm9sdmluZ1wiLFxuICAgICAgLy8gbW9kZTogXCJhbWJpQ29udm9sdmluZ1wiLFxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRGlhbWV0ZXIgb2Ygc291cmNlcycgZGlzcGxheVxuICAgICAgbGlzdGVuZXJTaXplOiAxNiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2l6ZSBvZiBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJcIiwgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIHNvdXJjZXMnIHBvc2l0aW9uIGFuZCBhdWRpb0RhdGFzJyBmaWxlbmFtZXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgICBhdWRpb0RhdGE6IFwiXCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsbCBhdWRpb0RhdGFzIChpbnN0YW50aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIH1cblxuICAgIHRoaXMucGxheWVyQXV0b01vdmUgPSB7XG4gICAgICBvbjogZmFsc2UsXG4gICAgICBzcGVlZDogMSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3BlZWQgaW4gbWV0ZXIvc2Vjb25kXG4gICAgICBpbnRlcnZhbDogMTAwXG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGlzYXRpb24gdmFyaWFibGVzXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcblxuICAgIC8vIEluc3RhbmNpYXRlIGNsYXNzZXMnIHN0b3JlclxuICAgIHRoaXMuTGlzdGVuZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdMaXN0ZW5lcicgY2xhc3NcbiAgICB0aGlzLlNvdXJjZXM7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSAnU291cmNlcycgY2xhc3NcblxuICAgIC8vIEdsb2JhbCB2YWx1ZXNcbiAgICB0aGlzLnJhbmdlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhbHVlcyBvZiB0aGUgYXJyYXkgZGF0YSAoY3JlYXRlcyBpbiAnc3RhcnQoKScpXG4gICAgdGhpcy5zY2FsZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIFNjYWxlcyAoaW5pdGlhdGVkIGluICdzdGFydCgpJylcbiAgICB0aGlzLm9mZnNldDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9mZnNldCBvZiB0aGUgZGlzcGxheVxuICAgIHRoaXMuY29udGFpbmVyOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBjb250YWluZXIgb2YgZGlzcGxheSBlbGVtZW50cyAoY3JlYXRlcyBpbiAncmVuZGVyKCknKVxuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuXG4gICAgc3VwZXIuc3RhcnQoKTtcblxuICAgIGNvbnNvbGUubG9nKFwiWW91IGFyZSB1c2luZyBcIiArIHRoaXMucGFyYW1ldGVycy5tb2RlICsgXCIgbW9kZS5cIik7XG5cbiAgICAvLyBTd2l0Y2ggZmlsZXMnIG5hbWVzIGFuZCBhdWRpb3MsIGRlcGVuZGluZyBvbiB0aGUgbW9kZSBjaG9zZW5cbiAgICBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XG4gICAgICBjYXNlICdkZWJ1Zyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczAnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMC5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNNdXNpYzEnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMS5qc29uJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzUGlhbm8nO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lUGlhbm8uanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMyJztcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzU3BlZWNoMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUyLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczMnO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMy5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzNCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmU0Lmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSB0aGUgb2JqZWN0cyBzdG9yZXIgZm9yIHNvdXJjZXMgYW5kIGxvYWQgdGhlaXIgZmlsZURhdGFzXG4gICAgdGhpcy5Tb3VyY2VzID0gbmV3IFNvdXJjZXModGhpcy5maWxlc3lzdGVtLCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLCB0aGlzLnBhcmFtZXRlcnMsIHRoaXMucGxhdGZvcm0sIHRoaXMuc3luYywgdGhpcy5hdWRpb1N0cmVhbSlcbiAgICB0aGlzLlNvdXJjZXMuTG9hZERhdGEoKTtcblxuICAgIC8vIFdhaXQgdW50aWwgZGF0YSBoYXZlIGJlZW4gbG9hZGVkIGZyb20ganNvbiBmaWxlcyAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZERhdGEoKScpXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRhdGFMb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICBjb25zb2xlLmxvZyhcImpzb24gZmlsZXM6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSArIFwiIGhhcyBiZWVuIHJlYWRcIik7XG5cbiAgICAgIC8vIExvYWQgc291cmNlcycgc291bmQgZGVwZW5kaW5nIG9uIG1vZGUgKHNvbWUgbW9kZXMgbmVlZCBSSVJzIGluIGFkZGl0aW9uIG9mIHNvdW5kcylcbiAgICAgIC8vIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIC8vICAgY2FzZSAnZGVidWcnOlxuICAgICAgLy8gICBjYXNlICdzdHJlYW1pbmcnOlxuICAgICAgLy8gICBjYXNlICdhbWJpc29uaWMnOlxuICAgICAgLy8gICAgIHRoaXMuU291cmNlcy5Mb2FkU291bmRiYW5rKCk7XG4gICAgICAvLyAgICAgYnJlYWs7XG5cbiAgICAgIC8vICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAvLyAgIGNhc2UgJ2FtYmlDb252b2x2aW5nJzpcbiAgICAgIC8vICAgICB0aGlzLlNvdXJjZXMuTG9hZFJpcnMoKTtcbiAgICAgIC8vICAgICBicmVhaztcblxuICAgICAgLy8gICBkZWZhdWx0OlxuICAgICAgLy8gICAgIGFsZXJ0KFwiTm8gdmFsaWQgbW9kZVwiKTtcbiAgICAgIC8vIH1cblxuICAgICAgLy8gV2FpdCB1bnRpbCBhdWRpb0J1ZmZlciBoYXMgYmVlbiBsb2FkZWQgKFwiZGF0YUxvYWRlZFwiIGV2ZW50IGlzIGNyZWF0ZSAndGhpcy5Tb3VyY2VzLkxvYWRTb3VuZEJhbmsoKScpXG4gICAgICAvLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiYXVkaW9Mb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQXVkaW8gYnVmZmVycyBoYXZlIGJlZW4gbG9hZGVkIGZyb20gc291cmNlOiBcIiArIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEpO1xuXG4gICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBhdHRyaWJ1dGUgJ3RoaXMucmFuZ2UnIHRvIGdldCBkYXRhcycgcGFyYW1ldGVyc1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSlcbiAgICAgICAgdGhpcy5SYW5nZSh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLnh5eiwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkpO1xuXG4gICAgICAgIC8vIEluc3RhbmNpYXRlICd0aGlzLnNjYWxlJ1xuICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuXG4gICAgICAgIC8vIEdldCBvZmZzZXQgcGFyYW1ldGVycyBvZiB0aGUgZGlzcGxheVxuICAgICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgICB4OiB0aGlzLnJhbmdlLm1veVgsXG4gICAgICAgICAgeTogdGhpcy5yYW5nZS5taW5ZXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGxpc3RlbmVySW5pdFBvcyA9IHtcbiAgICAgICAgICB4OiB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWVxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENyZWF0ZSwgc3RhcnQgYW5kIHN0b3JlIHRoZSBsaXN0ZW5lciBjbGFzc1xuICAgICAgICB0aGlzLkxpc3RlbmVyID0gbmV3IExpc3RlbmVyKGxpc3RlbmVySW5pdFBvcywgdGhpcy5wYXJhbWV0ZXJzKTtcbiAgICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCh0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaWNpXCIpXG4gICAgICAgIC8vIFN0YXJ0IHRoZSBzb3VyY2VzIGRpc3BsYXkgYW5kIGF1ZGlvIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIGluaXRpYWwgcG9zaXRpb25cbiAgICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7XG4gICAgICAgIC8vIEFkZCBldmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIHdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgY29uc29sZS5sb2coXCJiYWggb3VpXCIpXG5cblxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuXG4gICAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG5cbiAgICAgICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBTdGF0ZVxuICAgICAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTsgICAgICAgICAgICAgICAgICAgLy8gUmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIC8vIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgUmFuZ2UoYXVkaW9Tb3VyY2VzUG9zaXRpb25zLCBzb3VyY2VzUG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIC8vIGNvbnNvbGUubG9nKHNvdXJjZXNQb3NpdGlvbnMpXG5cbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlID0ge1xuICAgICAgbWluWDogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS55LFxuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGF1ZGlvU291cmNlc1Bvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WCA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubWF4WSA9IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgLy8gdmFyIEQgPSB7dGVtcFJhbmdlOiB0aGlzLnJhbmdlfTtcbiAgICAvLyB0aGlzLnBvc2l0aW9uUmFuZ2UgPSBELnRlbXBSYW5nZTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc291cmNlc1Bvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc29sZS5sb2codGhpcy5yYW5nZS5taW5YKVxuXG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcblxuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBzb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnJhbmdlLm1pblgpXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5wb3NpdGlvblJhbmdlLm1pblgpXG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0aGF0IGRpc3BsYXlzIGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG5cbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcblxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXYgaWQ9XCJpbnN0cnVtZW50Q29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWC8yKSp0aGlzLnNjYWxlfXB4LCAke3RoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJzZWxlY3RvclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoKHRoaXMucG9zaXRpb25SYW5nZS5taW5YIC0gdGhpcy5yYW5nZS5taW5YIC0gdGhpcy5yYW5nZS5yYW5nZVgvMikqdGhpcy5zY2FsZSl9cHgsICR7KHRoaXMucG9zaXRpb25SYW5nZS5taW5ZIC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlICsgdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuXG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cbiAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9hYmwgY29udGFpbmVyc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgLy8gaWYgKCF0aGlzLnBsYXllckF1dG9Nb3ZlKSB7XG5cbiAgICAgICAgICAgIC8vIEFkZCBtb3VzZUV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG4gICAgICAgICAgLy8gfVxuXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIGF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBzb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIENyZWF0ZSBhbmQgZGlzcGxheSBvYmplY3RzXG4gICAgdGhpcy5DcmVhdGVJbnN0cnVtZW50cygpO1xuICAgIHRoaXMuU291cmNlcy5DcmVhdGVTb3VyY2VzKHRoaXMuY29udGFpbmVyLCB0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZXMgYW5kIGRpc3BsYXkgdGhlbVxuICAgIHRoaXMuTGlzdGVuZXIuRGlzcGxheSh0aGlzLmNvbnRhaW5lcik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyJ3MgZGlzcGxheSB0byB0aGUgY29udGFpbmVyXG4gICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVuZGVyZWRcIikpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBldmVudCB3aGVuIHRoZSBzaW11bGF0aW9uIGFwcGVhcmVkXG4gICAgaWYgKHRoaXMucGxheWVyQXV0b01vdmUub24pIHtcbiAgICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxuICAgICAgICB0aGlzLkxpc3RlbmVyLkF1dG9Nb3ZlKHRoaXMucGxheWVyQXV0b01vdmUuc3BlZWQsIHRoaXMucGxheWVyQXV0b01vdmUuaW50ZXJ2YWwsIFt0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCwgdGhpcy5wb3NpdGlvblJhbmdlLm1pblldLCBbdGhpcy5wb3NpdGlvblJhbmdlLm1heFgsIHRoaXMucG9zaXRpb25SYW5nZS5tYXhZXSk7XG4gICAgICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgXG4gICAgICB9LCB0aGlzLnBsYXllckF1dG9Nb3ZlLmludGVydmFsKVxuICAgIH1cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiTW92aW5nXCIsICgpID0+IHtcbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICBcbiAgICB9KTtcbiAgfVxuXG4gIENyZWF0ZUluc3RydW1lbnRzKCkge1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5zdHJ1bWVudENvbnRhaW5lcicpXG4gICAgdmFyIGNpcmNsZURpYW1ldGVyID0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyO1xuICAgIHRoaXMuaW5zdHJ1bWVudHMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkubGVuZ3RoOyBpKyspIHtcblxuICAgICAgdGhpcy5pbnN0cnVtZW50cy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlJ3MgZGlzcGxheVxuICAgICAgLy8gdGhpcy5zb3VyY2VzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpOyAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGVsZW1lbnRcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaWQgPSBcImluc3RydW1lbnRcIiArIGk7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pbm5lckhUTUwgPSBcIlNcIjsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIHZhbHVlIChpKzEpXG5cbiAgICAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5tYXJnaW4gPSBcIjAgXCIgKyAoLWNpcmNsZURpYW1ldGVyLzIpICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS53aWR0aCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5oZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYm9yZGVyUmFkaXVzID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmxpbmVIZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnpJbmRleCA9IDE7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuXG4gICAgICBjb25zb2xlLmxvZygodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhKSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSlcblxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUncyBkaXNwbGF5IHRvIHRoZSBnbG9iYWwgY29udGFpbmVyXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnN0cnVtZW50c1tpXSk7XG4gICAgICBjb25zb2xlLmxvZyhcInpibG9cIilcbiAgICB9XG4gIH1cblxuICBVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcbiAgICB9XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBsaXN0ZW5lcidzIHBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMikvKHRoaXMuc2NhbGUpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmdcIilcblxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXlcbiAgICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXIobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICAvLyB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIC8vIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplIG9mIGRpc3BsYXlcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5vZmZzZXQueSp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLm9mZnNldC54KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweClcIjtcblxuICAgIHRoaXMuU291cmNlcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24odGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpOyAgICAgIC8vIFVwZGF0ZSBzb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lckRpc3BsYXkodGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICAgIHRoaXMuVXBkYXRlSW5zdHJ1bWVudHNEaXNwbGF5KCk7ICAgICAvLyBVcGRhdGUgbGlzdGVuZXIncyBkaXNwbGF5XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUNBO0FBRUEsTUFBTUEsZ0JBQU4sU0FBK0JDLDBCQUEvQixDQUFrRDtFQUNoREMsV0FBVyxDQUFDQyxNQUFELEVBQVNDLE1BQU0sR0FBRyxFQUFsQixFQUFzQkMsVUFBdEIsRUFBa0NDLFlBQWxD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