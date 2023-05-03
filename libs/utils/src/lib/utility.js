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

//ARRAY TO OBJECT
export const arrayToObject = (arr = []) => {
  const obj = {}
  arr.forEach((e) => (obj[e] ? obj[e]++ : (obj[e] = 1)))
  return obj
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
  if (!date) return ''
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
    (size > 224 && placement <= 32) ||
    false

  return display
}

//URLIZE
export const urlize = (str) => str.replace(/[\s]/g, '-').toLowerCase()

//UNDERSCORIZE
export const underscorize = (str) => str.replace(/[\s]/g, '_').toLowerCase()
