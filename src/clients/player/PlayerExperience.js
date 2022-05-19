import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import Monster from './Monster.js';

class PlayerExperience extends AbstractExperience {
  constructor(client, config = {}, $container) {
    super(client);

    this.config = config;
    this.$container = $container;
    this.rafId = null;

// Require plugins if needed
    this.audioBufferLoader = this.require('audio-buffer-loader');
    this.ambisonics = require('ambisonics');

// Initial parameters
    this.initialising = true;
    this.order = 3;
    this.azimutAim = 180;

// Variable to stop the 'setInterval()' function
  this.spawnerId = null;
  this.playerStatutCheckId = null;

// Player data
    this.player = {Status: "alive", KillCount: 0, AzimutPrecision: 30}; // AzimutPrecision: Azimut Angle in which a monster can be killed

// Monsters parameters
    this.monsters = {
      List: [],                   // List: List of current monsters
      LifeTime: 20,               // LifeTime: Time in second before a monster kill the player
      AzimutSpeed: 15,            // AzimutSpeed: Azimut range of movement each second
      SpawnRate: 7,               // SpawnRate: Time between each monster spawn
      Scream: null,               // Scream: List of possible screams of Monsters (attributed in 'start()')
      OutToRotator: null,         // OutToRotator: Rotator to connect Monsters screams (attributed in 'start()')
    }

// AudioContext creation
    this.audioContext = new AudioContext();
    this.playerGain = this.audioContext.createGain();
    this.playerBinDecoder = new this.ambisonics.binDecoder(this.audioContext, this.order);

    renderInitializationScreens(client, config, $container);
  }

  async start() {
    super.start();

// Assignation of screams sounds
    this.monsters.Scream = await this.audioBufferLoader.load({
      'MonsterSound1': 'Audio/Monster1.mp3',
      'MonsterSound2': 'Audio/Monster2.mp3',
      'MonsterSound3': 'Audio/Monster3.mp3',
      'MonsterSound4': 'Audio/Monster4.mp3',
      'MonsterSound5': 'Audio/Monster5.mp3',
    }, true);

// Assignation of common sounds in a Soundbank
    this.soundBank = await this.audioBufferLoader.load({
      'MonsterDie':'Audio/MonsterDie.wav',
      'Shoot': 'Audio/Kill.mp3',
      'GameOver': 'Audio/GameOver.wav',
      'PlayerDamage': 'Audio/PlayerDamage.wav',
    }, true);

// Creation of the Rotator
    this.monsters.OutToRotator = new this.ambisonics.sceneRotator(this.audioContext, this.order);

// Connection between the destination and the gain of common sounds
    this.playerGain.connect(this.audioContext.destination);

// Connection between the destination and the sounds of monsters
    this.monsters.OutToRotator.out.connect(this.playerBinDecoder.in);
    this.playerBinDecoder.out.connect(this.audioContext.destination);

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
        <div id="gameInterface" style="visibility: hidden; position: absolute;">
          <div>
            <input type="button" id="shootButton" value="Shoot" style="width: 350px; height: 200px; font-size: 100px;"/>
          </div>
          <br>
          <div>
            <input type="range" id="sliderAzimAim" min=0 max=360 value=${this.azimutAim}/>${this.azimutAim}
          </div>
          <br>
          <h2 id="killDiplay" style="visibility: hidden;">
              You killed ${this.player.KillCount} Monsters
          </h2>
        </div>
      `, this.$container);

      // Assign callbacks once
      if (this.initialising) {
        var beginButton = document.getElementById("beginButton");
        beginButton.addEventListener("click", () => {
          this.onBeginClicked(beginButton, document.getElementById("gameInterface"));
        });

        var shootButton = document.getElementById("shootButton");
        shootButton.addEventListener("click", () => {
          this.onShootClicked();
        });

        var yawSlider = document.getElementById("sliderAzimAim");
        yawSlider.addEventListener("input", () => {

          // Update display
          this.azimutAim = yawSlider.value;
          this.render();

          this.onUpdatePlayerOrientation(yawSlider.value);
        });
        this.initialising = false;
      }
    });
  }

  onBeginClicked(button, gameInterface) {

    // Change the display when game begins
    button.style.visibility = "hidden";
    button.style.position = "absolute";
    gameInterface.style.visibility = "visible";
    gameInterface.style.position = "relative";

    // Create the first monster
    //@note: I can't create a monster template, I need to instatiate a new one once
    this.monsters.List.push(new Monster(this.monsters, this.audioContext, this.player));
    this.monsters.List[0].start()

    // Set an interval to make spawn each 'SpawnRate' seconds a new monster
    this.spawnerId = setInterval(() => {
      this.monsters.List.push(new Monster(this.monsters, this.audioContext, this.player));
      this.monsters.List[this.monsters.List.length-1].start()
    }, 1000*this.monsters.SpawnRate);

    // Set an interval to check each seconds if the player is dead
    this.playerStatutCheckId = setInterval(() => {
      if (this.player.Status == "dead") {
        clearInterval(this.spawnerId)                                           // Stop spawner
        clearInterval(this.playerStatutCheckId)                                 // Stop checking if the player is dead
        for (let i = 1; i < this.monsters.List.length; i++) {
          this.monsters.List[i].Die();                                          // Do die all remaining monsters
        }
        this.Play(this.soundBank.PlayerDamage);                                 // Play Damage sound before player die
        
        // Set a TimeOut before the Gameover sound is played
        setTimeout(() => {
          this.Play(this.soundBank.GameOver)                                    // Play Gameover sound
          document.getElementById("killDiplay").style.visibility = "visible";   // Display the killcount
        ;}, 1000);
      }
    }, 500);
  }

  onShootClicked() {

    // Var initialisation
    var killing = false;
    var iterator = 0;

    // Play Shoot sound
    this.Play(this.soundBank.Shoot);

    // Check if there is a monster in azimut range of the shoot
    while ((iterator < this.monsters.List.length) && (this.monsters.List[iterator].Shoot(this.azimutAim) > this.player.AzimutPrecision)) {
      iterator += 1
    }

    // If there is a monster
    if (iterator < this.monsters.List.length) {
      console.log("You kill a monster")
      this.Play(this.soundBank.MonsterDie);     // Play MonsterDie sound
      this.monsters.List[iterator].Die();       // Do die this monster
      this.monsters.List.splice(iterator, 1);   // Delete the monster of the active monsters list
      this.player.KillCount += 1;               // Add a kill to the killcount
    }
    else {
      console.log("You miss your shoot");
    }
  }

  onUpdatePlayerOrientation(yaw) {

    // Update the player orientation
    this.monsters.OutToRotator.yaw = yaw;
    this.monsters.OutToRotator.updateRotMtx();
  }


  // Function to play sound, because we can only play an audio buffer once, and we can't reattribute a buffer...
  Play(buffer) {

    // Sound initialisation
    var Sound = this.audioContext.createBufferSource()
    Sound.loop = false;
    Sound.buffer = buffer;
    Sound.connect(this.playerGain)

    // Disconnect the sound when the sound is ended
    Sound.addEventListener('ended', () => {Sound.disconnect(this.playerGain);})

    Sound.start();
  }
}

export default PlayerExperience;
