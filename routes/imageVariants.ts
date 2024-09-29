import express from "express"
import { readImageVariants } from "../controllers/imageVariants"
import { getAuthMiddlewares } from "../auth"

const { strictAuth } = getAuthMiddlewares()

const router = express.Router()

router.route("/").get(strictAuth, readImageVariants)

export default router
