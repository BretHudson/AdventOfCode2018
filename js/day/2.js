importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let boxIDs = input.split('\n');
	result[0] = boxIDs.reduce((acc, val) => {
		let letters = val.split('').reduce((acc, val) => {
			acc[val] = (acc[val] || 0) + 1;
			return acc;
		}, {});
		
		let has2 = false, has3 = false;
		for (let a of Object.values(letters)) {
			if (a === 2) has2 = true;
			if (a === 3) has3 = true;
		}
		if (has2) ++acc[0];
		if (has3) ++acc[1];
		
		return acc;
	}, [ 0, 0 ]).reduce((acc, val) => acc * val, 1);
	
	for (let item of boxIDs) {
		let lettersA = item.split('');
		for (let i = boxIDs.indexOf(item) + 1; i < boxIDs.length; ++i) {
			let diff = [];
			let lettersB = boxIDs[i].split('');
			for (let l = 0; l < lettersA.length; ++l) {
				if (lettersA[l] !== lettersB[l]) {
					if (diff.push(lettersA[l]) >= 2)
						break;
				}
			}
			if (diff.length === 1) {
				result[1] = item.replace(diff[0], '');
				break;
			}
		}
	}
	
	callback(result);
});