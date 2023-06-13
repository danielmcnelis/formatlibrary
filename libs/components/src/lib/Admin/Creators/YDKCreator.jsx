
import { useState, useEffect } from 'react'
import axios from 'axios'

export const YDKCreator = () => {
    const [text, setText] = useState('')
    const [ydk, setYDK] = useState('')
    const [errors, setErrors] = useState([])
    const [fileName, setFileName] = useState('converted-text.ydk')
    const file = new Blob([ydk], {type: 'text/plain'})

    // USE EFFECT
    useEffect(() => {
        if (errors.length) alert(`Check for typos:\n${errors.join('\n')}`)
    }, [errors])

    // USE EFFECT
    useEffect(() => {
        const convertToYdk = async () => {
            const { data } = await axios.post(`/api/decks/text-to-ydk/`, {
                headers: {
                    text: text
                }
            })
    
            setYDK(data.ydk)
            setErrors(data.errors)
            if (data.fileName) setFileName(data.fileName)
        }

        convertToYdk()
    }, [text])

    return (
        <div className="admin-portal">
            <label>Text:</label>
            <textarea
                id="text"
                onChange={(e) => { setText(e.target.value)}}
            />
            <label>YDK:</label>
            <textarea
                    id="ydk"
                    value={ydk}
            />
            <a
                href={URL.createObjectURL(file)} 
                download={fileName}
            >                                    
                <div className="ydk-download-button">
                    <b style={{padding: '0px 6px'}}>Download</b>
                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/download.png`} alt="floppy-disk"/>
                </div>
            </a>
        </div>
    )
}
