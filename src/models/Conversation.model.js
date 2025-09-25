import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: [
      { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
      }
    ],
    lastMessage: { 
      type: Schema.Types.ObjectId, 
      ref: "Message" 
    }
  },
  { timestamps: true } // auto-manages createdAt & updatedAt
);

// Index for queries like "find all conversations of a user"
conversationSchema.index({ participants: 1 });

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);
