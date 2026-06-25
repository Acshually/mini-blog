//we just not use req.body in authentication but we should use req.user as if we use req.body any hacker can easily use postman and see the data that we are sending in token but if we use req.user then it is not possible for hacker to see the data as it is stored in token and we can access it in any route where we use this middleware

//according to internet protocols we should never use req.body or body in any get request even if we do it will show an error

require('dotenv').config();
const express=require('express');
const app=express();

const userModel=require('./models/user.js');
const postModel=require('./models/post.js');
const cookieParser=require('cookie-parser');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
app.set('view engine', 'ejs');
const path=require('path');
app.use(express.static(path.join(__dirname,'public')));
const upload=require('./config/multerconfig');


app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cookieParser());

app.get('/',function(req,res){
    res.render("index");
});

app.post("/register",async function(req,res){
    
    let {username,email,age,password,name,}=req.body;
    let user=await userModel.findOne({email});
    if(user){
        return res.status(500).send("User already exists");
    }
    bcrypt.genSalt(10,async function(err,salt){
        bcrypt.hash(password,salt,async function(err,hash){

     let user=await userModel.create({
        username:username,
        email:email,
        age:age,
        password:hash,
        name:name
    });
    let token=jwt.sign({email:email,userid:user._id},"shhhh");
    res.cookie("token",token);
    res.redirect("/profile");
});
    });
});

app.get("/login",async function(req,res){
    res.render("login");
});

app.post("/login",async function(req,res){
    let {email,password}=req.body;
    let user=await userModel.findOne({email});
    if(!user){
        return res.status(500).send("User not found");
    }
    bcrypt.compare(password,user.password,async function(err,result){
        if(!result){
            return res.status(500).send("Incorrect password");
        }
        else{ 
            let token=jwt.sign({email:email,userid:user._id},"shhhh");
            res.cookie("token",token);
            res.redirect("/profile");
        }
       
    });
});

app.get("/logout",function(req,res){
    res.cookie("token","");
    res.redirect("/login");
});


//protection midalaware to check if user is authenticated or not
function isLoggedIn(req,res,next){
    if(!req.cookies || !req.cookies.token || req.cookies.token === ""){
        return res.redirect("/login"); // Redirect instead of just sending text
    }
    try {
        let data=jwt.verify(req.cookies.token,"shhhh");
        req.user=data;
        next();
    } catch (err) {
        return res.redirect("/login");
    }
}

app.get("/profile",isLoggedIn,async function(req,res){
    let user=await userModel.findOne({email:req.user.email}).populate("posts");
    
    
    res.render("profile",{user});
});

app.post("/post",isLoggedIn,async function(req,res){
    let user=await userModel.findOne({email:req.user.email});
    let post=await postModel.create({
        user:user._id,
        content:req.body.content
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
});

app.get("/feed", isLoggedIn, async function(req, res) {
    let posts = await postModel.find().populate("user").sort({ date: -1 }); // Get all posts, populate user details, sort by newest
    let currentUser = await userModel.findOne({ email: req.user.email }); // Get the logged-in user
    res.render("feed", { posts, user: currentUser });
});

app.get("/like/:id", isLoggedIn, async function(req, res){
    try {
        let post = await postModel.findById(req.params.id);
        if (!post) {
            return res.status(404).send("Post not found");
        }
        
        // Check if the user's ID is already in the likes array
        if (post.likes.includes(req.user.userid)) {
            // If already liked, remove the like
            post.likes.pull(req.user.userid);
        } else {
            // If not liked, add the like
            post.likes.push(req.user.userid);
        }
        
        await post.save();
        let referer = req.header('Referer') || '/profile';
        res.redirect(referer);
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).send("Internal Server Error: " + error.message);
    }
});

app.get("/edit/:id",isLoggedIn,async function(req,res){
    let post = await postModel.findOne({_id:req.params.id});
    res.render("edit",{post});
});

app.post("/update/:id",isLoggedIn,async function(req,res){
    let post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
    res.redirect("/profile");
});


//multer is a middleware that is used to handle file uploads in express.js
//use npm i multer to install multer
//in form tag we should use enctype="multipart/form-data" to upload files(must be used in form tag)
//mutipart means the data is send in multiple parts as the size of file may be large
// app.get("/test",function(req,res){
//     res.render("test");
// });

// app.post("/upload",upload.single('image'),function(req,res){
//      console.log(req.file);
// });

app.get("/profile/upload",function(req,res){
    res.render("profileupload");
});

 app.post("/upload",isLoggedIn,upload.single('image'),async function(req,res){
      let user=await userModel.findOne({email:req.user.email});
      user.profilepic=req.file.filename;
      await user.save();
      res.redirect("/profile");
 });
app.listen(process.env.PORT || 3000);