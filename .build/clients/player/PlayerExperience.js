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

var _wavesMasters = require("waves-masters");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class PlayerExperience extends _client.AbstractExperience {
  constructor(client, config = {}, $container, audioContext) {
    super(client);
    this.config = config;
    this.$container = $container;
    this.rafId = null; // Require plugins if needed

    this.audioBufferLoader = this.require('audio-buffer-loader'); // this.ambisonic = require('ambisonics');

    this.filesystem = this.require('filesystem');
    this.sync = this.require('sync');
    this.platform = this.require('platform'); // Changing Parameters

    this.parameters = {
      // mode: "debug",                   // Choose audio mode (possible: "debug", "convolving")
      // mode: "streaming",                   // Choose audio mode (possible: "debug", "convolving")
      // mode: "ambisonic",                   // Choose audio mode (possible: "debug", "convolving")
      mode: "convolving",
      // Choose audio mode (possible: "debug", "convolving")
      circleDiameter: 20,
      dataFileName: "",
      audioData: "",
      rirs: {},
      nbClosestPoints: 4,
      gainExposant: 3,
      listenerSize: 16,
      order: 2,
      audioContext: audioContext
    }; // Initialisation variables

    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false; // Global values

    this.range; // Values of the array data (creates in start())

    this.scale; // General Scales (initialised in start())
    // this.audioData;       // Set the audio data to use
    // Sounds of the sources

    this.audioFilesName = [];
    this.positions = []; // Array of sources positions (built in start())

    this.container;
    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    super.start();

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


    this.Sources = new _Sources.default(this.filesystem, this.audioBufferLoader, this.parameters);
    console.log(this.filesystem);
    this.Sources.LoadData(); // document.addEventListener("audioLoaded", () => {

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
    }

    this.Sources.LoadSoundbank(); // if (this.parameters.mode == 'convolving') {
    //   this.Sources.LoadSound4Rirs();
    // }
    // this.audioBufferLoader.subscribe(() => {

    document.addEventListener("dataLoaded", () => {
      console.log(this.Sources.sourcesData);
      this.positions = this.Sources.sourcesData.receivers.xyz;
      this.audioFilesName = this.Sources.sourcesData.receivers.files; // this.nbPos = this.truePositions.length;

      this.Range(this.positions); // Initialising 'this.scale'

      this.scale = this.Scaling(this.range);
      this.offset = {
        x: this.range.moyX,
        y: this.range.minY
      };
      this.Listener = new _Listener.default(this.offset, this.parameters);
      this.Listener.start();
      this.Sources.start(this.Listener.listenerPosition); // Add Event listener for resize Window event to resize the display

      window.addEventListener('resize', () => {
        this.scale = this.Scaling(this.range); // Change the scale

        if (this.beginPressed) {
          // Check the begin State
          this.UpdateContainer(); // Resize the display
        } // Display


        this.render();
      });
      this.render();
    }); // });
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
    // Store the greatest scale to display all the elements in 'this.scale'
    var scale = Math.min((window.innerWidth - this.parameters.circleDiameter) / rangeValues.rangeX, (window.innerHeight - this.parameters.circleDiameter) / rangeValues.rangeY);
    return scale;
  }

  render() {
    // Debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);
    this.rafId = window.requestAnimationFrame(() => {
      // const loading = this.audioBufferLoader.get('loading');
      const loading = false; // Begin the render only when audioData ara loaded

      if (!loading) {
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
            document.getElementById("game").style.visibility = "visible"; // Create circles to display Sources
            // Assign mouse and touch callbacks to change the user Position

            this.container = document.getElementById('circleContainer');
            this.onBeginButtonClicked(); // Using mouse

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
            }, false); // Using touch

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
      }
    });
  }

  onBeginButtonClicked() {
    // Begin AudioContext and add the Sources display to the display
    // Initialising a temporary circle
    this.Sources.CreateSources(this.container, this.scale, this.offset);
    this.Listener.Display(this.container);
    this.render();
  }

  userAction(mouse) {
    // Change Listener's Position when the mouse has been used
    // Get the new potential Listener's Position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale;
    var tempY = this.range.minY + (mouse.clientY - this.parameters.circleDiameter / 2) / this.scale; // Check if the value is in the values range

    if (tempX >= this.range.minX && tempX <= this.range.maxX && tempY >= this.range.minY && tempY <= this.range.maxY) {
      // Update Listener
      console.log("Updating");
      this.Listener.UpdateListener(mouse, this.offset, this.scale);
      this.Sources.onListenerPositionChanged(this.Listener.listenerPosition);
      this.render();
    } else {
      // When the value is out of range, stop the Listener's Position Update
      this.mouseDown = false;
      this.touched = false;
    }
  }

  UpdateContainer() {
    // Change the display when the window is resized
    // Change size
    document.getElementById("circleContainer").height = this.offset.y * this.scale + "px";
    document.getElementById("circleContainer").width = this.offset.x * this.scale + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.parameters.circleDiameter / 2 - this.range.rangeX * this.scale.VPos2Pixel / 2) + "px, 10px)";
    this.Sources.UpdateSourcesPosition(this.scale, this.offset); // Update Sources' display

    this.Listener.UpdateListenerDisplay(this.offset, this.scale);
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwicGFyYW1ldGVycyIsIm1vZGUiLCJjaXJjbGVEaWFtZXRlciIsImRhdGFGaWxlTmFtZSIsImF1ZGlvRGF0YSIsInJpcnMiLCJuYkNsb3Nlc3RQb2ludHMiLCJnYWluRXhwb3NhbnQiLCJsaXN0ZW5lclNpemUiLCJvcmRlciIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsIm1vdXNlRG93biIsInRvdWNoZWQiLCJyYW5nZSIsInNjYWxlIiwiYXVkaW9GaWxlc05hbWUiLCJwb3NpdGlvbnMiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImFsZXJ0IiwiU291cmNlcyIsImNvbnNvbGUiLCJsb2ciLCJMb2FkRGF0YSIsIkxvYWRTb3VuZGJhbmsiLCJMb2FkUmlycyIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsInNvdXJjZXNEYXRhIiwicmVjZWl2ZXJzIiwieHl6IiwiZmlsZXMiLCJSYW5nZSIsIlNjYWxpbmciLCJvZmZzZXQiLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwiTGlzdGVuZXIiLCJsaXN0ZW5lclBvc2l0aW9uIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwicmVuZGVyIiwibWluWCIsIm1heFgiLCJtYXhZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImxvYWRpbmciLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0cmFuc2Zvcm0iLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG5pbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTtcbiAgICAvLyB0aGlzLmFtYmlzb25pYyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcbiAgICB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpO1xuXG4gICAgLy8gQ2hhbmdpbmcgUGFyYW1ldGVyc1xuXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgLy8gbW9kZTogXCJkZWJ1Z1wiLCAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJjb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcInN0cmVhbWluZ1wiLCAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJjb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcImFtYmlzb25pY1wiLCAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJjb252b2x2aW5nXCIpXG4gICAgICBtb2RlOiBcImNvbnZvbHZpbmdcIiwgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwiY29udm9sdmluZ1wiKVxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLFxuICAgICAgZGF0YUZpbGVOYW1lOiBcIlwiLFxuICAgICAgYXVkaW9EYXRhOiBcIlwiLFxuICAgICAgcmlyczoge30sXG4gICAgICBuYkNsb3Nlc3RQb2ludHM6IDQsXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsXG4gICAgICBsaXN0ZW5lclNpemU6IDE2LFxuICAgICAgb3JkZXI6IDIsXG4gICAgICBhdWRpb0NvbnRleHQ6IGF1ZGlvQ29udGV4dFxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gc3RhcnQoKSlcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWFsaXNlZCBpbiBzdGFydCgpKVxuICAgIC8vIHRoaXMuYXVkaW9EYXRhOyAgICAgICAvLyBTZXQgdGhlIGF1ZGlvIGRhdGEgdG8gdXNlXG5cblxuICAgIC8vIFNvdW5kcyBvZiB0aGUgc291cmNlc1xuICAgIHRoaXMuYXVkaW9GaWxlc05hbWUgPSBbXTtcblxuICAgIHRoaXMucG9zaXRpb25zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2Ygc291cmNlcyBwb3NpdGlvbnMgKGJ1aWx0IGluIHN0YXJ0KCkpXG5cbiAgICB0aGlzLmNvbnRhaW5lcjtcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XG4gICAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJztcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMC5qc29uJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMxJztcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMS5qc29uJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMyJztcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMi5qc29uJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgICAgfVxuXG5cbiAgICAvLyBjb25zdCBnZXRUaW1lRnVuY3Rpb24gPSAoKSA9PiB0aGlzLnN5bmMuZ2V0U3luY1RpbWUoKTtcbiAgICAvLyBjb25zdCBjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb24gPVxuICAgIC8vICAgY3VycmVudFRpbWUgPT4gdGhpcy5zeW5jLmdldExvY2FsVGltZShjdXJyZW50VGltZSk7XG5cbiAgICAvLyB0aGlzLnNjaGVkdWxlciA9IG5ldyBTY2hlZHVsZXIoZ2V0VGltZUZ1bmN0aW9uLCB7XG4gICAgLy8gICBjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb25cbiAgICAvLyB9KTtcblxuICAgIC8vIC8vIGRlZmluZSBzaW1wbGUgZW5naW5lcyBmb3IgdGhlIHNjaGVkdWxlclxuICAgIC8vIHRoaXMubWV0cm9BdWRpbyA9IHtcbiAgICAvLyAgIC8vIGBjdXJyZW50VGltZWAgaXMgdGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgc2NoZWR1bGVyIChha2EgdGhlIHN5bmNUaW1lKVxuICAgIC8vICAgLy8gYGF1ZGlvVGltZWAgaXMgdGhlIGF1ZGlvVGltZSBhcyBjb21wdXRlZCBieSBgY3VycmVudFRpbWVUb0F1ZGlvVGltZUZ1bmN0aW9uYFxuICAgIC8vICAgLy8gYGR0YCBpcyB0aGUgdGltZSBiZXR3ZWVuIHRoZSBhY3R1YWwgY2FsbCBvZiB0aGUgZnVuY3Rpb24gYW5kIHRoZSB0aW1lIG9mIHRoZVxuICAgIC8vICAgLy8gc2NoZWR1bGVkIGV2ZW50XG4gICAgLy8gICBhZHZhbmNlVGltZTogKGN1cnJlbnRUaW1lLCBhdWRpb1RpbWUsIGR0KSA9PiB7XG4gICAgLy8gICAgIGNvbnN0IGVudiA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAvLyAgICAgZW52LmNvbm5lY3QodGhpcy5hdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuICAgIC8vICAgICBlbnYuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKFwiYXVkaW9cIilcbiAgICAvLyAgICAgY29uc3Qgc2luZSA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICAvLyAgICAgc2luZS5jb25uZWN0KGVudik7XG4gICAgLy8gICAgIHNpbmUuZnJlcXVlbmN5LnZhbHVlID0gMjAwICogKHRoaXMuY2xpZW50LmlkICUgMTAgKyAxKTtcblxuICAgIC8vICAgICBlbnYuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLCBhdWRpb1RpbWUpO1xuICAgIC8vICAgICBlbnYuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgxLCBhdWRpb1RpbWUgKyAwLjAxKTtcbiAgICAvLyAgICAgZW52LmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSgwLjAwMDEsIGF1ZGlvVGltZSArIDAuMSk7XG5cbiAgICAvLyAgICAgc2luZS5zdGFydChhdWRpb1RpbWUpO1xuICAgIC8vICAgICBzaW5lLnN0b3AoYXVkaW9UaW1lICsgMC4xKTtcblxuICAgIC8vICAgICByZXR1cm4gY3VycmVudFRpbWUgKyAxO1xuICAgIC8vICAgfVxuICAgIC8vIH1cblxuICAgIC8vIHRoaXMubWV0cm9WaXN1YWwgPSB7XG4gICAgLy8gICBhZHZhbmNlVGltZTogKGN1cnJlbnRUaW1lLCBhdWRpb1RpbWUsIGR0KSA9PiB7XG4gICAgLy8gICAgIGlmICghdGhpcy4kYmVhdCkge1xuICAgIC8vICAgICAgIHRoaXMuJGJlYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjYmVhdC0ke3RoaXMuY2xpZW50LmlkfWApO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgLy8gY29uc29sZS5sb2coYGdvIGluICR7ZHQgKiAxMDAwfWApXG4gICAgLy8gICAgIC8vIHRoaXMuJGJlYXQuYWN0aXZlID0gdHJ1ZTtcbiAgICAvLyAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLiRiZWF0LmFjdGl2ZSA9IHRydWUsIE1hdGgucm91bmQoZHQgKiAxMDAwKSk7XG5cbiAgICAvLyAgICAgcmV0dXJuIGN1cnJlbnRUaW1lICsgMTtcbiAgICAvLyAgIH1cbiAgICAvLyB9O1xuXG5cbiAgICAvLyAvLyB0aGlzLmdsb2JhbHMuc3Vic2NyaWJlKHVwZGF0ZXMgPT4ge1xuICAgIC8vIC8vICAgdGhpcy51cGRhdGVFbmdpbmVzKCk7XG4gICAgLy8gLy8gICB0aGlzLnJlbmRlcigpO1xuICAgIC8vIC8vIH0pO1xuICAgIC8vIC8vIHRoaXMudXBkYXRlRW5naW5lcygpO1xuXG5cblxuXG4gICAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycylcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuICAgICAgLy8gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImF1ZGlvTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgc3dpdGNoICh0aGlzLnBhcmFtZXRlcnMubW9kZSkge1xuICAgICAgICBjYXNlICdkZWJ1Zyc6XG4gICAgICAgIGNhc2UgJ3N0cmVhbWluZyc6XG4gICAgICAgIGNhc2UgJ2FtYmlzb25pYyc6XG4gICAgICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRSaXJzKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgICAgfVxuICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcblxuICAgICAgLy8gaWYgKHRoaXMucGFyYW1ldGVycy5tb2RlID09ICdjb252b2x2aW5nJykge1xuICAgICAgLy8gICB0aGlzLlNvdXJjZXMuTG9hZFNvdW5kNFJpcnMoKTtcbiAgICAgIC8vIH1cblxuICAgICAgLy8gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5zdWJzY3JpYmUoKCkgPT4ge1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgY29uc29sZS5sb2codGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhKVxuXG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnJlY2VpdmVycy54eXo7XG4gICAgICAgIHRoaXMuYXVkaW9GaWxlc05hbWUgPSB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLmZpbGVzO1xuICAgICAgICAvLyB0aGlzLm5iUG9zID0gdGhpcy50cnVlUG9zaXRpb25zLmxlbmd0aDtcblxuICAgICAgICB0aGlzLlJhbmdlKHRoaXMucG9zaXRpb25zKTtcblxuICAgICAgICAvLyBJbml0aWFsaXNpbmcgJ3RoaXMuc2NhbGUnXG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG5cbiAgICAgICAgdGhpcy5vZmZzZXQgPSB7XG4gICAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucmFuZ2UubWluWVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5MaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcih0aGlzLm9mZnNldCwgdGhpcy5wYXJhbWV0ZXJzKVxuICAgICAgICB0aGlzLkxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuU291cmNlcy5zdGFydCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pXG5cbiAgICAgICAgLy8gQWRkIEV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgV2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuICAgICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuICAgIC8vIH0pO1xuXG4gIH1cblxuICBSYW5nZShwb3NpdGlvbnMpIHsgLy8gU3RvcmUgdGhlIGFycmF5IHByb3BlcnRpZXMgaW4gJ3RoaXMucmFuZ2UnXG4gICAgdGhpcy5yYW5nZSA9IHtcbiAgICAgIG1pblg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBwb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBwb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gcG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gcG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gcG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gcG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRvIGRpc3BsYXkgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgLy8gY29uc3QgbG9hZGluZyA9IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZ2V0KCdsb2FkaW5nJyk7XG4gICAgICBjb25zdCBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICBpZiAoIWxvYWRpbmcpIHtcbiAgICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZSkvMn1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGNpcmNsZXMgdG8gZGlzcGxheSBTb3VyY2VzXG5cbiAgICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG5cbiAgICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgICAvLyBVc2luZyBtb3VzZVxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIHRvdWNoXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSlcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKCkgeyAvLyBCZWdpbiBBdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgU291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XG5cbiAgICAvLyBJbml0aWFsaXNpbmcgYSB0ZW1wb3JhcnkgY2lyY2xlXG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTtcbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBMaXN0ZW5lcidzIFBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgTGlzdGVuZXIncyBQb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5yYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgIC8vIFVwZGF0ZSBMaXN0ZW5lclxuXG4gICAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nXCIpXG4gICAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyKG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7XG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMub2Zmc2V0LnkqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5vZmZzZXQueCp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG5cbiAgICB0aGlzLlNvdXJjZXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgIC8vIFVwZGF0ZSBTb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lckRpc3BsYXkodGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7OztBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDQyxZQUFsQyxFQUFnRDtJQUN6RCxNQUFNSCxNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLRSxLQUFMLEdBQWEsSUFBYixDQUx5RCxDQU96RDs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekIsQ0FSeUQsQ0FTekQ7O0lBQ0EsS0FBS0MsVUFBTCxHQUFrQixLQUFLRCxPQUFMLENBQWEsWUFBYixDQUFsQjtJQUNBLEtBQUtFLElBQUwsR0FBWSxLQUFLRixPQUFMLENBQWEsTUFBYixDQUFaO0lBQ0EsS0FBS0csUUFBTCxHQUFnQixLQUFLSCxPQUFMLENBQWEsVUFBYixDQUFoQixDQVp5RCxDQWN6RDs7SUFFQSxLQUFLSSxVQUFMLEdBQWtCO01BQ2hCO01BQ0E7TUFDQTtNQUNBQyxJQUFJLEVBQUUsWUFKVTtNQUlzQjtNQUN0Q0MsY0FB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