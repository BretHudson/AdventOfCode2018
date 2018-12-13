importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	const createCart = (dir, x, y) => carts.push({ inter: 0, destroyed: false, dir: dir, x: x, y: y });
	
	let generateGrid = (create = true) => {
		let grid = input.split('\n').map(val => val.split(''));
		grid.forEach((line, lineIndex) => {
			line.forEach((cell, index, arr) => {
				switch (cell) {
					case 'v':
					case '^': {
						if (create) createCart(cell, index, lineIndex);
						arr[index] = '|';
					} break;
					
					case '<':
					case '>': {
						if (create) createCart(cell, index, lineIndex);
						arr[index] = '-';
					} break;
				}
			});
		});
		return grid;
	};
	
	let carts = [];
	let grid = generateGrid();
	
	let transforms = {
		'v': [ '>', '<', '>', '<' ],
		'^': [ '<', '>', '<', '>' ],
		'<': [ '^', 'v', 'v', '^' ],
		'>': [ 'v', '^', '^', 'v' ]
	};
	
	let newDir = (cart, track) => {
		switch (track) {
			case '\\':	return transforms[cart.dir][0];
			case '/':	return transforms[cart.dir][1];
			case '+': {
				switch (cart.inter++ % 3) {
					case 0: return transforms[cart.dir][2];
					case 2: return transforms[cart.dir][3];
				}
			} break;
		}
		return cart.dir;
	};
	
	let moveCart = (cart) => {
		switch (cart.dir) {
			case 'v': ++cart.y; break;
			case '^': --cart.y; break;
			case '<': --cart.x; break;
			case '>': ++cart.x; break;
		}
		
		cart.dir = newDir(cart, grid[cart.y][cart.x]);
	};
	
	let sortCarts = () => carts.sort((a, b) => (a.y - b.y) ? a.y - b.y : a.x - b.x);
	
	let checkCollisions = () => {
		for (let c1 = 0; c1 < carts.length; ++c1) {
			if (carts[c1].destroyed) continue;
			for (let c2 = c1 + 1; c2 < carts.length; ++c2) {
				if (carts[c2].destroyed) continue;
				if ((carts[c1].x === carts[c2].x) && (carts[c1].y === carts[c2].y)) {
					carts[c1].destroyed = true;
					carts[c2].destroyed = true;
					checkCollisions();
					return;
				}
			}
		}
	};
	
	let removedCarts = [];
	let simulateCarts = (num) => {
		for (let i = 0; i < num; ++i) {
			sortCarts();
			
			let len = carts.length;
			for (let c = 0; c < len; ++c) {
				if (carts[c].destroyed === false) {
					moveCart(carts[c]);
					checkCollisions();
				}
			}
			
			removedCarts = removedCarts.concat(carts.filter((cart) => cart.destroyed));
			carts = carts.filter((cart) => !cart.destroyed);
			if (carts.length <= 1) return;
		}
	};
	
	simulateCarts(999999);
	
	let firstCollision = removedCarts[0];
	let lastCart = carts[0] || { x: null, y: null };
	
	result[0] = `${firstCollision.x},${firstCollision.y}`;
	result[1] = `${lastCart.x},${lastCart.y}`;
	
	callback(result);
});
/*
NOTE(bret): Following for visualization
let drawCarts = () => {
	let str = '';
	let newGrid = generateGrid(false);
	for (let c = 0; c < carts.length; ++c) {
		let cart = carts[c];
		newGrid[cart.y][cart.x] = `<span style="color: white">${cart.dir}</span>`;
	}
	newGrid.forEach(line => str += line.join('') + '<br />');
	return str;
};

setTimeout(() => {
	let interval = setInterval(() => {
		simulateCarts(1);
		result[1] = drawCarts();
		callback(result);
		if (carts.length <= 1)
			clearInterval(interval);
	}, 33);
}, 10000);
*/