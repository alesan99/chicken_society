import { Draw } from "../engine/canvas.js";
import { IMG, FONT } from "../assets.js";
import { getMousePos } from "../engine/input.js";

export class ToolTip {
	//Initialize: tooltip text, middle x pos, bottom y pos, object tooltop belongs to (to detect hovering)
	constructor(text="", x, y, object) {
		this.text = text;
		this.object = object;

		// display
		this.font = FONT.description;
		this.x = x;
		this.y = y - 2;
		Draw.setFont(this.font);
		this.w = Draw.getTextWidth(this.text, this.font);
		this.h = 20;
		this.visible = false;

		// hovering
		this.hoverTime = 0.6;
		this.hoverTimer = 0;

		this.oldmx = 0;
		this.oldmy = 0;
	}

	update(dt) {
		if (this.object != null) {
			let [mx, my] = getMousePos();
			if (this.object.checkMouseInside(mx, my) && (mx == this.oldmx || my == this.oldmy)) {
				this.hoverTimer += dt;
				if (this.hoverTimer >= this.hoverTime) {
					this.visible = true;
				}
			} else {
				this.hoverTimer = 0;
				this.visible = false;
			}

			this.oldmx = mx;
			this.oldmy = my;
		}
	}

	draw() {
		if (!this.visible) {
			return;
		}
		let w = this.w+6;
		Draw.setColor(255, 255, 255, 1.0);
		Draw.image(IMG.tooltip, null, this.x, this.y, 0, w/64, 1, 0.5, 1.0);
		// Draw.rectangle(this.x-w/2, this.y-h, w, h, "fill")
		Draw.setColor(60, 60, 60, 1.0);
		Draw.setFont(this.font);
		Draw.text(this.text, this.x, this.y-5, "center");
	}

	click() {
		this.hoverTimer = -0.5;
		this.visible = false;
	}
}