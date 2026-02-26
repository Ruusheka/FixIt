
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
    console.log('--- Testing Join with Service Role ---');

    // 1. Get an existing user ID from profiles
    const { data: profile } = await supabase.from('profiles').select('id, email').limit(1).single();
    if (!profile) {
        console.error('No profiles found to test with.');
        return;
    }
    console.log('Testing with profile:', profile.email, profile.id);

    // 2. Create a test issue for this user
    const { data: issue, error: iErr } = await supabase.from('issues').insert({
        title: 'Join Test Report',
        description: 'Testing if identity join works with service role',
        category: 'Test',
        severity: 1,
        user_id: profile.id,
        address: 'Test System'
    }).select().single();

    if (iErr) {
        console.error('Insert Error:', iErr);
        return;
    }
    console.log('Test issue created:', issue.id);

    // 3. Try to fetch it with the join
    const { data: joined, error: jErr } = await supabase.from('issues')
        .select('*, reporter:profiles!user_id(*)')
        .eq('id', issue.id)
        .single();

    if (jErr) {
        console.error('Join Fetch Error:', jErr);
    } else {
        console.log('Successfully fetched with reporter:', joined.reporter?.full_name || joined.reporter?.email);
    }

    // Cleanup
    await supabase.from('issues').delete().eq('id', issue.id);
    console.log('Test issue cleaned up.');
}

testJoin();
