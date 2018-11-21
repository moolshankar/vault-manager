var http = require('http');
var events = require('events');
var request = require('request');
const isUndefined = require("is-undefined");
var appConstants = require('./../../config');
var TOKEN = require('./../session/token');
var logger = require('./../log/logger');

exports.authUserWithMac = function(user,callback){
  try {
      var clientToken = '';
      TOKEN.generateClientToken(user,callbackAfterToken);
      function callbackAfterToken(clientTokenLocal){
              validateUser(clientTokenLocal, user, appConstants.enable_mac_validation, callback);
      }
  } catch (err) {
      logger.warn(err);
  }
};

exports.authUser = function(user,callback){
  try {
      var clientToken = '';
      TOKEN.generateClientToken(user,callbackAfterToken);
      function callbackAfterToken(clientTokenLocal){
              validateUser(clientTokenLocal, user, false, callback);
      }
  } catch (err) {
      logger.warn(err);
  }
};

var validateUser = function(clientToken, userData, macIncluded, callbackParent){
    var userPath = '/v1/secret/users/'+userData.name;
    var options = {
                      host: appConstants.vault_host,
                      port: appConstants.vault_port,
                      path: userPath,
                      headers: {
                                  'X-Vault-Token': clientToken
                               },
                      method: 'GET'
                  };
    function getUsers(response) {
          var str = '';
          response.on('data', function (chunk) {
              str += chunk;
          });
          response.on('end', function () {
            try {
                  var parsed = JSON.parse(str);
                  var res = {};
                  var dbUser;
                  if(parsed.hasOwnProperty('errors')){
                      res['status'] = 'failed';
                  }else{
                      dbUser = parsed.data;
                      if(macIncluded == false && userData.password == dbUser.password){
                        res['status'] = 'success';
                        res['token'] = clientToken;
                        delete dbUser.password;
                        res['user'] = dbUser;
                      }
                      else if(userData.password == dbUser.password && !isUndefined(userData.macId) && (userData.macId.toLowerCase() == dbUser.lan_macId || userData.macId.toLowerCase() == dbUser.wifi_macId)){
                      //if(userData.password == dbUser.password){
                          res['status'] = 'success';
                          res['token'] = clientToken;
                          delete dbUser.password;
                          delete dbUser.macId;
                          res['user'] = dbUser;
                      }
                      else{
                            if(macIncluded == true && isUndefined(userData.macId)){
                              res['status'] = 'No Mac';
                            }else if(macIncluded == true && userData.macId.toLowerCase() != dbUser.macId){
                              res['status'] = 'Invalid Mac';
                            }else{
                              res['status'] = 'failed';
                            }
                      }
                    }
                callbackParent(res);
            } catch (err) {
              logger.warn('Error in login.validateUser for user : '+userData.name+' : '+error);
            }
          });
         response.on('error', function(e) {
            logger.warn("Got error: " + e.message);
          });
    }
    http.request(options, getUsers).end();
};
