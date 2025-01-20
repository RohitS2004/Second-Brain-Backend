import mongoose from "mongoose"
import Tag from "../models/tag.model"

export const tagIdsGeneration = async (tag: string) => {   
    // check if the tag exists in the database
    // if it exists then return its _id
    // if it does not exists then create a new tag and return its _id
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