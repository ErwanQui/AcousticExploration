//////////////////
/// Listener.js ///
//////////////////

class Listener {

	constructor (position, parameters) {

	    // User positions
	    this.listenerPosition = {
	      x: position.x,
	      y: position.y,
	    };

	    this.display;
	    this.displaySize = parameters.listenerSize;
	    this.circleSpacing = parameters.circleDiameter/2;
	}

	async start () {
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

	Display (container) {
		container.appendChild(this.display);
	} 

	UpdateListener(position, offset, scale) { // Update Listener
	    // Update Listener's dipslay
      	this.listenerPosition.x = offset.x + (position.clientX - window.innerWidth/2)/scale;
      	this.listenerPosition.y = offset.y + (position.clientY - this.circleSpacing)/scale;

      	this.UpdateListenerDisplay(offset, scale);
    }

    UpdateListenerDisplay(offset, scale) {
	    this.display.style.transform = "translate(" + 
	    	((this.listenerPosition.x - offset.x)*scale - this.circleSpacing) + "px, " + 
	    	((this.listenerPosition.y - offset.y)*scale) + "px) rotate(45deg)";
    }
}

export default Listener;
