import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdGh2dWNjbWJrZGRrcGZla2llIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzgzMjI1MSwiZXhwIjoyMDUzNDA4MjUxfQ.4_pdlnM6VEJWJhgQHi2ijEp1q1M-Xqy7HB-VKSOlxGA'
);

export async function GET() {
  try {
    // Check if we have a cached price that's less than 30 minutes old
    const { data: cachedPrice } = await supabase
      .from('sol_price')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (cachedPrice && (new Date().getTime() - new Date(cachedPrice.updated_at).getTime()) < 30 * 60 * 1000) {
      return NextResponse.json({ price: cachedPrice.sol_price });
    }

    // If no valid cache, fetch new price
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      params: {
        symbol: 'SOL'
      },
      headers: {
        'X-CMC_PRO_API_KEY': '40f30085-b734-4e3e-854f-bd76dd07cbf3'
      }
    });

    const solPrice = response.data.data.SOL.quote.USD.price;

    // Update cache
    await supabase
      .from('sol_price')
      .upsert({ sol_price: solPrice, updated_at: new Date().toISOString() });

    return NextResponse.json({ price: solPrice });
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return NextResponse.json({ error: 'Failed to fetch SOL price' }, { status: 500 });
  }
}