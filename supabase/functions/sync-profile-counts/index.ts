import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileCounts {
  user_id: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const doPostgresUrl = Deno.env.get('DO_POSTGRES_URL');
    if (!doPostgresUrl) {
      throw new Error('DO_POSTGRES_URL not configured');
    }

    console.log('Starting profile counts sync...');

    // Parse the connection string
    const url = new URL(doPostgresUrl);
    const host = url.hostname;
    const port = url.port || '25060';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    // Build connection string for postgres module
    const connectionString = `postgres://${username}:${password}@${host}:${port}/${database}?sslmode=require`;

    // Use fetch to call the do-query function to get and update data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all profiles
    const profilesResponse = await fetch(`${supabaseUrl}/functions/v1/do-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        query: 'SELECT user_id, followers_count, following_count, posts_count FROM profiles',
      }),
    });

    if (!profilesResponse.ok) {
      const error = await profilesResponse.text();
      throw new Error(`Failed to fetch profiles: ${error}`);
    }

    const profilesData = await profilesResponse.json();
    const profiles = profilesData.data || [];

    console.log(`Found ${profiles.length} profiles to sync`);

    let updatedCount = 0;
    const batchSize = 50;

    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      const userIds = batch.map((p: any) => p.user_id);
      const userIdsStr = userIds.map((id: string) => `'${id}'`).join(',');

      // Get followers count for each user
      const followersResponse = await fetch(`${supabaseUrl}/functions/v1/do-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          query: `SELECT following_id, COUNT(*) as count FROM follows WHERE following_id IN (${userIdsStr}) GROUP BY following_id`,
        }),
      });

      // Get following count for each user
      const followingResponse = await fetch(`${supabaseUrl}/functions/v1/do-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          query: `SELECT follower_id, COUNT(*) as count FROM follows WHERE follower_id IN (${userIdsStr}) GROUP BY follower_id`,
        }),
      });

      // Get posts count for each user
      const postsResponse = await fetch(`${supabaseUrl}/functions/v1/do-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          query: `SELECT user_id, COUNT(*) as count FROM posts WHERE user_id IN (${userIdsStr}) AND is_approved = true AND is_hidden = false GROUP BY user_id`,
        }),
      });

      const followersData = (await followersResponse.json()).data || [];
      const followingData = (await followingResponse.json()).data || [];
      const postsData = (await postsResponse.json()).data || [];

      // Build maps
      const followersMap: Record<string, number> = {};
      const followingMap: Record<string, number> = {};
      const postsMap: Record<string, number> = {};

      followersData.forEach((r: any) => {
        followersMap[r.following_id] = parseInt(r.count) || 0;
      });
      followingData.forEach((r: any) => {
        followingMap[r.follower_id] = parseInt(r.count) || 0;
      });
      postsData.forEach((r: any) => {
        postsMap[r.user_id] = parseInt(r.count) || 0;
      });

      // Update profiles that have mismatched counts
      for (const profile of batch) {
        const actualFollowers = followersMap[profile.user_id] || 0;
        const actualFollowing = followingMap[profile.user_id] || 0;
        const actualPosts = postsMap[profile.user_id] || 0;

        const currentFollowers = profile.followers_count || 0;
        const currentFollowing = profile.following_count || 0;
        const currentPosts = profile.posts_count || 0;

        // Only update if counts are different
        if (actualFollowers !== currentFollowers || 
            actualFollowing !== currentFollowing || 
            actualPosts !== currentPosts) {
          
          await fetch(`${supabaseUrl}/functions/v1/do-query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              query: `UPDATE profiles SET followers_count = ${actualFollowers}, following_count = ${actualFollowing}, posts_count = ${actualPosts} WHERE user_id = '${profile.user_id}'`,
            }),
          });

          updatedCount++;
          console.log(`Updated profile ${profile.user_id}: followers=${actualFollowers}, following=${actualFollowing}, posts=${actualPosts}`);
        }
      }
    }

    console.log(`Sync complete. Updated ${updatedCount} profiles.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${updatedCount} profiles`,
        totalProfiles: profiles.length,
        updatedProfiles: updatedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error syncing profile counts:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
