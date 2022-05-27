"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _client = require("@soundworks/core/client");

var _litHtml = require("lit-html");

var _renderInitializationScreens = _interopRequireDefault(require("@soundworks/template-helpers/client/render-initialization-screens.js"));

var _Marker = _interopRequireDefault(require("./Marker.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import Scene from 'grid_nav_assets/assets/scene.json';
// import Positions from './scene.json'
// import fs5 from "fs";
// import JSON5 from 'json5';
class PlayerExperience extends _client.AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);
    this.config = config;
    this.$container = $container;
    this.rafId = null; // Require plugins if needed

    this.audioBufferLoader = this.require('audio-buffer-loader');
    this.ambisonics = require('ambisonics');
    this.filesystem = this.require('filesystem'); // console.log(this.filesystem)
    // console.log(this.filesystem.getValues())
    // const trees = this.filesystem.getValues();
    // for (let name in trees) {
    //   const tree = tree[name];
    //   console.log(name, tree);
    // }
    // this.path = require("path")
    // this.fs = this.require('fs')
    // const envConfigPath = 'public/grid_nav_assets/assets/scene.json'
    // var envConfig = JSON5.parse(fs.readFileSync(envConfigPath, 'utf-8'));
    // console.log(envConfig)

    this.initialising = true;
    this.listenerPosition = {
      x: 0,
      y: 0
    };
    this.ClosestPointsId = [];
    this.previousClosestPointsId = [];
    this.nbClosestPoints = 4;
    this.positions = [];
    this.truePositions = [[31.0, 41.5], [31.0, 39.0], [31.0, 36.2], [34.5, 36.2], [36.8, 36.2], [36.8, 33.6], [34.5, 33.6], [31.0, 33.6], [31.0, 31.0], [34.5, 31.0], [34.5, 28.0], [31.0, 28.0], [31.0, 25.8], [34.5, 25.8], [36.8, 25.8], [36.8, 23.6], [34.5, 23.6], [31.0, 23.6]];
    this.nbPos = this.truePositions.length;
    this.sourcesColor = ["gold", "green", "white", "black"];
    this.audioContext = new AudioContext();
    this.playingSounds = [];
    this.gains = [];
    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    super.start();
    this.soundBank = await this.audioBufferLoader.load({}, true);
    this.factorX = 20;
    this.offsetX = -500;
    this.factorY = 20;
    this.offsetY = -236;

    for (let i = 0; i < this.nbPos; i++) {
      // this.positions.push({x: Math.round(Math.random()*1000 - 500), y: Math.round(Math.random()*500)});
      this.positions.push({
        x: this.truePositions[i][0] * this.factorX + this.offsetX,
        y: this.truePositions[i][1] * this.factorY + this.offsetY
      });
    }

    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints); // for (let i = 0; i < this.nbPos; i++) {
    //   this.playingSounds.push(this.audioContext.createBufferSource());
    //   this.gains.push(this.audioContext.createGain());
    //   this.gains[i].gain.setValueAtTime(0.5, 0);
    //   this.playingSounds[i].connect(this.gains[i]);
    //   this.gains[i].connect(this.audioContext.destination);
    //   this.LoadNewSound(this.ClosestPointsId, i);
    //   this.playingSounds[i].play();
    // }
    // $.get("data.json", function(data){
    // console.log(data);
    // });
    // subscribe to display loading state

    this.audioBufferLoader.subscribe(() => this.render()); // subscribe to display loading state

    this.filesystem.subscribe(() => this.loadSoundbank()); // init with current content

    this.loadSoundbank(); // this.fs = require('file-system')

    const Tree = this.filesystem.get('Position'); //////// ça marche pas (impossibile d'utiliser fs, ne trouve pas le path...)
    // Tree.children.forEach(leaf => {
    //   // console.log(leaf)
    //   if (leaf.type === 'file') {
    //     console.log(leaf)
    //     if (leaf.extension === '.json') {
    //       // console.log(leaf.url)
    //       console.log(JSON.parse('./scene.json'))
    //       // console.log(JSON5.parse(this.filesystem.readFileSync(leaf.url, 'utf-8')));
    //       // let a = require(leaf.path)
    //       let b = require('./scene.json')
    //       // console.log(a);
    //       // console.log(b);
    //     }
    //   }
    // });
    // console.log(this.positions)

    window.addEventListener('resize', () => this.render());
    this.render();
  }

  loadSoundbank() {
    const soundbankTree = this.filesystem.get('AudioFiles0');
    const defObj = {};
    console.log(soundbankTree);
    soundbankTree.children.forEach(leaf => {
      // console.log(leaf)
      if (leaf.type === 'file') {
        defObj[leaf.name] = leaf.url;
      }
    });
    this.audioBufferLoader.load(defObj, true);
  }

  render() {
    // Debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);
    this.rafId = window.requestAnimationFrame(() => {
      const loading = this.audioBufferLoader.get('loading');
      const data = this.audioBufferLoader.data;
      console.log(data);
      (0, _litHtml.render)((0, _litHtml.html)`
        <div style="padding: 20px">
          <h1 style="margin: 20px 0">${this.client.type} [id: ${this.client.id}]</h1>
        </div>
        <div>
          <input type="button" id="beginButton" value="Begin Game"/>
        </div>
        <div id="game" style="visibility: hidden;">
          <div>
            <input type="range" id="positionInput1" max=500 min=-500 value=0></input>
            <input type="range" id="positionInput2" max=500 min= 0 value=0></input>
          </div>
          <div>
            ${this.listenerPosition.x}
            ${this.listenerPosition.y}
          </div>
          <div id="circleContainer" style="width: 600px; text-align: center; position: absolute; top: 180px; left: 50%">
            <div id="listener" style="position: absolute; height: 15px; width: 15px; background: blue; text-align: center; transform: translate(${this.listenerPosition.x}px, ${this.listenerPosition.y}px) rotate(45deg)"
          </div>
        </div>
      `, this.$container); //<p>add or remove .wav or .mp3 files in the "soundbank" directory and observe the changes:</p>${Object.keys(data).map(key => {return html`<p>- "${key}" loaded: ${data[key]}.</p>`;})}

      if (this.initialising) {
        // Assign callbacks once
        var beginButton = document.getElementById("beginButton");
        beginButton.addEventListener("click", () => {
          this.onBeginButtonClicked(document.getElementById('circleContainer'));
          document.getElementById("game").style.visibility = "visible";
          var positionInput1 = document.getElementById("positionInput1");
          var positionInput2 = document.getElementById("positionInput2");
          positionInput1.addEventListener("input", () => {
            this.onPositionChange(positionInput1, positionInput2);
          });
          positionInput2.addEventListener("input", () => {
            this.onPositionChange(positionInput1, positionInput2);
          });
        });
        this.initialising = false;
      } // var shootButton = document.getElementById("shootButton");
      // shootButton.addEventListener("click", () => {
      // });
      // var yawSlider = document.getElementById("sliderAzimAim");
      // yawSlider.addEventListener("input", () => {
      // });

    });
  }

  onBeginButtonClicked(container) {
    var tempCircle;

    for (let i = 0; i < this.positions.length; i++) {
      tempCircle = document.createElement('div');
      tempCircle.id = "circle" + i;
      tempCircle.style = "position: absolute; width: 20px; height: 20px; border-radius: 20px; background: red; text-align: center;";
      tempCircle.style.transform = "translate(" + this.positions[i].x + "px, " + this.positions[i].y + "px)";
      container.appendChild(tempCircle);
    }
  }

  onPositionChange(valueX, valueY) {
    this.listenerPosition.x = valueX.value;
    this.listenerPosition.y = valueY.value;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);

    for (let i = 0; i < this.nbClosestPoints.length; i++) {
      if (this.previousClosestPointsId[i] != this.ClosestPointsId) {
        document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "red";
        document.getElementById("circle" + this.ClosestPointsId[i]).style.background = this.sourcesColor[i];
        this.playingSounds[i].stop();
        this.playingSounds[i].disconnect(this.gains(i));
        this.playingSounds[i] = new LoadNewSound(this.ClosestPointsId[i], i);
        this.playingSounds[i].play();
      }
    }

    this.render();
  }

  ClosestSource(listenerPosition, listOfPoint, nbClosest) {
    var closestIds = [];
    var currentClosestId;

    for (let j = 0; j < nbClosest; j++) {
      currentClosestId = 0;

      for (let i = 1; i < listOfPoint.length; i++) {
        if (this.NotIn(i, closestIds) && this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[currentClosestId])) {
          currentClosestId = i;
        }
      }

      closestIds.push(currentClosestId); // console.log(closestIds)
    }

    return closestIds;
  }

  NotIn(pointId, listOfIds) {
    var iterator = 0;

    while (iterator < listOfIds.length && pointId != listOfIds[iterator]) {
      iterator += 1;
    }

    return iterator >= listOfIds.length;
  }

  Distance(pointA, pointB) {
    return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
  }

  LoadNewSound(soundId, gainId) {
    // Sound initialisation
    var Sound = this.audioContext.createBufferSource();
    Sound.loop = true;
    Sound.buffer = this.soundBank[soundId];
    Sound.connect(this.gain[gainId]);
    return Sound;
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsImxpc3RlbmVyUG9zaXRpb24iLCJ4IiwieSIsIkNsb3Nlc3RQb2ludHNJZCIsInByZXZpb3VzQ2xvc2VzdFBvaW50c0lkIiwibmJDbG9zZXN0UG9pbnRzIiwicG9zaXRpb25zIiwidHJ1ZVBvc2l0aW9ucyIsIm5iUG9zIiwibGVuZ3RoIiwic291cmNlc0NvbG9yIiwiYXVkaW9Db250ZXh0IiwiQXVkaW9Db250ZXh0IiwicGxheWluZ1NvdW5kcyIsImdhaW5zIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJzb3VuZEJhbmsiLCJsb2FkIiwiZmFjdG9yWCIsIm9mZnNldFgiLCJmYWN0b3JZIiwib2Zmc2V0WSIsImkiLCJwdXNoIiwiQ2xvc2VzdFNvdXJjZSIsInN1YnNjcmliZSIsInJlbmRlciIsImxvYWRTb3VuZGJhbmsiLCJUcmVlIiwiZ2V0Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInNvdW5kYmFua1RyZWUiLCJkZWZPYmoiLCJjb25zb2xlIiwibG9nIiwiY2hpbGRyZW4iLCJmb3JFYWNoIiwibGVhZiIsInR5cGUiLCJuYW1lIiwidXJsIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiZGF0YSIsImh0bWwiLCJpZCIsImJlZ2luQnV0dG9uIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb25JbnB1dDEiLCJwb3NpdGlvbklucHV0MiIsIm9uUG9zaXRpb25DaGFuZ2UiLCJjb250YWluZXIiLCJ0ZW1wQ2lyY2xlIiwiY3JlYXRlRWxlbWVudCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwidmFsdWVYIiwidmFsdWVZIiwidmFsdWUiLCJiYWNrZ3JvdW5kIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJMb2FkTmV3U291bmQiLCJwbGF5IiwibGlzdE9mUG9pbnQiLCJuYkNsb3Nlc3QiLCJjbG9zZXN0SWRzIiwiY3VycmVudENsb3Nlc3RJZCIsImoiLCJOb3RJbiIsIkRpc3RhbmNlIiwicG9pbnRJZCIsImxpc3RPZklkcyIsIml0ZXJhdG9yIiwicG9pbnRBIiwicG9pbnRCIiwiTWF0aCIsInNxcnQiLCJwb3ciLCJzb3VuZElkIiwiZ2FpbklkIiwiU291bmQiLCJjcmVhdGVCdWZmZXJTb3VyY2UiLCJsb29wIiwiYnVmZmVyIiwiY29ubmVjdCIsImdhaW4iXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcclxuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xyXG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcclxuXHJcbmltcG9ydCBNYXJrZXIgZnJvbSAnLi9NYXJrZXIuanMnO1xyXG4vLyBpbXBvcnQgU2NlbmUgZnJvbSAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cy9zY2VuZS5qc29uJztcclxuXHJcbi8vIGltcG9ydCBQb3NpdGlvbnMgZnJvbSAnLi9zY2VuZS5qc29uJ1xyXG4vLyBpbXBvcnQgZnM1IGZyb20gXCJmc1wiO1xyXG4vLyBpbXBvcnQgSlNPTjUgZnJvbSAnanNvbjUnO1xyXG5cclxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XHJcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lcikge1xyXG4gICAgc3VwZXIoY2xpZW50KTtcclxuXHJcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcclxuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XHJcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcclxuXHJcbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXHJcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7XHJcbiAgICB0aGlzLmFtYmlzb25pY3MgPSByZXF1aXJlKCdhbWJpc29uaWNzJyk7XHJcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcclxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbS5nZXRWYWx1ZXMoKSlcclxuICAgIC8vIGNvbnN0IHRyZWVzID0gdGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpO1xyXG4gICAgLy8gZm9yIChsZXQgbmFtZSBpbiB0cmVlcykge1xyXG4gICAgLy8gICBjb25zdCB0cmVlID0gdHJlZVtuYW1lXTtcclxuICAgIC8vICAgY29uc29sZS5sb2cobmFtZSwgdHJlZSk7XHJcbiAgICAvLyB9XHJcbiAgICAvLyB0aGlzLnBhdGggPSByZXF1aXJlKFwicGF0aFwiKVxyXG4gICAgLy8gdGhpcy5mcyA9IHRoaXMucmVxdWlyZSgnZnMnKVxyXG5cclxuLy8gY29uc3QgZW52Q29uZmlnUGF0aCA9ICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cy9zY2VuZS5qc29uJ1xyXG4vLyB2YXIgZW52Q29uZmlnID0gSlNPTjUucGFyc2UoZnMucmVhZEZpbGVTeW5jKGVudkNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcclxuLy8gY29uc29sZS5sb2coZW52Q29uZmlnKVxyXG5cclxuXHJcbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XHJcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24gPSB7XHJcbiAgICAgIHg6IDAsXHJcbiAgICAgIHk6IDAsXHJcbiAgICB9XHJcbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdO1xyXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IFtdO1xyXG4gICAgdGhpcy5uYkNsb3Nlc3RQb2ludHMgPSA0O1xyXG4gICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcclxuICAgIHRoaXMudHJ1ZVBvc2l0aW9ucyA9IFtcclxuICAgICAgWzMxLjAsIDQxLjVdLFxyXG4gICAgICBbMzEuMCwgMzkuMF0sXHJcbiAgICAgIFszMS4wLCAzNi4yXSxcclxuICAgICAgWzM0LjUsIDM2LjJdLFxyXG4gICAgICBbMzYuOCwgMzYuMl0sXHJcbiAgICAgIFszNi44LCAzMy42XSxcclxuICAgICAgWzM0LjUsIDMzLjZdLFxyXG4gICAgICBbMzEuMCwgMzMuNl0sXHJcbiAgICAgIFszMS4wLCAzMS4wXSxcclxuICAgICAgWzM0LjUsIDMxLjBdLFxyXG4gICAgICBbMzQuNSwgMjguMF0sXHJcbiAgICAgIFszMS4wLCAyOC4wXSxcclxuICAgICAgWzMxLjAsIDI1LjhdLFxyXG4gICAgICBbMzQuNSwgMjUuOF0sXHJcbiAgICAgIFszNi44LCAyNS44XSxcclxuICAgICAgWzM2LjgsIDIzLjZdLFxyXG4gICAgICBbMzQuNSwgMjMuNl0sXHJcbiAgICAgIFszMS4wLCAyMy42XSxcclxuICAgIF1cclxuXHJcbiAgICB0aGlzLm5iUG9zID0gdGhpcy50cnVlUG9zaXRpb25zLmxlbmd0aDtcclxuICAgIHRoaXMuc291cmNlc0NvbG9yID0gW1wiZ29sZFwiLCBcImdyZWVuXCIsIFwid2hpdGVcIiwgXCJibGFja1wiXTtcclxuXHJcbiAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcclxuICAgIHRoaXMucGxheWluZ1NvdW5kcyA9IFtdO1xyXG4gICAgdGhpcy5nYWlucyA9IFtdO1xyXG5cclxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XHJcbiAgfVxyXG5cclxuICBhc3luYyBzdGFydCgpIHtcclxuICAgIHN1cGVyLnN0YXJ0KCk7XHJcblxyXG4gICAgdGhpcy5zb3VuZEJhbmsgPSBhd2FpdCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmxvYWQoe1xyXG4gICAgfSwgdHJ1ZSk7XHJcblxyXG4gICAgdGhpcy5mYWN0b3JYID0gMjA7XHJcbiAgICB0aGlzLm9mZnNldFggPSAtNTAwO1xyXG4gICAgdGhpcy5mYWN0b3JZID0gMjA7XHJcbiAgICB0aGlzLm9mZnNldFkgPSAtMjM2O1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYlBvczsgaSsrKSB7XHJcbiAgICAgIC8vIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSoxMDAwIC0gNTAwKSwgeTogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjUwMCl9KTtcclxuICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogdGhpcy50cnVlUG9zaXRpb25zW2ldWzBdKnRoaXMuZmFjdG9yWCArIHRoaXMub2Zmc2V0WCwgeTp0aGlzLnRydWVQb3NpdGlvbnNbaV1bMV0qdGhpcy5mYWN0b3JZICsgdGhpcy5vZmZzZXRZfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpXHJcblxyXG4gICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcclxuICAgIC8vICAgdGhpcy5wbGF5aW5nU291bmRzLnB1c2godGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCkpO1xyXG4gICAgLy8gICB0aGlzLmdhaW5zLnB1c2godGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpKTtcclxuXHJcbiAgICAvLyAgIHRoaXMuZ2FpbnNbaV0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLjUsIDApO1xyXG5cclxuICAgIC8vICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLmNvbm5lY3QodGhpcy5nYWluc1tpXSk7XHJcbiAgICAvLyAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XHJcblxyXG4gICAgLy8gICB0aGlzLkxvYWROZXdTb3VuZCh0aGlzLkNsb3Nlc3RQb2ludHNJZCwgaSk7XHJcblxyXG4gICAgLy8gICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0ucGxheSgpO1xyXG4gICAgLy8gfVxyXG4gICAgLy8gJC5nZXQoXCJkYXRhLmpzb25cIiwgZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgIC8vIH0pO1xyXG5cclxuXHJcblxyXG4gICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxyXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW5kZXIoKSk7XHJcbiAgICAvLyBzdWJzY3JpYmUgdG8gZGlzcGxheSBsb2FkaW5nIHN0YXRlXHJcbiAgICB0aGlzLmZpbGVzeXN0ZW0uc3Vic2NyaWJlKCgpID0+IHRoaXMubG9hZFNvdW5kYmFuaygpKTtcclxuXHJcbiAgICAvLyBpbml0IHdpdGggY3VycmVudCBjb250ZW50XHJcbiAgICB0aGlzLmxvYWRTb3VuZGJhbmsoKTtcclxuXHJcbiAgICAvLyB0aGlzLmZzID0gcmVxdWlyZSgnZmlsZS1zeXN0ZW0nKVxyXG5cclxuICAgIGNvbnN0IFRyZWUgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0KCdQb3NpdGlvbicpOyAvLy8vLy8vLyDDp2EgbWFyY2hlIHBhcyAoaW1wb3NzaWJpbGUgZCd1dGlsaXNlciBmcywgbmUgdHJvdXZlIHBhcyBsZSBwYXRoLi4uKVxyXG4gICAgLy8gVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xyXG4gICAgLy8gICAvLyBjb25zb2xlLmxvZyhsZWFmKVxyXG4gICAgLy8gICBpZiAobGVhZi50eXBlID09PSAnZmlsZScpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZyhsZWFmKVxyXG4gICAgLy8gICAgIGlmIChsZWFmLmV4dGVuc2lvbiA9PT0gJy5qc29uJykge1xyXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2cobGVhZi51cmwpXHJcbiAgICAvLyAgICAgICBjb25zb2xlLmxvZyhKU09OLnBhcnNlKCcuL3NjZW5lLmpzb24nKSlcclxuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT041LnBhcnNlKHRoaXMuZmlsZXN5c3RlbS5yZWFkRmlsZVN5bmMobGVhZi51cmwsICd1dGYtOCcpKSk7XHJcbiAgICAvLyAgICAgICAvLyBsZXQgYSA9IHJlcXVpcmUobGVhZi5wYXRoKVxyXG4gICAgLy8gICAgICAgbGV0IGIgPSByZXF1aXJlKCcuL3NjZW5lLmpzb24nKVxyXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYSk7XHJcbiAgICAvLyAgICAgICAvLyBjb25zb2xlLmxvZyhiKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgIH1cclxuICAgIC8vIH0pO1xyXG5cclxuXHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBvc2l0aW9ucylcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB0aGlzLnJlbmRlcigpKTtcclxuICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgfVxyXG5cclxuICBsb2FkU291bmRiYW5rKCkge1xyXG4gICAgY29uc3Qgc291bmRiYW5rVHJlZSA9IHRoaXMuZmlsZXN5c3RlbS5nZXQoJ0F1ZGlvRmlsZXMwJyk7XHJcbiAgICBjb25zdCBkZWZPYmogPSB7fTtcclxuICAgIGNvbnNvbGUubG9nKHNvdW5kYmFua1RyZWUpXHJcblxyXG4gICAgc291bmRiYW5rVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhsZWFmKVxyXG4gICAgICBpZiAobGVhZi50eXBlID09PSAnZmlsZScpIHtcclxuICAgICAgICBkZWZPYmpbbGVhZi5uYW1lXSA9IGxlYWYudXJsO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmxvYWQoZGVmT2JqLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIHJlbmRlcigpIHtcclxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXHJcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XHJcblxyXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG5cclxuICAgICAgY29uc3QgbG9hZGluZyA9IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZ2V0KCdsb2FkaW5nJyk7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGE7XHJcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXHJcblxyXG4gICAgICByZW5kZXIoaHRtbGBcclxuICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxyXG4gICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XHJcbiAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MVwiIG1heD01MDAgbWluPS01MDAgdmFsdWU9MD48L2lucHV0PlxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MlwiIG1heD01MDAgbWluPSAwIHZhbHVlPTA+PC9pbnB1dD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH1cclxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwid2lkdGg6IDYwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAxODBweDsgbGVmdDogNTAlXCI+XHJcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsaXN0ZW5lclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDE1cHg7IHdpZHRoOiAxNXB4OyBiYWNrZ3JvdW5kOiBibHVlOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnh9cHgsICR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnl9cHgpIHJvdGF0ZSg0NWRlZylcIlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XHJcblxyXG5cclxuLy88cD5hZGQgb3IgcmVtb3ZlIC53YXYgb3IgLm1wMyBmaWxlcyBpbiB0aGUgXCJzb3VuZGJhbmtcIiBkaXJlY3RvcnkgYW5kIG9ic2VydmUgdGhlIGNoYW5nZXM6PC9wPiR7T2JqZWN0LmtleXMoZGF0YSkubWFwKGtleSA9PiB7cmV0dXJuIGh0bWxgPHA+LSBcIiR7a2V5fVwiIGxvYWRlZDogJHtkYXRhW2tleV19LjwvcD5gO30pfVxyXG5cclxuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XHJcbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXHJcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcclxuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJykpXHJcblxyXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcclxuXHJcbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQxXCIpO1xyXG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MlwiKTtcclxuICAgICAgICAgIHBvc2l0aW9uSW5wdXQxLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgcG9zaXRpb25JbnB1dDIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm9uUG9zaXRpb25DaGFuZ2UocG9zaXRpb25JbnB1dDEsIHBvc2l0aW9uSW5wdXQyKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gdmFyIHNob290QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG9vdEJ1dHRvblwiKTtcclxuICAgICAgLy8gc2hvb3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgLy8gfSk7XHJcblxyXG4gICAgICAvLyB2YXIgeWF3U2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZXJBemltQWltXCIpO1xyXG4gICAgICAvLyB5YXdTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcclxuXHJcbiAgICAgIC8vIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZChjb250YWluZXIpIHtcclxuICAgIHZhciB0ZW1wQ2lyY2xlXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHRlbXBDaXJjbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgdGVtcENpcmNsZS5pZCA9IFwiY2lyY2xlXCIgKyBpO1xyXG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlID0gXCJwb3NpdGlvbjogYWJzb2x1dGU7IHdpZHRoOiAyMHB4OyBoZWlnaHQ6IDIwcHg7IGJvcmRlci1yYWRpdXM6IDIwcHg7IGJhY2tncm91bmQ6IHJlZDsgdGV4dC1hbGlnbjogY2VudGVyO1wiO1xyXG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgdGhpcy5wb3NpdGlvbnNbaV0ueCArIFwicHgsIFwiICsgdGhpcy5wb3NpdGlvbnNbaV0ueSArIFwicHgpXCI7XHJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZW1wQ2lyY2xlKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgb25Qb3NpdGlvbkNoYW5nZSh2YWx1ZVgsIHZhbHVlWSkge1xyXG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB2YWx1ZVgudmFsdWU7XHJcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHZhbHVlWS52YWx1ZTtcclxuXHJcbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBpZiAodGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSAhPSB0aGlzLkNsb3Nlc3RQb2ludHNJZCkge1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZWRcIjtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSB0aGlzLnNvdXJjZXNDb2xvcltpXTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0b3AoKTtcclxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zKGkpKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldID0gbmV3IExvYWROZXdTb3VuZCh0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSwgaSk7XHJcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnBsYXkoKVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnJlbmRlcigpO1xyXG4gIH1cclxuXHJcbiAgQ2xvc2VzdFNvdXJjZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludCwgbmJDbG9zZXN0KSB7XHJcbiAgICB2YXIgY2xvc2VzdElkcyA9IFtdO1xyXG4gICAgdmFyIGN1cnJlbnRDbG9zZXN0SWQ7XHJcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5iQ2xvc2VzdDsgaisrKSB7XHJcbiAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSAwO1xyXG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpc3RPZlBvaW50Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuTm90SW4oaSwgY2xvc2VzdElkcykgJiYgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtpXSkgPCB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKSkge1xyXG4gICAgICAgICAgY3VycmVudENsb3Nlc3RJZCA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGNsb3Nlc3RJZHMucHVzaChjdXJyZW50Q2xvc2VzdElkKTtcclxuICAgICAgLy8gY29uc29sZS5sb2coY2xvc2VzdElkcylcclxuICAgIH1cclxuICAgIHJldHVybiAoY2xvc2VzdElkcyk7XHJcbiAgfVxyXG5cclxuICBOb3RJbihwb2ludElkLCBsaXN0T2ZJZHMpIHtcclxuICAgIHZhciBpdGVyYXRvciA9IDA7XHJcbiAgICB3aGlsZSAoaXRlcmF0b3IgPCBsaXN0T2ZJZHMubGVuZ3RoICYmIHBvaW50SWQgIT0gbGlzdE9mSWRzW2l0ZXJhdG9yXSkge1xyXG4gICAgICBpdGVyYXRvciArPSAxO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuKGl0ZXJhdG9yID49IGxpc3RPZklkcy5sZW5ndGgpO1xyXG4gIH1cclxuXHJcbiAgRGlzdGFuY2UocG9pbnRBLCBwb2ludEIpIHtcclxuICAgIHJldHVybiAoTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50QS54IC0gcG9pbnRCLngsIDIpICsgTWF0aC5wb3cocG9pbnRBLnkgLSBwb2ludEIueSwgMikpKTtcclxuICB9XHJcblxyXG4gIExvYWROZXdTb3VuZChzb3VuZElkLCBnYWluSWQpIHtcclxuICAgIC8vIFNvdW5kIGluaXRpYWxpc2F0aW9uXHJcbiAgICB2YXIgU291bmQgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKVxyXG4gICAgU291bmQubG9vcCA9IHRydWU7XHJcbiAgICBTb3VuZC5idWZmZXIgPSB0aGlzLnNvdW5kQmFua1tzb3VuZElkXTtcclxuICAgIFNvdW5kLmNvbm5lY3QodGhpcy5nYWluW2dhaW5JZF0pO1xyXG4gICAgcmV0dXJuIFNvdW5kO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTtcclxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDO0lBQzNDLE1BQU1GLE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxJQUFiLENBTDJDLENBTzNDOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QjtJQUNBLEtBQUtDLFVBQUwsR0FBa0JELE9BQU8sQ0FBQyxZQUFELENBQXpCO0lBQ0EsS0FBS0UsVUFBTCxHQUFrQixLQUFLRixPQUFMLENBQWEsWUFBYixDQUFsQixDQVYyQyxDQVczQztJQUNBO0lB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