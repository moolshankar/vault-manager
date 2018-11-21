var arp = require('node-arp');
var ping = require('ping');
var logger = require('./../log/logger');
exports.getMac = function(ip, callback){
    ping.promise.probe(ip)
        .then(function (res) {
          try {
            if(res.alive == true){
              arp.getMAC(res.host, function(err, mac) {
                if (!err) {
                    var macData = {};
                    macData['mac'] = mac;
                    callback(macData);
                }
                else{
                  callback(err);
                }
              });
            }
            else{
              var status = {};
              status['error'] = ip+' Host is not alive';
              logger.warn(ip+' Host is not alive');
              callback(status);
            }
          } catch (err) {
            callback(err);
          }
      });
};
