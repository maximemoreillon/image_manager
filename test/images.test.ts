import request from "supertest"
import { expect } from "chai"
import { app } from "../index"
import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const {
  LOGIN_URL = "http://users/auth/login",
  TEST_USER_USERNAME,
  TEST_USER_PASSWORD,
} = process.env

const login = async () => {
  const body = { username: TEST_USER_USERNAME, password: TEST_USER_PASSWORD }
  const {
    data: { jwt },
  } = await axios.post(LOGIN_URL, body)
  return jwt
}

describe("/images", () => {
  let jwt: string, image_id: string

  before(async () => {
    // Silencing console
    //console.log = () => {}
    jwt = await login()
  })

  describe("POST /images", () => {
    it("Should not allow posting an image when logged out", async () => {
      const { status } = await request(app)
        .post(`/images`)
        .field("description", "logo")
        .attach("image", "test/example.png")

      expect(status).to.equal(403)
    })

    it("Should allow posting an image when logged in", async () => {
      const { status, body } = await request(app)
        .post(`/images`)
        .field("description", "logo")
        .attach("image", "test/example.png")
        .set("Authorization", `Bearer ${jwt}`)

      image_id = body._id

      expect(status).to.equal(200)
    })
  })

  describe("GET /images", () => {
    it("Should allow the query of images", async () => {
      const { status, body } = await request(app)
        .get(`/images`)
        .set("Authorization", `Bearer ${jwt}`)

      expect(status).to.equal(200)
    })
  })

  describe("GET /images/:image_id", () => {
    it("Should allow the query of an image", async () => {
      const { status, body } = await request(app)
        .get(`/images/${image_id}`)
        .set("Authorization", `Bearer ${jwt}`)

      expect(status).to.equal(200)
    })
  })

  describe("GET /images/:image_id?variant=thumbnail", () => {
    it("Should allow the query of an image thumbnail", async () => {
      const { status } = await request(app).get(
        `/images/${image_id}?variant=thumbnail`
      )

      expect(status).to.equal(200)
    })
  })

  describe("GET /images/:image_id/thumbnail", () => {
    it("Should allow the query of an image thumbnail with legacy path", async () => {
      const { status } = await request(app).get(`/images/${image_id}/thumbnail`)

      expect(status).to.equal(200)
    })
  })

  describe("GET /images/:image_id/details", () => {
    it("Should allow the query of details about an image", async () => {
      const { status, body } = await request(app)
        .get(`/images/${image_id}/details`)
        .set("Authorization", `Bearer ${jwt}`)

      expect(status).to.equal(200)
      expect(body.description).to.equal("logo")
    })
  })

  describe("PATCH /images/:image_id", () => {
    it("Should allow the update of details about an image", async () => {
      const { status, body } = await request(app)
        .patch(`/images/${image_id}`)
        .send({ description: "moreillon_logo" })
        .set("Authorization", `Bearer ${jwt}`)

      expect(status).to.equal(200)
      expect(body.description).to.equal("moreillon_logo")
    })
  })

  describe("DELETE /images/:image_id", () => {
    it("Should allow the deletion of an image", async () => {
      const { status, body } = await request(app)
        .delete(`/images/${image_id}`)
        .set("Authorization", `Bearer ${jwt}`)

      expect(status).to.equal(200)
    })
  })
})
