importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let gridToString = (grid, join = '') => {
		return grid.map(row => {
			return row.map(v => v.cur).join('');
		}).join(join);
	};
	
	let generateGrid = () => {
		return input.split('\n').map(line => line.split('').map(v => {
			return { cur: v, next: v };
		}));
	};
	
	const OPEN = '.';
	const TREE = '|';
	const YARD = '#';
	let regexTrees = new RegExp(`[\\${OPEN}\\${YARD}]`, 'g');
	let regexYards = new RegExp(`[\\${OPEN}\\${TREE}]`, 'g');
	
	const filterIsOpen = c => c.cur === OPEN;
	const filterIsTree = c => c.cur === TREE;
	const filterIsYard = c => c.cur === YARD;
	
	const ADJNT = [ [ -1, -1 ], [  0, -1 ], [  1, -1 ],
					[ -1,  0 ], 			[  1,  0 ],
					[ -1,  1 ], [  0,  1 ], [  1,  1 ] ];
	
	let iterate = (num) => {
		let grid = generateGrid();
		let savedStates = [ gridToString(grid) ];
		
		for (let i = 0; i < num; ++i) {
			grid.forEach((row, rowIndex) => {
				row.forEach((cell, cellIndex) => {
					let adj = [];
					
					let x, y;
					for (let d = 0; d < ADJNT.length; ++d) {
						x = cellIndex + ADJNT[d][0];
						y = rowIndex + ADJNT[d][1];
						if ((x >= 0) && (x < row.length) && (y >= 0) && (y < grid.length))
							adj.push(grid[y][x]);
					}
					
					switch (cell.cur) {
						case OPEN: {
							if (adj.filter(filterIsTree).length >= 3)
								cell.next = TREE;
						} break;
						
						case TREE: {
							if (adj.filter(filterIsYard).length >= 3)
								cell.next = YARD;
						} break;
						
						case YARD: {
							if ((adj.filter(filterIsYard).length === 0) || (adj.filter(filterIsTree).length === 0))
								cell.next = OPEN;
						} break;
					}
				});
			});
			
			grid.forEach(row => row.forEach(cell => cell.cur = cell.next));
			
			let curState = gridToString(grid);
			
			let savedStateIndex = savedStates.indexOf(curState) - 1;
			if (savedStateIndex > -1) {
				let offset = (num - savedStateIndex) % (i - savedStateIndex);
				savedStates.push(savedStates[savedStateIndex + offset]);
				break;
			}
			
			savedStates.push(curState);
		}
		
		let finalState = savedStates[savedStates.length - 1];
		return finalState.replace(regexTrees, '').length * finalState.replace(regexYards, '').length;
	};
	
	result[0] = iterate(10);
	result[1] = iterate(1000000000);
	
	callback(result);
});