// Timed Events
// If the server announces a timed event, this will load the event files and inject them into game.
// For example:
// hub.json5 will be combined with the Christmas hub.json5. Anything with a shared name will be replaced by the Christmas version.

import { loadJSON5 } from "./assets.js"

const TimedEventsSystem = (function() {
	let activeTimedEvents = []
	
	const functions = {
		// Start new dialogue conversation
		setActiveTimedEvents(events) {
			// Events: list of event string names
			activeTimedEvents = events
		},

		injectTimedEvents(filename, data) {
			// Inject event JSON data into data
			return new Promise((resolve) => {
				// Load timed event data
				// And resolve promise once all jsons were loaded
				let queued = activeTimedEvents.length
				if (queued <= 0) { // Nothing in queue
					resolve(data)
				}
				for (let i = 0; i < activeTimedEvents.length; i++) {
					let timedEvent = activeTimedEvents[i]
					if (true) { // Does this timed event modify this area?
						loadJSON5(`assets/timedevents/${timedEvent}/${filename}.json5`, (timedEventData) => {
							// Start injecting data
							for (let key in timedEventData) {
								if (data[key] && typeof data[key] === "object") {
									// Merge objects
									for (let subKey in timedEventData[key]) {
										data[key][subKey] = timedEventData[key][subKey]
									}
								} else {
									// Replace data
									data[key] = timedEventData[key]
								}
							}
	
							// Resolve promise once all timed events are loaded
							queued--
							if (queued <= 0) {
								resolve(data)
							}
						},
						() => {
							// Error loading timed event
							queued--
							if (queued <= 0) {
								resolve(data)
							}
						})
					} else {
						queued--
						if (queued <= 0) {
							resolve(data)
						}
					}
				}
			})
		}
	};
	
return functions; })()

export default TimedEventsSystem;