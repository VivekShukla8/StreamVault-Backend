import mongoose, { Schema } from "mongoose";

const messageRequestSchema = new Schema(
  {
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    receiver: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "accepted", "declined"], 
      default: "pending" 
    }
  },
  { timestamps: true } // replaces manual createdAt
);

// Add index for faster queries
messageRequestSchema.index(
  { sender: 1, receiver: 1 },
  { unique: true } 
);

export const MessageRequest = mongoose.model("MessageRequest", messageRequestSchema);
