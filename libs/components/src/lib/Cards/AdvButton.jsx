import { camelize, capitalize } from '@fl/utils'
import './AdvButton.css'

//ADVANCED SEARCH BUTTONS
export const AdvButton = (props) => {
    const { id, display, buttonClass, clicked, removeFilter, applyFilter } = props
     
    return (
      clicked ? (
        <div
          className={"clicked" + capitalize(buttonClass) + "Button"}
          id={camelize(id)}
          type="submit"
          onClick={() => removeFilter(buttonClass, id)}
        >
          {display}
        </div>
      ) : (
        <div
          className={buttonClass + "Button"}
          id={camelize(id)}
          type="submit"
          onClick={() => applyFilter(buttonClass, id)}
        >
          {display}
        </div>
      )
    )
} 
