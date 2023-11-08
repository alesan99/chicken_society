class Button {
    constructor(label, action, x, y, w, h) { //in px, label is text on button, action is function to call when clicked  
        this.label = label;
        this.action = action;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.hover = false;
        this.holding = false;
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
    }

    click(){
        console.log("click");
        console.log(this.action);
        if (this.hover) {//this should only click if you're hovering over the button
            this.holding = true
        }
    }
    clickRelease(){
        if (this.holding == true){
            this.holding = false;
            this.action();
        }
    }



    draw(){
        if (this.holding == true){
            DRAW.setColor(20,0,0,1); //dark
        } else if (this.hover == true){
            DRAW.setColor(255,0,0,1); //medium
        } else {
            DRAW.setColor(255,100,100,1); //light
        }
        
        DRAW.rectangle(this.x, this.y, this.w, this.h);

    }
}

//need to add states
//need callbacks, click, clickRelease