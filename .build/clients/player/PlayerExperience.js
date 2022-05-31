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
    this.pixelScale = 200;
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

    for (let i = 0; i < this.nbPos; i++) {
      // this.positions.push({x: Math.round(Math.random()*1000 - 500), y: Math.round(Math.random()*500)});
      this.positions.push({
        x: this.truePositions[i][0],
        y: this.truePositions[i][1]
      });
    }

    this.Range(this.positions);
    this.listenerPosition.x = this.range.moyX;
    this.listenerPosition.y = this.range.minY;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);

    for (let i = 0; i < this.nbClosestPoints; i++) {
      this.gains.push(await this.audioContext.createGain()); // console.log(this.gains)

      this.playingSounds.push(this.LoadNewSound(this.audioContext, this.soundBank[this.ClosestPointsId[i]], this.gains[i]));
      this.gains[i].connect(this.audioContext.destination);
      this.gains[i].gain.setValueAtTime(0.5, 0);
      this.playingSounds[i].start();
    } // $.get("data.json", function(data){
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
            <input type="range" id="positionInput1" step=0.1 max=${this.range.maxX} min=${this.range.minX} value=${this.listenerPosition.x}></input>
            <input type="range" id="positionInput2" step=0.1 max=${this.range.maxY} min=${this.range.minY} value=${this.listenerPosition.y}></input>
          </div>
          <div>
            ${this.listenerPosition.x}
            ${this.listenerPosition.y}
          </div>
          <div id="circleContainer" style="width: 600px; text-align: center; position: absolute; top: 180px; left: 50%">
            <div id="listener" style="position: absolute; height: 15px; width: 15px; background: blue; text-align: center; transform: 
            translate(${(this.listenerPosition.x - this.range.moyX) * 2 * this.pixelScale / this.range.rangeX}px, ${(this.listenerPosition.y - this.range.minY) * this.pixelScale / this.range.rangeY}px) rotate(45deg)"
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
    this.audioContext.resume(); // console.log(this.range);

    for (let i = 0; i < this.positions.length; i++) {
      tempCircle = document.createElement('div');
      tempCircle.id = "circle" + i;
      tempCircle.style = "position: absolute; width: 20px; height: 20px; border-radius: 20px; background: red; text-align: center;";
      tempCircle.style.transform = "translate(" + (this.positions[i].x - this.range.moyX) * this.pixelScale * 2 / this.range.rangeX + "px, " + (this.positions[i].y - this.range.minY) * this.pixelScale / this.range.rangeY + "px)";
      tempCircle.label = i;
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
    // console.log("oui")
    this.listenerPosition.x = valueX.value;
    this.listenerPosition.y = valueY.value;
    this.previousClosestPointsId = this.ClosestPointsId;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);
    console.log(this.ClosestPointsId);

    for (let i = 0; i < this.nbClosestPoints; i++) {
      // console.log("non")
      if (this.previousClosestPointsId[i] != this.ClosestPointsId[i]) {
        if (this.NotIn(this.previousClosestPointsId[i], this.ClosestPointsId)) {
          document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "red";
        }

        document.getElementById("circle" + this.ClosestPointsId[i]).style.background = this.sourcesColor[i];
        this.playingSounds[i].stop();
        this.playingSounds[i].disconnect(this.gains[i]);
        this.playingSounds[i] = new this.LoadNewSound(this.audioContext, this.soundBank[this.ClosestPointsId[i]], this.gains[i]);
        this.playingSounds[i].start();
        console.log(this.playingSounds[i]);
      }
    }

    this.render();
  }

  ClosestSource(listenerPosition, listOfPoint, nbClosest) {
    var closestIds = [];
    var currentClosestId;

    for (let j = 0; j < nbClosest; j++) {
      currentClosestId = undefined;

      for (let i = 0; i < listOfPoint.length; i++) {
        // console.log(listOfPoint[currentClosestId])
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
    // console.log(pointA)
    // console.log(pointB)
    // if (pointB = undefined) {
    //   return 0;
    // }
    if (pointB != undefined) {
      return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
    } else {
      return Infinity;
    }
  }

  LoadNewSound(audioContext, sound, gain) {
    // Sound initialisation
    // console.log(audioContext)
    var Sound = audioContext.createBufferSource();
    Sound.loop = true;
    Sound.buffer = sound;
    Sound.connect(gain);
    return Sound;
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsInBpeGVsU2NhbGUiLCJsaXN0ZW5lclBvc2l0aW9uIiwieCIsInkiLCJDbG9zZXN0UG9pbnRzSWQiLCJwcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCIsIm5iQ2xvc2VzdFBvaW50cyIsInBvc2l0aW9ucyIsInRydWVQb3NpdGlvbnMiLCJuYlBvcyIsImxlbmd0aCIsInJhbmdlIiwic291cmNlc0NvbG9yIiwiYXVkaW9Db250ZXh0IiwiQXVkaW9Db250ZXh0IiwicGxheWluZ1NvdW5kcyIsImdhaW5zIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJzb3VuZEJhbmsiLCJsb2FkIiwiaSIsInB1c2giLCJSYW5nZSIsIm1veVgiLCJtaW5ZIiwiQ2xvc2VzdFNvdXJjZSIsImNyZWF0ZUdhaW4iLCJMb2FkTmV3U291bmQiLCJjb25uZWN0IiwiZGVzdGluYXRpb24iLCJnYWluIiwic2V0VmFsdWVBdFRpbWUiLCJzdWJzY3JpYmUiLCJyZW5kZXIiLCJsb2FkU291bmRiYW5rIiwiVHJlZSIsImdldCIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJzb3VuZGJhbmtUcmVlIiwiZGVmT2JqIiwiY29uc29sZSIsImxvZyIsImNoaWxkcmVuIiwiZm9yRWFjaCIsImxlYWYiLCJ0eXBlIiwibmFtZSIsInVybCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwibG9hZGluZyIsImRhdGEiLCJodG1sIiwiaWQiLCJtYXhYIiwibWluWCIsIm1heFkiLCJyYW5nZVgiLCJyYW5nZVkiLCJiZWdpbkJ1dHRvbiIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uSW5wdXQxIiwicG9zaXRpb25JbnB1dDIiLCJvblBvc2l0aW9uQ2hhbmdlIiwiY29udGFpbmVyIiwidGVtcENpcmNsZSIsInJlc3VtZSIsImNyZWF0ZUVsZW1lbnQiLCJ0cmFuc2Zvcm0iLCJsYWJlbCIsImFwcGVuZENoaWxkIiwibW95WSIsInZhbHVlWCIsInZhbHVlWSIsInZhbHVlIiwiTm90SW4iLCJiYWNrZ3JvdW5kIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJsaXN0T2ZQb2ludCIsIm5iQ2xvc2VzdCIsImNsb3Nlc3RJZHMiLCJjdXJyZW50Q2xvc2VzdElkIiwiaiIsInVuZGVmaW5lZCIsIkRpc3RhbmNlIiwicG9pbnRJZCIsImxpc3RPZklkcyIsIml0ZXJhdG9yIiwicG9pbnRBIiwicG9pbnRCIiwiTWF0aCIsInNxcnQiLCJwb3ciLCJJbmZpbml0eSIsInNvdW5kIiwiU291bmQiLCJjcmVhdGVCdWZmZXJTb3VyY2UiLCJsb29wIiwiYnVmZmVyIl0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XHJcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcclxuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XHJcblxyXG5pbXBvcnQgTWFya2VyIGZyb20gJy4vTWFya2VyLmpzJztcclxuLy8gaW1wb3J0IFNjZW5lIGZyb20gJ2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMvc2NlbmUuanNvbic7XHJcblxyXG4vLyBpbXBvcnQgUG9zaXRpb25zIGZyb20gJy4vc2NlbmUuanNvbidcclxuLy8gaW1wb3J0IGZzNSBmcm9tIFwiZnNcIjtcclxuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcclxuXHJcbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xyXG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcclxuICAgIHN1cGVyKGNsaWVudCk7XHJcblxyXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XHJcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xyXG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XHJcblxyXG4gICAgLy8gUmVxdWlyZSBwbHVnaW5zIGlmIG5lZWRlZFxyXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpO1xyXG4gICAgdGhpcy5hbWJpc29uaWNzID0gcmVxdWlyZSgnYW1iaXNvbmljcycpO1xyXG4gICAgdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7XHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0pXHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCkpXHJcbiAgICAvLyBjb25zdCB0cmVlcyA9IHRoaXMuZmlsZXN5c3RlbS5nZXRWYWx1ZXMoKTtcclxuICAgIC8vIGZvciAobGV0IG5hbWUgaW4gdHJlZXMpIHtcclxuICAgIC8vICAgY29uc3QgdHJlZSA9IHRyZWVbbmFtZV07XHJcbiAgICAvLyAgIGNvbnNvbGUubG9nKG5hbWUsIHRyZWUpO1xyXG4gICAgLy8gfVxyXG4gICAgLy8gdGhpcy5wYXRoID0gcmVxdWlyZShcInBhdGhcIilcclxuICAgIC8vIHRoaXMuZnMgPSB0aGlzLnJlcXVpcmUoJ2ZzJylcclxuXHJcbi8vIGNvbnN0IGVudkNvbmZpZ1BhdGggPSAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMvc2NlbmUuanNvbidcclxuLy8gdmFyIGVudkNvbmZpZyA9IEpTT041LnBhcnNlKGZzLnJlYWRGaWxlU3luYyhlbnZDb25maWdQYXRoLCAndXRmLTgnKSk7XHJcbi8vIGNvbnNvbGUubG9nKGVudkNvbmZpZylcclxuXHJcblxyXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xyXG4gICAgdGhpcy5waXhlbFNjYWxlID0gMjAwO1xyXG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uID0ge1xyXG4gICAgICB4OiAwLFxyXG4gICAgICB5OiAwLFxyXG4gICAgfVxyXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSBbXTtcclxuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTtcclxuICAgIHRoaXMubmJDbG9zZXN0UG9pbnRzID0gNDtcclxuICAgIHRoaXMucG9zaXRpb25zID0gW107XHJcbiAgICB0aGlzLnRydWVQb3NpdGlvbnMgPSBbXHJcbiAgICAgIFszMS4wLCA0MS41XSxcclxuICAgICAgWzMxLjAsIDM5LjBdLFxyXG4gICAgICBbMzEuMCwgMzYuMl0sXHJcbiAgICAgIFszNC41LCAzNi4yXSxcclxuICAgICAgWzM2LjgsIDM2LjJdLFxyXG4gICAgICBbMzYuOCwgMzMuNl0sXHJcbiAgICAgIFszNC41LCAzMy42XSxcclxuICAgICAgWzMxLjAsIDMzLjZdLFxyXG4gICAgICBbMzEuMCwgMzEuMF0sXHJcbiAgICAgIFszNC41LCAzMS4wXSxcclxuICAgICAgWzM0LjUsIDI4LjBdLFxyXG4gICAgICBbMzEuMCwgMjguMF0sXHJcbiAgICAgIFszMS4wLCAyNS44XSxcclxuICAgICAgWzM0LjUsIDI1LjhdLFxyXG4gICAgICBbMzYuOCwgMjUuOF0sXHJcbiAgICAgIFszNi44LCAyMy42XSxcclxuICAgICAgWzM0LjUsIDIzLjZdLFxyXG4gICAgICBbMzEuMCwgMjMuNl0sXHJcbiAgICBdXHJcblxyXG4gICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XHJcbiAgICB0aGlzLnJhbmdlO1xyXG4gICAgdGhpcy5zb3VyY2VzQ29sb3IgPSBbXCJnb2xkXCIsIFwiZ3JlZW5cIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdO1xyXG5cclxuICAgIHRoaXMuYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgdGhpcy5wbGF5aW5nU291bmRzID0gW107XHJcbiAgICB0aGlzLmdhaW5zID0gW107XHJcblxyXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIHN0YXJ0KCkge1xyXG4gICAgc3VwZXIuc3RhcnQoKTtcclxuXHJcbiAgICB0aGlzLnNvdW5kQmFuayA9IGF3YWl0IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZCh7XHJcbiAgICB9LCB0cnVlKTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJQb3M7IGkrKykge1xyXG4gICAgICAvLyB0aGlzLnBvc2l0aW9ucy5wdXNoKHt4OiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkqMTAwMCAtIDUwMCksIHk6IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSo1MDApfSk7XHJcbiAgICAgIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IHRoaXMudHJ1ZVBvc2l0aW9uc1tpXVswXSwgeTp0aGlzLnRydWVQb3NpdGlvbnNbaV1bMV19KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLlJhbmdlKHRoaXMucG9zaXRpb25zKTtcclxuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdGhpcy5yYW5nZS5tb3lYO1xyXG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB0aGlzLnJhbmdlLm1pblk7XHJcblxyXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpXHJcblxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XHJcbiAgICAgIHRoaXMuZ2FpbnMucHVzaChhd2FpdCB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCkpO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmdhaW5zKVxyXG4gICAgICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQ29udGV4dCwgdGhpcy5zb3VuZEJhbmtbdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV1dLCB0aGlzLmdhaW5zW2ldKSk7XHJcbiAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XHJcblxyXG5cclxuICAgICAgdGhpcy5nYWluc1tpXS5nYWluLnNldFZhbHVlQXRUaW1lKDAuNSwgMCk7XHJcblxyXG4gICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RhcnQoKTtcclxuICAgIH1cclxuICAgIC8vICQuZ2V0KFwiZGF0YS5qc29uXCIsIGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgLy8gY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAvLyB9KTtcclxuXHJcblxyXG5cclxuICAgIC8vIHN1YnNjcmliZSB0byBkaXNwbGF5IGxvYWRpbmcgc3RhdGVcclxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVuZGVyKCkpO1xyXG4gICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxyXG4gICAgdGhpcy5maWxlc3lzdGVtLnN1YnNjcmliZSgoKSA9PiB0aGlzLmxvYWRTb3VuZGJhbmsoKSk7XHJcblxyXG4gICAgLy8gaW5pdCB3aXRoIGN1cnJlbnQgY29udGVudFxyXG4gICAgdGhpcy5sb2FkU291bmRiYW5rKCk7XHJcblxyXG4gICAgLy8gdGhpcy5mcyA9IHJlcXVpcmUoJ2ZpbGUtc3lzdGVtJylcclxuXHJcbiAgICBjb25zdCBUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCgnUG9zaXRpb24nKTsgLy8vLy8vLy8gw6dhIG1hcmNoZSBwYXMgKGltcG9zc2liaWxlIGQndXRpbGlzZXIgZnMsIG5lIHRyb3V2ZSBwYXMgbGUgcGF0aC4uLilcclxuICAgIC8vIFRyZWUuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcclxuICAgIC8vICAgLy8gY29uc29sZS5sb2cobGVhZilcclxuICAgIC8vICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XHJcbiAgICAvLyAgICAgY29uc29sZS5sb2cobGVhZilcclxuICAgIC8vICAgICBpZiAobGVhZi5leHRlbnNpb24gPT09ICcuanNvbicpIHtcclxuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKGxlYWYudXJsKVxyXG4gICAgLy8gICAgICAgY29uc29sZS5sb2coSlNPTi5wYXJzZSgnLi9zY2VuZS5qc29uJykpXHJcbiAgICAvLyAgICAgICAvLyBjb25zb2xlLmxvZyhKU09ONS5wYXJzZSh0aGlzLmZpbGVzeXN0ZW0ucmVhZEZpbGVTeW5jKGxlYWYudXJsLCAndXRmLTgnKSkpO1xyXG4gICAgLy8gICAgICAgLy8gbGV0IGEgPSByZXF1aXJlKGxlYWYucGF0aClcclxuICAgIC8vICAgICAgIGxldCBiID0gcmVxdWlyZSgnLi9zY2VuZS5qc29uJylcclxuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKGEpO1xyXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYik7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gICB9XHJcbiAgICAvLyB9KTtcclxuXHJcblxyXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5wb3NpdGlvbnMpXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gdGhpcy5yZW5kZXIoKSk7XHJcbiAgICB0aGlzLnJlbmRlcigpO1xyXG4gIH1cclxuXHJcbiAgbG9hZFNvdW5kYmFuaygpIHtcclxuICAgIGNvbnN0IHNvdW5kYmFua1RyZWUgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0KCdBdWRpb0ZpbGVzMCcpO1xyXG4gICAgY29uc3QgZGVmT2JqID0ge307XHJcbiAgICBjb25zb2xlLmxvZyhzb3VuZGJhbmtUcmVlKVxyXG5cclxuICAgIHNvdW5kYmFua1RyZWUuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcclxuICAgICAgLy8gY29uc29sZS5sb2cobGVhZilcclxuICAgICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XHJcbiAgICAgICAgZGVmT2JqW2xlYWYubmFtZV0gPSBsZWFmLnVybDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5sb2FkKGRlZk9iaiwgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICByZW5kZXIoKSB7XHJcbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxyXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xyXG5cclxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcclxuXHJcbiAgICAgIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpO1xyXG4gICAgICBjb25zdCBkYXRhID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5kYXRhO1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKVxyXG5cclxuICAgICAgcmVuZGVyKGh0bWxgXHJcbiAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cclxuICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYW5nZVwiIGlkPVwicG9zaXRpb25JbnB1dDFcIiBzdGVwPTAuMSBtYXg9JHt0aGlzLnJhbmdlLm1heFh9IG1pbj0ke3RoaXMucmFuZ2UubWluWH0gdmFsdWU9JHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH0+PC9pbnB1dD5cclxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYW5nZVwiIGlkPVwicG9zaXRpb25JbnB1dDJcIiBzdGVwPTAuMSBtYXg9JHt0aGlzLnJhbmdlLm1heFl9IG1pbj0ke3RoaXMucmFuZ2UubWluWX0gdmFsdWU9JHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX0+PC9pbnB1dD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH1cclxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwid2lkdGg6IDYwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAxODBweDsgbGVmdDogNTAlXCI+XHJcbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsaXN0ZW5lclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDE1cHg7IHdpZHRoOiAxNXB4OyBiYWNrZ3JvdW5kOiBibHVlOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHRyYW5zZm9ybTogXHJcbiAgICAgICAgICAgIHRyYW5zbGF0ZSgkeyh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCAtIHRoaXMucmFuZ2UubW95WCkqMip0aGlzLnBpeGVsU2NhbGUvdGhpcy5yYW5nZS5yYW5nZVh9cHgsICR7KHRoaXMubGlzdGVuZXJQb3NpdGlvbi55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnBpeGVsU2NhbGUvdGhpcy5yYW5nZS5yYW5nZVl9cHgpIHJvdGF0ZSg0NWRlZylcIlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XHJcblxyXG5cclxuLy88cD5hZGQgb3IgcmVtb3ZlIC53YXYgb3IgLm1wMyBmaWxlcyBpbiB0aGUgXCJzb3VuZGJhbmtcIiBkaXJlY3RvcnkgYW5kIG9ic2VydmUgdGhlIGNoYW5nZXM6PC9wPiR7T2JqZWN0LmtleXMoZGF0YSkubWFwKGtleSA9PiB7cmV0dXJuIGh0bWxgPHA+LSBcIiR7a2V5fVwiIGxvYWRlZDogJHtkYXRhW2tleV19LjwvcD5gO30pfVxyXG5cclxuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XHJcbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXHJcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcclxuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJykpXHJcblxyXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcclxuXHJcbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQxXCIpO1xyXG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MlwiKTtcclxuXHJcbiAgICAgICAgICBwb3NpdGlvbklucHV0MS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgIHBvc2l0aW9uSW5wdXQyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHZhciBzaG9vdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvb3RCdXR0b25cIik7XHJcbiAgICAgIC8vIHNob290QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgIC8vIH0pO1xyXG5cclxuICAgICAgLy8gdmFyIHlhd1NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2xpZGVyQXppbUFpbVwiKTtcclxuICAgICAgLy8geWF3U2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XHJcblxyXG4gICAgICAvLyB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoY29udGFpbmVyKSB7XHJcbiAgICB2YXIgdGVtcENpcmNsZVxyXG4gICAgdGhpcy5hdWRpb0NvbnRleHQucmVzdW1lKCk7XHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnJhbmdlKTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdGVtcENpcmNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICB0ZW1wQ2lyY2xlLmlkID0gXCJjaXJjbGVcIiArIGk7XHJcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUgPSBcInBvc2l0aW9uOiBhYnNvbHV0ZTsgd2lkdGg6IDIwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czogMjBweDsgYmFja2dyb3VuZDogcmVkOyB0ZXh0LWFsaWduOiBjZW50ZXI7XCI7XHJcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMucGl4ZWxTY2FsZSoyL3RoaXMucmFuZ2UucmFuZ2VYKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnBpeGVsU2NhbGUvdGhpcy5yYW5nZS5yYW5nZVkpICsgXCJweClcIjtcclxuICAgICAgdGVtcENpcmNsZS5sYWJlbCA9IGk7XHJcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZW1wQ2lyY2xlKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgUmFuZ2UocG9zaXRpb25zKSB7XHJcbiAgICB0aGlzLnJhbmdlID0ge1xyXG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcclxuICAgICAgbWF4WDogcG9zaXRpb25zWzBdLngsIFxyXG4gICAgICAvLyBtb3lYOiBudWxsLFxyXG4gICAgICAvLyByYW5nZVg6IG51bGwsXHJcbiAgICAgIG1pblk6IHBvc2l0aW9uc1swXS55LCBcclxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXHJcbiAgICAgIC8vIG1veVk6IG51bGwsXHJcbiAgICAgIC8vIHJhbmdlWTogbnVsbFxyXG4gICAgfTtcclxuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgcG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xyXG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yXHJcbiAgICB0aGlzLnJhbmdlLm1veVkgPSAodGhpcy5yYW5nZS5tYXhZICsgdGhpcy5yYW5nZS5taW5ZKS8yXHJcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcclxuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xyXG4gIH1cclxuXHJcbiAgb25Qb3NpdGlvbkNoYW5nZSh2YWx1ZVgsIHZhbHVlWSkge1xyXG4gICAgLy8gY29uc29sZS5sb2coXCJvdWlcIilcclxuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdmFsdWVYLnZhbHVlO1xyXG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB2YWx1ZVkudmFsdWU7XHJcblxyXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFBvaW50c0lkXHJcbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XHJcbiAgICBjb25zb2xlLmxvZyh0aGlzLkNsb3Nlc3RQb2ludHNJZClcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xyXG4gICAgICAvLyBjb25zb2xlLmxvZyhcIm5vblwiKVxyXG4gICAgICBpZiAodGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSAhPSB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSkge1xyXG4gICAgICAgIGlmICh0aGlzLk5vdEluKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0sIHRoaXMuQ2xvc2VzdFBvaW50c0lkKSkge1xyXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcInJlZFwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSB0aGlzLnNvdXJjZXNDb2xvcltpXTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0b3AoKTtcclxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zW2ldKTtcclxuXHJcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldID0gbmV3IHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9Db250ZXh0LCB0aGlzLnNvdW5kQmFua1t0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXV0sIHRoaXMuZ2FpbnNbaV0pO1xyXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMucGxheWluZ1NvdW5kc1tpXSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5yZW5kZXIoKTtcclxuICB9XHJcblxyXG4gIENsb3Nlc3RTb3VyY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnQsIG5iQ2xvc2VzdCkge1xyXG4gICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcclxuICAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xyXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuYkNsb3Nlc3Q7IGorKykge1xyXG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gdW5kZWZpbmVkO1xyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RPZlBvaW50Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKVxyXG4gICAgICAgIGlmICh0aGlzLk5vdEluKGksIGNsb3Nlc3RJZHMpICYmIHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbaV0pIDwgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSkpIHtcclxuICAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGNsb3Nlc3RJZHMpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gKGNsb3Nlc3RJZHMpO1xyXG4gIH1cclxuXHJcbiAgTm90SW4ocG9pbnRJZCwgbGlzdE9mSWRzKSB7XHJcbiAgICB2YXIgaXRlcmF0b3IgPSAwO1xyXG4gICAgd2hpbGUgKGl0ZXJhdG9yIDwgbGlzdE9mSWRzLmxlbmd0aCAmJiBwb2ludElkICE9IGxpc3RPZklkc1tpdGVyYXRvcl0pIHtcclxuICAgICAgaXRlcmF0b3IgKz0gMTtcclxuICAgIH1cclxuICAgIHJldHVybihpdGVyYXRvciA+PSBsaXN0T2ZJZHMubGVuZ3RoKTtcclxuICB9XHJcblxyXG4gIERpc3RhbmNlKHBvaW50QSwgcG9pbnRCKSB7XHJcbiAgICAvLyBjb25zb2xlLmxvZyhwb2ludEEpXHJcbiAgICAvLyBjb25zb2xlLmxvZyhwb2ludEIpXHJcbiAgICAvLyBpZiAocG9pbnRCID0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyAgIHJldHVybiAwO1xyXG4gICAgLy8gfVxyXG4gICAgaWYgKHBvaW50QiAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIChNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnRBLnggLSBwb2ludEIueCwgMikgKyBNYXRoLnBvdyhwb2ludEEueSAtIHBvaW50Qi55LCAyKSkpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiAoSW5maW5pdHkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgTG9hZE5ld1NvdW5kKGF1ZGlvQ29udGV4dCwgc291bmQsIGdhaW4pIHtcclxuICAgIC8vIFNvdW5kIGluaXRpYWxpc2F0aW9uXHJcbiAgICAvLyBjb25zb2xlLmxvZyhhdWRpb0NvbnRleHQpXHJcbiAgICB2YXIgU291bmQgPSBhdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKClcclxuICAgIFNvdW5kLmxvb3AgPSB0cnVlO1xyXG4gICAgU291bmQuYnVmZmVyID0gc291bmQ7XHJcbiAgICBTb3VuZC5jb25uZWN0KGdhaW4pO1xyXG4gICAgcmV0dXJuIFNvdW5kO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhw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