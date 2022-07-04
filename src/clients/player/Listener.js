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

	UpdateListener(position, offset, scale) { // Update listener

	    // Update Listener's dipslay depending on offset and scale
      	this.listenerPosition.x = offset.x + (position.clientX - window.innerWidth/2)/scale;
      	this.listenerPosition.y = offset.y + (position.clientY - this.circleSpacing)/scale;
	    console.log(this.listenerPosition)

      	this.UpdateListenerDisplay(offset, scale);
    }

    UpdateListenerDisplay(offset, scale) { // Update listener's display

	    this.display.style.transform = "translate(" + 
	    	((this.listenerPosition.x - offset.x)*scale - this.circleSpacing) + "px, " + 
	    	((this.listenerPosition.y - offset.y)*scale) + "px) rotate(45deg)";
    }
}

export default Listener;
