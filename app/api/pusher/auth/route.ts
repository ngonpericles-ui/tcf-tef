import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';
import jwt from 'jsonwebtoken';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '2069146',
  key: process.env.PUSHER_KEY || '110ed53534004e19ee0c',
  secret: process.env.PUSHER_SECRET || 'f9d04f656687ba318d4a',
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true
});

export async function POST(request: NextRequest) {
  try {
    let socket_id, channel_name;
    
    // Handle both JSON and form data
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      socket_id = body.socket_id;
      channel_name = body.channel_name;
    } else {
      // Handle form data
      const formData = await request.formData();
      socket_id = formData.get('socket_id') as string;
      channel_name = formData.get('channel_name') as string;
    }

    // Get auth token from cookies or headers
    const token = request.cookies.get('access_token')?.value || 
                  request.cookies.get('accessToken')?.value ||
                  request.cookies.get('token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('🚫 No auth token found for Pusher auth');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify JWT token
    let user;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tcf-tef-super-secret-jwt-key-2024-development') as any;
      user = {
        id: decoded.userId || decoded.id,
        name: `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim() || decoded.email || 'User',
        email: decoded.email
      };
    } catch (jwtError) {
      console.log('🚫 Invalid JWT token for Pusher auth:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only allow private channels for authenticated users
    if (!channel_name.startsWith('private-')) {
      console.log('🚫 Non-private channel attempted:', channel_name);
      return NextResponse.json({ error: 'Private channel required' }, { status: 403 });
    }

    // Generate auth response
    const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: user.id,
      user_info: {
        name: user.name,
        email: user.email
      }
    });

    console.log(`✅ Pusher auth successful for user: ${user.name} (${user.id})`);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('❌ Pusher auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
