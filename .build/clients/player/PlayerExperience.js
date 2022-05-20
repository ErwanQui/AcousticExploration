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
    this.rafId = null; // this.filesystem = this.require('filesystem');
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
    var tempSourcesPositions = Object.values(this.positions); // document.getElementById("circle" + this.previousClosestPointsId[0]).style.background = "red";
    // this.previousClosestPointsId[0] = this.ClosestSource(this.listenerPosition, this.positions);

    for (let i = 0; i < this.previousClosestPointsId.length; i++) {
      document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "red"; // this.previousClosestPointsId[i] = this.IdDiff(this.ClosestSource(this.listenerPosition, tempSourcesPositions), this.previousClosestPointsId.splice(i));

      this.previousClosestPointsId[i] = this.ClosestSource(this.listenerPosition, tempSourcesPositions);
      console.log(this.previousClosestPointsId[i]);
      console.log(tempSourcesPositions[this.previousClosestPointsId[i]]);
      console.log(tempSourcesPositions.splice(this.previousClosestPointsId[i], 1));
    }

    for (let i = 0; i < this.previousClosestPointsId.length; i++) {
      document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = this.sourcesColor[i];
      console.log(this.previousClosestPointsId);
    } // this.previousClosestPointId = this.ClosestSource(this.listenerPosition, this.positions);
    // console.log(this.ClosestSource(this.listenerPosition, this.positions));


    this.render();
  }

  IdDiff(id, idList) {
    var count = 0;

    for (let j = 0; j < idList.length; j++) {
      if (id > idList[j]) {
        count += 1;
      }
    }

    return count;
  }

  ClosestSource(listenerPosition, listOfPoint) {
    var closestId = 0;

    for (let i = 1; i < listOfPoint.length; i++) {
      if (this.Distance(listenerPosition, listOfPoint[i]) < this.Distance(listenerPosition, listOfPoint[closestId])) {
        closestId = i;
      }
    } // console.log(this.Distance(listenerPosition, listOfPoint[closestId]));


    return closestId;
  }

  Distance(pointA, pointB) {
    return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
  }

}

var _default = PlayerExperience;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJpbml0aWFsaXNpbmciLCJsaXN0ZW5lclBvc2l0aW9uIiwieCIsInkiLCJwcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCIsIm5iUG9zIiwicG9zaXRpb25zIiwic291cmNlc0NvbG9yIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJpIiwicHVzaCIsIk1hdGgiLCJyb3VuZCIsInJhbmRvbSIsImNvbnNvbGUiLCJsb2ciLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwicmVuZGVyIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbklucHV0MSIsInBvc2l0aW9uSW5wdXQyIiwib25Qb3NpdGlvbkNoYW5nZSIsImNvbnRhaW5lciIsInRlbXBDaXJjbGUiLCJsZW5ndGgiLCJjcmVhdGVFbGVtZW50IiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJ2YWx1ZVgiLCJ2YWx1ZVkiLCJ2YWx1ZSIsInRlbXBTb3VyY2VzUG9zaXRpb25zIiwiT2JqZWN0IiwidmFsdWVzIiwiYmFja2dyb3VuZCIsIkNsb3Nlc3RTb3VyY2UiLCJzcGxpY2UiLCJJZERpZmYiLCJpZExpc3QiLCJjb3VudCIsImoiLCJsaXN0T2ZQb2ludCIsImNsb3Nlc3RJZCIsIkRpc3RhbmNlIiwicG9pbnRBIiwicG9pbnRCIiwic3FydCIsInBvdyJdLCJzb3VyY2VzIjpbIlBsYXllckV4cGVyaWVuY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWJzdHJhY3RFeHBlcmllbmNlIH0gZnJvbSAnQHNvdW5kd29ya3MvY29yZS9jbGllbnQnO1xuaW1wb3J0IHsgcmVuZGVyLCBodG1sIH0gZnJvbSAnbGl0LWh0bWwnO1xuaW1wb3J0IHJlbmRlckluaXRpYWxpemF0aW9uU2NyZWVucyBmcm9tICdAc291bmR3b3Jrcy90ZW1wbGF0ZS1oZWxwZXJzL2NsaWVudC9yZW5kZXItaW5pdGlhbGl6YXRpb24tc2NyZWVucy5qcyc7XG5cbmltcG9ydCBNYXJrZXIgZnJvbSAnLi9NYXJrZXIuanMnO1xuLy8gaW1wb3J0IE1hcCBmcm9tICdpbWFnZXMvTWFwLnBuZyc7XG5cblxuY2xhc3MgUGxheWVyRXhwZXJpZW5jZSBleHRlbmRzIEFic3RyYWN0RXhwZXJpZW5jZSB7XG4gIGNvbnN0cnVjdG9yKGNsaWVudCwgY29uZmlnID0ge30sICRjb250YWluZXIpIHtcbiAgICBzdXBlcihjbGllbnQpO1xuXG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy4kY29udGFpbmVyID0gJGNvbnRhaW5lcjtcbiAgICB0aGlzLnJhZklkID0gbnVsbDtcblxuICAgIC8vIHRoaXMuZmlsZXN5c3RlbSA9IHRoaXMucmVxdWlyZSgnZmlsZXN5c3RlbScpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbSlcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCkpXG4gICAgLy8gY29uc3QgdHJlZXMgPSB0aGlzLmZpbGVzeXN0ZW0uZ2V0VmFsdWVzKCk7XG4gICAgLy8gZm9yIChsZXQgbmFtZSBpbiB0cmVlcykge1xuICAgIC8vICAgY29uc3QgdHJlZSA9IHRyZWVbbmFtZV07XG4gICAgLy8gICBjb25zb2xlLmxvZyhuYW1lLCB0cmVlKTtcbiAgICAvLyB9XG5cbiAgICB0aGlzLmluaXRpYWxpc2luZyA9IHRydWU7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDAsXG4gICAgfVxuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSBbMCwgMSwgMiwgM107XG4gICAgdGhpcy5uYlBvcyA9IDQwO1xuICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgdGhpcy5zb3VyY2VzQ29sb3IgPSBbXCJnb2xkXCIsIFwiZ3JlZW5cIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG4gICAgc3VwZXIuc3RhcnQoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHRoaXMubmJQb3M7IGkrKykge1xuICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjEwMDAgLSA1MDApLCB5OiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkqNTAwKX0pO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyh0aGlzLnBvc2l0aW9ucylcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gdGhpcy5yZW5kZXIoKSk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBpZD1cInBvc2l0aW9uSW5wdXQxXCIgbWF4PTUwMCBtaW49LTUwMCB2YWx1ZT0wPjwvaW5wdXQ+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MlwiIG1heD01MDAgbWluPSAwIHZhbHVlPTA+PC9pbnB1dD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH1cbiAgICAgICAgICAgICR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwid2lkdGg6IDYwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAxODBweDsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwibGlzdGVuZXJcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgaGVpZ2h0OiAxNXB4OyB3aWR0aDogMTVweDsgYmFja2dyb3VuZDogYmx1ZTsgdGV4dC1hbGlnbjogY2VudGVyOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgke3RoaXMubGlzdGVuZXJQb3NpdGlvbi54fXB4LCAke3RoaXMubGlzdGVuZXJQb3NpdGlvbi55fXB4KSByb3RhdGUoNDVkZWcpXCJcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJykpXG5cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MVwiKTtcbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQyXCIpO1xuICAgICAgICAgIHBvc2l0aW9uSW5wdXQxLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgcG9zaXRpb25JbnB1dDIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIHZhciBzaG9vdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvb3RCdXR0b25cIik7XG4gICAgICAvLyBzaG9vdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgLy8gfSk7XG5cbiAgICAgIC8vIHZhciB5YXdTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlckF6aW1BaW1cIik7XG4gICAgICAvLyB5YXdTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcblxuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZChjb250YWluZXIpIHtcbiAgICB2YXIgdGVtcENpcmNsZVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRlbXBDaXJjbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHRlbXBDaXJjbGUuaWQgPSBcImNpcmNsZVwiICsgaTtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUgPSBcInBvc2l0aW9uOiBhYnNvbHV0ZTsgd2lkdGg6IDIwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czogMjBweDsgYmFja2dyb3VuZDogcmVkOyB0ZXh0LWFsaWduOiBjZW50ZXI7XCI7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgdGhpcy5wb3NpdGlvbnNbaV0ueCArIFwicHgsIFwiICsgdGhpcy5wb3NpdGlvbnNbaV0ueSArIFwicHgpXCI7XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcENpcmNsZSlcbiAgICB9XG4gIH1cblxuICBvblBvc2l0aW9uQ2hhbmdlKHZhbHVlWCwgdmFsdWVZKSB7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB2YWx1ZVgudmFsdWU7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB2YWx1ZVkudmFsdWU7XG5cbiAgICB2YXIgdGVtcFNvdXJjZXNQb3NpdGlvbnMgPSBPYmplY3QudmFsdWVzKHRoaXMucG9zaXRpb25zKTtcbiAgICAvLyBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFswXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgLy8gdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFswXSA9IHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQubGVuZ3RoOyBpICsrKSB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgICAvLyB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldID0gdGhpcy5JZERpZmYodGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGVtcFNvdXJjZXNQb3NpdGlvbnMpLCB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkLnNwbGljZShpKSk7XG4gICAgICB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGVtcFNvdXJjZXNQb3NpdGlvbnMpO1xuICAgICAgY29uc29sZS5sb2codGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSlcbiAgICAgIGNvbnNvbGUubG9nKHRlbXBTb3VyY2VzUG9zaXRpb25zW3RoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV1dKVxuICAgICAgY29uc29sZS5sb2codGVtcFNvdXJjZXNQb3NpdGlvbnMuc3BsaWNlKHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWRbaV0sIDEpKVxuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQubGVuZ3RoOyBpICsrKSB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IHRoaXMuc291cmNlc0NvbG9yW2ldO1xuICAgICAgY29uc29sZS5sb2codGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCk7XG4gICAgfVxuXG4gICAgLy8gdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludElkID0gdGhpcy5DbG9zZXN0U291cmNlKHRoaXMubGlzdGVuZXJQb3NpdGlvbiwgdGhpcy5wb3NpdGlvbnMpO1xuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuQ2xvc2VzdFNvdXJjZSh0aGlzLmxpc3RlbmVyUG9zaXRpb24sIHRoaXMucG9zaXRpb25zKSk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIElkRGlmZihpZCwgaWRMaXN0KSB7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGlkTGlzdC5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGlkID4gaWRMaXN0W2pdKSB7XG4gICAgICAgIGNvdW50ICs9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAoY291bnQpO1xuICB9XG5cbiAgQ2xvc2VzdFNvdXJjZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludCkge1xuICAgIHZhciBjbG9zZXN0SWQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgbGlzdE9mUG9pbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLkRpc3RhbmNlKGxpc3RlbmVyUG9zaXRpb24sIGxpc3RPZlBvaW50W2ldKSA8IHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbY2xvc2VzdElkXSkpIHtcbiAgICAgICAgY2xvc2VzdElkID0gaTtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2codGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjbG9zZXN0SWRdKSk7XG4gICAgcmV0dXJuIChjbG9zZXN0SWQpO1xuICB9XG5cbiAgRGlzdGFuY2UocG9pbnRBLCBwb2ludEIpIHtcbiAgICByZXR1cm4gKE1hdGguc3FydChNYXRoLnBvdyhwb2ludEEueCAtIHBvaW50Qi54LCAyKSArIE1hdGgucG93KHBvaW50QS55IC0gcG9pbnRCLnksIDIpKSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGxheWVyRXhwZXJpZW5jZTtcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUVBOzs7O0FBQ0E7QUFHQSxNQUFNQSxnQkFBTixTQUErQkMsMEJBQS9CLENBQWtEO0VBQ2hEQyxXQUFXLENBQUNDLE1BQUQsRUFBU0MsTUFBTSxHQUFHLEVBQWxCLEVBQXNCQyxVQUF0QixFQUFrQztJQUMzQyxNQUFNRixNQUFOO0lBRUEsS0FBS0MsTUFBTCxHQUFjQSxNQUFkO0lBQ0EsS0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7SUFDQSxLQUFLQyxLQUFMLEdBQWEsSUFBYixDQUwyQyxDQU8zQztJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBOztJQUVBLEtBQUtDLFlBQUwsR0FBb0IsSUFBcEI7SUFDQSxLQUFLQyxnQkFBTCxHQUF3QjtNQUN0QkMsQ0FBQyxFQUFFLENBRG1CO01BRXRCQyxDQUFDLEVBQUU7SUFGbUIsQ0FBeEI7SUFJQSxLQUFLQyx1QkFBTCxHQUErQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxFQUFVLENBQVYsQ0FBL0I7SUFDQSxLQUFLQyxLQUFMLEdBQWEsRUFBYjtJQUNBLEtBQUtDLFNBQUwsR0FBaUIsRUFBakI7SUFDQSxLQUFLQyxZQUFMLEdBQW9CLENBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsT0FBbEIsRUFBMkIsT0FB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