var http = require('http');
var events = require('events');
var request = require('request');
var appConstants = require('./../../config');
roleEvents = new events.EventEmitter();
var roleList = [];

var enableAppRole = function (callbackOfCallingFunction){
        var headers = {
                        'X-Vault-Token': appConstants.rootToken
                    };
        var roleData = {
            'type':'approle'
        };
        var dataString = JSON.stringify(roleData);
        var options = {
            url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/sys/auth/approle',
            method: 'POST',
            headers: headers,
            body: dataString
        };

        function enableAppRole(error, response, body) {
            var status = {};
            if (!error) {
                callbackOfCallingFunction();
            }
            else{
                console.log('#############  Error : while enable App role ############');
                console.log(body);
            }
        }
        return request(options, enableAppRole);
};

exports.getRoles = function (callback){
            roleList = [];
            getRoleList();
            roleEvents.once('RoleListFetchCompleted', function(data){
                    getRoleData(data.roleList, 0);
                });
            roleEvents.once('RoleDataFetchCompleted', function(){
                    callback(roleList);
                });
};

var getRoleList = function(){
    var options = {
                        host: appConstants.vault_host,
                        port: appConstants.vault_port,
                        path: '/v1/auth/approle/role?list=true',
                        headers: {
                                    'X-Vault-Token': appConstants.rootToken
                                 },
                        method: 'GET'
                      };

                    function getAllRoles(response) {
                          var str = '';
                          response.on('data', function (chunk) {
                            str += chunk;
                          });
                          response.on('end', function () {
                            var parsed = JSON.parse(str);
                            var roles = [];
                            if(parsed.hasOwnProperty('errors')){
                                console.log('>>>>>>>>>>>> Error Occured in getRolesList >>>>>>>>> >>>>>>>>>>>');
                                console.log(parsed);
                            }
                            else{
                                roles = parsed.data.keys.slice();
                                roleEvents.emit('RoleListFetchCompleted',{'roleList':roles});
                            }
                          });
                         response.on('error', function(e) {
                            console.log("Got error: " + e.message);
                          });
                    }
                    http.request(options, getAllRoles).end();
};

var getRoleData = function(roles, roleCounter){
    if (roleCounter >= roles.length){
        roleEvents.emit('RoleDataFetchCompleted');
    }
    else{
            var rolePath = '/v1/auth/approle/role/'+roles[roleCounter];
            var options = {
                                host: appConstants.vault_host,
                                port: appConstants.vault_port,
                                path: rolePath,
                                headers: {
                                            'X-Vault-Token': appConstants.rootToken
                                         },
                                method: 'GET'
                              };

            function getdata(response) {
                  var str = '';
                  response.on('data', function (chunk) {
                    str += chunk;
                  });
                  response.on('end', function () {
                    var parsed = JSON.parse(str);
                    var role = {};
                    role['name'] = roles[roleCounter];
                    role['data'] = parsed.data;
                    roleList.push(role);
                    getRoleData(roles, roleCounter+1);
                  });
                 response.on('error', function(e) {
                    console.log("Got error: " + e.message);
                  });
            }
            http.request(options, getdata).end();
    }
};

exports.createRole = function(role, callback){
    var headers = {
                    'X-Vault-Token': appConstants.rootToken
                };
    var dataString = JSON.stringify(role.data);
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/auth/approle/role/'+role.name,
        method: 'POST',
        headers: headers,
        body: dataString
    };

    function addRole(error, response, body) {
        var status = {};
        if (!error) {
            status['status'] = 'success';
        }
        else{
            status['status'] = 'error';
        }
        callback(status);
    }
    request(options, addRole);
};

exports.deleteRole = function(role, callback){
    var headers = {
                    'X-Vault-Token': appConstants.rootToken
                };
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/auth/approle/role/'+role.name,
        method: 'DELETE',
        headers: headers
    };

    function deleteRole(error, response, body) {
        var status = {};
        if (!error) {
            status['status'] = 'success';
        }
        else{
            var status = {};
            status['status'] = 'error';
        }
        callback(status);
    }
    request(options, deleteRole);
};
