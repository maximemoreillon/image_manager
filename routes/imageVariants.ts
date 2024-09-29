import express from "express"
import { readImageVariants } from "../controllers/imageVariants"

const router = express.Router()

router.route("/").get(readImageVariants)

export default router
