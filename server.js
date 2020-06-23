const path = require('path')
const express = require('express')
const dotenv = require('dotenv')                                    //dotenv helps to setup env variables for the project
const morgan = require('morgan')                                    //Custom third party logger, used for middleware
const errorHandler = require('./middleware/error')
const connectDB = require('./config/db')                            //mongoose connection file
const colors = require('colors')
const fileupload = require('express-fileupload')
const cookieParser = require('cookie-parser')                       // Used to set cookie
const mongoSanitize = require('express-mongo-sanitize')             // To prevent NoSQL Injections
const helmet = require('helmet')                                    // Set security headers
const xss = require('xss-clean')                                    // Prevent XSS attacks
const rateLimit = require('express-rate-limit')                     // Limiting the rate
const hpp = require('hpp')                                          // 
const cors = require('cors')

// Load env vars
dotenv.config({ path: './config/config.env' })
connectDB()                                                         // db connection, returns a promise

// Load route files
const bootcamps = require('./routes/bootcamps')                     //loading the bootcamp router, we will set a url value here for that route
const courses = require('./routes/courses')
const auth = require('./routes/auth')
const users = require('./routes/users')
const reviews = require('./routes/reviews')


//Create the express application
const app = express()

//body parser
app.use(express.json())                                         // its a piece of middleware included with express, it is used parse the req.body

// cookie parser
app.use(cookieParser())

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// File uploading middleware
app.use(fileupload())

// Sanitize data
app.use(mongoSanitize())

// Set security headers
app.use(helmet())

// Prevent XSS attacks
app.use(xss())

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,               // 10 mins
    max: 100                                // Allowing only max req in 10 mins
})

app.use(limiter)

// Prevent http param pollution
app.use(hpp())

// Enable CORS
app.use(cors())

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

//Mount routers
app.use('/api/v1/bootcamps', bootcamps)                         //we can mount router this way, so that in router file we do not need to write whole url
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/reviews', reviews)


app.use(errorHandler)


// app.get('/', (req, res) => {
//     res.send('Hello from express')                                      //default header is html
//     //res.status(200).json({ success: true, data: { id: 1 }})           //to send a json response we can use either send or json, we can also set status
// })


const PORT = process.env.PORT || 3000

//stored in a server var for handling promise
const server = app.listen(PORT, console.log(`Server is running in ${process.env.NODE_ENV} environment and on port ${PORT}`.blue.bold))

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red.bold)
    //close server and exit process
    server.close(() => process.exit(1))                     //we need to fail it with error and close for that 1 is mentioned
})