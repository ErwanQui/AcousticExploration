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

// import Map from 'images/Map.png';
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

    this.initialising = true;
    this.listenerPosition = {
      x: 0,
      y: 0
    };
    this.ClosestPointsId = [];
    this.previousClosestPointsId = [];
    this.nbPos = 40;
    this.nbClosestPoints = 4;
    this.positions = [];
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
      this.positions.push({
        x: Math.round(Math.random() * 1000 - 500),
        y: Math.round(Math.random() * 500)
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
    // subscribe to display loading state

    this.audioBufferLoader.subscribe(() => this.render()); // subscribe to display loading state

    this.filesystem.subscribe(() => this.loadSoundbank()); // init with current content

    this.loadSoundbank(); // console.log(this.positions)

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
        // console.log(leaf.url)
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
        <p>add or remove .wav or .mp3 files in the "soundbank" directory and observe the changes:</p>

          ${Object.keys(data).map(key => {
        return (0, _litHtml.html)`<p>- "${key}" loaded: ${data[key]}.</p>`;
      })}
      `, this.$container);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiZmlsZXN5c3RlbSIsImluaXRpYWxpc2luZyIsImxpc3RlbmVyUG9zaXRpb24iLCJ4IiwieSIsIkNsb3Nlc3RQb2ludHNJZCIsInByZXZpb3VzQ2xvc2VzdFBvaW50c0lkIiwibmJQb3MiLCJuYkNsb3Nlc3RQb2ludHMiLCJwb3NpdGlvbnMiLCJzb3VyY2VzQ29sb3IiLCJhdWRpb0NvbnRleHQiLCJBdWRpb0NvbnRleHQiLCJwbGF5aW5nU291bmRzIiwiZ2FpbnMiLCJyZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMiLCJzdGFydCIsInNvdW5kQmFuayIsImxvYWQiLCJpIiwicHVzaCIsIk1hdGgiLCJyb3VuZCIsInJhbmRvbSIsIkNsb3Nlc3RTb3VyY2UiLCJzdWJzY3JpYmUiLCJyZW5kZXIiLCJsb2FkU291bmRiYW5rIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInNvdW5kYmFua1RyZWUiLCJnZXQiLCJkZWZPYmoiLCJjb25zb2xlIiwibG9nIiwiY2hpbGRyZW4iLCJmb3JFYWNoIiwibGVhZiIsInR5cGUiLCJuYW1lIiwidXJsIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJsb2FkaW5nIiwiZGF0YSIsImh0bWwiLCJpZCIsIk9iamVjdCIsImtleXMiLCJtYXAiLCJrZXkiLCJiZWdpbkJ1dHRvbiIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJvbkJlZ2luQnV0dG9uQ2xpY2tlZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsInBvc2l0aW9uSW5wdXQxIiwicG9zaXRpb25JbnB1dDIiLCJvblBvc2l0aW9uQ2hhbmdlIiwiY29udGFpbmVyIiwidGVtcENpcmNsZSIsImxlbmd0aCIsImNyZWF0ZUVsZW1lbnQiLCJ0cmFuc2Zvcm0iLCJhcHBlbmRDaGlsZCIsInZhbHVlWCIsInZhbHVlWSIsInZhbHVlIiwiYmFja2dyb3VuZCIsInN0b3AiLCJkaXNjb25uZWN0IiwiTG9hZE5ld1NvdW5kIiwicGxheSIsImxpc3RPZlBvaW50IiwibmJDbG9zZXN0IiwiY2xvc2VzdElkcyIsImN1cnJlbnRDbG9zZXN0SWQiLCJqIiwiTm90SW4iLCJEaXN0YW5jZSIsInBvaW50SWQiLCJsaXN0T2ZJZHMiLCJpdGVyYXRvciIsInBvaW50QSIsInBvaW50QiIsInNxcnQiLCJwb3ciLCJzb3VuZElkIiwiZ2FpbklkIiwiU291bmQiLCJjcmVhdGVCdWZmZXJTb3VyY2UiLCJsb29wIiwiYnVmZmVyIiwiY29ubmVjdCIsImdhaW4iXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTWFya2VyIGZyb20gJy4vTWFya2VyLmpzJztcbi8vIGltcG9ydCBNYXAgZnJvbSAnaW1hZ2VzL01hcC5wbmcnO1xuXG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpO1xuICAgIHRoaXMuYW1iaXNvbmljcyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcbiAgICB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0pXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpKVxuICAgIC8vIGNvbnN0IHRyZWVzID0gdGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpO1xuICAgIC8vIGZvciAobGV0IG5hbWUgaW4gdHJlZXMpIHtcbiAgICAvLyAgIGNvbnN0IHRyZWUgPSB0cmVlW25hbWVdO1xuICAgIC8vICAgY29uc29sZS5sb2cobmFtZSwgdHJlZSk7XG4gICAgLy8gfVxuXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH1cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdO1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTtcbiAgICB0aGlzLm5iUG9zID0gNDA7XG4gICAgdGhpcy5uYkNsb3Nlc3RQb2ludHMgPSA0O1xuICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgdGhpcy5zb3VyY2VzQ29sb3IgPSBbXCJnb2xkXCIsIFwiZ3JlZW5cIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdO1xuXG4gICAgdGhpcy5hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgdGhpcy5wbGF5aW5nU291bmRzID0gW107XG4gICAgdGhpcy5nYWlucyA9IFtdO1xuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICB0aGlzLnNvdW5kQmFuayA9IGF3YWl0IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZCh7XG4gICAgfSwgdHJ1ZSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJQb3M7IGkrKykge1xuICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjEwMDAgLSA1MDApLCB5OiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkqNTAwKX0pO1xuICAgIH1cblxuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMsIHRoaXMubmJDbG9zZXN0UG9pbnRzKVxuXG4gICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iUG9zOyBpKyspIHtcbiAgICAvLyAgIHRoaXMucGxheWluZ1NvdW5kcy5wdXNoKHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpKTtcbiAgICAvLyAgIHRoaXMuZ2FpbnMucHVzaCh0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCkpO1xuXG4gICAgLy8gICB0aGlzLmdhaW5zW2ldLmdhaW4uc2V0VmFsdWVBdFRpbWUoMC41LCAwKTtcblxuICAgIC8vICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLmNvbm5lY3QodGhpcy5nYWluc1tpXSk7XG4gICAgLy8gICB0aGlzLmdhaW5zW2ldLmNvbm5lY3QodGhpcy5hdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuXG4gICAgLy8gICB0aGlzLkxvYWROZXdTb3VuZCh0aGlzLkNsb3Nlc3RQb2ludHNJZCwgaSk7XG5cbiAgICAvLyAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5wbGF5KCk7XG4gICAgLy8gfVxuXG5cbiAgICAvLyBzdWJzY3JpYmUgdG8gZGlzcGxheSBsb2FkaW5nIHN0YXRlXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW5kZXIoKSk7XG4gICAgLy8gc3Vic2NyaWJlIHRvIGRpc3BsYXkgbG9hZGluZyBzdGF0ZVxuICAgIHRoaXMuZmlsZXN5c3RlbS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5sb2FkU291bmRiYW5rKCkpO1xuXG4gICAgLy8gaW5pdCB3aXRoIGN1cnJlbnQgY29udGVudFxuICAgIHRoaXMubG9hZFNvdW5kYmFuaygpO1xuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5wb3NpdGlvbnMpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBsb2FkU291bmRiYW5rKCkge1xuICAgIGNvbnN0IHNvdW5kYmFua1RyZWUgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0KCdBdWRpb0ZpbGVzMCcpO1xuICAgIGNvbnN0IGRlZk9iaiA9IHt9O1xuICAgIGNvbnNvbGUubG9nKHNvdW5kYmFua1RyZWUpXG5cbiAgICBzb3VuZGJhbmtUcmVlLmNoaWxkcmVuLmZvckVhY2gobGVhZiA9PiB7XG4gICAgICAvLyBjb25zb2xlLmxvZyhsZWFmKVxuICAgICAgaWYgKGxlYWYudHlwZSA9PT0gJ2ZpbGUnKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGxlYWYudXJsKVxuICAgICAgICBkZWZPYmpbbGVhZi5uYW1lXSA9IGxlYWYudXJsO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlci5sb2FkKGRlZk9iaiwgdHJ1ZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGxvYWRpbmcgPSB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyLmdldCgnbG9hZGluZycpO1xuICAgICAgY29uc3QgZGF0YSA9IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIuZGF0YTtcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG5cbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBpZD1cInBvc2l0aW9uSW5wdXQxXCIgbWF4PTUwMCBtaW49LTUwMCB2YWx1ZT0wPjwvaW5wdXQ+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MlwiIG1heD01MDAgbWluPSAwIHZhbHVlPTA+PC9pbnB1dD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH1cbiAgICAgICAgICAgICR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwid2lkdGg6IDYwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAxODBweDsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwibGlzdGVuZXJcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgaGVpZ2h0OiAxNXB4OyB3aWR0aDogMTVweDsgYmFja2dyb3VuZDogYmx1ZTsgdGV4dC1hbGlnbjogY2VudGVyOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgke3RoaXMubGlzdGVuZXJQb3NpdGlvbi54fXB4LCAke3RoaXMubGlzdGVuZXJQb3NpdGlvbi55fXB4KSByb3RhdGUoNDVkZWcpXCJcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxwPmFkZCBvciByZW1vdmUgLndhdiBvciAubXAzIGZpbGVzIGluIHRoZSBcInNvdW5kYmFua1wiIGRpcmVjdG9yeSBhbmQgb2JzZXJ2ZSB0aGUgY2hhbmdlczo8L3A+XG5cbiAgICAgICAgICAke09iamVjdC5rZXlzKGRhdGEpLm1hcChrZXkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGh0bWxgPHA+LSBcIiR7a2V5fVwiIGxvYWRlZDogJHtkYXRhW2tleV19LjwvcD5gO1xuICAgICAgICAgIH0pfVxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpKVxuXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIHZhciBwb3NpdGlvbklucHV0MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicG9zaXRpb25JbnB1dDFcIik7XG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MlwiKTtcbiAgICAgICAgICBwb3NpdGlvbklucHV0MS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uUG9zaXRpb25DaGFuZ2UocG9zaXRpb25JbnB1dDEsIHBvc2l0aW9uSW5wdXQyKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIHBvc2l0aW9uSW5wdXQyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyB2YXIgc2hvb3RCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob290QnV0dG9uXCIpO1xuICAgICAgLy8gc2hvb3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIC8vIH0pO1xuXG4gICAgICAvLyB2YXIgeWF3U2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZXJBemltQWltXCIpO1xuICAgICAgLy8geWF3U2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG5cbiAgICAgIC8vIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoY29udGFpbmVyKSB7XG4gICAgdmFyIHRlbXBDaXJjbGVcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0ZW1wQ2lyY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB0ZW1wQ2lyY2xlLmlkID0gXCJjaXJjbGVcIiArIGk7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlID0gXCJwb3NpdGlvbjogYWJzb2x1dGU7IHdpZHRoOiAyMHB4OyBoZWlnaHQ6IDIwcHg7IGJvcmRlci1yYWRpdXM6IDIwcHg7IGJhY2tncm91bmQ6IHJlZDsgdGV4dC1hbGlnbjogY2VudGVyO1wiO1xuICAgICAgdGVtcENpcmNsZS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHRoaXMucG9zaXRpb25zW2ldLnggKyBcInB4LCBcIiArIHRoaXMucG9zaXRpb25zW2ldLnkgKyBcInB4KVwiO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBDaXJjbGUpXG4gICAgfVxuICB9XG5cbiAgb25Qb3NpdGlvbkNoYW5nZSh2YWx1ZVgsIHZhbHVlWSkge1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdmFsdWVYLnZhbHVlO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gdmFsdWVZLnZhbHVlO1xuXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCAtIHRoaXMuQ2xvc2VzdFBvaW50c0lkXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWQpIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcInJlZFwiO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSB0aGlzLnNvdXJjZXNDb2xvcltpXTtcblxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RvcCgpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zKGkpKTtcblxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0gPSBuZXcgTG9hZE5ld1NvdW5kKHRoaXMuQ2xvc2VzdFBvaW50c0lkW2ldLCBpKTtcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnBsYXkoKVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgQ2xvc2VzdFNvdXJjZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludCwgbmJDbG9zZXN0KSB7XG4gICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcbiAgICB2YXIgY3VycmVudENsb3Nlc3RJZDtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5iQ2xvc2VzdDsgaisrKSB7XG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gMDtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbGlzdE9mUG9pbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuTm90SW4oaSwgY2xvc2VzdElkcykgJiYgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtpXSkgPCB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKSkge1xuICAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhjbG9zZXN0SWRzKVxuICAgIH1cbiAgICByZXR1cm4gKGNsb3Nlc3RJZHMpO1xuICB9XG5cbiAgTm90SW4ocG9pbnRJZCwgbGlzdE9mSWRzKSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gMDtcbiAgICB3aGlsZSAoaXRlcmF0b3IgPCBsaXN0T2ZJZHMubGVuZ3RoICYmIHBvaW50SWQgIT0gbGlzdE9mSWRzW2l0ZXJhdG9yXSkge1xuICAgICAgaXRlcmF0b3IgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuKGl0ZXJhdG9yID49IGxpc3RPZklkcy5sZW5ndGgpO1xuICB9XG5cbiAgRGlzdGFuY2UocG9pbnRBLCBwb2ludEIpIHtcbiAgICByZXR1cm4gKE1hdGguc3FydChNYXRoLnBvdyhwb2ludEEueCAtIHBvaW50Qi54LCAyKSArIE1hdGgucG93KHBvaW50QS55IC0gcG9pbnRCLnksIDIpKSk7XG4gIH1cblxuICBMb2FkTmV3U291bmQoc291bmRJZCwgZ2FpbklkKSB7XG4gICAgLy8gU291bmQgaW5pdGlhbGlzYXRpb25cbiAgICB2YXIgU291bmQgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKVxuICAgIFNvdW5kLmxvb3AgPSB0cnVlO1xuICAgIFNvdW5kLmJ1ZmZlciA9IHRoaXMuc291bmRCYW5rW3NvdW5kSWRdO1xuICAgIFNvdW5kLmNvbm5lY3QodGhpcy5nYWluW2dhaW5JZF0pO1xuICAgIHJldHVybiBTb3VuZDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7QUFDQTtBQUdBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFB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