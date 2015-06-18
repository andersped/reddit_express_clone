var mongoose = require("mongoose");
var Post = require("./post");

var postSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
		},
	info: {
		type: String,
		required: true
		},
	url: String,
	postId: String,
	comments: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment"
	}]
});

var Post = mongoose.model("Post", postSchema);

module.exports = Post;