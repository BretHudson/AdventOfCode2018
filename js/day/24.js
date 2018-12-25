importScripts('./../baseWorker.js');
onmessage = onmessagefunc((input, callback) => {
	let result = [ null, null ];
	
	const effThenInitSort = (a, b) => (b.effPower - a.effPower) ? (b.effPower - a.effPower) : (b.initiative - a.initiative);
	
	let getTotalHealth = (army) => {
		let total = 0;
		for (let group of army.groups)
			total += group.units;
		return total;
	};
	
	let execute = (boost) => {
		let armies = input.split('\n\n');
		
		let groups = [];
		
		armies = armies.map(army => {
			let groups = army.split('\n');
			return { name: groups.splice(0, 1)[0].replace(':', ''), groups: groups };
		});
		
		let regex = /(\d+) units each with (\d+) hit points \(?([\w\s;,]+)?\)? ?with an attack that does (\d+) ([\w]+) damage at initiative (\d+)/;
		let regexImmune = /immune to ([\w\s,]+)/;
		let regexWeak = /weak to ([\w\s,]+)/;
		
		const getEffPower = (unit) => unit.attack * unit.units;
		
		armies.forEach((army, index) => {
			enemy = armies[1 - index];
			army.groups = army.groups.map((group, id) => {
				let [ str, units, hp, attributes, attack, attackType, initiative ] = regex.exec(group);
				
				if (attributes !== undefined)
					attributes = attributes.split('; ');
				
				let matches;
				let immunities = [];
				let weaknesses = [];
				for (let a = 0; attributes && (a < attributes.length); ++a) {
					matches = regexImmune.exec(attributes[a]);
					if (matches !== null)
						immunities = matches[1].split(', ');
					matches = regexWeak.exec(attributes[a]);
					if (matches !== null)
						weaknesses = matches[1].split(', ');
				}
				
				attack = (army.name === 'Immune System') ? (+attack + boost) : +attack;
				
				group = {
					initiative: +initiative,
					enemy: enemy,
					units: +units,
					hp: +hp,
					immunities: immunities,
					weaknesses: weaknesses,
					attack: attack,
					attackType: attackType,
					targetted: false
				};
				groups.push(group);
				return group;
			});
		});
		
		let last = getTotalHealth(armies[0]) + getTotalHealth(armies[1]);
		let immuneHealth, infectionHealth;
		for (;;) {
			for (let g = 0, n = groups.length; g < n; ++g) {
				let group = groups[g];
				group.targetted = false;
				group.effPower = group.attack * group.units;
			}
			
			groups.sort((a, b) => b.initiative - a.initiative);
			for (let army = 1; army >= 0; --army) {
				armies[army].groups.sort(effThenInitSort);
				for (let g = 0, n = armies[army].groups.length; g < n; ++g) {
					let group = armies[army].groups[g];
					group.target = null;
					if (group.units <= 0) continue;
					let enemies = group.enemy.groups;
					let effPower, bestPow = 1;
					for (let enemyGroup of enemies) {
						if (enemyGroup.targetted) continue;
						if (enemyGroup.units <= 0) continue;
						
						effPower = group.effPower;
						if (enemyGroup.immunities.indexOf(group.attackType) > -1)
							continue;
						
						if (enemyGroup.weaknesses.indexOf(group.attackType) > -1)
							effPower *= 2;
						
						if (bestPow === effPower) {
							group.target.push(enemyGroup);
						} else if (bestPow < effPower) {
							bestPow = effPower;
							group.target = [enemyGroup];
						}
					}
					
					if (group.target) {
						group.target = group.target.sort(effThenInitSort)[0];
						group.target.targetted = true;
					}
				}
			}
			
			groups.sort((a, b) => b.initiative - a.initiative);
			for (let g = 0, n = groups.length; g < n; ++g) {
				let group = groups[g];
				if (group.target === null) continue;
				if (group.target.immunities.indexOf(group.attackType) > -1)
					continue;
				
				let effPower = group.attack * group.units;
				if (group.target.weaknesses.indexOf(group.attackType) > -1)
					effPower *= 2;
				let attackAmount = effPower;
				group.target.units -= Math.min(group.target.units, Math.floor(attackAmount / group.target.hp));
			}
			
			immuneHealth = getTotalHealth(armies[0]);
			infectionHealth = getTotalHealth(armies[1]);
			if ((immuneHealth === 0) || (infectionHealth === 0))
				break;
			let total = immuneHealth + infectionHealth;
			if (last === total)
				break;
			last = total;
		}
		
		if (boost)
			return ((immuneHealth > 0) && (infectionHealth === 0)) ? immuneHealth : false;
		else
			return immuneHealth + infectionHealth;
	};
	
	result[0] = execute(0);
	for (let boost = 1; !(result[1] = execute(boost)); ++boost);
	
	callback(result);
});