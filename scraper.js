const puppeteer = require('puppeteer');

/**
 * Scrapes Snapchat stories and extracts image URLs
 * @param {string} username - Snapchat username (without @)
 * @returns {Promise<Object>} - Object containing imageUrls, videoUrls, and total count
 */
async function scrapeSnapchatStories(username) {
    let browser;

    try {
        console.log(`[Scraper] Starting scrape for @${username}...`);

        // Launch browser
        browser = await puppeteer.launch({
            headless: false, // Set to true for production
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set viewport
        await page.setViewport({ width: 1280, height: 800 });

        // Navigate to profile
        console.log(`[Scraper] Navigating to profile...`);
        const profileUrl = `https://www.snapchat.com/@${username}`;
        await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for profile to load
        await page.waitForSelector('picture', { timeout: 10000 });
        console.log(`[Scraper] Profile loaded`);

        // Click on profile picture to open stories
        console.log(`[Scraper] Opening stories modal...`);
        const profilePicture = await page.$('picture');
        if (!profilePicture) {
            throw new Error('Profile picture not found');
        }
        await profilePicture.click();

        // Wait for stories modal to open
        await page.waitForTimeout(3000);

        // Extract media URLs from all stories
        console.log(`[Scraper] Extracting media URLs...`);
        const mediaData = await extractAllMediaURLs(page, username);

        console.log(`[Scraper] Extraction complete!`);
        console.log(`[Scraper] Total: ${mediaData.total}, Images: ${mediaData.imageUrls.length}, Videos: ${mediaData.videoUrls.length}`);

        return mediaData;

    } catch (error) {
        console.error(`[Scraper] Error: ${error.message}`);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Extracts all media URLs by navigating through stories
 * @param {Page} page - Puppeteer page object
 * @param {string} username - Username to verify we are on the correct profile
 * @returns {Promise<Object>} - Object with imageUrls and videoUrls arrays
 */
async function extractAllMediaURLs(page, username) {
    const imageUrls = [];
    const videoUrls = [];
    let snapCount = 0;
    let stuckCount = 0;
    let previousMedia = '';
    const MAX_SNAPS = 10000; // Failsafe limit

    // Extract from first snap
    await extractMediaFromCurrentSnap(page, imageUrls, videoUrls);
    snapCount++;

    // Navigate through remaining snaps
    let hasNextSnap = true;

    while (hasNextSnap && snapCount < MAX_SNAPS) {
        try {
            // Check if we are still on the correct profile using document title
            const pageTitle = await page.title();

            if (!pageTitle.toLowerCase().includes(username.toLowerCase())) {
                console.log(`[Scraper] Detected navigation to new profile (Title: ${pageTitle}). Stopping.`);
                hasNextSnap = false;
                break;
            }

            // Check if "Navigate right" button exists
            const hasRightButton = await page.evaluate(() => {
                const btn = document.querySelector('[aria-label*="Navigate right"]') ||
                    document.querySelector('button[aria-label*="right"]');
                return !!btn;
            });

            if (hasRightButton) {
                // Click using evaluate
            }

            await extractMediaFromCurrentSnap(page, imageUrls, videoUrls);
            snapCount++;

            if (snapCount % 10 === 0) {
                console.log(`[Scraper] Processed ${snapCount} snaps...`);
            }
        } else {
            hasNextSnap = false;
            console.log(`[Scraper] Reached last snap (${snapCount} total)`);
        }
    } catch (err) {
        console.error(`[Scraper] Error navigating: ${err.message}`);
        hasNextSnap = false;
    }
}

return {
    imageUrls: [...new Set(imageUrls)], // Remove duplicates
    videoUrls: [...new Set(videoUrls)], // Remove duplicates
    total: imageUrls.length + videoUrls.length
};
}

/**
 * Extracts media URLs from the current snap
 * @param {Page} page - Puppeteer page object
 * @param {Array} imageUrls - Array to store image URLs
 * @param {Array} videoUrls - Array to store video URLs
 */
async function extractMediaFromCurrentSnap(page, imageUrls, videoUrls) {
    // Extract image URLs
    const images = await page.$$eval('img[src*="cf-st.sc-cdn.net"]', imgs =>
        imgs.map(img => img.src)
            .filter(src => !src.includes('avatar') && !src.includes('bolt_web'))
    );

    // Extract video URLs
    const videos = await page.$$eval('video source[src*="cf-st.sc-cdn.net"]', sources =>
        sources.map(source => source.src)
    );

    // Add to arrays
    images.forEach(url => {
        if (!imageUrls.includes(url)) {
            imageUrls.push(url);
            console.log(`[Scraper] Found image: ${url.substring(0, 60)}...`);
        }
    });

    videos.forEach(url => {
        if (!videoUrls.includes(url)) {
            videoUrls.push(url);
            console.log(`[Scraper] Found video: ${url.substring(0, 60)}...`);
        }
    });
}

module.exports = { scrapeSnapchatStories };
