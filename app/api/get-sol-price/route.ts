import { NextResponse } from 'next/server';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  console.log('GET /api/get-sol-price - Starting request');
  try {
    // Check if we have a cached price that's less than 30 minutes old
    console.log('Checking for cached SOL price in Supabase');
    const { data: cachedPrice, error: cacheError } = await supabase
      .from('sol_price')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (cacheError) {
      console.error('Error fetching cached price:', cacheError);
    }

    if (cachedPrice) {
      const cacheAge = new Date().getTime() - new Date(cachedPrice.updated_at).getTime();
      console.log(`Found cached price: $${cachedPrice.sol_price}, age: ${Math.round(cacheAge / 1000 / 60)} minutes`);
      
      if (cacheAge < 30 * 60 * 1000) {
        console.log('Using cached price (less than 30 minutes old)');
        return NextResponse.json({ price: cachedPrice.sol_price });
      } else {
        console.log('Cached price is too old, fetching new price');
      }
    } else {
      console.log('No cached price found, fetching from API');
    }

    // If no valid cache, fetch new price
    console.log('Fetching SOL price from CoinMarketCap API');
    const response = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', {
      params: {
        symbol: 'SOL'
      },
      headers: {
        'X-CMC_PRO_API_KEY': '40f30085-b734-4e3e-854f-bd76dd07cbf3'
      }
    });

    console.log('CoinMarketCap API response received');
    const solPrice = response.data.data.SOL.quote.USD.price;
    console.log(`Current SOL price: $${solPrice}`);

    // Update cache
    console.log('Updating price cache in Supabase');
    const { error: upsertError } = await supabase
      .from('sol_price')
      .upsert({ 
        sol_price: Math.round(solPrice * 100) / 100, // Round to 2 decimal places
        updated_at: new Date().toISOString() 
      });
    
    if (upsertError) {
      console.error('Error updating price cache:', upsertError);
    } else {
      console.log('Price cache updated successfully');
    }

    console.log('Returning SOL price response');
    return NextResponse.json({ price: solPrice });
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    return NextResponse.json({ error: 'Failed to fetch SOL price' }, { status: 500 });
  }
}