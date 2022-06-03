//////////////////
/// Audio.js ///
//////////////////

class Listener {

	constructor (position) {

	    // User positions
	    this.listenerPosition = {
	      x: position.x,
	      y: position.y,
	    };

	    this.display;
	    this.displaySize = 16;
	    this.circleSpacing;
	    // this.container = container;
	}

	async start () {
		// console.log("hui")
		this.display = document.createElement('div');
		this.display.id = "listener";
		this.display.style.position = "absolute"
		this.display.style.height = this.displaySize + "px";
		this.display.style.width = this.displaySize + "px";
		this.display.style.background = "blue";
		this.display.style.textAlign = "center";
		this.display.style.zIndex = 1;
		this.display.style.transform = "rotate(45deg)";
		// console.log(this.display)
	}

	Display (container) {
		container.appendChild(this.display);
		// this.UpdateListener();
	} 

	UpdateListener(position, offset, scale, circleSpacing) { // Update Listener
// offsetw = rangemoyx, offsety = rangeminy
	    // Update Listener's dipslay

      	this.listenerPosition.x = offset.x + (position.clientX - window.innerWidth/2)/scale;
      	this.listenerPosition.y = offset.y + (position.clientY - circleSpacing)/scale;

      	// console.log(circleSpacing)
	    this.display.style.transform = "translate(" + 
	    	(position.clientX - window.innerWidth/2 - circleSpacing) + "px, " + 
	    	(position.clientY - circleSpacing) + "px) rotate(45deg)";
	    
	    // Update the display for the current Position of Listener
	    // this.PositionChanged();  //Use in principal file
	}
}

export default Listener;
