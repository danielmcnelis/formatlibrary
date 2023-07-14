
import './MiniPagination.css'

// MINI PAGINATION
export const MiniPagination = (props) => {
  const { itemCount = 0, itemsPerPage = 10, page = 1, setPage } = props
  const totalPages = Math.ceil(itemCount / itemsPerPage)
  if (!itemCount || itemCount <= itemsPerPage || !setPage) return <div></div>

  return (
    <div className="mini-pagination">
      {
        page > 2 ? (
          <div
            className="page-button"
            id="to-start"
            type="submit"
            onClick={() => setPage(1)}
          />
        ) : ''
      }
      {
        page > 1 ? (
          <div
            className="page-button"
            type="submit"
            onClick={() => setPage(page - 1)}
          >
            ◀
          </div>
        ) : ''
      }
      <div
        className="page-button current-page"
        type="submit"
      >
        {page}
      </div>
      {
        page < totalPages ? (
          <div
            className="page-button"
            type="submit"
            onClick={() => setPage(page + 1)}
          >
            ▶
          </div>
        ) : ''
      }
      {
        (page + 1) < totalPages ? (
          <div
            className="page-button"
            id="to-end"
            type="submit"
            onClick={() => setPage(totalPages)}
          />
        ) : ''
      }
    </div>
  )
}