const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { withColor } = require('../with-color.js');
const os = require('os');

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


  describe('property assessor shorthand', () => {
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
      const slrp = spawnSync('./index.js', ['-f', 'spec/newline-separated-sentences.txt']);

      const result = slrp.stdout.toString().trim();

      expect(result).toMatch("I am\ntest text.");
    });

    it('-j  slurps json into a parsed, usable, object', () => {
      const slrp = spawnSync('./index.js', ['-j', '.someKey'], {
        input: JSON.stringify({ someKey: "some value" }),
      });

      const result = slrp.stdout.toString().trim();

      expect(result).toEqual("some value");
    });

    it('-s  returns nothing if using silent flag without explicit printing', () => {
      const slrp = spawnSync('./index.js', ['-s'], {
        input: JSON.stringify({ someKey: "some value" }),
      });

      const result = slrp.stdout.toString().trim();

      expect(result).toEqual('');
    });

    it('-s  prints ONLY user-specified output', () => {
      const slrp = spawnSync('./index.js',  ['-s', '() => console.log("custom print")'], {
        input: 'unused',
      });

      const result = slrp.stdout.toString().trim();

      expect(result).toEqual('custom print');
    });

    it('-e  executes single statement without stdin', () => {
      const slrp = spawnSync('./index.js', ['-e', '() => console.log("custom print")']);

      const result = slrp.stdout.toString().trim();

      expect(result).toEqual('custom print');
    });

    //TODO: test for pretty print formatting
  })

  describe('chaning funcs, flags, and files', () => {
    it('-n, -f  splits newlines and slurps file', () => {
      const slrp = spawnSync('./index.js', ['-f', 'spec/newline-separated-sentences.txt', '-n']);

      const result = slrp.stdout.toString().trim();

      expect(parsedNoColor(result)).toEqual([ 'I am', 'test text.' ]);
    });

    it('-w, -f  splits whitespace and slurps file', () => {
      const slrp = spawnSync('./index.js', ['-w', '-f', 'spec/newline-separated-sentences.txt']);

      const result = slrp.stdout.toString().trim();

      expect(parsedNoColor(result)).toEqual([ "I", "am\ntest", "text." ]);
    });
  });

  // weird inputs
  //  no stdin
  //  no file
  //  defaults to file when using stdin

});
