app.controller("sshNavbarCtrl", function ($scope,$rootScope,$mdDialog,$http,$state,$window,$location){
  if($rootScope.loggedInStatus != true){
        if($location.path() != '/ssh'){
          $state.go('ssh');
        }
        $mdDialog.show({
            templateUrl: '/vaultApp/sshManagement/login/login.html',
            parent: angular.element(document.body),
            clickOutsideToClose:false,
            escapeToClose:false,
            fullscreen: false
        })
        .then(function(answer) {
            $scope.status = 'You said the information was "' + answer + '".';
        }, function() {
            $scope.status = 'You cancelled the dialog.';
        });
  }
  else{
          $rootScope.user = $window.sessionStorage.getItem('user');
          $rootScope.loggedInRole = $window.sessionStorage.getItem('loggedInRole').split(',');
          $rootScope.clientToken = $window.sessionStorage.getItem('clientToken');
          if($window.sessionStorage.getItem('userStatus') == 'New'){
              $mdDialog.show({
                  templateUrl: '/vaultApp/sshManagement/login/resetPassword.html',
                  parent: angular.element(document.body),
                  clickOutsideToClose:false,
                  escapeToClose:false,
                  fullscreen: false
              })
              .then(function(answer) {
                  $scope.status = 'You said the information was "' + answer + '".';
              }, function() {
                  $scope.status = 'You cancelled the dialog.';
              });
            }
            if($location.path() == '/ssh'){
              $state.go('ssh.dashboard');
            }
        }

  $rootScope.expireSession = function() {
          $rootScope.user = undefined;
          $rootScope.role = undefined;
          $rootScope.clientToken = undefined;
          $window.sessionStorage.clear();
          $window.sessionStorage.setItem('sessionExpired',true);
          $window.location.href = '/ssh';
    };

});
