# ish
> When you need to find a string that's close... ish

</br>

## Getting Started

  ```bash
  npm install -g @kcpaulsen/ish
  ```

  ```bash
  echo -e "Food\nDrink\nSnacks" | ish 'fod'
    # Food
  ```

## Multi Matching

  You can also provide multiple potential strings to match against.
  It will match left-to-right, favoring first potential matches over later ones,
  but fallback if sufficently mismatched

  ```bash
  echo -e "Food\nDrink\nSnacks" | ish 'fodd' 'Drink'
    # Food

  echo -e "Food\nDrink\nSnacks" | ish 'fdd' 'Dink'
    # Drink
  ```

## JSON Output (simple and raw-string)

  ```bash
  echo -e "Food\\nDrink\\nSnacks" | ish 'fodd' --json
    # { "match": "Food" }

  echo "Food" | ish 'food' --json-string
    # "{\"match\":\"Food\"}"
  ```

## All matches Output

  Listing all possible matches, left to right, best to worst.

  ```bash
  echo -e "Food\nFodge\nFreak" | ish 'fo' --all --json
    # { "matches": [ "Food", "Fodge", "Freak" ] }

  echo -e "Food\nFodge\nFreak" | ish 'fo' --all
    # Food
    # Fodge
    # Freak
  ```

## Supported Custom Options (So Far)

  threshold
  location
  distance


  These get added to the underyling fuse.js Options

  ```javascript
    {
      shouldSort: true,
      includeScore: true,
      findAllMatches: true,
      ...opts,
      keys: ['item'],
      id: 'item',
    },
  }
  ```

  Examples:


  ```bash

    echo "FOOD" | ish "food" --opts case-sensitive=true
      #

    echo "FOOD" | ish "FOOD" --opts case-sensitive=true
      # FOOD
  ```

## About

  Heavily leveraging fuse.js (I mean heavy, like most-of-the-real-code), to make cli fuzzy matching,
  and outputing to other programs like jq, fx, eat, gron, easy and fun.

