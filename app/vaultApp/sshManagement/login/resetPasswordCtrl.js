app.controller('sshResetPasswordCtrl', function ($scope,$http,$rootScope,$window,$state) {
    $scope.formStatus = 'Initial';
    $scope.reset = function(){
      if($scope.user.newPassword == '' || $scope.user.confirmPassword == ''){
        $scope.formStatus = 'Initial';
        $scope.error = true;
        $scope.errorMsg = "New password or confirm password is blank.";
      }
      else if($scope.user.newPassword !=  $scope.user.confirmPassword){
        $scope.formStatus = 'Initial';
        $scope.error = true;
        $scope.errorMsg = "New password and confirm password should be same.";
      }
      else{
        $scope.user.name = $window.sessionStorage.getItem('user');
        $scope.user.token = $window.sessionStorage.getItem('clientToken');
        $http.post($rootScope.appUrl+'/resetPassword',$scope.user).then(function(response){
            if(response.data.status == 'success'){
                $window.sessionStorage.setItem('userStatus','Active');
                $window.location.href = '/ssh/dashboard';
            }
            else{
                $scope.formStatus = 'Initial';
                console.log(response);
                $scope.error = true;
                $scope.errorMsg = response.data.status;
            }
        });
      }
    };



});
