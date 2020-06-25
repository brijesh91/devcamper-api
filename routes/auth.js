const express = require('express')

const router = express.Router({ mergeParams: true })
const { register, login, getMe, updateDetails, forgotPassword, resetPassword, updatePassword, logout, joinBootcamp } = require('../controllers/auth')

const { protect, authorize } = require('../middleware/auth')

router
    .route('/')
    .put(protect, authorize('user'), joinBootcamp)

router.post('/register', register)

router.post('/login', login)

router.get('/logout', logout)

router.get('/me', protect, getMe)

router.put('/updatedetails', protect, updateDetails)

router.put('/updatepassword', protect, updatePassword)

router.post('/forgotpassword', forgotPassword)

router.put('/resetpassword/:resettoken', resetPassword)


module.exports = router