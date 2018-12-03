/*	https://github.com/09silverware/arena
	/AIs/HAL9000_01.js

	Hard-tabs, 4 spaces, LF, UTF-8
*/

/*
	AI made by ownez. Too much time spent on that bullshit.
*/


// TODO: solve the fact that the the defense is useless when non convex as it might throw ships away (use Graphs to move at borders).
// TODO: remeber the garrison at stations to anticipate attacks. Predict attack location. (not sure about if need that)
// TODO: rework on the danger evaluation  (use Graphs)
// TODO: rework on the defense evaluation (use Graphs)
// TODO: change the attack estimation (use Graphs)
// TODO: regroup fleets before attacks
// TODO: Modify and optimise the movement of scouts
// TODO: modify the way the AI chooses which base to go scout with a priority evaluation
// TODO: choose the most interesting (or endangered) base when you have extra scouts
// TODO: still send scout to bases if the enemy scout has just captured it
// TODO: Let an enemy capture a base to get free base without fight

let Ownez_initFn = ((data,step)=>{

	let d = data.data;

	//Debug setting
	d.verbose = true;
	d.vShipDeath = false && d.verbose;
	d.vShipCreation= false && d.verbose;

	d.vScoutUpdates = false && d.verbose;

	d.vDefenseStatus = false && d.verbose;

	d.vAttackStatus = false && d.verbose;

	d.unitTesting = true;
	d.logdata = true;
	d.logCounter = 0;
	d.logFrequency = 400;

	d.totalShipCreated = 0;


	d.scouts = [];
	d.scoutPercentage = 1;
	d.maxScoutToStationRatio = 10;
	d.scoutRoutineFreq = 101;
	d.scoutForce=false;
	d.scoutAmount = null;

	d.defenseFleet = [];
	d.defenceForce=false;
	d.defenceRoutineFreq = 100;
	d.dangerClose = 150; //distance at which an enemy ship is considered a threat.
	d.allyClose = 50; // distance at wich a allied ship is considered at the base.


	d.attackRoutineFreq = 150;
	d.attackForces = [];
	d.nbOfStationConsidered = 3; // potential targets considered
	d.closeEnemyShip = 50; // distance at which a ship is considered close.
	d.closeStationLimit = 200; //distance at which a station is considered within helping range.
	d.maximumAttackFleets = 3;


	d.oldStations = data.stations.yours; //This is used for the counterattack logic
	d.counterScanDistance = 150; //distance to scan for enemies for counter
});

let Ownez_updateFn = ((data,step)=>{

	if(data.stations.enemies.length==0){
		data.ships.yours.forEach((s)=>{
			s.target = data.stations.yours[0];
		});
	}

	let d = data.data;
	//logs Data if required.
	if(d.logdata&& step%d.logFrequency==0){
		console.log(data);
	}

	if(d.vDefenseStatus&&step%d.logFrequency==0){
			console.log(`Station with most danger : ${data.stations.yours[0].id}, danger rating : ${data.stations.yours[0].danger}`);
			console.log(`Station distance : ${data.stations.yours[0].closestEnemyBase}`);
			console.log(`Station local ships : ${data.stations.yours[0].localShips}`);
			console.log(`Station close enemy ships : ${data.stations.yours[0].closeShips}`);
		}

	//Cleanup verbose
	if(d.vShipDeath){
		d.scouts = d.scouts.filter((s)=>{
			if(s.destroyed){
				console.log(`Deleting ship ${s.id}`)
			}
			return !s.destroyed;
		});
		d.defenseFleet = d.defenseFleet.filter((s)=>{
			if(s.destroyed){
				console.log(`Deleting ship ${s.id}`)
			}
			return !s.destroyed;
		});
		d.attackForces = d.attackForces.map(function(f){
			return f.filter((s)=>{
				if(s.destroyed){
					console.log(`Deleting ship ${s.id}`)
				}
				return !s.destroyed;
			});
		});
		d.attackForces = d.attackForces.filter(function(f){return f.length!==0});
	}
	//Cleanup non verbose
	else{
		d.scouts = d.scouts.filter((s)=>{return !s.destroyed;});
		d.defenseFleet = d.defenseFleet.filter((s)=>{ return !s.destroyed});
		d.attackForces = d.attackForces.map(function(f){
			return f.filter((s)=>{return !s.destroyed});
		});
		d.attackForces = d.attackForces.filter(function(f){return f.length!==0});
	}


	//################ BuildLogic ##############
	// Ship creation.
	data.stations.yours.forEach(function(s){
		if(s.resources>100){
			if(d.vShipCreation){
				console.log(`Ordering ship creation`)
			}
			s.buildShip();
		}
	});

	// New ship detection
	let newShips = data.ships.yours.filter((s)=>{ if(!s.target){ s.target = null; return true; } return false; });
	d.totalShipCreated =  d.totalShipCreated+newShips.length;
	if(newShips.length>0){
		if(d.vShipCreation){
			console.log(`Ship created.`);
		}
		//Forces the defense mechanism to refresh.
		d.defenceForce = true;

		newShips.forEach(function(s){
			s.target=null;
			d.defenseFleet.push(s);
		});
	}

	//################## Expansion logic ##############

	//If there is no more targets disband the scouts.

	if (data.stations.unowned.length==0 && d.scouts.length>0){
		d.defenseFleet = d.defenseFleet.concat(d.scouts);
		d.scouts = [];
		if(d.vScoutUpdates){
			console.log("Disbanding scout forces");
		}
	}

	if((step%d.scoutRoutineFreq==0 || d.scoutForce)&&data.stations.unowned.length>0){
		d.scoutForce = false;


		// Disbands the previous scouts
		d.defenseFleet = d.defenseFleet.concat(d.scouts);
		d.scouts = [];

		//Calculate theoretical scout amount
		d.scoutAmount = Math.floor(Math.min(d.maxScoutToStationRatio*data.stations.unowned.length, d.defenseFleet.length*data.data.scoutPercentage));

		if(d.vScoutUpdates){
			console.log(`Scouts operational : ${d.scoutAmount}`);
		}

		// Orders the station from the closest to the original one.
		let closestUnowned = data.stations.unowned.sort((a,b)=>{return pd(a.x,a.y,data.stations.yours[0].x,data.stations.yours[0].y)-pd(b.x,b.y,data.stations.yours[0].x,data.stations.yours[0].y)})

		// Assign the closest ship.
		for(let i =0; (i<closestUnowned.length); i++){
			if (d.scoutAmount <= d.scouts.length){break;}
			d.defenseFleet = d.defenseFleet.sort((a,b)=>{return pd(closestUnowned[i].x,closestUnowned[i].y,a.x,a.y)-pd(closestUnowned[i].x,closestUnowned[i].y,b.x,b.y)});
			let ship = d.defenseFleet.shift();
			ship.target = closestUnowned[i];
			d.scouts.push(ship);
		}


	}

	// ########### Defense logic ############//
	// does this once in this.maxDefenseCounter frames.
	if (step%d.defenceRoutineFreq == 0 || d.defenceForce){
		d.defenceForce =false;

		//// Adds data in the station to calculate the danger level.
		data.stations.yours = data.stations.yours.map((s)=>{
			s.closestEnemyBase = 999999;
			data.stations.enemies.forEach((es)=>{//es = enemy station
				if(pd(s.x,s.y,es.x,es.y)<s.closestEnemyBase){
					s.closestEnemyBase = pd(s.x,s.y,es.x,es.y);
				}
			});

			s.closeShips = data.ships.enemies.filter((es)=>{return pd(s.x,s.y,es.x,es.y)<d.dangerClose}).length;
			s.localShips = d.defenseFleet.filter((as)=>{return pd(s.x,s.y,as.x,as.y)<d.allyClose}).length;

			s.danger = 1/Math.pow(((1+s.localShips)/(1+s.closeShips))*s.closestEnemyBase,2);
			return s;
		});


		let total = data.stations.yours.map((a)=>a.danger).reduce((a, b) => a + b, 0);

		//turn this into a percentage to make things easy.
		data.stations.yours = data.stations.yours.map(function(a){
			a.danger = a.danger/total;
			return a;
		});

		data.stations.yours = data.stations.yours.sort(function(a,b){return b.danger - a.danger});





		//// Get the ship amount for each station
		let totalShip = data.data.defenseFleet.length;

		data.stations.yours = data.stations.yours.map(function(a){
			a.shipAmount = Math.round(a.danger*totalShip);
			return a;
		});

		//// move the closest ships to the most prioritized station
		//the most prioritized station gets adressed first.
		let defenseFleetCopy = d.defenseFleet.slice();
		data.stations.yours.forEach((s)=>{
			defenseFleetCopy = defenseFleetCopy.sort(function(a,b){
				return pd(a.x,a.y, s.x,s.y)-pd(b.x,b.y, s.x,s.y);
			});
			for(let i =0; i<s.shipAmount; i++){
				if(defenseFleetCopy.length==0){break}
				defenseFleetCopy.shift().target = s;
			}

		});

		if(defenseFleetCopy.length>0){
			defenseFleetCopy.forEach(function(s){s.target = data.stations.yours[0]});
		}
	}

	// ########### Attack logic ############//

	// Disbanding old attack fleets :
	for (let i = 0; i<d.attackForces.length; i++){
		if (d.attackForces[i][0].target.faction==d.attackForces[i][0].faction){
			d.defenseFleet = d.defenseFleet.concat(d.attackForces[i]);
			d.attackForces[i] = [];
		}
	}


	if(step%d.attackRoutineFreq==0){
		//// Adds data in the station to get the closest station.
		data.stations.enemies = data.stations.enemies.map((s)=>{
			s.closestAlliedBase = 999999;
			data.stations.enemies.forEach((as)=>{//as = allied station
				if(pd(s.x,s.y,as.x,as.y)<s.closestEnemyBase){
					s.closestAlliedBase = pd(s.x,s.y,as.x,as.y);
				}
			});
			return s;
		});

		// Orders them
		data.stations.enemies = data.stations.enemies.sort(function(a,b){return b.closestAlliedBase - a.closestAlliedBase});

		// considers the first d.nbOfStationConsidered
		data.stations.enemies.slice(0,d.nbOfStationConsidered).forEach((s)=>{
			let closeShips = data.ships.enemies.filter((es)=>{return pd(es.x,es.y,s.x,s.y)<d.closeEnemyShip}).length;
			if(closeShips<d.defenseFleet.length*0.3 && d.attackForces.length< d.maximumAttackFleets){
				if(d.vAttackStatus){
					console.log(`Attacking with : ${Math.floor(d.defenseFleet.length*0.3)}`)
				}

				d.defenseFleet = d.defenseFleet.sort((a,b)=>{return pd(a.x,a.y,s.x,s.y)-pd(b.x,b.y,s.x,s.y)})
				let attackFleet = d.defenseFleet.splice(0,Math.floor(d.defenseFleet.length*0.3));
				attackFleet.forEach((ship)=>{ship.target = s;});
				d.attackForces.push(attackFleet);
			}
		});
	}


	if(d.unitTesting){
		//test if the list sizes corresponds
		if(d.scouts.length+d.defenseFleet.length+d.attackForces.map((a)=>a.length).reduce((a, b) => a + b, 0)!=data.ships.yours.length){
			throw `ERROR : Data.ships.yours and data.data ship mismatch : ${d.scouts.length+d.defenseFleet.length+d.attackForces.map((a)=>a.length).reduce((a, b) => a + b, 0)} != ${data.ships.yours.length}.`;
		}

		d.scouts.forEach((s)=>{
			if(s.destroyed){
				throw `ERROR : Ship id ${s.id} is destroyed but in scout list.`
			}
		});

		d.defenseFleet.forEach((s)=>{
			if(s.destroyed){
				throw `ERROR : Ship id ${s.id} is destroyed but in defense list.`
			}
		});

		d.attackForces.forEach((f)=>{
			f.forEach((s)=>{
				if(s.destroyed){
					throw `ERROR : Ship id ${s.id} is destroyed but in attack list.`
				}
			});
		});

		//Tests if all ships have targets.
		data.ships.yours.forEach((s)=>{
			if(s.target == null){
				throw `ERROR : Ship id ${s.id} has no target.`
			}
		});
	}

	// Moving ships.
	data.ships.yours.forEach(function(s){
		goto(s,s.target.x, s.target.y)

	})

	// shooting
	data.ships.yours.forEach((h)=>{
		let t = data.ships.enemies.filter((s)=>{
			return pd(h.x,h.y,s.x,s.y) <= h.weapon.distance + s.size;
		}).sort((a,b)=>{ return pd(a.x,a.y,h.x,h.y) - pd(b.x,b.y,h.x,h.y); });
		if(t.length && (t = t[t.length * data.random()**2 | 0])){
			h.shoot(pa(h.x,h.y,t.x,t.y));
		}
	});
});
