const mongoose =require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/harsh");


const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    age: { type: Number, required: true },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});

module.exports = mongoose.model('user', userSchema);