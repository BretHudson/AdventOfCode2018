importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let regex = /([xy])=([\d.]+)/g;
	let maxX = 0;
	let minY = Number.MAX_SAFE_INTEGER;
	let maxY = 0;
	let clay = input.split('\n').map(line => {
		let c = {};
		
		while (matches = regex.exec(line)) {
			let x = matches[1];
			c[x] = matches[2].split('..').map(v => +v);
			c[x][1] = c[x][1] || c[x][0];
		}
		
		for (let y = c.y[0]; y <= c.y[1]; ++y) {
			for (let x = c.x[0]; x <= c.x[1]; ++x) {
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
			}
		}
		
		return c;
	});
	
	const [ SAND, CLAY, FLOW, REST ] = [ `.`, `#`, `|`, `~` ];
	let grid = Array.from({ length: maxY + 2 }).map(v => Array.from({ length: maxX + 2 }).map(v => SAND));
	
	for (let c of clay) {
		for (let y = c.y[0]; y <= c.y[1]; ++y) {
			for (let x = c.x[0]; x <= c.x[1]; ++x) {
				grid[y][x] = CLAY;
			}
		}
	}
	
	let cur = { x: 500, y: 1 };
	let waters = [ cur ];
	let prev = [ null ];
	let corners = [];
	for (;;) {
		let curCell = grid[cur.y][cur.x];
		if (curCell === SAND)
			curCell = grid[cur.y][cur.x] = FLOW;
		
		let down = grid[cur.y + 1][cur.x];
		let left = grid[cur.y][cur.x - 1];
		let right = grid[cur.y][cur.x + 1];
		let next = null;
		if (cur.y < maxY) {
			let currentlyOnStable = (down === CLAY) || (down === REST);
			if (down === SAND) {
				prev.push(cur);
				next = { x: cur.x, y: cur.y + 1 };
			} else if ((left === SAND) && (currentlyOnStable)) {
				prev.push(cur);
				next = { x: cur.x - 1, y: cur.y };
			} else if ((right === SAND) && (currentlyOnStable)) {
				next = { x: cur.x + 1, y: cur.y };
			}
		}
		
		if ((curCell === FLOW) && ((down === CLAY) || (down === REST)) && (left === CLAY)) {
			if (corners.indexOf(cur) === -1)
				corners.push(cur);
		}
		
		if (next === null) {
			if (cur.y < maxY) {
				cur = prev.pop();
				if (cur === null) break;
				
				for (let cell of corners.filter(c => c.y > cur.y)) {
					corners.splice(corners.indexOf(cell), 1);
					
					let testX = cell.x, next, good = true;
					do {
						next = grid[cell.y][++testX];
						good = (next !== SAND);
					} while ((next !== CLAY) && (next !== SAND));
					
					if (good)
						for (testX = cell.x; grid[cell.y][testX] !== CLAY; grid[cell.y][testX++] = REST);
				}
			} else
				cur = prev.pop();
		} else {
			waters.push(next);
			cur = next;
		}
	}
	
	const getCells = (comp) => grid.reduce((acc, row, index) => {
		if (index < minY) return acc;
		return acc + row.reduce((acc, cell) => acc + comp(cell), 0);
	}, 0);
	
	result[0] = getCells((cell) => (cell === REST) || (cell === FLOW));
	result[1] = getCells((cell) => (cell === REST));
	
	callback(result);
});