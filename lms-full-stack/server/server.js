import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import userRouter from './routes/userRoutes.js'
import { stripeWebhooks } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import courseRouter from './routes/courseRoute.js'
import authRouter from './routes/authRoutes.js'

const app = express()

await connectDB()

const allowedOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}))

app.get('/', (req, res) => res.send("Learn grid API"))
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api/auth', authRouter)
app.use('/api/educator', educatorRouter)
app.use('/api/course', courseRouter)
app.use('/api/user', userRouter)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Another server is running, or a stale node process is holding it.\n` +
        `Free it:  lsof -ti :${PORT} | xargs kill -9`
    )
  } else {
    console.error(err)
  }
  process.exit(1)
})