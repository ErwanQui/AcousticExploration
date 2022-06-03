import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import Listener from './Listener.js'
import Sources from './Sources.js'

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    // Require plugins if needed
    this.audioBufferLoader = this.require('audio-buffer-loader');
    // this.ambisonics = require('ambisonics');
    this.filesystem = this.require('filesystem');

    // Initialisation variables
    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false;

    // Global values
    this.range;                           // Values of the array data (creates in start())
    this.scale;                           // General Scales (initialised in start())
    this.circleDiameter = 20;                 // Sources size
    this.audioData = 'AudioFiles0';       // Set the audio data to use
    this.dataFileName = "scene2.json";
    this.jsonObj;
    this.jsonObjloaded;
    // this.dataLoaded = false;

    // Positions of the sources
    this.truePositions = [];

    // Sounds of the sources
    this.audioFilesName = [];



    this.ClosestPointsId = [];                  // Ids of closest Sources
    this.previousClosestPointsId = [];          // Ids of previous closest Sources
    this.nbClosestPoints = 4;                   // Number of avtive sources
    this.positions = [];                        // Array of sources positions (built in start())
    this.nbPos;     // Number of Sources
    this.distanceValue = [0, 0, 0, 0];          // Distance of closest Sources
    this.distanceSum = 0;                       // Sum of distances of closest Sources
    this.gainsValue = [1, 1, 1];                // Array of Gains
    this.gainNorm = 0;                          // Norm of the Gains
    this.gainExposant = 4;                      // Esposant to increase Gains' gap

    this.container;
    // // Creating AudioContext
    // this.audioContext = new AudioContext();
    // this.playingSounds = [];                    // BufferSources
    // this.gains = [];                            // Gains

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

      this.Sources = new Sources(this.filesystem, this.audioBufferLoader)
      console.log(this.filesystem)
      this.Sources.LoadData(this.dataFileName);
      this.Sources.LoadSoundbank(this.audioData);

      document.addEventListener("dataLoaded", () => {

        console.log(this.Sources.sourcesData)

        this.positions = this.Sources.sourcesData.receivers.xyz;
        this.audioFilesName = this.Sources.sourcesData.receivers.files;
        this.nbPos = this.truePositions.length;

        this.Range(this.positions);

        // Initialising 'this.scale'
        this.scale = this.Scaling(this.range);

        this.offset = {
          x: this.range.moyX,
          y: this.range.minY
        }

        this.Listener = new Listener(this.offset, )
        this.Listener.start();
        this.Sources.start(this.Listener.listenerPosition)

        // Add Event listener for resize Window event to resize the display
        window.addEventListener('resize', () => {
          this.scale = this.Scaling(this.range);      // Change the scale
          if (this.beginPressed) {                    // Check the begin State
            this.UpdateContainer();                   // Resize the display
          }

          // Display
          this.render();
      });
        this.render();
    });

  }

  Range(positions) { // Store the array properties in 'this.range'
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
    this.range.moyX = (this.range.maxX + this.range.minX)/2;
    this.range.moyY = (this.range.maxY + this.range.minY)/2;
    this.range.rangeX = this.range.maxX - this.range.minX;
    this.range.rangeY = this.range.maxY - this.range.minY;
  }

  Scaling(rangeValues) { // Store the greatest scale to display all the elements in 'this.scale'
    var scale = Math.min((window.innerWidth - this.circleDiameter)/rangeValues.rangeX, (window.innerHeight - this.circleDiameter)/rangeValues.rangeY);
    return (scale);
  }

  render() {
    // Debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {

      // const loading = this.audioBufferLoader.get('loading');
      const loading = false;

      // Begin the render only when audioData ara loaded
      if (!loading) {
        render(html`
          <div id="begin">
            <div style="padding: 20px">
              <h1 style="margin: 20px 0">${this.client.type} [id: ${this.client.id}]</h1>
            </div>
            <div>
              <input type="button" id="beginButton" value="Begin Game"/>
            </div>
          </div>
          <div id="game" style="visibility: hidden;">
            <div id="circleContainer" style="text-align: center; position: absolute; left: 50%">
              <div id="selector" style="position: absolute;
                height: ${this.range.rangeY*this.scale}px;
                width: ${this.range.rangeX*this.scale}px;
                background: yellow; z-index: 0;
                transform: translate(${(-this.range.rangeX*this.scale)/2}px, ${this.circleDiameter/2}px);">
              </div>
              
            </div>
          </div>
        `, this.$container);

        // Do this only at beginning
        if (this.initialising) {
          // Assign callbacks once
          var beginButton = document.getElementById("beginButton");

          beginButton.addEventListener("click", () => {
            // Change the display to begin the simulation
            document.getElementById("begin").style.visibility = "hidden";
            document.getElementById("begin").style.position = "absolute";
            document.getElementById("game").style.visibility = "visible";

            // Create circles to display Sources

            // Assign mouse and touch callbacks to change the user Position
            this.container = document.getElementById('circleContainer');

            this.onBeginButtonClicked()

            // Using mouse
            this.container.addEventListener("mousedown", (mouse) => {
              this.mouseDown = true;
              this.userAction(mouse);
            }, false);
            this.container.addEventListener("mousemove", (mouse) => {
              if (this.mouseDown) {
                this.userAction(mouse);
              }
            }, false);
            this.container.addEventListener("mouseup", (mouse) => {
              this.mouseDown = false;
            }, false);

            // Using touch
            this.container.addEventListener("touchstart", (evt) => {
              this.touched = true;
              console.log(evt.changedTouches[0])
              this.userAction(evt.changedTouches[0]);
            }, false);
            this.container.addEventListener("touchmove", (evt) => {
              if (this.touched) {
                this.userAction(evt.changedTouches[0]);
              }
            }, false);
            this.container.addEventListener("touchend", (evt) => {
              this.touched = false;
            }, false);            

            this.beginPressed = true;         // Update begin State 
          });
          this.initialising = false;          // Update initialising State
        }
      }
    });
  }

  onBeginButtonClicked() { // Begin AudioContext and add the Sources display to the display

    // Initialising a temporary circle
    this.Sources.CreateSources(this.container, this.scale, this.offset);
    this.Listener.Display(this.container);
    this.render();
    console.log(this.container)
  }

  userAction(mouse) { // Change Listener's Position when the mouse has been used
    // Get the new potential Listener's Position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth/2)/(this.scale);
    var tempY = this.range.minY + (mouse.clientY - this.circleDiameter/2)/(this.scale);
    // Check if the value is in the values range
    if (tempX >= this.range.minX && tempX <= this.range.maxX && tempY >= this.range.minY && tempY <= this.range.maxY) {
      // Update Listener
      this.Listener.UpdateListener(mouse, this.offset, this.scale, this.circleDiameter/2);
      this.Sources.onListenerPositionChanged(this.Listener.listenerPosition);
      this.render();
    }
    else {
      // When the value is out of range, stop the Listener's Position Update
      this.mouseDown = false;
      this.touched = false;
    }
  }

  UpdateContainer() { // Change the display when the window is resized

    // Change size
    document.getElementById("circleContainer").height = (this.range.rangeY*this.scale.VPos2Pixel) + "px";
    document.getElementById("circleContainer").width = (this.range.rangeX*this.scale.VPos2Pixel) + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.circleSize/2 - this.range.rangeX*this.scale.VPos2Pixel/2) + "px, 10px)";
    

    this.Sources.UpdateSourcesPosition(this.scale, this.offset);     // Update Sources' display
    this.Listener.UpdateListener(this.Listener.listenerPosition, this.offset, this.scale, this.circleDiameter/2)
  }
}

export default PlayerExperience;