import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import Marker from './Marker.js';
// import Map from 'images/Map.png';


class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    // this.filesystem = this.require('filesystem');
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
      y: 0,
    }
    this.previousClosestPointsId = [0, 1, 2, 3];
    this.nbPos = 40;
    this.nbClosestPoints = 4;
    this.positions = [];
    this.sourcesColor = ["gold", "green", "white", "black"]

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    for (let i = 0; i <= this.nbPos; i++) {
      this.positions.push({x: Math.round(Math.random()*1000 - 500), y: Math.round(Math.random()*500)});
    }
    console.log(this.positions)
    window.addEventListener('resize', () => this.render());
    this.render();
  }

  render() {
    // Debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {
      render(html`
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
          this.onBeginButtonClicked(document.getElementById('circleContainer'))

          document.getElementById("game").style.visibility = "visible";

          var positionInput1 = document.getElementById("positionInput1");
          var positionInput2 = document.getElementById("positionInput2");
          positionInput1.addEventListener("input",() => {
            this.onPositionChange(positionInput1, positionInput2);
          })
          positionInput2.addEventListener("input",() => {
            this.onPositionChange(positionInput1, positionInput2);
          })
        });
        this.initialising = false;
      }

      // var shootButton = document.getElementById("shootButton");
      // shootButton.addEventListener("click", () => {
      // });

      // var yawSlider = document.getElementById("sliderAzimAim");
      // yawSlider.addEventListener("input", () => {

      // });
    });
  }

  onBeginButtonClicked(container) {
    var tempCircle
    for (let i = 0; i < this.positions.length; i++) {
      tempCircle = document.createElement('div');
      tempCircle.id = "circle" + i;
      tempCircle.style = "position: absolute; width: 20px; height: 20px; border-radius: 20px; background: red; text-align: center;";
      tempCircle.style.transform = "translate(" + this.positions[i].x + "px, " + this.positions[i].y + "px)";
      container.appendChild(tempCircle)
    }
  }

  onPositionChange(valueX, valueY) {
    this.listenerPosition.x = valueX.value;
    this.listenerPosition.y = valueY.value;

    var tempSourcesPositions = Object.values(this.positions);
    for (let i = 0; i < this.previousClosestPointsId.length; i ++) {
      document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "red";
    }
    this.previousClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);
    for (let i = 0; i < this.previousClosestPointsId.length; i ++) {
      document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = this.sourcesColor[i];
    }
    this.render();
  }

  // IdDiff(id, idList) {
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
      console.log(closestIds)
    }
    return (closestIds);
  }

  NotIn(pointId, listOfIds) {
    var iterator = 0;
    while (iterator < listOfIds.length && pointId != listOfIds[iterator]) {
      iterator += 1;
    }
    return(iterator >= listOfIds.length);
  }

  Distance(pointA, pointB) {
    return (Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)));
  }
}

export default PlayerExperience;
