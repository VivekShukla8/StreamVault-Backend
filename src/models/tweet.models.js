import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
            maxlength: 280, // Twitter-like character limit
            trim: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        likes: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

tweetSchema.plugin(mongooseAggregatePaginate);

// Index for searching tweets
tweetSchema.index({ content: "text" });
tweetSchema.index({ owner: 1, createdAt: -1 });

export const Tweet = mongoose.model("Tweet", tweetSchema);