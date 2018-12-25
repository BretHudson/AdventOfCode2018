importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let points = input.split('\n').map(v => v.split(',').map(Number));
	let edges = Array.from({ length: points.length }).map(v => []);
	
	for (let [ i, a ] of Object.entries(points)) {
		for (let [ j, b ] of Object.entries(points)) {
			if (i === j) continue;
			let dist = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(a[3] - b[3]);
			if (dist <= 3)
				edges[+i].push(+j);
		}
	}
	
	let seen = [];
	let constellations = [];
	
	for (let i = 0, n = points.length; i < n; ++i) {
		if (seen.indexOf(i) > -1) continue;
		
		let curConst = [];
		constellations.push(curConst);
		
		let queue = [ i ];
		while (queue.length > 0) {
			let cur = queue.shift();
			if (seen.indexOf(cur) > -1) continue;
			curConst.push(cur);
			seen.push(cur);
			for (let point of edges[cur])
				queue.push(point);
		}
	}
	
	result[0] = constellations.length;
	result[1] = 'Happy Advent of Code 2018!';
	
	callback(result);
});