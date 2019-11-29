#!/usr/bin/env node
const yargs = require('yargs');
const { writeFileSync, readFileSync, unlinkSync } = require('fs');
const os = require('os');
const path = require('path');
const { assign } = Object;
const { withColor } = require('./with-color.js')

const main = () => {
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
    .argv;

  requireGlobalFunctions();

  const result = runStringFuncs({
    stdin: getStdin(args),
    funcs: args._,
  });

  printFormatted(args, result);
}


const requireGlobalFunctions = () => {
  try {
    const { globalFunctions } = require(path.join(os.homedir(), '.config', 'slrp'));
    assign(global, globalFunctions);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
}

const runStringFuncs = ({ funcs, stdin }) => funcs.reduce((result, func) => {
  const isIdentityFunc = /^\.$/;
  const isPropertyAccess = /^\[|^\.\w/;

  if(func.match(isIdentityFunc)) return result;
  if(func.match(isPropertyAccess)) return eval(`result${func}`);

  return eval(func)(result);

}, stdin);

const printFormatted = (args, result) => {
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

const printToFile = (args, rawResult) => {
  const result = typeof(rawResult) === 'string' ? rawResult : JSON.stringify(rawResult);

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

const getStdin = args => {
  const rawStdin = args.exec ? '' : readFileSync(args.file || 0, 'utf8');

  if(args.json || args.file.match(/\.json$/)) {
    return JSON.parse(rawStdin);
  }

  if(args.newline) {
    return rawStdin.trim().split("\n");
  }

  if(args['white-space']) {
    return rawStdin.trim().split(" ");
  }

  return rawStdin.trim();
}

const example = () => `
  echo "Hello, World" | slrp 'x => x.split(" ")' [0].length

  # 6
`;

// -----------------------------------------------------------------------------

main();
