import { createYoga, createSchema } from 'graphql-yoga'
import { typeDefs } from '@/lib/graphql/schema'
import { resolvers } from '@/lib/graphql/resolvers'
import { verifyToken } from '@/lib/auth'

const schema = createSchema({
  typeDefs,
  resolvers,
})

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  landingPage: process.env.NODE_ENV !== 'production',
  maskedErrors: process.env.NODE_ENV === 'production',
  graphiql: process.env.NODE_ENV !== 'production' ? {
    title: 'GraphQL API',
  } : false,
  context: async ({ request }) => {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const user = token ? verifyToken(token) : null
    return { user, req: request }
  },
})

export async function GET(request: Request) {
  // In production, disable GraphiQL by relying on landingPage=false
  return yoga.fetch(request)
}

export async function POST(request: Request) {
  // Naive introspection guard for production
  if (process.env.NODE_ENV === 'production') {
    try {
      const body = await request.clone().json()
      const q = typeof body?.query === 'string' ? body.query : ''
      if (q.includes('__schema') || q.includes('__type')) {
        return new Response('Forbidden', { status: 403 })
      }
    } catch {
      // ignore parse errors and let Yoga handle
    }
  }
  return yoga.fetch(request)
}


