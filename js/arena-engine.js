/*	https://github.com/09silverware/arena
	/js/arena-engine.js

	Hard-tabs, 4 spaces, LF, UTF-8
*/

function MapGen_Triangles(N, rand){
	let ROT = Options.MapSettings.Rotation||0;
	let j = 0;
	let output = { stations:[], walls:[] };
	for(let i=0;i<N;i++){
		let x = 0 + 300 * Math.sin(i*2*Math.PI/N + ROT + Math.PI/6);
		let y = 0 - 300 * Math.cos(i*2*Math.PI/N + ROT + Math.PI/6);
		output.stations.push({x:x,y:y,faction:1+(j)%N});
			x = 0 + 300 * Math.sin(i*2*Math.PI/N + ROT);
			y = 0 - 300 * Math.cos(i*2*Math.PI/N + ROT);
		output.stations.push({x:x,y:y,faction:1+(j)%N});
			x = 0 + 300 * Math.sin(i*2*Math.PI/N + ROT - Math.PI/6);
			y = 0 - 300 * Math.cos(i*2*Math.PI/N + ROT - Math.PI/6);
		output.stations.push({x:x,y:y,faction:1+(j++)%N});
	}
	for(let i=0;i<N;i++){
		let x = 0 + 200 * Math.sin(i*2*Math.PI/N + ROT + Math.PI/6);
		let y = 0 - 200 * Math.cos(i*2*Math.PI/N + ROT + Math.PI/6);
		output.stations.push({x:x,y:y,faction:1+(j)%N});
			x = 0 + 200 * Math.sin(i*2*Math.PI/N + ROT - Math.PI/6);
			y = 0 - 200 * Math.cos(i*2*Math.PI/N + ROT - Math.PI/6);
		output.stations.push({x:x,y:y,faction:1+(j++)%N});
	}
	for(let i=0;i<N;i++){
		let x = 0 + 100 * Math.sin(i*2*Math.PI/N + ROT);
		let y = 0 - 100 * Math.cos(i*2*Math.PI/N + ROT);
		output.stations.push({x:x,y:y,faction:1+(j++)%N});
	}
	let ws = Options.MapSettings.WallSections || 32;
	let wr = Options.MapSettings.WallRadius || 350;
	let sa = Math.PI*2/ws;
	for(let i=0;i<ws;i++){
		let x1 = 0 + wr * Math.sin(i * sa);
		let y1 = 0 - wr * Math.cos(i * sa);
		let x2 = 0 + wr * Math.sin((i+1) * sa);
		let y2 = 0 - wr * Math.cos((i+1) * sa);
		output.walls.push([{x:x1,y:y1},{x:x2,y:y2}]);
	}
	return output;
}

function MapGen_SymSquare(NbFaction, rand){
	if(NbFaction!==2){
		throw new Error('This generator can only generate for 2 factions.')
	}

	let sizeX = 1000;
	let sizeY = 700;
	let minDistance = 100;

	let output = { stations:[], walls:[] };

	let ws = Options.MapSettings.WallSections || 32;
	let wr = Options.MapSettings.WallRadius || 350;
	// Creates the square wall
	output.walls.push([{x:-sizeX/2,y:-sizeY/2},{x:sizeX/2,y:-sizeY/2}]);
	output.walls.push([{x:-sizeX/2,y:-sizeY/2},{x:-sizeX/2,y:sizeY/2}]);
	output.walls.push([{x:-sizeX/2,y:sizeY/2},{x:sizeX/2,y:sizeY/2}]);
	output.walls.push([{x:sizeX/2,y:-sizeY/2},{x:sizeX/2,y:sizeY/2}]);

	//determines the amount of station
	let stationAmount = 13+Math.floor(10*rand());

	let failedAttemps = 0;
	for(let i=0; i<stationAmount; i++){
		//generates a possible station
		let possibleStation = {x:minDistance/2+(sizeX/2-0.5*minDistance)*rand(),y:minDistance/2+(sizeY-minDistance)*rand(),faction:0};

		//checks if there are stations under the minDistance
		let closeStations = output.stations.filter(function(s){return pd(possibleStation.x,possibleStation.y, s.x,s.y)<minDistance});

		if(closeStations.length==0){
			//It's okay its far enough
			output.stations.push(possibleStation);
		}
		else if(closeStations.length){
			//it's close to one station, let's try to project it out of it's range :
			let distance = pd(possibleStation.x,possibleStation.y, closeStations[0].x,closeStations[0].y)
			possibleStation.x = closeStations[0].x + (closeStations[0].x - possibleStation.x)*minDistance/distance;
			possibleStation.y = closeStations[0].y + (closeStations[0].y - possibleStation.y)*minDistance/distance;

			//check again and also if we are not out of bounds
			if (output.stations.filter(function(s){return pd(possibleStation.x,possibleStation.y, s.x,s.y)<minDistance}).length==0 && (possibleStation.x>minDistance || possibleStation.x<(sizeX - minDistance)/2 || possibleStation.y>minDistance || possibleStation<sizeY - minDistance)){
				output.stations.push(possibleStation);
			}
			else{
				i--;
				failedAttemps++
			}
		}
		else{
			// okay more than one station too close, fuck that.
			i--;
			failedAttemps++;
		}
		if(failedAttemps>10*stationAmount){
			throw new Error('Spent too much time in generator trying to make a dense playing zone. Try reducing the minDistance or increase the size of arena.')
		}
	}

	// let's do the central symmetry
	let tempLength = output.stations.length;
	for(let i = 0; i<tempLength; i++){
		let station = output.stations[i];
		let newStation = {x:0,y:0,f:0};
		newStation.x = sizeX - station.x;
		newStation.y = sizeY - station.y;
		output.stations.push(newStation);
	}

	// Let's add factions
	output.stations[0].faction=1;
	output.stations[output.stations.length/2].faction=2;
	// let's center our map
	output.stations = output.stations.map(function(s){
		s.x = s.x - sizeX/2;
		s.y = s.y - sizeY/2;
		return s;
	})
	return output;
}


let Options = {
	Seed: 1337,
	Gfx: {
		Explosions: false,	// Currently Not Implemented
		PrettyShots: true,
		PrettyWalls: true,
		Trails: 0,			// Currently Not Implemented
	},
	Game: {
		Collisions: false,
		FriendlyFire: false,
		ResourcesPerTick: 1,
		WallsDestroy: true,	// TODO: false will make ships bounce on walls
	},
	Speed: 1,
	Factions:[
		{
			name: 'Red Team',
			color: 0xff4727,
			ai:{
				initFn: ()=>{},
				updateFn: ()=>{},
			}
		},
		{
			name: 'Blue Team',
			color: 0x7070ff,
			ai:{
				initFn: ()=>{},
				updateFn: ()=>{},
			}
		},
	],
	MapGeneration: MapGen_SymSquare,
	MapSettings: {
		Rotation: 0,
		WallSections: 32,
		WallRadius: 400,
	}
};
let Restart;

(()=>{
	'use strict';
	// Entire Engine code is contained so that the AI can be given a small sandbox.
	// Quick research (read: a few google searches) shows that a "true" sandbox would need to be implemented in an iFrame
	// So eventually the AI will be spun into an iFrame and called, although this may be tricky

	function pointDistance(x,y,X,Y){ return ((x-X)**2+(y-Y)**2)**0.5; }
	function pointAngle(x,y,X,Y){ return Math.atan2(X-x,y-Y); }
	function lineCircleIntercept(x1,y1,x2,y2,cx,cy,cr){
		// Stolen from: https://stackoverflow.com/a/37225895
		let a,b,c,d,u1,u2,v1={},v2={};
		v1.x = x2 - x1; v1.y = y2 - y1;
		v2.x = x1 - cx; v2.y = y1 - cy;
		b = (v1.x*v2.x + v1.y*v2.y);
		c = 2 * (v1.x**2 + v1.y**2);
		b *= -2;
		d = Math.sqrt(b**2 - 2*c*(v2.x**2 + v2.y**2 - cr**2));
		if(isNaN(d)){ /*no intercept*/ return []; }
		u1 = (b - d) / c;  u2 = (b + d) / c; // these represent the unit distance of point one and two on the line
		let ret=[],retP1={},retP2={};
		if(u1 <= 1 && u1 >= 0){  // add point if on the line segment
			retP1.x = x1 + v1.x * u1;
			retP1.y = y1 + v1.y * u1;
			ret[0] = retP1;
		}
		if(u2 <= 1 && u2 >= 0){  // second add point if on the line segment
			retP2.x = x1 + v1.x * u2;
			retP2.y = y1 + v1.y * u2;
			ret[ret.length] = retP2;
		}
		return ret;
	}
	function lineLineIntersects(a,b,c,d,p,q,r,s){
		// Stole from: https://stackoverflow.com/a/24392281
		// returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
		var det, gamma, lambda;
		det = (c - a) * (s - q) - (r - p) * (d - b);
		if (det === 0) {
			return false;
		}
		else {
			lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
			gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
			return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
		}
	}
	function confirmColor(c){
		if(typeof c !== 'number'){ return false; }
		if(c>=0 && c<=0xffffff){ return c; }
		return false;
	}
	function removeFromArray(array,item){
		while(array.includes(item)){
			array.splice(array.indexOf(item),1);
		}
		return array;
	}
	function shuffle(array){
		if(!Array.isArray(array)){ return false; }
		var m = array.length, t, i, a=array.slice();
		while (m) {
			i = rand()*m--|0; t = a[m];
			a[m] = a[i]; a[i] = t;
		}
		return a;
	}
	const d90 = Math.PI/2;		// 90 Degrees in Radians
	const d2r = Math.PI/180;	// Multiply a Degrees value by this for Radians
	const _2e32 = 2**32;		// Max size of the random number generator's output

	Math.random = ()=>{ console.log('Math.random is prohibited in Arena; Redirecting to rand()'); return rand(); };

	let _rng = mtrand(Options.Seed);
	function rand(){ return _rng?_rng.next().value/_2e32:undefined; }

	const Renderer = new PIXI.autoDetectRenderer(document.body.clientWidth,document.body.clientHeight,{
		antialias:true,
		autoResize:true,
		backgroundColor:0x000000,
		view:document.getElementById('viewport'),
	});
	let FRAME = 0, STEP = 0, ID = 1;

	const Textures = {};{ // PreGenerated Textures
		let gfx = new PIXI.Graphics();
		gfx.lineStyle(1,0x555555,1);
		gfx.beginFill(0xffffff,1);
		gfx.drawCircle(5,5,3);
		gfx.endFill();
		Renderer.resize(7,7);
		Textures.ship = Renderer.generateTexture(gfx);

		gfx.clear();
		gfx.lineStyle(1,0x555555,1);
		gfx.beginFill(0xffffff,1);
		gfx.drawRect(0,0,10,10);
		gfx.endFill();
		gfx.rotation = Math.PI/2;
		Renderer.resize(10,10);
		Textures.station = Renderer.generateTexture(gfx);
	}
	const View = new PIXI.Container();
	View.addChild((View.Background = new PIXI.Graphics()));
	View.addChild((View.Gameplay = new PIXI.Container()));
	View.Gameplay.addChild((View.Gameplay.Walls = new PIXI.Container()));
	View.Gameplay.addChild((View.Gameplay.Stations = new PIXI.Container()));
	View.Gameplay.addChild((View.Gameplay.Explosions = new PIXI.Graphics()));
	View.Gameplay.addChild((View.Gameplay.Shots = new PIXI.Graphics()));
	View.Gameplay.addChild((View.Gameplay.Ships = new PIXI.Container()));
	View.addChild((View.Interface = new PIXI.Graphics()));

	View.Gameplay.Shots.blendMode = PIXI.BLEND_MODES.ADD;

	const Viewport = {
		cx: 0,
		cy: 0,
		scale: 1,
	};

	function drawBackground(){
		// TODO:
	}
	function drawTrail(x1,y1,x2,y2){
		// TODO:
	}
	function drawShot(x1,y1,x2,y2,c){
		// TODO: Implement better
		if(!Options.Gfx.PrettyShots){
			View.Gameplay.Shots.lineStyle(2,c,1);
			View.Gameplay.Shots.moveTo(x1,y1);
			View.Gameplay.Shots.lineTo(x2,y2);
		}
		else {
			View.Gameplay.Shots.lineStyle(4,c,0.33);
			View.Gameplay.Shots.moveTo(x1,y1);
			View.Gameplay.Shots.lineTo(x2,y2);
			View.Gameplay.Shots.lineStyle(2,c,1);
			View.Gameplay.Shots.moveTo(x1,y1);
			View.Gameplay.Shots.lineTo(x2,y2);
			View.Gameplay.Shots.lineStyle(0.5,0xffffff,0.66);
			View.Gameplay.Shots.moveTo(x1,y1);
			View.Gameplay.Shots.lineTo(x2,y2);
		}
	}

	class Explosion {
		constructor(x,y,v,size){
			// TODO:
		}
	}

	const factions = [];
	const stations = [];
	const ships = [];
	const walls = [];
	const objects = [];

	class AI {
		constructor(initFn,updateFn,faction){
			this.faction = faction;
			this.initFn = initFn || (()=>{});
			this.updateFn = updateFn || (()=>{});
			this.data = { QQ:111 };
			this._rng = new mtrand(rand());
			this.rand = function rand(){ return this._rng?this._rng.next().value/_2e32:undefined; }
		}
		init(){
			let data = {
				factions:{
					you: this.faction.id,
					allies: [],
					enemies: [],
				},
				ships:{
					yours:[],
					allies:[],
					enemies:[],
				},
				stations:{
					yours:[],
					allies:[],
					unowned:[],
					enemies:[],
				},
				walls:[],
				random:this.rand,
				data:this.data,
			};
			factions.forEach((f)=>{
				if(f==this.faction){
					// Nothing
				}
				else if(this.faction.allies.includes(f)){
					data.factions.allies.push(f.id);
				}
				else {
					data.factions.enemies.push(f.id);
				}
			});
			ships.forEach((s)=>{
				if(s.faction == this.faction){
					data.ships.yours.push(s.sandbox(this.faction));
				}
				else if(this.faction.allies.includes(s.faction)){
					data.ships.allies.push(s.sandbox(this.faction));
				}
				else {
					data.ships.enemies.push(s.sandbox(this.faction));
				}
			});
			stations.forEach((s)=>{
				if(s.faction == this.faction){
					data.stations.yours.push(s.sandbox(this.faction));
				}
				else if(this.faction.allies.includes(s.faction)){
					data.stations.allies.push(s.sandbox(this.faction));
				}
				else if(s.faction==null){
					data.stations.unowned.push(s.sandbox());
				}
				else {
					data.stations.enemies.push(s.sandbox(this.faction));
				}
			});
			walls.forEach((w)=>{
				data.walls.push(w.sandbox());
			});
			try {
				this.initFn(data);
			} catch(e) { console.log(e); }
		}
		update(){
			let data = {
				factions:{
					you: this.faction.id,
					allies: [],
					enemies: [],
				},
				ships:{
					yours:[],
					allies:[],
					enemies:[],
				},
				stations:{
					yours:[],
					allies:[],
					unowned:[],
					enemies:[],
				},
				walls:[],
				random:this.rand,
				data:this.data,
			};
			factions.forEach((f)=>{
				if(f==this.faction){
					// Nothing
				}
				else if(this.faction.allies.includes(f)){
					data.factions.allies.push(f.id);
				}
				else {
					data.factions.enemies.push(f.id);
				}
			});
			ships.forEach((s)=>{
				if(s.faction == this.faction){
					data.ships.yours.push(s.sandbox(this.faction));
				}
				else if(this.faction.allies.includes(s.faction)){
					data.ships.allies.push(s.sandbox());
				}
				else {
					data.ships.enemies.push(s.sandbox());
				}
			});
			stations.forEach((s)=>{
				if(s.faction == this.faction){
					data.stations.yours.push(s.sandbox(this.faction));
				}
				else if(this.faction.allies.includes(s.faction)){
					data.stations.allies.push(s.sandbox());
				}
				else if(s.faction==null){
					data.stations.unowned.push(s.sandbox());
				}
				else {
					data.stations.enemies.push(s.sandbox());
				}
			});
			walls.forEach((w)=>{
				data.walls.push(w.sandbox());
			});
			try {
				this.updateFn(data,STEP);
			} catch(e) { console.log(e); }
		}
	}
	class Faction {
		constructor(name,color,ai){
			this.id = ID++;
			this.name = name;
			this.color = confirmColor(color);
			this.allies = [];
			this.ships = [];
			this.stations = [];
			// Add the AI if it's an AI, create an AI if it was a function (assume the function is an updateFn), else dump a dummy AI
			this.ai = (ai instanceof AI?ai:(typeof ai == 'function'?new AI(null,ai,this):new AI(null,null,this)));
			this.ai.faction = this;

			factions.push(this);
		}
		destroy(){
			this._destroyed = true;
			this.ships.slice().forEach((s)=>{
				s.destroy();
			})
			this.stations.slice().forEach((s)=>{
				s.setFaction(null);
			})
			removeFromArray(factions,this);
		}
	}
	class Ship {
		constructor(x,y,v,f){
			if(!(f instanceof Faction)){ throw 'All ships must be in a faction'; }
			this.faction = f;

			this.gfx = new PIXI.Sprite(Textures.ship);
			this.gfx.tint = this.faction.color;
			this.gfx.anchor.x = 0.5;
			this.gfx.anchor.y = 0.5;
			View.Gameplay.Ships.addChild(this.gfx);

			this.x = x;
			this.y = y;
			this.v = {x:(v?v.x:0), y:(v?v.y:0)};
			this.t = {t:0, a:0};
			this.id = ID++;

			this.size = 3;
			this.acceleration = 0.025;
			this.weapon = {
				color: this.faction.color,
				distance: 100,
				reload: 60,
				refire: 6,
				maxClip: 5,
				accuracy: 10 * d2r,
				firing: 0,
				loading: 0,
				fireAt: null,
			};
			this.weapon.clip = this.weapon.maxClip;

			this.faction.ships.push(this);
			ships.push(this);
			objects.push(this);
		}
		get x(){ return this._x; }
		set x(v){ this.gfx.x = (this._x = v) * Viewport.scale; }
		get y(){ return this._y; }
		set y(v){ this.gfx.y = (this._y = v) * Viewport.scale; }
		sandbox(caller){
			return {
				id: this.id,
				faction: this.faction.id,
				x: this.x,
				y: this.y,
				v: {
					x: this.v.x,
					y: this.v.y
				},
				size: this.size,
				acceleration: this.acceleration,
				weapon: {
					distance: this.weapon.distance,
					reload: this.weapon.reload,
					refire: this.weapon.refire,
					maxClip: this.weapon.maxClip,
					clip: this.weapon.clip,
					accuracy: this.weapon.accuracy,
					firing: this.weapon.firing,
					loading: this.weapon.loading,
				},
				thrust: (caller==this.faction?(t,a)=>{ this.thrust(t,a); }:null),
				shoot: (caller==this.faction?(a)=>{ this.shoot(a); }:null),
			};
		}
		kill() { // Destroy with expolsion
			this.destroy();

			if(Options.Gfx.Explosions) {
				new Explosion(this.x,this.y,this.v,3);
			}
		}
		destroy() { // Destroy without explosion
			this._destroyed = true;
			this.gfx.destroy();
			removeFromArray(objects,this);
			removeFromArray(ships,this);
			removeFromArray(this.faction.ships,this);
		}
		update(){
			this.v.x += this.t.t * this.acceleration * Math.sin(this.t.a);
			this.v.y -= this.t.t * this.acceleration * Math.cos(this.t.a);
			this.t.t = 0;
			this.t.a = 0;
			this.weapon.firing && (this.weapon.firing--);
			this.weapon.loading && (this.weapon.loading--);

			if(this.weapon.fireAt !== null){
				if(this.weapon.fireAt == 'reload' && this.weapon.clip<this.weapon.maxClip && !(this.weapon.loading) && !(this.weapon.firing)){
					this.weapon.clip = this.weapon.maxClip;
					this.weapon.loading = this.weapon.reload;
				}
				if(!Number.isNaN(this.weapon.fireAt) && this.weapon.clip>0 && !(this.weapon.loading) && !(this.weapon.firing)){
					this.weapon.clip--;
					this.weapon.firing = this.weapon.refire;
					let so = (rand()>0.5?1:-1)*((rand()**2) * this.weapon.accuracy),
						ex = this.x + this.weapon.distance * Math.sin( this.weapon.fireAt + so ),
						ey = this.y - this.weapon.distance * Math.cos( this.weapon.fireAt + so ),
						hit = null,
						s = ships.slice();
					if(!Options.Game.FriendlyFire){ s = s.filter((s)=>{ return s.faction !== this.faction; }); }
					s = s.filter((s)=>{ return pointDistance(this.x,this.y,s.x,s.y) < this.weapon.distance * 1.2; }).
						filter((s)=>{ return s!=this; }).
						sort((a,b)=>{ return pointDistance(this.x,this.y,a.x,a.y) - pointDistance(this.x,this.y,b.x,b.y); }).
						find((s)=>{
							return (hit = lineCircleIntercept(this.x,this.y,ex,ey,s.x,s.y,s.size));
						});
					if(hit && hit.length){
						if(hit.length==2){
							hit = (pointDistance(this.x,this.y,hit[0].x,hit[0].y) < pointDistance(this.x,this.y,hit[1].x,hit[1].y)?
								hit[0]:hit[1]);
						}
						else{
							hit = hit[0];
						}
						drawShot(this.x,this.y,hit.x,hit.y,this.weapon.color);
						s.kill();
					}
					else {
						drawShot(this.x,this.y,ex,ey,this.weapon.color);
					}
				}
				this.weapon.fireAt = null;
			}

			if(Options.Gfx.Trails) {
				if(this.v.x || this.v.y) {
					drawTrail(this.x,this.y,this.x+this.v.x,this.y+this.v.y);
				}
			}

			let ox = this.x, oy = this.y;
			this.x += this.v.x;
			this.y += this.v.y;

			let vd = pointDistance(0,0,this.v.x,this.v.y);
			// TODO: Make wall collsions smarter
			for(let i=0;i<walls.length;i++){
				let w = walls[i];
				if(pointDistance(this.x,this.y,w.cx,w.cy) < (w.cr+vd)*1.1) {
					if(lineLineIntersects(ox,oy,this.x,this.y,w.x1c,w.y1c,w.x2c,w.y2c)){
						// Collision
						if(Options.Game.WallsDestroy){
							this.kill();
							return;
						}
						else {

						}
					}
				}
			}
			// TODO: Decide upon ship collisions.
			if(Options.Game.Collisions){
				let S = ships.filter((s)=>{ return s.faction !== this.faction; }).
					filter((s)=>{ return pointDistance(s.x,s.y,this.x,this.y)<2 })[0];
				if(S){
					this.kill();
					S.kill();
					return;
				}
			}
			// TODO: Replace with better collision system than the naive method.
			if(vd < 0.1) {
				let S = stations.filter((s)=>{ return s.faction !== this.faction }).
					filter((s)=>{ return pointDistance(this.x,this.y,s.x,s.y)<1; })[0];
				if(S){
					this.destroy();
					S.setFaction(this.faction);
					return;
				}
			}
		}
		shoot(a){
			if(this.weapon.firing || this.weapon.loading) {
				return;
			}
			if(!this.weapon.clip){
				this.reload();
				return;
			}
			this.weapon.fireAt = a;
		}
		reload(){
			if(this.weapon.clip<this.weapon.maxClip && !(this.weapon.loading) && !(this.weapon.firing)){
				this.weapon.fireAt = 'reload';
			}
		}
		thrust(t,a){
			if(typeof t == 'number' && !Number.isNaN(t) && typeof a == 'number' && !Number.isNaN(a)){
				this.t.t = Math.min(1,Math.max(0,t*1));
				this.t.a = a*1;
			}
		}
	}
	class Station {
		constructor(x,y,f){
			this.faction = (f instanceof Faction?f:null);

			this.gfx = new PIXI.Sprite(Textures.station);
			this.gfx.tint = this.faction?this.faction.color:0x777777;
			this.gfx.anchor.x = 0.5;
			this.gfx.anchor.y = 0.5;
			View.Gameplay.Stations.addChild(this.gfx);

			this.x = x;
			this.y = y;
			this.id = ID++;

			this.size = 5;
			// TODO: Implement upgrades
			// this.production = {
			// 	acceleration: 0.02d,
			// 	distance: 100,
			// 	reload: 60,
			// 	refire: 16,
			// 	maxClip: 5,
			// 	accuracy: 10 * d2r,
			// };
			this.resources = 0;

			this.faction && this.faction.stations.push(this);
			stations.push(this);
			objects.push(this);
		}
		get x(){ return this._x; }
		set x(v){ this.gfx.x = (this._x = v) * Viewport.scale; }
		get y(){ return this._y; }
		set y(v){ this.gfx.y = (this._y = v) * Viewport.scale; }
		sandbox(caller){
			return {
				id: this.id,
				faction: this.faction?this.faction.id:0,
				x: this.x,
				y: this.y,
				size: this.size,
				resources: this.resources,
				buildShip: (caller==this.faction?()=>{ return this.buildShip().sandbox(caller); }:null),
			};
		}
		update(){
			if(this.faction){
				this.resources += Options.Game.ResourcesPerTick;
			}
		}
		buildShip(){
			// TODO Updates to ships the station produces
			if(this.faction && this.resources > 100){
				this.resources -= 100;
				return new Ship(this.x,this.y,{x:0,y:0},this.faction);
			}
		}
		setFaction(f){
			this.faction && removeFromArray(this.faction.stations,this);
			this.faction = (f instanceof Faction?f:null);
			this.gfx.tint = this.faction?this.faction.color:0x777777;
			this.faction && this.faction.stations.push(this);
		}
		destroy(){
			this._destroyed = true;
			this.faction && removeFromArray(this.faction.stations,this);
			removeFromArray(stations,this);
			removeFromArray(objects,this);
		}
	}
	class Wall {
		constructor(x1,y1,x2,y2) {
			this.x1 = x1;
			this.y1 = y1;
			this.x2 = x2;
			this.y2 = y2;
			let pd=pointDistance(x1,y1,x2,y2), pa=pointAngle(x1,y1,x2,y2);
			this.cx = x1 + pd/2 * Math.sin(pa);
			this.cy = y1 - pd/2 * Math.cos(pa);
			this.cr = pd/2;

			this.x1c = this.cx + 1.1 * this.cr * Math.sin(pa-d90*2);
			this.y1c = this.cy - 1.1 * this.cr * Math.cos(pa-d90*2);
			this.x2c = this.cx + 1.1 * this.cr * Math.sin(pa);
			this.y2c = this.cy - 1.1 * this.cr * Math.cos(pa);

			this.gfx = new PIXI.Graphics();
			View.Gameplay.Walls.addChild(this.gfx);
			this.lastScale = -1;
			walls.push(this);
			objects.push(this);
		}
		sandbox(){
			return {
				x1: this.x1,
				y1: this.y1,
				x2: this.x2,
				y2: this.y2,
			};
		}
		destroy(){
			this._destroyed = true;
			this.gfx.destroy();
			removeFromArray(walls,this);
			removeFromArray(objects,this);
		}
		update(){
			if(this.lastScale != Viewport.scale){
				this.lastScale = Viewport.scale;
				let s = Viewport.scale;
				this.gfx.clear();
				this.gfx.lineStyle(Viewport.scale,0xffcc99,1);
				this.gfx.moveTo(this.x1 * s, this.y1 * s);
				this.gfx.lineTo(this.x2 * s, this.y2 * s);
				if(Options.Gfx.PrettyWalls){
					this.gfx.lineStyle(Viewport.scale*2,0xffcc99,0.4);
					this.gfx.moveTo(this.x1 * s, this.y1 * s);
					this.gfx.lineTo(this.x2 * s, this.y2 * s);
					this.gfx.lineStyle(Viewport.scale*3,0xffcc99,0.3);
					this.gfx.moveTo(this.x1 * s, this.y1 * s);
					this.gfx.lineTo(this.x2 * s, this.y2 * s);
					this.gfx.lineStyle(Viewport.scale*4,0xffcc99,0.2);
					this.gfx.moveTo(this.x1 * s, this.y1 * s);
					this.gfx.lineTo(this.x2 * s, this.y2 * s);
					this.gfx.lineStyle(Viewport.scale*5,0xffcc99,0.1);
					this.gfx.moveTo(this.x1 * s, this.y1 * s);
					this.gfx.lineTo(this.x2 * s, this.y2 * s);
					this.gfx.lineStyle(Viewport.scale*6,0xffcc99,0.05);
					this.gfx.moveTo(this.x1 * s, this.y1 * s);
					this.gfx.lineTo(this.x2 * s, this.y2 * s);
				}
			}
		}
	}

	Restart = init;
	function init(){
		// Clean up the map
		factions.slice().forEach((f)=>{ f.destroy(); });
		ships.slice().forEach((s)=>{ s.destroy(); });
		stations.slice().forEach((s)=>{ s.destroy(); });
		objects.slice().forEach((o)=>{ o.destroy(); });
		// Clear graphics objects
		View.Gameplay.Shots.clear();
		View.Background.clear();
		// Reset RNG
		_rng = mtrand(Options.Seed);
		// Reset STEP
		STEP = 0;
		// Redraw background
		drawBackground();
		// Create Factions and AI objects
		Options.Factions.forEach((f)=>{
			new Faction(f.name,f.color,new AI(f.ai.initFn,f.ai.updateFn));
		});
		// Generate Map
		let Map = Options.MapGeneration( factions.length, rand );
		Map.stations.forEach((s)=>{
			new Station(s.x,s.y,s.faction?factions[s.faction-1]:null);
		});
		Map.walls.forEach((w)=>{
			new Wall(w[0].x,w[0].y,w[1].x,w[1].y);
		});
		// Run AI->InitFn
		factions.forEach((f)=>{
			f.ai.init();
		});

		!looping && loop();
	}
	let looping = false;
	function loop(){
		!looping && (looping=true);
		// View.Gameplay.Shots.clear();
		// console.log(View.Gameplay.Shots.graphicsData);
		View.Gameplay.Shots.graphicsData.slice().forEach((d)=>{
			d.lineWidth *= 0.85;
			d.lineAlpha -= 0.10 * Math.max(d.lineWidth,0.1);
			if(d.lineAlpha <= 0 || d.lineWidth <= 0){
				removeFromArray(View.Gameplay.Shots.graphicsData,d);
			}
		});
		View.Gameplay.Shots.dirty++;
		View.Gameplay.Shots.clearDirty++;
		// Resize the Renderer to the full screen
		Renderer.resize(document.body.clientWidth,document.body.clientHeight);
		View.Gameplay.x = document.body.clientWidth/2 - Viewport.cx;
		View.Gameplay.y = document.body.clientHeight/2 - Viewport.cy;
		// For Current Speed
		if(Number.isInteger(Options.Speed) && Options.Speed >= 0){
			for(let i=0;i<Options.Speed;i++){
				// Run Faction AI->UpdateFn
				factions.forEach((f)=>{
					f.ai.update();
				});
				// Run Object Update scripts
				shuffle(objects.slice()).forEach((o)=>{
					if(!o._destroyed){
						o.update();
					}
				});
				STEP++;
			}
		}
		// TODO: Graphics Stepping

		Renderer.render(View);
		requestAnimationFrame(loop);
		FRAME++;
	}

})();
