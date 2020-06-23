// Middleware used to fetch advanced results, apply pagination, sort and select(filter) functionality
// below function in passed to the routes with model and populate data

const advancedResults = (model, populate) => async (req, res, next) => {
    let query

    // Copy req.query
    const reqQuery = { ...req.query }

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit']

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param])

    // Converting query string to string for using replace() in some cases
    let queryStr = JSON.stringify(reqQuery)

    //Using RegExp to find a match and replace it, using word boundry in RegExp
    // Create operators ($gt,$gte etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)

    // As we are using strigify, we need to convert it again to the object
    // Using the query passed in URL and fetching only corresponding results
    // Using reverse populate method, used mongoose virtual
    query = model.find(JSON.parse(queryStr))

    // Select fields
    // Split method splits the value present in URL based on the filter provided-here it is comma and save them in array
    // Join method creates a space separated value of the values present in array
    // Select method is used to select the fields provided in URL
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ')
        query = query.select(fields)
    }

    // Sort
    // Same as select functionality we need to use split and join method as there can be multiple filter
    // By default it is based on time in desc order
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ')
        query = query.sort(sortBy)
    } else {
        query = query.sort('-createdAt')                    // '-' suggests desc
    }

    // So we are building our query from the start of this function and passing it below

    // Pagination
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 25
    const startIndex = (page - 1) * limit               // startIndex store the count of documents, used to skip documents and used for prev link
    const endIndex = page * limit                       // endIndex also store the count of documents, used for next link
    const total = await model.countDocuments()       // total count of documents, used for links       

    query = query.skip(startIndex).limit(limit)

    // If populate data is passed then populate results with that
    if (populate) {
        query = query.populate(populate)
    }

    // Executing query
    const results = await query

    // Pagination result
    const pagination = {}

    console.log('startIndex', startIndex)
    console.log('endIndex', endIndex)
    console.log('total', total)

    // const u = JSON.stringify(req.baseUrl).replace(/\"/g, '')

    // let link = `${req.hostname}:${process.env.PORT}${u}?page=${page + 1}`

    // if next page exists and not on the last page
    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            // link: `${req.hostname}:${process.env.PORT}${u}?page=${page + 1}`,
            limit
        }
    }

    // if prev page exists and not on the first page
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            // link: `${req.hostname}:${process.env.PORT}${u}?page=${page - 1}`,
            limit
        }
    }

    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }

    next()
}

module.exports = advancedResults