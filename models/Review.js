const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a title for the review']
    },
    text: {
        type: String,
        required: [true, 'Please add some text'],
        maxlength: 500,

    },
    rating: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, 'Please add a rating between 1 and 10']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    bootcamp: {                                                 // Foreign key concept, ref property suggest a model it is related to
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
})

// Prevent user from submitting more than one review per bootcamp
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true })

// Statics is directly called on a model
// However a method is called on a query results

ReviewSchema.statics.getAverageRating = async function (bootcampId) {

    // below returns the array of object having fields mentioned in $group
    // aggregate function requires a pipeline like below
    const obj = await this.aggregate([
        {
            $match: { bootcamp: bootcampId }
        },
        {
            $group: {
                _id: '$bootcamp',
                averageRating: { $avg: '$rating' }
            }
        }
    ])

    try {
        if (obj.length === 0) {
            return await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
                averageRating: 0                                        // Should be set to 0 if no reviews present
            })
        }
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageRating: obj[0].averageRating                          // Should return only integer values
        })
    } catch (err) {
        console.error(err)
    }
}



// Call getAverageRating after save
// As we are using statics method, we need to call it on model that's why we used this.constructor
ReviewSchema.post('save', function () {
    this.constructor.getAverageRating(this.bootcamp)
})


// Call getAverageRating before remove
ReviewSchema.pre('remove', function () {
    this.constructor.getAverageRating(this.bootcamp)
})


module.exports = mongoose.model('Review', ReviewSchema)
