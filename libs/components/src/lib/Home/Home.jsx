
import axios from 'axios'
import { useState, useEffect, useLayoutEffect } from 'react'
import { BlogPost } from './BlogPost'
import { Pagination } from '../General/Pagination'
import { useLocation } from 'react-router-dom'
import './Home.css'
let n = 0

// HOME
export const Home = () => {
    const [page, setPage] = useState(1)
    const [count, setCount] = useState(0)
    const [blogPosts, setBlogPosts] = useState([])
    const location = useLocation()
    n++
    console.log('Home render count', n)

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, document.getElementById('blog')?.offsetTop || 0), [page])

    // USE EFFECT
    useEffect(() => {
        if (location.state?.page) setPage(location.state.page)
    }, [location.state])

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data: count} = await axios.get(`/api/blogposts/count`)
            const {data: blogposts} = await axios.get(`/api/blogposts?page=${page}`)
            setCount(count)
            setBlogPosts(blogposts)
        }
  
        fetchData()
    }, [page])
  
    if (!blogPosts?.length) return <div style={{height: '100vh'}}/>
  
    return (
        <div id="blog">
        {/* Default Gaming Playlist */}
            <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"/>
            {
                blogPosts.map((bp, index) => {
                return (
                    <BlogPost 
                        key={`blog-${index}`} 
                        index={index}
                        id={bp.id} 
                        blogpost={bp}
                    />)
                })
            }
            <div className="pagination">
                <Pagination
                    setPage={setPage}
                    itemCount={count}
                    page={page}
                    itemsPerPage={10}
                />
            </div>
        </div>
    )
}
