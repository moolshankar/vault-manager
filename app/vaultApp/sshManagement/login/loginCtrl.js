app.controller('sshLoginCtrl', function ($scope,$http,$rootScope,$window,$state) {
    $scope.formStatus = 'Initial';
    if($window.sessionStorage.getItem('sessionExpired') == 'true'){
      $scope.error = true;
      $scope.errorMsg = "Session Expired! Login again.";
    }
    $window.sessionStorage.clear();

    $scope.loginUser = function(){
      if($scope.user.name == '' || $scope.user.password == ''){
        $scope.formStatus = 'Initial';
        $scope.error = true;
        $scope.errorMsg = "Username or password is blank.";
      }
      else{
            $http.post($rootScope.appUrl+'/authUserWithMac',$scope.user).then(function(response){
            if(response.data.status == 'success'){
                $scope.formStatus = 'Initial';
                $rootScope.setSessionParams(response.data);
                $window.location.href = '/ssh/dashboard';
            }
            else if(response.data.status == 'No Mac'){
                $scope.formStatus = 'Initial';
                console.log(response);
                $scope.error = true;
                $scope.errorMsg = "Oops! Error while capturing mac id, Contact Admin.";
            }
            else if(response.data.status == 'Invalid Mac'){
                $scope.formStatus = 'Initial';
                console.log(response);
                $scope.error = true;
                $scope.errorMsg = "Oops! Logging from unauthorized machine.";
            }
            else if(response.data.status == 'failed'){
                $scope.formStatus = 'Initial';
                console.log(response);
                $scope.error = true;
                $scope.errorMsg = "Username or password is incorrect";
            }
            else{
                  $rootScope.$broadcast('errorOccured');
            }
        });
      }
    };
});
