app.controller("userDashboardCtrl", function ($scope,$rootScope,$mdDialog,$http,$state,$window) {
    var userData = {};
    userData.name = $rootScope.user;
    userData.token = $window.sessionStorage.getItem('clientToken');
    if(userData.name){
        $http.post($rootScope.appUrl+'/fetchUser',userData).then(function(response){
        if(response.data.status == 'sessionExpired'){
              $rootScope.expireSession();
          }
        $scope.user = response.data;
        //$scope.user.role = $scope.user.role.split(",");
      });
    }
    $scope.editUser = function(ev) {
            $rootScope.userData = $scope.user;
            $mdDialog.show({
              templateUrl: '/vaultApp/userManagement/User/EditUser/editUser.html',
              parent: angular.element(document.querySelector('body')),
              targetEvent: ev,
              clickOutsideToClose:false,
              escapeToClose:true,
              fullscreen: false
            })
            .then(function(answer) {
            }, function() {
            });
      };
});
