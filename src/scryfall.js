const { default: PQueue } = require('p-queue')
const fetch = require('node-fetch')

const queue = new PQueue({ concurrency: 1 })
const delay = time => new Promise(resolve => setTimeout(resolve, time))
const timeout = 75

function parseImageUrl(response) {
  if (
    !response.image_uris &&
    response.card_faces &&
    response.card_faces.length > 0
  ) {
    return parseImageUrl(response.card_faces[0])
  }
  const { normal, small } = response.image_uris
  return normal || small
}

const downloadImage = async (multiverseid, url) => (await fetch(url)).buffer()

module.exports.downloadImage = downloadImage

async function getImageProperties(multiverseid) {
  const reponse = await fetch(
    `https://api.scryfall.com/cards/multiverse/${multiverseid}`,
  )
  const json = await reponse.json()
  if (reponse.status !== 200) {
    throw new Error(json.details)
  }
  const imageUrl = parseImageUrl(json)
  return { layout: json.layout, multiverseid: json.multiverse_ids, imageUrl }
}

function getImageUrl(multiverseId) {
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

module.exports.getImageUrl = getImageUrl
