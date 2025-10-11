import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/progress/[lessonId] - Get specific lesson progress
export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const lessonId = parseInt(params.lessonId)
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 })
    }

    const { data: progress, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    return NextResponse.json({ 
      progress: progress || { 
        completed: false, 
        lesson_id: lessonId 
      } 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/progress/[lessonId] - Update specific lesson progress
export async function PUT(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const lessonId = parseInt(params.lessonId)
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 })
    }

    const body = await request.json()
    const { completed } = body

    if (typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const progressData = {
      user_id: user.id,
      lesson_id: lessonId,
      completed
    }

    const { data, error } = await supabase
      .from('progress')
      .upsert(progressData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    return NextResponse.json({ success: true, progress: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
