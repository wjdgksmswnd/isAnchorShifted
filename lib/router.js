let fs = require('fs')

let express = require('express');
let router = express.Router();

let user = require('./user.js')
let answer = require('./answer.js')
let survey = require('./survey.js')
let db = require('./db/mysqlConn.js')

// jquery
router.get('/jquery', function(req, res) {
  res.sendFile('data/jquery/jquery-3.4.1.min.js', {root: '.'})
})

// css
router.get('/css', function(req, res) {
  res.sendFile('data/css/mainStyle.css', {root: '.'})
})

// bootstrap - css
router.get('/bootstrap', function(req, res) {
  res.sendFile('data/css/bootstrap.css', {root: '.'})
})

// 첫 페이지
router.get('/', function(req, res) {
  res.redirect('/KR')
})

// 첫 페이지 - KR
router.get('/KR', function(req, res) {
  res.sendFile('data/htmlFormat/initialPage.html', {root: '.'})
})

// 첫 페이지 - EN
router.get('/EN', function(req, res) {
  res.sendFile('data/htmlFormat/initialPage.EN.html', {root: '.'})
})

// 첫 페이지 - AMAZON
router.get('/AMAZON', function(req, res) {
  res.sendFile('data/htmlFormat/initialPage.EN.amazon.html', {root: '.'})
})

router.get('/excel/:tableName', function (req, res) {
  const tableName = req.params.tableName
  const { parse } = require('json2csv')

  let fields = []
  db.query('show columns from ' + tableName).then( function (result) { 
    for( let i = 0; i < result.length; i++) {
      fields.push( result[i].Field )
    }
    const opts = { fields }

    db.query('select * from ' + tableName).then( function( result ) {
      const csv = parse(result, opts);
      console.log(csv)
    
      // You can then return this straight
      res.attachment( tableName + '.xlsx' ); // This is sails.js specific (in general you need to set headers)

      res.set({"Content-Disposition":"attachment; filename=\"" + tableName + ".csv\""})
      return res.send( csv );

    }).catch( function() { res.status(401).send() })
  })
  .catch( function () { res.status(402).send() })
})

// user를 새로 만들거나, 기존 사용을 이어하거나.
// 여튼 첫페이지에서 이용
router.post('/user', function(req, res) {
  let userID
  const name = req.body.name
  const email = req.body.email
  user.getUserID(name, email)
    .then( async function(result) {
      if ( typeof(result) === 'undefined' )
      {
        await user.createNewUser(name, email)
        userID = await user.getUserID(name, email)
      }
      else 
        userID = result
      
      user.getUserInfo(userID)
        .then( function(result) {
          res.json(result)
        })
        .catch( function() {
          res.status(500).send()
        })
    })
    .catch( function() {
      res.status(500).send()
    })
})

// user를 새로 만들거나, 기존 사용을 이어하거나.
// 여튼 첫페이지에서 이용
router.post('/amazonUser', function(req, res) {
  const name = req.body.name

  user.createNewAmazonUser(name)
    .then( async function(userID) {
      user.getUserInfo(userID)
        .then( function(result) {
          res.json(result)
        })
        .catch( function() {
          res.status(500).send()
        })
    })
    .catch( function() {
      res.status(500).send()
    })
})

// userID가 있는 상태에서 info만 요청
router.get('/user/:userID/info', function(req, res) {
  const userID = req.params.userID
  user.getUserInfo(userID)
  .then( function(result) {
    res.json(result)
  })
  .catch( function() {
    res.ststus(500).send()
  })
})

// continue no 인 경우 이쪽으로 새 ID 발급 받음
router.get('/user/new', function(req, res) {
  const name = req.param.name
  const email = req.param.email
  user.createNewUser(name, email)
    .then( function(result) {
      res.send(result)
    })
    .catch( function() {
      res.status(500).send()
    })
})

// // 시나리오 읽어 반환. 끝
// 사용 안함. Scenario도 전부 Step으로 뺐음
// router.get('/scenario', function(req, res) {
//   const scenario = fs.readFileSync('../data/json/scenario.json')
//   res.json(scenario)
// })

// 스텝에 맞는 body 전달
router.get('/contents/:userID/:stepNumber', function(req, res) {
  const userID = req.params.userID
  const stepNumber = req.params.stepNumber

  // console.log('get contents entered ' + userID + ' ' + stepNumber + ': success')
  user.checkStep(userID, stepNumber)
    .then( function() {
      user.getUserInfo(userID)
        .then( function(result) {

        
        // console.log(userID + ' ' + stepNumber + ': success')
        let contents
        // console.log('b4 of switch')

        if (stepNumber == 0)// 계정만 만든 상태. preSurvey
          contents = fs.readFileSync('data/json/preSurvey.json')
        
        else if (stepNumber == 1) // preSurvey 완료. charactoristic survey
          contents = fs.readFileSync('data/json/charactorSurvey.json')

        else if (stepNumber == 2) // preSurvey 완료. Scenario & info check
          contents = fs.readFileSync('data/json/infoCheck.json')
            
        else if (stepNumber == 3) // 시나리오 & info check 완료. after info check survey
          contents = fs.readFileSync('data/json/afterInfoCheck.json')

        else if (stepNumber == 9) // 사전설문 완료. 1단계 시작 전, 최초 1회 Survey
          contents = fs.readFileSync('data/json/midFirstSurvey.json')
          
        else if (stepNumber == 90) // 협상 실패 
          contents = fs.readFileSync('data/json/breakOffInTheEnd.json')
        
        else if (stepNumber == 91) // 협상 성공
          contents = fs.readFileSync('data/json/contractMadeUpInTheEnd.json')

        else if (stepNumber == 92) // 협상 성공 2
          contents = fs.readFileSync('data/json/contractMadeUpAfterWaitingResponse.json')
      
        else if (stepNumber == 93) { // postSurvey
          if( result.finally > 0 ){
            console.log('22222')
            contents = fs.readFileSync('data/json/postSurveyPositive.json')
            console.log('33333')
          }
            
          else{
            console.log('44444')
            contents = fs.readFileSync('data/json/postSurveyNegotive.json')
            console.log('55555')
            console.log(contents)
          }
        }
        
        else if (stepNumber == 100) // 전부 종료
          contents = fs.readFileSync('data/json/endUp.json') 
          
        else if (stepNumber == 10) // 1단계 최초 1회 Survey 완료
          contents = fs.readFileSync('data/json/midSurvey10.json')

        else if (stepNumber == 20) // 2단계 최초 1회 Survey 완료
          contents = fs.readFileSync('data/json/midSurvey20.json')

        else if (stepNumber == 30) // 3단계 최초 1회 Survey 완료
          contents = fs.readFileSync('data/json/midSurvey30.json')

        else if (stepNumber == 40) // 4단계 최초 1회 Survey 완료
          contents = fs.readFileSync('data/json/midSurvey40.json')

        else if (stepNumber == 50) // 5단계 최초 1회 Survey 완료
          contents = fs.readFileSync('data/json/midSurvey40.json')

        else if (stepNumber == 60) // 6단계 최초 1회 Survey 완료
          contents = fs.readFileSync('data/json/midSurvey40.json')
          
        else if (stepNumber == 11) // 1단계 매번 나오는 Survey 완료. 1단계 제안 
          contents = fs.readFileSync('data/json/offer11.json')
          
        else if (stepNumber == 21) // 2단계 매번 나오는 Survey 완료. 1단계 제안 
          contents = fs.readFileSync('data/json/offer21.json')
          
        else if (stepNumber == 31) // 3단계 매번 나오는 Survey 완료. 1단계 제안 
          contents = fs.readFileSync('data/json/offer31.json')
        
        else if (stepNumber == 41) // 4단계 매번 나오는 Survey 완료. 1단계 제안 
          contents = fs.readFileSync('data/json/offer41.json')
          
        else if (stepNumber == 51) // 5단계 매번 나오는 Survey 완료. 1단계 제안 
          contents = fs.readFileSync('data/json/offer31.json')
        
        else if (stepNumber == 61) // 6단계 매번 나오는 Survey 완료. 1단계 제안 
          contents = fs.readFileSync('data/json/offer41.json')
          
        else if (stepNumber % 10 == 2 || stepNumber % 10 == 4 
          || stepNumber % 10 == 6 || stepNumber % 10 == 8 )
            // 보내고 기다림
          contents = fs.readFileSync('data/json/waitingFor.json')
          
        else if (stepNumber % 10 == 3) // 2단계 제안
          contents = fs.readFileSync('data/json/offerx3.json')
          
        else if (stepNumber % 10 == 5) // 3단계 제안
          contents = fs.readFileSync('data/json/offerx5.json')
          
        else if (stepNumber % 10 == 7) // 4단계 제안
          contents = fs.readFileSync('data/json/offerx7.json')

        else if (stepNumber % 10 == 9) // 협상 실패
          contents = fs.readFileSync('data/json/breakOffButContinue.json')  
        
        else {
          console.log('unexpected stepNumber in get Contents')
          res.status(500).send()
        }

        if( typeof(contents) === 'undefined' )
          res.status(500).send()
        else
          res.json(JSON.parse(contents))
      })
      .catch( function() { res.status(500).send() })
    })
    .catch( function(err) {
      console.log('!! check step in get contents catched! ' + userID + ' ' + stepNumber + ': fail')
      res.status(500).send()
    })
})

router.post('/survey/:userID/:stepNumber', function(req, res) {
  const userID = req.params.userID
  const stepNumber = req.params.stepNumber
  const data = req.body

  user.checkStep(userID, stepNumber)
    .then( function(result) {
      survey.postSurvey(userID, stepNumber, req.body)
      .then( function(result) { res.status(200).send() })
      .catch( function() { res.status(500).send() })
    })
    .catch( function() { res.status(500).send() })
})

router.post('/answer/:userID/:stepNumber', function(req, res) {
  const userID = req.params.userID 
  const stepNumber = req.params.stepNumber
  console.log('1')
  user.checkStep(userID, stepNumber)
  .then( function(result) {
    console.log(req.body)
    answer.postAnswer(userID, stepNumber, req.body)
    .then( function(result) { res.status(200).send() })
    .catch( function() { res.status(500).send() })
  })
  .catch( function() { res.status(500).send() })
})

// stupNumber( = status ) update만
router.get('/updateStep/:userID/:stepNumber', function(req, res) {
  const userID = req.params.userID 
  const stepNumber = req.params.stepNumber

  user.checkStep(userID, stepNumber)
    .then( function(result) {
      // console.log('- checkStep success, b4 updateStep ');
      user.updateStep(userID, stepNumber)
        .then( function(result) {
          //TODO Accepted랑 declined 처리해야함
          console.log('updateStep in checkstep in post updatestep successed!!' + result)
          res.json(JSON.parse('{"stepNumber" : ' + result + "}"));
        })
        .catch( function() { 
          console.log('!! updateStep in checkstep in post updatestep failed 1') 
          res.status(500).send() 
        })
    })
    .catch( function() { 
      console.log('!! updateStep in checkstep in post updatestep failed 2') 
      res.status(500).send() 
    })
})

router.get('/simulation/:userID', function(req, res) {
  console.log('/simulation/'+req.params.userID+'/KR')
  res.redirect('/simulation/'+req.params.userID+'/KR')
})

router.get('/simulation/:userID/:language', function(req, res) {
  const userID = req.params.userID
  let language = req.params.language
  if (typeof(language) === 'undefined')
    language = 'KR'

  user.getUserInfo(userID)
    .then( function (result) {
      let bodyText = '<head>\n'
            + '<link rel="stylesheet" href="/bootstrap">'
            + '<link rel="stylesheet" href="/css">'
            + '<script src=\'/jquery\'></script>\n'
            + '<script>\n'
            + 'var userID = ' + result.ID + ';\n'
            + 'var stepNumber = ' + result.status + ';\n'
            + 'var infoFrom = ' + result.infoFrom + ';\n'
            // + 'var infoFromText = {"KR": ["인터넷", "전문가"], "EN": [;\n'
            // + 'var infoFromText2 = {"KR": ["인터넷에서", "전문가에게서"], "EN": ["on the internet?", "from an expert?]};\n'
            + 'var numberOfContractor = ' + result.numberOfContractor + ';\n'
            + 'var prices = [' + result.price1 + ', ' + result.price2 + ', ' + result.price3 + ', ' + result.price4 + '];\n'
            + 'var finalPrice;\n'
            + 'var language = \'' + language + '\';\n'
            + 'var liker7 = {"KR": ["매우 부정적", "부정적", "다소 부정적", "보통", "다소 긍정적", "긍정적", "매우 긍정적"], '
            +              ' "EN": ["Very negative", "Negative", "Somewhat negative", "Neither negative nor positive", "Somewhat positive", "Positive", "Very positive"]}; \n'
            + 'var liker5 = {"KR": ["매우 부정적", "다소 부정적", "보통", "다소 긍정적", "매우 긍정적"], '
            +              ' "EN": ["Disagree strongly", "Disagree a little", "Neither agree nor disagree", "Agree a little", "Agree strongly"]}; \n'
            + 'var waitingMent = {"KR": "상대 대답을 기다립니다.", "EN": "Wating for response"};\n'
            + 'var waitOverMent = {"KR": "상대 결과가 도착했습니다.", "EN": "You got response!"};\n'
            + 'var body = new Array;\n'
            + 'var surveyAnswers = new Array;\n'
            + 'var offerAnswers = new Array;\n'
            + 'var warningNotSelectedMessage = {"KR": "모든 항목에 답해주세요.", "EN": "Please answer all quesions."}; \n'
            + 'var monetaryUnit = {"KR": "만원", "EN": "dollars"};\n'
            + 'var submitAreaText = {"KR" : "다음", "EN": "NEXT"};\n'
            + 'var amazonCode = ' + result.amazonCode + '; \n'

            + '  function getContents () {\n'
            + '    var jsonObj;\n'
            + '    $.ajax({\n'
            + '      type: "GET",\n'
            + '      url: "/contents/" + userID + "/" + stepNumber,\n'
            + '      async: false,\n'
            + '      success: function (jsonText) {\n'
            // + '        console.log( jsonText );\n'
            + '        jsonObj = jsonText;\n'
            + '      },\n'
            + '      fail: function () {\n'
            + '        alert(\'get contents fail with userID: \' + userID + \', stepNumber: \' + stepNumber);\n'
            + '      }\n'
            + '    });\n'
            + '    return jsonObj;\n'
            + '  }\n'

            + '  function parseContents () {\n'
            + '    var obj = getContents();\n'
            + '    console.log(obj);\n'
            // + '    var obj = jQuery.parseJSON(obj);\n'
            // + '    console.log(obj);\n'

            + '    body = new Array;\n'
            + '    for (var i = 0; i < obj.length; i++) {\n'
            + '      console.log(obj[i].type);\n'
            + '      if (obj[i].type == \'survey\' ) \n'
            + '      {\n'
            + '        var surveyQuestions = obj[i].data;\n'
            + '        var text = "";\n'
            + '        for (var p = 0; p < surveyQuestions.length; p++) {\n'
            + '          text += \n'
            + '            "<div class = \'surveyQuestion\' id = \'survey\' questionID = \'" + surveyQuestions[p].number + "\' type = \'" + surveyQuestions[p].type + "\'>"\n'
            + '            + "<div class = \'question\'>";\n'
            + '          text += surveyQuestions[p].number + ". ";\n'
            // + ' console.log(typeof(surveyQuestions[p]));\n'
            // + ' console.log(surveyQuestions[p]);\n'
      
            + '          if ( surveyQuestions[p].question.length > 1 ) \n'
            + '            text += surveyQuestions[p].question[infoFrom][language]; \n'
            + '          else\n'
            + '            text += surveyQuestions[p].question[language];\n'
            + '          text += "</div>" // /question\n'
            
            + '          text += "<div class = \'answer\'>";\n'
            // + '          console.log(surveyQuestions[p].type);\n'
                      // 7 liker scale
            + '          if (surveyQuestions[p].type == \'7 liker scale\')\n'
            + '          {\n'
            + '            text +=\n'
            + '                "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'1\'>" + liker7[language][0] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'2\'>" + liker7[language][1] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'3\'>" + liker7[language][2] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'4\'>" + liker7[language][3] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'5\'>" + liker7[language][4] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'6\'>" + liker7[language][5] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'7\'>" + liker7[language][6] + "</div>";\n'
            + '          }\n'

            // 5 liker scale
            + '          if (surveyQuestions[p].type == \'5 liker scale\')\n'
            + '          {\n'
            + '            text +=\n'
            + '                "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'1\'>" + liker5[language][0] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'2\'>" + liker5[language][1] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'3\'>" + liker5[language][2] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'4\'>" + liker5[language][3] + "</div>"\n'
            + '              + "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'5\'>" + liker5[language][4] + "</div>"\n'
            + '          }\n'

                      // selection인데, 기타가 있네... ㅠ
            + '          else if (surveyQuestions[p].type == \'selection\')\n'
            + '          {\n'
            // + '            console.log(\'in the selection \');\n'
            // + '            console.log(surveyQuestions[p].contents);\n'
            
            + '            var options = surveyQuestions[p].contents;\n'
            // + '            console.log("options length = " + options.length);\n'
            + '            for (var ii = 0; ii < options.length; ii++) { \n'
            // + '             console.log("in the options for loop");\n'
            // + '             console.log("ii: " + ii);\n'
            // + '             console.log("" + p +"" + ii + "" + options[ii].type);\n'
            + '              if (options[ii].type == \'selection\'){\n'
            + '                text \n'
            + '                  += "<div class = \'selectOption\'><input type=\'radio\' name=\'" + p + "\' value=\'" + (ii+1) + "\'>"\n'
            + '                  + options[ii].text[language] + "</div>";\n'
            + '              }\n'
            + '              else if (options[ii].type == \'selection with text input\'){\n'
            + '                text \n'
            + '                  += "<div class = \'selectOption\'><input type=\'radio\' id = \'" + i + "-" + p + "-" + ii + "\' name=\'" + p + "\' value=\'" + (ii+1) + "\' hasSubTextInput=true>"\n'
            + '                  + options[ii].text[language]\n'
            + '                  + "<input type=\'text\' id = \'" + i + "-" + p + "-" + ii + "\' name=\'" + p  + "\' disabled = true></div>";\n'
            + '              }\n'
            + '              else\n'
            + '              {\n'
            + '                alert(\'unexpected type in selection\');\n'
            + '                console.log(options[ii].type)\n'
            + '              }\n'
            + '            }\n'
            + '          }\n'
            
                      // ~~대학 ~~과, ~~세
            + '          else if (surveyQuestions[p].type == \'input box with text\')\n'
            + '          {\n'
            + '            for (var o = 0; o < surveyQuestions[p].contents.length; o++) \n'
            + '            {\n'
            + '              if (surveyQuestions[p].contents[o].type == \'text\'){\n'
            + '                text += surveyQuestions[p].contents[o].text[language];\n'
            + '              }\n'
            + '              else if (surveyQuestions[p].contents[o].type == \'input box\'){\n'
            + '                text += "<input type=\'text\' name=\'" + p + "\'>";\n'
            + '              }\n'
            + '              else\n'
            + '              {\n'
            + '                alert(\'unexpected type in input box with text\');\n'
            + '                console.log(surveyQuestions[p].contents[o].type)\n'
            + '              }\n'
            + '            }\n'
            + '          }\n'

            + '          else if ( obj[i].data[p].type == \'text\' )\n'
            + '            text += obj[i].data[p].contents[language];\n'

            + '          else if ( obj[i].data[p].type == \'text/optional\' )\n'
            + '            text += obj[i].data[p].contents[infoFrom][language];\n'

            + '          else\n'
            + '          {\n'
            + '            alert(\'unknown question type error\');\n'
            + '            console.log(surveyQuestions[p].type);\n'
            + '          }\n'
            
            + '          text += "</div>"; // /answer\n'
            + '          text += "</div>"; // /surveyQuestion\n'
            + '        }\n'
            + '        body.push(text);\n'
            + '      }\n'
            + '      else if (obj[i].type == \'scenario\')\n'
            + '      {\n'
            + '        var text = "";\n'
            + '        for( var p = 0; p < obj[i].data.length; p++) {\n'          

            + '          if ( obj[i].data[p].type == \'text\' )\n'
            + '            text += obj[i].data[p].contents[language];\n'

            + '          else if ( obj[i].data[p].type == \'text/optional\' )\n'
            + '            text += obj[i].data[p].contents[infoFrom][language];\n'

            + '          else if ( obj[i].data[p].type == \'price\' )\n'
            + '          {\n'
            // + '            console.log(obj[i].data[p].discount); \n'
            // + '            console.log(prices); \n'
            // + '            console.log((stepNumber/10) - 1 ); \n'
            // + '            console.log(prices[ parseInt(stepNumber/10) - 1 ]); \n'
            + '            if ( stepNumber == 9 ) { \n'
            + '              if ( language == "EN" ) \n'
            + '                text += prices[ 0 ] * 10;\n'
            + '              else if ( language == "KR" ) \n'
            + '                text += prices[ 0 ];\n'
            + '            } \n'

            + '            else if ( typeof(obj[i].data[p].discount) !== \'undefined\') { \n'
            + '              if ( language == "EN" ) \n'
            + '                text += prices[ parseInt(stepNumber/10) - 1 ] * (100 - obj[i].data[p].discount) / 10 ;\n'
            + '              else if ( language == "KR" ) \n'
            + '                text += prices[ parseInt(stepNumber/10) - 1 ] * (100 - obj[i].data[p].discount) / 100 ;\n'
            + '            } \n'

            + '            else { \n'
            + '              if ( language == "EN" ) \n'
            + '                text += prices[ parseInt(stepNumber/10) - 1 ] * 10 ;\n'
            + '              else if ( language == "KR" ) \n'
            + '                text += prices[ parseInt(stepNumber/10) - 1 ] ;\n'
            + '            } \n'
            
            + '          }\n'

            + '          else if ( obj[i].data[p].type == \'waiting\' )\n'
            + '          {\n'
            // + '            console.log(obj[i].data[p].duration); \n'
            + '            text += \'<div id="waiting" duration=\' + obj[i].data[p].duration + \'>\' \n'
            + '              + \'</div>\'; \n'
            + '          }\n'

            + '          else if ( obj[i].data[p].type == \'number of contractor\' )\n'
            + '          {\n'
            + '            text += numberOfContractor; \n'
            + '            if ( numberOfContractor == 1 ) \n'
            + '              text += \'company\';\n'
            + '            else \n'
            + '              text += \'companies\';\n'
            + '          }\n'

            + '          else if ( obj[i].data[p].type == \'final price\' )\n'
            + '            text += finalPrice; \n'

            + '          else if ( obj[i].data[p].type == \'amazonCode\' )\n'
            + '            text += "</br>CODE: " + amazonCode;\n'

            + '        }\n'
            + '        body.push(text);\n'
            + '      }\n'
            + '      else if (obj[i].type == \'offer\')\n'
            + '      {\n'
            + '        var text = "<div class=\'offerText\'>";\n'
            + '        var currentPrice;\n'
            + '        for( var p = 0; p < obj[i].data.length; p++) {\n'
            + '          if ( obj[i].data[p].type == \'text\' )\n'
            + '            text += obj[i].data[p].contents[language];\n'
            + '          else if ( obj[i].data[p].type == \'text/optional\' )\n'
            + '            text += obj[i].data[p].contents[infoFrom][language];\n'
            + '          else if ( obj[i].data[p].type == \'price\' )\n'
            + '          {\n'
            + '            if ( typeof(obj[i].data[p].discount) !== \'undefined\') { \n'
            + '              if ( language == "EN" ) \n'
            + '                currentPrice = prices[ parseInt(stepNumber/10) - 1 ] * (100 - obj[i].data[p].discount) / 10 ;\n'
            + '              else if ( language == "KR" ) \n'
            + '                currentPrice = prices[ parseInt(stepNumber/10) - 1 ] * (100 - obj[i].data[p].discount) / 100 ;\n'
            + '            } \n'
            + '            else { \n'
            + '              if ( language == "EN" ) \n'
            + '                currentPrice = prices[ parseInt(stepNumber/10) - 1 ] * 10 ;\n' 
            + '              else if ( language == "KR" ) \n'
            + '                currentPrice = prices[ parseInt(stepNumber/10) - 1 ] ;\n' 
            + '            } \n'
            + '            text += currentPrice;\n'
            + '          }\n'
            + '        }\n'
            + '        text += "</div>"; \n'
            + '        text += \'<div class = "answer" id = "offerAnswer" currentPrice = \' + currentPrice + \'>\' \n'
            + '          + \'<div class = "offerOption"><input type="radio" name = "offerAnswer" value=1> Accept</div>\'; \n'

            + '        if (stepNumber % 10 == 7) \n'
            + '          text += \'<div class = "offerOption"><input type="radio" name = "offerAnswer" value=2 disabled> Suggest\' \n'
            + '               + \'<input type="text"  name = "offerAnswer" disabled> \' + monetaryUnit[language] + \'</div>\'; \n'
            
            + '        else \n'
            + '          text += \'<div class = "offerOption"><input type="radio" name = "offerAnswer" value=2> Suggest\' \n'
            + '               + \'<input type="text"  name = "offerAnswer"> \' + monetaryUnit[language] + \'</div>\'; \n'

            + '          text += \'<div class = "offerOption"><input type="radio" name = "offerAnswer" value=0> Decline</div>\' ; \n'
            + '        body.push(text);\n'
            + '      }\n'
            + '    }\n'
            + '  }\n'
            
            + ' function doWaiting () {\n'
            + '    var waitingDiv = $("div#waiting");\n'
            // + '  console.log(waitingDiv);\n'
            + '    if (waitingDiv.length > 0) { \n'
            // + '      for ( var i = 0; i < waitingDiv.length; i++ ) { \n'
            + '      var duration = waitingDiv.attr("duration"); \n'
            + '      if ( stepNumber != 1 )'
            + '        waitingDiv.html(waitingMent[language]); \n'
            + '      $("div#submitArea").hide(); \n'
            + '      setTimeout( function() { \n'
            + '        if ( stepNumber != 1 ) \n'
            + '          waitingDiv.html("</br></br>" + waitOverMent[language]); \n'
            + '        $("div#submitArea").show(); \n'
            + '      }, duration * 1000); \n'
            // + '      }\n'
            + '    }\n'
            + '  }\n'

            + ' function disabledControl () { \n'
            + '   $("input:radio[hasSubTextInput=true]").each( function (radioObj) { \n'
            // + 'console.log("11 this");\n'
            // + 'console.log( $( this ) );\n'

            + '     var thisID = $( this ).attr("id"); \n'
            // + 'console.log( "thisID" ); \n'
            // + 'console.log( thisID ); \n'

            + '     var nextTextBox = $( this ).next("input:text#" + thisID); \n'
            // + 'console.log("nextTextBox"); \n'
            // + 'console.log(nextTextBox); \n'

            + '     var radioName = $( this ).attr("name"); \n'
            // + 'console.log("radioName"); \n'
            // + 'console.log(radioName); \n'

            + '     $("input:radio[name=\'"+radioName+"\']").click( function () { \n'
            + '       nextTextBox.attr("disabled", true);\n'
            + '     }); \n'
            + '     $( this ).click( function () { \n'
            // + 'console.log("in the on change function");'
            + '       var thisSelected = $( this ).is(":checked"); \n'
            // + 'console.log("thisSelected"); \n'
            // + 'console.log(thisSelected); \n'
            + '       $( this ).siblings("input:text#" + thisID).each( function() { \n'
            + '         $( this ).attr("disabled", !thisSelected); \n'
            + '       }); \n'
            + '     }); \n'
            + '   }); \n'
            + ' } \n'
            
            + ' function disableNextDiv () { \n'
            + '   if ( stepNumber == 100 ) \n'
            + '     $("div#submitArea").hide(); \n'

            + '   else \n'
            + '     $("div#submitArea").show(); \n'

            + ' } \n'

            + ' function fillContents () {\n'
            + '    if (body.length == 0)\n'
            + '      parseContents();\n'
            + '    thisBodyContents = body[0];\n'
            + '    $( "div#questionArea" ).html(thisBodyContents);\n'
            + '    body.shift();\n'
            + '    disabledControl();\n'
            + '    disableNextDiv();\n'
            + '    doWaiting();\n'
            + '  }\n'
            
            + '  function parseSurvey () {\n'
            + '    var isAlerted = false; \n'
            + '    var messageNotSelected = false; \n'
            + '    var surveyAnswersThisTime = new Array;'

            + '    $("div.surveyQuestion").each( function(index) {\n'
            + '      var answerSelectedNumber = $( this ).find(\'input:radio:checked\').val();\n'

            + '      if ( typeof(answerSelectedNumber) === \'undefined\' && \n'
            + '           ( $( this ).attr("type") == "7 liker scale" || $( this ).attr("type") == "5 liker scale" || $( this ).attr("type") == "selection" )) { \n'
            + '        messageNotSelected = true; \n'
            + '        $( this ).css("border", "1px solid red"); \n'
            + '      } \n'

            // + '      if ( stepNumber == 1 && answerSelectedNumber != infoFrom + 1 ) { \n'
            // + '        var warningMessage = {"KR": "지문을 다시 잘 읽어주세요.", "EN": "Please read carefully once again."}; \n'
            // + '        alert(warningMessage[language]); \n'
            // + '        window.location.reload(); \n'
            // + '        isAlerted = true; \n'
            // + '      } \n'

            + '      var answerText = ""; \n'
            + '      var inputTexts = $( this ).find("input:text"); \n'
            
            + '      $( this ).find("input:text").each( function( eachInputBox ) { \n'
            // + 'console.log("111");'
            // + 'console.log($( this ).attr("disabled"));'
            // + 'console.log($( this ).attr("disabled") == undefined);'
            + '        if( $( this ).attr("disabled") == undefined || $( this ).attr("disabled") == false ) { \n'
            // + 'console.log("222");'
            // + 'console.log($( this ).val().length);'
            + '          if( $( this ).val().length == 0 ) { \n'
            + '            messageNotSelected = true; \n'
            + '            $( this ).css("border", "1px solid red"); \n'
            + '          } \n'
            + '          answerText += "||" + $( this ).val(); \n'
            + '        } \n'
            + '      }); \n'
                  
            + '      if (answerText.length > 0)\n'
            + '        answerText = answerText.substring(2, answerText.length);\n'
                  
            + '      var objString = \'{\' \n'
            + '        + \'"userID" : "\' + userID + \'", \' \n'
            + '        + \'"stepNumber" : "\' + stepNumber + \'", \'\n'
            + '        + \'"questionID" : "\' + $( this ).attr("questionID") + \'", \'; \n'
            + '      if (typeof(answerSelectedNumber) !== "undefined") \n '
            + '        objString += \'"answerSelection" : "\' + answerSelectedNumber + \'", \' \n'
            + '        objString += \'"answerText" : "\' + answerText + \'" \' \n'
            + '      +  "}";\n'

            + '        surveyAnswersThisTime.push( JSON.parse( objString ) ); \n'
            + '    });\n'
            + '    console.log( "surveyAnswersThisTime" ); \n'
            + '    console.log( surveyAnswersThisTime ); \n'

            + '    if (messageNotSelected) \n'
            + '      alert(warningNotSelectedMessage[language]); \n'

            + '    if ( isAlerted || messageNotSelected ) \n'
            + '      return true; \n'

            + '    surveyAnswers = surveyAnswers.concat( surveyAnswersThisTime ); \n'
            + 'console.log( "surveyAnswers" );\n'
            + 'console.log( surveyAnswers );\n'
            + '    return false; \n'
            + '  }\n'
            
            + '  function parseAnswer () {\n'
            + '    var notChecked = false; \n'
            + '    var notInserted = false; \n'
            + '    var answerThisTime = new Array; \n'

            + '    $("div#offerAnswer").each( function(index) {\n'
            + '      var answerSelection = $("div#offerAnswer").find(\'input:radio:checked\').val();\n'

            + '      if ( typeof(answerSelection) === "undefined") { \n'
            + '        notChecked = true; \n'
            + '        $("div#offerAnswer").css("border", "1px solid red"); \n'
            + '      } \n'

            + '      var objString = \'{\' \n'
            + '        + \'"userID" : "\' + userID + \'", \' \n'
            + '        + \'"stepNumber" : "\' + stepNumber + \'", \' \n'
            + '        + \'"currentPrice" : "\' + $("div#offerAnswer").attr("currentPrice") + \'", \' ;\n'
            + '      finalPrice = $("div#offerAnswer").attr("currentPrice"); \n'

            + '      if( answerSelection == 2 ) { \n'
            + '        if( $("div#offerAnswer").find(\'input:text\').val().length == 0 ) { \n'
            + '          notInserted = true; \n'
            + '          $("div#offerAnswer").find(\'input:text\').css("border", "1px solid red"); \n'
            + '        } \n'
            
            + '        var priceTemp = $("div#offerAnswer").find(\'input:text\').val(); \n'
            + '        if ( language == "EN" ) \n'
            + '          priceTemp = priceTemp/10; \n'

            + '        objString += \'"price" : "\' + priceTemp + \'", \'; \n'
            + '        finalPrice = $("div#offerAnswer").find(\'input:text\').val(); \n'
            + '      }\n'

            + '      objString += \'"answer" : "\' + answerSelection + \'" \' \n'  
            + '        +  "}";\n'
  
            + '      console.log(objString);\n'
            + '      answerThisTime.push( JSON.parse( objString ) );\n'
            + '    });\n'

            + '    if ( notChecked ) \n'
            + '      alert( warningNotSelectedMessage[language] ); \n'

            + '    if ( notInserted ) \n'
            + '      alert( warningNotSelectedMessage[language] ); \n'

            + '    if ( notChecked || notInserted ) \n'
            + '      return true; \n'

            + '    offerAnswers = offerAnswers.concat( answerThisTime ); \n'
            + '  }\n'
            
            + '  function doPost (contentsType, data) {\n'
            + '    console.log(data);\n'
            + '    console.log(JSON.stringify(data));\n'
            + '    $.ajax({\n'
            + '      type: "POST",\n'
            + '      url: "/" + contentsType + "/" + userID + "/" + stepNumber,\n'
            + '      async: false,\n'
            + '      contentType: "application/json",\n'
            // + '      dataType: "json",\n'
            + '      data: JSON.stringify(data),\n'
            + '      success: function (jsonText) {\n'
            + '        return jsonText;\n'
            + '      },\n'
            + '      fail: function () {\n'
            + '        alert(\'get contents fail with \'\n'
            + '          + \'contentsType: \' + contentsType + \', userID: \' + userID + \', stepNumber: \' + stepNumber);\n'
            + '      }\n'
            + '    });\n'
            + '  }\n'
            
            + '  async function postSurvey () {\n'
            + '    if (surveyAnswers.length > 0)\n'
            + '      await doPost("survey", surveyAnswers);\n'
            + '  }\n'
            
            + '  async function postAnswer () {\n'
            // + '    console.log(offerAnswers);\n'
            + '    if (offerAnswers.length > 0)\n'
            + '      await doPost("answer", offerAnswers);\n'
            + '  }\n'

            + '  async function updateStep() { \n'
            + '    $.ajax({ \n'
            + '      type: "GET",\n'
            + '      url: "/updateStep/" + userID + "/" + stepNumber,\n'
            + '      async: false,\n'
            + '      success: function (result) { \n'
            + '        stepNumber = result.stepNumber; \n'
            + '        console.log(result);\n'
            + '        console.log(stepNumber);\n'
            + '      },\n'
            + '      fail: function () {\n'
            + '        alert(\'get contents fail with \'\n'
            + '          + \'contentsType: \' + contentsType + \', userID: \' + userID + \', stepNumber: \' + stepNumber);\n'
            + '      }\n'
            + '    });\n'
            + '  }'

            + '  async function doNext(userID) {\n'
            + '    var isAlerted = parseSurvey(); \n'
            // + '    console.log("isAlerted: " + isAlerted); \n'
            + '    if (isAlerted) \n'
            + '      return; \n'

            + '    isAlerted = parseAnswer(); \n'
            + '    if (isAlerted) \n'
            + '      return; \n'

            + '    if( body.length == 0 ){ \n'
            + '      await postSurvey(); \n'
            + '      console.log("after postSurvey"); \n'
            + '      await postAnswer(); \n'
            + '      console.log("after postAnswer"); \n'
            + '      await updateStep(); \n'
            + '      console.log("after updateStep - stepNumber = " + stepNumber); \n'
            + '      surveyAnswers = new Array; \n'
            + '      offerAnswers = new Array; \n'
            + '    } \n'
            + '    console.log("b4 fillContents - stepNumber = " + stepNumber); \n'
            + '    fillContents();\n'
            + '    console.log("after fillContents - stepNumber = " + stepNumber); \n'
            + '  }\n'
            
            + '$(document).ready(function() {\n'
              + 'fillContents();\n'
              + '$(\'div#submitArea\').click( function () { \n'
                + 'doNext();\n'
              + '});\n'
              + '$("div#submitArea>span").html(submitAreaText[language]);\n'
            + '});\n'
            + '</script>\n'
            + '</head>\n'
            + '<body>\n'
            + '<div id = \'skin\'>\n'
              + '<div id = \'titleArea\'><span></span></div>\n'
              + '<div id = \'questionArea\'></div>\n'
              + '<div id = \'submitArea\'><span></span></div>\n'
            + '</div>\n'
          + '</body>' ;

        res.send(bodyText);
    })
    .catch( function () { res.status(500).send() })
})

module.exports = router