const request = require("supertest")
const {expect} = require("chai")
const {app} = require("../index.js")
const axios = require('axios')
const dotenv = require('dotenv')

dotenv.config()

const {
  AUTHENTICATION_API_URL,
  TEST_USER_USERNAME,
  TEST_USER_PASSWORD,
} = process.env




const login = async () => {
  const body = {username: TEST_USER_USERNAME, password: TEST_USER_PASSWORD}
  const url = `${process.env.AUTHENTICATION_API_URL}/login`
  const {data: {jwt}} = await axios.post(url,body)
  return jwt
}




describe("/images", () => {

  let jwt, image_id

  before( async () => {
    // Silencing console
    //console.log = () => {}
    jwt = await login()
  })

  describe("POST /images", () => {

    it("Should allow posting an image", async () => {
      const {status, body} = await request(app)
        .post(`/images`)
        .attach('image', 'test/example.png')
        .set('Authorization', `Bearer ${jwt}`)

      image_id = body._id

      expect(status).to.equal(200)
    })
  })

  describe("GET /images", () => {

    it("Should allow the query of images", async () => {
      const {status, body} = await request(app)
        .get(`/images`)
        .set('Authorization', `Bearer ${jwt}`)

      expect(status).to.equal(200)
    })
  })

  describe("GET /images/:image_id", () => {

    it("Should allow the query of an image", async () => {
      const {status, body} = await request(app)
        .get(`/images/${image_id}`)
        .set('Authorization', `Bearer ${jwt}`)

      expect(status).to.equal(200)
    })
  })

  describe("GET /images/:image_id/thumbnail", () => {

    it("Should allow the query of an image thumbnail", async () => {
      const {status, body} = await request(app)
        .get(`/images/${image_id}/thumbnail`)
        .set('Authorization', `Bearer ${jwt}`)

      expect(status).to.equal(200)
    })
  })

  describe("GET /images/:image_id/details", () => {

    it("Should allow the query of details about an image", async () => {
      const {status, body} = await request(app)
        .get(`/images/${image_id}/details`)
        .set('Authorization', `Bearer ${jwt}`)

      expect(status).to.equal(200)
    })
  })

  // describe("DELETE /images/:image_id", () => {
  //
  //   it("Should allow the deletion of an image", async () => {
  //     const {status, body} = await request(app)
  //       .delete(`/images/${image_id}`)
  //       .set('Authorization', `Bearer ${jwt}`)
  //
  //     expect(status).to.equal(200)
  //   })
  // })



})
