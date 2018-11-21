app.controller("otpCtrl", function ($scope,$rootScope,$mdDialog,$mdToast,$interval,$http,$state,$window) {
      var userData = {};
      $scope.error = false;
      userData.name = $rootScope.user;
      userData.ssh_otp_role = $window.sessionStorage.getItem('otpRole');
      userData.token = $window.sessionStorage.getItem('clientToken');
      continueExistingCountDown();
      $http.post($rootScope.appUrl+'/getUserRoleData',userData).then(function(response){
        if(response.data.status == 'sessionExpired'){
            $rootScope.expireSession();
        }
        $scope.roles = response.data;
      });
      $scope.generateOtp = function(ev,roleData) {
        $mdDialog.show({
            controller: DialogController,
            templateUrl: '/vaultApp/sshManagement/otpRole/otp/generate.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
          })
          .then(function(result) {
            if($scope.seconds > 0){
              expireOtp();
            }
            roleData.primary.ip = result;
            roleData.token = $window.sessionStorage.getItem('clientToken');
            roleData.user = $rootScope.user;
            $http.post($rootScope.appUrl+'/generateOtp',roleData).then(function(response){
              if(response.data.status == 'sessionExpired'){
                  $rootScope.expireSession();
              }
              else if(response.data.status == 'error'){
                  $scope.error = true;
                  $scope.errorMsg = response.data.data;
              }else{
                $scope.error = false;
                $scope.otpData = response.data.data;
                $rootScope.localOtpData = {};
                $rootScope.localOtpData.value = $scope.otpData.key;
                $rootScope.localOtpData.startTime = undefined;
                countDown();
              }
            });
          }, function() {
        });

        function DialogController($scope, $mdDialog) {
            $scope.ipSets = roleData.secondary.selected_ip_list;
            $scope.cancel = function() {
              $mdDialog.cancel();
            };

            $scope.submit = function(data) {
              $mdDialog.hide(data.ip);
            };
        } // DialogController ends
      }; //$scope.generateOtp

      function continueExistingCountDown(){
        if($window.sessionStorage.getItem('otpValue')){
          $rootScope.localOtpData = {};
          $rootScope.localOtpData.value = $window.sessionStorage.getItem('otpValue');
          $rootScope.localOtpData.startTime = new Date($window.sessionStorage.getItem('otpStartTime'));
          countDown();
        }
      }

      function countDown(){
          if(!$rootScope.localOtpData.startTime){
            $rootScope.localOtpData['startTime'] = new Date();
            $window.sessionStorage.setItem('otpStartTime',$rootScope.localOtpData.startTime);
            $window.sessionStorage.setItem('otpValue',$rootScope.localOtpData.value);
          }
          $scope.sshOtp = $rootScope.localOtpData.value;
           promise = $interval(function() {
              $scope.seconds = 31 - Math.floor((new Date() - $rootScope.localOtpData['startTime']) / 1000);
              if($scope.seconds <= 0){
                $scope.sshOtp = undefined;
                $scope.otpData = undefined;
                $window.sessionStorage.removeItem('otpStartTime');
                $window.sessionStorage.removeItem('otpValue');
                expireOtp();
              }
          }, 1000);
      };

      var expireOtp = function(){
        $interval.cancel(promise);
        var otp = {};
        otp['otp'] = $rootScope.localOtpData.value;
        otp.token = $window.sessionStorage.getItem('clientToken');
        otp.user = $rootScope.user;
        $rootScope.localOtpData = undefined;
        $http.post($rootScope.appUrl+'/expireOtp',otp).then(function(response){
            if(response.data.status == 'sessionExpired'){
                $rootScope.expireSession();
            }
            $mdToast.show($mdToast.simple().textContent('OTP expired!'));
        });
      };

      $scope.copy = function () {
            $mdToast.show($mdToast.simple().textContent('OTP copied to clipboard!'));
      };
});
