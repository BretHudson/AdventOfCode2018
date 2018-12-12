importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	const createPot = (index, val) => {
		return { val: val, index: index, left: null, right: null, newVal: '' };
	};
	
	const addToLeft = (pot, val = '.') => {
		let left = createPot(pot.index - 1, val);
		pot.left = left;
		left.right = pot;
		return left;
	};
	
	const addToRight = (pot, val = '.') => {
		let right = createPot(pot.index + 1, val);
		pot.right = right;
		right.left = pot;
		return right;
	};
	
	let lines = input.split('\n');
	
	let initialState = lines[0].split(': ')[1].split('');
	
	let head = createPot(0, initialState[0]);
	let zero = head;
	let tail = head;
	for (let p = 1; p < initialState.length; ++p)
		tail = addToRight(tail, initialState[p]);
	
	let combos = [];
	for (let l = 2; l < lines.length; ++l) {
		let parts = lines[l].split(' => ');
		let arr = parts[0].split('');
		let index = 2;
		let val = 0;
		for (let i = 0; i <= 4; ++i)
			val |= ((arr[index - 2 + i] === '#') ? 1 : 0) << (4 - i);
		combos[val] = parts[1];
	}
	
	const isPlant = (pot, offset = 0) => {
		let selfIsPlant = (pot.val === '#');
		while (offset < 0) {
			if (pot.left === null)
				return 0;
			pot = pot.left;
			++offset;
		}
		while (offset > 0) {
			if (pot.right === null)
				return 0;
			pot = pot.right;
			--offset;
		}
		return (pot.val === '#') ? 1 : 0;
	};
	
	const convert = (pot) => {
		let selfIsPlant = isPlant(pot);
		let val = (selfIsPlant ? 1 : 0) << 2;
		for (let i = 0; i <= 4; ++i)
			val |= isPlant(pot, i - 2) << (4 - i);
		return val;
	};
	
	const getPlantNumberSum = (head) => {
		let total = 0;
		for (let cur = head; cur; cur = cur.right)
			total += isPlant(cur) * cur.index;
		return total;
	};
	
	let sums = [ { val: getPlantNumberSum(head), diff: 0 } ];
	let numberOfGenerations = 50000000000
	for (let i = 1; i <= numberOfGenerations; ++i) {
		let leftPlant = head;
		let rightPlant = tail;
		for (let x = 0; x < 4; ++x) {
			if (leftPlant.val !== '#')
				leftPlant = leftPlant.right;
			if (rightPlant.val !== '#')
				rightPlant = rightPlant.left;
		}
		
		for (let x = 0; x < 4; ++x) {
			if (leftPlant.left === null)
				addToLeft(leftPlant);
			leftPlant = leftPlant.left;
			if (rightPlant.right === null)
				addToRight(rightPlant);
			rightPlant = rightPlant.right;
		}
		
		while (head.left)
			head = head.left;
		
		while (tail.right)
			tail = tail.right;
		
		for (let cur = head; cur; cur = cur.right)
			cur.newVal = combos[convert(cur)] || '.';
		
		for (let cur = head; cur; cur = cur.right)
			cur.val = cur.newVal;
		
		let total = getPlantNumberSum(head);
		sums.push({ val: total, diff: total - sums[sums.length - 1].val });
		if (sums.length >= 20) {
			let amount = sums[sums.length - 1].diff;
			for (let i = sums.length - 10; i < sums.length; ++i) {
				if (sums[i].diff !== amount) {
					amount = null;
					break;
				}
			}
			if (amount !== null)
				break;
		}
	}
	
	let lastIter = sums.length - 1;
	
	result[0] = sums[20].val;
	result[1] = sums[lastIter].val + (numberOfGenerations - lastIter) * sums[lastIter].diff;
	
	callback(result);
});