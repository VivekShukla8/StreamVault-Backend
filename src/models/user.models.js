import mongoose ,{Mongoose, Schema} from "mongoose";
import jwt from "jsonwebtoken"
import brcypt from "bcrypt"

const userSchema = new Schema(
    {
        username:{
            type:String,
            lowercase:true,
            required:true,
            unique:true,
            trim:true,          // Used to trim spaces
            index:true
        },
        email:{
            type:String,
            lowercase:true,
            required:true,
            unique:true,
            trim:true
        }, 
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            type:String,            ///Storing the url
            required:true
        },
        coverImage:{
            type:String,
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        refreshToken:{
            type:String,
        }
    },
    {timestamps:true}
);

userSchema.pre('save',async function(next){
    if(!this.isModified("password")) return next()
    this.password = await brcypt.hash(this.password,12)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await brcypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function (){
    return jwt.sign(
        {
            _id:this._id,
            // email:this.email,
            // username:this.username,
            // fullname:this.fullname
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_SECRET_EXPIRY
        }
    )
}

userSchema.index({ username: "text", fullname: "text" });   // for searching logic


export const User = mongoose.model("User",userSchema)