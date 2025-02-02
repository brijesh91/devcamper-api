const crypto = require('crypto')
const User = require('../models/User')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const sendEmail = require('../utils/email')

// @desc        Register user
// @route       POST /api/v1/auth/register
// @access      Public

exports.register = asyncHandler(async (req, res, next) => {

    const { name, email, password, role } = req.body

    const user = await User.create({
        name,
        email,
        password,
        role
    })

    // methods executed on user instance

    sendTokenResponse(user, 200, res)

})

// @desc        Login user
// @route       POST /api/v1/auth/login
// @access      Public

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body

    // Validate email & password
    if (!email || !password) {
        return next(new ErrorResponse('Please provide both email and password', 400))
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorResponse('Invalid Credentials', 401))
    }

    // Check if password match with the hashed password
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
        return next(new ErrorResponse('Invalid Credentials', 401))
    }

    sendTokenResponse(user, 200, res)

})

// @desc        Log user out
// @route       POST /api/v1/auth/me
// @access      Private

exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })

    res.status(200).json({ success: true, data: {} })

})

// @desc        Get logged in user
// @route       POST /api/v1/auth/me
// @access      Private

exports.getMe = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id)

    res.status(200).json({ success: true, data: user })

})

// @desc        Update user details
// @route       PUT /api/v1/auth/updatedetails
// @access      Private

exports.updateDetails = asyncHandler(async (req, res, next) => {

    const fieldsToUpdate = {
        name: req.body.name,                   //|| req.user.name  // If not provided throws error,
        email: req.body.email                  //|| req.user.email
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    })

    await user.save()

    res.status(200).json({ success: true, data: user })

})

// @desc        Update password
// @route       PUT /api/v1/auth/updatepassword
// @access      Private

exports.updatePassword = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.user.id).select('+password')

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse('Password is incorrect', 401))
    }

    user.password = req.body.newPassword
    await user.save()

    sendTokenResponse(user, 200, res)
})


// @desc        Forgot password
// @route       POST /api/v1/auth/forgotpassword
// @access      Public

exports.forgotPassword = asyncHandler(async (req, res, next) => {

    const user = await User.findOne({ email: req.body.email })

    if (!user) {
        return next(new ErrorResponse('User with that email does not exists.', 404))
    }

    const resetToken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`
    const subject = `DevCamper Password reset for user - ${user.id}`
    const message = `Dear ${user.name}, \n\n You (or someone else has) requested a password reset for your account.\n\n Please make PUT request at ${resetUrl} to change the password.`

    try {
        sendEmail(req.body.email, subject, message)
        res.status(200).json({
            success: true,
            data: 'Email sent'
        })
    } catch (err) {
        console.log(err)
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        await user.save({ validateBeforeSave: false })
        return next(new ErrorResponse('Email could not be sent', 500))
    }
})

// @desc        Reset password
// @route       PUT /api/v1/auth/resetpassword/:resettoken
// @access      Public 

exports.resetPassword = asyncHandler(async (req, res, next) => {

    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex')

    const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } })

    if (!user) {
        return next(new ErrorResponse('Invalid token', 400))
    }

    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    sendTokenResponse(user, 200, res)
})

// @desc        Join bootcamp
// @route       PUT /api/v1/bootcamps/:bootcampId/join
// @access      Private

exports.joinBootcamp = asyncHandler(async (req, res, next) => {

    console.log(req.params)

    let bootcamp = await Bootcamp.findById(req.params.bootcampId)

    if (!bootcamp) {
        return next(new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`, 404))
    }

    let user = req.user
    let joinedUsers = bootcamp.joinedUsers
    let joinedBootcamp = user.joinedBootcamp

    if (joinedUsers.includes(req.user.id) && joinedBootcamp.includes(req.params.bootcampId)) {
        return next(new ErrorResponse(`User ${req.user.id} has already joined Bootcamp ${req.params.bootcampId}`, 400))
    }

    joinedUsers.push(req.user.id)
    joinedBootcamp.push(req.params.bootcampId)

    await bootcamp.save({ validateBeforeSave: false })
    await user.save({ validateBeforeSave: false })

    res.status(200).json({
        success: true,
        data: bootcamp
    })

})


// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {

    // Create token
    const token = user.getSignedJwtToken()

    // Calculating 30 days from current time
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }

    if (process.env.NODE_ENV === 'production') {
        options.secure = true
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        })
}
