import { NextFunction, Request, Response } from "express";
import { ContentType, JSON_RESPONSE, STATUS_CODE } from "../types/types";
import { User } from "../models/user.model";
import Post, { CATEGORIES } from "../models/post.model";
import Tag from "../models/tag.model";
import mongoose from "mongoose";
import { tagIdsGeneration } from "../utilities/Tag";

export const handleFetchPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        // @ts-ignore
        const contentType: ContentType = req.params.contentType;
        // @ts-ignore
        const user = req.user;
        const dbUser = await User.findById(user._id);

        switch (contentType) {
            case "all":
                const associatedPostsAll = dbUser?.associatedPosts;
                res.status(<STATUS_CODE>200).json(<JSON_RESPONSE>{
                    status: "success",
                    message: "All the posts!",
                    data: {
                        posts: associatedPostsAll,
                        username: user.username,
                        profilePicture: user.profilePicture,
                    },
                });
                break;

            case "tweet":
                const associatedPostsTweets = dbUser?.associatedPosts.filter(
                    (post) => post.category === 'tweet'
                )

                res.status(<STATUS_CODE>200).json(<JSON_RESPONSE>{
                    status: "success",
                    message: "All the tweets!",
                    data: {
                        posts: associatedPostsTweets,
                        username: user.username,
                        profilePicture: user.profilePicture,
                    },
                });
                break;

            case "document":
                const associatedPostsDocuments = dbUser?.associatedPosts.filter(
                    (post) => post.category === "document"
                );

                res.status(<STATUS_CODE>200).json(<JSON_RESPONSE>{
                    status: "success",
                    message: "All the tweets!",
                    data: {
                        posts: associatedPostsDocuments, 
                        username: user.username,
                        profilePicture: user.profilePicture,
                    },
                });
                break;

            case "video":
                res.status(<STATUS_CODE>200).json(<JSON_RESPONSE>{
                    status: "success",
                    message: "All the tweets!",
                    data: {
                        posts: dbUser?.associatedPosts.filter(
                            (post) => post.category === "video"
                        ),
                        username: user.username,
                        profilePicture: user.profilePicture,
                    },
                });
                break;
        }
        
    } catch (error: any) {
        res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while fetching the posts!",
        });
    }
};

export const handleCreatePost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // @ts-ignore
        const user = req.user;
        const title: string = req.body.title;
        const description: string = req.body.description;
        const link: string = req.body.link.toLowerCase();
        // @ts-ignore
        const tagsAssociated: string[] = JSON.parse(req.body.tagsAssociated).filter(tag => tag !== "");
        const category: CATEGORIES = req.body.category;

        if (!title || !category) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Please provide all the necessary fields",
            });
            return;
        }

        const existingUser = await User.findOne({
            $or: [{ username: user.username }, { email: user.email }],
        });

        if (!existingUser) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message: "Something went wrong while creating the post",
            });
            return;
        }

        // Handle tags creation
        let tagsId: mongoose.Types.ObjectId[] = [];

        if (tagsAssociated.length > 0) {
            await Promise.all(
                tagsAssociated.map(async (tag) => {
                    const tagId = await tagIdsGeneration(tag);
                    tagsId.push(tagId);
                })
            );
        }

        const createdPost = await Post.create({
            title: title || "",
            description: description || "",
            link: link || "",
            createdBy: existingUser._id,
            category: category || "",
            tagsAssociated: tagsId || [],
        });

        if (!createdPost) {
            res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
                status: "server_error",
                message: "Something went wrong while creating the post",
            });
            return;
        }

        existingUser.associatedPosts.push({
            id: createdPost._id,
            title: createdPost.title,
            description: createdPost.description,
            link: createdPost.link,
            category: createdPost.category,
            tagsAssociated: tagsAssociated,
        });

        await existingUser.save({ validateBeforeSave: false });

        res.status(<STATUS_CODE>200).json(<JSON_RESPONSE>{
            status: "success",
            message: "Post created successfully",
            data: {
                posts: existingUser?.associatedPosts,
            },
        });
    } catch (error: any) {
        res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while creating the post!",
        });
    }
};

export const handleDeletePost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const postId = req.params.postId;

        // @ts-ignore
        const user = req.user;

        const existingPost = await Post.findById(postId);
        if (!existingPost) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message:
                    "The post that you are trying to delete does not exists!",
            });
            return;
        }

        const existingUser = await User.findById(user._id);

        await Post.findByIdAndDelete(postId);

        const updatedPosts = existingUser?.associatedPosts.filter(
            (post) => post.id.id.toString() !== existingPost._id.id.toString()
        );

        // @ts-ignore
        existingUser?.associatedPosts = updatedPosts;
        await existingUser?.save({ validateBeforeSave: false });

        res.status(<STATUS_CODE>200).json(<JSON_RESPONSE>{
            status: "success",
            message: "Post deleted successfully!",
            data: {
                posts: existingUser?.associatedPosts,
            },
        });
    } catch (error: any) {
        res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
            status: "server_error",
            message:
                "Something went wrong while deleting the post, please try again!",
        });
    }
};

export const handleGetSpecificPostDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log("I am called!")
        
        const postId = req.params.postId;
        console.log(postId);

        // get that particular post
        const existingPost = await Post.findById(postId);
        console.log(existingPost);

        if (!existingPost) {
            res.status(<STATUS_CODE>400).json(<JSON_RESPONSE>{
                status: "client_error",
                message: "No such post exists!",
            });
            return;
        }

        const tagsAssociated = await Promise.all(
            existingPost.tagsAssociated.map(
                async (tag) => await Tag.findOne(tag).then((tg) => tg?.tagText)
            )
        );

        console.log(tagsAssociated);

        res.status(<STATUS_CODE>200).json(<JSON_RESPONSE>{
            status: "success",
            message: "Post data",
            data: {
                title: existingPost.title,
                description: existingPost.description,
                link: existingPost.link,
                category: existingPost.category,
                tagsAssociated: tagsAssociated,
            },
        });
    } catch (error: any) {
        res.status(<STATUS_CODE>500).json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong while updating the document",
        });
    }
};

export const handlePostUpdate = async (req: Request, res: Response, next: NextFunction) => {

    try {
        // @ts-ignore
        const user = req.user;
        const existingUser = await User.findById(user._id);
        
        const postId = req.params.postId
        const existingPost = await Post.findById(postId);

        const { title, description, link, category } = req.body
        const tagsAssociated: string[] = JSON.parse(req.body.tagsAssociated);

        // * Fix the error issue here, type mismatch error
        const tagsAssociatedIds: any = await Promise.all(
            tagsAssociated.map(async (tag) => {
                const exTg = await Tag.findOne({ tagText: tag })
                if (exTg) {
                    return exTg._id;
                }
                else {
                    const newTag = await Tag.create({
                        tagText: tag
                    })
                    return newTag._id;
                }
            })
        )


        if (existingUser) {
            existingUser.associatedPosts = existingUser.associatedPosts.map(
                (post) => {
                    if (post.id.id.toString() === existingPost!._id.id.toString()) {
                        post.title = title;
                        post.description = description;
                        post.link = link;
                        post.category = category;
                        post.tagsAssociated = tagsAssociated;

                    }
                    return post;
                }
            )

            // Why we have used markModified here?
            // https://mongoosejs.com/docs/schematypes.html 
            // Mongoose does not automatically detect the changes made in the array, inside the associatedPosts array we are changing the fields, so by default the mongoose will not detect if there is any changes made to the associatedPosts of the user so for that we have to explicitly tell the mongoose which field has been modified
            
            existingUser.markModified('associatedPosts'); // Mark the array as modified
            await existingUser.save({ validateBeforeSave: false })
        }

        if (existingPost) {
            existingPost.title = title;
            existingPost.description = description;
            existingPost.link = link;
            existingPost.category = category;
            existingPost.tagsAssociated = tagsAssociatedIds;

            await existingPost.save({ validateBeforeSave: false })

            res.status(<STATUS_CODE>200)
            .json(<JSON_RESPONSE>{
                status: "success",
                message: "Post updated successfully!",
                data: {
                    post: {
                        title: existingPost.title,
                        description: existingPost.description,
                        link: existingPost.link,
                        category: existingPost.category,
                        tagsAssociated: tagsAssociated,
                    }
                }
            })
        }

    }
    catch (error: any) {
        res.status(<STATUS_CODE>500)
        .json(<JSON_RESPONSE>{
            status: "server_error",
            message: "Something went wrong!"
        })
    }
}
