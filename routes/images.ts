import express from "express"
import {
  get_image_list,
  upload_image,
  get_image,
  delete_image,
  update_image_details,
  get_image_details,
} from "../controllers/images"
import auth from "@moreillon/express_identification_middleware"

const auth_options = { url: process.env.IDENTIFICATION_URL }
const auth_options_lax = { ...auth_options, lax: true }

const router = express.Router()

router
  .route("/")
  .get(auth(auth_options), get_image_list)
  .post(auth(auth_options), upload_image)

router
  .route("/:id")
  .get(auth(auth_options_lax), get_image)
  .delete(auth(auth_options), delete_image)
  .patch(auth(auth_options), update_image_details)

router.route("/:id/details").get(auth(auth_options), get_image_details)

router.route("/:id/:variant").get(auth(auth_options_lax), get_image)

export default router
