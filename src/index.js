// require('dotenv').config()

import connectDB from "./db/index.js";
import dotenv from "dotenv"
import app from "./app.js";

dotenv.config({
    path:'./.env'
})

connectDB().then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server is running at port :${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("Connection failed", err);
})



// import express from "express"
// const app = express();

// (async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("ERR:",error);
//             throw error;
//         })

//         app.listen(process.env.PORT, ()=>{
//             console.log(`App is on at ${process.env.PORT}`);
//         })
//     } catch (error) {
//         console.error();
//         throw err;
//     }
// })()