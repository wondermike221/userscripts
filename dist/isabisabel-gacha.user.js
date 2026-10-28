// ==UserScript==
// @name        Isabel Gacha Auto-clicker
// @namespace   https://hixon.dev
// @description Auto-clicks Roll buttons on the Isabel gacha page with priority logic
// @match       https://isabisabel.com/gacha/*
// @version     0.1.0
// @author      Michael Hixon
// @run-at      document-idle
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @grant       GM_setValue
// @grant       GM_unregisterMenuCommand
// ==/UserScript==
(function() {
	//#region src/isabisabel-gacha/index.ts
	var STORAGE_KEY = "autoClickEnabled";
	var MATH_STORAGE_KEY = "autoMathEnabled";
	var BUY_STORAGE_KEY = "autoBuyEnabled";
	var enabled = GM_getValue(STORAGE_KEY, false);
	var mathEnabled = GM_getValue(MATH_STORAGE_KEY, false);
	var buyEnabled = GM_getValue(BUY_STORAGE_KEY, false);
	var menuId;
	var mathMenuId;
	var buyMenuId;
	var ROLLS_BEFORE_BUY = 6;
	var SPADE_RESERVE = 400;
	var clicking = false;
	var fallbackTimer;
	var lastBuyTime = 0;
	var rollsSinceLastBuy = 0;
	var packPresent = false;
	var packCutTimer;
	var busy = false;
	var busyClearTimer;
	var mathState = "idle";
	var PACK_NUMBERS = {
		"50s": Array.from({ length: 10 }, (_, i) => i + 50),
		"90s": Array.from({ length: 10 }, (_, i) => i + 90),
		primes: [
			2,
			3,
			5,
			7,
			11,
			13,
			17,
			19,
			23,
			29,
			31,
			37,
			41,
			43,
			47,
			53,
			59,
			61,
			67,
			71,
			73,
			79,
			83,
			89,
			97
		],
		standard: Array.from({ length: 100 }, (_, i) => i + 1)
	};
	function registerMenu() {
		if (menuId !== void 0) GM_unregisterMenuCommand(menuId);
		menuId = GM_registerMenuCommand(`Gacha Auto-click: ${enabled ? "ON ✓" : "OFF ✗"}`, () => {
			enabled = !enabled;
			GM_setValue(STORAGE_KEY, enabled);
			registerMenu();
		});
	}
	function registerMathMenu() {
		if (mathMenuId !== void 0) GM_unregisterMenuCommand(mathMenuId);
		mathMenuId = GM_registerMenuCommand(`Gacha Auto-math: ${mathEnabled ? "ON ✓" : "OFF ✗"}`, () => {
			mathEnabled = !mathEnabled;
			GM_setValue(MATH_STORAGE_KEY, mathEnabled);
			registerMathMenu();
		});
	}
	function registerBuyMenu() {
		if (buyMenuId !== void 0) GM_unregisterMenuCommand(buyMenuId);
		buyMenuId = GM_registerMenuCommand(`Gacha Auto-buy packs: ${buyEnabled ? "ON ✓" : "OFF ✗"}`, () => {
			buyEnabled = !buyEnabled;
			GM_setValue(BUY_STORAGE_KEY, buyEnabled);
			registerBuyMenu();
		});
	}
	registerMenu();
	registerMathMenu();
	registerBuyMenu();
	function resetClicking() {
		clicking = false;
		if (fallbackTimer !== void 0) {
			clearTimeout(fallbackTimer);
			fallbackTimer = void 0;
		}
	}
	function solveProblems() {
		const problems = Array.from(document.querySelectorAll(".problems-container .problem"));
		const answers = problems.map((problem) => {
			const match = (problem.textContent ?? "").match(/(\d+)\s*\+\s*(\d+)/);
			if (!match) return null;
			return parseInt(match[1], 10) + parseInt(match[2], 10);
		});
		problems.forEach((problem, i) => {
			const answer = answers[i];
			if (answer === null) return;
			const input = problem.querySelector(".math-input");
			if (!input) return;
			input.value = String(answer);
			input.dispatchEvent(new Event("input", { bubbles: true }));
			input.dispatchEvent(new Event("change", { bubbles: true }));
		});
	}
	function simulatePackCut() {
		const svg = document.getElementById("drawing");
		const sliceLine = document.querySelector(".slice-line");
		const cardPack = document.getElementById("card-pack");
		if (!svg || !sliceLine || !cardPack) return;
		const packRect = cardPack.getBoundingClientRect();
		const sliceRect = sliceLine.getBoundingClientRect();
		if (packRect.width === 0 || packRect.height === 0) return;
		const y = sliceRect.top + sliceRect.height / 2;
		const startX = packRect.left - 40;
		const endX = packRect.right + 40;
		const STEPS = 20;
		const STEP_MS = 10;
		function fire(target, mouseType, pointerType, x, buttons) {
			const opts = {
				bubbles: true,
				cancelable: true,
				clientX: x,
				clientY: y,
				buttons
			};
			target.dispatchEvent(new MouseEvent(mouseType, opts));
			target.dispatchEvent(new PointerEvent(pointerType, {
				...opts,
				pointerId: 1,
				pressure: buttons ? .5 : 0
			}));
		}
		fire(svg, "mousedown", "pointerdown", startX, 1);
		for (let i = 1; i <= STEPS; i++) {
			const x = startX + (endX - startX) * (i / STEPS);
			setTimeout(() => {
				fire(svg, "mousemove", "pointermove", x, 1);
				fire(document, "mousemove", "pointermove", x, 1);
			}, i * STEP_MS);
		}
		setTimeout(() => {
			fire(svg, "mouseup", "pointerup", endX, 0);
			fire(document, "mouseup", "pointerup", endX, 0);
		}, 210);
	}
	function getNumberNeed(n) {
		const container = document.getElementById(`number-container-${n}`);
		if (!container) return 0;
		if (container.classList.contains("unrolled")) return 10;
		const wrapper = container.closest(".combat-menu-number-wrapper");
		if (!wrapper) return 1;
		const stars = wrapper.querySelectorAll(".star-level-star").length;
		return Math.max(1, 6 - stars);
	}
	function getPackType(entry) {
		return (entry.querySelector(".pack-shop-entry-img-img")?.src ?? "").match(/\/([^/]+)_dt\.png/)?.[1] ?? "standard";
	}
	function scorePackEntry(entry) {
		const numbers = PACK_NUMBERS[getPackType(entry)] ?? PACK_NUMBERS.standard;
		return numbers.reduce((sum, n) => sum + getNumberNeed(n), 0) / numbers.length;
	}
	function getSpades() {
		const text = document.getElementById("spades-container")?.textContent ?? "0";
		return parseInt(text.replace(/[^0-9]/g, ""), 10);
	}
	function tryBuyPacks() {
		if (!buyEnabled || clicking || mathState !== "idle") return;
		if (Date.now() - lastBuyTime < 3e3) return;
		if (rollsSinceLastBuy < ROLLS_BEFORE_BUY) return;
		const spades = getSpades();
		const candidates = Array.from(document.querySelectorAll(".pack-shop-entry")).map((entry) => {
			const btn = entry.querySelector(".pack-shop-entry-buy-button");
			if (!btn || btn.disabled) return null;
			const cost = parseInt(btn.textContent?.replace(/[^0-9]/g, "") ?? "0", 10);
			if (cost === 0 || spades - cost < SPADE_RESERVE) return null;
			return {
				btn,
				cost,
				score: scorePackEntry(entry)
			};
		}).filter((x) => x !== null).sort((a, b) => b.score - a.score);
		if (candidates.length === 0) return;
		candidates[0].btn.click();
		lastBuyTime = Date.now();
		rollsSinceLastBuy = 0;
	}
	new MutationObserver(() => {
		if (enabled || buyEnabled) {
			const popup = document.querySelector(".big-number-container");
			if (popup) {
				popup.click();
				resetClicking();
			}
		}
		if (buyEnabled) {
			const container = document.getElementById("card-pack-container");
			if (container && !packPresent) {
				packPresent = true;
				busy = true;
				if (busyClearTimer !== void 0) {
					clearTimeout(busyClearTimer);
					busyClearTimer = void 0;
				}
				packCutTimer = setTimeout(simulatePackCut, 600);
			} else if (!container && packPresent) {
				packPresent = false;
				if (packCutTimer !== void 0) {
					clearTimeout(packCutTimer);
					packCutTimer = void 0;
				}
				busyClearTimer = setTimeout(() => {
					busy = false;
				}, 2e3);
			}
		}
		if (!mathEnabled) return;
		if (mathState === "waiting-for-modal") {
			const doMathBtn = document.querySelector("button.out-of-hearts-button");
			if (doMathBtn) {
				mathState = "waiting-for-problems";
				doMathBtn.click();
				return;
			}
		}
		if (mathState === "waiting-for-problems") {
			if (document.querySelectorAll(".problems-container .problem").length > 0) {
				mathState = "solving";
				solveProblems();
				return;
			}
		}
		if (mathState === "solving" && !document.querySelector(".out-of-hearts-container")) mathState = "idle";
	}).observe(document.body, {
		childList: true,
		subtree: true
	});
	function tryClick() {
		if (busy) return;
		if (enabled && !clicking) {
			const target = document.querySelector("button.event-button:not([disabled])") ?? document.querySelector("#roll-button:not([disabled])");
			if (target) {
				clicking = true;
				rollsSinceLastBuy++;
				target.click();
				fallbackTimer = setTimeout(resetClicking, 5e3);
				return;
			}
		}
		if (mathEnabled && mathState === "idle" && !clicking) {
			const outBtn = document.querySelector("#out-of-hearts-button");
			if (outBtn) {
				mathState = "waiting-for-modal";
				outBtn.click();
				return;
			}
		}
		tryBuyPacks();
	}
	setInterval(tryClick, 500);
	//#endregion
})();
