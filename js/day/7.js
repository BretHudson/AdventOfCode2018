importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let steps = [];
	let stepsRecorded = [];
	
	const addStep = (step) => {
		if (stepsRecorded.indexOf(step) === -1) {
			stepsRecorded.push(step);
			steps.push({ step: step, depends: [], followers: [] });
		}
		return getStep(step);
	};
	
	const getStep = (step) => {
		for (let s = 0; s < steps.length; ++s) {
			if (steps[s].step === step)
				return steps[s];
		}
	};
	
	let regex = /Step (\w+) must be finished before step (\w+) can begin./;
	input.split('\n').forEach(line => {
		[ , a, b ] = regex.exec(line);
		addStep(a);
		addStep(b).depends.push(a);
	});
	
	steps = steps.sort((a, b) => {
		let diff = a.depends.length - b.depends.length;
		return (diff === 0) ? a.step.localeCompare(b.step) : diff;
	});
	
	let start = steps[0];
	let order = start.step;
	let queue = steps.filter(item => item.step !== start.step).sort((a, b) => a.step.localeCompare(b.step));
	while (queue.length > 0) {
		let caught = [];
		
		for (let i = 0; i < queue.length; ++i) {
			let cur = queue[i];
			if (cur.depends.reduce((acc, val) => acc && (order.indexOf(val) > -1), true)) {
				order += cur.step;
				caught.push(cur);
				queue.splice(i, 1);
				break;
			}
		}
	}
	
	for (let step of steps) {
		for (let d of step.depends) {
			getStep(d).followers.push(step);
		}
	}
	
	let finished = '';
	let queue2 = steps.filter(item => item.depends.length === 0);
	let baseCode = 'A'.charCodeAt(0) - 1;
	let workers = Array.from({ length: 5 }).map(val => { return { step: null, iter: 0 }; });
	let iter = -1;
	for (; finished.length < order.length; ++iter) {
		for (let worker of workers.filter(w => w.step !== null)) {
			if (--worker.iter === 0) {
				finished += worker.step.step;
				
				for (let f = 0; f < worker.step.followers.length; ++f) {
					let follower = worker.step.followers[f];
					if (follower.depends.reduce((acc, val) => acc && (finished.indexOf(val) > -1), true))
						queue2.push(follower);
				}
				
				worker.step = null;
			}
		}
		
		for (let worker of workers.filter(w => w.step === null)) {
			if (queue2.length === 0) break;
			worker.step = queue2.shift();
			worker.iter = 60 + worker.step.step.charCodeAt(0) - baseCode;
		}
	}
	
	result[0] = order;
	result[1] = iter;
	
	callback(result);
});