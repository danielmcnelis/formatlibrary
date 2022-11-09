
import { useState } from 'react'
import axios from 'axios'

export const CardCreator = () => {
    const [konamiCode, setKonamiCode] = useState(null)
    const [name, setName] = useState(null)
    const [description, setDescription] = useState(null)
    const [category, setCategory] = useState(null)
    const [tcgDate, setTCGDate] = useState(null)
    const [ocgDate, setOCGDate] = useState(null)
    const [icon, setIcon] = useState(null)
    const [attribute, setAttribute] = useState(null)
    const [type, setType] = useState(null)
    const [atk, setATK] = useState(null)
    const [def, setDEF] = useState(null)
    const [level, setLevel] = useState(null)
    const [rating, setRating] = useState(null)
    const [scale, setScale] = useState(null)
    const [arrows, setArrows] = useState(null)
    const [normal, setNormal] = useState(false)
    const [effect, setEffect] = useState(false)
    const [fusion, setFusion] = useState(false)
    const [ritual, setRitual] = useState(false)
    const [synchro, setSynchro] = useState(false)
    const [xyz, setXyz] = useState(false)
    const [pendulum, setPendulum] = useState(false)
    const [link, setLink] = useState(false)
    const [flip, setFlip] = useState(false)
    const [gemini, setGemini] = useState(false)
    const [spirit, setSpirit] = useState(false)
    const [tuner, setTuner] = useState(false)
    const [toon, setToon] = useState(false)
    const [union, setUnion] = useState(false)
    const [image, setImage] = useState(null)

    //RESET
    const reset = async () => {
        setImage(null)
        setKonamiCode(null)
        setDescription(null)
        setName(null)
        setTCGDate(null)
        setOCGDate(null)
        setCategory(null),
        setIcon(null)
        setAttribute(null)
        setType(null)
        setATK(null)
        setDEF(null)
        setLevel(null)
        setRating(null)
        setScale(null)
        setArrows(null)
        setNormal(false)
        setEffect(false)
        setFusion(false)
        setRitual(false)
        setSynchro(false)
        setXyz(false)
        setPendulum(false)
        setLink(false)
        setFlip(false)
        setGemini(false)
        setSpirit(false)
        setToon(false)
        setTuner(false)
        setUnion(false)
        document.getElementById('name').value = null
        document.getElementById('description').value = null
        document.getElementById('konamiCode').value = null
        document.getElementById('image').value = null
        document.getElementById('tcgDate').value = null
        document.getElementById('ocgDate').value = null
        document.getElementById('category').value = null
        document.getElementById('icon').value = null
        document.getElementById('attribute').value = null
        document.getElementById('type').value = null
        document.getElementById('atk').value = null
        document.getElementById('def').value = null
        document.getElementById('level').value = null
        document.getElementById('rating').value = null
        document.getElementById('scale').value = null
        document.getElementById('arrows').value = null
        document.getElementById('normal').value = false
        document.getElementById('effect').value = false
        document.getElementById('fusion').value = false
        document.getElementById('ritual').value = false
        document.getElementById('synchro').value = false
        document.getElementById('xyz').value = false
        document.getElementById('pendulum').value = false
        document.getElementById('link').value = false
        document.getElementById('flip').value = false
        document.getElementById('gemini').value = false
        document.getElementById('spirit').value = false
        document.getElementById('toon').value = false
        document.getElementById('tuner').value = false
        document.getElementById('union').value = false
    }

    //CREATE IMAGE
    const createCard = async () => {
        if (!name) return alert('Please provide a Name.')
        if (!description) return alert('Please provide a Description.')
        if (!konamiCode) return alert('Please provide a Konami Code.')
        if (!tcgDate && !ocgDate) return alert('Please provide a TCG Date and/or an OCG Date.')
        if (!image) return alert('Missing Image file.')
        if (!category) return alert('Please select a Category.')
        if (!icon && (category === 'Spell'|| category === 'Trap')) return alert('Please select an Icon.')
        if (!attribute && category === 'Monster') return alert('Please select an Attribute.')
        if (!type && category === 'Monster') return alert('Please select a Type.')
        if (atk === null && category === 'Monster') return alert('Please provide an ATK stat.')
        if (def === null && category === 'Monster') return alert('Please provide a DEF stat.')
        if (level === null && !link && category === 'Monster') return alert('Please provide a Level/Rank.')
        if (level === null && link && category === 'Monster') return alert('Please provide a Link Rating.')
        if (!arrows && link && category === 'Monster') return alert('Please provide Link Arrows.')
        if (scale === null && pendulum && category === 'Monster') return alert('Please provide a Pendulum Scale.')
        if (category === 'Monster' && !normal && !effect) return alert('Please set Normal or Effect to equal TRUE.')

        try {
            const {data} = await axios.post('/api/cards/create', {
                name: name,
                description: description,
                konamiCode: konamiCode,
                ypdId: parseInt(konamiCode),
                tcgDate: tcgDate,
                ocgDate: ocgDate,
                tcgLegal: !!tcgDate,
                ocgLegal: !!ocgDate,
                category: category,
                icon: icon,
                attribute: attribute,
                type: type,
                atk: atk,
                def: def,
                level: level,
                rating: rating,
                scale: scale,
                arrows: arrows,
                normal: normal,
                effect: effect,
                fusion: fusion,
                ritual: ritual,
                synchro: synchro,
                xyz: xyz,
                pendulum: pendulum,
                link: link,
                flip: flip,
                gemini: gemini,
                spirit: spirit,
                toon: toon,
                tuner: tuner,
                union: union,
                color: normal ? 'yellow' :
                    category === 'Spell' ? 'green' : 
                    category === 'Trap' ? 'violet' : 
                    link ? 'dark-blue' :
                    pendulum && effect ? 'orange-green' :
                    pendulum && !effect ? 'yellow-green' :
                    xyz ? 'black' :
                    synchro ? 'white' :
                    ritual ? 'light-blue' :
                    fusion ? 'purple' :
                    'orange',
                extraDeck: fusion || synchro || xyz || link,
                sortPriority: normal ? 1 :
                    category === 'Spell' ? 11 : 
                    category === 'Trap' ? 10 : 
                    link ? 9 :
                    pendulum && effect ? 4 :
                    pendulum && !effect ? 2 :
                    xyz ? 8 :
                    synchro ? 7 :
                    ritual ? 5 :
                    fusion ? 6 :
                    3,
                image: image
            })

            if (data.name) {
                alert(`Success! New Card: ${data.name}`)
            } else {
                alert(`Failure! This card already exists.`)
            }
            return reset()
        } catch (err) {
            console.log(err)
        }
    }

    // READ IMAGE
    const readImage = (file) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = () => setImage(reader.result)
    }

    return (
        <div className="admin-portal">
            <label>Name:
                <input
                    id="name"
                    className="login"
                    value={name || ''}
                    type="text"
                    onChange={(e) => setName(e.target.value)}
                />
            </label>
            <label>Konami Code:
                <input
                    id="konamiCode"
                    className="login"
                    value={konamiCode || ''}
                    type="text"
                    onChange={(e) => setKonamiCode(e.target.value)}
                />
            </label>
            <label>TCG Date:
                <input
                    id="tcgDate"
                    className="login"
                    value={tcgDate || ''}
                    type="text"
                    onChange={(e) => setTCGDate(e.target.value)}
                />
            </label>
            <label>OCG Date:
                <input
                    id="ocgDate"
                    className="login"
                    value={ocgDate || ''}
                    type="text"
                    onChange={(e) => setOCGDate(e.target.value)}
                />
            </label>
            <label>Description:
                <input
                    id="description"
                    className="login"
                    value={description || ''}
                    type="text"
                    onChange={(e) => setDescription(e.target.value)}
                />
            </label>
            <select
                id="category"
                value={category}
                className="login"
                style={{width: '200px'}}
                onChange={(e) => setCategory(e.target.value)}
            >
                <option value={null}>Category</option>
                <option value="Monster">Monster</option>
                <option value="Spell">Spell</option>
                <option value="Trap">Trap</option>
            </select>
            <select
                id="icon"
                value={icon}
                className="login"
                style={{width: '200px'}}
                onChange={(e) => setIcon(e.target.value)}
            >
                <option value={null}>Icon</option>
                <option value="Continuous">Continuous</option>
                <option value="Counter">Counter</option>
                <option value="Equip">Equip</option>
                <option value="Field">Field</option>
                <option value="Normal">Normal</option>
                <option value="Ritual">Ritual</option>
                <option value="Quick-Play">Quick-Play</option>
            </select>
            <select
                id="attribute"
                value={attribute}
                className="login"
                style={{width: '200px'}}
                onChange={(e) => setAttribute(e.target.value)}
            >
                <option value={null}>Attribute</option>
                <option value="DARK">DARK</option>
                <option value="DIVINE">DIVINE</option>
                <option value="EARTH">EARTH</option>
                <option value="FIRE">FIRE</option>
                <option value="LIGHT">LIGHT</option>
                <option value="WATER">WATER</option>
                <option value="WIND">WIND</option>
            </select>
            <select
                id="type"
                value={type}
                className="login"
                style={{width: '200px'}}
                onChange={(e) => setType(e.target.value)}
            >
                <option value={null}>Type</option>
                <option value="Aqua">Aqua</option>
                <option value="Beast">Beast</option>
                <option value="Beast-Warrior">Beast-Warrior</option>
                <option value="Cyberse">Cyberse</option>
                <option value="Dinosaur">Dinosaur</option>
                <option value="Dragon">Dragon</option>
                <option value="Divine-Beast">Divine-Beast</option>
                <option value="Fairy">Fairy</option>
                <option value="Fiend">Fiend</option>
                <option value="Fish">Fish</option>
                <option value="Insect">Insect</option>
                <option value="Machine">Machine</option>
                <option value="Plant">Plant</option>
                <option value="Psychic">Psychic</option>
                <option value="Pyro">Pyro</option>
                <option value="Reptile">Reptile</option>
                <option value="Rock">Rock</option>
                <option value="Sea Serpent">Sea Serpent</option>
                <option value="Spellcaster">Spellcaster</option>
                <option value="Thunder">Thunder</option>
                <option value="Warrior">Warrior</option>
                <option value="Winged Beast">Winged Beast</option>
                <option value="Wyrm">Wyrm</option>
                <option value="Zombie">Zombie</option>
            </select>
            <label>ATK:
                <input
                    id="atk"
                    className="login"
                    value={atk || ''}
                    type="text"
                    onChange={(e) => setATK(parseInt(e.target.value))}
                />
            </label>
            <label>DEF:
                <input
                    id="def"
                    className="login"
                    value={def || ''}
                    type="text"
                    onChange={(e) => setDEF(parseInt(e.target.value))}
                />
            </label>
            <label>Level:
                <input
                    id="level"
                    className="login"
                    value={level || ''}
                    type="text"
                    onChange={(e) => setLevel(parseInt(e.target.value))}
                />
            </label>
            <label>Rating:
                <input
                    id="rating"
                    className="login"
                    value={rating || ''}
                    type="text"
                    onChange={(e) => setRating(parseInt(e.target.value))}
                />
            </label>
            <label>Scale:
                <input
                    id="scale"
                    className="login"
                    value={scale || ''}
                    type="text"
                    onChange={(e) => setScale(parseInt(e.target.value))}
                />
            </label>
            <label>Arrows:
                <input
                    id="arrows"
                    className="login"
                    value={arrows || ''}
                    type="text"
                    onChange={(e) => setArrows(e.target.value)}
                />
            </label>
            <label>Normal:
                <select
                    id="normal"
                    value={normal}
                    className="login"
                    onChange={(e) => setNormal(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Effect:
                <select
                    id="effect"
                    value={effect}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setEffect(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Fusion:
                <select
                    id="fusion"
                    value={fusion}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setFusion(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Ritual:
                <select
                    id="ritual"
                    value={ritual}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setRitual(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Synchro:
                <select
                    id="synchro"
                    value={synchro}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setSynchro(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Xyz:
                <select
                    id="xyz"
                    value={xyz}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setXyz(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Pendulum:
                <select
                    id="pendulum"
                    value={pendulum}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setPendulum(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Link:
                <select
                    id="link"
                    value={link}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setLink(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Flip:
                <select
                    id="flip"
                    value={flip}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setFlip(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Gemini:
                <select
                    id="gemini"
                    value={gemini}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setGemini(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Spirit:
                <select
                    id="spirit"
                    value={spirit}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setSpirit(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Toon:
                <select
                    id="toon"
                    value={toon}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setToon(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Tuner:
                <select
                    id="tuner"
                    value={tuner}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setTuner(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Union:
                <select
                    id="union"
                    value={union}
                    className="login"
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setUnion(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Image:
                <input
                    id="image"
                    className="login"
                    type="file"
                    accept=".png"
                    onChange={(e) => readImage(e.target.files[0])}
                />
            </label>
            <a
                className="admin-button"
                type="submit"
                onClick={() => createCard()}
            >
                Submit
            </a>
        </div>
    )
}