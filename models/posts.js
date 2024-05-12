const mongoose = require("mongoose")
const Schema = mongoose.Schema

const postSchema = new Schema({
    title:{
        type: String
    },   
    descreption:{
        type: String
    },   
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
});


const Post = mongoose.model("Post", postSchema);
 module.exports = Post;