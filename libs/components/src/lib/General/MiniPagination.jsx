
import './MiniPagination.css'

export const MiniPagination = (props) => {
  const { length = 0, itemsPerPage = 12, location = 'top', page = 1 } = props
  const totalPages = Math.ceil(length / itemsPerPage)
  if (!length || length <= itemsPerPage) return <div></div>

  return (
    <div style={{marginTop: '5px', display: 'flex', justifyContent: 'center'}}>
      {
        page > 2 ? (
          <a
            className="pageButton"
            id="to-start"
            type="submit"
            onClick={() => {
              props.goToPage(1, location)
            }}
          />
        ) : ''
      }
      {
        page > 1 ? (
          <a
            className="pageButton"
            type="submit"
            onClick={() => {
              props.previousPage(location)
            }}
          >
            ◀
          </a>
        ) : ''
      }
      <a
        className="pageButton"
        type="submit"
        style={{
          backgroundColor: '#c7ccd4',
          color: 'black',
          fontWeight: 'bold'
        }}
      >
        {page}
      </a>
      {
        page < totalPages ? (
          <a
            className="pageButton"
            type="submit"
            onClick={() => {
              props.nextPage(location)
            }}
          >
            ▶
          </a>
        ) : ''
      }
      {
        (page + 1) < totalPages ? (
          <a
            className="pageButton"
            id="to-end"
            type="submit"
            onClick={() => {
              props.goToPage(totalPages, location)
            }}
          />
        ) : ''
      }
    </div>
  )
}