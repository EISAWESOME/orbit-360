/* global angular */
/* Sources dispo https://github.com/EISAWESOME/orbit */
"use strict";
const ob = angular.module("Orbit", [
  "ngMaterial",
  "ngResource",
  "ngAnimate",
  "hmGestures",
  "mousewheel",
  "ui.bootstrap",
  "angular-cache",
]);

/**
 * TODO avant v2
 * -Faire marcher l'export XML avec chrome
 * -Faire marcher angular cache
 * -Donner des noms a chaque controlleur / scope (Controller as ctrl)
 * UNE FOIS QUE TOUT CA EST FAIT
 * Faire un bundle de JS
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
    ])
    .run(["$http", "CacheFactory", function ($http, CacheFactory) {

      $http.defaults.cache = CacheFactory("o360cache", {
        maxAge: 10 * 24 * 60 * 60 * 1000, // Items added to this cache expire after 10 days
        cacheFlushInterval: 15 * 24 * 60 * 60 * 1000, // This cache will clear itself every 15 days
        deleteOnExpire: "aggressive" // Items will be deleted from this cache when they expire
      });
    }]);
}());