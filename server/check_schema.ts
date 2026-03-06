
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    // We can't query information_schema directly via Supabase API usually
    // but we can try to select * and see what we get
    const { data, error } = await supabase.from('issues').select('*').limit(1);

    if (error) {
        console.error('Error fetching issue:', error);
        fs.writeFileSync('col_error.json', JSON.stringify(error, null, 2));
    } else if (data && data[0]) {
        console.log('Columns found:', Object.keys(data[0]));
        fs.writeFileSync('col_results.json', JSON.stringify(Object.keys(data[0]), null, 2));
    } else {
        console.log('No data in issues table to inspect columns.');
        // Try to insert a dummy record and catch the error to see missing columns
        const { error: insertError } = await supabase.from('issues').insert([{ title: 'Temp' }]).select();
        console.log('Insert attempt error (might show schema):', insertError);
        fs.writeFileSync('col_results.json', JSON.stringify({ insertError }, null, 2));
    }
}

checkColumns();
