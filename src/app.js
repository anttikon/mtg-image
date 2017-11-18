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
        return reply(await merge(images))
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
