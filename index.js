#!/usr/bin/env node
global.require = require("esm")(module);
const {
  createWriteStream,
  createReadStream,
  writeFileSync,
  readFileSync,
  copyFileSync
} = require('fs');
const iconv = require('iconv-lite');
const { EOL, ...os } = require('os');
const { completionTemplate } = require('./lib/bash-completion-template.js');
const { withColor } = require('./lib/with-color.js')
const { keys, assign } = Object;
const getStdin = require('get-stdin');
const readline = require('readline');
const path = require('path');
const chalk = require("chalk");
const yargs = require('yargs');
const convert = require('xml-js');
const tmp = require('tmp');
const YAML = require('yaml');

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
    .option('yaml', {
      alias: 'y',
      type: 'boolean',
      describe: 'parse incoming yaml into object',
      coerce: arg => typeof(arg) !== undefined,
    })
    .option('file', {
      alias: 'f',
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
    .option('encode-text', {
      type: 'string',
      describe: 'encode text using chosen charset',
    })
    .option('decode-text', {
      type: 'string',
      describe: 'decode text using chosen charset',
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
    .wrap(null)
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

  if(!result) {
    return;
  }

  if(args.inplace) {
    return writeToFile({ args, result });
  }

  if((typeof result).match(/array|object/i)) {
    return console.log(withColor(JSON.stringify(result, null, 2)));
  }

  (typeof result) === "string"
    ? process.stdout.write(result)
    : process.stdout.write(result.toString());
}

const runStringFuncs = ({ stdin, funcs, args }) => {
  if(!args.linewise) return funcs.reduce(evaluate, stdin);

  const file = args.inplace
    ? tmp.fileSync()
    : null;

  const outstream = args.inplace
    ? createWriteStream(file.name, { flags: 'a' })
    : process.stdout;

  stdin.on('line', line => {
    const output = funcs.reduce(evaluate, line);

    if(output === SLRP.EXCLUDE) return;

    outstream.write(output + EOL)
  })
  .on('close', () => {
      if(args.inplace) createReadStream(file.name).pipe(createWriteStream(args.path))
  });
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
    const json = (await getStdin()).trim();
    try {
      return JSON.parse(json);
    } catch(error) {
      return parseMalformedJson(json, error);
    }
  }

  if(args.xml) {
    return convert.xml2js(
      await getStdin(),
      XML_OPTIONS
    );
  }

  if(args['encode-text'] || args['decode-text']) {
    const stdin = await getStdin();
    return args['encode-text']
      ? iconv.encode(stdin, args['encode-text']).toString()
      : iconv.decode(Buffer.from(stdin), args['decode-text']).toString();
  }

  if(args.yaml) {
    return YAML.parse(await getStdin(), 'utf8')
  }

  if(args.file.match(/\.yaml|\.yml/)) {
    return YAML.parse(readFileSync(args.file, 'utf8'));
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

  if(args.file || args.path) {
    const result = readFileSync(args.file || args.path, 'utf8');

    if (args.newline) return result.trim().split(EOL);
    if (args['white-space']) return result.trim().split(" ");
    if (args.linewise) return readline.createInterface({
      input: createReadStream(args.path)
    })

    return result
  }

  if(args.newline) {
    return (await getStdin()).trim().split(EOL);
  }

  if(args['white-space']) {
    return (await getStdin()).split(" ");
  }

  if(args.linewise) {
    return readline.createInterface({
      input: process.stdin,
    })
  }

  return await getStdin();
}

const parseMalformedJson = (json, originalError) => {
  const attempts = [
    () => json.split(EOL).map(JSON.parse),
    () => json.split(/(?<=}|])\s?(?={|])/gi).map(JSON.parse),
    () => JSON.parse(json + "}"),
    () => JSON.parse(json + "]"),
  ];

  for (const attempt of attempts) {
    try {
      return attempt(json);
    } catch {}
  }

  throw originalError;
}

const writeToFile = ({ args, result }) => {
  const filePath = args.file || args.path;

  if(args.linewise) {
    return writeFileSync(filePath, result.join(EOL) + EOL, 'utf8');
  }

  if(filePath.match(/\.yaml|\.yml/)) {
    return writeFileSync(filePath, YAML.stringify(result), 'utf8');
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
    '-y',
    '-x',
    '-i',
    '--silent',
    '--exec',
    '--newline',
    '--white-space',
    '--json',
    '--file',
    '--xml',
    '--encode-text',
    '--decode-text',
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
