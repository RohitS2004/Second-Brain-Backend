import mongoose from "mongoose"
import Tag from "../models/tag.model"

export const tagIdsGeneration = async (tag: string) => {   
    
    const existingTag = await Tag.findOne({
        tagText: tag
    })

    if (existingTag) {
        return existingTag._id;
    }
    else {
        const createdTag = await Tag.create({
            tagText: tag
        })

        return createdTag._id;
    }
}