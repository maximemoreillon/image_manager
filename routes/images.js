const express = require('express')
const image_controller = require('../controllers/image.js')
const auth = require('@moreillon/express_identification_middleware')

const auth_options = { url: `${process.env.AUTHENTICATION_API_URL}/v2/whoami` }

// Register the middleware
const router = express.Router()

router.route('/')
  .get(auth(auth_options), image_controller.get_image_list)
  .post(auth(auth_options), image_controller.upload_image)

router.route('/:id')
  .get(image_controller.get_image)
  .delete(auth(auth_options), image_controller.delete_image)

router.route('/:id/thumbnail')
  .get(,image_controller.get_thumbnail)

router.route('/:id/details')
  .get(auth(auth_options),image_controller.get_image_details)

module.exports = router
