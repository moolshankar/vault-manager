app.controller("listPasswordsCtrl", function ($scope,$http,$rootScope,$mdDialog,$state,$mdToast,$window) {
      $scope.checkAll = false;
      $scope.selected = [];
      $scope.passwords = [];
      $scope.readonlyPasswords = [];
      $scope.showRemark = false;
      var tokenData = {};
      tokenData['token'] = $window.sessionStorage.getItem('clientToken');
      tokenData['loggedInUserRole'] = $window.sessionStorage.getItem('loggedInRole').split(',');
      tokenData['loggedInUser'] = $window.sessionStorage.getItem('user');
      if($window.sessionStorage.getItem('team')){
        tokenData['team'] = $window.sessionStorage.getItem('team');
      }
      $http.post($rootScope.appUrl+'/getPasswordList', tokenData).then(function(response){
            if(response.data.status == 'sessionExpired'){
                $rootScope.expireSession();
            }
            $scope.passwords = response.data.data;
            var pwds = {};
            var envUsers = {};
            for(var i=0; i<$scope.passwords.length;i++){
              if(!pwds[$scope.passwords[i].team]){
                pwds[$scope.passwords[i].team] = {};
              }
              if(!pwds[$scope.passwords[i].team][$scope.passwords[i].sector]){
                pwds[$scope.passwords[i].team][$scope.passwords[i].sector] = {};
              }
              if(!pwds[$scope.passwords[i].team][$scope.passwords[i].sector][$scope.passwords[i].environment]){
                  pwds[$scope.passwords[i].team][$scope.passwords[i].sector][$scope.passwords[i].environment] = [];
                  pwds[$scope.passwords[i].team][$scope.passwords[i].sector][$scope.passwords[i].environment].push($scope.passwords[i].username);
              }else{
                  pwds[$scope.passwords[i].team][$scope.passwords[i].sector][$scope.passwords[i].environment].push($scope.passwords[i].username);
              }
              if(!envUsers[$scope.passwords[i].environment]){
                envUsers[$scope.passwords[i].environment] = [];
                envUsers[$scope.passwords[i].environment].push($scope.passwords[i].username);
              }else{
                envUsers[$scope.passwords[i].environment].push($scope.passwords[i].username);
              }
            }
            $rootScope.userList = pwds;
            $rootScope.envUsers = envUsers;
      });

      $scope.addUser = function(ev) {
            $mdDialog.show({
              templateUrl: '/vaultApp/passwordManagement/password/addPassword/addPassword.html',
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
              templateUrl: '/vaultApp/passwordManagement/password/editPassword/editPassword.html',
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

    $scope.deleteUser = function(ev,userData) {
        var confirm = $mdDialog.confirm()
              .title('Sure, You want to Continue ?')
              .textContent('User \''+userData.username+'\' will be permanently removed.')
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

    $scope.addMultiple = function(ev) {
          $mdDialog.show({
            templateUrl: '/vaultApp/passwordManagement/password/addMultiplePasswords/addMultiplePasswords.html',
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

    var deleteSelectedUser = function(user){
        delete user.password;
        user.token = $window.sessionStorage.getItem('clientToken');
        user.loggedInUser = $window.sessionStorage.getItem('user');
        user.team = $window.sessionStorage.getItem('team');
        $http.post($rootScope.appUrl+'/deleteCredential',user).then(function(response){
            if (response.data.status == 'success'){
                $rootScope.$broadcast('passwordDeleted');
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
              .title('Sure, You want to delete all these selected credentials?')
              .textContent('Credentials will be removed permanently.')
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
            $rootScope.$broadcast('selectedPasswordsDeleted');
        }
        else{
            var userToDelete = selectedList[index];
            if(userToDelete.readonly){
              deleteRecursive(selectedList,index+1);
              return;
            }
            delete userToDelete.password;
            userToDelete.token = $window.sessionStorage.getItem('clientToken');
            userToDelete.loggedInUser = $window.sessionStorage.getItem('user');
            userToDelete.team = $window.sessionStorage.getItem('team');
            $http.post($rootScope.appUrl+'/deleteCredential',userToDelete).then(function(response){
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

    $scope.getEmailName = function(str){
      var obj = JSON.parse(str);
      var splits = obj.email.split("@");
      return splits[0];
    };

    $scope.getUserRole = function(str){
      var obj = JSON.parse(str);
      var splits = obj.role.split("_");
      return splits[1];
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
            $scope.selected.length !== $scope.passwords.length);
      };

      $scope.isChecked = function() {
        return $scope.selected.length === $scope.passwords.length;
      };

      $scope.toggleAll = function() {
        if ($scope.selected.length === $scope.passwords.length) {
          $scope.selected = [];
        } else if ($scope.selected.length === 0 || $scope.selected.length > 0) {
          $scope.selected = $scope.passwords.slice(0);
        }
      };

    //Notification Services Start
    $rootScope.$on('passwordAdded', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('Password Created Sucessfully!'));
        $window.location.reload();
    });

    $rootScope.$on('passwordEdited', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('Password edited Sucessfully!'));
        $state.reload();
    });

    $rootScope.$on('passwordDeleted', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('Password Deleted Sucessfully!'));
        $window.location.reload();
    });

    $rootScope.$on('selectedPasswordsDeleted', function(){
        $mdDialog.hide();
        $mdToast.show($mdToast.simple().textContent('Selected Passwords Deleted Sucessfully!'));
        $window.location.reload();
    });
      // Code For Multiple select Stop
    $scope.isAdmin = function(){
          var isAdmin = false;
          for(var i=0;i<$rootScope.loggedInRole.length;i++){
            if ($rootScope.pwdAdmins.hasOwnProperty($rootScope.loggedInRole[i])){
              isAdmin = true;
              break;
            }
          }
          return isAdmin;
      };
});
