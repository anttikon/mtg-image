import express from 'express'
import imageGlue from 'image-glue'
import { getImageUrl, downloadImage } from './scryfall.js'

const app = express()

const port = process.env.PORT || 6505

app.get('/api/v1/images', async (req, res) => {
  const { multiverseid } = req.query
  if (!multiverseid) {
    return res.status(400).send('Bad Request')
  }
  try {
    const buffer = await getImageBuffer(multiverseid)
    res.set({ 'Content-Disposition': 'inline' })
    res.set({ 'Content-Type': 'image/jpeg' })
    return res.send(buffer)
  } catch (e) {
    console.error(e)
    return res.status(500).send('Error')
  }
})

const mergeOpts = { output: { quality: 50 } }

const mergeImages = async images => {
  if (images.length === 2) {
    return imageGlue.merge(images, mergeOpts)
  } else if (images.length === 3) {
    const firstMerge = await imageGlue.merge([images[0], images[1]], mergeOpts)
    return imageGlue.merge([firstMerge, images[2]], mergeOpts)
  }
  throw new Error('Cannot merge more than 3 images')
}

const getImage = async multiverseId => {
  const imageUrl = await getImageUrl(multiverseId)
  return downloadImage(multiverseId, imageUrl)
}

const getImageBuffer = async multiverseid => {
  if (Array.isArray(multiverseid)) {
    const images = await Promise.all(multiverseid.map(id => getImage(id)))
    return mergeImages(images)
  }
  return getImage(multiverseid)
}

app.listen(port, () => console.log(`mtg-image listening on port ${port}!`))
