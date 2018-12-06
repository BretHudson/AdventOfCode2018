importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let points = input.split('\n').map(val => {
		let [x, y] = val.split(', ');
		return { x: +x, y: +y };
	});
	
	let contained = [];
	let xMin = 1000, yMin = 1000, xMax = -1, yMax = -1;
	for (let t = 0; t < points.length; ++t) {
		let testPoint = points[t];
		let above = false, below = false, left = false, right = false;
		xMin = Math.min(testPoint.x, xMin);
		yMin = Math.min(testPoint.y, yMin);
		xMax = Math.max(testPoint.x, xMax);
		yMax = Math.max(testPoint.y, yMax);
		for (let p = 0; p < points.length; ++p) {
			if (t === p) continue;
			let otherPoint = points[p];
			if (otherPoint.x < testPoint.x) left = true;
			if (otherPoint.x > testPoint.x) right = true;
			if (otherPoint.y < testPoint.y) above = true;
			if (otherPoint.y > testPoint.y) below = true;
		}
		if (above && below && left && right)
			contained.push(t);
	}
	
	let grid = Array.from({ length: (xMax + 1) * (yMax + 1) }).map(val => {
		return { closest: '.', total: null };
	});
	
	for (let y = yMin; y <= yMax; ++y) {
		for (let x = xMin; x <= xMax; ++x) {
			let distances = [];
			for (let p = 0; p < points.length; ++p)
				distances.push(Math.abs(points[p].x - x) + Math.abs(points[p].y - y));
			
			distances = distances.map((dist, index) => {
				return { index: index, dist: dist };
			}).sort((a, b) => a.dist - b.dist);
			
			grid[y * xMax + x].closest = (distances[0].dist < distances[1].dist) ? distances[0].index : null;
			grid[y * xMax + x].total = distances.reduce((acc, val) => acc + val.dist, 0);
		}
	}
	
	result[0] = grid.reduce((acc, item) => {
		let closest = item.closest;
		if (closest === null) return acc;
		if (contained.indexOf(closest) > -1) {
			acc[closest] = (acc[closest] || { index: closest, amount: 0 });
			acc[closest].amount = (acc[closest].amount || 0) + 1;
		}
		return acc;
	}, []).sort((a, b) => b.amount - a.amount)[0].amount;
	
	result[1] = grid.map((item, index) => {
		let x = index % xMax, y = Math.floor(index / xMax);
		if ((x < xMin) || (x > xMax) || (y < yMin) || (y > yMax)) return 0;
		return item.total < 10000;
	}).reduce((acc, val) => acc + val, 0);
	
	callback(result);
});