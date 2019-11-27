const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { withColor } = require('../with-color.js');

const parsedNoColor = str => JSON.parse(str.replace(/\u001b\[.*?m/g, ''));

describe('slrp', () => {

  describe('chaining functions', () => {
    it('passes stdin to string function', () => {
      const slrp = spawnSync('./index.js', ['x => x.length'], {
        input: 'hello',
      });

      const result = slrp.stdout.toString();

      expect(result).toMatch('5');
    });

    it('chains results of two function strings', () => {
      const slrp = spawnSync('./index.js', ['x => x.length', 'x => x + x'], {
        input: 'hello',
      });

      const result = slrp.stdout.toString();

      expect(result).toMatch('10');
    });

    it('calls required functions from custom functions file (lodash global methods)', () => {
      const slrp = spawnSync('./index.js', ['size'], {
        input: 'hello',
      });

      const result = slrp.stdout.toString();

      expect(result).toMatch('5');
    })

    it('chains functions and required custom functions together', () => {
      const slrp = spawnSync('./index.js', ['x => x + x', 'size'], {
        input: 'hello',
      });

      const result = slrp.stdout.toString();

      expect(result).toMatch('10');
    })
  });


  describe('property assessory shorthad', () => {
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
  })

  describe('flags', () => {
    it('splits newlines with -n', () => {
      const slrp = spawnSync('./index.js', ['-n'], {
        input: 'what\nis\nthis',
      });

      const result = slrp.stdout.toString().trim();

      expect(parsedNoColor(result)).toEqual([ 'what', 'is', 'this' ]);
    });

    it('splits whitespace with -w', () => {
      const slrp = spawnSync('./index.js', ['-w'], {
        input: 'what is this',
      });

      const result = slrp.stdout.toString().trim();

      expect(parsedNoColor(result)).toEqual(['what', 'is', 'this' ]);
    });

    it('slurps up file -f', () => {
      const slrp = spawnSync('./index.js', ['-f', 'spec/test-file.txt']);

      const result = slrp.stdout.toString().trim();

      expect(result).toMatch("I am\ntest text.");
    });

    it('slurps json into a parsed, usable, object -j', () => {
      const slrp = spawnSync('./index.js', ['-j', '.someKey'], {
        input: JSON.stringify({ someKey: "some value" }),
      });

      const result = slrp.stdout.toString().trim();

      expect(result).toEqual("some value");
    });

    it('returns nothing if using silent flag without explicit printing -s', () => {
      const slrp = spawnSync('./index.js', ['-s'], {
        input: JSON.stringify({ someKey: "some value" }),
      });

      const result = slrp.stdout.toString().trim();

      expect(result).toEqual('');
    });

    it('only prints if user specifies when using silent flag -s', () => {
      const slrp = spawnSync('./index.js', ['() => console.log("custom print")']);

      const result = slrp.stdout.toString().trim();

      expect(result).toEqual('custom print');
    });

    //TODO: test for exec silent and chaining

    it('', () => {
      const slrp = spawnSync('./index.js', ['() => console.log("custom print")']);

      const result = slrp.stdout.toString().trim();

      expect(result).toEqual('custom print');
    });
  })

  describe('chaning funcs, flags, and files', () => {
    it('splits newlines with -n and slurps file', () => {
      const slrp = spawnSync('./index.js', ['-f', 'spec/test-file.txt', '-n']);

      const result = slrp.stdout.toString().trim();

      expect(parsedNoColor(result)).toEqual([ 'I am', 'test text.' ]);
    });

    it('splits whitespace with -w and slurps file', () => {
      const slrp = spawnSync('./index.js', ['-w', '-f', 'spec/test-file.txt']);

      const result = slrp.stdout.toString().trim();

      expect(parsedNoColor(result)).toEqual([ "I", "am\ntest", "text." ]);
    });
  });

  // weird inputs
  //  no stdin
  //  no file
  //  defaults to file when using stdin

});
