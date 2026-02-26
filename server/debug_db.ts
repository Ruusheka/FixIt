
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    const results: any = {};
    const { data: issues } = await supabase.from('issues').select('id, user_id, title, created_at').order('created_at', { ascending: false }).limit(5);
    results.latestIssues = issues;

    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').limit(5);
    results.profiles = profiles;

    const emailToCheck = 'ruuakilavarshini@gmail.com';
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('email', emailToCheck).single();
    results.userProfile = userProfile;

    fs.writeFileSync('db_results.json', JSON.stringify(results, null, 2));
    console.log('Results written to db_results.json');
}

checkDb();
