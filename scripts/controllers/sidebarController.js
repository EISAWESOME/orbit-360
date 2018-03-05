"use strict";
(function () {
    ob.controller("SidebarController", [
        "$scope",
        "$rootScope",
        "Images",
        "storageService",
        "popService",
        "$mdDialog",
        function ($scope, $rootScope, Images, storageService, popService, $mdDialog) {

            //A mettre dans un fichier commun
            const buildToggler = (componentId) => {
                return () => {
                    $mdSidenav(componentId).toggle();
                    $scope.isNavCollapsed = !$scope.isNavCollapsed;
                };
            }
            $scope.toggleRight = buildToggler("right");

            $scope.exportXML = () => {
                storageService.exportXML();
            };

            $scope.toggleEditTooltip = (e) => {
                const lookup = {};
                for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
                    lookup[$scope.tooltips[i].id] = $scope.tooltips[i];
                }

                const ttId = e.target.parentNode.parentNode.parentNode.id;

                $scope.tooltip = lookup[ttId];
                $scope.tooltip.id = ttId;

                //Rend le titre du tooltip editable ou pas
                const ligneTitre =
                    e.target.parentNode.parentNode.parentNode.childNodes[1],
                    tdTitre = ligneTitre.childNodes[3],
                    ligneDesc = e.target.parentNode.parentNode.parentNode.childNodes[3],
                    divDesc = ligneDesc.childNodes[1].childNodes[1].childNodes[1];

                if (tdTitre.contentEditable == "true") {
                    tdTitre.setAttribute("contenteditable", "false");
                    storageService.updatePin(
                        ttId,
                        "titre",
                        "",
                        tdTitre.textContent,
                        $scope.tooltip
                    );
                } else tdTitre.setAttribute("contenteditable", "true");

                //Rend la description du tooltip editable ou pas
                if (divDesc.contentEditable == "true") {
                    divDesc.setAttribute("contenteditable", "false");
                    storageService.updatePin(
                        ttId,
                        "desc",
                        divDesc.textContent,
                        "",
                        $scope.tooltip
                    );
                } else divDesc.setAttribute("contenteditable", "true");
            };

            //Fonction de suppression d'un point d"interet
            $scope.deletePoint = (e) => {
                const lookup = {};
                for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
                    lookup[$scope.tooltips[i].id] = $scope.tooltips[i];
                }

                const ttId = e.target.parentNode.parentNode.parentNode.id;

                $scope.tooltip = lookup[ttId];
                $scope.tooltip.id = ttId;

                //Remove dans le tooltip

                let a = e.target;                
                a.parentNode.remove();

                const indextt = $scope.tooltips.indexOf($scope.tooltip);
                $scope.tooltips.splice(indextt, 1);

                for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
                    $scope.lookupAngle[$scope.tooltips[i].image] = $scope.tooltips[i];
                }

                //Remove dans le XML
                storageService.deletePin($scope.tooltip);
                $rootScope.$emit('canvasEdited');
            };

            //Dialog de confirmation de la suppression
            $scope.confirmDelete = (ev, id) => {
                // Appending dialog to document.body to cover sidenav in docs app
                const confirm = $mdDialog
                    .confirm()
                    .theme("grey")
                    .title("Supprimer ce point d\'interet ?")
                    .textContent("Vous ne pourrez pas revenir en arrière...")
                    .ariaLabel("Suppression")
                    .targetEvent(ev)
                    .ok("Supprimer")
                    .cancel("Annuler");

                $mdDialog.show(confirm).then(() => {
                    $scope.deletePoint(ev, id);
                });
            };

            //Supprime tout les elements pop
            $scope.deleteAllPop = () => {
                popService.deleteAllPop();
            };

            //Effectue un goto jusqu"au point clické, crée et affiche un pop de son titre
            $scope.clickTooltip = (e) => {
                popService.deleteAllPop();
                //On crée un lookup qui associe l"id d"un tooltip a son objet
                const lookup = {};
                for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
                    lookup[$scope.tooltips[i].id] = $scope.tooltips[i];
                }
                //On recupere l"id qui correspond au tooltip clické
                const ttId = e.target.parentNode.parentNode.id;
                $scope.tooltip = lookup[ttId];
                $scope.tooltip.id = ttId;
                $scope.autoPlay = false;

                const ratioX =
                    Images.level[0].width /
                    ($scope.actualTileWidth * Images.level[$scope.level].cols),
                    ratioY =
                    Images.level[0].height /
                    ($scope.actualTileHeight * Images.level[$scope.level].rows);

                const pointX =
                    $scope.tooltip.x / ratioX +
                    $scope.translaX +
                    $scope.canvas.clientWidth / 2,
                    pointY =
                    $scope.tooltip.y / ratioY +
                    $scope.translaY +
                    $scope.canvas.clientHeight / 2;

                popService.createPop("titre", $scope.tooltip.title, pointX, pointY);
                $scope.origAngle = $scope.angle;
                $scope.goTo($scope.tooltip.image);
            };

            //Affiche la description du point au survol de ce dernier dans le menu
            //Seulement si on est deja sur son angle
            $scope.hoverTooltip = (e) => {
                const lookup = {};
                for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
                    lookup[$scope.tooltips[i].id] = $scope.tooltips[i];
                }

                const ttId = e.target.parentNode.parentNode.id;
                $scope.tooltip = lookup[ttId];
                $scope.tooltip.id = ttId;
                $scope.autoPlay = false;

                if ($scope.tooltip.image == $scope.angle) {
                    $scope.deleteAllPop();

                    const ratioX =
                        Images.level[0].width /
                        ($scope.actualTileWidth * Images.level[$scope.level].cols),
                        ratioY =
                        Images.level[0].height /
                        ($scope.actualTileHeight * Images.level[$scope.level].rows);

                    const pointX =
                        $scope.tooltip.x / ratioX +
                        $scope.translaX +
                        $scope.canvas.clientWidth / 2,
                        pointY =
                        $scope.tooltip.y / ratioY +
                        $scope.translaY +
                        $scope.canvas.clientHeight / 2;

                    popService.createPop("titre", $scope.tooltip.title, pointX, pointY);
                    if (document.querySelector(".titrePop"))
                        document.querySelector(".titrePop").style.display = "block";
                }
            };

        }
    ])
}());