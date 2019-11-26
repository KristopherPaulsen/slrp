# slrp
> Make the node command line great again

</br>

## Getting Started

```bash
npm install -g @kcpaulsen/slrp
```

```bash
echo "Hello, World" | slrp 'x => x.split(" ")' [0].length

# 6
```

## Chaining Functions

slrp allows for chaining results of one function to another.

```bash
echo "Hello, World" | slrp 'x => x.split(" ")' 'x => x.map(word => word.length)'

[
  6,
  5
]
```

You can also use the property assessor shorthand for easier manipulation

```bash
echo "Hello, World" | slrp 'x => x.split(" ")' [0].length

# 6
```

Manipulate the stdin as a string

```bash
echo "Hello, World" | slrp 'x => x.replace(/o/gi, "0")'

# Hell0, W0rld
```

Use Custom functions (like lodash/fp) for easier commands (See Custom Functions)

```bash
echo "Hello, World" | slrp 'split(" ")' 'map(size)' sum

# 11
```

## Flags

slrp provides multiple flags for easier one-liners

`-n`

split stdin into array of strings by newline

```bash
  echo -e "Hello\nWorld" slrp -n [0]

  # Hello
```

`-w`

split stdin into array of strings by whitespace

```bash
  echo -e "Hello World" slrp -w [1]

  # World
```

`-f`

slurp file path and use as stdin

```bash
  slrp -f 'path/to/file/here' 'x => someFunctionHere()'
```

`-s`

Silence, or suppress automatic printing of result. Useful for sideffect one-liners

```bash
slrp -s '() => console.log("Just me!")'

# Just me!
```

## Custom Functions

You can include custom functions to be imported / required as part of slrp.
Any functions installed globally by npm, and included in the config file will be available

* Add to $HOME/.config/slrp/index.js

```
module.exports = {
  globalFunctions: {
    ...require('lodash/fp'),
  }
}
```

## About

Heavily inspired by fx and other node command line utilities
