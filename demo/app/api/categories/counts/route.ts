import { NextRequest, NextResponse } from 'next/server'
import { getCategoryCounts } from '@/lib/content'

// GET /api/categories/counts - Get category post counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || undefined
    const counts = await getCategoryCounts(locale || undefined)
    return NextResponse.json(counts)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load category counts' },
      { status: 500 }
    )
  }
}

