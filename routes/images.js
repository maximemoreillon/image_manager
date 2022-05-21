const express = require('express')
const image_controller = require('../controllers/image.js')
const auth = require('@moreillon/express_identification_middleware')

const auth_options = { url: process.env.IDENTIFICATION_URL }
const auth_options_lax = { ...auth_options, lax: true }

// Register the middleware
const router = express.Router()

router.route('/')
  .get(auth(auth_options), image_controller.get_image_list)
  .post(auth(auth_options), image_controller.upload_image)

router.route('/:id')
  .get(auth(auth_options_lax), image_controller.get_image)
  .delete(auth(auth_options), image_controller.delete_image)
  .patch(auth(auth_options), image_controller.update_image)

router.route('/:id/thumbnail')
  .get(auth(auth_options_lax), image_controller.get_thumbnail)

router.route('/:id/details')
  .get(auth(auth_options),image_controller.get_image_details)

module.exports = router
