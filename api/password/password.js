    var http = require('http');
    var events = require('events');
    var request = require('request');
    var appConstants = require('./../../config');
    var TOKEN = require('./../session/token');
    var logger = require('./../log/logger');
    resourceEvents = new events.EventEmitter();
    pwdList = [];
    var loggedInUserRole;
    loggedInUser = '';
    var childCounter;
    var haveTeamField = false;
    var adminTeam;

    exports.getPasswordList = function (user, callback){
          var clientToken = TOKEN.getClientToken();
          pwdList = [];
          loggedInUserRole = user.loggedInUserRole;
          loggedInUser = user.loggedInUser;
          haveTeamField = false;
          try {
            var secretPath = '/v1/secret/passwords/';
            if(user.team){
              //secretPath = secretPath + user.team + '/';
              haveTeamField = true;
              adminTeam = user.team;
            }
            childCounter = 0;
            ++childCounter;
            getCredentials(clientToken, secretPath, callback);
          } catch (err) {
            logger.warn(err);
          }
    };

    var getCredentials = function(clientToken, secretPath, callback){
          var options = {
                            host: appConstants.vault_host,
                            port: appConstants.vault_port,
                            path: secretPath+'?list=true',
                            headers: {
                                        'X-Vault-Token': clientToken
                                     },
                            method: 'GET'
                        };
          function getKeys(response) {
                var str = '';
                response.on('data', function (chunk) {
                  str += chunk;
                });
                response.on('end', function () {
                  try {
                    var parsed = JSON.parse(str);
                    var keys = [];
                    if(parsed.hasOwnProperty('data')){
                      if(parsed.data.keys){
                        keys = parsed.data.keys.slice();
                      }
                      getValues(clientToken, secretPath, keys, 0, callback, afterValueFetchCompleted);
                      function afterValueFetchCompleted(){
                        if(childCounter <= 0){
                          callback(pwdList);
                        }
                      }
                    }else{
                      logger.warn('No Secrets found for '+secretPath+' '+parsed);
                    }
                  } catch (err) {
                    logger.warn(err);
                  }
                });
               response.on('error', function(e) {
                  logger.warn(e);
                });
          }
          http.request(options, getKeys).end();
    };

    var getValues = function(clientToken, secretPath, keys, keyCounter,callbackParent, callbackChild){
        if (keyCounter >= keys.length){
            --childCounter;
            callbackChild();
        }
        else if(isDirectory(keys[keyCounter])){
          ++childCounter;
          getCredentials(clientToken, secretPath + keys[keyCounter], callbackParent);
          getValues(clientToken, secretPath, keys, keyCounter+1, callbackParent, callbackChild);
        }
        else{
                var valuePath = secretPath+keys[keyCounter];
                var options = {
                                    host: appConstants.vault_host,
                                    port: appConstants.vault_port,
                                    path: valuePath,
                                    headers: {
                                                'X-Vault-Token': clientToken
                                             },
                                    method: 'GET'
                                  };

                function getValue(response) {
                      var str = '';
                      response.on('data', function (chunk) {
                        str += chunk;
                      });
                      response.on('end', function () {
                        try {
                              var parsed = JSON.parse(str);
                              var user;
                              if(parsed.data){
                                user = parsed.data;
                              }else{
                                logger.warn("No Data found for  "+valuePath);
                              }
                              var currentTeamDir = getCurrentTeamDir(secretPath);
                              if(filtersCheck(user, currentTeamDir)){
                                if(isAdmin() && (adminTeam != currentTeamDir || loggedInUser != user.createdBy)){
                                  user.readonly = true;
                                }
                                user.team = currentTeamDir;
                                pwdList.push(user);
                              }
                              getValues(clientToken, secretPath, keys, keyCounter+1, callbackParent, callbackChild);
                        }catch (err) {
                            logger.warn(err);
                        }
                      });
                     response.on('error', function(e) {
                        logger.warn(e);
                      });
                }
                http.request(options, getValue).end();
        }
    };

    var isDirectory = function(keyName){
      var secretNameChars = keyName.split("");
      if(secretNameChars[secretNameChars.length-1] == '/'){
        return true;
      }
      else{
        return false;
      }
    };

    var isAdmin = function(){
      try{
          for(var i=0;i<loggedInUserRole.length;i++){
            if(appConstants.admins.pwdAdmins.indexOf(loggedInUserRole[i]) > -1){
              return true;
            }
          }
          return false;
      }catch(err){
          logger.warn(err);
      }
    };

    var isUserRoleAllowed = function(credential){
      try{
          for(var i=0;i<loggedInUserRole.length;i++){
            if(credential.allowed_roles.indexOf(loggedInUserRole[i]) > -1){
              return true;
            }
          }
          return false;
      }catch(err){
        logger.warn(err);
      }
    };

    var isUserAllowed = function(credential){
      try{
          if(!credential.restrictUsers)
            return true;
          for(var i=0;i<loggedInUserRole.length;i++){
            var roleTemp = loggedInUserRole[i].split('_')[1];
            if(credential.allowed_users.indexOf(loggedInUser+' : '+roleTemp) > -1){
              return true;
            }
          }
          return false;
      }catch(err){
        logger.warn(err);
      }
    };

    var filtersCheck = function(credential, currentTeamDir){
      try{
          if(credential == null)
            return false;
          else if(isAdmin() && (adminTeam == currentTeamDir))
            return true;
          else if(!isUserRoleAllowed(credential))
            return false;
          else if(!isUserAllowed(credential))
            return false;
          else
            return true;
      }catch(err){
        logger.warn(err);
      }
    };

    var getCurrentTeamDir = function(secretPath){
      try{
          var arr = secretPath.split("/");
          return arr[arr.indexOf('passwords') + 1];
      }catch(err){
        logger.warn(err);
      }
    };

    exports.createCredential = function(data, callback){
      try {
          clientToken = TOKEN.getClientToken();
          var secretPath = 'passwords/'+data.team+'/'+data.data.sector+'/'+data.data.environment+'/';
          createCredentialKey(clientToken, secretPath, data.data, callback);
      } catch (err) {
        logger.warn(err);
      }
    };

    var createCredentialKey = function(clientToken,secretPath, data, callback){
        var headers = {
                        'X-Vault-Token': clientToken
                    };
        var dataString = JSON.stringify(data);
        var options = {
            url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/secret/'+secretPath+data.username,
            method: 'POST',
            headers: headers,
            body: dataString
        };
        function addUser(error, response, body) {
          try {
            var status = {};
            if (!error) {
                status['status'] = 'success';
            }
            else{
                status['status'] = 'error';
                logger.warn('Error while creating user '+data.username+' : '+error);
            }
            callback(status);
          } catch (err) {
            logger.warn(err);
          }
        }
        request(options, addUser);
    };

    exports.deleteCredentials = function(data, callback){
        var clientToken = TOKEN.getClientToken();
        var headers = {
                        'X-Vault-Token': clientToken
                    };
        var options = {
            url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/secret/passwords/'+data.team+'/'+data.sector+'/'+data.environment+'/'+data.username,
            method: 'DELETE',
            headers: headers
        };
        function deleteUser(error, response, body) {
            try {
              var status = {};
              if (!error) {
                  status['status'] = 'success';
              }
              else{
                  var status = {};
                  status['status'] = 'error';
                  logger.warn('Error while deleting user '+data.username);
              }
              callback(status);
            }catch (err) {
              logger.warn(err);
            }
        }
        request(options, deleteUser);
    };

    exports.multiCredentialCreate = function(dataArray, callback){
      try {
          clientToken = TOKEN.getClientToken();
          var secretPath = 'passwords/'+dataArray.team+'/';
          createRecursive(clientToken, secretPath, dataArray.data, 0, callback);
      }catch (err) {
        logger.warn(err);
      }
    };

    var createRecursive = function(clientToken, secretPath, dataArray, counter, callback){
      if(counter >= dataArray.length){
        var data = {};
        data['status'] = 'success';
        callback(data);
      }else{
        var credentialPath = secretPath+dataArray[counter].sector+'/'+dataArray[counter].environment+'/';
        createCredentialKey(clientToken, credentialPath, dataArray[counter], created);
        function created(){
          createRecursive(clientToken, secretPath, dataArray, counter+1, callback);
        }
      }
    };
