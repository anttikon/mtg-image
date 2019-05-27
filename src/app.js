import Hapi from 'hapi'
import { merge } from 'image-glue'
import { getImage } from './image'

const server = Hapi.server({
  port: 6565,
  host: '0.0.0.0',
  routes: { cors: true },
})

server.start().then(() => console.log('Running!', `${server.info.uri}/api/v1/images?multiverseid=123`))

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
  handler: async (request, h) => {
    const { multiverseid } = request.query
    try {
      if (!multiverseid) {
        return {statusCode: 500}
      } else if (Array.isArray(multiverseid)) {
        const images = await Promise.all(multiverseid.map(id => getImage(id)))
        return h.response(await mergeImages(images))
          .header('Content-Disposition', 'inline')
          .header('Content-type', 'image/jpeg')
      }
      return h.response(await getImage(multiverseid))
        .header('Content-Disposition', 'inline')
        .header('Content-type', 'image/jpeg')
    } catch (e) {
      return {statusCode: 500}
    }
  },
})
