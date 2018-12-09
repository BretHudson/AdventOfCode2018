importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	const createNode = (val, l, r) => { return { val: val, l: l, r: r }; };
	
	const insertNode = (before, val) => {
		let newNode = createNode(val, before, before.r);
		before.r.l = newNode;
		before.r = newNode;
		return newNode;
	};
	
	const iterate = (numPlayers, iters) => {
		let cur = createNode(0, null, null);
		cur.l = cur.r = cur;
		
		let scores = Array.from({ length: numPlayers }).map(val => 0);
		for (let curMarble = 1; curMarble <= iters; ++curMarble) {
			if (curMarble % 23 === 0) {
				for (let i = 0; i < 7; ++i)
					cur = cur.l;
				let remove = cur;
				scores[curMarble % numPlayers] += curMarble + remove.val;
				remove.l.r = remove.r;
				remove.r.l = remove.l;
				cur = cur.r;
			} else
				cur = insertNode(cur.r, curMarble);
		}
		return scores.sort((a, b) => b - a)[0];
	};
	
	let regex = /(\d+) players; last marble is worth (\d+) points/;
	let matches = regex.exec(input);
	let numPlayers = +matches[1];
	let numMarbles = +matches[2];
	
	result[0] = iterate(numPlayers, numMarbles);
	result[1] = iterate(numPlayers, numMarbles * 100);
	
	callback(result);
});