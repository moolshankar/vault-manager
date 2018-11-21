var http = require('http');
var logger = require('./../log/logger');

export.getIps = function(callback){
  var options = {
      url: 'http://a.b.c.d/data',
      method: 'GET'
  };

  function getIpList(error, response, body) {
    try {
      var status = {};
      if (!error) {
          var ipData = JSON.parse(body);
      }
      else{
          logger.warn('Error in request http://a.b.c.d/data');
      }
      callback(status);
    }catch (err) {
      logger.warn('Error in request http://a.b.c.d/data');
    }
  }
  request(options, addUser);
};
