const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required:true
  },
  email: {
    type: String,
    trim: true,
    required:true
  },
  password: {
    type: String,
  },
  resetPasswordToken: String,
  resetPasswordExpires:Date,
  facebook:{
    id:{
      type:String
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at:{
    type:Date,
    default:Date.now
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
