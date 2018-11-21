var http = require('http');
var request = require('request');
var appConstants = require('./../../config');
var logger = require('./../log/logger');
var clientToken;

exports.generateClientToken = function (user, callback){
  var headers = {
                  'X-Vault-Token': appConstants.rootToken
              };
  var metaData = {"user": user.name};
  var payLoad = {};
  payLoad['ttl'] = appConstants.default_user_ttl;
  payLoad['metadata'] = metaData;
  payLoad['renewable'] = false;
  var dataString = JSON.stringify(payLoad);
  var options = {
      url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/auth/token/create',
      method: 'POST',
      headers: headers,
      body: dataString
  };
  function getToken(error, response, body) {
        try {
          var res;
          if(!body){
            throw new Error('Vault not responding !!!!!');
          }
          var parsed = JSON.parse(body)
          if (!parsed['errors']) {
              res = parsed.auth.client_token;
              clientToken = res;
          }
          else{
              res = parsed.errors;
              logger.info(body);
          }
          callback(res);
        } catch (err) {
          logger.warn(err);
        }
    }
  request(options, getToken);
};

exports.validateToken = function (clientTokenToValidate, callbackFromCallingFunction){
        var options = {
                        host: appConstants.vault_host,
                        port: appConstants.vault_port,
                        path: '/v1/auth/token/lookup/'+clientTokenToValidate,
                        headers: {
                                    'X-Vault-Token': appConstants.rootToken
                                 },
                        method: 'GET'
                      };

        function callback(response) {
              var str = '';

              response.on('data', function (chunk) {
                str += chunk;
              });

              response.on('end', function () {
                try {
                  var parsed = JSON.parse(str);
                  var status = {};
                  if(parsed.hasOwnProperty('errors')){
                    status['status'] = 'invalid';
                  }
                  else{
                    clientToken = clientTokenToValidate;
                    status['status'] = 'valid';
                  }
                  callbackFromCallingFunction(status);
                } catch (err) {
                  logger.warn(err);
                }
              });
             response.on('error', function(e) {
                logger.warn(e);
              }); // error handling block end
        } // Callback end
        http.request(options, callback).end();
};

exports.getClientToken = function(){
  return clientToken;
}

exports.setClientToken = function(token){
  clientToken = token;
}
