app.controller("editUserCtrl", function ($scope,$rootScope,$mdDialog,$mdToast,$http,$state,$window) {
    $scope.formStatus = 'Initial';
    $scope.error = false;
    $scope.user = {};
    $scope.loggedInRole = $rootScope.loggedInRole;
    //angular.copy($rootScope.userData,$scope.user.data);
    $scope.user.data = angular.copy($rootScope.userData);
    $scope.policyQuery = '';
    $scope.user.updatePassword == false;

    $http.get($rootScope.appUrl+'/getUserRoles').then(function(response){
          $scope.roles = response.data;
    });

    $http.get($rootScope.appUrl+'/getTeams').then(function(response){
          $scope.teams = response.data;
    });

    $scope.hideCreateUserPopUp = function(){
        $mdDialog.hide();
    };

    $scope.selectActive = function(name){
        $scope.policyQuery = '';
        $scope.selectedPolicies[name] = $scope.policies[name];
    };

    $scope.removeRow = function(name){
        $scope.policyQuery = '';
        delete $scope.selectedPolicies[name];
    };

    $scope.updateUser = function(){
        $scope.formStatus = 'Processing';
        $scope.error = false;
        if($scope.user.updatePassword == true || !isAdmin()){
          if(($scope.user.oldPassword == '') || $scope.user.newPassword == '' || $scope.user.confirmPassword == ''){
            $scope.formStatus = 'Initial';
            $scope.error = true;
            $scope.errorMsg = "Fill all Password fields.";
          }
          else if($scope.user.newPassword != $scope.user.confirmPassword){
              $scope.formStatus = 'Initial';
              $scope.error = true;
              $scope.errorMsg = "New password and confirm password are not same.";
          }
          else if($scope.user.newPassword == $scope.user.oldPassword){
              $scope.formStatus = 'Initial';
              $scope.error = true;
              $scope.errorMsg = "Please choose a different password.";
          }
        }
        if($scope.error == false){
                if(isAdmin()){
                  $scope.user.loggedInUser = 'admin';
                }
                else{
                  $scope.user.loggedInUser = 'non-admin';
                }
                if(!angular.isUndefined($scope.user.data.lan_macId))
                  $scope.user.data.lan_macId = $scope.user.data.lan_macId.toLowerCase();
                if(!angular.isUndefined($scope.user.data.wifi_macId))
                  $scope.user.data.wifi_macId = $scope.user.data.wifi_macId.toLowerCase();
                $scope.user.token = $window.sessionStorage.getItem('clientToken');
                $http.post($rootScope.appUrl+'/editUser',$scope.user).then(function(response){
                if (response.data.status == 'success'){
                    $scope.formStatus = 'Initial';
                    $mdToast.show($mdToast.simple().textContent('User Details Updated Sucessfully!'));
                    $mdDialog.hide();
                    $state.reload();
                }
                else if (response.data.status == 'incorrect password'){
                          $scope.formStatus = 'Initial';
                          $scope.error = true;
                          $scope.errorMsg = "Old password is incorrect";
                      }
                else if(response.data.status == 'sessionExpired'){
                          $rootScope.expireSession();
                      }
                else{
                        $rootScope.$broadcast('errorOccured');
                }
            });
        }
    };

    $scope.isAdmin = function(){
      return isAdmin();
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

    function isAdmin(){
      for(var i=0;i<$rootScope.loggedInRole.length;i++){
        if ($rootScope.userAdmins.hasOwnProperty($rootScope.loggedInRole[i])){
          return true;
        }
      }
      return false;
    };

    // var attachSelectedPolicies = function(){
    //     $scope.jdbc.policies = '';
    //     for ( property in $scope.selectedPolicies) {
    //       $scope.jdbc.policies = $scope.jdbc.policies + property +',';
    //     }
    //     $scope.jdbc.policies = $scope.jdbc.policies.slice(0, -1);
    //     $scope.jdbc.policies = "\""+$scope.jdbc.policies+"\"";
    // };
});
