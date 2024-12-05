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
app.use(express.json());
app.use(express.static('public'));


const urlSchema = new mongoose.Schema({
    original_url : String,
    short_url: String
});

const Url = mongoose.model('Url', urlSchema);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Database connection error:", err));



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/shorturl', async (req, res) => {
    try {
        const url = req.body.url
        console.log(url)
        const hostname = new URL(url).hostname;
        dns.lookup(hostname, async (err) => {
          if (err) {
            return res.status(400).json({ message: 'Invalid URL provided!' });
          }
          const shortUrl = Math.floor(Math.random() * 10000);
          const response = await Url.create({
            original_url: url,
            short_url: shortUrl

          });

          console.log(response)

          res.json({
            original_url: response.original_url,
            short_url: response.short_url
          });
        });
    } catch (err) {
        res.json({
            error: 'invalid url'
        })
    }
});

app.get('/api/shorturl/:short_url', async (req, res) => {
    try {
        const short_url = req.params.short_url;
        const response = await Url.findOne({ short_url: short_url });

        res.redirect(response.original_url)
    } catch(err) {
        res.json({
            error: 'invalid url'
        })
    }
})


app.listen(3000, () => console.log('Server is listening on port 3000'));