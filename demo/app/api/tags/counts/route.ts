import { NextRequest, NextResponse } from 'next/server'
import { getTagCounts } from '@/lib/content'

// GET /api/tags/counts - Get tag post counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const counts = await getTagCounts(locale || undefined)
    return NextResponse.json(counts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load tag counts' },
      { status: 500 }
    )
  }
}

