
import { useState } from 'react'
import {Slider, Typography} from '@mui/material'
import {withStyles, makeStyles} from '@mui/styles'

const useStyles = makeStyles(theme => ({
  root: {
    width: 300 + theme.spacing(3) * 2
  },
  margin: {
    height: theme.spacing(3)
  }
}))

export const PrettoSlider = withStyles({
  root: {
    color: '#6d6f8a',
    height: 6,
    '&$disabled': {
      color: '#909396',
      height: 6
    }
  },
  thumb: {
    height: 20,
    width: 20,
    '&:after': {
      top: '1px',
      right: '1px',
      left: '1px',
      bottom: '1px'
    },
    backgroundColor: '#f5f7fa',
    border: '2px solid currentColor',
    marginTop: -8,
    marginLeft: -12,
    '&:focus, &:hover, &$active': {
      boxShadow: 'inherit'
    },
    '&$disabled': {
      height: 20,
      width: 20,
      color: '#909396',
      backgroundColor: '#f5f7fa',
      border: '2px solid currentColor',
      marginTop: -8,
      marginLeft: -12
    }
  },
  valueLabel: {
    height: 200,
    width: 200,
    left: 'calc(-50%)'
  },
  track: {
    height: 6,
    borderRadius: 3,
    '&$disabled': {
      height: 6,
      color: '#909396',
      borderRadius: 3
    }
  },
  rail: {
    height: 6,
    borderRadius: 3,
    '&$disabled': {
      height: 6,
      color: '#6d6f8a',
      backgroundColor: '#f5f7fa',
      borderRadius: 3
    }
  },
  active: {},
  disabled: {}
})(Slider)
function valuetext(value) {
  return `${value}`
}

export const RangeSlider = (props) => {
  const classes = useStyles()
  const [sliders, setSliders] = useState([])
  const display = props.disabled ? 'on' : 'auto'

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
    <div id="slider" className={classes.root} name="mySliders" style={{margin: '0px auto 0px 10px', maxWidth: props.maxWidth, width: props.maxWidth}}>
      <img
        src={props.symbol}
        style={{height: '24px', margin: '0px 12px 0px 0px'}}
      />
      {
        props.label ? (
            <Typography
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
            </Typography>
        ) : ''
      }
      <PrettoSlider
        style={{margin: '0px 0px 0px 12px', maxWidth: props.maxWidth}}
        value={props.defaultValue || value}
        step={props.step}
        min={props.min}
        max={props.max}
        disabled={props.disabled}
        onChange={handleChange}
        onChangeCommitted={() => handleCommit(props.id, value)}
        valueLabelDisplay={display}
        aria-labelledby="range-slider"
        getAriaValueText={valuetext}
      />
    </div>
  )
}