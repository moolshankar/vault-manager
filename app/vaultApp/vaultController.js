app = angular.module('vaultApp', ['ngMaterial','ui.router','angular-clipboard']);
app.controller('vaultController', function ($scope,$http,$rootScope,$window,$mdDialog,$location) {
    //Test
    //$rootScope.appUrl = "http://a.b.c.d:9010";
    //Prod
    $rootScope.appUrl = "https://DNS_NAME";

    $rootScope.loggedInStatus = isLoggedIn();

    $http.get($rootScope.appUrl+'/getAdmins').then(function(response){
          var admins = response.data;
          $rootScope.userAdmins = {};
          $rootScope.sshAdmins = {};
          $rootScope.pwdAdmins = {};
          for(var i=0;i<admins.userAdmins.length;i++){
            $rootScope.userAdmins[admins.userAdmins[i]] = '1';
          }
          for(var i=0;i<admins.sshAdmins.length;i++){
            $rootScope.sshAdmins[admins.sshAdmins[i]] = '1';
          }
          for(var i=0;i<admins.pwdAdmins.length;i++){
            $rootScope.pwdAdmins[admins.pwdAdmins[i]] = '1';
          }
    });


    function isLoggedIn(){
      if($window.sessionStorage.getItem('clientToken'))
        return true;
      else
        return false;
    }

    $rootScope.isAdmin = function(appName){
        if(appName == 'userManagement'){
          for(var i=0;i<$rootScope.loggedInRole.length;i++){
            if ($rootScope.userAdmins.hasOwnProperty($rootScope.loggedInRole[i])){
              return true;
            }
          }
        }
        if (appName == 'sshManagement'){
          for(var i=0;i<$rootScope.loggedInRole.length;i++){
            if ($rootScope.sshAdmins.hasOwnProperty($rootScope.loggedInRole[i])){
              return true;
            }
          }
        }
        if (appName == 'credentialManagement'){
          for(var i=0;i<$rootScope.loggedInRole.length;i++){
            if ($rootScope.pwdAdmins.hasOwnProperty($rootScope.loggedInRole[i])){
              return true;
            }
          }
        }
        return false;
    };

    $rootScope.logout = function() {
            $rootScope.user = undefined;
            $rootScope.role = undefined;
            $rootScope.clientToken = undefined;
            $window.sessionStorage.clear();
            $window.location.href = '/';
      };

    $rootScope.setSessionParams = function(data){
      $window.sessionStorage.setItem('clientToken',data.token);
      $window.sessionStorage.setItem('user',data.user.name);
      $window.sessionStorage.setItem('loggedInRole',data.user.role);
      $window.sessionStorage.setItem('userStatus',data.user.status);
      if(data.user.team){
        $window.sessionStorage.setItem('team',data.user.team);
      }
    }
});

app.config(function($stateProvider, $urlRouterProvider,$locationProvider,$httpProvider,$mdAriaProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl : "/vaultApp/home/home.html",
        controller : "homeCtrl"
    })
    .state('ssh', {
        url: '/ssh',
        templateUrl : "/vaultApp/sshManagement/navbar/navbar.html",
        controller : "sshNavbarCtrl"
    })
    .state('credential', {
        url: '/credential',
        templateUrl : "/vaultApp/passwordManagement/navbar/navbar.html",
        controller : "passwordNavbarCtrl"
    })
    .state('users', {
        url: '/users',
        templateUrl : "/vaultApp/userManagement/navbar/navbar.html",
        controller : "userNavbarCtrl"
    })
    .state('ssh.dashboard', {
        url: '/dashboard',
        templateUrl : "/vaultApp/sshManagement/dashboard/dashboard.html",
        controller : "sshDashboardCtrl"
    })
    .state('credential.dashboard', {
        url: '/dashboard',
        templateUrl : "/vaultApp/passwordManagement/dashboard/dashboard.html",
        controller : "passwordDashboardCtrl"
    })
    .state('users.dashboard', {
        url: '/dashboard',
        templateUrl : "/vaultApp/userManagement/dashboard/dashboard.html",
        controller : "userDashboardCtrl"
    })
    .state('credential.list', {
        url: '/list',
        templateUrl : "/vaultApp/passwordManagement/password/listPasswords/listPasswords.html",
        controller : "listPasswordsCtrl"
    })
    .state('users.list', {
        url: '/list',
        templateUrl : "/vaultApp/userManagement/User/ListUsers/listUsers.html",
        controller : "listUsersCtrl"
    })
    .state('ssh.otpRoles', {
        url: '/otpRoles',
        templateUrl : "/vaultApp/sshManagement/otpRole/listOtpRoles/listOtpRoles.html",
        controller : "listOtpRolesCtrl"
    })
    .state('ssh.sshOtp', {
        url: '/sshOtp',
        templateUrl : "/vaultApp/sshManagement/otpRole/otp/otp.html",
        controller : "otpCtrl"
    });
    $urlRouterProvider.otherwise('/');
    $locationProvider.html5Mode(true);
    $httpProvider.defaults.headers.common = {
    'Accept': 'application/json'
    };
    $mdAriaProvider.disableWarnings();
});

app.run(function ($rootScope, $state, $stateParams) {
  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
});
