app.controller("addOtpRoleCtrl", function ($scope,$rootScope,$http,$mdDialog,$window) {
    $scope.formStatus = 'Initial';
    $scope.role = {};
    $scope.days = 1;
    $scope.collapse = true;
    $scope.collapseSub = true;
    $scope.selected = {};
    var selectedHypervCounts = {};
    var total_ips_in_cidrs = 0;

    $http.get($rootScope.appUrl+'/getCidrs').then(function(response){
      $scope.cidrs = response.data.data;
      $scope.cidr_list_for_all = response.data.cidr_list.all;
      for(var x in $scope.cidrs){
        selectedHypervCounts[x] = 0;
        total_ips_in_cidrs = total_ips_in_cidrs + Object.keys($scope.cidrs[x]).length;
      }
    });

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
    $scope.checkForExistingRole = function(){
        $scope.error = false;
        if($rootScope.roleList.hasOwnProperty($scope.role.name)){
            $scope.invalid = true;
        }
        else{
            $scope.invalid = false;
        }
    };

    $scope.addRole = function(){
      if($scope.invalid == true){
          $scope.error = true;
          $scope.errorMsg = 'Role already exist, Try another.';
      }
      else{
            $scope.formStatus = 'Processing';
            $scope.role.primary.key_type = 'otp';
            var expiry = new Date();
            expiry.setDate(expiry.getDate() + $scope.days);
            $scope.role.secondary.expiry = expiry;
            if($scope.role.secondary.status == 'inactive' || $scope.days == null){
              $scope.role.secondary.expiry = null;
            }
            $scope.role.secondary.host = [];
            $scope.role.secondary.selectedHypervCounts = selectedHypervCounts;
            for(var x in selectedHypervCounts){
              if(eval(selectedHypervCounts[x]) > 0){
                  $scope.role.secondary.host.push(x);
                }
              }
            $scope.role.primary.cidr_list = $scope.cidr_list_for_all;
            $scope.role.secondary.selected_ip_list = $scope.selected;
            $scope.role.token = $window.sessionStorage.getItem('clientToken');
            $scope.role.user = $rootScope.user;
            $http.post($rootScope.appUrl+'/createOtpRole',$scope.role).then(function(response){
            $scope.formStatus = 'Initial';
            if(response.data.status == 'sessionExpired'){
                $rootScope.expireSession();
            }
            else if (response.data.status == 'success'){
                $rootScope.$broadcast('roleAdded');
            }
            else{
                $rootScope.$broadcast('errorOccured');
            }
          });
        }
      };

    // Code For Multiple select Start
      $scope.toggle = function (hyperVname,hyperVip,list,hyperVClass) {
        if (list.hasOwnProperty(hyperVname)) {
          //list.splice(idx, 1);
          delete list[hyperVname];
          selectedHypervCounts[hyperVClass] = selectedHypervCounts[hyperVClass] - 1;
        }
        else {
          //list.push(item);
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
