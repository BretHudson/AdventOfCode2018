importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let regex = /position=<([\s\-]\d+), ([\s\-]\d+)> velocity=<([\s\-]\d+), ([\s\-]\d+)>/;
	let points = input.split('\n').map(line => {
		let matches = regex.exec(line);
		return { x: +matches[1], y: +matches[2], velX: +matches[3], velY: +matches[4] };
	});
	
	let getSmallestBounds = (points) => {
		let bounds = [];
		for (;;) {
			let b = {
				w: 0, h: 0, a: 0, iter: bounds.length,
				min: { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER },
				max: { x: Number.MIN_SAFE_INTEGER, y: Number.MIN_SAFE_INTEGER }
			};
			
			for (let p = 0; p < points.length; ++p) {
				b.min.x = Math.min(b.min.x, points[p].x);
				b.max.x = Math.max(b.max.x, points[p].x);
				b.min.y = Math.min(b.min.y, points[p].y);
				b.max.y = Math.max(b.max.y, points[p].y);
			}
			
			b.w = b.max.x - b.min.x + 1;
			b.h = b.max.y - b.min.y + 1;
			b.a = b.w * b.h;
			
			if ((bounds.length === 0) || (bounds[bounds.length - 1].a > b.a)) {
				points = points.map(p => { p.x += p.velX; p.y += p.velY; return p; });
				bounds.push(b);
			} else {
				points = points.map(p => { p.x -= p.velX; p.y -= p.velY; return p; });
				return bounds[bounds.length - 1];
			}
		}
	};
	
	let smallestBounds = getSmallestBounds(points);
	points.sort((a, b) => (a.y - b.y) ? a.y - b.y : a.x - b.x);
	
	let draw = (points) => {
		let line = '.'.repeat(smallestBounds.max.x - smallestBounds.min.x + 1) + '<br />';
		
		let str = '';
		let p = 0;
		for (let y = smallestBounds.min.y; y <= smallestBounds.max.y; ++y) {
			let cur = line;
			while ((p < points.length) && (points[p].y === y)) {
				let x = points[p++].x - smallestBounds.min.x;
				cur = cur.substring(0, x) + '#' + cur.substring(x + 1, line.length);
			}
			str += cur;
		}
		
		return str.substring(0, str.length - 6);
	};
	
	result[0] = draw(points);
	result[1] = smallestBounds.iter;
	
	callback(result);
});