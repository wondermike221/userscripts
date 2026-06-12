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

(function () {
'use strict';

function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}

const STORAGE_KEY = 'autoClickEnabled';
const MATH_STORAGE_KEY = 'autoMathEnabled';
const BUY_STORAGE_KEY = 'autoBuyEnabled';
let enabled = GM_getValue(STORAGE_KEY, false);
let mathEnabled = GM_getValue(MATH_STORAGE_KEY, false);
let buyEnabled = GM_getValue(BUY_STORAGE_KEY, false);
let menuId;
let mathMenuId;
let buyMenuId;

// Rolls required between pack purchases; spades kept in reserve after any buy
const ROLLS_BEFORE_BUY = 6;
const SPADE_RESERVE = 400;
let clicking = false;
let fallbackTimer;
let lastBuyTime = 0;
let rollsSinceLastBuy = 0;
let packPresent = false;
let packCutTimer;
let busy = false;
let busyClearTimer;
let mathState = 'idle';

// Numbers each pack type targets
const PACK_NUMBERS = {
  '50s': Array.from({
    length: 10
  }, (_, i) => i + 50),
  '90s': Array.from({
    length: 10
  }, (_, i) => i + 90),
  primes: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97],
  standard: Array.from({
    length: 100
  }, (_, i) => i + 1)
};
function registerMenu() {
  if (menuId !== undefined) GM_unregisterMenuCommand(menuId);
  menuId = GM_registerMenuCommand(`Gacha Auto-click: ${enabled ? 'ON ✓' : 'OFF ✗'}`, () => {
    enabled = !enabled;
    GM_setValue(STORAGE_KEY, enabled);
    registerMenu();
  });
}
function registerMathMenu() {
  if (mathMenuId !== undefined) GM_unregisterMenuCommand(mathMenuId);
  mathMenuId = GM_registerMenuCommand(`Gacha Auto-math: ${mathEnabled ? 'ON ✓' : 'OFF ✗'}`, () => {
    mathEnabled = !mathEnabled;
    GM_setValue(MATH_STORAGE_KEY, mathEnabled);
    registerMathMenu();
  });
}
function registerBuyMenu() {
  if (buyMenuId !== undefined) GM_unregisterMenuCommand(buyMenuId);
  buyMenuId = GM_registerMenuCommand(`Gacha Auto-buy packs: ${buyEnabled ? 'ON ✓' : 'OFF ✗'}`, () => {
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
  if (fallbackTimer !== undefined) {
    clearTimeout(fallbackTimer);
    fallbackTimer = undefined;
  }
}
function solveProblems() {
  const problems = Array.from(document.querySelectorAll('.problems-container .problem'));
  const answers = problems.map(problem => {
    var _problem$textContent;
    const text = (_problem$textContent = problem.textContent) != null ? _problem$textContent : '';
    const match = text.match(/(\d+)\s*\+\s*(\d+)/);
    if (!match) return null;
    return parseInt(match[1], 10) + parseInt(match[2], 10);
  });
  problems.forEach((problem, i) => {
    const answer = answers[i];
    if (answer === null) return;
    const input = problem.querySelector('.math-input');
    if (!input) return;
    input.value = String(answer);
    input.dispatchEvent(new Event('input', {
      bubbles: true
    }));
    input.dispatchEvent(new Event('change', {
      bubbles: true
    }));
  });
}
function simulatePackCut() {
  const svg = document.getElementById('drawing');
  const sliceLine = document.querySelector('.slice-line');
  const cardPack = document.getElementById('card-pack');
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
    target.dispatchEvent(new PointerEvent(pointerType, _extends({}, opts, {
      pointerId: 1,
      pressure: buttons ? 0.5 : 0
    })));
  }

  // mousedown on the SVG element
  fire(svg, 'mousedown', 'pointerdown', startX, 1);

  // mousemove staggered over real time, dispatched to both SVG and document
  for (let i = 1; i <= STEPS; i++) {
    const x = startX + (endX - startX) * (i / STEPS);
    setTimeout(() => {
      fire(svg, 'mousemove', 'pointermove', x, 1);
      fire(document, 'mousemove', 'pointermove', x, 1);
    }, i * STEP_MS);
  }

  // mouseup on document — games typically listen here to catch releases outside the element
  setTimeout(() => {
    fire(svg, 'mouseup', 'pointerup', endX, 0);
    fire(document, 'mouseup', 'pointerup', endX, 0);
  }, (STEPS + 1) * STEP_MS);
}

// How urgently does this number need rolls: unrolled=10, else 6-starCount (min 1)
function getNumberNeed(n) {
  const container = document.getElementById(`number-container-${n}`);
  if (!container) return 0;
  if (container.classList.contains('unrolled')) return 10;
  const wrapper = container.closest('.combat-menu-number-wrapper');
  if (!wrapper) return 1;
  const stars = wrapper.querySelectorAll('.star-level-star').length;
  return Math.max(1, 6 - stars);
}
function getPackType(entry) {
  var _entry$querySelector$, _entry$querySelector, _match$;
  const src = (_entry$querySelector$ = (_entry$querySelector = entry.querySelector('.pack-shop-entry-img-img')) == null ? void 0 : _entry$querySelector.src) != null ? _entry$querySelector$ : '';
  const match = src.match(/\/([^/]+)_dt\.png/);
  return (_match$ = match == null ? void 0 : match[1]) != null ? _match$ : 'standard';
}
function scorePackEntry(entry) {
  var _PACK_NUMBERS$packTyp;
  const packType = getPackType(entry);
  const numbers = (_PACK_NUMBERS$packTyp = PACK_NUMBERS[packType]) != null ? _PACK_NUMBERS$packTyp : PACK_NUMBERS.standard;
  return numbers.reduce((sum, n) => sum + getNumberNeed(n), 0) / numbers.length;
}
function getSpades() {
  var _document$getElementB, _document$getElementB2;
  const text = (_document$getElementB = (_document$getElementB2 = document.getElementById('spades-container')) == null ? void 0 : _document$getElementB2.textContent) != null ? _document$getElementB : '0';
  return parseInt(text.replace(/[^0-9]/g, ''), 10);
}
function tryBuyPacks() {
  if (!buyEnabled || clicking || mathState !== 'idle') return;
  if (Date.now() - lastBuyTime < 3000) return;
  if (rollsSinceLastBuy < ROLLS_BEFORE_BUY) return;
  const spades = getSpades();
  const entries = Array.from(document.querySelectorAll('.pack-shop-entry'));
  const candidates = entries.map(entry => {
    var _btn$textContent$repl, _btn$textContent;
    const btn = entry.querySelector('.pack-shop-entry-buy-button');
    if (!btn || btn.disabled) return null;
    const cost = parseInt((_btn$textContent$repl = (_btn$textContent = btn.textContent) == null ? void 0 : _btn$textContent.replace(/[^0-9]/g, '')) != null ? _btn$textContent$repl : '0', 10);
    if (cost === 0 || spades - cost < SPADE_RESERVE) return null;
    return {
      btn,
      cost,
      score: scorePackEntry(entry)
    };
  }).filter(x => x !== null).sort((a, b) => b.score - a.score);
  if (candidates.length === 0) return;
  candidates[0].btn.click();
  lastBuyTime = Date.now();
  rollsSinceLastBuy = 0;
}
const observer = new MutationObserver(() => {
  // Dismiss roll/pack result popup
  if (enabled || buyEnabled) {
    const popup = document.querySelector('.big-number-container');
    if (popup) {
      popup.click();
      resetClicking();
    }
  }

  // Simulate cutting open a pack when card-pack-container appears
  if (buyEnabled) {
    const container = document.getElementById('card-pack-container');
    if (container && !packPresent) {
      packPresent = true;
      busy = true;
      if (busyClearTimer !== undefined) {
        clearTimeout(busyClearTimer);
        busyClearTimer = undefined;
      }
      packCutTimer = setTimeout(simulatePackCut, 600);
    } else if (!container && packPresent) {
      packPresent = false;
      if (packCutTimer !== undefined) {
        clearTimeout(packCutTimer);
        packCutTimer = undefined;
      }
      // Grace period: let last card popup appear and be dismissed before resuming
      busyClearTimer = setTimeout(() => {
        busy = false;
      }, 2000);
    }
  }
  if (!mathEnabled) return;
  if (mathState === 'waiting-for-modal') {
    const doMathBtn = document.querySelector('button.out-of-hearts-button');
    if (doMathBtn) {
      mathState = 'waiting-for-problems';
      doMathBtn.click();
      return;
    }
  }
  if (mathState === 'waiting-for-problems') {
    const problems = document.querySelectorAll('.problems-container .problem');
    if (problems.length > 0) {
      mathState = 'solving';
      solveProblems();
      return;
    }
  }
  if (mathState === 'solving' && !document.querySelector('.out-of-hearts-container')) {
    mathState = 'idle';
  }
});
observer.observe(document.body, {
  childList: true,
  subtree: true
});
function tryClick() {
  if (busy) return;

  // Auto-click: roll buttons
  if (enabled && !clicking) {
    const eventBtn = document.querySelector('button.event-button:not([disabled])');
    const target = eventBtn != null ? eventBtn : document.querySelector('#roll-button:not([disabled])');
    if (target) {
      clicking = true;
      rollsSinceLastBuy++;
      target.click();
      fallbackTimer = setTimeout(resetClicking, 5000);
      return;
    }
  }

  // Auto-math: earn more rolls when out of hearts
  if (mathEnabled && mathState === 'idle' && !clicking) {
    const outBtn = document.querySelector('#out-of-hearts-button');
    if (outBtn) {
      mathState = 'waiting-for-modal';
      outBtn.click();
      return;
    }
  }

  // Auto-buy: purchase best-scoring affordable pack
  tryBuyPacks();
}
setInterval(tryClick, 500);

})();
