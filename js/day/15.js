
importScripts('./../baseWorker.js', 'https://cdnjs.cloudflare.com/ajax/libs/jsnetworkx/0.3.4/jsnetworkx.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	// NOTE(bret):
	
	// This is the third pass for day 15.
	// Day 15 this year was extremely annoying. I implemented it twice, and both times my solutions were
	// incorrect. So, what I did was I found a few solutions and got the output from them. I got my answer
	// consistently between them. From there, I took one of the solutions and copied it basically line for
	// line, converting Python into JS. I figured if I was going to take the "easy" route out of this, I
	// might as well add a bit of challenge by translating between two languages.
	
	// Credit for this one goes to /r/VikeStep
	// Python Source: https://gist.github.com/CameronAavik/0f062f33ffb0fbf3eeed24aa8a8cc291
	
	class Unit {
		constructor(type, x, y, pow) {
			this.type = type;
			this.x = x;
			this.y = y;
			this.pos = [ x, y ];
			this.hp = 200;
			this.pow = (this.type === 'E') ? pow : 3;
		}
		
		move(pos) {
			this.x = this.pos[0] = pos[0];
			this.y = this.pos[1] = pos[1];
		}
		
		moveXY(x, y) {
			this.x = this.pos[0] = x;
			this.y = this.pos[1] = y;
		}
		
		get alive() { return this.hp > 0; }
	}
	
	const unitSort = (a, b) => (a.y - b.y) ? (a.y - b.y) : (a.x - b.x);
	const getGridHP = (units) => units.filter(unit => unit.alive).reduce((acc, unit) => acc + unit.hp, 0);
	
	const getAdjFromXY = (x, y) => [ [ x, y - 1 ], [ x - 1, y ], [ x + 1, y ], [ x, y + 1 ] ];
	const getAdjFromPos = (p) => [ [ p[0], p[1] - 1 ], [ p[0] - 1, p[1] ], [ p[0] + 1, p[1] ], [ p[0], p[1] + 1 ] ];
	
	const findPosInArray = (pos, a) => {
		for (let i = 0, n = a.length; i < n; ++i) {
			if ((a[i][0] === pos[0]) && (a[i][1] === pos[1]))
				return true;
		}
		return false;
	};
	
	const findPosArrayOverlap = (a, b) => {
		let results = [];
		for (let i = 0, n = b.length; i < n; ++i) {
			if (findPosInArray(b[i], a))
				results.push(b[i]);
		}
		return results;
	};
	
	const parseInput = (pow = 3) => {
		let data = input.split('\n').map(v => v.split(''));
		let units = [];
		for (let y of Array(data.length).keys()) {
			for (let x of Array(data[0].length).keys()) {
				let type = data[y][x];
				switch (type) {
					case 'E':
					case 'G': {
						units.push(new Unit(type, x, y, pow));
						data[y][x] = '.';
					} break;
				}
			}
		}
		return [ data, units ];
	};
	
	const checkIfEndState = (units) => {
		let elvesDefeated = units.filter(unit => (unit.type === 'E') && (unit.alive)).length === 0;
		let elvesDead = units.filter(unit => (unit.type === 'E') && (!unit.alive)).length > 0;
		let goblinsDefeated = units.filter(unit => (unit.type === 'G') && (unit.alive)).length === 0;
		
		return [ (elvesDefeated || goblinsDefeated), elvesDead ];
	};
	
	const solve = (pow = 3, noElvesDie = false) => {
		let [ data, units ] = parseInput(pow);
		
		let G = new jsnx.Graph();
		for (let y of Array(data.length).keys()) {
			for (let x of Array(data[0].length).keys()) {
				if (data[y][x] === '.') {
					let curPos = [ x, y ];
					for (let [ x2, y2 ] of getAdjFromXY(x, y)) {
						if ((0 <= x2) && (x2 < data[0].length) && (0 <= y2) && (y2 < data.length) && (data[y2][x2] == ".")) {
							G.addEdge(curPos, [ x2, y2 ]);
						}
					}
				}
			}
		}
		
		let findClosest = (graph, excludedNodes, start, targets) => {
			if (findPosInArray(start, graph.nodes()) === false)
				return [ [], null ];
			
			let queue = [ [ start, 0 ] ];
			let seen = [];
			let foundDist = null;
			let closest = [];
			
			while (queue.length > 0) {
				let [ cell, dist ] = queue.shift();
				
				if ((foundDist !== null) && (dist > foundDist))
					return [ closest, foundDist ];
				
				if ((findPosInArray(cell, seen)) || (findPosInArray(cell, excludedNodes)))
					continue;
				
				seen.push(cell);
				
				if (findPosInArray(cell, targets)) {
					foundDist = dist;
					closest.push(cell);
				}
				
				for (let nCell of graph.neighbors(cell)) {
					if (findPosInArray(nCell, seen) === false)
						queue.push([ nCell, dist + 1 ]);
				}
			}
			
			return [ closest, foundDist ];
		};
		
		let rounds = 0;
		for (; rounds < 9999;) {
			units.sort(unitSort);
			
			let cur;
			for (let u = 0, n = units.length; u < n; ++u) {
				cur = units[u];
				if (cur.alive === false) continue;
				
				let gameState = checkIfEndState(units);
				if ((noElvesDie) && (gameState[1]))
					return [ 0, 0, false ];
				
				if (gameState[0])
					return [ rounds, getGridHP(units), true ];
				
				let enemies = units.filter(unit => (unit.type !== cur.type) && (unit.alive));
				let enemyPositions = enemies.map(e => e.pos);
				
				let nearbyCells = getAdjFromPos(cur.pos);
				let enemiesInRange = findPosArrayOverlap(nearbyCells, enemyPositions);
				
				if (enemiesInRange.length === 0) {
					let surrounding = [];
					for (let e of enemies)
						surrounding.push(...findPosArrayOverlap(getAdjFromPos(e.pos), G.nodes()));
					let excludedNodes = units.filter(unit => (unit.alive) && (unit !== cur)).map(unit => unit.pos);
					
					let [ closestTargets, dist ] = findClosest(G, excludedNodes, cur.pos, surrounding);
					
					if (closestTargets.length > 0) {
						closestTargets.sort((a, b) => (a[1] - b[1]) ? (a[1] - b[1]) : (a[0] - b[0]));
						
						for (let s of nearbyCells) {
							let [ , d ] = findClosest(G, excludedNodes, s, closestTargets.slice(0, 1));
							if (d === dist - 1) {
								cur.move(s);
								break;
							}
						}
						
						nearbyCells = getAdjFromPos(cur.pos);
						enemiesInRange = findPosArrayOverlap(nearbyCells, enemyPositions);
					}
				}
				
				if (enemiesInRange.length > 0) {
					let targets = enemies.filter(e => findPosInArray(e.pos, enemiesInRange));
					targets.sort((a, b) => (a.hp - b.hp) ? (a.hp - b.hp) : unitSort(a, b));
					targets[0].hp -= cur.pow;
				}
			}
			
			++rounds;
			
			let gameState = checkIfEndState(units);
			if ((noElvesDie) && (gameState[1]))
				return [ 0, 0, false ];
			
			if (gameState[0])
				return [ rounds, getGridHP(units), true ];
		}
		
		return [ 0, 0, false ];
	};
	
	
	console.time('execute');
	result[0] = solve().reduce((acc, val) => acc * val, 1);
	console.timeEnd('execute');
	return callback(result);
	
	let rounds = 0;
	let hp = 0;
	let success = false;
	let pow = 3;
	do {
		[ rounds, hp, success ] = solve(pow++, true);
		if (pow > 200) success = true;
	} while (success === false);
	
	result[1] = rounds * hp;
	
	callback(result);
});
/*
let graphToString = (units, prefix = '') => {
	let [ data ] = parseInput();
	let stats = Array.from({ length: data.length }).map(v => []);
	for (let unit of units) {
		if (unit.alive) {
			data[unit.y][unit.x] = unit.type;
			stats[unit.y].push(unit);
		}
	}
	
	return `${prefix}\n` + data.map((row, rowIndex) => {
		return row.join('') + '\t' + stats[rowIndex].reduce((acc, unit) => {
			return acc + `${unit.type}(${unit.hp}), `;
		}, '').slice(0, -2);
	}).join('\n');
};
*/