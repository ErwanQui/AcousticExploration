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
    this.scale;
    this.distanceSum = 0;
    this.ClosestPointsId = [];
    this.previousClosestPointsId = [];
    this.nbClosestPoints = 4;
    this.positions = [];
    this.truePositions = [[31.0, 41.5], [31.0, 39.0], [31.0, 36.2], [34.5, 36.2], [36.8, 36.2], [36.8, 33.6], [34.5, 33.6], [31.0, 33.6], [31.0, 31.0], [34.5, 31.0], [34.5, 28.0], [31.0, 28.0], [31.0, 25.8], [34.5, 25.8], [36.8, 25.8], [36.8, 23.6], [34.5, 23.6], [31.0, 23.6]];
    this.nbPos = this.truePositions.length;
    this.range;
    this.distanceValue = [0, 0, 0, 0];
    this.audioContext = new AudioContext();
    this.playingSounds = [];
    this.gains = [];
    this.tempX;
    this.tempY;
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
    this.scale = this.Scaling(this.range);
    this.listenerPosition.x = this.range.moyX;
    this.listenerPosition.y = this.range.minY;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints); // $.get("data.json", function(data){
    // console.log(data);
    // });

    var tempPrefix = "";
    var file;

    for (let i = 0; i < this.nbClosestPoints; i++) {
      this.gains.push(await this.audioContext.createGain()); // console.log(this.gains)

      if (this.ClosestPointsId[i] < 10) {
        tempPrefix = "0";
      } else {
        tempPrefix = "";
      }

      file = tempPrefix + this.ClosestPointsId[i] + ".wav";
      this.playingSounds.push(this.LoadNewSound(this.audioBufferLoader.data[file], i));
      this.gains[i].connect(this.audioContext.destination);
      this.gains[i].gain.setValueAtTime(0.5, 0);
    } // subscribe to display loading state


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

  Range(positions) {
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
    var scale = {
      VPos2Pixel: Math.min(window.screen.height / rangeValues.rangeX, window.screen.width / rangeValues.rangeY)
    };
    console.log(scale);
    return scale;
  }

  VirtualPos2Pixel(position) {
    var pixelCoord = {
      x: position.x * this.scale.VPos2Pixel,
      y: position.y * this.scale.VPos2Pixel
    };
    return pixelCoord;
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
            <div id="listener" style="position: absolute; height: 15px; width: 15px; background: blue; text-align: center; z-index: 1; transform: 
            translate(${(this.listenerPosition.x - this.range.moyX) * this.scaling}px, ${(this.listenerPosition.y - this.range.minY) * this.scaling}px) rotate(45deg)"
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
          var marker = document.getElementById("listener");
          var mouseDown = false;
          console.log(window.screen.width);
          marker.addEventListener("mousedown", mouse => {
            mouseDown = true;
            this.tempX = mouse.clientX;
            this.tempY = mouse.clientY;
            this.mouseAction(mouse);
          }, false);
          marker.addEventListener("mousemove", mouse => {
            if (mouseDown) {
              this.mouseAction(mouse);
            }
          }, false);
          marker.addEventListener("mouseup", mouse => {
            mouseDown = false; // this.listenerPosition.x = this;
            // this.listenerPosition.y = mouse.clientY;
          }, false);
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
    for (let i = 0; i < this.nbClosestPoints; i++) {
      this.playingSounds[i].start();
    }

    var tempCircle;
    this.audioContext.resume(); // console.log(this.range);

    for (let i = 0; i < this.positions.length; i++) {
      tempCircle = document.createElement('div');
      tempCircle.id = "circle" + i; // console.log(tempCircle)

      tempCircle.innerHTML = i;
      tempCircle.style = "position: absolute; width: 20px; height: 20px; border-radius: 20px; background: grey; line-height: 20px";
      tempCircle.style.transform = "translate(" + (this.positions[i].x - this.range.moyX) * this.scaling + "px, " + (this.positions[i].y - this.range.minY) * this.scaling + "px)";
      container.appendChild(tempCircle);
    }
  }

  onPositionChange(valueX, valueY) {
    // console.log("oui")
    this.listenerPosition.x = valueX.value;
    this.listenerPosition.y = valueY.value;
    var tempPrefix = "";
    var file;
    this.previousClosestPointsId = this.ClosestPointsId;
    this.distanceSum = 0;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints); // console.log(this.ClosestPointsId)

    for (let i = 0; i < this.nbClosestPoints; i++) {
      // console.log("non")
      if (this.previousClosestPointsId[i] != this.ClosestPointsId[i]) {
        if (this.NotIn(this.previousClosestPointsId[i], this.ClosestPointsId)) {
          document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "grey";
        }

        this.playingSounds[i].stop();
        this.playingSounds[i].disconnect(this.gains[i]);

        if (this.ClosestPointsId[i] < 10) {
          tempPrefix = "0";
        } else {
          tempPrefix = "";
        }

        file = tempPrefix + this.ClosestPointsId[i] + ".wav";
        this.playingSounds[i] = this.LoadNewSound(this.audioBufferLoader.data[file], i);
        this.playingSounds[i].start(); // console.log(this.playingSounds[i])
      }

      document.getElementById("circle" + this.ClosestPointsId[i]).style.background = "rgb(0, " + 255 * (1 - 2 * this.distanceValue[i] / this.distanceSum) + ", 0)";
    }

    this.render();
  }

  PositionChange(valueX, valueY) {
    // console.log("oui")
    var tempPrefix = "";
    var file;
    this.previousClosestPointsId = this.ClosestPointsId;
    this.distanceSum = 0;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints); // console.log(this.ClosestPointsId)

    for (let i = 0; i < this.nbClosestPoints; i++) {
      // console.log("non")
      if (this.previousClosestPointsId[i] != this.ClosestPointsId[i]) {
        if (this.NotIn(this.previousClosestPointsId[i], this.ClosestPointsId)) {
          document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "grey";
        }

        this.playingSounds[i].stop();
        this.playingSounds[i].disconnect(this.gains[i]);

        if (this.ClosestPointsId[i] < 10) {
          tempPrefix = "0";
        } else {
          tempPrefix = "";
        }

        file = tempPrefix + this.ClosestPointsId[i] + ".wav";
        this.playingSounds[i] = this.LoadNewSound(this.audioBufferLoader.data[file], i);
        this.playingSounds[i].start(); // console.log(this.playingSounds[i])
      }

      document.getElementById("circle" + this.ClosestPointsId[i]).style.background = "rgb(0, " + 255 * (1 - 2 * this.distanceValue[i] / this.distanceSum) + ", 0)";
    }

    this.render();
  }

  mouseAction(mouse) {
    // Get current mouse coords
    // var rect = canvas.getBoundingClientRect();
    // var mouseXPos = (mouse.clientX - rect.left);
    // var mouseYPos = (mouse.clientY - rect.top);
    // this.listenerPosition.x = mouse.clientX - (document.getElementById("listener").style.width/2);
    // this.listenerPosition.y = mouse.clientY - (document.getElementById("listener").Height/2);
    // this.listenerPosition.x = this.range.moyX + (mouse.clientX - window.screen.width/2)/(this.scaling);
    // this.listenerPosition.y = this.range.moyY + (mouse.clientY - window.screen.height/2)/(this.scaling);
    console.log(this.range.minY + (mouse.clientY - window.screen.height / 2) / this.scaling);
    console.log((mouse.clientY - this.tempY) / this.scaling); // this.listenerPosition.x += (mouse.clientX - this.tempX)/this.scaling;
    // this.listenerPosition.y += (mouse.clientY - this.tempY)/this.scaling

    document.getElementById("listener").style.transform = "translate(" + ((this.listenerPosition.x - this.range.moyX) * this.scaling + mouse.clientX - this.tempX) + "px, " + ((this.listenerPosition.y - this.range.minY) * this.scaling + mouse.clientY - this.tempY) + "px) rotate(45deg)"; // document.getElementById("listener").style.transform = "translate(" + ((this.listenerPosition.x - this.range.moyX)*this.scaling) + "px, " + ((this.listenerPosition.y - this.range.minY)*this.scaling + mouse.clientY - this.tempY) +"px) rotate(45deg)";
    // this.listenerPosition.y = 24;
    // console.log(document.getElementById("cle").style.height);
    // console.log((window.screen.height/2 - mouse.clientY));
    // console.log((window.screen.height/2 - mouse.clientY)/this.scaling);
    // console.log(mouse.clientY);
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

      this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]);
      this.distanceSum += this.distanceValue[j];
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

  LoadNewSound(buffer, index) {
    // Sound initialisation
    // console.log(buffer)
    var Sound = this.audioContext.createBufferSource();
    Sound.loop = true;
    Sound.buffer = buffer;
    Sound.connect(this.gains[index]);
    return Sound;
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsInBpeGVsU2NhbGUiLCJsaXN0ZW5lclBvc2l0aW9uIiwieCIsInkiLCJzY2FsZSIsImRpc3RhbmNlU3VtIiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJ0cnVlUG9zaXRpb25zIiwibmJQb3MiLCJsZW5ndGgiLCJyYW5nZSIsImRpc3RhbmNlVmFsdWUiLCJhdWRpb0NvbnRleHQiLCJBdWRpb0NvbnRleHQiLCJwbGF5aW5nU291bmRzIiwiZ2FpbnMiLCJ0ZW1wWCIsInRlbXBZIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJzb3VuZEJhbmsiLCJsb2FkIiwiaSIsInB1c2giLCJSYW5nZSIsIlNjYWxpbmciLCJtb3lYIiwibWluWSIsIkNsb3Nlc3RTb3VyY2UiLCJ0ZW1wUHJlZml4IiwiZmlsZSIsImNyZWF0ZUdhaW4iLCJMb2FkTmV3U291bmQiLCJkYXRhIiwiY29ubmVjdCIsImRlc3RpbmF0aW9uIiwiZ2FpbiIsInNldFZhbHVlQXRUaW1lIiwic3Vic2NyaWJlIiwicmVuZGVyIiwibG9hZFNvdW5kYmFuayIsIlRyZWUiLCJnZXQiLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwibWluWCIsIm1heFgiLCJtYXhZIiwibW95WSIsInJhbmdlWCIsInJhbmdlWSIsInJhbmdlVmFsdWVzIiwiVlBvczJQaXhlbCIsIk1hdGgiLCJtaW4iLCJzY3JlZW4iLCJoZWlnaHQiLCJ3aWR0aCIsImNvbnNvbGUiLCJsb2ciLCJWaXJ0dWFsUG9zMlBpeGVsIiwicG9zaXRpb24iLCJwaXhlbENvb3JkIiwic291bmRiYW5rVHJlZSIsImRlZk9iaiIsImNoaWxkcmVuIiwiZm9yRWFjaCIsImxlYWYiLCJ0eXBlIiwibmFtZSIsInVybCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwibG9hZGluZyIsImh0bWwiLCJpZCIsInNjYWxpbmciLCJiZWdpbkJ1dHRvbiIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uSW5wdXQxIiwicG9zaXRpb25JbnB1dDIiLCJvblBvc2l0aW9uQ2hhbmdlIiwibWFya2VyIiwibW91c2VEb3duIiwibW91c2UiLCJjbGllbnRYIiwiY2xpZW50WSIsIm1vdXNlQWN0aW9uIiwiY29udGFpbmVyIiwidGVtcENpcmNsZSIsInJlc3VtZSIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJ0cmFuc2Zvcm0iLCJhcHBlbmRDaGlsZCIsInZhbHVlWCIsInZhbHVlWSIsInZhbHVlIiwiTm90SW4iLCJiYWNrZ3JvdW5kIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJQb3NpdGlvbkNoYW5nZSIsImxpc3RPZlBvaW50IiwibmJDbG9zZXN0IiwiY2xvc2VzdElkcyIsImN1cnJlbnRDbG9zZXN0SWQiLCJqIiwidW5kZWZpbmVkIiwiRGlzdGFuY2UiLCJwb2ludElkIiwibGlzdE9mSWRzIiwiaXRlcmF0b3IiLCJwb2ludEEiLCJwb2ludEIiLCJzcXJ0IiwicG93IiwiSW5maW5pdHkiLCJidWZmZXIiLCJpbmRleCIsIlNvdW5kIiwiY3JlYXRlQnVmZmVyU291cmNlIiwibG9vcCJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmltcG9ydCBNYXJrZXIgZnJvbSAnLi9NYXJrZXIuanMnO1xuLy8gaW1wb3J0IFNjZW5lIGZyb20gJ2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMvc2NlbmUuanNvbic7XG5cbi8vIGltcG9ydCBQb3NpdGlvbnMgZnJvbSAnLi9zY2VuZS5qc29uJ1xuLy8gaW1wb3J0IGZzNSBmcm9tIFwiZnNcIjtcbi8vIGltcG9ydCBKU09ONSBmcm9tICdqc29uNSc7XG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpO1xuICAgIHRoaXMuYW1iaXNvbmljcyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0pXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpKVxuICAgIC8vIGNvbnN0IHRyZWVzID0gdGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpO1xuICAgIC8vIGZvciAobGV0IG5hbWUgaW4gdHJlZXMpIHtcbiAgICAvLyAgIGNvbnN0IHRyZWUgPSB0cmVlW25hbWVdO1xuICAgIC8vICAgY29uc29sZS5sb2cobmFtZSwgdHJlZSk7XG4gICAgLy8gfVxuICAgIC8vIHRoaXMucGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpXG4gICAgLy8gdGhpcy5mcyA9IHRoaXMucmVxdWlyZSgnZnMnKVxuXG4gICAgLy8gY29uc3QgZW52Q29uZmlnUGF0aCA9ICdwdWJsaWMvZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cy9zY2VuZS5qc29uJ1xuICAgIC8vIHZhciBlbnZDb25maWcgPSBKU09ONS5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZW52Q29uZmlnUGF0aCwgJ3V0Zi04JykpO1xuICAgIC8vIGNvbnNvbGUubG9nKGVudkNvbmZpZylcblxuXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMucGl4ZWxTY2FsZSA9IDIwMDtcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24gPSB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICB9XG4gICAgdGhpcy5zY2FsZTtcbiAgICB0aGlzLmRpc3RhbmNlU3VtID0gMDtcblxuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gW107XG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IFtdO1xuICAgIHRoaXMubmJDbG9zZXN0UG9pbnRzID0gNDtcbiAgICB0aGlzLnBvc2l0aW9ucyA9IFtdO1xuICAgIHRoaXMudHJ1ZVBvc2l0aW9ucyA9IFtcbiAgICAgIFszMS4wLCA0MS41XSxcbiAgICAgIFszMS4wLCAzOS4wXSxcbiAgICAgIFszMS4wLCAzNi4yXSxcbiAgICAgIFszNC41LCAzNi4yXSxcbiAgICAgIFszNi44LCAzNi4yXSxcbiAgICAgIFszNi44LCAzMy42XSxcbiAgICAgIFszNC41LCAzMy42XSxcbiAgICAgIFszMS4wLCAzMy42XSxcbiAgICAgIFszMS4wLCAzMS4wXSxcbiAgICAgIFszNC41LCAzMS4wXSxcbiAgICAgIFszNC41LCAyOC4wXSxcbiAgICAgIFszMS4wLCAyOC4wXSxcbiAgICAgIFszMS4wLCAyNS44XSxcbiAgICAgIFszNC41LCAyNS44XSxcbiAgICAgIFszNi44LCAyNS44XSxcbiAgICAgIFszNi44LCAyMy42XSxcbiAgICAgIFszNC41LCAyMy42XSxcbiAgICAgIFszMS4wLCAyMy42XSxcbiAgICBdXG5cbiAgICB0aGlzLm5iUG9zID0gdGhpcy50cnVlUG9zaXRpb25zLmxlbmd0aDtcbiAgICB0aGlzLnJhbmdlO1xuICAgIHRoaXMuZGlzdGFuY2VWYWx1ZSA9IFswLCAwLCAwLCAwXTtcblxuICAgIHRoaXMuYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICAgIHRoaXMucGxheWluZ1NvdW5kcyA9IFtdO1xuICAgIHRoaXMuZ2FpbnMgPSBbXTtcblxuICAgIHRoaXMudGVtcFg7XG4gICAgdGhpcy50ZW1wWTtcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgdGhpcy5zb3VuZEJhbmsgPSBhd2FpdCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmxvYWQoe1xuICAgIH0sIHRydWUpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcbiAgICAgIC8vIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSoxMDAwIC0gNTAwKSwgeTogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjUwMCl9KTtcbiAgICAgIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IHRoaXMudHJ1ZVBvc2l0aW9uc1tpXVswXSwgeTp0aGlzLnRydWVQb3NpdGlvbnNbaV1bMV19KTtcbiAgICB9XG5cbiAgICB0aGlzLlJhbmdlKHRoaXMucG9zaXRpb25zKTtcbiAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdGhpcy5yYW5nZS5tb3lYO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpXG5cbiAgICAvLyAkLmdldChcImRhdGEuanNvblwiLCBmdW5jdGlvbihkYXRhKXtcbiAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAvLyB9KTtcblxuICAgIHZhciB0ZW1wUHJlZml4ID0gXCJcIjtcbiAgICB2YXIgZmlsZTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgdGhpcy5nYWlucy5wdXNoKGF3YWl0IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmdhaW5zKVxuXG4gICAgICBpZiAodGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gPCAxMCkge1xuICAgICAgICB0ZW1wUHJlZml4ID0gXCIwXCI7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGVtcFByZWZpeCA9IFwiXCI7XG4gICAgICB9XG5cbiAgICAgIGZpbGUgPSB0ZW1wUHJlZml4ICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gKyBcIi53YXZcIjtcblxuXG4gICAgICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbZmlsZV0sIGkpKTtcbiAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cblxuICAgICAgdGhpcy5nYWluc1tpXS5nYWluLnNldFZhbHVlQXRUaW1lKDAuNSwgMCk7XG4gICAgfVxuXG4gICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIC8vIHN1YnNjcmliZSB0byBkaXNwbGF5IGxvYWRpbmcgc3RhdGVcbiAgICB0aGlzLmZpbGVzeXN0ZW0uc3Vic2NyaWJlKCgpID0+IHRoaXMubG9hZFNvdW5kYmFuaygpKTtcblxuICAgIC8vIGluaXQgd2l0aCBjdXJyZW50IGNvbnRlbnRcbiAgICB0aGlzLmxvYWRTb3VuZGJhbmsoKTtcblxuICAgIC8vIHRoaXMuZnMgPSByZXF1aXJlKCdmaWxlLXN5c3RlbScpXG5cbiAgICBjb25zdCBUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCgnUG9zaXRpb24nKTsgLy8vLy8vLy8gw6dhIG1hcmNoZSBwYXMgKGltcG9zc2liaWxlIGQndXRpbGlzZXIgZnMsIG5lIHRyb3V2ZSBwYXMgbGUgcGF0aC4uLilcbiAgICAvLyBUcmVlLmNoaWxkcmVuLmZvckVhY2gobGVhZiA9PiB7XG4gICAgLy8gICAvLyBjb25zb2xlLmxvZyhsZWFmKVxuICAgIC8vICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKGxlYWYpXG4gICAgLy8gICAgIGlmIChsZWFmLmV4dGVuc2lvbiA9PT0gJy5qc29uJykge1xuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKGxlYWYudXJsKVxuICAgIC8vICAgICAgIGNvbnNvbGUubG9nKEpTT04ucGFyc2UoJy4vc2NlbmUuanNvbicpKVxuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT041LnBhcnNlKHRoaXMuZmlsZXN5c3RlbS5yZWFkRmlsZVN5bmMobGVhZi51cmwsICd1dGYtOCcpKSk7XG4gICAgLy8gICAgICAgLy8gbGV0IGEgPSByZXF1aXJlKGxlYWYucGF0aClcbiAgICAvLyAgICAgICBsZXQgYiA9IHJlcXVpcmUoJy4vc2NlbmUuanNvbicpXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYSk7XG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYik7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcblxuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5wb3NpdGlvbnMpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBSYW5nZShwb3NpdGlvbnMpIHtcbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1pblk6IHBvc2l0aW9uc1swXS55LCBcbiAgICAgIG1heFk6IHBvc2l0aW9uc1swXS55LFxuICAgIH07XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBwb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA8IHRoaXMucmFuZ2UubWluWCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueCA+IHRoaXMucmFuZ2UubWF4WCkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFggPSBwb3NpdGlvbnNbaV0ueDtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA8IHRoaXMucmFuZ2UubWluWSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1pblkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICAgIGlmIChwb3NpdGlvbnNbaV0ueSA+IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgICB0aGlzLnJhbmdlLm1heFkgPSBwb3NpdGlvbnNbaV0ueTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yYW5nZS5tb3lYID0gKHRoaXMucmFuZ2UubWF4WCArIHRoaXMucmFuZ2UubWluWCkvMlxuICAgIHRoaXMucmFuZ2UubW95WSA9ICh0aGlzLnJhbmdlLm1heFkgKyB0aGlzLnJhbmdlLm1pblkpLzJcbiAgICB0aGlzLnJhbmdlLnJhbmdlWCA9IHRoaXMucmFuZ2UubWF4WCAtIHRoaXMucmFuZ2UubWluWDtcbiAgICB0aGlzLnJhbmdlLnJhbmdlWSA9IHRoaXMucmFuZ2UubWF4WSAtIHRoaXMucmFuZ2UubWluWTtcbiAgfVxuXG4gIFNjYWxpbmcocmFuZ2VWYWx1ZXMpIHtcbiAgICB2YXIgc2NhbGUgPSB7VlBvczJQaXhlbDogTWF0aC5taW4od2luZG93LnNjcmVlbi5oZWlnaHQvcmFuZ2VWYWx1ZXMucmFuZ2VYLCB3aW5kb3cuc2NyZWVuLndpZHRoL3JhbmdlVmFsdWVzLnJhbmdlWSl9O1xuICAgIGNvbnNvbGUubG9nKHNjYWxlKVxuICAgIHJldHVybiAoc2NhbGUpXG4gIH1cblxuICBWaXJ0dWFsUG9zMlBpeGVsKHBvc2l0aW9uKSB7XG4gICAgdmFyIHBpeGVsQ29vcmQgPSB7eDogcG9zaXRpb24ueCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwsIHk6IHBvc2l0aW9uLnkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfTtcbiAgICByZXR1cm4gKHBpeGVsQ29vcmQpO1xuICB9XG5cbiAgbG9hZFNvdW5kYmFuaygpIHtcbiAgICBjb25zdCBzb3VuZGJhbmtUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCgnQXVkaW9GaWxlczAnKTtcbiAgICBjb25zdCBkZWZPYmogPSB7fTtcbiAgICBjb25zb2xlLmxvZyhzb3VuZGJhbmtUcmVlKVxuXG4gICAgc291bmRiYW5rVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2cobGVhZilcbiAgICAgIGlmIChsZWFmLnR5cGUgPT09ICdmaWxlJykge1xuICAgICAgICBkZWZPYmpbbGVhZi5uYW1lXSA9IGxlYWYudXJsO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5sb2FkKGRlZk9iaiwgdHJ1ZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpO1xuICAgICAgY29uc3QgZGF0YSA9IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpXG5cbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBpZD1cInBvc2l0aW9uSW5wdXQxXCIgc3RlcD0wLjEgbWF4PSR7dGhpcy5yYW5nZS5tYXhYfSBtaW49JHt0aGlzLnJhbmdlLm1pblh9IHZhbHVlPSR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnh9PjwvaW5wdXQ+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MlwiIHN0ZXA9MC4xIG1heD0ke3RoaXMucmFuZ2UubWF4WX0gbWluPSR7dGhpcy5yYW5nZS5taW5ZfSB2YWx1ZT0ke3RoaXMubGlzdGVuZXJQb3NpdGlvbi55fT48L2lucHV0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAke3RoaXMubGlzdGVuZXJQb3NpdGlvbi54fVxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ3aWR0aDogNjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDE4MHB4OyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsaXN0ZW5lclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDE1cHg7IHdpZHRoOiAxNXB4OyBiYWNrZ3JvdW5kOiBibHVlOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHotaW5kZXg6IDE7IHRyYW5zZm9ybTogXG4gICAgICAgICAgICB0cmFuc2xhdGUoJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGluZ31weCwgJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGluZ31weCkgcm90YXRlKDQ1ZGVnKVwiXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuXG4gICAgICAgIC8vPHA+YWRkIG9yIHJlbW92ZSAud2F2IG9yIC5tcDMgZmlsZXMgaW4gdGhlIFwic291bmRiYW5rXCIgZGlyZWN0b3J5IGFuZCBvYnNlcnZlIHRoZSBjaGFuZ2VzOjwvcD4ke09iamVjdC5rZXlzKGRhdGEpLm1hcChrZXkgPT4ge3JldHVybiBodG1sYDxwPi0gXCIke2tleX1cIiBsb2FkZWQ6ICR7ZGF0YVtrZXldfS48L3A+YDt9KX1cblxuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpKVxuXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIHZhciBwb3NpdGlvbklucHV0MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicG9zaXRpb25JbnB1dDFcIik7XG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MlwiKTtcblxuICAgICAgICAgIHBvc2l0aW9uSW5wdXQxLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgcG9zaXRpb25JbnB1dDIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XG4gICAgICAgICAgfSlcblxuICAgICAgICAgIHZhciBtYXJrZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxpc3RlbmVyXCIpO1xuICAgICAgICAgIHZhciBtb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyh3aW5kb3cuc2NyZWVuLndpZHRoKVxuXG4gICAgICAgICAgbWFya2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICBtb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy50ZW1wWCA9IG1vdXNlLmNsaWVudFg7XG4gICAgICAgICAgICB0aGlzLnRlbXBZID0gbW91c2UuY2xpZW50WTtcbiAgICAgICAgICAgIHRoaXMubW91c2VBY3Rpb24obW91c2UpO1xuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIG1hcmtlci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKG1vdXNlRG93bikge1xuICAgICAgICAgICAgICB0aGlzLm1vdXNlQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICBtYXJrZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICBtb3VzZURvd24gPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdGhpcztcbiAgICAgICAgICAgIC8vIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gbW91c2UuY2xpZW50WTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyB2YXIgc2hvb3RCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob290QnV0dG9uXCIpO1xuICAgICAgLy8gc2hvb3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIC8vIH0pO1xuXG4gICAgICAvLyB2YXIgeWF3U2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZXJBemltQWltXCIpO1xuICAgICAgLy8geWF3U2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG5cbiAgICAgIC8vIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoY29udGFpbmVyKSB7XG5cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0YXJ0KCk7XG4gICAgfVxuXG5cbiAgICB2YXIgdGVtcENpcmNsZVxuICAgIHRoaXMuYXVkaW9Db250ZXh0LnJlc3VtZSgpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRlbXBDaXJjbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHRlbXBDaXJjbGUuaWQgPSBcImNpcmNsZVwiICsgaTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHRlbXBDaXJjbGUpXG4gICAgICB0ZW1wQ2lyY2xlLmlubmVySFRNTCA9IGk7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlID0gXCJwb3NpdGlvbjogYWJzb2x1dGU7IHdpZHRoOiAyMHB4OyBoZWlnaHQ6IDIwcHg7IGJvcmRlci1yYWRpdXM6IDIwcHg7IGJhY2tncm91bmQ6IGdyZXk7IGxpbmUtaGVpZ2h0OiAyMHB4XCI7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxpbmcpICsgXCJweCwgXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGluZykgKyBcInB4KVwiO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBDaXJjbGUpXG4gICAgfVxuICB9XG5cbiAgb25Qb3NpdGlvbkNoYW5nZSh2YWx1ZVgsIHZhbHVlWSkge1xuICAgIC8vIGNvbnNvbGUubG9nKFwib3VpXCIpXG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB2YWx1ZVgudmFsdWU7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB2YWx1ZVkudmFsdWU7XG5cbiAgICB2YXIgdGVtcFByZWZpeCA9IFwiXCI7XG4gICAgdmFyIGZpbGU7XG5cbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0UG9pbnRzSWRcbiAgICB0aGlzLmRpc3RhbmNlU3VtID0gMDtcbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XG4gICAgLy8gY29uc29sZS5sb2codGhpcy5DbG9zZXN0UG9pbnRzSWQpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcIm5vblwiKVxuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pIHtcbiAgICAgICAgaWYgKHRoaXMuTm90SW4odGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSwgdGhpcy5DbG9zZXN0UG9pbnRzSWQpKSB7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcImdyZXlcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdG9wKCk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5kaXNjb25uZWN0KHRoaXMuZ2FpbnNbaV0pO1xuXG4gICAgICAgIGlmICh0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSA8IDEwKSB7XG4gICAgICAgICAgdGVtcFByZWZpeCA9IFwiMFwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRlbXBQcmVmaXggPSBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgZmlsZSA9IHRlbXBQcmVmaXggKyB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSArIFwiLndhdlwiO1xuXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXSA9IHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YVtmaWxlXSwgaSk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBsYXlpbmdTb3VuZHNbaV0pXG4gICAgICB9XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcInJnYigwLCBcIiArIDI1NSooMS0yKnRoaXMuZGlzdGFuY2VWYWx1ZVtpXS90aGlzLmRpc3RhbmNlU3VtKSArIFwiLCAwKVwiO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgUG9zaXRpb25DaGFuZ2UodmFsdWVYLCB2YWx1ZVkpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcIm91aVwiKVxuXG4gICAgdmFyIHRlbXBQcmVmaXggPSBcIlwiO1xuICAgIHZhciBmaWxlO1xuXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFBvaW50c0lkXG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7XG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuQ2xvc2VzdFBvaW50c0lkKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgLy8gY29uc29sZS5sb2coXCJub25cIilcbiAgICAgIGlmICh0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldICE9IHRoaXMuQ2xvc2VzdFBvaW50c0lkW2ldKSB7XG4gICAgICAgIGlmICh0aGlzLk5vdEluKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0sIHRoaXMuQ2xvc2VzdFBvaW50c0lkKSkge1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJncmV5XCI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RvcCgpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zW2ldKTtcblxuICAgICAgICBpZiAodGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gPCAxMCkge1xuICAgICAgICAgIHRlbXBQcmVmaXggPSBcIjBcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0ZW1wUHJlZml4ID0gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpbGUgPSB0ZW1wUHJlZml4ICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gKyBcIi53YXZcIjtcblxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0gPSB0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbZmlsZV0sIGkpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RhcnQoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5wbGF5aW5nU291bmRzW2ldKVxuICAgICAgfVxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMuQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZ2IoMCwgXCIgKyAyNTUqKDEtMip0aGlzLmRpc3RhbmNlVmFsdWVbaV0vdGhpcy5kaXN0YW5jZVN1bSkgKyBcIiwgMClcIjtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG1vdXNlQWN0aW9uKG1vdXNlKSB7XG5cbiAgICAvLyBHZXQgY3VycmVudCBtb3VzZSBjb29yZHNcbiAgICAvLyB2YXIgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAvLyB2YXIgbW91c2VYUG9zID0gKG1vdXNlLmNsaWVudFggLSByZWN0LmxlZnQpO1xuICAgIC8vIHZhciBtb3VzZVlQb3MgPSAobW91c2UuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IG1vdXNlLmNsaWVudFggLSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsaXN0ZW5lclwiKS5zdHlsZS53aWR0aC8yKTtcbiAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IG1vdXNlLmNsaWVudFkgLSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsaXN0ZW5lclwiKS5IZWlnaHQvMik7XG4gICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5zY3JlZW4ud2lkdGgvMikvKHRoaXMuc2NhbGluZyk7XG4gICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB0aGlzLnJhbmdlLm1veVkgKyAobW91c2UuY2xpZW50WSAtIHdpbmRvdy5zY3JlZW4uaGVpZ2h0LzIpLyh0aGlzLnNjYWxpbmcpO1xuICAgIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gd2luZG93LnNjcmVlbi5oZWlnaHQvMikvKHRoaXMuc2NhbGluZykpO1xuICAgIGNvbnNvbGUubG9nKChtb3VzZS5jbGllbnRZIC0gdGhpcy50ZW1wWSkvKHRoaXMuc2NhbGluZykpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggKz0gKG1vdXNlLmNsaWVudFggLSB0aGlzLnRlbXBYKS90aGlzLnNjYWxpbmc7XG4gICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgKz0gKG1vdXNlLmNsaWVudFkgLSB0aGlzLnRlbXBZKS90aGlzLnNjYWxpbmdcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGlzdGVuZXJcIikuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxpbmcgKyBtb3VzZS5jbGllbnRYIC0gdGhpcy50ZW1wWCkgKyBcInB4LCBcIiArICgodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGluZyArIG1vdXNlLmNsaWVudFkgLSB0aGlzLnRlbXBZKSArXCJweCkgcm90YXRlKDQ1ZGVnKVwiO1xuICAgIC8vIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGlzdGVuZXJcIikuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxpbmcpICsgXCJweCwgXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxpbmcgKyBtb3VzZS5jbGllbnRZIC0gdGhpcy50ZW1wWSkgK1wicHgpIHJvdGF0ZSg0NWRlZylcIjtcbiAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IDI0O1xuICAgIC8vIGNvbnNvbGUubG9nKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2xlXCIpLnN0eWxlLmhlaWdodCk7XG4gICAgLy8gY29uc29sZS5sb2coKHdpbmRvdy5zY3JlZW4uaGVpZ2h0LzIgLSBtb3VzZS5jbGllbnRZKSk7XG4gICAgLy8gY29uc29sZS5sb2coKHdpbmRvdy5zY3JlZW4uaGVpZ2h0LzIgLSBtb3VzZS5jbGllbnRZKS90aGlzLnNjYWxpbmcpO1xuICAgIC8vIGNvbnNvbGUubG9nKG1vdXNlLmNsaWVudFkpO1xuICB9XG5cbiAgQ2xvc2VzdFNvdXJjZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludCwgbmJDbG9zZXN0KSB7XG4gICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcbiAgICB2YXIgY3VycmVudENsb3Nlc3RJZDtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5iQ2xvc2VzdDsgaisrKSB7XG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gdW5kZWZpbmVkO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0T2ZQb2ludC5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gY29uc29sZS5sb2cobGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pXG4gICAgICAgIGlmICh0aGlzLk5vdEluKGksIGNsb3Nlc3RJZHMpICYmIHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbaV0pIDwgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSkpIHtcbiAgICAgICAgICBjdXJyZW50Q2xvc2VzdElkID0gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5kaXN0YW5jZVZhbHVlW2pdID0gdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSk7XG4gICAgICB0aGlzLmRpc3RhbmNlU3VtICs9IHRoaXMuZGlzdGFuY2VWYWx1ZVtqXTtcbiAgICAgIGNsb3Nlc3RJZHMucHVzaChjdXJyZW50Q2xvc2VzdElkKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGNsb3Nlc3RJZHMpXG4gICAgfVxuICAgIHJldHVybiAoY2xvc2VzdElkcyk7XG4gIH1cblxuICBOb3RJbihwb2ludElkLCBsaXN0T2ZJZHMpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSAwO1xuICAgIHdoaWxlIChpdGVyYXRvciA8IGxpc3RPZklkcy5sZW5ndGggJiYgcG9pbnRJZCAhPSBsaXN0T2ZJZHNbaXRlcmF0b3JdKSB7XG4gICAgICBpdGVyYXRvciArPSAxO1xuICAgIH1cbiAgICByZXR1cm4oaXRlcmF0b3IgPj0gbGlzdE9mSWRzLmxlbmd0aCk7XG4gIH1cblxuICBEaXN0YW5jZShwb2ludEEsIHBvaW50Qikge1xuICAgIC8vIGNvbnNvbGUubG9nKHBvaW50QSlcbiAgICAvLyBjb25zb2xlLmxvZyhwb2ludEIpXG4gICAgLy8gaWYgKHBvaW50QiA9IHVuZGVmaW5lZCkge1xuICAgIC8vICAgcmV0dXJuIDA7XG4gICAgLy8gfVxuICAgIGlmIChwb2ludEIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gKE1hdGguc3FydChNYXRoLnBvdyhwb2ludEEueCAtIHBvaW50Qi54LCAyKSArIE1hdGgucG93KHBvaW50QS55IC0gcG9pbnRCLnksIDIpKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIChJbmZpbml0eSk7XG4gICAgfVxuICB9XG5cbiAgTG9hZE5ld1NvdW5kKGJ1ZmZlciwgaW5kZXgpIHtcbiAgICAvLyBTb3VuZCBpbml0aWFsaXNhdGlvblxuICAgIC8vIGNvbnNvbGUubG9nKGJ1ZmZlcilcbiAgICB2YXIgU291bmQgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKVxuICAgIFNvdW5kLmxvb3AgPSB0cnVlO1xuICAgIFNvdW5kLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICBTb3VuZC5jb25uZWN0KHRoaXMuZ2FpbnNbaW5kZXhdKTtcbiAgICByZXR1cm4gU291bmQ7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQztJQUMzQyxNQUFNRixNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLQyxLQUFMLEdBQWEsSUFBYixDQUwyQyxDQU8zQzs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekI7SUFDQSxLQUFLQyxVQUFMLEdBQWtCRCxPQUFPLENBQUMsWUFBRCxDQUF6QjtJQUNBLEtBQUtFLFVBQUwsR0FBa0IsS0FBS0YsT0FBTCxDQUFhLFlBQWIsQ0FBbEIsQ0FWMkMsQ0FXM0M7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBRUE7SUFDQTtJQUNBOztJQUdBLEtBQUtHLFlBQUwsR0FBb0IsSUFBcEI7SUFDQSxLQUFLQyxVQUFMLEdBQWtCLEdBQWxCO0lBQ0EsS0FBS0MsZ0JBQUwsR0FBd0I7TUFDdEJDLENBQUMsRUFBRSxDQURtQjtNQUV0QkMsQ0FBQyxFQUFFO0lBRm1CLENBQXhCO0lBSUEsS0FBS0MsS0FBTDtJQUNBLEtBQUtDLFdBQUwsR0FBbUIsQ0FBbkI7SUFFQSxLQUFLQyxlQUFMLEdBQXVCLEVBQXZCO0lBQ0EsS0FBS0MsdUJBQUwsR0FBK0IsRUFBL0I7SUFDQSxLQUFLQyxlQUFMLEdBQXVCLENBQXZCO0lBQ0EsS0FBS0MsU0FBTCxHQUFpQixFQUFqQjtJQUNBLEtBQUtDLGFBQUwsR0FBcUIsQ0FDbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQURtQixFQUVuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBRm1CLEVBR25CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FIbUIsRUFJbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQUptQixFQUtuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBTG1CLEVBTW5CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FObUIsRUFPbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQVBtQixFQVFuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBUm1CLEVBU25CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FUbUIsRUFVbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQVZtQixFQVduQixDQUFDLElBQUQsRUFBTyxJQUFQLENBWG1CLEVBWW5CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FabUIsRUFhbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQWJtQixFQWNuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBZG1CLEVBZW5CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FmbUIsRUFnQm5CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FoQm1CLEVBaUJuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBakJtQixFQWtCbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQWxCbUIsQ0FBckI7SUFxQkEsS0FBS0MsS0FBTCxHQUFhLEtBQUtELGFBQUwsQ0FBbUJFLE1BQWhDO0lBQ0EsS0FBS0MsS0FBTDtJQUNBLEtBQUtDLGFBQUwsR0FBcUIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLENBQXJCO0lBRUEsS0FBS0MsWUFBTCxHQUFvQixJQUFJQyxZQUFKLEVBQXBCO0lBQ0EsS0FBS0MsYUFBTCxHQUFxQixFQUFyQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxFQUFiO0lBRUEsS0FBS0MsS0FBTDtJQUNBLEtBQUtDLEtBQUw7SUFFQSxJQUFBQyxvQ0FBQSxFQUE0QjlCLE1BQTVCLEVBQW9DQyxNQUFwQyxFQUE0Q0MsVUFBNUM7RUFDRDs7RUFFVSxNQUFMNkIsS0FBSyxHQUFHO0lBQ1osTUFBTUEsS0FBTjtJQUVBLEtBQUtDLFNBQUwsR0FBaUIsTUFBTSxLQUFLNUIsaUJBQUwsQ0FBdUI2QixJQUF2QixDQUE0QixFQUE1QixFQUNwQixJQURvQixDQUF2Qjs7SUFHQSxLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBS2QsS0FBekIsRUFBZ0NjLENBQUMsRUFBakMsRUFBcUM7TUFDbkM7TUFDQSxLQUFLaEIsU0FBTCxDQUFlaUIsSUFBZixDQUFvQjtRQUFDeEIsQ0FBQyxFQUFFLEtBQUtRLGFBQUwsQ0FBbUJlLENBQW5CLEVBQXNCLENBQXRCLENBQUo7UUFBOEJ0QixDQUFDLEVBQUMsS0FBS08sYUFBTCxDQUFtQmUsQ0FBbkIsRUFBc0IsQ0FBdEI7TUFBaEMsQ0FBcEI7SUFDRDs7SUFFRCxLQUFLRSxLQUFMLENBQVcsS0FBS2xCLFNBQWhCO0lBQ0EsS0FBS0wsS0FBTCxHQUFhLEtBQUt3QixPQUFMLENBQWEsS0FBS2YsS0FBbEIsQ0FBYjtJQUNBLEtBQUtaLGdCQUFMLENBQXNCQyxDQUF0QixHQUEwQixLQUFLVyxLQUFMLENBQVdnQixJQUFyQztJQUNBLEtBQUs1QixnQkFBTCxDQUFzQkUsQ0FBdEIsR0FBMEIsS0FBS1UsS0FBTCxDQUFXaUIsSUFBckM7SUFFQSxLQUFLeEIsZUFBTCxHQUF1QixLQUFLeUIsYUFBTCxDQUFtQixLQUFLOUIsZ0JBQXhCLEVBQTBDLEtBQUtRLFNBQS9DLEVBQTBELEtBQUtELGVBQS9ELENBQXZCLENBaEJZLENBa0JaO0lBQ0E7SUFDQTs7SUFFQSxJQUFJd0IsVUFBVSxHQUFHLEVBQWpCO0lBQ0EsSUFBSUMsSUFBSjs7SUFFQSxLQUFLLElBQUlSLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBS2pCLGVBQXpCLEVBQTBDaUIsQ0FBQyxFQUEzQyxFQUErQztNQUM3QyxLQUFLUCxLQUFMLENBQVdRLElBQVgsQ0FBZ0IsTUFBTSxLQUFLWCxZQUFMLENBQWtCbUIsVUFBbEIsRUFBdEIsRUFENkMsQ0FFN0M7O01BRUEsSUFBSSxLQUFLNUIsZUFBTCxDQUFxQm1CLENBQXJCLElBQTBCLEVBQTlCLEVBQWtDO1FBQ2hDTyxVQUFVLEdBQUcsR0FBYjtNQUNELENBRkQsTUFHSztRQUNIQSxVQUFVLEdBQUcsRUFBYjtNQUNEOztNQUVEQyxJQUFJLEdBQUdELFVBQVUsR0FBRyxLQUFLMUIsZUFBTCxDQUFxQm1CLENBQXJCLENBQWIsR0FBdUMsTUFBOUM7TUFHQSxLQUFLUixhQUFMLENBQW1CUyxJQUFuQixDQUF3QixLQUFLUyxZQUFMLENBQWtCLEtBQUt4QyxpQkFBTCxDQUF1QnlDLElBQXZCLENBQTRCSCxJQUE1QixDQUFsQixFQUFxRFIsQ0FBckQsQ0FBeEI7TUFDQSxLQUFLUCxLQUFMLENBQVdPLENBQVgsRUFBY1ksT0FBZCxDQUFzQixLQUFLdEIsWUFBTCxDQUFrQnVCLFdBQXhDO01BR0EsS0FBS3BCLEtBQUwsQ0FBV08sQ0FBWCxFQUFjYyxJQUFkLENBQW1CQyxjQUFuQixDQUFrQyxHQUFsQyxFQUF1QyxDQUF2QztJQUNELENBNUNXLENBOENaOzs7SUFDQSxLQUFLN0MsaUJBQUwsQ0FBdUI4QyxTQUF2QixDQUFpQyxNQUFNLEtBQUtDLE1BQUwsRUFBdkMsRUEvQ1ksQ0FnRFo7O0lBQ0EsS0FBSzVDLFVBQUwsQ0FBZ0IyQyxTQUFoQixDQUEwQixNQUFNLEtBQUtFLGFBQUwsRUFBaEMsRUFqRFksQ0FtRFo7O0lBQ0EsS0FBS0EsYUFBTCxHQXBEWSxDQXNEWjs7SUFFQSxNQUFNQyxJQUFJLEdBQUcsS0FBSzlDLFVBQUwsQ0FBZ0IrQyxHQUFoQixDQUFvQixVQUFwQixDQUFiLENBeERZLENBd0RrQztJQUM5QztJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFHQTs7SUFDQUMsTUFBTSxDQUFDQyxnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxNQUFNLEtBQUtMLE1BQUwsRUFBeEM7SUFDQSxLQUFLQSxNQUFMO0VBQ0Q7O0VBRURmLEtBQUssQ0FBQ2xCLFNBQUQsRUFBWTtJQUNmLEtBQUtJLEtBQUwsR0FBYTtNQUNYbUMsSUFBSSxFQUFFdkMsU0FBUyxDQUFDLENBQUQsQ0FBVCxDQUFhUCxDQURSO01BRVgrQyxJQUFJLEVBQUV4QyxTQUFTLENBQUMsQ0FBRCxDQUFULENBQWFQLENBRlI7TUFHWDRCLElBQUksRUFBRXJCLFNBQVMsQ0FBQyxDQUFELENBQVQsQ0FBYU4sQ0FIUjtNQUlYK0MsSUFBSSxFQUFFekMsU0FBUyxDQUFDLENBQUQsQ0FBVCxDQUFhTjtJQUpSLENBQWI7O0lBTUEsS0FBSyxJQUFJc0IsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR2hCLFNBQVMsQ0FBQ0csTUFBOUIsRUFBc0NhLENBQUMsRUFBdkMsRUFBMkM7TUFDekMsSUFBSWhCLFNBQVMsQ0FBQ2dCLENBQUQsQ0FBVCxDQUFhdkIsQ0FBYixHQUFpQixLQUFLVyxLQUFMLENBQVdtQyxJQUFoQyxFQUFzQztRQUNwQyxLQUFLbkMsS0FBTCxDQUFXbUMsSUFBWCxHQUFrQnZDLFNBQVMsQ0FBQ2dCLENBQUQsQ0FBVCxDQUFhdkIsQ0FBL0I7TUFDRDs7TUFDRCxJQUFJTyxTQUFTLENBQUNnQixDQUFELENBQVQsQ0FBYXZCLENBQWIsR0FBaUIsS0FBS1csS0FBTCxDQUFXb0MsSUFBaEMsRUFBc0M7UUFDcEMsS0FBS3BDLEtBQUwsQ0FBV29DLElBQVgsR0FBa0J4QyxTQUFTLENBQUNnQixDQUFELENBQVQsQ0FBYXZCLENBQS9CO01BQ0Q7O01BQ0QsSUFBSU8sU0FBUyxDQUFDZ0IsQ0FBRCxDQUFULENBQWF0QixDQUFiLEdBQWlCLEtBQUtVLEtBQUwsQ0FBV2lCLElBQWhDLEVBQXNDO1FBQ3BDLEtBQUtqQixLQUFMLENBQVdpQixJQUFYLEdBQWtCckIsU0FBUyxDQUFDZ0IsQ0FBRCxDQUFULENBQWF0QixDQUEvQjtNQUNEOztNQUNELElBQUlNLFNBQVMsQ0FBQ2dCLENBQUQsQ0FBVCxDQUFhdEIsQ0FBYixHQUFpQixLQUFLVSxLQUFMLENBQVdxQyxJQUFoQyxFQUFzQztRQUNwQyxLQUFLckMsS0FBTCxDQUFXcUMsSUFBWCxHQUFrQnpDLFNBQVMsQ0FBQ2dCLENBQUQsQ0FBVCxDQUFhdEIsQ0FBL0I7TUFDRDtJQUNGOztJQUNELEtBQUtVLEtBQUwsQ0FBV2dCLElBQVgsR0FBa0IsQ0FBQyxLQUFLaEIsS0FBTCxDQUFXb0MsSUFBWCxHQUFrQixLQUFLcEMsS0FBTCxDQUFXbUMsSUFBOUIsSUFBb0MsQ0FBdEQ7SUFDQSxLQUFLbkMsS0FBTCxDQUFXc0MsSUFBWCxHQUFrQixDQUFDLEtBQUt0QyxLQUFMLENBQVdxQyxJQUFYLEdBQWtCLEtBQUtyQyxLQUFMLENBQVdpQixJQUE5QixJQUFvQyxDQUF0RDtJQUNBLEtBQUtqQixLQUFMLENBQVd1QyxNQUFYLEdBQW9CLEtBQUt2QyxLQUFMLENBQVdvQyxJQUFYLEdBQWtCLEtBQUtwQyxLQUFMLENBQVdtQyxJQUFqRDtJQUNBLEtBQUtuQyxLQUFMLENBQVd3QyxNQUFYLEdBQW9CLEtBQUt4QyxLQUFMLENBQVdxQyxJQUFYLEdBQWtCLEtBQUtyQyxLQUFMLENBQVdpQixJQUFqRDtFQUNEOztFQUVERixPQUFPLENBQUMwQixXQUFELEVBQWM7SUFDbkIsSUFBSWxELEtBQUssR0FBRztNQUFDbUQsVUFBVSxFQUFFQyxJQUFJLENBQUNDLEdBQUwsQ0FBU1gsTUFBTSxDQUFDWSxNQUFQLENBQWNDLE1BQWQsR0FBcUJMLFdBQVcsQ0FBQ0YsTUFBMUMsRUFBa0ROLE1BQU0sQ0FBQ1ksTUFBUCxDQUFjRSxLQUFkLEdBQW9CTixXQUFXLENBQUNELE1BQWxGO0lBQWIsQ0FBWjtJQUNBUSxPQUFPLENBQUNDLEdBQVIsQ0FBWTFELEtBQVo7SUFDQSxPQUFRQSxLQUFSO0VBQ0Q7O0VBRUQyRCxnQkFBZ0IsQ0FBQ0MsUUFBRCxFQUFXO0lBQ3pCLElBQUlDLFVBQVUsR0FBRztNQUFDL0QsQ0FBQyxFQUFFOEQsUUFBUSxDQUFDOUQsQ0FBVCxHQUFXLEtBQUtFLEtBQUwsQ0FBV21ELFVBQTFCO01BQXNDcEQsQ0FBQyxFQUFFNkQsUUFBUSxDQUFDN0QsQ0FBVCxHQUFXLEtBQUtDLEtBQUwsQ0FBV21EO0lBQS9ELENBQWpCO0lBQ0EsT0FBUVUsVUFBUjtFQUNEOztFQUVEdEIsYUFBYSxHQUFHO0lBQ2QsTUFBTXVCLGFBQWEsR0FBRyxLQUFLcEUsVUFBTCxDQUFnQitDLEdBQWhCLENBQW9CLGFBQXBCLENBQXRCO0lBQ0EsTUFBTXNCLE1BQU0sR0FBRyxFQUFmO0lBQ0FOLE9BQU8sQ0FBQ0MsR0FBUixDQUFZSSxhQUFaO0lBRUFBLGFBQWEsQ0FBQ0UsUUFBZCxDQUF1QkMsT0FBdkIsQ0FBK0JDLElBQUksSUFBSTtNQUNyQztNQUNBLElBQUlBLElBQUksQ0FBQ0MsSUFBTCxLQUFjLE1BQWxCLEVBQTBCO1FBQ3hCSixNQUFNLENBQUNHLElBQUksQ0FBQ0UsSUFBTixDQUFOLEdBQW9CRixJQUFJLENBQUNHLEdBQXpCO01BQ0Q7SUFDRixDQUxEO0lBT0EsS0FBSzlFLGlCQUFMLENBQXVCNkIsSUFBdkIsQ0FBNEIyQyxNQUE1QixFQUFvQyxJQUFwQztFQUNEOztFQUVEekIsTUFBTSxHQUFHO0lBQ1A7SUFDQUksTUFBTSxDQUFDNEIsb0JBQVAsQ0FBNEIsS0FBS2hGLEtBQWpDO0lBRUEsS0FBS0EsS0FBTCxHQUFhb0QsTUFBTSxDQUFDNkIscUJBQVAsQ0FBNkIsTUFBTTtNQUU5QyxNQUFNQyxPQUFPLEdBQUcsS0FBS2pGLGlCQUFMLENBQXVCa0QsR0FBdkIsQ0FBMkIsU0FBM0IsQ0FBaEI7TUFDQSxNQUFNVCxJQUFJLEdBQUcsS0FBS3pDLGlCQUFMLENBQXVCeUMsSUFBcEMsQ0FIOEMsQ0FJOUM7O01BRUEsSUFBQU0sZUFBQSxFQUFPLElBQUFtQyxhQUFBLENBQUs7QUFDbEI7QUFDQSx1Q0FBdUMsS0FBS3RGLE1BQUwsQ0FBWWdGLElBQUssU0FBUSxLQUFLaEYsTUFBTCxDQUFZdUYsRUFBRztBQUMvRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtRUFBbUUsS0FBS2pFLEtBQUwsQ0FBV29DLElBQUssUUFBTyxLQUFLcEMsS0FBTCxDQUFXbUMsSUFBSyxVQUFTLEtBQUsvQyxnQkFBTCxDQUFzQkMsQ0FBRTtBQUMzSSxtRUFBbUUsS0FBS1csS0FBTCxDQUFXcUMsSUFBSyxRQUFPLEtBQUtyQyxLQUFMLENBQVdpQixJQUFLLFVBQVMsS0FBSzdCLGdCQUFMLENBQXNCRSxDQUFFO0FBQzNJO0FBQ0E7QUFDQSxjQUFjLEtBQUtGLGdCQUFMLENBQXNCQyxDQUFFO0FBQ3RDLGNBQWMsS0FBS0QsZ0JBQUwsQ0FBc0JFLENBQUU7QUFDdEM7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLENBQUMsS0FBS0YsZ0JBQUwsQ0FBc0JDLENBQXRCLEdBQTBCLEtBQUtXLEtBQUwsQ0FBV2dCLElBQXRDLElBQTRDLEtBQUtrRCxPQUFRLE9BQU0sQ0FBQyxLQUFLOUUsZ0JBQUwsQ0FBc0JFLENBQXRCLEdBQTBCLEtBQUtVLEtBQUwsQ0FBV2lCLElBQXRDLElBQTRDLEtBQUtpRCxPQUFRO0FBQ2hKO0FBQ0E7QUFDQSxPQXJCTSxFQXFCRyxLQUFLdEYsVUFyQlIsRUFOOEMsQ0E4QjVDOztNQUVGLElBQUksS0FBS00sWUFBVCxFQUF1QjtRQUNyQjtRQUNBLElBQUlpRixXQUFXLEdBQUdDLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixhQUF4QixDQUFsQjtRQUNBRixXQUFXLENBQUNqQyxnQkFBWixDQUE2QixPQUE3QixFQUFzQyxNQUFNO1VBQzFDLEtBQUtvQyxvQkFBTCxDQUEwQkYsUUFBUSxDQUFDQyxjQUFULENBQXdCLGlCQUF4QixDQUExQjtVQUVBRCxRQUFRLENBQUNDLGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0NFLEtBQWhDLENBQXNDQyxVQUF0QyxHQUFtRCxTQUFuRDtVQUVBLElBQUlDLGNBQWMsR0FBR0wsUUFBUSxDQUFDQyxjQUFULENBQXdCLGdCQUF4QixDQUFyQjtVQUNBLElBQUlLLGNBQWMsR0FBR04sUUFBUSxDQUFDQyxjQUFULENBQXdCLGdCQUF4QixDQUFyQjtVQUVBSSxjQUFjLENBQUN2QyxnQkFBZixDQUFnQyxPQUFoQyxFQUF3QyxNQUFNO1lBQzVDLEtBQUt5QyxnQkFBTCxDQUFzQkYsY0FBdEIsRUFBc0NDLGNBQXRDO1VBQ0QsQ0FGRDtVQUdBQSxjQUFjLENBQUN4QyxnQkFBZixDQUFnQyxPQUFoQyxFQUF3QyxNQUFNO1lBQzVDLEtBQUt5QyxnQkFBTCxDQUFzQkYsY0FBdEIsRUFBc0NDLGNBQXRDO1VBQ0QsQ0FGRDtVQUlBLElBQUlFLE1BQU0sR0FBR1IsUUFBUSxDQUFDQyxjQUFULENBQXdCLFVBQXhCLENBQWI7VUFDQSxJQUFJUSxTQUFTLEdBQUcsS0FBaEI7VUFDQTdCLE9BQU8sQ0FBQ0MsR0FBUixDQUFZaEIsTUFBTSxDQUFDWSxNQUFQLENBQWNFLEtBQTFCO1VBRUE2QixNQUFNLENBQUMxQyxnQkFBUCxDQUF3QixXQUF4QixFQUFzQzRDLEtBQUQsSUFBVztZQUM5Q0QsU0FBUyxHQUFHLElBQVo7WUFDQSxLQUFLdkUsS0FBTCxHQUFhd0UsS0FBSyxDQUFDQyxPQUFuQjtZQUNBLEtBQUt4RSxLQUFMLEdBQWF1RSxLQUFLLENBQUNFLE9BQW5CO1lBQ0EsS0FBS0MsV0FBTCxDQUFpQkgsS0FBakI7VUFDRCxDQUxELEVBS0csS0FMSDtVQU9BRixNQUFNLENBQUMxQyxnQkFBUCxDQUF3QixXQUF4QixFQUFzQzRDLEtBQUQsSUFBVztZQUM5QyxJQUFJRCxTQUFKLEVBQWU7Y0FDYixLQUFLSSxXQUFMLENBQWlCSCxLQUFqQjtZQUNEO1VBQ0YsQ0FKRCxFQUlHLEtBSkg7VUFNQUYsTUFBTSxDQUFDMUMsZ0JBQVAsQ0FBd0IsU0FBeEIsRUFBb0M0QyxLQUFELElBQVc7WUFDNUNELFNBQVMsR0FBRyxLQUFaLENBRDRDLENBRTVDO1lBQ0E7VUFDRCxDQUpELEVBSUcsS0FKSDtRQUtELENBckNEO1FBc0NBLEtBQUszRixZQUFMLEdBQW9CLEtBQXBCO01BQ0QsQ0ExRTZDLENBNEU5QztNQUNBO01BQ0E7TUFFQTtNQUNBO01BRUE7O0lBQ0QsQ0FwRlksQ0FBYjtFQXFGRDs7RUFFRG9GLG9CQUFvQixDQUFDWSxTQUFELEVBQVk7SUFHOUIsS0FBSyxJQUFJdEUsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLakIsZUFBekIsRUFBMENpQixDQUFDLEVBQTNDLEVBQStDO01BQzdDLEtBQUtSLGFBQUwsQ0FBbUJRLENBQW5CLEVBQXNCSCxLQUF0QjtJQUNEOztJQUdELElBQUkwRSxVQUFKO0lBQ0EsS0FBS2pGLFlBQUwsQ0FBa0JrRixNQUFsQixHQVQ4QixDQVU5Qjs7SUFDQSxLQUFLLElBQUl4RSxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtoQixTQUFMLENBQWVHLE1BQW5DLEVBQTJDYSxDQUFDLEVBQTVDLEVBQWdEO01BQzlDdUUsVUFBVSxHQUFHZixRQUFRLENBQUNpQixhQUFULENBQXVCLEtBQXZCLENBQWI7TUFDQUYsVUFBVSxDQUFDbEIsRUFBWCxHQUFnQixXQUFXckQsQ0FBM0IsQ0FGOEMsQ0FHOUM7O01BQ0F1RSxVQUFVLENBQUNHLFNBQVgsR0FBdUIxRSxDQUF2QjtNQUNBdUUsVUFBVSxDQUFDWixLQUFYLEdBQW1CLHlHQUFuQjtNQUNBWSxVQUFVLENBQUNaLEtBQVgsQ0FBaUJnQixTQUFqQixHQUE2QixlQUFnQixDQUFDLEtBQUszRixTQUFMLENBQWVnQixDQUFmLEVBQWtCdkIsQ0FBbEIsR0FBc0IsS0FBS1csS0FBTCxDQUFXZ0IsSUFBbEMsSUFBd0MsS0FBS2tELE9BQTdELEdBQXdFLE1BQXhFLEdBQWtGLENBQUMsS0FBS3RFLFNBQUwsQ0FBZWdCLENBQWYsRUFBa0J0QixDQUFsQixHQUFzQixLQUFLVSxLQUFMLENBQVdpQixJQUFsQyxJQUF3QyxLQUFLaUQsT0FBL0gsR0FBMEksS0FBdks7TUFDQWdCLFNBQVMsQ0FBQ00sV0FBVixDQUFzQkwsVUFBdEI7SUFDRDtFQUNGOztFQUVEUixnQkFBZ0IsQ0FBQ2MsTUFBRCxFQUFTQyxNQUFULEVBQWlCO0lBQy9CO0lBQ0EsS0FBS3RHLGdCQUFMLENBQXNCQyxDQUF0QixHQUEwQm9HLE1BQU0sQ0FBQ0UsS0FBakM7SUFDQSxLQUFLdkcsZ0JBQUwsQ0FBc0JFLENBQXRCLEdBQTBCb0csTUFBTSxDQUFDQyxLQUFqQztJQUVBLElBQUl4RSxVQUFVLEdBQUcsRUFBakI7SUFDQSxJQUFJQyxJQUFKO0lBRUEsS0FBSzFCLHVCQUFMLEdBQStCLEtBQUtELGVBQXBDO0lBQ0EsS0FBS0QsV0FBTCxHQUFtQixDQUFuQjtJQUNBLEtBQUtDLGVBQUwsR0FBdUIsS0FBS3lCLGFBQUwsQ0FBbUIsS0FBSzlCLGdCQUF4QixFQUEwQyxLQUFLUSxTQUEvQyxFQUEwRCxLQUFLRCxlQUEvRCxDQUF2QixDQVYrQixDQVcvQjs7SUFDQSxLQUFLLElBQUlpQixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtqQixlQUF6QixFQUEwQ2lCLENBQUMsRUFBM0MsRUFBK0M7TUFDN0M7TUFDQSxJQUFJLEtBQUtsQix1QkFBTCxDQUE2QmtCLENBQTdCLEtBQW1DLEtBQUtuQixlQUFMLENBQXFCbUIsQ0FBckIsQ0FBdkMsRUFBZ0U7UUFDOUQsSUFBSSxLQUFLZ0YsS0FBTCxDQUFXLEtBQUtsRyx1QkFBTCxDQUE2QmtCLENBQTdCLENBQVgsRUFBNEMsS0FBS25CLGVBQWpELENBQUosRUFBdUU7VUFDckUyRSxRQUFRLENBQUNDLGNBQVQsQ0FBd0IsV0FBVyxLQUFLM0UsdUJBQUwsQ0FBNkJrQixDQUE3QixDQUFuQyxFQUFvRTJELEtBQXBFLENBQTBFc0IsVUFBMUUsR0FBdUYsTUFBdkY7UUFDRDs7UUFFRCxLQUFLekYsYUFBTCxDQUFtQlEsQ0FBbkIsRUFBc0JrRixJQUF0QjtRQUNBLEtBQUsxRixhQUFMLENBQW1CUSxDQUFuQixFQUFzQm1GLFVBQXRCLENBQWlDLEtBQUsxRixLQUFMLENBQVdPLENBQVgsQ0FBakM7O1FBRUEsSUFBSSxLQUFLbkIsZUFBTCxDQUFxQm1CLENBQXJCLElBQTBCLEVBQTlCLEVBQWtDO1VBQ2hDTyxVQUFVLEdBQUcsR0FBYjtRQUNELENBRkQsTUFHSztVQUNIQSxVQUFVLEdBQUcsRUFBYjtRQUNEOztRQUVEQyxJQUFJLEdBQUdELFVBQVUsR0FBRyxLQUFLMUIsZUFBTCxDQUFxQm1CLENBQXJCLENBQWIsR0FBdUMsTUFBOUM7UUFFQSxLQUFLUixhQUFMLENBQW1CUSxDQUFuQixJQUF3QixLQUFLVSxZQUFMLENBQWtCLEtBQUt4QyxpQkFBTCxDQUF1QnlDLElBQXZCLENBQTRCSCxJQUE1QixDQUFsQixFQUFxRFIsQ0FBckQsQ0FBeEI7UUFDQSxLQUFLUixhQUFMLENBQW1CUSxDQUFuQixFQUFzQkgsS0FBdEIsR0FsQjhELENBbUI5RDtNQUNEOztNQUNEMkQsUUFBUSxDQUFDQyxjQUFULENBQXdCLFdBQVcsS0FBSzVFLGVBQUwsQ0FBcUJtQixDQUFyQixDQUFuQyxFQUE0RDJELEtBQTVELENBQWtFc0IsVUFBbEUsR0FBK0UsWUFBWSxPQUFLLElBQUUsSUFBRSxLQUFLNUYsYUFBTCxDQUFtQlcsQ0FBbkIsQ0FBRixHQUF3QixLQUFLcEIsV0FBcEMsQ0FBWixHQUErRCxNQUE5STtJQUNEOztJQUNELEtBQUtxQyxNQUFMO0VBQ0Q7O0VBRURtRSxjQUFjLENBQUNQLE1BQUQsRUFBU0MsTUFBVCxFQUFpQjtJQUM3QjtJQUVBLElBQUl2RSxVQUFVLEdBQUcsRUFBakI7SUFDQSxJQUFJQyxJQUFKO0lBRUEsS0FBSzFCLHVCQUFMLEdBQStCLEtBQUtELGVBQXBDO0lBQ0EsS0FBS0QsV0FBTCxHQUFtQixDQUFuQjtJQUNBLEtBQUtDLGVBQUwsR0FBdUIsS0FBS3lCLGFBQUwsQ0FBbUIsS0FBSzlCLGdCQUF4QixFQUEwQyxLQUFLUSxTQUEvQyxFQUEwRCxLQUFLRCxlQUEvRCxDQUF2QixDQVI2QixDQVM3Qjs7SUFDQSxLQUFLLElBQUlpQixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtqQixlQUF6QixFQUEwQ2lCLENBQUMsRUFBM0MsRUFBK0M7TUFDN0M7TUFDQSxJQUFJLEtBQUtsQix1QkFBTCxDQUE2QmtCLENBQTdCLEtBQW1DLEtBQUtuQixlQUFMLENBQXFCbUIsQ0FBckIsQ0FBdkMsRUFBZ0U7UUFDOUQsSUFBSSxLQUFLZ0YsS0FBTCxDQUFXLEtBQUtsRyx1QkFBTCxDQUE2QmtCLENBQTdCLENBQVgsRUFBNEMsS0FBS25CLGVBQWpELENBQUosRUFBdUU7VUFDckUyRSxRQUFRLENBQUNDLGNBQVQsQ0FBd0IsV0FBVyxLQUFLM0UsdUJBQUwsQ0FBNkJrQixDQUE3QixDQUFuQyxFQUFvRTJELEtBQXBFLENBQTBFc0IsVUFBMUUsR0FBdUYsTUFBdkY7UUFDRDs7UUFFRCxLQUFLekYsYUFBTCxDQUFtQlEsQ0FBbkIsRUFBc0JrRixJQUF0QjtRQUNBLEtBQUsxRixhQUFMLENBQW1CUSxDQUFuQixFQUFzQm1GLFVBQXRCLENBQWlDLEtBQUsxRixLQUFMLENBQVdPLENBQVgsQ0FBakM7O1FBRUEsSUFBSSxLQUFLbkIsZUFBTCxDQUFxQm1CLENBQXJCLElBQTBCLEVBQTlCLEVBQWtDO1VBQ2hDTyxVQUFVLEdBQUcsR0FBYjtRQUNELENBRkQsTUFHSztVQUNIQSxVQUFVLEdBQUcsRUFBYjtRQUNEOztRQUVEQyxJQUFJLEdBQUdELFVBQVUsR0FBRyxLQUFLMUIsZUFBTCxDQUFxQm1CLENBQXJCLENBQWIsR0FBdUMsTUFBOUM7UUFFQSxLQUFLUixhQUFMLENBQW1CUSxDQUFuQixJQUF3QixLQUFLVSxZQUFMLENBQWtCLEtBQUt4QyxpQkFBTCxDQUF1QnlDLElBQXZCLENBQTRCSCxJQUE1QixDQUFsQixFQUFxRFIsQ0FBckQsQ0FBeEI7UUFDQSxLQUFLUixhQUFMLENBQW1CUSxDQUFuQixFQUFzQkgsS0FBdEIsR0FsQjhELENBbUI5RDtNQUNEOztNQUNEMkQsUUFBUSxDQUFDQyxjQUFULENBQXdCLFdBQVcsS0FBSzVFLGVBQUwsQ0FBcUJtQixDQUFyQixDQUFuQyxFQUE0RDJELEtBQTVELENBQWtFc0IsVUFBbEUsR0FBK0UsWUFBWSxPQUFLLElBQUUsSUFBRSxLQUFLNUYsYUFBTCxDQUFtQlcsQ0FBbkIsQ0FBRixHQUF3QixLQUFLcEIsV0FBcEMsQ0FBWixHQUErRCxNQUE5STtJQUNEOztJQUNELEtBQUtxQyxNQUFMO0VBQ0Q7O0VBRURvRCxXQUFXLENBQUNILEtBQUQsRUFBUTtJQUVqQjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E5QixPQUFPLENBQUNDLEdBQVIsQ0FBWSxLQUFLakQsS0FBTCxDQUFXaUIsSUFBWCxHQUFrQixDQUFDNkQsS0FBSyxDQUFDRSxPQUFOLEdBQWdCL0MsTUFBTSxDQUFDWSxNQUFQLENBQWNDLE1BQWQsR0FBcUIsQ0FBdEMsSUFBMEMsS0FBS29CLE9BQTdFO0lBQ0FsQixPQUFPLENBQUNDLEdBQVIsQ0FBWSxDQUFDNkIsS0FBSyxDQUFDRSxPQUFOLEdBQWdCLEtBQUt6RSxLQUF0QixJQUE4QixLQUFLMkQsT0FBL0MsRUFYaUIsQ0FhakI7SUFDQTs7SUFFQUUsUUFBUSxDQUFDQyxjQUFULENBQXdCLFVBQXhCLEVBQW9DRSxLQUFwQyxDQUEwQ2dCLFNBQTFDLEdBQXNELGdCQUFnQixDQUFDLEtBQUtuRyxnQkFBTCxDQUFzQkMsQ0FBdEIsR0FBMEIsS0FBS1csS0FBTCxDQUFXZ0IsSUFBdEMsSUFBNEMsS0FBS2tELE9BQWpELEdBQTJEWSxLQUFLLENBQUNDLE9BQWpFLEdBQTJFLEtBQUt6RSxLQUFoRyxJQUF5RyxNQUF6RyxJQUFtSCxDQUFDLEtBQUtsQixnQkFBTCxDQUFzQkUsQ0FBdEIsR0FBMEIsS0FBS1UsS0FBTCxDQUFXaUIsSUFBdEMsSUFBNEMsS0FBS2lELE9BQWpELEdBQTJEWSxLQUFLLENBQUNFLE9BQWpFLEdBQTJFLEtBQUt6RSxLQUFuTSxJQUEyTSxtQkFBalEsQ0FoQmlCLENBaUJqQjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7RUFDRDs7RUFFRFcsYUFBYSxDQUFDOUIsZ0JBQUQsRUFBbUI2RyxXQUFuQixFQUFnQ0MsU0FBaEMsRUFBMkM7SUFDdEQsSUFBSUMsVUFBVSxHQUFHLEVBQWpCO0lBQ0EsSUFBSUMsZ0JBQUo7O0lBQ0EsS0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHSCxTQUFwQixFQUErQkcsQ0FBQyxFQUFoQyxFQUFvQztNQUNsQ0QsZ0JBQWdCLEdBQUdFLFNBQW5COztNQUNBLEtBQUssSUFBSTFGLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUdxRixXQUFXLENBQUNsRyxNQUFoQyxFQUF3Q2EsQ0FBQyxFQUF6QyxFQUE2QztRQUM3QztRQUNFLElBQUksS0FBS2dGLEtBQUwsQ0FBV2hGLENBQVgsRUFBY3VGLFVBQWQsS0FBNkIsS0FBS0ksUUFBTCxDQUFjbkgsZ0JBQWQsRUFBZ0M2RyxXQUFXLENBQUNyRixDQUFELENBQTNDLElBQWtELEtBQUsyRixRQUFMLENBQWNuSCxnQkFBZCxFQUFnQzZHLFdBQVcsQ0FBQ0csZ0JBQUQsQ0FBM0MsQ0FBbkYsRUFBbUo7VUFDakpBLGdCQUFnQixHQUFHeEYsQ0FBbkI7UUFDRDtNQUNGOztNQUNELEtBQUtYLGFBQUwsQ0FBbUJvRyxDQUFuQixJQUF3QixLQUFLRSxRQUFMLENBQWNuSCxnQkFBZCxFQUFnQzZHLFdBQVcsQ0FBQ0csZ0JBQUQsQ0FBM0MsQ0FBeEI7TUFDQSxLQUFLNUcsV0FBTCxJQUFvQixLQUFLUyxhQUFMLENBQW1Cb0csQ0FBbkIsQ0FBcEI7TUFDQUYsVUFBVSxDQUFDdEYsSUFBWCxDQUFnQnVGLGdCQUFoQixFQVZrQyxDQVdsQztJQUNEOztJQUNELE9BQVFELFVBQVI7RUFDRDs7RUFFRFAsS0FBSyxDQUFDWSxPQUFELEVBQVVDLFNBQVYsRUFBcUI7SUFDeEIsSUFBSUMsUUFBUSxHQUFHLENBQWY7O0lBQ0EsT0FBT0EsUUFBUSxHQUFHRCxTQUFTLENBQUMxRyxNQUFyQixJQUErQnlHLE9BQU8sSUFBSUMsU0FBUyxDQUFDQyxRQUFELENBQTFELEVBQXNFO01BQ3BFQSxRQUFRLElBQUksQ0FBWjtJQUNEOztJQUNELE9BQU9BLFFBQVEsSUFBSUQsU0FBUyxDQUFDMUcsTUFBN0I7RUFDRDs7RUFFRHdHLFFBQVEsQ0FBQ0ksTUFBRCxFQUFTQyxNQUFULEVBQWlCO0lBQ3ZCO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQSxJQUFJQSxNQUFNLElBQUlOLFNBQWQsRUFBeUI7TUFDdkIsT0FBUTNELElBQUksQ0FBQ2tFLElBQUwsQ0FBVWxFLElBQUksQ0FBQ21FLEdBQUwsQ0FBU0gsTUFBTSxDQUFDdEgsQ0FBUCxHQUFXdUgsTUFBTSxDQUFDdkgsQ0FBM0IsRUFBOEIsQ0FBOUIsSUFBbUNzRCxJQUFJLENBQUNtRSxHQUFMLENBQVNILE1BQU0sQ0FBQ3JILENBQVAsR0FBV3NILE1BQU0sQ0FBQ3RILENBQTNCLEVBQThCLENBQTlCLENBQTdDLENBQVI7SUFDRCxDQUZELE1BR0s7TUFDSCxPQUFReUgsUUFBUjtJQUNEO0VBQ0Y7O0VBRUR6RixZQUFZLENBQUMwRixNQUFELEVBQVNDLEtBQVQsRUFBZ0I7SUFDMUI7SUFDQTtJQUNBLElBQUlDLEtBQUssR0FBRyxLQUFLaEgsWUFBTCxDQUFrQmlILGtCQUFsQixFQUFaO0lBQ0FELEtBQUssQ0FBQ0UsSUFBTixHQUFhLElBQWI7SUFDQUYsS0FBSyxDQUFDRixNQUFOLEdBQWVBLE1BQWY7SUFDQUUsS0FBSyxDQUFDMUYsT0FBTixDQUFjLEtBQUtuQixLQUFMLENBQVc0RyxLQUFYLENBQWQ7SUFDQSxPQUFPQyxLQUFQO0VBQ0Q7O0FBeGQrQzs7ZUEyZG5DM0ksZ0IifQ==