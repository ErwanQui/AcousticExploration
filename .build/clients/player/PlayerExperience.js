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
    this.ambisonics = require('ambisonics'); // this.filesystem = this.require('filesystem');
    // console.log(this.filesystem)
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

    this.ClosestPointsId = ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);

    for (let i = 0; i < this.nbPos; i++) {
      this.playingSounds.push(this.audioContext.createBufferSource());
      this.gains.push(this.audioContext.createGain());
      this.gains[i].setValueAtTime(0.5, 0);
      this.playingSounds[i].connect(this.gains[i]);
      this.gains[i].connect(this.audioContext.destination);
      LoadNewSound(this.ClosestPointsId, i);
      this.playingSounds[i].play();
    }

    console.log(this.positions);
    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
    // Debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);
    this.rafId = window.requestAnimationFrame(() => {
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

      closestIds.push(currentClosestId);
      console.log(closestIds);
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
    Sound.buffer = this.soundBank(soundId);
    Sound.connect(this.gain(gainId));
    return Sound;
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiaW5pdGlhbGlzaW5nIiwibGlzdGVuZXJQb3NpdGlvbiIsIngiLCJ5IiwiQ2xvc2VzdFBvaW50c0lkIiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYlBvcyIsIm5iQ2xvc2VzdFBvaW50cyIsInBvc2l0aW9ucyIsInNvdXJjZXNDb2xvciIsImF1ZGlvQ29udGV4dCIsIkF1ZGlvQ29udGV4dCIsInBsYXlpbmdTb3VuZHMiLCJnYWlucyIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0Iiwic291bmRCYW5rIiwibG9hZCIsImkiLCJwdXNoIiwiTWF0aCIsInJvdW5kIiwicmFuZG9tIiwiQ2xvc2VzdFNvdXJjZSIsImNyZWF0ZUJ1ZmZlclNvdXJjZSIsImNyZWF0ZUdhaW4iLCJzZXRWYWx1ZUF0VGltZSIsImNvbm5lY3QiLCJkZXN0aW5hdGlvbiIsIkxvYWROZXdTb3VuZCIsInBsYXkiLCJjb25zb2xlIiwibG9nIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbmRlciIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaHRtbCIsInR5cGUiLCJpZCIsImJlZ2luQnV0dG9uIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb25JbnB1dDEiLCJwb3NpdGlvbklucHV0MiIsIm9uUG9zaXRpb25DaGFuZ2UiLCJjb250YWluZXIiLCJ0ZW1wQ2lyY2xlIiwibGVuZ3RoIiwiY3JlYXRlRWxlbWVudCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwidmFsdWVYIiwidmFsdWVZIiwidmFsdWUiLCJiYWNrZ3JvdW5kIiwic3RvcCIsImRpc2Nvbm5lY3QiLCJsaXN0T2ZQb2ludCIsIm5iQ2xvc2VzdCIsImNsb3Nlc3RJZHMiLCJjdXJyZW50Q2xvc2VzdElkIiwiaiIsIk5vdEluIiwiRGlzdGFuY2UiLCJwb2ludElkIiwibGlzdE9mSWRzIiwiaXRlcmF0b3IiLCJwb2ludEEiLCJwb2ludEIiLCJzcXJ0IiwicG93Iiwic291bmRJZCIsImdhaW5JZCIsIlNvdW5kIiwibG9vcCIsImJ1ZmZlciIsImdhaW4iXSwic291cmNlcyI6WyJQbGF5ZXJFeHBlcmllbmNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFic3RyYWN0RXhwZXJpZW5jZSB9IGZyb20gJ0Bzb3VuZHdvcmtzL2NvcmUvY2xpZW50JztcbmltcG9ydCB7IHJlbmRlciwgaHRtbCB9IGZyb20gJ2xpdC1odG1sJztcbmltcG9ydCByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMgZnJvbSAnQHNvdW5kd29ya3MvdGVtcGxhdGUtaGVscGVycy9jbGllbnQvcmVuZGVyLWluaXRpYWxpemF0aW9uLXNjcmVlbnMuanMnO1xuXG5pbXBvcnQgTWFya2VyIGZyb20gJy4vTWFya2VyLmpzJztcbi8vIGltcG9ydCBNYXAgZnJvbSAnaW1hZ2VzL01hcC5wbmcnO1xuXG5cbmNsYXNzIFBsYXllckV4cGVyaWVuY2UgZXh0ZW5kcyBBYnN0cmFjdEV4cGVyaWVuY2Uge1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIGNvbmZpZyA9IHt9LCAkY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY2xpZW50KTtcblxuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMuJGNvbnRhaW5lciA9ICRjb250YWluZXI7XG4gICAgdGhpcy5yYWZJZCA9IG51bGw7XG5cbiAgICAvLyBSZXF1aXJlIHBsdWdpbnMgaWYgbmVlZGVkXG4gICAgdGhpcy5hdWRpb0J1ZmZlckxvYWRlciA9IHRoaXMucmVxdWlyZSgnYXVkaW8tYnVmZmVyLWxvYWRlcicpO1xuICAgIHRoaXMuYW1iaXNvbmljcyA9IHJlcXVpcmUoJ2FtYmlzb25pY3MnKTtcbiAgICAvLyB0aGlzLmZpbGVzeXN0ZW0gPSB0aGlzLnJlcXVpcmUoJ2ZpbGVzeXN0ZW0nKTtcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0pXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpKVxuICAgIC8vIGNvbnN0IHRyZWVzID0gdGhpcy5maWxlc3lzdGVtLmdldFZhbHVlcygpO1xuICAgIC8vIGZvciAobGV0IG5hbWUgaW4gdHJlZXMpIHtcbiAgICAvLyAgIGNvbnN0IHRyZWUgPSB0cmVlW25hbWVdO1xuICAgIC8vICAgY29uc29sZS5sb2cobmFtZSwgdHJlZSk7XG4gICAgLy8gfVxuXG4gICAgdGhpcy5pbml0aWFsaXNpbmcgPSB0cnVlO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgIH1cbiAgICB0aGlzLkNsb3Nlc3RQb2ludHNJZCA9IFtdO1xuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbXTtcbiAgICB0aGlzLm5iUG9zID0gNDA7XG4gICAgdGhpcy5uYkNsb3Nlc3RQb2ludHMgPSA0O1xuICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgdGhpcy5zb3VyY2VzQ29sb3IgPSBbXCJnb2xkXCIsIFwiZ3JlZW5cIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdO1xuXG4gICAgdGhpcy5hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgdGhpcy5wbGF5aW5nU291bmRzID0gW107XG4gICAgdGhpcy5nYWlucyA9IFtdO1xuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICB0aGlzLnNvdW5kQmFuayA9IGF3YWl0IHRoaXMuYXVkaW9CdWZmZXJMb2FkZXIubG9hZCh7XG4gICAgfSwgdHJ1ZSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJQb3M7IGkrKykge1xuICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjEwMDAgLSA1MDApLCB5OiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkqNTAwKX0pO1xuICAgIH1cblxuICAgIHRoaXMuQ2xvc2VzdFBvaW50c0lkID0gQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cylcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5uYlBvczsgaSsrKSB7XG4gICAgICB0aGlzLnBsYXlpbmdTb3VuZHMucHVzaCh0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKSk7XG4gICAgICB0aGlzLmdhaW5zLnB1c2godGhpcy5hdWRpb0NvbnRleHQuY3JlYXRlR2FpbigpKTtcblxuICAgICAgdGhpcy5nYWluc1tpXS5zZXRWYWx1ZUF0VGltZSgwLjUsIDApO1xuXG4gICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uY29ubmVjdCh0aGlzLmdhaW5zW2ldKTtcbiAgICAgIHRoaXMuZ2FpbnNbaV0uY29ubmVjdCh0aGlzLmF1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgIExvYWROZXdTb3VuZCh0aGlzLkNsb3Nlc3RQb2ludHNJZCwgaSk7XG5cbiAgICAgIHRoaXMucGxheWluZ1NvdW5kc1tpXS5wbGF5KCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2codGhpcy5wb3NpdGlvbnMpXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsICgpID0+IHRoaXMucmVuZGVyKCkpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgLy8gRGVib3VuY2Ugd2l0aCByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYWZJZCk7XG5cbiAgICB0aGlzLnJhZklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgICByZW5kZXIoaHRtbGBcbiAgICAgICAgPGRpdiBzdHlsZT1cInBhZGRpbmc6IDIwcHhcIj5cbiAgICAgICAgICA8aDEgc3R5bGU9XCJtYXJnaW46IDIwcHggMFwiPiR7dGhpcy5jbGllbnQudHlwZX0gW2lkOiAke3RoaXMuY2xpZW50LmlkfV08L2gxPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8aW5wdXQgdHlwZT1cImJ1dHRvblwiIGlkPVwiYmVnaW5CdXR0b25cIiB2YWx1ZT1cIkJlZ2luIEdhbWVcIi8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGlkPVwiZ2FtZVwiIHN0eWxlPVwidmlzaWJpbGl0eTogaGlkZGVuO1wiPlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MVwiIG1heD01MDAgbWluPS01MDAgdmFsdWU9MD48L2lucHV0PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYW5nZVwiIGlkPVwicG9zaXRpb25JbnB1dDJcIiBtYXg9NTAwIG1pbj0gMCB2YWx1ZT0wPjwvaW5wdXQ+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnh9XG4gICAgICAgICAgICAke3RoaXMubGlzdGVuZXJQb3NpdGlvbi55fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgaWQ9XCJjaXJjbGVDb250YWluZXJcIiBzdHlsZT1cIndpZHRoOiA2MDBweDsgdGV4dC1hbGlnbjogY2VudGVyOyBwb3NpdGlvbjogYWJzb2x1dGU7IHRvcDogMTgwcHg7IGxlZnQ6IDUwJVwiPlxuICAgICAgICAgICAgPGRpdiBpZD1cImxpc3RlbmVyXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IGhlaWdodDogMTVweDsgd2lkdGg6IDE1cHg7IGJhY2tncm91bmQ6IGJsdWU7IHRleHQtYWxpZ246IGNlbnRlcjsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH1weCwgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX1weCkgcm90YXRlKDQ1ZGVnKVwiXG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgYCwgdGhpcy4kY29udGFpbmVyKTtcblxuICAgICAgaWYgKHRoaXMuaW5pdGlhbGlzaW5nKSB7XG4gICAgICAgIC8vIEFzc2lnbiBjYWxsYmFja3Mgb25jZVxuICAgICAgICB2YXIgYmVnaW5CdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJlZ2luQnV0dG9uXCIpO1xuICAgICAgICBiZWdpbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgIHRoaXMub25CZWdpbkJ1dHRvbkNsaWNrZWQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NpcmNsZUNvbnRhaW5lcicpKVxuXG4gICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJnYW1lXCIpLnN0eWxlLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblxuICAgICAgICAgIHZhciBwb3NpdGlvbklucHV0MSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicG9zaXRpb25JbnB1dDFcIik7XG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MlwiKTtcbiAgICAgICAgICBwb3NpdGlvbklucHV0MS5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uUG9zaXRpb25DaGFuZ2UocG9zaXRpb25JbnB1dDEsIHBvc2l0aW9uSW5wdXQyKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIHBvc2l0aW9uSW5wdXQyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xuICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmluaXRpYWxpc2luZyA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyB2YXIgc2hvb3RCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNob290QnV0dG9uXCIpO1xuICAgICAgLy8gc2hvb3RCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgIC8vIH0pO1xuXG4gICAgICAvLyB2YXIgeWF3U2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZXJBemltQWltXCIpO1xuICAgICAgLy8geWF3U2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCAoKSA9PiB7XG5cbiAgICAgIC8vIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgb25CZWdpbkJ1dHRvbkNsaWNrZWQoY29udGFpbmVyKSB7XG4gICAgdmFyIHRlbXBDaXJjbGVcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucG9zaXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0ZW1wQ2lyY2xlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB0ZW1wQ2lyY2xlLmlkID0gXCJjaXJjbGVcIiArIGk7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlID0gXCJwb3NpdGlvbjogYWJzb2x1dGU7IHdpZHRoOiAyMHB4OyBoZWlnaHQ6IDIwcHg7IGJvcmRlci1yYWRpdXM6IDIwcHg7IGJhY2tncm91bmQ6IHJlZDsgdGV4dC1hbGlnbjogY2VudGVyO1wiO1xuICAgICAgdGVtcENpcmNsZS5zdHlsZS50cmFuc2Zvcm0gPSBcInRyYW5zbGF0ZShcIiArIHRoaXMucG9zaXRpb25zW2ldLnggKyBcInB4LCBcIiArIHRoaXMucG9zaXRpb25zW2ldLnkgKyBcInB4KVwiO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRlbXBDaXJjbGUpXG4gICAgfVxuICB9XG5cbiAgb25Qb3NpdGlvbkNoYW5nZSh2YWx1ZVgsIHZhbHVlWSkge1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi54ID0gdmFsdWVYLnZhbHVlO1xuICAgIHRoaXMubGlzdGVuZXJQb3NpdGlvbi55ID0gdmFsdWVZLnZhbHVlO1xuXG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCAtIHRoaXMuQ2xvc2VzdFBvaW50c0lkXG4gICAgdGhpcy5DbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5iQ2xvc2VzdFBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0gIT0gdGhpcy5DbG9zZXN0UG9pbnRzSWQpIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSBcInJlZFwiO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5DbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSB0aGlzLnNvdXJjZXNDb2xvcltpXTtcblxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uc3RvcCgpO1xuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0uZGlzY29ubmVjdCh0aGlzLmdhaW5zKGkpKTtcblxuICAgICAgICB0aGlzLnBsYXlpbmdTb3VuZHNbaV0gPSBuZXcgTG9hZE5ld1NvdW5kKHRoaXMuQ2xvc2VzdFBvaW50c0lkW2ldLCBpKTtcbiAgICAgICAgdGhpcy5wbGF5aW5nU291bmRzW2ldLnBsYXkoKVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgQ2xvc2VzdFNvdXJjZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludCwgbmJDbG9zZXN0KSB7XG4gICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcbiAgICB2YXIgY3VycmVudENsb3Nlc3RJZDtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5iQ2xvc2VzdDsgaisrKSB7XG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gMDtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbGlzdE9mUG9pbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuTm90SW4oaSwgY2xvc2VzdElkcykgJiYgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtpXSkgPCB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKSkge1xuICAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XG4gICAgICBjb25zb2xlLmxvZyhjbG9zZXN0SWRzKVxuICAgIH1cbiAgICByZXR1cm4gKGNsb3Nlc3RJZHMpO1xuICB9XG5cbiAgTm90SW4ocG9pbnRJZCwgbGlzdE9mSWRzKSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gMDtcbiAgICB3aGlsZSAoaXRlcmF0b3IgPCBsaXN0T2ZJZHMubGVuZ3RoICYmIHBvaW50SWQgIT0gbGlzdE9mSWRzW2l0ZXJhdG9yXSkge1xuICAgICAgaXRlcmF0b3IgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuKGl0ZXJhdG9yID49IGxpc3RPZklkcy5sZW5ndGgpO1xuICB9XG5cbiAgRGlzdGFuY2UocG9pbnRBLCBwb2ludEIpIHtcbiAgICByZXR1cm4gKE1hdGguc3FydChNYXRoLnBvdyhwb2ludEEueCAtIHBvaW50Qi54LCAyKSArIE1hdGgucG93KHBvaW50QS55IC0gcG9pbnRCLnksIDIpKSk7XG4gIH1cblxuICBMb2FkTmV3U291bmQoc291bmRJZCwgZ2FpbklkKSB7XG4gICAgLy8gU291bmQgaW5pdGlhbGlzYXRpb25cbiAgICB2YXIgU291bmQgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKVxuICAgIFNvdW5kLmxvb3AgPSB0cnVlO1xuICAgIFNvdW5kLmJ1ZmZlciA9IHRoaXMuc291bmRCYW5rKHNvdW5kSWQpO1xuICAgIFNvdW5kLmNvbm5lY3QodGhpcy5nYWluKGdhaW5JZCkpO1xuICAgIHJldHVybiBTb3VuZDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQbGF5ZXJFeHBlcmllbmNlO1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7QUFDQTtBQUdBLE1BQU1BLGdCQUFOLFNBQStCQywwQkFBL0IsQ0FBa0Q7RUFDaERDLFdBQVcsQ0FBQ0MsTUFBRCxFQUFTQyxNQUFNLEdBQUcsRUFBbEIsRUFBc0JDLFVBQXRCLEVBQWtDO0lBQzNDLE1BQU1GLE1BQU47SUFFQSxLQUFLQyxNQUFMLEdBQWNBLE1BQWQ7SUFDQSxLQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtJQUNBLEtBQUtDLEtBQUwsR0FBYSxJQUFiLENBTDJDLENBTzNDOztJQUNBLEtBQUtDLGlCQUFMLEdBQXlCLEtBQUtDLE9BQUwsQ0FBYSxxQkFBYixDQUF6QjtJQUNBLEtBQUtDLFVBQUwsR0FBa0JELE9BQU8sQ0FBQyxZQUFELENBQXpCLENBVDJDLENBVTNDO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7O0lBRUEsS0FB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