import { NextResponse } from 'next/server'
import { getConfig } from '@/lib/config'

// GET /api - API information and health check
export async function GET() {
  try {
    const config = getConfig()
    
    return NextResponse.json({
      name: 'Minimalist CMS API',
      version: '1.0.0',
      status: 'ok',
      endpoints: {
        auth: {
          login: {
            method: 'POST',
            path: '/api/auth/login',
            description: 'Authenticate user and get JWT token'
          }
        },
        posts: {
          list: {
            method: 'GET',
            path: '/api/posts',
            description: 'Get all posts',
            auth: false
          },
          create: {
            method: 'POST',
            path: '/api/posts',
            description: 'Create a new post',
            auth: true
          },
          get: {
            method: 'GET',
            path: '/api/posts/[slug]',
            description: 'Get a specific post by slug',
            auth: false
          },
          update: {
            method: 'PUT',
            path: '/api/posts/[slug]',
            description: 'Update a post by slug',
            auth: true
          },
          delete: {
            method: 'DELETE',
            path: '/api/posts/[slug]',
            description: 'Delete a post by slug',
            auth: true
          }
        },
        settings: {
          get: {
            method: 'GET',
            path: '/api/settings',
            description: 'Get site configuration',
            auth: false
          },
          update: {
            method: 'PUT',
            path: '/api/settings',
            description: 'Update site configuration',
            auth: true
          }
        },
        images: {
          list: {
            method: 'GET',
            path: '/api/images',
            description: 'Get all uploaded images',
            auth: false
          },
          upload: {
            method: 'POST',
            path: '/api/images',
            description: 'Upload a new image',
            auth: true
          },
          delete: {
            method: 'DELETE',
            path: '/api/images/[filename]',
            description: 'Delete an image by filename',
            auth: true
          }
        }
      },
      config: {
        siteTitle: config.siteTitle,
        postRoute: config.postRoute,
        pageRoute: config.pageRoute
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        name: 'Minimalist CMS API',
        version: '1.0.0',
        status: 'error',
        error: 'Failed to load API information'
      },
      { status: 500 }
    )
  }
}

