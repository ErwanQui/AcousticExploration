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
      this.positions.push({
        x: Math.round(Math.random() * 1000 - 500),
        y: Math.round(Math.random() * 500)
      }); // this.positions.push({x: this.truePositions[i][0]*this.factorX + this.offsetX, y:this.truePositions[i][1]*this.factorY + this.offsetY});
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
    this.previousClosestPointsId - this.ClosestPointsId;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsImxpc3RlbmVyUG9zaXRpb24iLCJ4IiwieSIsIkNsb3Nlc3RQb2ludHNJZCIsInByZXZpb3VzQ2xvc2VzdFBvaW50c0lkIiwibmJDbG9zZXN0UG9pbnRzIiwicG9zaXRpb25zIiwidHJ1ZVBvc2l0aW9ucyIsIm5iUG9zIiwibGVuZ3RoIiwic291cmNlc0NvbG9yIiwiYXVkaW9Db250ZXh0IiwiQXVkaW9Db250ZXh0IiwicGxheWluZ1NvdW5kcyIsImdhaW5zIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJzb3VuZEJhbmsiLCJsb2FkIiwiZmFjdG9yWCIsIm9mZnNldFgiLCJmYWN0b3JZIiwib2Zmc2V0WSIsImkiLCJwdXNoIiwiTWF0aCIsInJvdW5kIiwicmFuZG9tIiwiQ2xvc2VzdFNvdXJjZSIsInN1YnNjcmliZSIsInJlbmRlciIsImxvYWRTb3VuZGJhbmsiLCJUcmVlIiwiZ2V0Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInNvdW5kYmFua1RyZWUiLCJkZWZPYmoiLCJjb25zb2xlIiwibG9nIiwiY2hpbGRyZW4iLCJmb3JFYWNoIiwibGVhZiIsInR5cGUiLCJuYW1lIiwidXJsIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiZGF0YSIsImh0bWwiLCJpZCIsImJlZ2luQnV0dG9uIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb25JbnB1dDEiLCJwb3NpdGlvbklucHV0MiIsIm9uUG9zaXRpb25DaGFuZ2UiLCJjb250YWluZXIiLCJ0ZW1wQ2lyY2xlIiwiY3JlYXRlRWxlbWVudCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwidmFsdWVYIiwidmFsdWVZIiwidmFsdWUiLCJiYWNrZ3JvdW5kIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJMb2FkTmV3U291bmQiLCJwbGF5IiwibGlzdE9mUG9pbnQiLCJuYkNsb3Nlc3QiLCJjbG9zZXN0SWRzIiwiY3VycmVudENsb3Nlc3RJZCIsImoiLCJOb3RJbiIsIkRpc3RhbmNlIiwicG9pbnRJZCIsImxpc3RPZklkcyIsIml0ZXJhdG9yIiwicG9pbnRBIiwicG9pbnRCIiwic3FydCIsInBvdyIsInNvdW5kSWQiLCJnYWluSWQiLCJTb3VuZCIsImNyZWF0ZUJ1ZmZlclNvdXJjZSIsImxvb3AiLCJidWZmZXIiLCJjb25uZWN0IiwiZ2FpbiJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xyXG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XHJcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xyXG5cclxuaW1wb3J0IE1hcmtlciBmcm9tICcuL01hcmtlci5qcyc7XHJcbi8vIGltcG9ydCBTY2VuZSBmcm9tICdncmlkX25hdl9hc3NldHMvYXNzZXRzL3NjZW5lLmpzb24nO1xyXG5cclxuLy8gaW1wb3J0IFBvc2l0aW9ucyBmcm9tICcuL3NjZW5lLmpzb24nXHJcbi8vIGltcG9ydCBmczUgZnJvbSBcImZzXCI7XHJcbi8vIGltcG9ydCBKU09ONSBmcm9tICdqc29uNSc7XHJcblxyXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcclxuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyKSB7XHJcbiAgICBzdXBlcihjbGllbnQpO1xyXG5cclxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcclxuICAgIHRoaXMucmFmSWQgPSBudWxsO1xyXG5cclxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcclxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIgPSB0aGlzLnJlcXVpcmUoJ2F1ZGlvLWJ1ZmZlci1sb2FkZXInKTtcclxuICAgIHRoaXMuYW1iaXNvbmljcyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcclxuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpO1xyXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5maWxlc3lzdGVtKVxyXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpKVxyXG4gICAgLy8gY29uc3QgdHJlZXMgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCk7XHJcbiAgICAvLyBmb3IgKGxldCBuYW1lIGluIHRyZWVzKSB7XHJcbiAgICAvLyAgIGNvbnN0IHRyZWUgPSB0cmVlW25hbWVdO1xyXG4gICAgLy8gICBjb25zb2xlLmxvZyhuYW1lLCB0cmVlKTtcclxuICAgIC8vIH1cclxuICAgIC8vIHRoaXMucGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpXHJcbiAgICAvLyB0aGlzLmZzID0gdGhpcy5yZXF1aXJlKCdmcycpXHJcblxyXG4vLyBjb25zdCBlbnZDb25maWdQYXRoID0gJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvYXNzZXRzL3NjZW5lLmpzb24nXHJcbi8vIHZhciBlbnZDb25maWcgPSBKU09ONS5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZW52Q29uZmlnUGF0aCwgJ3V0Zi04JykpO1xyXG4vLyBjb25zb2xlLmxvZyhlbnZDb25maWcpXHJcblxyXG5cclxuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcclxuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbiA9IHtcclxuICAgICAgeDogMCxcclxuICAgICAgeTogMCxcclxuICAgIH1cclxuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gW107XHJcbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gW107XHJcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7XHJcbiAgICB0aGlzLnBvc2l0aW9ucyA9IFtdO1xyXG4gICAgdGhpcy50cnVlUG9zaXRpb25zID0gW1xyXG4gICAgICBbMzEuMCwgNDEuNV0sXHJcbiAgICAgIFszMS4wLCAzOS4wXSxcclxuICAgICAgWzMxLjAsIDM2LjJdLFxyXG4gICAgICBbMzQuNSwgMzYuMl0sXHJcbiAgICAgIFszNi44LCAzNi4yXSxcclxuICAgICAgWzM2LjgsIDMzLjZdLFxyXG4gICAgICBbMzQuNSwgMzMuNl0sXHJcbiAgICAgIFszMS4wLCAzMy42XSxcclxuICAgICAgWzMxLjAsIDMxLjBdLFxyXG4gICAgICBbMzQuNSwgMzEuMF0sXHJcbiAgICAgIFszNC41LCAyOC4wXSxcclxuICAgICAgWzMxLjAsIDI4LjBdLFxyXG4gICAgICBbMzEuMCwgMjUuOF0sXHJcbiAgICAgIFszNC41LCAyNS44XSxcclxuICAgICAgWzM2LjgsIDI1LjhdLFxyXG4gICAgICBbMzYuOCwgMjMuNl0sXHJcbiAgICAgIFszNC41LCAyMy42XSxcclxuICAgICAgWzMxLjAsIDIzLjZdLFxyXG4gICAgXVxyXG5cclxuICAgIHRoaXMubmJQb3MgPSB0aGlzLnRydWVQb3NpdGlvbnMubGVuZ3RoO1xyXG4gICAgdGhpcy5zb3VyY2VzQ29sb3IgPSBbXCJnb2xkXCIsIFwiZ3JlZW5cIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdO1xyXG5cclxuICAgIHRoaXMuYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgdGhpcy5wbGF5aW5nU291bmRzID0gW107XHJcbiAgICB0aGlzLmdhaW5zID0gW107XHJcblxyXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHN0YXJ0KCkge1xyXG4gICAgc3VwZXIuc3RhcnQoKTtcclxuXHJcbiAgICB0aGlzLnNvdW5kQmFuayA9IGF3YWl0IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZCh7XHJcbiAgICB9LCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLmZhY3RvclggPSAyMDtcclxuICAgIHRoaXMub2Zmc2V0WCA9IC01MDA7XHJcbiAgICB0aGlzLmZhY3RvclkgPSAyMDtcclxuICAgIHRoaXMub2Zmc2V0WSA9IC0yMzY7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcclxuICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjEwMDAgLSA1MDApLCB5OiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkqNTAwKX0pO1xyXG4gICAgICAvLyB0aGlzLnBvc2l0aW9ucy5wdXNoKHt4OiB0aGlzLnRydWVQb3NpdGlvbnNbaV1bMF0qdGhpcy5mYWN0b3JYICsgdGhpcy5vZmZzZXRYLCB5OnRoaXMudHJ1ZVBvc2l0aW9uc1tpXVsxXSp0aGlzLmZhY3RvclkgKyB0aGlzLm9mZnNldFl9KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cylcclxuXHJcbiAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJQb3M7IGkrKykge1xyXG4gICAgLy8gICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSk7XHJcbiAgICAvLyAgIHRoaXMuZ2FpbnMucHVzaCh0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCkpO1xyXG5cclxuICAgIC8vICAgdGhpcy5nYWluc1tpXS5nYWluLnNldFZhbHVlQXRUaW1lKDAuNSwgMCk7XHJcblxyXG4gICAgLy8gICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uY29ubmVjdCh0aGlzLmdhaW5zW2ldKTtcclxuICAgIC8vICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcclxuXHJcbiAgICAvLyAgIHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuQ2xvc2VzdFBvaW50c0lkLCBpKTtcclxuXHJcbiAgICAvLyAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5wbGF5KCk7XHJcbiAgICAvLyB9XHJcbiAgICAvLyAkLmdldChcImRhdGEuanNvblwiLCBmdW5jdGlvbihkYXRhKXtcclxuICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgLy8gfSk7XHJcblxyXG5cclxuXHJcbiAgICAvLyBzdWJzY3JpYmUgdG8gZGlzcGxheSBsb2FkaW5nIHN0YXRlXHJcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlbmRlcigpKTtcclxuICAgIC8vIHN1YnNjcmliZSB0byBkaXNwbGF5IGxvYWRpbmcgc3RhdGVcclxuICAgIHRoaXMuZmlsZXN5c3RlbS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5sb2FkU291bmRiYW5rKCkpO1xyXG5cclxuICAgIC8vIGluaXQgd2l0aCBjdXJyZW50IGNvbnRlbnRcclxuICAgIHRoaXMubG9hZFNvdW5kYmFuaygpO1xyXG5cclxuICAgIC8vIHRoaXMuZnMgPSByZXF1aXJlKCdmaWxlLXN5c3RlbScpXHJcblxyXG4gICAgY29uc3QgVHJlZSA9IHRoaXMuZmlsZXN5c3RlbS5nZXQoJ1Bvc2l0aW9uJyk7IC8vLy8vLy8vIMOnYSBtYXJjaGUgcGFzIChpbXBvc3NpYmlsZSBkJ3V0aWxpc2VyIGZzLCBuZSB0cm91dmUgcGFzIGxlIHBhdGguLi4pXHJcbiAgICAvLyBUcmVlLmNoaWxkcmVuLmZvckVhY2gobGVhZiA9PiB7XHJcbiAgICAvLyAgIC8vIGNvbnNvbGUubG9nKGxlYWYpXHJcbiAgICAvLyAgIGlmIChsZWFmLnR5cGUgPT09ICdmaWxlJykge1xyXG4gICAgLy8gICAgIGNvbnNvbGUubG9nKGxlYWYpXHJcbiAgICAvLyAgICAgaWYgKGxlYWYuZXh0ZW5zaW9uID09PSAnLmpzb24nKSB7XHJcbiAgICAvLyAgICAgICAvLyBjb25zb2xlLmxvZyhsZWFmLnVybClcclxuICAgIC8vICAgICAgIGNvbnNvbGUubG9nKEpTT04ucGFyc2UoJy4vc2NlbmUuanNvbicpKVxyXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coSlNPTjUucGFyc2UodGhpcy5maWxlc3lzdGVtLnJlYWRGaWxlU3luYyhsZWFmLnVybCwgJ3V0Zi04JykpKTtcclxuICAgIC8vICAgICAgIC8vIGxldCBhID0gcmVxdWlyZShsZWFmLnBhdGgpXHJcbiAgICAvLyAgICAgICBsZXQgYiA9IHJlcXVpcmUoJy4vc2NlbmUuanNvbicpXHJcbiAgICAvLyAgICAgICAvLyBjb25zb2xlLmxvZyhhKTtcclxuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKGIpO1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vICAgfVxyXG4gICAgLy8gfSk7XHJcblxyXG5cclxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucG9zaXRpb25zKVxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHRoaXMucmVuZGVyKCkpO1xyXG4gICAgdGhpcy5yZW5kZXIoKTtcclxuICB9XHJcblxyXG4gIGxvYWRTb3VuZGJhbmsoKSB7XHJcbiAgICBjb25zdCBzb3VuZGJhbmtUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCgnQXVkaW9GaWxlczAnKTtcclxuICAgIGNvbnN0IGRlZk9iaiA9IHt9O1xyXG4gICAgY29uc29sZS5sb2coc291bmRiYW5rVHJlZSlcclxuXHJcbiAgICBzb3VuZGJhbmtUcmVlLmNoaWxkcmVuLmZvckVhY2gobGVhZiA9PiB7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGxlYWYpXHJcbiAgICAgIGlmIChsZWFmLnR5cGUgPT09ICdmaWxlJykge1xyXG4gICAgICAgIGRlZk9ialtsZWFmLm5hbWVdID0gbGVhZi51cmw7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZChkZWZPYmosIHRydWUpO1xyXG4gIH1cclxuXHJcbiAgcmVuZGVyKCkge1xyXG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcclxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcclxuXHJcbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XHJcblxyXG4gICAgICBjb25zdCBsb2FkaW5nID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5nZXQoJ2xvYWRpbmcnKTtcclxuICAgICAgY29uc3QgZGF0YSA9IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YTtcclxuICAgICAgY29uc29sZS5sb2coZGF0YSlcclxuXHJcbiAgICAgIHJlbmRlcihodG1sYFxyXG4gICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XHJcbiAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cclxuICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBpZD1cInBvc2l0aW9uSW5wdXQxXCIgbWF4PTUwMCBtaW49LTUwMCB2YWx1ZT0wPjwvaW5wdXQ+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBpZD1cInBvc2l0aW9uSW5wdXQyXCIgbWF4PTUwMCBtaW49IDAgdmFsdWU9MD48L2lucHV0PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAke3RoaXMubGlzdGVuZXJQb3NpdGlvbi54fVxyXG4gICAgICAgICAgICAke3RoaXMubGlzdGVuZXJQb3NpdGlvbi55fVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ3aWR0aDogNjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDE4MHB4OyBsZWZ0OiA1MCVcIj5cclxuICAgICAgICAgICAgPGRpdiBpZD1cImxpc3RlbmVyXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IGhlaWdodDogMTVweDsgd2lkdGg6IDE1cHg7IGJhY2tncm91bmQ6IGJsdWU7IHRleHQtYWxpZ246IGNlbnRlcjsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH1weCwgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX1weCkgcm90YXRlKDQ1ZGVnKVwiXHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcclxuXHJcblxyXG4vLzxwPmFkZCBvciByZW1vdmUgLndhdiBvciAubXAzIGZpbGVzIGluIHRoZSBcInNvdW5kYmFua1wiIGRpcmVjdG9yeSBhbmQgb2JzZXJ2ZSB0aGUgY2hhbmdlczo8L3A+JHtPYmplY3Qua2V5cyhkYXRhKS5tYXAoa2V5ID0+IHtyZXR1cm4gaHRtbGA8cD4tIFwiJHtrZXl9XCIgbG9hZGVkOiAke2RhdGFba2V5XX0uPC9wPmA7fSl9XHJcblxyXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcclxuICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcclxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xyXG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKSlcclxuXHJcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xyXG5cclxuICAgICAgICAgIHZhciBwb3NpdGlvbklucHV0MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicG9zaXRpb25JbnB1dDFcIik7XHJcbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQyXCIpO1xyXG4gICAgICAgICAgcG9zaXRpb25JbnB1dDEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm9uUG9zaXRpb25DaGFuZ2UocG9zaXRpb25JbnB1dDEsIHBvc2l0aW9uSW5wdXQyKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICBwb3NpdGlvbklucHV0Mi5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB2YXIgc2hvb3RCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob290QnV0dG9uXCIpO1xyXG4gICAgICAvLyBzaG9vdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAvLyB9KTtcclxuXHJcbiAgICAgIC8vIHZhciB5YXdTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlckF6aW1BaW1cIik7XHJcbiAgICAgIC8vIHlhd1NsaWRlci5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xyXG5cclxuICAgICAgLy8gfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKGNvbnRhaW5lcikge1xyXG4gICAgdmFyIHRlbXBDaXJjbGVcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdGVtcENpcmNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICB0ZW1wQ2lyY2xlLmlkID0gXCJjaXJjbGVcIiArIGk7XHJcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUgPSBcInBvc2l0aW9uOiBhYnNvbHV0ZTsgd2lkdGg6IDIwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czogMjBweDsgYmFja2dyb3VuZDogcmVkOyB0ZXh0LWFsaWduOiBjZW50ZXI7XCI7XHJcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyB0aGlzLnBvc2l0aW9uc1tpXS54ICsgXCJweCwgXCIgKyB0aGlzLnBvc2l0aW9uc1tpXS55ICsgXCJweClcIjtcclxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBDaXJjbGUpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBvblBvc2l0aW9uQ2hhbmdlKHZhbHVlWCwgdmFsdWVZKSB7XHJcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHZhbHVlWC52YWx1ZTtcclxuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gdmFsdWVZLnZhbHVlO1xyXG5cclxuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgLSB0aGlzLkNsb3Nlc3RQb2ludHNJZFxyXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWQpIHtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMuQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5zb3VyY2VzQ29sb3JbaV07XHJcblxyXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdG9wKCk7XHJcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLmRpc2Nvbm5lY3QodGhpcy5nYWlucyhpKSk7XHJcblxyXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXSA9IG5ldyBMb2FkTmV3U291bmQodGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0sIGkpO1xyXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5wbGF5KClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5yZW5kZXIoKTtcclxuICB9XHJcblxyXG4gIENsb3Nlc3RTb3VyY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnQsIG5iQ2xvc2VzdCkge1xyXG4gICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcclxuICAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuYkNsb3Nlc3Q7IGorKykge1xyXG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gMDtcclxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBsaXN0T2ZQb2ludC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICh0aGlzLk5vdEluKGksIGNsb3Nlc3RJZHMpICYmIHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbaV0pIDwgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSkpIHtcclxuICAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGNsb3Nlc3RJZHMpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gKGNsb3Nlc3RJZHMpO1xyXG4gIH1cclxuXHJcbiAgTm90SW4ocG9pbnRJZCwgbGlzdE9mSWRzKSB7XHJcbiAgICB2YXIgaXRlcmF0b3IgPSAwO1xyXG4gICAgd2hpbGUgKGl0ZXJhdG9yIDwgbGlzdE9mSWRzLmxlbmd0aCAmJiBwb2ludElkICE9IGxpc3RPZklkc1tpdGVyYXRvcl0pIHtcclxuICAgICAgaXRlcmF0b3IgKz0gMTtcclxuICAgIH1cclxuICAgIHJldHVybihpdGVyYXRvciA+PSBsaXN0T2ZJZHMubGVuZ3RoKTtcclxuICB9XHJcblxyXG4gIERpc3RhbmNlKHBvaW50QSwgcG9pbnRCKSB7XHJcbiAgICByZXR1cm4gKE1hdGguc3FydChNYXRoLnBvdyhwb2ludEEueCAtIHBvaW50Qi54LCAyKSArIE1hdGgucG93KHBvaW50QS55IC0gcG9pbnRCLnksIDIpKSk7XHJcbiAgfVxyXG5cclxuICBMb2FkTmV3U291bmQoc291bmRJZCwgZ2FpbklkKSB7XHJcbiAgICAvLyBTb3VuZCBpbml0aWFsaXNhdGlvblxyXG4gICAgdmFyIFNvdW5kID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKClcclxuICAgIFNvdW5kLmxvb3AgPSB0cnVlO1xyXG4gICAgU291bmQuYnVmZmVyID0gdGhpcy5zb3VuZEJhbmtbc291bmRJZF07XHJcbiAgICBTb3VuZC5jb25uZWN0KHRoaXMuZ2FpbltnYWluSWRdKTtcclxuICAgIHJldHVybiBTb3VuZDtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQztJQUMzQyxNQUFNRixNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLQyxLQUFMLEdBQWEsSUFBYixDQUwyQyxDQU8zQzs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekI7SUFDQSxLQUFLQyxVQUFMLEdBQWtCRCxPQUFPLENBQUMsWUFB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