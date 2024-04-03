// Audio system
// Controls music playback

// Asset loading

const AudioSystem = (function() {
	let currentMusic = false

	let sounds = []
	let music = []
	
	const audioFunctions = {
		newMusic: function(path) {
			// These need to be streamed
			return new Howl({
				src: [path],
				loop: true,
				html5: true
			});
		},

		newSound: function(path) {
			// These can be loaded in memory
			return new Howl({
				src: [path]
			});
		},

		update: function(dt) {
			// Fade music here
		},

		playMusic: function(src) {
			this.stopMusic();
			src.volume(1.0); // Reset if it was faded (i wish i were faded)
			src.play();
			currentMusic = src;
		},

		stopMusic: function() {
			if (currentMusic) {
				currentMusic.stop();
				currentMusic = false;
			}
		},

		playSound: function(src) {
			src.play();
		},

		stopSound: function(src) {
			src.stop();
		},

		fadeOutMusic: function(time=1) {
			if (currentMusic) {
				currentMusic.fade(1.0, 0.0, 500);
			}
		},

		stopAudio: function() {
			this.stopMusic();
			// TODO: Stop all sound effects
		},

		setVolume: function(vol) {
			Howler.volume(vol)
		}
	};
	
	return audioFunctions; })()