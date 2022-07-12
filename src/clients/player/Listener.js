///////////////////
/// Listener.js ///
///////////////////

class Listener {

	constructor (position, parameters) {

	    // User's begin position
	    this.initListenerPosition = {
	      x: position.x,
	      y: position.y,
	    };
	    this.listenerPosition = {
	      x: this.initListenerPosition.x,
	      y: this.initListenerPosition.y,
	    };

		// document.addEventListener("deviceready", () => {
		    navigator.geolocation.getCurrentPosition((pos) => {
		    	this.initPosX = pos.coords.latitude;
		    	this.initPosY = pos.coords.longitude;
		    }, this.Error);
		// }, false);

		this.count = 0;
	    // Parameter's for the display of user's position
	    this.display;													// Html element for the display (build in 'start()')
	    this.displaySize = parameters.listenerSize*5;						// Size of the listener's display
	    this.circleSpacing = parameters.circleDiameter/2;				// Size of sources to set an offset
	}

	async start () {

		// Create listener's display and assigning parameters
		this.display = document.createElement('div');
		this.display.id = "listener";
		this.display.style.position = "absolute"
		this.display.style.height = this.displaySize + "px";
		this.display.style.width = this.displaySize + "px";
		this.display.style.background = "blue";
		this.display.style.textAlign = "center";
		this.display.style.zIndex = 1;
		this.display.style.transform = "rotate(45deg)";
	}

	LatLong2Meter(value) {
		return (value * (Math.PI*6371000/180))
	}

	Display (container) { // Add the listener's display to the container

		// @note: we can't do it in 'start()' because the container wasn't created
		container.appendChild(this.display);

	    // navigator.geolocation.getCurrentPosition((pos) => {
	    // 	this.initPosX = pos.coords.latitude;
	    // 	this.initPosY = pos.coords.longitude;
	    // }, this.Error);

	    // this.cacahuete = document.createElement('div')
	    // conatiner.appendChildthis

		setInterval(() => {
			this.UpdatePos();
		}, 100);
		// navigator.geolocation.watchPosition((pos) => {
		// 	this.UpdatePos(pos);
		// }, this.Error);
	} 

	Success(pos) {
        var crd = pos.coords;

        console.log('Votre position actuelle est :');
        console.log(`Latitude : ${crd.latitude}`);
        console.log(`Longitude : ${crd.longitude}`);
        console.log(`La précision est de ${crd.accuracy} mètres.`);

    }

    UpdatePos(pos) {
    	// console.log("pos")
		navigator.geolocation.getCurrentPosition((pos) => {
			console.log(pos.coords.latitude)
			console.log(pos.coords.longitude)
			console.log(this.LatLong2Meter(pos.coords.latitude - this.initPosX))
			console.log(this.LatLong2Meter(pos.coords.longitude - this.initPosY))
			this.listenerPosition.x = this.initListenerPosition.x + this.LatLong2Meter(pos.coords.latitude - this.initPosX);
			this.listenerPosition.y = this.initListenerPosition.y + this.LatLong2Meter(pos.coords.longitude - this.initPosY);
			// console.log(pos)
			console.log(this.listenerPosition)
			this.display.innerHTML = this.listenerPosition.x + " / " + this.listenerPosition.y
			var debugging = document.createElement('div')
			debugging.innerHTML = pos.coords.latitude + " / " + pos.coords.longitude;
			this.display.appendChild(debugging)
			var debugging2 = document.createElement('div')
			debugging2.innerHTML = this.count;
			this.display.appendChild(debugging2)
			// this.display.innerHTML = this.listenerPosition.x + " / " + this.listenerPosition.y
			this.count += 1;
			document.dispatchEvent(new Event("ListenerMove"));
		}, this.Error);
    }

	Error(err) {
        console.warn(`ERREUR (${err.code}): ${err.message}`);
    }

	UpdateListener(position, offset, scale) { // Update listener

	    // Update Listener's dipslay depending on offset and scale
      	this.listenerPosition.x = offset.x + (position.clientX - window.innerWidth/2)/scale;
      	this.listenerPosition.y = offset.y + (position.clientY - this.circleSpacing)/scale;

      	this.UpdateListenerDisplay(offset, scale);
    }

    UpdateListenerDisplay(offset, scale) { // Update listener's display

	    this.display.style.transform = "translate(" + 
	    	((this.listenerPosition.x - offset.x)*scale - this.circleSpacing) + "px, " + 
	    	((this.listenerPosition.y - offset.y)*scale) + "px) rotate(45deg)";
    }
}

export default Listener;
