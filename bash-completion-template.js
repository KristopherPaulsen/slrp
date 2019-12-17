module.exports = {
  completionTemplate: (completions) =>
  `#/usr/bin/env bash

  _file_completion() {
    local cur=\${COMP_WORDS[COMP_CWORD]}

    local IFS=$'\\n'
    COMPREPLY=( $( compgen -o plusdirs  -f -X '!*.txt' -- $cur ) )
  }

  complete -W "${completions.join(" ")}" -o filenames -F _file_completion slrp`
}
