let db = require('./db/mysqlConn.js')
let user = require('./user.js')

let postSurvey = function (userID, stepNumber, surveyAnswers) {
  return new Promise( function( resolve, reject) {
    console.log('1')
    user.checkStep(userID, stepNumber)
    .then( function () {
      console.log('2')
      console.log(typeof(surveyAnswers))
      if (surveyAnswers.length > 0) {
        for (var i = 0; i < surveyAnswers.length; i++) {
          console.log('3')
          query = 'insert into surveyAnswer set '
            + 'userID = ' + userID + ', '
            + 'stepNumber = ' + stepNumber + ', '
            + 'questionID = ' + surveyAnswers[i].questionID + ', '
          
          
          console.log(typeof(surveyAnswers[i].answerSelection))
          if ( typeof(surveyAnswers[i].answerSelection) !== 'undefined' )
            query += 'answerSelection = ' + surveyAnswers[i].answerSelection + ', '
          query += 'answerText = \'' + surveyAnswers[i].answerText + '\' '
          
          console.log(query)
          db.query(query).then( function() {
            console.log('4')
            resolve()
          }).catch( function() {
            reject()
          })
          console.log('5')
        }
        console.log('6')
      }
      else
        resolve()
    })
    .catch( function() {
      reject()
    })
  })
}

module.exports.postSurvey = postSurvey