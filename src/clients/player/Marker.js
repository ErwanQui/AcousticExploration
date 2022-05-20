// Create a basic class which will be used to create a marker
class Marker {

	constructor(canvas) {
	    this.Sprite = new Image();
	    this.Sprite.src = "images/cursor.png"
	    this.Width = 30;
	    this.Height = 30;
	    // marker to canvas center
	    this.XPos = (canvas.width / 2) - this.Width/2;
	    this.YPos = (canvas.width / 2) - this.Width/2;
	    // this.XPos = 100;
	    // this.YPos = 100;
	}
}

export default Marker;