
export const Pagination = (props) => {
    const { length = 0, itemsPerPage = 12, location = 'top', page = 1 } = props
    const totalPages = Math.ceil(length / itemsPerPage)
    if (!length || length <= itemsPerPage) return <div></div>
  
    return (
      <div>
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
        {
          totalPages > 3 && (page - 3) > 0 ? (
            <a
              className="pageButton"
              id="to-minus-3"
              type="submit"
              onClick={() => {
                props.goToPage(
                  page - 3,
                  location
                )
              }}
            >
              {page - 3}
            </a>
          ) : ''
        }
        {
          totalPages > 2 && (page - 2) > 0 ? (
            <a
              className="pageButton"
              type="submit"
              onClick={() => {
                props.goToPage(
                  page - 2,
                  location
                )
              }}
            >
              {page - 2}
            </a>
          ) : ''
        }
        {
          totalPages > 1 && (page - 1) > 0 ? (
            <a
              className="pageButton"
              type="submit"
              onClick={() => {
                props.goToPage(
                  page - 1,
                  location
                )
              }}
            >
              {page - 1}
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
          (page + 1) <= totalPages ? (
            <a
              className="pageButton"
              type="submit"
              onClick={() => {
                props.goToPage(
                  page + 1,
                  location
                )
              }}
            >
              {page + 1}
            </a>
          ) : ''
        }
        {
          (page + 2) <= totalPages ? (
            <a
              className="pageButton"
              type="submit"
              onClick={() => {
                props.goToPage(
                  page + 2,
                  location
                )
              }}
            >
              {page + 2}
            </a>
          ) : ''
        }
        {
          (page + 3) <= totalPages ? (
            <a
              className="pageButton"
              id="to-plus-3"
              type="submit"
              onClick={() => {
                props.goToPage(
                  page + 3,
                  location
                )
              }}
            >
              {page + 3}
            </a>
          ) : ''
        }
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
