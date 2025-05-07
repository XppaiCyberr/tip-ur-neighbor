import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');
  
  if (!fid) {
    return NextResponse.json(
      { error: "Missing FID parameter" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://hub.pinata.cloud/v1/userNameProofsByFid?fid=${fid}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch data from Pinata: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Pinata:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Pinata" },
      { status: 500 }
    );
  }
} 