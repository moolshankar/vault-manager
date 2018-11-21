app.controller("addPasswordCtrl", function ($scope,$rootScope,$mdDialog,$http,$state,$window) {
    $scope.formStatus = 'Initial';
    $scope.error = false;
    $scope.invalid = false;
    $scope.usrs = {};
    var users = {};

    $http.get($rootScope.appUrl+'/getUserRoles').then(function(response){
          $scope.roles = response.data;
    });

    $http.get($rootScope.appUrl+'/getEnvs').then(function(response){
          $scope.envs = response.data;
    });

    $http.get($rootScope.appUrl+'/getSectors').then(function(response){
          $scope.sectors = response.data;
    });

    var tokenData = {};
    tokenData['token'] = $window.sessionStorage.getItem('clientToken');
    tokenData['user'] = $window.sessionStorage.getItem('user');
    $http.post($rootScope.appUrl+'/getUsersList', tokenData).then(function(response){
          if(response.data.status == 'sessionExpired'){
              $rootScope.expireSession();
          }
          users = {};
          $scope.users = response.data.data.slice();
          for(var i=0; i<$scope.users.length;i++){
              for(var j=0;j<$scope.users[i].role.length;j++){
                  var roleObj = {};
                  roleObj = angular.copy($scope.users[i]);
                  roleObj['secRole'] = $scope.users[i].role[j];
                  if(!users[$scope.users[i].role[j]]){
                    users[$scope.users[i].role[j]] = [];
                    users[$scope.users[i].role[j]].push(roleObj);
                    continue;
                  }
                  users[$scope.users[i].role[j]].push(roleObj);
              }
          }
    });

    $scope.changeRestrictList = function(allowed_roles){
      $scope.usrs.data = [];
      for(var i=0;i<allowed_roles.length;i++){
        Array.prototype.push.apply($scope.usrs.data,users[allowed_roles[i]]);
      }
      if($scope.user.data.allowed_users && !$scope.user.data.allowed_users.length <= 0){
        for(var i=0;i<$scope.user.data.allowed_users.length;i++){
          if(allowed_roles.indexOf(getAllowedUserRole($scope.user.data.allowed_users[i])) < 0){
            $scope.user.data.allowed_users.splice(i,1);
            i--;
          }
        }
      }
    };

    $scope.getEmailName = function(obj){
      var splits = obj.email.split("@");
      return splits[0];
    };

    $scope.getUserRole = function(obj){
      var splits = obj.secRole.split("_");
      return splits[1];
    };

    function getAllowedUserRole(str){
      var splits = str.split(" : ");
      return "role_"+splits[1];
    }

    $scope.hideCreateUserPopUp = function(){
        $mdDialog.hide();
    };

    $scope.checkForExistingUser = function(){
        $scope.error = false;
        var userTeam = $window.sessionStorage.getItem('team');
        if(!$rootScope.userList){
          $scope.invalid = false;
        }
        else if(!$rootScope.userList[userTeam]){
          $scope.invalid = false;
        }
        else if(!$rootScope.userList[userTeam][$scope.user.data.sector]){
          $scope.invalid = false;
        }
        else if(!$rootScope.userList[userTeam][$scope.user.data.sector][$scope.user.data.environment]){
          $scope.invalid = false;
        }
        else if($rootScope.userList[userTeam][$scope.user.data.sector][$scope.user.data.environment].indexOf($scope.user.data.username) < 0){
          $scope.invalid = false;
        }
        else{
            $scope.invalid = true;
        }
    };

    $scope.submitNewUser = function(){
        $scope.checkForExistingUser();
        if($scope.invalid == true){
            $scope.error = true;
            $scope.errorMsg = 'Username already exist, Try another.';
        }
        else{
            $scope.formStatus = 'Processing';
            $scope.user.token = $window.sessionStorage.getItem('clientToken');
            $scope.user.data.createdBy = $window.sessionStorage.getItem('user');
            $scope.user.loggedInUser = $window.sessionStorage.getItem('user');
            $scope.user.team = $window.sessionStorage.getItem('team');
            $http.post($rootScope.appUrl+'/createCredential',$scope.user).then(function(response){
                $scope.formStatus = 'Initial';
                console.log(response.data);
                if(response.data.status == 'success'){
                    $rootScope.$broadcast('passwordAdded');
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
