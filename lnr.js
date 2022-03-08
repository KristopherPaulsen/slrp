#!/usr/bin/env node
require = require("esm")(module);
const {
  createWriteStream,
  createReadStream,
  writeFileSync,
  readFileSync,
  copyFileSync
} = require('fs');
const iconv = require('iconv-lite');
const { EOL, ...os } = require('os');
const { keys, assign } = Object;
const getStdin = require('get-stdin');
const readline = require('readline');
const path = require('path');
const chalk = require("chalk");
const yargs = require('yargs');
const tmp = require('tmp');

const CONFIG_PATH = path.join(os.homedir(), '.config', 'slrp');

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
    .option('list', {
      type: 'string',
      describe: 'list all custom functions',
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
    .option('update-bash-completion', {
      type: 'string',
      describe: 'add bash completion file to unixish systems',
      coerce: arg => typeof(arg) !== undefined,
    })
    .wrap(null)
    .argv;

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
  if(args['encode-text'] || args['decode-text']) {
    const stdin = await getStdin();
    return args['encode-text']
      ? iconv.encode(stdin, args['encode-text']).toString()
      : iconv.decode(Buffer.from(stdin), args['decode-text']).toString();
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
