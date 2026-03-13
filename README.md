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

You can customize behavior from `settings.json` with the `extension.markeditProofreading` section:

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

References:

- MarkEdit settings/customization: https://github.com/MarkEdit-app/MarkEdit/wiki/Customization#advanced-settings
- Harper.js API reference: https://writewithharper.com/docs/harperjs/ref/harper.js.html
