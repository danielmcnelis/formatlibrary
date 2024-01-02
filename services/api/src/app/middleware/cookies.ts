
// TRACK VISIT
export const trackVisit = async (req, res, next) => {
    try {
        res.cookie('visited', Date.now(), {
            maxAge: 7 * 24 * 60 * 60 * 1000
        }).send(200)
    } catch (err) {
        console.log(err)
    }
}