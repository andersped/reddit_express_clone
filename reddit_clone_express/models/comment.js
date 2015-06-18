var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
	name: String,
	voice: {
		type: String,
		required: true
	},
	posts: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Post"
	}
});

var Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;