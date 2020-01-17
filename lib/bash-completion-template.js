module.exports = {
  completionTemplate: (completions) =>
`#/usr/bin/env bash
_completions() {
  if [[ "\${COMP_WORDS[1]}" =~ "-f" ]]; then
    COMPREPLY=( $(compgen -f -- \${COMP_WORDS[COMP_CWORD]})  )
  else
    COMPREPLY=($(compgen -W "${completions.join(" ")}" \${COMP_WORDS[COMP_CWORD]}))
  fi
}

complete -o nospace -F _completions slrp`
};
