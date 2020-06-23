const mongoose = require('mongoose')

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a course title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    weeks: {
        type: String,
        required: [true, 'Please add number of weeks']
    },
    tuition: {
        type: Number,
        required: [true, 'Please add a tuition cost']
    },
    minimumSkill: {
        type: String,
        required: [true, 'Please add a minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    scholarshipAvailable: {
        type: Boolean,
        default: false
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

// Statics is directly called on a model
// However a method is called on a query results

CourseSchema.statics.getAverageCost = async function (bootcampId) {

    // below returns the array of object having fields mentioned in $group
    // aggregate function requires a pipeline like below
    const obj = await this.aggregate([
        {
            $match: { bootcamp: bootcampId }
        },
        {
            $group: {
                _id: '$bootcamp',
                averageCost: { $avg: '$tuition' }
            }
        }
    ])

    try {
        if (obj.length === 0) {
            console.log('I ran')
            return await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
                averageCost: 0        // Should be set to 0 if no courses present
            })
        }
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost: Math.ceil(obj[0].averageCost / 10) * 10        // Should return only integer values
        })
    } catch (err) {
        console.error(err)
    }
}



// Call getAverageCost after save
// As we are using statics method, we need to call it on model that's why we used this.constructor
CourseSchema.post('save', function () {
    this.constructor.getAverageCost(this.bootcamp)
})


// Call getAverageCost before remove
CourseSchema.pre('remove', function () {
    this.constructor.getAverageCost(this.bootcamp)
})


module.exports = mongoose.model('Course', CourseSchema)