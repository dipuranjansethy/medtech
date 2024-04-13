import app from "./app.js";
import { connectDB } from "./config/database.js";
import cloudinary from 'cloudinary'

import nodeCron from 'node-cron'


connectDB();

cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_CLIENT_NAME ,
    api_key:process.env.CLOUDINARY_CLIENT_API,
    api_secret:process.env.CLOUDINARY_CLIENT_SECRET,
});

// export const instance=new Razorpay({
//     key_id: process.env.RAZORPAY_API_KEY,
//     key_secret:process.env.RAZORPAY_API_SECRET ,
//   });

nodeCron.schedule("0 * * * *",async()=>{
    try {
        
    } catch (error) {
        console.log(error)
        
    }
});




app.listen(process.env.PORT,()=>{
    console.log(`server is working at port ${process.env.PORT}`)
})