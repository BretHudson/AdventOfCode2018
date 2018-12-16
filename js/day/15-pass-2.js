// 206236
// 88537



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
	
	const unitDistOffset = gw + gh; // Manhatten distance from corner to corner
	const filterAdj = cell => v => ((v.unit === null) && (v.dist === cell.dist - 1));
	const getAdj = (cell) => {
		let left = testGrid[cell.y][cell.x - 1];
		let up = testGrid[cell.y - 1][cell.x];
		let right = testGrid[cell.y][cell.x + 1];
		let down = testGrid[cell.y + 1][cell.x];
		return [ up, down, left, right ];
	};
	
	const unitSort = (a, b) => (a.y - b.y) ? (a.y - b.y) : (a.x - b.x);
	const DIR = [
		{ x: 0, y: -1 },
		{ x: -1, y: 0 },
		{ x: 1, y: 0 },
		{ x: 0, y: 1 }
	];
	
	// TODO(bret): Create a way to make it so it doesn't check the next two depths if it finds an enemy! Early exit = save a bunch of processing time
	let populateTestGrid = (x, y) => {
		resetTestGrid();
		let start = testGrid[y][x];
		start.dist = 0;
		let queue = [ start ];
		
		let addToQueue = (grid, cur, x, y) => {
			let next = grid[cur.y + y][cur.x + x];
			if (((next.dist !== null) && (next.dist < cur.dist + 1)) || (next.type === '#')) return;
			if (next.unit !== null) {
				return;
			}
			next.dist = cur.dist + 1;
			queue.push(next);
		};
		
		let cur;
		while (queue.length > 0) {
			cur = queue.pop();
			
			addToQueue(testGrid, cur, -1, 0);
			addToQueue(testGrid, cur, 1, 0);
			addToQueue(testGrid, cur, 0, -1);
			addToQueue(testGrid, cur, 0, 1);
		}
		
		testGrid.forEach(row => {
			row.forEach(cell => {
				if ((cell.type === '#') || (cell.dist == null)) return;
				
				let sorted = getAdj(cell).filter(filterAdj(cell)).sort((a, b) => a.dist - b.dist);
				
				if (sorted.length === 0) return;
				
				sorted.sort(unitSort);
				cell.prev = sorted[0];
			});
		});
		
		units.forEach(unit => {
			let unitCell = testGrid[unit.y][unit.x];
			
			let adj = getAdj(unitCell).filter(c => c.unit === null);
			unitCell.prev = getCellsByDist(adj)[0] || null;
			
			if (unitCell.prev !== null)
				unitCell.dist = unitCell.prev.dist + 1;
		});
	};
	
	resetTestGrid();
	console.warn(drawTestGrid(testGrid, `Initially:\n`));
	
	const getCellsByDist = (arr) => arr.filter(c => c.dist !== null).sort((a, b) => a.dist - b.dist).filter((c, i, a) => c.dist === a[0].dist).sort(unitSort);
	
	let getAdjEnemies = (unit) => {
		return getAdj(unit).filter(cell => (cell.unit !== null) && (cell.unit.type !== unit.type) && (cell.unit.hp > 0));
	};
	
	let stimulate = () => {
		let rounds = 0;
		for (; rounds < 100; ++rounds) {
			units.sort(unitSort);
			
			let unitsToRemove = [];
			let unit, enemies, enemyType;
			for (let u = 0, n = units.length; u < n; ++u) {
				unit = units[u];
				if (unit.hp < 0) continue;
				
				enemies = (unit.type === 'E') ? goblins : elves;
				if (enemies.length === 0) return rounds;
				enemies.sort(unitSort);
				console.log(`===========\nTURN: ${unit.type} Unit | ${unit.hp}/200 | (${unit.x}, ${unit.y})`);
				
				resetTestGrid();
				let adjEnemies = getAdjEnemies(unit);
				if (adjEnemies.length === 0) {
					console.time('populate');
					populateTestGrid(unit.x, unit.y);
					console.timeEnd('populate');
					//console.log(drawTestGridWithArrows(testGrid));
					
					let closestEnemyCell = null;
					let enemyCells = enemies.map(e => testGrid[e.y][e.x]);
					closestEnemyCell = getCellsByDist(enemyCells)[0] || null;
					//console.log('enemy cells');
					//console.table(enemyCells);
					/*for (let enemy of enemies) {
						let enemyCell = testGrid[enemy.y][enemy.x];
						if ((closestEnemyCell === null) || (closestEnemyCell.dist > enemyCell.dist))
							closestEnemyCell = enemyCell;
					}*/
					
					if (closestEnemyCell !== null) {
						let adj = getAdj(closestEnemyCell).filter(c => c.unit === null);
						let target = getCellsByDist(adj)[0];
						//console.log(target);
						while (target.dist > 1)
							target = target.prev;
						//console.log(target);
						unit.x = target.x;
						unit.y = target.y;
					}
					
					adjEnemies = getAdjEnemies(unit);
				}
				
				if (adjEnemies.length > 0) {
					//console.log('Atttaacccckkkk!!!');
					adjEnemies.sort((a, b) => (a.unit.hp - b.unit.hp) ? (a.unit.hp - b.unit.hp) : unitSort(a, b));
					let enemy = adjEnemies[0].unit;
					enemy.hp -= unit.pow;
					if (enemy.hp < 0) {
						console.warn('remove please', enemy);
						if (enemy.type === 'E')
							elves.splice(elves.indexOf(enemy), 1);
						else
							goblins.splice(goblins.indexOf(enemy), 1);
						unitsToRemove.push(enemy);
					}
				}
			}
			
			while (unitsToRemove.length > 0) {
				let unit = unitsToRemove.pop();
				units.splice(units.indexOf(unit), 1);
			}
			
			resetTestGrid();
			console.warn(drawTestGrid(testGrid, `\nAfter ${rounds + 1} round${(rounds > 0) ? 's' : ''}:\n`));
			console.warn(`Remaining units: ${units.length}`);
			
			if ((elves.length === 0) || (goblins.length === 0)) return rounds + 1;
		}
	};
	
	const reduceUnitHP = (acc, unit) => acc + unit.hp;
	
	let rounds = stimulate();
	let totalHP = elves.reduce(reduceUnitHP, 0) + goblins.reduce(reduceUnitHP, 0);
	result[0] = rounds + '/' + totalHP;
	result[1] = rounds * totalHP;
	
	
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
				rowStr += '#';
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
					let icon = 'V';
					if (rowDiff === 1) {
						--strRow;
						icon = '^';
					}
					paths[strRow] = paths[strRow].slice(0, strIndex) + icon + paths[strRow].slice(strIndex);
				} else {
					if (cell.prev.x > cell.x)
						postFix = '>';
					else
						rowStr = rowStr.slice(0, rowStr.length - 2) + '<' + rowStr.charAt(rowStr.length - 1);
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