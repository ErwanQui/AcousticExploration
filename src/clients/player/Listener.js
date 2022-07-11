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

	    navigator.geolocation.getCurrentPosition((pos) => {
	    	this.initPosX = pos.coords.latitude;
	    	this.initPosY = pos.coords.longitude;
	    }, this.Error);


	    // Parameter's for the display of user's position
	    this.display;													// Html element for the display (build in 'start()')
	    this.displaySize = parameters.listenerSize;						// Size of the listener's display
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
	} 

	Success(pos) {
        var crd = pos.coords;

        console.log('Votre position actuelle est :');
        console.log(`Latitude : ${crd.latitude}`);
        console.log(`Longitude : ${crd.longitude}`);
        console.log(`La précision est de ${crd.accuracy} mètres.`);

    }

    UpdatePos() {
		navigator.geolocation.getCurrentPosition((pos) => {
			this.listenerPosition.x = this.initListenerPosition.x + this.LatLong2Meter(pos.coords.latitude - this.initPosX)/10;
			this.listenerPosition.y = this.initListenerPosition.y + this.LatLong2Meter(pos.coords.longitude - this.initPosY)/10;
			// console.log(pos)
			console.log(this.listenerPosition)
			// this.display.innerHTML = this.listenerPosition.x + " / " + this.listenerPosition.y
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
