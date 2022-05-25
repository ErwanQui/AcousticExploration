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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsImxpc3RlbmVyUG9zaXRpb24iLCJ4IiwieSIsIkNsb3Nlc3RQb2ludHNJZCIsInByZXZpb3VzQ2xvc2VzdFBvaW50c0lkIiwibmJDbG9zZXN0UG9pbnRzIiwicG9zaXRpb25zIiwidHJ1ZVBvc2l0aW9ucyIsIm5iUG9zIiwibGVuZ3RoIiwic291cmNlc0NvbG9yIiwiYXVkaW9Db250ZXh0IiwiQXVkaW9Db250ZXh0IiwicGxheWluZ1NvdW5kcyIsImdhaW5zIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJzb3VuZEJhbmsiLCJsb2FkIiwiZmFjdG9yWCIsIm9mZnNldFgiLCJmYWN0b3JZIiwib2Zmc2V0WSIsImkiLCJwdXNoIiwiTWF0aCIsInJvdW5kIiwicmFuZG9tIiwiQ2xvc2VzdFNvdXJjZSIsInN1YnNjcmliZSIsInJlbmRlciIsImxvYWRTb3VuZGJhbmsiLCJUcmVlIiwiZ2V0Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInNvdW5kYmFua1RyZWUiLCJkZWZPYmoiLCJjb25zb2xlIiwibG9nIiwiY2hpbGRyZW4iLCJmb3JFYWNoIiwibGVhZiIsInR5cGUiLCJuYW1lIiwidXJsIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiZGF0YSIsImh0bWwiLCJpZCIsImJlZ2luQnV0dG9uIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb25JbnB1dDEiLCJwb3NpdGlvbklucHV0MiIsIm9uUG9zaXRpb25DaGFuZ2UiLCJjb250YWluZXIiLCJ0ZW1wQ2lyY2xlIiwiY3JlYXRlRWxlbWVudCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwidmFsdWVYIiwidmFsdWVZIiwidmFsdWUiLCJiYWNrZ3JvdW5kIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJMb2FkTmV3U291bmQiLCJwbGF5IiwibGlzdE9mUG9pbnQiLCJuYkNsb3Nlc3QiLCJjbG9zZXN0SWRzIiwiY3VycmVudENsb3Nlc3RJZCIsImoiLCJOb3RJbiIsIkRpc3RhbmNlIiwicG9pbnRJZCIsImxpc3RPZklkcyIsIml0ZXJhdG9yIiwicG9pbnRBIiwicG9pbnRCIiwic3FydCIsInBvdyIsInNvdW5kSWQiLCJnYWluSWQiLCJTb3VuZCIsImNyZWF0ZUJ1ZmZlclNvdXJjZSIsImxvb3AiLCJidWZmZXIiLCJjb25uZWN0IiwiZ2FpbiJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmltcG9ydCBNYXJrZXIgZnJvbSAnLi9NYXJrZXIuanMnO1xuLy8gaW1wb3J0IFNjZW5lIGZyb20gJ2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMvc2NlbmUuanNvbic7XG5cbi8vIGltcG9ydCBQb3NpdGlvbnMgZnJvbSAnLi9zY2VuZS5qc29uJ1xuLy8gaW1wb3J0IGZzNSBmcm9tIFwiZnNcIjtcbi8vIGltcG9ydCBKU09ONSBmcm9tICdqc29uNSc7XG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpO1xuICAgIHRoaXMuYW1iaXNvbmljcyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0pXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpKVxuICAgIC8vIGNvbnN0IHRyZWVzID0gdGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpO1xuICAgIC8vIGZvciAobGV0IG5hbWUgaW4gdHJlZXMpIHtcbiAgICAvLyAgIGNvbnN0IHRyZWUgPSB0cmVlW25hbWVdO1xuICAgIC8vICAgY29uc29sZS5sb2cobmFtZSwgdHJlZSk7XG4gICAgLy8gfVxuICAgIC8vIHRoaXMucGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpXG4gICAgLy8gdGhpcy5mcyA9IHRoaXMucmVxdWlyZSgnZnMnKVxuXG4vLyBjb25zdCBlbnZDb25maWdQYXRoID0gJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvYXNzZXRzL3NjZW5lLmpzb24nXG4vLyB2YXIgZW52Q29uZmlnID0gSlNPTjUucGFyc2UoZnMucmVhZEZpbGVTeW5jKGVudkNvbmZpZ1BhdGgsICd1dGYtOCcpKTtcbi8vIGNvbnNvbGUubG9nKGVudkNvbmZpZylcblxuXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH1cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdO1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTtcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7XG4gICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLnRydWVQb3NpdGlvbnMgPSBbXG4gICAgICBbMzEuMCwgNDEuNV0sXG4gICAgICBbMzEuMCwgMzkuMF0sXG4gICAgICBbMzEuMCwgMzYuMl0sXG4gICAgICBbMzQuNSwgMzYuMl0sXG4gICAgICBbMzYuOCwgMzYuMl0sXG4gICAgICBbMzYuOCwgMzMuNl0sXG4gICAgICBbMzQuNSwgMzMuNl0sXG4gICAgICBbMzEuMCwgMzMuNl0sXG4gICAgICBbMzEuMCwgMzEuMF0sXG4gICAgICBbMzQuNSwgMzEuMF0sXG4gICAgICBbMzQuNSwgMjguMF0sXG4gICAgICBbMzEuMCwgMjguMF0sXG4gICAgICBbMzEuMCwgMjUuOF0sXG4gICAgICBbMzQuNSwgMjUuOF0sXG4gICAgICBbMzYuOCwgMjUuOF0sXG4gICAgICBbMzYuOCwgMjMuNl0sXG4gICAgICBbMzQuNSwgMjMuNl0sXG4gICAgICBbMzEuMCwgMjMuNl0sXG4gICAgXVxuXG4gICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XG4gICAgdGhpcy5zb3VyY2VzQ29sb3IgPSBbXCJnb2xkXCIsIFwiZ3JlZW5cIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdO1xuXG4gICAgdGhpcy5hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgdGhpcy5wbGF5aW5nU291bmRzID0gW107XG4gICAgdGhpcy5nYWlucyA9IFtdO1xuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICB0aGlzLnNvdW5kQmFuayA9IGF3YWl0IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZCh7XG4gICAgfSwgdHJ1ZSk7XG5cbiAgICB0aGlzLmZhY3RvclggPSAyMDtcbiAgICB0aGlzLm9mZnNldFggPSAtNTAwO1xuICAgIHRoaXMuZmFjdG9yWSA9IDIwO1xuICAgIHRoaXMub2Zmc2V0WSA9IC0yMzY7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJQb3M7IGkrKykge1xuICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjEwMDAgLSA1MDApLCB5OiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkqNTAwKX0pO1xuICAgICAgLy8gdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogdGhpcy50cnVlUG9zaXRpb25zW2ldWzBdKnRoaXMuZmFjdG9yWCArIHRoaXMub2Zmc2V0WCwgeTp0aGlzLnRydWVQb3NpdGlvbnNbaV1bMV0qdGhpcy5mYWN0b3JZICsgdGhpcy5vZmZzZXRZfSk7XG4gICAgfVxuXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpXG5cbiAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJQb3M7IGkrKykge1xuICAgIC8vICAgdGhpcy5wbGF5aW5nU291bmRzLnB1c2godGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCkpO1xuICAgIC8vICAgdGhpcy5nYWlucy5wdXNoKHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKSk7XG5cbiAgICAvLyAgIHRoaXMuZ2FpbnNbaV0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLjUsIDApO1xuXG4gICAgLy8gICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uY29ubmVjdCh0aGlzLmdhaW5zW2ldKTtcbiAgICAvLyAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAvLyAgIHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuQ2xvc2VzdFBvaW50c0lkLCBpKTtcblxuICAgIC8vICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnBsYXkoKTtcbiAgICAvLyB9XG4gICAgLy8gJC5nZXQoXCJkYXRhLmpzb25cIiwgZnVuY3Rpb24oZGF0YSl7XG4gICAgLy8gY29uc29sZS5sb2coZGF0YSk7XG4gICAgLy8gfSk7XG5cblxuXG4gICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIC8vIHN1YnNjcmliZSB0byBkaXNwbGF5IGxvYWRpbmcgc3RhdGVcbiAgICB0aGlzLmZpbGVzeXN0ZW0uc3Vic2NyaWJlKCgpID0+IHRoaXMubG9hZFNvdW5kYmFuaygpKTtcblxuICAgIC8vIGluaXQgd2l0aCBjdXJyZW50IGNvbnRlbnRcbiAgICB0aGlzLmxvYWRTb3VuZGJhbmsoKTtcblxuICAgIC8vIHRoaXMuZnMgPSByZXF1aXJlKCdmaWxlLXN5c3RlbScpXG5cbiAgICBjb25zdCBUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCgnUG9zaXRpb24nKTsgLy8vLy8vLy8gw6dhIG1hcmNoZSBwYXMgKGltcG9zc2liaWxlIGQndXRpbGlzZXIgZnMsIG5lIHRyb3V2ZSBwYXMgbGUgcGF0aC4uLilcbiAgICAvLyBUcmVlLmNoaWxkcmVuLmZvckVhY2gobGVhZiA9PiB7XG4gICAgLy8gICAvLyBjb25zb2xlLmxvZyhsZWFmKVxuICAgIC8vICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKGxlYWYpXG4gICAgLy8gICAgIGlmIChsZWFmLmV4dGVuc2lvbiA9PT0gJy5qc29uJykge1xuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKGxlYWYudXJsKVxuICAgIC8vICAgICAgIGNvbnNvbGUubG9nKEpTT04ucGFyc2UoJy4vc2NlbmUuanNvbicpKVxuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT041LnBhcnNlKHRoaXMuZmlsZXN5c3RlbS5yZWFkRmlsZVN5bmMobGVhZi51cmwsICd1dGYtOCcpKSk7XG4gICAgLy8gICAgICAgLy8gbGV0IGEgPSByZXF1aXJlKGxlYWYucGF0aClcbiAgICAvLyAgICAgICBsZXQgYiA9IHJlcXVpcmUoJy4vc2NlbmUuanNvbicpXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYSk7XG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYik7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcblxuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5wb3NpdGlvbnMpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBsb2FkU291bmRiYW5rKCkge1xuICAgIGNvbnN0IHNvdW5kYmFua1RyZWUgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0KCdBdWRpb0ZpbGVzMCcpO1xuICAgIGNvbnN0IGRlZk9iaiA9IHt9O1xuICAgIGNvbnNvbGUubG9nKHNvdW5kYmFua1RyZWUpXG5cbiAgICBzb3VuZGJhbmtUcmVlLmNoaWxkcmVuLmZvckVhY2gobGVhZiA9PiB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhsZWFmKVxuICAgICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gICAgICAgIGRlZk9ialtsZWFmLm5hbWVdID0gbGVhZi51cmw7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmxvYWQoZGVmT2JqLCB0cnVlKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcblxuICAgICAgY29uc3QgbG9hZGluZyA9IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZ2V0KCdsb2FkaW5nJyk7XG4gICAgICBjb25zdCBkYXRhID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5kYXRhO1xuICAgICAgY29uc29sZS5sb2coZGF0YSlcblxuICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYW5nZVwiIGlkPVwicG9zaXRpb25JbnB1dDFcIiBtYXg9NTAwIG1pbj0tNTAwIHZhbHVlPTA+PC9pbnB1dD5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBpZD1cInBvc2l0aW9uSW5wdXQyXCIgbWF4PTUwMCBtaW49IDAgdmFsdWU9MD48L2lucHV0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAke3RoaXMubGlzdGVuZXJQb3NpdGlvbi54fVxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ3aWR0aDogNjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDE4MHB4OyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsaXN0ZW5lclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDE1cHg7IHdpZHRoOiAxNXB4OyBiYWNrZ3JvdW5kOiBibHVlOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnh9cHgsICR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnl9cHgpIHJvdGF0ZSg0NWRlZylcIlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cblxuLy88cD5hZGQgb3IgcmVtb3ZlIC53YXYgb3IgLm1wMyBmaWxlcyBpbiB0aGUgXCJzb3VuZGJhbmtcIiBkaXJlY3RvcnkgYW5kIG9ic2VydmUgdGhlIGNoYW5nZXM6PC9wPiR7T2JqZWN0LmtleXMoZGF0YSkubWFwKGtleSA9PiB7cmV0dXJuIGh0bWxgPHA+LSBcIiR7a2V5fVwiIGxvYWRlZDogJHtkYXRhW2tleV19LjwvcD5gO30pfVxuXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJykpXG5cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MVwiKTtcbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQyXCIpO1xuICAgICAgICAgIHBvc2l0aW9uSW5wdXQxLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgcG9zaXRpb25JbnB1dDIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIHZhciBzaG9vdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvb3RCdXR0b25cIik7XG4gICAgICAvLyBzaG9vdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgLy8gfSk7XG5cbiAgICAgIC8vIHZhciB5YXdTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlckF6aW1BaW1cIik7XG4gICAgICAvLyB5YXdTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcblxuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZChjb250YWluZXIpIHtcbiAgICB2YXIgdGVtcENpcmNsZVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRlbXBDaXJjbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHRlbXBDaXJjbGUuaWQgPSBcImNpcmNsZVwiICsgaTtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUgPSBcInBvc2l0aW9uOiBhYnNvbHV0ZTsgd2lkdGg6IDIwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czogMjBweDsgYmFja2dyb3VuZDogcmVkOyB0ZXh0LWFsaWduOiBjZW50ZXI7XCI7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgdGhpcy5wb3NpdGlvbnNbaV0ueCArIFwicHgsIFwiICsgdGhpcy5wb3NpdGlvbnNbaV0ueSArIFwicHgpXCI7XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcENpcmNsZSlcbiAgICB9XG4gIH1cblxuICBvblBvc2l0aW9uQ2hhbmdlKHZhbHVlWCwgdmFsdWVZKSB7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB2YWx1ZVgudmFsdWU7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB2YWx1ZVkudmFsdWU7XG5cbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkIC0gdGhpcy5DbG9zZXN0UG9pbnRzSWRcbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSAhPSB0aGlzLkNsb3Nlc3RQb2ludHNJZCkge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IHRoaXMuc291cmNlc0NvbG9yW2ldO1xuXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdG9wKCk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5kaXNjb25uZWN0KHRoaXMuZ2FpbnMoaSkpO1xuXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXSA9IG5ldyBMb2FkTmV3U291bmQodGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0sIGkpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0ucGxheSgpXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBDbG9zZXN0U291cmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50LCBuYkNsb3Nlc3QpIHtcbiAgICB2YXIgY2xvc2VzdElkcyA9IFtdO1xuICAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbmJDbG9zZXN0OyBqKyspIHtcbiAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSAwO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBsaXN0T2ZQb2ludC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5Ob3RJbihpLCBjbG9zZXN0SWRzKSAmJiB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2ldKSA8IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pKSB7XG4gICAgICAgICAgY3VycmVudENsb3Nlc3RJZCA9IGk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNsb3Nlc3RJZHMucHVzaChjdXJyZW50Q2xvc2VzdElkKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGNsb3Nlc3RJZHMpXG4gICAgfVxuICAgIHJldHVybiAoY2xvc2VzdElkcyk7XG4gIH1cblxuICBOb3RJbihwb2ludElkLCBsaXN0T2ZJZHMpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSAwO1xuICAgIHdoaWxlIChpdGVyYXRvciA8IGxpc3RPZklkcy5sZW5ndGggJiYgcG9pbnRJZCAhPSBsaXN0T2ZJZHNbaXRlcmF0b3JdKSB7XG4gICAgICBpdGVyYXRvciArPSAxO1xuICAgIH1cbiAgICByZXR1cm4oaXRlcmF0b3IgPj0gbGlzdE9mSWRzLmxlbmd0aCk7XG4gIH1cblxuICBEaXN0YW5jZShwb2ludEEsIHBvaW50Qikge1xuICAgIHJldHVybiAoTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50QS54IC0gcG9pbnRCLngsIDIpICsgTWF0aC5wb3cocG9pbnRBLnkgLSBwb2ludEIueSwgMikpKTtcbiAgfVxuXG4gIExvYWROZXdTb3VuZChzb3VuZElkLCBnYWluSWQpIHtcbiAgICAvLyBTb3VuZCBpbml0aWFsaXNhdGlvblxuICAgIHZhciBTb3VuZCA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpXG4gICAgU291bmQubG9vcCA9IHRydWU7XG4gICAgU291bmQuYnVmZmVyID0gdGhpcy5zb3VuZEJhbmtbc291bmRJZF07XG4gICAgU291bmQuY29ubmVjdCh0aGlzLmdhaW5bZ2FpbklkXSk7XG4gICAgcmV0dXJuIFNvdW5kO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7XG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7OztBQUNBO0FBRUE7QUFDQTtBQUNBO0FB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