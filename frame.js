/*canvas frame will have either a parent frame or a canvas in which to exist. It 
			has a height and width that is proportional to it's parent's with a 
			location that falls within the bounds of it's parent. 
		Coordinate 0,0 corresponds to the upper-leftmost coordsinate of the parent. 
		Window cannot exist outside the bounds of it's parent, any portion that 
		falls outside the parent is not drawn.
*/
function canvas_frame(parent_frame, width, height, percent){
	var that = this;

	this.parent_frame = parent_frame;
		if(typeof percent === "undefined" || percent === true){
			this.height = this.parent_frame.height * (percent_height/100);	
			this.width	= this.parent_frame.width  * (percent_width/100);
		}else{ this.height = height; this.width = width;}

	//the coordsinates of this frame within it's parent
	this.coords = {x:0, y:0};

	this.background = "none";
	var foreground = new ImageData(this.width, this.height);
	//set the canvas of this frame and if applicable, 
		//add this frame to it's parent's children list
	if(this.parent_frame instanceof HTMLCanvasElement){ 
		//the parent_frame is the canvas
		this.canvas = parent_frame;
		this.canvas.frame_children = [];
			this.canvas.frame_children.push(this);

		//if any the canvas has no either scratch_pad or context then get one
		var scratch_isObj = this.canvas._scratch_pad === "object";		
		var scratch_isCan = this.canvas._scratch_pad instanceof HTMLCanvasElement;
		var ctx_isObj = this.canvas._scratch_ctx === "object";
		var ctx_isCan = this.canvas._scratch_ctx instanceof CanvasRenderingContext2D;	
		
		if( !scratch_isObj || !ctx_isObj || !scratch_isCan || !ctx_isCan){
			this.canvas._scratch_pad = document.createElement("CANVAS");
				this.canvas._scratch_pad.style.display = "none";
				this.canvas._scratch_pad.height = this.canvas.height; 
				this.canvas._scratch_pad.width = this.canvas.width;
			this.canvas._scratch_ctx = this.parent_frame._scratch_pad.getContext('2d');
		}
	
	}	else{
		this.canvas = this.parent_frame.canvas; 
		this.parent_frame.add_child(this);
	}

	//this is where the all the image manipulation will occur
	this._scratch_pad = this.parent_frame._scratch_pad;
	this._scratch_ctx = this.parent_frame._scratch_ctx;	

	this.context = this.canvas.getContext('2d');	
	
	this.font_style = {color:"white", font:"20px Arial"};
	
	this.frame_children = [];
	this.add_child = function(child){
		if(typeof child === "HTMLImageElement"){ 
			var global_coords = that.convert_coords(that.coords.x, that.coords.y);
			var n_wind = new canvas_frame(that, child.width, child.height, false);
			n_wind.draw(child);
			n_wind.setBackground();
		return that.frame_children.push(n_wind);
		//if the child is a canvas_frame just add it to the list of children	
		}else if(typeof child === typeof that){ return that.frame_children.push(child);}

	}

	// This function clears and redraws whatever falls within this frame. 
	//	if this frame has no children a.k.a. is a drawable object
	//		draw that element otherwise have all of you're children refresh
	this.refresh = function(){
		that.clear();
		that.draw(that.background);
		for(i = 0; i < that.frame_children.length; i++){
			that.draw(frame_children[i]);
			frame_children[i].refresh();				
		}
	}	
	
	//This function clears the space to be the selected background
	this.clear = function(){
		var coords = that.convert_coords(that.coords.x, that.coords.y);
		that.context.clearRect(that.coords.x, that.coords.y, that.width, that.height);
	}

	this.set_background = function(obj){
		if(typeof obj !== "undefined" ) {that.draw(obj);}
		var coords = that.convert_coords(that.coords.x, that.coords.y);
		background = that.context.getImageData(coords.x, coords.y, that.width, that.height);
	};
	
/* Draws either the given image at the given coordsinates or fills with the given
	 color. If either x_coords or y_coords is undefined they are assumed to be 0.
*/
	this.draw = function(obj, x_coords, y_coords){
		//if the object isn't anything don't do anything
		if(typeof obj === "undefined") return;
		//check the types of the coordinates, if not numbers, set to 0
		if(typeof x_coords !== "number"){ x_coords = 0;}
		if(typeof y_coords !== "number"){ y_coords = 0;}

		//convert the coordsinates into global coordsinates
		var coords = that.convert_coords(x_coords, y_coords);

		//if the drawing object is an image
			//draw the part that falls within the frame
		if(obj instanceof HTMLImageElement){
			that.draw_image(obj, coords.x, coords.y, "fill");
		}else if(obj instanceof ImageData){
			
		}else if(typeof obj === "string"){
			if(/t(ext)?:.+/.test(obj)){ that.draw_obj(obj.replace(/t(ext)?:/, ""), coords.x, coords.y); }
			else{ that.fill_color(obj); }
		}
	}
	/** Returns a collection dimensions and coordinates appropriate for drawing images **/
	this.convert_dimensions = function(x, y, width, height){
			var dim = {};
			dim.x = x; dim.y = y;
			//set up sx and sy
			dim.sx = 0; dim.sy = 0;
			if(x < 0){ dim.sx = 0-x; dim.x = 0;}
			if(y < 0){ dim.sy = 0-y; dim.y = 0;}

			//set up swidth and sheight
			dim.swidth = 0; dim.sheight = 0;
			if( (dim.x + width) > that.width){ 
				dim.swidth = that.width - dim.x;}
			if( (dim.y + height) > that.height){ 
				dim.sheight = that.height - dim.y;}
	return dim;
	}

/* Draws the image that either fills the frame or clips it*/
	this.draw_image = function(image, x, y, mode){
		//check the types of the coordsinates, if not numbers, set to 0
		if(typeof x_coords !== "number"){ x_coords = 0;}
		if(typeof y_coords !== "number"){ y_coords = 0;}
			
			//change the dimensions if needed
			var dim = convert_dimensions(x, y, image.width, image.height);	
		
			//set up x, y to hold the global coordsinates
			var coords = that.convert_coords(x, y);
				x = coords.x; y = coords.y;

			if(/fill/.test(mode)){			
				that.scratch_ctx.drawImage(image, 0, 0, that.width, that.height);
				image = that.scratch_ctx.getImageData(0, 0, that.width, that.height);
				that.context.putImageData(image, x, y);
			}else if(/flat/.test(mode)){
				that.context.drawImage(image, sx, sy, swidth, sheight, x, y, swidth, sheight);	
			}
	}

/*Fills the frame with the given color*/
	this.fill_color = function(color){
			that.context.fillStyle = color;
			that.context.fillRect(that.coords.x, that.coords.y, that.width, that.height);	
	}

/* Draws the text with the given text style*/
	this.draw_text = function(text, x, y, font, color){
		//check the types of the coordsinates, if not numbers, set to 0
		if(typeof x !== "number"){ x = 0;}
		if(typeof y !== "number"){ y = 0;}
		//set the font_style if applicable
		if(typeof font !== "undefined") {that.font_style.font = font;}
		if(typeof color === "undefined") {that.font_style.color = color;}

		var coords = that.convert_coords(x,y);

		that.context.font = that.font_style.font;
		that.context.style= that.font_style.color;
		that.context.fillText(text, coords.x, coords.y); 
	}

  /*converts the given coords from inside this frame into global coords
	 * @return an object containing x and y coordsinate
	*/
	this.convert_coords = function(x_coord, y_coord){
		//convert the coordsinates into the parents coordsinate system.
		x_coord = x_coord + that.coords.x;
		y_coord = y_coord + that.coords.y;
		//if the current parent is a canvas return the results
		if(that.parent_frame instanceof HTMLCanvasElement){	
			return { x:x_coord, y:y_coord};
		} else { return that.parent_frame.convert_coords(x_coord, y_coord);}
	}
}
