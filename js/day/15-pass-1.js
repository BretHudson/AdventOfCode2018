importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let elves = [];
	let goblins = [];
	let units = [];
	let dead = [];
	
	let createUnit = (x, y, type) => {
		let unit = { x: x, y: y, pow: 3, hp: 200, type: type };
		((type === 'E') ? elves : goblins).push(unit);
		units.push(unit);
	};
	
	let grid = input.split('\n').map(val => val.split(''));
	let gw = grid[0].length;
	let gh = grid.length;
	grid.forEach((row, rowIndex) => {
		row.forEach((cell, cellIndex, arr) => {
			switch (cell) {
				case 'E':
				case 'G': {
					createUnit(cellIndex, rowIndex, cell);
					arr[cellIndex] = '.';
				} break;
			}
		});
	});
	
	let testGrid = grid.map((row, rowIndex) => row.map((cell, cellIndex) => {
		return { x: cellIndex, y: rowIndex, dist: null, prev: null, type: cell, unit: null };
	}));
	
	let resetTestGrid = () => {
		testGrid.forEach(row => {
			row.forEach((cell, index, arr) => {
				cell.dist = null;
				cell.unit = null;
				cell.prev = null;
			});
		});
		
		units.forEach(unit => testGrid[unit.y][unit.x].unit = unit);
	};
	
	const DIR = [
		{ x: 0, y: -1 },
		{ x: -1, y: 0 },
		{ x: 1, y: 0 },
		{ x: 0, y: 1 }
	];
	
	const unitDistOffset = gw + gh; // Manhatten distance from corner to corner
	const filterAdj = cell => v => ((v.unit === null) && (v.dist === (cell.dist % unitDistOffset) - 1));
	
	let populateTestGrid = (x, y) => {
		resetTestGrid();
		let start = testGrid[y][x];
		start.dist = 0;
		let queue = [ start ];
		
		let addToQueue = (grid, cur, x, y) => {
			
		};
		
		let cur;
		while (queue.length > 0) {
			cur = queue.pop();
			
			for (let d = 0; d < 4; ++d) {
				let next = testGrid[cur.y + DIR[d].y][cur.x + DIR[d].x];
				if (((next.dist !== null) && (next.dist < cur.dist + 1)) || (next.type === '#')) continue;
				next.dist = cur.dist + 1;
				if (next.unit !== null) {
					next.dist += unitDistOffset;
					continue;
				}
				queue.push(next);
			}
			
			/*addToQueue(testGrid, cur, -1, 0);
			addToQueue(testGrid, cur, 1, 0);
			addToQueue(testGrid, cur, 0, -1);
			addToQueue(testGrid, cur, 0, 1);*/
		}
		
		testGrid.forEach(row => {
			row.forEach(cell => {
				if ((cell.type === '#') || (cell.dist == null)) return;
				
				let left = testGrid[cell.y][cell.x - 1];
				let up = testGrid[cell.y - 1][cell.x];
				let right = testGrid[cell.y][cell.x + 1];
				let down = testGrid[cell.y + 1][cell.x];
				
				let sorted = [ up, down, left, right ].filter(filterAdj(cell)).sort((a, b) => a.dist - b.dist);
				
				if (sorted.length === 0) return;
				
				if ((up) && (up.dist === sorted[0].dist)) {
					cell.prev = testGrid[cell.y - 1][cell.x];
				} else if ((left) && (left.dist === sorted[0].dist)) {
					cell.prev = testGrid[cell.y][cell.x - 1];
				} else if ((right) && (right.dist === sorted[0].dist)) {
					cell.prev = testGrid[cell.y][cell.x + 1];
				} else if ((down) && (down.dist === sorted[0].dist)) {
					cell.prev = testGrid[cell.y + 1][cell.x];
				}
				
				if ((cell.prev) && (cell.prev.unit !== null))
					console.error('what');
			});
		});
	};
	
	for (let u = 0, n = units.length; u < n; ++u) {
		console.time('populate');
		populateTestGrid(units[u].x, units[u].y);
		console.timeEnd('populate');
		//console.log(drawTestGridWithArrows(testGrid));
	}
	
	resetTestGrid();
	console.warn(drawTestGrid(testGrid, '\n'));
	
	return callback(result);
});

let drawTestGrid = (testGrid, str = '', showDist = false) => {
	testGrid.forEach(row => {
		let hp = '\t';
		let unitsInRow = [];
		row.forEach(cell => {
			if (showDist) {
				if (cell.type === '#')
					str += '#';
				else if (cell.dist === null) {
					if (cell.unit)
						str += cell.unit.type;
					else
						str += '.';
				}
				else
					str += cell.dist.toString(32);
			} else {
				if (cell.unit) {
					str += cell.unit.type;
					unitsInRow.push(cell.unit);
				} else
					str += cell.type;
			}
		});
		for (let unit of unitsInRow)
			hp += `${unit.type}(${unit.hp}), `;
		str += hp.substring(0, hp.length - 2) + '\n';
	});
	
	return str;
};


let drawTestGridWithArrows = (testGrid) => {
	let str = [];
	let paths = Array.from({ length: testGrid.length - 1 }).map(val => ' '.repeat(testGrid[0].length * 2 - 1));
	testGrid.forEach((row, rowIndex) => {
		let hp = '\t';
		let unitsInRow = [];
		let rowStr = '';
		row.forEach((cell, cellIndex) => {
			if (cell.type === '#')
				rowStr += ' ';
			else if (cell.dist === null) {
				if (cell.unit)
					rowStr += cell.unit.type;
				else
					rowStr += '.';
			}
			else
				rowStr += (cell.unit) ? cell.unit.type : cell.dist.toString(32).substr(-1);
				//rowStr += cell.dist.toString(32).substr(-1);
			
			let postFix = ' ';
			if (cell.prev !== null) {
				let strIndex = cellIndex * 2;
				let rowDiff = cell.y - cell.prev.y;
				if (rowDiff !== 0) {
					let strRow = rowIndex;
					let icon = '▼';
					if (rowDiff === 1) {
						--strRow;
						icon = '▲';
					}
					paths[strRow] = paths[strRow].slice(0, strIndex) + icon + paths[strRow].slice(strIndex);
				} else {
					if (cell.prev.x > cell.x)
						postFix = '▶';
					else
						rowStr = rowStr.slice(0, rowStr.length - 2) + '◀' + rowStr.charAt(rowStr.length - 1);
				}
			}
			rowStr += postFix;
		});
		for (let unit of unitsInRow)
			hp += `${unit.type}(${unit.hp}), `;
		rowStr += hp.substring(0, hp.length - 2);
		str.push(rowStr);
	});
	
	let allLines = [];
	for (let i = 0; i < str.length; ++i) {
		allLines.push(str[i]);
		if (i < paths.length)
			allLines.push(paths[i]);
	}
	
	return allLines.join('\n');
};