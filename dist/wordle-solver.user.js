// ==UserScript==
// @name        Wordle Solver
// @namespace   https://hixon.dev
// @description Logs possible Wordle answers to the console after each guess
// @match       https://www.nytimes.com/games/wordle/index.html
// @version     0.1.0
// @author      Michael Hixon
// @run-at      document-idle
// @downloadURL https://raw.githubusercontent.com/wondermike221/userscripts/main/dist/wordle-solver.user.js
// @homepageURL https://github.com/wondermike221/userscripts
// ==/UserScript==

(function () {
'use strict';

const WORDS_URL = 'https://raw.githubusercontent.com/chidiwilliams/wordle/main/src/data/words.json';
async function loadWords() {
  const response = await fetch(WORDS_URL);
  return response.json();
}
function getRevealedTiles() {
  return Array.from(document.querySelectorAll('[data-state="correct"], [data-state="present"], [data-state="absent"]')).map(el => {
    var _el$textContent$trim$, _el$textContent;
    return {
      letter: (_el$textContent$trim$ = (_el$textContent = el.textContent) == null ? void 0 : _el$textContent.trim().toLowerCase()) != null ? _el$textContent$trim$ : '',
      state: el.getAttribute('data-state')
    };
  }).filter(tile => tile.letter.length === 1);
}
function buildConstraints(guesses) {
  const correct = Array(5).fill(null);
  const mustInclude = new Set();
  const neverInWord = new Set();
  for (const row of guesses) {
    for (let i = 0; i < 5; i++) {
      const {
        letter,
        state
      } = row[i];
      if (state === 'correct') {
        correct[i] = letter;
        mustInclude.add(letter);
      } else if (state === 'present') {
        mustInclude.add(letter);
      } else {
        neverInWord.add(letter);
      }
    }
  }

  // Only truly exclude letters that never appeared as correct/present
  const excluded = [...neverInWord].filter(l => !mustInclude.has(l)).join('');
  const included = [...mustInclude].join('');
  const pattern = correct.map(l => l != null ? l : '.').join('');
  return {
    regex: new RegExp(`^${pattern}$`),
    excluded,
    included
  };
}
function filterWords(words, regex, excluded, included) {
  return words.filter(word => {
    if (!regex.test(word)) return false;
    for (const letter of excluded) {
      if (word.includes(letter)) return false;
    }
    for (const letter of included) {
      if (!word.includes(letter)) return false;
    }
    return true;
  });
}
async function main() {
  const words = await loadWords();
  let lastGuessCount = 0;
  let debounceTimer = null;
  function check() {
    const tiles = getRevealedTiles();
    const completeRows = Math.floor(tiles.length / 5);
    if (completeRows <= lastGuessCount) return;
    lastGuessCount = completeRows;
    const guesses = Array.from({
      length: completeRows
    }, (_, i) => tiles.slice(i * 5, i * 5 + 5));
    const {
      regex,
      excluded,
      included
    } = buildConstraints(guesses);
    const possible = filterWords(words, regex, excluded, included);
    console.log(`[Wordle Solver] Guess ${completeRows}: ${possible.length} possible words remaining`);
    console.log(possible);
  }

  // Debounce to let all 5 tile animations finish before computing
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(check, 500);
  });
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['data-state']
  });
  console.log('[Wordle Solver] Loaded. Watching for guesses...');
}
main();

})();
