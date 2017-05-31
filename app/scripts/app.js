/*global angular, window, document, navigator, parseInt */
'use strict';

var ob = angular.module('Orbit', ['ngResource', 'hmGestures', 'mousewheel', 'ui.bootstrap', 'cgPrompt']);

ob.controller('OrbitCtrl', ['$scope', '$rootScope', 'Images', function ($scope, $rootScope, Images, prompt) {
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

      Images.loadxml().success(function(dataXML) {

        if (window.DOMParser) { // Standard
          var tmp = new DOMParser();
          $scope.xml = tmp.parseFromString(dataXML, "text/xml");
        }
        else { // IE
          $scope.xml = new ActiveXObject("Microsoft.XMLDOM");
          xml.async = "false";
          xml.loadXML(dataXML);
        }
      });
    };


    //Peut être exprimer autrement ?
    $scope.clickRotation = true;
    $scope.clickTranslation = false;

    $scope.oldDragX = 0; //Inutilisé
    $scope.oldDragY = 0;

    $scope.posX = 0;
    $scope.posX = 0;


    $scope.pinMode = false;
    $scope.isFullscreen= false;

    $scope.interestPoint = {};

    $scope.actualTileWidth = 0;
    $scope.actualTileHeight = 0;


    $scope.loading = '0';
    $scope.loadingReso = false;
    $scope.visible = false;

    $scope.zoom = 1;            //1 = zoom à 100%
    $scope.level = 0;
    $scope.angle = 0;         //id de l'angle de vue
    $scope.edited = true;
    $scope.waitingload = true;
    //console.log($scope.waitingload);

    $scope.fps = 0;
    $scope.renderRatio = 5;
    $scope.showTooltips = false;
    $scope.autoPlay = false;
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
      $scope.translaX = translaX ;
      $scope.translaY = translaY ;

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

    $scope.toggleFullscreen = function () {
      let elem = document.querySelector("html");
      if($scope.isFullscreen) {


        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
      }
      else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };

    $scope.resize = function () {
        $scope.resetTransla();
        $scope.renderer.restore();
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

    $scope.switchMode = function () {

      //L'execution de cette fonction le mode Rotation / Translation
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

    $scope.keymove = function (e) {
        console.log(e.keyCode);

        // Verifie l'état du déplacement : Rotation ou Translation ?
        //Si translation, save le context, presser une fleche effectue un decalage de 10(?) dans sa direction

        if ($scope.clickRotation && !$scope.clickTranslation) {
          if (e.keyCode === 39)
            $scope.setAngle($scope.angle - 1);
          if (e.keyCode === 37)
            $scope.setAngle($scope.angle + 1);
        }

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


    };

    $scope.whichRow4 = function(cursorY){
      let rowID;

      if (cursorY <= 0) {
        rowID = 0;
      }
      else {

        rowID = 1;
      }

      return rowID;

    }


    //Determine dans quelle ligne de case se trouve le curseur pour les zoom a 12 cases
    $scope.whichRow12 = function(cursorY, tileHeight){

      let rowID;

      if(cursorY > 0){
        if(cursorY <= tileHeight/2){
           rowID =1;
        }
        else rowID =2;
      }
      if(cursorY < 0){

        if(cursorY >= -tileHeight/2){
          rowID =1;
        }
        else rowID =0;
      }

      return rowID;
    };

    $scope.whichCol4 = function(cursorX, tileWidth) {

      let colID;

      if(cursorX <0) {
        colID = 0;
      }
      else {
        colID = 2;
      }

      return colID;

    }

    $scope.whichCol12 = function(cursorX, tileWidth) {

      let colID;

      if(cursorX < 0 ){
        if(cursorX >= -tileWidth){
          colID = 3;
        }
        else colID = 0;
      }

      if(cursorX > 0){
        if(cursorX <= tileWidth){
          colID = 6;
        }
        else colID = 9;

      }

      return colID;
    };

    $scope.transfoCoord4 = function(imgID, cursorX, cursorY, ratioX, ratioY, height, width) {

      let pinCoord = {};

      if(imgID == 0){
        //0_0
        let pinX = (cursorX + width ) * ratioX,
          pinY = (cursorY + height) * ratioY;
        pinCoord = {x: pinX, y: pinY}
      };

      if(imgID == 1) {
        //0_1
        let pinX = (cursorX + width) * ratioX,
          pinY = cursorY * ratioY;
        pinCoord = {x: pinX, y: pinY}
      };

      if(imgID == 2) {
        //1_0
        let pinX = cursorX * ratioX,
          pinY = (cursorY + height) * ratioY;
        pinCoord = {x: pinX, y: pinY}

      };

      if(imgID == 3) {
        //1_1
        let pinX = cursorX * ratioX,
          pinY = cursorY * ratioY;
        pinCoord = {x: pinX, y: pinY}


      };

      return pinCoord;

    };

    $scope.transfoCoord12 = function(imgID, cursorX, cursorY, ratioX, ratioY, height, width) {

      let pinCoord = {};

      if (imgID == 0) { //0_0
        let pinX = (cursorX + 2 * width) * ratioX,
          pinY = (cursorY + 3 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 1) { //0_1
        let pinX = (cursorX + 2 * width) * ratioX,
          pinY = (cursorY + 1 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 2) { //0_2
        let pinX = (cursorX + 2 * width) * ratioX,
          pinY = (cursorY - 1 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 3) { //1_0
        let pinX = (cursorX + width) * ratioX,
          pinY = (cursorY + 3 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 4) { //1_1
        let pinX = (cursorX + width) * ratioX,
          pinY = (cursorY + 1 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 5) { //1_2
        let pinX = (cursorX + width) * ratioX,
          pinY = (cursorY - 1 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 6) { //2_0
        let pinX = (cursorX) * ratioX,
          pinY = (cursorY + 3 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 7) { //2_1
        let pinX = (cursorX) * ratioX,
          pinY = (cursorY + 1 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 8) {//2_2
        let pinX = (cursorX) * ratioX,
          pinY = (cursorY - 1 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 9) { //3_0
        let pinX = (cursorX - width) * ratioX,
          pinY = (cursorY + 3 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 10) { //3_1
        let pinX = (cursorX - width) * ratioX,
          pinY = (cursorY + 1 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      if (imgID == 11) { //3_2
        let pinX = (cursorX - width) * ratioX,
          pinY = (cursorY - 1 / 2 * height) * ratioY;
        pinCoord = {x: pinX, y: pinY};
      };

      return pinCoord;

    }






    $scope.pin = function (e) {
      if ($scope.pinMode) {

        //console.log(Images.level[lvl].resources[$scope.angle]);

        //Les coord du poit d'interet pour les lvl 2+
        let pinCoord2 = {};
        // pour le lvl 1
        let pinCoord1 = {};
        //pour le lvl 0
        let pinCoord0 = {};

        // Place l'origine de X et de Y au centre de l'image, prennant en compte la translation du canvas
        let cursorX = (e.gesture.center.pageX - $scope.canvas.clientWidth / 2) - $scope.translaX,
          cursorY = (e.gesture.center.pageY - $scope.canvas.clientHeight / 2 + 4) - $scope.translaY;

        let imgID2,
          imgID1,
          imgID0,
          lvl = $scope.level, // 0 = 12 img ; 1 = 4 img ; 2 = 1 img
          height = $scope.actualTileHeight,
          width = $scope.actualTileWidth,
          canvH = $scope.canvas.clientHeight,
          canvW = $scope.canvas.clientWidth;

        let ratioX = Images.level[lvl].tileWidth / width,
          ratioY = Images.level[lvl].tileHeight / height;

        console.log($scope.actualTileHeight);







        //Pour chaque cas, une fois les coordonnées du point d'interet determiné, il faudra ecrire dans le fichier XML content
        //POUR LES ZOOM A 1 IMAGE
        if (lvl >= 2 ) {
          //Une seul image, donc pas d'opérations
          let pinX = (e.gesture.center.pageX) * ratioX,
            pinY = (e.gesture.center.pageY - $scope.posY) * ratioY;

          console.log(cursorY)

          pinCoord2 = {x: pinX, y: pinY};
          imgID2 = 0; //Il n'y a qu'une seul image, l'ID de la case est toujours 0
        }

        //POUR LES ZOOM A 4 IMAGES
        if (lvl == 1) {
          console.log("Cursor X : " + cursorX);
          console.log("Cursor Y : " + cursorY);

          imgID1 = $scope.whichRow4(cursorY) + $scope.whichCol4(cursorX);
          pinCoord1 = $scope.transfoCoord4(imgID1, cursorX, cursorY, ratioX, ratioY, height, width);


          //CA FONCTIONNE !!!!!!!!!!!
          //On prend width/2 et height*2/3 car c'est le rapport entre les cases des different level
          // ex : Une case de lvl0 est deux fois moins large qu'une case de lvl1
          let nextRatioX = Images.level[0].tileWidth / (width/2),
            nextRatioY = Images.level[0].tileHeight / (height*2/3);


          imgID0 = $scope.whichRow12(cursorY, height*2/3) + $scope.whichCol12(cursorX, width/2);
          console.log(imgID0);
          pinCoord0 = $scope.transfoCoord12(imgID0, cursorX, cursorY, nextRatioX, nextRatioY, height*2/3, width/2)

        }

        //POUR LES ZOOM A 12 IMAGES
        if (lvl == 0) {
          console.log("Cursor X : " + cursorX);
          console.log("Cursor Y : " + cursorY);

          imgID0 = $scope.whichRow12(cursorY, height) + $scope.whichCol12(cursorX, width);
          pinCoord0 = $scope.transfoCoord12(imgID0, cursorX, cursorY, ratioX, ratioY, height, width);

          let nextRatioX = Images.level[1].tileWidth / (width*2),
            nextRatioY = Images.level[1].tileHeight / (height*3/2);


          imgID1 = $scope.whichRow4(cursorY, height*3/2) + $scope.whichCol4(cursorX, width*2);
          console.log(imgID1);
          pinCoord1 = $scope.transfoCoord4(imgID1, cursorX, cursorY, nextRatioX, nextRatioY, height*3/2, width*2)



        }

        //console.log(pinCoord);
        let title = 'Test titre';
        let desc = 'Ceci est une description de test';
        $scope.writePin(title, desc, $scope.angle, imgID2, imgID1, imgID0, pinCoord2, pinCoord1, pinCoord0, canvW, canvH );

        $scope.edited = true;

      }
    };

  // A REVOIR !!

  $scope.writePin = function (titre, desc, angle, tile2, tile1, tile0, coordLvl2, coordLvl1, coordLvl0, canvW, canvH){

    let elmPoint = $scope.xml.createElement('PointInteret'),
        elmTitre = $scope.xml.createElement('Titre'),
        elmDesc = $scope.xml.createElement('Description'),
        elmLevel = $scope.xml.createElement('Level'),
        elmCase = $scope.xml.createElement('Case'),
        elmCoord = $scope.xml.createElement('Coord'),
        elmOrig = $scope.xml.createElement('CanvOrig'),

        cdataDesc = $scope.xml.createCDATASection(desc),
        cdataTitre = $scope.xml.createCDATASection(titre);

    elmPoint.setAttribute('Angle',angle);

    elmOrig.setAttribute('width', canvW);
    elmOrig.setAttribute('height', canvH);

    elmTitre.appendChild(cdataTitre);
    elmDesc.appendChild(cdataDesc);


    let elmLevel2 = $scope.xml.createElement('lvl2'),
        elmLevel1 = $scope.xml.createElement('lvl1'),
        elmLevel0 = $scope.xml.createElement('lvl0');

    let elmCase2 = elmCase.cloneNode(true),
        elmCase1 = elmCase.cloneNode(true),
        elmCase0 = elmCase.cloneNode(true);

    let elmCoord2= elmCoord.cloneNode(true),
        elmCoord1= elmCoord.cloneNode(true),
        elmCoord0= elmCoord.cloneNode(true);

    elmCase2.setAttribute('tile', tile2);
    elmCase1.setAttribute('tile', tile1);
    elmCase0.setAttribute('tile', tile0);

    elmCoord2.setAttribute('x', coordLvl2.x);
    elmCoord2.setAttribute('y', coordLvl2.y);

    elmCoord1.setAttribute('x', coordLvl1.x);
    elmCoord1.setAttribute('y', coordLvl1.y);

    elmCoord0.setAttribute('x', coordLvl0.x);
    elmCoord0.setAttribute('y', coordLvl0.y);


    elmLevel2.appendChild(elmCase2);
    elmLevel2.appendChild(elmCoord2);

    elmLevel1.appendChild(elmCase1);
    elmLevel1.appendChild(elmCoord1);

    elmLevel0.appendChild(elmCase0);
    elmLevel0.appendChild(elmCoord0);

    elmLevel.appendChild(elmLevel0);
    elmLevel.appendChild(elmLevel1);
    elmLevel.appendChild(elmLevel2);



    elmPoint.appendChild(elmTitre);
    elmPoint.appendChild(elmDesc);
    elmPoint.appendChild(elmLevel);



    $scope.xml.getElementsByTagName('sequence')[0].appendChild(elmPoint);

    console.log($scope.xml);

  }

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


          // Meilleur alternative avant de trouver comment bien faire, près de 5h passer dessus sans resultat, je dois avancer
          // Presque parfait !! Manque que l'offset
          $scope.setTranslaXY(e.gesture.center.pageX - $scope.canvas.width / 2, e.gesture.center.pageY - $scope.canvas.height / 2);
          //$scope.setTranslaXY(e.gesture.deltaX, e.gesture.deltaY);

        }

    };

    $scope.dragEnd = function (e) {

      if(!$scope.pinMode) {

        $scope.oldDragX = $scope.translaX;
        $scope.oldDragY = $scope.translaY;

      }

      //Creer une variable offset = a l'origine du canvas a la fin du drag


    };

    $scope.draw = function () {
        // console.log('draw '+$scope.angle);

        if(($scope.waitingload && Images.resourcesLoaded($scope.level, $scope.angle)) || $scope.edited){
            $scope.waitingload = false;
            // console.log('draw '+ lvl +' '+ $scope.angle +' zoom: '+ $scope.zoom);
            //Permet de reinitialisé le canvas
            $scope.canvas.width = $scope.canvas.width;

            $scope.renderer.translate($scope.translaX,$scope.translaY);
            //console.log("Draw : Transla X = "+ $scope.translaX + " ; Transla Y = " + $scope.translaY);



            var lvl = $scope.level;
            //console.log(Images.level[lvl]);
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
                $scope.posX = posX;
                $scope.posY = posY;


              //le +1 permet de supprimé l'écart entre les 4 images sous Firefox et IE
              //Peut etre que les images sont clippé de 1px (zoom !=500)
              //Edit, clipping tres legerement visible en zoom max
              $scope.actualTileWidth = current[i].img.naturalWidth * $scope.zoom * 1000/ILvl.value -2;
              $scope.actualTileHeight = current[i].img.naturalHeight * $scope.zoom * 1000/ILvl.value -2;

                    $scope.renderer.drawImage(
                        current[i].img,
                        /*
                        0,
                        0,
                        current[i].img.naturalWidth ,
                        current[i].img.naturalHeight ,
                        */
                        posX,
                        posY,
                        $scope.actualTileWidth ,
                        $scope.actualTileHeight
                    );

                    let points = $scope.xml.getElementsByTagName('PointInteret');

                    console.log('Lvl: ' + lvl);
                    for (let j = 0; j < points.length; j++) {

                      //Si il existe un ou plusieur point d'interet sur cet angle
                      if (points[j].getAttribute('Angle') == $scope.angle){

                        //Recupere les trois balise level
                        let level = points[j].getElementsByTagName('Level');

                        //console.log(level[0]);

                        let currentLevel;
                        if(lvl >= 2) {
                           currentLevel = level[0].childNodes[2];
                        }
                        else
                          currentLevel = level[0].childNodes[lvl];

                        let tile = currentLevel.getElementsByTagName('Case');
                        let tileID = tile[0].getAttribute('tile');

                        //console.log(tileID);


                        if(tileID == i) {

                          let coord = currentLevel.getElementsByTagName('Coord');
                          let x = Number(coord[0].getAttribute('x'));
                          let y = Number(coord[0].getAttribute('y'));


                           let pinX = x * $scope.zoom * 1000/ILvl.value -2,
                           pinY = y * $scope.zoom * 1000/ILvl.value -2;

                           //console.log( posY);

                           var centerX = pinX + posX ;

                           var centerY = pinY + posY  ;
                           var radius = 5;
                           //console.log(pinX, pinY);

                           $scope.renderer.beginPath();
                           $scope.renderer.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                           $scope.renderer.fillStyle = 'black';
                           //+ flashy effect, genre gradient etc, à voir
                           $scope.renderer.fill();
                           $scope.renderer.lineWidth = 5;
                           $scope.renderer.strokeStyle = 'red';
                           $scope.renderer.stroke();

                          /*Il faut Resize l'image, et prendre en compte sa taille pour que ce soit la point qui soit a l'endroit du clic
                           Et non pas le coin haut gauche
                           let img = new Image();
                           img.onload = function() {
                           $scope.renderer.drawImage(img,centerX,centerY);
                           }
                           img.src = 'images/pinIcon.ico';*/
                        }

                      }
                    }
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
