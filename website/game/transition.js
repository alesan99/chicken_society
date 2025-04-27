// Transitions; Cover the entire screen with an animation, when the animation ends it calls a given function

import { canvasWidth, canvasHeight, Draw } from "./engine/canvas.js";

const Transition = (function() {

	let transitioning = false;
	let currentTransition = "";

	let endFunc = false;

	let timer = 0;
	let length = 1;
	let direction = "out";
	let properties = false;

	const transitionFunctions = {
	// Update Animation timing
		update(dt) {
			if (transitioning) {
				timer += dt;

				if (timer >= length) {
					transitioning = false;
					if (endFunc) {
						endFunc();
					}
				}
			}
		},

		// Render Animation
		draw() {
			if (transitioning) {
				let t = 1-(timer/length); // Animation position
				if (direction == "out") {
					t = 1-t;
				}
				let t2 = t;

				// Choose an animation
				switch (currentTransition) {
				// Loading Screen; just a black screen
				case "loading":
					Draw.setColor(0, 0, 0, 1.0);
					Draw.rectangle(0, 0, canvasWidth, canvasHeight, "fill");
					break;
				// Fade; Slowly Fades
				case "fade":
					t2 = easing("easeOutCubic", t);
					Draw.setColor(0, 0, 0, t2);
					Draw.rectangle(0, 0, canvasWidth, canvasHeight, "fill");
					break;
				// Wipe; Screen Wipe
				case "wipeRight":
					t2 = easing("easeInQuad", t);
					if (direction == "in") {
						t2 = easing("easeOutQuad", t);
					}
					Draw.setColor(0, 0, 0, 1.0);
					Draw.rectangle(0, 0, canvasWidth*t2, canvasHeight, "fill");
					break;
				case "wipeLeft":
					t2 = 1-easing("easeInQuad", t);
					if (direction == "in") {
						t2 = 1-easing("easeOutQuad", t);
					}
					Draw.setColor(0, 0, 0, 1.0);
					Draw.rectangle(canvasWidth*t2, 0, canvasWidth-canvasWidth*t2, canvasHeight, "fill");
					break;
				// Iris; Black circle closes  around a point
				case "iris":
					t2 = easing("easeOutCubic", t);
					Draw.setColor(0, 0, 0, 1);
					//Draw.rectangle(0, 0, 1024, 580, "fill")

					Draw.setLineWidth(t2*canvasWidth*2);
					Draw.circle(properties[0], properties[1], canvasWidth, "line");
					break;
				}
			}
		},
	
		// Start Transitioning; (Name of transition animation, "in" or "out", animation length, properties, function to call when done)
		start(transitionName, inOut, animLength, props, func) {
			currentTransition = transitionName; // Which animation to use
			direction = inOut || "in"; // Is it transitioning in or out?
			length = animLength;	// Length in seconds
			properties = props; // Information for animation (Ex: iris needs to know where the circle should go)
			endFunc = func || false; // Optional: Function to call at end

			timer = 0;
			transitioning = true;
		},

		playing() {
			return transitioning;
		}
	};

	return transitionFunctions; })();

export default Transition;