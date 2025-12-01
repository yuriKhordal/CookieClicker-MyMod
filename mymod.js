import { Game, l } from "./main.js"

``.replaceAll(/\/\/(.*)/g, '{}').replaceAll(/\s+/gm, ' ');

(function() {
const SHORT_TICK_MS = 100;
const LONG_TICK_MS = 1200;

// ========================= Timer =========================

var time_aggregate = 0;
function shortTick() {
	time_aggregate += SHORT_TICK_MS;

	autoClickCookie();

	if (time_aggregate >= LONG_TICK_MS) {
		time_aggregate %= LONG_TICK_MS;
		longTick();
	}
}

function longTick() {
	goldenCookieClicker();
}

// ==================== Methods ====================

function autoClickCookie() {
	if (!MyMod.autoClick) { return; }
	if (Game.OnAscend || Game.AscendTimer>0) { return; }

	const bounds = l('bigCookie')?.getBoundingClientRect();
	const mouseX = Game.mouseX;
	const mouseY = Game.mouseY;
	const lastClick = Game.lastClick;

	Game.mouseX = bounds.left + bounds.width/2;
	Game.mouseY = bounds.top + bounds.height/3;
	Game.lastClick = 0;
	Game.ClickCookie();
	Game.mouseX = mouseX;
	Game.mouseY = mouseY;
	Game.lastClick = lastClick;
}

function goldenCookieClicker() {
	if (MyMod.goldAutoClick == undefined || MyMod.goldAutoClick <= 0) { return; }
	if (Game.shimmers.len == 0) { return; }

	const cookieStormPerc = MyMod.goldAutoClick / 2;
	const goldenCookies = Game.shimmers.filter(shimmer => shimmer.type = 'golden');
	let nextShimmerIds = [];
	for (let golden of goldenCookies) {
		nextShimmerIds.push(golden.id);
		if (MyMod._seenGoldCookieIds.includes(golden.id)) {continue;}
		if (Game.shimmerTypes['golden'].chain > 0) {
			golden.pop();
		} else if (Game.hasBuff('Cookie storm')) {
			if (Math.random() <= cookieStormPerc) {
				golden.pop();
			}
		} else if (Math.random() <= MyMod.goldAutoClick) {
			golden.pop();
		}
	}

	MyMod._seenGoldCookieIds = nextShimmerIds;
}

function generateGoldenCookie() {
	new Game.shimmer('golden');
}

// ==================== Start/Stop ====================

function start() {
	MyMod.loaded = true;
	window.MyMod = MyMod;
	MyMod.load();

	MyMod.ticker = setInterval(shortTick, SHORT_TICK_MS);

	// Add Options:
	MyMod.originalUpdateMenu = Game.UpdateMenu;
	Game.UpdateMenu = MyMod.customUpdateMenu;
	Game.UpdateMenu();
}

function stop() {
	MyMod.save();
	clearInterval(MyMod.ticker);
	MyMod.ticker = null;
	Game.UpdateMenu = MyMod.originalUpdateMenu;
	Game.UpdateMenu();
	MyMod.loaded = false;
}

function unload() {
	MyMod.stop();
	if ('MyMod' in window && window.MyMod === MyMod) {
		delete window.MyMod;
	}
}

function updateMenu(){
	MyMod.originalUpdateMenu();

	if (Game.onMenu == 'prefs') {
		let menu = document.getElementById('menu');

		let settings = document.createElement('div');
			settings.className = 'subsection';
			settings.style.padding = '0px';
		let title = document.createElement('div');
			title.className = 'title';
			title.innerText = 'My Mod';
			settings.appendChild(title);
		let listing = document.createElement('div');
			listing.className = 'listing';
			settings.appendChild(listing);
		
		// ==================== Toggle: Auto Clicker ====================
		let autoClick = document.createElement('a');
			autoClick.className = 'smallFancyButton prefButton option ' + (MyMod.autoClick?'':' off');
			autoClick.innerText = 'Auto Clicker ' + (MyMod.autoClick?'ON':'OFF');
			autoClick.onclick = function(ev) {
				MyMod.autoClick = !MyMod.autoClick;
				ev.target.classList.toggle('off');
				ev.target.innerText = 'Auto Clicker ' + (MyMod.autoClick?'ON':'OFF');
				save();
			};
			listing.appendChild(autoClick);
		let autoClickLabel = document.createElement('label');
			autoClickLabel.innerText = 'An auto-clicker that clicks the big cookie.';
			listing.appendChild(autoClickLabel);
			listing.appendChild(document.createElement('br'));
		
		// =============== Button: Golden Cookie Generator ===============
		let btn_genGoldenCookie = document.createElement('a');
			btn_genGoldenCookie.className = 'option smallFancyButton';
			btn_genGoldenCookie.innerText = 'Generate Golden Cookie';
			btn_genGoldenCookie.onclick = generateGoldenCookie;
			listing.appendChild(btn_genGoldenCookie);
		let lbl_genGoldenCookie = document.createElement('label');
			lbl_genGoldenCookie.innerText = 'Generate a golden cookie. Does not affect regular golden cookie spawn rate.';
			listing.appendChild(lbl_genGoldenCookie);
			listing.appendChild(document.createElement('br'));

		// =============== Slider: Golden Cookie Auto Clicker ===============
		let div_goldenAutoClicker = document.createElement('div');
			div_goldenAutoClicker.className = 'sliderBox';
			div_goldenAutoClicker.style.marginTop = '2px';
			listing.appendChild(div_goldenAutoClicker);
		let lbl_goldenAutoClickerText = document.createElement('div');
			lbl_goldenAutoClickerText.className = 'smallFancyButton';
			lbl_goldenAutoClickerText.style.float = 'left';
			lbl_goldenAutoClickerText.innerText = 'Golden Clicker';
			div_goldenAutoClicker.appendChild(lbl_goldenAutoClickerText);
		let lbl_goldenAutoClickerPercent = document.createElement('div');
			lbl_goldenAutoClickerPercent.className = 'smallFancyButton';
			lbl_goldenAutoClickerPercent.style.float = 'right';
			lbl_goldenAutoClickerPercent.innerText = Math.floor(MyMod.goldAutoClick * 100) + '%';
			div_goldenAutoClicker.appendChild(lbl_goldenAutoClickerPercent);
		let sld_goldenAutoClickerPercent = document.createElement('input');
			sld_goldenAutoClickerPercent.className = 'slider';
			sld_goldenAutoClickerPercent.style.clear = 'both';
			sld_goldenAutoClickerPercent.type = 'range';
			sld_goldenAutoClickerPercent.min = '0';
			sld_goldenAutoClickerPercent.max = '100';
			sld_goldenAutoClickerPercent.step = '1';
			sld_goldenAutoClickerPercent.value = Math.floor(MyMod.goldAutoClick * 100);
			sld_goldenAutoClickerPercent.onchange = sld_goldenAutoClickerPercent.oninput = function(ev) {
				const value = sld_goldenAutoClickerPercent.valueAsNumber;
				MyMod.goldAutoClick = value / 100;
				lbl_goldenAutoClickerPercent.innerText = value + '%'
				save();
			};
			div_goldenAutoClicker.appendChild(sld_goldenAutoClickerPercent);
		let lbl_goldenAutoClicker = document.createElement('label');
			lbl_goldenAutoClicker.innerText = 'A golden cookie auto clicker. ' + 
				'Set a chance to automatically click a golden cookie. ' + 
				'To disable set to 0.';
			listing.appendChild(lbl_goldenAutoClicker);
			listing.appendChild(document.createElement('br'));
		
		// ========================= Button: Unload Mod =========================
		let div_unloadMod = document.createElement('div');
			div_unloadMod.className = 'listing';
			div_unloadMod.style.textAlign = 'right';
		let lbl_unloadMod = document.createElement('label');
			lbl_unloadMod.innerText = 'Unloads this mod from the game.';
			div_unloadMod.appendChild(lbl_unloadMod);
			listing.appendChild(div_unloadMod);
			listing.appendChild(document.createElement('br'));
		let btn_unloadMod = document.createElement('a');
			btn_unloadMod.className = 'smallFancyButton option warning';
			btn_unloadMod.innerText = 'Unload MyMod.';
			btn_unloadMod.onclick = function() {
				const content = "<h3>Unload</h3><div class='block'>Are you sure you want to unload MyMod?</div>";
				const optionYes = ['Yes', 'Game.ClosePrompt();window.MyMod.unload()', 'float: left'];
				const optionNo = ['No', 'Game.ClosePrompt()', 'float: right'];
				Game.Prompt(content, [optionYes, optionNo]);
			};
			div_unloadMod.appendChild(btn_unloadMod);

		menu.insertBefore(settings, menu.querySelector('.block'));
	}
}

function save() {
	let prefs = {};
	for (const key of MyMod.SETTINGS_TO_SAVE) {
		if (key in MyMod)
			prefs[key] = MyMod[key];
	}

	localStorage.setItem(MyMod.SETTINGS_KEY, JSON.stringify(prefs));
}

function load() {
	const prefs = JSON.parse(localStorage.getItem(MyMod.SETTINGS_KEY));
	if (prefs === null) {return;}

	for (const key of MyMod.SETTINGS_TO_SAVE) {
		if (key in prefs)
			MyMod[key] = prefs[key];
	}
}

// ==================== Start the mod ====================

const MyMod = {
	SHORT_TICK_MS: SHORT_TICK_MS,
	LONG_TICK_MS: LONG_TICK_MS,
	DEBUG: true,
	SETTINGS_KEY: 'MyMod.settings',
	SETTINGS_TO_SAVE: ['autoClick', 'goldAutoClick', 'goldStormAutoClick'],

	loaded: false,
	ticker: null,
	autoClick: true,
	goldAutoClick: 0.3,
	goldStormAutoClick: 0.15,

	_seenGoldCookieIds: [],

	start: start,
	stop: stop,
	unload: unload,
	save: save,
	load: load,
	originalUpdateMenu: function(){},
	customUpdateMenu: updateMenu
};

if ('MyMod' in window && window.MyMod.loaded)
	window.MyMod.stop();

window.MyMod = MyMod;
window.MyMod.start();
})();