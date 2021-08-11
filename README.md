# slrp

> Command line tool for editing text, json, yaml, and xml, as well as data munging through handy functional one-liners


## Getting Started

```bash
npm install -g @kristopherpaulsen/slrp
```

```bash
echo -e "Hello\nWorld" | slrp -n .length

echo "Hello, World" | slrp 'x => x.split(" ")' [0].length

echo "Hello World" | slrp -w .length

echo "Hello World" | slrp -w this.length

curl pants.rip/echo | slrp -j .reqHeaders.host .length

slrp -f /path/to/file.json 'json => ({ ...json, newKey: "value" })'
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

## Property Assessor Shorthand

You can also use the property assessor shorthand for easier manipulation. You can use `this, [],  .` for easier access

```bash
echo "Hello, World" | slrp 'x => x.split(" ")' [0].length
```

or

```bash
echo "Get that length" | slrp .length
```

or

```bash
echo "Hello" | slrp 'split("\w")' this.length
```

## Flags

slrp provides multiple flags for easier one-liners.

`-j, -x, -y`

convert stdin string (json, xml, yaml) into parsed object.
(See property assessor shorthand for easy access and manipulation)

```bash
  curl pants.rip/echo | slrp -j .

  {
    "reqCookies": {},
    "url": "/",
    "params": {},
    "body": {},
    "query": {},
    "reqHeaders": {
      "host": "pants.rip",
      "x-real-ip": "136.60.239.136",
      "x-forwarded-proto": "https",
      "x-forwarded-for": "136.60.239.136",
      "x-forwarded-host": "136.60.239.136",
      "connection": "close",
      "user-agent": "curl/7.58.0",
      "accept": "*/*"
    },
    "resHeaders": {
      "x-powered-by": "Express"
    }
  }
```

`-n`

split stdin into array of strings by newline

```bash
  echo -e "Hello\nWorld" | slrp -n [0]

  # Hello
```

`-w`

split stdin into array of strings by whitespace

```bash
  echo -e "Hello World" | slrp -w [1]

  # World
```

`-f`

slurp file by type, auto parse, and use as stdin.
Supports `.yaml, .yml, .js, .json, .xml`

```bash
  slrp -f 'path/to/file/here.json' 'ojbect => object.someKey'
```

`-p`

slurp file without auto parsing, treated as text

```bash
  slrp -p '/path/to/file/here' 'text => someFunction(text)'
```

`-l`

slrp file and work line-by-line

```bash
  slrp -i -p '/path/to/file/here.txt' 'line => doSomething(line)' 'line => anotherThing(line)'
```

`-i -p`

slurp file and edit in place (no auto parsing);

```bash
  slrp -i -p '/path/to/file/here.txt' 'text => someFunction(text)'
```

`-i -f`

slurp file and edit in place with auto parsing

```bash
  slrp -i -f '/path/to/file/here.json' 'json => ({ ...json, keyHere: "newValue" })'
```

`-l -i -p`

slurp file, edit in place (no auto parsing), line-by-line;

```bash
  slrp -l -i -p '/path/to/file/here.txt' 'line => doSomethingToLine(line)'
```

## Bash autocompletion

`slrp` can take advantage of bash autcompletion

`slrp --update-bash-completion`

Source the script!
```shell
  Success!: Add the following to your .bashrc or .bash_profile

  source $HOME/.config/slrp/slrp-bash-completion.sh
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

Use Custom functions (like lodash/fp) for elegant functional composition,
right from the command line!

```bash
echo "Hello, World" | slrp 'split(" ")' 'map(size)' sum

# 11
```


## About

Heavily inspired by fx and other node command line utilities
