let onmessagefunc = (func) => {
	return e => {
		switch (e.data.msg) {
			case 'init': {
				postMessage({
					msg: 'init'
				});
			} break;
			
			case 'execute': {
				func(e.data.input, (result) => {
					postMessage({
						msg: 'result',
						result: result,
						finished: true
					});
				});
			} break;
			
			default: {
				console.log(e.data.msg);
			} break;
		}
	};
};