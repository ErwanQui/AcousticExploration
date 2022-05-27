import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import Marker from './Marker.js';
// import Scene from 'grid_nav_assets/assets/scene.json';

// import Positions from './scene.json'
// import fs5 from "fs";
// import JSON5 from 'json5';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    // Require plugins if needed
    this.audioBufferLoader = this.require('audio-buffer-loader');
    this.ambisonics = require('ambisonics');
    this.filesystem = this.require('filesystem');
    // console.log(this.filesystem)
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
    this.listenerPosition = {
      x: 0,
      y: 0,
    }
    this.ClosestPointsId = [];
    this.previousClosestPointsId = [];
    this.nbClosestPoints = 4;
    this.positions = [];
    this.truePositions = [
      [31.0, 41.5],
      [31.0, 39.0],
      [31.0, 36.2],
      [34.5, 36.2],
      [36.8, 36.2],
      [36.8, 33.6],
      [34.5, 33.6],
      [31.0, 33.6],
      [31.0, 31.0],
      [34.5, 31.0],
      [34.5, 28.0],
      [31.0, 28.0],
      [31.0, 25.8],
      [34.5, 25.8],
      [36.8, 25.8],
      [36.8, 23.6],
      [34.5, 23.6],
      [31.0, 23.6],
    ]

    this.nbPos = this.truePositions.length;
    this.range;
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

    this.factorX = 20;
    this.offsetX = -500;
    this.factorY = 20;
    this.offsetY = -236;

    for (let i = 0; i < this.nbPos; i++) {
      // this.positions.push({x: Math.round(Math.random()*1000 - 500), y: Math.round(Math.random()*500)});
      this.positions.push({x: this.truePositions[i][0], y:this.truePositions[i][1]});
    }

    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints)

    // for (let i = 0; i < this.nbPos; i++) {
    //   this.playingSounds.push(this.audioContext.createBufferSource());
    //   this.gains.push(this.audioContext.createGain());

    //   this.gains[i].gain.setValueAtTime(0.5, 0);

    //   this.playingSounds[i].connect(this.gains[i]);
    //   this.gains[i].connect(this.audioContext.destination);

    //   this.LoadNewSound(this.ClosestPointsId, i);

    //   this.playingSounds[i].play();
    // }
    // $.get("data.json", function(data){
    // console.log(data);
    // });



    // subscribe to display loading state
    this.audioBufferLoader.subscribe(() => this.render());
    // subscribe to display loading state
    this.filesystem.subscribe(() => this.loadSoundbank());

    // init with current content
    this.loadSoundbank();

    // this.fs = require('file-system')

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
    console.log(soundbankTree)

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
      const data = this.audioBufferLoader.data;
      // console.log(data)

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


//<p>add or remove .wav or .mp3 files in the "soundbank" directory and observe the changes:</p>${Object.keys(data).map(key => {return html`<p>- "${key}" loaded: ${data[key]}.</p>`;})}

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
    this.Range(this.positions);
    console.log(this.range);
    for (let i = 0; i < this.positions.length; i++) {
      tempCircle = document.createElement('div');
      tempCircle.id = "circle" + i;
      tempCircle.style = "position: absolute; width: 20px; height: 20px; border-radius: 20px; background: red; text-align: center;";
      tempCircle.style.transform = "translate(" + ((this.positions[i].x - this.range.moyX)*500/this.range.rangeX) + "px, " + ((this.positions[i].y - this.range.minY)*500/this.range.rangeY) + "px)";
      container.appendChild(tempCircle)
    }
  }

  Range(positions) {
    this.range = {
      minX: positions[0].x,
      maxX: positions[0].x, 
      // moyX: null,
      // rangeX: null,
      minY: positions[0].y, 
      maxY: positions[0].y,
      // moyY: null,
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
    this.range.moyX = (this.range.maxX + this.range.minX)/2
    this.range.moyY = (this.range.maxY + this.range.minY)/2
    this.range.rangeX = this.range.maxX - this.range.minX;
    this.range.rangeY = this.range.maxY - this.range.minY;
  }

  onPositionChange(valueX, valueY) {
    // console.log("oui")
    this.listenerPosition.x = valueX.value;
    this.listenerPosition.y = valueY.value;

    this.previousClosestPointsId = this.ClosestPointsId
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);

    for (let i = 0; i < this.nbClosestPoints; i++) {
      // console.log("non")
      if (this.previousClosestPointsId[i] != this.ClosestPointsId) {
        console.log(i)
        document.getElementById("circle" + this.previousClosestPointsId[i]).style.background = "red";
        document.getElementById("circle" + this.ClosestPointsId[i]).style.background = this.sourcesColor[i];

        // this.playingSounds[i].stop();
        // this.playingSounds[i].disconnect(this.gains(i));

        // this.playingSounds[i] = new LoadNewSound(this.ClosestPointsId[i], i);
        // this.playingSounds[i].play()
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
      // console.log(closestIds)
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
    Sound.buffer = this.soundBank[soundId];
    Sound.connect(this.gain[gainId]);
    return Sound;
  }
}

export default PlayerExperience;
