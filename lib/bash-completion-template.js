module.exports = {
  completionTemplate: (completions) =>
`#/usr/bin/env bash
_get_file_or_directory_name() {
    local cur="$1"

    # Files, excluding directories:
    grep -v -F -f <(compgen -d -P ^ -S '$' -- "$cur") \
        <(compgen -f -P ^ -S '$' -- "$cur") |
        sed -e 's/^\\^//' -e 's/\\$$/ /'

    # Directories:
    compgen -d -S / -- "$cur"
}
_completions() {
  if [[ "\${COMP_WORDS[1]}" =~ "-f" ]] && [ "\${#COMP_WORDS[@]}" != 4 ]; then
    COMPREPLY=( $(_get_file_or_directory_name "\${COMP_WORDS[COMP_CWORD]}") )
  else
    COMPREPLY=($(compgen -W "${completions.join(" ")}" \${COMP_WORDS[COMP_CWORD]}))
  fi
}

complete -o default -o nospace -F _completions slrp`
};
