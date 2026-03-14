# MarkEdit-proofreading

[MarkEdit](https://github.com/MarkEdit-app/MarkEdit) grammar checker based on [Harper](https://writewithharper.com/).

## Configuration

This extension provides three presets to control how aggressively Harper checks your writing. Presets work by disabling specific [rules](https://writewithharper.com/docs/rules) via [`setLintConfig`](https://writewithharper.com/docs/harperjs/configurerules):

- `"strict"`: All Harper rules are active
- `"standard"` (default): Disables Enhancement, Style, and WordChoice rules
- `"relaxed"`: Also disables Readability, Redundancy, and Repetition rules

You can customize behavior from `settings.json` with the `extension.markeditProofreading` section (see [MarkEdit advanced settings](https://github.com/MarkEdit-app/MarkEdit/wiki/Customization#advanced-settings)):

```json
{
  "extension.markeditProofreading": {
    "lintPreset": "relaxed",
    "lintRules": {
      "SpelledNumbers": false,
      "NoOxfordComma": true
    }
  }
}
```

- `lintPreset`: `"strict"`, `"standard"` (default), or `"relaxed"`
- `lintRules`: per-rule overrides (`true` / `false` / `null`) applied on top of the preset

For a full list of available rule names, see:
https://writewithharper.com/docs/rules
