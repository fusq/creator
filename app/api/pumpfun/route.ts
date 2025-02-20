import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const totalPages = 4; // Fetching 4 pages (200 coins total)
    let allCoins = [];

    // Fetch multiple pages
    for (let page = 0; page < totalPages; page++) {
      const offset = page * 50;
      const response = await fetch(
        `https://frontend-api-v3.pump.fun/coins?offset=${offset}&limit=50&sort=last_trade_timestamp&includeNsfw=true&order=DESC`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Fetched ${data.length} coins on page ${page + 1}`);
      
      allCoins = [...allCoins, ...data];
    }

    // Remove duplicates using Set and symbol as unique identifier
    const uniqueCoins = Array.from(
      new Map(allCoins.map(coin => [coin.symbol, coin])).values()
    );

    console.log(`Total unique coins fetched: ${uniqueCoins.length}`);
    
    // Filter coins with USD market cap >= 50,000
    const filteredData = uniqueCoins.filter((coin: any) => 
      coin.usd_market_cap >= 30000
    );

    console.log(`Total filtered coins: ${filteredData.length}`);
    
    return NextResponse.json(filteredData);
    
  } catch (error) {
    console.error('Error fetching coins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coins data' },
      { status: 500 }
    );
  }
}