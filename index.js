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
const getStdin = require('get-stdin');

const convert = require('xml-js');
const CONFIG_PATH = path.join(os.homedir(), '.config', 'slrp');

const XML_OPTIONS = {
  compact: true,
  declarationKey: 'declaration',
  instructionKey: 'instruction',
  attributesKey: 'attributes',
  textKey: 'text',
  cdataKey: 'cdata',
  doctypeKey: 'doctype',
  commentKey: 'comment',
  parentKey: 'parent',
  typeKey: 'type',
  nameKey: 'name',
  elementsKey: 'elements',
};

const main = async () => {
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
    .option('xml', {
      alias: 'x',
      type: 'boolean',
      describe: 'parse incoming xml into object',
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
      describe: 'filepath to use as stdin (performs auto-conversions by filetype)',
      default: '',
      coerce: arg => arg ? path.resolve(arg) : '',
    })
    .option('update-bash-completion', {
      type: 'string',
      describe: 'add bash completion file to unixish systems',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('list', {
      type: 'string',
      describe: 'list all custom functions',
      coerce: arg => typeof(arg) !== undefined,
    })
    .argv;

  if(args.updateBashCompletion) {
    return updateBashCompletion();
  }

  if(args.list) {
    return
  }

  const result = runStringFuncs({
    stdin: await getNormalizedStdin(args),
    funcs: args._,
  });

  if(result === undefined) {
    return;
  }

  if((typeof result).match(/array|object/i)) {
    return console.log(withColor(JSON.stringify(result, null, 2)));
  }

  console.log(result);
}

 // forgive me, for I have sinned
const runStringFuncs = ({ funcs, stdin }) => funcs.reduce((result, func) => {
  const isIdentityFunc = /^\.$/;
  const isPropertyAccess = /^\[|^\.\w/;
  const isThisPropertyAccess = /^this(\.|\[)/;
  const isJsonSpread = /^\{.*\.\.\.this.*\}/gmi;

  if(func.match(isIdentityFunc)) return result;
  if(func.match(isJsonSpread)) return eval(`(function() { return ${func}; })`).call(result);
  if(func.match(isThisPropertyAccess)) return eval(func.replace(/^this/, 'result'));
  if(func.match(isPropertyAccess)) return eval(`result${func}`);

  return eval(func)(result);

}, stdin);

const getNormalizedStdin = async (args) => {
  if(args.json) {
    return JSON.parse(await getStdin());
  }
  if(args.xml) {
    return convert.xml2js(
      await getStdin(),
      XML_OPTIONS
    );
  }
  if(args.file.match(/\.json$|\.js$/)) {
    return require(args.file);
  }
  if(args.file.match(/\.xml$/)) {
    return convert.xml2js(
      readFileSync(args.file, 'utf8'),
      XML_OPTIONS
    );
  }
  if(args.file) {
    const result = readFileSync(args.file, 'utf8').trim();

    if (args.newline) return result.split("\n");
    if (args['white-space']) return result.split(" ");

    return result;
  }
  if(args.newline) {
    return (await getStdin()).trim().split("\n");
  }
  if(args['white-space']) {
    return (await getStdin()).trim().split(" ");
  }

  return await getStdin();
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
    '-p',
    '-x',
    '-j',
    '-x',
    '--in-place',
    '--silent',
    '--exec',
    '--newline',
    '--white-space',
    '--json',
    '--file',
    '--xml',
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
    ___GLOABAL___ = globalFunctions;
    assign(global, globalFunctions);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err
    }
  }
}

const example = () => `
  echo "Hello, World" | slrp 'x => x.split(" ")' [0].length

  # 6
`;

// -----------------------------------------------------------------------------

main();
