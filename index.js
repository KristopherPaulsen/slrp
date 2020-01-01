#!/usr/bin/env node
require = require("esm")(module);
const yargs = require('yargs');
const { writeFileSync, readFileSync } = require('fs');
const os = require('os');
const path = require('path');
const chalk = require("chalk");
const { completionTemplate } = require('./lib/bash-completion-template.js');
const { withColor } = require('./lib/with-color.js')
const { keys, assign } = Object;

const CONFIG_PATH = path.join(os.homedir(), '.config', 'slrp');

const main = () => {
  requireGlobalFunctions();
  process.stdin.setEncoding('utf8');

  const args = yargs
    .example(example())
    .option('newline', {
      alias: 'n',
      type: 'boolean',
      describe: 'split stdin by newlines into array of strings',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('white-space', {
      alias: 'w',
      type: 'boolean',
      describe: 'split stdin by whitespace into array of strings',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('json', {
      alias: 'j',
      type: 'boolean',
      describe: 'parse incoming json into object',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('file', {
      alias: 'f',
      type: 'string',
      describe: 'path to file to use as stdin',
      default: '',
      coerce: arg => arg ? path.resolve(arg) : '',
    })
    .option('silent', {
      alias: 's',
      type: 'boolean',
      describe: 'Toggling on will allow you to controll output yourself,\n' +
                'and remove automatic printing of last result.',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('exec', {
      alias: 'e',
      type: 'boolean',
      describe: 'Run in execute mode, no longer using stdin. Runs in silent by default (see -s)',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('in-place', {
      alias: 'i',
      type: 'string',
      describe: 'edit the file in-place',
      coerce: arg => {
        if((typeof(arg)).match(/boolean|null|undefined/gi)) {
          return { backupName: '' };
        }
        return { backupName: arg }
      },
    })
    .option('update-bash-completion', {
      type: 'string',
      describe: 'add bash completion file to unixish systems',
      coerce: arg => typeof(arg) !== undefined,
    })
    .argv;

  if(args.updateBashCompletion) {
    return updateBashCompletion();
  }

  if(args.exec || args.file) {
    return runAndPrint(args);
  }

  process.stdin.on('data', stdin => runAndPrint(args, stdin));
}

const runAndPrint = (args, rawStdin) => {
  const stdin = rawStdin || args.exec || readFileSync(args.file);

  const result = runStringFuncs({
    stdin: formatStdin(stdin, args),
    funcs: args._,
  });

  if(args.inPlace) {
    return printToFile(args, result);
  }
  if(args.silent || args.exec || result === undefined) {
    return;
  }
  if((typeof result).match(/array|object/i)) {
    return console.log(withColor(JSON.stringify(result, null, 2)));
  }

  console.log(result);
}

const formatStdin = (stdin, args) => {
  stdin = stdin.toString().trim();

  if(args.json || args.file.match(/\.json$/)) {
    return JSON.parse(stdin);
  }

  if(args.file.match(/\.js$/)) {
    return require(path.resolve(args.file));
  }

  if(args.newline) {
    return stdin.split("\n");
  }

  if(args['white-space']) {
    return stdin.split(" ");
  }

  return stdin;
}

const updateBashCompletion = () => {

  const pathToCompletions = path.join(CONFIG_PATH, 'slrp-bash-completion.sh');

  const completions = [
    '-i',
    '-e',
    '-e',
    '-s',
    '-n',
    '-w',
    '-f',
    '-j',
    '--in-place',
    '--silent',
    '--exec',
    '--newline',
    '--white-space',
    '--json',
    '--file',
    '--update-bash-completion',
    ...keys(require(CONFIG_PATH).globalFunctions),
  ];

  writeFileSync(
    pathToCompletions,
    completionTemplate(completions),
    'utf8'
  );

  console.log(
    '\n' +
    chalk`{green Success!}: Add the following to your {bold .bashrc} or {bold .bash_profile}\n\n` +
    chalk`{italic source $HOME/.config/slrp/slrp-bash-completion.sh}`
  )
}

const requireGlobalFunctions = () => {
  try {
    const { globalFunctions } = require(CONFIG_PATH);
    assign(global, globalFunctions);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
}

const printToFile = (args, rawResult) => {
  const result = typeof(rawResult) === 'string'
    ? rawResult
    : JSON.stringify(rawResult, null, '  ');

  const tempPath = path.resolve(
    args.file + args.inPlace.backupName
  );

  if(args.inPlace.backupName) {
    writeFileSync(tempPath, result, 'utf8');
    writeFileSync(args.file, result);
  } else {
    writeFileSync(args.file, result, 'utf8');
  }
}


const runStringFuncs = ({ funcs, stdin }) => funcs.reduce((result, func) => {
  const isIdentityFunc = /^\.$/;
  const isPropertyAccess = /^\[|^\.\w/;
  const isThisPropertyAccess = /^this(\.|\[)/;
  const isJsonSpread = /^\{.*\.\.\.this.*\}/gmi;

  if(func.match(isIdentityFunc)) return result;
  if(func.match(isJsonSpread)) return eval(`(function() { return ${func}; })`).call(result); // forgive me, for I have sinned
  if(func.match(isThisPropertyAccess)) return eval(func.replace(/^this/, 'result'));
  if(func.match(isPropertyAccess)) return eval(`result${func}`);

  return eval(func)(result);

}, stdin);

const example = () => `
  echo "Hello, World" | slrp 'x => x.split(" ")' [0].length

  # 6
`;

// -----------------------------------------------------------------------------

main();
