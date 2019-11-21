#!/usr/bin/env node
const yargs = require('yargs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const print = require('./print.js');
const utils = require('./utils');
let $, _;

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

  requireGlobalFunctions();

  const result = runStringFuncs({
    stdin: getStdin(args),
    funcs: args._,
  });

  printFormatted(args, result);
}

const runStringFuncs = ({ funcs, stdin }) => funcs.reduce((result, func) => {
  if(typeof(func) === 'string' && func.match(/\[\d+\]|^\./)) {
    return eval(`result${func}`);
  }

  return eval(func)(result);

}, stdin);

const requireGlobalFunctions = () => {
  try {
    const { helper, addToGlobal } = require(path.join(os.homedir(), '.config', 'slrp'));

    Object.assign(global, addToGlobal);

    throwIfHelperGlobalNamespaceClash();

    eval(`${helper} = utils`);

  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
}

const throwIfHelperGlobalNamespaceClash = (helper = '') => {
  if(helper in global) {
    throw new Error(
      `${helper} is already defined in global namespace, try a different name.`
    )
  }
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
    console.log(print(result)[0])
  }
}

main();
