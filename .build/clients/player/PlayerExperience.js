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
    this.beginPressed = false;
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
    this.circleSize = 20;
    this.tempX;
    this.tempY;
    this.mouseDown = false;
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

    window.addEventListener('resize', () => {
      console.log(window.innerHeight);
      this.scale = this.Scaling(this.range);

      if (this.beginPressed) {
        this.UpdateContainer();
      }

      this.render();
    });
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
      VPos2Pixel: Math.min((window.innerWidth - this.circleSize) / rangeValues.rangeX, (window.innerHeight - this.circleSize) / rangeValues.rangeY)
    };
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
              height: ${this.range.rangeY * this.scale.VPos2Pixel}px;
              width: ${this.range.rangeX * this.scale.VPos2Pixel}px;
              background: yellow; z-index: 0;
              transform: translate(${-this.range.rangeX * this.scale.VPos2Pixel / 2}px, ${this.circleSize / 2}px);">
            </div>
            <div id="listener" style="position: absolute; height: 16px; width: 16px; background: blue; text-align: center; z-index: 1;
              transform: translate(${(this.listenerPosition.x - this.range.moyX) * this.scale.VPos2Pixel}px, ${(this.listenerPosition.y - this.range.minY) * this.scale.VPos2Pixel}px) rotate(45deg)";>
          </div>
        </div>
      `, this.$container); //<p>add or remove .wav or .mp3 files in the "soundbank" directory and observe the changes:</p>${Object.keys(data).map(key => {return html`<p>- "${key}" loaded: ${data[key]}.</p>`;})}

      if (this.initialising) {
        // Assign callbacks once
        var beginButton = document.getElementById("beginButton");
        beginButton.addEventListener("click", () => {
          this.onBeginButtonClicked(document.getElementById('circleContainer'));
          document.getElementById("begin").style.visibility = "hidden";
          document.getElementById("begin").style.position = "absolute";
          document.getElementById("game").style.visibility = "visible";
          var positionInput1 = document.getElementById("positionInput1");
          var positionInput2 = document.getElementById("positionInput2"); // positionInput1.addEventListener("input",() => {
          //   this.onPositionChange(positionInput1, positionInput2);
          // })
          // positionInput2.addEventListener("input",() => {
          //   this.onPositionChange(positionInput1, positionInput2);
          // })

          var canvas = document.getElementById('circleContainer');
          console.log(window.screen.width);
          canvas.addEventListener("mousedown", mouse => {
            this.mouseDown = true;
            this.tempX = mouse.clientX;
            this.tempY = mouse.clientY;
            this.mouseAction(mouse);
          }, false);
          canvas.addEventListener("mousemove", mouse => {
            if (this.mouseDown) {
              this.mouseAction(mouse);
            }
          }, false);
          canvas.addEventListener("mouseup", mouse => {
            this.mouseDown = false; // this.listenerPosition.x = this;
            // this.listenerPosition.y = mouse.clientY;
          }, false);
          this.beginPressed = true;
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
      tempCircle.style = "position: absolute; margin: 0 -10px; width: " + this.circleSize + "px; height: " + this.circleSize + "px; border-radius:" + this.circleSize + "px; line-height: " + this.circleSize + "px; background: grey;";
      tempCircle.style.transform = "translate(" + (this.positions[i].x - this.range.moyX) * this.scale.VPos2Pixel + "px, " + (this.positions[i].y - this.range.minY) * this.scale.VPos2Pixel + "px)";
      container.appendChild(tempCircle);
    }
  }

  UpdateContainer() {
    document.getElementById("circleContainer").height = this.range.rangeY * this.scale.VPos2Pixel + "px";
    document.getElementById("circleContainer").width = this.range.rangeX * this.scale.VPos2Pixel + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.circleSize / 2 - this.range.rangeX * this.scale.VPos2Pixel / 2) + "px, 10px);"; // document.getElementById("circleContainer").style.transform = "translateX(" + (-2*this.range.rangeX*this.scale.VPos2Pixel) + "px)";

    this.UpdateListener();
    this.UpdateSourcesPosition();
  }

  UpdateListener() {
    document.getElementById("listener").style.transform = "translate(" + ((this.listenerPosition.x - this.range.moyX) * this.scale.VPos2Pixel - this.circleSize / 2) + "px, " + (this.listenerPosition.y - this.range.minY) * this.scale.VPos2Pixel + "px) rotate(45deg)";
    this.PositionChanged();
  }

  UpdateSourcesPosition() {
    for (let i = 0; i < this.positions.length; i++) {
      document.getElementById("circle" + i).style.transform = "translate(" + (this.positions[i].x - this.range.moyX) * this.scale.VPos2Pixel + "px, " + (this.positions[i].y - this.range.minY) * this.scale.VPos2Pixel + "px)";
    }
  }

  UpdateSourcesSound(index) {
    var sourceValue = 1 - 2 * this.distanceValue[index] / this.distanceSum;
    document.getElementById("circle" + this.ClosestPointsId[index]).style.background = "rgb(0, " + 255 * sourceValue + ", 0)";
    this.gains[index].gain.setValueAtTime(sourceValue, 0);
  }

  PositionChanged() {
    var tempPrefix = "";
    var file;
    this.previousClosestPointsId = this.ClosestPointsId;
    this.distanceSum = 0;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);

    for (let i = 0; i < this.nbClosestPoints; i++) {
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
        console.log(this.audioBufferLoader.data);
        this.playingSounds[i] = this.LoadNewSound(this.audioBufferLoader.data[file], i);
        this.playingSounds[i].start(); // console.log(this.playingSounds[i])
        // console.log(this.playingSounds[i])
      }

      this.UpdateSourcesSound(i);
    }
  }

  mouseAction(mouse) {
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale.VPos2Pixel;
    var tempY = this.range.minY + (mouse.clientY - this.circleSize / 2) / this.scale.VPos2Pixel;

    if (tempX >= this.range.minX && tempX <= this.range.maxX && tempY >= this.range.minY && tempY <= this.range.maxY) {
      this.listenerPosition.x = this.range.moyX + (mouse.clientX - window.innerWidth / 2) / this.scale.VPos2Pixel;
      this.listenerPosition.y = this.range.minY + (mouse.clientY - this.circleSize / 2) / this.scale.VPos2Pixel;
      this.UpdateListener();
    } else {
      this.mouseDown = false;
    }
  }

  ClosestSource(listenerPosition, listOfPoint, nbClosest) {
    var closestIds = [];
    var currentClosestId;

    for (let j = 0; j < nbClosest; j++) {
      currentClosestId = undefined;

      for (let i = 0; i < listOfPoint.length; i++) {
        if (this.NotIn(i, closestIds) && this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[currentClosestId])) {
          currentClosestId = i;
        }
      }

      this.distanceValue[j] = this.Distance(listenerPosition, listOfPoint[currentClosestId]);
      this.distanceSum += this.distanceValue[j];
      closestIds.push(currentClosestId);
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
    if (pointB != undefined) {
      return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
    } else {
      return Infinity;
    }
  }

  LoadNewSound(buffer, index) {
    // Sound initialisation
    var sound = this.audioContext.createBufferSource();
    sound.loop = true; // console.log(buffer)

    sound.buffer = buffer;
    sound.connect(this.gains[index]); // console.log(sound)

    return sound;
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsInBpeGVsU2NhbGUiLCJsaXN0ZW5lclBvc2l0aW9uIiwieCIsInkiLCJzY2FsZSIsImRpc3RhbmNlU3VtIiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJ0cnVlUG9zaXRpb25zIiwibmJQb3MiLCJsZW5ndGgiLCJyYW5nZSIsImRpc3RhbmNlVmFsdWUiLCJhdWRpb0NvbnRleHQiLCJBdWRpb0NvbnRleHQiLCJwbGF5aW5nU291bmRzIiwiZ2FpbnMiLCJjaXJjbGVTaXplIiwidGVtcFgiLCJ0ZW1wWSIsIm1vdXNlRG93biIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0Iiwic291bmRCYW5rIiwibG9hZCIsImkiLCJwdXNoIiwiUmFuZ2UiLCJTY2FsaW5nIiwibW95WCIsIm1pblkiLCJDbG9zZXN0U291cmNlIiwidGVtcFByZWZpeCIsImZpbGUiLCJjcmVhdGVHYWluIiwiTG9hZE5ld1NvdW5kIiwiZGF0YSIsImNvbm5lY3QiLCJkZXN0aW5hdGlvbiIsImdhaW4iLCJzZXRWYWx1ZUF0VGltZSIsInN1YnNjcmliZSIsInJlbmRlciIsImxvYWRTb3VuZGJhbmsiLCJUcmVlIiwiZ2V0Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImNvbnNvbGUiLCJsb2ciLCJpbm5lckhlaWdodCIsIlVwZGF0ZUNvbnRhaW5lciIsIm1pblgiLCJtYXhYIiwibWF4WSIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIlZQb3MyUGl4ZWwiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsIlZpcnR1YWxQb3MyUGl4ZWwiLCJwb3NpdGlvbiIsInBpeGVsQ29vcmQiLCJzb3VuZGJhbmtUcmVlIiwiZGVmT2JqIiwiY2hpbGRyZW4iLCJmb3JFYWNoIiwibGVhZiIsInR5cGUiLCJuYW1lIiwidXJsIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiaHRtbCIsImlkIiwiYmVnaW5CdXR0b24iLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbklucHV0MSIsInBvc2l0aW9uSW5wdXQyIiwiY2FudmFzIiwic2NyZWVuIiwid2lkdGgiLCJtb3VzZSIsImNsaWVudFgiLCJjbGllbnRZIiwibW91c2VBY3Rpb24iLCJjb250YWluZXIiLCJ0ZW1wQ2lyY2xlIiwicmVzdW1lIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwiaGVpZ2h0IiwiVXBkYXRlTGlzdGVuZXIiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJQb3NpdGlvbkNoYW5nZWQiLCJVcGRhdGVTb3VyY2VzU291bmQiLCJpbmRleCIsInNvdXJjZVZhbHVlIiwiYmFja2dyb3VuZCIsIk5vdEluIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJsaXN0T2ZQb2ludCIsIm5iQ2xvc2VzdCIsImNsb3Nlc3RJZHMiLCJjdXJyZW50Q2xvc2VzdElkIiwiaiIsInVuZGVmaW5lZCIsIkRpc3RhbmNlIiwicG9pbnRJZCIsImxpc3RPZklkcyIsIml0ZXJhdG9yIiwicG9pbnRBIiwicG9pbnRCIiwic3FydCIsInBvdyIsIkluZmluaXR5IiwiYnVmZmVyIiwic291bmQiLCJjcmVhdGVCdWZmZXJTb3VyY2UiLCJsb29wIl0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IE1hcmtlciBmcm9tICcuL01hcmtlci5qcyc7XG4vLyBpbXBvcnQgU2NlbmUgZnJvbSAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cy9zY2VuZS5qc29uJztcblxuLy8gaW1wb3J0IFBvc2l0aW9ucyBmcm9tICcuL3NjZW5lLmpzb24nXG4vLyBpbXBvcnQgZnM1IGZyb20gXCJmc1wiO1xuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7XG4gICAgdGhpcy5hbWJpc29uaWNzID0gcmVxdWlyZSgnYW1iaXNvbmljcycpO1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCkpXG4gICAgLy8gY29uc3QgdHJlZXMgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCk7XG4gICAgLy8gZm9yIChsZXQgbmFtZSBpbiB0cmVlcykge1xuICAgIC8vICAgY29uc3QgdHJlZSA9IHRyZWVbbmFtZV07XG4gICAgLy8gICBjb25zb2xlLmxvZyhuYW1lLCB0cmVlKTtcbiAgICAvLyB9XG4gICAgLy8gdGhpcy5wYXRoID0gcmVxdWlyZShcInBhdGhcIilcbiAgICAvLyB0aGlzLmZzID0gdGhpcy5yZXF1aXJlKCdmcycpXG5cbiAgICAvLyBjb25zdCBlbnZDb25maWdQYXRoID0gJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvYXNzZXRzL3NjZW5lLmpzb24nXG4gICAgLy8gdmFyIGVudkNvbmZpZyA9IEpTT041LnBhcnNlKGZzLnJlYWRGaWxlU3luYyhlbnZDb25maWdQYXRoLCAndXRmLTgnKSk7XG4gICAgLy8gY29uc29sZS5sb2coZW52Q29uZmlnKVxuXG5cbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLnBpeGVsU2NhbGUgPSAyMDA7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDAsXG4gICAgfVxuICAgIHRoaXMuc2NhbGU7XG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7XG5cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdO1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTtcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7XG4gICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLnRydWVQb3NpdGlvbnMgPSBbXG4gICAgICBbMzEuMCwgNDEuNV0sXG4gICAgICBbMzEuMCwgMzkuMF0sXG4gICAgICBbMzEuMCwgMzYuMl0sXG4gICAgICBbMzQuNSwgMzYuMl0sXG4gICAgICBbMzYuOCwgMzYuMl0sXG4gICAgICBbMzYuOCwgMzMuNl0sXG4gICAgICBbMzQuNSwgMzMuNl0sXG4gICAgICBbMzEuMCwgMzMuNl0sXG4gICAgICBbMzEuMCwgMzEuMF0sXG4gICAgICBbMzQuNSwgMzEuMF0sXG4gICAgICBbMzQuNSwgMjguMF0sXG4gICAgICBbMzEuMCwgMjguMF0sXG4gICAgICBbMzEuMCwgMjUuOF0sXG4gICAgICBbMzQuNSwgMjUuOF0sXG4gICAgICBbMzYuOCwgMjUuOF0sXG4gICAgICBbMzYuOCwgMjMuNl0sXG4gICAgICBbMzQuNSwgMjMuNl0sXG4gICAgICBbMzEuMCwgMjMuNl0sXG4gICAgXVxuXG4gICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XG4gICAgdGhpcy5yYW5nZTtcbiAgICB0aGlzLmRpc3RhbmNlVmFsdWUgPSBbMCwgMCwgMCwgMF07XG5cbiAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICB0aGlzLnBsYXlpbmdTb3VuZHMgPSBbXTtcbiAgICB0aGlzLmdhaW5zID0gW107XG4gICAgdGhpcy5jaXJjbGVTaXplID0gMjA7XG4gICAgdGhpcy50ZW1wWDtcbiAgICB0aGlzLnRlbXBZO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2VcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgdGhpcy5zb3VuZEJhbmsgPSBhd2FpdCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmxvYWQoe1xuICAgIH0sIHRydWUpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcbiAgICAgIC8vIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSoxMDAwIC0gNTAwKSwgeTogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjUwMCl9KTtcbiAgICAgIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IHRoaXMudHJ1ZVBvc2l0aW9uc1tpXVswXSwgeTp0aGlzLnRydWVQb3NpdGlvbnNbaV1bMV19KTtcbiAgICB9XG5cbiAgICB0aGlzLlJhbmdlKHRoaXMucG9zaXRpb25zKTtcbiAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdGhpcy5yYW5nZS5tb3lYO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpXG5cbiAgICAvLyAkLmdldChcImRhdGEuanNvblwiLCBmdW5jdGlvbihkYXRhKXtcbiAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAvLyB9KTtcblxuICAgIHZhciB0ZW1wUHJlZml4ID0gXCJcIjtcbiAgICB2YXIgZmlsZTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgdGhpcy5nYWlucy5wdXNoKGF3YWl0IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmdhaW5zKVxuXG4gICAgICBpZiAodGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gPCAxMCkge1xuICAgICAgICB0ZW1wUHJlZml4ID0gXCIwXCI7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGVtcFByZWZpeCA9IFwiXCI7XG4gICAgICB9XG5cbiAgICAgIGZpbGUgPSB0ZW1wUHJlZml4ICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gKyBcIi53YXZcIjtcblxuXG4gICAgICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbZmlsZV0sIGkpKTtcbiAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cblxuICAgICAgdGhpcy5nYWluc1tpXS5nYWluLnNldFZhbHVlQXRUaW1lKDAuNSwgMCk7XG4gICAgfVxuXG4gICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIC8vIHN1YnNjcmliZSB0byBkaXNwbGF5IGxvYWRpbmcgc3RhdGVcbiAgICB0aGlzLmZpbGVzeXN0ZW0uc3Vic2NyaWJlKCgpID0+IHRoaXMubG9hZFNvdW5kYmFuaygpKTtcblxuICAgIC8vIGluaXQgd2l0aCBjdXJyZW50IGNvbnRlbnRcbiAgICB0aGlzLmxvYWRTb3VuZGJhbmsoKTtcblxuICAgIC8vIHRoaXMuZnMgPSByZXF1aXJlKCdmaWxlLXN5c3RlbScpXG5cbiAgICBjb25zdCBUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCgnUG9zaXRpb24nKTsgLy8vLy8vLy8gw6dhIG1hcmNoZSBwYXMgKGltcG9zc2liaWxlIGQndXRpbGlzZXIgZnMsIG5lIHRyb3V2ZSBwYXMgbGUgcGF0aC4uLilcbiAgICAvLyBUcmVlLmNoaWxkcmVuLmZvckVhY2gobGVhZiA9PiB7XG4gICAgLy8gICAvLyBjb25zb2xlLmxvZyhsZWFmKVxuICAgIC8vICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKGxlYWYpXG4gICAgLy8gICAgIGlmIChsZWFmLmV4dGVuc2lvbiA9PT0gJy5qc29uJykge1xuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKGxlYWYudXJsKVxuICAgIC8vICAgICAgIGNvbnNvbGUubG9nKEpTT04ucGFyc2UoJy4vc2NlbmUuanNvbicpKVxuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT041LnBhcnNlKHRoaXMuZmlsZXN5c3RlbS5yZWFkRmlsZVN5bmMobGVhZi51cmwsICd1dGYtOCcpKSk7XG4gICAgLy8gICAgICAgLy8gbGV0IGEgPSByZXF1aXJlKGxlYWYucGF0aClcbiAgICAvLyAgICAgICBsZXQgYiA9IHJlcXVpcmUoJy4vc2NlbmUuanNvbicpXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYSk7XG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYik7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcblxuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5wb3NpdGlvbnMpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKHdpbmRvdy5pbm5lckhlaWdodClcbiAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG4gICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIFJhbmdlKHBvc2l0aW9ucykge1xuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yXG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMlxuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykge1xuICAgIHZhciBzY2FsZSA9IHtWUG9zMlBpeGVsOiBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLmNpcmNsZVNpemUpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMuY2lyY2xlU2l6ZSkvcmFuZ2VWYWx1ZXMucmFuZ2VZKX07XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICBWaXJ0dWFsUG9zMlBpeGVsKHBvc2l0aW9uKSB7XG4gICAgdmFyIHBpeGVsQ29vcmQgPSB7eDogcG9zaXRpb24ueCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwsIHk6IHBvc2l0aW9uLnkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfTtcbiAgICByZXR1cm4gKHBpeGVsQ29vcmQpO1xuICB9XG5cbiAgbG9hZFNvdW5kYmFuaygpIHtcbiAgICBjb25zdCBzb3VuZGJhbmtUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCgnQXVkaW9GaWxlczAnKTtcbiAgICBjb25zdCBkZWZPYmogPSB7fTtcbiAgICBjb25zb2xlLmxvZyhzb3VuZGJhbmtUcmVlKVxuXG4gICAgc291bmRiYW5rVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2cobGVhZilcbiAgICAgIGlmIChsZWFmLnR5cGUgPT09ICdmaWxlJykge1xuICAgICAgICBkZWZPYmpbbGVhZi5uYW1lXSA9IGxlYWYudXJsO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5sb2FkKGRlZk9iaiwgdHJ1ZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpO1xuICAgICAgY29uc3QgZGF0YSA9IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpXG5cbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IGlkPVwiYmVnaW5cIj5cbiAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwic2VsZWN0b3JcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICAgICAgaGVpZ2h0OiAke3RoaXMucmFuZ2UucmFuZ2VZKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weDtcbiAgICAgICAgICAgICAgd2lkdGg6ICR7dGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4O1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB5ZWxsb3c7IHotaW5kZXg6IDA7XG4gICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7KC10aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpLzJ9cHgsICR7dGhpcy5jaXJjbGVTaXplLzJ9cHgpO1wiPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGlkPVwibGlzdGVuZXJcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgaGVpZ2h0OiAxNnB4OyB3aWR0aDogMTZweDsgYmFja2dyb3VuZDogYmx1ZTsgdGV4dC1hbGlnbjogY2VudGVyOyB6LWluZGV4OiAxO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeyh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4LCAkeyh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfXB4KSByb3RhdGUoNDVkZWcpXCI7PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgICAgLy88cD5hZGQgb3IgcmVtb3ZlIC53YXYgb3IgLm1wMyBmaWxlcyBpbiB0aGUgXCJzb3VuZGJhbmtcIiBkaXJlY3RvcnkgYW5kIG9ic2VydmUgdGhlIGNoYW5nZXM6PC9wPiR7T2JqZWN0LmtleXMoZGF0YSkubWFwKGtleSA9PiB7cmV0dXJuIGh0bWxgPHA+LSBcIiR7a2V5fVwiIGxvYWRlZDogJHtkYXRhW2tleV19LjwvcD5gO30pfVxuXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJykpXG5cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5cIikuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIHZhciBwb3NpdGlvbklucHV0MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicG9zaXRpb25JbnB1dDFcIik7XG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MlwiKTtcblxuICAgICAgICAgIC8vIHBvc2l0aW9uSW5wdXQxLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcbiAgICAgICAgICAvLyAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xuICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgLy8gcG9zaXRpb25JbnB1dDIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xuICAgICAgICAgIC8vICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XG4gICAgICAgICAgLy8gfSlcblxuICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJyk7XG4gICAgICAgICAgY29uc29sZS5sb2cod2luZG93LnNjcmVlbi53aWR0aClcblxuICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy50ZW1wWCA9IG1vdXNlLmNsaWVudFg7XG4gICAgICAgICAgICB0aGlzLnRlbXBZID0gbW91c2UuY2xpZW50WTtcbiAgICAgICAgICAgIHRoaXMubW91c2VBY3Rpb24obW91c2UpO1xuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIChtb3VzZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgICAgICAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHRoaXM7XG4gICAgICAgICAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IG1vdXNlLmNsaWVudFk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuICAgICAgICAgIHRoaXMuYmVnaW5QcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIHZhciBzaG9vdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvb3RCdXR0b25cIik7XG4gICAgICAvLyBzaG9vdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgLy8gfSk7XG5cbiAgICAgIC8vIHZhciB5YXdTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlckF6aW1BaW1cIik7XG4gICAgICAvLyB5YXdTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcblxuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZChjb250YWluZXIpIHtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0YXJ0KCk7XG4gICAgfVxuXG5cbiAgICB2YXIgdGVtcENpcmNsZVxuICAgIHRoaXMuYXVkaW9Db250ZXh0LnJlc3VtZSgpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRlbXBDaXJjbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHRlbXBDaXJjbGUuaWQgPSBcImNpcmNsZVwiICsgaTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHRlbXBDaXJjbGUpXG4gICAgICB0ZW1wQ2lyY2xlLmlubmVySFRNTCA9IGk7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlID0gXCJwb3NpdGlvbjogYWJzb2x1dGU7IG1hcmdpbjogMCAtMTBweDsgd2lkdGg6IFwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgaGVpZ2h0OiBcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGJvcmRlci1yYWRpdXM6XCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBsaW5lLWhlaWdodDogXCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBiYWNrZ3JvdW5kOiBncmV5O1wiO1xuICAgICAgdGVtcENpcmNsZS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweClcIjtcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZW1wQ2lyY2xlKVxuICAgIH1cbiAgfVxuXG4gIFVwZGF0ZUNvbnRhaW5lcigpIHtcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLmhlaWdodCA9ICh0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLndpZHRoID0gKHRoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4XCI7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVDb250YWluZXJcIikudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAodGhpcy5jaXJjbGVTaXplLzIgLSB0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwvMikgKyBcInB4LCAxMHB4KTtcIlxuICAgIC8vIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWChcIiArICgtMip0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweClcIjtcbiAgICB0aGlzLlVwZGF0ZUxpc3RlbmVyKCk7XG4gICAgdGhpcy5VcGRhdGVTb3VyY2VzUG9zaXRpb24oKTtcbiAgfVxuXG4gIFVwZGF0ZUxpc3RlbmVyKCkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGlzdGVuZXJcIikuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwgLSB0aGlzLmNpcmNsZVNpemUvMikgKyBcInB4LCBcIiArICgodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4KSByb3RhdGUoNDVkZWcpXCI7XG4gICAgdGhpcy5Qb3NpdGlvbkNoYW5nZWQoKTsgIFxuICB9XG5cbiAgVXBkYXRlU291cmNlc1Bvc2l0aW9uKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyBpKS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgsIFwiICsgKCh0aGlzLnBvc2l0aW9uc1tpXS55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweClcIjtcbiAgICB9XG4gIH1cblxuICBVcGRhdGVTb3VyY2VzU291bmQoaW5kZXgpIHtcbiAgICB2YXIgc291cmNlVmFsdWUgPSAoMS0yKnRoaXMuZGlzdGFuY2VWYWx1ZVtpbmRleF0vdGhpcy5kaXN0YW5jZVN1bSk7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMuQ2xvc2VzdFBvaW50c0lkW2luZGV4XSkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmdiKDAsIFwiICsgMjU1KnNvdXJjZVZhbHVlICsgXCIsIDApXCI7XG4gICAgdGhpcy5nYWluc1tpbmRleF0uZ2Fpbi5zZXRWYWx1ZUF0VGltZShzb3VyY2VWYWx1ZSwgMCk7XG4gIH1cblxuICBQb3NpdGlvbkNoYW5nZWQoKSB7XG4gICAgdmFyIHRlbXBQcmVmaXggPSBcIlwiO1xuICAgIHZhciBmaWxlO1xuXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFBvaW50c0lkXG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7XG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pIHtcbiAgICAgICAgaWYgKHRoaXMuTm90SW4odGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSwgdGhpcy5DbG9zZXN0UG9pbnRzSWQpKSB7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcImdyZXlcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdG9wKCk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5kaXNjb25uZWN0KHRoaXMuZ2FpbnNbaV0pO1xuXG4gICAgICAgIGlmICh0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSA8IDEwKSB7XG4gICAgICAgICAgdGVtcFByZWZpeCA9IFwiMFwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRlbXBQcmVmaXggPSBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgZmlsZSA9IHRlbXBQcmVmaXggKyB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSArIFwiLndhdlwiO1xuY29uc29sZS5sb2codGhpcy5hdWRpb0J1ZmZlckxvYWRlci5kYXRhKVxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0gPSB0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbZmlsZV0sIGkpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RhcnQoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5wbGF5aW5nU291bmRzW2ldKVxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBsYXlpbmdTb3VuZHNbaV0pXG4gICAgICB9XG4gICAgdGhpcy5VcGRhdGVTb3VyY2VzU291bmQoaSk7XG4gICAgfVxuICB9XG5cbiAgbW91c2VBY3Rpb24obW91c2UpIHtcblxuICAgIHZhciB0ZW1wWCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG4gICAgdmFyIHRlbXBZID0gdGhpcy5yYW5nZS5taW5ZICsgKG1vdXNlLmNsaWVudFkgLSB0aGlzLmNpcmNsZVNpemUvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG5cbiAgICBpZiAodGVtcFggPj0gdGhpcy5yYW5nZS5taW5YICYmIHRlbXBYIDw9IHRoaXMucmFuZ2UubWF4WCAmJiB0ZW1wWSA+PSB0aGlzLnJhbmdlLm1pblkgJiYgdGVtcFkgPD0gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHRoaXMucmFuZ2UubW95WCArIChtb3VzZS5jbGllbnRYIC0gd2luZG93LmlubmVyV2lkdGgvMikvKHRoaXMuc2NhbGUuVlBvczJQaXhlbCk7XG4gICAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5jaXJjbGVTaXplLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuXG4gICAgICB0aGlzLlVwZGF0ZUxpc3RlbmVyKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBDbG9zZXN0U291cmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50LCBuYkNsb3Nlc3QpIHtcbiAgICB2YXIgY2xvc2VzdElkcyA9IFtdO1xuICAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbmJDbG9zZXN0OyBqKyspIHtcbiAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RPZlBvaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLk5vdEluKGksIGNsb3Nlc3RJZHMpICYmIHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbaV0pIDwgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSkpIHtcbiAgICAgICAgICBjdXJyZW50Q2xvc2VzdElkID0gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5kaXN0YW5jZVZhbHVlW2pdID0gdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSk7XG4gICAgICB0aGlzLmRpc3RhbmNlU3VtICs9IHRoaXMuZGlzdGFuY2VWYWx1ZVtqXTtcbiAgICAgIGNsb3Nlc3RJZHMucHVzaChjdXJyZW50Q2xvc2VzdElkKTtcbiAgICB9XG4gICAgcmV0dXJuIChjbG9zZXN0SWRzKTtcbiAgfVxuXG4gIE5vdEluKHBvaW50SWQsIGxpc3RPZklkcykge1xuICAgIHZhciBpdGVyYXRvciA9IDA7XG4gICAgd2hpbGUgKGl0ZXJhdG9yIDwgbGlzdE9mSWRzLmxlbmd0aCAmJiBwb2ludElkICE9IGxpc3RPZklkc1tpdGVyYXRvcl0pIHtcbiAgICAgIGl0ZXJhdG9yICs9IDE7XG4gICAgfVxuICAgIHJldHVybihpdGVyYXRvciA+PSBsaXN0T2ZJZHMubGVuZ3RoKTtcbiAgfVxuXG4gIERpc3RhbmNlKHBvaW50QSwgcG9pbnRCKSB7XG4gICAgaWYgKHBvaW50QiAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAoTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50QS54IC0gcG9pbnRCLngsIDIpICsgTWF0aC5wb3cocG9pbnRBLnkgLSBwb2ludEIueSwgMikpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gKEluZmluaXR5KTtcbiAgICB9XG4gIH1cblxuICBMb2FkTmV3U291bmQoYnVmZmVyLCBpbmRleCkge1xuICAgIC8vIFNvdW5kIGluaXRpYWxpc2F0aW9uXG4gICAgdmFyIHNvdW5kID0gdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKClcbiAgICBzb3VuZC5sb29wID0gdHJ1ZTtcbiAgICAvLyBjb25zb2xlLmxvZyhidWZmZXIpXG4gICAgc291bmQuYnVmZmVyID0gYnVmZmVyO1xuICAgIHNvdW5kLmNvbm5lY3QodGhpcy5nYWluc1tpbmRleF0pO1xuICAgIC8vIGNvbnNvbGUubG9nKHNvdW5kKVxuICAgIHJldHVybiBzb3VuZDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDO0lBQzNDLE1BQU1GLE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxJQUFiLENBTDJDLENBTzNDOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QjtJQUNBLEtBQUtDLFVBQUwsR0FBa0JELE9BQU8sQ0FBQyxZQUFELENBQXpCO0lBQ0EsS0FBS0UsVUFBTCxHQUFrQixLQUFLRixPQUFMLENBQWEsWUFBYixDQUFsQixDQVYyQyxDQVczQztJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFFQTtJQUNBO0lBQ0E7O0lBR0EsS0FBS0csWUFBTCxHQUFvQixJQUFwQjtJQUNBLEtBQUtDLFlBQUwsR0FBb0IsS0FBcEI7SUFDQSxLQUFLQyxVQUFMLEdBQWtCLEdBQWxCO0lBQ0EsS0FBS0MsZ0JBQUwsR0FBd0I7TUFDdEJDLENBQUMsRUFBRSxDQURtQjtNQUV0QkMsQ0FBQyxFQUFFO0lBRm1CLENBQXhCO0lBSUEsS0FBS0MsS0FBTDtJQUNBLEtBQUtDLFdBQUwsR0FBbUIsQ0FBbkI7SUFFQSxLQUFLQyxlQUFMLEdBQXVCLEVBQXZCO0lBQ0EsS0FBS0MsdUJBQUwsR0FBK0IsRUFBL0I7SUFDQSxLQUFLQyxlQUFMLEdBQXVCLENBQXZCO0lBQ0EsS0FBS0MsU0FBTCxHQUFpQixFQUFqQjtJQUNBLEtBQUtDLGFBQUwsR0FBcUIsQ0FDbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQURtQixFQUVuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBRm1CLEVBR25CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FIbUIsRUFJbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQUptQixFQUtuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBTG1CLEVBTW5CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FObUIsRUFPbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQVBtQixFQVFuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBUm1CLEVBU25CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FUbUIsRUFVbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQVZtQixFQVduQixDQUFDLElBQUQsRUFBTyxJQUFQLENBWG1CLEVBWW5CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FabUIsRUFhbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQWJtQixFQWNuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBZG1CLEVBZW5CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FmbUIsRUFnQm5CLENBQUMsSUFBRCxFQUFPLElBQVAsQ0FoQm1CLEVBaUJuQixDQUFDLElBQUQsRUFBTyxJQUFQLENBakJtQixFQWtCbkIsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQWxCbUIsQ0FBckI7SUFxQkEsS0FBS0MsS0FBTCxHQUFhLEtBQUtELGFBQUwsQ0FBbUJFLE1BQWhDO0lBQ0EsS0FBS0MsS0FBTDtJQUNBLEtBQUtDLGFBQUwsR0FBcUIsQ0FBQyxDQUFELEVBQUksQ0FBSixFQUFPLENBQVAsRUFBVSxDQUFWLENBQXJCO0lBRUEsS0FBS0MsWUFBTCxHQUFvQixJQUFJQyxZQUFKLEVBQXBCO0lBQ0EsS0FBS0MsYUFBTCxHQUFxQixFQUFyQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxFQUFiO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQixFQUFsQjtJQUNBLEtBQUtDLEtBQUw7SUFDQSxLQUFLQyxLQUFMO0lBQ0EsS0FBS0MsU0FBTCxHQUFpQixLQUFqQjtJQUVBLElBQUFDLG9DQUFBLEVBQTRCakMsTUFBNUIsRUFBb0NDLE1BQXBDLEVBQTRDQyxVQUE1QztFQUNEOztFQUVVLE1BQUxnQyxLQUFLLEdBQUc7SUFDWixNQUFNQSxLQUFOO0lBRUEsS0FBS0MsU0FBTCxHQUFpQixNQUFNLEtBQUsvQixpQkFBTCxDQUF1QmdDLElBQXZCLENBQTRCLEVBQTVCLEVBQ3BCLElBRG9CLENBQXZCOztJQUdBLEtBQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLaEIsS0FBekIsRUFBZ0NnQixDQUFDLEVBQWpDLEVBQXFDO01BQ25DO01BQ0EsS0FBS2xCLFNBQUwsQ0FBZW1CLElBQWYsQ0FBb0I7UUFBQzFCLENBQUMsRUFBRSxLQUFLUSxhQUFMLENBQW1CaUIsQ0FBbkIsRUFBc0IsQ0FBdEIsQ0FBSjtRQUE4QnhCLENBQUMsRUFBQyxLQUFLTyxhQUFMLENBQW1CaUIsQ0FBbkIsRUFBc0IsQ0FBdEI7TUFBaEMsQ0FBcEI7SUFDRDs7SUFFRCxLQUFLRSxLQUFMLENBQVcsS0FBS3BCLFNBQWhCO0lBQ0EsS0FBS0wsS0FBTCxHQUFhLEtBQUswQixPQUFMLENBQWEsS0FBS2pCLEtBQWxCLENBQWI7SUFDQSxLQUFLWixnQkFBTCxDQUFzQkMsQ0FBdEIsR0FBMEIsS0FBS1csS0FBTCxDQUFXa0IsSUFBckM7SUFDQSxLQUFLOUIsZ0JBQUwsQ0FBc0JFLENBQXRCLEdBQTBCLEtBQUtVLEtBQUwsQ0FBV21CLElBQXJDO0lBRUEsS0FBSzFCLGVBQUwsR0FBdUIsS0FBSzJCLGFBQUwsQ0FBbUIsS0FBS2hDLGdCQUF4QixFQUEwQyxLQUFLUSxTQUEvQyxFQUEwRCxLQUFLRCxlQUEvRCxDQUF2QixDQWhCWSxDQWtCWjtJQUNBO0lBQ0E7O0lBRUEsSUFBSTBCLFVBQVUsR0FBRyxFQUFqQjtJQUNBLElBQUlDLElBQUo7O0lBRUEsS0FBSyxJQUFJUixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtuQixlQUF6QixFQUEwQ21CLENBQUMsRUFBM0MsRUFBK0M7TUFDN0MsS0FBS1QsS0FBTCxDQUFXVSxJQUFYLENBQWdCLE1BQU0sS0FBS2IsWUFBTCxDQUFrQnFCLFVBQWxCLEVBQXRCLEVBRDZDLENBRTdDOztNQUVBLElBQUksS0FBSzlCLGVBQUwsQ0FBcUJxQixDQUFyQixJQUEwQixFQUE5QixFQUFrQztRQUNoQ08sVUFBVSxHQUFHLEdBQWI7TUFDRCxDQUZELE1BR0s7UUFDSEEsVUFBVSxHQUFHLEVBQWI7TUFDRDs7TUFFREMsSUFBSSxHQUFHRCxVQUFVLEdBQUcsS0FBSzVCLGVBQUwsQ0FBcUJxQixDQUFyQixDQUFiLEdBQXVDLE1BQTlDO01BR0EsS0FBS1YsYUFBTCxDQUFtQlcsSUFBbkIsQ0FBd0IsS0FBS1MsWUFBTCxDQUFrQixLQUFLM0MsaUJBQUwsQ0FBdUI0QyxJQUF2QixDQUE0QkgsSUFBNUIsQ0FBbEIsRUFBcURSLENBQXJELENBQXhCO01BQ0EsS0FBS1QsS0FBTCxDQUFXUyxDQUFYLEVBQWNZLE9BQWQsQ0FBc0IsS0FBS3hCLFlBQUwsQ0FBa0J5QixXQUF4QztNQUdBLEtBQUt0QixLQUFMLENBQVdTLENBQVgsRUFBY2MsSUFBZCxDQUFtQkMsY0FBbkIsQ0FBa0MsR0FBbEMsRUFBdUMsQ0FBdkM7SUFDRCxDQTVDVyxDQThDWjs7O0lBQ0EsS0FBS2hELGlCQUFMLENBQXVCaUQsU0FBdkIsQ0FBaUMsTUFBTSxLQUFLQyxNQUFMLEVBQXZDLEVBL0NZLENBZ0RaOztJQUNBLEtBQUsvQyxVQUFMLENBQWdCOEMsU0FBaEIsQ0FBMEIsTUFBTSxLQUFLRSxhQUFMLEVBQWhDLEVBakRZLENBbURaOztJQUNBLEtBQUtBLGFBQUwsR0FwRFksQ0FzRFo7O0lBRUEsTUFBTUMsSUFBSSxHQUFHLEtBQUtqRCxVQUFMLENBQWdCa0QsR0FBaEIsQ0FBb0IsVUFBcEIsQ0FBYixDQXhEWSxDQXdEa0M7SUFDOUM7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBR0E7O0lBQ0FDLE1BQU0sQ0FBQ0MsZ0JBQVAsQ0FBd0IsUUFBeEIsRUFBa0MsTUFBTTtNQUN0Q0MsT0FBTyxDQUFDQyxHQUFSLENBQVlILE1BQU0sQ0FBQ0ksV0FBbkI7TUFDQSxLQUFLaEQsS0FBTCxHQUFhLEtBQUswQixPQUFMLENBQWEsS0FBS2pCLEtBQWxCLENBQWI7O01BQ0EsSUFBSSxLQUFLZCxZQUFULEVBQXVCO1FBQ3JCLEtBQUtzRCxlQUFMO01BQ0Q7O01BQ0QsS0FBS1QsTUFBTDtJQUNELENBUEQ7SUFRQSxLQUFLQSxNQUFMO0VBQ0Q7O0VBRURmLEtBQUssQ0FBQ3BCLFNBQUQsRUFBWTtJQUNmLEtBQUtJLEtBQUwsR0FBYTtNQUNYeUMsSUFBSSxFQUFFN0MsU0FBUyxDQUFDLENBQUQsQ0FBVCxDQUFhUCxDQURSO01BRVhxRCxJQUFJLEVBQUU5QyxTQUFTLENBQUMsQ0FBRCxDQUFULENBQWFQLENBRlI7TUFHWDhCLElBQUksRUFBRXZCLFNBQVMsQ0FBQyxDQUFELENBQVQsQ0FBYU4sQ0FIUjtNQUlYcUQsSUFBSSxFQUFFL0MsU0FBUyxDQUFDLENBQUQsQ0FBVCxDQUFhTjtJQUpSLENBQWI7O0lBTUEsS0FBSyxJQUFJd0IsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR2xCLFNBQVMsQ0FBQ0csTUFBOUIsRUFBc0NlLENBQUMsRUFBdkMsRUFBMkM7TUFDekMsSUFBSWxCLFNBQVMsQ0FBQ2tCLENBQUQsQ0FBVCxDQUFhekIsQ0FBYixHQUFpQixLQUFLVyxLQUFMLENBQVd5QyxJQUFoQyxFQUFzQztRQUNwQyxLQUFLekMsS0FBTCxDQUFXeUMsSUFBWCxHQUFrQjdDLFNBQVMsQ0FBQ2tCLENBQUQsQ0FBVCxDQUFhekIsQ0FBL0I7TUFDRDs7TUFDRCxJQUFJTyxTQUFTLENBQUNrQixDQUFELENBQVQsQ0FBYXpCLENBQWIsR0FBaUIsS0FBS1csS0FBTCxDQUFXMEMsSUFBaEMsRUFBc0M7UUFDcEMsS0FBSzFDLEtBQUwsQ0FBVzBDLElBQVgsR0FBa0I5QyxTQUFTLENBQUNrQixDQUFELENBQVQsQ0FBYXpCLENBQS9CO01BQ0Q7O01BQ0QsSUFBSU8sU0FBUyxDQUFDa0IsQ0FBRCxDQUFULENBQWF4QixDQUFiLEdBQWlCLEtBQUtVLEtBQUwsQ0FBV21CLElBQWhDLEVBQXNDO1FBQ3BDLEtBQUtuQixLQUFMLENBQVdtQixJQUFYLEdBQWtCdkIsU0FBUyxDQUFDa0IsQ0FBRCxDQUFULENBQWF4QixDQUEvQjtNQUNEOztNQUNELElBQUlNLFNBQVMsQ0FBQ2tCLENBQUQsQ0FBVCxDQUFheEIsQ0FBYixHQUFpQixLQUFLVSxLQUFMLENBQVcyQyxJQUFoQyxFQUFzQztRQUNwQyxLQUFLM0MsS0FBTCxDQUFXMkMsSUFBWCxHQUFrQi9DLFNBQVMsQ0FBQ2tCLENBQUQsQ0FBVCxDQUFheEIsQ0FBL0I7TUFDRDtJQUNGOztJQUNELEtBQUtVLEtBQUwsQ0FBV2tCLElBQVgsR0FBa0IsQ0FBQyxLQUFLbEIsS0FBTCxDQUFXMEMsSUFBWCxHQUFrQixLQUFLMUMsS0FBTCxDQUFXeUMsSUFBOUIsSUFBb0MsQ0FBdEQ7SUFDQSxLQUFLekMsS0FBTCxDQUFXNEMsSUFBWCxHQUFrQixDQUFDLEtBQUs1QyxLQUFMLENBQVcyQyxJQUFYLEdBQWtCLEtBQUszQyxLQUFMLENBQVdtQixJQUE5QixJQUFvQyxDQUF0RDtJQUNBLEtBQUtuQixLQUFMLENBQVc2QyxNQUFYLEdBQW9CLEtBQUs3QyxLQUFMLENBQVcwQyxJQUFYLEdBQWtCLEtBQUsxQyxLQUFMLENBQVd5QyxJQUFqRDtJQUNBLEtBQUt6QyxLQUFMLENBQVc4QyxNQUFYLEdBQW9CLEtBQUs5QyxLQUFMLENBQVcyQyxJQUFYLEdBQWtCLEtBQUszQyxLQUFMLENBQVdtQixJQUFqRDtFQUNEOztFQUVERixPQUFPLENBQUM4QixXQUFELEVBQWM7SUFDbkIsSUFBSXhELEtBQUssR0FBRztNQUFDeUQsVUFBVSxFQUFFQyxJQUFJLENBQUNDLEdBQUwsQ0FBUyxDQUFDZixNQUFNLENBQUNnQixVQUFQLEdBQW9CLEtBQUs3QyxVQUExQixJQUFzQ3lDLFdBQVcsQ0FBQ0YsTUFBM0QsRUFBbUUsQ0FBQ1YsTUFBTSxDQUFDSSxXQUFQLEdBQXFCLEtBQUtqQyxVQUEzQixJQUF1Q3lDLFdBQVcsQ0FBQ0QsTUFBdEg7SUFBYixDQUFaO0lBQ0EsT0FBUXZELEtBQVI7RUFDRDs7RUFFRDZELGdCQUFnQixDQUFDQyxRQUFELEVBQVc7SUFDekIsSUFBSUMsVUFBVSxHQUFHO01BQUNqRSxDQUFDLEVBQUVnRSxRQUFRLENBQUNoRSxDQUFULEdBQVcsS0FBS0UsS0FBTCxDQUFXeUQsVUFBMUI7TUFBc0MxRCxDQUFDLEVBQUUrRCxRQUFRLENBQUMvRCxDQUFULEdBQVcsS0FBS0MsS0FBTCxDQUFXeUQ7SUFBL0QsQ0FBakI7SUFDQSxPQUFRTSxVQUFSO0VBQ0Q7O0VBRUR0QixhQUFhLEdBQUc7SUFDZCxNQUFNdUIsYUFBYSxHQUFHLEtBQUt2RSxVQUFMLENBQWdCa0QsR0FBaEIsQ0FBb0IsYUFBcEIsQ0FBdEI7SUFDQSxNQUFNc0IsTUFBTSxHQUFHLEVBQWY7SUFDQW5CLE9BQU8sQ0FBQ0MsR0FBUixDQUFZaUIsYUFBWjtJQUVBQSxhQUFhLENBQUNFLFFBQWQsQ0FBdUJDLE9BQXZCLENBQStCQyxJQUFJLElBQUk7TUFDckM7TUFDQSxJQUFJQSxJQUFJLENBQUNDLElBQUwsS0FBYyxNQUFsQixFQUEwQjtRQUN4QkosTUFBTSxDQUFDRyxJQUFJLENBQUNFLElBQU4sQ0FBTixHQUFvQkYsSUFBSSxDQUFDRyxHQUF6QjtNQUNEO0lBQ0YsQ0FMRDtJQU9BLEtBQUtqRixpQkFBTCxDQUF1QmdDLElBQXZCLENBQTRCMkMsTUFBNUIsRUFBb0MsSUFBcEM7RUFDRDs7RUFFRHpCLE1BQU0sR0FBRztJQUNQO0lBQ0FJLE1BQU0sQ0FBQzRCLG9CQUFQLENBQTRCLEtBQUtuRixLQUFqQztJQUVBLEtBQUtBLEtBQUwsR0FBYXVELE1BQU0sQ0FBQzZCLHFCQUFQLENBQTZCLE1BQU07TUFFOUMsTUFBTUMsT0FBTyxHQUFHLEtBQUtwRixpQkFBTCxDQUF1QnFELEdBQXZCLENBQTJCLFNBQTNCLENBQWhCO01BQ0EsTUFBTVQsSUFBSSxHQUFHLEtBQUs1QyxpQkFBTCxDQUF1QjRDLElBQXBDLENBSDhDLENBSTlDOztNQUVBLElBQUFNLGVBQUEsRUFBTyxJQUFBbUMsYUFBQSxDQUFLO0FBQ2xCO0FBQ0E7QUFDQSx5Q0FBeUMsS0FBS3pGLE1BQUwsQ0FBWW1GLElBQUssU0FBUSxLQUFLbkYsTUFBTCxDQUFZMEYsRUFBRztBQUNqRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLEtBQUtuRSxLQUFMLENBQVc4QyxNQUFYLEdBQWtCLEtBQUt2RCxLQUFMLENBQVd5RCxVQUFXO0FBQ2hFLHVCQUF1QixLQUFLaEQsS0FBTCxDQUFXNkMsTUFBWCxHQUFrQixLQUFLdEQsS0FBTCxDQUFXeUQsVUFBVztBQUMvRDtBQUNBLHFDQUFzQyxDQUFDLEtBQUtoRCxLQUFMLENBQVc2QyxNQUFaLEdBQW1CLEtBQUt0RCxLQUFMLENBQVd5RCxVQUEvQixHQUEyQyxDQUFFLE9BQU0sS0FBSzFDLFVBQUwsR0FBZ0IsQ0FBRTtBQUMxRztBQUNBO0FBQ0EscUNBQXFDLENBQUMsS0FBS2xCLGdCQUFMLENBQXNCQyxDQUF0QixHQUEwQixLQUFLVyxLQUFMLENBQVdrQixJQUF0QyxJQUE0QyxLQUFLM0IsS0FBTCxDQUFXeUQsVUFBVyxPQUFNLENBQUMsS0FBSzVELGdCQUFMLENBQXNCRSxDQUF0QixHQUEwQixLQUFLVSxLQUFMLENBQVdtQixJQUF0QyxJQUE0QyxLQUFLNUIsS0FBTCxDQUFXeUQsVUFBVztBQUMvSztBQUNBO0FBQ0EsT0FyQk0sRUFxQkcsS0FBS3JFLFVBckJSLEVBTjhDLENBNkI1Qzs7TUFFRixJQUFJLEtBQUtNLFlBQVQsRUFBdUI7UUFDckI7UUFDQSxJQUFJbUYsV0FBVyxHQUFHQyxRQUFRLENBQUNDLGNBQVQsQ0FBd0IsYUFBeEIsQ0FBbEI7UUFDQUYsV0FBVyxDQUFDaEMsZ0JBQVosQ0FBNkIsT0FBN0IsRUFBc0MsTUFBTTtVQUMxQyxLQUFLbUMsb0JBQUwsQ0FBMEJGLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixpQkFBeEIsQ0FBMUI7VUFFQUQsUUFBUSxDQUFDQyxjQUFULENBQXdCLE9BQXhCLEVBQWlDRSxLQUFqQyxDQUF1Q0MsVUFBdkMsR0FBb0QsUUFBcEQ7VUFDQUosUUFBUSxDQUFDQyxjQUFULENBQXdCLE9BQXhCLEVBQWlDRSxLQUFqQyxDQUF1Q25CLFFBQXZDLEdBQWtELFVBQWxEO1VBQ0FnQixRQUFRLENBQUNDLGNBQVQsQ0FBd0IsTUFBeEIsRUFBZ0NFLEtBQWhDLENBQXNDQyxVQUF0QyxHQUFtRCxTQUFuRDtVQUVBLElBQUlDLGNBQWMsR0FBR0wsUUFBUSxDQUFDQyxjQUFULENBQXdCLGdCQUF4QixDQUFyQjtVQUNBLElBQUlLLGNBQWMsR0FBR04sUUFBUSxDQUFDQyxjQUFULENBQXdCLGdCQUF4QixDQUFyQixDQVIwQyxDQVUxQztVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUEsSUFBSU0sTUFBTSxHQUFHUCxRQUFRLENBQUNDLGNBQVQsQ0FBd0IsaUJBQXhCLENBQWI7VUFDQWpDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZSCxNQUFNLENBQUMwQyxNQUFQLENBQWNDLEtBQTFCO1VBRUFGLE1BQU0sQ0FBQ3hDLGdCQUFQLENBQXdCLFdBQXhCLEVBQXNDMkMsS0FBRCxJQUFXO1lBQzlDLEtBQUt0RSxTQUFMLEdBQWlCLElBQWpCO1lBQ0EsS0FBS0YsS0FBTCxHQUFhd0UsS0FBSyxDQUFDQyxPQUFuQjtZQUNBLEtBQUt4RSxLQUFMLEdBQWF1RSxLQUFLLENBQUNFLE9BQW5CO1lBQ0EsS0FBS0MsV0FBTCxDQUFpQkgsS0FBakI7VUFDRCxDQUxELEVBS0csS0FMSDtVQU9BSCxNQUFNLENBQUN4QyxnQkFBUCxDQUF3QixXQUF4QixFQUFzQzJDLEtBQUQsSUFBVztZQUM5QyxJQUFJLEtBQUt0RSxTQUFULEVBQW9CO2NBQ2xCLEtBQUt5RSxXQUFMLENBQWlCSCxLQUFqQjtZQUNEO1VBQ0YsQ0FKRCxFQUlHLEtBSkg7VUFNQUgsTUFBTSxDQUFDeEMsZ0JBQVAsQ0FBd0IsU0FBeEIsRUFBb0MyQyxLQUFELElBQVc7WUFDNUMsS0FBS3RFLFNBQUwsR0FBaUIsS0FBakIsQ0FENEMsQ0FFNUM7WUFDQTtVQUNELENBSkQsRUFJRyxLQUpIO1VBS0EsS0FBS3ZCLFlBQUwsR0FBb0IsSUFBcEI7UUFDRCxDQXZDRDtRQXdDQSxLQUFLRCxZQUFMLEdBQW9CLEtBQXBCO01BQ0QsQ0EzRTZDLENBNkU5QztNQUNBO01BQ0E7TUFFQTtNQUNBO01BRUE7O0lBQ0QsQ0FyRlksQ0FBYjtFQXNGRDs7RUFFRHNGLG9CQUFvQixDQUFDWSxTQUFELEVBQVk7SUFFOUIsS0FBSyxJQUFJckUsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLbkIsZUFBekIsRUFBMENtQixDQUFDLEVBQTNDLEVBQStDO01BQzdDLEtBQUtWLGFBQUwsQ0FBbUJVLENBQW5CLEVBQXNCSCxLQUF0QjtJQUNEOztJQUdELElBQUl5RSxVQUFKO0lBQ0EsS0FBS2xGLFlBQUwsQ0FBa0JtRixNQUFsQixHQVI4QixDQVM5Qjs7SUFDQSxLQUFLLElBQUl2RSxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtsQixTQUFMLENBQWVHLE1BQW5DLEVBQTJDZSxDQUFDLEVBQTVDLEVBQWdEO01BQzlDc0UsVUFBVSxHQUFHZixRQUFRLENBQUNpQixhQUFULENBQXVCLEtBQXZCLENBQWI7TUFDQUYsVUFBVSxDQUFDakIsRUFBWCxHQUFnQixXQUFXckQsQ0FBM0IsQ0FGOEMsQ0FHOUM7O01BQ0FzRSxVQUFVLENBQUNHLFNBQVgsR0FBdUJ6RSxDQUF2QjtNQUNBc0UsVUFBVSxDQUFDWixLQUFYLEdBQW1CLGlEQUFpRCxLQUFLbEUsVUFBdEQsR0FBbUUsY0FBbkUsR0FBb0YsS0FBS0EsVUFBekYsR0FBc0csb0JBQXRHLEdBQTZILEtBQUtBLFVBQWxJLEdBQStJLG1CQUEvSSxHQUFxSyxLQUFLQSxVQUExSyxHQUF1TCx1QkFBMU07TUFDQThFLFVBQVUsQ0FBQ1osS0FBWCxDQUFpQmdCLFNBQWpCLEdBQTZCLGVBQWdCLENBQUMsS0FBSzVGLFNBQUwsQ0FBZWtCLENBQWYsRUFBa0J6QixDQUFsQixHQUFzQixLQUFLVyxLQUFMLENBQVdrQixJQUFsQyxJQUF3QyxLQUFLM0IsS0FBTCxDQUFXeUQsVUFBbkUsR0FBaUYsTUFBakYsR0FBMkYsQ0FBQyxLQUFLcEQsU0FBTCxDQUFla0IsQ0FBZixFQUFrQnhCLENBQWxCLEdBQXNCLEtBQUtVLEtBQUwsQ0FBV21CLElBQWxDLElBQXdDLEtBQUs1QixLQUFMLENBQVd5RCxVQUE5SSxHQUE0SixLQUF6TDtNQUNBbUMsU0FBUyxDQUFDTSxXQUFWLENBQXNCTCxVQUF0QjtJQUNEO0VBQ0Y7O0VBRUQ1QyxlQUFlLEdBQUc7SUFFaEI2QixRQUFRLENBQUNDLGNBQVQsQ0FBd0IsaUJBQXhCLEVBQTJDb0IsTUFBM0MsR0FBcUQsS0FBSzFGLEtBQUwsQ0FBVzhDLE1BQVgsR0FBa0IsS0FBS3ZELEtBQUwsQ0FBV3lELFVBQTlCLEdBQTRDLElBQWhHO0lBQ0FxQixRQUFRLENBQUNDLGNBQVQsQ0FBd0IsaUJBQXhCLEVBQTJDUSxLQUEzQyxHQUFvRCxLQUFLOUUsS0FBTCxDQUFXNkMsTUFBWCxHQUFrQixLQUFLdEQsS0FBTCxDQUFXeUQsVUFBOUIsR0FBNEMsSUFBL0Y7SUFDQXFCLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixpQkFBeEIsRUFBMkNrQixTQUEzQyxHQUF1RCxnQkFBZ0IsS0FBS2xGLFVBQUwsR0FBZ0IsQ0FBaEIsR0FBb0IsS0FBS04sS0FBTCxDQUFXNkMsTUFBWCxHQUFrQixLQUFLdEQsS0FBTCxDQUFXeUQsVUFBN0IsR0FBd0MsQ0FBNUUsSUFBaUYsWUFBeEksQ0FKZ0IsQ0FLaEI7O0lBQ0EsS0FBSzJDLGNBQUw7SUFDQSxLQUFLQyxxQkFBTDtFQUNEOztFQUVERCxjQUFjLEdBQUc7SUFDZnRCLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixVQUF4QixFQUFvQ0UsS0FBcEMsQ0FBMENnQixTQUExQyxHQUFzRCxnQkFBZ0IsQ0FBQyxLQUFLcEcsZ0JBQUwsQ0FBc0JDLENBQXRCLEdBQTBCLEtBQUtXLEtBQUwsQ0FBV2tCLElBQXRDLElBQTRDLEtBQUszQixLQUFMLENBQVd5RCxVQUF2RCxHQUFvRSxLQUFLMUMsVUFBTCxHQUFnQixDQUFwRyxJQUF5RyxNQUF6RyxHQUFtSCxDQUFDLEtBQUtsQixnQkFBTCxDQUFzQkUsQ0FBdEIsR0FBMEIsS0FBS1UsS0FBTCxDQUFXbUIsSUFBdEMsSUFBNEMsS0FBSzVCLEtBQUwsQ0FBV3lELFVBQTFLLEdBQXdMLG1CQUE5TztJQUNBLEtBQUs2QyxlQUFMO0VBQ0Q7O0VBRURELHFCQUFxQixHQUFHO0lBQ3RCLEtBQUssSUFBSTlFLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBS2xCLFNBQUwsQ0FBZUcsTUFBbkMsRUFBMkNlLENBQUMsRUFBNUMsRUFBZ0Q7TUFDOUN1RCxRQUFRLENBQUNDLGNBQVQsQ0FBd0IsV0FBV3hELENBQW5DLEVBQXNDMEQsS0FBdEMsQ0FBNENnQixTQUE1QyxHQUF3RCxlQUFnQixDQUFDLEtBQUs1RixTQUFMLENBQWVrQixDQUFmLEVBQWtCekIsQ0FBbEIsR0FBc0IsS0FBS1csS0FBTCxDQUFXa0IsSUFBbEMsSUFBd0MsS0FBSzNCLEtBQUwsQ0FBV3lELFVBQW5FLEdBQWlGLE1BQWpGLEdBQTJGLENBQUMsS0FBS3BELFNBQUwsQ0FBZWtCLENBQWYsRUFBa0J4QixDQUFsQixHQUFzQixLQUFLVSxLQUFMLENBQVdtQixJQUFsQyxJQUF3QyxLQUFLNUIsS0FBTCxDQUFXeUQsVUFBOUksR0FBNEosS0FBcE47SUFDRDtFQUNGOztFQUVEOEMsa0JBQWtCLENBQUNDLEtBQUQsRUFBUTtJQUN4QixJQUFJQyxXQUFXLEdBQUksSUFBRSxJQUFFLEtBQUsvRixhQUFMLENBQW1COEYsS0FBbkIsQ0FBRixHQUE0QixLQUFLdkcsV0FBdEQ7SUFDQTZFLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixXQUFXLEtBQUs3RSxlQUFMLENBQXFCc0csS0FBckIsQ0FBbkMsRUFBZ0V2QixLQUFoRSxDQUFzRXlCLFVBQXRFLEdBQW1GLFlBQVksTUFBSUQsV0FBaEIsR0FBOEIsTUFBakg7SUFDQSxLQUFLM0YsS0FBTCxDQUFXMEYsS0FBWCxFQUFrQm5FLElBQWxCLENBQXVCQyxjQUF2QixDQUFzQ21FLFdBQXRDLEVBQW1ELENBQW5EO0VBQ0Q7O0VBRURILGVBQWUsR0FBRztJQUNoQixJQUFJeEUsVUFBVSxHQUFHLEVBQWpCO0lBQ0EsSUFBSUMsSUFBSjtJQUVBLEtBQUs1Qix1QkFBTCxHQUErQixLQUFLRCxlQUFwQztJQUNBLEtBQUtELFdBQUwsR0FBbUIsQ0FBbkI7SUFDQSxLQUFLQyxlQUFMLEdBQXVCLEtBQUsyQixhQUFMLENBQW1CLEtBQUtoQyxnQkFBeEIsRUFBMEMsS0FBS1EsU0FBL0MsRUFBMEQsS0FBS0QsZUFBL0QsQ0FBdkI7O0lBQ0EsS0FBSyxJQUFJbUIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLbkIsZUFBekIsRUFBMENtQixDQUFDLEVBQTNDLEVBQStDO01BQzdDLElBQUksS0FBS3BCLHVCQUFMLENBQTZCb0IsQ0FBN0IsS0FBbUMsS0FBS3JCLGVBQUwsQ0FBcUJxQixDQUFyQixDQUF2QyxFQUFnRTtRQUM5RCxJQUFJLEtBQUtvRixLQUFMLENBQVcsS0FBS3hHLHVCQUFMLENBQTZCb0IsQ0FBN0IsQ0FBWCxFQUE0QyxLQUFLckIsZUFBakQsQ0FBSixFQUF1RTtVQUNyRTRFLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixXQUFXLEtBQUs1RSx1QkFBTCxDQUE2Qm9CLENBQTdCLENBQW5DLEVBQW9FMEQsS0FBcEUsQ0FBMEV5QixVQUExRSxHQUF1RixNQUF2RjtRQUNEOztRQUVELEtBQUs3RixhQUFMLENBQW1CVSxDQUFuQixFQUFzQnFGLElBQXRCO1FBQ0EsS0FBSy9GLGFBQUwsQ0FBbUJVLENBQW5CLEVBQXNCc0YsVUFBdEIsQ0FBaUMsS0FBSy9GLEtBQUwsQ0FBV1MsQ0FBWCxDQUFqQzs7UUFFQSxJQUFJLEtBQUtyQixlQUFMLENBQXFCcUIsQ0FBckIsSUFBMEIsRUFBOUIsRUFBa0M7VUFDaENPLFVBQVUsR0FBRyxHQUFiO1FBQ0QsQ0FGRCxNQUdLO1VBQ0hBLFVBQVUsR0FBRyxFQUFiO1FBQ0Q7O1FBRURDLElBQUksR0FBR0QsVUFBVSxHQUFHLEtBQUs1QixlQUFMLENBQXFCcUIsQ0FBckIsQ0FBYixHQUF1QyxNQUE5QztRQUNSdUIsT0FBTyxDQUFDQyxHQUFSLENBQVksS0FBS3pELGlCQUFMLENBQXVCNEMsSUFBbkM7UUFDUSxLQUFLckIsYUFBTCxDQUFtQlUsQ0FBbkIsSUFBd0IsS0FBS1UsWUFBTCxDQUFrQixLQUFLM0MsaUJBQUwsQ0FBdUI0QyxJQUF2QixDQUE0QkgsSUFBNUIsQ0FBbEIsRUFBcURSLENBQXJELENBQXhCO1FBQ0EsS0FBS1YsYUFBTCxDQUFtQlUsQ0FBbkIsRUFBc0JILEtBQXRCLEdBbEI4RCxDQW1COUQ7UUFDQTtNQUNEOztNQUNILEtBQUttRixrQkFBTCxDQUF3QmhGLENBQXhCO0lBQ0M7RUFDRjs7RUFFRG9FLFdBQVcsQ0FBQ0gsS0FBRCxFQUFRO0lBRWpCLElBQUl4RSxLQUFLLEdBQUcsS0FBS1AsS0FBTCxDQUFXa0IsSUFBWCxHQUFrQixDQUFDNkQsS0FBSyxDQUFDQyxPQUFOLEdBQWdCN0MsTUFBTSxDQUFDZ0IsVUFBUCxHQUFrQixDQUFuQyxJQUF1QyxLQUFLNUQsS0FBTCxDQUFXeUQsVUFBaEY7SUFDQSxJQUFJeEMsS0FBSyxHQUFHLEtBQUtSLEtBQUwsQ0FBV21CLElBQVgsR0FBa0IsQ0FBQzRELEtBQUssQ0FBQ0UsT0FBTixHQUFnQixLQUFLM0UsVUFBTCxHQUFnQixDQUFqQyxJQUFxQyxLQUFLZixLQUFMLENBQVd5RCxVQUE5RTs7SUFFQSxJQUFJekMsS0FBSyxJQUFJLEtBQUtQLEtBQUwsQ0FBV3lDLElBQXBCLElBQTRCbEMsS0FBSyxJQUFJLEtBQUtQLEtBQUwsQ0FBVzBDLElBQWhELElBQXdEbEMsS0FBSyxJQUFJLEtBQUtSLEtBQUwsQ0FBV21CLElBQTVFLElBQW9GWCxLQUFLLElBQUksS0FBS1IsS0FBTCxDQUFXMkMsSUFBNUcsRUFBa0g7TUFDaEgsS0FBS3ZELGdCQUFMLENBQXNCQyxDQUF0QixHQUEwQixLQUFLVyxLQUFMLENBQVdrQixJQUFYLEdBQWtCLENBQUM2RCxLQUFLLENBQUNDLE9BQU4sR0FBZ0I3QyxNQUFNLENBQUNnQixVQUFQLEdBQWtCLENBQW5DLElBQXVDLEtBQUs1RCxLQUFMLENBQVd5RCxVQUE5RjtNQUNBLEtBQUs1RCxnQkFBTCxDQUFzQkUsQ0FBdEIsR0FBMEIsS0FBS1UsS0FBTCxDQUFXbUIsSUFBWCxHQUFrQixDQUFDNEQsS0FBSyxDQUFDRSxPQUFOLEdBQWdCLEtBQUszRSxVQUFMLEdBQWdCLENBQWpDLElBQXFDLEtBQUtmLEtBQUwsQ0FBV3lELFVBQTVGO01BRUEsS0FBSzJDLGNBQUw7SUFDRCxDQUxELE1BTUs7TUFDSCxLQUFLbEYsU0FBTCxHQUFpQixLQUFqQjtJQUNEO0VBQ0Y7O0VBRURXLGFBQWEsQ0FBQ2hDLGdCQUFELEVBQW1CaUgsV0FBbkIsRUFBZ0NDLFNBQWhDLEVBQTJDO0lBQ3RELElBQUlDLFVBQVUsR0FBRyxFQUFqQjtJQUNBLElBQUlDLGdCQUFKOztJQUNBLEtBQUssSUFBSUMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0gsU0FBcEIsRUFBK0JHLENBQUMsRUFBaEMsRUFBb0M7TUFDbENELGdCQUFnQixHQUFHRSxTQUFuQjs7TUFDQSxLQUFLLElBQUk1RixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHdUYsV0FBVyxDQUFDdEcsTUFBaEMsRUFBd0NlLENBQUMsRUFBekMsRUFBNkM7UUFDM0MsSUFBSSxLQUFLb0YsS0FBTCxDQUFXcEYsQ0FBWCxFQUFjeUYsVUFBZCxLQUE2QixLQUFLSSxRQUFMLENBQWN2SCxnQkFBZCxFQUFnQ2lILFdBQVcsQ0FBQ3ZGLENBQUQsQ0FBM0MsSUFBa0QsS0FBSzZGLFFBQUwsQ0FBY3ZILGdCQUFkLEVBQWdDaUgsV0FBVyxDQUFDRyxnQkFBRCxDQUEzQyxDQUFuRixFQUFtSjtVQUNqSkEsZ0JBQWdCLEdBQUcxRixDQUFuQjtRQUNEO01BQ0Y7O01BQ0QsS0FBS2IsYUFBTCxDQUFtQndHLENBQW5CLElBQXdCLEtBQUtFLFFBQUwsQ0FBY3ZILGdCQUFkLEVBQWdDaUgsV0FBVyxDQUFDRyxnQkFBRCxDQUEzQyxDQUF4QjtNQUNBLEtBQUtoSCxXQUFMLElBQW9CLEtBQUtTLGFBQUwsQ0FBbUJ3RyxDQUFuQixDQUFwQjtNQUNBRixVQUFVLENBQUN4RixJQUFYLENBQWdCeUYsZ0JBQWhCO0lBQ0Q7O0lBQ0QsT0FBUUQsVUFBUjtFQUNEOztFQUVETCxLQUFLLENBQUNVLE9BQUQsRUFBVUMsU0FBVixFQUFxQjtJQUN4QixJQUFJQyxRQUFRLEdBQUcsQ0FBZjs7SUFDQSxPQUFPQSxRQUFRLEdBQUdELFNBQVMsQ0FBQzlHLE1BQXJCLElBQStCNkcsT0FBTyxJQUFJQyxTQUFTLENBQUNDLFFBQUQsQ0FBMUQsRUFBc0U7TUFDcEVBLFFBQVEsSUFBSSxDQUFaO0lBQ0Q7O0lBQ0QsT0FBT0EsUUFBUSxJQUFJRCxTQUFTLENBQUM5RyxNQUE3QjtFQUNEOztFQUVENEcsUUFBUSxDQUFDSSxNQUFELEVBQVNDLE1BQVQsRUFBaUI7SUFDdkIsSUFBSUEsTUFBTSxJQUFJTixTQUFkLEVBQXlCO01BQ3ZCLE9BQVF6RCxJQUFJLENBQUNnRSxJQUFMLENBQVVoRSxJQUFJLENBQUNpRSxHQUFMLENBQVNILE1BQU0sQ0FBQzFILENBQVAsR0FBVzJILE1BQU0sQ0FBQzNILENBQTNCLEVBQThCLENBQTlCLElBQW1DNEQsSUFBSSxDQUFDaUUsR0FBTCxDQUFTSCxNQUFNLENBQUN6SCxDQUFQLEdBQVcwSCxNQUFNLENBQUMxSCxDQUEzQixFQUE4QixDQUE5QixDQUE3QyxDQUFSO0lBQ0QsQ0FGRCxNQUdLO01BQ0gsT0FBUTZILFFBQVI7SUFDRDtFQUNGOztFQUVEM0YsWUFBWSxDQUFDNEYsTUFBRCxFQUFTckIsS0FBVCxFQUFnQjtJQUMxQjtJQUNBLElBQUlzQixLQUFLLEdBQUcsS0FBS25ILFlBQUwsQ0FBa0JvSCxrQkFBbEIsRUFBWjtJQUNBRCxLQUFLLENBQUNFLElBQU4sR0FBYSxJQUFiLENBSDBCLENBSTFCOztJQUNBRixLQUFLLENBQUNELE1BQU4sR0FBZUEsTUFBZjtJQUNBQyxLQUFLLENBQUMzRixPQUFOLENBQWMsS0FBS3JCLEtBQUwsQ0FBVzBGLEtBQVgsQ0FBZCxFQU4wQixDQU8xQjs7SUFDQSxPQUFPc0IsS0FBUDtFQUNEOztBQWhjK0M7O2VBbWNuQy9JLGdCIn0=