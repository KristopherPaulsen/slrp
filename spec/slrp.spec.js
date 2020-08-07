const fs = require('fs');
const path = require('path');
const { execSync, openSync, spawnSync } = require('child_process');
const { withColor } = require('../lib/with-color.js');
const os = require('os');
const tmp = require('tmp');
const parsedNoColor = str => JSON.parse(str.replace(/\u001b\[.*?m/g, ''));

it('passes stdin to string function', () => {
  const slrp = spawnSync('./index.js', ['x => x.length'], {
    input: 'abc',
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('3');
});

it('chains results of two function strings', () => {
  const slrp = spawnSync('./index.js', ['x => x.length', 'x => x + x'], {
    input: 'abc',
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('6');
});

it('calls required functions from custom functions file (lodash global methods)', () => {
  const slrp = spawnSync('./index.js', ['size'], {
    input: 'abc',
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('3');
})

it('chains functions and required custom functions together', () => {
  const slrp = spawnSync('./index.js', ['x => x + x', 'size'], {
    input: 'abc',
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('6');
})

it('this  can access properties', () => {
  const slrp = spawnSync('./index.js', ['-n', 'this[0].length'], {
    input: 'hello\nworld'
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('5');
});

it('this  can spread properties using', () => {
  const slrp = spawnSync('./index.js', ['-j', '{ ...this, added: "newValue" }'], {
    input: '{ "key": "value" }',
  });

  const result = slrp.stdout.toString();

  expect(parsedNoColor(result)).toEqual({ key: "value", added: "newValue" });
});

it('this  can spread properties and use method calls ', () => {
  const slrp = spawnSync('./index.js', ['-j', '{ ...this, added: this.key }'], {
    input: '{ "key": "value" }',
  });

  const result = slrp.stdout.toString();

  expect(parsedNoColor(result)).toEqual({ key: "value", added: "value" });
});

it(`this  doesn't do some tricky dicky regex replace`, () => {
  const slrp = spawnSync('./index.js', ['-j', '{ ...this, added: "this.key" }'], {
    input: '{ "key": "value" }',
  });

  const result = slrp.stdout.toString();

  expect(parsedNoColor(result)).toEqual({ key: "value", added: "this.key" });
});

it('calls method off of data', () => {
  const slrp = spawnSync('./index.js', ['.length'], {
    input: 'hello',
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('5');
});

it('indexes off of data', () => {
  const slrp = spawnSync('./index.js', ['[1]'], {
    input: 'hello',
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('e');
});

it('bracket-notations off of data', () => {
  const slrp = spawnSync('./index.js', ['JSON.parse', '["hello-there"]'], {
    input: JSON.stringify({"hello-there": "hello"}),
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('hello');
})

it('can combine indexing AND method calls', () => {
  const slrp = spawnSync('./index.js', ['x => x.split(" ")', '[0].length'], {
    input: 'hello world'
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('5');
})

it('can combine multiple indexing', () => {
  const slrp = spawnSync('./index.js', ['[0][0]'], {
    input: 'hello world'
  });

  const result = slrp.stdout.toString();

  expect(result).toMatch('h');
});

it('-n  splits newlines', () => {
  const slrp = spawnSync('./index.js', ['-n'], {
    input: 'what\nis\nthis',
  });

  const result = slrp.stdout.toString().trim();

  expect(parsedNoColor(result)).toEqual([ 'what', 'is', 'this' ]);
});

it('-w  splits whitespace', () => {
  const slrp = spawnSync('./index.js', ['-w'], {
    input: 'what is this',
  });

  const result = slrp.stdout.toString().trim();

  expect(parsedNoColor(result)).toEqual(['what', 'is', 'this' ]);
});

it('-f  slurps up file', () => {
  const slrp = spawnSync('./index.js', ['-f', 'spec/file-for-newline-sentences.txt']);

  const result = slrp.stdout.toString().trim();

  expect(result).toMatch("I am\ntest text.");
});

it('-f  slurps up file and auto-parses it if .json', () => {
  const slrp = spawnSync('./index.js', ['-f', 'spec/file-for-suffix-check.json', '.hello']);

  const result = slrp.stdout.toString().trim();

  expect(result).toMatch("world");
});

it('-f  slurps up file and auto-parses it if .js', () => {
  const slrp = spawnSync('./index.js', ['-f', 'spec/file-for-node-exports.js', '.hello']);

  const result = slrp.stdout.toString().trim();

  expect(result).toMatch("world");
});

it('-f  slurps up file and auto-parses it if es6 .js', () => {
  const slrp = spawnSync('./index.js', ['-f', 'spec/file-for-es6-exports.js', '.default.hello']);

  const result = slrp.stdout.toString().trim();

  expect(result).toEqual('world');
});


it('-p  slurps up file and treats as raw text', () => {
  const slrp = spawnSync('./index.js', ['-p', 'spec/file-for-es6-exports.js']);

  expect(slrp.stdout.toString()).toEqual;
});

it('-j  slurps json into a parsed, usable, object', () => {
  const slrp = spawnSync('./index.js', ['-j', '.someKey'], {
    input: JSON.stringify({ someKey: "some value" }),
  });

  const result = slrp.stdout.toString().trim();

  expect(result).toEqual("some value");
});

it('-l  reads line by line, preserving newlines', () => {
  const slrp = spawnSync(
    './index.js',
    ['-l', 'x => x'],
    { input: "first\nsecond\nthird\n" }
  );

  expect(slrp.stdout.toString())
    .toEqual("first\nsecond\nthird\n");
});

it('-i, -f  slurps up file, auto converts data, and edits inplace', () => {
  const tmpFile = tmp.fileSync({ postfix: '.json' });
  fs.writeFileSync(tmpFile.name, '{ "foo": "bar" }');

  spawnSync(
    './index.js',
    ['-i','-f', tmpFile.name, 'x => ({ ...x, new: "key" })']
  );

  expect(JSON.parse(fs.readFileSync(tmpFile.name).toString()))
    .toEqual({
      foo: "bar",
      new: "key",
    });
});

it('-i, -p  slurps up file, treats data as raw text, and edits inplace', () => {
  const tmpFile = tmp.fileSync();
  fs.writeFileSync(tmpFile.name, "Hello world");

  spawnSync(
    './index.js',
    ['-i','-p', tmpFile.name, 'text => text.replace("world", "swirl")']
  );

  expect(fs.readFileSync(tmpFile.name).toString()).toEqual("Hello swirl");
});

it('-l, -p  reads and applies transformations line by line, preserving newlines', () => {
  const slrp = spawnSync(
    './index.js',
    ['-l','-p', 'spec/file-for-checking-linewise.txt', 'x => x']
  );

  expect(slrp.stdout.toString())
    .toEqual(fs.readFileSync('spec/file-for-checking-linewise.txt').toString());
});

it('-l, -p  reads and applies transformations line by line, preserving newlines on one line', () => {
  const slrp = spawnSync(
    './index.js',
    ['-l','-p', 'spec/file-for-checking-linewise-off-by-one.txt', 'x => x']
  );

  expect(slrp.stdout.toString())
    .toEqual(fs.readFileSync('spec/file-for-checking-linewise-off-by-one.txt').toString());
});

it('-l, -p  reads and excludes line using SLRP.EXCLUDE', () => {
  const slrp = spawnSync(
    './index.js',
    ['-l','-p', 'spec/file-for-checking-linewise.txt', 'x => x.length ? x : SLRP.EXCLUDE']
  );

  expect(slrp.stdout.toString())
    .toEqual("first\nsecond\n");
});

it('-l, -i, -p  slurps up file, and "edits" multiple times preserving newlines', () => {
  const tmpFile = tmp.fileSync();
  fs.writeFileSync(tmpFile.name, 'first\nsecond\nthird\n');

  spawnSync( './index.js', ['-l', '-i','-p', tmpFile.name, 'x => x']);
  spawnSync( './index.js', ['-l', '-i','-p', tmpFile.name, 'x => x']);
  spawnSync( './index.js', ['-l', '-i','-p', tmpFile.name, 'x => x']);
  spawnSync( './index.js', ['-l', '-i','-p', tmpFile.name, 'x => x']);

  expect(fs.readFileSync(tmpFile.name).toString())
    .toEqual('first\nsecond\nthird\n')
});

it('-n, -f  splits newlines and slurps file', () => {
  const slrp = spawnSync('./index.js', ['-f', 'spec/file-for-newline-sentences.txt', '-n']);

  const result = slrp.stdout.toString().trim();

  expect(parsedNoColor(result)).toEqual([ 'I am', 'test text.' ]);
});

it('-w, -f  splits whitespace and slurps file', () => {
  const slrp = spawnSync('./index.js', ['-w', '-f', 'spec/file-for-newline-sentences.txt']);

  const result = slrp.stdout.toString().trim();

  expect(parsedNoColor(result)).toEqual([ "I", "am\ntest", "text." ]);
});

describe('trimming, or not trimming, line endings', () => {
  it('does not trim line endings if present', () => {
    const slrp = spawnSync('./index.js', ['x => x.length'], {
      input: 'abc\n'
    });

    const result = slrp.stdout.toString();

    expect(parsedNoColor(result)).toEqual(4);
  });

  it('does not add line endings', () => {
    const slrp = spawnSync('./index.js', ['x => x.length'], {
      input: 'abc'
    });

    const result = slrp.stdout.toString().trim();

    expect(result).toEqual(3);
  });
});

describe('multiple piping', () => {
  const itDockerOnly = process.env.SLRP_DOCKER_TEST ? it : it.skip;

  itDockerOnly('should test linux code only', () => {
    const result = execSync(
      `echo  '{ "hello": "world" }' | node ./index.js -j | node ./index.js -j .hello`
    ).toString().trim();

    expect(result).toBe("world");
  });
});


// check for line endings
// check for line beginings
