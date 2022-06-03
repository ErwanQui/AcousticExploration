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

class PlayerExperience extends _client.AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);
    this.config = config;
    this.$container = $container;
    this.rafId = null; // Require plugins if needed

    this.audioBufferLoader = this.require('audio-buffer-loader'); // this.ambisonics = require('ambisonics');

    this.filesystem = this.require('filesystem'); // Initialisation variables

    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false; // Global values

    this.range; // Values of the array data (creates in start())

    this.scale; // General Scales (initialised in start())

    this.circleDiameter = 20; // Sources size

    this.audioData = 'AudioFiles0'; // Set the audio data to use

    this.dataFileName = "scene2.json";
    this.jsonObj;
    this.jsonObjloaded; // this.dataLoaded = false;
    // Positions of the sources

    this.truePositions = []; // Sounds of the sources

    this.audioFilesName = [];
    this.ClosestPointsId = []; // Ids of closest Sources

    this.previousClosestPointsId = []; // Ids of previous closest Sources

    this.nbClosestPoints = 4; // Number of avtive sources

    this.positions = []; // Array of sources positions (built in start())

    this.nbPos; // Number of Sources

    this.distanceValue = [0, 0, 0, 0]; // Distance of closest Sources

    this.distanceSum = 0; // Sum of distances of closest Sources

    this.gainsValue = [1, 1, 1]; // Array of Gains

    this.gainNorm = 0; // Norm of the Gains

    this.gainExposant = 4; // Esposant to increase Gains' gap

    this.container; // // Creating AudioContext
    // this.audioContext = new AudioContext();
    // this.playingSounds = [];                    // BufferSources
    // this.gains = [];                            // Gains

    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    super.start();
    this.Sources = new _Sources.default(this.filesystem, this.audioBufferLoader);
    console.log(this.filesystem);
    this.Sources.LoadData(this.dataFileName);
    this.Sources.LoadSoundbank(this.audioData);
    document.addEventListener("dataLoaded", () => {
      console.log(this.Sources.sourcesData);
      this.positions = this.Sources.sourcesData.receivers.xyz;
      this.audioFilesName = this.Sources.sourcesData.receivers.files;
      this.nbPos = this.truePositions.length;
      this.Range(this.positions); // Initialising 'this.scale'

      this.scale = this.Scaling(this.range);
      this.offset = {
        x: this.range.moyX,
        y: this.range.minY
      };
      this.Listener = new _Listener.default(this.offset);
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
    var scale = Math.min((window.innerWidth - this.circleDiameter) / rangeValues.rangeX, (window.innerHeight - this.circleDiameter) / rangeValues.rangeY);
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
                transform: translate(${-this.range.rangeX * this.scale / 2}px, ${this.circleDiameter / 2}px);">
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
    console.log(this.container);
  }

  userAction(mouse) {
    // Change Listener's Position when the mouse has been used
    // Get the new potential Listener's Position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale;
    var tempY = this.range.minY + (mouse.clientY - this.circleDiameter / 2) / this.scale; // Check if the value is in the values range

    if (tempX >= this.range.minX && tempX <= this.range.maxX && tempY >= this.range.minY && tempY <= this.range.maxY) {
      // Update Listener
      this.Listener.UpdateListener(mouse, this.offset, this.scale, this.circleDiameter / 2);
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
    document.getElementById("circleContainer").height = this.range.rangeY * this.scale.VPos2Pixel + "px";
    document.getElementById("circleContainer").width = this.range.rangeX * this.scale.VPos2Pixel + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.circleSize / 2 - this.range.rangeX * this.scale.VPos2Pixel / 2) + "px, 10px)";
    this.Sources.UpdateSourcesPosition(this.scale, this.offset); // Update Sources' display

    this.Listener.UpdateListener(this.Listener.listenerPosition, this.offset, this.scale, this.circleDiameter / 2);
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsInJhbmdlIiwic2NhbGUiLCJjaXJjbGVEaWFtZXRlciIsImF1ZGlvRGF0YSIsImRhdGFGaWxlTmFtZSIsImpzb25PYmoiLCJqc29uT2JqbG9hZGVkIiwidHJ1ZVBvc2l0aW9ucyIsImF1ZGlvRmlsZXNOYW1lIiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJuYlBvcyIsImRpc3RhbmNlVmFsdWUiLCJkaXN0YW5jZVN1bSIsImdhaW5zVmFsdWUiLCJnYWluTm9ybSIsImdhaW5FeHBvc2FudCIsImNvbnRhaW5lciIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiU291cmNlcyIsImNvbnNvbGUiLCJsb2ciLCJMb2FkRGF0YSIsIkxvYWRTb3VuZGJhbmsiLCJkb2N1bWVudCIsImFkZEV2ZW50TGlzdGVuZXIiLCJzb3VyY2VzRGF0YSIsInJlY2VpdmVycyIsInh5eiIsImZpbGVzIiwibGVuZ3RoIiwiUmFuZ2UiLCJTY2FsaW5nIiwib2Zmc2V0IiwieCIsIm1veVgiLCJ5IiwibWluWSIsIkxpc3RlbmVyIiwibGlzdGVuZXJQb3NpdGlvbiIsIndpbmRvdyIsIlVwZGF0ZUNvbnRhaW5lciIsInJlbmRlciIsIm1pblgiLCJtYXhYIiwibWF4WSIsImkiLCJtb3lZIiwicmFuZ2VYIiwicmFuZ2VZIiwicmFuZ2VWYWx1ZXMiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsImlubmVySGVpZ2h0IiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiaHRtbCIsInR5cGUiLCJpZCIsImJlZ2luQnV0dG9uIiwiZ2V0RWxlbWVudEJ5SWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbiIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwibW91c2UiLCJ1c2VyQWN0aW9uIiwiZXZ0IiwiY2hhbmdlZFRvdWNoZXMiLCJDcmVhdGVTb3VyY2VzIiwiRGlzcGxheSIsInRlbXBYIiwiY2xpZW50WCIsInRlbXBZIiwiY2xpZW50WSIsIlVwZGF0ZUxpc3RlbmVyIiwib25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCIsImhlaWdodCIsIlZQb3MyUGl4ZWwiLCJ3aWR0aCIsInRyYW5zZm9ybSIsImNpcmNsZVNpemUiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTGlzdGVuZXIgZnJvbSAnLi9MaXN0ZW5lci5qcydcbmltcG9ydCBTb3VyY2VzIGZyb20gJy4vU291cmNlcy5qcydcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7XG4gICAgLy8gdGhpcy5hbWJpc29uaWNzID0gcmVxdWlyZSgnYW1iaXNvbmljcycpO1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpO1xuXG4gICAgLy8gSW5pdGlhbGlzYXRpb24gdmFyaWFibGVzXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcblxuICAgIC8vIEdsb2JhbCB2YWx1ZXNcbiAgICB0aGlzLnJhbmdlOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhbHVlcyBvZiB0aGUgYXJyYXkgZGF0YSAoY3JlYXRlcyBpbiBzdGFydCgpKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYWxpc2VkIGluIHN0YXJ0KCkpXG4gICAgdGhpcy5jaXJjbGVEaWFtZXRlciA9IDIwOyAgICAgICAgICAgICAgICAgLy8gU291cmNlcyBzaXplXG4gICAgdGhpcy5hdWRpb0RhdGEgPSAnQXVkaW9GaWxlczAnOyAgICAgICAvLyBTZXQgdGhlIGF1ZGlvIGRhdGEgdG8gdXNlXG4gICAgdGhpcy5kYXRhRmlsZU5hbWUgPSBcInNjZW5lMi5qc29uXCI7XG4gICAgdGhpcy5qc29uT2JqO1xuICAgIHRoaXMuanNvbk9iamxvYWRlZDtcbiAgICAvLyB0aGlzLmRhdGFMb2FkZWQgPSBmYWxzZTtcblxuICAgIC8vIFBvc2l0aW9ucyBvZiB0aGUgc291cmNlc1xuICAgIHRoaXMudHJ1ZVBvc2l0aW9ucyA9IFtdO1xuXG4gICAgLy8gU291bmRzIG9mIHRoZSBzb3VyY2VzXG4gICAgdGhpcy5hdWRpb0ZpbGVzTmFtZSA9IFtdO1xuXG5cblxuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gW107ICAgICAgICAgICAgICAgICAgLy8gSWRzIG9mIGNsb3Nlc3QgU291cmNlc1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTsgICAgICAgICAgLy8gSWRzIG9mIHByZXZpb3VzIGNsb3Nlc3QgU291cmNlc1xuICAgIHRoaXMubmJDbG9zZXN0UG9pbnRzID0gNDsgICAgICAgICAgICAgICAgICAgLy8gTnVtYmVyIG9mIGF2dGl2ZSBzb3VyY2VzXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBbXTsgICAgICAgICAgICAgICAgICAgICAgICAvLyBBcnJheSBvZiBzb3VyY2VzIHBvc2l0aW9ucyAoYnVpbHQgaW4gc3RhcnQoKSlcbiAgICB0aGlzLm5iUG9zOyAgICAgLy8gTnVtYmVyIG9mIFNvdXJjZXNcbiAgICB0aGlzLmRpc3RhbmNlVmFsdWUgPSBbMCwgMCwgMCwgMF07ICAgICAgICAgIC8vIERpc3RhbmNlIG9mIGNsb3Nlc3QgU291cmNlc1xuICAgIHRoaXMuZGlzdGFuY2VTdW0gPSAwOyAgICAgICAgICAgICAgICAgICAgICAgLy8gU3VtIG9mIGRpc3RhbmNlcyBvZiBjbG9zZXN0IFNvdXJjZXNcbiAgICB0aGlzLmdhaW5zVmFsdWUgPSBbMSwgMSwgMV07ICAgICAgICAgICAgICAgIC8vIEFycmF5IG9mIEdhaW5zXG4gICAgdGhpcy5nYWluTm9ybSA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3JtIG9mIHRoZSBHYWluc1xuICAgIHRoaXMuZ2FpbkV4cG9zYW50ID0gNDsgICAgICAgICAgICAgICAgICAgICAgLy8gRXNwb3NhbnQgdG8gaW5jcmVhc2UgR2FpbnMnIGdhcFxuXG4gICAgdGhpcy5jb250YWluZXI7XG4gICAgLy8gLy8gQ3JlYXRpbmcgQXVkaW9Db250ZXh0XG4gICAgLy8gdGhpcy5hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgLy8gdGhpcy5wbGF5aW5nU291bmRzID0gW107ICAgICAgICAgICAgICAgICAgICAvLyBCdWZmZXJTb3VyY2VzXG4gICAgLy8gdGhpcy5nYWlucyA9IFtdOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHYWluc1xuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICAgIHRoaXMuU291cmNlcyA9IG5ldyBTb3VyY2VzKHRoaXMuZmlsZXN5c3RlbSwgdGhpcy5hdWRpb0J1ZmZlckxvYWRlcilcbiAgICAgIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAgIHRoaXMuU291cmNlcy5Mb2FkRGF0YSh0aGlzLmRhdGFGaWxlTmFtZSk7XG4gICAgICB0aGlzLlNvdXJjZXMuTG9hZFNvdW5kYmFuayh0aGlzLmF1ZGlvRGF0YSk7XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJkYXRhTG9hZGVkXCIsICgpID0+IHtcblxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEpXG5cbiAgICAgICAgdGhpcy5wb3NpdGlvbnMgPSB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLnh5ejtcbiAgICAgICAgdGhpcy5hdWRpb0ZpbGVzTmFtZSA9IHRoaXMuU291cmNlcy5zb3VyY2VzRGF0YS5yZWNlaXZlcnMuZmlsZXM7XG4gICAgICAgIHRoaXMubmJQb3MgPSB0aGlzLnRydWVQb3NpdGlvbnMubGVuZ3RoO1xuXG4gICAgICAgIHRoaXMuUmFuZ2UodGhpcy5wb3NpdGlvbnMpO1xuXG4gICAgICAgIC8vIEluaXRpYWxpc2luZyAndGhpcy5zY2FsZSdcbiAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTtcblxuICAgICAgICB0aGlzLm9mZnNldCA9IHtcbiAgICAgICAgICB4OiB0aGlzLnJhbmdlLm1veVgsXG4gICAgICAgICAgeTogdGhpcy5yYW5nZS5taW5ZXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLkxpc3RlbmVyID0gbmV3IExpc3RlbmVyKHRoaXMub2Zmc2V0LCApXG4gICAgICAgIHRoaXMuTGlzdGVuZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5Tb3VyY2VzLnN0YXJ0KHRoaXMuTGlzdGVuZXIubGlzdGVuZXJQb3NpdGlvbilcblxuICAgICAgICAvLyBBZGQgRXZlbnQgbGlzdGVuZXIgZm9yIHJlc2l6ZSBXaW5kb3cgZXZlbnQgdG8gcmVzaXplIHRoZSBkaXNwbGF5XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5zY2FsZSA9IHRoaXMuU2NhbGluZyh0aGlzLnJhbmdlKTsgICAgICAvLyBDaGFuZ2UgdGhlIHNjYWxlXG4gICAgICAgICAgaWYgKHRoaXMuYmVnaW5QcmVzc2VkKSB7ICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGUgYmVnaW4gU3RhdGVcbiAgICAgICAgICAgIHRoaXMuVXBkYXRlQ29udGFpbmVyKCk7ICAgICAgICAgICAgICAgICAgIC8vIFJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIERpc3BsYXlcbiAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfSk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG5cbiAgfVxuXG4gIFJhbmdlKHBvc2l0aW9ucykgeyAvLyBTdG9yZSB0aGUgYXJyYXkgcHJvcGVydGllcyBpbiAndGhpcy5yYW5nZSdcbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IHBvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IHBvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMjtcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykgeyAvLyBTdG9yZSB0aGUgZ3JlYXRlc3Qgc2NhbGUgdG8gZGlzcGxheSBhbGwgdGhlIGVsZW1lbnRzIGluICd0aGlzLnNjYWxlJ1xuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKCh3aW5kb3cuaW5uZXJXaWR0aCAtIHRoaXMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWSk7XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIC8vIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpO1xuICAgICAgY29uc3QgbG9hZGluZyA9IGZhbHNlO1xuXG4gICAgICAvLyBCZWdpbiB0aGUgcmVuZGVyIG9ubHkgd2hlbiBhdWRpb0RhdGEgYXJhIGxvYWRlZFxuICAgICAgaWYgKCFsb2FkaW5nKSB7XG4gICAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICAgIDxkaXYgaWQ9XCJiZWdpblwiPlxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGV9cHg7XG4gICAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsoLXRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUpLzJ9cHgsICR7dGhpcy5jaXJjbGVEaWFtZXRlci8yfXB4KTtcIj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgICAgLy8gRG8gdGhpcyBvbmx5IGF0IGJlZ2lubmluZ1xuICAgICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuXG4gICAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgZGlzcGxheSB0byBiZWdpbiB0aGUgc2ltdWxhdGlvblxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgY2lyY2xlcyB0byBkaXNwbGF5IFNvdXJjZXNcblxuICAgICAgICAgICAgLy8gQXNzaWduIG1vdXNlIGFuZCB0b3VjaCBjYWxsYmFja3MgdG8gY2hhbmdlIHRoZSB1c2VyIFBvc2l0aW9uXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKTtcblxuICAgICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZCgpXG5cbiAgICAgICAgICAgIC8vIFVzaW5nIG1vdXNlXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgICAgLy8gVXNpbmcgdG91Y2hcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaHN0YXJ0XCIsIChldnQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKVxuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24oZXZ0LmNoYW5nZWRUb3VjaGVzWzBdKTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaG1vdmVcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICBpZiAodGhpcy50b3VjaGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJ0b3VjaGVuZFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfSwgZmFsc2UpOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7ICAgICAgICAgLy8gVXBkYXRlIGJlZ2luIFN0YXRlIFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7ICAgICAgICAgIC8vIFVwZGF0ZSBpbml0aWFsaXNpbmcgU3RhdGVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoKSB7IC8vIEJlZ2luIEF1ZGlvQ29udGV4dCBhbmQgYWRkIHRoZSBTb3VyY2VzIGRpc3BsYXkgdG8gdGhlIGRpc3BsYXlcblxuICAgIC8vIEluaXRpYWxpc2luZyBhIHRlbXBvcmFyeSBjaXJjbGVcbiAgICB0aGlzLlNvdXJjZXMuQ3JlYXRlU291cmNlcyh0aGlzLmNvbnRhaW5lciwgdGhpcy5zY2FsZSwgdGhpcy5vZmZzZXQpO1xuICAgIHRoaXMuTGlzdGVuZXIuRGlzcGxheSh0aGlzLmNvbnRhaW5lcik7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICBjb25zb2xlLmxvZyh0aGlzLmNvbnRhaW5lcilcbiAgfVxuXG4gIHVzZXJBY3Rpb24obW91c2UpIHsgLy8gQ2hhbmdlIExpc3RlbmVyJ3MgUG9zaXRpb24gd2hlbiB0aGUgbW91c2UgaGFzIGJlZW4gdXNlZFxuICAgIC8vIEdldCB0aGUgbmV3IHBvdGVudGlhbCBMaXN0ZW5lcidzIFBvc2l0aW9uXG4gICAgdmFyIHRlbXBYID0gdGhpcy5yYW5nZS5tb3lYICsgKG1vdXNlLmNsaWVudFggLSB3aW5kb3cuaW5uZXJXaWR0aC8yKS8odGhpcy5zY2FsZSk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5yYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgIC8vIFVwZGF0ZSBMaXN0ZW5lclxuICAgICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcihtb3VzZSwgdGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUsIHRoaXMuY2lyY2xlRGlhbWV0ZXIvMik7XG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLmNpcmNsZVNpemUvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG4gICAgXG5cbiAgICB0aGlzLlNvdXJjZXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgIC8vIFVwZGF0ZSBTb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lcih0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMub2Zmc2V0LCB0aGlzLnNjYWxlLCB0aGlzLmNpcmNsZURpYW1ldGVyLzIpXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDO0lBQzNDLE1BQU1GLE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxJQUFiLENBTDJDLENBTzNDOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QixDQVIyQyxDQVMzQzs7SUFDQSxLQUFLQyxVQUFMLEdBQWtCLEtBQUtELE9BQUwsQ0FBYSxZQUFiLENBQWxCLENBVjJDLENBWTNDOztJQUNBLEtBQUtFLFlBQUwsR0FBb0IsSUFBcEI7SUFDQSxLQUFLQyxZQUFMLEdBQW9CLEtBQXBCO0lBQ0EsS0FBS0MsU0FBTCxHQUFpQixLQUFqQjtJQUNBLEtBQUtDLE9BQUwsR0FBZSxLQUFmLENBaEIyQyxDQWtCM0M7O0lBQ0EsS0FBS0MsS0FBTCxDQW5CMkMsQ0FtQkw7O0lBQ3RDLEtBQUtDLEtBQUwsQ0FwQjJDLENBb0JMOztJQUN0QyxLQUFLQyxjQUFMLEdBQXNCLEVBQXRCLENBckIyQyxDQXFCRDs7SUFDMUMsS0FBS0MsU0FBTCxHQUFpQixhQUFqQixDQXRCMkMsQ0FzQkw7O0lBQ3RDLEtBQUtDLFlBQUwsR0FBb0IsYUFBcEI7SUFDQSxLQUFLQyxPQUFMO0lBQ0EsS0FBS0MsYUFBTCxDQXpCMkMsQ0EwQjNDO0lBRUE7O0lBQ0EsS0FBS0MsYUFBTCxHQUFxQixFQUFyQixDQTdCMkMsQ0ErQjNDOztJQUNBLEtBQUtDLGNBQUwsR0FBc0Is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