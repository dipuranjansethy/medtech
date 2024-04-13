import express  from "express";
import dotenv, { config } from 'dotenv'
// import course from './routes/courseRoutes.js'
import user from './routes/userRoutes.js'
// import payment from './routes/paymentRoutes.js'
import ErrorMiddleware from "./middlewares/Error.js";
import cookieParser from 'cookie-parser';
// import other from './routes/otherRoutes.js';
import cors from 'cors'


config({
    path:"./config/.env"
})

const app=express()
app.use(cookieParser())
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
    methods:["GET","POST","PUT","DELETE"],
}))

//using middlewares
app.use(express.json())
app.use(
    express.urlencoded({
        extended:true,
    })

)


// app.use("/api/v1",course)
app.use("/api/v1",user)
// app.use("/api/v1",payment)
// app.use("/api/v1",other)

export default app;
app.get("/",(req,res)=>{
    res.send(`<h1>site is working click Click<a href=${process.env.FRONTEND_URL}>Here</a> to visit frontend</h1>`)
})
app.use(ErrorMiddleware)