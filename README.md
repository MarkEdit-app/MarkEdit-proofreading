# MarkEdit-proofreading

[MarkEdit](https://github.com/MarkEdit-app/MarkEdit) grammar checker based on [Harper](https://writewithharper.com/).

## Configuration

By default, this extension uses a conservative lint profile and hides these higher-sensitivity Harper categories:

- `Enhancement`
- `Readability`
- `Repetition`
- `Style`
- `WordChoice`

You can customize behavior from `settings.json` with the `markedit-proofreading` section:

```json
{
  "markedit-proofreading": {
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
