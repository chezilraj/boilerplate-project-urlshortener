require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
const shortid = require('shortid');
let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  long: String,
  short: String
});
const Url = mongoose.model('Url', urlSchema);
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async function(req, res) {
	const longUrl = req.body.url;
	const shortUrl = shortid.generate();
	const isValidUrl = urlString=> {
			var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
			'(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
			'(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
		return !!urlPattern.test(urlString);
	}
	console.log(isValidUrl(longUrl))
	if(isValidUrl(longUrl)){
		try {
			await Url.create({ long: longUrl, short: shortUrl });
			res.json({ original_url: longUrl, short_url: shortUrl })
	} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'Internal Server Error' });
	}
	}else{
		res.json({ error: 'invalid url' })
	}

  
});

// Route to redirect to original URL
app.get('/api/shorturl/:shortUrl', async (req, res) => {
	const shortUrl = req.params.shortUrl;

	try {
			const urlMapping = await Url.findOne({ short: shortUrl });
			if (urlMapping) {
					res.redirect(urlMapping.long);
			} else {
					res.json({ error: 'invalid url' })
			}
	} catch (err) {
			console.error(err);
			res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
