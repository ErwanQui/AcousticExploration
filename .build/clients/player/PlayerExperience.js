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
    this.previousClosestPointsId = [0, 1, 2, 3];
    this.nbPos = 40;
    this.nbClosestPoints = 4;
    this.positions = [];
    this.sourcesColor = ["gold", "green", "white", "black"];
    (0, _renderInitializationScreens.default)(client, config, $container);
  }

  async start() {
    super.start();

    for (let i = 0; i <= this.nbPos; i++) {
      this.positions.push({
        x: Math.round(Math.random() * 1000 - 500),
        y: Math.round(Math.random() * 500)
      });
    }

    for (let i = 0; i < this.nbClosestPoints; i++) {}

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
    var tempSourcesPositions = Object.values(this.positions);

    for (let i = 0; i < this.previousClosestPointsId.length; i++) {
      document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "red";
    }

    this.previousClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);

    for (let i = 0; i < this.previousClosestPointsId.length; i++) {
      document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = this.sourcesColor[i];
    }

    this.render();
  } // IdDiff(id, idList) {
  //   var count = 0;
  //   for (let j = 0; j < idList.length; j++) {
  //     if (id > idList[j]) {
  //       count += 1;
  //     }
  //   }
  //   return (count);
  // }


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

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJhdWRpb0J1ZmZlckxvYWRlciIsInJlcXVpcmUiLCJhbWJpc29uaWNzIiwiaW5pdGlhbGlzaW5nIiwibGlzdGVuZXJQb3NpdGlvbiIsIngiLCJ5IiwicHJldmlvdXNDbG9zZXN0UG9pbnRzSWQiLCJuYlBvcyIsIm5iQ2xvc2VzdFBvaW50cyIsInBvc2l0aW9ucyIsInNvdXJjZXNDb2xvciIsInJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyIsInN0YXJ0IiwiaSIsInB1c2giLCJNYXRoIiwicm91bmQiLCJyYW5kb20iLCJjb25zb2xlIiwibG9nIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbmRlciIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaHRtbCIsInR5cGUiLCJpZCIsImJlZ2luQnV0dG9uIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsIm9uQmVnaW5CdXR0b25DbGlja2VkIiwic3R5bGUiLCJ2aXNpYmlsaXR5IiwicG9zaXRpb25JbnB1dDEiLCJwb3NpdGlvbklucHV0MiIsIm9uUG9zaXRpb25DaGFuZ2UiLCJjb250YWluZXIiLCJ0ZW1wQ2lyY2xlIiwibGVuZ3RoIiwiY3JlYXRlRWxlbWVudCIsInRyYW5zZm9ybSIsImFwcGVuZENoaWxkIiwidmFsdWVYIiwidmFsdWVZIiwidmFsdWUiLCJ0ZW1wU291cmNlc1Bvc2l0aW9ucyIsIk9iamVjdCIsInZhbHVlcyIsImJhY2tncm91bmQiLCJDbG9zZXN0U291cmNlIiwibGlzdE9mUG9pbnQiLCJuYkNsb3Nlc3QiLCJjbG9zZXN0SWRzIiwiY3VycmVudENsb3Nlc3RJZCIsImoiLCJOb3RJbiIsIkRpc3RhbmNlIiwicG9pbnRJZCIsImxpc3RPZklkcyIsIml0ZXJhdG9yIiwicG9pbnRBIiwicG9pbnRCIiwic3FydCIsInBvdyJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmltcG9ydCBNYXJrZXIgZnJvbSAnLi9NYXJrZXIuanMnO1xuLy8gaW1wb3J0IE1hcCBmcm9tICdpbWFnZXMvTWFwLnBuZyc7XG5cblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIFJlcXVpcmUgcGx1Z2lucyBpZiBuZWVkZWRcbiAgICB0aGlzLmF1ZGlvQnVmZmVyTG9hZGVyID0gdGhpcy5yZXF1aXJlKCdhdWRpby1idWZmZXItbG9hZGVyJyk7XG4gICAgdGhpcy5hbWJpc29uaWNzID0gcmVxdWlyZSgnYW1iaXNvbmljcycpO1xuICAgIC8vIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCkpXG4gICAgLy8gY29uc3QgdHJlZXMgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCk7XG4gICAgLy8gZm9yIChsZXQgbmFtZSBpbiB0cmVlcykge1xuICAgIC8vICAgY29uc3QgdHJlZSA9IHRyZWVbbmFtZV07XG4gICAgLy8gICBjb25zb2xlLmxvZyhuYW1lLCB0cmVlKTtcbiAgICAvLyB9XG5cbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDAsXG4gICAgfVxuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbMCwgMSwgMiwgM107XG4gICAgdGhpcy5uYlBvcyA9IDQwO1xuICAgIHRoaXMubmJDbG9zZXN0UG9pbnRzID0gNDtcbiAgICB0aGlzLnBvc2l0aW9ucyA9IFtdO1xuICAgIHRoaXMuc291cmNlc0NvbG9yID0gW1wiZ29sZFwiLCBcImdyZWVuXCIsIFwid2hpdGVcIiwgXCJibGFja1wiXVxuXG4gICAgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zKGNsaWVudCwgY29uZmlnLCAkY29udGFpbmVyKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0KCkge1xuICAgIHN1cGVyLnN0YXJ0KCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8PSB0aGlzLm5iUG9zOyBpKyspIHtcbiAgICAgIHRoaXMucG9zaXRpb25zLnB1c2goe3g6IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSoxMDAwIC0gNTAwKSwgeTogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjUwMCl9KTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubmJDbG9zZXN0UG9pbnRzOyBpKyspIHtcbiAgICAgIFxuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKHRoaXMucG9zaXRpb25zKVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCAoKSA9PiB0aGlzLnJlbmRlcigpKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIC8vIERlYm91bmNlIHdpdGggcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucmFmSWQpO1xuXG4gICAgdGhpcy5yYWZJZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgcmVuZGVyKGh0bWxgXG4gICAgICAgIDxkaXYgc3R5bGU9XCJwYWRkaW5nOiAyMHB4XCI+XG4gICAgICAgICAgPGgxIHN0eWxlPVwibWFyZ2luOiAyMHB4IDBcIj4ke3RoaXMuY2xpZW50LnR5cGV9IFtpZDogJHt0aGlzLmNsaWVudC5pZH1dPC9oMT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGlucHV0IHR5cGU9XCJidXR0b25cIiBpZD1cImJlZ2luQnV0dG9uXCIgdmFsdWU9XCJCZWdpbiBHYW1lXCIvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBpZD1cImdhbWVcIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlbjtcIj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYW5nZVwiIGlkPVwicG9zaXRpb25JbnB1dDFcIiBtYXg9NTAwIG1pbj0tNTAwIHZhbHVlPTA+PC9pbnB1dD5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBpZD1cInBvc2l0aW9uSW5wdXQyXCIgbWF4PTUwMCBtaW49IDAgdmFsdWU9MD48L2lucHV0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAke3RoaXMubGlzdGVuZXJQb3NpdGlvbi54fVxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGlkPVwiY2lyY2xlQ29udGFpbmVyXCIgc3R5bGU9XCJ3aWR0aDogNjAwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDE4MHB4OyBsZWZ0OiA1MCVcIj5cbiAgICAgICAgICAgIDxkaXYgaWQ9XCJsaXN0ZW5lclwiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyBoZWlnaHQ6IDE1cHg7IHdpZHRoOiAxNXB4OyBiYWNrZ3JvdW5kOiBibHVlOyB0ZXh0LWFsaWduOiBjZW50ZXI7IHRyYW5zZm9ybTogdHJhbnNsYXRlKCR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnh9cHgsICR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnl9cHgpIHJvdGF0ZSg0NWRlZylcIlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIGAsIHRoaXMuJGNvbnRhaW5lcik7XG5cbiAgICAgIGlmICh0aGlzLmluaXRpYWxpc2luZykge1xuICAgICAgICAvLyBBc3NpZ24gY2FsbGJhY2tzIG9uY2VcbiAgICAgICAgdmFyIGJlZ2luQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJiZWdpbkJ1dHRvblwiKTtcbiAgICAgICAgYmVnaW5CdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgICB0aGlzLm9uQmVnaW5CdXR0b25DbGlja2VkKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaXJjbGVDb250YWluZXInKSlcblxuICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZVwiKS5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQxXCIpO1xuICAgICAgICAgIHZhciBwb3NpdGlvbklucHV0MiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicG9zaXRpb25JbnB1dDJcIik7XG4gICAgICAgICAgcG9zaXRpb25JbnB1dDEuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XG4gICAgICAgICAgfSlcbiAgICAgICAgICBwb3NpdGlvbklucHV0Mi5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm9uUG9zaXRpb25DaGFuZ2UocG9zaXRpb25JbnB1dDEsIHBvc2l0aW9uSW5wdXQyKTtcbiAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pbml0aWFsaXNpbmcgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gdmFyIHNob290QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzaG9vdEJ1dHRvblwiKTtcbiAgICAgIC8vIHNob290QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAvLyB9KTtcblxuICAgICAgLy8gdmFyIHlhd1NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2xpZGVyQXppbUFpbVwiKTtcbiAgICAgIC8vIHlhd1NsaWRlci5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT4ge1xuXG4gICAgICAvLyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uQmVnaW5CdXR0b25DbGlja2VkKGNvbnRhaW5lcikge1xuICAgIHZhciB0ZW1wQ2lyY2xlXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvc2l0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgdGVtcENpcmNsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgdGVtcENpcmNsZS5pZCA9IFwiY2lyY2xlXCIgKyBpO1xuICAgICAgdGVtcENpcmNsZS5zdHlsZSA9IFwicG9zaXRpb246IGFic29sdXRlOyB3aWR0aDogMjBweDsgaGVpZ2h0OiAyMHB4OyBib3JkZXItcmFkaXVzOiAyMHB4OyBiYWNrZ3JvdW5kOiByZWQ7IHRleHQtYWxpZ246IGNlbnRlcjtcIjtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGUoXCIgKyB0aGlzLnBvc2l0aW9uc1tpXS54ICsgXCJweCwgXCIgKyB0aGlzLnBvc2l0aW9uc1tpXS55ICsgXCJweClcIjtcbiAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZW1wQ2lyY2xlKVxuICAgIH1cbiAgfVxuXG4gIG9uUG9zaXRpb25DaGFuZ2UodmFsdWVYLCB2YWx1ZVkpIHtcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueCA9IHZhbHVlWC52YWx1ZTtcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24ueSA9IHZhbHVlWS52YWx1ZTtcblxuICAgIHZhciB0ZW1wU291cmNlc1Bvc2l0aW9ucyA9IE9iamVjdC52YWx1ZXModGhpcy5wb3NpdGlvbnMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZC5sZW5ndGg7IGkgKyspIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gXCJyZWRcIjtcbiAgICB9XG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zLCB0aGlzLm5iQ2xvc2VzdFBvaW50cyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkLmxlbmd0aDsgaSArKykge1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaXJjbGVcIiArIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0pLnN0eWxlLmJhY2tncm91bmQgPSB0aGlzLnNvdXJjZXNDb2xvcltpXTtcbiAgICB9XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIC8vIElkRGlmZihpZCwgaWRMaXN0KSB7XG4gIC8vICAgdmFyIGNvdW50ID0gMDtcbiAgLy8gICBmb3IgKGxldCBqID0gMDsgaiA8IGlkTGlzdC5sZW5ndGg7IGorKykge1xuICAvLyAgICAgaWYgKGlkID4gaWRMaXN0W2pdKSB7XG4gIC8vICAgICAgIGNvdW50ICs9IDE7XG4gIC8vICAgICB9XG4gIC8vICAgfVxuICAvLyAgIHJldHVybiAoY291bnQpO1xuICAvLyB9XG5cbiAgQ2xvc2VzdFNvdXJjZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludCwgbmJDbG9zZXN0KSB7XG4gICAgdmFyIGNsb3Nlc3RJZHMgPSBbXTtcbiAgICB2YXIgY3VycmVudENsb3Nlc3RJZDtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5iQ2xvc2VzdDsgaisrKSB7XG4gICAgICBjdXJyZW50Q2xvc2VzdElkID0gMDtcbiAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbGlzdE9mUG9pbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuTm90SW4oaSwgY2xvc2VzdElkcykgJiYgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtpXSkgPCB0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2N1cnJlbnRDbG9zZXN0SWRdKSkge1xuICAgICAgICAgIGN1cnJlbnRDbG9zZXN0SWQgPSBpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjbG9zZXN0SWRzLnB1c2goY3VycmVudENsb3Nlc3RJZCk7XG4gICAgICBjb25zb2xlLmxvZyhjbG9zZXN0SWRzKVxuICAgIH1cbiAgICByZXR1cm4gKGNsb3Nlc3RJZHMpO1xuICB9XG5cbiAgTm90SW4ocG9pbnRJZCwgbGlzdE9mSWRzKSB7XG4gICAgdmFyIGl0ZXJhdG9yID0gMDtcbiAgICB3aGlsZSAoaXRlcmF0b3IgPCBsaXN0T2ZJZHMubGVuZ3RoICYmIHBvaW50SWQgIT0gbGlzdE9mSWRzW2l0ZXJhdG9yXSkge1xuICAgICAgaXRlcmF0b3IgKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuKGl0ZXJhdG9yID49IGxpc3RPZklkcy5sZW5ndGgpO1xuICB9XG5cbiAgRGlzdGFuY2UocG9pbnRBLCBwb2ludEIpIHtcbiAgICByZXR1cm4gKE1hdGguc3FydChNYXRoLnBvdyhwb2ludEEueCAtIHBvaW50Qi54LCAyKSArIE1hdGgucG93KHBvaW50QS55IC0gcG9pbnRCLnksIDIpKSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBQ0E7QUFHQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQztJQUMzQyxNQUFNRixNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLQyxLQUFMLEdBQWEsSUFBYixDQUwyQyxDQU8zQzs7SUFDQSxLQUFLQyxpQkFBTCxHQUF5QixLQUFLQyxPQUFMLENBQWEscUJBQWIsQ0FBekI7SUFDQSxLQUFLQyxVQUFMLEdBQWtCRCxPQUFPLENBQUMsWUFBRCxDQUF6QixDQVQyQyxDQVUzQztJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBOztJQUVBLEtBQUtFLFlBQUwsR0FBb0IsSUFBcEI7SUFDQSxLQUFLQyxnQkFBTCxHQUF3QjtNQUN0QkMsQ0FBQyxFQUFFLENBRG1CO01BRXRCQyxDQUFDLEVBQUU7SUFGbUIsQ0FBeEI7SUFJQSxLQUFLQyx1QkFBTCxHQUErQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsQ0FBL0I7SUFDQSxLQUFLQyxLQUFMLEdBQWEsRUFBYjtJQUNBLEtBQUtDLGVBQUwsR0FBdUIsQ0FBdkI7SUFDQSxLQUFLQyxTQUFMLEdBQWlCLEVBQWpCO0lBQ0EsS0FBS0MsWUFBTCxHQUFvQixDQUFDLE1BQUQsRUFBUyxPQUFULEVBQWtCLE9BQWxCLEVBQTJCLE9BQTNCLENBQXBCO0lBRUEsSUFBQUMsb0NBQUEsRUFBNEJoQixNQUE1QixFQUFvQ0MsTUFBcEMsRUFBNENDLFVBQTVDO0VBQ0Q7O0VBRVUsTUFBTGUsS0FBSyxHQUFHO0lBQ1osTUFBTUEsS0FBTjs7SUFFQSxLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLElBQUksS0FBS04sS0FBMUIsRUFBaUNNLENBQUMsRUFBbEMsRUFBc0M7TUFDcEMsS0FBS0osU0FBTCxDQUFlSyxJQUFmLENBQW9CO1FBQUNWLENBQUMsRUFBRVcsSUFBSSxDQUFDQyxLQUFMLENBQVdELElBQUksQ0FBQ0UsTUFBTCxLQUFjLElBQWQsR0FBcUIsR0FBaEMsQ0FBSjtRQUEwQ1osQ0FBQyxFQUFFVSxJQUFJLENBQUNDLEtBQUwsQ0FBV0QsSUFBSSxDQUFDRSxNQUFMLEtBQWMsR0FBekI7TUFBN0MsQ0FBcEI7SUFDRDs7SUFFRCxLQUFLLElBQUlKLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBS0wsZUFBekIsRUFBMENLLENBQUMsRUFBM0MsRUFBK0MsQ0FFOUM7O0lBRURLLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLEtBQUtWLFNBQWpCO0lBQ0FXLE1BQU0sQ0FBQ0MsZ0JBQVAsQ0FBd0IsUUFBeEIsRUFBa0MsTUFBTSxLQUFLQyxNQUFMLEVBQXhDO0lBQ0EsS0FBS0EsTUFBTDtFQUNEOztFQUVEQSxNQUFNLEdBQUc7SUFDUDtJQUNBRixNQUFNLENBQUNHLG9CQUFQLENBQTRCLEtBQUt6QixLQUFqQztJQUVBLEtBQUtBLEtBQUwsR0FBYXNCLE1BQU0sQ0FBQ0kscUJBQVAsQ0FBNkIsTUFBTTtNQUM5QyxJQUFBRixlQUFBLEVBQU8sSUFBQUcsYUFBQSxDQUFLO0FBQ2xCO0FBQ0EsdUNBQXVDLEtBQUs5QixNQUFMLENBQVkrQixJQUFLLFNBQVEsS0FBSy9CLE1BQUwsQ0FBWWdDLEVBQUc7QUFDL0U7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjLEtBQUt4QixnQkFBTCxDQUFzQkMsQ0FBRTtBQUN0QyxjQUFjLEtBQUtELGdCQUFMLENBQXNCRSxDQUFFO0FBQ3RDO0FBQ0E7QUFDQSxrSkFBa0osS0FBS0YsZ0JBQUwsQ0FBc0JDLENBQUUsT0FBTSxLQUFLRCxnQkFBTCxDQUFzQkUsQ0FBRTtBQUN4TTtBQUNBO0FBQ0EsT0FwQk0sRUFvQkcsS0FBS1IsVUFwQlI7O01Bc0JBLElBQUksS0FBS0ssWUFBVCxFQUF1QjtRQUNyQjtRQUNBLElBQUkwQixXQUFXLEdBQUdDLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixhQUF4QixDQUFsQjtRQUNBRixXQUFXLENBQUNQLGdCQUFaLENBQTZCLE9BQTdCLEVBQXNDLE1BQU07VUFDMUMsS0FBS1Usb0JBQUwsQ0FBMEJGLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixpQkFBeEIsQ0FBMUI7VUFFQUQsUUFBUSxDQUFDQyxjQUFULENBQXdCLE1BQXhCLEVBQWdDRSxLQUFoQyxDQUFzQ0MsVUFBdEMsR0FBbUQsU0FBbkQ7VUFFQSxJQUFJQyxjQUFjLEdBQUdMLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixnQkFBeEIsQ0FBckI7VUFDQSxJQUFJSyxjQUFjLEdBQUdOLFFBQVEsQ0FBQ0MsY0FBVCxDQUF3QixnQkFBeEIsQ0FBckI7VUFDQUksY0FBYyxDQUFDYixnQkFBZixDQUFnQyxPQUFoQyxFQUF3QyxNQUFNO1lBQzVDLEtBQUtlLGdCQUFMLENBQXNCRixjQUF0QixFQUFzQ0MsY0FBdEM7VUFDRCxDQUZEO1VBR0FBLGNBQWMsQ0FBQ2QsZ0JBQWYsQ0FBZ0MsT0FBaEMsRUFBd0MsTUFBTTtZQUM1QyxLQUFLZSxnQkFBTCxDQUFzQkYsY0FBdEIsRUFBc0NDLGNBQXRDO1VBQ0QsQ0FGRDtRQUdELENBYkQ7UUFjQSxLQUFLakMsWUFBTCxHQUFvQixLQUFwQjtNQUNELENBekM2QyxDQTJDOUM7TUFDQTtNQUNBO01BRUE7TUFDQTtNQUVBOztJQUNELENBbkRZLENBQWI7RUFvREQ7O0VBRUQ2QixvQkFBb0IsQ0FBQ00sU0FBRCxFQUFZO0lBQzlCLElBQUlDLFVBQUo7O0lBQ0EsS0FBSyxJQUFJekIsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBRyxLQUFLSixTQUFMLENBQWU4QixNQUFuQyxFQUEyQzFCLENBQUMsRUFBNUMsRUFBZ0Q7TUFDOUN5QixVQUFVLEdBQUdULFFBQVEsQ0FBQ1csYUFBVCxDQUF1QixLQUF2QixDQUFiO01BQ0FGLFVBQVUsQ0FBQ1gsRUFBWCxHQUFnQixXQUFXZCxDQUEzQjtNQUNBeUIsVUFBVSxDQUFDTixLQUFYLEdBQW1CLDBHQUFuQjtNQUNBTSxVQUFVLENBQUNOLEtBQVgsQ0FBaUJTLFNBQWpCLEdBQTZCLGVBQWUsS0FBS2hDLFNBQUwsQ0FBZUksQ0FBZixFQUFrQlQsQ0FBakMsR0FBcUMsTUFBckMsR0FBOEMsS0FBS0ssU0FBTCxDQUFlSSxDQUFmLEVBQWtCUixDQUFoRSxHQUFvRSxLQUFqRztNQUNBZ0MsU0FBUyxDQUFDSyxXQUFWLENBQXNCSixVQUF0QjtJQUNEO0VBQ0Y7O0VBRURGLGdCQUFnQixDQUFDTyxNQUFELEVBQVNDLE1BQVQsRUFBaUI7SUFDL0IsS0FBS3pDLGdCQUFMLENBQXNCQyxDQUF0QixHQUEwQnVDLE1BQU0sQ0FBQ0UsS0FBakM7SUFDQSxLQUFLMUMsZ0JBQUwsQ0FBc0JFLENBQXRCLEdBQTBCdUMsTUFBTSxDQUFDQyxLQUFqQztJQUVBLElBQUlDLG9CQUFvQixHQUFHQyxNQUFNLENBQUNDLE1BQVAsQ0FBYyxLQUFLdkMsU0FBbkIsQ0FBM0I7O0lBQ0EsS0FBSyxJQUFJSSxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHLEtBQUtQLHVCQUFMLENBQTZCaUMsTUFBakQsRUFBeUQxQixDQUFDLEVBQTFELEVBQStEO01BQzdEZ0IsUUFBUSxDQUFDQyxjQUFULENBQXdCLFdBQVcsS0FBS3hCLHVCQUFMLENBQTZCTyxDQUE3QixDQUFuQyxFQUFvRW1CLEtBQXBFLENBQTBFaUIsVUFBMUUsR0FBdUYsS0FBdkY7SUFDRDs7SUFDRCxLQUFLM0MsdUJBQUwsR0FBK0IsS0FBSzRDLGFBQUwsQ0FBbUIsS0FBSy9DLGdCQUF4QixFQUEwQyxLQUFLTSxTQUEvQyxFQUEwRCxLQUFLRCxlQUEvRCxDQUEvQjs7SUFDQSxLQUFLLElBQUlLLENBQUMsR0FBRyxDQUFiLEVBQWdCQSxDQUFDLEdBQUcsS0FBS1AsdUJBQUwsQ0FBNkJpQyxNQUFqRCxFQUF5RDFCLENBQUMsRUFBMUQsRUFBK0Q7TUFDN0RnQixRQUFRLENBQUNDLGNBQVQsQ0FBd0IsV0FBVyxLQUFLeEIsdUJBQUwsQ0FBNkJPLENBQTdCLENBQW5DLEVBQW9FbUIsS0FBcEUsQ0FBMEVpQixVQUExRSxHQUF1RixLQUFLdkMsWUFBTCxDQUFrQkcsQ0FBbEIsQ0FBdkY7SUFDRDs7SUFDRCxLQUFLUyxNQUFMO0VBQ0QsQ0FwSStDLENBc0loRDtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7OztFQUVBNEIsYUFBYSxDQUFDL0MsZ0JBQUQsRUFBbUJnRCxXQUFuQixFQUFnQ0MsU0FBaEMsRUFBMkM7SUFDdEQsSUFBSUMsVUFBVSxHQUFHLEVBQWpCO0lBQ0EsSUFBSUMsZ0JBQUo7O0lBQ0EsS0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHSCxTQUFwQixFQUErQkcsQ0FBQyxFQUFoQyxFQUFvQztNQUNsQ0QsZ0JBQWdCLEdBQUcsQ0FBbkI7O01BQ0EsS0FBSyxJQUFJekMsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR3NDLFdBQVcsQ0FBQ1osTUFBaEMsRUFBd0MxQixDQUFDLEVBQXpDLEVBQTZDO1FBQzNDLElBQUksS0FBSzJDLEtBQUwsQ0FBVzNDLENBQVgsRUFBY3dDLFVBQWQsS0FBNkIsS0FBS0ksUUFBTCxDQUFjdEQsZ0JBQWQsRUFBZ0NnRCxXQUFXLENBQUN0QyxDQUFELENBQTNDLElBQWtELEtBQUs0QyxRQUFMLENBQWN0RCxnQkFBZCxFQUFnQ2dELFdBQVcsQ0FBQ0csZ0JBQUQsQ0FBM0MsQ0FBbkYsRUFBbUo7VUFDakpBLGdCQUFnQixHQUFHekMsQ0FBbkI7UUFDRDtNQUNGOztNQUNEd0MsVUFBVSxDQUFDdkMsSUFBWCxDQUFnQndDLGdCQUFoQjtNQUNBcEMsT0FBTyxDQUFDQyxHQUFSLENBQVlrQyxVQUFaO0lBQ0Q7O0lBQ0QsT0FBUUEsVUFBUjtFQUNEOztFQUVERyxLQUFLLENBQUNFLE9BQUQsRUFBVUMsU0FBVixFQUFxQjtJQUN4QixJQUFJQyxRQUFRLEdBQUcsQ0FBZjs7SUFDQSxPQUFPQSxRQUFRLEdBQUdELFNBQVMsQ0FBQ3BCLE1BQXJCLElBQStCbUIsT0FBTyxJQUFJQyxTQUFTLENBQUNDLFFBQUQsQ0FBMUQsRUFBc0U7TUFDcEVBLFFBQVEsSUFBSSxDQUFaO0lBQ0Q7O0lBQ0QsT0FBT0EsUUFBUSxJQUFJRCxTQUFTLENBQUNwQixNQUE3QjtFQUNEOztFQUVEa0IsUUFBUSxDQUFDSSxNQUFELEVBQVNDLE1BQVQsRUFBaUI7SUFDdkIsT0FBUS9DLElBQUksQ0FBQ2dELElBQUwsQ0FBVWhELElBQUksQ0FBQ2lELEdBQUwsQ0FBU0gsTUFBTSxDQUFDekQsQ0FBUCxHQUFXMEQsTUFBTSxDQUFDMUQsQ0FBM0IsRUFBOEIsQ0FBOUIsSUFBbUNXLElBQUksQ0FBQ2lELEdBQUwsQ0FBU0gsTUFBTSxDQUFDeEQsQ0FBUCxHQUFXeUQsTUFBTSxDQUFDekQsQ0FBM0IsRUFBOEIsQ0FBOUIsQ0FBN0MsQ0FBUjtFQUNEOztBQTFLK0M7O2VBNktuQ2IsZ0IifQ==