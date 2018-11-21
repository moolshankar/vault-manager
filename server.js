var express    = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var tokenService = require('./api/session/token');
var userResource = require('./api/secret/user');
var appConfig = require('./config');
var logger = require('./api/log/logger');
var extend = require('node.extend');

//Interceptor to validate client token for valid session
app.use(function(req, res, next) {
  var status = {};
  status['status'] = 'sessionValid';
  if(req.method == 'POST' && (req.originalUrl == '/authUser' || req.originalUrl == '/authUserWithMac')){
    logger.info('>>>>>>   URL : '+req.originalUrl+'  >>>>>>>>>>');
    logger.info(req.body.name);
  }
  else if(req.method == 'POST' && req.originalUrl != '/resetPassword' && req.originalUrl != '/createCredential' && req.originalUrl != '/multiCredentialCreate'){
    logger.info('>>>>>>   URL : '+req.originalUrl+'  >>>>>>>>>>');
    var token = req.body.token;
    delete req.body.token;
    logger.info(req.body);
    req.body['token'] = token;
  }
  if(req.method == 'POST' && req.originalUrl != '/authUser' && req.body.hasOwnProperty('token')){
    var token = req.body.token;
    tokenService.validateToken(token,function(response){
      if(response.status == 'invalid'){
        status['status'] = 'sessionExpired';
      }
      if(status['status'] == 'sessionExpired'){
        res.json(status);
      }else{
        next();
      }
    });
  }else{
    userResource.createAdmin(afterConfirmation);
    function afterConfirmation(trueOrFalse){
      if(trueOrFalse == true){
        tokenService.setClientToken(appConfig.rootToken);
        userResource.createNewUser(appConfig.admin_data, callback);
        function callback(status){
              if(status.status == 'success')
                next();
              else
                console.log('Admin data creation failed');
        }
      }else{
        next();
      }
    }
  }
});

require('./route/route')(app); // Route mapping

app.use(express.static(__dirname +'/app'));

// serve index.html for all remaining routes, in order to leave routing up to angular
app.all("/*", function(req, res, next) {
    res.sendFile("index.html", { root: __dirname + "/app" });
});

// START THE SERVER
app.listen(appConfig.app_port,appConfig.app_host);
console.log('http://'+appConfig.app_host+':'+appConfig.app_port+'/');
