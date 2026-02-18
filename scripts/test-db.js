
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
    const tables = ['customers', 'products', 'jobs', 'job_items', 'invoices'];

    for (const table of tables) {
        console.log(`Checking table: ${table}...`);
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.error(`❌ Error accessing ${table}: ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`✅ Table ${table} exists.`);
        }
    }
}

checkTables();
