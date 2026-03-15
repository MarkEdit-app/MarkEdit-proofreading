# MarkEdit-proofreading

[MarkEdit](https://github.com/MarkEdit-app/MarkEdit) grammar checker based on [Harper](https://writewithharper.com/).

## Installation

Since this extension is very big, install it by downloading `markedit-proofreading.js` from the latest release and copying it to:

`~/Library/Containers/app.cyan.markedit/Data/Documents/scripts`

Restart MarkEdit after copying the file.

## Configuration

This extension provides three presets to control how aggressively Harper checks your writing. Presets disable specific [rules](https://writewithharper.com/docs/rules) via [`setLintConfig`](https://writewithharper.com/docs/harperjs/configurerules) and filter by lint kind as a safety net:

- `"strict"` (default): All Harper rules are active
- `"standard"`: Disables Enhancement, Style, and WordChoice rules
- `"relaxed"`: Also disables Readability, Redundancy, and Repetition rules

You can customize behavior from `settings.json` with the `extension.markeditProofreading` section (see [MarkEdit advanced settings](https://github.com/MarkEdit-app/MarkEdit/wiki/Customization#advanced-settings)):

```json
{
  "extension.markeditProofreading": {
    "autoLintDelay": 1000,
    "addToDict": true,
    "lintPreset": "relaxed",
    "lintRuleOverrides": {
      "SpelledNumbers": false,
      "NoOxfordComma": true
    },
    "disabledLintKinds": ["Regionalism"]
  }
}
```

- `autoLintDelay`: Delay in milliseconds before automatic proofreading runs after a document change (default: `1000`). Set to `-1` to disable automatic proofreading entirely (use "Proofread Now" to lint on demand)
- `addToDict`: When `true` (default), clicking "Ignore" on a flagged word also adds it to a personal dictionary so it won't be flagged in future sessions. Set to `false` to disable this behavior
- `lintPreset`: `"strict"` (default), `"standard"`, or `"relaxed"`
- `lintRuleOverrides`: Per-rule overrides (`true` / `false` / `null`) applied on top of the preset
- `disabledLintKinds`: Additional lint kinds to filter out, available kinds:
  - `Agreement`, `BoundaryError`, `Capitalization`, `Eggcorn`, `Enhancement`
  - `Formatting`, `Grammar`, `Malapropism`, `Miscellaneous`, `Nonstandard`
  - `Punctuation`, `Readability`, `Redundancy`, `Regionalism`, `Repetition`
  - `Spelling`, `Style`, `Typo`, `Usage`, `WordChoice`

For a full list of available rule names, see:
https://writewithharper.com/docs/rules

## Dictionary

When `addToDict` is enabled (default), clicking "Ignore" on a flagged word also adds it to a personal dictionary persisted at `~/Library/Containers/app.cyan.markedit/Data/Documents/proofreading-dict.txt`. Dictionary words are automatically loaded when the extension starts.
