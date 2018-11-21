app.controller("listUsersCtrl", function ($scope,$http,$rootScope,$mdDialog,$state,$mdToast,$window) {
      $scope.checkAll = false;
      $scope.selected = [];
      $scope.users = [];
      var tokenData = {};
      tokenData['token'] = $window.sessionStorage.getItem('clientToken');
      tokenData['user'] = $rootScope.user;
      $http.post($rootScope.appUrl+'/getUsersList', tokenData).then(function(response){
            if(response.data.status == 'sessionExpired'){
                $rootScope.expireSession();
            }
            $scope.users = response.data.data.slice();
            var users = {};
            for(var i=0; i<$scope.users.length;i++){
              var user = $scope.users[i].name;
              //$scope.users[i].role = $scope.users[i].role.split(',');
              users[user] = user;
              if($scope.users[i].name == $rootScope.user){
                $scope.users.splice(i,1);
                i--;
              }
            }
            $rootScope.userList = users;
      });

      $scope.addUser = function(ev) {
            $mdDialog.show({
              templateUrl: '/vaultApp/userManagement/User/AddUser/addUser.html',
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

    $scope.editUser = function(ev,userData) {
            $rootScope.userData = userData;
            $mdDialog.show({
              templateUrl: '/vaultApp/userManagement/User/EditUser/editUser.html',
              parent: angular.element(document.querySelector('body')),
              targetEvent: ev,
              clickOutsideToClose:false,
              escapeToClose:true,
              fullscreen: true
            })
            .then(function(answer) {
            }, function() {
            });
      };

    $scope.deleteUser = function(ev,userData) {
        var confirm = $mdDialog.confirm()
              .title('Sure, You want to Continue ?')
              .textContent('User \''+userData.name+'\' will be permanently removed.')
              .ariaLabel('Lucky day')
              .targetEvent(ev)
              .ok('Please do it!')
              .cancel('Don\'t delete');

        $mdDialog.show(confirm).then(function() {
          deleteSelectedUser(userData);
        }, function() {
          $mdDialog.hide();
        });
    };

    var deleteSelectedUser = function(user){
        user.token = $window.sessionStorage.getItem('clientToken');
        user.loggedInUser = $rootScope.user;
        $http.post($rootScope.appUrl+'/deleteUser',user).then(function(response){
            if (response.data.status == 'success'){
                $rootScope.$broadcast('userDeleted');
            }
            else if(response.data.status == 'sessionExpired'){
                      $rootScope.expireSession();
                  }
            else{
                $rootScope.$broadcast('errorOccured');
            }
        });
    };

    $scope.deleteAllSelected = function(ev){
         var confirm = $mdDialog.confirm()
              .title('Sure, You want to delete all these selected users?')
              .textContent('Users will be removed permanently.')
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
            $rootScope.$broadcast('selectedUsersDeleted');
        }
        else{
            var userToDelete = selectedList[index];
            userToDelete.token = $window.sessionStorage.getItem('clientToken');
            userToDelete.loggedInUser = $rootScope.user;
            $http.post($rootScope.appUrl+'/deleteUser',userToDelete).then(function(response){
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
            $scope.selected.length !== $scope.users.length);
      };

      $scope.isChecked = function() {
        return $scope.selected.length === $scope.users.length;
      };

      $scope.toggleAll = function() {
        if ($scope.selected.length === $scope.users.length) {
          $scope.selected = [];
        } else if ($scope.selected.length === 0 || $scope.selected.length > 0) {
          $scope.selected = $scope.users.slice(0);
        }
      };

    //Notification Services Start
    $rootScope.$on('userAdded', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('User Created Sucessfully!'));
        $window.location.reload();
    });

    $rootScope.$on('userEdited', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('User Details Updated Sucessfully!'));
        $state.reload();
    });

    $rootScope.$on('userDeleted', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('User Deleted Sucessfully!'));
        $window.location.reload();
    });

    $rootScope.$on('selectedUsersDeleted', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('Selected Users Deleted Sucessfully!'));
        $window.location.reload();
    });
      // Code For Multiple select Stop

});
