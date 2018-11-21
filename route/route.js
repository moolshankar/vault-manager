module.exports = function(app){
  var http = require('http');
  var bodyParser = require('body-parser');
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  var userResource = require('./../api/secret/user');
  var roleResource = require('./../api/secret/role');
  var policyResource = require('./../api/secret/policy');
  var sshRoles = require('./../api/ssh/role');
  var container = require('./../api/ssh/container');
  var login = require('./../api/user/login');
  var arpRes = require('./../api/arp/arp');
  var password = require('./../api/password/password');
  var logger = require('./../api/log/logger');
  var appConfig = require('./../config');
  var vaultHealth = require('./../api/vault/health')
  var extend = require('node.extend');
  var date = new Date();

  app.post('/authUserWithMac', function (req, res) {
      var user = req.body;
      arpRes.getMac(req.ip, callbackAfterIp);
      function callbackAfterIp(data){
        user['macId'] = data.mac;
        var callback = function(userData){
          res.json(userData);
        }
        login.authUserWithMac(user, callback);
      }
  });

  app.post('/authUser', function (req, res) {
      var user = req.body;
      var callback = function(userData){
        res.json(userData);
      }
      login.authUser(user, callback);
  });

  app.post('/getUsersList', function (req, res) {
      var callback = function(usersList){
        var users = {};
        users['data'] = usersList;
        res.json(users);
      }
      userResource.getAllUserList(callback);
  });

  app.post('/createUser', function (req, res) {
      var userData = req.body;
      var callback = function(status){
        res.json(status);
      }
      userResource.createNewUser(userData, callback);
  });

  app.post('/editUser', function (req, res) {
      var userData = req.body;
      var callback = function(status){
        res.json(status);
      }
      userResource.editUser(userData, callback);
  });

  app.post('/fetchUser', function (req, res) {
      var userData = req.body;
      var callback = function(status){
        res.json(status);
      }
      userResource.fetchUser(userData, callback);
  });

  app.post('/deleteUser', function (req, res) {
      var userData = req.body;
      var callback = function(status){
        res.json(status);
      }
      userResource.deleteUser(userData, callback);
  });

  app.post('/getAllDbList', function (req, res) {
      var callback = function(dbList){
        res.json(dbList);
      }
      userResource.getAllDbList(callback);
  });

  app.post('/resetPassword', function (req, res) {
      var user = req.body;
      var callback = function(response){
        res.json(response);
      }
      userResource.resetPassword(user,callback);
  });

  app.post('/getUsersForDb', function (req, res) {
      var db = req.body;
      var callback = function(usersList){
        res.json(usersList);
      }
      userResource.getUsersForDb(db,callback);
  });

  // User Management APIs END

  // Role Management APIs START
  app.post('/getRoles', function (req, res) {
      var callback = function(data){
        res.json(data);
      }
      roleResource.getRoles(callback);
  });

  app.post('/createRole', function (req, res) {
      var roleData = req.body;
      var callback = function(status){
        res.json(status);
      }
      roleResource.createRole(roleData, callback);
  });

  app.post('/deleteRole', function (req, res) {
      var roleData = req.body;
      var callback = function(status){
        res.json(status);
      }
      roleResource.deleteRole(roleData, callback);
  });
  // Role Management APIs END

  // Policy Management APIs START
  app.post('/getPolicyList', function (req, res) {
      var callback = function(data){
        res.json(data);
      }
      policyResource.getPolicies(callback);
  });

  app.post('/createPolicy', function (req, res) {
      var policyData = req.body;
      var callback = function(status){
        res.json(status);
      }
      policyResource.createPolicy(policyData, callback);
  });

  app.post('/deletePolicy', function (req, res) {
      var policyData = req.body;
      var callback = function(status){
        res.json(status);
      }
      policyResource.deletePolicy(policyData, callback);
  });
  // Policy Management APIs END

  // SSH Roles APIs START
  app.post('/getOtpRolesData', function (req, res) {
      var callback = function(data){
          res.json(data);
      }
      sshRoles.getRoles(callback);
  });

  app.post('/getUserRoleData', function (req, res) {
      var userData = req.body;
      var callback = function(data){
        res.json(data);
      }
      sshRoles.getUserRoleData(userData, callback);
  });

  app.post('/createOtpRole', function (req, res) {
      var roleData = req.body;
      var callback = function(status){
        res.json(status);
      }
      sshRoles.createOtpRole(roleData, callback);
  });

  app.post('/deleteOtpRole', function (req, res) {
      var roleData = req.body;
      var callback = function(status){
        res.json(status);
      }
      sshRoles.deleteOtpRole(roleData, callback);
  });

  app.post('/generateOtp', function (req, res) {
      var roleData = req.body;
      var callback = function(otpData){
        res.json(otpData);
      }
      sshRoles.generateSshOtp(roleData, callback);
  });

  app.post('/expireOtp', function (req, res) {
      var otp = req.body;
      var callback = function(status){
        res.json(status);
      }
      sshRoles.expireOtp(otp, callback);
  });

  app.post('/getMac', function (req, res) {
      var ip = req.ip;
      console.log(ip);
      var callback = function(status){
              res.json(status);
      }
      arpRes.getMac(ip, callback);
  });

  app.get('/getCidrs', function (req, res) {
    var cidr_data = {};
    cidr_data['cidr_list'] = appConfig.cidr_list;
    cidr_data['data'] = appConfig.ips;
    res.json(cidr_data);
    // var callback = function(data){
    //   cidr_data['data'] = data;
    //   res.json(cidr_data);
    // };
    // container.getContainerIps(callback);
  });

  app.get('/getUserRoles', function (req, res) {
      res.json(appConfig.user_roles);
  });

  app.get('/getAdmins', function (req, res) {
      res.json(appConfig.admins);
  });

  app.get('/getTeams', function (req, res) {
      res.json(appConfig.teams);
  });

  app.get('/getEnvs', function (req, res) {
      res.json(appConfig.environments);
  });

  app.get('/getSectors', function (req, res) {
      res.json(appConfig.sectors);
  });

  //password Management API Start
  app.post('/getPasswordList', function (req, res) {
      var userData = req.body;
      var callback = function(pwdList){
        var data = {};
        data['data'] = pwdList;
        res.json(data);
      }
      password.getPasswordList(userData,callback);
  });

  app.post('/createCredential', function (req, res) {
      var data = req.body;
      logger.info('>>>>>>   URL : '+req.originalUrl+'  >>>>>>>>>>');
      logger.info(data.loggedInUser);
      var callback = function(status){
        res.json(status);
      }
      password.createCredential(data, callback);
  });

  app.post('/multiCredentialCreate', function (req, res) {
      var data = req.body;
      logger.info('>>>>>>   URL : '+req.originalUrl+'  >>>>>>>>>>');
      logger.info(data.loggedInUser);
      var callback = function(status){
        res.json(status);
      }
      password.multiCredentialCreate(data, callback);
  });

  app.post('/deleteCredential', function (req, res) {
      var data = req.body;
      var callback = function(status){
        res.json(status);
      }
      password.deleteCredentials(data, callback);
  });
  //password Management API Start

  //Vault health check API for HA Proxy
  app.get('/ping', function (req, res) {
    var callback = function(status){
      res.sendStatus(status);
    }
    vaultHealth.getHealth(callback);
  });

}
