type ReadFileCallback = (err: Error | null, data?: Uint8Array) => void;

export function readFile(_path: string, callback: ReadFileCallback): void {
  callback(new Error('fs.readFile is unavailable in browser builds.'));
}
