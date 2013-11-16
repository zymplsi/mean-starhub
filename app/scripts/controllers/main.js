'use strict';

angular.module('yeomanMeanstackApp')
  .controller('MainCtrl', function($scope, socket) {
    var arr = [];
    socket.on('all', function(data) {
        console.log(data);
        arr.push(data);
    });
    $scope.messages = arr;

    $scope.myInterval = 5000;
  });
