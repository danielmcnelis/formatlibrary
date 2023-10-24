
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { NotFound } from '../General/NotFound'
import { getCookie, getCountry, countries, timezones } from '@fl/utils'
import {Button, Form, Modal} from 'react-bootstrap'
import { Helmet } from 'react-helmet'
import './Settings.css'

const playerId = getCookie('playerId')
const discordId = getCookie('discordId')
const discordPfp = getCookie('discordPfp')
const googlePfp = getCookie('googlePfp')  

export const Settings = () => {
  const [player, setPlayer] = useState({})
  const [detectedCountry, setDetectedCountry] = useState(null)
  const [detectedTimeZone, setDetectedTimeZone] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const togglePasswordFields = () => {
    const oldPasswordInput = document.getElementById('old-password')
    const newPasswordInput = document.getElementById('new-password')
    const confirmPasswordInput = document.getElementById('confirm-password')
    if (oldPasswordInput.type === 'password') {
        oldPasswordInput.type = 'name'
        newPasswordInput.type = 'name'
        confirmPasswordInput.type = 'name'
    } else {
        oldPasswordInput.type = 'password'
        newPasswordInput.type = 'password'
        confirmPasswordInput.type = 'password'
    }

}

    // CHANGE PASSWORD
    const changePassword = async () => {
        const oldPassword = document.getElementById('old-password').value
        const newPassword = document.getElementById('new-password').value
        const confirmPassword = document.getElementById('confirm-password').value
        if (player.hasPassword && !oldPassword) return alert('Please enter old password.')        
        if (!newPassword) return alert('Password cannot be blank.')
        if (!confirmPassword) return alert('Please confirm your password.')
        if (newPassword !== confirmPassword) return alert('Passwords do not match.')
        
        try {
            await axios.put(`/api/players/password/${playerId}`, {
                oldPassword: oldPassword,
                newPassword: newPassword
            })

            alert('Saved Password!')
            setShowPasswordModal(false)
        } catch (err) {
            console.log(err)
            if (err.response.status === 400) {
                alert('Invalid Password.')  
            } else {
                alert('Error Saving Password.')  
            }  
        }
    }

    // SAVE PROFILE
    const saveProfile = async () => {
        try {
            const {data} = await axios.put(`/api/players/update/${player?.id}`, {
                name: document.getElementById('name').value,
                duelingBook: document.getElementById('duelingbook').value,
                firstName: document.getElementById('first-name').value,
                lastName: document.getElementById('last-name').value,
                country: document.getElementById('country').value,
                timeZone: document.getElementById('time-zone').value,
                youtube: document.getElementById('youtube').value,
                twitch: document.getElementById('twitch').value,
                twitter: document.getElementById('twitter').value
            })

            setPlayer(data)
            alert('Saved Profile!')
            setShowEditModal(false)
        } catch (err) {
            console.log(err)
            if (!document.getElementById('name').value || !document.getElementById('name').value.length) {
                alert('Display Name cannot be blank.')
            } else if (document.getElementById('youtube').value && document.getElementById('youtube').value.length && !document.getElementById('youtube').value.includes('youtube.com/channel/')) {
                alert('Invalid YouTube channel link.')
            } else {
                alert('Error Saving Profile.')
            }
        }
    }

    const logOut = async () => {
        try {
            const { request } = await axios.post(`/auth/logout`)
            window.location.href = request.responseURL
        } catch (err) {
            console.log(err)
        }
    }

  // USE LAYOUT EFFECT
  useLayoutEffect(() => window.scrollTo(0, 0))

  // USE EFFECT SET PLAYER
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/api/players/${playerId}`)
        setPlayer(data)
      } catch (err) {
        console.log(err)
        setPlayer(null)
      }
    }

    fetchData()
  }, [])

  if (player === null) return <NotFound /> 
  const {id, name, firstName, lastName, discordName, discriminator, country, timeZone, youtube, twitch, twitter, duelingBook, email} = player
  const regionNames = new Intl.DisplayNames(['en'], {type: 'region'})
  if (!id) return <div/>
  return (
    <>
        <Helmet>
            <title>{`Settings - Format Library`}</title>
            <meta name="og:title" content={`Settings - Format Library`}/>    
            <meta name="description" content={`View and edit your account settings for FormatLibrary.com.`}/>    
            <meta name="og:description" content={`View and edit your account settings for FormatLibrary.com.`}/>    
        </Helmet>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css" integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossOrigin="anonymous"/>
        <link rel="stylesheet" href="/styles.css" />
        <div className="body">
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                    <Modal.Header closeButton>
                    <Modal.Title>Edit Profile:</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{width: '640px'}}>
                        <Form style={{width: '640px'}}>
                            <Form.Group className="mb-3">
                                <Form.Label>Display Name:</Form.Label>
                                <Form.Control
                                    type="name"
                                    id="name"
                                    defaultValue={name}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>DuelingBook:</Form.Label>
                                <Form.Control
                                    type="name"
                                    id="duelingbook"
                                    defaultValue={duelingBook}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>First Name:</Form.Label>
                                <Form.Control
                                    type="name"
                                    id="first-name"
                                    defaultValue={firstName}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Last Name:</Form.Label>
                                <Form.Control
                                    type="name"
                                    id="last-name"
                                    defaultValue={lastName}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Country: </Form.Label>
                                <Form.Select 
                                    id="country" 
                                    style={{width: '300px'}} 
                                    value={detectedCountry || country} 
                                    onChange={(e) => setDetectedCountry(e.target.value)}
                                >  
                                {
                                    Object.entries(countries).sort((a, b) => b[1] > a[1] ? -1 : 1).map((e) => <option key={e[0]} value={e[0]}>{e[1]}</option>)
                                }
                                </Form.Select>
                                <div className="show-cursor detect-button" onClick={() => setDetectedCountry(getCountry(Intl.DateTimeFormat().resolvedOptions().timeZone))}>Auto Detect</div>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Time Zone: </Form.Label>
                                <div className="horizontal-flex">
                                    <Form.Control
                                        id="time-zone"
                                        style={{width: '300px'}} 
                                        value={detectedTimeZone || timeZone}
                                        disabled={true}
                                    >
                                </Form.Control>
                                <div className="show-cursor detect-button" onClick={() => setDetectedTimeZone(new Date().toString().match(/([A-Z]+[+-][0-9]+.*)/)[1])}>Auto Detect</div>
                                </div>
                            </Form.Group>
                            <br/>
                            <Form.Group className="mb-3">
                                <Form.Label>YouTube:</Form.Label>
                                <Form.Control
                                    type="name"
                                    id="youtube"
                                    defaultValue={youtube}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Twitch:</Form.Label>
                                <Form.Control
                                    type="name"
                                    id="twitch"
                                    defaultValue={twitch}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Twitter:</Form.Label>
                                <Form.Control
                                    type="name"
                                    id="twitter"
                                    defaultValue={twitter}
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={() => saveProfile()}>
                        Save
                    </Button>
                    </Modal.Footer>
                </Modal>        

                <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
                    <Modal.Header closeButton>
                    <Modal.Title>Edit Password:</Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{width: '640px'}}>
                        <Form style={{width: '640px'}}>
                            <Form.Group className="mb-3">
                                <Form.Label>Old Password:</Form.Label>
                                <Form.Control
                                    type="password"
                                    id="old-password"
                                    disabled={player && !player.hasPassword}
                                    defaultValue=""
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>New Password:</Form.Label>
                                <Form.Control
                                    type="password"
                                    id="new-password"
                                    defaultValue=""
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Confirm Password:</Form.Label>
                                <Form.Control
                                    type="password"
                                    id="confirm-password"
                                    defaultValue=""
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Show Passwords: <input
                                    type="checkbox"
                                    id="show-passwords"
                                    defaultValue=""
                                    onChange={() => togglePasswordFields()}
                                /></Form.Label>
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={() => changePassword()}>
                        Save
                    </Button>
                    </Modal.Footer>
                </Modal>        

            <div className="settings-profile-flexbox">
                <div className="settings-info">
                    <div className="settings-profile-title">{name}</div>
                    <img
                        className="settings-pfp"
                        src={
                            googlePfp ? `https://lh3.googleusercontent.com/a/${googlePfp}` :
                            `https://cdn.formatlibrary.com/images/pfps/${discordId || name}.png`}
                        onError={(e) => {
                                e.target.onerror = null
                                e.target.src="https://cdn.discordapp.com/embed/avatars/1.png"
                            }
                        }
                        alt="your pfp"
                    />
                    <div className="profile-info"> 
                        <div className="profile-line"><b>Name:</b> {firstName && lastName ? `${firstName} ${lastName}` : ''}</div>
                        <div className="profile-line"><b>DuelingBook:</b> {duelingBook || ''}</div>
                        <div className="profile-line"><b>Discord:</b> {discordName && discriminator ? (<><span>{discordName}</span><span style={{ color: 'gray' }}>{discriminator ? `#${discriminator}` : ''}</span></>): 'N/A'}</div>
                        <div className="profile-line"><b>Country:</b> {country ? regionNames.of(country) : ''} {country ? <img className="country" src={`https://www.worldometers.info/img/flags/${country.toLowerCase()}-flag.gif`} alt={country + '-flag'}/> : ''}</div>
                        <div className="profile-line"><b>Time Zone:</b> {timeZone || ''}</div>
                        <div className="profile-line"><b>YouTube:</b> {youtube ? <a href={youtube} target="_blank" rel="noopener noreferrer"><img className="social-icon" src="https://cdn.formatlibrary.com/images/logos/youtube.png" alt="YouTube"/></a>: ''}</div>
                        <div className="profile-line"><b>Twitch:</b> {twitch || ''}</div>
                        <div className="profile-line"><b>Twitter:</b> {twitter || ''}</div>
                    </div>
                </div>
            </div>
            <div className="builder-bottom-panel">
                <div 
                    className="show-cursor deck-button"
                    onClick={() => setShowPasswordModal(true)}
                    style={{width: '220px', margin: '15px auto', textAlign: 'center'}}
                >
                    <b style={{padding: '0px 6px'}}>Edit Password</b>
                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/lock.png`} alt="edit"/>
                </div>
                <div 
                    className="show-cursor deck-button"
                    onClick={() => setShowEditModal(true)}
                    style={{width: '180px', margin: '15px auto', textAlign: 'center'}}
                >
                    <b style={{padding: '0px 6px'}}>Edit Profile</b>
                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/edit.png`} alt="edit"/>
                </div>
                <div 
                    className="show-cursor deck-button"
                    onClick={() => logOut()}
                    style={{width: '180px', margin: '15px auto', textAlign: 'center'}}
                >
                    <b style={{padding: '0px 6px'}}>Log Out</b>
                    <img style={{width:'28px'}} src={`https://cdn.formatlibrary.com/images/emojis/owl.png`} alt="edit"/>
                </div>
            </div>
           
        </div>
    </>
  )
}
