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

    // Require plugins if needed
    this.audioBufferLoader = this.require('audio-buffer-loader');
    this.ambisonics = require('ambisonics');
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
    this.ClosestPointsId = [];
    this.previousClosestPointsId = [];
    this.nbPos = 40;
    this.nbClosestPoints = 4;
    this.positions = [];
    this.sourcesColor = ["gold", "green", "white", "black"];

    this.audioContext = new AudioContext();
    this.playingSounds = [];
    this.gains = [];

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.soundBank = await this.audioBufferLoader.load({
    }, true);

    for (let i = 0; i < this.nbPos; i++) {
      this.positions.push({x: Math.round(Math.random()*1000 - 500), y: Math.round(Math.random()*500)});
    }

    this.ClosestPointsId = ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints)

    for (let i = 0; i < this.nbPos; i++) {
      this.playingSounds.push(this.audioContext.createBufferSource());
      this.gains.push(this.audioContext.createGain());

      this.gains[i].setValueAtTime(0.5, 0);

      this.playingSounds[i].connect(this.gains[i]);
      this.gains[i].connect(this.audioContext.destination);

      LoadNewSound(this.ClosestPointsId, i);

      this.playingSounds[i].play();
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

    this.previousClosestPointsId - this.ClosestPointsId
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);

    for (let i = 0; i < this.nbClosestPoints.length; i++) {
      if (this.previousClosestPointsId[i] != this.ClosestPointsId) {
        document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "red";
        document.getElementById("circle" + this.ClosestPointsId[i]).style.background = this.sourcesColor[i];

        this.playingSounds[i].stop();
        this.playingSounds[i].disconnect(this.gains(i));

        this.playingSounds[i] = new LoadNewSound(this.ClosestPointsId[i], i);
        this.playingSounds[i].play()
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

  LoadNewSound(soundId, gainId) {
    // Sound initialisation
    var Sound = this.audioContext.createBufferSource()
    Sound.loop = true;
    Sound.buffer = this.soundBank(soundId);
    Sound.connect(this.gain(gainId));
    return Sound;
  }
}

export default PlayerExperience;
