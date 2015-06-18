var express = require("express"),
app = express(),
bodyParser = require("body-parser"),
methodOverride = require("method-override"),
db = require("./models"),
morgan = require("morgan"),
session = require("cookie-session"), //attach a cookie to communicate with the session
loginMiddleware = require("./middleware/loginHelper"); // make sure logged in a session
routeMiddleware = require("./middleware/routeHelper"); // make sure the user name doesn't exist and the username/password are correct


app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(morgan('tiny'));

app.use(session({ 
	maxAge: 4000000, //how long the session will last before being automaticlly logged out
	secret: 'ourlilscret', //secret to get on the server
	name: 'cookie THIS!' //the name of the cookie
}));

/*********** Login and Use ******************/
// use and login everywhere
app.use(loginMiddleware);

/************ POST ROUTES ****************/

app.get('/', function(req,res){
	//take you to the root directory in posthome
	res.redirect("/posts")
});

//Index
	//TODO add users when they login to be able to see the posts. Should this be a separate index file for users?
app.get("/posts", function(req,res){
	//find all of the posts
	db.Post.find({}, 
		function (err, posts){
			//render the post index, anyone can see this page and does not have to be logged in
			res.render("posts/index", {posts:posts}); //pass in an array of the posts to the index page
	});
});

/************* Sign Up and Login Routes ****************/

//New Sign Up Page
	//goes to the routeMiddleware in the middleware folder and then the preventLoginSignup Object
app.get('/signup', routeMiddleware.preventLoginSignup ,function(req,res){
  res.render('users/signup');
});

//Create Signup
app.post("/signup", function (req, res){
	var newUser = req.body.user
	db.User.create(newUser, function (err, user){
		if (user) {
			req.login(user);
			res.redirect("/posts")
		} else {
			console.log(err)
			res.render("users/signup"); 
		}
	});
});

//New Login Page
app.get("/login", routeMiddleware.preventLoginSignup, function (req, res){
	res.render("users/login")
});

//Create Maybe? But post the login 
app.post("/login", function (req, res) {
	db.User.authenticate(req.body.user,
		function (err, user){
			if (!err && user !== null){
				req.login(user);
				res.redirect("/posts");
			} else {
				res.render("users/login")
			}
	});
});

/************ Back To Post Routes ************/

//New
app.get("/posts/new", function(req,res){
	res.render("posts/new")
});

//Create
	//this should then be executed in the user model so you have to login to post
app.post("/posts", routeMiddleware.ensureLoggedIn, function(req,res){
	//creates each item in the database
	db.Post.create({title: req.body.post.title, info: req.body.post.info, url: req.body.post.url}, function(err, post){
		if(err){
			//if error go back to the new page
			console.log(err);
			res.render("posts/new");
		} else{
			//otherwise go back to the index page in post
			console.log(post);
			res.redirect("/posts");
		}
	});
});

//Show
	//only available to users or the delete/edit allowable to logged in user with the correct id
app.get('/posts/:id', function(req,res){
  db.Post.findById(req.params.id,
    function (err, post) {
      db.Comment.find( //goes to the post model and adds in any comments to the show page
      {
        _id: {$in: post.comments}
      },
      function(err, comments){
        res.render("posts/show", {post:post, comments:comments});
      });
    });
});

//Edit
	//only available to users
app.get("/posts/:id/edit", routeMiddleware.ensureLoggedIn, function(req,res){
	db.Post.findById(req.params.id, //find the post id 
		function (err,post){
			res.render("posts/edit", {post:post});
	});
});

//Update
	//only users can push this button, figure out how to make that stuff happen
app.put("/posts/:id", routeMiddleware.ensureLoggedIn, function(req,res){  //for some reason the below object took out post. and it works. no idea why it was needed above
	db.Post.findByIdAndUpdate(req.params.id, {title: req.body.title, info: req.body.info, url: req.body.url}, //update each parameter
		function (err, post){
			if(err) {
				res.render("posts/edit"); //go back to the edit page
			} else{
				res.redirect("/posts"); //updates will appear on the index page
			}
	});
});

//DESTROY Delete
app.delete("/posts/:id", routeMiddleware.ensureLoggedIn, function(req,res){
	db.Post.findById(req.params.id,
		function (err, post){
			if(err){
				console.log(err);
				res.render("posts/show");
			} else{
				post.remove();
				res.redirect("/posts");
			}
	});
});

/************* Comments Routes **************/

//Index 
		//Not needed because don't need comments to have its own page and don't want it to show up in the /posts index page
app.get("/posts/:post_id/comments", function(req,res){
	db.Post.findById(req.params.post_id,
		function (err, post){
			res.render("comments/index", {post:post});
	});
});


//New
app.get("/posts/:post_id/comments/new", function(req,res){
	db.Post.findById(req.params.post_id,
		function (err,post){
			if(err){
				console.log(err)
				//res.render("posts/show")
			} else{
			res.render("comments/new", {post:post});
		}
	});
});


//Create
	//had issues with the below link and the new.ejs link
app.post("/posts/:post_id/comments", function(req,res){ //redirecting to the correct post/ comments 
	db.Comment.create({name: req.body.name, voice: req.body.voice}, function(err,comment){
		console.log(comment)
		if(err){
			console.log(err)
			res.render("comments/new")
		} else{
			db.Post.findById(req.params.post_id, function(err,post){
				post.comments.push(comment); //pushing all the comments into the array in the post model
				comment.post = post._id; //use this in the new page
				comment.save(); //save to the comment model
				post.save(); //save to the post model
				res.redirect("/posts/"+ post._id); //redirect back to the correct posts/show page for this post
			});
		}
	});
});

//Show 
	//have this be a link on the posts/show page to get to this page
app.get("/posts/:post_id/comments/:id", function(req,res){
	db.Comment.findById(req.params.id)
	//.populate("post")
	.exec(function(err,comment){
	comment.post = req.params.post_id //populate not working so used this
		//console.log(comment.post)
		res.render("comments/show", {comment:comment});
	});
});


//Edit - Oh Shit
app.get("/posts/:post_id/comments/:id/edit", routeMiddleware.ensureLoggedIn, function(req,res){
	db.Comment.findById(req.params.id)
	//.populate("post") 
	.exec(function(err,comment){
		comment.post = req.params.post_id //populate not working, so this weirdness works and puts the information into the object
		res.render("comments/edit", {comment:comment});
		console.log(comment);
	});
});

//Update
app.put("/posts/:post_id/comments/:id", routeMiddleware.ensureLoggedIn, function(req,res){
	db.Comment.findByIdAndUpdate(req.params.id, {name: req.body.name, voice: req.body.voice},
		function (err, comment){
			if(err){
				res.render("comments/edit")
			} else{
				res.redirect("/posts/"+ req.params.post_id);
			}
	});
});

//DESTROY Delete
app.delete("/posts/:post_id/comments/:id", routeMiddleware.ensureLoggedIn, function(req,res){
	db.Comment.findByIdAndRemove(req.params.id,
		function (err, comment){
			if(err){
				console.log(err);
				res.render("comments/edit");
			} else{
				res.redirect("/posts/"+ req.params.post_id);
			}
	});
});


app.get("/logout", function (req, res){
	req.logout();
	res.redirect("/");
});

//Catch All
app.get('*', function(req,res){
  res.render('404');
});

// Start Server
app.listen(3000, function(){
  "Server is listening on port 3000";
});