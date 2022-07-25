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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwiYXVkaW9TdHJlYW0iLCJwYXJhbWV0ZXJzIiwib3JkZXIiLCJuYkNsb3Nlc3RTb3VyY2VzIiwibmJDbG9zZXN0UG9pbnRzIiwiZ2FpbkV4cG9zYW50IiwibW9kZSIsImNpcmNsZURpYW1ldGVyIiwibGlzdGVuZXJTaXplIiwiZGF0YUZpbGVOYW1lIiwiYXVkaW9EYXRhIiwicGxheWVyQXV0b01vdmUiLCJvbiIsInNwZWVkIiwiaW50ZXJ2YWwiLCJpbml0aWFsaXNpbmciLCJiZWdpblByZXNzZWQiLCJtb3VzZURvd24iLCJ0b3VjaGVkIiwiTGlzdGVuZXIiLCJTb3VyY2VzIiwicmFuZ2UiLCJzY2FsZSIsIm9mZnNldCIsImNvbnRhaW5lciIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiY29uc29sZSIsImxvZyIsImFsZXJ0IiwiTG9hZERhdGEiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJzb3VyY2VzRGF0YSIsInNvdXJjZXNfeHkiLCJSYW5nZSIsInJlY2VpdmVycyIsInh5eiIsIlNjYWxpbmciLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwibGlzdGVuZXJJbml0UG9zIiwicG9zaXRpb25SYW5nZSIsImxpc3RlbmVyUG9zaXRpb24iLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiVXBkYXRlQ29udGFpbmVyIiwicmVuZGVyIiwid2luZG93IiwiYXVkaW9Tb3VyY2VzUG9zaXRpb25zIiwic291cmNlc1Bvc2l0aW9ucyIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJsZW5ndGgiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsImRlYnVnZ2luZyIsImJveCIsInRhcmdldCIsImNoZWNrZWQiLCJDaGFuZ2VEZWJ1ZyIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZUluc3RydW1lbnRzIiwiQ3JlYXRlU291cmNlcyIsIkRpc3BsYXkiLCJkaXNwYXRjaEV2ZW50IiwiRXZlbnQiLCJzZXRJbnRlcnZhbCIsIkF1dG9Nb3ZlIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5IiwiaW5zdHJ1bWVudHMiLCJwdXNoIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsIm1hcmdpbiIsIndpZHRoIiwiaGVpZ2h0IiwiYm9yZGVyUmFkaXVzIiwibGluZUhlaWdodCIsImJhY2tncm91bmQiLCJ6SW5kZXgiLCJ0cmFuc2Zvcm0iLCJhcHBlbmRDaGlsZCIsIlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSIsInRlbXBYIiwiY2xpZW50WCIsInRlbXBZIiwiY2xpZW50WSIsIlVwZGF0ZUxpc3RlbmVyIiwiUmVzZXQiLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIl0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG4vLyBpbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuXG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpOyAgICAgLy8gVG8gbG9hZCBhdWRpb0J1ZmZlcnNcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTsgICAgICAgICAgICAgICAgICAgICAvLyBUbyBnZXQgZmlsZXNcbiAgICB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBzeW5jIGF1ZGlvIHNvdXJjZXNcbiAgICB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBtYW5hZ2UgcGx1Z2luIGZvciB0aGUgc3luY1xuICAgIHRoaXMuYXVkaW9TdHJlYW0gPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLXN0cmVhbXMnKTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gbWFuYWdlIHBsdWdpbiBmb3IgdGhlIHN5bmNcblxuICAgIC8vIFZhcmlhYmxlIHBhcmFtZXRlcnNcbiAgICB0aGlzLnBhcmFtZXRlcnMgPSB7XG4gICAgICBhdWRpb0NvbnRleHQ6IGF1ZGlvQ29udGV4dCwgICAgICAgICAgICAgICAvLyBHbG9iYWwgYXVkaW9Db250ZXh0XG4gICAgICBvcmRlcjogMiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcmRlciBvZiBhbWJpc29uaWNzXG4gICAgICBuYkNsb3Nlc3RTb3VyY2VzOiAzLCAgICAgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGNsb3Nlc3QgcG9pbnRzIHNlYXJjaGVkXG4gICAgICBuYkNsb3Nlc3RQb2ludHM6IDUsICAgICAgICAgICAgICAgICAgICAgICAvLyBOdW1iZXIgb2YgY2xvc2VzdCBwb2ludHMgc2VhcmNoZWRcbiAgICAgIGdhaW5FeHBvc2FudDogMywgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEV4cG9zYW50IG9mIHRoZSBnYWlucyAodG8gaW5jcmVhc2UgY29udHJhc3RlKVxuICAgICAgLy8gbW9kZTogXCJkZWJ1Z1wiLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJzdHJlYW1pbmdcIiwgXCJhbWJpc29uaWNcIiwgXCJjb252b2x2aW5nXCIsIFwiYW1iaUNvbnZvbHZpbmdcIilcbiAgICAgIG1vZGU6IFwic3RyZWFtaW5nXCIsXG4gICAgICAvLyBtb2RlOiBcImFtYmlzb25pY1wiLFxuICAgICAgLy8gbW9kZTogXCJjb252b2x2aW5nXCIsXG4gICAgICAvLyBtb2RlOiBcImFtYmlDb252b2x2aW5nXCIsXG4gICAgICBjaXJjbGVEaWFtZXRlcjogMjAsICAgICAgICAgICAgICAgICAgICAgICAvLyBEaWFtZXRlciBvZiBzb3VyY2VzJyBkaXNwbGF5XG4gICAgICBsaXN0ZW5lclNpemU6IDE2LCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaXplIG9mIGxpc3RlbmVyJ3MgZGlzcGxheVxuICAgICAgZGF0YUZpbGVOYW1lOiBcIlwiLCAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBbGwgc291cmNlcycgcG9zaXRpb24gYW5kIGF1ZGlvRGF0YXMnIGZpbGVuYW1lcyAoaW5zdGFudGlhdGVkIGluICdzdGFydCgpJylcbiAgICAgIGF1ZGlvRGF0YTogXCJcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIGF1ZGlvRGF0YXMgKGluc3RhbnRpYXRlZCBpbiAnc3RhcnQoKScpXG4gICAgfVxuXG4gICAgdGhpcy5wbGF5ZXJBdXRvTW92ZSA9IHtcbiAgICAgIG9uOiBmYWxzZSxcbiAgICAgIHNwZWVkOiAxLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTcGVlZCBpbiBtZXRlci9zZWNvbmRcbiAgICAgIGludGVydmFsOiAxMDBcbiAgICB9XG5cbiAgICAvLyBJbml0aWFsaXNhdGlvbiB2YXJpYWJsZXNcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuXG4gICAgLy8gSW5zdGFuY2lhdGUgY2xhc3Nlcycgc3RvcmVyXG4gICAgdGhpcy5MaXN0ZW5lcjsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgJ0xpc3RlbmVyJyBjbGFzc1xuICAgIHRoaXMuU291cmNlczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgdGhlICdTb3VyY2VzJyBjbGFzc1xuXG4gICAgLy8gR2xvYmFsIHZhbHVlc1xuICAgIHRoaXMucmFuZ2U7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmFsdWVzIG9mIHRoZSBhcnJheSBkYXRhIChjcmVhdGVzIGluICdzdGFydCgpJylcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWF0ZWQgaW4gJ3N0YXJ0KCknKVxuICAgIHRoaXMub2Zmc2V0OyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT2Zmc2V0IG9mIHRoZSBkaXNwbGF5XG4gICAgdGhpcy5jb250YWluZXI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHZW5lcmFsIGNvbnRhaW5lciBvZiBkaXNwbGF5IGVsZW1lbnRzIChjcmVhdGVzIGluICdyZW5kZXIoKScpXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG5cbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgY29uc29sZS5sb2coXCJZb3UgYXJlIHVzaW5nIFwiICsgdGhpcy5wYXJhbWV0ZXJzLm1vZGUgKyBcIiBtb2RlLlwiKTtcblxuICAgIC8vIFN3aXRjaCBmaWxlcycgbmFtZXMgYW5kIGF1ZGlvcywgZGVwZW5kaW5nIG9uIHRoZSBtb2RlIGNob3NlblxuICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUwLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgLy8gdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlc011c2ljMSc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUxLmpzb24nO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNQaWFubyc7XG4gICAgICAgIC8vIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmVQaWFuby5qc29uJztcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczInO1xuICAgICAgICAvLyB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXNTcGVlY2gxJztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTIuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUgPSAnc2NlbmUzLmpzb24nO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXM0JztcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTQuanNvbic7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHRoZSBvYmplY3RzIHN0b3JlciBmb3Igc291cmNlcyBhbmQgbG9hZCB0aGVpciBmaWxlRGF0YXNcbiAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycywgdGhpcy5wbGF0Zm9ybSwgdGhpcy5zeW5jLCB0aGlzLmF1ZGlvU3RyZWFtKVxuICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuXG4gICAgLy8gV2FpdCB1bnRpbCBkYXRhIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBqc29uIGZpbGVzIChcImRhdGFMb2FkZWRcIiBldmVudCBpcyBjcmVhdGUgJ3RoaXMuU291cmNlcy5Mb2FkRGF0YSgpJylcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgIGNvbnNvbGUubG9nKFwianNvbiBmaWxlczogXCIgKyB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lICsgXCIgaGFzIGJlZW4gcmVhZFwiKTtcblxuICAgICAgLy8gTG9hZCBzb3VyY2VzJyBzb3VuZCBkZXBlbmRpbmcgb24gbW9kZSAoc29tZSBtb2RlcyBuZWVkIFJJUnMgaW4gYWRkaXRpb24gb2Ygc291bmRzKVxuICAgICAgLy8gc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgLy8gICBjYXNlICdkZWJ1Zyc6XG4gICAgICAvLyAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAvLyAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAvLyAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcbiAgICAgIC8vICAgICBicmVhaztcblxuICAgICAgLy8gICBjYXNlICdjb252b2x2aW5nJzpcbiAgICAgIC8vICAgY2FzZSAnYW1iaUNvbnZvbHZpbmcnOlxuICAgICAgLy8gICAgIHRoaXMuU291cmNlcy5Mb2FkUmlycygpO1xuICAgICAgLy8gICAgIGJyZWFrO1xuXG4gICAgICAvLyAgIGRlZmF1bHQ6XG4gICAgICAvLyAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgICAgLy8gfVxuXG4gICAgICAvLyBXYWl0IHVudGlsIGF1ZGlvQnVmZmVyIGhhcyBiZWVuIGxvYWRlZCAoXCJkYXRhTG9hZGVkXCIgZXZlbnQgaXMgY3JlYXRlICd0aGlzLlNvdXJjZXMuTG9hZFNvdW5kQmFuaygpJylcbiAgICAgIC8vIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJhdWRpb0xvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJBdWRpbyBidWZmZXJzIGhhdmUgYmVlbiBsb2FkZWQgZnJvbSBzb3VyY2U6IFwiICsgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSk7XG5cbiAgICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIGF0dHJpYnV0ZSAndGhpcy5yYW5nZScgdG8gZ2V0IGRhdGFzJyBwYXJhbWV0ZXJzXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5KVxuICAgICAgICB0aGlzLlJhbmdlKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6LCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eSk7XG5cbiAgICAgICAgLy8gSW5zdGFuY2lhdGUgJ3RoaXMuc2NhbGUnXG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG5cbiAgICAgICAgLy8gR2V0IG9mZnNldCBwYXJhbWV0ZXJzIG9mIHRoZSBkaXNwbGF5XG4gICAgICAgIHRoaXMub2Zmc2V0ID0ge1xuICAgICAgICAgIHg6IHRoaXMucmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgbGlzdGVuZXJJbml0UG9zID0ge1xuICAgICAgICAgIHg6IHRoaXMucG9zaXRpb25SYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucG9zaXRpb25SYW5nZS5taW5ZXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ3JlYXRlLCBzdGFydCBhbmQgc3RvcmUgdGhlIGxpc3RlbmVyIGNsYXNzXG4gICAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIobGlzdGVuZXJJbml0UG9zLCB0aGlzLnBhcmFtZXRlcnMpO1xuICAgICAgICB0aGlzLkxpc3RlbmVyLnN0YXJ0KHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTtcbiAgICAgICAgY29uc29sZS5sb2coXCJpY2lcIilcbiAgICAgICAgLy8gU3RhcnQgdGhlIHNvdXJjZXMgZGlzcGxheSBhbmQgYXVkaW8gZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgaW5pdGlhbCBwb3NpdGlvblxuICAgICAgICB0aGlzLlNvdXJjZXMuc3RhcnQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTtcblxuICAgICAgICAvLyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdMaXN0ZW5lck1vdmUnLCAoKSA9PiB7XG4gICAgICAgIC8vICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICAgIC8vICAgdGhpcy5VcGRhdGVDb250YWluZXIoKVxuICAgICAgICAvLyAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIC8vIH0pXG5cbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignTW92aW5nJywgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKClcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9KVxuICAgICAgICBcbiAgICAgICAgLy8gQWRkIGV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgd2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICBjb25zb2xlLmxvZyhcImJhaCBvdWlcIilcblxuXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG5cbiAgICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcblxuICAgICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH1cblxuICBSYW5nZShhdWRpb1NvdXJjZXNQb3NpdGlvbnMsIHNvdXJjZXNQb3NpdGlvbnMpIHsgLy8gU3RvcmUgdGhlIGFycmF5IHByb3BlcnRpZXMgaW4gJ3RoaXMucmFuZ2UnXG4gICAgLy8gY29uc29sZS5sb2coc291cmNlc1Bvc2l0aW9ucylcblxuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UgPSB7XG4gICAgICBtaW5YOiBhdWRpb1NvdXJjZXNQb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IGF1ZGlvU291cmNlc1Bvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogYXVkaW9Tb3VyY2VzUG9zaXRpb25zWzBdLnksXG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYXVkaW9Tb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5YID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhYID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5taW5ZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAoYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICAgIHRoaXMucG9zaXRpb25SYW5nZS5tYXhZID0gYXVkaW9Tb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5wb3NpdGlvblJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnBvc2l0aW9uUmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgICAvLyB2YXIgRCA9IHt0ZW1wUmFuZ2U6IHRoaXMucmFuZ2V9O1xuICAgIC8vIHRoaXMucG9zaXRpb25SYW5nZSA9IEQudGVtcFJhbmdlO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2VzUG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zb2xlLmxvZyh0aGlzLnJhbmdlLm1pblgpXG5cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gc291cmNlc1Bvc2l0aW9uc1tpXS54O1xuXG4gICAgICB9XG4gICAgICBpZiAoc291cmNlc1Bvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHNvdXJjZXNQb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChzb3VyY2VzUG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gc291cmNlc1Bvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHNvdXJjZXNQb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBzb3VyY2VzUG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcblxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UubWluWClcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWClcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRoYXQgZGlzcGxheXMgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcblxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VYLCAod2luZG93LmlubmVySGVpZ2h0IC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVkpO1xuICAgIHJldHVybiAoc2NhbGUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5MYXkgdGhlIHBob25lIGZsYXQgYW5kIGZhY2luZyB0aGUgYXBwIHVzYWdlIHNwYWNlXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJkZWJ1Z2dpbmdcIiB2YWx1ZT1cImRlYnVnXCIvPiBEZWJ1Z1xuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwiaW5zdHJ1bWVudENvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgvMikqdGhpcy5zY2FsZX1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucG9zaXRpb25SYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5wb3NpdGlvblJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KCh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCAtIHRoaXMucmFuZ2UubWluWCAtIHRoaXMucmFuZ2UucmFuZ2VYLzIpKnRoaXMuc2NhbGUpfXB4LCAkeyh0aGlzLnBvc2l0aW9uUmFuZ2UubWluWSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZSArIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7ICAgICAgICAgIC8vIFVwZGF0ZSBpbml0aWFsaXNpbmcgU3RhdGVcblxuICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICB2YXIgZGVidWdnaW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlYnVnZ2luZycpO1xuXG4gICAgICAgIGRlYnVnZ2luZy5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChib3gpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhib3gudGFyZ2V0LmNoZWNrZWQpXG4gICAgICAgICAgdGhpcy5MaXN0ZW5lci5DaGFuZ2VEZWJ1Zyhib3gudGFyZ2V0LmNoZWNrZWQpO1xuICAgICAgICB9KVxuXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG5cbiAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIC8vIEFzc2lnbiBnbG9hYmwgY29udGFpbmVyc1xuICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgLy8gaWYgKCF0aGlzLnBsYXllckF1dG9Nb3ZlKSB7XG5cbiAgICAgICAgICAgIC8vIEFkZCBtb3VzZUV2ZW50cyB0byBkbyBhY3Rpb25zIHdoZW4gdGhlIHVzZXIgZG9lcyBhY3Rpb25zIG9uIHRoZSBzY3JlZW5cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAvLyBBZGQgdG91Y2hFdmVudHMgdG8gZG8gYWN0aW9ucyB3aGVuIHRoZSB1c2VyIGRvZXMgYWN0aW9ucyBvbiB0aGUgc2NyZWVuXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG4gICAgICAgICAgLy8gfVxuXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIGF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBzb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIENyZWF0ZSBhbmQgZGlzcGxheSBvYmplY3RzXG4gICAgdGhpcy5DcmVhdGVJbnN0cnVtZW50cygpO1xuICAgIHRoaXMuU291cmNlcy5DcmVhdGVTb3VyY2VzKHRoaXMuY29udGFpbmVyLCB0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAgICAvLyBDcmVhdGUgdGhlIHNvdXJjZXMgYW5kIGRpc3BsYXkgdGhlbVxuICAgIHRoaXMuTGlzdGVuZXIuRGlzcGxheSh0aGlzLmNvbnRhaW5lcik7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGxpc3RlbmVyJ3MgZGlzcGxheSB0byB0aGUgY29udGFpbmVyXG4gICAgdGhpcy5yZW5kZXIoKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVuZGVyZWRcIikpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBhbiBldmVudCB3aGVuIHRoZSBzaW11bGF0aW9uIGFwcGVhcmVkXG4gICAgaWYgKHRoaXMucGxheWVyQXV0b01vdmUub24pIHtcbiAgICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxuICAgICAgICB0aGlzLkxpc3RlbmVyLkF1dG9Nb3ZlKHRoaXMucGxheWVyQXV0b01vdmUuc3BlZWQsIHRoaXMucGxheWVyQXV0b01vdmUuaW50ZXJ2YWwsIFt0aGlzLnBvc2l0aW9uUmFuZ2UubWluWCwgdGhpcy5wb3NpdGlvblJhbmdlLm1pblldLCBbdGhpcy5wb3NpdGlvblJhbmdlLm1heFgsIHRoaXMucG9zaXRpb25SYW5nZS5tYXhZXSk7XG4gICAgICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICAgIHRoaXMucmVuZGVyKCk7ICAgICAgICAgXG4gICAgICB9LCB0aGlzLnBsYXllckF1dG9Nb3ZlLmludGVydmFsKVxuICAgIH1cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiTW92aW5nXCIsICgpID0+IHtcbiAgICAgIHRoaXMuU291cmNlcy5vbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkKHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbik7ICAgICAgICAgLy8gVXBkYXRlIHRoZSBzb3VuZCBkZXBlbmRpbmcgb24gbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5yZW5kZXIoKTsgICAgICBcbiAgICB9KTtcbiAgfVxuXG4gIENyZWF0ZUluc3RydW1lbnRzKCkge1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnaW5zdHJ1bWVudENvbnRhaW5lcicpXG4gICAgdmFyIGNpcmNsZURpYW1ldGVyID0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyO1xuICAgIHRoaXMuaW5zdHJ1bWVudHMgPSBbXVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHkubGVuZ3RoOyBpKyspIHtcblxuICAgICAgdGhpcy5pbnN0cnVtZW50cy5wdXNoKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpKVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgc291cmNlJ3MgZGlzcGxheVxuICAgICAgLy8gdGhpcy5zb3VyY2VzLnB1c2goZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2JykpOyAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IGVsZW1lbnRcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uaWQgPSBcImluc3RydW1lbnRcIiArIGk7ICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGNpcmNsZSBpZFxuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5pbm5lckhUTUwgPSBcIlNcIjsgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgY2lyY2xlIHZhbHVlIChpKzEpXG5cbiAgICAgIC8vIENoYW5nZSBmb3JtIGFuZCBwb3NpdGlvbiBvZiB0aGUgZWxlbWVudCB0byBnZXQgYSBjaXJjbGUgYXQgdGhlIGdvb2QgcGxhY2U7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5tYXJnaW4gPSBcIjAgXCIgKyAoLWNpcmNsZURpYW1ldGVyLzIpICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS53aWR0aCA9IGNpcmNsZURpYW1ldGVyICsgXCJweFwiO1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS5oZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYm9yZGVyUmFkaXVzID0gY2lyY2xlRGlhbWV0ZXIgKyBcInB4XCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLmxpbmVIZWlnaHQgPSBjaXJjbGVEaWFtZXRlciArIFwicHhcIjtcbiAgICAgIHRoaXMuaW5zdHJ1bWVudHNbaV0uc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnpJbmRleCA9IDE7XG4gICAgICB0aGlzLmluc3RydW1lbnRzW2ldLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueCAtIHRoaXMub2Zmc2V0LngpKnRoaXMuc2NhbGUpICsgXCJweCwgXCIgKyBcbiAgICAgICAgKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSkgKyBcInB4KVwiO1xuXG4gICAgICBjb25zb2xlLmxvZygodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhKSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS54IC0gdGhpcy5vZmZzZXQueCkqdGhpcy5zY2FsZSlcbiAgICAgIGNvbnNvbGUubG9nKCh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eVtpXS55IC0gdGhpcy5vZmZzZXQueSkqdGhpcy5zY2FsZSlcblxuICAgICAgLy8gQWRkIHRoZSBjaXJjbGUncyBkaXNwbGF5IHRvIHRoZSBnbG9iYWwgY29udGFpbmVyXG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5pbnN0cnVtZW50c1tpXSk7XG4gICAgICBjb25zb2xlLmxvZyhcInpibG9cIilcbiAgICB9XG4gIH1cblxuICBVcGRhdGVJbnN0cnVtZW50c0Rpc3BsYXkoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEuc291cmNlc194eS5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5pbnN0cnVtZW50c1tpXS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIFxuICAgICAgICAoKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5zb3VyY2VzX3h5W2ldLnggLSB0aGlzLm9mZnNldC54KSp0aGlzLnNjYWxlKSArIFwicHgsIFwiICsgXG4gICAgICAgICgodGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnNvdXJjZXNfeHlbaV0ueSAtIHRoaXMub2Zmc2V0LnkpKnRoaXMuc2NhbGUpICsgXCJweClcIjtcbiAgICB9XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBsaXN0ZW5lcidzIHBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcblxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMikvKHRoaXMuc2NhbGUpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5wb3NpdGlvblJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5wb3NpdGlvblJhbmdlLm1heFkpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRpbmdcIilcblxuICAgICAgLy8gVXBkYXRlIG9iamVjdHMgYW5kIHRoZWlyIGRpc3BsYXlcbiAgICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXIobW91c2UsIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICAvLyB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pOyAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc291bmQgZGVwZW5kaW5nIG9uIGxpc3RlbmVyJ3MgcG9zaXRpb25cbiAgICAgIC8vIHRoaXMucmVuZGVyKCk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHRoZSBkaXNwbGF5XG4gICAgICAvLyB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyKG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7ICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgbGlzdGVuZXIncyBwb3NpdGlvblxuICAgICAgdGhpcy5MaXN0ZW5lci5SZXNldChtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpO1xuICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTsgICAgICAgICAvLyBVcGRhdGUgdGhlIHNvdW5kIGRlcGVuZGluZyBvbiBsaXN0ZW5lcidzIHBvc2l0aW9uXG4gICAgICB0aGlzLnJlbmRlcigpOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheVxuICAgIH1cblxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uIFVwZGF0ZVxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cbiAgICAvLyBDaGFuZ2Ugc2l6ZSBvZiBkaXNwbGF5XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMub2Zmc2V0LnkqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5vZmZzZXQueCp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG5cbiAgICB0aGlzLlNvdXJjZXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgICAvLyBVcGRhdGUgc291cmNlcycgZGlzcGxheVxuICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKTsgICAgIC8vIFVwZGF0ZSBsaXN0ZW5lcidzIGRpc3BsYXlcbiAgICB0aGlzLlVwZGF0ZUluc3RydW1lbnRzRGlzcGxheSgpOyAgICAgLy8gVXBkYXRlIGxpc3RlbmVyJ3MgZGlzcGxheVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7QUFDQTtBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDQyxZQUFsQyxFQUFnRDtJQUV6RCxNQUFNSCxNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLRSxLQUFMLEdBQWEsSUFBYixDQU55RCxDQVF6RDs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FUeUQsQ0FTUzs7SUFDbEUsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQixDQVZ5RCxDQVVTOztJQUNsRSxLQUFLRSxJQUFMLEdBQVksS0FBS0YsT0FBTCxDQUFhLE1BQWIsQ0FBWixDQVh5RCxDQVdTOztJQUNsRSxLQUFLRyxRQUFMLEdBQWdCLEtBQUtILE9BQUwsQ0FBYSxVQUFiLENBQWhCLENBWnlELENBWVM7O0lB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