
export const RulingRow = (props) => {
  const { index, ruling } = props
  const evenOrOdd = index % 2 ? 'even' : 'odd'
  
  return (
    <tr className={`${evenOrOdd}-print-row`}>
        <td className="ruling-cell-1">
            {ruling.content}
        </td>
        <td className="ruling-cell-2">
            {ruling.effectiveDate || ''}
        </td>
        <td className="ruling-cell-3">
            {ruling.expirationDate || ''}
        </td>
    </tr>
  )
}
