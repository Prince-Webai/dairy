
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: Management of buckets usually requires service_role key, checking if anon works or if we need to warn user.
// Attempt with anon first, might fail RLS.

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
    } else {
        console.log('Buckets:', data);
        const invoicesBucket = data.find(b => b.id === 'invoices');
        if (!invoicesBucket) {
            console.log('Invoices bucket MISSING.');
            // implementation note: cannot create bucket with anon key usually.
        } else {
            console.log('Invoices bucket EXISTS.');
        }
    }
}

checkBuckets();
