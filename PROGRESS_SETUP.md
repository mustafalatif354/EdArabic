# Progress Tracking Setup Guide

This guide will help you set up user progress tracking in your EdArabic application.

## Database Setup

### 1. Create the Progress Table

Run the following SQL commands in your Supabase SQL editor:

```sql
-- Create progress table for tracking user lesson progress
CREATE TABLE IF NOT EXISTS progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    progress_percentage INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Create user_profiles table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for progress table
CREATE POLICY "Users can view their own progress" ON progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for user_profiles table
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Verify Setup

After running the SQL commands, verify that:

1. The `progress` table exists with the correct structure
2. The `user_profiles` table exists
3. Row Level Security is enabled on both tables
4. The policies are created correctly

## Features Implemented

### Progress Tracking
- ✅ Automatic progress saving when users complete tests
- ✅ Progress percentage tracking (0-100%)
- ✅ Completion status tracking
- ✅ Timestamp tracking for when lessons are completed

### Homepage Display
- ✅ Overall progress bar showing completion percentage
- ✅ Individual lesson progress indicators
- ✅ Lock/unlock system (users must complete previous lessons)
- ✅ Visual progress bars for each lesson
- ✅ Statistics dashboard showing:
  - Completed lessons count
  - Average score percentage
  - Total letters learned
  - Overall progress percentage

### API Endpoints
- ✅ `GET /api/progress` - Fetch all user progress
- ✅ `POST /api/progress` - Save/update progress
- ✅ `GET /api/progress/[lessonId]` - Get specific lesson progress
- ✅ `PUT /api/progress/[lessonId]` - Update specific lesson progress

### Security
- ✅ Row Level Security (RLS) enabled
- ✅ User can only access their own progress
- ✅ Proper authentication checks in API routes

## How It Works

1. **Lesson Completion**: When a user completes a test with 70% or higher, their progress is automatically saved to the database.

2. **Progress Display**: The homepage fetches the user's progress and displays:
   - A visual progress bar
   - Individual lesson status (locked/unlocked/completed)
   - Statistics about their learning journey

3. **Lesson Unlocking**: Lessons are unlocked sequentially - users must complete lesson 1 before accessing lesson 2, etc.

4. **Progress Persistence**: All progress is stored in Supabase and persists across sessions.

## Testing

To test the progress tracking:

1. Complete a lesson test with a score above 70%
2. Check the homepage to see the progress updated
3. Verify that the next lesson becomes unlocked
4. Check the database to confirm the progress record was created

## Troubleshooting

If progress is not being saved:

1. Check browser console for errors
2. Verify Supabase connection and authentication
3. Ensure the database tables exist and have proper permissions
4. Check that RLS policies are correctly configured

The progress tracking system is now fully implemented and ready to use!
