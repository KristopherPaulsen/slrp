#!/usr/bin/env node
const yargs = require('yargs');
const { readFileSync } = require('fs');
const os = require('os');
const path = require('path');

const main = async () => {
  const args = yargs
    .option('split', {
      alias: 's',
      type: 'boolean',
      describe: 'split stdin by newlines into array of strings',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('file', {
      alias: 'f',
      type: 'string',
      describe: 'split stdin by newlines into array of strings',
      coerce: path.resolve,
    })
    .argv;

  requireGlobalFunctions();

  const result = runStringFuncs({
    stdin: getStdin(args),
    funcs: args._,
  });

  console.log(result);
}

const runStringFuncs = ({ funcs, stdin }) => funcs.reduce((result, func) => {
  if(typeof(func) === 'string' && func.match(/\[\d+\]|^\./)) {
    return eval(`result${func}`);
  }

  return eval(func)(result);

}, stdin);

const requireGlobalFunctions = () => {
  try {
    require(path.join(os.homedir(), '.config', 'slrp'));
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
}

const getStdin = args => {
  const rawStdin = readFileSync(args.file || 0, 'utf8');
  if(args.split) {
    return rawStdin.trim().split("\n");
  }

  return rawStdin.trim();
}

// -----------------------------------------------------------------------------

main();
