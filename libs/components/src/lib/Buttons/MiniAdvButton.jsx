
import { camelize, capitalize } from '@fl/utils'
import './MiniAdvButton.css'

//MINI ADVANCED SEARCH BUTTONS
export const MiniAdvButton = (props) => {
  const { id, display, buttonClass, clicked, removeFilter, applyFilter } = props

  return (
    clicked ? (
      <div
        className={"clicked" + capitalize(buttonClass) + "MiniButton"}
        id={camelize(id)}
        type="submit"
        onClick={() => removeFilter(buttonClass, id)}
      >
        {display}
      </div>
    ) : (
      <div
        className={buttonClass + "MiniButton"}
        id={camelize(id)}
        type="submit"
        onClick={() => applyFilter(buttonClass, id)}
      >
        {display}
      </div>
    )
  )
} 