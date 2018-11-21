var http = require('http');
var events = require('events');
var request = require('request');
var appConstants = require('./../../config');
policyEvents = new events.EventEmitter();
var policyList = [];

exports.getPolicies = function (callback){
            policyList = [];
            getPolicyList();
            policyEvents.once('PolicyListFetchCompleted', function(data){
                    getPolicyData(data.policyList, 0);
                    policyEvents.removeAllListeners('PolicyListFetchCompleted');
                });
            policyEvents.once('PolicyDataFetchCompleted', function(){
                    callback(policyList);
                    return 0;
                });
};

var getPolicyList = function(){
    var options = {
                        host: appConstants.vault_host,
                        port: appConstants.vault_port,
                        path: '/v1/sys/policy',
                        headers: {
                                    'X-Vault-Token': appConstants.rootToken
                                 },
                        method: 'GET'
                      };

                    function getAllPolicies(response) {
                          var str = '';
                          response.on('data', function (chunk) {
                            str += chunk;
                          });
                          response.on('end', function () {
                            var parsed = JSON.parse(str);
                            var policies = [];
                            if(parsed.hasOwnProperty('errors')){
                                console.log('>>>>>>>>>>>> Error Occured in getPolicyList >>>>>>>>> >>>>>>>>>>>');
                                console.log(parsed);
                            }
                            else{
                                policies = parsed.policies.slice();
                                policyEvents.emit('PolicyListFetchCompleted',{'policyList':policies});
                            }
                          });
                         response.on('error', function(e) {
                            console.log("Got error: " + e.message);
                          });
                    }
                    return http.request(options, getAllPolicies).end();
};

var getPolicyData = function(policies, policyCounter){
    if (policyCounter >= policies.length){
        return policyEvents.emit('PolicyDataFetchCompleted');
    }
    else{
            var policyPath = '/v1/sys/policy/'+policies[policyCounter];
            var options = {
                                host: appConstants.vault_host,
                                port: appConstants.vault_port,
                                path: policyPath,
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
                    var policy = parsed.data;
                    policyList.push(policy);
                    getPolicyData(policies, policyCounter+1);
                  });
                 response.on('error', function(e) {
                    console.log("Got error: " + e.message);
                  });
            }
            return http.request(options, getdata).end();
    }
};

exports.createPolicy = function(policyData, callback){
    var headers = {
                    'X-Vault-Token': appConstants.rootToken
                };
    var payload = {
        'rules' : policyData.rules
    };
    var dataString = JSON.stringify(payload);
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/sys/policy/'+policyData.name,
        method: 'POST',
        headers: headers,
        body: dataString
    };

    function addPolicy(error, response, body) {
        var status = {};
        if (!error) {
            status['status'] = 'success';
        }
        else{
            status['status'] = 'error';
        }
        callback(status);
    }
    request(options, addPolicy);
};

exports.deletePolicy = function(policyData, callback){
    var headers = {
                    'X-Vault-Token': appConstants.rootToken
                };
    var options = {
        url: 'http://'+appConstants.vault_host+':'+appConstants.vault_port+'/v1/sys/policy/'+policyData.name,
        method: 'DELETE',
        headers: headers
    };

    function deletePolicy(error, response, body) {
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
    request(options, deletePolicy);
};
