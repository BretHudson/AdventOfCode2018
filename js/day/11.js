importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	const serial = +input;
	
	const findPowerLevel = (x, y) => Math.floor((((((x + 1) + 10) * (y + 1)) + serial) * ((x + 1) + 10) % 1000) / 100) - 5;
	const convertToIndex = (x, y) => y * 300 + x;
	const itemToCoord = (item, size = false) => (size) ? `${item.x},${item.y},${size}` : `${item.x},${item.y}`;
	
	const findSumOfSquare = (x, y, size) => {
		let sum = 0;
		for (let yy = y; yy < y + size; ++yy) {
			for (let xx = x; xx < x + size; ++xx) {
				sum += grid[yy * 300 + xx].val;
			}
		}
		return sum;
	};
	
	const findHighestSumAtSize = (size) => {
		let lastSum = Number.MIN_SAFE_INTEGER;
		let result = {
			size: size,
			largest: null,
			totalSum: Number.MIN_SAFE_INTEGER
		};
		for (let y = 0; y <= 300 - size; ++y) {
			for (let x = 0; x <= 300 - size; ++x) {
				result.totalSum = Math.max(result.totalSum, findSumOfSquare(x, y, size));
				if (result.totalSum > lastSum) {
					//result.largest = grid[convertToIndex(x, y)];
					result.largest = grid[y * 300 + x];
					lastSum = result.totalSum;
				}
			}
		}
		return result;
	};
	
	let grid = Array.from({ length: 300 * 300 }).map((val, index) => {
		let x = (index % 300), y = Math.floor(index / 300);
		return { x: x + 1, y: y + 1, val: findPowerLevel(x, y) };
	});
	
	let largestVal = Number.MIN_SAFE_INTEGER;
	let largest = null;
	let sizes = [ { totalSum: 0 } ];
	for (let w = 1; w <= 300; ++w) {
		let result = findHighestSumAtSize(w);
		if (result.totalSum > largestVal) {
			largestVal = result.totalSum;
			largest = result;
		}
		sizes[w] = result;
	}
	
	let size3 = sizes[3];
	sizes.sort((a, b) => b.totalSum - a.totalSum);
	
	result[0] = itemToCoord(size3.largest);
	result[1] = itemToCoord(sizes[0].largest, sizes[0].size);
	
	callback(result);
});