var appConfig = require('./../../config');
var http = require('http');
var logger = require('./../log/logger');

exports.getContainerIps = function(callback){
  var options = {
                      host: 'a.b.c.d',
                      port: '80',
                      path: '/data',
                      method: 'GET'
                    };

  function containerIps(response) {
        var str = '';
        response.on('data', function (chunk) {
          str += chunk;
        });
        response.on('end', function () {
          try {
            var parsed = JSON.parse(str);
            callback(parsed);
          } catch (err) {
            logger.warn(err);
          }
        });
       response.on('error', function(e) {
          logger.warn(e);
        });
  }
  http.request(options, containerIps).end();
};
