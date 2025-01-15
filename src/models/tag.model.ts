import mongoose from "mongoose";

interface Tag {
    tagText: string,
}

const tagSchema = new mongoose.Schema<Tag>({
    tagText: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    }
}, {timestamps: true});

const Tag = mongoose.model("Tag", tagSchema);
export default Tag;