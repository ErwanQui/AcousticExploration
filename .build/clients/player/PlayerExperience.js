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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQbGF5ZXJFeHBlcmllbmNlIiwiQWJzdHJhY3RFeHBlcmllbmNlIiwiY29uc3RydWN0b3IiLCJjbGllbnQiLCJjb25maWciLCIkY29udGFpbmVyIiwicmFmSWQiLCJpbml0aWFsaXNpbmciLCJsaXN0ZW5lclBvc2l0aW9uIiwieCIsInkiLCJwcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCIsIm5iUG9zIiwibmJDbG9zZXN0UG9pbnRzIiwicG9zaXRpb25zIiwic291cmNlc0NvbG9yIiwicmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIiwic3RhcnQiLCJpIiwicHVzaCIsIk1hdGgiLCJyb3VuZCIsInJhbmRvbSIsImNvbnNvbGUiLCJsb2ciLCJ3aW5kb3ciLCJhZGRFdmVudExpc3RlbmVyIiwicmVuZGVyIiwiY2FuY2VsQW5pbWF0aW9uRnJhbWUiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJodG1sIiwidHlwZSIsImlkIiwiYmVnaW5CdXR0b24iLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwib25CZWdpbkJ1dHRvbkNsaWNrZWQiLCJzdHlsZSIsInZpc2liaWxpdHkiLCJwb3NpdGlvbklucHV0MSIsInBvc2l0aW9uSW5wdXQyIiwib25Qb3NpdGlvbkNoYW5nZSIsImNvbnRhaW5lciIsInRlbXBDaXJjbGUiLCJsZW5ndGgiLCJjcmVhdGVFbGVtZW50IiwidHJhbnNmb3JtIiwiYXBwZW5kQ2hpbGQiLCJ2YWx1ZVgiLCJ2YWx1ZVkiLCJ2YWx1ZSIsInRlbXBTb3VyY2VzUG9zaXRpb25zIiwiT2JqZWN0IiwidmFsdWVzIiwiYmFja2dyb3VuZCIsIkNsb3Nlc3RTb3VyY2UiLCJsaXN0T2ZQb2ludCIsIm5iQ2xvc2VzdCIsImNsb3Nlc3RJZHMiLCJjdXJyZW50Q2xvc2VzdElkIiwiaiIsIk5vdEluIiwiRGlzdGFuY2UiLCJwb2ludElkIiwibGlzdE9mSWRzIiwiaXRlcmF0b3IiLCJwb2ludEEiLCJwb2ludEIiLCJzcXJ0IiwicG93Il0sInNvdXJjZXMiOlsiUGxheWVyRXhwZXJpZW5jZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYnN0cmFjdEV4cGVyaWVuY2UgfSBmcm9tICdAc291bmR3b3Jrcy9jb3JlL2NsaWVudCc7XG5pbXBvcnQgeyByZW5kZXIsIGh0bWwgfSBmcm9tICdsaXQtaHRtbCc7XG5pbXBvcnQgcmVuZGVySW5pdGlhbGl6YXRpb25TY3JlZW5zIGZyb20gJ0Bzb3VuZHdvcmtzL3RlbXBsYXRlLWhlbHBlcnMvY2xpZW50L3JlbmRlci1pbml0aWFsaXphdGlvbi1zY3JlZW5zLmpzJztcblxuaW1wb3J0IE1hcmtlciBmcm9tICcuL01hcmtlci5qcyc7XG4vLyBpbXBvcnQgTWFwIGZyb20gJ2ltYWdlcy9NYXAucG5nJztcblxuXG5jbGFzcyBQbGF5ZXJFeHBlcmllbmNlIGV4dGVuZHMgQWJzdHJhY3RFeHBlcmllbmNlIHtcbiAgY29uc3RydWN0b3IoY2xpZW50LCBjb25maWcgPSB7fSwgJGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNsaWVudCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLiRjb250YWluZXIgPSAkY29udGFpbmVyO1xuICAgIHRoaXMucmFmSWQgPSBudWxsO1xuXG4gICAgLy8gdGhpcy5maWxlc3lzdGVtID0gdGhpcy5yZXF1aXJlKCdmaWxlc3lzdGVtJyk7XG4gICAgLy8gY29uc29sZS5sb2codGhpcy5maWxlc3lzdGVtKVxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZmlsZXN5c3RlbS5nZXRWYWx1ZXMoKSlcbiAgICAvLyBjb25zdCB0cmVlcyA9IHRoaXMuZmlsZXN5c3RlbS5nZXRWYWx1ZXMoKTtcbiAgICAvLyBmb3IgKGxldCBuYW1lIGluIHRyZWVzKSB7XG4gICAgLy8gICBjb25zdCB0cmVlID0gdHJlZVtuYW1lXTtcbiAgICAvLyAgIGNvbnNvbGUubG9nKG5hbWUsIHRyZWUpO1xuICAgIC8vIH1cblxuICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmxpc3RlbmVyUG9zaXRpb24gPSB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICB9XG4gICAgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZCA9IFswLCAxLCAyLCAzXTtcbiAgICB0aGlzLm5iUG9zID0gNDA7XG4gICAgdGhpcy5uYkNsb3Nlc3RQb2ludHMgPSA0O1xuICAgIHRoaXMucG9zaXRpb25zID0gW107XG4gICAgdGhpcy5zb3VyY2VzQ29sb3IgPSBbXCJnb2xkXCIsIFwiZ3JlZW5cIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdXG5cbiAgICByZW5kZXJJbml0aWFsaXphdGlvblNjcmVlbnMoY2xpZW50LCBjb25maWcsICRjb250YWluZXIpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnQoKSB7XG4gICAgc3VwZXIuc3RhcnQoKTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IHRoaXMubmJQb3M7IGkrKykge1xuICAgICAgdGhpcy5wb3NpdGlvbnMucHVzaCh7eDogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpKjEwMDAgLSA1MDApLCB5OiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkqNTAwKX0pO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyh0aGlzLnBvc2l0aW9ucylcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4gdGhpcy5yZW5kZXIoKSk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICAvLyBEZWJvdW5jZSB3aXRoIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJhZklkKTtcblxuICAgIHRoaXMucmFmSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIHJlbmRlcihodG1sYFxuICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZzogMjBweFwiPlxuICAgICAgICAgIDxoMSBzdHlsZT1cIm1hcmdpbjogMjBweCAwXCI+JHt0aGlzLmNsaWVudC50eXBlfSBbaWQ6ICR7dGhpcy5jbGllbnQuaWR9XTwvaDE+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgaWQ9XCJiZWdpbkJ1dHRvblwiIHZhbHVlPVwiQmVnaW4gR2FtZVwiLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgaWQ9XCJnYW1lXCIgc3R5bGU9XCJ2aXNpYmlsaXR5OiBoaWRkZW47XCI+XG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFuZ2VcIiBpZD1cInBvc2l0aW9uSW5wdXQxXCIgbWF4PTUwMCBtaW49LTUwMCB2YWx1ZT0wPjwvaW5wdXQ+XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhbmdlXCIgaWQ9XCJwb3NpdGlvbklucHV0MlwiIG1heD01MDAgbWluPSAwIHZhbHVlPTA+PC9pbnB1dD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgJHt0aGlzLmxpc3RlbmVyUG9zaXRpb24ueH1cbiAgICAgICAgICAgICR7dGhpcy5saXN0ZW5lclBvc2l0aW9uLnl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBpZD1cImNpcmNsZUNvbnRhaW5lclwiIHN0eWxlPVwid2lkdGg6IDYwMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiAxODBweDsgbGVmdDogNTAlXCI+XG4gICAgICAgICAgICA8ZGl2IGlkPVwibGlzdGVuZXJcIiBzdHlsZT1cInBvc2l0aW9uOiBhYnNvbHV0ZTsgaGVpZ2h0OiAxNXB4OyB3aWR0aDogMTVweDsgYmFja2dyb3VuZDogYmx1ZTsgdGV4dC1hbGlnbjogY2VudGVyOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgke3RoaXMubGlzdGVuZXJQb3NpdGlvbi54fXB4LCAke3RoaXMubGlzdGVuZXJQb3NpdGlvbi55fXB4KSByb3RhdGUoNDVkZWcpXCJcbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICBgLCB0aGlzLiRjb250YWluZXIpO1xuXG4gICAgICBpZiAodGhpcy5pbml0aWFsaXNpbmcpIHtcbiAgICAgICAgLy8gQXNzaWduIGNhbGxiYWNrcyBvbmNlXG4gICAgICAgIHZhciBiZWdpbkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYmVnaW5CdXR0b25cIik7XG4gICAgICAgIGJlZ2luQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5vbkJlZ2luQnV0dG9uQ2xpY2tlZChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2lyY2xlQ29udGFpbmVyJykpXG5cbiAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVcIikuc3R5bGUudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXG4gICAgICAgICAgdmFyIHBvc2l0aW9uSW5wdXQxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwb3NpdGlvbklucHV0MVwiKTtcbiAgICAgICAgICB2YXIgcG9zaXRpb25JbnB1dDIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInBvc2l0aW9uSW5wdXQyXCIpO1xuICAgICAgICAgIHBvc2l0aW9uSW5wdXQxLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25Qb3NpdGlvbkNoYW5nZShwb3NpdGlvbklucHV0MSwgcG9zaXRpb25JbnB1dDIpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgcG9zaXRpb25JbnB1dDIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vblBvc2l0aW9uQ2hhbmdlKHBvc2l0aW9uSW5wdXQxLCBwb3NpdGlvbklucHV0Mik7XG4gICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGlzaW5nID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vIHZhciBzaG9vdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2hvb3RCdXR0b25cIik7XG4gICAgICAvLyBzaG9vdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgLy8gfSk7XG5cbiAgICAgIC8vIHZhciB5YXdTbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlckF6aW1BaW1cIik7XG4gICAgICAvLyB5YXdTbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+IHtcblxuICAgICAgLy8gfSk7XG4gICAgfSk7XG4gIH1cblxuICBvbkJlZ2luQnV0dG9uQ2xpY2tlZChjb250YWluZXIpIHtcbiAgICB2YXIgdGVtcENpcmNsZVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wb3NpdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRlbXBDaXJjbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHRlbXBDaXJjbGUuaWQgPSBcImNpcmNsZVwiICsgaTtcbiAgICAgIHRlbXBDaXJjbGUuc3R5bGUgPSBcInBvc2l0aW9uOiBhYnNvbHV0ZTsgd2lkdGg6IDIwcHg7IGhlaWdodDogMjBweDsgYm9yZGVyLXJhZGl1czogMjBweDsgYmFja2dyb3VuZDogcmVkOyB0ZXh0LWFsaWduOiBjZW50ZXI7XCI7XG4gICAgICB0ZW1wQ2lyY2xlLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlKFwiICsgdGhpcy5wb3NpdGlvbnNbaV0ueCArIFwicHgsIFwiICsgdGhpcy5wb3NpdGlvbnNbaV0ueSArIFwicHgpXCI7XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodGVtcENpcmNsZSlcbiAgICB9XG4gIH1cblxuICBvblBvc2l0aW9uQ2hhbmdlKHZhbHVlWCwgdmFsdWVZKSB7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnggPSB2YWx1ZVgudmFsdWU7XG4gICAgdGhpcy5saXN0ZW5lclBvc2l0aW9uLnkgPSB2YWx1ZVkudmFsdWU7XG5cbiAgICB2YXIgdGVtcFNvdXJjZXNQb3NpdGlvbnMgPSBPYmplY3QudmFsdWVzKHRoaXMucG9zaXRpb25zKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQubGVuZ3RoOyBpICsrKSB7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNpcmNsZVwiICsgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZFtpXSkuc3R5bGUuYmFja2dyb3VuZCA9IFwicmVkXCI7XG4gICAgfVxuICAgIHRoaXMucHJldmlvdXNDbG9zZXN0UG9pbnRzSWQgPSB0aGlzLkNsb3Nlc3RTb3VyY2UodGhpcy5saXN0ZW5lclBvc2l0aW9uLCB0aGlzLnBvc2l0aW9ucywgdGhpcy5uYkNsb3Nlc3RQb2ludHMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wcmV2aW91c0Nsb3Nlc3RQb2ludHNJZC5sZW5ndGg7IGkgKyspIHtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2lyY2xlXCIgKyB0aGlzLnByZXZpb3VzQ2xvc2VzdFBvaW50c0lkW2ldKS5zdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5zb3VyY2VzQ29sb3JbaV07XG4gICAgfVxuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICAvLyBJZERpZmYoaWQsIGlkTGlzdCkge1xuICAvLyAgIHZhciBjb3VudCA9IDA7XG4gIC8vICAgZm9yIChsZXQgaiA9IDA7IGogPCBpZExpc3QubGVuZ3RoOyBqKyspIHtcbiAgLy8gICAgIGlmIChpZCA+IGlkTGlzdFtqXSkge1xuICAvLyAgICAgICBjb3VudCArPSAxO1xuICAvLyAgICAgfVxuICAvLyAgIH1cbiAgLy8gICByZXR1cm4gKGNvdW50KTtcbiAgLy8gfVxuXG4gIENsb3Nlc3RTb3VyY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnQsIG5iQ2xvc2VzdCkge1xuICAgIHZhciBjbG9zZXN0SWRzID0gW107XG4gICAgdmFyIGN1cnJlbnRDbG9zZXN0SWQ7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBuYkNsb3Nlc3Q7IGorKykge1xuICAgICAgY3VycmVudENsb3Nlc3RJZCA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxpc3RPZlBvaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLk5vdEluKGksIGNsb3Nlc3RJZHMpICYmIHRoaXMuRGlzdGFuY2UobGlzdGVuZXJQb3NpdGlvbiwgbGlzdE9mUG9pbnRbaV0pIDwgdGhpcy5EaXN0YW5jZShsaXN0ZW5lclBvc2l0aW9uLCBsaXN0T2ZQb2ludFtjdXJyZW50Q2xvc2VzdElkXSkpIHtcbiAgICAgICAgICBjdXJyZW50Q2xvc2VzdElkID0gaTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY2xvc2VzdElkcy5wdXNoKGN1cnJlbnRDbG9zZXN0SWQpO1xuICAgICAgY29uc29sZS5sb2coY2xvc2VzdElkcylcbiAgICB9XG4gICAgcmV0dXJuIChjbG9zZXN0SWRzKTtcbiAgfVxuXG4gIE5vdEluKHBvaW50SWQsIGxpc3RPZklkcykge1xuICAgIHZhciBpdGVyYXRvciA9IDA7XG4gICAgd2hpbGUgKGl0ZXJhdG9yIDwgbGlzdE9mSWRzLmxlbmd0aCAmJiBwb2ludElkICE9IGxpc3RPZklkc1tpdGVyYXRvcl0pIHtcbiAgICAgIGl0ZXJhdG9yICs9IDE7XG4gICAgfVxuICAgIHJldHVybihpdGVyYXRvciA+PSBsaXN0T2ZJZHMubGVuZ3RoKTtcbiAgfVxuXG4gIERpc3RhbmNlKHBvaW50QSwgcG9pbnRCKSB7XG4gICAgcmV0dXJuIChNYXRoLnNxcnQoTWF0aC5wb3cocG9pbnRBLnggLSBwb2ludEIueCwgMikgKyBNYXRoLnBvdyhwb2ludEEueSAtIHBvaW50Qi55LCAyKSkpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBsYXllckV4cGVyaWVu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