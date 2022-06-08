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
      mode: "debug",
      // Choose audio mode (possible: "debug", "convolving")
      // mode: "streaming",                   // Choose audio mode (possible: "debug", "convolving")
      // mode: "convolving",                   // Choose audio mode (possible: "debug", "convolving")
      circleDiameter: 20,
      dataFileName: "",
      audioData: "",
      rirs: {},
      nbClosestPoints: 4,
      gainExposant: 3,
      listenerSize: 16,
      order: 3,
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
      // case 'debug':
      //   this.audioData = 'AudioFiles0';
      //   break;

      case 'convolving':
        this.parameters.audioData = 'AudioFiles3';
        this.parameters.dataFileName = 'scene3.json';
        break;

      default:
        alert("No valid mode");
    }

    const getTimeFunction = () => this.sync.getSyncTime();

    const currentTimeToAudioTimeFunction = currentTime => this.sync.getLocalTime(currentTime);

    this.scheduler = new _wavesMasters.Scheduler(getTimeFunction, {
      currentTimeToAudioTimeFunction
    }); // define simple engines for the scheduler

    this.metroAudio = {
      // `currentTime` is the current time of the scheduler (aka the syncTime)
      // `audioTime` is the audioTime as computed by `currentTimeToAudioTimeFunction`
      // `dt` is the time between the actual call of the function and the time of the
      // scheduled event
      advanceTime: (currentTime, audioTime, dt) => {
        const env = this.audioContext.createGain();
        env.connect(this.audioContext.destination);
        env.gain.value = 0;
        console.log("audio");
        const sine = this.audioContext.createOscillator();
        sine.connect(env);
        sine.frequency.value = 200 * (this.client.id % 10 + 1);
        env.gain.setValueAtTime(0, audioTime);
        env.gain.linearRampToValueAtTime(1, audioTime + 0.01);
        env.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.1);
        sine.start(audioTime);
        sine.stop(audioTime + 0.1);
        return currentTime + 1;
      }
    };
    this.metroVisual = {
      advanceTime: (currentTime, audioTime, dt) => {
        if (!this.$beat) {
          this.$beat = document.querySelector(`#beat-${this.client.id}`);
        } // console.log(`go in ${dt * 1000}`)
        // this.$beat.active = true;


        setTimeout(() => this.$beat.active = true, Math.round(dt * 1000));
        return currentTime + 1;
      }
    }; // this.globals.subscribe(updates => {
    //   this.updateEngines();
    //   this.render();
    // });
    // this.updateEngines();

    this.Sources = new _Sources.default(this.filesystem, this.audioBufferLoader, this.parameters);
    console.log(this.filesystem);
    this.Sources.LoadData();
    this.Sources.LoadSoundbank();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwiYXVkaW9Db250ZXh0IiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwic3luYyIsInBsYXRmb3JtIiwicGFyYW1ldGVycyIsIm1vZGUiLCJjaXJjbGVEaWFtZXRlciIsImRhdGFGaWxlTmFtZSIsImF1ZGlvRGF0YSIsInJpcnMiLCJuYkNsb3Nlc3RQb2ludHMiLCJnYWluRXhwb3NhbnQiLCJsaXN0ZW5lclNpemUiLCJvcmRlciIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsIm1vdXNlRG93biIsInRvdWNoZWQiLCJyYW5nZSIsInNjYWxlIiwiYXVkaW9GaWxlc05hbWUiLCJwb3NpdGlvbnMiLCJjb250YWluZXIiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsImFsZXJ0IiwiZ2V0VGltZUZ1bmN0aW9uIiwiZ2V0U3luY1RpbWUiLCJjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb24iLCJjdXJyZW50VGltZSIsImdldExvY2FsVGltZSIsInNjaGVkdWxlciIsIlNjaGVkdWxlciIsIm1ldHJvQXVkaW8iLCJhZHZhbmNlVGltZSIsImF1ZGlvVGltZSIsImR0IiwiZW52IiwiY3JlYXRlR2FpbiIsImNvbm5lY3QiLCJkZXN0aW5hdGlvbiIsImdhaW4iLCJ2YWx1ZSIsImNvbnNvbGUiLCJsb2ciLCJzaW5lIiwiY3JlYXRlT3NjaWxsYXRvciIsImZyZXF1ZW5jeSIsImlkIiwic2V0VmFsdWVBdFRpbWUiLCJsaW5lYXJSYW1wVG9WYWx1ZUF0VGltZSIsImV4cG9uZW50aWFsUmFtcFRvVmFsdWVBdFRpbWUiLCJzdG9wIiwibWV0cm9WaXN1YWwiLCIkYmVhdCIsImRvY3VtZW50IiwicXVlcnlTZWxlY3RvciIsInNldFRpbWVvdXQiLCJhY3RpdmUiLCJNYXRoIiwicm91bmQiLCJTb3VyY2VzIiwiTG9hZERhdGEiLCJMb2FkU291bmRiYW5rIiwiYWRkRXZlbnRMaXN0ZW5lciIsInNvdXJjZXNEYXRhIiwicmVjZWl2ZXJzIiwieHl6IiwiZmlsZXMiLCJSYW5nZSIsIlNjYWxpbmciLCJvZmZzZXQiLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwiTGlzdGVuZXIiLCJsaXN0ZW5lclBvc2l0aW9uIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwicmVuZGVyIiwibWluWCIsIm1heFgiLCJtYXhZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIm1pbiIsImlubmVyV2lkdGgiLCJpbm5lckhlaWdodCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwibG9hZGluZyIsImh0bWwiLCJ0eXBlIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0cmFuc2Zvcm0iLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG5pbXBvcnQgeyBTY2hlZHVsZXIgfSBmcm9tICd3YXZlcy1tYXN0ZXJzJztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIsIGF1ZGlvQ29udGV4dCkge1xuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTtcbiAgICAvLyB0aGlzLmFtYmlzb25pYyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcbiAgICB0aGlzLnN5bmMgPSB0aGlzLnJlcXVpcmUoJ3N5bmMnKTtcbiAgICB0aGlzLnBsYXRmb3JtID0gdGhpcy5yZXF1aXJlKCdwbGF0Zm9ybScpO1xuXG4gICAgLy8gQ2hhbmdpbmcgUGFyYW1ldGVyc1xuXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgbW9kZTogXCJkZWJ1Z1wiLCAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJjb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcInN0cmVhbWluZ1wiLCAgICAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYXVkaW8gbW9kZSAocG9zc2libGU6IFwiZGVidWdcIiwgXCJjb252b2x2aW5nXCIpXG4gICAgICAvLyBtb2RlOiBcImNvbnZvbHZpbmdcIiwgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcImRlYnVnXCIsIFwiY29udm9sdmluZ1wiKVxuICAgICAgY2lyY2xlRGlhbWV0ZXI6IDIwLFxuICAgICAgZGF0YUZpbGVOYW1lOiBcIlwiLFxuICAgICAgYXVkaW9EYXRhOiBcIlwiLFxuICAgICAgcmlyczoge30sXG4gICAgICBuYkNsb3Nlc3RQb2ludHM6IDQsXG4gICAgICBnYWluRXhwb3NhbnQ6IDMsXG4gICAgICBsaXN0ZW5lclNpemU6IDE2LFxuICAgICAgb3JkZXI6IDMsXG4gICAgICBhdWRpb0NvbnRleHQ6IGF1ZGlvQ29udGV4dFxuICAgIH1cblxuICAgIC8vIEluaXRpYWxpc2F0aW9uIHZhcmlhYmxlc1xuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IGZhbHNlO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG5cbiAgICAvLyBHbG9iYWwgdmFsdWVzXG4gICAgdGhpcy5yYW5nZTsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWYWx1ZXMgb2YgdGhlIGFycmF5IGRhdGEgKGNyZWF0ZXMgaW4gc3RhcnQoKSlcbiAgICB0aGlzLnNjYWxlOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyYWwgU2NhbGVzIChpbml0aWFsaXNlZCBpbiBzdGFydCgpKVxuICAgIC8vIHRoaXMuYXVkaW9EYXRhOyAgICAgICAvLyBTZXQgdGhlIGF1ZGlvIGRhdGEgdG8gdXNlXG5cblxuICAgIC8vIFNvdW5kcyBvZiB0aGUgc291cmNlc1xuICAgIHRoaXMuYXVkaW9GaWxlc05hbWUgPSBbXTtcblxuICAgIHRoaXMucG9zaXRpb25zID0gW107ICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJyYXkgb2Ygc291cmNlcyBwb3NpdGlvbnMgKGJ1aWx0IGluIHN0YXJ0KCkpXG5cbiAgICB0aGlzLmNvbnRhaW5lcjtcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgICBzd2l0Y2ggKHRoaXMucGFyYW1ldGVycy5tb2RlKSB7XG4gICAgICAgIGNhc2UgJ2RlYnVnJzpcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJztcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMC5qc29uJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMxJztcbiAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZGF0YUZpbGVOYW1lID0gJ3NjZW5lMS5qc29uJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gY2FzZSAnZGVidWcnOlxuICAgICAgICAvLyAgIHRoaXMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMwJztcbiAgICAgICAgLy8gICBicmVhaztcbiAgICAgICAgY2FzZSAnY29udm9sdmluZyc6XG4gICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMyc7XG4gICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmRhdGFGaWxlTmFtZSA9ICdzY2VuZTMuanNvbic7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYWxlcnQoXCJObyB2YWxpZCBtb2RlXCIpO1xuICAgICAgfVxuXG5cbiAgICBjb25zdCBnZXRUaW1lRnVuY3Rpb24gPSAoKSA9PiB0aGlzLnN5bmMuZ2V0U3luY1RpbWUoKTtcbiAgICBjb25zdCBjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb24gPVxuICAgICAgY3VycmVudFRpbWUgPT4gdGhpcy5zeW5jLmdldExvY2FsVGltZShjdXJyZW50VGltZSk7XG5cbiAgICB0aGlzLnNjaGVkdWxlciA9IG5ldyBTY2hlZHVsZXIoZ2V0VGltZUZ1bmN0aW9uLCB7XG4gICAgICBjdXJyZW50VGltZVRvQXVkaW9UaW1lRnVuY3Rpb25cbiAgICB9KTtcblxuICAgIC8vIGRlZmluZSBzaW1wbGUgZW5naW5lcyBmb3IgdGhlIHNjaGVkdWxlclxuICAgIHRoaXMubWV0cm9BdWRpbyA9IHtcbiAgICAgIC8vIGBjdXJyZW50VGltZWAgaXMgdGhlIGN1cnJlbnQgdGltZSBvZiB0aGUgc2NoZWR1bGVyIChha2EgdGhlIHN5bmNUaW1lKVxuICAgICAgLy8gYGF1ZGlvVGltZWAgaXMgdGhlIGF1ZGlvVGltZSBhcyBjb21wdXRlZCBieSBgY3VycmVudFRpbWVUb0F1ZGlvVGltZUZ1bmN0aW9uYFxuICAgICAgLy8gYGR0YCBpcyB0aGUgdGltZSBiZXR3ZWVuIHRoZSBhY3R1YWwgY2FsbCBvZiB0aGUgZnVuY3Rpb24gYW5kIHRoZSB0aW1lIG9mIHRoZVxuICAgICAgLy8gc2NoZWR1bGVkIGV2ZW50XG4gICAgICBhZHZhbmNlVGltZTogKGN1cnJlbnRUaW1lLCBhdWRpb1RpbWUsIGR0KSA9PiB7XG4gICAgICAgIGNvbnN0IGVudiA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKTtcbiAgICAgICAgZW52LmNvbm5lY3QodGhpcy5hdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuICAgICAgICBlbnYuZ2Fpbi52YWx1ZSA9IDA7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiYXVkaW9cIilcbiAgICAgICAgY29uc3Qgc2luZSA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZU9zY2lsbGF0b3IoKTtcbiAgICAgICAgc2luZS5jb25uZWN0KGVudik7XG4gICAgICAgIHNpbmUuZnJlcXVlbmN5LnZhbHVlID0gMjAwICogKHRoaXMuY2xpZW50LmlkICUgMTAgKyAxKTtcblxuICAgICAgICBlbnYuZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLCBhdWRpb1RpbWUpO1xuICAgICAgICBlbnYuZ2Fpbi5saW5lYXJSYW1wVG9WYWx1ZUF0VGltZSgxLCBhdWRpb1RpbWUgKyAwLjAxKTtcbiAgICAgICAgZW52LmdhaW4uZXhwb25lbnRpYWxSYW1wVG9WYWx1ZUF0VGltZSgwLjAwMDEsIGF1ZGlvVGltZSArIDAuMSk7XG5cbiAgICAgICAgc2luZS5zdGFydChhdWRpb1RpbWUpO1xuICAgICAgICBzaW5lLnN0b3AoYXVkaW9UaW1lICsgMC4xKTtcblxuICAgICAgICByZXR1cm4gY3VycmVudFRpbWUgKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMubWV0cm9WaXN1YWwgPSB7XG4gICAgICBhZHZhbmNlVGltZTogKGN1cnJlbnRUaW1lLCBhdWRpb1RpbWUsIGR0KSA9PiB7XG4gICAgICAgIGlmICghdGhpcy4kYmVhdCkge1xuICAgICAgICAgIHRoaXMuJGJlYXQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAjYmVhdC0ke3RoaXMuY2xpZW50LmlkfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGdvIGluICR7ZHQgKiAxMDAwfWApXG4gICAgICAgIC8vIHRoaXMuJGJlYXQuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLiRiZWF0LmFjdGl2ZSA9IHRydWUsIE1hdGgucm91bmQoZHQgKiAxMDAwKSk7XG5cbiAgICAgICAgcmV0dXJuIGN1cnJlbnRUaW1lICsgMTtcbiAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLyB0aGlzLmdsb2JhbHMuc3Vic2NyaWJlKHVwZGF0ZXMgPT4ge1xuICAgIC8vICAgdGhpcy51cGRhdGVFbmdpbmVzKCk7XG4gICAgLy8gICB0aGlzLnJlbmRlcigpO1xuICAgIC8vIH0pO1xuICAgIC8vIHRoaXMudXBkYXRlRW5naW5lcygpO1xuXG5cblxuXG4gICAgICB0aGlzLlNvdXJjZXMgPSBuZXcgU291cmNlcyh0aGlzLmZpbGVzeXN0ZW0sIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIsIHRoaXMucGFyYW1ldGVycylcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSgpO1xuICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsoKTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImRhdGFMb2FkZWRcIiwgKCkgPT4ge1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YSlcblxuICAgICAgICB0aGlzLnBvc2l0aW9ucyA9IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMueHl6O1xuICAgICAgICB0aGlzLmF1ZGlvRmlsZXNOYW1lID0gdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnJlY2VpdmVycy5maWxlcztcbiAgICAgICAgLy8gdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XG5cbiAgICAgICAgdGhpcy5SYW5nZSh0aGlzLnBvc2l0aW9ucyk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGlzaW5nICd0aGlzLnNjYWxlJ1xuICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuXG4gICAgICAgIHRoaXMub2Zmc2V0ID0ge1xuICAgICAgICAgIHg6IHRoaXMucmFuZ2UubW95WCxcbiAgICAgICAgICB5OiB0aGlzLnJhbmdlLm1pbllcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuTGlzdGVuZXIgPSBuZXcgTGlzdGVuZXIodGhpcy5vZmZzZXQsIHRoaXMucGFyYW1ldGVycylcbiAgICAgICAgdGhpcy5MaXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLlNvdXJjZXMuc3RhcnQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKVxuXG4gICAgICAgIC8vIEFkZCBFdmVudCBsaXN0ZW5lciBmb3IgcmVzaXplIFdpbmRvdyBldmVudCB0byByZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgICAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpOyAgICAgIC8vIENoYW5nZSB0aGUgc2NhbGVcbiAgICAgICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHsgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoZSBiZWdpbiBTdGF0ZVxuICAgICAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTsgICAgICAgICAgICAgICAgICAgLy8gUmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gRGlzcGxheVxuICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9KTtcblxuICB9XG5cbiAgUmFuZ2UocG9zaXRpb25zKSB7IC8vIFN0b3JlIHRoZSBhcnJheSBwcm9wZXJ0aWVzIGluICd0aGlzLnJhbmdlJ1xuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yO1xuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzI7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVggPSB0aGlzLnJhbmdlLm1heFggLSB0aGlzLnJhbmdlLm1pblg7XG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XG4gIH1cblxuICBTY2FsaW5nKHJhbmdlVmFsdWVzKSB7IC8vIFN0b3JlIHRoZSBncmVhdGVzdCBzY2FsZSB0byBkaXNwbGF5IGFsbCB0aGUgZWxlbWVudHMgaW4gJ3RoaXMuc2NhbGUnXG4gICAgdmFyIHNjYWxlID0gTWF0aC5taW4oKHdpbmRvdy5pbm5lcldpZHRoIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyKS9yYW5nZVZhbHVlcy5yYW5nZVgsICh3aW5kb3cuaW5uZXJIZWlnaHQgLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpO1xuICAgICAgY29uc3QgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgaWYgKCFsb2FkaW5nKSB7XG4gICAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoLXRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUpLzJ9cHgsICR7dGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzJ9cHgpO1wiPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgICAvLyBEbyB0aGlzIG9ubHkgYXQgYmVnaW5uaW5nXG4gICAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuICAgICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG5cbiAgICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHRvIGJlZ2luIHRoZSBzaW11bGF0aW9uXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS5wb3NpdGlvbiA9IFwiYWJzb2x1dGVcIjtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBjaXJjbGVzIHRvIGRpc3BsYXkgU291cmNlc1xuXG4gICAgICAgICAgICAvLyBBc3NpZ24gbW91c2UgYW5kIHRvdWNoIGNhbGxiYWNrcyB0byBjaGFuZ2UgdGhlIHVzZXIgUG9zaXRpb25cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuXG4gICAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKClcblxuICAgICAgICAgICAgLy8gVXNpbmcgbW91c2VcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgICAvLyBVc2luZyB0b3VjaFxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoc3RhcnRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhldnQuY2hhbmdlZFRvdWNoZXNbMF0pXG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNobW92ZVwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInRvdWNoZW5kXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7ICAgICAgICAgICAgXG5cbiAgICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTsgICAgICAgICAvLyBVcGRhdGUgYmVnaW4gU3RhdGUgXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTsgICAgICAgICAgLy8gVXBkYXRlIGluaXRpYWxpc2luZyBTdGF0ZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZCgpIHsgLy8gQmVnaW4gQXVkaW9Db250ZXh0IGFuZCBhZGQgdGhlIFNvdXJjZXMgZGlzcGxheSB0byB0aGUgZGlzcGxheVxuXG4gICAgLy8gSW5pdGlhbGlzaW5nIGEgdGVtcG9yYXJ5IGNpcmNsZVxuICAgIHRoaXMuU291cmNlcy5DcmVhdGVTb3VyY2VzKHRoaXMuY29udGFpbmVyLCB0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7XG4gICAgdGhpcy5MaXN0ZW5lci5EaXNwbGF5KHRoaXMuY29udGFpbmVyKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgdXNlckFjdGlvbihtb3VzZSkgeyAvLyBDaGFuZ2UgTGlzdGVuZXIncyBQb3NpdGlvbiB3aGVuIHRoZSBtb3VzZSBoYXMgYmVlbiB1c2VkXG4gICAgLy8gR2V0IHRoZSBuZXcgcG90ZW50aWFsIExpc3RlbmVyJ3MgUG9zaXRpb25cbiAgICB2YXIgdGVtcFggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlKTtcbiAgICB2YXIgdGVtcFkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlci8yKS8odGhpcy5zY2FsZSk7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIGlzIGluIHRoZSB2YWx1ZXMgcmFuZ2VcbiAgICBpZiAodGVtcFggPj0gdGhpcy5yYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAvLyBVcGRhdGUgTGlzdGVuZXJcblxuICAgICAgY29uc29sZS5sb2coXCJVcGRhdGluZ1wiKVxuICAgICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpO1xuICAgICAgdGhpcy5Tb3VyY2VzLm9uTGlzdGVuZXJQb3NpdGlvbkNoYW5nZWQodGhpcy5MaXN0ZW5lci5saXN0ZW5lclBvc2l0aW9uKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgdmFsdWUgaXMgb3V0IG9mIHJhbmdlLCBzdG9wIHRoZSBMaXN0ZW5lcidzIFBvc2l0aW9uIFVwZGF0ZVxuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHsgLy8gQ2hhbmdlIHRoZSBkaXNwbGF5IHdoZW4gdGhlIHdpbmRvdyBpcyByZXNpemVkXG5cbiAgICAvLyBDaGFuZ2Ugc2l6ZVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLm9mZnNldC55KnRoaXMuc2NhbGUpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMub2Zmc2V0LngqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KVwiO1xuXG4gICAgdGhpcy5Tb3VyY2VzLlVwZGF0ZVNvdXJjZXNQb3NpdGlvbih0aGlzLnNjYWxlLCB0aGlzLm9mZnNldCk7ICAgICAvLyBVcGRhdGUgU291cmNlcycgZGlzcGxheVxuICAgIHRoaXMuTGlzdGVuZXIuVXBkYXRlTGlzdGVuZXJEaXNwbGF5KHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxV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