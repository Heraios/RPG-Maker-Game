# Battle system tests

Automated checks for the Smoking Isle plugins (`Smoking Isle/js/plugins/SI_*.js`). They boot the
real game in a headless browser and verify that turns, Fatigue, weapons, Talk, Insight, magic,
elemental states, ranged weapons, mental states, party rules and the test room behave as
designed.

The project folder is never modified: the runner copies the game to a temporary folder, adds the
files Battle Test mode needs, serves it locally and deletes the copy afterwards.

## Running

You need [Node.js](https://nodejs.org). Then, once:

```
cd tests
npm install
npx playwright install chromium
```

and from then on, from the repository root:

```
node tests/run.js              # everything (about 2 minutes)
node tests/run.js talk magic   # only test files whose name contains "talk" or "magic"
```

Each test prints `ok` or `FAIL` with what went wrong. The last line is the total.

## Adding a test

Test files live in `tests/cases/` and export named async functions:

```js
module.exports = {
    'what this checks': async (h, t) => {
        await h.battle();                              // Battle Test against the test troop
        const r = await h.eval(() => $gameActors.actor(2).mhp);
        t.eq(r, 40, 'Yoon has 40 HP');                 // also t.ok(cond, msg), t.between(v, lo, hi, msg)
    }
};
```

`h.newGame()` starts a New Game (the test room) instead, `h.toCommand()` advances a battle until a
command menu is open, and `h.pumpMessages()` presses OK through messages and events.
