
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const engineers = [
    { email: 'john@condondairy.com', password: 'password123', name: 'John Condon', role: 'admin' },
    { email: 'mike@condondairy.com', password: 'password123', name: 'Mike Ryan', role: 'engineer' },
    { email: 'sarah@condondairy.com', password: 'password123', name: 'Sarah Connor', role: 'engineer' }
];

async function seedProfiles() {
    console.log("Seeding Users & Profiles...");

    for (const eng of engineers) {
        console.log(`Creating user: ${eng.name}`);

        // 1. Sign Up (Create Auth User)
        const { data, error } = await supabase.auth.signUp({
            email: eng.email,
            password: eng.password,
        });

        if (error) {
            console.error(`Error creating auth user ${eng.email}:`, error.message);
            // Continue if user already exists
            if (!error.message.includes('already registered')) continue;
        }

        const user = data.user;
        if (!user && !error?.message.includes('already registered')) {
            console.error("No user returned.");
            continue;
        }

        // If user already exists, we can't easily get their ID without signing in.
        // So we try to signIn if signUp failed.
        let userId = user?.id;

        if (!userId) {
            console.log("User exists, signing in to get ID...");
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: eng.email,
                password: eng.password
            });
            if (signInError) {
                console.error("SignIn failed:", signInError.message);
                continue;
            }
            userId = signInData.user.id;
        }

        if (userId) {
            // 2. Upsert Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: eng.email,
                    full_name: eng.name,
                    role: eng.role
                });

            if (profileError) {
                console.error(`Error upserting profile for ${eng.name}:`, profileError.message);
            } else {
                console.log(`Profile created/updated for ${eng.name} (${userId})`);
            }
        }
    }
}

seedProfiles();
