//CAMELIZE
export const camelize = (str) =>
  str.replace(/['"]/g, '').replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return ''
    return index === 0 ? match.toLowerCase() : match.toUpperCase()
  })

//CAPITALIZE
export const capitalize = (str = '', eachWord = false) => {
    if (!str) return

    if (eachWord) {
      return str.split(' ')
        .map((s) => capitalize(s))
        .join(' ')
        .split('-')
        .map((s) => capitalize(s))
        .join('-')
    } else {
      const charZero = str.charAt(0) || ''
      return charZero.toUpperCase() + str.slice(1)
    }
}

//GET COOKIE
export const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// GET RANDOM COLOR
export const getRandomColor = () => {
    const letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

//APPEND SCRIPT
export const appendScript = (src, document) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true

    document.head.appendChild(script)
}

// GET ROUND NAME
export const getRoundName = (tournament, roundInt, count) => {
    let roundName
    if (tournament?.type === 'single elimination') {
        const totalRounds = Math.ceil(Math.log2(count))
        const roundsRemaining = totalRounds - roundInt
        roundName = roundsRemaining === 0 ? 'Finals' :
            roundsRemaining === 1 ? 'Semi Finals' :
            roundsRemaining === 2 ? 'Quarter Finals' :
            roundsRemaining === 3 ? 'Round of 16' :
            roundsRemaining === 4 ? 'Round of 32' :
            roundsRemaining === 5 ? 'Round of 64' :
            roundsRemaining === 6 ? 'Round of 128' :
            roundsRemaining === 7 ? 'Round of 256' :
            null
    } else if (tournament?.type === 'double elimination') {
        const totalWinnersRounds = Math.ceil(Math.log2(count)) + 1
        const fullBracketSize = Math.pow(2, Math.ceil(Math.log2(count)))
        const correction = (count - (fullBracketSize / 2)) <= (fullBracketSize / 4) ? -1 : 0
        const totalLosersRounds = (totalWinnersRounds - 2) * 2 + correction
        if (roundInt > 0) {
            const roundsRemaining = totalWinnersRounds - roundInt
            roundName = roundsRemaining <= 0 ? 'Grand Finals' :
                roundsRemaining === 1 ? `Winner's Finals` :
                roundsRemaining === 2 ? `Winner's Semis` :
                roundsRemaining === 3 ? `Winner's Quarters` :
                isNaN(roundsRemaining) ? null :
                `Winner's Round of ${Math.pow(2, roundsRemaining)}`
        } else {
            const roundsRemaining = totalLosersRounds - Math.abs(roundInt)
            roundName = roundsRemaining === 0 ? `Loser's Finals` :
                roundsRemaining === 1 ? `Loser's Semis` :
                roundsRemaining === 2 ? `Loser's Thirds` :
                roundsRemaining === 3 ? `Loser's Fifths` :
                roundsRemaining === 3 ? `Loser's Sevenths` :
                isNaN(roundsRemaining) ? null :
                `Loser's Round ${Math.abs(roundInt)}`
        }
    } else {
        roundName = roundInt ? `Round ${roundInt}` : null
    }

    return roundName
}

// FILL WITH MULTIPLES
export const fillWithMultiples = (arr, multiplier) => {
    const result = []

    for (let i = 0; i <= arr.length; i += multiplier) {
      result.push(i)
    }

    return result
}

//ARRAY TO OBJECT
export const arrayToObject = (arr = []) => {
  const obj = {}
  arr.forEach((e) => (obj[e] ? obj[e]++ : (obj[e] = 1)))
  return obj
}

//GET ERA VIDEO PLAYLIST ID
export const getEraVideoPlaylistId = (date) => {
    if ('2002-01-01' <= date && date <= '2005-05-31') {
        //DM FORMATS PLAYLIST ID
        return 'nLP6Pr2C'
    } else {
        return null
    }
}

//DATE TO SIMPLE
export const dateToSimple = (date) => {
  if (!date) return ''
  const year = typeof date === 'string' ? date.slice(2, 4) : date.getFullYear().slice(2, 4)
  const month = typeof date === 'string' ? parseInt(date.slice(5, 7), 10) : date.getMonth() + 1
  const day = typeof date === 'string' ? parseInt(date.slice(8, 10), 10) : date.getDate()
  const simple = `${month}/${day}/${year}`
  return simple
}

//DATE TO VERBOSE
export const dateToVerbose = (date, long = true, ordinal = true, includeYear = true) => {
  if (!date) return 'N/A'
  const year = typeof date === 'string' ? date.slice(0, 4) : date.getFullYear()
  const longMonths = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  const shortMonths = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
  const month = typeof date === 'string' ? parseInt(date.slice(5, 7), 10) - 1 : date.getMonth()
  const monthStr = long ? longMonths[month] : shortMonths[month]
  const day = typeof date === 'string' ? parseInt(date.slice(8, 10), 10) : date.getDate()
  const dayStr = ordinal ? ordinalize(day) : day
  const verbose = includeYear ? `${monthStr} ${dayStr}, ${year}` : `${monthStr} ${dayStr}`
  return verbose
}

// ORDINALIZE
export const ordinalize = (int) => {
  if (!int) return '-'
  const suffixes = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th']
  switch (int % 100) {
    case 11:
    case 12:
    case 13:
      return int + 'th'
    default:
      return int + suffixes[int % 10]
  }
}

// SHOULD DISPLAY
export const shouldDisplay = (placement = 1, size = 0) => {
  const display =
    (size <= 8 && placement === 1) ||
    (size > 8 && size <= 16 && placement <= 2) ||
    (size > 16 && size <= 24 && placement <= 3) ||
    (size > 24 && size <= 32 && placement <= 4) ||
    (size > 32 && size <= 48 && placement <= 6) ||
    (size > 48 && size <= 64 && placement <= 8) ||
    (size > 64 && size <= 96 && placement <= 12) ||
    (size > 96 && size <= 128 && placement <= 16) ||
    (size > 128 && size <= 224 && placement <= 24) ||
    (size > 224 && size <= 352 && placement <= 32) ||
    (size > 352 && placement <= 64) ||
    false

  return display
}

//URLIZE
export const urlize = (str) => str.replace(/[\s]/g, '-').toLowerCase()

//UNDERSCORIZE
export const underscorize = (str) => str.replace(/[\s]/g, '_').toLowerCase()