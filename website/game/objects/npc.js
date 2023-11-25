//NPC object, controls the position of another object along with interactable dialouge

class NPC {
	//Initialize: object, roam? radius in pixels of area to walk around, interactable range, clickable region, shop menu?
	constructor (obj, dialogue, facing="down", roamRadius=false, range=50, clickRegion=[-40,-100,80,120], shop) {
		this.obj = obj
		obj.controller = this
        obj.npc = true

        // Adjust object
        this.obj.dir = facing
        if (facing == "left") {
            this.obj.flip = -1
        }

        // Walk around
        this.originX = this.obj.x
        this.originY = this.obj.y
		this.roamRadius = roamRadius
        this.waitTime = 2
        this.walkTime = 1
        this.walkTimer = this.walkTime
        this.dir = [1, 0] // Walking direction vector

        // Behavior
        this.shop = shop // Open up shopping menu to prompt player to buy stuff

        // Dialogue Trigger
        this.dialogue = dialogue || [""]
        let func = () => {
            // Speak when clicked or near
            this.speak()
            // Open shop if specified
            if (this.shop) {
                openMenu("shop", this.shop)
            }
        }
        let rangeShape = range // Where does player have to stand to interact?
        if (!Array.isArray(range)) {
            rangeShape = [-range,-range, range,-range, range,range, -range,range]
        }
        this.trigger = WORLD.spawnObject("Trigger", new Trigger(PHYSICSWORLD, this.obj.x, this.obj.y-this.obj.shape.h/2, func, rangeShape, {frame:0,x:0,y:-120}, clickRegion))
	}

	// Update
	update(dt) {
		let char = this.obj

		// walk around
        if (this.roamRadius) {
            // Only walk if they aren't talking
            if (!char.bubbleTime) {
                let distanceFromOrigin = Math.sqrt((char.x - this.originX)**2 + (char.y - this.originY)**2)

                this.walkTimer += dt
                if (this.walkTimer > this.walkTime+this.waitTime) {
                    // Start over
                    // Pick random waiting time and walking time
                    this.waitTime = Math.random()*5 + 3
                    this.walkTime = Math.random()*0.4 + 0.2

                    this.walkTimer = 0
                } else if (this.walkTimer > this.walkTime) {
                    // Wait
                    let angle = (Math.PI/2)*Math.floor(Math.random()*4)
                    this.dir[0] = Math.cos(angle)
                    this.dir[1] = Math.sin(angle)
                    
                    let nextDistanceFromOrigin = Math.sqrt((char.x+this.dir[0] - this.originX)**2 + (char.y+this.dir[1] - this.originY)**2)
                    // Go turn around if currently outside of roam radius
                    if (distanceFromOrigin > this.roamRadius && nextDistanceFromOrigin > distanceFromOrigin) {
                        this.dir[0] = -this.dir[0]
                        this.dir[1] = -this.dir[1]
                    }

                    char.move(0, 0)
                } else {
                    // Walk
                    let [dx, dy] = [this.dir[0], this.dir[1]]
                    char.move(dx, dy)
                }
            } else {
                char.move(0, 0)
            }
        }

        // Stick trigger to NPC
        this.trigger.setPosition(char.x, char.y-char.shape.h/2)
        // Reset trigger if activated
        if (char.bubbleText == false && this.trigger.activated) {
            this.trigger.reset()
        }
	}

    speak() {
        let i = Math.floor(Math.random() * this.dialogue.length)
        this.obj.chatBubble(this.dialogue[i])
    }
}