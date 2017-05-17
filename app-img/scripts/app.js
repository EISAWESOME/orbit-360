/*global angular, window, document, navigator, parseInt */
'use strict';

var ob = angular.module('Orbit', ['ngResource', 'hmGestures', 'mousewheel']);

ob.controller('OrbitCtrl', ['$scope', '$rootScope', 'Images', function ($scope, $rootScope, Images) {
    $scope.init = function () {
        console.log('init');
        $scope.canvas = {};
        $scope._viewer = angular.element('#orbit-viewer');

        $scope.level = Images.level.length-1;
        Images.loadLevel($scope.level);

        window.onresize = $scope.resize;
        $scope.resize();



        Images.loadLevel($scope.level);

    };

    $scope.loading = '0';
    $scope.loadingReso = false;
    $scope.visible = false;

    $scope.Images = Images;
    $scope.zoom = 1;            //1 = zoom à 100%
    $scope.level = 0;
    $scope.levelShow = 0;
    $scope.angle = 0;         //id de l'angle de vue
    $scope.edited = true;
    $scope.waitingload = true;

    $scope.fps = 0;
    $scope.renderRatio = 5;
    $scope.showTooltips = false;
    $scope.autoPlay = true;
    $scope.tooltips = [];
    $scope.tooltip = null;
    $scope.tooltipVisible = false;
    $scope.goingFrom = null;

    $rootScope.$on('onFirstComplete', function () {
        // console.log('onFirstComplete');
        $scope.edited = true;
        $scope.setAngle($scope.angle + 1);
    });
    //A revoir
    $rootScope.$on('onCurrentComplete', function (/*event, angle*/) {
        // console.log('onCurrentComplete '+ angle);
        // $scope.angle = angle;
        // $scope.draw();
    });
    $rootScope.$on('onComplete', function () {
        var time = new Date();
        console.log('onComplete time: '+ time.getSeconds() +' '+ time.getMilliseconds());
        $scope.loading = false;        
        $scope.visible = true;
        setInterval(function(){
            $scope.draw();
            // if($scope.waitingload){
                $scope.loadingReso = $scope.waitingload;
            // }
        }, 40);
        // console.log($scope.viewer[$scope.level]);
        // $scope.current = $scope.viewer[$scope.level].children[$scope.angle];
    });
    $rootScope.$on('onLoading', function (event, percent) {
        // console.log(percent);
        $scope.loading = percent;
    });

    $scope.setAngle = function(angle){
        if(angle >= Images.nbAngle) $scope.angle = angle - Images.nbAngle;
        else if (angle < 0) $scope.angle = angle + Images.nbAngle;
        else $scope.angle = angle;
        $scope.edited = true;
    };

    $scope.selectTooltip = function (id) {
        if ($scope.goingFrom !== null) {
            return;
        }
        $scope.autoPlay = false;
        $scope.tooltip = $scope.tooltips[id];
        $scope.tooltip.id = id;
        $scope.tooltipVisible = false;
        $scope.goingFrom = $scope.angle;
        $scope.goTo();
    };
    $scope.getTooltipX = function () {
        if ($scope.tooltip === null) {
            return 0;
        } else {
            return ($scope.tooltip.x * $scope.zoom) + $scope.getX() - 1;
        }
    };
    $scope.getTooltipY = function () {
        if ($scope.tooltip === null) {
            return 0;
        } else {
            return ($scope.tooltip.y * $scope.zoom) + $scope.getY() + 5;
        }
    };

    $scope.goTo = function () {
        console.log('goTo');
        var t = $scope.iteration,
            b = $scope.goingFrom,
            c = $scope.tooltip.image - b,
            d = Math.abs(Math.round(c / 2));
        d = (d === 0) ? 1 : d;
        t /= d;
        t--;
        //$scope.draw(Math.round(c * (t * t * t + 1) + b));
        if ($scope.iteration > d) {
            $scope.goingFrom = null;
            $scope.tooltipVisible = true;
            $scope.$apply();
        }
    };


    $scope.resize = function () {
        console.log('resize');
        $scope.canvas.width = $scope._viewer.parent().width();
        $scope.canvas.height = $scope._viewer.parent().height();
        if ($scope.loading === true) {
            return false;
        }
        if ($scope.canvas.width / Images.level[0].width <= $scope.canvas.height / Images.level[0].height) {
            $scope.zoom = $scope.canvas.width / Images.level[0].width;
        } else {
            $scope.zoom = $scope.canvas.height / Images.level[0].height;
        }
        $scope.level = Images.level.length-1;
        while($scope.zoom*1000 > Images.level[$scope.level].value){
            $scope.level--;
        }
        $scope.minZoom = $scope.zoom;
        $scope.maxZoom = 1;
        if ($scope.visible) {
            $scope.$apply();
        }
        $scope.edited = true;
    };

    $scope.play = function () {
        var n = new Date();
        // console.log('play '+ n.getMilliseconds());
        if ($scope.autoPlay) {
            if ($scope.tooltipVisible === true) {
                $scope.tooltipVisible = false;
                $scope.$apply();
            }
            //$scope.draw($scope.angle + 1);
            $scope.setAngle($scope.angle + 1);
            window.setTimeout($scope.play, 40);
        }
        if ($scope.goingFrom != null) {
            $scope.goTo();
            $scope.iteration++;
        } else {
            $scope.iteration = 0;
        }
    };

    $scope.onWheel = function (e) {
        var zoom = $scope.zoom;
        if (e.deltaY > 0) {
            $scope.zoomOut();
        } else {
            $scope.zoomIn();
        }

        if(zoom != $scope.zoom) $scope.edited = true;
    };
    $scope.zoomOut = function () {
        $scope.zoom -= 0.1;
        if ($scope.zoom < $scope.minZoom) {
            $scope.zoom = $scope.minZoom;
        }
        if($scope.level < Images.level.length-1 && $scope.zoom*1000 <= Images.level[$scope.level+1].value)
            $scope.level++;

    };
    $scope.zoomIn = function () {
        $scope.zoom += 0.1;
        if ($scope.zoom >= $scope.maxZoom) {
            $scope.zoom = $scope.maxZoom;
        }
        if($scope.level > 0 && $scope.zoom*1000 > Images.level[$scope.level].value)
            $scope.level--;
    };


    $scope.keymove = function (e) {
        if(e.keyCode === 39)
            $scope.setAngle($scope.angle -1);
        if(e.keyCode === 37)
            $scope.setAngle($scope.angle +1);
    };

    $scope.drag = function (e) {
        console.log('drag');
        $scope.tooltipVisible = false;
        var dst = $scope.lastDrag - e.gesture.deltaX,
            ratio;
        dst *= 1;
        ratio = dst / 10;
        ratio = ratio.toFixed(0);
        if (ratio === '-0') {
            ratio = -1;
        } else if (ratio === '0') {
            ratio = 1;
        }
        $scope.lastDrag = e.gesture.deltaX;

        //$scope.draw($scope.angle + parseInt(ratio));
        $scope.setAngle($scope.angle + parseInt(ratio));
    };

    $scope.draw = function () {
        // console.log('draw '+$scope.angle);

        if(($scope.waitingload && Images.resourcesLoaded($scope.level, $scope.angle)) || $scope.edited){
            $scope.waitingload = false;
            // console.log('draw '+ lvl +' '+ $scope.angle +' zoom: '+ $scope.zoom);
            // $scope.renderer.clearRect(0, 0, $scope.canvas.width, $scope.canvas.height);

            var lvl = $scope.level;
            var current = Images.level[lvl].resources[$scope.angle];
            if(!Images.resourcesLoaded(lvl, $scope.angle)){
                $scope.waitingload = true;
                Images.loadResources(lvl, $scope.angle);

                while(lvl < Images.level.length-1 && !Images.resourcesLoaded(lvl, $scope.angle)){
                    lvl++;
                }
                current = Images.level[lvl].resources[$scope.angle];
                // console.log('draw lvl: '+ lvl);
            }
                $scope.levelShow = lvl; 

            var prop = $scope.zoom*1000/Images.level[lvl].value;
            var viewer = $scope._viewer;
            viewer.children().addClass('old');
            var nbload = 0;

            var imgContainer = document.createElement('div');
            viewer.prepend(imgContainer);
            // console.log(Images.level[0].width +' '+ $scope.zoom);
            // console.log(Images.level[0].width*$scope.zoom);
            viewer.css('width', Images.level[0].width*$scope.zoom +'px');
            viewer.css('top', $scope.getY() +'px');
            viewer.css('left', $scope.getX() +'px');
            for (var i = 0; i < current.length; i++) {
                var key = i;
                current[key].img.width = current[key].img.naturalWidth * prop;
                imgContainer.appendChild(current[key].img);

                // console.log(current[key].img.naturalWidth +' '+ prop);
                // console.log(current[key].img.naturalWidth * prop);
            }
            $scope.edited = false;

        }
        if(Images.resourcesDisplayed($scope.levelShow, $scope.angle)){
            var old = $scope._viewer.children('.old');
            setTimeout(function(){
                for (var i = 0; i < old.length; i++) {
                    old.last().detach();
                }
            }, 0);
        }
    };

    $scope.getX = function () {
        return +(($scope.canvas.width / 2) - ((Images.level[0].width / 2) * $scope.zoom)).toFixed(0);
    };

    $scope.getY = function () {
        return -(((Images.level[0].height * $scope.zoom) - $scope.canvas.height) / 2).toFixed(0);
    };

    $scope.getWidth = function () {
        return $scope.zoom * (Images.level[0].width);
    };

    $scope.getHeight = function () {
        return $scope.zoom * (Images.level[0].height);
    };

}]);