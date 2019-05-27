import fs from 'fs'
import S3 from 'aws-sdk/clients/s3'
import { getImageUrl, downloadImage } from './scryfall'

const s3 = new S3({
  apiVersion: '2006-03-01',
  params: { Bucket: 'mtg-image' }
})

const localImagePath = `${__dirname}/../images`
const directoryExists = (path) => fs.promises.stat(path)
  .then(() => true)
  .catch(() => false)

async function saveLocalImage(buffer, multiverseid) {
  const localDirectoryExists = await directoryExists(localImagePath)
  if (!localDirectoryExists) {
    await fs.promises.mkdir(localImagePath)
  }
  return fs.promises.writeFile(`${localImagePath}/${multiverseid}.jpg`, buffer)
}

async function saveS3Image(buffer, multiverseid) {
  const s3Args = {
    ACL: 'private',
    Bucket: 'mtg-image',
    Key: `${multiverseid}.jpg`,
    Body: buffer,
    ContentType: 'image/jpeg'
  }
  return s3.putObject(s3Args).promise()
}

async function getLocalImage(multiverseid) {
  return fs.promises.readFile(`${localImagePath}/${multiverseid}.jpg`)
    .catch(() => null)
}

async function getS3Image(multiverseid) {
  const s3Args = {
    Bucket: 'mtg-image',
    Key: `${multiverseid}.jpg`,
  }
  return s3.getObject(s3Args)
    .promise()
    .then(response => response.Body)
    .catch(() => null)
}

export const getImage = async (multiverseId) => {
  const existingImage = process.env.NODE_ENV === 'production' ? await getS3Image(multiverseId) : await getLocalImage((multiverseId))
  if (existingImage) {
    return existingImage
  }

  const imageUrl = await getImageUrl(multiverseId)
  const buffer = await downloadImage(multiverseId, imageUrl)

  process.env.NODE_ENV === 'production' ? saveS3Image(buffer, multiverseId) : saveLocalImage(buffer, multiverseId)

  return buffer
}
