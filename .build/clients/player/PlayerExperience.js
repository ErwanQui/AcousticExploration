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

    this.filesystem = this.require('filesystem'); // Changing Parameters

    this.parameters = {
      // mode: "streaming",                   // Choose audio mode (possible: "streaming", "convolving")
      mode: "convolving",
      // Choose audio mode (possible: "streaming", "convolving")
      circleDiameter: 20,
      dataFileName: "scene2.json",
      nbClosestPoints: 4,
      gainExposant: 3,
      listenerSize: 16,
      order: 3
    }; // Initialisation variables

    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false; // Global values

    this.range; // Values of the array data (creates in start())

    this.scale; // General Scales (initialised in start())

    this.audioData; // Set the audio data to use
    // Sounds of the sources

    this.audioFilesName = [];
    this.positions = []; // Array of sources positions (built in start())

    this.container;
    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    super.start();

    switch (this.parameters.mode) {
      case 'streaming':
        this.audioData = 'AudioFiles0';
        break;

      case 'convolving':
        this.audioData = 'AudioFiles3';
        break;

      default:
        alert("No valid mode");
    }

    this.Sources = new _Sources.default(this.filesystem, this.audioBufferLoader, this.parameters);
    console.log(this.filesystem);
    this.Sources.LoadData(this.parameters.dataFileName);
    this.Sources.LoadSoundbank(this.audioData);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJmaWxlc3lzdGVtIiwicGFyYW1ldGVycyIsIm1vZGUiLCJjaXJjbGVEaWFtZXRlciIsImRhdGFGaWxlTmFtZSIsIm5iQ2xvc2VzdFBvaW50cyIsImdhaW5FeHBvc2FudCIsImxpc3RlbmVyU2l6ZSIsIm9yZGVyIiwiaW5pdGlhbGlzaW5nIiwiYmVnaW5QcmVzc2VkIiwibW91c2VEb3duIiwidG91Y2hlZCIsInJhbmdlIiwic2NhbGUiLCJhdWRpb0RhdGEiLCJhdWRpb0ZpbGVzTmFtZSIsInBvc2l0aW9ucyIsImNvbnRhaW5lciIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiYWxlcnQiLCJTb3VyY2VzIiwiY29uc29sZSIsImxvZyIsIkxvYWREYXRhIiwiTG9hZFNvdW5kYmFuayIsImRvY3VtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsInNvdXJjZXNEYXRhIiwicmVjZWl2ZXJzIiwieHl6IiwiZmlsZXMiLCJSYW5nZSIsIlNjYWxpbmciLCJvZmZzZXQiLCJ4IiwibW95WCIsInkiLCJtaW5ZIiwiTGlzdGVuZXIiLCJsaXN0ZW5lclBvc2l0aW9uIiwid2luZG93IiwiVXBkYXRlQ29udGFpbmVyIiwicmVuZGVyIiwibWluWCIsIm1heFgiLCJtYXhZIiwiaSIsImxlbmd0aCIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIk1hdGgiLCJtaW4iLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImxvYWRpbmciLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJtb3VzZSIsInVzZXJBY3Rpb24iLCJldnQiLCJjaGFuZ2VkVG91Y2hlcyIsIkNyZWF0ZVNvdXJjZXMiLCJEaXNwbGF5IiwidGVtcFgiLCJjbGllbnRYIiwidGVtcFkiLCJjbGllbnRZIiwiVXBkYXRlTGlzdGVuZXIiLCJvbkxpc3RlbmVyUG9zaXRpb25DaGFuZ2VkIiwiaGVpZ2h0Iiwid2lkdGgiLCJ0cmFuc2Zvcm0iLCJWUG9zMlBpeGVsIiwiVXBkYXRlU291cmNlc1Bvc2l0aW9uIiwiVXBkYXRlTGlzdGVuZXJEaXNwbGF5Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IExpc3RlbmVyIGZyb20gJy4vTGlzdGVuZXIuanMnXG5pbXBvcnQgU291cmNlcyBmcm9tICcuL1NvdXJjZXMuanMnXG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpO1xuICAgIC8vIHRoaXMuYW1iaXNvbmljcyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcblxuICAgIC8vIENoYW5naW5nIFBhcmFtZXRlcnNcblxuICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgIC8vIG1vZGU6IFwic3RyZWFtaW5nXCIsICAgICAgICAgICAgICAgICAgIC8vIENob29zZSBhdWRpbyBtb2RlIChwb3NzaWJsZTogXCJzdHJlYW1pbmdcIiwgXCJjb252b2x2aW5nXCIpXG4gICAgICBtb2RlOiBcImNvbnZvbHZpbmdcIiwgICAgICAgICAgICAgICAgICAgLy8gQ2hvb3NlIGF1ZGlvIG1vZGUgKHBvc3NpYmxlOiBcInN0cmVhbWluZ1wiLCBcImNvbnZvbHZpbmdcIilcbiAgICAgIGNpcmNsZURpYW1ldGVyOiAyMCxcbiAgICAgIGRhdGFGaWxlTmFtZTogXCJzY2VuZTIuanNvblwiLFxuICAgICAgbmJDbG9zZXN0UG9pbnRzOiA0LFxuICAgICAgZ2FpbkV4cG9zYW50OiAzLFxuICAgICAgbGlzdGVuZXJTaXplOiAxNixcbiAgICAgIG9yZGVyOiAzXG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGlzYXRpb24gdmFyaWFibGVzXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gZmFsc2U7XG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcblxuICAgIC8vIEdsb2JhbCB2YWx1ZXNcbiAgICB0aGlzLnJhbmdlOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZhbHVlcyBvZiB0aGUgYXJyYXkgZGF0YSAoY3JlYXRlcyBpbiBzdGFydCgpKVxuICAgIHRoaXMuc2NhbGU7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2VuZXJhbCBTY2FsZXMgKGluaXRpYWxpc2VkIGluIHN0YXJ0KCkpXG4gICAgdGhpcy5hdWRpb0RhdGE7ICAgICAgIC8vIFNldCB0aGUgYXVkaW8gZGF0YSB0byB1c2VcblxuXG4gICAgLy8gU291bmRzIG9mIHRoZSBzb3VyY2VzXG4gICAgdGhpcy5hdWRpb0ZpbGVzTmFtZSA9IFtdO1xuXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBbXTsgICAgICAgICAgICAgICAgICAgICAgICAvLyBBcnJheSBvZiBzb3VyY2VzIHBvc2l0aW9ucyAoYnVpbHQgaW4gc3RhcnQoKSlcblxuICAgIHRoaXMuY29udGFpbmVyO1xuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICAgIHN3aXRjaCAodGhpcy5wYXJhbWV0ZXJzLm1vZGUpIHtcbiAgICAgICAgY2FzZSAnc3RyZWFtaW5nJzpcbiAgICAgICAgICB0aGlzLmF1ZGlvRGF0YSA9ICdBdWRpb0ZpbGVzMCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NvbnZvbHZpbmcnOlxuICAgICAgICAgIHRoaXMuYXVkaW9EYXRhID0gJ0F1ZGlvRmlsZXMzJztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBhbGVydChcIk5vIHZhbGlkIG1vZGVcIik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuU291cmNlcyA9IG5ldyBTb3VyY2VzKHRoaXMuZmlsZXN5c3RlbSwgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciwgdGhpcy5wYXJhbWV0ZXJzKVxuICAgICAgY29uc29sZS5sb2codGhpcy5maWxlc3lzdGVtKVxuICAgICAgdGhpcy5Tb3VyY2VzLkxvYWREYXRhKHRoaXMucGFyYW1ldGVycy5kYXRhRmlsZU5hbWUpO1xuICAgICAgdGhpcy5Tb3VyY2VzLkxvYWRTb3VuZGJhbmsodGhpcy5hdWRpb0RhdGEpO1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGF0YUxvYWRlZFwiLCAoKSA9PiB7XG5cbiAgICAgICAgY29uc29sZS5sb2codGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhKVxuXG4gICAgICAgIHRoaXMucG9zaXRpb25zID0gdGhpcy5Tb3VyY2VzLnNvdXJjZXNEYXRhLnJlY2VpdmVycy54eXo7XG4gICAgICAgIHRoaXMuYXVkaW9GaWxlc05hbWUgPSB0aGlzLlNvdXJjZXMuc291cmNlc0RhdGEucmVjZWl2ZXJzLmZpbGVzO1xuICAgICAgICAvLyB0aGlzLm5iUG9zID0gdGhpcy50cnVlUG9zaXRpb25zLmxlbmd0aDtcblxuICAgICAgICB0aGlzLlJhbmdlKHRoaXMucG9zaXRpb25zKTtcblxuICAgICAgICAvLyBJbml0aWFsaXNpbmcgJ3RoaXMuc2NhbGUnXG4gICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG5cbiAgICAgICAgdGhpcy5vZmZzZXQgPSB7XG4gICAgICAgICAgeDogdGhpcy5yYW5nZS5tb3lYLFxuICAgICAgICAgIHk6IHRoaXMucmFuZ2UubWluWVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5MaXN0ZW5lciA9IG5ldyBMaXN0ZW5lcih0aGlzLm9mZnNldCwgdGhpcy5wYXJhbWV0ZXJzKVxuICAgICAgICB0aGlzLkxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMuU291cmNlcy5zdGFydCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pXG5cbiAgICAgICAgLy8gQWRkIEV2ZW50IGxpc3RlbmVyIGZvciByZXNpemUgV2luZG93IGV2ZW50IHRvIHJlc2l6ZSB0aGUgZGlzcGxheVxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xuICAgICAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7ICAgICAgLy8gQ2hhbmdlIHRoZSBzY2FsZVxuICAgICAgICAgIGlmICh0aGlzLmJlZ2luUHJlc3NlZCkgeyAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhlIGJlZ2luIFN0YXRlXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZUNvbnRhaW5lcigpOyAgICAgICAgICAgICAgICAgICAvLyBSZXNpemUgdGhlIGRpc3BsYXlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBEaXNwbGF5XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0pO1xuXG4gIH1cblxuICBSYW5nZShwb3NpdGlvbnMpIHsgLy8gU3RvcmUgdGhlIGFycmF5IHByb3BlcnRpZXMgaW4gJ3RoaXMucmFuZ2UnXG4gICAgdGhpcy5yYW5nZSA9IHtcbiAgICAgIG1pblg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWF4WDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtaW5ZOiBwb3NpdGlvbnNbMF0ueSwgXG4gICAgICBtYXhZOiBwb3NpdGlvbnNbMF0ueSxcbiAgICB9O1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnggPCB0aGlzLnJhbmdlLm1pblgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gcG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnggPiB0aGlzLnJhbmdlLm1heFgpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gcG9zaXRpb25zW2ldLng7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnkgPCB0aGlzLnJhbmdlLm1pblkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gcG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgICBpZiAocG9zaXRpb25zW2ldLnkgPiB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gcG9zaXRpb25zW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzI7XG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMjtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHsgLy8gU3RvcmUgdGhlIGdyZWF0ZXN0IHNjYWxlIHRvIGRpc3BsYXkgYWxsIHRoZSBlbGVtZW50cyBpbiAndGhpcy5zY2FsZSdcbiAgICB2YXIgc2NhbGUgPSBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMucGFyYW1ldGVycy5jaXJjbGVEaWFtZXRlcikvcmFuZ2VWYWx1ZXMucmFuZ2VZKTtcbiAgICByZXR1cm4gKHNjYWxlKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgLy8gY29uc3QgbG9hZGluZyA9IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZ2V0KCdsb2FkaW5nJyk7XG4gICAgICBjb25zdCBsb2FkaW5nID0gZmFsc2U7XG5cbiAgICAgIC8vIEJlZ2luIHRoZSByZW5kZXIgb25seSB3aGVuIGF1ZGlvRGF0YSBhcmEgbG9hZGVkXG4gICAgICBpZiAoIWxvYWRpbmcpIHtcbiAgICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICR7dGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZX1weDtcbiAgICAgICAgICAgICAgICB3aWR0aDogJHt0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlfXB4O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHllbGxvdzsgei1pbmRleDogMDtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZSkvMn1weCwgJHt0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMn1weCk7XCI+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAgIC8vIERvIHRoaXMgb25seSBhdCBiZWdpbm5pbmdcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcblxuICAgICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgdG8gYmVnaW4gdGhlIHNpbXVsYXRpb25cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGNpcmNsZXMgdG8gZGlzcGxheSBTb3VyY2VzXG5cbiAgICAgICAgICAgIC8vIEFzc2lnbiBtb3VzZSBhbmQgdG91Y2ggY2FsbGJhY2tzIHRvIGNoYW5nZSB0aGUgdXNlciBQb3NpdGlvblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG5cbiAgICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoKVxuXG4gICAgICAgICAgICAvLyBVc2luZyBtb3VzZVxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgICB0aGlzLnVzZXJBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgIC8vIFVzaW5nIHRvdWNoXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hzdGFydFwiLCAoZXZ0KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSlcbiAgICAgICAgICAgICAgdGhpcy51c2VyQWN0aW9uKGV2dC5jaGFuZ2VkVG91Y2hlc1swXSk7XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2htb3ZlXCIsIChldnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHRoaXMudG91Y2hlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMudXNlckFjdGlvbihldnQuY2hhbmdlZFRvdWNoZXNbMF0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwidG91Y2hlbmRcIiwgKGV2dCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIGZhbHNlKTsgICAgICAgICAgICBcblxuICAgICAgICAgICAgdGhpcy5iZWdpblByZXNzZWQgPSB0cnVlOyAgICAgICAgIC8vIFVwZGF0ZSBiZWdpbiBTdGF0ZSBcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlOyAgICAgICAgICAvLyBVcGRhdGUgaW5pdGlhbGlzaW5nIFN0YXRlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKCkgeyAvLyBCZWdpbiBBdWRpb0NvbnRleHQgYW5kIGFkZCB0aGUgU291cmNlcyBkaXNwbGF5IHRvIHRoZSBkaXNwbGF5XG5cbiAgICAvLyBJbml0aWFsaXNpbmcgYSB0ZW1wb3JhcnkgY2lyY2xlXG4gICAgdGhpcy5Tb3VyY2VzLkNyZWF0ZVNvdXJjZXModGhpcy5jb250YWluZXIsIHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTtcbiAgICB0aGlzLkxpc3RlbmVyLkRpc3BsYXkodGhpcy5jb250YWluZXIpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICB1c2VyQWN0aW9uKG1vdXNlKSB7IC8vIENoYW5nZSBMaXN0ZW5lcidzIFBvc2l0aW9uIHdoZW4gdGhlIG1vdXNlIGhhcyBiZWVuIHVzZWRcbiAgICAvLyBHZXQgdGhlIG5ldyBwb3RlbnRpYWwgTGlzdGVuZXIncyBQb3NpdGlvblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5wYXJhbWV0ZXJzLmNpcmNsZURpYW1ldGVyLzIpLyh0aGlzLnNjYWxlKTtcbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgaW4gdGhlIHZhbHVlcyByYW5nZVxuICAgIGlmICh0ZW1wWCA+PSB0aGlzLnJhbmdlLm1pblggJiYgdGVtcFggPD0gdGhpcy5yYW5nZS5tYXhYICYmIHRlbXBZID49IHRoaXMucmFuZ2UubWluWSAmJiB0ZW1wWSA8PSB0aGlzLnJhbmdlLm1heFkpIHtcbiAgICAgIC8vIFVwZGF0ZSBMaXN0ZW5lclxuXG4gICAgICBjb25zb2xlLmxvZyhcIlVwZGF0aW5nXCIpXG4gICAgICB0aGlzLkxpc3RlbmVyLlVwZGF0ZUxpc3RlbmVyKG1vdXNlLCB0aGlzLm9mZnNldCwgdGhpcy5zY2FsZSk7XG4gICAgICB0aGlzLlNvdXJjZXMub25MaXN0ZW5lclBvc2l0aW9uQ2hhbmdlZCh0aGlzLkxpc3RlbmVyLmxpc3RlbmVyUG9zaXRpb24pO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBXaGVuIHRoZSB2YWx1ZSBpcyBvdXQgb2YgcmFuZ2UsIHN0b3AgdGhlIExpc3RlbmVyJ3MgUG9zaXRpb24gVXBkYXRlXG4gICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgdGhpcy50b3VjaGVkID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlQ29udGFpbmVyKCkgeyAvLyBDaGFuZ2UgdGhlIGRpc3BsYXkgd2hlbiB0aGUgd2luZG93IGlzIHJlc2l6ZWRcblxuICAgIC8vIENoYW5nZSBzaXplXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikuaGVpZ2h0ID0gKHRoaXMub2Zmc2V0LnkqdGhpcy5zY2FsZSkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikud2lkdGggPSAodGhpcy5vZmZzZXQueCp0aGlzLnNjYWxlKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICh0aGlzLnBhcmFtZXRlcnMuY2lyY2xlRGlhbWV0ZXIvMiAtIHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbC8yKSArIFwicHgsIDEwcHgpXCI7XG5cbiAgICB0aGlzLlNvdXJjZXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKHRoaXMuc2NhbGUsIHRoaXMub2Zmc2V0KTsgICAgIC8vIFVwZGF0ZSBTb3VyY2VzJyBkaXNwbGF5XG4gICAgdGhpcy5MaXN0ZW5lci5VcGRhdGVMaXN0ZW5lckRpc3BsYXkodGhpcy5vZmZzZXQsIHRoaXMuc2NhbGUpXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTsiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7OztBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDO0lBQzNDLE1BQU1GLE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxJQUFiLENBTDJDLENBTzNDOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QixDQVIyQyxDQVMzQzs7SUFDQSxLQUFLQyxVQUFMLEdBQWtCLEtBQUtELE9BQUwsQ0FBYSxZQUFiLENBQWxCLENBVjJDLENBWTNDOztJQUVBLEtBQUtFLFVBQUwsR0FBa0I7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