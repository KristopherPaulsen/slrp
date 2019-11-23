#!/usr/bin/env node
const yargs = require('yargs');
const { readFileSync } = require('fs');
const os = require('os');
const path = require('path');

const example = `
  echo "Hello, World" | slrp 'x => x.split(" ")' [0].length

  # 6
`;

const epilogue = `

`;

const main = async () => {
  const args = yargs
    .example(example)
    .option('newline', {
      alias: ['new-line', 'n'],
      type: 'boolean',
      describe: 'split stdin by newlines into array of strings',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('white', {
      alias: ['white-space', 'w'],
      type: 'boolean',
      describe: 'split stdin by whitespace into array of strings',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('file', {
      alias: 'f',
      type: 'string',
      describe: 'path to file to use as stdin',
      coerce: path.resolve,
    })
    .epilogue(epilogue)
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

  if(args.newline) {
    return rawStdin.trim().split("\n");
  }

  if(args.white) {
    return rawStdin.trim().split(" ");
  }

  return rawStdin.trim();
}

// -----------------------------------------------------------------------------

main();

