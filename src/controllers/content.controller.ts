import { NextFunction, Request, Response } from "express";
import { JSON_RESPONSE, STATUS_CODE } from "../types/types";
import { User } from "../models/user.model";
import Post, { CATEGORIES } from "../models/post.model";
import Tag from "../models/tag.model";

export const handleFetchAllPosts = async (req: Request, res: Response, next: NextFunction) => {
    // fetch all the posts associated with that user and return all those posts
    // get the user object from the request
    // then get all the associated posts array from the user object
    // then fetch all the post documents from that array containing the ObjectId for all the associated posts
    // If there are no posts available then return a res with message, "No posts available!"
    // else return the posts array to the frontend

    try {
        // @ts-ignore
        const user = req.body;

        const dbUser = await User.findById(user._id);
        const associatedPostsObjectIdArray = dbUser?.associatedPosts;

        const posts = associatedPostsObjectIdArray?.map(async (pid) => await Post.findById(pid))
        console.log(posts);

        if (posts?.length === 1) {
            res.status(<STATUS_CODE>200)
            .json(<JSON_RESPONSE>{
                status: "success",
                message: "No posts available!"
            })
            return;
        }

        res.status(<STATUS_CODE>200)
        .json(<JSON_RESPONSE>{
            status: "success",
            message: "All the posts!",
            data: {
                posts,
            }
        })
    }
    catch (error: any) {
        res.status(<STATUS_CODE>500)
        .json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while fetching the posts!"
        })
    }
}

export const handleCreatePost = async (req: Request, res: Response, next: NextFunction) => {
    // get the data from the frontend
    // run validations on the data received
    // handle the tags, create if not present in the database or else assign create an Array consisting the _id for all those tags
    // check for the category to which the post belongs to 
    // this will be a verified routes since only those who are logged in will be able to create a post
    try {
        const user = req.body();
        const title: string = req.body;
        const description: string = req.body;
        const link: string = req.body;
        const tagsAssociated: string[] = req.body;
        const category: CATEGORIES = req.body;

        if (!title || !category) {
            res.status(<STATUS_CODE>400)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Please provide all the necessary fields"
            })
            return;
        }
        
        const tags = tagsAssociated.map(async (tg) => {
            const existingTag = await Tag.findOne({
                tagText: tg.trim(),
            });

            if (!existingTag) {
                const newlyCreatedTag = await Tag.create({
                    tagText: tg.trim(),
                })
                return newlyCreatedTag._id;
            }
            else {
                return existingTag._id;
            }
        })

        console.log(tags);

        const createdPost = await Post.create({
            title,
            description,
            link,
            createdBy: user._id,
            category,
            tagsAssociated: tags,
        })

        console.log(createdPost);

        if (!createdPost) {
            res.status(<STATUS_CODE>500)
            .json(<JSON_RESPONSE>{
                status: "server_error",
                message: "Something went wrong while creating the post"
            })
            return;
        }

        res.status(<STATUS_CODE>200)
        .json(<JSON_RESPONSE>{
            status: "success",
            message: "Post created successfully",
            data: {
                id: String(createdPost._id)
            }
        })

    }
    catch (error: any) {
        res.status(<STATUS_CODE>500)
        .json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while creating the post!"
        })
    }
}

export const handleUpdatePost = async (req: Request, res: Response, next: NextFunction) => {
    // update the specific post based on the id of the post 
    // id of the post will be send in the url 
    // fetch that particular post from the database using that post id
    // get the fields from the req.body that the user wants to update
    // send a res if there occurs any error while updating the post
    // otherwise send a res with the message, "post updated successfully"
    try {
        const postId = req.params.postId;
        const { title, description, link } = req.body; // * In the future give the user option to update the tags(add more tags or remove existing tags)
        const existingPost = await Post.findById(postId);
        
        if (!existingPost) {
            res.status(<STATUS_CODE>400)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "No such posts exists!"
            })
            return;
        }

        await Post.findByIdAndUpdate(postId, {
            $set: {
                title: title,
                description: description,
                link: link,
            }
        }, {
            new: true
        })

        res.status(<STATUS_CODE>200)
        .json(<JSON_RESPONSE>{
            status: "success",
            message: "Post updated successfully"
        })
    }
    catch (error: any) {
        res.status(<STATUS_CODE>500)
        .json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while updating the post!, please try again"
        })
    }
}

export const handleDeletePost = async (req: Request, res: Response, next: NextFunction) => {
    // get the post id from the req.params
    // check if there exists a post from the given post id or not
    // if not then send a response that the Post that you are trying to delete does not exists
    // if yes then delete the post
    try {
        const postId = req.params.postId;

        const existingPost = await Post.findById(postId);
        if (!existingPost) {
            res.status(<STATUS_CODE>400)
            .json(<JSON_RESPONSE>{
                status: "client_error",
                message: "The post that you are trying to delete does not exists!"
            })
            return;
        }

        await Post.findByIdAndDelete(postId);
        res.status(<STATUS_CODE>200)
        .json(<JSON_RESPONSE>{
            status: "success",
            message: "Post deleted successfully!",
        })
    }   
    catch (error: any) {
        res.status(<STATUS_CODE>500)
        .json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while deleting the post, please try again!",
        })
    }
}