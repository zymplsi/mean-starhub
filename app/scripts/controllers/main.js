'use strict';

angular.module('yeomanMeanstackApp')
    .controller('MainCtrl', function($scope, socket) {
        // $scope.awesomeThings = [
        //   'HTML5 Boilerplate',
        //   'AngularJS',
        //   'Karma'
        // ];

        var arr = [];
        socket.on('all', function(data) {
            console.log(data);
            arr.push(data);
        });
        $scope.awesomeThings = arr;


    });
