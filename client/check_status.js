
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('issues').select('status');
    if (error) {
        console.error(error);
        return;
    }
    const counts = data.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});
    console.log('STATUS_COUNTS:', JSON.stringify(counts));
}

check();
