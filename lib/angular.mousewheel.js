/*
* angular-mousewheel v1.0.4
* (c) 2013 Monospaced http://monospaced.com
* License: MIT
*/

angular.module('mousewheel', [])
    .directive('msdWheel', ['$parse', function($parse){
        return {
            restrict: 'A, C',
            link: function(scope, element, attr) {
                var expr = $parse(attr['msdWheel']),
                    fn = function(event, delta, deltaX, deltaY){
                        scope.$apply(function(){
                            expr(scope, {
                                $event: event,
                                $delta: delta,
                                $deltaX: deltaX,
                                $deltaY: deltaY
                            });
                        });
                    },
                    hamster;

                if (typeof Hamster === 'undefined') {
                    element.bind('wheel', function(event){
                        scope.$apply(function() {
                            expr(scope, {
                                $event: event
                            });
                        });
                    });
                    return;
                }

                if (!(hamster = element.data('hamster'))) {
                    hamster = Hamster(element[0]);
                    element.data('hamster', hamster);
                }

                hamster.wheel(fn);

                scope.$on('$destroy', function(){
                    hamster.unwheel(fn);
                });
            }
        };
    }]);
