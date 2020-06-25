const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const Bootcamp = require('../models/Bootcamp')
const Review = require('../models/Review')


// @desc        Get reviews
// @route       GET /api/v1/reviews
// @route       GET /api/v1/bootcamps/:bootId/reviews
// @access      Public

exports.getReviews = asyncHandler(async (req, res, next) => {

    if (req.params.bootcampId) {
        const reviews = await Review.find({ bootcamp: req.params.bootcampId })

        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        })
    } else {
        res.status(200).json(res.advancedResults)
    }
})

// @desc        Get single review
// @route       GET /api/v1/review
// @access      Public

exports.getReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    })

    if (!review) {
        return next(new ErrorResponse(`No review found with the id of ${req.params.id}`, 404))
    }

    res.status(200).json({
        success: true,
        data: review
    })
})

// @desc        Add a review
// @route       POST /api/v1/bootcamps/:bootcampId/reviews
// @access      Private

exports.addReview = asyncHandler(async (req, res, next) => {

    req.body.bootcamp = req.params.bootcampId
    req.body.user = req.user.id

    const bootcamp = await Bootcamp.findById(req.params.bootcampId)

    if (!bootcamp) {
        return next(new ErrorResponse(`No bootcamp found with id of ${req.params.bootcampId}`, 404))
    }

    if (!bootcamp.joinedUsers.includes(req.user.id)) {
        return next(new ErrorResponse(`Cannot add review with user id of ${req.user.id}`, 400))
    }

    const review = await Review.create(req.body)

    res.status(200).json({
        success: true,
        data: review
    })
})

// @desc        Update review
// @route       PUT /api/v1/reviews/:id
// @access      Private

exports.updateReview = asyncHandler(async (req, res, next) => {

    let review = await Review.findById(req.params.id)

    if (!review) {
        return next(new ErrorResponse(`No review with the id of ${req.params.id}`))
    }

    // Make sure review belong to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorized to update the review ${req.params.id}`, 401))
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    // Make sure ratings are updated in bootcamp
    await review.save()

    res.status(200).json({
        success: true,
        data: review
    })
})

// @desc        Delete review
// @route       Delete /api/v1/reviews/:id
// @access      Private

exports.deleteReview = asyncHandler(async (req, res, next) => {

    let review = await Review.findById(req.params.id)

    if (!review) {
        return next(new ErrorResponse(`No review with the id of ${req.params.id}`))
    }

    // Make sure review belong to user or user is admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorized to update the review ${req.params.id}`, 401))
    }

    // Make sure ratings are updated
    await review.remove()

    res.status(200).json({
        success: true,
        data: {}
    })
})