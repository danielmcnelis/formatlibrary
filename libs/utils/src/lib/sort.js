export const atkASC = (a, b) => b.atk - a.atk
export const atkDESC = (a, b) => a.atk - b.atk

export const dateASC = (a, b) => {
  if (a.tcgDate < b.tcgDate) return -1
  if (a.tcgDate > b.tcgDate) return 1
  return 0
}

export const dateDESC = (a, b) => {
  if (a.tcgDate < b.tcgDate) return 1
  if (a.tcgDate > b.tcgDate) return -1
  return 0
}

export const defASC = (a, b) => b.def - a.def
export const defDESC = (a, b) => a.def - b.def

export const levelASC = (a, b) => b.level - a.level
export const levelDESC = (a, b) => a.level - b.level

export const nameASC = (a, b) => {
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}

export const nameDESC = (a, b) => {
  if (a.name < b.name) return 1
  if (a.name > b.name) return -1
  return 0
}

export const uploadedASC = (a, b) => {
  if (a.publishDate < b.publishDate) return -1
  if (a.publishDate > b.publishDate) return 1
  return 0
}

export const uploadedDESC = (a, b) => {
  if (a.publishDate < b.publishDate) return 1
  if (a.publishDate > b.publishDate) return -1
  return 0
}

export const placeASC = (a, b) => parseInt(a.placement, 10) - parseInt(b.placement, 10)
export const placeDESC = (a, b) => parseInt(b.placement, 10) - parseInt(a.placement, 10)

export const builderASC = (a, b) => {
  const builderA = a.builder.toLowerCase()
  const builderB = b.builder.toLowerCase()
  if (builderA < builderB) return -1
  if (builderA > builderB) return 1
  return 0
}

export const builderDESC = (a, b) => {
  const builderA = a.builder.toLowerCase()
  const builderB = b.builder.toLowerCase()
  if (builderA < builderB) return 1
  if (builderA > builderB) return -1
  return 0
}

export const eventASC = (a, b) => {
  const eventA = a.eventName ? a.eventName.toLowerCase() : null
  const eventB = b.eventName ? b.eventName.toLowerCase() : null
  if (eventA < eventB) return -1
  if (eventA > eventB) return 1
  return 0
}

export const eventDESC = (a, b) => {
  const eventA = a.eventName ? a.eventName.toLowerCase() : null
  const eventB = b.eventName ? b.eventName.toLowerCase() : null
  if (eventA < eventB) return 1
  if (eventA > eventB) return -1
  return 0
}

export const typeASC = (a, b) => {
  if (a.type < b.type) return -1
  if (a.type > b.type) return 1
  return 0
}

export const typeDESC = (a, b) => {
  if (a.type < b.type) return 1
  if (a.type > b.type) return -1
  return 0
}

export const categoryASC = (a, b) => {
  if (a.category < b.category) return -1
  if (a.category > b.category) return 1
  return 0
}

export const categoryDESC = (a, b) => {
  if (a.category < b.category) return 1
  if (a.category > b.category) return -1
  return 0
}

export const startDateASC = (a, b) => {
  if (a.startDate < b.startDate) return -1
  if (a.startDate > b.startDate) return 1
  return 0
}

export const startDateDESC = (a, b) => {
  if (a.startDate < b.startDate) return 1
  if (a.startDate > b.startDate) return -1
  return 0
}

export const sizeASC = (a, b) => parseInt(b.size, 10) - parseInt(a.size, 10)
export const sizeDESC = (a, b) => parseInt(a.size, 10) - parseInt(b.size, 10)
