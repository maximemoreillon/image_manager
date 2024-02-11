import express from "express"
import { readImageVariants } from "../controllers/imageVariants"
import auth from "@moreillon/express_identification_middleware"

const auth_options = { url: process.env.IDENTIFICATION_URL }

const router = express.Router()

router.route("/").get(auth(auth_options), readImageVariants)

export default router
