
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('--- DB Check ---');
    const { data: issues, error } = await supabase.from('issues').select('id, status, user_id, title');
    if (error) {
        console.error(error);
        return;
    }

    console.log(`Total Issues: ${issues.length}`);

    const statusCounts = issues.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});
    console.log('Status Counts:', statusCounts);

    const resolvedIssues = issues.filter(i => ['closed', 'resolved', 'RESOLVED'].includes(i.status));
    console.log(`Resolved/Closed Issues: ${resolvedIssues.length}`);

    resolvedIssues.forEach(i => {
        console.log(`ID: ${i.id}, Status: ${i.status}, UserID: ${i.user_id}, Title: ${i.title}`);
    });
}

check();
