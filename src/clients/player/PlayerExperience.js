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
    this.pixelScale = 200;
    this.listenerPosition = {
      x: 0,
      y: 0,
    }
    this.scale;
    this.distanceSum = 0;

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
    this.distanceValue = [0, 0, 0, 0];

    this.audioContext = new AudioContext();
    this.playingSounds = [];
    this.gains = [];

    this.tempX;
    this.tempY;

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

    this.soundBank = await this.audioBufferLoader.load({
    }, true);

    for (let i = 0; i < this.nbPos; i++) {
      // this.positions.push({x: Math.round(Math.random()*1000 - 500), y: Math.round(Math.random()*500)});
      this.positions.push({x: this.truePositions[i][0], y:this.truePositions[i][1]});
    }

    this.Range(this.positions);
    this.scale = this.Scaling(this.range);
    this.listenerPosition.x = this.range.moyX;
    this.listenerPosition.y = this.range.minY;

    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints)

    // $.get("data.json", function(data){
    // console.log(data);
    // });

    var tempPrefix = "";
    var file;

    for (let i = 0; i < this.nbClosestPoints; i++) {
      this.gains.push(await this.audioContext.createGain());
      // console.log(this.gains)

      if (this.ClosestPointsId[i] < 10) {
        tempPrefix = "0";
      }
      else {
        tempPrefix = "";
      }

      file = tempPrefix + this.ClosestPointsId[i] + ".wav";


      this.playingSounds.push(this.LoadNewSound(this.audioBufferLoader.data[file], i));
      this.gains[i].connect(this.audioContext.destination);


      this.gains[i].gain.setValueAtTime(0.5, 0);
    }

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

  Range(positions) {
    this.range = {
      minX: positions[0].x,
      maxX: positions[0].x,
      minY: positions[0].y, 
      maxY: positions[0].y,
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

  Scaling(rangeValues) {
    var scale = {VPos2Pixel: Math.min(window.screen.height/rangeValues.rangeX, window.screen.width/rangeValues.rangeY)};
    console.log(scale)
    return (scale)
  }

  VirtualPos2Pixel(position) {
    var pixelCoord = {x: position.x*this.scale.VPos2Pixel, y: position.y*this.scale.VPos2Pixel};
    return (pixelCoord);
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
            <input type="range" id="positionInput1" step=0.1 max=${this.range.maxX} min=${this.range.minX} value=${this.listenerPosition.x}></input>
            <input type="range" id="positionInput2" step=0.1 max=${this.range.maxY} min=${this.range.minY} value=${this.listenerPosition.y}></input>
          </div>
          <div>
            ${this.listenerPosition.x}
            ${this.listenerPosition.y}
          </div>
          <div id="circleContainer" style="width: 600px; text-align: center; position: absolute; top: 180px; left: 50%">
            <div id="listener" style="position: absolute; height: 15px; width: 15px; background: blue; text-align: center; z-index: 1; transform: 
            translate(${(this.listenerPosition.x - this.range.moyX)*this.scaling}px, ${(this.listenerPosition.y - this.range.minY)*this.scaling}px) rotate(45deg)"
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

          var marker = document.getElementById("listener");
          var mouseDown = false;
          console.log(window.screen.width)

          marker.addEventListener("mousedown", (mouse) => {
            mouseDown = true;
            this.tempX = mouse.clientX;
            this.tempY = mouse.clientY;
            this.mouseAction(mouse);
          }, false);

          marker.addEventListener("mousemove", (mouse) => {
            if (mouseDown) {
              this.mouseAction(mouse);
            }
          }, false);

          marker.addEventListener("mouseup", (mouse) => {
            mouseDown = false;
            // this.listenerPosition.x = this;
            // this.listenerPosition.y = mouse.clientY;
          }, false);
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


    for (let i = 0; i < this.nbClosestPoints; i++) {
      this.playingSounds[i].start();
    }


    var tempCircle
    this.audioContext.resume();
    // console.log(this.range);
    for (let i = 0; i < this.positions.length; i++) {
      tempCircle = document.createElement('div');
      tempCircle.id = "circle" + i;
      // console.log(tempCircle)
      tempCircle.innerHTML = i;
      tempCircle.style = "position: absolute; width: 20px; height: 20px; border-radius: 20px; background: grey; line-height: 20px";
      tempCircle.style.transform = "translate(" + ((this.positions[i].x - this.range.moyX)*this.scaling) + "px, " + ((this.positions[i].y - this.range.minY)*this.scaling) + "px)";
      container.appendChild(tempCircle)
    }
  }

  onPositionChange(valueX, valueY) {
    // console.log("oui")
    this.listenerPosition.x = valueX.value;
    this.listenerPosition.y = valueY.value;

    var tempPrefix = "";
    var file;

    this.previousClosestPointsId = this.ClosestPointsId
    this.distanceSum = 0;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);
    // console.log(this.ClosestPointsId)
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
        }
        else {
          tempPrefix = "";
        }

        file = tempPrefix + this.ClosestPointsId[i] + ".wav";

        this.playingSounds[i] = this.LoadNewSound(this.audioBufferLoader.data[file], i);
        this.playingSounds[i].start();
        // console.log(this.playingSounds[i])
      }
      document.getElementById("circle" + this.ClosestPointsId[i]).style.background = "rgb(0, " + 255*(1-2*this.distanceValue[i]/this.distanceSum) + ", 0)";
    }
    this.render();
  }

  PositionChange(valueX, valueY) {
    // console.log("oui")

    var tempPrefix = "";
    var file;

    this.previousClosestPointsId = this.ClosestPointsId
    this.distanceSum = 0;
    this.ClosestPointsId = this.ClosestSource(this.listenerPosition, this.positions, this.nbClosestPoints);
    // console.log(this.ClosestPointsId)
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
        }
        else {
          tempPrefix = "";
        }

        file = tempPrefix + this.ClosestPointsId[i] + ".wav";

        this.playingSounds[i] = this.LoadNewSound(this.audioBufferLoader.data[file], i);
        this.playingSounds[i].start();
        // console.log(this.playingSounds[i])
      }
      document.getElementById("circle" + this.ClosestPointsId[i]).style.background = "rgb(0, " + 255*(1-2*this.distanceValue[i]/this.distanceSum) + ", 0)";
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
    console.log(this.range.minY + (mouse.clientY - window.screen.height/2)/(this.scaling));
    console.log((mouse.clientY - this.tempY)/(this.scaling));

    // this.listenerPosition.x += (mouse.clientX - this.tempX)/this.scaling;
    // this.listenerPosition.y += (mouse.clientY - this.tempY)/this.scaling

    document.getElementById("listener").style.transform = "translate(" + ((this.listenerPosition.x - this.range.moyX)*this.scaling + mouse.clientX - this.tempX) + "px, " + ((this.listenerPosition.y - this.range.minY)*this.scaling + mouse.clientY - this.tempY) +"px) rotate(45deg)";
    // document.getElementById("listener").style.transform = "translate(" + ((this.listenerPosition.x - this.range.moyX)*this.scaling) + "px, " + ((this.listenerPosition.y - this.range.minY)*this.scaling + mouse.clientY - this.tempY) +"px) rotate(45deg)";
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
    // console.log(pointA)
    // console.log(pointB)
    // if (pointB = undefined) {
    //   return 0;
    // }
    if (pointB != undefined) {
      return (Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)));
    }
    else {
      return (Infinity);
    }
  }

  LoadNewSound(buffer, index) {
    // Sound initialisation
    // console.log(buffer)
    var Sound = this.audioContext.createBufferSource()
    Sound.loop = true;
    Sound.buffer = buffer;
    Sound.connect(this.gains[index]);
    return Sound;
  }
}

export default PlayerExperience;
