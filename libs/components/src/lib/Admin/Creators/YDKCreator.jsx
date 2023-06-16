
import { useState, useEffect } from 'react'
import axios from 'axios'

export const YDKCreator = () => {
    const [text, setText] = useState('')
    const [ydk, setYDK] = useState('')
    const [processing, setProcessing] = useState(false)
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
            setProcessing(true)
            const { data } = await axios.post(`/api/decks/text-to-ydk/`, {
                headers: {
                    text: text
                }
            })
    
            setYDK(data.ydk)
            setErrors(data.errors)
            setProcessing(false)
            if (data.fileName) setFileName(data.fileName)
        }

        const timeOutId = setTimeout(() => convertToYdk(), 300)
        return () => clearTimeout(timeOutId)
    }, [text])

    return (
        <div className="admin-portal">
            <label>Text:</label>
            <textarea
                id="text"
                onChange={(e) => { setText(e.target.value)}}
                value={text}
            />

            <label>YDK: {processing ? <i style={{color: '#CBC5C3'}}> processing...</i> : ''}</label>
            <textarea
                    id="ydk"
                    value={ydk}
            />

            <div className="button-panel">
                <a
                    href={URL.createObjectURL(file)} 
                    download={fileName}
                >                                    
                    <div className="ydk-button">
                        <b style={{padding: '0px 6px'}}>Download</b>
                        <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/download.png`} alt="floppy-disk"/>
                    </div>
                </a>

                <div className="ydk-button" onClick={() => setText('')}>                                    
                    <b style={{padding: '0px 6px'}}>Clear Text</b>
                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/erase.png`} alt="sweeping broom"/> 
                </div>
            </div>
        </div>
    )
}
