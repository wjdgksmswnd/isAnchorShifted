let db = require('./db/mysqlConn.js')
let user = require('./user.js')

const AcceptablePrice = 6300

let postAnswer = function (userID, stepNumber, answers) {
  //console.log('2')
  return new Promise( function( resolve, reject) {
    //console.log('3')
    user.checkStep(userID, stepNumber)
    .then( function () {
      //console.log('4')
      if (answers.length > 0) {
        for (let i = 0; i < answers.length; i++) {
          //console.log('5')
          checkAccepted(userID, stepNumber, answers[i])
          query = 'insert into userAnswer set '
          + 'userID = ' + userID + ', '
          + 'stepNumber = ' + stepNumber + ', ';
          if( typeof(price) !== 'undefined' )
            query += 'price = ' + answers[i].price + ', '
          query += 'answer = ' + answers[i].answer
          db.query(query).then( function() {
            }).catch( function() {
              reject()
            })
        }
      }
      resolve()
    })
    .catch( function() {
      //console.log('7')
      reject()
    })
  })
}

function checkAccepted ( userID, stepNumber, answer) {
  if (answer.answer == 1)
    db.query('update userInfo set finally = 1, finalPrice = ' + answer.currentPrice + ' where ID = ' + userID)
  
  else if (answer.answer == 0)
    db.query('update userInfo set finally = ' + (parseInt(stepNumber/10) * -1) + ' where ID = ' + userID)
  
  else if (answer.answer == 2 && answer.price >= AcceptablePrice)
    db.query('update userInfo set finally = 2, finalPrice = ' + answer.price + ' where ID = ' + userID)
}

module.exports.postAnswer = postAnswer