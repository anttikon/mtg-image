import Hapi from 'hapi'
import fs from 'fs'
import { merge } from 'image-glue'
import { getImage, imagePath } from './image'

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
    try {
      const { multiverseid } = request.query
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
      return reply(e || 'Error').code(500)
    }
  },
})

server.start((err) => {
  if (err) {
    throw err
  }
  console.log('Server running at:', server.info.uri)
})
