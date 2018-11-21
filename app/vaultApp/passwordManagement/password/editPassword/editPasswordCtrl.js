app.controller("editPasswordCtrl", function ($scope,$rootScope,$mdDialog,$mdToast,$http,$state,$window,$document) {
    $scope.formStatus = 'Initial';
    $scope.error = false;
    $scope.invalid = false;
    $scope.usrs = {};
    $scope.usrs.data = [];
    $http.get($rootScope.appUrl+'/getUserRoles').then(function(response){
          $scope.roles = response.data;
    });
    $http.get($rootScope.appUrl+'/getEnvs').then(function(response){
          $scope.envs = response.data;
    });
    $http.get($rootScope.appUrl+'/getSectors').then(function(response){
          $scope.sectors = response.data;
    });
    $scope.user = {};
    $scope.loggedInRole = $rootScope.loggedInRole;
    $scope.user.data = angular.copy($rootScope.userData);
    // if($scope.user.data.allowed_users){
    //   for(var i=0;i<$scope.user.data.allowed_users.length;i++){
    //     $scope.user.data.allowed_users[i] = JSON.parse($scope.user.data.allowed_users[i]);
    //   }
    // }
    var tokenData = {};
    var users = {};
    tokenData['token'] = $window.sessionStorage.getItem('clientToken');
    tokenData['user'] = $window.sessionStorage.getItem('user');
    var postRequestCompleted = false;
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
          postRequestCompleted = true;
          changeRestrictList($scope.user.data.allowed_roles);
    });

    $scope.changeRestrictList = function(allowed_roles){
        if(postRequestCompleted == true)
          changeRestrictList(allowed_roles);
    };

    function changeRestrictList(allowed_roles){
      $scope.usrs.data = [];
      if(!allowed_roles){
        $scope.user.data.allowed_users = [];
        return;
      }
      for(var i=0;i<allowed_roles.length;i++){
        Array.prototype.push.apply($scope.usrs.data,users[allowed_roles[i]]);
      }
      if($scope.user.data.allowed_users && !$scope.user.data.allowed_users.length <= 0){
        for(var i=0;i<$scope.user.data.allowed_users.length;i++){
            var exist = false;
            for(var k=0;k<$scope.usrs.data.length;k++){
              var matchString = $scope.usrs.data[k].name + ' : ' + $scope.usrs.data[k].secRole.split('_')[1];
              if(matchString == $scope.user.data.allowed_users[i]){
                exist = true;
              }
            }
            if(exist == false){
              $scope.user.data.allowed_users.splice(i,1);
              i--;
            }
        }
      }
    }

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

    function getAllowedUserName(str){
      var splits = str.split(" : ");
      return splits[0];
    }

    $scope.checkForExistingUser = function(){
        $scope.error = false;
        if($rootScope.userList.hasOwnProperty($scope.user.data.name) && $scope.user.data.name != $rootScope.userData.username){
            $scope.invalid = true;
        }
        else{
            $scope.invalid = false;
        }
    };

    $scope.editCredential = function(){
        if($scope.invalid == true){
            $scope.error = true;
            $scope.errorMsg = 'Username already exist, Try another.';
        }
        else{
            $scope.formStatus = 'Processing';
            changeRestrictList($scope.user.data.allowed_roles);
            $scope.user.token = $window.sessionStorage.getItem('clientToken');
            $scope.user.loggedInUser = $window.sessionStorage.getItem('user');
            $scope.user.team = $window.sessionStorage.getItem('team');
            $http.post($rootScope.appUrl+'/createCredential',$scope.user).then(function(response){
                $scope.formStatus = 'Initial';
                if(response.data.status == 'success'){
                    $rootScope.$broadcast('passwordEdited');
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
    $scope.hideEditUserPopUp = function(){
        $mdDialog.hide();
    };
});
