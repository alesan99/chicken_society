// Transitions; Cover the entire screen with an animation, when the animation ends it calls a given function

const Transition = (function() {

let transitioning = false
let currentTransition = ""

let endFunc = false

let timer = 0
let length = 1
let direction = "out"
let properties = false

const transitionFunctions = {
	// Update Animation timing
	update: function(dt) {
		if (transitioning) {
			timer += dt

			if (timer >= length) {
				transitioning = false
				if (endFunc) {
					endFunc()
				}
			}
		}
	},

	// Render Animation
	draw: function() {
		if (transitioning) {
			let t = 1-(timer/length) // Animation position
			if (direction == "out") {
				t = 1-t
			}
			let t2 = t

			// Choose an animation
			switch (currentTransition) {
				case "fade":
					t2 = easing("easeOutCubic", t)
					DRAW.setColor(0, 0, 0, t2)
					DRAW.rectangle(0, 0, 1024, 580, "fill")
					break
				case "iris":
					t2 = easing("easeOutCubic", t)
					console.log(currentTransition)
					DRAW.setColor(0, 0, 0, 1)
					//DRAW.rectangle(0, 0, 1024, 580, "fill")

					DRAW.setLineWidth(t2*2058)
					DRAW.circle(properties[0], properties[1], 1024, "line")
					break
			}
		}
	},
	
	// Start Transitioning; (Name of transition animation, "in" or "out", animation length, properties, function to call when done)
	start: function(transitionName, inOut, animLength, props, func) {
		currentTransition = transitionName // Which animation to use
		direction = inOut || "in" // Is it transitioning in or out?
		length = animLength	// Length in seconds
		properties = props // Information for animation (Ex: iris needs to know where the circle should go)
		endFunc = func || false // Optional: Function to call at end

		timer = 0
		transitioning = true
	},

	playing: function() {
		return transitioning
	}
};

return transitionFunctions; })()