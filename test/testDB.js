let dbConn = require('../lib/db/mysqlConn.js')

let result = 'temp'
console.log(result)
console.log('hello 0')
dbConn.query('show tables')
  .then( function(result) {
    console.log(result)
  })
  .catch( function(err) {
    console.log('err on testDB ' + err)
  })
console.log('hello 1')
