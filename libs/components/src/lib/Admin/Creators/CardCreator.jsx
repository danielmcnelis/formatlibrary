
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
    const [isNormal, setIsNormal] = useState(false)
    const [isEffect, setIsEffect] = useState(false)
    const [isFusion, setIsFusion] = useState(false)
    const [isRitual, setIsRitual] = useState(false)
    const [isSynchro, setIsPendulumSynchro] = useState(false)
    const [isXyz, setIsXyz] = useState(false)
    const [isPendulum, setIsPendulum] = useState(false)
    const [isLink, setIsLink] = useState(false)
    const [isFlip, setIsFlip] = useState(false)
    const [isGemini, setIsGemini] = useState(false)
    const [isSpirit, setIsSpirit] = useState(false)
    const [isTuner, setIsTuner] = useState(false)
    const [isToon, setIsToon] = useState(false)
    const [isUnion, setIsUnion] = useState(false)
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
        setIsNormal(false)
        setIsEffect(false)
        setIsFusion(false)
        setIsRitual(false)
        setIsPendulumSynchro(false)
        setIsXyz(false)
        setIsPendulum(false)
        setIsLink(false)
        setIsFlip(false)
        setIsGemini(false)
        setIsSpirit(false)
        setIsToon(false)
        setIsTuner(false)
        setIsUnion(false)
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
        document.getElementById('isSynchro').value = false
        document.getElementById('isXyz').value = false
        document.getElementById('pendulum').value = false
        document.getElementById('isLink').value = false
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
        if (level === null && !isLink && category === 'Monster') return alert('Please provide a Level/Rank.')
        if (level === null && isLink && category === 'Monster') return alert('Please provide a Link Rating.')
        if (!arrows && isLink && category === 'Monster') return alert('Please provide Link Arrows.')
        if (scale === null && isPendulum && category === 'Monster') return alert('Please provide a Pendulum Scale.')
        if (category === 'Monster' && !isNormal && !isEffect) return alert('Please set Normal or Effect to equal TRUE.')

        try {
            const {data} = await axios.post('/api/cards/create', {
                name: name,
                description: description,
                konamiCode: konamiCode,
                ypdId: parseInt(konamiCode),
                artworkId: parseInt(konamiCode),
                tcgDate: tcgDate,
                ocgDate: ocgDate,
                isTcgLegal: !!tcgDate,
                isOcgLegal: !!ocgDate,
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
                isNormal: isNormal,
                isEffect: isEffect,
                isFusion: isFusion,
                isRitual: isRitual,
                isSynchro: isSynchro,
                isXyz: isXyz,
                isPendulum: isPendulum,
                isLink: isLink,
                isFlip: isFlip,
                isGemini: isGemini,
                isSpirit: isSpirit,
                isToon: isToon,
                isTuner: isTuner,
                isUnion: isUnion,
                color: isNormal ? 'yellow' :
                    category === 'Spell' ? 'green' : 
                    category === 'Trap' ? 'violet' : 
                    isLink ? 'dark-blue' :
                    isPendulum && isEffect ? 'orange-green' :
                    isPendulum && !isEffect ? 'yellow-green' :
                    isXyz ? 'black' :
                    isSynchro ? 'white' :
                    isRitual ? 'light-blue' :
                    isFusion ? 'purple' :
                    'orange',
                isExtraDeck: isFusion || isSynchro || isXyz || isLink,
                sortPriority: isNormal ? 1 :
                    category === 'Spell' ? 11 : 
                    category === 'Trap' ? 10 : 
                    isLink ? 9 :
                    isPendulum && isEffect ? 4 :
                    isPendulum && !isEffect ? 2 :
                    isXyz ? 8 :
                    isSynchro ? 7 :
                    isRitual ? 5 :
                    isFusion ? 6 :
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
                    value={name || ''}
                    type="text"
                    onChange={(e) => setName(e.target.value)}
                />
            </label>
            <label>Konami Code:
                <input
                    id="konamiCode"
                    value={konamiCode || ''}
                    type="text"
                    onChange={(e) => setKonamiCode(e.target.value)}
                />
            </label>
            <label>TCG Date:
                <input
                    id="tcgDate"
                    value={tcgDate || ''}
                    type="text"
                    onChange={(e) => setTCGDate(e.target.value)}
                />
            </label>
            <label>OCG Date:
                <input
                    id="ocgDate"
                    value={ocgDate || ''}
                    type="text"
                    onChange={(e) => setOCGDate(e.target.value)}
                />
            </label>
            <label>Description:
                <input
                    id="description"
                    value={description || ''}
                    type="text"
                    onChange={(e) => setDescription(e.target.value)}
                />
            </label>
            <select
                id="category"
                value={category}
                style={{width: '200px'}}
                onChange={(e) => setCategory(e.target.value || null)}
            >
                <option value="">Category</option>
                <option value="Monster">Monster</option>
                <option value="Spell">Spell</option>
                <option value="Trap">Trap</option>
            </select>
            <select
                id="icon"
                value={icon}
                style={{width: '200px'}}
                onChange={(e) => setIcon(e.target.value || null)}
            >
                <option value="">Icon</option>
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
                style={{width: '200px'}}
                onChange={(e) => setAttribute(e.target.value || null)}
            >
                <option value="">Attribute</option>
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
                style={{width: '200px'}}
                onChange={(e) => setType(e.target.value || null)}
            >
                <option value="">Type</option>
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
                    value={atk || ''}
                    type="text"
                    onChange={(e) => setATK(parseInt(e.target.value))}
                />
            </label>
            <label>DEF:
                <input
                    id="def"
                    value={def || ''}
                    type="text"
                    onChange={(e) => setDEF(parseInt(e.target.value))}
                />
            </label>
            <label>Level:
                <input
                    id="level"
                    value={level || ''}
                    type="text"
                    onChange={(e) => setLevel(parseInt(e.target.value))}
                />
            </label>
            <label>Rating:
                <input
                    id="rating"
                    value={rating || ''}
                    type="text"
                    onChange={(e) => setRating(parseInt(e.target.value))}
                />
            </label>
            <label>Scale:
                <input
                    id="scale"
                    value={scale || ''}
                    type="text"
                    onChange={(e) => setScale(parseInt(e.target.value))}
                />
            </label>
            <label>Arrows:
                <input
                    id="arrows"
                    value={arrows || ''}
                    type="text"
                    onChange={(e) => setArrows(e.target.value)}
                />
            </label>
            <label>Normal:
                <select
                    id="normal"
                    value={isNormal}
                    onChange={(e) => setIsNormal(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Effect:
                <select
                    id="effect"
                    value={isEffect}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsEffect(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Fusion:
                <select
                    id="fusion"
                    value={isFusion}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsFusion(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Ritual:
                <select
                    id="ritual"
                    value={isRitual}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsRitual(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Synchro:
                <select
                    id="synchro"
                    value={isSynchro}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsPendulumSynchro(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Xyz:
                <select
                    id="xyz"
                    value={isXyz}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsXyz(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Pendulum:
                <select
                    id="isPendulum"
                    value={isPendulum}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsPendulum(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Link:
                <select
                    id="link"
                    value={isLink}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsLink(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Flip:
                <select
                    id="flip"
                    value={isFlip}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsFlip(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Gemini:
                <select
                    id="gemini"
                    value={isGemini}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsGemini(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Spirit:
                <select
                    id="spirit"
                    value={isSpirit}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsSpirit(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Toon:
                <select
                    id="toon"
                    value={isToon}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsToon(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Tuner:
                <select
                    id="tuner"
                    value={isTuner}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsTuner(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Union:
                <select
                    id="union"
                    value={isUnion}
                    style={{backgroundImage: 'none'}}
                    onChange={(e) => setIsUnion(e.target.value)}
                >
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            </label>
            <label>Image:
                <input
                    id="image"
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