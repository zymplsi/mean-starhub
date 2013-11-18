'use strict';

angular.module('yeomanMeanstackApp')
  .controller('MainCtrl', function($scope, socket) {
    var arr = [];
    socket.on('all', function(data) {
        console.log(data);
        //arr.push(data);
        arr.unshift(data);
        arry[0].active = true;
    });
    $scope.messages = arr;

    $scope.myInterval = 4000;
  });
