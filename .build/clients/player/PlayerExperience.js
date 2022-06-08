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
    this.Sources.LoadData();
    this.Sources.LoadSoundbank();

    if (this.parameters.mode == 'convolving') {
      this.Sources.LoadSound4Rirs();
    }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwicGFyYW1ldGVycyIsIm1vZGUiLCJjaXJjbGVEaWFtZXRlciIsImRhdGFGaWxlTmFtZSIsImF1ZGlvRGF0YSIsInJpcnMiLCJuYkNsb3Nlc3RQb2ludHMiLCJnYWluRXhwb3NhbnQiLCJsaXN0ZW5lclNpemUiLCJvcmRlciIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsIm1vdXNlRG93biIsInRvdWNoZWQiLCJyYW5nZSIsInNjYWxlIiwiYXVkaW9GaWxlc05hbWUiLCJwb3NpdGlvbnMiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImFsZXJ0IiwiU291cmNlcyIsImNvbnNvbGUiLCJsb2ciLCJMb2FkRGF0YSIsIkxvYWRTb3VuZGJhbmsiLCJMb2FkU291bmQ0UmlycyIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsInNvdXJjZXNEYXRhIiwicmVjZWl2ZXJzIiwieHl6IiwiZmlsZXMiLCJSYW5nZSIsIlNjYWxpbmciLCJvZmZzZXQiLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwiTGlzdGVuZXIiLCJsaXN0ZW5lclBvc2l0aW9uIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwicmVuZGVyIiwibWluWCIsIm1heFgiLCJtYXhZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImxvYWRpbmciLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0cmFuc2Zvcm0iLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG5pbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTtcbiAgICAvLyB0aGlzLmFtYmlzb25pYyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcbiAgICB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpO1xuXG4gICAgLy8gQ2hhbmdpbmcgUGFyYW1ldGVyc1xuXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgLy8gbW9kZTogXCJkZWJ1Z1wiLCAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJjb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcInN0cmVhbWluZ1wiLCAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJjb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcImFtYmlzb25pY1wiLCAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJjb252b2x2aW5nXCIpXG4gICAgICBtb2RlOiBcImNvbnZvbHZpbmdcIiwgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwiY29udm9sdmluZ1wiKVxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLFxuICAgICAgZGF0YUZpbGVOYW1lOiBcIlwiLFxuICAgICAgYXVkaW9EYXRhOiBcIlwiLFxuICAgICAgcmlyczoge30sXG4gICAgICBuYkNsb3Nlc3RQb2ludHM6IDQsXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsXG4gICAgICBsaXN0ZW5lclNpemU6IDE2LFxuICAgICAgb3JkZXI6IDIsXG4gICAgICBhdWRpb0NvbnRleHQ6IGF1ZGlvQ29udGV4dFxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gc3RhcnQoKSlcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWFsaXNlZCBpbiBzdGFydCgpKVxuICAgIC8vIHRoaXMuYXVkaW9EYXRhOyAgICAgICAvLyBTZXQgdGhlIGF1ZGlvIGRhdGEgdG8gdXNlXG5cblxuICAgIC8vIFNvdW5kcyBvZiB0aGUgc291cmNlc1xuICAgIHRoaXMuYXVkaW9GaWxlc05hbWUgPSBbXTtcblxuICAgIHRoaXMucG9zaXRpb25zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2Ygc291cmNlcyBwb3NpdGlvbnMgKGJ1aWx0IGluIHN0YXJ0KCkpXG5cbiAgICB0aGlzLmNvbnRhaW5lcjtcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XG4gICAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJztcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMC5qc29uJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMxJztcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMS5qc29uJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYW1iaXNvbmljJzpcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMyJztcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMi5qc29uJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgICAgfVxuXG5cbiAgICAvLyBjb25zdCBnZXRUaW1lRnVuY3Rpb24gPSAoKSA9PiB0aGlzLnN5bmMuZ2V0U3luY1RpbWUoKTtcbiAgICAvLyBjb25zdCBjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb24gPVxuICAgIC8vICAgY3VycmVudFRpbWUgPT4gdGhpcy5zeW5jLmdldExvY2FsVGltZShjdXJyZW50VGltZSk7XG5cbiAgICAvLyB0aGlzLnNjaGVkdWxlciA9IG5ldyBTY2hlZHVsZXIoZ2V0VGltZUZ1bmN0aW9uLCB7XG4gICAgLy8gICBjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb25cbiAgICAvLyB9KTtcblxuICAgIC8vIC8vIGRlZmluZSBzaW1wbGUgZW5naW5lcyBmb3IgdGhlIHNjaGVkdWxlclxuICAgIC8vIHRoaXMubWV0cm9BdWRpbyA9IHtcbiAgICAvLyAgIC8vIGBjdXJyZW50VGltZWAgaXMgdGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgc2NoZWR1bGVyIChha2EgdGhlIHN5bmNUaW1lKVxuICAgIC8vICAgLy8gYGF1ZGlvVGltZWAgaXMgdGhlIGF1ZGlvVGltZSBhcyBjb21wdXRlZCBieSBgY3VycmVudFRpbWVUb0F1ZGlvVGltZUZ1bmN0aW9uYFxuICAgIC8vICAgLy8gYGR0YCBpcyB0aGUgdGltZSBiZXR3ZWVuIHRoZSBhY3R1YWwgY2FsbCBvZiB0aGUgZnVuY3Rpb24gYW5kIHRoZSB0aW1lIG9mIHRoZVxuICAgIC8vICAgLy8gc2NoZWR1bGVkIGV2ZW50XG4gICAgLy8gICBhZHZhbmNlVGltZTogKGN1cnJlbnRUaW1lLCBhdWRpb1RpbWUsIGR0KSA9PiB7XG4gICAgLy8gICAgIGNvbnN0IGVudiA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAvLyAgICAgZW52LmNvbm5lY3QodGhpcy5hdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuICAgIC8vICAgICBlbnYuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKFwiYXVkaW9cIilcbiAgICAvLyAgICAgY29uc3Qgc2luZSA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICAvLyAgICAgc2luZS5jb25uZWN0KGVudik7XG4gICAgLy8gICAgIHNpbmUuZnJlcXVlbmN5LnZhbHVlID0gMjAwICogKHRoaXMuY2xpZW50LmlkICUgMTAgKyAxKTtcblxuICAgIC8vICAgICBlbnYuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLCBhdWRpb1RpbWUpO1xuICAgIC8vICAgICBlbnYuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgxLCBhdWRpb1RpbWUgKyAwLjAxKTtcbiAgICAvLyAgICAgZW52LmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSgwLjAwMDEsIGF1ZGlvVGltZSArIDAuMSk7XG5cbiAgICAvLyAgICAgc2luZS5zdGFydChhdWRpb1RpbWUpO1xuICAgIC8vICAgICBzaW5lLnN0b3AoYXVkaW9UaW1lICsgMC4xKTtcblxuICAgIC8vICAgICByZXR1cm4gY3VycmVudFRpbWUgKyAxO1xuICAgIC8vICAgfVxuICAgIC8vIH1cblxuICAgIC8vIHRoaXMubWV0cm9WaXN1YWwgPSB7XG4gICAgLy8gICBhZHZhbmNlVGltZTogKGN1cnJlbnRUaW1lLCBhdWRpb1RpbWUsIGR0KSA9PiB7XG4gICAgLy8gICAgIGlmICghdGhpcy4kYmVhdCkge1xuICAgIC8vICAgICAgIHRoaXMuJGJlYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjYmVhdC0ke3RoaXMuY2xpZW50LmlkfWApO1xuICAgIC8vICAgICB9XG5cbiAgICAvLyAgICAgLy8gY29uc29sZS5sb2coYGdvIGluICR7ZHQgKiAxMDAwfWApXG4gICAgLy8gICAgIC8vIHRoaXMuJGJlYXQuYWN0aXZlID0gdHJ1ZTtcbiAgICAvLyAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLiRiZWF0LmFjdGl2ZSA9IHRydWUsIE1hdGgucm91bmQoZHQgKiAxMDAwKSk7XG5cbiAgICAvLyAgICAgcmV0dXJuIGN1cnJlbnRUaW1lICsgMTtcbiAgICAvLyAgIH1cbiAgICAvLyB9O1xuXG5cbiAgICAvLyAvLyB0aGlzLmdsb2JhbHMuc3Vic2NyaWJlKHVwZGF0ZXMgPT4ge1xuICAgIC8vIC8vICAgdGhpcy51cGRhdGVFbmdpbmVzKCk7XG4gICAgLy8gLy8gICB0aGlzLnJlbmRlcigpO1xuICAgIC8vIC8vIH0pO1xuICAgIC8vIC8vIHRoaXMudXBkYXRlRW5naW5lcygpO1xuXG5cblxuXG4gICAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycylcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcblxuICAgICAgaWYgKHRoaXMucGFyYW1ldGVycy5tb2RlID09ICdjb252b2x2aW5nJykge1xuICAgICAgICB0aGlzLlNvdXJjZXMuTG9hZFNvdW5kNFJpcnMoKTtcbiAgICAgIH1cblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRhdGFMb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YSlcblxuICAgICAgICB0aGlzLnBvc2l0aW9ucyA9IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6O1xuICAgICAgICB0aGlzLmF1ZGlvRmlsZXNOYW1lID0gdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnJlY2VpdmVycy5maWxlcztcbiAgICAgICAgLy8gdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XG5cbiAgICAgICAgdGhpcy5SYW5nZSh0aGlzLnBvc2l0aW9ucyk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGlzaW5nICd0aGlzLnNjYWxlJ1xuICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuXG4gICAgICAgIHRoaXMub2Zmc2V0ID0ge1xuICAgICAgICAgIHg6IHRoaXMucmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIodGhpcy5vZmZzZXQsIHRoaXMucGFyYW1ldGVycylcbiAgICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLlNvdXJjZXMuc3RhcnQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKVxuXG4gICAgICAgIC8vIEFkZCBFdmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIFdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcbiAgICAgICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBTdGF0ZVxuICAgICAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTsgICAgICAgICAgICAgICAgICAgLy8gUmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcblxuICB9XG5cbiAgUmFuZ2UocG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0byBkaXNwbGF5IGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVgsICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpO1xuICAgICAgY29uc3QgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgaWYgKCFsb2FkaW5nKSB7XG4gICAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoLXRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUpLzJ9cHgsICR7dGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXG4gICAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuICAgICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG5cbiAgICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHRvIGJlZ2luIHRoZSBzaW11bGF0aW9uXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBjaXJjbGVzIHRvIGRpc3BsYXkgU291cmNlc1xuXG4gICAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuXG4gICAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKClcblxuICAgICAgICAgICAgLy8gVXNpbmcgbW91c2VcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAvLyBVc2luZyB0b3VjaFxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhldnQuY2hhbmdlZFRvdWNoZXNbMF0pXG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gQXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIFNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gSW5pdGlhbGlzaW5nIGEgdGVtcG9yYXJ5IGNpcmNsZVxuICAgIHRoaXMuU291cmNlcy5DcmVhdGVTb3VyY2VzKHRoaXMuY29udGFpbmVyLCB0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7XG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgTGlzdGVuZXIncyBQb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIExpc3RlbmVyJ3MgUG9zaXRpb25cbiAgICB2YXIgdGVtcFggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yKS8odGhpcy5zY2FsZSk7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5yYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAvLyBVcGRhdGUgTGlzdGVuZXJcblxuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxuICAgICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpO1xuICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uIFVwZGF0ZVxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cbiAgICAvLyBDaGFuZ2Ugc2l6ZVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLm9mZnNldC55KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAvLyBVcGRhdGUgU291cmNlcycgZGlzcGxheVxuICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQ0MsWUFBbEMsRUFBZ0Q7SUFDekQsTUFBTUgsTUFBTjtJQUVBLEtBQUtDLE1BQUwsR0FBY0EsTUFBZDtJQUNBLEtBQUtDLFVBQUwsR0FBa0JBLFVBQWxCO0lBQ0EsS0FBS0UsS0FBTCxHQUFhLElBQWIsQ0FMeUQsQ0FPekQ7O0lBQ0EsS0FBS0MsaUJBQUwsR0FBeUIsS0FBS0MsT0FBTCxDQUFhLHFCQUFiLENBQXpCLENBUnlELENBU3pEOztJQUNBLEtBQUtDLFVBQUwsR0FBa0IsS0FBS0QsT0FBTCxDQUFhLFlBQWIsQ0FBbEI7SUFDQSxLQUFLRSxJQUFMLEdBQVksS0FBS0YsT0FBTCxDQUFhLE1BQWIsQ0FBWjtJQUNBLEtBQUtHLFFBQUwsR0FBZ0IsS0FBS0gsT0FBTCxDQUFhLFVBQWIsQ0FBaEIsQ0FaeUQsQ0FjekQ7O0lBRUEsS0FBS0ksVUFBTCxHQUFrQjtNQUNoQjtNQUNBO01BQ0E7TUFDQUMsSUFBSSxFQUFFLFlBSlU7TUFJc0I7TUFDdENDLGNBQWMsRUFBRSxFQUxBO01BTWhCQyxZQUFZLEVBQUUsRUFORTtNQU9oQkMsU0FBUyxFQUFFLEVBUEs7TUFRaEJDLElBQUksRUFBRSxFQVJVO01BU2hCQyxlQUFlLEVBQUUsQ0FURDtNQVVoQkMsWUFBWSxFQUFFLENBVkU7TUFXaEJDLFlBQVksRUFBRSxFQVhFO01BWWhCQyxLQUFLLEVBQUUsQ0FaUztNQWFoQmhCLFlBQVksRUFBRUE7SUFiRSxDQUFsQixDQWhCeUQsQ0FnQ3pEOztJQUNBLEtBQUtpQixZQUFMLEdBQW9CLElBQXBCO0lBQ0EsS0FBS0MsWUFBTCxHQUFvQixLQUFwQjtJQUNBLEtBQUtDLFNBQUwsR0FBaUIsS0FBakI7SUFDQSxLQUFLQyxPQUFMLEdBQWUsS0FBZixDQXBDeUQsQ0FzQ3pEOztJQUNBLEtBQUtDLEtBQUwsQ0F2Q3lELENBdUNuQjs7SUFDdEMsS0FBS0MsS0FBTCxDQXhDeUQsQ0F3Q25CO0lBQ3RDO0lBR0E7O0lBQ0EsS0FBS0MsY0FBTCxHQUFzQixFQUF0QjtJQUVBLEtBQUtDLFNBQUwsR0FBaUIsRUFBakIsQ0EvQ3lELENBK0NiOztJQUU1QyxLQUFLQyxTQUFMO0lBRUEsSUFBQUMsb0NBQUEsRUFBNEI3QixNQUE1QixFQUFvQ0MsTUFBcEMsRUFBNENDLFVBQTVDO0VBQ0Q7O0VBRVUsTUFBTDRCLEtBQUssR0FBRztJQUNaLE1BQU1BLEtBQU47O0lBRUUsUUFBUSxLQUFLcEIsVUFBTCxDQUFnQkMsSUFBeEI7TUFDRSxLQUFLLE9BQUw7UUFDRSxLQUFLRCxVQUFMLENBQWdCSSxTQUFoQixHQUE0QixhQUE1QjtRQUNBLEtBQUtKLFVBQUwsQ0FBZ0JHLFlBQWhCLEdBQStCLGFBQS9CO1FBQ0E7O01BQ0YsS0FBSyxXQUFMO1FBQ0UsS0FBS0gsVUFBTCxDQUFnQkksU0FBaEIsR0FBNEIsYUFBNUI7UUFDQSxLQUFLSixVQUFMLENBQWdCRyxZQUFoQixHQUErQixhQUEvQjtRQUNBOztNQUNGLEtBQUssV0FBTDtRQUNFLEtBQUtILFVBQUwsQ0FBZ0JJLFNBQWhCLEdBQTRCLGFBQTVCO1FBQ0EsS0FBS0osVUFBTCxDQUFnQkcsWUFBaEIsR0FBK0IsYUFBL0I7UUFDQTs7TUFDRixLQUFLLFlBQUw7UUFDRSxLQUFLSCxVQUFMLENBQWdCSSxTQUFoQixHQUE0QixhQUE1QjtRQUNBLEtBQUtKLFVBQUwsQ0FBZ0JHLFlBQWhCLEdBQStCLGFBQS9CO1FBQ0E7O01BQ0Y7UUFDRWtCLEtBQUssQ0FBQyxlQUFELENBQUw7SUFsQkosQ0FIVSxDQXlCWjtJQUNBO0lBQ0E7SUFFQTtJQUNBO0lBQ0E7SUFFQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBRUE7SUFDQTtJQUNBO0lBRUE7SUFDQTtJQUVBO0lBQ0E7SUFDQTtJQUVBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFFQTtJQUNBO0lBQ0E7SUFFQTtJQUNBO0lBQ0E7SUFHQTtJQUNBO0lBQ0E7SUFDQTtJQUNBOzs7SUFLRSxLQUFLQyxPQUFMLEdBQWUsSUFBSUEsZ0JBQUosQ0FBWSxLQUFLekIsVUFBakIsRUFBNkIsS0FBS0YsaUJBQWxDLEVBQXFELEtBQUtLLFVBQTFELENBQWY7SUFDQXVCLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEtBQUszQixVQUFqQjtJQUNBLEtBQUt5QixPQUFMLENBQWFHLFFBQWI7SUFDQSxLQUFLSCxPQUFMLENBQWFJLGFBQWI7O0lBRUEsSUFBSSxLQUFLMUIsVUFBTCxDQUFnQkMsSUFBaEIsSUFBd0IsWUFBNUIsRUFBMEM7TUFDeEMsS0FBS3FCLE9BQUwsQ0FBYUssY0FBYjtJQUNEOztJQUVEQyxRQUFRLENBQUNDLGdCQUFULENBQTBCLFlBQTFCLEVBQXdDLE1BQU07TUFFNUNOLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEtBQUtGLE9BQUwsQ0FBYVEsV0FBekI7TUFFQSxLQUFLYixTQUFMLEdBQWlCLEtBQUtLLE9BQUwsQ0FBYVEsV0FBYixDQUF5QkMsU0FBekIsQ0FBbUNDLEdBQXBEO01BQ0EsS0FBS2hCLGNBQUwsR0FBc0IsS0FBS00sT0FBTCxDQUFhUSxXQUFiLENBQXlCQyxTQUF6QixDQUFtQ0UsS0FBekQsQ0FMNEMsQ0FNNUM7O01BRUEsS0FBS0MsS0FBTCxDQUFXLEtBQUtqQixTQUFoQixFQVI0QyxDQVU1Qzs7TUFDQSxLQUFLRixLQUFMLEdBQWEsS0FBS29CLE9BQUwsQ0FBYSxLQUFLckIsS0FBbEIsQ0FBYjtNQUVBLEtBQUtzQixNQUFMLEdBQWM7UUFDWkMsQ0FBQyxFQUFFLEtBQUt2QixLQUFMLENBQVd3QixJQURGO1FBRVpDLENBQUMsRUFBRSxLQUFLekIsS0FBTCxDQUFXMEI7TUFGRixDQUFkO01BS0EsS0FBS0MsUUFBTCxHQUFnQixJQUFJQSxpQkFBSixDQUFhLEtBQUtMLE1BQWxCLEVBQTBCLEtBQUtwQyxVQUEvQixDQUFoQjtNQUNBLEtBQUt5QyxRQUFMLENBQWNyQixLQUFkO01BQ0EsS0FBS0UsT0FBTCxDQUFhRixLQUFiLENBQW1CLEtBQUtxQixRQUFMLENBQWNDLGdCQUFqQyxFQXBCNEMsQ0FzQjVDOztNQUNBQyxNQUFNLENBQUNkLGdCQUFQLENBQXdCLFFBQXhCLEVBQWtDLE1BQU07UUFDdEMsS0FBS2QsS0FBTCxHQUFhLEtBQUtvQixPQUFMLENBQWEsS0FBS3JCLEtBQWxCLENBQWIsQ0FEc0MsQ0FDTTs7UUFDNUMsSUFBSSxLQUFLSCxZQUFULEVBQXVCO1VBQXFCO1VBQzFDLEtBQUtpQyxlQUFMLEdBRHFCLENBQ3FCO1FBQzNDLENBSnFDLENBTXRDOzs7UUFDQSxLQUFLQyxNQUFMO01BQ0gsQ0FSQztNQVNBLEtBQUtBLE1BQUw7SUFDSCxDQWpDQztFQW1DSDs7RUFFRFgsS0FBSyxDQUFDakIsU0FBRCxFQUFZO0lBQUU7SUFDakIsS0FBS0gsS0FBTCxHQUFhO01BQ1hnQyxJQUFJLEVBQUU3QixTQUFTLENBQUMsQ0FBRCxDQUFULENBQWFvQixDQURSO01BRVhVLElBQUksRUFBRTlCLFNBQVMsQ0FBQyxDQUFELENBQVQsQ0FBYW9CLENBRlI7TUFHWEcsSUFBSSxFQUFFdkIsU0FBUyxDQUFDLENBQUQsQ0FBVCxDQUFhc0IsQ0FIUjtNQUlYUyxJQUFJLEVBQUUvQixTQUFTLENBQUMsQ0FBRCxDQUFULENBQWFzQjtJQUpSLENBQWI7O0lBTUEsS0FBSyxJQUFJVSxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHaEMsU0FBUyxDQUFDaUMsTUFBOUIsRUFBc0NELENBQUMsRUFBdkMsRUFBMkM7TUFDekMsSUFBSWhDLFNBQVMsQ0FBQ2dDLENBQUQsQ0FBVCxDQUFhWixDQUFiLEdBQWlCLEtBQUt2QixLQUFMLENBQVdnQyxJQUFoQyxFQUFzQztRQUNwQyxLQUFLaEMsS0FBTCxDQUFXZ0MsSUFBWCxHQUFrQjdCLFNBQVMsQ0FBQ2dDLENBQUQsQ0FBVCxDQUFhWixDQUEvQjtNQUNEOztNQUNELElBQUlwQixTQUFTLENBQUNnQyxDQUFELENBQVQsQ0FBYVosQ0FBYixHQUFpQixLQUFLdkIsS0FBTCxDQUFXaUMsSUFBaEMsRUFBc0M7UUFDcEMsS0FBS2pDLEtBQUwsQ0FBV2lDLElBQVgsR0FBa0I5QixTQUFTLENBQUNnQyxDQUFELENBQVQsQ0FBYVosQ0FBL0I7TUFDRDs7TUFDRCxJQUFJcEIsU0FBUyxDQUFDZ0MsQ0FBRCxDQUFULENBQWFWLENBQWIsR0FBaUIsS0FBS3pCLEtBQUwsQ0FBVzBCLElBQWhDLEVBQXNDO1FBQ3BDLEtBQUsxQixLQUFMLENBQVcwQixJQUFYLEdBQWtCdkIsU0FBUyxDQUFDZ0MsQ0FBRCxDQUFULENBQWFWLENBQS9CO01BQ0Q7O01BQ0QsSUFBSXRCLFNBQVMsQ0FBQ2dDLENBQUQsQ0FBVCxDQUFhVixDQUFiLEdBQWlCLEtBQUt6QixLQUFMLENBQVdrQyxJQUFoQyxFQUFzQztRQUNwQyxLQUFLbEMsS0FBTCxDQUFXa0MsSUFBWCxHQUFrQi9CLFNBQVMsQ0FBQ2dDLENBQUQsQ0FBVCxDQUFhVixDQUEvQjtNQUNEO0lBQ0Y7O0lBQ0QsS0FBS3pCLEtBQUwsQ0FBV3dCLElBQVgsR0FBa0IsQ0FBQyxLQUFLeEIsS0FBTCxDQUFXaUMsSUFBWCxHQUFrQixLQUFLakMsS0FBTCxDQUFXZ0MsSUFBOUIsSUFBb0MsQ0FBdEQ7SUFDQSxLQUFLaEMsS0FBTCxDQUFXcUMsSUFBWCxHQUFrQixDQUFDLEtBQUtyQyxLQUFMLENBQVdrQyxJQUFYLEdBQWtCLEtBQUtsQyxLQUFMLENBQVcwQixJQUE5QixJQUFvQyxDQUF0RDtJQUNBLEtBQUsxQixLQUFMLENBQVdzQyxNQUFYLEdBQW9CLEtBQUt0QyxLQUFMLENBQVdpQyxJQUFYLEdBQWtCLEtBQUtqQyxLQUFMLENBQVdnQyxJQUFqRDtJQUNBLEtBQUtoQyxLQUFMLENBQVd1QyxNQUFYLEdBQW9CLEtBQUt2QyxLQUFMLENBQVdrQyxJQUFYLEdBQWtCLEtBQUtsQyxLQUFMLENBQVcwQixJQUFqRDtFQUNEOztFQUVETCxPQUFPLENBQUNtQixXQUFELEVBQWM7SUFBRTtJQUNyQixJQUFJdkMsS0FBSyxHQUFHd0MsSUFBSSxDQUFDQyxHQUFMLENBQVMsQ0FBQ2IsTUFBTSxDQUFDYyxVQUFQLEdBQW9CLEtBQUt6RCxVQUFMLENBQWdCRSxjQUFyQyxJQUFxRG9ELFdBQVcsQ0FBQ0YsTUFBMUUsRUFBa0YsQ0FBQ1QsTUFBTSxDQUFDZSxXQUFQLEdBQXFCLEtBQUsxRCxVQUFMLENBQWdCRSxjQUF0QyxJQUFzRG9ELFdBQVcsQ0FBQ0QsTUFBcEosQ0FBWjtJQUNBLE9BQVF0QyxLQUFSO0VBQ0Q7O0VBRUQ4QixNQUFNLEdBQUc7SUFDUDtJQUNBRixNQUFNLENBQUNnQixvQkFBUCxDQUE0QixLQUFLakUsS0FBakM7SUFFQSxLQUFLQSxLQUFMLEdBQWFpRCxNQUFNLENBQUNpQixxQkFBUCxDQUE2QixNQUFNO01BRTlDO01BQ0EsTUFBTUMsT0FBTyxHQUFHLEtBQWhCLENBSDhDLENBSzlDOztNQUNBLElBQUksQ0FBQ0EsT0FBTCxFQUFjO1FBQ1osSUFBQWhCLGVBQUEsRUFBTyxJQUFBaUIsYUFBQSxDQUFLO0FBQ3BCO0FBQ0E7QUFDQSwyQ0FBMkMsS0FBS3hFLE1BQUwsQ0FBWXlFLElBQUssU0FBUSxLQUFLekUsTUFBTCxDQUFZMEUsRUFBRztBQUNuRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMEJBQTBCLEtBQUtsRCxLQUFMLENBQVd1QyxNQUFYLEdBQWtCLEtBQUt0QyxLQUFNO0FBQ3ZELHlCQUF5QixLQUFLRCxLQUFMLENBQVdzQyxNQUFYLEdBQWtCLEtBQUtyQyxLQUFNO0FBQ3REO0FBQ0EsdUNBQXdDLENBQUMsS0FBS0QsS0FBTCxDQUFXc0MsTUFBWixHQUFtQixLQUFLckMsS0FBekIsR0FBZ0MsQ0FBRSxPQUFNLEtBQUtmLFVBQUwsQ0FBZ0JFLGNBQWhCLEdBQStCLENBQUU7QUFDaEg7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQXBCUSxFQW9CRyxLQUFLVixVQXBCUixFQURZLENBdUJaOztRQUNBLElBQUksS0FBS2tCLFlBQVQsRUFBdUI7VUFDckI7VUFDQSxJQUFJdUQsV0FBVyxHQUFHckMsUUFBUSxDQUFDc0MsY0FBVCxDQUF3QixhQUF4QixDQUFsQjtVQUVBRCxXQUFXLENBQUNwQyxnQkFBWixDQUE2QixPQUE3QixFQUFzQyxNQUFNO1lBQzFDO1lBQ0FELFFBQVEsQ0FBQ3NDLGNBQVQsQ0FBd0IsT0FBeEIsRUFBaUNDLEtBQWpDLENBQXVDQyxVQUF2QyxHQUFvRCxRQUFwRDtZQUNBeEMsUUFBUSxDQUFDc0MsY0FBVCxDQUF3QixPQUF4QixFQUFpQ0MsS0FBakMsQ0FBdUNFLFFBQXZDLEdBQWtELFVBQWxEO1lBQ0F6QyxRQUFRLENBQUNzQyxjQUFULENBQXdCLE1BQXhCLEVBQWdDQyxLQUFoQyxDQUFzQ0MsVUFBdEMsR0FBbUQsU0FBbkQsQ0FKMEMsQ0FNMUM7WUFFQTs7WUFDQSxLQUFLbEQsU0FBTCxHQUFpQlUsUUFBUSxDQUFDc0MsY0FBVCxDQUF3QixpQkFBeEIsQ0FBakI7WUFFQSxLQUFLSSxvQkFBTCxHQVgwQyxDQWExQzs7WUFDQSxLQUFLcEQsU0FBTCxDQUFlVyxnQkFBZixDQUFnQyxXQUFoQyxFQUE4QzBDLEtBQUQsSUFBVztjQUN0RCxLQUFLM0QsU0FBTCxHQUFpQixJQUFqQjtjQUNBLEtBQUs0RCxVQUFMLENBQWdCRCxLQUFoQjtZQUNELENBSEQsRUFHRyxLQUhIO1lBSUEsS0FBS3JELFNBQUwsQ0FBZVcsZ0JBQWYsQ0FBZ0MsV0FBaEMsRUFBOEMwQyxLQUFELElBQVc7Y0FDdEQsSUFBSSxLQUFLM0QsU0FBVCxFQUFvQjtnQkFDbEIsS0FBSzRELFVBQUwsQ0FBZ0JELEtBQWhCO2NBQ0Q7WUFDRixDQUpELEVBSUcsS0FKSDtZQUtBLEtBQUtyRCxTQUFMLENBQWVXLGdCQUFmLENBQWdDLFNBQWhDLEVBQTRDMEMsS0FBRCxJQUFXO2NBQ3BELEtBQUszRCxTQUFMLEdBQWlCLEtBQWpCO1lBQ0QsQ0FGRCxFQUVHLEtBRkgsRUF2QjBDLENBMkIxQzs7WUFDQSxLQUFLTSxTQUFMLENBQWVXLGdCQUFmLENBQWdDLFlBQWhDLEVBQStDNEMsR0FBRCxJQUFTO2NBQ3JELEtBQUs1RCxPQUFMLEdBQWUsSUFBZjtjQUNBVSxPQUFPLENBQUNDLEdBQVIsQ0FBWWlELEdBQUcsQ0FBQ0MsY0FBSixDQUFtQixDQUFuQixDQUFaO2NBQ0EsS0FBS0YsVUFBTCxDQUFnQkMsR0FBRyxDQUFDQyxjQUFKLENBQW1CLENBQW5CLENBQWhCO1lBQ0QsQ0FKRCxFQUlHLEtBSkg7WUFLQSxLQUFLeEQsU0FBTCxDQUFlVyxnQkFBZixDQUFnQyxXQUFoQyxFQUE4QzRDLEdBQUQsSUFBUztjQUNwRCxJQUFJLEtBQUs1RCxPQUFULEVBQWtCO2dCQUNoQixLQUFLMkQsVUFBTCxDQUFnQkMsR0FBRyxDQUFDQyxjQUFKLENBQW1CLENBQW5CLENBQWhCO2NBQ0Q7WUFDRixDQUpELEVBSUcsS0FKSDtZQUtBLEtBQUt4RCxTQUFMLENBQWVXLGdCQUFmLENBQWdDLFVBQWhDLEVBQTZDNEMsR0FBRCxJQUFTO2NBQ25ELEtBQUs1RCxPQUFMLEdBQWUsS0FBZjtZQUNELENBRkQsRUFFRyxLQUZIO1lBSUEsS0FBS0YsWUFBTCxHQUFvQixJQUFwQixDQTFDMEMsQ0EwQ1I7VUFDbkMsQ0EzQ0Q7VUE0Q0EsS0FBS0QsWUFBTCxHQUFvQixLQUFwQixDQWhEcUIsQ0FnRGU7UUFDckM7TUFDRjtJQUNGLENBakZZLENBQWI7RUFrRkQ7O0VBRUQ0RCxvQkFBb0IsR0FBRztJQUFFO0lBRXZCO0lBQ0EsS0FBS2hELE9BQUwsQ0FBYXFELGFBQWIsQ0FBMkIsS0FBS3pELFNBQWhDLEVBQTJDLEtBQUtILEtBQWhELEVBQXVELEtBQUtxQixNQUE1RDtJQUNBLEtBQUtLLFFBQUwsQ0FBY21DLE9BQWQsQ0FBc0IsS0FBSzFELFNBQTNCO0lBQ0EsS0FBSzJCLE1BQUw7RUFDRDs7RUFFRDJCLFVBQVUsQ0FBQ0QsS0FBRCxFQUFRO0lBQUU7SUFDbEI7SUFDQSxJQUFJTSxLQUFLLEdBQUcsS0FBSy9ELEtBQUwsQ0FBV3dCLElBQVgsR0FBa0IsQ0FBQ2lDLEtBQUssQ0FBQ08sT0FBTixHQUFnQm5DLE1BQU0sQ0FBQ2MsVUFBUCxHQUFrQixDQUFuQyxJQUF1QyxLQUFLMUMsS0FBMUU7SUFDQSxJQUFJZ0UsS0FBSyxHQUFHLEtBQUtqRSxLQUFMLENBQVcwQixJQUFYLEdBQWtCLENBQUMrQixLQUFLLENBQUNTLE9BQU4sR0FBZ0IsS0FBS2hGLFVBQUwsQ0FBZ0JFLGNBQWhCLEdBQStCLENBQWhELElBQW9ELEtBQUthLEtBQXZGLENBSGdCLENBSWhCOztJQUNBLElBQUk4RCxLQUFLLElBQUksS0FBSy9ELEtBQUwsQ0FBV2dDLElBQXBCLElBQTRCK0IsS0FBSyxJQUFJLEtBQUsvRCxLQUFMLENBQVdpQyxJQUFoRCxJQUF3RGdDLEtBQUssSUFBSSxLQUFLakUsS0FBTCxDQUFXMEIsSUFBNUUsSUFBb0Z1QyxLQUFLLElBQUksS0FBS2pFLEtBQUwsQ0FBV2tDLElBQTVHLEVBQWtIO01BQ2hIO01BRUF6QixPQUFPLENBQUNDLEdBQVIsQ0FBWSxVQUFaO01BQ0EsS0FBS2lCLFFBQUwsQ0FBY3dDLGNBQWQsQ0FBNkJWLEtBQTdCLEVBQW9DLEtBQUtuQyxNQUF6QyxFQUFpRCxLQUFLckIsS0FBdEQ7TUFDQSxLQUFLTyxPQUFMLENBQWE0RCx5QkFBYixDQUF1QyxLQUFLekMsUUFBTCxDQUFjQyxnQkFBckQ7TUFDQSxLQUFLRyxNQUFMO0lBQ0QsQ0FQRCxNQVFLO01BQ0g7TUFDQSxLQUFLakMsU0FBTCxHQUFpQixLQUFqQjtNQUNBLEtBQUtDLE9BQUwsR0FBZSxLQUFmO0lBQ0Q7RUFDRjs7RUFFRCtCLGVBQWUsR0FBRztJQUFFO0lBRWxCO0lBQ0FoQixRQUFRLENBQUNzQyxjQUFULENBQXdCLGlCQUF4QixFQUEyQ2lCLE1BQTNDLEdBQXFELEtBQUsvQyxNQUFMLENBQVlHLENBQVosR0FBYyxLQUFLeEIsS0FBcEIsR0FBNkIsSUFBakY7SUFDQWEsUUFBUSxDQUFDc0MsY0FBVCxDQUF3QixpQkFBeEIsRUFBMkNrQixLQUEzQyxHQUFvRCxLQUFLaEQsTUFBTCxDQUFZQyxDQUFaLEdBQWMsS0FBS3RCLEtBQXBCLEdBQTZCLElBQWhGO0lBQ0FhLFFBQVEsQ0FBQ3NDLGNBQVQsQ0FBd0IsaUJBQXhCLEVBQTJDbUIsU0FBM0MsR0FBdUQsZ0JBQWdCLEtBQUtyRixVQUFMLENBQWdCRSxjQUFoQixHQUErQixDQUEvQixHQUFtQyxLQUFLWSxLQUFMLENBQVdzQyxNQUFYLEdBQWtCLEtBQUtyQyxLQUFMLENBQVd1RSxVQUE3QixHQUF3QyxDQUEzRixJQUFnRyxXQUF2SjtJQUVBLEtBQUtoRSxPQUFMLENBQWFpRSxxQkFBYixDQUFtQyxLQUFLeEUsS0FBeEMsRUFBK0MsS0FBS3FCLE1BQXBELEVBUGdCLENBT2lEOztJQUNqRSxLQUFLSyxRQUFMLENBQWMrQyxxQkFBZCxDQUFvQyxLQUFLcEQsTUFBekMsRUFBaUQsS0FBS3JCLEtBQXREO0VBQ0Q7O0FBclYrQzs7ZUF3Vm5DNUIsZ0IifQ==