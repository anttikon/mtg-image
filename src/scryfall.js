import PQueue from 'p-queue'
import fetch from 'node-fetch'

const queue = new PQueue({ concurrency: 1 })
const delay = (time) => new Promise((resolve => setTimeout(resolve, time)))
const timeout = 75

function parseImageUrl(response) {
  if (!response.image_uris && response.card_faces && response.card_faces.length > 0) {
    return parseImageUrl(response.card_faces[0])
  }
  const { normal, small } = response.image_uris
  return normal || small
}

export async function downloadImage(multiverseid, url) {
  const response = await fetch(url)
  return response.buffer()
}

async function getImageProperties(multiverseid) {
  const reponse = await fetch(`https://api.scryfall.com/cards/multiverse/${multiverseid}`)
  const json = await reponse.json()
  if (reponse.status !== 200) {
    throw new Error(json.details)
  }
  const imageUrl = parseImageUrl(json)
  return { layout: json.layout, multiverseid: json.multiverse_ids, imageUrl }
}

export function getImageUrl(multiverseId) {
  return queue.add(async () => {
    const { layout, multiverseid, imageUrl } = await getImageProperties(multiverseId)
    if (!multiverseid) {
      throw new Error('Cannot find card with given multiverseid')
    }

    const multiverseIdIndex = multiverseid.indexOf(parseInt(multiverseId, 10))
    if (layout === 'transform' && multiverseIdIndex === 1) {
      return imageUrl.replace('https://img.scryfall.com/cards/normal/front/', 'https://img.scryfall.com/cards/normal/back/').replace('a.jpg', 'b.jpg')
    }
    await delay(timeout)
    return imageUrl
  })
}
