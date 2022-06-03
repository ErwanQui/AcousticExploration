//////////////////
/// Audio.js ///
//////////////////

class Listener {

	constructor (data, audioContext, player) {

	    // User positions
	    this.listenerPosition = {
	      x: 0,
	      y: 0,
	    };
	    this.container = container;
	}

	async start () {
		this.display = document.createElement('div');
		this.display.id = "listener";
		this.display.style.position = "absolute"
		this.display.style.height = this.displaySize + "px";
		this.display.style.width = this.displaySize + "px";
		this.display.style.background = blue;
		this.display.style.textAlign = center;
		this.display.style.zIndex = 1;
		this.container.appendChild(this.display);
		this.UpdateListener();
	}

	UpdateListener(offset, scale) { // Update Listener
// offsetw = rangemoyx, offsety = rangeminy
	    // Update Listener's dipslay
	    document.getElementById("listener").style.transform = "translate(" + 
	    	((this.listenerPosition.x - offset.X)*scale - this.displaySize/2) + "px, " + 
	    	((this.listenerPosition.y - offset.Y)*scale) + "px) rotate(45deg)";
	    
	    // Update the display for the current Position of Listener
	    this.PositionChanged();  //Use in principal file
	}
}

export default Listener;
