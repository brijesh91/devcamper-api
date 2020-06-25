const express = require('express')
const { getBootcamps, getBootcamp, createBootcamp, updateBootcamp, deleteBootcamp, getBootcampInRadius, bootcampPhotoUpload } = require('../controllers/bootcamps')
const Bootcamp = require('../models/Bootcamp')


// Include middleware other resource routers
const courseRouter = require('./courses')
const reviewRouter = require('./reviews')
const authRouter = require('./auth')


const router = express.Router()

const advancedResults = require('../middleware/advancedResults')
const { protect, authorize } = require('../middleware/auth')

// Re-route into other resource routers
router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)
router.use('/:bootcampId/join', authRouter)


// This is done to separate logic from router file, it is a neat way
//When route is /api/v1/bootcamps
router
    .route('/radius/:zipcode/:distance')
    .get(getBootcampInRadius)

//When route is /api/v1/bootcamps
router
    .route('/')
    .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
    .post(protect, authorize('publisher', 'admin'), createBootcamp)

//When route is /api/v1/bootcamps/:id
router
    .route('/:id')
    .get(getBootcamp)
    .put(protect, authorize('publisher', 'admin'), updateBootcamp)
    .delete(protect, authorize('publisher', 'admin'), deleteBootcamp)

//When route is /api/v1/bootcamps/:id/photo
router
    .route('/:id/photo')
    .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload)

// Above method is used instead of below method
// router.get('/', (req, res) => {
// res.status(200).json({ success: true, msg: 'Show all bootcamps' })
// })

module.exports = router
