
import { useMediaQuery } from 'react-responsive'
import { BlogPostContent } from './BlogPostContent'
import './BlogPost.css'

// BLOGPOST
export const BlogPost = (props) => {
    const isMobile = useMediaQuery({ query: '(max-width: 1000px)' })
    
    if (isMobile) {
        return (
            <div className="blogpost">
                <BlogPostContent blogpost={props.blogpost}/>
                <div className="blog-divider"/>
            </div>
        )
    } else {
        return (
            <>
                <div className="blogpost">
                    <div className="content">
                        <BlogPostContent blogpost={props.blogpost}/>
                    </div>
                    {
                        props.index === 0 ? (
                            <div className="ads">
                                <a 
                                    href="https://discord.com/invite/formatlibrary" 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id="discord"
                                    className="black-text hover-green"
                                >
                                <div>
                                    <img 
                                        src="https://cdn.formatlibrary.com/images/logos/Discord.webp" 
                                        alt="Discord" 
                                    />
                                    <p className="ad-description">Join our Discord server!</p>
                                </div>
                                </a>
                                <a 
                                    href="https://www.buymeacoffee.com/danielmcnelis" 
                                    target="_blank"
                                    rel="noreferrer"
                                    id="buymeacoffee"
                                    className="black-text hover-green"
                                >
                                <img 
                                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                                    alt="Buy Me A Coffee" 
                                />
                                <p className="ad-description">Small donations support our work!</p>
                                </a>
                                <a 
                                    href="https://tcgplayer.pxf.io/XYZQm5" 
                                    target="_blank"
                                    rel="noreferrer"
                                    id="tcgplayer"
                                    className="black-text hover-green"
                                >
                                    <img 
                                        src="https://cdn.formatlibrary.com/images/logos/TCGPlayer.webp" 
                                        alt="TCG Player" 
                                    />
                                    <p className="ad-description">Shop to support FormatLibrary.com!</p>
                                </a>
                            </div>
                        ) : <div/>
                    }
                </div>
                <div className="blog-divider"/>
            </>
        )
    }
  
}
