///////////////////
/// Listener.js ///
///////////////////

// Class to manage the listener on the screen (position, orientation...)

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

	    // Parameter's for the display of user's position
	    this.display;													// Html element for the display (build in 'start()')
	    
	    this.displaySize = parameters.listenerSize;							// Size of the listener's display
	    this.circleSpacing = parameters.circleDiameter/2;				// Size of sources to set an offset
	
	    // Position
	    navigator.geolocation.getCurrentPosition((pos) => {
	    	this.initPosX = pos.coords.latitude;
	    	this.initPosY = pos.coords.longitude;
			this.posX = this.initPosX
			this.posY = this.initPosY
	    }, this.Error, {enableHighAccuracy: true});

		// Orientation
		this.initiateOrientation = true;
		this.initOrientation = -135;
		this.offsetOrientation = 90;

		this.previousPosition = {
	      	x: this.initListenerPosition.x,
	      	y: this.initListenerPosition.y,
		}

		this.targetPosX = this.initListenerPosition.x
		this.targetPosY = this.initListenerPosition.y

      	this.compass;
      	this.first = true;

	    // Check if operator is IOS ?
		const isIOS =
	      	navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
	      	navigator.userAgent.match(/AppleWebKit/);


		if (isIOS) {
			console.log("IOS");
		    window.addEventListener("deviceorientation", (event) => this.Handler(event), true);
		} 
		else {
			console.log("not IOS")
	        window.addEventListener("deviceorientationabsolute", (event) => this.Handler(event), true);
	    }

	    // Create the point to display to orientate the listener
		this.orientationDisplay = document.createElement("div");
	    this.orientationDisplay.style.width = 5 + "px";
	    this.orientationDisplay.style.height = 5 + "px";
       	this.orientationDisplay.style.borderRadius = 5 + "px";
       	this.orientationDisplay.style.lineHeight =  5 + "px";
       	this.orientationDisplay.style.background =  "red";

      	this.firstAngle = true;				// Attribute to tell if the first angle has been stored

		window.addEventListener("deviceorientation", event => {

			// always at 90° when begin ?
			//
			if (this.firstAngle) {
				this.firstAngle = false;
				this.initOrientation += event.alpha
			}

			this.orientationAbscisse = Math.cos(-Math.PI*(event.alpha - this.initOrientation)/180)*20 + this.displaySize/2-2
			this.orientationOrdonnate = Math.sin(-Math.PI*(event.alpha - this.initOrientation)/180)*20 + this.displaySize/2-2
	      	this.orientationDisplay.style.transform = "translate(" + 
	      		this.orientationAbscisse + "px, " + 
	      		this.orientationOrdonnate + "px)";
		}, true);

		this.posInitialising = true;					// Attribute to tell if the position has to been initialized

		this.debugCoef = 1;			// used to debug
	}

	Handler(e) {
		console.log("wep")
      	this.compass = e.webkitCompassHeading || Math.abs(e.alpha - 360);
      	if (this.first && this.compass != undefined) {
      		this.direction = this.compass;
      		this.first = false;
      		console.log(this.direction)
      		window.removeEventListener("deviceorientationabsolute", this.Handler(e), true)
      	}
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

		// Add the orientation displayer to the listener display
		this.display.appendChild(this.orientationDisplay)
	}

	LatLong2Meter(value) { // Convert a latitude or longitude change into meter
		return (value * (Math.PI*6371000/180))
	}

	Display (container) { // Add the listener's display to the container

		// @note: we can't do it in 'start()' because the container wasn't created
		container.appendChild(this.display);

		// Watch the evolution of the gps datas and called 'this.UpdatePos' when updated
		navigator.geolocation.watchPosition((position) => this.UpdatePos(position), this.Error, {enableHighAccuracy: true});
	}

    Reset(position, offset, scale) { // Reset the initial listener position

	    // Update Listener's dipslay depending on offset and scale
      	this.initListenerPosition.x = offset.x + (position.clientX - window.innerWidth/2)/scale;
      	this.initListenerPosition.y = offset.y + (position.clientY - this.circleSpacing)/scale;
      	this.listenerPosition.x = offset.x + (position.clientX - window.innerWidth/2)/scale;
      	this.listenerPosition.y = offset.y + (position.clientY - this.circleSpacing)/scale;
      	this.targetPosX = this.initListenerPosition.x
      	this.targetPosY = this.initListenerPosition.y

	    navigator.geolocation.getCurrentPosition((pos) => {
	    	this.posX = pos.coords.latitude;
	    	this.posY = pos.coords.longitude;
	    }, this.Error);

	    this.initPosX = this.posX;
	    this.initPosY = this.posY;

	    // Display with the reset datas
      	this.UpdateListenerDisplay(offset, scale);    	
    }

    ListenerStep(positionX, positionY) { // Move the user to a position (x, y) but with a walking speed
    	
    	// If the user is not already at the targetted position
    	if (positionX != this.listenerPosition.x || positionY != this.listenerPosition.y) {

    		// Initate variables

    		// Number of step that the virtual user will do
			var nbStep = 50*Math.ceil(Math.max(Math.abs(positionX - this.listenerPosition.x), Math.abs(positionY - this.listenerPosition.y)));
			
			// Direction and size of the steps
			var step = [(positionX - this.listenerPosition.x)/nbStep, (positionY - this.listenerPosition.y)/nbStep]
			
			// Counter
			var dpct = 0;

			// Clear the previous walking state if there was one
			clearInterval(this.moving)

			// Set an interval between each step
			this.moving = setInterval(() => {
				if (dpct < nbStep) {

					console.log("User is moving")

					// Update the listener position
					this.listenerPosition.x += step[0];
					this.listenerPosition.y += step[1];

					// Increase counter
					dpct += 1;

					// Dispatch an event listened in "Sources.js" to tell that the user has moved
					document.dispatchEvent(new Event("Moving"));
				}
				else {

					// Stop the move
					clearInterval(this.moving)
				}
			}, 10)
		}
	}

    UpdatePos(pos) { // Update the position of the user when he moves

		// Initiate the first position of the listener when the GPS is received
		if (this.posInitialising && pos.coords.latitude != undefined) {
			this.posInitialising = false;

			// Dispatch an event listened in "Sources.js" to tell that the user has moved
			document.dispatchEvent(new Event("Moving"));
		}

		// Get the changes between previous and current position
		this.updateTargetX = -(Math.cos((this.direction + this.offsetOrientation)*Math.PI/180)*this.LatLong2Meter(pos.coords.latitude - this.posX) - Math.sin((this.direction + this.offsetOrientation)*Math.PI/180)*this.LatLong2Meter(pos.coords.longitude - this.posY))/this.debugCoef
   		this.updateTargetY = -(Math.sin((this.direction + this.offsetOrientation)*Math.PI/180)*this.LatLong2Meter(pos.coords.latitude - this.posX) + Math.cos((this.direction + this.offsetOrientation)*Math.PI/180)*this.LatLong2Meter(pos.coords.longitude - this.posY))/this.debugCoef

    	// Store new latitude and longitude of the user
    	this.posX = pos.coords.latitude;
    	this.posY = pos.coords.longitude;
		
		// Check if "this.direction is not NaN"
		if (!this.first) {

			// Update the new targetting position of the listener
	   		this.targetPosX += this.updateTargetX;
	   		this.targetPosY += this.updateTargetY;

	   		// If there are some changes
			if(this.updateTargetX != 0 || this.updateTargetY != 0) {
				
				console.log("Updating targetted position")

				// Update the listener position by walking
				this.ListenerStep(this.targetPosX, this.targetPosY)
			}
		}
    }

	Error(err) { // Send a error message
		console.eroor(`ERREUR (${err.code}): ${err.message}`);    
	}

	UpdateListener(position, offset, scale) { // Update listener

	    // Update listener's display data depending on offset and scale
      	this.listenerPosition.x = offset.x + (position.clientX - window.innerWidth/2)/scale;
      	this.listenerPosition.y = offset.y + (position.clientY - this.circleSpacing)/scale;

      	// Update display
      	this.UpdateListenerDisplay(offset, scale);
    }

    UpdateListenerDisplay(offset, scale) { // Update listener's display

	    this.display.style.transform = "translate(" + 
	    	((this.listenerPosition.x - offset.x)*scale - this.circleSpacing) + "px, " + 
	    	((this.listenerPosition.y - offset.y)*scale) + "px) rotate(45deg)";
    }
}

export default Listener;
