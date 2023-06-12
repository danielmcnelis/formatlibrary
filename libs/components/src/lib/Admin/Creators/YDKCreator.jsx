
import { useState, useEffect } from 'react'
import { Card } from '@fl/models'
import { Op } from 'sequelize'

export const YDKCreator = () => {
    const [text, setText] = useState(null)
    const [ydk, setYDK] = useState(null)

    const convertTextToYDK = async (text) => {
        const arr = text.replace(/^\s*[\n]/gm, '').split('\n')
        let ydk = ''

        for (let i = 0; i < arr.length; i++) {
            const line = arr[i].toLowerCase().trim()
            const card = await Card.findOne({
                where: {
                    name: {[Op.iLike]: line}
                }
            })

            if (card) { 
                ydk += `${card.konamiCode}\n`
            } else if (
                line.includes('monster') || 
                line.includes('magic') || 
                line.includes('spell') ||
                line.includes('trap')
            ) {
                continue
            } else if (line === 'side' || line === 'side deck') {
                ydk += '!side\n'
            } else if (line === 'fusion' || line === 'fusion deck' || line === 'extra' || line === 'extra deck') {
                ydk += '#extra\n'
            }
        }

        return ydk
    }

    // USE EFFECT
    useEffect(() => {
        setYDK(convertTextToYDK(text))
    }, [text])

    return (
        <div className="admin-portal">
            <label>Text:
                <input
                    id="text"
                    onKeyDown={(e) => { setText(e.target.value)}}
                />
            </label>
            <label>YDK:
                <input
                    id="ydk"
                    placeholder={ydk}
                />
            </label>
            <a
                className="link desktop-only"
                href={ydk} 
                download={`converted-text.ydk`}
            >                                    
                <div className="deck-button">
                    <b style={{padding: '0px 6px'}}>Download</b>
                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/download.png`} alt="floppy-disk"/>
                </div>
            </a>
        </div>
    )
}
