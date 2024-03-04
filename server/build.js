// Build anything that is needed before the game is run.
const fs = require("fs");
const path = require("path");

function buildGame() {
	// Websites cannot look at their directory tree
	// So to load items dynamically, it needs to be told which items are in the folder
	generateItemFileList();
}

function generateItemFileList() {
	// Get directory free of the items folder
	getDirectoryTree(path.join(__dirname, "../website/assets/items"))
		.then((tree) => {
			// Re structure least to be easier to use
			const itemList = {};
			for (let v of tree.items) {
				if (typeof v === "object") {
					let category
					for (let key in v) {
						category = key;
					}
					let list = [];
					for (let item of v[category]) {
						let itemName = item.split(".")[0];
						// console.log(itemName);
						if (!list.includes(itemName)) {
							list.push(itemName);
						}
					}
					itemList[category] = list;
				}
			}
			fs.writeFileSync(path.join(__dirname, "../website/assets/items/list.json"), JSON.stringify(itemList, null, 2));
		})
		.catch((error) => {
			console.log("Error", error)
		});;
}

// Function to read a directory and build a tree
function getDirectoryTree(dPath) {
	const directoryPath = dPath;
	
	return new Promise((resolve, reject) => {
		fs.readdir(directoryPath, async (err, files) => {
			try {
				if (err) {
					reject(err);
				} else {
					const files = await fs.promises.readdir(directoryPath);

				const tree = {
					[path.basename(directoryPath)]: [],
				};

				const childPromises = files.map(async (file) => {
					const filePath = path.join(directoryPath, file);
					const stats = await fs.promises.stat(filePath);

					if (stats.isDirectory()) {
						// If its a directory, recursively call this function
						const subTree = await getDirectoryTree(filePath);
						tree[path.basename(directoryPath)].push(subTree);
					} else {
						tree[path.basename(directoryPath)].push(file);
					}
				});

				// Wait for all child promises to resolve
				await Promise.all(childPromises);
			
				resolve(tree);
			};
		} catch (err) {
			reject(err);
		}
		});
	});
}

module.exports = {
	buildGame
};