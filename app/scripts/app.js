/*global angular, window, document, navigator, parseInt */
'use strict';

var ob = angular.module('Orbit', ['ngResource', 'hmGestures', 'mousewheel']);

ob.controller('OrbitCtrl', ['$scope', '$rootScope', 'Images', function ($scope, $rootScope, Images) {
    $scope.init = function () {
        console.log('init');
        $scope.canvas = document.getElementById('orbit-canvas');
        $scope.renderer = $scope.canvas.getContext('2d');

        $scope.level = Images.level.length-1;
        Images.loadLevel($scope.level);

        window.onresize = $scope.resize;
        $scope.resize();

        $scope.visible = true;
        setInterval(function(){
          $scope.loadingReso = $scope.waitingload;

            $scope.draw();
            // if($scope.waitingload){

            // }
        }, 40);

        Images.loadLevel($scope.level);
    };


    //Peut être exprimer autrement ?
    $scope.clickRotation = true;
    $scope.clickTranslation = false;

    $scope.translaX = 0;
    $scope.translaY =0;

    $scope.offsetX = 0;
    $scope.offsetY = 0;


    $scope.pinMode = false;


    $scope.loading = '0';
    $scope.loadingReso = false;
    $scope.visible = false;

    $scope.zoom = 1;            //1 = zoom à 100%
    $scope.level = 0;
    $scope.angle = 0;         //id de l'angle de vue
    $scope.edited = true;
    $scope.waitingload = true;
    console.log($scope.waitingload);

    $scope.fps = 0;
    $scope.renderRatio = 5;
    $scope.showTooltips = false;
    $scope.autoPlay = true;
    $scope.tooltips = [];
    $scope.tooltip = null;
    $scope.tooltipVisible = false;
    $scope.goingFrom = null;

    $rootScope.$on('onFirstComplete', function () {
        // Inutilisé
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

    //Fonctions d'incrémentation de la translation
    //Appellé a l'appui d'une touche flèche du clavier
    $scope.incrTranslaX = function(translaX, lastX = 0){
        $scope.translaX += translaX;
        $scope.edited = true;
    }

    $scope.incrTranslaY = function(translaY, lastY = 0){
        $scope.translaY += translaY;
        $scope.edited = true;
    }

    //Fonctions de definition de la translation
    //Appellé lors du drag en mode translation
    $scope.setTranslaXY = function(translaX, translaY){
      $scope.translaX  = translaX;
      $scope.translaY = translaY;

      $scope.edited = true;
    }



    $scope.resetTransla = function() {
        $scope.translaY = 0;
        $scope.translaX = 0;
        $scope.edited = true;
    }




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

    //ICI
    //Pour les points d'interet potentiellement ?
    $scope.goTo = function () {

        console.log('goTo');
        $scope.resetTransla();
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
        $scope.canvas.width = $scope.canvas.offsetWidth;
        $scope.canvas.height = $scope.canvas.offsetHeight;
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
        $scope.resetTransla();
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

    //Partie a recheck pour le bug loading
    $scope.onWheel = function (e) {
        $scope.resetTransla();
        $scope.renderer.restore();

        var zoom = $scope.zoom;
        if (e.deltaY > 0) {
            $scope.zoomOut();
        } else {
            $scope.zoomIn();
        }

        if(zoom != $scope.zoom) $scope.edited = true;
        //$scope.draw();
    };


    $scope.zoomOut = function () {
        //$scope.renderer.clearRect(0, 0, $scope.canvas.width, $scope.canvas.height);
        $scope.zoom -= 0.1;
        if ($scope.zoom < $scope.minZoom) {
            $scope.zoom = $scope.minZoom;
        }
        if($scope.level < Images.level.length-1 && $scope.zoom*1000 <= Images.level[$scope.level+1].value)
            $scope.level++;
    };

    //Surtout le zoomIn
    $scope.zoomIn = function () {
        $scope.zoom += 0.1;
        if ($scope.zoom >= $scope.maxZoom) {
            $scope.zoom = $scope.maxZoom;
        }
        if($scope.level > 0 && $scope.zoom*1000 > Images.level[$scope.level].value)
            $scope.level--;
        //console.log($scope.zoom);
    };


  //Creer une fonction $scope.switchMode, qui se declenche au clic de l'icone dans le tooltype

    $scope.switchMode = function () {

      //L'execution de cette fonction le mode Roation / Translation
      //En fonction du mode, les comportements du drag, ainsi que des touche flèches sont
      //differentes




      $scope.clickRotation = !$scope.clickRotation;
      console.log('Rotation : ' + $scope.clickRotation );
      $scope.clickTranslation = !$scope.clickTranslation;
      console.log('Translation : ' + $scope.clickTranslation );



      if($scope.clickRotation && !$scope.clickTranslation)
        $scope.canvas.style.cursor = "default";


      if($scope.clickTranslation && !$scope.clickRotation)
        $scope.canvas.style.cursor = "move";


    };

    $scope.togglePinMode = function(){
      let pinButton = document.querySelector('#test');

      //L'execution de cette fonction change de le flag pinMode
      //En fonction de la valeur du flag, le comportement du clic change + le drag est disabled (??).

      $scope.pinMode = !$scope.pinMode;
      console.log("pin mode : " + $scope.pinMode);

      if (!$scope.pinMode) {
        pinButton.className = 'fa fa-thumb-tack Rotate-360';
      }

      if ($scope.pinMode) {
        pinButton.className =  'fa fa-thumb-tack Rotate180';
      }

    };


    $scope.keymove = function (e) {
        console.log(e.keyCode);
        //ICI
        // Verifier l'état du déplacement : Rotation ou Translation ?
        //Si translation, save le context, presser une fleche effectue un decalage de 10(?) dans sa direction

      if(!$scope.pinMode) {

        if ($scope.clickRotation && !$scope.clickTranslation) {
          if (e.keyCode === 39)
            $scope.setAngle($scope.angle - 1);
          if (e.keyCode === 37)
            $scope.setAngle($scope.angle + 1);
        }

        //$scope.renderer.restore()  // a retenir
        //$scope.renderer.save() // a retenir
        //$scope.renderer.translate(150,0); // a retenir

        if ($scope.clickTranslation && !$scope.clickRotation) {
          $scope.renderer.restore();
          $scope.renderer.save();

          if (e.keyCode === 37) {// Gauche
            $scope.incrTranslaX(-10);
            console.log('Gauche, transla x :' + $scope.translaX);


          }
          if (e.keyCode === 38) {// Haut
            $scope.incrTranslaY(-10);
            console.log('Haut, transla y :' + $scope.translaY);

          }
          if (e.keyCode === 39) {// Droite
            $scope.incrTranslaX(10);
            console.log('Droite, transla x :' + $scope.translaX);

          }
          if (e.keyCode === 40) {// Bas
            $scope.incrTranslaY(10);
            console.log('Bas, transla Y :' + $scope.translaY);

          }

        }
      }

    };

    $scope.pin = function (e){
      if($scope.pinMode) {

        let canvasWidth = $scope.canvas.clientWidth, // Largeur du canvas
            canvasHeight = $scope.canvas.clientHeight, // Hauteur du canvas
            cursorX = (e.gesture.center.pageX - $scope.canvas.clientWidth/2)   - $scope.translaX , // Place l'origine de X au centre de l'image, prenant en compte la translation du canvas
            cursorY = (e.gesture.center.pageY - $scope.canvas.clientHeight/2) - $scope.translaY ; // " Y " " " "


        console.log("Canvas width : " + canvasWidth);
        console.log("Canvas height : " + canvasHeight);


        let imgName = "";
        let lvl = $scope.level; // 0 = 12 img ; 1 = 4 img ; 2 = 1 img

        // Ratios entre la resolution de l'image original et du canvas
        let ratioX = (Images.level[lvl].cols * Images.level[lvl].tileWidth) / canvasWidth,
            ratioY = (Images.level[lvl].rows * Images.level[lvl].tileHeight) / canvasHeight;
        // on peut utilise $scole.level.cols et .rows pour connaitre le nombre d'image du zoom


        //POUR LES ZOOM A 1 IMAGE
        if(lvl == 2){
          console.log("Cursor X : " + cursorX);
          console.log("Cursor Y : " + cursorY);

        }

        //POUR LES ZOOM A 4 IMAGES
        if(lvl == 1) {
          console.log("Cursor X : " + cursorX);
          console.log("Cursor Y : " + cursorY);



        }

        //POUR LES ZOOM A 12 IMAGES
        if(lvl == 0 ) {
          console.log("Cursor X : " + cursorX);
          console.log("Cursor Y : " + cursorY);



        }





        console.log(imgName);


      }
    };



    $scope.drag = function (e) {

        //console.log('drag');
        if ($scope.clickRotation && !$scope.clickTranslation) {

          //$scope.resetTransla();

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
        }

        if ($scope.clickTranslation && !$scope.clickRotation) {

          /*console.log('Avant');
           console.log($scope.lastDeltaX);
           console.log($scope.lastDeltaY);


           $scope.currentDeltaX = e.gesture.deltaX - $scope.lastDeltaX;
           $scope.currentDeltaY = e.gesture.deltaY - $scope.lastDeltaY;

           console.log('---------------------------------');
           console.log("Deplacement X : " + $scope.lastDeltaX + " - " + $scope.lastDeltaX);
           console.log("gesture X : " + e.gesture.deltaX );
           console.log("Deplacement Y : " + $scope.lastDeltaY + " - " + $scope.lastDeltaY);
           console.log("gesture Y : " + e.gesture.deltaY );

           $scope.setTranslaXY($scope.lastDeltaX, $scope.lastDeltaY)

           console.log("Avant Transla y : " + ~~$scope.translaX + " y : " + ~~$scope.translaY );
           console.log("Prevision Transla x : " + ~~($scope.translaX + $scope.lastDeltaX)  +" y : " + ~~($scope.translaY + $scope.lastDeltaY) );


           $scope.incrTranslaX($scope.currentDeltaX, $scope.lastDeltaX);
           $scope.incrTranslaY($scope.currentDeltaY, $scope.lastDeltaY);*/


          // Meilleur alternative avant de trouver comment bien faire, près de 5h passer dessus sans resultat, je dois avancer
          // Presque parfait !! Manque que l'offset
          $scope.setTranslaXY(e.gesture.center.pageX - $scope.canvas.width / 2, e.gesture.center.pageY - $scope.canvas.height / 2);
          //console.log("Apres Transla x: " + ~~$scope.translaX + " y : " + ~~$scope.translaY );

        }

    };

    $scope.dragEnd = function (e) {

      if(!$scope.pinMode) {
      }

      //Creer une variable offset = a l'origine du canvas a la fin du drag


    };



    $scope.draw = function () {
        // console.log('draw '+$scope.angle);

        if(($scope.waitingload && Images.resourcesLoaded($scope.level, $scope.angle)) || $scope.edited){
            $scope.waitingload = false;
            // console.log('draw '+ lvl +' '+ $scope.angle +' zoom: '+ $scope.zoom);

            //Il faut trouver un autre moyen de clear tout le canvas
            //$scope.renderer.clearRect(0, 0, $scope.canvas.width+5000, $scope.canvas.height+5000); //Clear tout le canvas

            //Apparemment ca fait lag ? (source : internet)
            //Permet de reinitialisé le canvas
            $scope.canvas.width = $scope.canvas.width;

            $scope.renderer.translate($scope.translaX,$scope.translaY);
            //console.log("Draw : Transla X = "+ $scope.translaX + " ; Transla Y = " + $scope.translaY);



            var lvl = $scope.level;
            console.log(Images.level[lvl]);
            var current = Images.level[lvl].resources[$scope.angle];
            //var pos = 0;
            if(!Images.resourcesLoaded(lvl, $scope.angle)){
                $scope.waitingload = true;
                Images.loadResources(lvl, $scope.angle);

                while(lvl < Images.level.length-1 && !Images.resourcesLoaded(lvl, $scope.angle)){
                    lvl++;
                }
                current = Images.level[lvl].resources[$scope.angle];
                //Image(s) courante, de 1 à 12 (index 0 à 11 ...)


                // console.log('draw lvl: '+ lvl);
            }
            var ILvl = Images.level[lvl],
                posOriX = $scope.getX(),
                posOriY = $scope.getY(),
                lapX = Math.floor(Images.level[0].width/ILvl.cols) * $scope.zoom,
                lapY = Math.floor(Images.level[0].height/ILvl.rows) * $scope.zoom;

            for (var i = 0; i < current.length; i++) {
                // console.log(Images.loadImage(lvl, $scope.angle, i));
                var posX = posOriX + lapX * Math.floor(i / ILvl.rows),
                    posY = posOriY + lapY * Math.floor(i % ILvl.rows);

                /*
                if (
                    (-posOriX < posX + Math.floor(Images.level[0].width/ILvl.cols) &&
                    -posOriY < posY + Math.floor(Images.level[0].height/ILvl.rows)) ||
                    ($scope.canvas.width > posX &&
                    $scope.canvas.height > posY )
                 ){
                */

                    $scope.renderer.drawImage(
                        current[i].img,
                        0,
                        0,
                        current[i].img.naturalWidth ,
                        current[i].img.naturalHeight ,
                        posX,
                        posY,
                        //le +1 permet de supprimé l'écart entre les 4 images sous Firefox et IE
                        //Peut etre que les images sont clippé de 1px (zoom !=500)
                        //Edit, clipping tres legerement visible en zoom max
                          current[i].img.naturalWidth * $scope.zoom * 1000/ILvl.value -5 ,
                          current[i].img.naturalHeight * $scope.zoom * 1000/ILvl.value -5
                    );
                //}
            }

            $scope.edited = false;
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
