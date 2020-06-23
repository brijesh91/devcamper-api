//writing the logic for routes in this file
const path = require('path')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const geocoder = require('../utils/geocoder')
const Bootcamp = require('../models/Bootcamp')

// @desc        Get all bootcamps
// @route       GET /api/v1/bootcamps
// @access      Public

exports.getBootcamps = asyncHandler(async (req, res, next) => {                      //middleware function has access to req,res
    //Using asyncHandler function, to get rid of the trycatch blocks
    // asynchandler function takes in a function as a arg and returns a function with three input params
    // this new function is responsible to execute the original function passing the three params and catching the error
    // Changing the functionality and using middleware for fetching results
    res.status(200).json(res.advancedResults)
})

// @desc        Get a bootcamp
// @route       GET /api/v1/bootcamps/:id
// @access      Public

exports.getBootcamp = asyncHandler(async (req, res, next) => {                      //middleware function has access to req,res

    const bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {                                                    // if id is formatted correctly but not present in db then this error is thrown
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404))
    }

    res.status(200).json({ success: true, data: bootcamp })
    // } catch (error) {
    //     // res.status(400).json({ success: false })
    //     console.log('I ran');
    //     next(error)                                                     // I think this is used as error handler
    // }
})

// @desc        Create a bootcamp
// @route       POST /api/v1/bootcamps
// @access      Private

exports.createBootcamp = asyncHandler(async (req, res, next) => {                      //middleware function has access to req,res

    // Add user to the req.body
    req.body.user = req.user.id

    // Check for published bootcamp by a user
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })

    // If the user is not an admin, they can only add one bootcamp
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(new ErrorResponse(`The user with ID ${req.user.id} has already published a bootcamp`, 400))
    }

    const bootcamp = await Bootcamp.create(req.body)                        //create returns a promise that is why async-await is used
    res.status(201).json({
        success: true,
        data: bootcamp
    })
})

// @desc        Update a bootcamp
// @route       GET /api/v1/bootcamps/:id
// @access      Private

exports.updateBootcamp = asyncHandler(async (req, res, next) => {                      //middleware function has access to req,res

    // const updates = Object.keys(req.body)                                   //stores the key-value pair of request body
    // const allowedUpdates = ['name', 'housing']                             //Only allowed updates are on this keys
    // //every method checks for every element against the test,
    // //test here is that, is update part of the allowed updates
    // //if false is return by any element then take exit
    // const isValidUpdate = updates.every((update) => allowedUpdates.includes(update))

    // if (!isValidUpdate) {
    //     return res.status(400).json({ success: false, message: 'Invalid update!' })
    // }

    let bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404))
    }

    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update the bootcamp`, 401))
    }

    bootcamp = await Bootcamp.findOneAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res.status(200).json({ success: true, data: bootcamp })
})

// @desc        Delete a bootcamp
// @route       GET /api/v1/bootcamps/:id
// @access      Private

exports.deleteBootcamp = asyncHandler(async (req, res, next) => {                      //middleware function has access to req,res

    const bootcamp = await Bootcamp.findById(req.params.id)                         // Changed for middleware functionality to work

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404))
    }

    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete the bootcamp`, 401))
    }

    bootcamp.remove()

    res.status(200).json({ success: true, data: {} })
})


// @desc        Get bootcamps within a radius
// @route       GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access      Private

exports.getBootcampInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params

    // Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude
    const lng = loc[0].longitude

    // Calc radius using radians(unit of measurement for spheres)
    // Divide dist by radius of Earth
    // Earth Radius = 3,963 mi
    const radius = distance / 3963

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    })

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })

})

// @desc        Upload a photo
// @route       PUT /api/v1/bootcamps/:id/photo
// @access      Private

exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {                      //middleware function has access to req,res

    const bootcamp = await Bootcamp.findById(req.params.id)                         // Changed for middleware functionality to work

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404))
    }

    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update the bootcamp`, 401))
    }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 400))
    }

    const file = req.files.file

    // Make sure the uploaded file is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an valid image file`, 400))
    }

    // Check filesize
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload an image having size less than ${process.env.MAX_FILE_UPLOAD} bytes`, 400))
    }

    // Create custom filename
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
        if (err) {
            console.error(err)
            return next(new ErrorResponse(`Problem with file upload`, 500))
        }
    })

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })

    res.status(200).json({
        success: true,
        data: file.name
    })
})