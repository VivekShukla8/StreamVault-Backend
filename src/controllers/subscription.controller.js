import mongoose, {isValidObjectId} from "mongoose"
import {Subscription} from "../models/subscription.models.js"
import APIerror from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId = req.user._id;  // logged-in user

    if(!mongoose.isValidObjectId(channelId)){
        throw new APIerror(400,"Invalid channel Id")
    }

    // Prevent user from subscribing to themselves
    if (channelId.toString() === subscriberId.toString()) {
        throw new APIerror(400, "You cannot subscribe to your own channel");
    }

    //Checking if subscription already exist
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    })

    if(existingSubscription){
        // Unsubscribe
        await existingSubscription.deleteOne()
        
        // Get updated subscriber count
        const subscriberCount = await Subscription.countDocuments({ channel: channelId });

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isSubscribed: false, action: 'unsubscribed', subscriberCount },
                "Unsubscribed successfully"
            )
        )
    }
    else {
        // Subscribe
        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        })
        
        // Get updated subscriber count
        const subscriberCount = await Subscription.countDocuments({ channel: channelId });

        return res.status(201).json(
        new ApiResponse(
            201,
            { isSubscribed: true, action: 'subscribed', subscription: newSubscription, subscriberCount },
            "Subscribed successfully"   
            )
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!mongoose.isValidObjectId(channelId)){
        throw new APIerror(400,"Invalid channel id")    
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",                 // collection to join (check pluralization in Mongo)
                localField: "subscriber",     // field in Subscription
                foreignField: "_id",          // field in User
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"    // convert array -> single object
        },
        {
            $project:{
                _id:0,
                subscriberId: "$subscriberDetails._id",
                username: "$subscriberDetails.username",
                fullname: "$subscriberDetails.fullname",
                email: "$subscriberDetails.email",
                subscribedAt: "$createdAt"
            }
        },
        {
            $sort: { subscribedAt: -1 } // latest subscribers first
        }
    ])  

    if (!subscribers || subscribers.length === 0) {
        throw new APIerror(404, "No subscribers found for this channel");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!mongoose.isValidObjectId(subscriberId)){
        throw new APIerror(400,"Invalid Subscriber Id")
    }

    const channels  = await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"     // convert array to single object
        },
        {
            $project:{
                _id: 0,
                channelId: "$channelDetails._id",
                username: "$channelDetails.username",
                fullname: "$channelDetails.fullname",
                email: "$channelDetails.email",
                subscribedAt: "$createdAt"
            }
        },
         {
            $sort: { subscribedAt: -1 }    // latest first
        }
    ])

    if (!channels || channels.length === 0) {
        throw new APIerror(404, "No subscribed channels found for this user");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channels,
            "Subscribed channels list fetched successfully."
        )
    )
})

// controller to check if current user is subscribed to a channel
const getSubscriptionStatus = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new APIerror(400, "Invalid channel ID");
    }

    const subscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    });

    // Get total subscriber count
    const subscriberCount = await Subscription.countDocuments({ channel: channelId });

    return res.status(200).json(
        new ApiResponse(
            200,
            { isSubscribed: !!subscription, subscriberCount },
            "Subscription status fetched successfully"
        )
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    getSubscriptionStatus
}