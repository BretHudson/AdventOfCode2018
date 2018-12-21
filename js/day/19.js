importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let lines = input.split('\n');
	let instructions = lines.slice(1).map(v => v.split(' ').map(v => (isNaN(v)) ? v : +v));
	
	let registers, ip;
	let resetRegisters = (register0) => {
		registers = Array.from({ length: 6 }).map(val => 0);
		registers[0] = register0;
		ip = +lines[0].split(' ')[1];
	};
	
	let OPCODES = {
		addr: (registers, A, B, C) => { registers[C] = registers[A] + registers[B]; },
		addi: (registers, A, B, C) => { registers[C] = registers[A] + B; },
		mulr: (registers, A, B, C) => { registers[C] = registers[A] * registers[B]; },
		muli: (registers, A, B, C) => { registers[C] = registers[A] * B; },
		banr: (registers, A, B, C) => { registers[C] = registers[A] & registers[B]; },
		bani: (registers, A, B, C) => { registers[C] = registers[A] & B; },
		borr: (registers, A, B, C) => { registers[C] = registers[A] | registers[B]; },
		bori: (registers, A, B, C) => { registers[C] = registers[A] | B; },
		setr: (registers, A, B, C) => { registers[C] = registers[A]; },
		seti: (registers, A, B, C) => { registers[C] = A; },
		gtir: (registers, A, B, C) => { registers[C] = +(A > registers[B]); },
		gtri: (registers, A, B, C) => { registers[C] = +(registers[A] > B); },
		gtrr: (registers, A, B, C) => { registers[C] = +(registers[A] > registers[B]); },
		eqir: (registers, A, B, C) => { registers[C] = +(A === registers[B]); },
		eqri: (registers, A, B, C) => { registers[C] = +(registers[A] === B); },
		eqrr: (registers, A, B, C) => { registers[C] = +(registers[A] === registers[B]); }
	};
	
	let execute = (part) => {
		resetRegisters(part - 1);
		while ((registers[ip] >= 0) && (registers[ip] < instructions.length)) {
			let instr = instructions[registers[ip]];
			OPCODES[instr[0]](registers, instr[1], instr[2], instr[3]);
			registers[ip] += 1;
			
			if (registers[ip] === 1) {
				let number = registers.reduce((acc, val) => Math.max(acc, val), 0);
				registers[0] = 0;
				for (let i = 1; i <= number; ++i) {
					if (number % i === 0)
						registers[0] += i;
				}
				break;
			}
		};
	};
	
	for (let part = 1; part <= 2; ++part) {
		execute(part);
		result[part - 1] = registers[0];
	}
	
	callback(result);
});