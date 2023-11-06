class Button {
    constructor(label, action, x, y, w, h) { //in px
        this.label = label;
        this.action = action;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.hover = false;
    }

    checkMouseInside(){
        let [mouseX, mouseY] = getMousePos(); //returns x and y pos of mouse
        if (mouseX > this.x && mouseX < this.x + this.w && mouseY > this.y && mouseY < this.y + this.h) {
            return true;
        }
        return false;
    }
    update(){
        this.hover = this.checkMouseInside();
    }

    click(){
        if (this.hover) {//this should only click if you're hovering over the button
            this.action();
        }
    }

    draw(){
        DRAW.setColor(255,0,0,1); //transparent red
        DRAW.rectangle(this.x, this.y, this.w, this.h);
    }
}