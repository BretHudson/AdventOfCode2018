importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	class Heap {
		constructor() {
			this.arr = [];
			this.size = 0;
		}
		
		parentIndex(n) {
			return (n - 1) >> 1;
		}
		
		swap(a, b) {
			let temp = this.arr[a];
			this.arr[a] = this.arr[b];
			this.arr[b] = temp;
		}
		
		push(val) {
			let node = val.slice();
			let index = this.size++;
			this.arr[index] = node;
			let parentIndex;
			while ((index > 0) && (this.compare(index, parentIndex = this.parentIndex(index)) < 0)) {
				this.swap(index, parentIndex);
				index = parentIndex;
			}
		}
		
		pop() {
			if (this.size <= 1) {
				this.size = 0;
				return this.arr[0] || null;
			}
			let removed = this.arr[0];
			this.arr[0] = this.arr[--this.size];
			this.arr[this.size] = undefined;
			this.heapify(0);
			return removed;
		}
		
		compare(a, b) {
			let diff = this.arr[a][0] - this.arr[b][0];
			return diff;//this.arr[a][0] < this.arr[b][0];
		}
		
		heapify(index) {
			let min = index;
			let indexL = 2 * index + 1;
			let indexR = 2 * index + 2;
			
			if ((indexL < this.size) && (this.compare(indexL, min) < 0)) min = indexL;
			if ((indexR < this.size) && (this.compare(indexR, min) < 0)) min = indexR;
			
			if (min !== index) {
				this.swap(index, min);
				this.heapify(min);
			}
		}
	}
	
	const TYPE = { ROCKY: 0, WET: 1, NARROW: 2 };
	const ITEMS = { NONE: 0, TORCH: 1, GEAR: 2 };
	const DIR = [ [ 0, -1 ], [ 0, 1 ], [ -1, 0 ], [ 1, 0 ], ];
	
	let [ depth, target ] = input.split('\n').map(v => v.split(': ')[1]);
	depth = +depth;
	target = target.split(',').map(v => +v);
	
	let geologicIndices = {};
	const getGeologicIndex = (X, Y, depth) => {
		let coordStr = `${X},${Y}`;
		let result = geologicIndices[coordStr];
		if (result !== undefined) return result;
		
		if (Y === 0) {
			result = X * 16807;
		} else if (X === 0) {
			result = Y * 48271;
		} else if ((X === target[0]) && (Y === target[1])) {
			result = 0;
		} else {
			a = getErosionLevel(getGeologicIndex(X - 1, Y, depth), depth);
			b = getErosionLevel(getGeologicIndex(X, Y - 1, depth), depth);
			result = a * b;
		}
		
		geologicIndices[coordStr] = result;
		return result;
	};
	
	const getErosionLevel = (geologicIndex, depth) => (geologicIndex + depth) % 20183;
	
	let margin = 100;
	let map = Array.from({ length: target[1] + 1 + margin }).map(v =>
		Array.from({ length: target[0] + 1 + margin }).map(v => ({
			type: -1, time: Number.MAX_SAFE_INTEGER
		}))
	);
	map = {};
	
	let getMapInfo = (X, Y, depth) => {
		let key = `${X},${Y}`;
		if (map[key] === undefined) {
			let index = getGeologicIndex(X, Y, depth);
			let erosionLevel = getErosionLevel(index, depth);
			map[key] = erosionLevel % 3;
		}
		return map[key];
	};
	
	let riskLevel = 0;
	for (let Y = 0; Y <= target[1]; ++Y) {
		for (let X = 0; X <= target[0]; ++X) {
			riskLevel += getMapInfo(X, Y, depth);
		}
	}
	
	let targetKey = `${target[0]},${target[1]},${ITEMS.TORCH}`;
	
	let findBestTime = () => {
		let visited = {};
		let queue = new Heap();
		queue.push([ 0, 0, 0, ITEMS.TORCH ]);
		
		while (queue.size > 0) {
			let [ time, X, Y, equipped ] = queue.pop();
			
			let key = `${X},${Y},${equipped}`;
			
			if ((visited[key] !== undefined) && (visited[key] <= time)) continue;
			visited[key] = time;
			
			//if (key === targetKey) return time;
			if ((X === target[0]) && (Y === target[1])) return time;
			
			key = `${X},${Y}`;
			for (let tool = 0; tool < 3; ++tool) {
				if ((tool !== equipped) && (tool !== map[key]))
					queue.push([ time + 7, X, Y, tool ]);
			}
			
			for (let d = 0; d < 4; ++d) {
				let XX = X + DIR[d][0];
				let YY = Y + DIR[d][1];
				
				if (XX < 0) continue;
				if (YY < 0) continue;
				if (getMapInfo(XX, YY, depth) === equipped) continue;
				
				queue.push([ time + 1, XX, YY, equipped ]);
			}
		}
	};
	
	result[0] = riskLevel;
	result[1] = findBestTime();
	
	callback(result);
});