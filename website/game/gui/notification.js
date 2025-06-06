// Notification
// A little popup that appears at the top of the screen

import { Draw } from "../engine/canvas.js";
import { FONT } from "../assets.js";

const Notify = (function() {
	let notifications = [];
	let notifHeight = 32;
	let notifTotalLines = 0;
	let notifY = 0;
	
	const notifyFunctions = {
		// Create new notification
		new(text, duration=3, color=[0,0,0]) {
			Draw.setFont(FONT.description);
			let wrappedText = Draw.wrapText(text, 300 - 6);
			notifications.push({
				text: wrappedText,
				lines: wrappedText.length,
				timer: duration, // Duration in seconds
				duration: duration,
				color: color
			});
			notifTotalLines += wrappedText.length;
		},

		// Check if notification should expire
		update(dt) {
			for (let i = 0; i < notifications.length; i++) {
				const notification = notifications[i];
				notification.timer -= dt;
				if (notification.timer <= 0) {
					notifTotalLines -= notification.lines;
					notifY -= notification.lines;
					notifications.splice(i, 1);
				}
			}

			if (notifY < notifTotalLines) {
				let speed = 8*Math.max(0.05, (notifTotalLines - notifY) / 2);
				notifY = Math.min(notifTotalLines, notifY + speed*dt);
			}
		},

		// Render all notifications
		draw() {
			if (notifications.length == 0) {
				return;
			}
			Draw.setFont(FONT.description);

			let x = 700;
			let y = 0;

			y = notifHeight*(notifY-notifTotalLines);

			// new notifications slide into view
			// if (notifications.length > 1) {
			// 	const notification = notifications[notifications.length-1];
			// 	let diff = (notification.duration-notification.timer)/0.5
			// 	if (diff < 1) {
			// 		y = -notifHeight*notification.lines*easing("easeInCubic", 1-diff)
			// 	}
			// }

			// draw all notifications newest -> oldest
			for (let i = notifications.length - 1; i >= 0; i--) {
				const notification = notifications[i];

				let a = 1.0; // alpha
				if (notification.timer < 1) {
					a = notification.timer;
				}

				// Border
				Draw.setColor(255,255,255,0.8*a);
				Draw.rectangle(x, y, 300, notifHeight*notification.lines, "fill");
				Draw.setLineWidth(1.5);
				Draw.setColor(0,0,0,1.0*a);
				Draw.rectangle(x, y, 300, notifHeight*notification.lines, "line");

				// Text
				Draw.setColor(notification.color[0],notification.color[1],notification.color[2],1.0*a);

				for (let line = 0; line < notification.lines; line++) {
					Draw.text(notification.text[line], x +3, y+line*30 + 25, "left");
				}
				y += notification.lines*notifHeight;
			}
		}
	};
	return notifyFunctions; })();

export default Notify;