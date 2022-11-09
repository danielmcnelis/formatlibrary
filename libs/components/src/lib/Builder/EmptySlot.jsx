
export const EmptySlot = (props) => {
    const {width, height, margin, padding} = props
    
  return (
    <div className="EmptyImage-box">
      {
        parseInt(width, 10) < 48 ? (
          <div
            style={{width, height, margin, padding}}
            className="SmallEmptyImages"
            alt="empty-slot"
          />
        ) : (
            <div className="empty-image-cell">
                <div
                    style={{boxShadow:'0px 0px 0px 1px black inset', width, height, margin, padding}}
                    className="EmptyImages"
                    alt="empty-slot"
                />
            </div>
        )
      }
    </div>
  )
}