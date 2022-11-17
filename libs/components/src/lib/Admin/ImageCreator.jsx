
import React, { useState } from 'react'
import axios from 'axios'

const ImageCreator = () => {
    const [image, setImage] = useState(null)
    const [fileName, setFileName] = useState(null)
    const [folder, setFolder] = useState(null)

    //RESET
    const reset = async () => {
        setImage(null)
        setFileName(null)
        setFolder(null)
        document.getElementById('image').value = null
        document.getElementById('file-name').value = null
        document.getElementById('folder').value = null
    }

    //CREATE IMAGE
    const createImage = async () => {
        if (!image) return alert('Please upload an Image file.')
        if (!fileName) return alert('Please specify a File Name.')
        if (!folder) return alert('Please select a Folder.')
        try {
            const {data} = await axios.post('/api/images/create', {
                image: image,
                fileName: fileName,
                folder: folder
            })

            if (data.success) alert(`Success! New Image: /images/${folder}/${fileName}`)
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
            <label>
                Folder:
                <select
                    id="folder"
                    className="login"
                    onChange={(e) => setFolder(e.target.value)}
                >
                    <option value={null}></option>
                    <option value="artworks">Artworks</option>
                    <option value="brackets">Brackets</option>
                    <option value="cards">Cards</option>
                    <option value="emojis">Emojis</option>
                    <option value="logos">Logos</option>
                    <option value="pfps">PFPs</option>
                </select>
            </label>
            <label>Image:
                <input
                    id="image"
                    className="login"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        setFileName(e.target.value.replace('C:\\fakepath\\', ''))
                        readImage(e.target.files[0])}
                    }
                />
            </label>
            <label>File Name:
                <input
                    id="file-name"
                    className="login"
                    value={fileName || ''}
                    type="text"
                    onChange={(e) => setFileName(e.target.value)}
                />
            </label>
            <a
                className="admin-button"
                type="submit"
                onClick={() => createImage()}
            >
                Submit
            </a>
        </div>
    )
}

export default ImageCreator