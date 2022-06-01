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
    this.scaling = 150;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsInBpeGVsU2NhbGUiLCJsaXN0ZW5lclBvc2l0aW9uIiwieCIsInkiLCJzY2FsaW5nIiwiZGlzdGFuY2VTdW0iLCJDbG9zZXN0UG9pbnRzSWQiLCJwcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCIsIm5iQ2xvc2VzdFBvaW50cyIsInBvc2l0aW9ucyIsInRydWVQb3NpdGlvbnMiLCJuYlBvcyIsImxlbmd0aCIsInJhbmdlIiwiZGlzdGFuY2VWYWx1ZSIsImF1ZGlvQ29udGV4dCIsIkF1ZGlvQ29udGV4dCIsInBsYXlpbmdTb3VuZHMiLCJnYWlucyIsInRlbXBYIiwidGVtcFkiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsInNvdW5kQmFuayIsImxvYWQiLCJpIiwicHVzaCIsIlJhbmdlIiwibW95WCIsIm1pblkiLCJDbG9zZXN0U291cmNlIiwidGVtcFByZWZpeCIsImZpbGUiLCJjcmVhdGVHYWluIiwiTG9hZE5ld1NvdW5kIiwiZGF0YSIsImNvbm5lY3QiLCJkZXN0aW5hdGlvbiIsImdhaW4iLCJzZXRWYWx1ZUF0VGltZSIsInN1YnNjcmliZSIsInJlbmRlciIsImxvYWRTb3VuZGJhbmsiLCJUcmVlIiwiZ2V0Iiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInNvdW5kYmFua1RyZWUiLCJkZWZPYmoiLCJjb25zb2xlIiwibG9nIiwiY2hpbGRyZW4iLCJmb3JFYWNoIiwibGVhZiIsInR5cGUiLCJuYW1lIiwidXJsIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiaHRtbCIsImlkIiwibWF4WCIsIm1pblgiLCJtYXhZIiwiYmVnaW5CdXR0b24iLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbklucHV0MSIsInBvc2l0aW9uSW5wdXQyIiwib25Qb3NpdGlvbkNoYW5nZSIsIm1hcmtlciIsIm1vdXNlRG93biIsInNjcmVlbiIsIndpZHRoIiwibW91c2UiLCJjbGllbnRYIiwiY2xpZW50WSIsIm1vdXNlQWN0aW9uIiwiY29udGFpbmVyIiwidGVtcENpcmNsZSIsInJlc3VtZSIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJ0cmFuc2Zvcm0iLCJhcHBlbmRDaGlsZCIsIm1veVkiLCJyYW5nZVgiLCJyYW5nZVkiLCJ2YWx1ZVgiLCJ2YWx1ZVkiLCJ2YWx1ZSIsIk5vdEluIiwiYmFja2dyb3VuZCIsInN0b3AiLCJkaXNjb25uZWN0IiwiUG9zaXRpb25DaGFuZ2UiLCJoZWlnaHQiLCJsaXN0T2ZQb2ludCIsIm5iQ2xvc2VzdCIsImNsb3Nlc3RJZHMiLCJjdXJyZW50Q2xvc2VzdElkIiwiaiIsInVuZGVmaW5lZCIsIkRpc3RhbmNlIiwicG9pbnRJZCIsImxpc3RPZklkcyIsIml0ZXJhdG9yIiwicG9pbnRBIiwicG9pbnRCIiwiTWF0aCIsInNxcnQiLCJwb3ciLCJJbmZpbml0eSIsImJ1ZmZlciIsImluZGV4IiwiU291bmQiLCJjcmVhdGVCdWZmZXJTb3VyY2UiLCJsb29wIl0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IE1hcmtlciBmcm9tICcuL01hcmtlci5qcyc7XG4vLyBpbXBvcnQgU2NlbmUgZnJvbSAnZ3JpZF9uYXZfYXNzZXRzL2Fzc2V0cy9zY2VuZS5qc29uJztcblxuLy8gaW1wb3J0IFBvc2l0aW9ucyBmcm9tICcuL3NjZW5lLmpzb24nXG4vLyBpbXBvcnQgZnM1IGZyb20gXCJmc1wiO1xuLy8gaW1wb3J0IEpTT041IGZyb20gJ2pzb241JztcblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7XG4gICAgdGhpcy5hbWJpc29uaWNzID0gcmVxdWlyZSgnYW1iaXNvbmljcycpO1xuICAgIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCkpXG4gICAgLy8gY29uc3QgdHJlZXMgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCk7XG4gICAgLy8gZm9yIChsZXQgbmFtZSBpbiB0cmVlcykge1xuICAgIC8vICAgY29uc3QgdHJlZSA9IHRyZWVbbmFtZV07XG4gICAgLy8gICBjb25zb2xlLmxvZyhuYW1lLCB0cmVlKTtcbiAgICAvLyB9XG4gICAgLy8gdGhpcy5wYXRoID0gcmVxdWlyZShcInBhdGhcIilcbiAgICAvLyB0aGlzLmZzID0gdGhpcy5yZXF1aXJlKCdmcycpXG5cbi8vIGNvbnN0IGVudkNvbmZpZ1BhdGggPSAncHVibGljL2dyaWRfbmF2X2Fzc2V0cy9hc3NldHMvc2NlbmUuanNvbidcbi8vIHZhciBlbnZDb25maWcgPSBKU09ONS5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZW52Q29uZmlnUGF0aCwgJ3V0Zi04JykpO1xuLy8gY29uc29sZS5sb2coZW52Q29uZmlnKVxuXG5cbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5waXhlbFNjYWxlID0gMjAwO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH1cbiAgICB0aGlzLnNjYWxpbmcgPSAxNTA7XG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7XG5cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdO1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTtcbiAgICB0aGlzLm5iQ2xvc2VzdFBvaW50cyA9IDQ7XG4gICAgdGhpcy5wb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLnRydWVQb3NpdGlvbnMgPSBbXG4gICAgICBbMzEuMCwgNDEuNV0sXG4gICAgICBbMzEuMCwgMzkuMF0sXG4gICAgICBbMzEuMCwgMzYuMl0sXG4gICAgICBbMzQuNSwgMzYuMl0sXG4gICAgICBbMzYuOCwgMzYuMl0sXG4gICAgICBbMzYuOCwgMzMuNl0sXG4gICAgICBbMzQuNSwgMzMuNl0sXG4gICAgICBbMzEuMCwgMzMuNl0sXG4gICAgICBbMzEuMCwgMzEuMF0sXG4gICAgICBbMzQuNSwgMzEuMF0sXG4gICAgICBbMzQuNSwgMjguMF0sXG4gICAgICBbMzEuMCwgMjguMF0sXG4gICAgICBbMzEuMCwgMjUuOF0sXG4gICAgICBbMzQuNSwgMjUuOF0sXG4gICAgICBbMzYuOCwgMjUuOF0sXG4gICAgICBbMzYuOCwgMjMuNl0sXG4gICAgICBbMzQuNSwgMjMuNl0sXG4gICAgICBbMzEuMCwgMjMuNl0sXG4gICAgXVxuXG4gICAgdGhpcy5uYlBvcyA9IHRoaXMudHJ1ZVBvc2l0aW9ucy5sZW5ndGg7XG4gICAgdGhpcy5yYW5nZTtcbiAgICB0aGlzLmRpc3RhbmNlVmFsdWUgPSBbMCwgMCwgMCwgMF07XG5cbiAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICB0aGlzLnBsYXlpbmdTb3VuZHMgPSBbXTtcbiAgICB0aGlzLmdhaW5zID0gW107XG5cbiAgICB0aGlzLnRlbXBYO1xuICAgIHRoaXMudGVtcFk7XG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG4gICAgc3VwZXIuc3RhcnQoKTtcblxuICAgIHRoaXMuc291bmRCYW5rID0gYXdhaXQgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5sb2FkKHtcbiAgICB9LCB0cnVlKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYlBvczsgaSsrKSB7XG4gICAgICAvLyB0aGlzLnBvc2l0aW9ucy5wdXNoKHt4OiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkqMTAwMCAtIDUwMCksIHk6IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSo1MDApfSk7XG4gICAgICB0aGlzLnBvc2l0aW9ucy5wdXNoKHt4OiB0aGlzLnRydWVQb3NpdGlvbnNbaV1bMF0sIHk6dGhpcy50cnVlUG9zaXRpb25zW2ldWzFdfSk7XG4gICAgfVxuXG4gICAgdGhpcy5SYW5nZSh0aGlzLnBvc2l0aW9ucyk7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzLnJhbmdlLm1veVg7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB0aGlzLnJhbmdlLm1pblk7XG5cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cylcblxuICAgIC8vICQuZ2V0KFwiZGF0YS5qc29uXCIsIGZ1bmN0aW9uKGRhdGEpe1xuICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgIC8vIH0pO1xuXG4gICAgdmFyIHRlbXBQcmVmaXggPSBcIlwiO1xuICAgIHZhciBmaWxlO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICB0aGlzLmdhaW5zLnB1c2goYXdhaXQgdGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZ2FpbnMpXG5cbiAgICAgIGlmICh0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSA8IDEwKSB7XG4gICAgICAgIHRlbXBQcmVmaXggPSBcIjBcIjtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0ZW1wUHJlZml4ID0gXCJcIjtcbiAgICAgIH1cblxuICAgICAgZmlsZSA9IHRlbXBQcmVmaXggKyB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSArIFwiLndhdlwiO1xuXG5cbiAgICAgIHRoaXMucGxheWluZ1NvdW5kcy5wdXNoKHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YVtmaWxlXSwgaSkpO1xuICAgICAgdGhpcy5nYWluc1tpXS5jb25uZWN0KHRoaXMuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcblxuXG4gICAgICB0aGlzLmdhaW5zW2ldLmdhaW4uc2V0VmFsdWVBdFRpbWUoMC41LCAwKTtcbiAgICB9XG5cbiAgICAvLyBzdWJzY3JpYmUgdG8gZGlzcGxheSBsb2FkaW5nIHN0YXRlXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW5kZXIoKSk7XG4gICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxuICAgIHRoaXMuZmlsZXN5c3RlbS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5sb2FkU291bmRiYW5rKCkpO1xuXG4gICAgLy8gaW5pdCB3aXRoIGN1cnJlbnQgY29udGVudFxuICAgIHRoaXMubG9hZFNvdW5kYmFuaygpO1xuXG4gICAgLy8gdGhpcy5mcyA9IHJlcXVpcmUoJ2ZpbGUtc3lzdGVtJylcblxuICAgIGNvbnN0IFRyZWUgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0KCdQb3NpdGlvbicpOyAvLy8vLy8vLyDDp2EgbWFyY2hlIHBhcyAoaW1wb3NzaWJpbGUgZCd1dGlsaXNlciBmcywgbmUgdHJvdXZlIHBhcyBsZSBwYXRoLi4uKVxuICAgIC8vIFRyZWUuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcbiAgICAvLyAgIC8vIGNvbnNvbGUubG9nKGxlYWYpXG4gICAgLy8gICBpZiAobGVhZi50eXBlID09PSAnZmlsZScpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2cobGVhZilcbiAgICAvLyAgICAgaWYgKGxlYWYuZXh0ZW5zaW9uID09PSAnLmpzb24nKSB7XG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2cobGVhZi51cmwpXG4gICAgLy8gICAgICAgY29uc29sZS5sb2coSlNPTi5wYXJzZSgnLi9zY2VuZS5qc29uJykpXG4gICAgLy8gICAgICAgLy8gY29uc29sZS5sb2coSlNPTjUucGFyc2UodGhpcy5maWxlc3lzdGVtLnJlYWRGaWxlU3luYyhsZWFmLnVybCwgJ3V0Zi04JykpKTtcbiAgICAvLyAgICAgICAvLyBsZXQgYSA9IHJlcXVpcmUobGVhZi5wYXRoKVxuICAgIC8vICAgICAgIGxldCBiID0gcmVxdWlyZSgnLi9zY2VuZS5qc29uJylcbiAgICAvLyAgICAgICAvLyBjb25zb2xlLmxvZyhhKTtcbiAgICAvLyAgICAgICAvLyBjb25zb2xlLmxvZyhiKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgfVxuICAgIC8vIH0pO1xuXG5cbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBvc2l0aW9ucylcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gdGhpcy5yZW5kZXIoKSk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIGxvYWRTb3VuZGJhbmsoKSB7XG4gICAgY29uc3Qgc291bmRiYW5rVHJlZSA9IHRoaXMuZmlsZXN5c3RlbS5nZXQoJ0F1ZGlvRmlsZXMwJyk7XG4gICAgY29uc3QgZGVmT2JqID0ge307XG4gICAgY29uc29sZS5sb2coc291bmRiYW5rVHJlZSlcblxuICAgIHNvdW5kYmFua1RyZWUuY2hpbGRyZW4uZm9yRWFjaChsZWFmID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKGxlYWYpXG4gICAgICBpZiAobGVhZi50eXBlID09PSAnZmlsZScpIHtcbiAgICAgICAgZGVmT2JqW2xlYWYubmFtZV0gPSBsZWFmLnVybDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZChkZWZPYmosIHRydWUpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuXG4gICAgICBjb25zdCBsb2FkaW5nID0gdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5nZXQoJ2xvYWRpbmcnKTtcbiAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGE7XG4gICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKVxuXG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MVwiIHN0ZXA9MC4xIG1heD0ke3RoaXMucmFuZ2UubWF4WH0gbWluPSR7dGhpcy5yYW5nZS5taW5YfSB2YWx1ZT0ke3RoaXMubGlzdGVuZXJQb3NpdGlvbi54fT48L2lucHV0PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYW5nZVwiIGlkPVwicG9zaXRpb25JbnB1dDJcIiBzdGVwPTAuMSBtYXg9JHt0aGlzLnJhbmdlLm1heFl9IG1pbj0ke3RoaXMucmFuZ2UubWluWX0gdmFsdWU9JHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX0+PC9pbnB1dD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH1cbiAgICAgICAgICAgICR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwid2lkdGg6IDYwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAxODBweDsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwibGlzdGVuZXJcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgaGVpZ2h0OiAxNXB4OyB3aWR0aDogMTVweDsgYmFja2dyb3VuZDogYmx1ZTsgdGV4dC1hbGlnbjogY2VudGVyOyB6LWluZGV4OiAxOyB0cmFuc2Zvcm06IFxuICAgICAgICAgICAgdHJhbnNsYXRlKCR7KHRoaXMubGlzdGVuZXJQb3NpdGlvbi54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxpbmd9cHgsICR7KHRoaXMubGlzdGVuZXJQb3NpdGlvbi55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxpbmd9cHgpIHJvdGF0ZSg0NWRlZylcIlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cblxuLy88cD5hZGQgb3IgcmVtb3ZlIC53YXYgb3IgLm1wMyBmaWxlcyBpbiB0aGUgXCJzb3VuZGJhbmtcIiBkaXJlY3RvcnkgYW5kIG9ic2VydmUgdGhlIGNoYW5nZXM6PC9wPiR7T2JqZWN0LmtleXMoZGF0YSkubWFwKGtleSA9PiB7cmV0dXJuIGh0bWxgPHA+LSBcIiR7a2V5fVwiIGxvYWRlZDogJHtkYXRhW2tleV19LjwvcD5gO30pfVxuXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJykpXG5cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MVwiKTtcbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQyXCIpO1xuXG4gICAgICAgICAgcG9zaXRpb25JbnB1dDEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XG4gICAgICAgICAgfSlcbiAgICAgICAgICBwb3NpdGlvbklucHV0Mi5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uUG9zaXRpb25DaGFuZ2UocG9zaXRpb25JbnB1dDEsIHBvc2l0aW9uSW5wdXQyKTtcbiAgICAgICAgICB9KVxuXG4gICAgICAgICAgdmFyIG1hcmtlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGlzdGVuZXJcIik7XG4gICAgICAgICAgdmFyIG1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKHdpbmRvdy5zY3JlZW4ud2lkdGgpXG5cbiAgICAgICAgICBtYXJrZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIG1vdXNlRG93biA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnRlbXBYID0gbW91c2UuY2xpZW50WDtcbiAgICAgICAgICAgIHRoaXMudGVtcFkgPSBtb3VzZS5jbGllbnRZO1xuICAgICAgICAgICAgdGhpcy5tb3VzZUFjdGlvbihtb3VzZSk7XG4gICAgICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICAgICAgbWFya2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKG1vdXNlKSA9PiB7XG4gICAgICAgICAgICBpZiAobW91c2VEb3duKSB7XG4gICAgICAgICAgICAgIHRoaXMubW91c2VBY3Rpb24obW91c2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICAgIG1hcmtlci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCAobW91c2UpID0+IHtcbiAgICAgICAgICAgIG1vdXNlRG93biA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzO1xuICAgICAgICAgICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSBtb3VzZS5jbGllbnRZO1xuICAgICAgICAgIH0sIGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIHZhciBzaG9vdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvb3RCdXR0b25cIik7XG4gICAgICAvLyBzaG9vdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgLy8gfSk7XG5cbiAgICAgIC8vIHZhciB5YXdTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlckF6aW1BaW1cIik7XG4gICAgICAvLyB5YXdTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcblxuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZChjb250YWluZXIpIHtcblxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RhcnQoKTtcbiAgICB9XG5cblxuICAgIHZhciB0ZW1wQ2lyY2xlXG4gICAgdGhpcy5hdWRpb0NvbnRleHQucmVzdW1lKCk7XG4gICAgLy8gY29uc29sZS5sb2codGhpcy5yYW5nZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgdGVtcENpcmNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgdGVtcENpcmNsZS5pZCA9IFwiY2lyY2xlXCIgKyBpO1xuICAgICAgLy8gY29uc29sZS5sb2codGVtcENpcmNsZSlcbiAgICAgIHRlbXBDaXJjbGUuaW5uZXJIVE1MID0gaTtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUgPSBcInBvc2l0aW9uOiBhYnNvbHV0ZTsgd2lkdGg6IDIwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czogMjBweDsgYmFja2dyb3VuZDogZ3JleTsgbGluZS1oZWlnaHQ6IDIwcHhcIjtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMucG9zaXRpb25zW2ldLnggLSB0aGlzLnJhbmdlLm1veVgpKnRoaXMuc2NhbGluZykgKyBcInB4LCBcIiArICgodGhpcy5wb3NpdGlvbnNbaV0ueSAtIHRoaXMucmFuZ2UubWluWSkqdGhpcy5zY2FsaW5nKSArIFwicHgpXCI7XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcENpcmNsZSlcbiAgICB9XG4gIH1cblxuICBSYW5nZShwb3NpdGlvbnMpIHtcbiAgICB0aGlzLnJhbmdlID0ge1xuICAgICAgbWluWDogcG9zaXRpb25zWzBdLngsXG4gICAgICBtYXhYOiBwb3NpdGlvbnNbMF0ueCwgXG4gICAgICAvLyBtb3lYOiBudWxsLFxuICAgICAgLy8gcmFuZ2VYOiBudWxsLFxuICAgICAgbWluWTogcG9zaXRpb25zWzBdLnksIFxuICAgICAgbWF4WTogcG9zaXRpb25zWzBdLnksXG4gICAgICAvLyBtb3lZOiBudWxsLFxuICAgICAgLy8gcmFuZ2VZOiBudWxsXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54IDwgdGhpcy5yYW5nZS5taW5YKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS54ID4gdGhpcy5yYW5nZS5tYXhYKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WCA9IHBvc2l0aW9uc1tpXS54O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55IDwgdGhpcy5yYW5nZS5taW5ZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWluWSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgICAgaWYgKHBvc2l0aW9uc1tpXS55ID4gdGhpcy5yYW5nZS5tYXhZKSB7XG4gICAgICAgIHRoaXMucmFuZ2UubWF4WSA9IHBvc2l0aW9uc1tpXS55O1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJhbmdlLm1veVggPSAodGhpcy5yYW5nZS5tYXhYICsgdGhpcy5yYW5nZS5taW5YKS8yXG4gICAgdGhpcy5yYW5nZS5tb3lZID0gKHRoaXMucmFuZ2UubWF4WSArIHRoaXMucmFuZ2UubWluWSkvMlxuICAgIHRoaXMucmFuZ2UucmFuZ2VYID0gdGhpcy5yYW5nZS5tYXhYIC0gdGhpcy5yYW5nZS5taW5YO1xuICAgIHRoaXMucmFuZ2UucmFuZ2VZID0gdGhpcy5yYW5nZS5tYXhZIC0gdGhpcy5yYW5nZS5taW5ZO1xuICB9XG5cbiAgb25Qb3NpdGlvbkNoYW5nZSh2YWx1ZVgsIHZhbHVlWSkge1xuICAgIC8vIGNvbnNvbGUubG9nKFwib3VpXCIpXG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB2YWx1ZVgudmFsdWU7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB2YWx1ZVkudmFsdWU7XG5cbiAgICB2YXIgdGVtcFByZWZpeCA9IFwiXCI7XG4gICAgdmFyIGZpbGU7XG5cbiAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0UG9pbnRzSWRcbiAgICB0aGlzLmRpc3RhbmNlU3VtID0gMDtcbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XG4gICAgLy8gY29uc29sZS5sb2codGhpcy5DbG9zZXN0UG9pbnRzSWQpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50czsgaSsrKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcIm5vblwiKVxuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pIHtcbiAgICAgICAgaWYgKHRoaXMuTm90SW4odGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSwgdGhpcy5DbG9zZXN0UG9pbnRzSWQpKSB7XG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcImdyZXlcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdG9wKCk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5kaXNjb25uZWN0KHRoaXMuZ2FpbnNbaV0pO1xuXG4gICAgICAgIGlmICh0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSA8IDEwKSB7XG4gICAgICAgICAgdGVtcFByZWZpeCA9IFwiMFwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHRlbXBQcmVmaXggPSBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgZmlsZSA9IHRlbXBQcmVmaXggKyB0aGlzLkNsb3Nlc3RQb2ludHNJZFtpXSArIFwiLndhdlwiO1xuXG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXSA9IHRoaXMuTG9hZE5ld1NvdW5kKHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YVtmaWxlXSwgaSk7XG4gICAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5zdGFydCgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnBsYXlpbmdTb3VuZHNbaV0pXG4gICAgICB9XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcInJnYigwLCBcIiArIDI1NSooMS0yKnRoaXMuZGlzdGFuY2VWYWx1ZVtpXS90aGlzLmRpc3RhbmNlU3VtKSArIFwiLCAwKVwiO1xuICAgIH1cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgUG9zaXRpb25DaGFuZ2UodmFsdWVYLCB2YWx1ZVkpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcIm91aVwiKVxuXG4gICAgdmFyIHRlbXBQcmVmaXggPSBcIlwiO1xuICAgIHZhciBmaWxlO1xuXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFBvaW50c0lkXG4gICAgdGhpcy5kaXN0YW5jZVN1bSA9IDA7XG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuQ2xvc2VzdFBvaW50c0lkKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYkNsb3Nlc3RQb2ludHM7IGkrKykge1xuICAgICAgLy8gY29uc29sZS5sb2coXCJub25cIilcbiAgICAgIGlmICh0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldICE9IHRoaXMuQ2xvc2VzdFBvaW50c0lkW2ldKSB7XG4gICAgICAgIGlmICh0aGlzLk5vdEluKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0sIHRoaXMuQ2xvc2VzdFBvaW50c0lkKSkge1xuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJncmV5XCI7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RvcCgpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zW2ldKTtcblxuICAgICAgICBpZiAodGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gPCAxMCkge1xuICAgICAgICAgIHRlbXBQcmVmaXggPSBcIjBcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0ZW1wUHJlZml4ID0gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpbGUgPSB0ZW1wUHJlZml4ICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0gKyBcIi53YXZcIjtcblxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0gPSB0aGlzLkxvYWROZXdTb3VuZCh0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmRhdGFbZmlsZV0sIGkpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RhcnQoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5wbGF5aW5nU291bmRzW2ldKVxuICAgICAgfVxuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMuQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZ2IoMCwgXCIgKyAyNTUqKDEtMip0aGlzLmRpc3RhbmNlVmFsdWVbaV0vdGhpcy5kaXN0YW5jZVN1bSkgKyBcIiwgMClcIjtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIG1vdXNlQWN0aW9uKG1vdXNlKSB7XG5cbiAgICAvLyBHZXQgY3VycmVudCBtb3VzZSBjb29yZHNcbiAgICAvLyB2YXIgcmVjdCA9IGNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAvLyB2YXIgbW91c2VYUG9zID0gKG1vdXNlLmNsaWVudFggLSByZWN0LmxlZnQpO1xuICAgIC8vIHZhciBtb3VzZVlQb3MgPSAobW91c2UuY2xpZW50WSAtIHJlY3QudG9wKTtcbiAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IG1vdXNlLmNsaWVudFggLSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsaXN0ZW5lclwiKS5zdHlsZS53aWR0aC8yKTtcbiAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IG1vdXNlLmNsaWVudFkgLSAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJsaXN0ZW5lclwiKS5IZWlnaHQvMik7XG4gICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB0aGlzLnJhbmdlLm1veVggKyAobW91c2UuY2xpZW50WCAtIHdpbmRvdy5zY3JlZW4ud2lkdGgvMikvKHRoaXMuc2NhbGluZyk7XG4gICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB0aGlzLnJhbmdlLm1veVkgKyAobW91c2UuY2xpZW50WSAtIHdpbmRvdy5zY3JlZW4uaGVpZ2h0LzIpLyh0aGlzLnNjYWxpbmcpO1xuICAgIGNvbnNvbGUubG9nKHRoaXMucmFuZ2UubWluWSArIChtb3VzZS5jbGllbnRZIC0gd2luZG93LnNjcmVlbi5oZWlnaHQvMikvKHRoaXMuc2NhbGluZykpO1xuICAgIGNvbnNvbGUubG9nKChtb3VzZS5jbGllbnRZIC0gdGhpcy50ZW1wWSkvKHRoaXMuc2NhbGluZykpO1xuXG4gICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggKz0gKG1vdXNlLmNsaWVudFggLSB0aGlzLnRlbXBYKS90aGlzLnNjYWxpbmc7XG4gICAgLy8gdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgKz0gKG1vdXNlLmNsaWVudFkgLSB0aGlzLnRlbXBZKS90aGlzLnNjYWxpbmdcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGlzdGVuZXJcIikuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxpbmcgKyBtb3VzZS5jbGllbnRYIC0gdGhpcy50ZW1wWCkgKyBcInB4LCBcIiArICgodGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgLSB0aGlzLnJhbmdlLm1pblkpKnRoaXMuc2NhbGluZyArIG1vdXNlLmNsaWVudFkgLSB0aGlzLnRlbXBZKSArXCJweCkgcm90YXRlKDQ1ZGVnKVwiO1xuICAgIC8vIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGlzdGVuZXJcIikuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi54IC0gdGhpcy5yYW5nZS5tb3lYKSp0aGlzLnNjYWxpbmcpICsgXCJweCwgXCIgKyAoKHRoaXMubGlzdGVuZXJQb3NpdGlvbi55IC0gdGhpcy5yYW5nZS5taW5ZKSp0aGlzLnNjYWxpbmcgKyBtb3VzZS5jbGllbnRZIC0gdGhpcy50ZW1wWSkgK1wicHgpIHJvdGF0ZSg0NWRlZylcIjtcbiAgICAvLyB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IDI0O1xuICAgIC8vIGNvbnNvbGUubG9nKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2xlXCIpLnN0eWxlLmhlaWdodCk7XG4gICAgLy8gY29uc29sZS5sb2coKHdpbmRvdy5zY3JlZW4uaGVpZ2h0LzIgLSBtb3VzZS5jbGllbnRZKSk7XG4gICAgLy8gY29uc29sZS5sb2coKHdpbmRvdy5zY3JlZW4uaGVpZ2h0LzIgLSBtb3VzZS5jbGllbnRZKS90aGlzLnNjYWxpbmcpO1xuICAgIC8vIGNvbnNvbGUubG9nKG1vdXNlLmNsaWVudFkpO1xuICB9XG5cblxuICBDbG9zZXN0U291cmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50LCBuYkNsb3Nlc3QpIHtcbiAgICB2YXIgY2xvc2VzdElkcyA9IFtdO1xuICAgIHZhciBjdXJyZW50Q2xvc2VzdElkO1xuICAgIGZvciAobGV0IGogPSAwOyBqIDwgbmJDbG9zZXN0OyBqKyspIHtcbiAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSB1bmRlZmluZWQ7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RPZlBvaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSlcbiAgICAgICAgaWYgKHRoaXMuTm90SW4oaSwgY2xvc2VzdElkcykgJiYgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtpXSkgPCB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKSkge1xuICAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmRpc3RhbmNlVmFsdWVbal0gPSB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKTtcbiAgICAgIHRoaXMuZGlzdGFuY2VTdW0gKz0gdGhpcy5kaXN0YW5jZVZhbHVlW2pdO1xuICAgICAgY2xvc2VzdElkcy5wdXNoKGN1cnJlbnRDbG9zZXN0SWQpO1xuICAgICAgLy8gY29uc29sZS5sb2coY2xvc2VzdElkcylcbiAgICB9XG4gICAgcmV0dXJuIChjbG9zZXN0SWRzKTtcbiAgfVxuXG4gIE5vdEluKHBvaW50SWQsIGxpc3RPZklkcykge1xuICAgIHZhciBpdGVyYXRvciA9IDA7XG4gICAgd2hpbGUgKGl0ZXJhdG9yIDwgbGlzdE9mSWRzLmxlbmd0aCAmJiBwb2ludElkICE9IGxpc3RPZklkc1tpdGVyYXRvcl0pIHtcbiAgICAgIGl0ZXJhdG9yICs9IDE7XG4gICAgfVxuICAgIHJldHVybihpdGVyYXRvciA+PSBsaXN0T2ZJZHMubGVuZ3RoKTtcbiAgfVxuXG4gIERpc3RhbmNlKHBvaW50QSwgcG9pbnRCKSB7XG4gICAgLy8gY29uc29sZS5sb2cocG9pbnRBKVxuICAgIC8vIGNvbnNvbGUubG9nKHBvaW50QilcbiAgICAvLyBpZiAocG9pbnRCID0gdW5kZWZpbmVkKSB7XG4gICAgLy8gICByZXR1cm4gMDtcbiAgICAvLyB9XG4gICAgaWYgKHBvaW50QiAhPSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiAoTWF0aC5zcXJ0KE1hdGgucG93KHBvaW50QS54IC0gcG9pbnRCLngsIDIpICsgTWF0aC5wb3cocG9pbnRBLnkgLSBwb2ludEIueSwgMikpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gKEluZmluaXR5KTtcbiAgICB9XG4gIH1cblxuICBMb2FkTmV3U291bmQoYnVmZmVyLCBpbmRleCkge1xuICAgIC8vIFNvdW5kIGluaXRpYWxpc2F0aW9uXG4gICAgLy8gY29uc29sZS5sb2coYnVmZmVyKVxuICAgIHZhciBTb3VuZCA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpXG4gICAgU291bmQubG9vcCA9IHRydWU7XG4gICAgU291bmQuYnVmZmVyID0gYnVmZmVyO1xuICAgIFNvdW5kLmNvbm5lY3QodGhpcy5nYWluc1tpbmRleF0pO1xuICAgIHJldHVybiBTb3VuZDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDO0lBQzNDLE1BQU1GLE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxJQUFiLENBTDJDLENBTzNDOztJQUNBLEtBQUtDLGlCQUFMLEdB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