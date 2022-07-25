///////////////////
/// Listener.js ///
///////////////////

class Listener {

	constructor (position, parameters) {

	    // User's begin position
	    this.listenerPosition = {
	      x: position.x,
	      y: position.y
	    };
	    console.log(this.listenerPosition)
	    // console.log(offsetX, offsetY)

	    // Parameter's for the display of user's position
	    this.display;													// Html element for the display (build in 'start()')
	    this.displaySize = parameters.listenerSize;						// Size of the listener's display
	    this.circleSpacing = parameters.circleDiameter/2;				// Size of sources to set an offset
	}

	async start (scale, offset) {

		// Create listener's display and assigning parameters
		this.display = document.createElement('div');
		this.display.id = "listener";
		this.display.style.position = "absolute"
		this.display.style.height = this.displaySize + "px";
		this.display.style.width = this.displaySize + "px";
		this.display.style.background = "blue";
		// this.display.style.textAlign = "center";
		this.display.style.zIndex = 2;
		this.display.style.transform = "translate(" + 
	      		((this.listenerPosition.x - offset.x)*scale) + "px, " + 
	      		((this.listenerPosition.y - offset.y)*scale) + "px)";

		this.display.style.transform += "rotate(45deg)";
	}

	Display (container) { // Add the listener's display to the container

		// @note: we can't do it in 'start()' because the container wasn't created
		container.appendChild(this.display);
	}

	ListenerStep(positionX, positionY, offset, scale) {
		var nbStep = 50*Math.ceil(Math.max(Math.abs(positionX - this.listenerPosition.x), Math.abs(positionY - this.listenerPosition.y)));
		var step = [(positionX - this.listenerPosition.x)/nbStep, (positionY - this.listenerPosition.y)/nbStep]
		var dpct = 0;
		clearInterval(this.moving)
		this.moving = setInterval(() => {
			if (dpct < nbStep) {
				this.listenerPosition.x += step[0];
				this.listenerPosition.y += step[1];
				dpct += 1;
				this.UpdateListenerDisplay(offset, scale);
				document.dispatchEvent(new Event("Moving"));                              // Create an event when the simulation appeared
			}
			else {
				clearInterval(this.moving)
			}
		}, 10)
	} 

	UpdateListener(position, offset, scale) { // Update listener

	    // Update Listener's dipslay depending on offset and scale
	    this.ListenerStep(offset.x + (position.clientX - window.innerWidth/2 - this.circleSpacing)/scale, offset.y + (position.clientY - this.circleSpacing)/scale, offset, scale)
      	// this.listenerPosition.x = offset.x + (position.clientX - window.innerWidth/2 - this.circleSpacing)/scale;
      	// this.listenerPosition.y = offset.y + (position.clientY - this.circleSpacing)/scale;
	    console.log(this.listenerPosition)

      	// this.UpdateListenerDisplay(offset, scale);
    }

    UpdateListenerDisplay(offset, scale) { // Update listener's display

	    this.display.style.transform = "translate(" + 
	    	((this.listenerPosition.x - offset.x)*scale) + "px, " + 
	    	((this.listenerPosition.y - offset.y)*scale) + "px) rotate(45deg)";
    }

    AutoMove(speed, interval, min, max) {
    	console.log(min, max)
    	var updatePos = [(2*Math.random() - 1)*speed*interval/1000, (2*Math.random() - 1)*speed*interval/1000];
    	var pos = [this.listenerPosition.x, this.listenerPosition.y]
    	for (let i = 0; i < 2; i++) {
	    	while (pos[i] + updatePos[i] < min[i] || pos[i] + updatePos[i] > max[i]) {
	    		updatePos[i] = (2*Math.random() - 1)*speed*interval/1000;
	    		console.log(i, updatePos[i])
	    	}
	    }
    	this.listenerPosition.x += updatePos[0];
    	this.listenerPosition.y += updatePos[1];
    	console.log(this.listenerPosition)
    }
}

export default Listener;