// ==UserScript==
// @name        Wordle Solver
// @namespace   https://hixon.dev
// @description Logs possible Wordle answers to the console after each guess
// @match       https://www.nytimes.com/games/wordle/index.html
// @version     0.2.0
// @author      process.env.AUTHOR
// @grant       unsafeWindow
// @grant       GM_getValue
// @grant       GM_setValue
// @run-at      document-idle
// @downloadURL https://raw.githubusercontent.com/wondermike221/userscripts/main/dist/wordle-solver.user.js
// @homepageURL https://github.com/wondermike221/userscripts
// ==/UserScript==

/**
 * Code here will be ignored on compilation. So it's a good place to leave messages to developers.
 *
 * - The `@grant`s used in your source code will be added automatically by `rollup-plugin-userscript`.
 *   However you have to add explicitly those used in required resources.
 * - `process.env.VERSION` and `process.env.AUTHOR` will be loaded from `package.json`.
 */
