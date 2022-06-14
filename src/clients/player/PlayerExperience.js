import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import Listener from './Listener.js'
import Sources from './Sources.js'
// import { Scheduler } from 'waves-masters';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container, audioContext) {

    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    // Require plugins if needed
    this.audioBufferLoader = this.require('audio-buffer-loader');     // To load audioBuffers
    this.filesystem = this.require('filesystem');                     // To get files
    // this.sync = this.require('sync');                                 // To sync audio sources
    // this.platform = this.require('platform');                         // To manage plugin for the sync

    // Variable parameters
    this.parameters = {
      audioContext: audioContext,               // Global audioContext
      order: 2,                                 // Order of ambisonics
      nbClosestPoints: 4,                       // Number of closest points searched
      gainExposant: 3,                          // Exposant of the gains (to increase contraste)
      // mode: "debug",                         // Choose audio mode (possible: "debug", "streaming", "ambisonic", "convolving")
      // mode: "streaming",
      mode: "ambisonic",
      // mode: "convolving",
      circleDiameter: 20,                       // Diameter of sources' display
      listenerSize: 16,                         // Size of listener's display
      dataFileName: "",                         // All sources' position and audioDatas' filenames (instantiated in 'start()')
      audioData: ""                             // All audioDatas (instantiated in 'start()')
    }

    // Initialisation variables
    this.initialising = true;
    this.beginPressed = false;
    this.mouseDown = false;
    this.touched = false;

    // Instanciate classes' storer
    this.Listener;                              // Store the 'Listener' class
    this.Sources;                               // Store the 'Sources' class

    // Global values
    this.range;                                 // Values of the array data (creates in 'start()')
    this.scale;                                 // General Scales (initiated in 'start()')
    this.offset;                                // Offset of the display
    this.container;                             // General container of display elements (creates in 'render()')

    renderInitializationScreens(client, config, $container);
  }

  async start() {

    super.start();

    console.log("You are using " + this.parameters.mode + " mode.");

    // Switch files' names and audios, depending on the mode chosen
    switch (this.parameters.mode) {
      case 'debug':
        this.parameters.audioData = 'AudioFiles0';
        this.parameters.dataFileName = 'scene0.json';
        break;
      case 'streaming':
        this.parameters.audioData = 'AudioFiles1';
        this.parameters.dataFileName = 'scene1.json';
        break;
      case 'ambisonic':
        this.parameters.audioData = 'AudioFiles2';
        this.parameters.dataFileName = 'scene2.json';
        break;
      case 'convolving':
        this.parameters.audioData = 'AudioFiles3';
        this.parameters.dataFileName = 'scene3.json';
        break;
      default:
        alert("No valid mode");
    }


    // const getTimeFunction = () => this.sync.getSyncTime();
    // const currentTimeToAudioTimeFunction =
    //   currentTime => this.sync.getLocalTime(currentTime);

    // this.scheduler = new Scheduler(getTimeFunction, {
    //   currentTimeToAudioTimeFunction
    // });

    // // define simple engines for the scheduler
    // this.metroAudio = {
    //   // `currentTime` is the current time of the scheduler (aka the syncTime)
    //   // `audioTime` is the audioTime as computed by `currentTimeToAudioTimeFunction`
    //   // `dt` is the time between the actual call of the function and the time of the
    //   // scheduled event
    //   advanceTime: (currentTime, audioTime, dt) => {
    //     const env = this.audioContext.createGain();
    //     env.connect(this.audioContext.destination);
    //     env.gain.value = 0;
    //     console.log("audio")
    //     const sine = this.audioContext.createOscillator();
    //     sine.connect(env);
    //     sine.frequency.value = 200 * (this.client.id % 10 + 1);

    //     env.gain.setValueAtTime(0, audioTime);
    //     env.gain.linearRampToValueAtTime(1, audioTime + 0.01);
    //     env.gain.exponentialRampToValueAtTime(0.0001, audioTime + 0.1);

    //     sine.start(audioTime);
    //     sine.stop(audioTime + 0.1);

    //     return currentTime + 1;
    //   }
    // }

    // this.metroVisual = {
    //   advanceTime: (currentTime, audioTime, dt) => {
    //     if (!this.$beat) {
    //       this.$beat = document.querySelector(`#beat-${this.client.id}`);
    //     }

    //     // console.log(`go in ${dt * 1000}`)
    //     // this.$beat.active = true;
    //     setTimeout(() => this.$beat.active = true, Math.round(dt * 1000));

    //     return currentTime + 1;
    //   }
    // };


    // // this.globals.subscribe(updates => {
    // //   this.updateEngines();
    // //   this.render();
    // // });
    // // this.updateEngines();


    // Create the objects storer for sources and load their fileDatas
    this.Sources = new Sources(this.filesystem, this.audioBufferLoader, this.parameters)
    this.Sources.LoadData();


    // Wait until data have been loaded from json files ("dataLoaded" event is create 'this.Sources.LoadData()')
    document.addEventListener("dataLoaded", () => {

      // Load sources' sound depending on mode (some modes need RIRs in addition of sounds)
      switch (this.parameters.mode) {
        case 'debug':
        case 'streaming':
          this.Sources.LoadSoundbank();
          break;
        case 'ambisonic':
          this.Sources.LoadAmbiSoundbank();
          // this.Sources.LoadSoundbank();
          break;
        case 'convolving':
          this.Sources.LoadRirs();
          break;
        default:
          alert("No valid mode");
      }

      document.addEventListener("audioLoaded", () => {

        console.log("AudioFiles: " + this.Sources.sourcesData);

        // Instantiate the attribute 'this.range' to get datas' parameters
        this.Range(this.Sources.sourcesData.receivers.xyz);

        // Instanciate 'this.scale'
        this.scale = this.Scaling(this.range);

        // Get offset parameters of the display
        this.offset = {
          x: this.range.moyX,
          y: this.range.minY
        };

        // Create, start and store the listener class
        this.Listener = new Listener(this.offset, this.parameters);
        this.Listener.start();

        // Start the sources display and audio depending on listener's initial position
        this.Sources.start(this.Listener.listenerPosition);

        // Add event listener for resize window event to resize the display
        window.addEventListener('resize', () => {

          this.scale = this.Scaling(this.range);      // Change the scale

          if (this.beginPressed) {                    // Check the begin State
            this.UpdateContainer();                   // Resize the display
          }

          // Display
          this.render();
        })
        // Display
        this.render();
      });
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

  Scaling(rangeValues) { // Store the greatest scale that displays all the elements in 'this.scale'

    var scale = Math.min((window.innerWidth - this.parameters.circleDiameter)/rangeValues.rangeX, (window.innerHeight - this.parameters.circleDiameter)/rangeValues.rangeY);
    return (scale);
  }

  render() {

    // Debounce with requestAnimationFrame
    window.cancelAnimationFrame(this.rafId);

    this.rafId = window.requestAnimationFrame(() => {

      // Begin the render only when audioData ara loaded
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
              transform: translate(${(-this.range.rangeX*this.scale)/2}px, ${this.parameters.circleDiameter/2}px);">
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

          // Assign gloabl containers
          this.container = document.getElementById('circleContainer');
          
          // Assign mouse and touch callbacks to change the user Position
          this.onBeginButtonClicked()

          // Add mouseEvents to do actions when the user does actions on the screen
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

          // Add touchEvents to do actions when the user does actions on the screen
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
    });
  }

  onBeginButtonClicked() { // Begin audioContext and add the sources display to the display

    // Create and display objects
    this.Sources.CreateSources(this.container, this.scale, this.offset);        // Create the sources and display them
    this.Listener.Display(this.container);                                      // Add the listener's display to the container
    this.render();                                                              // Update the display
  }

  userAction(mouse) { // Change listener's position when the mouse has been used

    // Get the new potential listener's position
    var tempX = this.range.moyX + (mouse.clientX - window.innerWidth/2)/(this.scale);
    var tempY = this.range.minY + (mouse.clientY - this.parameters.circleDiameter/2)/(this.scale);

    // Check if the value is in the values range
    if (tempX >= this.range.minX && tempX <= this.range.maxX && tempY >= this.range.minY && tempY <= this.range.maxY) {
      console.log("Updating")

      // Update objects and their display
      this.Listener.UpdateListener(mouse, this.offset, this.scale);                   // Update the listener's position
      this.Sources.onListenerPositionChanged(this.Listener.listenerPosition);         // Update the sound depending on listener's position
      this.render();                                                                  // Update the display
    }

    else {
      // When the value is out of range, stop the Listener's Position Update
      this.mouseDown = false;
      this.touched = false;
    }
  }

  UpdateContainer() { // Change the display when the window is resized

    // Change size of display
    document.getElementById("circleContainer").height = (this.offset.y*this.scale) + "px";
    document.getElementById("circleContainer").width = (this.offset.x*this.scale) + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.parameters.circleDiameter/2 - this.range.rangeX*this.scale.VPos2Pixel/2) + "px, 10px)";

    this.Sources.UpdateSourcesPosition(this.scale, this.offset);      // Update sources' display
    this.Listener.UpdateListenerDisplay(this.offset, this.scale);     // Update listener's display
  }
}

export default PlayerExperience;