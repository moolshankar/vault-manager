var appConfig = require('./../../config');
var http = require('http');
var logger = require('./../log/logger');

exports.getHealth = function(callback){
  var options = {
                      host: appConfig.vault_host,
                      port: appConfig.vault_port,
                      path: '/v1/sys/health',
                      method: 'GET'
                    };

  function getVaultHealth(response) {
        var str = '';
        response.on('data', function (chunk) {
          str += chunk;
        });
        response.on('end', function () {
          try {
            var parsed = JSON.parse(str);
            if ((parsed.sealed == false) && (parsed.standby == false)){
              //res.sendStatus(200);
              callback(200);
            }else{
              //res.sendStatus(500);
              callback(500);
            }
          } catch (err) {
            logger.warn(err);
          }
        });
       response.on('error', function(e) {
          logger.warn(e);
        });
  }
  http.request(options, getVaultHealth).end();
};
