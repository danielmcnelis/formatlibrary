import { inspect as inspector } from 'util'

export const inspect = (label: string, obj: any): string => {
  return `${label}: ${obj !== undefined ? inspector(obj, { showHidden: false, depth: null, colors: true }) : ''}`
}
