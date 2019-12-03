# slrp

> Make the node command line great again
</br>

## Getting Started

```bash
npm install -g @kcpaulsen/slrp
```

```bash
echo -e "Hello\nWorld" | slrp -n .length

echo "Hello, World" | slrp 'x => x.split(" ")' [0].length

echo "Hello World" | slrp -w .length

echo "Hello World" | slrp -w this.length

curl pants.rip/echo | slrp -j .reqHeaders.host .length

slrp -i -f /path/to/file.json 'json => ({ ...json, newKey: "value" })'

slrp -i -f /path/to/file.json '{ ...this, newKey: "value" }'

slrp -i -f /path/to/file.txt 'text => text.replace("a", "b")'
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

You can also use the property assessor shorthand for easier manipulation.
You can use "this", "[]" or "." for easier access

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

`-j`

slurp stdin string into parsed object.
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

slurp file path and use as stdin

```bash
  slrp -f 'path/to/file/here' 'x => someFunctionHere()'
```

`-s`

Silence, or suppress automatic printing of result. Useful for side-effect one-liners,
or controlling printing yourself.

```bash
echo "I will print it MY way" | slrp -s 'x => console.log(x)'

# I will print it MY way!
```

`-e`

Execute sequence of commands without stdin. Usefull for side-effect one-liners


```bash
slrp -e '() => console.log("No stdin!")'

# No stdin!
```

`-i`

In place editing of files. Can also create a backup file by suppling an argument to `-i`.


```bash
slrp -i .bak -f test-file.txt '() => "I will be added to the file" '

# inside test-file

  "I will be added to the file"

# inside test-file.txt.bak

  // whatever text was originally in the file


slrp -i -f test-file.txt '() => "I will be added to the file without a backup" '

# inside test-file

  "I will be added to the file without a backup"

# No stdin!
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
