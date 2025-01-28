
import { useState } from 'react'
import Slider from '@mui/material/Slider'
import { alpha, styled } from "@mui/material/styles"
import './Slider.css'

const StyledSlider = styled(Slider)(({theme}) => ({
    color: 'var(--text-secondary)',
    height: '4px',
    width: '100%',
    padding: '16px 0px',
    display: 'inline-block',
    position: 'relative',
    cursor: 'pointer',
    "&:hover": {
        opacity: 1
    },
    ".MuiSlider-rail": {
        display: "block",
        position: "absolute",
        width: "100%",
        height: "4px",
        "border-radius": "2px",
        "background-color": 'currentColor',
        opacity: 0.4
    },
    "&.MuiSlider-track": {
        display: 'block',
        position: 'absolute',
        height: '4px',
        'border-radius': '2px',
        'background-color': 'currentColor'
    },
    ".MuiSlider-thumb": {
        position: 'absolute',
        width: '16px',
        height: '16px',
        // 'margin-left': '-6px',
        // 'margin-top': '-6px',
        // 'box-sizing': 'border-box',
        'border-radius': '50%',
        'outline': '0',
        'border': '3px solid currentColor',
        'background-color': 'var(--text-secondary)'
    },
    "&.active": {
        'box-shadow': `0 0 0 0.25rem ${alpha(
          '#B5C0C8',
          0.3,
        )}`
    },
    ".MuiSlider-valueLabel": {
        'font-size': '14px',
        // display: 'auto',
        // position: 'relative',
        // top: '-1.6em',
        'text-align': 'center',
    }
}))

export const ModdedSlider = (props) => {
    const [sliders, setSliders] = useState([])
    const display = props.display || props.disabled ? 'on' : 'auto'

    const points =
      props.type === 'range-slider'
        ? [props.min, props.max]
        : props.defaultValue ? props.defaultValue : props.max
  
    const [value, setValue] = useState(points)
  
    const handleCommit = (sliderId, newValue) => {
      setSliders({[sliderId]: newValue})
      props.setSliders({ ...props.sliders, [sliderId]: newValue })
    }
  
    const handleChange = (event, newValue) => {
      setValue(newValue)
      props.setSliders({ ...props.sliders, [props.id]: newValue })
    }

  return (
    <div className="slider" style={{maxWidth: props.maxWidth, width: props.maxWidth}}>
        <img
            src={props.symbol}
            style={{height: '24px', margin: '0px 12px 0px 0px'}}
            alt={props.label}
        />
        {
            props.label ? (
                <h3
                style={{
                    minWidth: '64px',
                    verticalAlign: 'middle',
                    textAlign: 'left',
                    fontFamily: 'arial',
                    fontSize: '19px',
                    fontWeight: '500'
                }}
                >
                {props.label}
                </h3>
            ) : ''
        }

        <StyledSlider
            style={{margin: '0px 0px 0px 12px', maxWidth: props.maxWidth}}
            aria-label={props.label}
            disabled={props.disabled}
            getAriaValueText={() => `${value}`}
            onChange={handleChange}
            onChangeCommitted={() => handleCommit(props.id, value)}
            valueLabelDisplay={display}
            value={props.defaultValue || value}
            step={props.step}
            min={props.min}
            max={props.max}
        />
    </div>
  )
}