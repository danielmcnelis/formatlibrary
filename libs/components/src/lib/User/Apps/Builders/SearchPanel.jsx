

import { useState, useEffect, useLayoutEffect } from 'react'
import {MiniAdvButton} from '../../../Buttons/MiniAdvButton'
import {CardImage} from '../../../Cards/CardImage'
import {ModdedSlider} from '../../../General/Slider'
import {MiniPagination} from '../../../General/MiniPagination'
import axios from 'axios'
import { capitalize } from '@fl/utils'
import { useMediaQuery } from 'react-responsive'
import {Draggable} from '../../../General/Draggable'

import './Builder.css'

const symbols = {
    Star: 'https://cdn.formatlibrary.com/images/symbols/star.webp'
}

const { Star } = symbols

const emojis = {
    Shield: 'https://cdn.formatlibrary.com/images/emojis/shield.webp',
    Swords: 'https://cdn.formatlibrary.com/images/emojis/swords.webp'
}

const { Shield, Swords } = emojis
const now = new Date()

export const SearchPanel = (props) => {
    const format = props.format
    const cardsPerPage = 20
    // const isTabletOrMobile = useMediaQuery({ query: '(max-width: 860px)' })
    const [page, setPage] = useState(1)
    const [cards, setCards] = useState([])
    const [sortBy, setSortBy] = useState('name:asc')
    const [total, setTotal] = useState('')
    const [banlist, setBanlist] = useState({})
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
        category: null,
        region: 'tcg'
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
    useLayoutEffect(() => window.scrollTo(0, 0), [])
    
    // COUNT
    const count = async () => {
        let url = `/api/cards/count`   
        let filter = ''
        if (queryParams.name) filter += `,name:inc:${queryParams.name}`
        if (queryParams.category) filter += `,category:eq:${queryParams.category}`
        if (queryParams.description) filter += `,description:inc:${queryParams.description}`
        if (queryParams.region?.toLowerCase() === 'tcg') filter += `,isTcgLegal:eq:true`
        if (queryParams.region?.toLowerCase() === 'ocg') filter += `,isOcgLegal:eq:true`
        if (queryParams.region?.toLowerCase() === 'speed') filter += `,isSpeedLegal:eq:true`

        const icons = Object.entries(iconParams).filter((e) => !!e[1]).map((e) => capitalize(e[0], true))
        const attributes = Object.entries(attributeParams).filter((e) => !!e[1]).map((e) => e[0].toUpperCase())
        const types = Object.entries(typeParams).filter((e) => !!e[1]).map((e) => capitalize(e[0], true))
        const groups = Object.entries(groupParams).filter((e) => !!e[1]).map((e) => e[0])

        if (icons.length) filter += `,icon:or:arr(${icons.join(';')})`
        if (attributes.length) filter += `,attribute:or:arr(${attributes.join(';')})`
        if (types.length) filter += `,type:or:arr(${types.join(';')})`
        groups.forEach((g) => filter += `,${g}:eq:true`)
        if (groupParams.isEffect) filter += `,isExtraDeck:eq:false`

        if (cutoff !== `${now.getFullYear()}-12-31`) {
            queryParams.region?.toLowerCase() === 'speed' ? filter += `,speedDate:lte:${cutoff}`: 
            queryParams.region?.toLowerCase().includes('ocg') ? filter += `,ocgDate:lte:${cutoff}` : 
            filter += `,tcgDate:lte:${cutoff}`
        }

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
        if (queryParams.region?.toLowerCase() === 'tcg') filter += `,isTcgLegal:eq:true`
        if (queryParams.region?.toLowerCase() === 'ocg') filter += `,isOcgLegal:eq:true`
        if (queryParams.region?.toLowerCase() === 'speed') filter += `,isSpeedLegal:eq:true`

        const icons = Object.entries(iconParams).filter((e) => !!e[1]).map((e) => capitalize(e[0], true))
        const attributes = Object.entries(attributeParams).filter((e) => !!e[1]).map((e) => e[0].toUpperCase())
        const types = Object.entries(typeParams).filter((e) => !!e[1]).map((e) => capitalize(e[0], true))
        const groups = Object.entries(groupParams).filter((e) => !!e[1]).map((e) => e[0])

        if (icons.length) filter += `,icon:or:arr(${icons.join(';')})`
        if (attributes.length) filter += `,attribute:or:arr(${attributes.join(';')})`
        if (types.length) filter += `,type:or:arr(${types.join(';')})`
        groups.forEach((g) => filter += `,${g}:eq:true`)
        if (groupParams.isEffect) filter += `,isExtraDeck:eq:false`

        if (cutoff !== `${now.getFullYear()}-12-31`) {
            queryParams.region?.toLowerCase() === 'speed' ? filter += `,speedDate:lte:${cutoff}`: 
            queryParams.region?.toLowerCase().includes('ocg') ? filter += `,ocgDate:lte:${cutoff}` : 
            filter += `,tcgDate:lte:${cutoff}`
        }

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

        const { data } = await axios.get(url)
        setCards(data)
    }

    // RESET
    const reset = async () => {
        document.getElementById('category').value = ''
        setPage(1)
        setSortBy('name:asc')
        
        setQueryParams({
            ...queryParams,
            name: null,
            description: null
        })

        document.getElementById('searchBar').value = ""
        
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

        count()
        search()
    }

    // UPDATE FORMAT
    const updateFormat = async (e) => {
        if (e.target.value.length) {
            const {data} = await axios.get(`/api/formats/${e.target.value.toLowerCase().replace(' ', '-')}`) 
            props.setFormat(data.format)
        } else {
            props.setFormat({})
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
    setQueryParams(() => {
        return {
                ...queryParams,
                name: document.getElementById('searchBar').value
            }
        })
    }

    // USE EFFECT IF FORMAT CHANGES
    useEffect(() => {
        const fetchData = async () => {
            try {
                const year = format.date ? parseInt(format.date.slice(0, 4)) : now.getFullYear()
                const month = format.date ? parseInt(format.date.slice(6, 7)) : 12
                const day = format.date ? parseInt(format.date.slice(-2)) : 31

                if (format.banlist) {
                    const {data: banlistData} = await axios.get(`/api/banlists/cards/${format.banlist}?category=${format.category || 'TCG'}`)
                    setBanlist(banlistData || {})
                }

                setCutoff(format.date || `${year}-12-31`)
                setSliders({ ...sliders, year, month, day })
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
    }, [format, sliders])

    // USE EFFECT IF RELEVANT SEARCH PARAM STATES CHANGE
    useEffect(() => {
        count()
        search()
    }, [props, page, sortBy, cutoff, queryParams, groupParams, iconParams, attributeParams, typeParams])

    const advancedButtons = {
        icon: [
            ['isNormal'], 
            ['continuous'], 
            ['counter'], 
            ['equip'], 
            ['field'], 
            ['isRitual'], 
            ['quick-play']
        ],
        attribute: [
            ['dark'], 
            ['light'], 
            ['earth'], 
            ['wind'], 
            ['water'], 
            ['fire'], 
            ['divine']
        ],
        type: [
            ['aqua'], 
            ['beast'], 
            ['beast-warrior'], 
            ['creator-god'], 
            ['cyberse'], 
            ['dinosaur'], 
            ['dragon'], 
            ['divine-beast'], 
            ['fairy'], 
            ['fiend'], 
            ['fish'], 
            ['illusion'], 
            ['insect'], 
            ['machine'], 
            ['plant'], 
            ['psychic'], 
            ['pyro'], 
            ['reptile'], 
            ['rock'], 
            ['sea serpent'],
            ['spellcaster'], 
            ['thunder'], 
            ['warrior'], 
            ['winged beast'],
            ['wyrm'], 
            ['zombie']
        ],
        group: [
            ['isNormal'], 
            ['isEffect'], 
            ['isRitual'], 
            ['isPendulum'], 
            ['isFusion'], 
            ['isSynchro'], 
            ['isXyz'], 
            ['isLink'], 
            ['isFlip'], 
            ['isGemini'], 
            ['isSpirit'], 
            ['isToon'], 
            ['isTuner'], 
            ['isUnion']
        ]
    }

    const advancedButtonKeys = Object.keys(advancedButtons)
    
    return (
        <div className="SearchPanel">
            <div className="search-panel-flexbox">
                <input
                    id="searchBar"
                    className="filter"
                    type="text"
                    style={{width:"100%", margin: "2px 8px"}}
                    placeholder="🔍"
                    onChange={() => runQuery()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { count(); search() }
                    }}
                />
            </div>

            <div className="search-panel-flexbox">
                <select
                    id="search-by"
                    defaultValue="name"
                    className="filter"
                    onChange={() => runQuery()}
                >
                    <option value="name">Search: Name</option>
                    <option value="description">Search: Text</option>
                </select>

                <select
                    id="region"
                    value={queryParams.region || "tcg"}
                    className="filter"
                    onChange={() => setQueryParams({ ...queryParams, region: document.getElementById('region').value })}
                >
                    <option value="tcg">TCG Legal</option>
                    <option value="ocg">OCG Legal</option>
                    <option value="all">All Cards</option>
                    <option value="speed">Speed Duel</option>
                </select>
            </div>

            <div className="search-panel-flexbox">
                <select
                    id="category"
                    defaultValue=""
                    className="filter"
                    onChange={() => setQueryParams({ ...queryParams, category: document.getElementById('category').value })}
                >
                    <option value="">Card Type</option>
                    <option value="Monster">Monster</option>
                    <option value="Spell">Spell</option>
                    <option value="Trap">Trap</option>
                </select>

                <select
                    id="format"
                    value={format?.name || ""}
                    className="filter"
                    onChange={(e) => updateFormat(e)}
                >
                <option key="Advanced" value="">Advanced</option>
                {
                    props.formats?.filter((f) => !!f.date).map((f) => <option key={f.name} value={f.name}>{f.name}</option>)
                }
                </select>
            </div>

            <div className="centered-content-flexbox">
                {!advanced ? (
                    <div
                        className="refinedButton"
                        type="submit"
                        style={{width:"100%"}}
                        onClick={() => setAdvanced(!advanced)}
                    >
                        Show Advanced Options
                    </div>
                ) : (
                    <div style={{alignItems: 'center', justifyContent: 'center'}}>
                        <div
                            className="refinedButton"
                            type="submit"
                            style={{width:"240px"}}
                            onClick={() => setAdvanced(!advanced)}
                        >
                            Hide Advanced Options
                        </div>
                        <br />
                        {
                            advancedButtonKeys.map((buttonClass) => (
                            <div key={buttonClass} style={{margin: '0px auto', alignItems: 'center', justifyContent: 'center', width: '240px', flexWrap: 'wrap' }}>
                                {
                                advancedButtons[buttonClass].map((el) => {
                                    const params = buttonClass === 'icon' ? iconParams : 
                                    buttonClass === 'attribute' ? attributeParams : 
                                    buttonClass === 'type' ? typeParams : 
                                    groupParams

                                    return (
                                    <MiniAdvButton 
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

                        <div>
                            <div>
                            <ModdedSlider
                                id="level"
                                type="range-slider"
                                symbol={Star}
                                step={1}
                                min={1}
                                max={12}
                                margin="none"
                                maxWidth="210px"
                                sliders = {sliders}
                                setSliders = {setSliders}
                                defaultValue = {sliders.level}
                            />
                            <ModdedSlider
                                id="atk"
                                type="range-slider"
                                symbol={Swords}
                                step={50}
                                min={0}
                                max={5000}
                                margin="none"
                                maxWidth="210px"
                                sliders = {sliders}
                                setSliders = {setSliders}
                                defaultValue = {sliders.atk}
                            />
                            <ModdedSlider
                                id="def"
                                type="range-slider"
                                symbol={Shield}
                                step={50}
                                min={0}
                                max={5000}
                                margin="none"
                                maxWidth="210px"
                                sliders = {sliders}
                                setSliders = {setSliders}
                                defaultValue = {sliders.def}
                            />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="centered-content-flexbox">
                <div>
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
            </div>

            <div className="search-panel-flexbox">
                <select
                    id="sortSelector"
                    defaultValue="nameASC"
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
                    className="searchButton desktop-only"
                    type="submit"
                    onClick={() => reset()}
                >
                    Reset
                </div>
            </div>

            <div id="builderGalleryFlexBox" >
                {total ? (
                    cards.map((card) => {
                        return (
                            <Draggable>
                                <CardImage 
                                    addCard={props.addCard}
                                    setCard={props.setCard}
                                    key={'search-' + card.id} 
                                    card={card}
                                    disableLink={true}
                                    width="60px"
                                    margin="1px"
                                    padding="0.5px"
                                    status={banlist[card.id]}
                                />
                            </Draggable>
                        )
                    })
                ) : (
                    <div />
                )}
            </div>
            <MiniPagination
                setPage={setPage}
                itemCount={total}
                page={page}
                itemsPerPage={cardsPerPage}
            />
        </div>
    )
}
