
import { camelize, capitalize } from '@fl/utils'

//MINI ADVANCED SEARCH BUTTONS
export const MiniAdvButton = (props) => {
  const { id, display, buttonClass, clicked, removeFilter, applyFilter } = props

  return (
    clicked ? (
      <a
        className={"clicked" + capitalize(buttonClass) + "MiniButton"}
        id={camelize(id)}
        type="submit"
        onClick={() => removeFilter(buttonClass, id)}
      >
        {display}
      </a>
    ) : (
      <a
        className={buttonClass + "MiniButton"}
        id={camelize(id)}
        type="submit"
        onClick={() => applyFilter(buttonClass, id)}
      >
        {display}
      </a>
    )
  )
} 