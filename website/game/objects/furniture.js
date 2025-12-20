//Furniture

import { Draw } from "../engine/canvas.js";
import {HEXtoRGB, RGBtoHEX, removeNuggets, addNuggets, spendNuggets, addItem, removeItem, getItemCategory, getItemData, getItem} from "../savedata.js";
import Shape from "../shape.js";
import {PhysicsObject,Character,Player,NPC,Pet,Trigger,Wall,Warp,Particle} from "./objects.js";
import Coop from "../coop.js";

export default class Furniture extends PhysicsObject {
	//Initialize: list of points
	constructor (spatialHash, itemId, x=0, y=0, dir="down") {
		super(spatialHash,0,0);
		this.x = x;
		this.y = y;
		this.dir = dir;

		let item = getItemData(itemId);
		this.item = item;
		this.id = itemId;
		
		this.dir_lookup = {up: 2, down: 0, left: 1, right: 1};

		// Being placed? (moving)
		this.moving = false;
		
		// Collision
		// Can be a single shape: [x,y, x,y, x,y...]
		// OR 3 shapes for down, right, up [[x,y, x,y...], [x,y, x,y...], [x,y, x,y...]]
		this.setDir(dir);
		this.solid = true;
		if (this.item.solid === false) this.solid = false;

		// Graphics
		this.center = item.center;

		this.image = item.image;
		this.sprite = item.sprite;

		// How many objects are colliding with this
		this.colliding = 0;
		this.wallsColliding = 0;
		this.furnitureColliding = 0;
		this.tablesColliding = 0;
		this.tablesCollidingList = [];
		this.rugsColliding = 0;

		// Table? (for placing items on top)
		this.table = item.table;
		this.height = item.height || 0;

		this.rug = item.rug;

		// Where can it be placed?
		this.walls = item.walls;
		this.tabletops = item.tabletops;
		this.tabletopOffset = 0;

		this.active = true;
		this.static = true;
		this.setPosition(null,null);
	}

	update(dt) {
	}

	draw() {
		// Furniture itself
		let flip = 1;
		if (this.dir == "left") {
			flip = -1;
		}
		Draw.setColor(255,255,255,1.0);
		Draw.image(this.image, this.sprite.getFrame(0,this.dir_lookup[this.dir]), this.x, this.y-this.tabletopOffset, 0, flip, 1.0, this.center[this.dir_lookup[this.dir]][0]/this.sprite.w, this.center[this.dir_lookup[this.dir]][1]/this.sprite.h);

		// Draw footprint when moving
		if (this.moving) {
			Draw.push();
			Draw.translate(this.x, this.y);
			if (!Coop.getFurniturePlaceable(this.id)) {
				Draw.setColor(195,0,0,0.25);
			} else {
				Draw.setColor(10,50,195,0.25);
			}
			Draw.polygon(this.shape.v, "fill");
			Draw.pop();
		}
	}

	// Set direction furniture is facing
	setDir(dir="down") {
		this.dir = dir;
		let dir_lookup = {up: 2, down: 0, left: 1, right: 1};
		let flip = 1;
		if (this.dir == "left") {
			flip = -1;
		}
		
		if (Array.isArray(this.item.shape[0])) {
			// set Shape if there are multiple shapes for each direction
			let shape = this.item.shape[dir_lookup[dir]];
			if (dir == "left") {
				// flip "right" shape to get "left" shape
				// reverse order to preserve winding
				// x,y positions must be reversed in pairs, so we can't just use shape.reverse()
				let newShape = [];
				for (let i=shape.length-2; i>=0; i-=2) {
					newShape.push(-shape[i], shape[i+1]); // flip vertex x
				}
				shape = newShape;

			}
			this.setShape(new Shape(...shape));
		} else {
			// or just use single Shape
			this.shape = new Shape(...this.item.shape);
		}
	}

	// Update stacking of furniture
	updateStacking() {
		// only for tabletop items
		if (this.tabletops) {
			// Get tallest table, and make that the vertical offset of this tabletop item
			this.tabletopOffset = 0;
			for (const table of this.tablesCollidingList) {
				if (table.height > this.tabletopOffset) {
					this.tabletopOffset = table.height;
				}
			}
		}
	}

	// Collision
	collide(name, obj, nx, ny) {
		if (this.static) {
			if (name === "Character") {
				return this.solid;
			}
			return true;
		} else {
			return false; // Can collide, but don't move furniture (while placing)
		}
	}

	startCollide(name, obj) {
		this.colliding += 1;

		if (name == "Furniture") {
			this.furnitureColliding += 1;

			if (obj.rug) {
				this.rugsColliding += 1;
			}

			if (obj.table) {
				this.tablesColliding += 1;
				this.tablesCollidingList.push(obj);
			}

			// if (this.tabletops) {
			// 	this.tabletopOffset += obj.height
			// }
		}
		if (name == "Wall") {
			this.wallsColliding += 1;
		}
	}

	stopCollide(name, obj) {
		this.colliding -= 1;

		if (name == "Furniture") {
			this.furnitureColliding -= 1;

			if (obj.rug) {
				this.rugsColliding -= 1;
			}

			if (obj.table) {
				this.tablesColliding -= 1;
				// remove from list
				let index = this.tablesCollidingList.indexOf(obj);
				if (index > -1) {
					this.tablesCollidingList.splice(index, 1);
				}
			}

			// if (this.tabletops) {
			// 	this.tabletopOffset -= obj.height
			// }
		}
		if (name == "Wall") {
			this.wallsColliding -= 1;
		}
	}
}