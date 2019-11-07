#!/usr/bin/env node
const yargs = require('yargs');
const fs = require('fs');
const os = require('os');
const path = require('path');

const main = async () => {
  const args = yargs
    .option('print', {
      alias: 'p',
      type: 'boolean',
      describe: 'To print, or not to print, that is the question',
      coerce: arg => typeof(arg) !== undefined,
    })
    .argv;

  try {
    require(path.join(os.homedir(), '.config', 'slrp'));
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }

  /* eslint-disable-next-line */
  const stdin = fs.readFileSync(0, 'utf8');

  const stringFuncs = args._;

  const result = stringFuncs.reduce((result, stringFunc) => (
    eval(stringFunc)(result)
  ), stdin.trim());

  if(args.print) console.log(result);
}

main();
