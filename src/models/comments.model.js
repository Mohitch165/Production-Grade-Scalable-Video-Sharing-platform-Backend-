import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        content: {
            type: String,
            required: true
        }
    }, {
        timestamps: true
    }
)

export const Comment = mongoose.model("Comment", commentSchema);