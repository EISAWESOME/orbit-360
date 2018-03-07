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


(function () {
  ob
    .config([
      "$mdThemingProvider",
      function ($mdThemingProvider) {
        $mdThemingProvider.theme("grey").primaryPalette("grey");
      }
    ]);
}());