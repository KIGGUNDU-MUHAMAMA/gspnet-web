const { createClient } = require('@supabase/supabase-js');
const html = require('fs').readFileSync('webmap.html', 'utf8');
const urlMatch = html.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = html.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
if(urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.from('profiles').select('id, username', { count: 'exact' }).then(res => {
    console.log('Profiles returned:', res.data ? res.data.length : 0, 'Total count:', res.count);
    if(res.data) console.log('First 10 profiles:', res.data.slice(0, 10));
    if(res.error) console.error('Error:', res.error);
  });
} else { console.log('Credentials not found'); }
