require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;
try {
mongoose.connect(process.env['MONGO_URI'])
  .then(() => console.log('Connected to MongoDB'))
} catch (error) {
  console.log
    ("could not connect");
  process.exit(1);
}
app.use(bodyParser.urlencoded({extended: false}))

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

//const { Schema } = mongoose;
const urlSchema = mongoose.Schema({
  original_url:{type: String, required: true, unique: true},
  short_url: {type: Number, requried: true, unique: true}
})
/*const urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number }
});*/

const theUrl = mongoose.model('theUrl', urlSchema)

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:short_url', (req, res) => {
  const short_url = req.params.short_url;
  //find original url from database
  theUrl.findOne({short_url: short_url})
    .then((foundURL) => {
      if (foundURL){
        let original_url = foundURL.original_url;
        res.redirect(original_url);
      } else {
        res.json({message: 'the short url does not exist'})
      }
    })
})

// Your first API endpoint

app.post("/api/shorturl", function(req, res) {
  let url = req.body.url
  //validate the url using url build-in module
  try{
    urlObj = new URL(url)
    dns.lookup(urlObj.hostname, (err, address, family) => {
      //if domain doesn't exist, no address is returned
      if(!address){
        res.json({error: "invalid url"})
      } 
      else{
        let original_url = urlObj.href
//check if url already exists in database
        theUrl.findOne({original_url: original_url}).then((foundURL) => {
          if(foundURL){
            res.json({
              original_url: foundURL.original_url,
              short_url: foundURL.short_url
            })
          } 
//create URL if it does'nt exist  and add it to the database            
          else {
            let short_url = 1
            //Get latest short url from database
            theUrl.find({})
            .sort({short_url: 'desc'})
            .limit(1)
            .then((latestURL) => {
              if(latestURL.length > 0){
                short_url = latestURL[0].short_url + 1
              }
              resObj = {
                original_url: original_url,
                short_url: short_url
              }
              //create an entry in the database
              let newUrl = new theUrl(resObj)
              newUrl.save()
              res.json(resObj)
            }) 
          }
        })
      }  
    })
  }
  //if the url is not valid
  catch{
    res.json({error: 'invalid url'})
  }
})

/*let resObj = {}

app.post("/api/shorturl", function(req, res) {

  let inputUrl = req.body['url']
  resObj['original_url'] = inputUrl

  let inputShort = 1
  theUrl.findOne({})
        .sort({short: 'desc'})
        .limit(1)
        .then((error, results) =>{
          if(!error && results != undefined){
            inputShort = results.short + 1
          }
          if(!error){
            theUrl.findOneAndUpdate(
              {original: inputUrl},
              {original: inputUrl, short: inputShort},
              {new: true, upsert: true},
              (error, savedUrl) => {
                if(!error){
                  resObj['short_url'] = savedUrl.short
                  res.json(resObj)
                }
              }
            )
          }
        })
});*/

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
