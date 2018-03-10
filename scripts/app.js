/* global angular */
/* Sources dispo https://github.com/EISAWESOME/orbit */
"use strict";
const ob = angular.module("Orbit", [
  "ngMaterial",
  "ngResource",
  "ngAnimate",
  "hmGestures",
  "mousewheel",
  "ui.bootstrap"
]);

/**
 * TODO v2
 * -Faire marcher l'export XML avec chrome ** DONE **
 * -Finir la gestion du localStorage **DONE**
 * 
 * UNE FOIS QUE TOUT CA EST FAIT
 * Faire un bundle de JS => Pas trop possible, il faudrait port en ES6
 *  rediger la doc v2
 * 
 * TODO v2.1
 * -Changer les icons
 * -Optimiser mobile
 * -Afficher un guide interactif qui explique rapidement les fonctionnalités
 * -Traduction anglais
 * 
 * TODO v3 : Goal
 * -Controllers et Services -> ES6 Class
 * -Rollup
 * -Full open source loader pour les photos à 360 sur un axe + zoom
 *  -> Renseigne le format de la séquence
 * 
 * ET PEUT ETRE
 * Evoluer vers un orbit 360, qui gere la rotation sur l'axe Y, permettant de tourner tout autour de l'objet
 * 
 */

/**
 * TODO general:
 * -Service de dessin
 * -Service de stockage des point d"interets **DONE**
 *  -> Stocké les points d"interet dans le localstorage
 * -PopService **Done**
 * -Navbar controller **DONE**
 * -buttons controller ??
 * -Faire des modules (Rollup?)
 *
 * -Async load css **DONE**
 * -Progressive jpeg **DONE**
 * -Sass
 */
(function () {
  ob
    .config([
      "$mdThemingProvider",
      function ($mdThemingProvider) {
        $mdThemingProvider.theme("grey").primaryPalette("grey");
      }
    ]);
}());