#!/usr/bin/env node
const yargs = require('yargs');
const fs = require('fs');
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
    .option('json', {
      type: 'boolean',
      describe: 'Whether or not to return json',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('rawJson', {
      alias: 'raw-json',
      type: 'boolean',
      describe: 'Whether or not to return as raw json string',
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

  const result = runStringFuncs({
    stdin: getStdin(args),
    stringFuncs: args._,
  });

  printFormatted(args, result);
}

const runStringFuncs = ({ stringFuncs, stdin }) => {
  return stringFuncs.reduce((result, stringFunc) => (
    eval(stringFunc)(result)
  ), stdin);
}

const getStdin = args => {
  const rawStdin = fs.readFileSync(0, 'utf8');

  return args.split ? rawStdin.trim().split("\n") : rawStdin.trim();
}

const printFormatted = (args, result) => {
  if(args.json) {
    console.log(JSON.stringify(result));
  } else if(args.rawJson) {
    console.log(JSON.stringify(JSON.stringify(result)));
  } else {
    console.log(result)
  }
}

main();
