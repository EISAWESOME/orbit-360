/*global angular, window, document, navigator, parseInt */
'use strict';

var ob = angular.module('Orbit', ['ngMaterial', 'ngResource', 'ngAnimate', 'hmGestures', 'mousewheel', 'ui.bootstrap']);

ob.config(function ($mdThemingProvider) {
  $mdThemingProvider.theme('grey')
    .primaryPalette('grey');
})
  .controller('OrbitCtrl', ['$scope', '$rootScope', 'Images', '$mdDialog', '$mdToast', '$mdSidenav', function ($scope, $rootScope, Images, $mdDialog, $mdToast, $mdSidenav) {



    function displayDesc(){
      console.log("Point(s) d'interet sur cet angle !!");

      //Retourne un tableau contenant tout les points de l'angle courant
      let matchedTt = $scope.tooltips.filter(matchAngle);
      function matchAngle(element) {
        return element.image == $scope.angle;
      }

      $scope.canvas.addEventListener('mousemove', function(e) {

        let lvl = $scope.level;

        let
          aX = (e.pageX - $scope.canvas.clientWidth / 2) - $scope.translaX,
          aY = (e.pageY - $scope.canvas.clientHeight / 2) - $scope.translaY;

        let
          ratioX = Images.level[0].width / ($scope.actualTileWidth * Images.level[lvl].cols),
          ratioY = Images.level[0].height / ($scope.actualTileHeight * Images.level[lvl].rows);

        let
          cursorX = aX * ratioX,
          cursorY = aY * ratioY;

        let incr = 0;
        //On boucle dans le tableau des point interet de l'angle actuel
        for (let i = 0; i < matchedTt.length; i++) {
          let
            pointX = ((matchedTt[i].x / ratioX) + $scope.translaX) + $scope.canvas.clientWidth / 2,
            pointY = ((matchedTt[i].y / ratioY) + $scope.translaY) + $scope.canvas.clientHeight / 2;

          //Les offsets entrée sont arbitraires et correspondent a la tolerence de declenchement de l'affichage du tooltip
          //On multiplie par 1/zoom pour que la tolérence diminue plus le zoom est elevé, et inversement

          //Si la position du curseur correspond a celle d'un point
          if (cursorX >= Number(matchedTt[i].x) - (10 / $scope.zoom) && cursorX <= Number(matchedTt[i].x) + (10 / $scope.zoom)) {
            if (cursorY >= Number(matchedTt[i].y) - (40 / $scope.zoom)&& cursorY <= Number(matchedTt[i].y) + (10 / $scope.zoom)) {
              //On supprime le pop up précedent si il existe
              $scope.deleteTitrePop()
              //On crée le pop up du point en question
              $scope.pointPop('desc', matchedTt[i].desc, pointX, pointY);
            } else { incr++ }
          } else{ incr++ }
          //On detruit le tooltip seulement si le surseur est sortit des zone de tolérance de X ET de Y
          if (incr === matchedTt.length){
            let a=document.querySelector('orbitview');
            let b = a.querySelector('.descPop');
            if(b){
              a.removeChild(b);
            }
            $scope.isPopDrawn= false;
          }
        }
      });
    };

    $scope.toggleLeft = buildToggler('left');
    $scope.toggleRight = buildToggler('right');

    function buildToggler(componentId) {
      return function () {
        $mdSidenav(componentId).toggle();
      };
    };

    function detectIE() {
      let ua = window.navigator.userAgent;

      let msie = ua.indexOf('MSIE ');
      if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
      }

      let trident = ua.indexOf('Trident/');
      if (trident > 0) {
        // IE 11 => return version number
        let rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
      }

      let edge = ua.indexOf('Edge/');
      if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
      }

      // other browser
      return false;
    };


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

      Images.loadxml().then(function(dataXML) {

        if (window.DOMParser) { // Standard
          let tmp = new DOMParser();
          $scope.xml = tmp.parseFromString(dataXML.data, "text/xml");
        }
        else { // IE
          $scope.xml = new ActiveXObject("Microsoft.XMLDOM");
          xml.async = "false";
          xml.loadXML(dataXML);
        }

        if($scope.xml.getElementsByTagName('property').length > 0){
          console.log($scope.xml.getElementsByTagName('property'));

            let colProperties = $scope.xml.getElementsByTagName('property');

            for(let i=0;  i<colProperties.length ; i++){

              if( colProperties[i].getAttribute('name') === 'titre'){

                $scope.titre = colProperties[i].textContent;

              }

              if( colProperties[i].getAttribute('name') === 'description'){

                $scope.description = colProperties[i].textContent;

              }
            }
        } else {
          console.log('else');

          Images.loadDetails().then(function(dataXML) {

            if (window.DOMParser) { // Standard
              let tmp = new DOMParser();
              $scope.details = tmp.parseFromString(dataXML.data, "text/xml");
            }
            else { // IE
              $scope.details = new ActiveXObject("Microsoft.XMLDOM");
              details.async = "false";
              details.loadXML(dataXML);
            }

            let colProperties = $scope.details.getElementsByTagName('property');

            for(let i=0;  i<colProperties.length ; i++){

              if( colProperties[i].getAttribute('name') === 'titre' && !$scope.titre){


                $scope.titre = colProperties[i].textContent;

              }

              if( colProperties[i].getAttribute('name') === 'description' && !$scope.description){

                $scope.description = colProperties[i].textContent;

              }
            }
          });
        }


        let colPoints = $scope.xml.getElementsByTagName('PointInteret');

        for(let i=0;  i<colPoints.length ; i++){

          let titre = colPoints[i].getElementsByTagName('Titre');
          let desc  = colPoints[i].getElementsByTagName('Description');
          let angle = colPoints[i].attributes[0].value;
          let id    = colPoints[i].attributes[1].value;
          let coord = {
            x : colPoints[i].getElementsByTagName('Coord')[0].getAttribute('x'),
            y : colPoints[i].getElementsByTagName('Coord')[0].getAttribute('y')
          }

          let tooltip = {
            title: titre[0].textContent,
            desc: desc[0].textContent,
            image: angle,
            x: coord.x,
            y: coord.y,
            id: id
          };

          $scope.id++;


          $scope.tooltips.push(tooltip);
        }
      });

      $scope.lookupAngle = {};

      for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
        $scope.lookupAngle[$scope.tooltips[i].image] = $scope.tooltips[i];
      }

      if($scope.lookupAngle[$scope.angle]){
        displayDesc();

      }

      $scope.translaY = 0;
      $scope.translaX = 0;

      $scope.prevDeltaX = 0;
      $scope.prevDeltaY = 0;

      $scope.pinIcon = new Image();
      $scope.pinIcon.src = '../app/images/pinIcon-32x32.png';

    };

    $scope.pointPop = function(mode, popContent, pointX, pointY){

        if (!$scope.isPopDrawn) {
          let
            popContainer = document.createElement("div"),
            popText = document.createTextNode(popContent);

          let a=document.querySelector('orbitview');
          popContainer.appendChild(popText);
          popContainer.style.marginLeft= pointX + "px";
          popContainer.style.marginTop= pointY +"px";
          popContainer.className = mode+"Pop";
          a.appendChild(popContainer);
          $scope.isPopDrawn = true;
        }
    };

    $scope.deleteAllPop = function(){

      let a = document.querySelector('orbitview');
      let b = document.querySelector('.titrePop');
      let c = document.querySelector('.descPop');
      if(b){
        a.removeChild(b);
      }
      if(c){
        a.removeChild(c);
      }

      $scope.isPopDrawn = false;
    };

    $scope.deleteTitrePop = function(){
      let a = document.querySelector('orbitview');
      let b = document.querySelector('.titrePop');


      if(b){
        a.removeChild(b);
      }
    };

    $scope.theme = 'grey';
    $scope.isPopDrawn = false;
    $scope.finGoto = false;

    $scope.id = 0;
    $scope.tooltipTrueCoord = {};
    $scope.tooltipTitre = "";
    $scope.tooltipDesc = "";
    $scope.clickRotation = true;
    $scope.clickTranslation = false;

    $scope.isEditMode = false;

    $scope.posX = 0;
    $scope.posY = 0;

    $scope.pinMode = false;
    $scope.isFullscreen= false;

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
    $scope.renderRatio = 5;
    $scope.autoPlay = false;
    $scope.tooltips = [];
    $scope.tooltip = null;
    $scope.tooltipVisible = false;
    $scope.goingFrom = null;

    $scope.isNavCollapsed = true;
    $scope.isCollapsed = true;
    $scope.isTitreCollapsed = true;


    //Prompt de saisie du titre / description d'un point d'interet
    //*******************
    $scope.promptPoint = function(ev) {
      $mdDialog.show({

        templateUrl: 'views/tooltipPrompt.tpl.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        controller: 'OrbitCtrl',
        clickOutsideToClose:true,
        escapeToClose: true,
      })
        .then(function(answer) {
          $scope.tooltipTitre = answer.Titre;
          $scope.tooltipDesc = answer.Desc;

          $scope.createTooltip();

        });
    };
    $scope.envoyer = function(answer) {
      $mdDialog.hide(answer);

    };
    $scope.closeDialog = function() {
      $mdDialog.cancel();
    };

    //*******************
    //Pop up de confirmation de suppression d'un point d'interet
    //*******************
    $scope.confirmDelete = function(ev, id) {
      // Appending dialog to document.body to cover sidenav in docs app
      let confirm = $mdDialog.confirm()
        .theme('grey')
        .title('Supprimer ce point d\'interet ?')
        .textContent('Vous ne pourrez pas revenir en arrière...')
        .ariaLabel('Suppression')
        .targetEvent(ev)
        .ok('Supprimer')
        .cancel('Annuler');

      $mdDialog.show(confirm).then(function(){
        $scope.deletePoint(ev, id);

      });
    };
    //*******************
    //Notifications
    //*******************

    let last = {
      bottom: false,
      top: true,
      left: false,
      right: true
    };

    $scope.toastPosition = angular.extend({},last);

    $scope.getToastPosition = function() {
      sanitizePosition();

      return Object.keys($scope.toastPosition)
        .filter(function(pos) { return $scope.toastPosition[pos]; })
        .join(' ');
    };

    function sanitizePosition() {
      let current = $scope.toastPosition;

      if ( current.bottom && last.top ) current.top = false;
      if ( current.top && last.bottom ) current.bottom = false;
      if ( current.right && last.left ) current.left = false;
      if ( current.left && last.right ) current.right = false;

      last = angular.extend({},current);
    }

    $scope.showSimpleToast = function() {
      let pinTo = $scope.getToastPosition();
      console.log(pinTo);

      $mdToast.show(
        $mdToast.simple()
          .textContent('Point d\'interet supprimé !')
          .position(pinTo )
          .hideDelay(3000)
      );
    };

    //*******************




    $rootScope.$on('onComplete', function () {
        let time = new Date();
        console.log('onComplete time: '+ time.getSeconds() +' '+ time.getMilliseconds());
        $scope.loading = false;
    });
    $rootScope.$on('onLoading', function (event, percent) {
        // console.log(percent);
        $scope.loading = percent;
    });

    //Fonction de suppression d'un point d'interet
    $scope.deletePoint = function(e) {

      let lookup = {};
      for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
        lookup[$scope.tooltips[i].id] = $scope.tooltips[i];
      }

      let ttId = e.target.parentNode.parentNode.parentNode.id;

      $scope.tooltip = lookup[ttId];
      $scope.tooltip.id = ttId;

        //Remove dans le tooltip

        let a = e.target;
        let els = [];
        while (a) {
          els.unshift(a);
          a = a.parentNode;
        }

        els[7].remove();

        console.log($scope.tooltip);
        let indextt = $scope.tooltips.indexOf($scope.tooltip);
        $scope.tooltips.splice(indextt, 1);

        for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
          $scope.lookupAngle[$scope.tooltips[i].image] = $scope.tooltips[i];
        }

        //Remove dans le XML
        let points = $scope.xml.getElementsByTagName('PointInteret');
        for(let i =0; i < points.length; i++){
          if (points[i].getAttribute('Angle') == $scope.tooltip.image && points[i].getElementsByTagName('Titre')[0].textContent == $scope.tooltip.title) {
            let coord = points[i].getElementsByTagName('Coord')[0];

            if (coord.getAttribute('x') == $scope.tooltip.x && coord.getAttribute('y') == $scope.tooltip.y) {
              points[i].parentNode.removeChild(points[i]);
              $scope.showSimpleToast();

            }
          }
        }

      $scope.edited = true ;

    };

    //Fonction d'export du flux XML courant => Dumb le flux dans une nouvelle fenêtre
    $scope.exportXML = function(){

      let properties = $scope.xml.createElement('properties'),
          propTitre = $scope.xml.createElement('property'),
          propDesc = propTitre.cloneNode(true);
      propTitre.setAttribute('name', 'titre');
      propDesc.setAttribute('name', 'description');

      let htmldataTitre = document.querySelector('#titreImage').innerHTML,
          htmldataDesc = document.querySelector('#descImage').innerHTML;

      let cdataTitre = $scope.xml.createCDATASection(htmldataTitre),
          cdataDesc = $scope.xml.createCDATASection(htmldataDesc);

      propTitre.appendChild(cdataTitre);
      propDesc.appendChild(cdataDesc);

      properties.appendChild(propTitre);
      properties.appendChild(propDesc);
      $scope.xml.getElementsByTagName('sequence')[0].appendChild(properties);


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
        if($scope.lookupAngle[$scope.angle]){
          displayDesc();
        }

        $scope.edited = true;
    };


    //Fonctions d'incrémentation de la translation
    //Appellé a l'appui d'une touche flèche du clavier
    $scope.incrTranslaX = function(translaX){
        $scope.translaX += translaX;

    };
    $scope.incrTranslaY = function(translaY){
        $scope.translaY += translaY;

    };

    //Fonction de definition de la translation
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
    };

    //Fonction declenché au clic d'un point d'interet dans le menu
    $scope.selectTooltip = function (e) {

      $scope.deleteAllPop();

          let lookup = {};
          for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
            lookup[$scope.tooltips[i].id] = $scope.tooltips[i];
          }

          let ttId = e.target.parentNode.parentNode.id;
          $scope.tooltip = lookup[ttId];
          $scope.tooltip.id = ttId;
          $scope.autoPlay = false;
          $scope.goingFrom = $scope.angle;



          let
            ratioX = Images.level[0].width / ($scope.actualTileWidth * Images.level[$scope.level].cols),
            ratioY = Images.level[0].height / ($scope.actualTileHeight * Images.level[$scope.level].rows);


          let
            pointX = (($scope.tooltip.x / ratioX) + $scope.translaX) + $scope.canvas.clientWidth / 2,
            pointY = (($scope.tooltip.y / ratioY) + $scope.translaY) + $scope.canvas.clientHeight / 2;


          $scope.pointPop('titre',$scope.tooltip.title, pointX, pointY);
          $scope.goTo($scope.tooltip.image);
    };

    $scope.hoverTooltip = function (e) {





        let lookup = {};
        for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
          lookup[$scope.tooltips[i].id] = $scope.tooltips[i];
        }


        let ttId = e.target.parentNode.parentNode.id;
        $scope.tooltip = lookup[ttId];
        $scope.tooltip.id = ttId;
        $scope.autoPlay = false;
        $scope.goingFrom = $scope.angle;

      if($scope.tooltip.image == $scope.angle) {
        $scope.deleteAllPop();


        let
          ratioX = Images.level[0].width / ($scope.actualTileWidth * Images.level[$scope.level].cols),
          ratioY = Images.level[0].height / ($scope.actualTileHeight * Images.level[$scope.level].rows);


        let
          pointX = (($scope.tooltip.x / ratioX) + $scope.translaX) + $scope.canvas.clientWidth / 2,
          pointY = (($scope.tooltip.y / ratioY) + $scope.translaY) + $scope.canvas.clientHeight / 2;


        $scope.pointPop('titre',$scope.tooltip.title, pointX, pointY);
        if(document.querySelector('.titrePop'))
          document.querySelector('.titrePop').style.display = 'block';


      }

    };


    //Fonction qui permet la rotation jusqu'a un angle donné
    $scope.goTo = function (angle) {

      //Faire pour qu'il tourne dans le sens le plus rapide en fonction du depart et de la destination ??
      if($scope.angle != angle){
        $scope.finGoto = false;
        $scope.setAngle($scope.angle +1);
        window.setTimeout($scope.goTo, 5, angle);
      } else {
        $scope.finGoto = true;
        console.log(document.querySelector('.titrePop'));
        if(document.querySelector('.titrePop'))
          document.querySelector('.titrePop').style.display = 'block';
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
       // $scope.resetTransla();
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
        $scope.renderer.restore();

        let zoom = $scope.zoom;
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
        $scope.edited = true;
    };

    $scope.zoomIn = function () {
        $scope.zoom += 0.1;
        if ($scope.zoom >= $scope.maxZoom) {
            $scope.zoom = $scope.maxZoom;
        }
        if($scope.level > 0 && $scope.zoom*1000 > Images.level[$scope.level].value)
            $scope.level--;
        $scope.edited = true;
    };

    $scope.editMode = function(){

      $scope.isEditMode = !$scope.isEditMode;

      //Desactive le pinmode en meme temps que la modification
      if($scope.isEditMode === false){
        $scope.pinMode = false;
      }
    };

    $scope.switchMode = function () {
      //L'execution de cette fonction le mode Rotation / Translation
      //En fonction du mode, les comportements du drag, ainsi que des touche flèches sont
      //differentes

      $scope.clickRotation = !$scope.clickRotation;
      $scope.clickTranslation = !$scope.clickTranslation;



      if($scope.clickRotation && !$scope.clickTranslation)
        $scope.canvas.style.cursor = "default";


      if($scope.clickTranslation && !$scope.clickRotation)
        $scope.canvas.style.cursor = "move";
      //Ici changer le cursuer pour mettre grab / grabbing
      //Via une classe peut etre ?

    };

    //Gestion des event de touche du clavier
    $scope.keymove = function (e) {
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
          }
          if (e.keyCode === 38) {// Haut
            $scope.incrTranslaY(-10);
          }
          if (e.keyCode === 39) {// Droite
            $scope.incrTranslaX(10);
          }
          if (e.keyCode === 40) {// Bas
            $scope.incrTranslaY(10);
          }

          $scope.edited = true;

        }


    };

    //Fonction qui gere la création d'un point d'interet
    $scope.pin = function (e) {
      //Se declenche au clic si le pinmode est activé
      if ($scope.pinMode) {

        let lvl = $scope.level;

        // Place l'origine de X et de Y au centre de l'image, prennant en compte la translation du canvas
        let
          cursorX = (e.gesture.center.pageX - $scope.canvas.clientWidth / 2) - $scope.translaX,
          cursorY = (e.gesture.center.pageY - $scope.canvas.clientHeight / 2) - $scope.translaY;


        //On etablie le ratio de proportion entre l'image scale 100% et l'image affiché à l'écran
        let
          ratioX = Images.level[0].width / ($scope.actualTileWidth * Images.level[lvl].cols),
          ratioY = Images.level[0].height / ($scope.actualTileHeight * Images.level[lvl].rows);

        //Les coordonnées du point à l'echelle 1:1 de l'image d'origine scale 100%
        $scope.tooltipTrueCoord = {x: cursorX * ratioX, y: cursorY * ratioY};

        //On vérifie que la curseur soit dans la zone de dessin pour crée le point d'interet
        if (!(cursorX > $scope.actualTileWidth * Images.level[lvl].cols / 2 ||
          cursorX < -$scope.actualTileWidth * Images.level[lvl].cols / 2 ||
          cursorY > $scope.actualTileHeight * Images.level[lvl].rows / 2 ||
          cursorY < -$scope.actualTileHeight * Images.level[lvl].rows / 2)
        )
        {
          $scope.promptPoint();
        }

      }

    };

    $scope.createTooltip= function(){

      let id = $scope.id;
      $scope.id++;

      let title = $scope.tooltipTitre;
      let desc = $scope.tooltipDesc;
      $scope.writePin(title, desc, $scope.angle, $scope.tooltipTrueCoord, id);

      let tooltip = {
        title: title,
        desc : desc,
        image: $scope.angle, //Angle
        x: $scope.tooltipTrueCoord.x,
        y: $scope.tooltipTrueCoord.y,
        id : id
      };

      $scope.tooltips.push(tooltip);


      for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
        $scope.lookupAngle[$scope.tooltips[i].image] = $scope.tooltips[i];
      }

      //Actualise la detection pour le nouveau point
      if($scope.lookupAngle[$scope.angle]){
        displayDesc();
      }


      $scope.edited = true;
    };



    //Ecris le point d'interet dans le flux XML
    $scope.writePin = function (titre, desc, angle, coord, id){

    let elmPoint = $scope.xml.createElement('PointInteret'),
        elmTitre = $scope.xml.createElement('Titre'),
        elmDesc = $scope.xml.createElement('Description'),
        elmCoord = $scope.xml.createElement('Coord'),

        cdataDesc = $scope.xml.createCDATASection(desc),
        cdataTitre = $scope.xml.createCDATASection(titre);

    elmPoint.setAttribute('Angle',angle);
    elmPoint.setAttribute('ID', id);
    elmCoord.setAttribute('x', coord.x);
    elmCoord.setAttribute('y', coord.y);


    elmTitre.appendChild(cdataTitre);
    elmDesc.appendChild(cdataDesc);


    elmPoint.appendChild(elmTitre);
    elmPoint.appendChild(elmDesc);
    elmPoint.appendChild(elmCoord);


    $scope.xml.getElementsByTagName('sequence')[0].appendChild(elmPoint);


  };

    $scope.drag = function (e) {

        if ($scope.clickRotation && !$scope.clickTranslation) {
          //$scope.resetTransla();

          $scope.tooltipVisible = false;
          let dst = $scope.lastDrag - e.gesture.deltaX,
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

          $scope.setAngle($scope.angle + parseInt(ratio));
        }

        if ($scope.clickTranslation && !$scope.clickRotation) {

          let
            currentDeltaX = e.gesture.deltaX,
            currentDeltaY = e.gesture.deltaY,
            deplacementX = currentDeltaX - $scope.prevDeltaX,
            deplacementY = currentDeltaY - $scope.prevDeltaY;

          $scope.incrTranslaX(deplacementX);
          $scope.incrTranslaY(deplacementY);

          $scope.prevDeltaX = currentDeltaX;
          $scope.prevDeltaY = currentDeltaY;
          $scope.edited = true;
        }
    };

    $scope.dragEnd = function(){

      $scope.prevDeltaX = 0;
      $scope.prevDeltaY = 0;

    };

    //Fonction de dessin du canvas
    $scope.draw = function () {

        if(($scope.waitingload && Images.resourcesLoaded($scope.level, $scope.angle)) || $scope.edited){
            $scope.waitingload = false;

            //Permet de reinitialisé le canvas
            $scope.canvas.width = $scope.canvas.width;

            $scope.renderer.translate($scope.translaX,$scope.translaY);
            $scope.renderer.save();

            let lvl = $scope.level;
            let current = Images.level[lvl].resources[$scope.angle];
            //console.log(current);
            //var pos = 0;
            if(!Images.resourcesLoaded(lvl, $scope.angle)){
                $scope.waitingload = true;
                Images.loadResources(lvl, $scope.angle);

                while(lvl < Images.level.length-1 && !Images.resourcesLoaded(lvl, $scope.angle)){
                    lvl++;
                }
                current = Images.level[lvl].resources[$scope.angle];
                //Image(s) courante, de 1 à 12 (index 0 à 11 ...)
            }
            let ILvl = Images.level[lvl],
                posOriX = $scope.getX(),
                posOriY = $scope.getY(),
                lapX = Math.floor(Images.level[0].width/ILvl.cols) * $scope.zoom,
                lapY = Math.floor(Images.level[0].height/ILvl.rows) * $scope.zoom;

            for (let i = 0; i < current.length; i++) {
                // console.log(Images.loadImage(lvl, $scope.angle, i));
                let posX = posOriX + lapX * Math.floor(i / ILvl.rows),
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
                let centerX = ($scope.canvas.clientWidth/2 + drawX)   ;
                let centerY = ($scope.canvas.clientHeight/2 + drawY)   ;

                //Dessin du point

                //On attend que l'image soit chargé, puis on la dessine

                $scope.renderer.drawImage($scope.pinIcon, centerX -16, centerY -32);

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
