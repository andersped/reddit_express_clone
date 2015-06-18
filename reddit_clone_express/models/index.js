var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/reddit_clone");

module.exports.Comment = require("./comment");
module.exports.Post = require("./post");
module.exports.User = require("./user")