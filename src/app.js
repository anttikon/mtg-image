const express = require('express')
const { merge } = require('image-glue')
const { getImageUrl, downloadImage } = require('./scryfall')

const app = express()

const port = process.env.PORT || 6505

app.get('/api/v1/images', async (req, res) => {
  const { multiverseid } = req.query
  if (!multiverseid) {
    return res.status(400)
  }
  try {
    const buffer = await getImageBuffer(multiverseid)
    res.set({ 'Content-Disposition': 'inline' })
    res.set({ 'Content-Type': 'image/jpeg' })
    return res.send(buffer)
  } catch (e) {
    console.error(e)
    return res.status(500)
  }
})

async function mergeImages(images) {
  if (images.length === 2) {
    return merge(images, { output: { quality: 50 } })
  } else if (images.length === 3) {
    const firstMerge = await merge([images[0], images[1]], {
      output: { quality: 100 },
    })
    return merge([firstMerge, images[2]], { output: { quality: 50 } })
  }
  throw new Error('Cannot merge more than 3 images')
}

const getImageBuffer = async multiverseid => {
  if (Array.isArray(multiverseid)) {
    const images = await Promise.all(multiverseid.map(id => getImage(id)))
    return mergeImages(images)
  }
  return getImage(multiverseid)
}

const getImage = async multiverseId => {
  const imageUrl = await getImageUrl(multiverseId)
  return downloadImage(multiverseId, imageUrl)
}

app.listen(port, () => console.log(`mtg-image listening on port ${port}!`))
