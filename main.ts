import { lint } from './src/lint';

(async () => {
  // For testing purpose only
  const results = lint('Helllo, is this something you want?');
  console.log(results);
})();
