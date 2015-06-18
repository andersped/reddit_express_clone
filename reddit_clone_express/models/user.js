var bcrypt = require("bcrypt");
var SALT_WORK_FACTOR = 10;
var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    email: {
      type: String,
      lowercase: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
  });

userSchema.pre('save', function(next) { //a pre thing has to have things happen afterwards, making it asyncrinous, so the function then save
  var user = this;  //The value of this is for readability refers to the instance-- Only want to hash passwords on instances of the user
  if (!user.isModified('password')) { //check to see if user modified the password
    return next(); //so if the password has not been changed, move on
  }
  return bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) { //generating salt
    if (err) { //checking for errors
      return next(err); //checking for errors 
    }
    return bcrypt.hash(user.password, salt, function(err, hash) { //now has the password
      if (err) { //if passing in an err it will not save
        return next(err);
      }
      //defines what the password is for the user
      user.password = hash;
      return next();
    });
  });
});
// The difference between the two functions below are this this
// don't want to call this first param "user"! We have another user defined!
userSchema.statics.authenticate = function (formData, callback) { //authenticate is to compare, need to find it
  this.findOne({ //find them by an email, this.findOne refers to the model
      email: formData.email
    },
    function (err, user) {
      if (user === null){
        callback("Invalid username or password",null);
      }
      else {
        user.checkPassword(formData.password, callback); //this is an instance method, on a specific user
      }

    });
};
// the below is on instances
userSchema.methods.checkPassword = function(password, callback) {
  var user = this; //refers to the instance of the user
  bcrypt.compare(password, user.password, function (err, isMatch) {
    if (isMatch) {
      callback(null, user);
    } else {
      callback(err, null);
    }
  });
};

var User = mongoose.model("User", userSchema);

module.exports = User;