
import { useState } from 'react'
import axios from 'axios'
import {getCookie} from '@fl/utils'

const playerId = getCookie('playerId')
const googlePfp = getCookie('playerId')
const discordId = getCookie('playerId')
const discordPfp = getCookie('playerId')

export const PfpUploader = (props) => {
    const {player} = props
    const [image, setImage] = useState(null)
    const fileName = playerId + '.png'
    const folder = 'pfps'
    const [updated, setUpdated] = useState(false)

    //RESET
    const reset = async () => {
        setImage(null)
        document.getElementById('image').value = null
    }

    //CREATE IMAGE
    const createImage = async () => {
        setUpdated(false)
        if (!image) return alert('Please upload an image file.')
        if (!fileName) return alert('Error saving image.')
        if (!folder) return alert('Error saving image.')
        try {
            const {data} = await axios.post('/api/images/create', {
                image: image,
                fileName: fileName,
                folder: folder
            })

            if (data.success) {
                alert(`Success! New Image: /images/${folder}/${fileName}`)
                setUpdated(!!updated)
                return reset()
            }
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
        <div>
            <img
                className="settings-pfp"
                src={
                    playerId ? `https://cdn.formatlibrary.com/images/pfps/${playerId}.png` :
                    googlePfp ? `https://lh3.googleusercontent.com/a/${googlePfp}` :
                    discordPfp ? `https://cdn.discordapp.com/avatars/${discordId}/${discordPfp}.webp` :
                    discordId ? `https://cdn.formatlibrary.com/images/pfps/${discordId}.png` :
                    `https://cdn.formatlibrary.com/images/pfps/${player?.name}.png`
                }
                onError={(e) => {
                        e.target.onerror = null
                        e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                    }
                }
                alt="your pfp"
            />
            <label>Image:
                <input
                    id="image"
                    type="file"
                    accept=".png"
                    onChange={(e) => {
                        readImage(e.target.files[0])}
                    }
                />
            </label>
            <div
                className="admin-button"
                type="submit"
                onClick={() => createImage()}
            >
                Submit
            </div>
        </div>
    )
}