import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    conversation: { 
      type: Schema.Types.ObjectId, 
      ref: "Conversation", 
      required: true 
    },
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    }
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

// Index for efficient retrieval of latest messages in a conversation
messageSchema.index({ conversation: 1, createdAt: -1 });

export const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
