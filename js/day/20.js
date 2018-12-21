importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let parseRegex = (inputRegex) => {
		const DIR = { 'N': { x: 0, y: -1 }, 'S': { x: 0, y: 1 }, 'W': { x: -1, y: 0 }, 'E': { x: 1, y: 0 } };
		const getKey = (x, y) => `${x},${y}`;
		
		let heads = [];
		let distances = {};
		let X = 0, Y = 0, prevX = 0, prevY = 0;
		for (let r = 1, n = inputRegex.length - 1; r < n; ++r) {
			let nextChar = inputRegex[r];
			
			switch (nextChar) {
				case '(': {
					heads.unshift([ X, Y ]);
				} break;
				
				case '|': {
					[ X, Y ] = heads[0];
				} break;
				
				case ')': {
					[ X, Y ] = heads.shift();
				} break;
				
				default: {
					X += DIR[nextChar].x;
					Y += DIR[nextChar].y;
					let key = getKey(X, Y);
					let lastDist = distances[getKey(prevX, prevY)] || 0;
					if (distances[key] !== undefined)
						distances[key] = Math.min(distances[key], lastDist + 1);
					else
						distances[key] = lastDist + 1;
				} break;
			}
			
			prevX = X;
			prevY = Y;
		}
		
		return Object.values(distances).sort((a, b) => (b - a));
	};
	
	let distances = parseRegex(input);
	
	result[0] = distances[0];
	result[1] = distances.filter(dist => dist >= 1000).length;
	
	callback(result);
});