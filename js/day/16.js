importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let registers = Array.from({ length: 4 }).map(val => 0);
	
	let [ samples, testProgram ] = input.split('\n\n\n\n');
	
	let numOpcodes = 16;
	let OPCODES = {
		addr: 0, addi: 1,
		mulr: 2, muli: 3,
		banr: 4, bani: 5,
		borr: 6, bori: 7,
		setr: 8, seti: 9,
		gtir: 10, gtri: 11, gtrr: 12,
		eqir: 13, eqri: 14, eqrr: 15
	};
	
	samples = samples.split('\n\n').map(sample => { return { str: sample, opcode: null, potential: [] }; });
	
	let executeInstruction = (registers, O, A, B, C) => {
		switch (O) {
			case OPCODES.addr: { registers[C] = registers[A] + registers[B]; }		break;
			case OPCODES.addi: { registers[C] = registers[A] + B; }					break;
			case OPCODES.mulr: { registers[C] = registers[A] * registers[B]; }		break;
			case OPCODES.muli: { registers[C] = registers[A] * B; }					break;
			case OPCODES.banr: { registers[C] = registers[A] & registers[B]; }		break;
			case OPCODES.bani: { registers[C] = registers[A] & B; }					break;
			case OPCODES.borr: { registers[C] = registers[A] | registers[B]; }		break;
			case OPCODES.bori: { registers[C] = registers[A] | B; }					break;
			case OPCODES.setr: { registers[C] = registers[A]; }						break;
			case OPCODES.seti: { registers[C] = A; }								break;
			case OPCODES.gtir: { registers[C] = +(A > registers[B]); }				break;
			case OPCODES.gtri: { registers[C] = +(registers[A] > B); }				break;
			case OPCODES.gtrr: { registers[C] = +(registers[A] > registers[B]); }	break;
			case OPCODES.eqir: { registers[C] = +(A === registers[B]); }			break;
			case OPCODES.eqri: { registers[C] = +(registers[A] === B); }			break;
			case OPCODES.eqrr: { registers[C] = +(registers[A] === registers[B]); }	break;
		}
	};
	
	const regexB = /Before:\s+\[(\d+), (\d+), (\d+), (\d+)\]/;
	const regexI = /\n(\d+) (\d+) (\d+) (\d+)\n/;
	const regexA = /After:\s+\[(\d+), (\d+), (\d+), (\d+)\]/;
	const readSample = (sample) => [
		sample.str.match(regexB).splice(1).map(v => +v),
		sample.str.match(regexI).splice(1).map(v => +v),
		sample.str.match(regexA).splice(1).map(v => +v)
	];
	
	let stateMatches = (registers, after) => {
		for (let r = 0; r < 4; ++r) {
			if (registers[r] !== after[r])
				return false;
		}
		return true;
	};
	
	for (let sample of samples) {
		let [ before, instruction, after ] = readSample(sample);
		
		for (let op = 0; op < numOpcodes; ++op) {
			for (let r = 0; r < 4; ++r)
				registers[r] = before[r];
			
			sample.opcode = instruction[0];
			executeInstruction(registers, op, instruction[1], instruction[2], instruction[3]);
			
			if (stateMatches(registers, after))
				sample.potential.push(op);
		}
	}
	
	let samplesWith3OrMore = samples.filter(sample => sample.potential.length >= 3).length;
	
	let arrMissingSample = (arr, sample) => {
		for (let a of arr) {
			if (a.givenOpcode === sample.opcode)
				return false;
		}
		return true;
	};
	
	let realOpcodes = [];
	for (let i = 0; i < numOpcodes;) {
		let singlePotentialSamples = samples.filter(s => s.potential.length === 1).reduce((acc, sample) => {
			if (arrMissingSample(acc, sample)) {
				acc.push({
					givenOpcode: sample.opcode,
					opcode: sample.potential[0]
				});
			}
			return acc;
		}, []);
		
		for (let single of singlePotentialSamples) {
			let toRemove = single.opcode;
			realOpcodes[single.givenOpcode] = toRemove;
			samples.forEach(sample => {
				let index = sample.potential.indexOf(toRemove);
				if (index > -1)
					sample.potential.splice(index, 1);
			});
		}
		
		i += singlePotentialSamples.length;
	}
	
	registers = registers.map(val => 0);
	
	testProgram.split('\n').forEach(instr => {
		let [ O, A, B, C ] = instr.split(' ').map(v => +v);
		executeInstruction(registers, realOpcodes[O], A, B, C);
	});
	
	result[0] = samplesWith3OrMore;
	result[1] = registers[0];
	
	callback(result);
});