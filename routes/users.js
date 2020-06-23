const express = require('express')

const router = express.Router()
const User = require('../models/User');
const { getUsers, getUser, addUser, updateUser, deleteUser } = require('../controllers/users')

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');


// Below use method runs everytime when any of the routes are accessed, so it auto applies the protect and authorize to them
router.use(protect)
router.use(authorize('admin'))

// When route is /api/v1/users
router
    .route('/')
    .get(advancedResults(User), getUsers)
    .post(addUser)

// When route is /api/v1/users/:id
router
    .route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser)

module.exports = router