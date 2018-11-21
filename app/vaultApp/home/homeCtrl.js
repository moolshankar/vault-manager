app.controller('homeCtrl', function ($scope,$http,$rootScope,$window,$mdDialog,$state) {
   $mdDialog.hide();
   $scope.logout = function(){
     $rootScope.logout();
   };
});
