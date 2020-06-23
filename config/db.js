//This file is used to connect to db
// connect method returns a promise which is handled in server.js file
const mongoose = require('mongoose')

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })

    console.log(`MongoDB Connected: ${conn.connection.host}`.magenta);
}

module.exports = connectDB