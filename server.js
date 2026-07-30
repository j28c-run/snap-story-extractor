const express = require('express');
const cors = require('cors');
const path = require('path');
const { scrapeSnapchatStories } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files (HTML, CSS, JS)

// API endpoint to scrape Snapchat stories
app.post('/api/scrape', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({
            success: false,
            error: 'Username is required'
        });
    }

    // Remove @ if present
    const cleanUsername = username.replace('@', '');

    console.log(`\n[API] Received scrape request for: @${cleanUsername}`);

    try {
        const result = await scrapeSnapchatStories(cleanUsername);

        res.json({
            success: true,
            username: cleanUsername,
            data: {
                total: result.total,
                images: result.imageUrls.length,
                videos: result.videoUrls.length,
                imageUrls: result.imageUrls,
                videoUrls: result.videoUrls
            }
        });

    } catch (error) {
        console.error(`[API] Error scraping @${cleanUsername}:`, error.message);

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to scrape stories'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Snapchat Story Scraper Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser\n`);
});
