// Notification
// A little popup that appears at the top of the screen

const Notify = (function() {
	let notifications = [];
	let notifHeight = 32;
	let notifTotalLines = 0;
	let notifY = 0;
	
	const notifyFunctions = {
		// Create new notification
		new: function(text, duration=3, color=[0,0,0]) {
			DRAW.setFont(FONT.description)
			let wrappedText = DRAW.wrapText(text, 300 - 6)
			notifications.push({
				text: wrappedText,
				lines: wrappedText.length,
				timer: duration, // Duration in seconds
				duration: duration,
				color: color
			})
			notifTotalLines += wrappedText.length
		},

		// Check if notification should expire
		update: function(dt) {
			for (let i = 0; i < notifications.length; i++) {
				const notification = notifications[i];
				notification.timer -= dt
				if (notification.timer <= 0) {
					notifTotalLines -= notification.lines
					notifY -= notification.lines
					notifications.splice(i, 1)
				}
			}

			if (notifY < notifTotalLines) {
				let speed = 8*Math.max(0.05, (notifTotalLines - notifY) / 2);
				notifY = Math.min(notifTotalLines, notifY + speed*dt)
			}
		},

		// Render all notifications
		draw: function() {
			if (notifications.length == 0) {
				return
			}
			DRAW.setFont(FONT.description)

			let x = 700
			let y = 0

			y = notifHeight*(notifY-notifTotalLines)

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

				let a = 1.0 // alpha
				if (notification.timer < 1) {
					a = notification.timer
				}

				// Border
				DRAW.setColor(255,255,255,0.8*a)
				DRAW.rectangle(x, y, 300, notifHeight*notification.lines, "fill")
				DRAW.setLineWidth(1.5)
				DRAW.setColor(0,0,0,1.0*a)
				DRAW.rectangle(x, y, 300, notifHeight*notification.lines, "line")

				// Text
				DRAW.setColor(notification.color[0],notification.color[1],notification.color[2],1.0*a)

				for (line = 0; line < notification.lines; line++) {
					DRAW.text(notification.text[line], x +3, y+line*30 + 25, "left")
				}
				y += notification.lines*notifHeight
			}
		}
	}
	return notifyFunctions; })()