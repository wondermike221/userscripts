import './meta.js?userscript-metadata';

declare global {
  interface Window {
    wordleSolver: (
      regex?: RegExp,
      excludedLetters?: string,
      includedLetters?: string,
    ) => string[];
  }
}

const WORDS_URL =
  'https://raw.githubusercontent.com/chidiwilliams/wordle/main/src/data/words.json';

type TileState = 'correct' | 'present' | 'absent';

interface Tile {
  letter: string;
  state: TileState;
}

async function loadWords(): Promise<string[]> {
  const response = await fetch(WORDS_URL);
  return response.json();
}

function getRevealedTiles(): Tile[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-state="correct"], [data-state="present"], [data-state="absent"]',
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
  const mustInclude = new Set<string>();
  const neverInWord = new Set<string>();

  for (const row of guesses) {
    for (let i = 0; i < 5; i++) {
      const { letter, state } = row[i];
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
  const excluded = [...neverInWord].filter((l) => !mustInclude.has(l)).join('');
  const included = [...mustInclude].join('');
  const pattern = correct.map((l) => l ?? '.').join('');

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

async function main() {
  const words = await loadWords();

  unsafeWindow.wordleSolver = (
    regex = /.*/,
    excludedLetters = '',
    includedLetters = '',
  ) => filterWords(words, regex, excludedLetters, includedLetters);

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
    const possible = filterWords(words, regex, excluded, included);

    console.log(
      `[Wordle Solver] Guess ${completeRows}: ${possible.length} possible words remaining`,
    );
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
    attributeFilter: ['data-state'],
  });

  console.log('[Wordle Solver] Loaded. Watching for guesses...');
}

main();
