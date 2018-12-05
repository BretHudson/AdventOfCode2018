importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let records = input.split('\n').sort((a, b) => a.localeCompare(b));
	let guards = {};
	
	let curGuard = null;
	let sleepStartMinute = null;
	records.forEach(record => {
		let [timestamp, log] = record.split('] ');
		log = log.split(' ');
		let h = +timestamp.substring(12, 14);
		let m = +timestamp.substring(15, 17);
		if (h === 23) m -= 60;
		switch (log[0]) {
			case 'Guard': {
				if (sleepStartMinute !== null)
					console.warn('oh fuck');
				curGuard = +log[1].substring(1);
				guards[curGuard] = (guards[curGuard] || {
					id: curGuard,
					minutesAsleep: 0,
					schedule: new Array(60).fill(0)
				});
			} break;
			
			case 'falls': {
				sleepStartMinute = m;
			} break;
			
			case 'wakes': {
				for (let mm = sleepStartMinute; mm < m; ++mm) {
					++guards[curGuard].schedule[mm];
					++guards[curGuard].minutesAsleep;
				}
				sleepStartMinute = null;
			} break;
		}
	});
	
	for (let [id, guard] of Object.entries(guards)) {
		guard.schedule = guard.schedule.map((val, index) => { return { m: index, t: val }; }).sort((a, b) => Math.sign(b.t - a.t));
	}
	
	let sleepiestGuard = Object.values(guards).sort((a, b) => b.minutesAsleep - a.minutesAsleep)[0];
	let mostOftenAsleep = Object.values(guards).sort((a, b) => b.schedule[0].t - a.schedule[0].t)[0];
	
	result[0] = sleepiestGuard.id * sleepiestGuard.schedule[0].m;
	result[1] = mostOftenAsleep.id * mostOftenAsleep.schedule[0].m;
	
	callback(result);
});