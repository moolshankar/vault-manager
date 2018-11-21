app.controller("editOtpRoleCtrl", function ($scope,$rootScope,$http,$mdDialog,$window) {
    $scope.formStatus = 'Initial';
    $scope.role = {};
    $scope.selected = {};
    var selectedHypervCounts = {};
    var total_ips_in_cidrs = 0;
    $http.get($rootScope.appUrl+'/getCidrs').then(function(response){
      $scope.cidrs = response.data.data;
      for(var x in $scope.cidrs){
        total_ips_in_cidrs = total_ips_in_cidrs + Object.keys($scope.cidrs[x]).length;
      }
    });
    angular.copy($rootScope.roleData, $scope.role);
    angular.copy($scope.role.secondary.selected_ip_list, $scope.selected);
    angular.copy($scope.role.secondary.selectedHypervCounts, selectedHypervCounts);
    if($scope.role.secondary.expiry){
      var current = new Date();
      $scope.days = Math.ceil(( Date.parse($scope.role.secondary.expiry) - current ) / 86400000);
    }else{
      $scope.days = 0;
    }
    var tokenData = {};
    tokenData['token'] = $window.sessionStorage.getItem('clientToken');
    tokenData['user'] = $rootScope.user;
    $http.post($rootScope.appUrl+'/getUsersList', tokenData).then(function(response){
          if(response.data.status == 'sessionExpired'){
              $rootScope.expireSession();
          }
          $scope.users = response.data.data.slice();
    });
    $scope.hideCreateRolePopUp = function(){
        $mdDialog.hide();
    };

    $scope.editRole = function(){
        $rootScope.roleData.token = $window.sessionStorage.getItem('clientToken');
        $rootScope.roleData.user = $rootScope.user;
        $http.post($rootScope.appUrl+'/deleteOtpRole',$rootScope.roleData).then(function(response){
            $scope.formStatus = 'Initial';
            if(response.data.status == 'sessionExpired'){
                $rootScope.expireSession();
            }
            else if (response.data.status == 'success'){
                addRole();
            }
            else{

            }
      });
    };

    var addRole = function(){
        $scope.formStatus = 'Processing';
        var expiry = new Date();
        expiry.setDate(expiry.getDate() + $scope.days);
        $scope.role.secondary.expiry = expiry;
        if($scope.role.secondary.status == 'inactive'){
          $scope.role.secondary.expiry = null;
        }
        $scope.role.secondary.selectedHypervCounts = selectedHypervCounts;
        $scope.role.secondary.host = [];
        for(var x in selectedHypervCounts){
          if(eval(selectedHypervCounts[x]) > 0){
              $scope.role.secondary.host.push(x);
            }
          }
        $scope.role.secondary.selected_ip_list = $scope.selected;
        $scope.role.token = $window.sessionStorage.getItem('clientToken');
        $scope.role.user = $rootScope.user;
        $http.post($rootScope.appUrl+'/createOtpRole',$scope.role).then(function(response){
            $scope.formStatus = 'Initial';
            if(response.data.status == 'sessionExpired'){
                $rootScope.expireSession();
            }
            else if (response.data.status == 'success'){
                $rootScope.$broadcast('roleEdited');
            }
            else{
                $rootScope.$broadcast('errorOccured');
            }
      });
    };

    // Code For Multiple select Start
      $scope.toggle = function (hyperVname,hyperVip,list,hyperVClass) {
        if (list.hasOwnProperty(hyperVname)) {
          delete list[hyperVname];
          selectedHypervCounts[hyperVClass] = selectedHypervCounts[hyperVClass] - 1;
        }
        else {
          list[hyperVname] = hyperVip;
          selectedHypervCounts[hyperVClass] = selectedHypervCounts[hyperVClass] + 1;
        }
      };

      $scope.exists = function (hyperVname, list) {
        return list.hasOwnProperty(hyperVname);
      };

      $scope.isIndeterminate = function(hyperV) {
        if(hyperV == 'all'){
          return (Object.keys($scope.selected).length !== 0 &&
              Object.keys($scope.selected).length !== total_ips_in_cidrs);
        }else{
          return (selectedHypervCounts[hyperV] !== 0 &&
              selectedHypervCounts[hyperV] !== Object.keys($scope.cidrs[hyperV]).length);
        }

      };

      $scope.isChecked = function(hyperV) {
        if(hyperV == 'all'){
          return Object.keys($scope.selected).length === total_ips_in_cidrs;
        }else{
          return selectedHypervCounts[hyperV] === Object.keys($scope.cidrs[hyperV]).length;
        }
      };

      $scope.toggleAll = function(hyperVClass) {
        if(hyperVClass == 'all'){
          if (Object.keys($scope.selected).length === total_ips_in_cidrs) {
            $scope.selected = {};
            for(var x in $scope.cidrs){
              selectedHypervCounts[x] = 0;
            }
          } else if (Object.keys($scope.selected).length === 0 || Object.keys($scope.selected).length > 0) {
            for(var x in $scope.cidrs){
              selectedHypervCounts[x] = 0;
                for(var y in $scope.cidrs[x]){
                  $scope.selected[y] = $scope.cidrs[x][y];
                  selectedHypervCounts[x] = selectedHypervCounts[x] + 1;
                }
            }
          }
        }else{
          if (selectedHypervCounts[hyperVClass] === Object.keys($scope.cidrs[hyperVClass]).length) {
              for(var x in $scope.cidrs[hyperVClass]){
                if($scope.selected.hasOwnProperty(x)){
                  delete $scope.selected[x];
                  selectedHypervCounts[hyperVClass] = selectedHypervCounts[hyperVClass] - 1;
                }
              }
          }else if (selectedHypervCounts[hyperVClass] === 0 || selectedHypervCounts[hyperVClass] > 0) {
            selectedHypervCounts[hyperVClass] = 0;
            for(var x in $scope.cidrs[hyperVClass]){
              $scope.selected[x] = $scope.cidrs[hyperVClass][x];
              selectedHypervCounts[hyperVClass] = selectedHypervCounts[hyperVClass] + 1;
            }
          }
        }
      };
});
