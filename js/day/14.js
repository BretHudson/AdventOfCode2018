importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	let recipes = [ 3, 7 ];
	let elf1 = 0, elf2 = 1;
	
	let numChar = input.length;
	
	let simulate = (n) => {
		for (let i = 0; recipes.length < n; ++i) {
			let newRecipes = ('' + (recipes[elf1] + recipes[elf2])).split('').map(val => +val);
			for (let r = 0; r < newRecipes.length; ++r) {
				recipes.push(newRecipes[r]);
				if (input === recipes.slice(-numChar).join('')) {
					result[1] = recipes.length - numChar;
					return;
				}
			}
			
			elf1 = (elf1 + 1 + recipes[elf1]) % recipes.length;
			elf2 = (elf2 + 1 + recipes[elf2]) % recipes.length;
		}
	};
	
	simulate(+input + 10);
	result[0] = recipes.slice(-10).join('');
	
	while (result[1] === null)
		simulate(recipes.length + 1000000);
	
	callback(result);
});