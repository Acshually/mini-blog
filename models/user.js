
const mongoose=require('mongoose');

mongoose.connect(process.env.MONGODB_URI);

const userSchema=mongoose.Schema({
    username:String,
    name:String,
    email:String,
    password:String,
    age:Number,
    posts:[{type:mongoose.Schema.Types.ObjectId, ref:'post'}],
    profilepic:{type:String,default:"default.png"}
});

module.exports=mongoose.model("user",userSchema);