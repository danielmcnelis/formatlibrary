
import './Pagination.css'

// PAGINATION
export const Pagination = (props) => {
    const { itemCount = 0, itemsPerPage = 10, page = 1, setPage } = props
    const totalPages = Math.ceil(itemCount / itemsPerPage)
    if (!itemCount || itemCount <= itemsPerPage || !setPage) return <div/>

    return (
      <div>
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
        {
          totalPages > 3 && (page - 3) > 0 ? (
            <div
              className="page-button"
              type="submit"
              onClick={() => setPage(page - 3)}
            >
              {page - 3}
            </div>
          ) : ''
        }
        {
          totalPages > 2 && (page - 2) > 0 ? (
            <div
              className="page-button"
              type="submit"
              onClick={() => setPage(page - 2)}
            >
              {page - 2}
            </div>
          ) : ''
        }
        {
          totalPages > 1 && (page - 1) > 0 ? (
            <div
              className="page-button"
              type="submit"
              onClick={() => setPage(page - 1)}
            >
              {page - 1}
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
          (page + 1) <= totalPages ? (
            <div
              className="page-button"
              type="submit"
              onClick={() => setPage(page + 1)}
            >
              {page + 1}
            </div>
          ) : ''
        }
        {
          (page + 2) <= totalPages ? (
            <div
              className="page-button"
              type="submit"
              onClick={() => setPage(page + 2)}
            >
              {page + 2}
            </div>
          ) : ''
        }
        {
          (page + 3) <= totalPages ? (
            <div
              className="page-button"
              type="submit"
              onClick={() => setPage(page + 3)}
            >
              {page + 3}
            </div>
          ) : ''
        }
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
