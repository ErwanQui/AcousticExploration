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
    this.range;
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
        x: this.truePositions[i][0],
        y: this.truePositions[i][1]
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
      const data = this.audioBufferLoader.data; // console.log(data)

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
    this.Range(this.positions);
    console.log(this.range);

    for (let i = 0; i < this.positions.length; i++) {
      tempCircle = document.createElement('div');
      tempCircle.id = "circle" + i;
      tempCircle.style = "position: absolute; width: 20px; height: 20px; border-radius: 20px; background: red; text-align: center;";
      tempCircle.style.transform = "translate(" + (this.positions[i].x - this.range.moyX) * 500 / this.range.rangeX + "px, " + (this.positions[i].y - this.range.minY) * 500 / this.range.rangeY + "px)";
      container.appendChild(tempCircle);
    }
  }

  Range(positions) {
    this.range = {
      minX: positions[0].x,
      maxX: positions[0].x,
      // moyX: null,
      // rangeX: null,
      minY: positions[0].y,
      maxY: positions[0].y // moyY: null,
      // rangeY: null

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

  onPositionChange(valueX, valueY) {
    console.log("oui");
    this.listenerPosition.x = valueX.value;
    this.listenerPosition.y = valueY.value;
    this.previousClosestPointsId = this.ClosestPointsId;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);

    for (let i = 0; i < this.nbClosestPoints; i++) {
      console.log("non");

      if (this.previousClosestPointsId[i] != this.ClosestPointsId) {
        document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "red";
        document.getElementById("circle" + this.ClosestPointsId[i]).style.background = this.sourcesColor[i]; // this.playingSounds[i].stop();
        // this.playingSounds[i].disconnect(this.gains(i));
        // this.playingSounds[i] = new LoadNewSound(this.ClosestPointsId[i], i);
        // this.playingSounds[i].play()
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsImxpc3RlbmVyUG9zaXRpb24iLCJ4IiwieSIsIkNsb3Nlc3RQb2ludHNJZCIsInByZXZpb3VzQ2xvc2VzdFBvaW50c0lkIiwibmJDbG9zZXN0UG9pbnRzIiwicG9zaXRpb25zIiwidHJ1ZVBvc2l0aW9ucyIsIm5iUG9zIiwibGVuZ3RoIiwicmFuZ2UiLCJzb3VyY2VzQ29sb3IiLCJhdWRpb0NvbnRleHQiLCJBdWRpb0NvbnRleHQiLCJwbGF5aW5nU291bmRzIiwiZ2FpbnMiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsInNvdW5kQmFuayIsImxvYWQiLCJmYWN0b3JYIiwib2Zmc2V0WCIsImZhY3RvclkiLCJvZmZzZXRZIiwiaSIsInB1c2giLCJDbG9zZXN0U291cmNlIiwic3Vic2NyaWJlIiwicmVuZGVyIiwibG9hZFNvdW5kYmFuayIsIlRyZWUiLCJnZXQiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwic291bmRiYW5rVHJlZSIsImRlZk9iaiIsImNvbnNvbGUiLCJsb2ciLCJjaGlsZHJlbiIsImZvckVhY2giLCJsZWFmIiwidHlwZSIsIm5hbWUiLCJ1cmwiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImxvYWRpbmciLCJkYXRhIiwiaHRtbCIsImlkIiwiYmVnaW5CdXR0b24iLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbklucHV0MSIsInBvc2l0aW9uSW5wdXQyIiwib25Qb3NpdGlvbkNoYW5nZSIsImNvbnRhaW5lciIsInRlbXBDaXJjbGUiLCJSYW5nZSIsImNyZWF0ZUVsZW1lbnQiLCJ0cmFuc2Zvcm0iLCJtb3lYIiwicmFuZ2VYIiwibWluWSIsInJhbmdlWSIsImFwcGVuZENoaWxkIiwibWluWCIsIm1heFgiLCJtYXhZIiwibW95WSIsInZhbHVlWCIsInZhbHVlWSIsInZhbHVlIiwiYmFja2dyb3VuZCIsImxpc3RPZlBvaW50IiwibmJDbG9zZXN0IiwiY2xvc2VzdElkcyIsImN1cnJlbnRDbG9zZXN0SWQiLCJqIiwiTm90SW4iLCJEaXN0YW5jZSIsInBvaW50SWQiLCJsaXN0T2ZJZHMiLCJpdGVyYXRvciIsInBvaW50QSIsInBvaW50QiIsIk1hdGgiLCJzcXJ0IiwicG93IiwiTG9hZE5ld1NvdW5kIiwic291bmRJZCIsImdhaW5JZCIsIlNvdW5kIiwiY3JlYXRlQnVmZmVyU291cmNlIiwibG9vcCIsImJ1ZmZlciIsImNvbm5lY3QiLCJnYWluIl0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XHJcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcclxuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XHJcblxyXG5pbXBvcnQgTWFya2VyIGZyb20gJy4vTWFya2VyLmpzJztcclxuLy8gaW1wb3J0IFNjZW5lIGZyb20gJ2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMvc2NlbmUuanNvbic7XHJcblxyXG4vLyBpbXBvcnQgUG9zaXRpb25zIGZyb20gJy4vc2NlbmUuanNvbidcclxuLy8gaW1wb3J0IGZzNSBmcm9tIFwiZnNcIjtcclxuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcclxuXHJcbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xyXG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcclxuICAgIHN1cGVyKGNsaWVudCk7XHJcblxyXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XHJcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xyXG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XHJcblxyXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxyXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpO1xyXG4gICAgdGhpcy5hbWJpc29uaWNzID0gcmVxdWlyZSgnYW1iaXNvbmljcycpO1xyXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7XHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0pXHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCkpXHJcbiAgICAvLyBjb25zdCB0cmVlcyA9IHRoaXMuZmlsZXN5c3RlbS5nZXRWYWx1ZXMoKTtcclxuICAgIC8vIGZvciAobGV0IG5hbWUgaW4gdHJlZXMpIHtcclxuICAgIC8vICAgY29uc3QgdHJlZSA9IHRyZWVbbmFtZV07XHJcbiAgICAvLyAgIGNvbnNvbGUubG9nKG5hbWUsIHRyZWUpO1xyXG4gICAgLy8gfVxyXG4gICAgLy8gdGhpcy5wYXRoID0gcmVxdWlyZShcInBhdGhcIilcclxuICAgIC8vIHRoaXMuZnMgPSB0aGlzLnJlcXVpcmUoJ2ZzJylcclxuXHJcbi8vIGNvbnN0IGVudkNvbmZpZ1BhdGggPSAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMvc2NlbmUuanNvbidcclxuLy8gdmFyIGVudkNvbmZpZyA9IEpTT041LnBhcnNlKGZzLnJlYWRGaWxlU3luYyhlbnZDb25maWdQYXRoLCAndXRmLTgnKSk7XHJcbi8vIGNvbnNvbGUubG9nKGVudkNvbmZpZylcclxuXHJcblxyXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xyXG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uID0ge1xyXG4gICAgICB4OiAwLFxyXG4gICAgICB5OiAwLFxyXG4gICAgfVxyXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSBbXTtcclxuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTtcclxuICAgIHRoaXMubmJDbG9zZXN0UG9pbnRzID0gNDtcclxuICAgIHRoaXMucG9zaXRpb25zID0gW107XHJcbiAgICB0aGlzLnRydWVQb3NpdGlvbnMgPSBbXHJcbiAgICAgIFszMS4wLCA0MS41XSxcclxuICAgICAgWzMxLjAsIDM5LjBdLFxyXG4gICAgICBbMzEuMCwgMzYuMl0sXHJcbiAgICAgIFszNC41LCAzNi4yXSxcclxuICAgICAgWzM2LjgsIDM2LjJdLFxyXG4gICAgICBbMzYuOCwgMzMuNl0sXHJcbiAgICAgIFszNC41LCAzMy42XSxcclxuICAgICAgWzMxLjAsIDMzLjZdLFxyXG4gICAgICBbMzEuMCwgMzEuMF0sXHJcbiAgICAgIFszNC41LCAzMS4wXSxcclxuICAgICAgWzM0LjUsIDI4LjBdLFxyXG4gICAgICBbMzEuMCwgMjguMF0sXHJcbiAgICAgIFszMS4wLCAyNS44XSxcclxuICAgICAgWzM0LjUsIDI1LjhdLFxyXG4gICAgICBbMzYuOCwgMjUuOF0sXHJcbiAgICAgIFszNi44LCAyMy42XSxcclxuICAgICAgWzM0LjUsIDIzLjZdLFxyXG4gICAgICBbMzEuMCwgMjMuNl0sXHJcbiAgICBdXHJcblxyXG4gICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XHJcbiAgICB0aGlzLnJhbmdlO1xyXG4gICAgdGhpcy5zb3VyY2VzQ29sb3IgPSBbXCJnb2xkXCIsIFwiZ3JlZW5cIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdO1xyXG5cclxuICAgIHRoaXMuYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgdGhpcy5wbGF5aW5nU291bmRzID0gW107XHJcbiAgICB0aGlzLmdhaW5zID0gW107XHJcblxyXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHN0YXJ0KCkge1xyXG4gICAgc3VwZXIuc3RhcnQoKTtcclxuXHJcbiAgICB0aGlzLnNvdW5kQmFuayA9IGF3YWl0IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZCh7XHJcbiAgICB9LCB0cnVlKTtcclxuXHJcbiAgICB0aGlzLmZhY3RvclggPSAyMDtcclxuICAgIHRoaXMub2Zmc2V0WCA9IC01MDA7XHJcbiAgICB0aGlzLmZhY3RvclkgPSAyMDtcclxuICAgIHRoaXMub2Zmc2V0WSA9IC0yMzY7XHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcclxuICAgICAgLy8gdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjEwMDAgLSA1MDApLCB5OiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkqNTAwKX0pO1xyXG4gICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKHt4OiB0aGlzLnRydWVQb3NpdGlvbnNbaV1bMF0sIHk6dGhpcy50cnVlUG9zaXRpb25zW2ldWzFdfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpXHJcblxyXG4gICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcclxuICAgIC8vICAgdGhpcy5wbGF5aW5nU291bmRzLnB1c2godGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCkpO1xyXG4gICAgLy8gICB0aGlzLmdhaW5zLnB1c2godGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpKTtcclxuXHJcbiAgICAvLyAgIHRoaXMuZ2FpbnNbaV0uZ2Fpbi5zZXRWYWx1ZUF0VGltZSgwLjUsIDApO1xyXG5cclxuICAgIC8vICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLmNvbm5lY3QodGhpcy5nYWluc1tpXSk7XHJcbiAgICAvLyAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XHJcblxyXG4gICAgLy8gICB0aGlzLkxvYWROZXdTb3VuZCh0aGlzLkNsb3Nlc3RQb2ludHNJZCwgaSk7XHJcblxyXG4gICAgLy8gICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0ucGxheSgpO1xyXG4gICAgLy8gfVxyXG4gICAgLy8gJC5nZXQoXCJkYXRhLmpzb25cIiwgZnVuY3Rpb24oZGF0YSl7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgIC8vIH0pO1xyXG5cclxuXHJcblxyXG4gICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxyXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW5kZXIoKSk7XHJcbiAgICAvLyBzdWJzY3JpYmUgdG8gZGlzcGxheSBsb2FkaW5nIHN0YXRlXHJcbiAgICB0aGlzLmZpbGVzeXN0ZW0uc3Vic2NyaWJlKCgpID0+IHRoaXMubG9hZFNvdW5kYmFuaygpKTtcclxuXHJcbiAgICAvLyBpbml0IHdpdGggY3VycmVudCBjb250ZW50XHJcbiAgICB0aGlzLmxvYWRTb3VuZGJhbmsoKTtcclxuXHJcbiAgICAvLyB0aGlzLmZzID0gcmVxdWlyZSgnZmlsZS1zeXN0ZW0nKVxyXG5cclxuICAgIGNvbnN0IFRyZWUgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0KCdQb3NpdGlvbicpOyAvLy8vLy8vLyDDp2EgbWFyY2hlIHBhcyAoaW1wb3NzaWJpbGUgZCd1dGlsaXNlciBmcywgbmUgdHJvdXZlIHBhcyBsZSBwYXRoLi4uKVxyXG4gICAgLy8gVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xyXG4gICAgLy8gICAvLyBjb25zb2xlLmxvZyhsZWFmKVxyXG4gICAgLy8gICBpZiAobGVhZi50eXBlID09PSAnZmlsZScpIHtcclxuICAgIC8vICAgICBjb25zb2xlLmxvZyhsZWFmKVxyXG4gICAgLy8gICAgIGlmIChsZWFmLmV4dGVuc2lvbiA9PT0gJy5qc29uJykge1xyXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2cobGVhZi51cmwpXHJcbiAgICAvLyAgICAgICBjb25zb2xlLmxvZyhKU09OLnBhcnNlKCcuL3NjZW5lLmpzb24nKSlcclxuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT041LnBhcnNlKHRoaXMuZmlsZXN5c3RlbS5yZWFkRmlsZVN5bmMobGVhZi51cmwsICd1dGYtOCcpKSk7XHJcbiAgICAvLyAgICAgICAvLyBsZXQgYSA9IHJlcXVpcmUobGVhZi5wYXRoKVxyXG4gICAgLy8gICAgICAgbGV0IGIgPSByZXF1aXJlKCcuL3NjZW5lLmpzb24nKVxyXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYSk7XHJcbiAgICAvLyAgICAgICAvLyBjb25zb2xlLmxvZyhiKTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyAgIH1cclxuICAgIC8vIH0pO1xyXG5cclxuXHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBvc2l0aW9ucylcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB0aGlzLnJlbmRlcigpKTtcclxuICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgfVxyXG5cclxuICBsb2FkU291bmRiYW5rKCkge1xyXG4gICAgY29uc3Qgc291bmRiYW5rVHJlZSA9IHRoaXMuZmlsZXN5c3RlbS5nZXQoJ0F1ZGlvRmlsZXMwJyk7XHJcbiAgICBjb25zdCBkZWZPYmogPSB7fTtcclxuICAgIGNvbnNvbGUubG9nKHNvdW5kYmFua1RyZWUpXHJcblxyXG4gICAgc291bmRiYW5rVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhsZWFmKVxyXG4gICAgICBpZiAobGVhZi50eXBlID09PSAnZmlsZScpIHtcclxuICAgICAgICBkZWZPYmpbbGVhZi5uYW1lXSA9IGxlYWYudXJsO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmxvYWQoZGVmT2JqLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIHJlbmRlcigpIHtcclxuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXHJcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XHJcblxyXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG5cclxuICAgICAgY29uc3QgbG9hZGluZyA9IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZ2V0KCdsb2FkaW5nJyk7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGE7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpXHJcblxyXG4gICAgICByZW5kZXIoaHRtbGBcclxuICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxyXG4gICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XHJcbiAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MVwiIG1heD01MDAgbWluPS01MDAgdmFsdWU9MD48L2lucHV0PlxyXG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MlwiIG1heD01MDAgbWluPSAwIHZhbHVlPTA+PC9pbnB1dD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH1cclxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwid2lkdGg6IDYwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAxODBweDsgbGVmdDogNTAlXCI+XHJcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsaXN0ZW5lclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDE1cHg7IHdpZHRoOiAxNXB4OyBiYWNrZ3JvdW5kOiBibHVlOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnh9cHgsICR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnl9cHgpIHJvdGF0ZSg0NWRlZylcIlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XHJcblxyXG5cclxuLy88cD5hZGQgb3IgcmVtb3ZlIC53YXYgb3IgLm1wMyBmaWxlcyBpbiB0aGUgXCJzb3VuZGJhbmtcIiBkaXJlY3RvcnkgYW5kIG9ic2VydmUgdGhlIGNoYW5nZXM6PC9wPiR7T2JqZWN0LmtleXMoZGF0YSkubWFwKGtleSA9PiB7cmV0dXJuIGh0bWxgPHA+LSBcIiR7a2V5fVwiIGxvYWRlZDogJHtkYXRhW2tleV19LjwvcD5gO30pfVxyXG5cclxuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XHJcbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXHJcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcclxuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJykpXHJcblxyXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcclxuXHJcbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQxXCIpO1xyXG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MlwiKTtcclxuICAgICAgICAgIHBvc2l0aW9uSW5wdXQxLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgcG9zaXRpb25JbnB1dDIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm9uUG9zaXRpb25DaGFuZ2UocG9zaXRpb25JbnB1dDEsIHBvc2l0aW9uSW5wdXQyKTtcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gdmFyIHNob290QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG9vdEJ1dHRvblwiKTtcclxuICAgICAgLy8gc2hvb3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgLy8gfSk7XHJcblxyXG4gICAgICAvLyB2YXIgeWF3U2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZXJBemltQWltXCIpO1xyXG4gICAgICAvLyB5YXdTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcclxuXHJcbiAgICAgIC8vIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZChjb250YWluZXIpIHtcclxuICAgIHZhciB0ZW1wQ2lyY2xlXHJcbiAgICB0aGlzLlJhbmdlKHRoaXMucG9zaXRpb25zKTtcclxuICAgIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UpO1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB0ZW1wQ2lyY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgIHRlbXBDaXJjbGUuaWQgPSBcImNpcmNsZVwiICsgaTtcclxuICAgICAgdGVtcENpcmNsZS5zdHlsZSA9IFwicG9zaXRpb246IGFic29sdXRlOyB3aWR0aDogMjBweDsgaGVpZ2h0OiAyMHB4OyBib3JkZXItcmFkaXVzOiAyMHB4OyBiYWNrZ3JvdW5kOiByZWQ7IHRleHQtYWxpZ246IGNlbnRlcjtcIjtcclxuICAgICAgdGVtcENpcmNsZS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueCAtIHRoaXMucmFuZ2UubW95WCkqNTAwL3RoaXMucmFuZ2UucmFuZ2VYKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSo1MDAvdGhpcy5yYW5nZS5yYW5nZVkpICsgXCJweClcIjtcclxuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBDaXJjbGUpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBSYW5nZShwb3NpdGlvbnMpIHtcclxuICAgIHRoaXMucmFuZ2UgPSB7XHJcbiAgICAgIG1pblg6IHBvc2l0aW9uc1swXS54LFxyXG4gICAgICBtYXhYOiBwb3NpdGlvbnNbMF0ueCwgXHJcbiAgICAgIC8vIG1veVg6IG51bGwsXHJcbiAgICAgIC8vIHJhbmdlWDogbnVsbCxcclxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxyXG4gICAgICBtYXhZOiBwb3NpdGlvbnNbMF0ueSxcclxuICAgICAgLy8gbW95WTogbnVsbCxcclxuICAgICAgLy8gcmFuZ2VZOiBudWxsXHJcbiAgICB9O1xyXG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5taW5YID0gcG9zaXRpb25zW2ldLng7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhYID0gcG9zaXRpb25zW2ldLng7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5taW5ZID0gcG9zaXRpb25zW2ldLnk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XHJcbiAgICAgICAgdGhpcy5yYW5nZS5tYXhZID0gcG9zaXRpb25zW2ldLnk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMucmFuZ2UubW95WCA9ICh0aGlzLnJhbmdlLm1heFggKyB0aGlzLnJhbmdlLm1pblgpLzJcclxuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzJcclxuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xyXG4gICAgdGhpcy5yYW5nZS5yYW5nZVkgPSB0aGlzLnJhbmdlLm1heFkgLSB0aGlzLnJhbmdlLm1pblk7XHJcbiAgfVxyXG5cclxuICBvblBvc2l0aW9uQ2hhbmdlKHZhbHVlWCwgdmFsdWVZKSB7XHJcbiAgICBjb25zb2xlLmxvZyhcIm91aVwiKVxyXG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB2YWx1ZVgudmFsdWU7XHJcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHZhbHVlWS52YWx1ZTtcclxuXHJcbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0UG9pbnRzSWRcclxuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMsIHRoaXMubmJDbG9zZXN0UG9pbnRzKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzOyBpKyspIHtcclxuICAgICAgY29uc29sZS5sb2coXCJub25cIilcclxuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWQpIHtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMuQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5zb3VyY2VzQ29sb3JbaV07XHJcblxyXG4gICAgICAgIC8vIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdG9wKCk7XHJcbiAgICAgICAgLy8gdGhpcy5wbGF5aW5nU291bmRzW2ldLmRpc2Nvbm5lY3QodGhpcy5nYWlucyhpKSk7XHJcblxyXG4gICAgICAgIC8vIHRoaXMucGxheWluZ1NvdW5kc1tpXSA9IG5ldyBMb2FkTmV3U291bmQodGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0sIGkpO1xyXG4gICAgICAgIC8vIHRoaXMucGxheWluZ1NvdW5kc1tpXS5wbGF5KClcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5yZW5kZXIoKTtcclxuICB9XHJcblxyXG4gIENsb3Nlc3RTb3VyY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnQsIG5iQ2xvc2VzdCkge1xyXG4gICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcclxuICAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuYkNsb3Nlc3Q7IGorKykge1xyXG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gMDtcclxuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBsaXN0T2ZQb2ludC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmICh0aGlzLk5vdEluKGksIGNsb3Nlc3RJZHMpICYmIHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbaV0pIDwgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSkpIHtcclxuICAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGNsb3Nlc3RJZHMpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gKGNsb3Nlc3RJZHMpO1xyXG4gIH1cclxuXHJcbiAgTm90SW4ocG9pbnRJZCwgbGlzdE9mSWRzKSB7XHJcbiAgICB2YXIgaXRlcmF0b3IgPSAwO1xyXG4gICAgd2hpbGUgKGl0ZXJhdG9yIDwgbGlzdE9mSWRzLmxlbmd0aCAmJiBwb2ludElkICE9IGxpc3RPZklkc1tpdGVyYXRvcl0pIHtcclxuICAgICAgaXRlcmF0b3IgKz0gMTtcclxuICAgIH1cclxuICAgIHJldHVybihpdGVyYXRvciA+PSBsaXN0T2ZJZHMubGVuZ3RoKTtcclxuICB9XHJcblxyXG4gIERpc3RhbmNlKHBvaW50QSwgcG9pbnRCKSB7XHJcbiAgICByZXR1cm4gKE1hdGguc3FydChNYXRoLnBvdyhwb2ludEEueCAtIHBvaW50Qi54LCAyKSArIE1hdGgucG93KHBvaW50QS55IC0gcG9pbnRCLnksIDIpKSk7XHJcbiAgfVxyXG5cclxuICBMb2FkTmV3U291bmQoc291bmRJZCwgZ2FpbklkKSB7XHJcbiAgICAvLyBTb3VuZCBpbml0aWFsaXNhdGlvblxyXG4gICAgdmFyIFNvdW5kID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKClcclxuICAgIFNvdW5kLmxvb3AgPSB0cnVlO1xyXG4gICAgU291bmQuYnVmZmVyID0gdGhpcy5zb3VuZEJhbmtbc291bmRJZF07XHJcbiAgICBTb3VuZC5jb25uZWN0KHRoaXMuZ2FpbltnYWluSWRdKTtcclxuICAgIHJldHVybiBTb3VuZDtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVuY2U7XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztB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