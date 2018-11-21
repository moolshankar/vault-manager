var http = require('http');
var events = require('events');
var request = require('request');
var appConstants = require('./../../config');
var TOKEN = require('./../session/token');
var roleEvents = new events.EventEmitter();
var logger = require('./../log/logger');
var roleList = [];

exports.getRoles = function (callback){
  try {
    getRolesData(callback);
  } catch (err) {
    logger.warn(err);
  }
};

var getRolesData = function (callback){
    try {
      roleList = [];
      getRoleList(afterRoleListFetch);
      function afterRoleListFetch(data){
        getRoleData(data.roleList, 0,callback);
      }
    } catch (err) {
      logger.warn(err);
    }
};

var getRoleList = function(callback){
    var clientToken = TOKEN.getClientToken();
    var options = {
                        host: appConstants.vault_host,
                        port: appConstants.vault_port,
                        path: '/v1/ssh/roles',
                        headers: {
                                    'X-Vault-Token': clientToken
                                  },
                        method: 'LIST'
                      };

                    function getAllRoles(response) {
                          var str = '';
                          response.on('data', function (chunk) {
                            str += chunk;
                          });
                          response.on('end', function () {
                            try {
                              var parsed = JSON.parse(str);
                              var roles = [];
                              if(!parsed.data){
                                  logger.warn('>>>>>>>>>>>> No Roles Defined >>>>>>>>> >>>>>>>>>>>');
                              }
                              else{
                                  roles = parsed.data.keys.slice();
                                  var data = {};
                                  data['roleList'] = roles;
                                  callback(data);
                              }
                            } catch (err) {
                              logger.warn(err);
                            }
                          });
                         response.on('error', function(e) {
                            logger.warn(err);
                          });
                    }
                    http.request(options, getAllRoles).end();
};

var getRoleData = function(roles, roleCounter,callback){
    var clientToken = TOKEN.getClientToken();
    if (roleCounter >= roles.length){
        callback(roleList);
        return;
    }
    else{
            var rolePath = '/v1/ssh/roles/'+roles[roleCounter];
            var options = {
                                host: appConstants.vault_host,
                                port: appConstants.vault_port,
                                path: rolePath,
                                headers: {
                                            'X-Vault-Token': clientToken
                                         },
                                method: 'GET'
                              };

            function getdata(response) {
                  var str = '';
                  response.on('data', function (chunk) {
                    str += chunk;
                  });
                  response.on('end', function () {
                    try {
                        var parsed = JSON.parse(str);
                        var role = {};
                        role['name'] = roles[roleCounter];
                        role['primary'] = parsed.data;
                        getRoleSecretData(clientToken,roles[roleCounter],callbackAfterSecretFetch);
                        function callbackAfterSecretFetch(secondary){
                          role['secondary'] = secondary;
                          roleList.push(role);
                          getRoleData(roles, roleCounter+1,callback);
                        }
                    } catch (err) {
                      logger.warn(err);
                    }

                  });
                 response.on('error', function(e) {
                    logger.warn("Got error: " + e.message);
                  });
            }
            http.request(options, getdata).end();
    }
};

var getRoleSecretData = function(clientToken, role, callback){
  var userPath = '/v1/secret/roles/otp/'+role;
  var options = {
                      host: appConstants.vault_host,
                      port: appConstants.vault_port,
                      path: userPath,
                      headers: {
                                  'X-Vault-Token': clientToken
                               },
                      method: 'GET'
                    };

  function getRole(response) {
        var str = '';
        response.on('data', function (chunk) {
          str += chunk;
        });
        response.on('end', function () {
          try {
            var parsed = JSON.parse(str);
            var roleData = {};
            if(parsed.hasOwnProperty('data')){
              roleData = parsed.data;
              if(roleData.expiry != null){
                var current = new Date();
                var diff = Math.ceil(( Date.parse(roleData.expiry) - current ) / 86400000);
                if(diff <= 0){
                    var roleTemp = {};
                    roleTemp.name = role;
                    roleTemp.data = roleData;
                    changeOtpRoleStatus(clientToken, roleTemp, afterStatusChange);
                    function afterStatusChange(status){
                      if(status.status = 'success'){
                        roleData.status = 'inactive';
                        roleData.expiry = null;
                      }
                      callback(roleData);
                    }
                }else{
                  callback(roleData);
                }
              }
              else{
                callback(roleData);
              }
            }else{
              callback(roleData);
            }
          } catch (err) {
            logger.warn(err);
          }
        });
       response.on('error', function(e) {
          logger.warn("Got error: " + e.message);
        });
  }
  http.request(options, getRole).end();
};

exports.getUserRoleData = function(user, callback){
  try {
      getRolesData(filterRolesForUser);
      function filterRolesForUser(roleList){
        for(var i = 0; i < roleList.length; i++){
            if(roleList[i].primary.default_user != user.name || roleList[i].secondary.status != 'active'){
               roleList.splice(i, 1);
               i--;
            }
          }
          callback(roleList);
      }
  } catch (err) {
    logger.warn(err);
  }
};

exports.createOtpRole = function(role, callback){
  try {
    var clientToken = TOKEN.getClientToken();
    var headers = {
                    'X-Vault-Token': clientToken
                };
    var dataString = JSON.stringify(role.primary);
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/ssh/roles/'+role.name,
        method: 'POST',
        headers: headers,
        body: dataString
    };

    function addRole(error, response, body) {
        try {
          var status = {};
          if (!error) {
              createOtpRoleSecret(clientToken, role, callback);
          }
          else{
              status['status'] = 'error';
              callback(status);
          }
        } catch (err) {
          logger.warn(err);
        }
    }
    request(options, addRole);
  } catch (err) {
    logger.warn(err);
  }
};

var createOtpRoleSecret = function(clientToken, roleData, callback){
            var headers = {
                            'X-Vault-Token': clientToken
                        };
            var dataString = JSON.stringify(roleData.secondary);
            var options = {
                url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/secret/roles/otp/'+roleData.name,
                method: 'POST',
                headers: headers,
                body: dataString
            };

            function addRoleSecret(error, response, body) {
                try {
                  var status = {};
                  if (!error) {
                      status['status'] = 'success';
                  }
                  else{
                      status['status'] = 'error in writing otp role secret';
                      logger.warn('error in writing otp role secret');
                  }
                  callback(status);
                }catch (err) {
                  logger.warn(err);
                }
            }
            request(options, addRoleSecret);
};

exports.deleteOtpRole = function(role, callback){
    try {
        var clientToken = TOKEN.getClientToken();
        var headers = {
                        'X-Vault-Token': clientToken
                    };
        var options = {
            url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/ssh/roles/'+role.name,
            method: 'DELETE',
            headers: headers
        };

        function deleteRole(error, response, body) {
            try {
                var status = {};
                if (!error) {
                    deleteOtpRoleSecret(clientToken, role, callback);
                }
                else{
                    var status = {};
                    status['status'] = 'error';
                    callback(status);
                }
            } catch (err) {
              logger.warn(err);
            }
        }
        request(options, deleteRole);
    } catch (err) {
      logger.warn(err);
    }
};


var deleteOtpRoleSecret = function(clientToken, roleData, callback){
    var headers = {
                    'X-Vault-Token': clientToken
                };
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/secret/roles/otp/'+roleData.name,
        method: 'DELETE',
        headers: headers
    };
    function deleteRole(error, response, body) {
        try {
          var status = {};
          if (!error) {
              status['status'] = 'success';
          }
          else{
              var status = {};
              status['status'] = 'error';
              logger.warn('error in deleting otp role secret '+roleData.name);
              logger.warn(error);
          }
          callback(status);
        } catch (err) {
          logger.warn(err);
          var status = {};
          status['status'] = 'error';
          callback(status);
        }
    }
    request(options, deleteRole);
};

var changeOtpRoleStatus = function(clientToken, role, callback){
    try {
      var roleData = {};
      roleData.name = role.name;
      roleData.secondary = role.data;
      roleData.secondary.status = 'inactive';
      roleData.secondary.expiry = null;
      createOtpRoleSecret(clientToken,roleData,callback);
    } catch (err) {
      logger.warn(err);
    }
};

exports.generateSshOtp = function(role, callback){
    var headers = {
                    'X-Vault-Token': appConstants.rootToken
                };
    var payLoad = {};
    payLoad['username'] = role.primary.default_user;
    payLoad['ip'] = role.primary.ip;
    var dataString = JSON.stringify(payLoad);
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/ssh/creds/'+role.name,
        method: 'POST',
        headers: headers,
        body: dataString
    };

    function getOtp(error, response, body) {
          try {
            var res = {};
            var parsed = JSON.parse(body);
            if (parsed.data){
                res.status = 'success';
                res.data = parsed.data;
            }
            else{
                res.status = 'error';
                res.data = parsed.errors;
            }
            callback(res);
          } catch (err) {
            logger.warn(err);
          }
      }
    request(options, getOtp);
};

exports.expireOtp = function(otp, callback){
    var dataString = JSON.stringify(otp);
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/ssh/verify',
        method: 'POST',
        body: dataString
    };

    function verify(error, response, body) {
        try {
          var status = {};
          if (!error) {
              status['status'] = 'success';
          }
          else{
              status['status'] = 'error';
          }
          callback(status);
        } catch (err) {
          logger.warn(err);
        }
    }
    request(options, verify);
};
