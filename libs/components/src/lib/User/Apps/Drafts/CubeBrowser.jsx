
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { AdvButton } from '../../../Buttons/AdvButton'
import { MiniAdvButton } from '../../../Buttons/MiniAdvButton'
import { CardRow } from '../../../Cards/CardRow'
import { CardImage } from '../../../Cards/CardImage'
import { MobileCardRow } from '../../../Cards/MobileCardRow'
import { ModdedSlider } from '../../../General/Slider'
import { Pagination } from '../../../General/Pagination'
import { useMediaQuery } from 'react-responsive'
import { Helmet } from 'react-helmet'
import './CubeBrowser.css' 

export const CubeBrowser = (props) => {

    const isMounted = useRef(false)
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1000px)' })
    const [page, setPage] = useState(1)
    const [cards, setCards] = useState([])
    const [cardsPerPage, setCardsPerPage] = useState(10)
    const [view, setView] = useState('spoilers')
    const [sortBy, setSortBy] = useState('name:asc')
    const [cube, setCube] = useState({
        name: '',
        builder: '',
        cardPool: []
    })

    const [advanced, setAdvanced] = useState(false)
    const [id, setId] = useState(null)
    const { id: useParamsId } = useParams()
    if (useParamsId && id !== useParamsId) {
        setId(useParamsId)
    }

    const [sliders, setSliders] = useState({
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
      isNormal: false,
      isRitual: false,
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
      isEffect: false,
      isFlip: false,
      isFusion: false,
      isGemini: false,
      isLink: false,
      isNormal: false,
      isPendulum: false,
      isRitual: false,
      isSpirit: false,
      isSynchro: false,
      isToon: false,
      isTuner: false,
      isUnion: false,
      isXyz: false
    })
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => {
        if (!isMounted.current) return
        setAdvanced(false)
        window.scrollTo(0, document.getElementById('sortSelector')?.offsetTop - 10)
    }, [page])
    
    // CHANGE CARDS PER PAGE
    const changeCardsPerPage = (e) => {
      setCardsPerPage(Number(e.target.value))
      setPage(1)
    }
    
    // SEARCH
    const search = useCallback(async () => {
        const sortFn = (a, b) => {
            const [key, dir] = sortBy.split(':')
            if (key === 'name' && dir?.includes('asc')) {
                if (b.name < a.name) {
                    return 1
                } else if (b.name > a.name) {
                    return -1
                }
            } else if (key === 'name' && dir?.includes('desc')) {
                if (b.name > a.name) {
                    return 1
                } else if (b.name < a.name) {
                    return -1
                }
            } else if (key === 'tcgDate' && dir?.includes('asc'))  {
                if (b.tcgDate < a.tcgDate) {
                    return 1
                } else if (b.tcgDate > a.tcgDate) {
                    return -1
                }
            } else if (key === 'tcgDate' && dir?.includes('desc')) {
                if (b.tcgDate > a.tcgDate) {
                    return 1
                } else if (b.tcgDate < a.tcgDate) {
                    return -1
                }
            } else if (key === 'atk' && dir?.includes('asc'))  {
                if (a.atk === null) {
                    return 1
                } else if (b.atk < a.atk) {
                    return 1
                } else if (b.atk > a.atk) {
                    return -1
                }
            } else if (key === 'atk' && dir?.includes('desc')) {
                if (a.atk === null) {
                    return 1
                } else if (b.atk > a.atk) {
                    return 1
                } else if (b.atk < a.atk) {
                    return -1
                }
            } else if (key === 'def' && dir?.includes('asc'))  {
                if (a.def === null) {
                    return 1
                } else if (b.def < a.def) {
                    return 1
                } else if (b.def > a.def) {
                    return -1
                }
            } else if (key === 'def' && dir?.includes('desc')) {
                if (a.def === null) {
                    return 1
                } else if (b.def > a.def) {
                    return 1
                } else if (b.def < a.def) {
                    return -1
                }
            } else if (key === 'level' && dir?.includes('asc'))  {
                if (a.level === null && a.rating === null) {
                    return 1
                } else if (b.level < a.level || b.rating < a.rating) {
                    return 1
                } else if (b.level > a.level || b.rating > a.rating) {
                    return -1
                }
            } else if (key === 'level' && dir?.includes('desc')) {
                if (a.level === null && a.rating === null) {
                    return 1
                } else if (b.level > a.level || b.rating > a.rating) {
                    return 1
                } else if (b.level < a.level || b.rating < a.rating) {
                    return -1
                }
            }

            return false
          }

      const results = cube.cardPool.filter((c) => {
        if (queryParams.name) {
            if (!c.name?.toLowerCase()?.includes(queryParams.name?.toLowerCase())) return false
        }

        if (queryParams.description) {
            if (!c.description?.toLowerCase()?.includes(queryParams.description?.toLowerCase())) return false
        }

        if (queryParams.category) {
            if (c.category?.toLowerCase() !== queryParams.category.toLowerCase()) return false
        }

        const iconKeys = Object.keys(iconParams)
        for (let i = 0; i < iconKeys.length; i++) {
            const k = iconKeys[i]
            if (iconParams[k] && c.icon?.toLowerCase() !== k) return false
        }

        const attributeKeys = Object.keys(attributeParams)
        for (let i = 0; i < iconKeys.length; i++) {
            const k = attributeKeys[i]
            if (attributeParams[k] && c.attribute?.toLowerCase() !== k) return false
        }

        const typeKeys = Object.keys(typeParams)
        for (let i = 0; i < iconKeys.length; i++) {
            const k = typeKeys[i]
            if (typeParams[k] && c.type?.toLowerCase() !== k) return false
        }

        const groupKeys = Object.keys(groupParams)
        for (let i = 0; i < iconKeys.length; i++) {
            const k = groupKeys[i]
            if (groupParams[k] && !c[k]) return false
        }

        const minLevel = sliders.level[0]
        const maxLevel = sliders.level[1]
        if (minLevel !== 1 || maxLevel !== 12) {
            if (c.level < minLevel || c.level > maxLevel) return false
        }
    
        const minATK = sliders.atk[0]
        const maxATK = sliders.atk[1]
        if (minATK !== 0 || maxATK !== 5000) {
            if (c.atk < minATK || c.atk > maxATK) return false
        }
    
        const minDEF = sliders.def[0]
        const maxDEF = sliders.def[1]
        if (minDEF !== 0 || maxDEF !== 5000) {
            if (c.atk < minDEF || c.atk > maxDEF) return false
        }

        return true
      }).sort(sortFn)

      setCards([...results])
    }, [cardsPerPage, page, sortBy, queryParams, iconParams, attributeParams, typeParams, groupParams, sliders.atk, sliders.level, sliders.def])
  
    // RESET
    const reset = async () => {
      document.getElementById('category').value = ''
      document.getElementById('search-by').value = 'name'
      document.getElementById('search-bar').value = null
  
      setSliders({
        level: [1, 12],
        atk: [0, 5000],
        def: [0, 5000]
      })
      
      setPage(1)
      setSortBy('name:asc')
      
      setQueryParams({
        name: null,
        description: null,
        category: null
      })
    
      setIconParams({
        continuous: false,
        counter: false,
        equip: false,
        field: false,
        isNormal: false,
        isRitual: false,
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
        isEffect: false,
        isFlip: false,
        isFusion: false,
        isGemini: false,
        isLink: false,
        isNormal: false,
        isPendulum: false,
        isRitual: false,
        isSpirit: false,
        isSynchro: false,
        isToon: false,
        isTuner: false,
        isUnion: false,
        isXyz: false
      })
  
      search()
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
      const id = document.getElementById('search-by').value
      const otherId = id === 'description' ? 'name' : 'description'
      setQueryParams(() => {
        return {
          ...queryParams,
          [id]: document.getElementById('search-bar').value,
          [otherId]: null
        }
      })
    }
    
    // USE EFFECT SET CUBE
    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data} = await axios.get(`/api/cubes/${id}?view=browser`)
                setCube(data)
            } catch (err) {
                console.log(err)
                setCube(null)
            }
        }

        fetchData()    
    }, [])

    // USE EFFECT SET CARDS
    useEffect(() => {
        setCards([...cube.cardPool])
        isMounted.current = true
    }, [cube])

    // USE EFFECT IF RELEVANT SEARCH PARAM STATES CHANGE
    useEffect(() => {
        if (!isMounted.current) return
        search()
    }, [isMounted.current, page, cardsPerPage, sortBy, sliders.atk, sliders.def, sliders.level, queryParams, groupParams, iconParams, attributeParams, typeParams, search])

    const advancedButtons = {
      icon: [
        ['isNormal', 'Normal'], 
        ['continuous', 'Contin.'], 
        ['counter', 'Counter'], 
        ['equip', 'Equip'], 
        ['field', 'Field'], 
        ['isRitual', 'Ritual'], 
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
        ['isNormal', 'Normal'], 
        ['isEffect', 'Effect'], 
        ['isRitual', 'Ritual'], 
        ['isPendulum', 'Pend.'], 
        ['isFusion', 'Fusion'], 
        ['isSynchro', 'Synchro'], 
        ['isXyz', 'Xyz'], 
        ['isLink', 'Link'], 
        ['isFlip', 'Flip'], 
        ['isGemini', 'Gemini'], 
        ['isSpirit', 'Spirit'], 
        ['isToon', 'Toon'], 
        ['isTuner', 'Tuner'], 
        ['isUnion', 'Union']
      ]
    }
  
    const advancedButtonKeys = Object.keys(advancedButtons)
  
    // RENDER
    return (
        <>
            <Helmet>
                <title>{`${cube?.name} by ${cube?.builderName} - Yu-Gi-Oh! Cube - Format Library`}</title>
                <meta name="og:title" content={`${cube?.name} by ${cube?.builderName} - Yu-Gi-Oh! Cube - Format Library`}/>
                <meta name="description" content={`Search the card pool for ${cube.name} by ${cube.builderName}. Filter and sort by Category, Attribute, Type, ATK, DEF, Level/Rank, etc.`}/>
                <meta name="og:description" content={`Search the card pool for ${cube.name} by ${cube.builderName}. Filter and sort by Category, Attribute, Type, ATK, DEF, Level/Rank, etc.`}/>
            </Helmet>
            <div className="body">
                <div className="card-database-flexbox">
                    <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${cube.logo || 'cube.webp'}`} alt="cube-logo"/>
                    <div>
                        <h1>{cube.name}</h1>
                        <h2 className="desktop-only">Created By {cube.builderName}</h2>
                    </div>
                    <img style={{ width:'64px'}} src={`https://cdn.formatlibrary.com/images/emojis/${cube.logo || 'cube.webp'}`} alt="cube-logo"/>
                </div>

            {
                isTabletOrMobile ? (
                    <div className="card-search-flexbox">
                        <input
                            id="search-bar"
                            className="filter"
                            type="text"
                            style={{maxWidth: '60vw'}}
                            placeholder="🔍"
                            onChange={() => runQuery()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { search() }
                            }}
                        />

                        <select
                            id="search-by"
                            defaultValue="name"
                            className="filter"
                            style={{maxWidth: '30vw'}}
                            onChange={() => runQuery()}
                            >
                            <option value="name">Name</option>
                            <option value="description">Text</option>
                        </select>

                        <select
                            id="category"
                            defaultValue=""
                            style={{maxWidth: '29vw'}}
                            className="filter"
                            onChange={() => setQueryParams({ ...queryParams, category: document.getElementById('category').value })}
                        >
                            <option value="">Categories</option>
                            <option value="monster">Monster</option>
                            <option value="spell">Spell</option>
                            <option value="trap">Trap</option>
                        </select>
                    </div>
                ) : (
                    <div className="card-search-flexbox">
                        <input
                            id="search-bar"
                            className="filter"
                            type="text"
                            placeholder="🔍"
                            onChange={() => runQuery()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { search() }
                            }}
                        />

                        <select
                            id="search-by"
                            defaultValue="name"
                            className="filter"
                            onChange={() => runQuery()}
                        >
                            <option value="name">Search By: Name</option>
                            <option value="description">Search By: Text</option>
                        </select>

                        <select
                            id="category"
                            defaultValue=""
                            className="filter"
                            onChange={() => setQueryParams({ ...queryParams, category: document.getElementById('category').value })}
                        >
                            <option value="">All Categories</option>
                            <option value="monster">Monsters</option>
                            <option value="spell">Spells</option>
                            <option value="trap">Traps</option>
                        </select>

                        <div
                            className="search-button desktop-only"
                            type="submit"
                            onClick={() => {
                                search()
                                if (advanced) setAdvanced(false)
                            }}
                        >
                            Search
                        </div>
                    </div>
                )
            }
    
            {
                !advanced ? (
                    <div className="advanced-search">
                        <div
                            className="show-advanced-button"
                            type="submit"
                            onClick={() => setAdvanced(!advanced)}
                        >
                            Show Advanced Options
                        </div>
                    </div>
                ) : (
                    <div className="advanced-search">
                        <div
                            className="show-advanced-button"
                            type="submit"
                            onClick={() => setAdvanced(!advanced)}
                        >
                            Hide Advanced Options
                        </div>

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

                                        return isTabletOrMobile ? (
                                            <MiniAdvButton 
                                                key={el[0]} 
                                                id={el[0]} 
                                                buttonClass={buttonClass} 
                                                clicked={params[el[0]]}
                                                removeFilter={removeFilter} 
                                                applyFilter={applyFilter}
                                            />
                                        ) : (
                                            <AdvButton 
                                                key={el[0]} 
                                                id={el[0]} 
                                                display={el[1]}
                                                buttonClass={buttonClass} 
                                                clicked={params[el[0]]}
                                                removeFilter={removeFilter} 
                                                applyFilter={applyFilter}
                                            />
                                        )
                                    })
                                }
                                </div>
                            ))
                        }

                        <br />
    
                        <div className="slider-flexbox">
                            <div className="slider-column">
                                <ModdedSlider
                                    id="level"
                                    type="range-slider"
                                    symbol="https://cdn.formatlibrary.com/images/symbols/star.webp"
                                    label="Level"
                                    step={1}
                                    min={1}
                                    max={12}
                                    sliders = {sliders}
                                    setSliders = {setSliders}
                                    defaultValue = {sliders.level}
                                />

                                <ModdedSlider
                                    id="atk"
                                    type="range-slider"
                                    symbol="https://cdn.formatlibrary.com/images/emojis/swords.webp"
                                    label="ATK"
                                    step={50}
                                    min={0}
                                    max={5000}
                                    sliders = {sliders}
                                    setSliders = {setSliders}
                                    defaultValue = {sliders.atk}
                                />

                                <ModdedSlider
                                    id="def"
                                    type="range-slider"
                                    symbol="https://cdn.formatlibrary.com/images/emojis/shield.webp"
                                    label="DEF"
                                    step={50}
                                    min={0}
                                    max={5000}
                                    sliders = {sliders}
                                    setSliders = {setSliders}
                                    defaultValue = {sliders.def}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
    
            <div id="resultsWrapper0" className="resultsWrapper0">
                <div className="results desktop-only" style={{width: '360px'}}>
                    Results:{' '}
                    {
                    cards.length ? `${cardsPerPage * page - cardsPerPage + 1} - ${
                        cards.length >=
                            cardsPerPage * page
                            ? cardsPerPage * page
                            : cards.length
                        } of ${cards.length || 0}`
                    : cards.length || 0
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
        
                    <div
                        className="search-button desktop-only"
                        type="submit"
                        onClick={() => reset()}
                    >
                        Reset
                    </div>
                </div>
            </div>
    
            <div className="paginationWrapper desktop-only">
            <div className="pagination desktop-only">
                <Pagination
                setPage={setPage}
                itemCount={cube.cardPool?.length || 0}
                page={page}
                itemsPerPage={cardsPerPage}
                />
            </div>
            </div>
    
            {view === 'spoilers' ? (
            <div id="card-table">
                <table id="cards">
                <tbody>
                    {cards.length ? (
                    cards.slice((page - 1) * cardsPerPage, page * cardsPerPage).map((card, index) => {
                        if (isTabletOrMobile) {
                            return <MobileCardRow key={card.id} index={index} card={card}/>
                        } else {
                            return <CardRow key={card.id} index={index} card={card}/>
                        }
                    })
                    ) : (
                    <tr />
                    )}
                </tbody>
                </table>
            </div>
            ) : (
            <div id="cardGalleryFlexBox">
                {cards.length ? (
                cards.slice((page - 1) * cardsPerPage, page * cardsPerPage).map((card) => {
                    return <
                            CardImage 
                            key={card.id} 
                            card={card} 
                            width="184px"
                            margin="4px"
                            padding="2px"
                            />
                })
                ) : (
                <div />
                )}
            </div>
            )}
    
            <div className="pagination">
            <Pagination
                setPage={setPage}
                itemCount={cube.cardPool?.length || 0}
                page={page}
                itemsPerPage={cardsPerPage}
            />
            </div>
        </div>
        </>
    )
}
