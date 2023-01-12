
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { AdvButton } from './AdvButton'
import { CardRow } from './CardRow'
import { CardImage } from './CardImage'
import { MobileCardRow } from './MobileCardRow'
import { Slider } from '../General/Slider'
import { Pagination } from '../General/Pagination'
import { capitalize } from '@fl/utils'
import { useMediaQuery } from 'react-responsive'
import { useLocation } from 'react-router-dom'

const now = new Date()

export const CardTable = () => {
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 860px)' })
    const location = useLocation()
    const formatName = location?.search?.slice(8)
    const [page, setPage] = useState(1)
    const [cards, setCards] = useState([])
    const [cardsPerPage, setCardsPerPage] = useState(10)
    const [view, setView] = useState('spoilers')
    const [sortBy, setSortBy] = useState('name:asc')
    const [total, setTotal] = useState('')
    const [formats, setFormats] = useState([])
    const [format, setFormat] = useState({})
    const [banlist, setBanlist] = useState({})
    const [boosters, setBoosters] = useState([])
    const [booster, setBooster] = useState(null)
    const [advanced, setAdvanced] = useState(false)
    const [cutoff, setCutoff] = useState(`${now.getFullYear()}-12-31`)
  
    const [sliders, setSliders] = useState({
      year: now.getFullYear(),
      month: 12,
      day: 31,
      level: [1, 12],
      atk: [0, 5000],
      def: [0, 5000]
    })
  
    const [queryParams, setQueryParams] = useState({
      name: null,
      description: null,
      category: null
    })
  
    const [iconParams, setIconParams] = useState({
      continuous: false,
      counter: false,
      equip: false,
      field: false,
      normal: false,
      ritual: false,
      'quick-play': false
    })
  
    const [attributeParams, setAttributeParams] = useState({
      dark: false,
      light: false,
      earth: false,
      wind: false,
      water: false,
      fire: false,
      divine: false
    })
  
    const [typeParams, setTypeParams] = useState({
      aqua: false,
      beast: false,
      'beast-warrior': false,
      cyberse: false,
      dinosaur: false,
      'divine-beast': false,
      dragon: false,
      fairy: false,
      fiend: false,
      fish: false,
      insect: false,
      machine: false,
      plant: false,
      psychic: false,
      pyro: false,
      reptile: false,
      rock: false,
      'sea serpent': false,
      spellcaster: false,
      thunder: false,
      warrior: false,
      'winged beast': false,
      wyrm: false,
      zombie: false
    })
  
    const [groupParams, setGroupParams] = useState({
      effect: false,
      flip: false,
      fusion: false,
      gemini: false,
      link: false,
      normal: false,
      pendulum: false,
      ritual: false,
      spirit: false,
      synchro: false,
      toon: false,
      tuner: false,
      union: false,
      xyz: false
    })
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0), [])
    
    // CHANGE CARDS PER PAGE
    const changeCardsPerPage = (e) => {
      setCardsPerPage(Number(e.target.value))
      setPage(1)
    }
  
    // GO TO PAGE
    const goToPage = (num, location) => {
      setPage(num)
      if (location === 'bottom') window.scrollTo(0, document.getElementById('resultsWrapper0').offsetTop - 10)
    }
  
    // PREVIOUS PAGE
    const previousPage = (location) => {
      if (page <= 1) return
      setPage(page - 1)
      if (location === 'bottom') window.scrollTo(0, document.getElementById('resultsWrapper0').offsetTop - 10)
    }
  
    // NEXT PAGE
    const nextPage = (location) => {
      if (page >= Math.ceil(total / cardsPerPage)) return
      setPage(page + 1)
      if (location === 'bottom') window.scrollTo(0, document.getElementById('resultsWrapper0').offsetTop - 10)
    }
    
    // COUNT
    const count = async () => {
      let url = `/api/cards/count`   
      let filter = ''
      if (queryParams.name) filter += `,name:inc:${queryParams.name}`
      if (queryParams.category) filter += `,category:eq:${queryParams.category}`
      if (queryParams.description) filter += `,description:inc:${queryParams.description}`
  
      const icons = Object.entries(iconParams).filter((e) => !!e[1]).map((e) => capitalize(e[0], true))
      const attributes = Object.entries(attributeParams).filter((e) => !!e[1]).map((e) => e[0].toUpperCase())
      const types = Object.entries(typeParams).filter((e) => !!e[1]).map((e) => capitalize(e[0], true))
      const groups = Object.entries(groupParams).filter((e) => !!e[1]).map((e) => e[0])
  
      if (icons.length) filter += `,icon:or:arr(${icons.join(';')})`
      if (attributes.length) filter += `,attribute:or:arr(${attributes.join(';')})`
      if (types.length) filter += `,type:or:arr(${types.join(';')})`
      groups.forEach((g) => filter += `,${g}:eq:true`)
      if (groupParams.effect) filter += `,extraDeck:eq:false`
      if (cutoff !== `${now.getFullYear()}-12-31`) filter += `,tcgDate:lte:${cutoff}`
  
      const minLevel = sliders.level[0]
      const maxLevel = sliders.level[1]
      if (minLevel !== 1 || maxLevel !== 12) filter += `,level:btw:arr(${minLevel};${maxLevel})`
  
      const minATK = sliders.atk[0]
      const maxATK = sliders.atk[1]
      if (minATK !== 0 || maxATK !== 5000) filter += `,atk:btw:arr(${minATK};${maxATK})`
  
      const minDEF = sliders.def[0]
      const maxDEF = sliders.def[1]
      if (minDEF !== 0 || maxDEF !== 5000) filter += `,def:btw:arr(${minDEF};${maxDEF})`
  
      if (filter.length) url += ('?filter=' + filter.slice(1))
      if (booster) {
          if (filter.length) {
              url += `&booster=${booster}`
          } else {
              url += `?booster=${booster}`
          }
      }
  
      const { data } = await axios.get(url)
      setTotal(data)
    }
  
    // SEARCH
    const search = async () => {
      let url = `/api/cards?limit=${cardsPerPage}&page=${page}&sort=${sortBy}`   
      let filter = ''
      if (queryParams.name) filter += `,name:inc:${queryParams.name}`
      if (queryParams.category) filter += `,category:eq:${queryParams.category}`
      if (queryParams.description) filter += `,description:inc:${queryParams.description}`
  
      const icons = Object.entries(iconParams).filter((e) => !!e[1]).map((e) => capitalize(e[0], true))
      const attributes = Object.entries(attributeParams).filter((e) => !!e[1]).map((e) => e[0].toUpperCase())
      const types = Object.entries(typeParams).filter((e) => !!e[1]).map((e) => capitalize(e[0], true))
      const groups = Object.entries(groupParams).filter((e) => !!e[1]).map((e) => e[0])
  
      if (icons.length) filter += `,icon:or:arr(${icons.join(';')})`
      if (attributes.length) filter += `,attribute:or:arr(${attributes.join(';')})`
      if (types.length) filter += `,type:or:arr(${types.join(';')})`
      groups.forEach((g) => filter += `,${g}:eq:true`)
      if (groupParams.effect) filter += `,extraDeck:eq:false`
      if (cutoff !== `${now.getFullYear()}-12-31`) filter += `,tcgDate:lte:${cutoff}`
  
      const minLevel = sliders.level[0]
      const maxLevel = sliders.level[1]
      if (minLevel !== 1 || maxLevel !== 12) filter += `,level:btw:arr(${minLevel};${maxLevel})`
  
      const minATK = sliders.atk[0]
      const maxATK = sliders.atk[1]
      if (minATK !== 0 || maxATK !== 5000) filter += `,atk:btw:arr(${minATK};${maxATK})`
  
      const minDEF = sliders.def[0]
      const maxDEF = sliders.def[1]
      if (minDEF !== 0 || maxDEF !== 5000) filter += `,def:btw:arr(${minDEF};${maxDEF})`
  
      if (filter.length) url += ('&filter=' + filter.slice(1))
      if (booster) url += `&booster=${booster}`
  
      const { data } = await axios.get(url)
      setCards(data)
    }
  
    // RESET
    const reset = async () => {
      const formatSelector = document.getElementById('format')
      if (formatSelector) formatSelector.value = ''
      document.getElementById('category').value = ''
      document.getElementById('searchTypeSelector').value = 'name'
  
      setSliders({
        year: now.getFullYear(),
        month: 12,
        day: 31,
        level: [1, 12],
        atk: [0, 5000],
        def: [0, 5000]
      })
      
      setPage(1)
      if (!formatName) {
          const {data} = await axios.get(`/api/formats/current`)
          setFormat(data.format)
          document.getElementById('format').value = ""
      }
  
      setBooster(null)
      document.getElementById('booster').value = ""
      setSortBy('name:asc')
      
      setQueryParams({
        name: null,
        description: null,
        category: null
      })
  
      document.getElementById('searchBar').value = ""
    
      setIconParams({
        continuous: false,
        counter: false,
        equip: false,
        field: false,
        normal: false,
        ritual: false,
        'quick-play': false
      })
    
      setAttributeParams({
        dark: false,
        light: false,
        earth: false,
        wind: false,
        water: false,
        fire: false,
        divine: false
      })
    
      setTypeParams({
        aqua: false,
        beast: false,
        'beast-warrior': false,
        cyberse: false,
        dinosaur: false,
        'divine-beast': false,
        dragon: false,
        fairy: false,
        fiend: false,
        fish: false,
        insect: false,
        machine: false,
        plant: false,
        psychic: false,
        pyro: false,
        reptile: false,
        rock: false,
        'sea serpent': false,
        spellcaster: false,
        thunder: false,
        warrior: false,
        'winged beast': false,
        wyrm: false,
        zombie: false
      })
    
      setGroupParams({
        effect: false,
        flip: false,
        fusion: false,
        gemini: false,
        link: false,
        normal: false,
        pendulum: false,
        ritual: false,
        spirit: false,
        synchro: false,
        toon: false,
        tuner: false,
        union: false,
        xyz: false
      })
  
      count()
      search()
    }
  
    // UPDATE FORMAT
    const updateFormat = async (e) => {
      if (e.target.value.length) {
        const {data} = await axios.get(`/api/formats/${e.target.value}`) 
        setFormat(data.format)
      } else {
        setFormat({})
      }
    }
  
    // APPLY FILTER
    const applyFilter = (buttonClass, id) => {
      if (buttonClass === 'icon') {
        setIconParams({ ...iconParams, [id]: true })
      } else if (buttonClass === 'attribute') {
        setAttributeParams({ ...attributeParams, [id]: true })
      } else if (buttonClass === 'type') {
        setTypeParams({ ...typeParams, [id]: true })
      } else if (buttonClass === 'group') {
        setGroupParams({ ...groupParams, [id]: true })
      }
    }
  
    // REMOVE FILTER
    const removeFilter = (buttonClass, id) => {
      if (buttonClass === 'icon') {
        setIconParams({ ...iconParams, [id]: false })
      } else if (buttonClass === 'attribute') {
        setAttributeParams({ ...attributeParams, [id]: false })
      } else if (buttonClass === 'type') {
        setTypeParams({ ...typeParams, [id]: false })
      } else if (buttonClass === 'group') {
        setGroupParams({ ...groupParams, [id]: false })
      }
    }
  
    // RUN QUERY
    const runQuery = () => {
      setPage(1)
      const id = document.getElementById('searchTypeSelector').value
      const otherId = id === 'description' ? 'name' : 'description'
      setQueryParams(() => {
        return {
          ...queryParams,
          [id]: document.getElementById('searchBar').value,
          [otherId]: null
        }
      })
    }
  
    // USE EFFECT FETCH CARDS
    useEffect(() => {
      if (formatName) {
          updateFormat({target: { value: formatName } })
          count()
          search()
      } else {
          const fetchData = async () => {
            const {data} = await axios.get(`/api/formats`)
            setFormats(data)
          }
  
          const fetchData2 = async () => {
            const {data} = await axios.get(`/api/sets/boosters`)
            setBoosters(data)
          }
  
          fetchData()
          fetchData2()
          count()
          search()
      }
    }, [])
  
    // USE EFFECT IF FORMAT CHANGES
    useEffect(() => {
      const year = format.date ? parseInt(format.date.slice(0, 4)) : now.getFullYear() || 2022
      const month = format.date ? parseInt(format.date.slice(6, 7)) : 12
      const day = format.date ? parseInt(format.date.slice(-2)) : 31
      setCutoff(format.date || `${year}-12-31`)
      setSliders({ ...sliders, year, month, day })
  
      const fetchData = async () => {
        try {
          const {data} = await axios.get(`/api/banlists/simple/${format.banlist || 'oct22'}`)
          setBanlist(data)
        } catch (err) {
          console.log(err)
        }
      }
  
      fetchData()
    }, [format])
  
    // USE EFFECT IF DATE SLIDERS CHANGE
    useEffect(() => {
      if (!format || !format.id) {
          const month = sliders.month >= 10 ? sliders.month : `0${sliders.month}`
          const day = sliders.day >= 10 ? sliders.day : `0${sliders.day}`
          setCutoff(`${sliders.year}-${month}-${day}`)
      }
    }, [sliders])
  
    // USE EFFECT IF RELEVANT SEARCH PARAM STATES CHANGE
    useEffect(() => {
      count()
      search()
    }, [page, cardsPerPage, sortBy, format, booster, cutoff, sliders, queryParams, groupParams, iconParams, attributeParams, typeParams])
  
    const advancedButtons = {
      icon: [
        ['normal', 'Normal'], 
        ['continuous', 'Contin.'], 
        ['counter', 'Counter'], 
        ['equip', 'Equip'], 
        ['field', 'Field'], 
        ['ritual', 'Ritual'], 
        ['quick-play', 'Quick-P.']
      ],
      attribute: [
        ['dark', 'DARK'], 
        ['light', 'LIGHT'], 
        ['earth', 'EARTH'], 
        ['wind', 'WIND'], 
        ['water', 'WATER'], 
        ['fire', 'FIRE'], 
        ['divine', 'DIVINE']
      ],
      type: [
        ['aqua', 'Aqua'], 
        ['beast', 'Beast'], 
        ['beast-warrior', 'Beast-W.'], 
        ['cyberse', 'Cyberse'], 
        ['dinosaur', 'Dinosaur'], 
        ['dragon', 'Dragon'], 
        ['divine-beast', 'Divine-B.'], 
        ['fairy', 'Fairy'], 
        ['fiend', 'Fiend'], 
        ['fish', 'Fish'], 
        ['insect', 'Insect'], 
        ['machine', 'Machine'], 
        ['plant', 'Plant'], 
        ['psychic', 'Psychic'], 
        ['pyro', 'Pyro'], 
        ['reptile', 'Reptile'], 
        ['rock', 'Rock'], 
        ['sea serpent', 'Sea Serp.'],
        ['spellcaster', 'Spellcaster'], 
        ['thunder', 'Thunder'], 
        ['warrior', 'Warrior'], 
        ['winged beast', 'Winged B.'],
        ['wyrm', 'Wyrm'], 
        ['zombie', 'Zombie']
      ],
      group: [
        ['normal', 'Normal'], 
        ['effect', 'Effect'], 
        ['ritual', 'Ritual'], 
        ['pendulum', 'Pend.'], 
        ['fusion', 'Fusion'], 
        ['synchro', 'Synchro'], 
        ['xyz', 'Xyz'], 
        ['link', 'Link'], 
        ['flip', 'Flip'], 
        ['gemini', 'Gemini'], 
        ['spirit', 'Spirit'], 
        ['toon', 'Toon'], 
        ['tuner', 'Tuner'], 
        ['union', 'Union']
      ]
    }
  
    const advancedButtonKeys = Object.keys(advancedButtons)
  
    // RENDER
    return (
      <div className="body">
        <div className="card-database-flexbox">
          <img src={`https://cdn.formatlibrary.com/images/artworks/${format.icon ? `${format.icon}.jpg` : 'nibiru.jpg'}`} className="format-icon-medium desktop-only" />
          <div>
            <h1>{format.event ? format.name + ' ' : ''}Card Database</h1>
            <h2 className="desktop-only">{format.event || 'May 2002 - Present'}</h2>
          </div>
          <img src={`https://cdn.formatlibrary.com/images/artworks/${format.icon ? `${format.icon}.jpg` : 'nibiru.jpg'}`} className="format-icon-medium" />
        </div>
        {
          isTabletOrMobile ? (
              <div className="searchWrapper">
                  <div className="query-box">
                      <input
                          id="searchBar"
                          className="filter"
                          type="text"
                          style={{maxWidth: '60vw'}}
                          placeholder="🔍"
                          onChange={() => runQuery()}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') { count(); search() }
                          }}
                      />
  
                      <select
                          id="searchTypeSelector"
                          defaultValue="name"
                          className="filter"
                          style={{maxWidth: '30vw'}}
                          onChange={() => runQuery()}
                          >
                          <option value="name">Name</option>
                          <option value="description">Text</option>
                      </select>
                  </div>
                  <div className="query-box">
                      <select
                          id="category"
                          defaultValue=""
                          style={{maxWidth: '29vw'}}
                          className="filter"
                          onChange={() => setQueryParams({ ...queryParams, category: document.getElementById('category').value })}
                      >
                          <option value="">Cards</option>
                          <option value="Monster">Monster</option>
                          <option value="Spell">Spell</option>
                          <option value="Trap">Trap</option>
                      </select>
  
                      {
                          formatName ? '' : (
                          <select
                              id="format"
                              defaultValue=""
                              style={{maxWidth: '35vw'}}
                              className="filter"
                              onChange={(e) => updateFormat(e)}
                          >
                          <option key="Current" value="">Current</option>
                          {
                              formats.filter((f) => !!f.date).map((f) => <option key={f.name} value={f.name}>{capitalize(f.name, true)}</option>)
                          }
                          </select>
                          )
                      }
  
                      <select
                          id="booster"
                          defaultValue=""
                          className="filter"
                          style={{maxWidth: '27vw'}}
                          onChange={(e) => setBooster(e.target.value)}
                          >
                          <option key="All Sets" value="">Sets</option>
                          {
                          boosters.map((b) => <option key={b.id} value={b.setCode}>{b.setCode}</option>)
                          }
                      </select>
  
                      <a
                          className="searchButton desktop-only"
                          type="submit"
                          onClick={() => {
                              count()
                              search()
                              if (advanced) setAdvanced(false)
                          }
                          }
                          
                      >
                          Search
                      </a>
                  </div>
              </div>
              ) : (
                  <div className="searchWrapper">
                      <input
                          id="searchBar"
                          className="filter"
                          type="text"
                          placeholder="🔍"
                          onChange={() => runQuery()}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') { count(); search() }
                          }}
                      />
  
                      <select
                          id="searchTypeSelector"
                          defaultValue="name"
                          className="filter"
                          onChange={() => runQuery()}
                          >
                          <option value="name">Card Name</option>
                          <option value="description">Card Text</option>
                      </select>
  
                      <select
                          id="category"
                          defaultValue=""
                          className="filter"
                          onChange={() => setQueryParams({ ...queryParams, category: document.getElementById('category').value })}
                      >
                          <option value="">All Cards</option>
                          <option value="Monster">Monsters</option>
                          <option value="Spell">Spells</option>
                          <option value="Trap">Traps</option>
                      </select>
  
                      {
                          formatName ? '' : (
                          <select
                          id="format"
                          defaultValue=""
                          className="filter"
                          onChange={(e) => updateFormat(e)}
                          >
                          <option key="Current" value="">Current</option>
                          {
                              formats.filter((f) => !!f.date).map((f) => <option key={f.name} value={f.name}>{capitalize(f.name, true)}</option>)
                          }
                          </select>
                          )
                      }
  
                      <select
                          id="booster"
                          defaultValue=""
                          className="filter"
                          onChange={(e) => setBooster(e.target.value)}
                          >
                          <option key="All Sets" value="">All Sets</option>
                          {
                          boosters.map((b) => <option key={b.id} value={b.setCode}>{b.setCode}</option>)
                          }
                      </select>
  
                      <a
                          className="searchButton desktop-only"
                          type="submit"
                          onClick={() => {
                              count()
                              search()
                              if (advanced) setAdvanced(false)
                          }
                          }
                          
                      >
                          Search
                      </a>
                  </div>
              )
          }
  
        {!advanced ? (
          <div className="refinedWrapper">
            <a
              className="refinedButton"
              type="submit"
              onClick={() => setAdvanced(!advanced)}
            >
              Show Advanced Options
            </a>
          </div>
        ) : (
          <div className="refinedWrapper">
            <a
              className="refinedButton"
              type="submit"
              onClick={() => setAdvanced(!advanced)}
            >
              Hide Advanced Options
            </a>
            <br />
            {
              advancedButtonKeys.map((buttonClass) => (
                <div key={buttonClass} className="refinedInnerWrapper">
                  {
                    
                    advancedButtons[buttonClass].map((el) => {
                      const params = buttonClass === 'icon' ? iconParams : 
                        buttonClass === 'attribute' ? attributeParams : 
                        buttonClass === 'type' ? typeParams : 
                        groupParams
  
                      return (
                        <AdvButton 
                          key={el[0]} 
                          id={el[0]} 
                          display={el[1]}
                          buttonClass={buttonClass} 
                          clicked={params[el[0]]}
                          removeFilter={removeFilter} 
                          applyFilter={applyFilter}
                        />
                      )}
                    )
                  }
                </div>
              ))
            }          
            <br />
  
            <div className="sliderWrapper0">
              <div className="sliderWrapper1">
                <Slider
                  id="level"
                  type="range-slider"
                  symbol="https://cdn.formatlibrary.com/images/symbols/star.png"
                  label="Level"
                  step={1}
                  min={1}
                  max={12}
                  sliders = {sliders}
                  setSliders = {setSliders}
                  defaultValue = {sliders.level}
                />
                <Slider
                  id="atk"
                  type="range-slider"
                  symbol="https://cdn.formatlibrary.com/images/emojis/swords.png"
                  label="ATK"
                  step={50}
                  min={0}
                  max={5000}
                  sliders = {sliders}
                  setSliders = {setSliders}
                  defaultValue = {sliders.atk}
                />
                <Slider
                  id="def"
                  type="range-slider"
                  symbol="https://cdn.formatlibrary.com/images/emojis/shield.png"
                  label="DEF"
                  step={50}
                  min={0}
                  max={5000}
                  sliders = {sliders}
                  setSliders = {setSliders}
                  defaultValue = {sliders.def}
                />
              </div>
  
              <div className="sliderWrapper1 desktop-only">
                <Slider
                  id="year"
                  type="continuous-slider"
                  symbol="https://cdn.formatlibrary.com/images/emojis/Calendar.png"
                  label="Year"
                  step={1}
                  min={2002}
                  max={2022}
                  disabled={!!format.date}
                  sliders = {sliders}
                  setSliders = {setSliders}
                  defaultValue = {sliders.year}
                />
                <Slider
                  id="month"
                  type="continuous-slider"
                  symbol="https://cdn.formatlibrary.com/images/emojis/Calendar.png"
                  label="Month"
                  step={1}
                  min={1}
                  max={12}
                  disabled={!!format.date}
                  sliders = {sliders}
                  setSliders = {setSliders}
                  defaultValue = {sliders.month}
                />
                <Slider
                  id="day"
                  type="continuous-slider"
                  symbol="https://cdn.formatlibrary.com/images/emojis/Calendar.png"
                  label="Day"
                  step={1}
                  min={1}
                  max={31}
                  disabled={!!format.date}
                  sliders = {sliders}
                  setSliders = {setSliders}
                  defaultValue = {sliders.day}
                />
              </div>
            </div>
          </div>
        )}
  
        <div id="resultsWrapper0" className="resultsWrapper0">
          <div className="results desktop-only" style={{width: '360px'}}>
            Results:{' '}
            {
              total ? `${cardsPerPage * page - cardsPerPage + 1} - ${
                  total >=
                    cardsPerPage * page
                      ? cardsPerPage * page
                      : total
                  } of ${total}`
              : total
            }
          </div>
  
          <div className="buttonWrapper">
            <select
              className="desktop-only"
              id="viewSwitch"
              defaultValue="spoilers"
              style={{width: '100px'}}
              onChange={() => setView(document.getElementById('viewSwitch').value)}
            >
              <option value="spoilers">Spoilers</option>
              <option value="gallery">Gallery</option>
            </select>
  
            <select
              id="cardsPerPageSelector"
              defaultValue="10"
              style={{width: '160px', maxWidth: '45vw'}}
              onChange={(e) => changeCardsPerPage(e)}
            >
              <option value="10">10 Cards / Page</option>
              <option value="25">25 Cards / Page</option>
              <option value="50">50 Cards / Page</option>
              <option value="100">100 Cards / Page</option>
            </select>
  
            <select
              id="sortSelector"
              defaultValue="nameASC"
              style={{width: '160px', maxWidth: '45vw'}}
              onChange={(e) => { setSortBy(e.target.value); setPage(1)}}
            >
              <option value="name:asc">Name: A ⮕ Z</option>
              <option value="name:desc">Name: Z ⮕ A</option>
              <option value="tcgDate:asc">Date: Old ⮕ New</option>
              <option value="tcgDate:desc">Date: New ⮕ Old</option>
              <option value="atk:desc nulls last">ATK: Desc. ⬇</option>
              <option value="atk:asc nulls last">ATK: Asc. ⬆</option>
              <option value="def:desc nulls last">DEF: Desc. ⬇</option>
              <option value="def:asc nulls last">DEF: Asc. ⬆</option>
              <option value="level:desc nulls last,rating:desc nulls last">Level: Desc. ⬇</option>
              <option value="level:asc nulls last,rating:asc nulls last">Level: Asc. ⬆</option>
            </select>
  
            <a
              className="searchButton desktop-only"
              type="submit"
              onClick={() => reset()}
            >
              Reset
            </a>
          </div>
        </div>
  
        <div className="paginationWrapper">
          <div className="pagination desktop-only">
            <Pagination
              location="top"
              nextPage={nextPage}
              previousPage={previousPage}
              goToPage={goToPage}
              length={total}
              page={page}
              itemsPerPage={cardsPerPage}
            />
          </div>
        </div>
  
        {view === 'spoilers' ? (
          <div id="card-table">
            <table id="cards">
              <tbody>
                {total ? (
                  cards.map((card, index) => {
                      if (isTabletOrMobile) {
                          return <MobileCardRow key={card.id} index={index} card={card} status={banlist[card.id.toString()]}/>
                      } else {
                          return <CardRow key={card.id} index={index} card={card} status={banlist[card.id.toString()]}/>
                      }
                  })
                ) : (
                  <tr />
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div id="galleryFlexBox">
            {total ? (
              cards.map((card) => {
                return <
                          CardImage 
                          key={card.id} 
                          card={card} 
                          width="184px"
                          margin="4px"
                          padding="2px"
                          status={banlist[card.id]}
                        />
              })
            ) : (
              <div />
            )}
          </div>
        )}
  
        <div className="pagination">
          <Pagination
            location="bottom"
            nextPage={nextPage}
            previousPage={previousPage}
            goToPage={goToPage}
            length={total}
            page={page}
            itemsPerPage={cardsPerPage}
          />
        </div>
      </div>
    )
}
