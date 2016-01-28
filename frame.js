/*canvas frame will have either a parent frame or a canvas in which to exist. It 
			has a height and width that is proportional to it's parent's width a 
			location that falls within the bounds of it's parent. 
		Coordinate 0,0 corresponds to the upper-leftmost coordsinate of the parent. 
		Window cannot exist outside the bounds of it's parent, any portion that 
		falls outside the parent is not drawn.
*/
function canvas_frame(parent_frame, width, height, percent){
	var that = this;

	this.parent_frame = parent_frame;
		if(typeof percent === "undefined" || percent === true){
			this.height = this.parent_frame.height * (height/100);	
			this.width	= this.parent_frame.width  * (width/100);
		}else{ this.height = height; this.width = width;}

	//the coordsinates of this frame within it's parent
	this.coords = {x:0, y:0};

	this.background = null;

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
	
	/** Adds the given child to the list of children. if the child is drawable, give it frame.
	 * @param child the child frame/drawable_object to be added to the list of children.
	**/
	this.add_child = function(child){
		//if the child is something 
		if(typeof child !== "undefined"){
			var n_wind = new canvas_frame(that, child.width, child.height, false);
			//then try to draw it  
			n_wind.draw(child);
			//set the background of a new frame
			n_wind.setBackground();
		//return the frame
		return that.frame_children.push(n_wind);
		//if the child is a canvas_frame just add it to the list of children	
		}else if(typeof child === typeof that){ return that.frame_children.push(child);}
	}

	/** This function clears and redraws whatever falls within this frame if displayed. **/
	this.refresh = function(){
		that.clear();
		that.draw(that.background);
		for(i = 0; i < that.frame_children.length; i++){
			frame_children[i].refresh();				
			that.draw(frame_children[i]);
		}
	}	
	
	/** Clears the frame completely if displayed. **/
	this.clear = function(){
		//get the dimensions of the displayable frame
		var dim = that.convert_dimensions(that.coords.x, that.coords.y, that.width, that.height);
		that.context.clearRect(dim.x, dim.y, dim.swidth, dim.sheight);
	}

	/** Sets the current image displayed as the background **/
	this.set_background = function(){
		//get the dimensions of the displayable frame
		var dim = that.convert_dimensions(that.coords.x, that.coords.y, that.width, that.height);
		that.background = that.context.getImageData(dim.x, dim.y, dim.swidth, dim.sheight);
	};
	
	/** Draws the object to the frame.
	 * @param obj the object to be drawn. Can be image, color, image data or text.
	 * @param x the x coordinate within the frame of the object. If not present assumed to be 0.
	 * @param y the y coordinate within the frame of the object. If not present assumed to be 0.
	**/
	this.draw = function(obj, x, y){
		//if the object isn't anything don't do anything
		if(typeof obj === "undefined") return;
		//check the types of the coordinates, if not numbers, set to 0
		if(typeof x !== "number"){ x = 0;}
		if(typeof y !== "number"){ y = 0;}

		//if the drawing object is an image
			//draw the part that falls within the frame
		if(obj instanceof HTMLImageElement){
			that.draw_image(obj, x, y, "fill");
		}else if(obj instanceof ImageData){
			that.draw_image_data(obj, x, y);	
		}else if(typeof obj === "string"){
			if(/t(ext)?:.+/.test(obj)){ 
				that.draw_text(obj.replace(/t(ext)?:/, ""), x, y); }
			else{ that.fill_color(obj); }
		}
	}

	/** Draws the image that either fills the frame or clips it.
	 * @param image an html Image Element that is to be drawn to the frame
	 * @param x the x coordinate within the frame of the image
	 * @param y the y coordinate within the frame of the image
	 * @param mode the mode specified in text. if "fill" then stretch the image to\
	 *	fill the frame. if "flat" then draw the image as is.
	**/
	this.draw_image = function(image, x, y, mode){
		//check the types of the coordsinates, if not numbers, set to 0
		if(typeof x !== "number"){ x = 0;}
		if(typeof y !== "number"){ y = 0;}
			
			//change the dimensions if needed
			var dim = that.convert_dimensions(x, y, image.width, image.height);	
			
			if(/fill/.test(mode)){			
				that._scratch_ctx.drawImage(image, 0, 0, that.width, that.height);
				image = that._scratch_ctx.getImageData(0, 0, that.width, that.height);
				that.draw_image_data(image, x, y, dim.swidth, dim.sheight);
			}else if(/flat/.test(mode)){
				that.context.drawImage(image, dim.sx, dim.sy, dim.swidth, dim.sheight, x, y, dim.swidth, dim.sheight);	
			}
	}

	/** Draws the image data onto the frame 
	 * @param image_data an object of type image data that is to be drawn to the frame.
	 * @param x the x coordinate within the current frame of the image to be drawn.
	 * @param y the y coordinate within the current frame of the image to be drawn.
	**/
	this.draw_image_data = function(image_data, x, y, swidth, sheight){
		//check the types of the coordsinates, if not numbers, set to 0
		if(typeof x !== "number"){ x = 0;}
		if(typeof y !== "number"){ y = 0;}
		if( !(image_data instanceof ImageData) ){return;}
	
		//change the dimensions if needed
		if(typeof swidth !== "number" || typeof sheight !== "number"){
			var dim = that.convert_dimensions(x, y, image_data.width, image_data.height);}
		else{ var dim = {x:x, y:y, sx:0, sy:0, swidth:swidth, sheight:sheight}; }

	//finally put the image data in.
	that.context.putImageData(image_data, dim.x, dim.y, 0, 0, dim.swidth, dim.sheight);			
	}

	/** Fills the frame with the given color 
	 * @param color the color specified in text with which to fill the frame
	**/
	this.fill_color = function(color){
			that.context.fillStyle = color;
			var dim = that.convert_dimensions(that.coords.x, that.coords.y, that.width, that.height);
			that.context.fillRect(dim.x, dim.y, dim.width, dim.sheight);	
	}

	/** Draws the text with the given text style
	 * @param text the text to be drawn out.
	 * @param x the x coordinate within the frame of the image.
	 * @param y the y coordinate within the frame of the image.
	 * @param font the font of the text, includes font size.
	 * @param color the color of the text.
	**/
	this.draw_text = function(text, x, y, font, color){
		//check the types of the coordsinates, if not numbers, set to 0
		if(typeof x !== "number"){ x = 0;}
		if(typeof y !== "number"){ y = 0;}
		//set the font_style if applicable
		if(typeof font !== "undefined") {that.font_style.font = font;}
		if(typeof color !== "undefined") {that.font_style.color = color;}

		var coords = that.convert_coords(x,y);

		that.context.font = that.font_style.font;
		that.context.style= that.font_style.color;
		that.context.fillText(text, coords.x, coords.y); 
	}

	/** Returns a set of dimensions with which an image will fit within all frames 
	 * @return an object containing x, y coords the width, height and the clipping dimensions
	 **/
	this.convert_dimensions = function(x, y, width, height, sx, sy, swidth, sheight){
			//set up sx and sy
			if(typeof sx !== "number" || typeof sy !== "number"){
				sx = 0; sy = 0;}
			if(x < 0 && sx < -x){ sx = -x; x = 0;}
			if(y < 0 && sy < -y){ sy = -y; y = 0;}

			//set up swidth and sheight
			if(typeof swidth !== "number" || typeof sheight !== "number"){
				swidth = width; sheight = height;}
			//if the coord with the dimension together go beyond the frame
				//set the dimension to be the distance between the coord and the frame's edge
			if( (x + width) > that.width){ 
				swidth = that.width - x;}
			if( (y + height) > that.height){ 
				sheight = that.height - y;}

		//convert the coordinates into that of the parent's
		x = x + that.coords.x;
		y = y + that.coords.y;
		
		var parent_is_canvas = that.parent_frame instanceof HTMLCanvasElement;
		var drawable = swidth > 0 && sheight > 0 && sx < swidth && sy < sheight;
	
		if(!parent_is_canvas && drawable){
			return that.parent_frame.convert_dimensions(x, y, width, height, sx, sy, swidth, sheight);}	
				
	return {x:x, y:y, width:width, height:height, sx:sx, sy:sy, swidth:swidth, sheight:sheight};
	}
}
