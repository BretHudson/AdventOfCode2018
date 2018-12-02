importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let values = input.split('\n').map(val => Number(val));
	
	let doRounds = () => {
		let freqList = { 0: 1 };
		let acc = 0;
		for (let i = 0; ; ++i) {
			acc += values[i % values.length];
			if (freqList[acc] !== undefined)
				return acc;
			freqList[acc] = 1;
		}
	}
	
	result[0] = values.reduce((acc, val) => acc + val, 0);
	result[1] = doRounds();
	
	callback(result);
});