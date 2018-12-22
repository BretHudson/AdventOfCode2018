const IS_TOUCH_DEVICE = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);

let daysCompleted = 21;

let logID = 0;
let container, logs, inputField;

let commandHistory = [];
let commandIndex = -1;
let commandIncrement = 1;

let minYear = 2015;
let maxYear = (new Date(Date.now() + 30 * 8.64e7)).getFullYear() - 1;

let loglog = [];

let worker = null;
let workerDay = null;
let workerResolve = null;
let result = [ 'null', 'null' ];
let openWorker = (id, input) => {
	workerDay = id;
	setInputDisabled(true);
	closeWorker();
	console.log('opening worker', id);
	worker = new Worker('./js/day/' + id + '.js');
	worker.onmessage = (e) => {
		switch (e.data.msg) {
			case 'init': {
				addLog('output',
					`Switched to [c:white]day ${id}[/c]`,
					`\nType [c:gray]input[/c], [c:gray]view source[/c], or [c:gray]exit[/c].`);
				workerResolve(true);
				setInputDisabled(false);
			} break;
			
			case 'loading': {
				
			} break;
			
			case 'result': {
				loadingBar.finish();
				result = e.data.result;
				window.requestAnimationFrame(() => {
					
					addLog('output', `Part 1: ${e.data.result[0]}`);
					addLog('output-more', `Part 2: ${e.data.result[1]}`);
					addLog('empty', '');
					addLog('output-more',
						'Type [c:gray]copy 1[/c] or [c:gray]copy 2[/c] to copy an answer to your clipboard.',
						'\nOtherwise type [c:gray]input[/c] for another round, [c:gray]view source[/c], or [c:gray]exit[/c] to exit this day.');
					
					workerResolve(true);
					
					workerResolve = workerLoading = null;
					dayContext.state = DAY_STATE.DEFAULT;
					
					setInputDisabled(false);
				});
			} break;
		}
	};
	worker.postMessage({ msg: 'init' });
};

let executeWorker = (input, resolve) => {
	setInputDisabled(true);
	workerResolve = resolve;
	loadingBar.start();
	worker.postMessage({
		msg: 'execute',
		input: input
	});
};

let closeWorker = () => {
	if (worker !== null) {
		worker.terminate();
		worker = null;
	}
};

// TODO(bret): [c:gray] error on multi-line inputs

// TODO(bret): INTERNET EXPLORER JUST TELL THEM IT DOESN'T WORK

let handleKey = (e) => {
	switch (e.keyCode) {
		case 9: {
			e.preventDefault();
			// TODO(bret): Handle tab
		} break;
		
		case 13: {
			e.preventDefault();
			// TODO(bret): Disable this while it's processing the last command?
			let command = inputField.value;
			inputField.value = '';
			sendCommand(command);
		} break;
		
		case 27: {
			inputField.value = '';
			commandIncrement = 0;
			// TODO(bret): Alter commandIndex? Or handle it elsewhere?
			// Ah, have commendIncrement and set it to 0, then set it to 1 on up/down
		} break;
	}
};

const keepInputFocused = () => inputField.blur();
const randomNumber = () => Math.floor(Math.random() * 100000) % Math.floor(Math.random() * 100000);

const STR_ERROR_RED = '[c::red]Error[/c]';
const STR_ERROR_GRAY = '[c::gray]Error[/c]';
const STR_SUCCESS = '[c::green]Success[/c]';
const STR_INFO = '[c::blue]Info[/c]';
const STR_WARNING = '[c::yellow]Warning[/c]';

class Context {
	init() {
		
	}
	
	processCommand(command, parts, resolve) {
		switch (command) {
			case 'all': {
				addLog('output', 'Display all commands');
			} break;
			
			case 'ascii': {
				addLog('output', 'Credits to [https://asciiart.website/index.php?art=holiday/christmas/other](asciiart.website) for the banner ASCII art.');
			} break;
			
			case 'cls':
			case 'clear': {
				clearLogs();
			} break;
			
			case 'exit':
			case 'close': {
				addLog('output', 'There is no escape.');
			} break;
			
			case 'colors': {
				addLog('output',
					`\n${STR_INFO} Keep golden`,
					`\n[c:blue]Team Blue Comin\' At Ya`,
					
					`\n${STR_SUCCESS} Whoo!`,
					`\n[c:green]Team Green Comin\' At Ya`,
					
					`\n${STR_WARNING} Don\'t test me`,
					`\n[c:yellow]Team Yellow Comin\' At Ya`,
					
					`\n[c:orange]Team Orange Comin\' At Ya`,
					
					`\n${STR_ERROR_RED} F#@&`,
					`\n[c:red]Team Red Comin\' At Ya`,
					
					`\n${STR_ERROR_GRAY} Because why not?`,
					`\n[c:gray]Team Gray Comin\' At Ya`
				);
			} break;
			
			case 'echo': {
				addLog('output-strict', parts.slice(1).join(' '));
			} break;
			
			case 'format': {
				if (parts.length < 2) {
					addLog('output',
						`${STR_ERROR_RED} Please enter [c:gray]condensed[/c] or [c:gray]expanded[/c] as an argument.`);
					break;
				}
				
				switch (parts[1]) {
					case 'c':
					case 'condensed': {
						container.addClass('condensed');
						sessionStorage.setItem('format', 'condensed');
						addLog('output',
							`${STR_SUCCESS} Format set to condensed.`);
					} break;
					
					case 'e':
					case 'expanded': {
						container.removeClass('condensed');
						sessionStorage.setItem('format', '');
						addLog('output',
							`${STR_SUCCESS} Format set to expanded.`);
					} break;
					
					default: {
						addLog('output',
						`${STR_ERROR_RED} Please enter [c:gray]condensed[/c] or [c:gray]expanded[/c] as an argument.`);
					} break;
				}
			} break;
			
			case 'hi':
			case 'hello':
			case 'hallo':
			case 'hey':
			case 'howdy':
			case 'hola':
			case 'hej':
			case 'hei': {
				addLog('output', 'Hi!');
			} break;
			
			case 'goto': {
				let targetYear = +parts[1];
				if (targetYear === 2018)
					addLog('output', `${STR_ERROR_GRAY} You're already at Bret Hudson's Advent of Code 2018!`);
				else if ((targetYear >= minYear) && (targetYear <= maxYear)) {
					addLog('output', `Redirecting to Bret Hudson's Advent of Code ${targetYear}`);
					window.setTimeout(() => {
						window.location.assign(`https://brethudson.github.io/AdventOfCode${targetYear}/`);
					}, 2000);
				} else
					addLog('output', `${STR_ERROR_RED} ${targetYear} is out of bounds!`);
			} break;
			
			case '?':
			case 'h':
			case 'help': {
				addLog('output', 'HELP COMING SOON!');
			} break;
			
			case 'long': {
				let str = [
					'Here is a long message that will go over multiple lines - I sure hope it all works out alright!',
					'Here we go! WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
					'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW'
				];
				if (parts.length > 1) {
					if ((parts[1] >= 0) && (parts[1] < str.length))
						addLog('output', str[parts[1]]);
					else
						addLog('output', `${STR_ERROR_RED} x must be between 0 and ${str.length - 1}`);
				} else {
					for (let s = 0; s < str.length; ++s) {
						addLog('output', str[s]);
					}
				}
			} break;
			
			default: {
				return false;
			} break;
		}
		return true;
	}
	
	exit() {
		
	}
}

class MainContext extends Context {
	init(id) {
		addLog('output', `Exited day ${id}`);
	}
	
	async processCommand(command, parts, resolve) {
		switch (command) {
			case 'load': {
				let promise = null;
				loadingBar.start();
				setTimeout(() => {
					loadingBar.set(100);
					resolve(true);
				}, 5000);
			} break;
			
			case 'day': {
				// TODO(bret): Make sure it's a valid day!
				let day = +parts[1];
				if ((day > 0) && (day <= daysCompleted)) {
					switchContext(dayContext, +parts[1]);
					workerResolve = resolve;
				} else {
					// TODO(bret): Write an error
					resolve(true);
				}
			} break;
			
			case 'how': {
				addLog('output', 'This site was created using HTML, CSS, and JavaScript/ES6. Source code is available on [https://github.com/BretHudson/AdventOfCode2018/](GitHub).');
				resolve(true);
			} break;
			
			// Shiloh was here
			case 'shiloh': {
				addLog('output', ':/');
				resolve(true);
			} break;
			
			case 'source':
			case 'view': {
				addLog('output', 'The source for this site can be found on [https://github.com/BretHudson/AdventOfCode2018/](GitHub).');
				resolve(true);
			} break;
			
			case 'welcome': {
				printWelcome();
				resolve(true);
			} break;
			
			case 'what': {
				addLog('output', 'This site is a command line/terminal with [https://brethudson.com](Bret Hudson)\'s solutions for [https://adventofcode.com/2018](Advent of Code 2018).');
				resolve(true);
			} break;
			
			case 'when': {
				addLog('output', 'December 2018.');
				resolve(true);
			} break;
			
			case 'where': {
				setInputDisabled(true);
				let id = addLog('output-ascii', ' ');
				let str = '.';
				let period = 750;
				let interval = setInterval(() => {
					updateLog(id, str);
					str += '.'
				}, period);
				setTimeout(() => {
					clearInterval(interval);
					setInputDisabled(false);
					resolve(true);
				}, period * 3.9);
			} break;
			
			case 'who': {
				addLog('output', 'This site was created by [https://brethudson.com](Bret Hudson).');
				resolve(true);
			} break;
			
			case 'why': {
				addLog('output', 'This site was created for [https://adventofcode.com/2018](Advent of Code 2018).');
				resolve(true);
			} break;
			
			default: {
				resolve(super.processCommand(command, parts, resolve));
			} break;
		}
	}
}

let DAY_STATE = {
	DEFAULT: 0,
	INPUT: 1,
};
class DayContext extends Context {
	constructor() {
		super();
		this.state = DAY_STATE.DEFAULT;
	}
	
	init(id) {
		openWorker(id);
	}
	
	async processCommand(command, parts, resolve) {
		switch (this.state) {
			case DAY_STATE.INPUT: {
				executeWorker(parts.join(' '), (val) => {
					resolve(val);
				});
			} break;
			
			default: {
				switch (command) {
					case 'load': {
						loadingBar.start();
						setTimeout(() => {
							loadingBar.set(100);
							resolve(true);
						}, 1000);
					} break;
					
					case 'copy': {
						let id = +parts[1];
						if ((id === 1) || (id === 2)) {
							let str = result[id - 1] || '';
							copyToClipboard(str);
							addLog('output', `Copied "[c:gray]${str}[/c]" to clipboard.`);
						} else {
							// write out some error
						}
						
						resolve(true);
					} break;
					
					case 'exit': {
						switchContext(mainContext, workerDay);
						workerDay = null;
						resolve(true);
					} break;
					
					case 'input': {
						addLog('output-more', `Please insert your [c:white]input[/c]:`);
						this.state = DAY_STATE.INPUT;
						resolve(true);
					} break;
					
					case 'source':
					case 'view': {
						addLog('output', `[https://github.com/BretHudson/AdventOfCode2018/blob/master/js/day/${workerDay}.js](Day ${workerDay} Source).`);
						resolve(true);
					} break;
					
					default: {
						resolve(super.processCommand(command, parts, resolve));
					} break;
				}
			} break;
		}
	}
}

let setInputDisabled = (disabled) => {
	if (disabled) {
		window.requestAnimationFrame(() => {
			inputField.disabled = true;
			inputField.container.addClass('disabled');
		});
	} else {
		inputField.disabled = false;
		inputField.container.removeClass('disabled');
		window.requestAnimationFrame(() => {
			inputField.focus();
		});
	}
};

let updateLog = (id, str, append = false) => {
	if (append)
		document.q(`.log[id=log-${id}] span`).textContent += str;
	else
		document.q(`.log[id=log-${id}] span`).textContent = str;
};

class LoadingBar {
	constructor() {
		this.icons = '\\|/-';
		this.curIcon = 0;
	}
	
	start(infinite = true) {
		this.id = addLog('output', '');
		this.percent = 0;
		if (infinite)
			this.mask = '???';
		this.startTime = (new Date()).getTime();
		this.interval = setInterval(() => {
			if (infinite) {
				this.percent += 5;
				if (this.percent > 100)
					this.percent = 0;
			}
			this.draw();
		}, 200);
		setInputDisabled(true);
		this.draw();
	}
	
	draw() {
		let solid = Math.floor(this.percent / 5);
		let str = '[' + '#'.repeat(solid);
		if (this.percent < 100)
			str += this.icons[this.curIcon];
		str += '.'.repeat(Math.max(0, 19 - solid)) + `] ${this.mask || this.percent}%`;
		updateLog(this.id, str);
		this.curIcon = (this.curIcon + 1) % 4;
	}
	
	set(percent) {
		if (percent === 100) {
			this.finish();
		}
	}
	
	drawElapsed() {
		let elapsed = (new Date()).getTime() - this.startTime;
		addLog('output-more', `Execution took approximately ${(elapsed / 1000).toFixed(3)}s`);
		addLog('empty', '');
	}
	
	finish() {
		clearInterval(this.interval);
		this.mask = '100';
		this.percent = 100;
		this.draw();
		this.drawElapsed();
		setInputDisabled(false);
	}
}

let loadingBar = new LoadingBar();

let mainContext = new MainContext();
let dayContext = new DayContext();
let curContext = mainContext;

let switchContext = (context, id = null) => {
	if (curContext !== context) {
		curContext.exit();
		curContext = context;
		curContext.init(id);
	}
}

let sendCommand = async (str) => {
	str = str.trim();
	
	addLog('input', (str.length > 67) ? (str.substring(0, 67) + '...') : str);
	
	if (str === '') {
		addLog('empty', '');
		return;
	}
	
	parts = str.toLowerCase().split(' ');
	command = parts[0];
	
	let processPromise = new Promise((resolve, reject) => {
		curContext.processCommand(command, parts, resolve);
	});
	
	let recognized = await processPromise;
	if (recognized === false)
		didNotRecognizeLog();
	
	addLog('empty', '');
	
	// Add to history
	commandHistory.push(str);
	commandIndex = -1;
};

let didNotRecognizeLog = () => {
	command = command.substring(0, 20);
	if (command.length === 20) command += '...';
	addLog('output', `${STR_ERROR_GRAY} Did not recognize [c:gray]${command}[/c] as a command. Type [c:gray]help[/c] for assistance.`);
};

let copyToClipboard = (str) => {
	inputField.value = str;
	inputField.select();
	document.execCommand('copy');
	inputField.blur();
	inputField.value = '';
};

let clearLogs = () => {
	window.requestAnimationFrame(() => {
		for (; logs.firstChild; logs.removeChild(logs.firstChild));
		logID = 0;
		saveLogs();
	});
};

let addLog = (type, ...contents) => {
	let date = new Date();
	let dateArr = [ date.getHours(), date.getMinutes(), date.getSeconds() ];
	let dateStr = dateArr.map(str => ('0' + str).slice(-2)).join(':');
	let id = logID++;
	
	let log = $new('.log.' + type).id('log-' + id).attr('data-time', dateStr);
	if (type !== 'input') {
		log.init(div => {
			div.innerHTML = div.innerHTML.replace(/\[([\w\s\:\/\.\?=]+)\]\(([\w\s\.]+)?\)/g, (match, url, text) => `<a href="${url}">${text}</a>`);
		});
	}
	
	while (contents.length > 0) {
		let cur = contents.shift();
		let child;
		
		if (cur.substring(0, 1) === '\n') {
			cur = cur.substring(1);
			writeLog(log.element());
			while (cur.substring(0, 1) === '\n') {
				cur = cur.substring(1);
				addLog('empty', '');
			}
			contents.unshift(cur);
			addLog(type.replace('-more', '') + '-more', ...contents);
			return id;
		}
		
		let colors = { text: null, back: null };
		let colorRegex = /\[c:(\w+)?(?:\:(\w+))?\]([^[\[\]]+)?(\[\/c\])?/;
		let colorMatch = colorRegex.exec(cur);
		
		if (type !== 'input') {
			if (colorMatch !== null) {
				let parts = cur.split(colorMatch[0]);
				if (parts[0] !== '') {
					cur = parts[0];
					if (parts[1] !== '')
						contents.unshift(parts[1]);
					contents.unshift(colorMatch[0]);
				} else {
					colors.text = colorMatch[1];
					colors.back = colorMatch[2];
					cur = cur.replace(colorMatch[0], colorMatch[3]);
					if (parts[1] !== '') {
						cur = cur.replace(parts[1], '');
						contents.unshift(parts[1]);
					}
				}
			}
		}
		
		let className = '';
		if (colors.text !== null) className += ' c_' + colors.text;
		if (colors.back !== null) className += ' b_' + colors.back;
		if (type === 'empty') className += ' space';
		child = $new('span').class(className).text(cur);
		
		log.child(child);
	}
	
	writeLog(log.element());
	
	keepInputFocused();
	
	return id;
};

let saveLogs = () => {
	sessionStorage.setItem('logs', JSON.stringify(logs.innerHTML));
};

let printWelcome = () => {
	addLog('output-ascii',
`\n                                                                      `,
`\n                                ,....,                                `,
`\n                             ,;;:o;;;o;;,                             `,
`\n      *                    ,;;o;'''''';;;;,                    *      `,
`\n     /.\\         .-.      ,;:;;        ;;o;,      .-.         /.\\     `,
`\n    /.'.\\      _( " )_    ;o;;          ;;;;    _( " )_      /.'.\\    `,
`\n    /'.'\\     (_  :  _)   ;;o;          ;;o;   (_  :  _)     /.'.\\    `,
`\n   /.''.'\\      / ' \\     ';;;,  _  _  ,;;;'     / ' \\      /'..'.\\   `,
`\n   /.'.'.\\     (_/^\\_)     ';o;;/_\\/_\\;;o;'     (_/^\\_)     /.'.'.\\   `,
`\n  /'.''.'.\\                  ';;\\_\\/_/;;'                  /.'.''.'\\  `,
`\n  ^^^[_]^^^                     '//\\\\'                     ^^^[_]^^^  `,
`\n                                |/  \\|                                `);
	addLog('empty', '');
	
	addLog('output', `[c:white]Welcome to my[/c] [c:red]Advent of Code 2018[/c] [c:white]solutions![/c]`);
	addLog('empty', '');
	
	addLog('output-more', 'My name is [c:orange]Bret Hudson[/c], and this site houses my solutions to the [https://adventofcode.com/2018](Advent of Code 2018) challenge written in [c:yellow]JavaScript/ES6[/c].');
	addLog('empty', '');
	
	addLog('output-more', 'This site works best on [c:blue]G[/c][c:red]o[/c][c:yellow]o[/c][c:blue]g[/c][c:green]l[/c][c:red]e[/c] [c:yellow]Chrome[/c].');
	addLog('empty', '');
	
	addLog('output-more', 'If you reload the page, or navigate away, your logs will be saved. :)');
	addLog('empty', '');
	
	addLog('output-more', `Lost? Type [c:gray]help[/c] and hit enter in the textbox below.`);
};

let readLogs = () => {
	let logsData = sessionStorage.getItem('logs');
	logs.innerHTML = (logsData !== null) ? JSON.parse(logsData) : '';
	if (logs.innerHTML === '') {
		printWelcome();
		addLog('empty', '');
	} else
		logID = 1 + +logs.lastChild.id.replace('log-', '');
	
	logs.q('.input').each(log => {
		commandHistory.unshift(log.firstChild.textContent);
	});
};

let writeLog = (log) => {
	logs.appendChild(log);
	saveLogs();
};

let resize = () => {
	inputField.style.height = 'auto';
	inputField.style.height = inputField.scrollHeight + 'px';
};

let delayResize = () => {
	window.setTimeout(resize, 0);
};

document.on('DOMContentLoaded', (e) => {
	container = document.q('#container');
	logs = document.q('#logs');
	inputField = document.q('#input-field');
	inputField.container = inputField.parentElement.parentElement;
	
	readLogs();
	container.classList += ' ' + sessionStorage.getItem('format');
	
	let focusOnInputField = (e) => {
		e.preventDefault();
		window.requestAnimationFrame(() => inputField.focus());
	};
	
	inputField.on('change', resize);
	inputField.on('cut', delayResize);
	inputField.on('paste', delayResize);
	inputField.on('drop', delayResize);
	inputField.on('keydown', delayResize);
	inputField.on('keydown', handleKey);
	inputField.on('blur', focusOnInputField);
});

let setInputToCommandHistory = (history, index) => {
	if (index === -1) return;
	let newValue = history[index];
	if (newValue === inputField.value) return;
	
	window.requestAnimationFrame(() => {
		inputField.value = newValue;
		inputField.blur();
		window.setTimeout(() => {
			inputField.setSelectionRange(newValue.length, newValue.length);
		}, 0);
	});
};

window.on('keydown', (e) => {
	switch (e.keyCode) {
		case 38: {
			e.preventDefault();
			if (commandIndex === -1)
				commandIndex = commandHistory.length - 1;
			else
				commandIndex = Math.max(commandIndex - commandIncrement, 0);
			setInputToCommandHistory(commandHistory, commandIndex);
			commandIncrement = 1;
		} break;
		
		case 40: {
			e.preventDefault();
			if (commandIndex >= 0)
				commandIndex = Math.min(commandIndex + commandIncrement, commandHistory.length - 1);
			setInputToCommandHistory(commandHistory, commandIndex);
			commandIncrement = 1;
		} break;
	}
});