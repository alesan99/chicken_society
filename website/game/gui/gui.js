class Button {
    constructor(label, action, graphic, x, y, w, h) { //in px, label is text on button, action is function to call when clicked  
        this.visible = true;
        this.label = label;
        if (graphic) {
            // If specified, render image for button with frames
            if (graphic.image) {
                this.image = graphic.image;
                this.frames = graphic.frames;
            }
            if (graphic.icon) {
                this.icon = graphic.icon;
                this.iconFrame = graphic.iconFrame;
            }
            if (graphic.visible != null) {
                this.visible = graphic.visible;
            }
        }
        this.action = action;

        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;

        this.hover = false;
        this.holding = false;
        this.selected = false;
    }

    checkMouseInside(){
        let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
        if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
            return true;
        }
        return false;
    }
    update(dt){
        this.hover = this.checkMouseInside();
        if (this.hover) {
            CURSOR.on = true;
        }
    }

    click(){
        this.hover = this.checkMouseInside();
        if (this.hover) {//this should only click if you're hovering over the button
            this.holding = true
            return true
        }
    }
    clickRelease(){
        if (this.holding == true){
            this.holding = false;
            this.action();
        }
    }

    draw(){
        if (!this.visible) {
            // Don't render if button was specified to be not visible
            return false
        }

        if (this.image) {
            // Render image for button
            let frame = 0
            if (this.holding == true){
                frame = 2
            } else if (this.hover == true){
                frame = 1
            }
            DRAW.setColor(255,255,255,1)
            DRAW.image(this.image,this.frames[frame], this.x+this.w/2, this.y+this.h/2, 0, 1,1, 0.5,0.5)
        } else {
            // Render button with basic rectangles if no image was provided
            if (this.holding == true){
                DRAW.setColor(216,175,121,1); //dark
            } else if (this.hover == true){
                DRAW.setColor(248,222,187,1); //medium
            } else if (this.selected == true){
                DRAW.setColor(216,175,121,1); //dark
            } else {
                DRAW.setColor(242,199,140,1); //light
            }
            
            DRAW.rectangle(this.x, this.y, this.w, this.h);
            DRAW.setColor(168, 85, 38, 1)
            DRAW.setLineWidth(2)
            DRAW.rectangle(this.x, this.y, this.w, this.h, "line");
        }

        if (this.icon) {
            // Icon
            DRAW.setColor(255,255,255,1)
            DRAW.image(this.icon,this.iconFrame, this.x+this.w/2, this.y+this.h/2, 0, 1,1, 0.5,0.5)
        } else if (this.label) {
            // Label
            DRAW.setFont(FONT.guiLabel)
            DRAW.setColor(112, 50, 16,1)
            DRAW.text(this.label, this.x+this.w/2, this.y+this.h/2+7, "center")
        }
    }
}

//need to add states
//need callbacks, click, clickRelease