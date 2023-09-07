const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        required: true,
    },
    content: {
        type: String,
        // required: true,
    },
    images: [{
        data: Buffer,
        contentType: String
    }],
    likes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'user',
    }],
    // comments: {
    //     type: String,
    // },
    hide: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;