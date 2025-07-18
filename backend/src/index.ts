require('dotenv').config()
import express, { Response, Request, NextFunction } from 'express'
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/auth.routes"
import cors from 'cors'

const app = express()
const port = process.env.PORT;

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json({
  limit: "20kb"
}));
app.use(cookieParser());


app.get('/', (req, res) => {
  res.send('Server is running...🚀')
})


app.use("/api/auth", authRoutes);


app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Error:", err.stack || err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
