importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let values = input.split(' ').map(val => +val);
	
	let nodes = [];
	const createNode = (children, metadata, parent = null) => {
		let newNode = {
			letter: String.fromCharCode(65 + nodes.length),
			children: [],
			childCount: children,
			metadata: metadata,
			parent: parent,
			value: null
		};
		
		if (parent !== null)
			parent.children.push(newNode);
		
		nodes.push(newNode);
		
		return newNode;
	};
	
	let iter = 0;
	let cur = null;
	while (iter < values.length) {
		if ((cur !== null) && (cur.children.length === cur.childCount)) {
			cur.metadata = [...values.slice(iter, iter + cur.metadata)];
			iter += cur.metadata.length;
			cur = cur.parent;
		} else
			cur = createNode(values[iter++], values[iter++], cur);
	}
	
	let needValue, nullChild = { value: 0 };
	while ((needValue = nodes.filter(node => node.value === null)).length > 0) {
		for (let n = 0; n < needValue.length; ++n) {
			let node = needValue[n];
			for (let m = 0; m < node.metadata.length; ++m) {
				let metadata = node.metadata[m];
				if (node.childCount === 0)
					node.value = (node.value || 0) + metadata;
				else if (!node.children.some(node => node.value === null))
					node.value = (node.value || 0) + (node.children[metadata - 1] || nullChild).value;
			}
		}
	}
	
	result[0] = nodes.reduce((acc, node) => acc + node.metadata.reduce((acc, val) => acc + val), 0);
	result[1] = nodes[0].value;
	
	callback(result);
});