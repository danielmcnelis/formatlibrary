
import axios from 'axios'
import { useState, useEffect, useLayoutEffect } from 'react'
import { BlogPost } from './BlogPost'
import { Pagination } from '../General/Pagination'
import { useLocation } from 'react-router-dom'
import './Home.css'

// HOME
export const Home = () => {
    const [page, setPage] = useState(1)
    const [count, setCount] = useState(0)
    const [blogPosts, setBlogPosts] = useState([])
    const location = useLocation()
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0, []))

    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, document.getElementById('blog')?.offsetTop), [page])
  
    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
            const {data} = await axios.get(`/api/blogposts/count`)
            setCount(data)
        } 
        
        fetchData()
    }, [])

    // USE EFFECT
    useEffect(() => {
        if (location.state) setPage(location.state.page)
    }, [location.state])

    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
          const {data} = await axios.get(`/api/blogposts?page=${page}`)
          setBlogPosts(data)
        } 
  
        fetchData()
    }, [page])
  
    if (!blogPosts?.length) return <div/>
  
    return (
        <div className="blog" id="blog">
        {/* Default Gaming Playlist */}
        <div className="adthrive-content-specific-playlist" data-playlist-id="1TIGVxvL"></div>
            {
                blogPosts.map((bp, index) => {
                return (
                    <BlogPost 
                        key={`blog-${index}`} 
                        index={index}
                        id={bp.id} 
                        title={bp.title} 
                        content={bp.content}
                        images={bp.images}
                        components={bp.components}
                        format={bp.format}
                        views={bp.views}
                        rating={bp.rating}
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
