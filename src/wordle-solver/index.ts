import './meta.js?userscript-metadata';

declare global {
  interface Window {
    wordleSolver: (
      regex?: RegExp,
      excludedLetters?: string,
      includedLetters?: string,
      list?: 'guesses' | 'answers' | 'all',
    ) => string[];
  }
}

const REPO_RAW =
  'https://raw.githubusercontent.com/wondermike221/userscripts/main/data';

const LISTS = {
  guesses: {
    url: `${REPO_RAW}/wordle-guesses.json`,
    cacheKey: 'wordleGuesses',
  },
  // Swap in an answers URL once sourced; infrastructure is ready.
  answers: {
    url: `${REPO_RAW}/wordle-answers.json`,
    cacheKey: 'wordleAnswers',
  },
} as const;

type ListName = keyof typeof LISTS;
type TileState = 'correct' | 'present' | 'absent';

interface Tile {
  letter: string;
  state: TileState;
}

async function loadList(name: ListName): Promise<string[]> {
  const { url, cacheKey } = LISTS[name];
  const cached = GM_getValue<string | undefined>(cacheKey);
  if (cached) return JSON.parse(cached) as string[];
  const response = await fetch(url);
  const words = (await response.json()) as string[];
  GM_setValue(cacheKey, JSON.stringify(words));
  return words;
}

function getRevealedTiles(): Tile[] {
  // Exclude <button> elements so keyboard keys (same data-state values) aren't mixed in
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      ':not(button)[data-state="correct"], :not(button)[data-state="present"], :not(button)[data-state="absent"]',
    ),
  )
    .map((el) => ({
      letter: el.textContent?.trim().toLowerCase() ?? '',
      state: el.getAttribute('data-state') as TileState,
    }))
    .filter((tile) => tile.letter.length === 1);
}

function buildConstraints(guesses: Tile[][]): {
  regex: RegExp;
  excluded: string;
  included: string;
} {
  const correct: (string | null)[] = Array(5).fill(null);
  const presentAt: Set<string>[] = Array.from(
    { length: 5 },
    () => new Set<string>(),
  );
  const mustInclude = new Set<string>();
  const neverInWord = new Set<string>();

  for (const row of guesses) {
    for (let i = 0; i < 5; i++) {
      const { letter, state } = row[i];
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

  const excluded = [...neverInWord].filter((l) => !mustInclude.has(l)).join('');
  const included = [...mustInclude].join('');
  const pattern = correct
    .map((l, i) => {
      if (l) return l;
      const notHere = [...presentAt[i]].join('');
      return notHere ? `[^${notHere}]` : '.';
    })
    .join('');

  return { regex: new RegExp(`^${pattern}$`), excluded, included };
}

function filterWords(
  words: string[],
  regex: RegExp,
  excluded: string,
  included: string,
): string[] {
  return words.filter((word) => {
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

function letterFrequency(words: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const word of words) {
    for (const letter of new Set(word)) {
      counts.set(letter, (counts.get(letter) ?? 0) + 1);
    }
  }
  const pct = new Map<string, number>();
  for (const [letter, count] of counts) {
    pct.set(letter, (count / words.length) * 100);
  }
  return pct;
}

function logFrequencyChart(freq: Map<string, number>): void {
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const maxPct = sorted[0]?.[1] ?? 1;
  const BAR = 24;
  const rows = sorted
    .map(([letter, pct]) => {
      const filled = Math.round((pct / maxPct) * BAR);
      const bar = '█'.repeat(filled) + '░'.repeat(BAR - filled);
      return `  ${letter} │${bar}│ ${pct.toFixed(1)}%`;
    })
    .join('\n');
  console.log(
    '[Wordle Solver] Letter frequency in remaining candidates:\n' + rows,
  );
}

function scoreWord(
  word: string,
  freq: Map<string, number>,
  knownLetters: Set<string>,
): number {
  return [...new Set(word)]
    .filter((l) => !knownLetters.has(l))
    .reduce((sum, l) => sum + (freq.get(l) ?? 0), 0);
}

function recommendWords(
  possible: string[],
  knownLetters: Set<string>,
  topN = 10,
): void {
  if (possible.length === 0) return;
  const freq = letterFrequency(possible);
  logFrequencyChart(freq);
  const scored = possible
    .map((word) => ({
      word,
      score: Math.round(scoreWord(word, freq, knownLetters) * 10) / 10,
    }))
    .sort((a, b) => b.score - a.score);
  console.log(
    `[Wordle Solver] Top ${Math.min(topN, scored.length)} recommendations (score = sum of unknown-letter coverage %%):`,
  );
  console.table(scored.slice(0, topN));
}

async function main() {
  const [guesses, answers] = await Promise.allSettled([
    loadList('guesses'),
    loadList('answers'),
  ]);

  const guessesList = guesses.status === 'fulfilled' ? guesses.value : [];
  const answersList = answers.status === 'fulfilled' ? answers.value : [];

  const allWords = [...new Set([...guessesList, ...answersList])];

  if (guesses.status === 'rejected') {
    console.warn(
      '[Wordle Solver] Failed to load guesses list:',
      guesses.reason,
    );
  }
  if (answers.status === 'rejected') {
    console.warn(
      '[Wordle Solver] Failed to load answers list:',
      answers.reason,
    );
  }

  unsafeWindow.wordleSolver = (
    regex = /.*/,
    excludedLetters = '',
    includedLetters = '',
    list = 'guesses',
  ) => {
    const words =
      list === 'answers'
        ? answersList
        : list === 'all'
          ? allWords
          : guessesList;
    return filterWords(words, regex, excludedLetters, includedLetters);
  };

  let lastGuessCount = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function check() {
    const tiles = getRevealedTiles();
    const completeRows = Math.floor(tiles.length / 5);

    if (completeRows <= lastGuessCount) return;
    lastGuessCount = completeRows;

    const guesses: Tile[][] = Array.from({ length: completeRows }, (_, i) =>
      tiles.slice(i * 5, i * 5 + 5),
    );
    const { regex, excluded, included } = buildConstraints(guesses);
    const possible = filterWords(guessesList, regex, excluded, included);

    console.log(
      `[Wordle Solver] Guess ${completeRows}: regex=${regex} excluded="${excluded}" included="${included}" → ${possible.length} possible words remaining`,
    );
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
    attributeFilter: ['data-state'],
  });

  console.log('[Wordle Solver] Loaded. Watching for guesses...');
}

main();
