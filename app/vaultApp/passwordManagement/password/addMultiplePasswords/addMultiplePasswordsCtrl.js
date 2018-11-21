app.controller("addMultiplePasswordsCtrl", function ($scope,$rootScope,$mdDialog,$http,$state,$window,$mdToast) {
    $scope.formStatus = 'Initial';
    $scope.error = false;
    $scope.invalid = false;
    $scope.data = {};

    if($rootScope.customData){
      $scope.data.custom = $rootScope.customData;
    }
    var dataGroup = [];
    var userExists = false;
    var existingUsers = [];
    var envExists = true;
    var invalidEnvs = [];
    var sectorExists = true;
    var invalidSectors = [];

    $scope.hideCreateUserPopUp = function(){
        $mdDialog.hide();
    };

    var envs;
    var sectors;
    $http.get($rootScope.appUrl+'/getEnvs').then(function(response){
          envs = response.data;
    });
    $http.get($rootScope.appUrl+'/getSectors').then(function(response){
          sectors = response.data;
    });

    $scope.createMultiple = function(){
        if($scope.invalid == true){
            $scope.error = true;
            $scope.errorMsg = 'Username already exist, Try another.';
        }
        else{
            $scope.formStatus = 'Processing';
            restructureData();
            var envString = "";
            if(envExists == false || sectorExists == false){
              var dataString = "";
              var errorMsg = "";
              if(envExists == false){
                errorMsg = "Following environments are not valid. Please edit or cancel addition.";
                for(var i=0;i<invalidEnvs.length;i++){
                  if(i == invalidEnvs.length-1){
                    dataString = dataString + invalidEnvs[i];
                    continue;
                  }
                  dataString = dataString + dataString[i] + ", ";
                }
              }
              if(sectorExists == false){
                errorMsg = "Following sectors are not valid. Please edit or cancel addition.";
                for(var i=0;i<invalidSectors.length;i++){
                  if(i == invalidSectors.length-1){
                    dataString = dataString + invalidSectors[i];
                    continue;
                  }
                  dataString = dataString + invalidSectors[i] + ", ";
                }
              }
              var confirm = $mdDialog.confirm()
                            .title(errorMsg)
                            .textContent(dataString)
                            .ariaLabel('Search Notification')
                            .clickOutsideToClose(false)
                            .escapeToClose(false)
                            .ok('Cancel')
                            .cancel('Back to Edit');

              $mdDialog.show(confirm).then(function() {
                  $mdDialog.hide();
              }, function() {
                  showCreateDialog();
              });
            }
            else if(userExists == true){
                var userString = "";
                for(var i=0;i<existingUsers.length;i++){
                  if(i == existingUsers.length-1){
                    userString = userString + existingUsers[i];
                    continue;
                  }
                  userString = userString + existingUsers[i] + ", ";
                }
                var confirm = $mdDialog.confirm()
                              .title('Credentials with following usernames already exist in same environment and will be replaced. Do you want to Continue?')
                              .textContent(userString)
                              .ariaLabel('Search Notification')
                              .clickOutsideToClose(false)
                              .escapeToClose(false)
                              .ok('Continue and replace existing')
                              .cancel('Back to Edit');

                $mdDialog.show(confirm).then(function() {
                    createMultipleCredential();
                }, function() {
                    showCreateDialog();
                });
            }else{
              createMultipleCredential();
            }
        }
    };

    function createMultipleCredential(){
      $scope.user = {};
      $rootScope.customData = undefined;
      $scope.user.data = dataGroup;
      $scope.user.token = $window.sessionStorage.getItem('clientToken');
      $scope.user.loggedInUser = $window.sessionStorage.getItem('user');
      $scope.user.team = $window.sessionStorage.getItem('team');
      $http.post($rootScope.appUrl+'/multiCredentialCreate',$scope.user).then(function(response){
          $scope.formStatus = 'Initial';
          if(response.data.status == 'success'){
            $mdDialog.hide();
            $mdToast.show($mdToast.simple().textContent('Passwords Added Sucessfully!'));
            $window.location.reload();
          }
          else if(response.data.status == 'sessionExpired'){
              $rootScope.expireSession();
          }
          else{
            console.log(response);
          }
        });
    }

    function showCreateDialog(){
      $mdDialog.show({
        templateUrl: '/vaultApp/passwordManagement/password/addMultiplePasswords/addMultiplePasswords.html',
        parent: angular.element(document.querySelector('body')),
        clickOutsideToClose:false,
        escapeToClose:true,
        fullscreen: false
      })
      .then(function(answer) {
      }, function() {
      });
    }

    function restructureData(){
      dataGroup = [];
      $rootScope.customData = $scope.data.custom;
      var rows = $scope.data.custom.split("\n");
      $scope.error = false;
      userExists = false;
      envExists = true;
      invalidEnvs = [];
      for(var i=0;i<rows.length;i++){
        var pwd = {};
        var cols = rows[i].trim().split("\t");
        if(cols[0]){
          pwd['username'] = cols[0];
        }
        else{
          continue;
        }
        pwd['password'] = '';
        if(cols[1]){
          pwd['password'] = cols[1];
        }
        pwd['sector'] = '';
        if(cols[2]){
          pwd['sector'] = cols[2].toLowerCase();
        }
        pwd['environment'] = '';
        if(cols[3]){
          pwd['environment'] = cols[3].toLowerCase();
        }
        pwd['allowed_roles'] = [];
        if(cols[4]){
          pwd['allowed_roles'] = cols[4].trim().split(",");
        }
        pwd['remark'] = '';
        if(cols[5]){
          pwd['remark'] = cols[5];
        }
        pwd['createdBy'] = $window.sessionStorage.getItem('user');
        if(envs.indexOf(pwd['environment']) < 0){
          envExists = false;
          invalidEnvs.push(pwd['environment']);
        }
        if(sectors.indexOf(pwd['sector']) < 0){
          sectorExists = false;
          invalidSectors.push(pwd['sector']);
        }
        if(checkForExistingUser(pwd)){
            userExists = true;
            existingUsers.push(pwd['username']);
        }
        dataGroup.push(pwd);
      }
    }

    var checkForExistingUser = function(user){
        $scope.error = false;
        var userTeam = $window.sessionStorage.getItem('team');
        if(!$rootScope.userList){
          return false;
        }
        else if(!$rootScope.userList[userTeam]){
          return false;
        }
        else if(!$rootScope.userList[userTeam][user.sector]){
          return false;
        }
        else if(!$rootScope.userList[userTeam][user.sector][user.environment]){
          return false;
        }
        else if($rootScope.userList[userTeam][user.sector][user.environment].indexOf(user.username) < 0){
          return false;
        }
        else{
            return true;
        }
    };
});
