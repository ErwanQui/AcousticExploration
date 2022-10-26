import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import Listener from './Listener.js'
import Sources from './Sources.js'

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container, audioContext) {

    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

    // Require plugins
    // @note: could be a good idea to create a plugin object
    this.audioBufferLoader = this.require('audio-buffer-loader');     // To load audioBuffers
    this.filesystem = this.require('filesystem');                     // To get files
    this.sync = this.require('sync');                                 // To sync audio sources
    this.platform = this.require('platform');                         // To manage plugin for the sync
    this.audioStream = this.require('audio-streams');                         // To manage plugin for the sync

    // Variable parameters
    this.parameters = {
      audioContext: audioContext,               // Global audioContext
      nbClosestDetectSources: 3,                // Number of closest points detected
      nbClosestActivSources: 3,                 // Number of closest points used as active audioSources
      gainExposant: 3,                          // Exposant of the gains (to increase contrast)
      circleDiameter: 20,                       // Diameter of sources' display
      listenerSize: 16,                         // Size of listener's display
      dataFileName: "scene1.json",               // All sources' position and audioDatas' filenames (instantiated in 'start()')
    }

    // Initialisation variables
    this.initialising = true;                   // Attribute to know if the event listener havn't been initiated
    this.beginPressed = false;                  // Attribute to know if the beginButton has already been pressed
    this.mouseDown = false;                     // Attribute to know if the mouse is pressed (computer)
    this.touched = false;                       // Attribute to know if the screen is touched (device)

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

    // Check
    if (this.parameters.nbClosestDetectSources < this.parameters.nbClosestActivSources) {
      console.error("The number of detected sources must be higher than the number of used sources")
    }

    // Create the objects storer for sources and load their fileDatas
    this.Sources = new Sources(this.filesystem, this.audioBufferLoader, this.parameters, this.platform, this.sync, this.audioStream)
    this.Sources.LoadData();

    // Wait until data have been loaded from json files ("dataLoaded" event is create 'this.Sources.LoadData()')
    document.addEventListener("dataLoaded", () => {

      // Get background html code
      this.scene = this.Sources.image;

      // Instantiate the attribute 'this.range' to get datas' parameters
      this.Range(this.Sources.sourcesData.receivers.xyz, this.Sources.sourcesData.sources_xy, this.Sources.sourcesData.extremum);

      // Instanciate 'this.scale'
      this.scale = this.Scaling(this.extremum); 

      // Get offset parameters of the display
      this.offset = {
        x: this.extremum.moyX,
        y: this.extremum.minY
      };

      var listenerInitPos = {
        x: this.positionRange.moyX,
        y: this.positionRange.minY
      };

      // Resize background
      this.UpdateSceneDisplay();

      // Create, start and store the listener class object
      this.Listener = new Listener(listenerInitPos, this.parameters);
      this.Listener.start(this.scale, this.offset);

      // Start the sources display and audio depending on listener's initial position
      this.Sources.start(this.Listener.listenerPosition);

      // Add an event listener dispatched from "Listener.js" when the position of the user changed
      document.addEventListener('Moving', () => {
        this.Sources.onListenerPositionChanged(this.Listener.listenerPosition);         // Update the sound depending on listener's position
        this.UpdateContainer()
        this.render();
      })
      
      // Add event listener for resize window event to resize the display
      window.addEventListener('resize', () => {

        this.scale = this.Scaling(this.extremum);   // Change the scale

        if (this.beginPressed) {                    // Check the begin state
          this.UpdateContainer();                   // Resize the display
        }

        // Display
        this.render();
      })

      // Display
      this.render();
    });
  }

  Range(audioSourcesPositions, sourcesPositions, imageExtremum) { // Store the array properties in 'this.range'
    // @note: that can be probably be done in a more pretty way

    this.range = {
      minX: audioSourcesPositions[0].x,
      maxX: audioSourcesPositions[0].x,
      minY: audioSourcesPositions[0].y, 
      maxY: audioSourcesPositions[0].y,
    };
    this.positionRange = {
      minX: audioSourcesPositions[0].x,
      maxX: audioSourcesPositions[0].x,
      minY: audioSourcesPositions[0].y, 
      maxY: audioSourcesPositions[0].y,
    };

    this.extremum = {
      minX: imageExtremum[0].x,
      maxX: imageExtremum[1].x,
      minY: imageExtremum[0].y, 
      maxY: imageExtremum[1].y,
    }

    this.extremum.rangeX = this.extremum.maxX - this.extremum.minX;
    this.extremum.moyX = (this.extremum.maxX + this.extremum.minX)/2;
    this.extremum.rangeY = this.extremum.maxY - this.extremum.minY;

    for (let i = 1; i < audioSourcesPositions.length; i++) {
      if (audioSourcesPositions[i].x < this.range.minX) {
        this.range.minX = audioSourcesPositions[i].x;
        this.positionRange.minX = audioSourcesPositions[i].x;
      }
      if (audioSourcesPositions[i].x > this.range.maxX) {
        this.range.maxX = audioSourcesPositions[i].x;
        this.positionRange.maxX = audioSourcesPositions[i].x;
      }
      if (audioSourcesPositions[i].y < this.range.minY) {
        this.range.minY = audioSourcesPositions[i].y;
        this.positionRange.minY = audioSourcesPositions[i].y;
      }
      if (audioSourcesPositions[i].y > this.range.maxY) {
        this.range.maxY = audioSourcesPositions[i].y;
        this.positionRange.maxY = audioSourcesPositions[i].y;
      }
    }

    this.positionRange.moyX = (this.range.maxX + this.range.minX)/2;
    this.positionRange.moyY = (this.range.maxY + this.range.minY)/2;
    this.positionRange.rangeX = this.range.maxX - this.range.minX;
    this.positionRange.rangeY = this.range.maxY - this.range.minY;

    for (let i = 0; i < sourcesPositions.length; i++) {

      if (sourcesPositions[i].x < this.range.minX) {
        this.range.minX = sourcesPositions[i].x;

      }
      if (sourcesPositions[i].x > this.range.maxX) {
        this.range.maxX = sourcesPositions[i].x;
      }
      if (sourcesPositions[i].y < this.range.minY) {
        this.range.minY = sourcesPositions[i].y;
      }
      if (sourcesPositions[i].y > this.range.maxY) {
        this.range.maxY = sourcesPositions[i].y;
      }
    }
    this.range.moyX = (this.range.maxX + this.range.minX)/2;
    this.range.moyY = (this.range.maxY + this.range.minY)/2;
    this.range.rangeX = this.range.maxX - this.range.minX;
    this.range.rangeY = this.range.maxY - this.range.minY;
  }

  Scaling(rangeValues) { // Store the greatest scale that displays all the elements in 'this.scale'

    var scale = Math.min((window.innerWidth)/rangeValues.rangeX, (window.innerHeight)/rangeValues.rangeY);
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
          <div id="instrumentContainer" style="text-align: center; position: absolute; left: 50%">
            <div id="selector" style="position: absolute;
              height: ${this.range.rangeY*this.scale}px;
              width: ${this.range.rangeX*this.scale}px;
              z-index: 0;
              transform: translate(${(this.range.minX - this.extremum.minX - this.extremum.rangeX/2)*this.scale}px, ${this.parameters.circleDiameter/2}px);">
            </div>
          </div>
          <div id="scene" style="position: absolute;
              left: 50%;
              height: ${this.range.rangeY*this.scale}px;
              width: ${this.range.rangeX*this.scale}px;
              transform: translate(${(-this.extremum.rangeX/2)*this.scale}px, 0px);">
            ${this.scene}
          </div>
          <div id="circleContainer" style="text-align: center; position: absolute; left: 50%">
            <div id="selector" style="position: absolute;
              height: ${this.positionRange.rangeY*this.scale}px;
              width: ${this.positionRange.rangeX*this.scale}px;
              z-index: 0;
              transform: translate(${((this.positionRange.minX - this.extremum.minX - this.extremum.rangeX/2)*this.scale)}px, ${(this.positionRange.minY - this.extremum.minY)*this.scale + this.parameters.circleDiameter/2}px);">
            </div>
          </div>
        </div>
      `, this.$container);

      // Do this only at beginning
      if (this.initialising) {
        this.initialising = false;          // Update initialising state

        // Assign callbacks once
        var beginButton = document.getElementById("beginButton");

        beginButton.addEventListener("click", () => {

          // Change the display to begin the simulation
          document.getElementById("begin").style.visibility = "hidden";
          document.getElementById("begin").style.position = "absolute";
          document.getElementById("game").style.visibility = "visible";

          // Assign global containers
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

          this.beginPressed = true;         // Update begin state 

        });
      }
    });
  }

  onBeginButtonClicked() { // Begin audioContext and add the sources display to the display

    // Create and display objects
    this.CreateInstruments();                                                   // Create the instruments and display them
    this.Sources.CreateSources(this.container, this.scale, this.offset);        // Create the sources and display them
    this.Listener.Display(this.container);                                      // Add the listener's display to the container
    this.render();                                                              // Update the display
  }

  CreateInstruments() { // Create the instruments and add them to the scene display

    var container = document.getElementById('instrumentContainer')
    var circleDiameter = this.parameters.circleDiameter;
    this.instruments = []

    for (let i = 0; i < this.Sources.sourcesData.sources_xy.length; i++) {

      this.instruments.push(document.createElement('div'));       // Create a new element
      this.instruments[i].id = "instrument" + i;                  // Set the circle id
      this.instruments[i].innerHTML = "S";                        // Set the circle value (i+1)

      // Change form and position of the element to get a circle at the good place;
      this.instruments[i].style.position = "absolute";
      this.instruments[i].style.margin = "0 " + (-circleDiameter/2) + "px";
      this.instruments[i].style.width = circleDiameter + "px";
      this.instruments[i].style.height = circleDiameter + "px";
      this.instruments[i].style.borderRadius = circleDiameter + "px";
      this.instruments[i].style.lineHeight = circleDiameter + "px";
      this.instruments[i].style.background = "red";
      this.instruments[i].style.zIndex = 1;
      this.instruments[i].style.transform = "translate(" + 
        ((this.Sources.sourcesData.sources_xy[i].x - this.offset.x)*this.scale) + "px, " + 
        ((this.Sources.sourcesData.sources_xy[i].y - this.offset.y)*this.scale) + "px)";

      // Add the circle's display to the global container
      container.appendChild(this.instruments[i]);
    }
  }

  userAction(mouse) { // Change listener's position when the mouse/touch has been used

    // Get the new potential listener's position
    var tempX = this.extremum.moyX + (mouse.clientX - window.innerWidth/2)/(this.scale);
    var tempY = this.extremum.minY + (mouse.clientY - this.parameters.circleDiameter/2)/(this.scale);

    // Check if the value is in the values range
    if (tempX >= this.positionRange.minX && tempX <= this.positionRange.maxX && tempY >= this.positionRange.minY && tempY <= this.positionRange.maxY) {
      // console.log("Updating");

      // Update objects and their display              
      this.Listener.Reset(mouse, this.offset, this.scale);                            // Reset the listener at the new position
      this.Sources.onListenerPositionChanged(this.Listener.listenerPosition);         // Update the sound depending on listener's position
      this.render();                                                                  // Display
    }

    else {
      // When the value is out of range, stop the action
      this.mouseDown = false;
      this.touched = false;
    }
  }

  UpdateContainer() { // Change the display when the window is resized

    // Change size of the selector display
    document.getElementById("circleContainer").height = (this.offset.y*this.scale) + "px";
    document.getElementById("circleContainer").width = (this.offset.x*this.scale) + "px";
    document.getElementById("circleContainer").transform = "translate(" + (this.parameters.circleDiameter/2 - this.range.rangeX*this.scale.VPos2Pixel/2) + "px, 10px)";

    // Change other global displays
    this.Sources.UpdateSourcesPosition(this.scale, this.offset);      // Update sources' display
    this.Listener.UpdateListenerDisplay(this.offset, this.scale);     // Update listener's display
    this.UpdateInstrumentsDisplay();                                  // Update instrument's display
    this.UpdateSceneDisplay();                                  // Update scene's display
  }

  UpdateInstrumentsDisplay() { // Update the position of the instruments
    for (let i = 0; i < this.Sources.sourcesData.sources_xy.length; i++) {
      this.instruments[i].style.transform = "translate(" + 
        ((this.Sources.sourcesData.sources_xy[i].x - this.offset.x)*this.scale) + "px, " + 
        ((this.Sources.sourcesData.sources_xy[i].y - this.offset.y)*this.scale) + "px)";
    }
  }
  UpdateSceneDisplay() { // Update the scale of the scene
      this.scene.width = this.extremum.rangeX*this.scale
      this.scene.height = this.extremum.rangeY*this.scale
  }
}

export default PlayerExperience;