app.controller("listOtpRolesCtrl", function ($scope,$http,$rootScope,$mdToast,$mdDialog,$window,$state) {
      $scope.checkAll = false;
      $scope.selected = [];
      $scope.roles = [];
      var tokenData = {};
      tokenData['token'] = $window.sessionStorage.getItem('clientToken');
      tokenData['user'] = $rootScope.user;
      $http.post($rootScope.appUrl+'/getOtpRolesData',tokenData).then(function(response){
        if(response.data.status == 'sessionExpired'){
            $rootScope.expireSession();
        }
        $scope.roles = response.data;
        var roles = {};
        for(var i=0; i<$scope.roles.length;i++){
           var role = $scope.roles[i].name;
           roles[role] = role;
        }
        $rootScope.roleList = roles;
      });

      $scope.addRole = function(ev) {
            $mdDialog.show({
              templateUrl: '/vaultApp/sshManagement/otpRole/addOtpRole/addOtpRole.html',
              parent: angular.element(document.querySelector('body')),
              targetEvent: ev,
              clickOutsideToClose:false,
              escapeToClose:true,
              fullscreen: false // Only for -xs, -sm breakpoints.
            })
            .then(function(answer) {
            }, function() {
            });
      };

    $scope.editRole = function(ev,roleData) {
            $rootScope.roleData = roleData;
            $mdDialog.show({
              templateUrl: '/vaultApp/sshManagement/otpRole/editOtpRole/editOtpRole.html',
              parent: angular.element(document.querySelector('body')),
              targetEvent: ev,
              clickOutsideToClose:false,
              escapeToClose:true,
              fullscreen: false // Only for -xs, -sm breakpoints.
            })
            .then(function(answer) {
              //$scope.status = 'You said the information was "' + answer + '".';
            }, function() {
              //$scope.status = 'You cancelled the dialog.';
            });
      };

    $scope.deleteRole = function(ev,roleData) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
              .title('Sure, You want to Continue ?')
              .textContent('Role \''+roleData.name+'\' will be permanently removed.')
              .ariaLabel('Lucky day')
              .targetEvent(ev)
              .ok('Please do it!')
              .cancel('Don\'t delete');

        $mdDialog.show(confirm).then(function() {
          deleteSelectedRole(roleData);
        }, function() {
          $mdDialog.hide();
        });
  };

    var deleteSelectedRole = function(role){
        role.token = $window.sessionStorage.getItem('clientToken');
        role.user = $rootScope.user;
        $http.post($rootScope.appUrl+'/deleteOtpRole',role).then(function(response){
            if(response.data.status == 'sessionExpired'){
                $rootScope.expireSession();
            }
            else if (response.data.status == 'success'){
                $rootScope.$broadcast('roleDeleted');
            }
            else{
                $rootScope.$broadcast('errorOccured');
            }
        });
    };

    $scope.deleteAllSelected = function(ev){
         var confirm = $mdDialog.confirm()
              .title('Sure, You want to delete all these selected roles?')
              .textContent('Roles will be removed permanently.')
              .ariaLabel('Lucky day')
              .targetEvent(ev)
              .ok('Please do it!')
              .cancel('Don\'t delete');

        $mdDialog.show(confirm).then(function() {
          deleteRecursive($scope.selected,0);
        }, function() {
          $mdDialog.hide();
        });
     };

    var deleteRecursive = function(selectedList,index){
        if (index >= $scope.selected.length){
            $rootScope.$broadcast('selectedRolesDeleted');
        }
        else{
            var roleToDelete = selectedList[index];
            roleToDelete.token = $window.sessionStorage.getItem('clientToken');
            roleToDelete.user = $rootScope.user;
            $http.post($rootScope.appUrl+'/deleteOtpRole',roleToDelete).then(function(response){
                if (response.data.status == 'success'){
                    deleteRecursive(selectedList,index+1);
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

    // Code For Multiple select Start
      $scope.toggle = function (item, list) {
        var idx = list.indexOf(item);
        if (idx > -1) {
          list.splice(idx, 1);
        }
        else {
          list.push(item);
        }
      };

      $scope.exists = function (item, list) {
        return list.indexOf(item) > -1;
      };

      $scope.isIndeterminate = function() {
        return ($scope.selected.length !== 0 &&
            $scope.selected.length !== $scope.roles.length);
      };

      $scope.isChecked = function() {
        return $scope.selected.length === $scope.roles.length;
      };

      $scope.toggleAll = function() {
        if ($scope.selected.length === $scope.roles.length) {
          $scope.selected = [];
        } else if ($scope.selected.length === 0 || $scope.selected.length > 0) {
          $scope.selected = $scope.roles.slice(0);
        }
      };


    $rootScope.$on('roleAdded', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('Role created sucessfully!'));
        $window.location.reload();
    });

    $rootScope.$on('roleEdited', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('Role details updated sucessfully!'));
        $state.reload();
    });

    $rootScope.$on('roleDeleted', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('Role deleted sucessfully!'));
        $window.location.reload();
    });

    $rootScope.$on('selectedRolesDeleted', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('Selected Roles Deleted Sucessfully!'));
        $window.location.reload();
    });


});
