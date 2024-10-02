const mongoose = require('mongoose')

mongoose.connect(`mongodb://localhost:27017/data-association`)

const userSchema = mongoose.Schema({
    userName: String,
    name: String,
    email: String,
    password: String,
    age: Number,
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'post'
    }]
})

module.exports = mongoose.model('user', userSchema);
