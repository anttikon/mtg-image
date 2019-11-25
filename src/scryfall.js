import { default as PQueue } from 'p-queue'
import fetch from 'node-fetch'

const queue = new PQueue.default({ concurrency: 1 })
const delay = time => new Promise(resolve => setTimeout(resolve, time))
const timeout = 75

const parseImageUrl = response =>
  !response.image_uris && response.card_faces && response.card_faces.length > 0
    ? parseImageUrl(response.card_faces[0])
    : response.image_uris.normal || response.image_uris.small

export const downloadImage = (multiverseid, url) =>
  fetch(url).then(response => response.buffer())

const getImageProperties = async multiverseid => {
  const response = await fetch(
    `https://api.scryfall.com/cards/multiverse/${multiverseid}`,
  )
  const json = await response.json()
  if (response.status !== 200) {
    throw new Error(json.details)
  }
  const imageUrl = parseImageUrl(json)
  return { layout: json.layout, multiverseid: json.multiverse_ids, imageUrl }
}

export const getImageUrl = multiverseId => {
  const response = queue.add(async () => {
    const { layout, multiverseid, imageUrl } = await getImageProperties(
      multiverseId,
    )
    if (!multiverseid) {
      throw new Error('Cannot find card with given multiverseid')
    }

    const multiverseIdIndex = multiverseid.indexOf(parseInt(multiverseId, 10))
    if (layout === 'transform' && multiverseIdIndex === 1) {
      return imageUrl
        .replace(
          'https://img.scryfall.com/cards/normal/front/',
          'https://img.scryfall.com/cards/normal/back/',
        )
        .replace('a.jpg', 'b.jpg')
    }
    return imageUrl
  })
  queue.add(async () => await delay(timeout))
  return response
}
