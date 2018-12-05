importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let reactPolymer = (polymer) => {
		for (;;) {
			let done = true;
			for (let i = 0; i < polymer.length - 1; ++i) {
				if ((polymer.charCodeAt(i) ^ polymer.charCodeAt(i + 1)) === 32) {
					done = false;
					polymer = polymer.replace(polymer.substring(i, i + 2), '');
					break;
				}
			}
			if (done)
				return polymer.length;
		}
	};
	
	let improvePolymer = (polymer) => {
		let letters = polymer.toLowerCase().split('').reduce((acc, val) => {
			if (acc.indexOf(val) === -1)
				acc.push(val);
			return acc;
		}, []);
		
		let shortest = polymer.length;
		for (let l = 0, n = letters.length; l < n; ++l)
			shortest = Math.min(shortest, reactPolymer(polymer.replace(new RegExp(letters[l], 'gi'), '')));
		
		return shortest;
	};
	
	result[0] = reactPolymer(input.slice());
	result[1] = improvePolymer(input.slice());
	
	callback(result);
});