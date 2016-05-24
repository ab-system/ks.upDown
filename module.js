/**
 * Created by eolt on 08.10.2015.
 */

    angular.module('components', ['ui.bootstrap', 'ngMaterial'])
        .config([function () {

            }
        ])
        .controller('mainCtrl', [ '$scope', function($scope) {
            $scope.intModel = 6;
            $scope.floatModel = 2;
            $scope.min = 0.8;
        }])