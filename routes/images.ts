import express from "express"
import {
  get_image_list,
  upload_image,
  get_image,
  delete_image,
  update_image_details,
  get_image_details,
} from "../controllers/images"
import { getAuthMiddlewares } from "../auth"

const { strictAuth, laxAuth } = getAuthMiddlewares()

const router = express.Router()

router.route("/:id").get(get_image)
router.route("/:id/:variant").get(laxAuth, get_image)

// Protected routes from here
router.use(strictAuth)
router.route("/").get(get_image_list).post(upload_image)
router.route("/:id").delete(delete_image).patch(update_image_details)
router.route("/:id/details").get(get_image_details)

export default router
