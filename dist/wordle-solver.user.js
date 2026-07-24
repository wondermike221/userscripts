// ==UserScript==
// @name        Wordle Solver
// @namespace   https://hixon.dev
// @description Logs possible Wordle answers to the console after each guess
// @match       https://www.nytimes.com/games/wordle/index.html
// @version     0.2.0
// @author      Michael Hixon
// @run-at      document-idle
// @downloadURL https://raw.githubusercontent.com/wondermike221/userscripts/main/dist/wordle-solver.user.js
// @homepageURL https://github.com/wondermike221/userscripts
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       unsafeWindow
// ==/UserScript==

(function () {
'use strict';

const REPO_RAW = 'https://raw.githubusercontent.com/wondermike221/userscripts/main/data';
const LISTS = {
  guesses: {
    url: `${REPO_RAW}/wordle-guesses.json`,
    cacheKey: 'wordleGuesses'
  },
  // Swap in an answers URL once sourced; infrastructure is ready.
  answers: {
    url: `${REPO_RAW}/wordle-answers.json`,
    cacheKey: 'wordleAnswers'
  }
};
async function loadList(name) {
  const {
    url,
    cacheKey
  } = LISTS[name];
  const cached = GM_getValue(cacheKey);
  if (cached) return JSON.parse(cached);
  const response = await fetch(url);
  const words = await response.json();
  GM_setValue(cacheKey, JSON.stringify(words));
  return words;
}
function getRevealedTiles() {
  // Exclude <button> elements so keyboard keys (same data-state values) aren't mixed in
  return Array.from(document.querySelectorAll(':not(button)[data-state="correct"], :not(button)[data-state="present"], :not(button)[data-state="absent"]')).map(el => {
    var _el$textContent$trim$, _el$textContent;
    return {
      letter: (_el$textContent$trim$ = (_el$textContent = el.textContent) == null ? void 0 : _el$textContent.trim().toLowerCase()) != null ? _el$textContent$trim$ : '',
      state: el.getAttribute('data-state')
    };
  }).filter(tile => tile.letter.length === 1);
}
function buildConstraints(guesses) {
  const correct = Array(5).fill(null);
  const presentAt = Array.from({
    length: 5
  }, () => new Set());
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
        presentAt[i].add(letter);
        mustInclude.add(letter);
      } else {
        neverInWord.add(letter);
      }
    }
  }
  const excluded = [...neverInWord].filter(l => !mustInclude.has(l)).join('');
  const included = [...mustInclude].join('');
  const pattern = correct.map((l, i) => {
    if (l) return l;
    const notHere = [...presentAt[i]].join('');
    return notHere ? `[^${notHere}]` : '.';
  }).join('');
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
function letterFrequency(words) {
  const counts = new Map();
  for (const word of words) {
    for (const letter of new Set(word)) {
      var _counts$get;
      counts.set(letter, ((_counts$get = counts.get(letter)) != null ? _counts$get : 0) + 1);
    }
  }
  const pct = new Map();
  for (const [letter, count] of counts) {
    pct.set(letter, count / words.length * 100);
  }
  return pct;
}
function logFrequencyChart(freq) {
  var _sorted$0$, _sorted$;
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const maxPct = (_sorted$0$ = (_sorted$ = sorted[0]) == null ? void 0 : _sorted$[1]) != null ? _sorted$0$ : 1;
  const BAR = 24;
  const rows = sorted.map(([letter, pct]) => {
    const filled = Math.round(pct / maxPct * BAR);
    const bar = '█'.repeat(filled) + '░'.repeat(BAR - filled);
    return `  ${letter} │${bar}│ ${pct.toFixed(1)}%`;
  }).join('\n');
  console.log('[Wordle Solver] Letter frequency in remaining candidates:\n' + rows);
}
function scoreWord(word, freq, knownLetters) {
  return [...new Set(word)].filter(l => !knownLetters.has(l)).reduce((sum, l) => {
    var _freq$get;
    return sum + ((_freq$get = freq.get(l)) != null ? _freq$get : 0);
  }, 0);
}
function recommendWords(possible, knownLetters, topN = 10) {
  if (possible.length === 0) return;
  const freq = letterFrequency(possible);
  logFrequencyChart(freq);
  const scored = possible.map(word => ({
    word,
    score: Math.round(scoreWord(word, freq, knownLetters) * 10) / 10
  })).sort((a, b) => b.score - a.score);
  console.log(`[Wordle Solver] Top ${Math.min(topN, scored.length)} recommendations (score = sum of unknown-letter coverage %%):`);
  console.table(scored.slice(0, topN));
}
async function main() {
  const [guesses, answers] = await Promise.allSettled([loadList('guesses'), loadList('answers')]);
  const guessesList = guesses.status === 'fulfilled' ? guesses.value : [];
  const answersList = answers.status === 'fulfilled' ? answers.value : [];
  const allWords = [...new Set([...guessesList, ...answersList])];
  if (guesses.status === 'rejected') {
    console.warn('[Wordle Solver] Failed to load guesses list:', guesses.reason);
  }
  if (answers.status === 'rejected') {
    console.warn('[Wordle Solver] Failed to load answers list:', answers.reason);
  }
  unsafeWindow.wordleSolver = (regex = /.*/, excludedLetters = '', includedLetters = '', list = 'guesses') => {
    const words = list === 'answers' ? answersList : list === 'all' ? allWords : guessesList;
    return filterWords(words, regex, excludedLetters, includedLetters);
  };
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
    const possible = filterWords(guessesList, regex, excluded, included);
    console.log(`[Wordle Solver] Guess ${completeRows}: regex=${regex} excluded="${excluded}" included="${included}" → ${possible.length} possible words remaining`);
    console.log(possible);
    recommendWords(possible, new Set(included));
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
