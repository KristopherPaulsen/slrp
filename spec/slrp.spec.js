const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

describe('slrp', () => {

  describe('wip', () => {
    it('wip', () => {
      const slrp = spawnSync('./index.js', {
        input: 'arg1\narg2',
      });

      const result = slrp.stdout.toString();

      expect(result).toMatch('arg1\narg2');
    });
  });
});
