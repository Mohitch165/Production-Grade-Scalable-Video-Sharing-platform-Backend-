import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "users"
        },
        channel: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "users"
        }
    }, {
        timestamps: true
    }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema);