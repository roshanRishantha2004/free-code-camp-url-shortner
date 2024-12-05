const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express()

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static('public'));

// MongoDB URL schema
const urlSchema = new mongoose.Schema({
    original_url: String,
    short_url: String
});

const Url = mongoose.model('Url', urlSchema);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Database connection error:", err));

// Route to serve the homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// Generate a unique short URL
const generateShortUrl = () => {
    return Math.floor(Math.random() * 10000); // You could use UUID for more uniqueness
};

// Handle URL shortening request
app.post('/api/shorturl', async (req, res) => {
    try {
        const url = req.body.url;
        const domain = new URL(url).hostname;

        // Check if the domain is valid
        dns.lookup(domain, async (err, addresses, family) => {
            if (err) {
                return res.json({ error: 'Invalid URL' });
            }

            // Generate a unique short URL and check for collisions
            let shortUrl = generateShortUrl();
            let existingUrl = await Url.findOne({ short_url: shortUrl });
            while (existingUrl) {
                shortUrl = generateShortUrl(); // Regenerate if collision occurs
                existingUrl = await Url.findOne({ short_url: shortUrl });
            }

            const response = await Url.create({
                original_url: url,
                short_url: shortUrl
            });

            res.json({
                original_url: response.original_url,
                short_url: response.short_url
            });
        });
    } catch (err) {
        res.json({ error: 'Invalid URL' });
    }
});

// Redirect short URL to original URL
app.get('/api/shorturl/:short_url', async (req, res) => {
    try {
        const short_url = req.params.short_url;
        const response = await Url.findOne({ short_url: short_url });

        if (!response) {
            return res.json({ error: 'invalid url' });
        }

        res.redirect(response.original_url);
    } catch (err) {
        res.json({ error: 'invalid url' });
    }
});

// Start server
app.listen(3000, () => console.log('Server is listening on port 3000'));
