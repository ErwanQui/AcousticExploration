///////////////////
/// Listener.js ///
///////////////////

class Listener {

	constructor (position, parameters, debugging) {

		this.debugging = false;

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
	    
	    this.displaySize = parameters.listenerSize;
	    // }
	    this.circleSpacing = parameters.circleDiameter/2;				// Size of sources to set an offset
	

	    // Position
	    navigator.geolocation.getCurrentPosition((pos) => {
	    	this.initPosX = pos.coords.latitude;
	    	this.initPosY = pos.coords.longitude;
	    	this.north = pos.coords.heading;
		this.posX = this.initPosX
		this.posY = this.initPosY
	    }, this.Error, {enableHighAccuracy: true});

		// Orientation
		this.initiateOrientation = true;
		this.initOrientation = -45;
		this.initOrientation2 = -90;
		this.initStore = 10000;
		this.store = 10000;

		this.previousPosition = {
	      x: this.initListenerPosition.x,
	      y: this.initListenerPosition.y,
		}

		this.targetPosX = this.initListenerPosition.x
		this.targetPosY = this.initListenerPosition.y

		console.log(this.targetPosX, this.targetPosY)

      	this.compass;
      	this.first = true;

	    this.pointDegree;

		const isIOS =
	      navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
	      navigator.userAgent.match(/AppleWebKit/);

	     console.log(isIOS)


	      navigator.geolocation.getCurrentPosition((position) => {

	      const { latitude, longitude } = position.coords;
	      var pointDegree = this.calcDegreeToPoint(latitude, longitude);

	      if (pointDegree < 0) {
	        pointDegree = pointDegree + 360;
	    }
	      });

	      if (!isIOS) {
	        window.addEventListener("deviceorientationabsolute", (e) => {

		      this.compass = e.webkitCompassHeading || Math.abs(e.alpha - 360);
		      if (this.first && this.compass != undefined) {
		      	this.direction = this.compass;
		      	// this.direction = 315;
		      	console.log(this.direction)
		      	this.first = false;
		      }
	  		}, true);
	      }
	    // }

	    function startCompass() {
	      if (isIOS) {
	        DeviceOrientationEvent.requestPermission()
	          .then((response) => {
	            if (response === "granted") {
	              window.addEventListener("deviceorientation", handler, true);
	            } else {
	              alert("has to be allowed!");
	            }
	          })
	          .catch(() => alert("not supported"));
	      }
	    }

		this.orientationDisplay = document.createElement("div");
	    this.orientationDisplay.style.width = 5 + "px";
	    this.orientationDisplay.style.height = 5 + "px";
       	this.orientationDisplay.style.borderRadius = 5 + "px";
       	this.orientationDisplay.style.lineHeight =  5 + "px";
       	this.orientationDisplay.style.background =  "red";

		this.orientationDisplay2 = document.createElement("div");
	    this.orientationDisplay2.style.width = 8 + "px";
	    this.orientationDisplay2.style.height = 8 + "px";
       	this.orientationDisplay2.style.borderRadius = 8 + "px";
       	this.orientationDisplay2.style.lineHeight =  8 + "px";
       	this.orientationDisplay2.style.background =  "green";

       	this.latLongDisplay = document.createElement("input");
       	this.latLongDisplay.type = "button";
	    this.latLongDisplay.style.transform = "translate(-100px, -100px) rotate(-45deg)";

      	this.orientationDisplay2.style.transform = "translate(" + 
      		(Math.cos(-Math.PI*(this.north)/180)*20 + this.displaySize/2-2) + "px, " + 
      		(Math.sin(-Math.PI*(this.north)/180)*20 + this.displaySize/2-2) + "px)";

		window.addEventListener("deviceorientation", event => {

			this.orientationAbscisse = Math.cos(-Math.PI*(event.alpha - this.initOrientation)/180)*20 + this.displaySize/2-2
			this.orientationAbscisse2 = Math.cos(-Math.PI*(event.alpha)/180)*20
			this.orientationOrdonnate = Math.sin(-Math.PI*(event.alpha - this.initOrientation)/180)*20 + this.displaySize/2-2
			this.orientationOrdonnate2 = Math.sin(-Math.PI*(event.alpha)/180)*20
	      	this.orientationDisplay.style.transform = "translate(" + 
	      		this.orientationAbscisse + "px, " + 
	      		this.orientationOrdonnate + "px)";
			this.store = event.alpha;
			// }
		}, true);


		this.count = 0;
		this.posInitialising = true;

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

		this.display.appendChild(this.orientationDisplay)
		this.display.appendChild(this.orientationDisplay2)
		this.display.appendChild(this.latLongDisplay)
	}


	calcDegreeToPoint(latitude, longitude) {
	      // Qibla geolocation
	      const point = {
	        lat: 21.422487,
	        lng: 39.826206
	      };

	      const phiK = (point.lat * Math.PI) / 180.0;
	      const lambdaK = (point.lng * Math.PI) / 180.0;
	      const phi = (latitude * Math.PI) / 180.0;
	      const lambda = (longitude * Math.PI) / 180.0;
	      const psi =
	        (180.0 / Math.PI) *
	        Math.atan2(
	          Math.sin(lambdaK - lambda),
	          Math.cos(phi) * Math.tan(phiK) -
	            Math.sin(phi) * Math.cos(lambdaK - lambda)
	        );
	      return Math.round(psi);
	    }


	LatLong2Meter(value) {
		return (value * (Math.PI*6371000/180))
	}

	ChangeDebug(value) {
		if (value) {
			this.display.style.height = this.displaySize*5 + "px";
			this.display.style.width = this.displaySize*5 + "px";
		}
		else {
			this.display.style.height = this.displaySize + "px";
			this.display.style.width = this.displaySize + "px";
		}
		this.debugging = value;
	}

	Display (container) { // Add the listener's display to the container

		// @note: we can't do it in 'start()' because the container wasn't created
		container.appendChild(this.display);

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

    Reset(position, offset, scale) {
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

      	this.UpdateListenerDisplay(offset, scale);    	
    }

    ListenerStep(positionX, positionY) {
    	console.log(positionX, positionY)
    	console.log(this.listenerPosition)
    	console.log(Math.max(Math.abs(positionX - this.listenerPosition.x), Math.abs(positionY - this.listenerPosition.y)))
    	console.log(Math.ceil(Math.max(Math.abs(positionX - this.listenerPosition.x), Math.abs(positionY - this.listenerPosition.y))))
    	if (positionX != this.listenerPosition.x || positionY != this.listenerPosition.y) {
			var nbStep = 50*Math.ceil(Math.max(Math.abs(positionX - this.listenerPosition.x), Math.abs(positionY - this.listenerPosition.y)));
			var step = [(positionX - this.listenerPosition.x)/nbStep, (positionY - this.listenerPosition.y)/nbStep]
			var dpct = 0;
			console.log(nbStep)
			console.log(step)
			clearInterval(this.moving)
			this.moving = setInterval(() => {
				if (dpct < nbStep) {
					this.listenerPosition.x += step[0];
					this.listenerPosition.y += step[1];
					dpct += 1;
					document.dispatchEvent(new Event("Moving"));                              // Create an event when the simulation appeared
				}
				else {
					clearInterval(this.moving)
				}
			}, 10)
		}
	}

    UpdatePos() {
    	// console.log("pos")
		navigator.geolocation.getCurrentPosition((pos) => {
			if (this.posInitialising && pos.coords.latitude != undefined) {
				this.posInitialising = false;
				document.dispatchEvent(new Event("Moving"));
			}

			this.latLongDisplay.value = (Math.round(pos.coords.latitude*100000)/100000) + " / " + (Math.round(pos.coords.longitude*100000)/100000);

			this.updateTargetX = -(Math.cos((this.direction - this.initOrientation2)*Math.PI/180)*this.LatLong2Meter(pos.coords.latitude - this.posX) - Math.sin((this.direction - this.initOrientation2)*Math.PI/180)*this.LatLong2Meter(pos.coords.longitude - this.posY))/10
	   		this.updateTargetY = -(Math.sin((this.direction - this.initOrientation2)*Math.PI/180)*this.LatLong2Meter(pos.coords.latitude - this.posX) + Math.cos((this.direction - this.initOrientation2)*Math.PI/180)*this.LatLong2Meter(pos.coords.longitude - this.posY))/10

	    	this.posX = pos.coords.latitude;
	    	this.posY = pos.coords.longitude;


			if (this.updateTargetX != NaN || this.updateTargetY != NaN) {
		   		this.targetPosX += this.updateTargetX;
		   		this.targetPosY += this.updateTargetY;
				if(this.updateTargetX != 0 || this.updateTargetY != 0) {
					console.log("change !")
					this.ListenerStep(this.targetPosX, this.targetPosY)
				}
			}

			if (pos.coords.heading != null) {
					this.north = pos.coords.heading
				}
			if (this.debugging) {
				this.display.innerHTML = this.compass

				var debugging = document.createElement('div')
				debugging.innerHTML = pos.coords.latitude;
				this.display.appendChild(debugging)

				var debugging2 = document.createElement('div')
				debugging2.innerHTML = pos.coords.longitude;
				this.display.appendChild(debugging2)

				var debugging3 = document.createElement('div')
				debugging3.innerHTML = this.north;
				this.display.appendChild(debugging3)
				this.count += 1;
			}

			this.orientationDisplay2.style.transform = "translate(" + 
	      		(Math.cos(-Math.PI*(this.north)/180)*20 + this.displaySize/2-2) + "px, " + 
	      		(Math.sin(-Math.PI*(this.north)/180)*20 + this.displaySize/2-2) + "px)";

		}, this.Error, {enableHighAccuracy: true});
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
