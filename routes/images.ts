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

router.route("/").get(strictAuth, get_image_list).post(strictAuth, upload_image)
router
  .route("/:id")
  .get(laxAuth, get_image)
  .delete(strictAuth, delete_image)
  .patch(strictAuth, update_image_details)

router.route("/:id/details").get(strictAuth, get_image_details)
router.route("/:id/:variant").get(laxAuth, get_image)

export default router
