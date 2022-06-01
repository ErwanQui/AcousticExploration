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
    console.log("bonjou");
    soundbankTree.children.forEach(leaf => {
      // console.log(leaf)
      console.loh("hey");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsImJlZ2luUHJlc3NlZCIsInBpeGVsU2NhbGUiLCJsaXN0ZW5lclBvc2l0aW9uIiwieCIsInkiLCJzY2FsZSIsImRpc3RhbmNlU3VtIiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJ0cnVlUG9zaXRpb25zIiwibmJQb3MiLCJsZW5ndGgiLCJyYW5nZSIsImRpc3RhbmNlVmFsdWUiLCJhdWRpb0NvbnRleHQiLCJBdWRpb0NvbnRleHQiLCJwbGF5aW5nU291bmRzIiwiZ2FpbnMiLCJjaXJjbGVTaXplIiwidGVtcFgiLCJ0ZW1wWSIsIm1vdXNlRG93biIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0Iiwic291bmRCYW5rIiwibG9hZCIsImkiLCJwdXNoIiwiUmFuZ2UiLCJTY2FsaW5nIiwibW95WCIsIm1pblkiLCJDbG9zZXN0U291cmNlIiwidGVtcFByZWZpeCIsImZpbGUiLCJjcmVhdGVHYWluIiwiTG9hZE5ld1NvdW5kIiwiZGF0YSIsImNvbm5lY3QiLCJkZXN0aW5hdGlvbiIsImdhaW4iLCJzZXRWYWx1ZUF0VGltZSIsInN1YnNjcmliZSIsInJlbmRlciIsImxvYWRTb3VuZGJhbmsiLCJUcmVlIiwiZ2V0Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsImNvbnNvbGUiLCJsb2ciLCJpbm5lckhlaWdodCIsIlVwZGF0ZUNvbnRhaW5lciIsIm1pblgiLCJtYXhYIiwibWF4WSIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJyYW5nZVZhbHVlcyIsIlZQb3MyUGl4ZWwiLCJNYXRoIiwibWluIiwiaW5uZXJXaWR0aCIsIlZpcnR1YWxQb3MyUGl4ZWwiLCJwb3NpdGlvbiIsInBpeGVsQ29vcmQiLCJzb3VuZGJhbmtUcmVlIiwiZGVmT2JqIiwiY2hpbGRyZW4iLCJmb3JFYWNoIiwibGVhZiIsImxvaCIsInR5cGUiLCJuYW1lIiwidXJsIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiaHRtbCIsImlkIiwiYmVnaW5CdXR0b24iLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbklucHV0MSIsInBvc2l0aW9uSW5wdXQyIiwiY2FudmFzIiwic2NyZWVuIiwid2lkdGgiLCJtb3VzZSIsImNsaWVudFgiLCJjbGllbnRZIiwibW91c2VBY3Rpb24iLCJjb250YWluZXIiLCJ0ZW1wQ2lyY2xlIiwicmVzdW1lIiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwiaGVpZ2h0IiwiVXBkYXRlTGlzdGVuZXIiLCJVcGRhdGVTb3VyY2VzUG9zaXRpb24iLCJQb3NpdGlvbkNoYW5nZWQiLCJVcGRhdGVTb3VyY2VzU291bmQiLCJpbmRleCIsInNvdXJjZVZhbHVlIiwiYmFja2dyb3VuZCIsIk5vdEluIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJsaXN0T2ZQb2ludCIsIm5iQ2xvc2VzdCIsImNsb3Nlc3RJZHMiLCJjdXJyZW50Q2xvc2VzdElkIiwiaiIsInVuZGVmaW5lZCIsIkRpc3RhbmNlIiwicG9pbnRJZCIsImxpc3RPZklkcyIsIml0ZXJhdG9yIiwicG9pbnRBIiwicG9pbnRCIiwic3FydCIsInBvdyIsIkluZmluaXR5IiwiYnVmZmVyIiwic291bmQiLCJjcmVhdGVCdWZmZXJTb3VyY2UiLCJsb29wIl0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IE1hcmtlciBmcm9tICcuL01hcmtlci5qcyc7XG4vLyBpbXBvcnQgU2NlbmUgZnJvbSAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cy9zY2VuZS5qc29uJztcblxuLy8gaW1wb3J0IFBvc2l0aW9ucyBmcm9tICcuL3NjZW5lLmpzb24nXG4vLyBpbXBvcnQgZnM1IGZyb20gXCJmc1wiO1xuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7XG4gICAgdGhpcy5hbWJpc29uaWNzID0gcmVxdWlyZSgnYW1iaXNvbmljcycpO1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCkpXG4gICAgLy8gY29uc3QgdHJlZXMgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCk7XG4gICAgLy8gZm9yIChsZXQgbmFtZSBpbiB0cmVlcykge1xuICAgIC8vICAgY29uc3QgdHJlZSA9IHRyZWVbbmFtZV07XG4gICAgLy8gICBjb25zb2xlLmxvZyhuYW1lLCB0cmVlKTtcbiAgICAvLyB9XG4gICAgLy8gdGhpcy5wYXRoID0gcmVxdWlyZShcInBhdGhcIilcbiAgICAvLyB0aGlzLmZzID0gdGhpcy5yZXF1aXJlKCdmcycpXG5cbiAgICAvLyBjb25zdCBlbnZDb25maWdQYXRoID0gJ3B1YmxpYy9ncmlkX25hdl9hc3NldHMvYXNzZXRzL3NjZW5lLmpzb24nXG4gICAgLy8gdmFyIGVudkNvbmZpZyA9IEpTT041LnBhcnNlKGZzLnJlYWRGaWxlU3luYyhlbnZDb25maWdQYXRoLCAndXRmLTgnKSk7XG4gICAgLy8gY29uc29sZS5sb2coZW52Q29uZmlnKVxuXG5cbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5iZWdpblByZXNzZWQgPSBmYWxzZTtcbiAgICB0aGlzLnBpeGVsU2NhbGUgPSAyMDA7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDAsXG4gICAgfVxuICAgIHRoaXMuc2NhbGU7XG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7XG5cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdO1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTtcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7XG4gICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLnRydWVQb3NpdGlvbnMgPSBbXG4gICAgICBbMzEuMCwgNDEuNV0sXG4gICAgICBbMzEuMCwgMzkuMF0sXG4gICAgICBbMzEuMCwgMzYuMl0sXG4gICAgICBbMzQuNSwgMzYuMl0sXG4gICAgICBbMzYuOCwgMzYuMl0sXG4gICAgICBbMzYuOCwgMzMuNl0sXG4gICAgICBbMzQuNSwgMzMuNl0sXG4gICAgICBbMzEuMCwgMzMuNl0sXG4gICAgICBbMzEuMCwgMzEuMF0sXG4gICAgICBbMzQuNSwgMzEuMF0sXG4gICAgICBbMzQuNSwgMjguMF0sXG4gICAgICBbMzEuMCwgMjguMF0sXG4gICAgICBbMzEuMCwgMjUuOF0sXG4gICAgICBbMzQuNSwgMjUuOF0sXG4gICAgICBbMzYuOCwgMjUuOF0sXG4gICAgICBbMzYuOCwgMjMuNl0sXG4gICAgICBbMzQuNSwgMjMuNl0sXG4gICAgICBbMzEuMCwgMjMuNl0sXG4gICAgXVxuXG4gICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XG4gICAgdGhpcy5yYW5nZTtcbiAgICB0aGlzLmRpc3RhbmNlVmFsdWUgPSBbMCwgMCwgMCwgMF07XG5cbiAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICB0aGlzLnBsYXlpbmdTb3VuZHMgPSBbXTtcbiAgICB0aGlzLmdhaW5zID0gW107XG4gICAgdGhpcy5jaXJjbGVTaXplID0gMjA7XG4gICAgdGhpcy50ZW1wWDtcbiAgICB0aGlzLnRlbXBZO1xuICAgIHRoaXMubW91c2VEb3duID0gZmFsc2VcblxuICAgIHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyhjbGllbnQsIGNvbmZpZywgJGNvbnRhaW5lcik7XG4gIH1cblxuICBhc3luYyBzdGFydCgpIHtcbiAgICBzdXBlci5zdGFydCgpO1xuXG4gICAgdGhpcy5zb3VuZEJhbmsgPSBhd2FpdCB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmxvYWQoe1xuICAgIH0sIHRydWUpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcbiAgICAgIC8vIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSoxMDAwIC0gNTAwKSwgeTogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjUwMCl9KTtcbiAgICAgIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IHRoaXMudHJ1ZVBvc2l0aW9uc1tpXVswXSwgeTp0aGlzLnRydWVQb3NpdGlvbnNbaV1bMV19KTtcbiAgICB9XG5cbiAgICB0aGlzLlJhbmdlKHRoaXMucG9zaXRpb25zKTtcbiAgICB0aGlzLnNjYWxlID0gdGhpcy5TY2FsaW5nKHRoaXMucmFuZ2UpO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdGhpcy5yYW5nZS5tb3lYO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gdGhpcy5yYW5nZS5taW5ZO1xuXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpXG5cbiAgICAvLyAkLmdldChcImRhdGEuanNvblwiLCBmdW5jdGlvbihkYXRhKXtcbiAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAvLyB9KTtcblxuICAgIHZhciB0ZW1wUHJlZml4ID0gXCJcIjtcbiAgICB2YXIgZmlsZTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgdGhpcy5nYWlucy5wdXNoKGF3YWl0IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUdhaW4oKSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmdhaW5zKVxuXG4gICAgICBpZiAodGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gPCAxMCkge1xuICAgICAgICB0ZW1wUHJlZml4ID0gXCIwXCI7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGVtcFByZWZpeCA9IFwiXCI7XG4gICAgICB9XG5cbiAgICAgIGZpbGUgPSB0ZW1wUHJlZml4ICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gKyBcIi53YXZcIjtcblxuXG4gICAgICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbZmlsZV0sIGkpKTtcbiAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cblxuICAgICAgdGhpcy5nYWluc1tpXS5nYWluLnNldFZhbHVlQXRUaW1lKDAuNSwgMCk7XG4gICAgfVxuXG4gICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuc3Vic2NyaWJlKCgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIC8vIHN1YnNjcmliZSB0byBkaXNwbGF5IGxvYWRpbmcgc3RhdGVcbiAgICB0aGlzLmZpbGVzeXN0ZW0uc3Vic2NyaWJlKCgpID0+IHRoaXMubG9hZFNvdW5kYmFuaygpKTtcblxuICAgIC8vIGluaXQgd2l0aCBjdXJyZW50IGNvbnRlbnRcbiAgICB0aGlzLmxvYWRTb3VuZGJhbmsoKTtcblxuICAgIC8vIHRoaXMuZnMgPSByZXF1aXJlKCdmaWxlLXN5c3RlbScpXG5cbiAgICBjb25zdCBUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCgnUG9zaXRpb24nKTsgLy8vLy8vLy8gw6dhIG1hcmNoZSBwYXMgKGltcG9zc2liaWxlIGQndXRpbGlzZXIgZnMsIG5lIHRyb3V2ZSBwYXMgbGUgcGF0aC4uLilcbiAgICAvLyBUcmVlLmNoaWxkcmVuLmZvckVhY2gobGVhZiA9PiB7XG4gICAgLy8gICAvLyBjb25zb2xlLmxvZyhsZWFmKVxuICAgIC8vICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKGxlYWYpXG4gICAgLy8gICAgIGlmIChsZWFmLmV4dGVuc2lvbiA9PT0gJy5qc29uJykge1xuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKGxlYWYudXJsKVxuICAgIC8vICAgICAgIGNvbnNvbGUubG9nKEpTT04ucGFyc2UoJy4vc2NlbmUuanNvbicpKVxuICAgIC8vICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT041LnBhcnNlKHRoaXMuZmlsZXN5c3RlbS5yZWFkRmlsZVN5bmMobGVhZi51cmwsICd1dGYtOCcpKSk7XG4gICAgLy8gICAgICAgLy8gbGV0IGEgPSByZXF1aXJlKGxlYWYucGF0aClcbiAgICAvLyAgICAgICBsZXQgYiA9IHJlcXVpcmUoJy4vc2NlbmUuanNvbicpXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYSk7XG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coYik7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH1cbiAgICAvLyB9KTtcblxuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5wb3NpdGlvbnMpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKHdpbmRvdy5pbm5lckhlaWdodClcbiAgICAgIHRoaXMuc2NhbGUgPSB0aGlzLlNjYWxpbmcodGhpcy5yYW5nZSk7XG4gICAgICBpZiAodGhpcy5iZWdpblByZXNzZWQpIHtcbiAgICAgICAgdGhpcy5VcGRhdGVDb250YWluZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIFJhbmdlKHBvc2l0aW9ucykge1xuICAgIHRoaXMucmFuZ2UgPSB7XG4gICAgICBtaW5YOiBwb3NpdGlvbnNbMF0ueCxcbiAgICAgIG1heFg6IHBvc2l0aW9uc1swXS54LFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yXG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMlxuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgU2NhbGluZyhyYW5nZVZhbHVlcykge1xuICAgIHZhciBzY2FsZSA9IHtWUG9zMlBpeGVsOiBNYXRoLm1pbigod2luZG93LmlubmVyV2lkdGggLSB0aGlzLmNpcmNsZVNpemUpL3JhbmdlVmFsdWVzLnJhbmdlWCwgKHdpbmRvdy5pbm5lckhlaWdodCAtIHRoaXMuY2lyY2xlU2l6ZSkvcmFuZ2VWYWx1ZXMucmFuZ2VZKX07XG4gICAgcmV0dXJuIChzY2FsZSk7XG4gIH1cblxuICBWaXJ0dWFsUG9zMlBpeGVsKHBvc2l0aW9uKSB7XG4gICAgdmFyIHBpeGVsQ29vcmQgPSB7eDogcG9zaXRpb24ueCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwsIHk6IHBvc2l0aW9uLnkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsfTtcbiAgICByZXR1cm4gKHBpeGVsQ29vcmQpO1xuICB9XG5cbiAgbG9hZFNvdW5kYmFuaygpIHtcbiAgICBjb25zdCBzb3VuZGJhbmtUcmVlID0gdGhpcy5maWxlc3lzdGVtLmdldCgnQXVkaW9GaWxlczAnKTtcbiAgICBjb25zdCBkZWZPYmogPSB7fTtcbiAgICBjb25zb2xlLmxvZyhzb3VuZGJhbmtUcmVlKVxuICAgIGNvbnNvbGUubG9nKFwiYm9uam91XCIpXG4gICAgc291bmRiYW5rVHJlZS5jaGlsZHJlbi5mb3JFYWNoKGxlYWYgPT4ge1xuICAgICAgLy8gY29uc29sZS5sb2cobGVhZilcbiAgICAgIGNvbnNvbGUubG9oKFwiaGV5XCIpXG4gICAgICBpZiAobGVhZi50eXBlID09PSAnZmlsZScpIHtcbiAgICAgICAgZGVmT2JqW2xlYWYubmFtZV0gPSBsZWFmLnVybDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZChkZWZPYmosIHRydWUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICBjb25zdCBsb2FkaW5nID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5nZXQoJ2xvYWRpbmcnKTtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGE7XG4gICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKVxuXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBpZD1cImJlZ2luXCI+XG4gICAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cInNlbGVjdG9yXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgIGhlaWdodDogJHt0aGlzLnJhbmdlLnJhbmdlWSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWx9cHg7XG4gICAgICAgICAgICAgIHdpZHRoOiAke3RoaXMucmFuZ2UucmFuZ2VYKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weDtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogeWVsbG93OyB6LWluZGV4OiAwO1xuICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgkeygtdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKS8yfXB4LCAke3RoaXMuY2lyY2xlU2l6ZS8yfXB4KTtcIj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBpZD1cImxpc3RlbmVyXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IGhlaWdodDogMTZweDsgd2lkdGg6IDE2cHg7IGJhY2tncm91bmQ6IGJsdWU7IHRleHQtYWxpZ246IGNlbnRlcjsgei1pbmRleDogMTtcbiAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weCwgJHsodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGUuVlBvczJQaXhlbH1weCkgcm90YXRlKDQ1ZGVnKVwiOz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICAgIC8vPHA+YWRkIG9yIHJlbW92ZSAud2F2IG9yIC5tcDMgZmlsZXMgaW4gdGhlIFwic291bmRiYW5rXCIgZGlyZWN0b3J5IGFuZCBvYnNlcnZlIHRoZSBjaGFuZ2VzOjwvcD4ke09iamVjdC5rZXlzKGRhdGEpLm1hcChrZXkgPT4ge3JldHVybiBodG1sYDxwPi0gXCIke2tleX1cIiBsb2FkZWQ6ICR7ZGF0YVtrZXldfS48L3A+YDt9KX1cblxuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpKVxuXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpblwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJoaWRkZW5cIjtcbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luXCIpLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQxXCIpO1xuICAgICAgICAgIHZhciBwb3NpdGlvbklucHV0MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicG9zaXRpb25JbnB1dDJcIik7XG5cbiAgICAgICAgICAvLyBwb3NpdGlvbklucHV0MS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwoKSA9PiB7XG4gICAgICAgICAgLy8gICB0aGlzLm9uUG9zaXRpb25DaGFuZ2UocG9zaXRpb25JbnB1dDEsIHBvc2l0aW9uSW5wdXQyKTtcbiAgICAgICAgICAvLyB9KVxuICAgICAgICAgIC8vIHBvc2l0aW9uSW5wdXQyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcbiAgICAgICAgICAvLyAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xuICAgICAgICAgIC8vIH0pXG5cbiAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKHdpbmRvdy5zY3JlZW4ud2lkdGgpXG5cbiAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMudGVtcFggPSBtb3VzZS5jbGllbnRYO1xuICAgICAgICAgICAgdGhpcy50ZW1wWSA9IG1vdXNlLmNsaWVudFk7XG4gICAgICAgICAgICB0aGlzLm1vdXNlQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1vdXNlRG93bikge1xuICAgICAgICAgICAgICB0aGlzLm1vdXNlQWN0aW9uKG1vdXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzO1xuICAgICAgICAgICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSBtb3VzZS5jbGllbnRZO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLmJlZ2luUHJlc3NlZCA9IHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyB2YXIgc2hvb3RCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob290QnV0dG9uXCIpO1xuICAgICAgLy8gc2hvb3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIC8vIH0pO1xuXG4gICAgICAvLyB2YXIgeWF3U2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZXJBemltQWltXCIpO1xuICAgICAgLy8geWF3U2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG5cbiAgICAgIC8vIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoY29udGFpbmVyKSB7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzOyBpKyspIHtcbiAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpO1xuICAgIH1cblxuXG4gICAgdmFyIHRlbXBDaXJjbGVcbiAgICB0aGlzLmF1ZGlvQ29udGV4dC5yZXN1bWUoKTtcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnJhbmdlKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0ZW1wQ2lyY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB0ZW1wQ2lyY2xlLmlkID0gXCJjaXJjbGVcIiArIGk7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0ZW1wQ2lyY2xlKVxuICAgICAgdGVtcENpcmNsZS5pbm5lckhUTUwgPSBpO1xuICAgICAgdGVtcENpcmNsZS5zdHlsZSA9IFwicG9zaXRpb246IGFic29sdXRlOyBtYXJnaW46IDAgLTEwcHg7IHdpZHRoOiBcIiArIHRoaXMuY2lyY2xlU2l6ZSArIFwicHg7IGhlaWdodDogXCIgKyB0aGlzLmNpcmNsZVNpemUgKyBcInB4OyBib3JkZXItcmFkaXVzOlwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgbGluZS1oZWlnaHQ6IFwiICsgdGhpcy5jaXJjbGVTaXplICsgXCJweDsgYmFja2dyb3VuZDogZ3JleTtcIjtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4LCBcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgpXCI7XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcENpcmNsZSlcbiAgICB9XG4gIH1cblxuICBVcGRhdGVDb250YWluZXIoKSB7XG5cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5oZWlnaHQgPSAodGhpcy5yYW5nZS5yYW5nZVkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHhcIjtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS53aWR0aCA9ICh0aGlzLnJhbmdlLnJhbmdlWCp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweFwiO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlQ29udGFpbmVyXCIpLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKHRoaXMuY2lyY2xlU2l6ZS8yIC0gdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsLzIpICsgXCJweCwgMTBweCk7XCJcbiAgICAvLyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZUNvbnRhaW5lclwiKS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZVgoXCIgKyAoLTIqdGhpcy5yYW5nZS5yYW5nZVgqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgpXCI7XG4gICAgdGhpcy5VcGRhdGVMaXN0ZW5lcigpO1xuICAgIHRoaXMuVXBkYXRlU291cmNlc1Bvc2l0aW9uKCk7XG4gIH1cblxuICBVcGRhdGVMaXN0ZW5lcigpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxpc3RlbmVyXCIpLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgKCh0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCAtIHRoaXMucmFuZ2UubW95WCkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsIC0gdGhpcy5jaXJjbGVTaXplLzIpICsgXCJweCwgXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpICsgXCJweCkgcm90YXRlKDQ1ZGVnKVwiO1xuICAgIHRoaXMuUG9zaXRpb25DaGFuZ2VkKCk7ICBcbiAgfVxuXG4gIFVwZGF0ZVNvdXJjZXNQb3NpdGlvbigpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgaSkuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGUuVlBvczJQaXhlbCkgKyBcInB4LCBcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsZS5WUG9zMlBpeGVsKSArIFwicHgpXCI7XG4gICAgfVxuICB9XG5cbiAgVXBkYXRlU291cmNlc1NvdW5kKGluZGV4KSB7XG4gICAgdmFyIHNvdXJjZVZhbHVlID0gKDEtMip0aGlzLmRpc3RhbmNlVmFsdWVbaW5kZXhdL3RoaXMuZGlzdGFuY2VTdW0pO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpbmRleF0pLnN0eWxlLmJhY2tncm91bmQgPSBcInJnYigwLCBcIiArIDI1NSpzb3VyY2VWYWx1ZSArIFwiLCAwKVwiO1xuICAgIHRoaXMuZ2FpbnNbaW5kZXhdLmdhaW4uc2V0VmFsdWVBdFRpbWUoc291cmNlVmFsdWUsIDApO1xuICB9XG5cbiAgUG9zaXRpb25DaGFuZ2VkKCkge1xuICAgIHZhciB0ZW1wUHJlZml4ID0gXCJcIjtcbiAgICB2YXIgZmlsZTtcblxuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RQb2ludHNJZFxuICAgIHRoaXMuZGlzdGFuY2VTdW0gPSAwO1xuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMsIHRoaXMubmJDbG9zZXN0UG9pbnRzKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldICE9IHRoaXMuQ2xvc2VzdFBvaW50c0lkW2ldKSB7XG4gICAgICAgIGlmICh0aGlzLk5vdEluKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0sIHRoaXMuQ2xvc2VzdFBvaW50c0lkKSkge1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJncmV5XCI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RvcCgpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zW2ldKTtcblxuICAgICAgICBpZiAodGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gPCAxMCkge1xuICAgICAgICAgIHRlbXBQcmVmaXggPSBcIjBcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0ZW1wUHJlZml4ID0gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpbGUgPSB0ZW1wUHJlZml4ICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gKyBcIi53YXZcIjtcbmNvbnNvbGUubG9nKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YSlcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldID0gdGhpcy5Mb2FkTmV3U291bmQodGhpcy5hdWRpb0J1ZmZlckxvYWRlci5kYXRhW2ZpbGVdLCBpKTtcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnN0YXJ0KCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMucGxheWluZ1NvdW5kc1tpXSlcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5wbGF5aW5nU291bmRzW2ldKVxuICAgICAgfVxuICAgIHRoaXMuVXBkYXRlU291cmNlc1NvdW5kKGkpO1xuICAgIH1cbiAgfVxuXG4gIG1vdXNlQWN0aW9uKG1vdXNlKSB7XG5cbiAgICB2YXIgdGVtcFggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuICAgIHZhciB0ZW1wWSA9IHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gdGhpcy5jaXJjbGVTaXplLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuXG4gICAgaWYgKHRlbXBYID49IHRoaXMucmFuZ2UubWluWCAmJiB0ZW1wWCA8PSB0aGlzLnJhbmdlLm1heFggJiYgdGVtcFkgPj0gdGhpcy5yYW5nZS5taW5ZICYmIHRlbXBZIDw9IHRoaXMucmFuZ2UubWF4WSkge1xuICAgICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5pbm5lcldpZHRoLzIpLyh0aGlzLnNjYWxlLlZQb3MyUGl4ZWwpO1xuICAgICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB0aGlzLnJhbmdlLm1pblkgKyAobW91c2UuY2xpZW50WSAtIHRoaXMuY2lyY2xlU2l6ZS8yKS8odGhpcy5zY2FsZS5WUG9zMlBpeGVsKTtcblxuICAgICAgdGhpcy5VcGRhdGVMaXN0ZW5lcigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgQ2xvc2VzdFNvdXJjZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludCwgbmJDbG9zZXN0KSB7XG4gICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcbiAgICB2YXIgY3VycmVudENsb3Nlc3RJZDtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5iQ2xvc2VzdDsgaisrKSB7XG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gdW5kZWZpbmVkO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0T2ZQb2ludC5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5Ob3RJbihpLCBjbG9zZXN0SWRzKSAmJiB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2ldKSA8IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pKSB7XG4gICAgICAgICAgY3VycmVudENsb3Nlc3RJZCA9IGk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuZGlzdGFuY2VWYWx1ZVtqXSA9IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY3VycmVudENsb3Nlc3RJZF0pO1xuICAgICAgdGhpcy5kaXN0YW5jZVN1bSArPSB0aGlzLmRpc3RhbmNlVmFsdWVbal07XG4gICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XG4gICAgfVxuICAgIHJldHVybiAoY2xvc2VzdElkcyk7XG4gIH1cblxuICBOb3RJbihwb2ludElkLCBsaXN0T2ZJZHMpIHtcbiAgICB2YXIgaXRlcmF0b3IgPSAwO1xuICAgIHdoaWxlIChpdGVyYXRvciA8IGxpc3RPZklkcy5sZW5ndGggJiYgcG9pbnRJZCAhPSBsaXN0T2ZJZHNbaXRlcmF0b3JdKSB7XG4gICAgICBpdGVyYXRvciArPSAxO1xuICAgIH1cbiAgICByZXR1cm4oaXRlcmF0b3IgPj0gbGlzdE9mSWRzLmxlbmd0aCk7XG4gIH1cblxuICBEaXN0YW5jZShwb2ludEEsIHBvaW50Qikge1xuICAgIGlmIChwb2ludEIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gKE1hdGguc3FydChNYXRoLnBvdyhwb2ludEEueCAtIHBvaW50Qi54LCAyKSArIE1hdGgucG93KHBvaW50QS55IC0gcG9pbnRCLnksIDIpKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIChJbmZpbml0eSk7XG4gICAgfVxuICB9XG5cbiAgTG9hZE5ld1NvdW5kKGJ1ZmZlciwgaW5kZXgpIHtcbiAgICAvLyBTb3VuZCBpbml0aWFsaXNhdGlvblxuICAgIHZhciBzb3VuZCA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpXG4gICAgc291bmQubG9vcCA9IHRydWU7XG4gICAgLy8gY29uc29sZS5sb2coYnVmZmVyKVxuICAgIHNvdW5kLmJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICBzb3VuZC5jb25uZWN0KHRoaXMuZ2FpbnNbaW5kZXhdKTtcbiAgICAvLyBjb25zb2xlLmxvZyhzb3VuZClcbiAgICByZXR1cm4gc291bmQ7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQztJQUMzQyxNQUFNRixNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLQyxLQUFMLEdBQWEsSUFBYixDQUwyQyxDQU8zQzs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekI7SUFDQSxLQUFLQyxVQUFMLEdBQWtCRCxPQUFPLENBQUMsWUFBRCxDQUF6QjtJQUNBLEtBQUtFLFVBQUwsR0FBa0IsS0FBS0YsT0FBTCxDQUFhLFlBQWIsQ0FBbEIsQ0FWMkMsQ0FXM0M7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBRUE7SUFDQTtJQUNBOztJQUdBLEtBQUtHLFlBQUwsR0FBb0IsSUFBcEI7SUFDQSxLQUFLQyxZQUFMLEdBQW9CLEtBQXBCO0lBQ0EsS0FBS0Ms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