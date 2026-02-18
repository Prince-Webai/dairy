
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    console.log("Testing UPDATE on 'jobs' table...");

    // 1. Get a job
    const { data: jobs, error: fetchError } = await supabase
        .from('jobs')
        .select('id, status')
        .limit(1);

    if (fetchError) {
        console.error("Fetch Error:", fetchError);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log("No jobs found to test.");
        return;
    }

    const job = jobs[0];
    console.log(`Found Job: ${job.id}, Status: ${job.status}`);

    // 2. Try to update it
    const newStatus = job.status === 'scheduled' ? 'in_progress' : 'scheduled';
    const { data, error: updateError } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', job.id)
        .select();

    if (updateError) {
        console.error("UPDATE Failed:", updateError);
        console.log("Likely RLS blocking update.");
    } else {
        console.log("UPDATE Success!", data);
    }
}

testUpdate();
