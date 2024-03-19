// TODO: Move player furniture code here
// TODO: Visit other player's coops
// TODO: Wallpapers

const Coop = (function() {
    let activeFurniture = false; 

	const functions = {
		initialize() {

        },

        load(coopFurniture) {
            // Create objects for all saved furniture
            for (let i = 0; i < coopFurniture.length; i++) {
                let data = coopFurniture[i]
                let itemId = data.id

                WORLD.spawnObject("Furniture", new Furniture(PHYSICSWORLD, itemId, data.x, data.y, data.dir))
            }
        },

        update(dt) {

        },

        draw() {

        },

        edit(itemName) {

        },

        placeFurniture(x, y) {

        },

        removeFurniture(x, y) {

        }
    };
	
 return functions; })()