
import { useState, useEffect, useLayoutEffect } from 'react'
import axios from 'axios'
import { BlogPost } from './BlogPost'
import { Pagination } from '../General/Pagination'

export const Home = () => {
    console.log('Hello World')
    const [page, setPage] = useState(1)
    const [count, setCount] = useState(0)
    const [blogPosts, setBlogPosts] = useState([])
    
    // GO TO PAGE
    const goToPage = (num) => {
      setPage(num)
      window.scrollTo(0, 0)
    }
  
    // PREVIOUS PAGE
    const previousPage = () => {
      if (page <= 1) return
      setPage(page - 1)
      window.scrollTo(0, 0)
    }
  
    // NEXT PAGE
    const nextPage = () => {
      if (page >= Math.ceil(count / 10)) return
      setPage(page + 1)
      window.scrollTo(0, 0)  
    }
  
    // USE LAYOUT EFFECT
    useLayoutEffect(() => window.scrollTo(0, 0))
  
    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
          const {data} = await axios.get(`/api/blogposts?page=${page}`)
          setBlogPosts(data)
        } 
  
        fetchData()
      }, [page])
  
    // USE EFFECT
    useEffect(() => {
        const fetchData = async () => {
          const {data} = await axios.get(`/api/blogposts/count`)
          setCount(data)
        } 
  
        fetchData()
      }, [])
  
    if (!blogPosts.length) return <div/>
  
    return (
        <div className="blog">
          {
            blogPosts.map((bp, index) => {
              return (
                  <BlogPost 
                        key={bp.title} 
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
          <div className="paginationWrapper">
            <div className="pagination">
              <Pagination
                location="bottom"
                nextPage={nextPage}
                previousPage={previousPage}
                goToPage={goToPage}
                length={count}
                page={page}
                itemsPerPage={10}
              />
            </div>
          </div>
        </div>
    )
}
