#!/usr/bin/env node
require = require("esm")(module);
const { writeFileSync, readFileSync } = require('fs');
const { EOL, ...os } = require('os');
const { completionTemplate } = require('./lib/bash-completion-template.js');
const { withColor } = require('./lib/with-color.js')
const { keys, assign } = Object;
const getStdin = require('get-stdin');
const path = require('path');
const chalk = require("chalk");
const yargs = require('yargs');
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

const SLRP = {
  EXCLUDE: 'SLRP_EXCLUDE',
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
    .option('list', {
      type: 'string',
      describe: 'list all custom functions',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('inplace', {
      alias: 'i',
      type: 'boolean',
      describe: 'whether or not to edit file in place',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('linewise', {
      alias: 'l',
      type: 'boolean',
      describe: 'whether or not to edit each line individually',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('path', {
      alias: 'p',
      type: 'string',
      describe: 'path to file to slrp verbatim',
      default: '',
      coerce: arg => arg ? path.resolve(arg) : '',
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

  if(args.list) {
    return keys(require(CONFIG_PATH).globalFunctions)
      .sort()
      .forEach(fn => console.log(fn))
  }

  const result = runStringFuncs({
    args,
    stdin: await getNormalizedStdin(args),
    funcs: args._,
  })

  if(args.inplace) {
    return writeToFile({ args, result });
  }

  if(result === undefined) {
    return;
  }

  if(args.linewise) {
    return console.log(result.join(EOL));
  }

  if((typeof result).match(/array|object/i)) {
    return console.log(withColor(JSON.stringify(result, null, 2)));
  }

  console.log(result);
}

const runStringFuncs = ({ stdin, funcs, args }) => {
  if(!args.linewise) return funcs.reduce(evaluate, stdin);

  return stdin.reduce((result, line) => {
    const output = funcs.reduce(evaluate, line)
    return output === SLRP.EXCLUDE ? result : [
      ...result,
      output,
    ];
  }, []);
}

const evaluate = (result, func) => {
  const isIdentityFunc = /^\.$/;
  const isPropertyAccess = /^\[|^\.\w/;
  const isThisPropertyAccess = /^this(\.|\[)/;
  const isJsonSpread = /^\{\s*\.\.\.this.*\}/gmi;

  if(func.match(isIdentityFunc)) return result;
  if(func.match(isJsonSpread)) return eval(`(function() { return ${func}; })`).call(result);
  if(func.match(isThisPropertyAccess)) return eval(func.replace(/^this/, 'result'));
  if(func.match(isPropertyAccess)) return eval(`result${func}`);

  return eval(func)(result);
}

const getNormalizedStdin = async (args) => {
  if(args.json) {
    return JSON.parse(await getStdin());
  } else if(args.xml) {
    return convert.xml2js(
      await getStdin(),
      XML_OPTIONS
    );
  } else if(args.file.match(/\.json$|\.js$/)) {
    return require(args.file);
  } else if(args.file.match(/\.xml$/)) {
    return convert.xml2js(
      readFileSync(args.file, 'utf8'),
      XML_OPTIONS
    );
  } else if(args.file || args.path) {
    const result = readFileSync(args.file || args.path, 'utf8');

    if (args.newline) return result.trim().split(EOL);
    if (args['white-space']) return result.trim().split(" ");
    if (args.linewise) return result
        .replace(/\r\n|\n\r|\n|\r/gi, EOL)
        .split(EOL)
        .slice(0, -1);

    return result;
  } else if(args.newline) {
    return (await getStdin()).trim().split(EOL);
  } else if(args['white-space']) {
    return (await getStdin()).trim().split(" ");
  } else {
    return await getStdin();
  }
}

const writeToFile = ({ args, result }) => {
  const filePath = args.file || args.path;

  if(args.linewise) {
    return writeFileSync(filePath, result.join(EOL), 'utf8');
  }

  if(filePath.match(/\.json$|\.js$/)) {
    return writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');
  }

  if(filePath.match(/\.xml$/)) {
    return convert.json2xml(JSON.stringify(result), XML_OPTIONS);
  }

  writeFileSync(filePath, result, 'utf8');
}

const updateBashCompletion = () => {

  const pathToCompletions = path.join(CONFIG_PATH, 'slrp-bash-completion.sh');

  const completions = [
    '-e',
    '-s',
    '-n',
    '-w',
    '-f',
    '-p',
    '-x',
    '-j',
    '-x',
    '-i',
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
    global.SLRP = SLRP;
    assign(global, require(CONFIG_PATH).globalFunctions);
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
