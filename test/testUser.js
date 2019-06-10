let user = require('../lib/user.js')

const randomName = getRandomInt(10000000, 99999999)
const randomEmail = getRandomInt(10000000, 99999999) + '@randmail.com'
const name = 'test'
const email = 'test@mail.com'

async function test() {
  await user.getUserID(randomName, randomEmail)
  .then( function (result) {
    if ( typeof result === 'undefined' )
      console.log('----- test success. ' )
    else
    console.log('----- test fail. testUser getUserID ID: ' + result)
  })

  await user.getUserID(name, email)
  .then( function (result) {
    console.log('testUser getUserID ID: ' + result)
  })
  
  await user
    .createNewUser(name, email)
    .then( function (result) {
      console.log('testUser createNewUser result: ' + result)
    })
    .catch( function (err) {
      console.log('testUser createNewUser err: ' + err)
    })
  
  let ID
  await user.getUserID(name, email)
    .then( function (result) {
      console.log('testUser getUserID ID: ' + result)
      ID = result
    });
  
  await user.getUserInfo(ID)
    .then( function (result) {
      console.log('testUser getUserInfo ID: ' + result.ID)
      console.log('testUser getUserInfo name: ' + result.name)
      console.log('testUser getUserInfo name: ' + result.email)
      console.log('testUser getUserInfo infoFrom: ' + result.infoFrom)
      console.log('testUser getUserInfo numberOfContractor: ' + result.numberOfContractor)
      console.log('testUser getUserInfo price1: ' + result.price1)
    });

  await testCheckStep(ID, 0)
  await testCheckStep(ID, 1)

  await user.updateStep(ID, 0, false)
    .then( function(result) {
      console.log('next step is ' + result)
    })
    .catch( function() {
      console.log('next step error: rejected')
    })
  await testCheckStep(ID, 1)
}

test()

function testCheckStep(userID, stepNumber) {
  user.checkStep(userID, stepNumber)
    .then( function(result) {
      console.log(userID + ' ' + stepNumber + ': success')
    })
    .catch( function(err) {
      console.log(userID + ' ' + stepNumber + ': fail')
    })
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}