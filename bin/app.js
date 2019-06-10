const express = require('express')
const bodyParser = require('body-parser')

const app = express()
const port = 80

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

let router = require('../lib/router.js')
app.use('/', router)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))