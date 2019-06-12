let mysql      = require('mysql')
// let config = mysql.createConnection({
let usualConf = require('./config/usualMysqlConf.js')

let pool = mysql.createPool(usualConf.config)
  
let query = function (sql) {
  console.log('mysql query function excuting: ' + sql)

  return new Promise( function (resolve, reject) {
    pool.getConnection( function (err, connection) {
      
      if (err) {
        console.log('get connectino has err' + err)
        // connection.release()
        reject(err)
      }

      else {
        // debug.log('connection created without err')
        // debug.log('sql is: ' + sql)
    
        connection.query(sql, function(err, rows, fields) {
          if ( !err ) {
            // console.log('connection.query has no error ')
            connection.release()
            // console.log('after release')
            // console.log(rows);
            // console.log('b4 return rows')
            resolve(rows)
          }
          else
          {
            console.log('err while querying ', sql, err);
            connection.release()
            reject(err)
          }
        })
        // console.log('out of connection.query')
        //  + ' result: ' + result)
      }
      
    })
  })
}

module.exports.query = query;