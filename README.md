# MarkEdit-proofreading

[MarkEdit](https://github.com/MarkEdit-app/MarkEdit) grammar checker based on [Harper](https://writewithharper.com/).

## Configuration

By default, this extension uses a conservative lint profile and hides these higher-sensitivity Harper categories:

- `Enhancement`
- `Readability`
- `Repetition`
- `Style`
- `WordChoice`

This is a balanced default for general writing: it keeps grammar/spelling checks while reducing noisy style/readability suggestions. If you prefer maximum strictness, switch to `lintProfile: "all"`.

You can customize behavior from `settings.json` with the `extension.markeditProofreading` section (see MarkEdit advanced settings: https://github.com/MarkEdit-app/MarkEdit/wiki/Customization#advanced-settings):

```json
{
  "extension.markeditProofreading": {
    "lintProfile": "all",
    "disabledLintKinds": ["Regionalism"],
    "lintRules": {
      "SpelledNumbers": false,
      "NoOxfordComma": true
    }
  }
}
```

- `lintProfile`: `"conservative"` (default) or `"all"`
- `disabledLintKinds`: additional lint kinds to hide
- `lintRules`: Harper rule overrides (`true` / `false` / `null`), same shape as `Linter.setLintConfig`

For a user-facing guide to Harper rules, see:
https://writewithharper.com/docs/rules
