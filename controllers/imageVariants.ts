import { Request, Response } from "express"
import sharp from "sharp"

export const { DEFAULT_SERVED_VARIANT = "original" } = process.env

const sharpOptions = { failOnError: true }

type GenerateInput = any

export const imageVariants = [
  {
    name: "thumbnail",
    filename: "thumbnail.jpg",
    generate: async (input: GenerateInput) =>
      sharp(input, sharpOptions).withMetadata().resize(256, 256),
  },
  {
    name: "webp",
    filename: "image.webp",
    generate: async (input: GenerateInput) =>
      sharp(input, sharpOptions).withMetadata(),
  },
  {
    name: "max_1920_1080",
    filename: "max_1920_1080.jpg",
    generate: async (input: GenerateInput) =>
      sharp(input, sharpOptions).withMetadata().resize({
        width: 1920,
        height: 1080,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      }),
  },
]

export type ImageVariant = (typeof imageVariants)[0]

export const ImageVariantNames = imageVariants.map(({ name }) => name)

export const readImageVariants = async (req: Request, res: Response) => {
  res.send({ default: DEFAULT_SERVED_VARIANT, available: ImageVariantNames })
}
