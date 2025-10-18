//Load images, audio, and other data

import LoadingScreen from "./loading.js";
import AudioSystem from "./engine/audio.js";
import { RenderImage, RenderFont } from "./engine/render.js";
import { Sprite } from "./engine/sprite.js";

var IMG = [];
var SPRITE = [];
var ANIM = [];
var FONT = [];
var MUSIC = [];
var SFX = [];

var ITEMS;
var HEADOFFSET;
var FACEOFFSET;
var BODYOFFSET;
var ITEMOFFSET;
var CHICKENROTATION;

var BACKGROUND = [];
var BACKGROUNDIMG = [];
var BACKGROUNDSPRITE = [];
var BACKGROUNDANIM = [];

var MAPLOCATIONS;

//DIRECTORYTREE = {}

function loadGameAssets() {
	// Loading Screen
	IMG.loading = new RenderImage("assets/loading.png");
	SPRITE.loading = new Sprite(IMG.loading, 2,1, 88,128, 0,0, 0,0);

	// World objects
	// Chicken
	IMG.chicken = new RenderImage("assets/chicken.png");
	IMG.chicken.makeColorable();
	SPRITE.chicken = new Sprite(IMG.chicken, 8, 6, 128,128, 0,0, 1,1);
	ANIM.stand = [[0]]; // Animations format. [[Frame 1, Frame 2...], [Delay 1, Delay 2...]]
	ANIM.walk = [[1, 2], 0.2];
	ANIM.dance = [[1, 2, 5, 4, 6, 7, 6, 7], 0.3];
	ANIM.sit = [[3], 99999];
	ANIM.wave = [[4,5,4,5,4,5], 0.2];
	ANIM.tbag = [[0,3,0,3,0,3,0,3,0,3], 0.15];
	IMG.burghert = new RenderImage("assets/burghert.png");
	IMG.burghert.makeColorable();

	IMG.shadow = new RenderImage("assets/shadow.png");
	IMG.moveCursor = new RenderImage("assets/move_cursor.png");
	IMG.speechBubble = new RenderImage("assets/chat_bubble.png");
	IMG.replyBubble = new RenderImage("assets/reply_bubble.png");
	SPRITE.replyBubble = new Sprite(IMG.replyBubble, 2,1, 64,32);
	SPRITE.replyTrail = new Sprite(IMG.replyBubble, 2,1, 64,32, 0,32);
	IMG.dialogue = new RenderImage("assets/dialogue.png");
	SPRITE.dialogueBox = new Sprite(IMG.dialogue, 1,1, 550,160, 130,0);
	SPRITE.dialogueIcon = new Sprite(IMG.dialogue, 1,1, 130,160, 0,0);
	IMG.speakerIcon = new RenderImage("assets/speaker_icon.png");
	IMG.book = new RenderImage("assets/book.png");
	IMG.action = new RenderImage("assets/action.png");
	SPRITE.action = new Sprite(IMG.action, 1,3, 120,50);
	IMG.particle = new RenderImage("assets/particle.png");
	SPRITE.gunshot = new Sprite(IMG.particle, 2,1, 64,64, 0,0, 1,1);
	SPRITE.dust = new Sprite(IMG.particle, 2,1, 64,64, 0,65, 1,1);

	MUSIC.seeddispensary = AudioSystem.newMusic("assets/music/seeddispensarytrack.mp3");
	MUSIC.chickendisco = AudioSystem.newMusic("assets/music/chickendisco.mp3");
	MUSIC.chictoriassecret = AudioSystem.newMusic("assets/music/chicktoriasecret.mp3");
	MUSIC.welcometothesociety = AudioSystem.newMusic("assets/music/welcometothesociety.mp3");
	MUSIC.wttspetstupidremix = AudioSystem.newMusic("assets/music/wttspetstupidremix.mp3");
	MUSIC.alleywaytrack = AudioSystem.newMusic("assets/music/alleywaytrack.mp3");
	MUSIC.genericoutdoors = AudioSystem.newMusic("assets/music/genericoutdoors.mp3");
	MUSIC.markettrack = AudioSystem.newMusic("assets/music/rivermarkettrack.mp3");
	MUSIC.crossroadstrack = AudioSystem.newMusic("assets/music/crossroadstrack.mp3");
	MUSIC.pldistrictsong = AudioSystem.newMusic("assets/music/pldistrictsong.mp3");
	MUSIC.thefunnychicken = AudioSystem.newMusic("assets/music/thefunnychicken.mp3");
	MUSIC.oldtownsong = AudioSystem.newMusic("assets/music/oldtownsong.mp3");
	MUSIC.nonegglideansong = AudioSystem.newMusic("assets/music/Project_40.mp3");
	MUSIC.peppinellossong = AudioSystem.newMusic("assets/music/Project_67.mp3");
	MUSIC.mafiahideoutsong = AudioSystem.newMusic("assets/music/mafia_hideout.mp3");

	SFX.door = AudioSystem.newSound("assets/sfx/door.ogg");
	SFX.woosh = AudioSystem.newSound("assets/sfx/woosh.ogg");
	SFX.gun = AudioSystem.newSound("assets/sfx/gun.ogg");
	SFX.cluck = [];
	for (let i=1; i<=6; i++) {
		SFX.cluck.push(AudioSystem.newSound(`assets/sfx/chickenSoc_cluck_${i}.ogg`));
	}

	// CHAT MENU & HUD
	IMG.nugget = new RenderImage("assets/nugget.png");
	IMG.ammo = new RenderImage("assets/hud/ammo.png");
	IMG.chat = new RenderImage("assets/hud/chat.png");
	IMG.chatMessage = new RenderImage("assets/chat_message.png");
	SPRITE.chat = new Sprite(IMG.chat, 1,1, 693,51);
	SPRITE.chatButton = new Sprite(IMG.chat, 3,7, 36,36, 0,51);
	SPRITE.notif = new Sprite(IMG.chat, 2,1, 18,18, 108,51);
	IMG.emoteMenu = new RenderImage("assets/gui/emote.png");
	SPRITE.emoteButton = new Sprite(IMG.emoteMenu, 3,7, 36,36, 0,110);
	IMG.tooltip = new RenderImage("assets/gui/tooltip.png");

	// MENUS
	IMG.menu = new RenderImage("assets/gui/menu.png");
	IMG.popup = new RenderImage("assets/gui/popup.png");
	IMG.items = new RenderImage("assets/gui/items.png");
	SPRITE.items = new Sprite(IMG.items, 6,1, 30,30, 0,0, 1,1);
	IMG.map = new RenderImage("assets/gui/map.png");
	SPRITE.map = new Sprite(IMG.map, 1,1, 512,304);
	SPRITE.mapIcons = new Sprite(IMG.map, 3,1, 36,36, 0,304, 1,1);
	IMG.colorSlider = new RenderImage("assets/gui/color.png");
	SPRITE.colorSlider = new Sprite(IMG.color, 1,4, 140,12);

	// Map
	MAPLOCATIONS = {
		hub: [307, 158],
		oldtown: [231, 171],
		neighborhood: [164, 194],
		pathway: [161, 151],
		racetrack: [234, 132],
		market: [226, 99],
		pl_district: [300, 107],
	};

	// Chicken Customization
	HEADOFFSET = [ // Center of chicken head where hat should be placed
		[[64,1],[64,1],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]], // Front frames
		[[89,3],[89,3],[86,10],[66,9],[64,2],[64,2],[4,62],[64,1]], // Right frames
		[[63,2],[63,2],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]] // Back frames
	];
	FACEOFFSET = [ // Center of chicken face where glasses should be placed
		[[64,1],[64,1],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]], // Front frames
		[[89,3],[89,3],[86,10],[66,9],[64,2],[64,2],[4,62],[64,1]], // Right frames
		[[63,2],[63,2],[66,2] ,[66,9],[64,2],[64,2],[4,62],[64,1]] // Back frames
	];
	BODYOFFSET = [ // Center of chicken chin where accessory should be placed
		[[64,55],[64,55],[66,56],[66,63],[64,55],[64,55],[59,62],[64,55]], // Front frames
		[[89,49],[89,49],[86,52],[66,63],[64,55],[64,55],[59,62],[64,55]], // Right frames
		[[63,56],[63,56],[68,57],[66,63],[64,55],[64,55],[59,62],[64,55]] // Back frames
	];
	ITEMOFFSET = [ // Center of chicken left wing where item should be held
		[[33,75],[33,75],[38,76],[36,83],[34,75],[34,75],[29,82],[34,75]], // Front frames
		[[89,69],[89,69],[86,78],[66,83],[64,75],[64,75],[59,82],[64,75]], // Right frames
		[[94,76],[94,76],[96,77],[96,83],[94,75],[94,75],[89,82],[94,75]] // Back frames
	];
	CHICKENROTATION = [ // Rotation of chicken hat & accessory for each frame
		0,0,0,0,0,0,-Math.PI*0.5,0
	];

	// Load all items
	IMG.placeholder = IMG.shadow;
	SPRITE.placeholder = new Sprite(IMG.shadow);

	ITEMS = {
		// Categories
		head: {},
		face: {},
		body: {},
		item: {},

		furniture: {},
		pet: {}
	};
	// List of all items to load
	loadJSON("assets/items/list.json", (data) => {
		for (const [category, list] of Object.entries(data)) {
			for (const itemId of list) {
				ITEMS[category][itemId] = {};
			}
		}

		for (const [category, list] of Object.entries(ITEMS)) {
			for (const [itemId, item] of Object.entries(list)) {
				loadItem(category, itemId);
			}
		}
	});

	FONT.pixel = new RenderFont("Pixel", 16);
	FONT.big = new RenderFont("Arial", 40);
	FONT.hud = new RenderFont("Arial", 28);
	FONT.caption = new RenderFont("Arial", 20);
	FONT.nametag = new RenderFont("Verdana", 16);
	FONT.description = new RenderFont("Arial", 18);
	FONT.speechBubble = new RenderFont("Arial", 17);
	FONT.guiLabel = new RenderFont("Verdana", 18);
}

function loadItem(category, itemId) {
	// Load image, create sprite frames when image is loaded, and load hat centers from JSON
	let item = ITEMS[category][itemId];
	item.name = "";
	item.description = "";
	item.cost = 0;
	item.defaultCenter = true;
	item.center = [[0,0],[0,0],[0,0]];
	item.sprite = SPRITE.placeholder;
	loadJSON(`assets/items/${category}/${itemId}.json`, (data) => {
		// Get item properties
		// General
		item.name = data.name;
		item.description = data.description;
		item.cost = data.cost;

		// Consumables
		item.consumable = data.consumable; // Can item only be used once?
		item.statusEffect = data.statusEffect;
		item.statusEffectChance = data.statusEffectChance;
		item.statusEffectDuration = data.statusEffectDuration;

		// Pets
		item.food = data.food;
		item.disease = data.disease;
		if (data.center) { // Center of frames
			item.center = data.center;
			item.defaultCenter = false;
		}

		// Utility
		item.dialogue = data.dialogue;

		// Furniture
		item.shape = data.shape;
		item.rug = data.rug;
		item.table = data.table;
		item.height = data.height;
		item.walls = data.walls;
		item.tabletops = data.tabletops;

		item.coopTheme = data.coopTheme;
	});
	let callback = function() {
		if (category == "pet") {
			// Pet with animations and emotions
			item.sprite = new Sprite(item.image, 4, 2, (item.image.w-3)/4,(item.image.h-1)/2, 0,0, 1,1);
		} else {
			// Clothing / equipables
			item.sprite = new Sprite(item.image, 1, 3, item.image.w,(item.image.h-2)/3, 0,0, 1,1);
		
			// Update default center to the center of the loaded image
			if (item.defaultCenter) {
				let [w, h] = [item.image.w/2, ((item.image.h-2)/3) /2];
				item.center = [[w, h],[w, h],[w, h]];
			}
		}
	};
	item.image = new RenderImage(`assets/items/${category}/${itemId}.png`, callback);
}

// Load array with JSON data; filePath, callBack function called after file is finished loading
function loadJSON(filePath, callBack, errorCallBack) {
	// JSON file must be loaded asynchronously
	let loadingObject = {loaded: false};
	LoadingScreen.wait(loadingObject);
	fetch(filePath).then(response => {
		if (!response.ok) {
			console.log("JSON Network response was not ok");
		}
		return response.json();
	})
		.then(data => {
			callBack(data);
			loadingObject.loaded = true;
		})
		.catch(error => {
			console.log("There was a problem loading the JSON file:", error);
			if (errorCallBack) { errorCallBack(); }
			loadingObject.loaded = true;
		});
}

// Same as above, but for the more human-maintainable JSON5 format
// https://json5.org/
function loadJSON5(filePath, callBack, errorCallBack) {
	// JSON file must be loaded asynchronously
	let loadingObject = {loaded: false};
	LoadingScreen.wait(loadingObject);
	fetch(filePath).then(response => {
		if (!response.ok) {
			console.log("JSON file could not be fetched: ", filePath);
			if (errorCallBack) { errorCallBack(); }
			return false;
		}
		return response.text().then(text => {
			// eslint-disable-next-line no-undef
			return JSON5.parse(text);
		});
	})
		.then(data => {
			callBack(data);
			loadingObject.loaded = true;
		})
		.catch(error => {
			console.log("There was a problem loading the JSON file:", error);
			if (errorCallBack) { errorCallBack(); }
			loadingObject.loaded = true;
		});
}

// DIRECTORYTREE = fetch('/getDirectoryTree')
// 	.then(response => {
// 		if (!response.ok) { throw new Error('Failed to fetch directory tree'); };
// 		return response.json()
// 	})
// 	.then(data => {
// 		DIRECTORYTREE = data
// 	})
// 	.catch(error => { console.error(error) });
// console.log(DIRECTORYTREE)

export { IMG, SPRITE, ANIM, FONT, MUSIC, SFX, loadGameAssets, loadJSON, loadJSON5, ITEMS, HEADOFFSET, FACEOFFSET, BODYOFFSET, ITEMOFFSET, CHICKENROTATION, BACKGROUND, BACKGROUNDIMG, BACKGROUNDSPRITE, BACKGROUNDANIM, MAPLOCATIONS };