
// TRACK VISIT
export const trackVisit = async (req, res, next) => {
    try {
        console.log('tracking?????? .')
        res.cookie('visited', Date.now(), {
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
    } catch (err) {
        console.log(err)
    }
}