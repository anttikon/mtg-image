import Hapi from 'hapi'
import fs from 'fs'
import { merge } from 'image-glue'
import { getImage, imagePath } from './image'
import logger from './logger'

if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath)
}

const server = new Hapi.Server()
server.connection({
  host: '0.0.0.0',
  port: 6565,
  routes: { cors: true },
})

async function mergeImages(images) {
  if (images.length === 2) {
    return merge(images, { output: { quality: 50 } })
  } else if (images.length === 3) {
    const firstMerge = await merge([images[0], images[1]], { output: { quality: 100 } })
    return merge([firstMerge, images[2]], { output: { quality: 50 } })
  }
  throw new Error('Cannot merge more than 3 images')
}

server.route({
  method: 'GET',
  path: '/api/v1/images',
  handler: async (request, reply) => {
    const { multiverseid } = request.query
    try {
      logger.info('/api/v1/images with multiverseid', multiverseid)
      if (!multiverseid) {
        return reply('multiverseid is required parameter').code(500)
      } else if (Array.isArray(multiverseid)) {
        const images = await Promise.all(multiverseid.map(id => getImage(id)))
        return reply(await mergeImages(images))
          .header('Content-Disposition', 'inline')
          .header('Content-type', 'image/jpeg')
      }
      return reply(await getImage(multiverseid))
        .header('Content-Disposition', 'inline')
        .header('Content-type', 'image/jpeg')
    } catch (e) {
      logger.error('/api/v1/images with multiverseid', multiverseid, ':', e.message)
      return reply(e.message || 'Error').code(500)
    }
  },
})

server.start((err) => {
  if (err) {
    throw err
  }
  logger.info('Server running at:', server.info.uri)
})
