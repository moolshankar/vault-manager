var http = require('http');
var events = require('events');
var request = require('request');
var appConstants = require('./../../config');
var TOKEN = require('./../session/token');
var logger = require('./../log/logger');
resourceEvents = new events.EventEmitter();
userList = [];

exports.getAllDbList = function (callbackParent){
  try {
    var clientToken = TOKEN.getClientToken();
    getdbs(clientToken, callback);
    function callback(data){
        callbackParent(data);
    }
  } catch (err) {
    logger.warn(err);
  }
};

exports.getUsersForDb = function (db,callbackParent){
    var clientToken = TOKEN.getClientToken();
    var dbPath = '/v1/secret/'+db.name;
    var options = {
                        host: appConstants.vault_host,
                        port: appConstants.vault_port,
                        path: dbPath+'?list=true',
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
              var users = [];
              users = parsed.data;
              callbackParent(users);
            } catch (err) {
              logger.warn(err);
            }
          });
         response.on('error', function(e) {
            logger.warn(e);
          });
    }
    http.request(options, getUsers).end();
};

exports.getAllUserList = function (callback){
      var clientToken = TOKEN.getClientToken();
      userList = [];
      try {
        getdbs(clientToken, getUsers);
        function getUsers(data){
            getDbUsers(clientToken, data.dbList, 0,callback);
        }
        // resourceEvents.once('UserFetchCompleted', function(){
        //     callback(userList);
        // });
      } catch (err) {
        logger.warn(err);
      }
};

var getdbs = function(clientToken, callbackParent){
    var options = {
                        host: appConstants.vault_host,
                        port: appConstants.vault_port,
                        path: '/v1/secret/?list=true',
                        headers: {
                                    'X-Vault-Token': clientToken
                                 },
                        method: 'GET'
                      };

                    function getAllDbs(response) {
                          var str = '';
                          response.on('data', function (chunk) {
                            str += chunk;
                          });
                          response.on('end', function () {
                            try {
                                var parsed = JSON.parse(str);
                                var dbs = [];
                                if(!parsed.hasOwnProperty('errors')){
                                  dbs = parsed.data.keys.slice();
                                  var data = {'dbList':dbs};
                                  callbackParent(data);
                                }
                            }catch (err) {
                                logger.warn(err);
                            }
                          });
                         response.on('error', function(e) {
                            logger.warn(e);;
                          });
                    }
                    http.request(options, getAllDbs).end();
};

var getDbUsers = function(clientToken, dbs, DbCounter,callback){
    if (DbCounter >= dbs.length){
        // resourceEvents.emit('UserFetchCompleted');
        callback(userList);
    }
    else if(dbs[DbCounter] != 'users/'){
      getDbUsers(clientToken, dbs, DbCounter+1,callback);
      return;
    }
    else{
            var dbPath = '/v1/secret/'+dbs[DbCounter];
            var options = {
                                host: appConstants.vault_host,
                                port: appConstants.vault_port,
                                path: dbPath+'?list=true',
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
                      var users = [];
                      if(parsed.hasOwnProperty('data')){
                        if(parsed.data.keys){
                          users = parsed.data.keys.slice();
                        }
                        getUserData(clientToken, dbPath, users, 0,afteruserDataFetchCompleted);
                        function afteruserDataFetchCompleted(){
                          getDbUsers(clientToken, dbs, DbCounter+1,callback);
                        }
                      }else{
                        logger.warn('No Secrets found for '+dbPath+' '+parsed);
                      }
                    } catch (err) {
                      logger.warn(err);
                    }
                  });
                 response.on('error', function(e) {
                    logger.warn(e);
                  });
            }
            http.request(options, getUsers).end();
    }

};

var getUserData = function(clientToken, dbPath, users, userCounter,callback){
    if (userCounter >= users.length){
        callback();
        return;
    }
    else{
            var userPath = dbPath+users[userCounter];
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
                      var user;
                      if(parsed.data){
                        user = parsed.data;
                        delete user.password;
                      }else{
                        logger.warn("No Data found for  "+userPath);
                      }
                      if(user != null){
                        userList.push(user);
                      }
                      getUserData(clientToken, dbPath, users, userCounter+1,callback);
                    } catch (err) {
                      logger.warn(err);
                    }
                  });
                 response.on('error', function(e) {
                    logger.warn(e);
                  });
            }
            http.request(options, getUsers).end();
    }
};

exports.createNewUser = function(userData, callback){
  try {
      var clientToken;
      clientToken = TOKEN.getClientToken();
      createSecretUser(clientToken,userData, callback);
  } catch (err) {
    logger.warn(err);
  }
};

var createSecretUser = function(clientToken, userData, callback){
            var headers = {
                            'X-Vault-Token': clientToken
                        };
            userData.data['password'] = userData.data.name;
            userData.data['status'] = 'New';
            var dataString = JSON.stringify(userData.data);
            var options = {
                url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/secret/users/'+userData.data.name,
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
                    logger.warn('Error while creating user '+userData.data.name+' : '+error);
                }
                callback(status);
              } catch (err) {
                logger.warn(err);
              }
            }
            request(options, addUser);
};

exports.editUser = function(userData, callback){
  try {
    var clientToken = TOKEN.getClientToken();
    editSecretUser(clientToken,userData, callback);
  } catch (err) {
    logger.warn(err);
  }
};

var editSecretUser = function(clientToken, userData, callback){
    validatePassword(clientToken,userData,callbackAfterValidation);
    function callbackAfterValidation(res,user){
          if (res.status == 'incorrect password'){
            callback(res);
            return;
          }
          if (res.status == 'validated'){
            user['password'] = userData.newPassword;
            user['status'] = 'Active';
          }
          if(userData.loggedInUser == 'admin'){
            // user['role'] = userData.data.role;
            // user['wifi_macId'] = userData.data.wifi_macId;
            // user['lan_macId'] = userData.data.lan_macId;
            // user['email'] = userData.data.email;
            user = Object.assign(user, userData.data);
          }
            var headers = {
                            'X-Vault-Token': clientToken
                        };
            var dataString = JSON.stringify(user);
            var options = {
                url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/secret/users/'+user.name,
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
                    var status = {};
                    status['status'] = 'error';
                    logger.warn('Error while editing user '+user.name+' : '+error);
                }
                callback(status);
              } catch (err) {
                logger.warn(err);
              }
            }
            request(options, addUser);
    }
};

var validatePassword = function(clientToken, userData, callbackParent){
    var userPath = '/v1/secret/users/'+userData.data.name;
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
                      if(userData.updatePassword != true && userData.loggedInUser == 'admin'){
                          res['status'] = 'not updated';
                      }
                      else if(userData.loggedInUser == 'admin'){
                          res['status'] = 'validated';
                      }
                      else if(userData.oldPassword !='' && userData.oldPassword == parsed.data.password){
                          res['status'] = 'validated';
                      }
                      else{
                          res['status'] = 'incorrect password';
                      }
                      callbackParent(res,parsed.data);
                    } catch (err) {
                      logger.warn(err);
                    }

                  });
                 response.on('error', function(e) {
                    logger.warn(e);
                  });
            }
            http.request(options, getUsers).end();
};

exports.fetchUser = function(userData, callback){
  try {
    var clientToken = TOKEN.getClientToken();
    fetchUserData(clientToken, userData, callback);
  } catch (err) {
    logger.warn(err);
  }
};


var fetchUserData = function(clientToken, userData, callback){
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
            var user = parsed.data;
            delete user.password;
            callback(user);
          } catch (err) {
            logger.warn(err);
          }
        });
       response.on('error', function(e) {
          logger.warn(e);
        });
  }
  http.request(options, getUsers).end();
};

exports.deleteUser = function(userData, callback){
    var clientToken = TOKEN.getClientToken();
    var headers = {
                    'X-Vault-Token': clientToken
                };
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/secret/users/'+userData.name,
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
              logger.warn('Error while deleting user '+userData.name);
          }
          callback(status);
        }catch (err) {
          logger.warn(err);
        }
    }
    request(options, deleteUser);
};

exports.resetPassword = function(userData, callback){
  try {
    var clientToken = TOKEN.getClientToken();
    fetchUserData(clientToken,userData,callbackafterUserFetch);
    function callbackafterUserFetch(user){
        user['password'] = userData.newPassword;
        user['status'] = 'Active';
        updateUser(clientToken,user,callback);
    }
  } catch (err) {
    logger.warn(err);
  }
};

var updateUser = function(clientToken, userData, callback){
    var headers = {
                    'X-Vault-Token': clientToken
                };
    var dataString = JSON.stringify(userData);
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/secret/users/'+userData.name,
        method: 'POST',
        headers: headers,
        body: dataString
    };

    function addUser(error, response, body) {
      try {
        var status = {};
        if (error) {
            status['status'] = error;
            logger.warn('Error while updating user '+userData.name);
        }
        else{
            status['status'] = 'success';
        }
        callback(status);
      } catch (err) {
        logger.warn(err);
      }
    }
    request(options, addUser);
};

exports.createAdmin = function(callback){
  if(appConstants.create_admin == false){
   callback(false);
   return;
  }

  var dbPath = '/v1/secret/users/';
  var options = {
                      host: appConstants.vault_host,
                      port: appConstants.vault_port,
                      path: dbPath+'?list=true',
                      headers: {
                                  'X-Vault-Token': appConstants.rootToken
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
            var users = [];
            if(parsed.hasOwnProperty('data')){
              callback(false);
            }else{
              callback(true);
            }
          } catch (err) {
            logger.warn(err);
          }
        });
       response.on('error', function(e) {
          logger.warn(e);
        });
  }
  http.request(options, getUsers).end();
};
