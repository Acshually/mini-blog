
const mongoose=require('mongoose');
// const post = require('../../11DataAssociation/models/post');
mongoose.connect(process.env.MONGODB_URI);

const postSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    date:{
        type:Date,
        default:Date.now
    },
    content:String,
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }]

});

module.exports=mongoose.model("post",postSchema);