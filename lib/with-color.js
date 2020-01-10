const colorize = require('json-colorizer');

const withColor = (data) => colorize(data, {
  colors: {
    STRING_KEY: 'blueBright',
    STRING_LITERAL: 'green',
    BRACE: 'whiteBright',
    BRACKET: 'whiteBright',
    COMMA: 'whiteBright',
    COLON: 'whiteBright',
    BOOLEAN_LITERAL: 'yellow',
  }
});

module.exports = {
  withColor,
};
