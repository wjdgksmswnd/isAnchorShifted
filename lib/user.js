let db = require('./db/mysqlConn.js')

let getUserID = function (name, email) {
  return new Promise( function (resolve, reject) {
    db.query('select * from userInfo '
    + 'where name = \'' + name + '\' and email = \'' + email + '\' '
    + 'order by insertedDatetime desc limit 1')
    .then( function(result) {
      if (typeof result !== 'undefined' && result && result.length > 0) {
        resolve(result[0].ID)
      }
      else {
        resolve()
      }
    })
  })
}

let createNewAmazonUser = function (name) {
  const numberOfContractor = getRandomInt(1, 6)
  const ID = getRandomInt(10000000, 99999999)
  const getInfoFrom = getRandomInt(0, 1)

  const price1 = getRandomInt(700, 720) * 10
  const price2 = getRandomInt(700, 720) * 10
  const price3 = getRandomInt(700, 720) * 10
  const price4 = getRandomInt(700, 720) * 10
  const price5 = getRandomInt(700, 720) * 10
  const price6 = getRandomInt(700, 720) * 10

  const amazonCode = getRandomInt(100000, 999999)

  let query = 'insert into userInfo set '
    + 'ID = ' + ID + ', '
    + 'name = \'' + name + '\', '
    + 'email = \'' + 'dummy@amazon.com' + '\', '
    + 'infoFrom = ' + getInfoFrom + ', '
    + 'numberOfContractor = ' + numberOfContractor + ', '
    + 'price1 = ' + price1 + ', '
    + 'price2 = ' + price2 + ', '
    + 'price3 = ' + price3 + ', '
    + 'price4 = ' + price4 + ', '
    + 'price5 = ' + price5 + ', '
    + 'price6 = ' + price6 + ', '
    + 'amazonCode = ' + amazonCode

  return new Promise( function (resolve, reject) {
    db.query(query)
    .then( function(result) {
      if (result) {
        resolve(ID)
      }
      else {
        reject()
      }
    })
  })
}

let createNewUser = function (name, email) {
  const numberOfContractor = getRandomInt(1, 6)
  const ID = getRandomInt(10000000, 99999999)
  const getInfoFrom = getRandomInt(0, 1)

  const price1 = getRandomInt(700, 720) * 10
  const price2 = getRandomInt(700, 720) * 10
  const price3 = getRandomInt(700, 720) * 10
  const price4 = getRandomInt(700, 720) * 10
  const price5 = getRandomInt(700, 720) * 10
  const price6 = getRandomInt(700, 720) * 10

  const query = 'insert into userInfo set '
    + 'ID = ' + ID + ', '
    + 'name = \'' + name + '\', '
    + 'email = \'' + email + '\', '
    + 'infoFrom = ' + getInfoFrom + ', '
    + 'numberOfContractor = ' + numberOfContractor + ', '
    + 'price1 = ' + price1 + ', '
    + 'price2 = ' + price2 + ', '
    + 'price3 = ' + price3 + ', '
    + 'price4 = ' + price4 + ', '
    + 'price5 = ' + price5 + ', '
    + 'price6 = ' + price6

  return new Promise( function (resolve, reject) {
    db.query(query)
    .then( function(result) {
      if (result) {
        resolve(result)
      }
      else {
        reject()
      }
    })
  })
}

let getUserInfo = function (ID) {
  return new Promise( function (resolve, reject) {
    db.query('select * from userInfo where ID = ' + ID + ' '
    + 'order by insertedDatetime desc limit 1')
    .then( function(result) {
      if (typeof result !== 'undefined' && result) {
        resolve(result[0])
      }
      else {
        resolve()
      }
    })
  })
}

let checkStep = function (userID, stepNumber) {
  // console.log('- enter checkStep userID: ' + userID + ' stepNumber: ' + stepNumber)
  return new Promise( function (resolve, reject) {
    getUserInfo(userID)
    .then( function (result) {
      // console.log('- checkstep - result.status: ' + result.status)
      // console.log('- checkstep - stepNumber: ' + stepNumber)
      if( result.status == stepNumber )
        resolve(true)
      else
        reject(false)
    }).catch( function() {
      reject(false)
    });
  })
}

let updateStep = function (userID, stepNumber) {
  // console.log('- update step entered - userID: ' + userID + ', stepNumber: ' + stepNumber)

  return new Promise( function (resolve, reject) {
    // console.log('- b4 calc next step ')
    calcNextStep(userID, stepNumber)
      .then( function(result) {
        // console.log('- calc next step ended - result is: ' + result)
        
        let query = 'update userInfo set ' + 'status = ' + result + ' where ID = ' + userID 

        db.query(query)
          .then( function() { resolve(result) })
          .catch( function() { reject() })
      })
      .catch( function() {
        reject()
      })
  })
}

function calcNextStep (userID, stepNumber) {
  console.log('- calc next step entered - userID: ' + userID + ', stepNumber: ' + stepNumber)
  return new Promise( function (resolve, reject) {
    getUserInfo(userID).then( function(result) {
      // TODO declined by contractor 체크
      let nextStep
      // 10 아랫 단계
      stepNumber = Number(stepNumber);
      
      let isContractAccepted = false
      let declined = false
      if( result.finally > 0 )
        isContractAccepted = true

      if( result.finally == parseInt(stepNumber/10) * -1 )
        declined = true
      
      if ( stepNumber < 3 || stepNumber == 9 )
        nextStep = stepNumber + 1

      else if ( stepNumber == 3 )
        nextStep = 9

      // 10 위에서 Accepted면 51 - 결과화면으로 jump
      else if ( isContractAccepted && stepNumber < 90 )
        nextStep = 90 + result.finally
      
      // 10 <= ~ < 90
      else if ( stepNumber >= 10 && stepNumber < 90 )
      {
        // Accepted는 위에서 처리 했음. 여기는 Declined만 처리
        if ( declined ) {
          // 최종 컨트랙터면 90 - 최종 실패로.
          if ( parseInt(stepNumber/10) == result.numberOfContractor )
            nextStep = 90
          // x9면 다음단계로
          else if (stepNumber%10 == 9)
            nextStep = stepNumber + 1
          // 아닌 경우 끝자리로9로
          else 
            nextStep = parseInt(stepNumber/10) * 10 + 9
        }

        // 끝자리 2 미만에서는 일단 다음단계로
        // 0은 설문, 1은 제안 받음, 2는 보냈음
        else if ( stepNumber%10 < 2)
          nextStep = stepNumber + 1
        
        // 끝자리 2이면
        else if ( stepNumber%10 == 2 )
        {
          // 최종 컨트랙터가 아니면 x9로
          if ( stepNumber/10 < result.numberOfContractor )
            nextStep = parseInt(stepNumber/10) * 10 + 9
          else 
            nextStep = stepNumber + 1
        }
        
        // 협상을 끝까지 주고받은 경우
        else if ( stepNumber%10 == 9 && stepNumber/10 > result.numberOfContractor )
          nextStep = 90

        // -----------> 여기부터는 3이상임
        // declined or Accepted 아님
        else
          nextStep = stepNumber + 1
      }

      // 최종결과 -> 최종설문
      else if ( stepNumber == 90 || stepNumber == 91 || stepNumber ==92 )
        nextStep = 93

      // 최종설문 -> 완료
      else if ( stepNumber == 93 )
        nextStep = 100

      else if ( stepNumber == 100 )
        // do Nothing, but not error
        nextStep = 100

      // 예상한 스텝#가 아님. error
      else
      {
        console.log('error occured while calculating next step!')
        reject()
      }

      console.log('stepNumber ' + stepNumber + '\'s nextStep is ' + nextStep)
      resolve(parseInt(nextStep))
    }).catch( function() { reject() })
  })
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

module.exports.getUserID = getUserID
module.exports.createNewUser = createNewUser
module.exports.getUserInfo = getUserInfo
module.exports.checkStep = checkStep
module.exports.updateStep = updateStep
module.exports.createNewAmazonUser = createNewAmazonUser