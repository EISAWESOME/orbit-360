/*global angular, window, document, navigator, parseInt */
'use strict';

var ob = angular.module('Orbit', ['ngResource', 'hmGestures', 'mousewheel', 'cgPrompt', 'ui.bootstrap']);

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


        let colPoints = $scope.xml.getElementsByTagName('PointInteret');

        for(let i=0;  i<colPoints.length ; i++){

          let titre = colPoints[i].getElementsByTagName('Titre');
          let angle = colPoints[i].attributes[0].value;
          let coord = {
            x : colPoints[i].getElementsByTagName('Coord')[0].getAttribute('x'),
            y : colPoints[i].getElementsByTagName('Coord')[0].getAttribute('y')
          }


          let tooltip = {
            title: titre[0].textContent,
            image: angle,
            x: coord.x,
            y: coord.y
          };


          $scope.tooltips.push(tooltip);
        }






      });


    };

    function detectIE() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
      // IE 11 => return version number
      var rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return false;
  };



    $scope.clickRotation = true;
    $scope.clickTranslation = false;

    $scope.isEditMode = false;

    $scope.posX = 0;
    $scope.posY = 0;


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

    //Fonction de suppression d'un point d'interet
    $scope.deletePoint = function(e, id) {

    $scope.tooltip = $scope.tooltips[id];
    $scope.tooltip.id = id;

    let c = confirm('Sure de vouloir supprimé ??');
    if(c){
      //Remove dans le tooltip
      e.target.parentNode.parentNode.remove();

      //Remove dans le XML
      let points = $scope.xml.getElementsByTagName('PointInteret');
      for(let i =0; i < points.length; i++){
        if(points[i].getAttribute('Angle') == $scope.tooltip.image){

          if(points[i].getElementsByTagName('Titre')[0].textContent == $scope.tooltip.title){
            let coord = points[i].getElementsByTagName('Coord')[0];

            if(coord.getAttribute('x') == $scope.tooltip.x){

              if(coord.getAttribute('y') == $scope.tooltip.y){
                points[i].parentNode.removeChild(points[i]);
                console.log($scope.xml);

              }
            }
          }
        }
      }
    }

    $scope.edited = true ;

  };

    //Fonction d'export du flux XML courant => Dumb le flux dans une nouvelle fenêtre
    $scope.exportXML = function(){
      let content = (new XMLSerializer().serializeToString($scope.xml));
      if(content){

        let IE = detectIE()

        if (IE) {
          let popup = window.open();
          //On wrap le content dans un textarea pour que les markups soient conservés
          popup.document.write("<textarea style='width: 100%; height: 100%; border:none;'>" + content + "</textarea>");
        }
        else {
          window.open('data:text/xml,'+encodeURIComponent(content),
            "Test", "width=900,height=900,scrollbars=1,resizable=1");
        }
      }
    };
    $scope.setAngle = function(angle){
        if(angle >= Images.nbAngle) $scope.angle = angle - Images.nbAngle;
        else if (angle < 0) $scope.angle = angle + Images.nbAngle;
        else $scope.angle = angle;
        $scope.edited = true;
    };


    //Fonctions d'incrémentation de la translation
    //Appellé a l'appui d'une touche flèche du clavier
    $scope.incrTranslaX = function(translaX){
        $scope.translaX += translaX;
        $scope.edited = true;
    };

    $scope.incrTranslaY = function(translaY){
        $scope.translaY += translaY;
        $scope.edited = true;
    };

    //Fonctions de definition de la translation
    //Appellé lors du drag en mode translation
    $scope.setTranslaXY = function(translaX, translaY){
      $scope.translaX = translaX ;
      $scope.translaY = translaY ;

      $scope.edited = true;
    };

    $scope.resetTransla = function() {
        $scope.translaY = 0;
        $scope.translaX = 0;
        $scope.edited = true;
    }

    $scope.selectTooltip = function (id) {
        /*
        if ($scope.goingFrom !== null) {
            return;
        }
        */
        $scope.autoPlay = false;
        $scope.tooltip = $scope.tooltips[id];
        $scope.tooltip.id = id;
        $scope.tooltipVisible = false;
        $scope.goingFrom = $scope.angle;
        console.log(id);
        $scope.goTo($scope.tooltip.image);
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

    //Fonction qui permet la rotation jusqu'a un angle donné
    $scope.goTo = function (angle) {

      //Faire pour qu'il tourne dans le sens le plus rapide en fonction du depart et de la destination ??
      if($scope.angle != angle){

        $scope.setAngle($scope.angle +1);
        console.log($scope.angle);
        window.setTimeout($scope.goTo, 5, angle);
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

    //Fonction qui permet la rotation automatique du modele
    $scope.play = function () {
        $scope.resetTransla();
        var n = new Date();
        // console.log('play '+ n.getMilliseconds());
        if ($scope.autoPlay) {
            if ($scope.tooltipVisible === true) {
                $scope.tooltipVisible = false;
                $scope.$apply();
            }
            $scope.setAngle($scope.angle + 1);
            window.setTimeout($scope.play, 40);
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

    $scope.editMode = function(){

      $scope.isEditMode = !$scope.isEditMode;

      //Desactive le pinmode en meme temps que la modification
      if($scope.isEditMode == false){
        $scope.pinMode = false;
      }
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

    //Gestion des event de touche
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

    //Fonction qui gere la création d'un point d'interet
    $scope.pin = function (e) {
      //Se declenche au clic si le pinmode est activé
      if ($scope.pinMode) {

        let lvl= $scope.level;

        // Place l'origine de X et de Y au centre de l'image, prennant en compte la translation du canvas
        let
          cursorX = (e.gesture.center.pageX - $scope.canvas.clientWidth / 2) - $scope.translaX,
          cursorY = (e.gesture.center.pageY - $scope.canvas.clientHeight / 2) - $scope.translaY;


        //On etablie le ratio de proportion entre l'image scale 100% et l'image affiché à l'écran
        let
          ratioX = Images.level[0].width /  ($scope.actualTileWidth * Images.level[lvl].cols),
          ratioY = Images.level[0].height /  ($scope.actualTileHeight * Images.level[lvl].rows);

        console.log(ratioX, ratioY);

        //Les coordonnées du point à l'echelle 1:1 de l'image d'origine scale 100%
        let trueCoord = { x: cursorX * ratioX, y: cursorY * ratioY};

        //On vérifie que la curseur soit dans la zone de dessin pour crée le point d'interet
        if( !(cursorX > $scope.actualTileWidth * Images.level[lvl].cols / 2 ||
            cursorX < -$scope.actualTileWidth * Images.level[lvl].cols / 2 ||
            cursorY > $scope.actualTileHeight * Images.level[lvl].rows /2 ||
            cursorY < -$scope.actualTileHeight * Images.level[lvl].rows /2)
          )
        {
          //ICI
          //Trouver comment utiliser angular material et faire un joli prompt

          let titre = prompt('Titre ?', 'Kappa123');

          if(titre != null){
            let descr = prompt('Desc ?', 'memes');

            if(descr !=null){
              //console.log(pinCoord);
              let title = titre;
              let desc = descr;
              $scope.writePin(title, desc, $scope.angle, trueCoord);

              let tooltip = {
                title: titre,
                image: $scope.angle, //Angle
                x: trueCoord.x,
                y: trueCoord.y
              };

              $scope.tooltips.push(tooltip);

              $scope.edited = true;

            }
          }
        }
      }
    };

    //Ecris le point d'interet dans le flux XML
    $scope.writePin = function (titre, desc, angle, coord){

    let elmPoint = $scope.xml.createElement('PointInteret'),
        elmTitre = $scope.xml.createElement('Titre'),
        elmDesc = $scope.xml.createElement('Description'),
        elmCoord = $scope.xml.createElement('Coord'),

        cdataDesc = $scope.xml.createCDATASection(desc),
        cdataTitre = $scope.xml.createCDATASection(titre);

    elmPoint.setAttribute('Angle',angle);
    elmCoord.setAttribute('x', coord.x);
    elmCoord.setAttribute('y', coord.y);


    elmTitre.appendChild(cdataTitre);
    elmDesc.appendChild(cdataDesc);




    elmPoint.appendChild(elmTitre);
    elmPoint.appendChild(elmDesc);
    elmPoint.appendChild(elmCoord);




    $scope.xml.getElementsByTagName('sequence')[0].appendChild(elmPoint);

    console.log($scope.xml);

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


          // Meilleur alternative avant de trouver comment bien faire, près de 5h passer dessus sans resultat, je dois avancer
          // Presque parfait !! Manque que l'offset
          $scope.setTranslaXY(e.gesture.center.pageX - $scope.canvas.width / 2, e.gesture.center.pageY - $scope.canvas.height / 2);
          //$scope.setTranslaXY(e.gesture.deltaX, e.gesture.deltaY);

        }

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
              // -2 pour le debug
              //Peut etre que les images sont clippé de 1px (zoom !=500)
              //Edit, clipping tres legerement visible en zoom max
              $scope.actualTileWidth = current[i].img.naturalWidth * $scope.zoom * 1000/ILvl.value +1;
              $scope.actualTileHeight = current[i].img.naturalHeight * $scope.zoom * 1000/ILvl.value +1;

                    $scope.renderer.drawImage(
                        current[i].img,
                        posX,
                        posY,
                        $scope.actualTileWidth ,
                        $scope.actualTileHeight
                    );

            }
            //Une fois que toute les cases sont dessinées, on dessine les points d'interet
            let points = $scope.xml.getElementsByTagName('PointInteret');
            //console.log(points);
            for (let j = 0; j < points.length; j++) {

              //Si il existe un ou plusieurs point d'interet sur cet angle
              if (points[j].getAttribute('Angle') == $scope.angle) {

                //On recup les coord du point d'interet sur scale 100%
                let
                  pinCoord = points[j].getElementsByTagName('Coord'),
                  pinX = Number(pinCoord[0].getAttribute('x')),
                  pinY = Number(pinCoord[0].getAttribute('y'));

                //On applique le ratio
                let
                  drawX = pinX * $scope.zoom,
                  drawY = pinY * $scope.zoom;

                //Et on defini le centre du dessin comme l'origine
                var centerX = ($scope.canvas.clientWidth/2 + drawX)   ;
                var centerY = ($scope.canvas.clientHeight/2 + drawY)   ;

                //Dessin du point
                var radius = 5;
                //console.log(pinX, pinY);

                $scope.renderer.beginPath();
                $scope.renderer.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
                $scope.renderer.fillStyle = 'black';
                $scope.renderer.fill();
                $scope.renderer.lineWidth = 5;
                $scope.renderer.strokeStyle = 'red';
                $scope.renderer.stroke();

                //console.log(level[0]);

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
