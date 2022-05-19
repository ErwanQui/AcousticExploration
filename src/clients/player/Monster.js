//////////////////
/// Monster.js ///
//////////////////

class Monster {

	constructor (data, audioContext, player) {

		// Requiring ambisonics
		this.ambisonics = require('ambisonics');

		// Definition of monster's parameters
		this.azimutSpeed = data.AzimutSpeed;
		this.lifeTime = data.LifeTime;

		// Variable declaration
		this.azimuts = [];					// Azimuts for each living second of the monster
		this.hasKilled = false;				// To know if the monster has killed the player
		this.currentAzimutIndex = 1;		// To know where the monster id (kind of distance)
		this.moveId = null;					// Id to stop monster movement (stop the 'setInterval()')

		// Set the yell audiobuffer of the monster
		this.yell = audioContext.createBufferSource();
		this.yell.loop = true;
		this.yell.buffer = data.Scream["MonsterSound" + Math.ceil(Math.random()*(Object.keys(data.Scream).length))];  // Attributes a random scream to the monster
		this.yell.playbackRate.value = 1;

		// Creation of audio node specific te the monster
		this.gain = audioContext.createGain();
		this.encoder = new this.ambisonics.monoEncoder(audioContext, 3);

		// Connection to the player nodes
		this.encoder.out.connect(data.OutToRotator.in);

		// Creation of a callback to disconnect sound of the player audio nodes
		// @note: I need to do a callback here to directly interact with player's parameters
		this.disconnect = function() {
			this.yell.stop();										// Stop Monster's yell
			this.encoder.out.disconnect(data.OutToRotator.in);		// Disconnect the monster of player audio nodes
			if (this.hasKilled) {
				//@note: I need to create an object with attribute to modifiate data of the PlayerExperience class from the Monster class
				player.Status = "dead";								// Set the playerStatus to "dead"
			}
		}		
	}

	async start () {

		// Set audio parmaeters and connect audio nodes
		this.gain.gain.setValueAtTime(0.4, 0);

		this.yell.connect(this.gain);
		this.gain.connect(this.encoder.in);

		// Add the random first position
		this.azimuts.push(Math.floor(Math.random()*361));

		// Add all successiv azimuts
		for (let i = 0; i < this.lifeTime; i++) {
			this.azimuts.push((this.azimuts[i] + Math.floor(Math.random()*(2*this.azimutSpeed + 1)) - this.azimutSpeed + 360)%360);
		}

		// Set the audio initial position
		this.encoder.azim = this.azimuts[0];
		this.encoder.updateGains();

		// Launch the audio
		this.yell.start();

		// Set the interval to move the monster each second
		this.moveId = setInterval(() => this.UpdatePos(), 1000);
	}

	UpdatePos() {

		// Check if the monster is on the player (and kill him)
		if(this.currentAzimutIndex == this.lifeTime) {
			clearInterval(this.moveId);		// Stop this monster's movement
			this.KillPlayer();				// Call the function to update the player status
			return;
		}
		else {

			// Update the monster's playback yell when he approaches
			this.yell.playbackRate.value = 1 + 3*(this.currentAzimutIndex/this.lifeTime);
		}

		// Update audio
		this.encoder.azim = this.azimuts[this.currentAzimutIndex];
		this.encoder.updateGains();

		// Update monster's position
		this.currentAzimutIndex += 1;
	}

// Function called to know the azimut angle difference between the monster and the shoot
	Shoot(azimutShootAngle) {
		var angleDifference = Math.abs(this.azimuts[this.currentAzimutIndex] - azimutShootAngle);
		return Math.min(angleDifference, 360 - angleDifference);
	}

// Function called when the monster die
	Die() {
		clearInterval(this.moveId);			// Stop monster's movement
		this.disconnect()					// Call the callback to disconnect the monster of the audio
		return;
	}

// Function called when the player die
	KillPlayer() {
		this.hasKilled = true;				// To know that the monster has killed the player
		this.disconnect();					// Call the callback to disconnect the monster of the audio
	}
}

export default Monster;
