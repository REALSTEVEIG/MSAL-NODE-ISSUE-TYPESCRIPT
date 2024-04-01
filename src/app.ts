import * as dotenv from "dotenv"
import express, {Request, Response} from "express"
import cors from "cors"
import { connectDB } from "./db/connect"
import { calenRouter } from "./routes/route"

dotenv.config() 

const PORT = process.env.PORT || 8000

const app = express()

app.use(cors())
app.use(express.json())

app.use('/', (req: Request, res: Response) => {
    return res.json({ message: 'Welcome to calen 360'})
});

app.use("/", calenRouter)

export default app


const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI as string)
        app.listen(PORT, () => {
            console.log(`Server is listening on PORT ${PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}

start()