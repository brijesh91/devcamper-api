// @desc Logs request to console
// middleware used to log req to console, it has a access to req and res cycle, we can append data/var on the req object
// runs before the response is served
// can be used in server.js file, currently not used

const logger = (req, res, next) => {
    console.log(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`)
    next()
}

module.exports = logger