const { chromium } = require(‘playwright’);
const fs = require(‘fs’);
const path = require(‘path’);

async function scrapeESPNStandings() {
const browser = await chromium.launch();
const page = await browser.newPage();

```
try {
    // You'll need to replace these with your actual values
    const ESPN_USERNAME = process.env.ESPN_USERNAME;
    const ESPN_PASSWORD = process.env.ESPN_PASSWORD;
    const LEAGUE_ID = process.env.LEAGUE_ID; // Find this in your ESPN league URL
    
    console.log('Logging into ESPN...');
    
    // Go to ESPN login
    await page.goto('https://www.espn.com/login');
    
    // Wait for login form and fill it out
    await page.fill('input[placeholder="Username or Email"]', ESPN_USERNAME);
    await page.fill('input[placeholder="Password"]', ESPN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForTimeout(3000);
    
    // Navigate to your fantasy league standings
    const standingsUrl = `https://fantasy.espn.com/baseball/league/standings?leagueId=${LEAGUE_ID}`;
    await page.goto(standingsUrl);
    
    // Wait for the standings table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    console.log('Scraping standings data...');
    
    // Extract standings data
    const standingsData = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr');
        const standings = [];
        
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                // Adjust these selectors based on ESPN's actual table structure
                const teamName = cells[0]?.textContent?.trim() || '';
                const wins = cells[1]?.textContent?.trim() || '';
                const losses = cells[2]?.textContent?.trim() || '';
                const percentage = cells[3]?.textContent?.trim() || '';
                
                standings.push({
                    rank: index + 1,
                    team: teamName,
                    wins: wins,
                    losses: losses,
                    percentage: percentage,
                    date: new Date().toISOString().split('T')[0]
                });
            }
        });
        
        return standings;
    });
    
    console.log(`Found ${standingsData.length} teams`);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    
    // Save data with today's date
    const today = new Date().toISOString().split('T')[0];
    const filename = `standings-${today}.json`;
    const filepath = path.join(dataDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(standingsData, null, 2));
    console.log(`Data saved to ${filepath}`);
    
    // Also append to a master CSV file
    const csvPath = path.join(dataDir, 'all-standings.csv');
    let csvContent = '';
    
    // Add header if file doesn't exist
    if (!fs.existsSync(csvPath)) {
        csvContent = 'Date,Rank,Team,Wins,Losses,Percentage\n';
    }
    
    // Add today's data
    standingsData.forEach(team => {
        csvContent += `${team.date},${team.rank},${team.team},${team.wins},${team.losses},${team.percentage}\n`;
    });
    
    fs.appendFileSync(csvPath, csvContent);
    console.log('Data appended to master CSV');
    
} catch (error) {
    console.error('Error scraping standings:', error);
    process.exit(1);
} finally {
    await browser.close();
}
```

}

scrapeESPNStandings();
