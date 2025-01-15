import mongoose from "mongoose";

export type CATEGORIES = "tweet" | "video" | "document";

interface Post {
    title: string,
    description?: string,
    link?: string,
    tagsAssociated: mongoose.Schema.Types.ObjectId[],
    createdBy: mongoose.Schema.Types.ObjectId,
    category: CATEGORIES
}

const postSchema = new mongoose.Schema<Post>({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: false,
    },
    link: {
        type: String,
        required: false,
    },
    tagsAssociated: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag"
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    category: {
        type: String,
        required: true,
        enum: ["tweet", "video", "document"],
    }
}, {timestamps: true});

const Post = mongoose.model("Post", postSchema);
export default Post;