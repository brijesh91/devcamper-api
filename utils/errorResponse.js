class ErrorResponse extends Error {
    constructor(message, statusCode) {                         //constructor is a method, it is executed when a new object is instantiated of a class
        //Now the error class that we're extending we want to call that constructor so we can do that with super, 
        //basically using constuctor method of a Error class
        super(message)
        this.statusCode = statusCode                            //custom property created on a class
    }
}

module.exports = ErrorResponse