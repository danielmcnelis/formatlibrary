

import { useState, useEffect, useLayoutEffect } from 'react'
import {MiniAdvButton} from '../Cards/MiniAdvButton'
import {CardImage} from '../Cards/CardImage'
import {Slider} from '../General/Slider'
import {MiniPagination} from '../General/MiniPagination'
import axios from 'axios'
import { capitalize } from '@fl/utils'
import { useMediaQuery } from 'react-responsive'
import './Builder.css'

const symbols = {
    Star: 'https://cdn.formatlibrary.com/images/symbols/star.png'
}

const { Star } = symbols

const emojis = {
    Shield: 'https://cdn.formatlibrary.com/images/emojis/shield.png',
    Swords: 'https://cdn.formatlibrary.com/images/emojis/swords.png'
}

const { Shield, Swords } = emojis
const now = new Date()

export const SearchPanel = (props) => {
    const format = props.format || {}
    const cardsPerPage = 20
    const isTabletOrMobile = useMediaQuery({ query: '(max-width: 860px)' })
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

        const { data } = await axios.get(url)
        setCards(data)
    }

    // RESET
    const reset = async () => {
        const formatSelector = document.getElementById('format')
        if (formatSelector) formatSelector.value = ''
        document.getElementById('category').value = ''

        setSliders({
            year: now.getFullYear(),
            month: 12,
            day: 31,
            level: [1, 12],
            atk: [0, 5000],
            def: [0, 5000]
        })
        
        setPage(1)
        const {data} = await axios.get(`/api/formats/current`)
        props.setFormat(data.format)
        document.getElementById('format').value = ""
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
        const year = format.date ? parseInt(format.date.slice(0, 4)) : now.getFullYear()
        const month = format.date ? parseInt(format.date.slice(6, 7)) : 12
        const day = format.date ? parseInt(format.date.slice(-2)) : 31
        setCutoff(format.date || `${year}-12-31`)
        setSliders({ ...sliders, year, month, day })

        const fetchData = async () => {
            try {
                const {data} = await axios.get(`/api/banlists/simple/${format.banlist || 'oct22'}?category=${format.category || 'TCG'}`)
                setBanlist(data)
            } catch (err) {
                console.log(err)
            }
        }

        fetchData()
    }, [format.id])

    // USE EFFECT IF DATE SLIDERS CHANGE
    useEffect(() => {
        if (!format || !format.id) {
            const month = sliders.month >= 10 ? sliders.month : `0${sliders.month}`
            const day = sliders.day >= 10 ? sliders.day : `0${sliders.day}`
            setCutoff(`${sliders.year}-${month}-${day}`)
        }
    }, [props])

    // USE EFFECT IF RELEVANT SEARCH PARAM STATES CHANGE
    useEffect(() => {
        count()
        search()
    }, [props, page, sortBy, cutoff, queryParams, groupParams, iconParams, attributeParams, typeParams])

    const advancedButtons = {
    icon: [
        ['normal'], 
        ['continuous'], 
        ['counter'], 
        ['equip'], 
        ['field'], 
        ['ritual'], 
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
        ['cyberse'], 
        ['dinosaur'], 
        ['dragon'], 
        ['divine-beast'], 
        ['fairy'], 
        ['fiend'], 
        ['fish'], 
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
        ['normal'], 
        ['effect'], 
        ['ritual'], 
        ['pendulum'], 
        ['fusion'], 
        ['synchro'], 
        ['xyz'], 
        ['link'], 
        ['flip'], 
        ['gemini'], 
        ['spirit'], 
        ['toon'], 
        ['tuner'], 
        ['union']
    ]
    }

    const advancedButtonKeys = Object.keys(advancedButtons)
    
    return (
        <div className="SearchPanel">
            <div>
                <input
                    id="searchBar"
                    className="filter"
                    type="text"
                    style={{width:"240px", margin: "2px 0px"}}
                    placeholder="🔍"
                    onChange={() => runQuery()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { count(); search() }
                    }}
                />
            </div>

            <div>
                <select
                    id="category"
                    defaultValue=""
                    style={{maxWidth: '29vw', margin: '0px 2px'}}
                    className="filter"
                    onChange={() => setQueryParams({ ...queryParams, category: document.getElementById('category').value })}
                >
                    <option value="">Cards</option>
                    <option value="Monster">Monster</option>
                    <option value="Spell">Spell</option>
                    <option value="Trap">Trap</option>
                </select>

                <select
                    id="format"
                    value={format?.name || ""}
                    style={{maxWidth: '35vw'}}
                    className="filter"
                    onChange={(e) => updateFormat(e)}
                >
                <option key="Current" value="">Current</option>
                {
                    props.formats?.filter((f) => !!f.date).map((f) => <option key={f.name} value={f.name}>{f.name}</option>)
                }
                </select>
            </div>

            {!advanced ? (
                <div
                    className="refinedButton"
                    type="submit"
                    style={{width:"240px"}}
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
                        <Slider
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
                        <Slider
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
                        <Slider
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

            <div>
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

                <div>
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
                        className="searchButton desktop-only"
                        type="submit"
                        onClick={() => reset()}
                    >
                        Reset
                    </div>
                    <div id="builderGalleryFlexBox" >
                        {total ? (
                            cards.map((card) => {
                            return <
                                        CardImage 
                                        addCard={props.addCard}
                                        key={card.id} 
                                        card={card} 
                                        width="60px"
                                        margin="1px"
                                        padding="0.5px"
                                        status={banlist[card.id]}
                                    />
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
            </div>
        </div>
    )
}
