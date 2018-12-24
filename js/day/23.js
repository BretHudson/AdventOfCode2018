importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let regex = /pos=<(-?\d+),(-?\d+),(-?\d+)>, r=(\d+)/;
	let strongest = { r: -1 };
	let minX, minY, minZ;
	minX = minY = minZ = Number.MAX_SAFE_INTEGER;
	let maxX, maxY, maxZ;
	maxX = maxY = maxZ = Number.MIN_SAFE_INTEGER;
	
	let nanobots = input.split('\n').map(line => {
		let [ , X, Y, Z, r ] = regex.exec(line);
		let bot = {
			X: +X, Y: +Y, Z: +Z, r: +r,
			overlaps: 0
		};
		
		minX = Math.min(minX, +X);
		minY = Math.min(minY, +Y);
		minZ = Math.min(minZ, +Z);
		
		maxX = Math.max(maxX, +X);
		maxY = Math.max(maxY, +Y);
		maxZ = Math.max(maxZ, +Z);
		
		if (bot.r > strongest.r) strongest = bot;
		return bot;
	});
	
	for (let bot of nanobots) {
		for (let test of nanobots) {
			let dist = Math.abs(bot.X - test.X) + Math.abs(bot.Y - test.Y) + Math.abs(bot.Z - test.Z);
			if (dist <= bot.r)
				++bot.overlaps;
		}
	}
	
	let gridSize = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
	let bestGrid = null;
	while (gridSize > 0) {
		let maxCount = 0;
		
		for (let x = minX; x <= maxX; x += gridSize) {
			for (let y = minY; y <= maxY; y += gridSize) {
				for (let z = minZ; z <= maxZ; z += gridSize) {
					let count = 0;
					for (let bot of nanobots) {
						let size = -bot.r + Math.abs(x - bot.X) + Math.abs(y - bot.Y) + Math.abs(z - bot.Z);
						if (gridSize > size)
							++count;
					}
					
					if (maxCount > count)
						continue;
					
					maxCount = count;
					bestGrid = [ x, y, z ];
				}
			}
		}
		
		minX = bestGrid[0] - gridSize;
		minY = bestGrid[1] - gridSize;
		minZ = bestGrid[2] - gridSize;
		
		maxX = bestGrid[0] + gridSize;
		maxY = bestGrid[1] + gridSize;
		maxZ = bestGrid[2] + gridSize;
		
		gridSize = gridSize >> 1;
	}
	
	result[0] = strongest.overlaps;
	result[1] = bestGrid.reduce((acc, val) => acc + Math.abs(val), 0);
	
	callback(result);
});