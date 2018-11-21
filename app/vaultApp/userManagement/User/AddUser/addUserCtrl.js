app.controller("addUserCtrl", function ($scope,$rootScope,$mdDialog,$http,$state,$window) {
    $scope.formStatus = 'Initial';
    $scope.error = false;
    $scope.invalid = false;

    $http.get($rootScope.appUrl+'/getUserRoles').then(function(response){
          $scope.roles = response.data;
    });

    $http.get($rootScope.appUrl+'/getTeams').then(function(response){
          $scope.teams = response.data;
    });

    $scope.hideCreateUserPopUp = function(){
        $mdDialog.hide();
    };

    $scope.checkForExistingUser = function(){
        $scope.error = false;
        if($rootScope.userList.hasOwnProperty($scope.user.data.name)){
            $scope.invalid = true;
        }
        else{
            $scope.invalid = false;
        }
    };

    $scope.isArchitect = function(role){
      if(role){
        for(var i=0;i<role.length;i++){
          if ($rootScope.pwdAdmins.hasOwnProperty(role[i])){
            return true;
          }
        }
      }
      if($scope.user && $scope.user.data && $scope.user.data.team)
        $scope.user.data.team = null;
      return false;
    };

    $scope.submitNewUser = function(){
        if($rootScope.userList.hasOwnProperty($scope.user.data.name)){
            $scope.invalid = true;
        }
        if($scope.invalid == true){
            $scope.error = true;
            $scope.errorMsg = 'Username already exist, Try another.';
        }
        else{
            $scope.formStatus = 'Processing';
            $scope.user.data['ssh'] = 'true';
            $scope.user.data.email = $scope.user.data.email.split('@')[0] + "@abc.com";
            if(!angular.isUndefined($scope.user.data.lan_macId))
              $scope.user.data.lan_macId = $scope.user.data.lan_macId.toLowerCase();
            if(!angular.isUndefined($scope.user.data.wifi_macId))
              $scope.user.data.wifi_macId = $scope.user.data.wifi_macId.toLowerCase();
            $scope.user.token = $window.sessionStorage.getItem('clientToken');
            $scope.user.loggedInUser = $rootScope.user;
            $http.post($rootScope.appUrl+'/createUser',$scope.user).then(function(response){
                $scope.formStatus = 'Initial';
                console.log(response.data);
                if(response.data.status == 'success'){
                    $rootScope.$broadcast('userAdded');
                }
                else if(response.data.status == 'sessionExpired'){
                    $rootScope.expireSession();
                }
                else{
                  console.log(response);
                }
          });
        }
    };
});
