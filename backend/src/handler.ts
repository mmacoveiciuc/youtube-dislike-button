import { Request, Router } from 'itty-router'
import GetVideoStats from './handlers/getVideoStats'

const router = Router()

router
  .get('/api/videos', GetVideoStats)
  .get('*', () => new Response("Not Found", { status: 404 }))

export const handleRequest = (request: Request): Response | Promise<Response> => router.handle(request)
