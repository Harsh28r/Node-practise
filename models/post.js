const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  // Add user field (reference to User model)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  
  // Add date field
  date: { type: Date, default: Date.now },
  
  // Add content field
  content: { type: String, required: true },
 
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
});

module.exports = mongoose.model('Post', postSchema);
