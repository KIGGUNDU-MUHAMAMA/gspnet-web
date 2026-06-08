const url = 'https://kwssgfanbntfjdclchfi.supabase.co/rest/v1/chat_rooms?select=id&order=created_at.asc&limit=1';
const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c3NnZmFuYm50ZmpkY2xjaGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjM4ODUsImV4cCI6MjA3MDkzOTg4NX0.zPKcOwWdWu3-7ii19c2ep6g2i-kCTaUBZablTYDgZwA';

async function run() {
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': apikey,
                'Authorization': `Bearer ${apikey}`
            }
        });
        const data = await res.json();
        console.log("Room:", data);
        
        if (data.length > 0) {
            const roomId = data[0].id;
            const postRes = await fetch('https://kwssgfanbntfjdclchfi.supabase.co/rest/v1/room_posts', {
                method: 'POST',
                headers: {
                    'apikey': apikey,
                    'Authorization': `Bearer ${apikey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    room_id: roomId,
                    username: 'System Updates 🚀',
                    content: '📢 **System Update!**\n\nThe chat system and profile settings have received a major stability upgrade!\n- The system now handles users who haven\'t fully configured their profiles with advanced resilient fallbacks, so sending direct messages, flagging properties, or creating room posts will never crash.\n- New users will now see a friendly, non-intrusive reminder to set up their profiles to enhance collaboration.\n\nEnjoy the smoother experience! 🔥'
                })
            });
            console.log("Post status:", postRes.status);
        }
    } catch (e) {
        console.error(e);
    }
}
run();
