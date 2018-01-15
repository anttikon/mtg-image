import fetch from 'node-fetch'
import fs from 'fs'
import { promisify } from 'util'
import PQueue from 'p-queue'
import logger from './logger'

const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)
const existsAsync = promisify(fs.exists)

const queue = new PQueue({ concurrency: 1 })

export const imagePath = process.env.NODE_ENV === 'production' ? '/data/images' : `${__dirname}/../images`

function delay(time) {
  return new Promise((fulfill => setTimeout(fulfill, time)))
}

const timeout = 50

async function downloadImage(multiverseid, url) {
  return queue.add(async () => {
    const response = await fetch(url)
    const buffer = await response.buffer()
    await writeFileAsync(`${imagePath}/${multiverseid}.jpg`, buffer)
    await delay(timeout)
  })
}

function parseImageUrl(response) {
  if (!response.image_uris && response.card_faces && response.card_faces.length > 0) {
    return parseImageUrl(response.card_faces[0])
  }
  const { normal, small } = response.image_uris
  return normal || small
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

function getImageUrl(multiverseId) {
  return queue.add(async () => {
    const { layout, multiverseid, imageUrl } = await getImageProperties(multiverseId)
    if (!multiverseid) {
      throw new Error('Cannot find card with given multiverseid')
    }
    logger.info('getImageUrl()', multiverseId, 'got:', { layout, multiverseid, imageUrl })

    const multiverseIdIndex = multiverseid.indexOf(parseInt(multiverseId, 10))
    if (layout === 'transform' && multiverseIdIndex === 1) {
      return imageUrl.replace('a.jpg', 'b.jpg')
    }
    await delay(timeout)
    return imageUrl
  })
}

export const getImage = async (multiverseId) => {
  if (await existsAsync(`${imagePath}/${multiverseId}.jpg`)) {
    logger.info('Yey, cache hit!', multiverseId)
    return readFileAsync(`${imagePath}/${multiverseId}.jpg`)
  }
  const imageUrl = await getImageUrl(multiverseId)
  await downloadImage(multiverseId, imageUrl)
  return readFileAsync(`${imagePath}/${multiverseId}.jpg`)
}
