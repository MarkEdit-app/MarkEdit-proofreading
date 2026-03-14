import { MarkEdit } from 'markedit-api';

const dictionaryFileName = 'harper-dictionary.txt';

function dictionaryPath(): string {
  return `${MarkEdit.getDirectoryPath('library')}/${dictionaryFileName}`;
}

export async function loadWords(): Promise<string[]> {
  const content = await MarkEdit.getFileContent(dictionaryPath());
  if (!content) {
    return [];
  }

  return parseWords(content);
}

export async function saveWords(words: string[]): Promise<void> {
  await MarkEdit.createFile({
    path: dictionaryPath(),
    string: words.join('\n'),
    overwrites: true,
  });
}

export function parseWords(content: string): string[] {
  return content.split('\n').map(w => w.trim()).filter(w => w.length > 0);
}
