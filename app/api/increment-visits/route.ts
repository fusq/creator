import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdGh2dWNjbWJrZGRrcGZla2llIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzgzMjI1MSwiZXhwIjoyMDUzNDA4MjUxfQ.4_pdlnM6VEJWJhgQHi2ijEp1q1M-Xqy7HB-VKSOlxGA'
);

export async function POST(request: Request) {
  try {
    // Get affiliateId from URL parameters
    const { searchParams } = new URL(request.url);
    const affiliateId = searchParams.get('affiliateId');

    if (!affiliateId) {
      return NextResponse.json(
        { error: 'Affiliate ID is required' },
        { status: 400 }
      );
    }

    // Call the increment_visits RPC function
    const { error } = await supabase.rpc('increment_visits', {
      affiliate_id_param: affiliateId
    });

    if (error) {
      console.error('Error incrementing visits:', error);
      return NextResponse.json(
        { error: 'Failed to increment visits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 