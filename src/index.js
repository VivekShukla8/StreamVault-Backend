import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./db/index.js";
import app from "./app.js";
import { initSocket } from "./socket.js";

dotenv.config({ path: "./.env" });

const PORT = process.env.PORT || 8000;

// 1. Create HTTP server
const httpServer = createServer(app);

// 2. Initialize socket
initSocket(httpServer);

// 3. Connect DB and start server
connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Connection failed", err);
  });



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