/* global ob, angular, window */
"use strict";
(function () {
    ob.controller("OrbitCtrl", [
        "$scope",
        "$rootScope",
        "Images",
        "storageService",
        "popService",
        "$mdDialog",
        "$mdSidenav",
        function (
            $scope,
            $rootScope,
            Images,
            storageService,
            popService,
            $mdDialog,
            $mdSidenav
        ) {
            $rootScope.$on("onLoading", (event, percent) => {
                $scope.loading = percent;
            });
            $rootScope.$on("onComplete", () => {
                const time = new Date();
                $scope.loading = false;

                $scope.draw(true);
            });

            $rootScope.$on("canvasEdited", () => {
                if ($scope.canvas) {
                    $scope.draw(true);

                    if ($scope.tooltips) {
                        $scope.matchTooltip();
                    }
                }
            });

            $rootScope.$on("tooltipChanged", () => {
                $scope.tooltips = storageService.getTooltips();
                $scope.id = storageService.getId();
                $rootScope.$emit("canvasEdited");  
            });

            /**************Declaration et initialisation des variable du scope**************/
            //Initalisation de l"id des tooltip
            $scope.id = storageService.getId();
            //

            $scope.lookupAngle = {};
            $scope.matchedTt = null;
            $scope.translaY = 0;
            $scope.translaX = 0;

            $scope.prevDeltaX = 0;
            $scope.prevDeltaY = 0;

            $scope.pinIcon = new Image();
            $scope.pinIcon.src = "./resources/icons/pinIcon-32x32.png";

            //Theme des dialog et de la navbar
            $scope.theme = "grey";
            //

            //Variables lié aux modes
            $scope.clickRotation = true;
            $scope.clickTranslation = false;
            $scope.pinMode = false;
            $scope.autoPlay = false;
            $scope.isEditMode = false;
            $scope.isFullscreen = false;
            $scope.fsSrc = "./resources/icons/icon_fullscreen.png";
            $scope.currentCursor = "default";
            //

            //Variables lié au tooltips
            $scope.tooltips = storageService.getTooltips();
            $scope.tooltip = null;
            $scope.tooltipTitre = "";
            $scope.tooltipDesc = "";
            $scope.isPopDrawn = false;
            //

            //Variable lié au chargement des images
            $scope.loading = "0";
            $scope.loadingReso = false;
            $scope.waitingload = true;
            $scope.visible = false;
            //

            //Variables lié au dessin
            $scope.zoom = 1; //1 = zoom à 100%
            $scope.level = 0;
            $scope.angle = 0; //id de l"angle de vue
            $scope.posX = 0;
            $scope.posY = 0;
            $scope.actualTileWidth = 0;
            $scope.actualTileHeight = 0;
            //

            //Initialisation de l"etat de la navbar, des descriptions dans le menu, et de la description du titre
            $scope.isNavCollapsed = true;
            $scope.isCollapsed = true;
            $scope.isTitreCollapsed = true;

            //Fonction executée a l"initialisation du scope
            $scope.init = () => {
                document.querySelector("#loadingMessage").style.display = "none";

                $scope.canvas = document.querySelector("#orbit-canvas");
                $scope.renderer = $scope.canvas.getContext("2d");

                $scope.addMouseHoverListener();

                $scope.level = Images.level.length - 1;
                Images.loadLevel($scope.level);

                window.onresize = $scope.resize;
                $scope.resize();

                $scope.visible = true;


                //Boucle de dessin, verifie si il faut dessiné toute les 40ms
                setInterval(() => {
                    $scope.loadingReso = $scope.waitingload;

                    $scope.draw();
                    //15ms for 60fps booiiii
                }, 15);

                Images.loadLevel($scope.level);

                // Transferer vers le storageService ?
                // Et retourner le titre et la description ?
                storageService.loadXml().then((xml) => {
                    const ret = storageService.readXml(xml);

                    $scope.id = ret.id;
                    $scope.titre = ret.titre;
                    $scope.description = ret.description;
                    $scope.details = ret.details;
                    $scope.lookupAngle = ret.lookupAngle;
                });

                $scope.modeCursor();
            };

            /****************************************************************************/

            /****************************Dessin de l"objet**************************/
            $scope.draw = (force) => {
                if (
                    ($scope.waitingload &&
                        Images.resourcesLoaded($scope.level, $scope.angle)) ||
                    force
                ) {
                    $scope.waitingload = false;
                    //Permet de reinitialisé le canvas
                    $scope.canvas.width = $scope.canvas.width;

                    //On replace l"origine du canvas a l"endroit ou on l"avais laisser
                    $scope.renderer.translate($scope.translaX, $scope.translaY);
                    $scope.renderer.save();

                    let lvl = $scope.level;
                    let current = Images.level[lvl].resources[$scope.angle];
                    //Si les images de l"angle ne sont pas chargé, on attend et on les recharge
                    if (!Images.resourcesLoaded(lvl, $scope.angle)) {
                        $scope.waitingload = true;
                        Images.loadResources(lvl, $scope.angle);

                        while (
                            lvl < Images.level.length - 1 &&
                            !Images.resourcesLoaded(lvl, $scope.angle)
                        ) {
                            lvl++;
                        }
                        current = Images.level[lvl].resources[$scope.angle];
                        //Image(s) courante, de 1 à 12 (index 0 à 11 ...)
                        //Le nombre d"image varie en fonction du level
                    }
                    const ILvl = Images.level[lvl],
                        posOriX = $scope.getX(),
                        posOriY = $scope.getY(),
                        lapX =
                        Math.floor(Images.level[0].width / ILvl.cols) * $scope.zoom,
                        lapY =
                        Math.floor(Images.level[0].height / ILvl.rows) * $scope.zoom;

                    //Pour chaque images du niveau
                    for (let i = 0; i < current.length; i++) {
                        $scope.posX = posOriX + lapX * Math.floor(i / ILvl.rows);
                        $scope.posY = posOriY + lapY * Math.floor(i % ILvl.rows);

                        //le +1 permet de supprimé l"écart entre les 4 images sous Firefox et IE, leger clipping sur chrome
                        $scope.actualTileWidth =
                            current[i].img.naturalWidth * $scope.zoom * 1000 / ILvl.value +
                            1;
                        $scope.actualTileHeight =
                            current[i].img.naturalHeight * $scope.zoom * 1000 / ILvl.value +
                            1;

                        //On dessine l"image dans sa "case"
                        $scope.renderer.drawImage(
                            current[i].img,
                            $scope.posX,
                            $scope.posY,
                            $scope.actualTileWidth,
                            $scope.actualTileHeight
                        );
                    }
                    //Une fois que toute les cases sont dessinées, on dessine les points d"interet
                    if (storageService.getXml()) {
                        const points = storageService.getXml().getElementsByTagName("PointInteret");
                        for (let j = 0; j < points.length; j++) {
                            //Si il existe un ou plusieurs point d"interet sur cet angle
                            if (points[j].getAttribute("Angle") == $scope.angle) {
                                //On recup les coords du point d"interet sur scale 100%
                                const pinCoord = points[j].getElementsByTagName("Coord"),
                                    pinX = Number(pinCoord[0].getAttribute("x")),
                                    pinY = Number(pinCoord[0].getAttribute("y"));

                                //On applique le ratio pour avoir ses coord sur la scale courante
                                const drawX = pinX * $scope.zoom,
                                    drawY = pinY * $scope.zoom;

                                //Et on defini le centre du dessin comme l"origine
                                const centerX = $scope.canvas.clientWidth / 2 + drawX,
                                    centerY = $scope.canvas.clientHeight / 2 + drawY;

                                //On attend que l"image soit chargé, puis on la dessine
                                $scope.renderer.drawImage(
                                    $scope.pinIcon,
                                    centerX - 16,
                                    centerY - 32
                                );
                            }
                        }
                    }
                }
            };

            $scope.getX = () => {
                return +(
                    $scope.canvas.width / 2 -
                    Images.level[0].width / 2 * $scope.zoom
                ).toFixed(0);
            };
            $scope.getY = () => {
                return -(
                    (Images.level[0].height * $scope.zoom - $scope.canvas.height) /
                    2
                ).toFixed(0);
            };

            $scope.resize = () => {
                $scope.resetTransla();
                $scope.renderer.restore();
                $scope.canvas.width = $scope.canvas.offsetWidth;
                $scope.canvas.height = $scope.canvas.offsetHeight;
                if ($scope.loading === true) {
                    return false;
                }
                if (
                    $scope.canvas.width / Images.level[0].width <=
                    $scope.canvas.height / Images.level[0].height
                ) {
                    $scope.zoom = $scope.canvas.width / Images.level[0].width;
                } else {
                    $scope.zoom = $scope.canvas.height / Images.level[0].height;
                }
                $scope.level = Images.level.length - 1;
                while ($scope.zoom * 1000 > Images.level[$scope.level].value) {
                    $scope.level--;
                }
                $scope.minZoom = $scope.zoom;
                $scope.maxZoom = 1;
                if ($scope.visible) {
                    $scope.$apply();
                }
                $rootScope.$emit("canvasEdited");
            };

            /*************************************************************************/

            /*******************Fonctions de deplacement*******************************/
            //Fonction de changement grab/grabbing
            $scope.toggleGrab = () => {
                if (!$scope.pinMode) {
                    if (
                        $scope.canvas.style.cursor === "-webkit-grab" ||
                        $scope.canvas.style.cursor === "-moz-grab" ||
                        $scope.canvas.style.cursor === "grab"
                    ) {
                        $scope.canvas.style.cursor = "-webkit-grabbing";
                        $scope.canvas.style.cursor = "-moz-grabbing";
                        $scope.canvas.style.cursor = "grabbing";
                    } else {
                        $scope.canvas.style.cursor = "-webkit-grab";
                        $scope.canvas.style.cursor = "-moz-grab";
                        $scope.canvas.style.cursor = "grab";
                    }
                }
            };

            $scope.dragStart = () => {
                if ($scope.clickRotation && !$scope.clickTranslation) {
                    $scope.toggleGrab();
                }
            };

            //Gestion du drag
            $scope.drag = (e) => {
                if (!$scope.loading) {
                    //Si on est en mode Rotation
                    if ($scope.clickRotation && !$scope.clickTranslation) {
                        let dst = $scope.lastDrag - e.gesture.deltaX,
                            ratio;

                        dst *= 1;
                        ratio = dst / 10;
                        ratio = ratio.toFixed(0);
                        if (ratio === "-0") {
                            ratio = -1;
                        } else if (ratio === "0") {
                            ratio = 1;
                        }
                        $scope.lastDrag = e.gesture.deltaX;
                        $scope.setAngle($scope.angle + parseInt(ratio));
                    }

                    //Si on est en mode translation
                    if ($scope.clickTranslation && !$scope.clickRotation) {
                        const deplacementX = e.gesture.deltaX - $scope.prevDeltaX,
                            deplacementY = e.gesture.deltaY - $scope.prevDeltaY;

                        $scope.incrTranslaX(deplacementX);
                        $scope.incrTranslaY(deplacementY);

                        $scope.prevDeltaX = e.gesture.deltaX;
                        $scope.prevDeltaY = e.gesture.deltaY;
                        $rootScope.$emit("canvasEdited");
                    }
                }
            };

            $scope.dragEnd = () => {
                if ($scope.clickRotation && !$scope.clickTranslation) {
                    $scope.toggleGrab();
                }
                $scope.prevDeltaX = 0;
                $scope.prevDeltaY = 0;
            };

            //Fonction qui permet la rotation jusqu"a un angle donné
            $scope.goTo = (angle) => {
                if ($scope.angle != angle) {
                    if (
                        Images.nbAngle - angle + $scope.origAngle <
                        angle - $scope.origAngle
                    ) {
                        $scope.setAngle($scope.angle - 1);
                    } else {
                        $scope.setAngle($scope.angle + 1);
                    }

                    window.setTimeout($scope.goTo, 5, angle);
                } else {
                    if (document.querySelector(".titrePop")) {
                        document.querySelector(".titrePop").style.display = "block";
                    }
                }
            };
            //A la fin du drag, on reset les valeurs

            //Gestion des event de touche du clavier
            $scope.keymove = (e) => {
                if (!$scope.loading) {
                    //Les controle avec les fleches ne sont active que quant le menu est fermé
                    if ($scope.isNavCollapsed) {
                        //Mode Rotation
                        if ($scope.clickRotation && !$scope.clickTranslation) {
                            if (e.keyCode === 39) {
                                $scope.setAngle($scope.angle - 1);
                            }

                            if (e.keyCode === 37) {
                                $scope.setAngle($scope.angle + 1);
                            }
                        }
                        //Mode Translation
                        if ($scope.clickTranslation && !$scope.clickRotation) {
                            $scope.renderer.restore();
                            $scope.renderer.save();

                            if (e.keyCode === 37) {
                                // Gauche
                                $scope.incrTranslaX(-10);
                            }

                            if (e.keyCode === 38) {
                                // Haut
                                $scope.incrTranslaY(-10);
                            }

                            if (e.keyCode === 39) {
                                // Droite
                                $scope.incrTranslaX(10);
                            }

                            if (e.keyCode === 40) {
                                // Bas
                                $scope.incrTranslaY(10);
                            }

                            $rootScope.$emit("canvasEdited");
                        }
                    }
                }
            };

            //Fonctions d"incrémentation de la translation du canvas
            $scope.incrTranslaX = (translaX) => {
                $scope.translaX += translaX;
            };
            $scope.incrTranslaY = (translaY) => {
                $scope.translaY += translaY;
            };

            $scope.setAngle = (angle) => {
                if (angle >= Images.nbAngle) {
                    $scope.angle = angle - Images.nbAngle;
                } else if (angle < 0) {
                    $scope.angle = angle + Images.nbAngle;
                } else {
                    $scope.angle = angle;
                }

                popService.deleteAllPop();

                $rootScope.$emit("angleChanged", $scope.angle);
                $rootScope.$emit("canvasEdited");
            };

            //Fonction de definition de la translation du canvas
            $scope.setTranslaXY = (translaX, translaY) => {
                $scope.translaX = translaX;
                $scope.translaY = translaY;
                $rootScope.$emit("canvasEdited");
            };

            $scope.resetTransla = () => {
                $scope.translaY = 0;
                $scope.translaX = 0;
                $rootScope.$emit("canvasEdited");
            };
            /*************************************************************************/

            /***************************Controles de l"application********************/
            //Permet la rotation automatique du modele
            $scope.play = () => {
                if ($scope.autoPlay) {
                    $scope.setAngle($scope.angle + 1);
                    window.setTimeout($scope.play, 40);
                }
            };

            //Plein écran
            $scope.toggleFullscreen = () => {
                const elem = document.querySelector("html");
                if ($scope.isFullscreen) {
                    $scope.fsSrc = "./resources/icons/icon_fullscreen_back.png";
                    if (elem.requestFullscreen) {
                        elem.requestFullscreen();
                    } else if (elem.msRequestFullscreen) {
                        elem.msRequestFullscreen();
                    } else if (elem.mozRequestFullScreen) {
                        elem.mozRequestFullScreen();
                    } else if (elem.webkitRequestFullscreen) {
                        elem.webkitRequestFullscreen();
                    }
                } else {
                    $scope.fsSrc = "./resources/icons/icon_fullscreen.png";
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

            $scope.onWheel = (e) => {
                $scope.renderer.restore();
                const zoom = $scope.zoom;
                if (e.deltaY > 0) {
                    $scope.zoomOut();
                } else {
                    $scope.zoomIn();
                }
                if (zoom != $scope.zoom) {
                    $rootScope.$emit("canvasEdited");
                }
            };

            $scope.zoomOut = () => {
                $scope.zoom -= 0.1;
                if ($scope.zoom < $scope.minZoom) {
                    $scope.zoom = $scope.minZoom;
                }
                if (
                    $scope.level < Images.level.length - 1 &&
                    $scope.zoom * 1000 <= Images.level[$scope.level + 1].value
                ) {
                    $scope.level++;
                }

                $rootScope.$emit("canvasEdited");
            };

            $scope.zoomIn = () => {
                $scope.zoom += 0.1;
                if ($scope.zoom >= $scope.maxZoom) {
                    $scope.zoom = $scope.maxZoom;
                }
                if (
                    $scope.level > 0 &&
                    $scope.zoom * 1000 > Images.level[$scope.level].value
                )
                    $scope.level--;
                $rootScope.$emit("canvasEdited");
            };

            //Toggle du mode edition
            $scope.editMode = () => {
                $scope.isEditMode = !$scope.isEditMode;
                //Desactive le pinmode en meme temps que la modification
                if ($scope.isEditMode === false) {
                    $scope.pinMode = false;
                }
            };

            //Passe de rotation à translation
            $scope.modeCursor = () => {
                if ($scope.pinMode) {
                    $scope.canvas.style.cursor = "crosshair";
                    $scope.currentCursor = "crosshair";
                } else {
                    if ($scope.clickRotation && !$scope.clickTranslation) {
                        $scope.canvas.style.cursor = "-webkit-grab";
                        $scope.canvas.style.cursor = "-moz-grab";
                        $scope.canvas.style.cursor = "grab";
                        $scope.currentCursor = "grab";
                    }

                    if ($scope.clickTranslation && !$scope.clickRotation) {
                        $scope.canvas.style.cursor = "move";
                    }
                    $scope.currentCursor = "move";
                }
            };
            $scope.switchMode = () => {
                $scope.clickRotation = !$scope.clickRotation;
                $scope.clickTranslation = !$scope.clickTranslation;

                $scope.modeCursor();
            };

            /*************************************************************************/

            $scope.buildToggler = (componentId) => {
                return () => {
                    $mdSidenav(componentId).toggle();
                    $scope.isNavCollapsed = !$scope.isNavCollapsed;
                };
            };

            $scope.toggleLeft = $scope.buildToggler("left");

            /********************Fonctions de gestion du pin ***************************/

            const determineRatios = () => {
                let lvl = $scope.level;
                return {
                    x: Images.level[0].width /
                        ($scope.actualTileWidth * Images.level[lvl].cols),
                    y: Images.level[0].height /
                        ($scope.actualTileHeight * Images.level[lvl].rows)
                };

            };

            //Création d"un point d"interet au clic
            $scope.pin = (e) => {
                if ($scope.pinMode) {
                    if (!$scope.isNavCollapsed) {
                        $scope.toggleLeft();
                    }
                    let lvl = $scope.level;
                    // Place l"origine de X et de Y au centre de l"image, prennant en compte la translation du canvas
                    const cursorX =
                        e.gesture.center.pageX -
                        $scope.canvas.clientWidth / 2 -
                        $scope.translaX,
                        cursorY =
                        e.gesture.center.pageY -
                        $scope.canvas.clientHeight / 2 -
                        $scope.translaY;

                    //On etablie le ratio de proportion entre l"image scale 100% et l"image affiché à l"écran

                    const ratio = determineRatios();

                    //Les coordonnées du point à l"echelle 1:1 de l"image d"origine scale 100%
                    const tooltipTrueCoord = {
                        x: cursorX * ratio.x,
                        y: cursorY * ratio.y
                    };

                    //On vérifie que la curseur soit dans la zone de dessin pour crée le point d"interet
                    if (!(
                            cursorX > $scope.actualTileWidth * Images.level[lvl].cols / 2 ||
                            cursorX <
                            -$scope.actualTileWidth * Images.level[lvl].cols / 2 ||
                            cursorY >
                            $scope.actualTileHeight * Images.level[lvl].rows / 2 ||
                            cursorY < -$scope.actualTileHeight * Images.level[lvl].rows / 2
                        )) {
                        $scope.promptPoint(tooltipTrueCoord);
                    }
                }
            };

            //Creation de l'objet correspondant au point
            $scope.createClickTooltip = (tooltipTrueCoord) => {
                const id = $scope.id;
                $scope.id++;

                const title = $scope.tooltipTitre;
                const desc = $scope.tooltipDesc;

                storageService.writePin(
                    title,
                    desc,
                    $scope.angle,
                    tooltipTrueCoord,
                    id
                );

                const tooltip = {
                    title: title,
                    desc: desc,
                    image: $scope.angle, //Angle
                    x: tooltipTrueCoord.x,
                    y: tooltipTrueCoord.y,
                    id
                };

                $scope.tooltips.push(tooltip);

                for (let i = 0, len = $scope.tooltips.length; i < len; i++) {
                    $scope.lookupAngle[$scope.tooltips[i].image] = $scope.tooltips[i];
                }

                $scope.matchTooltip();
                $rootScope.$emit("canvasEdited");
            };

            $scope.matchTooltip = () => {
                const matchAngle = (element) => {
                    return element.image == $scope.angle;
                };
                $scope.matchedTt = $scope.tooltips.filter(matchAngle);
            };

            $scope.addMouseHoverListener = () => {
                $scope.canvas.addEventListener("mousemove", function (e) {
                    let lvl = $scope.level;

                    let aX = e.pageX - $scope.canvas.clientWidth / 2 - $scope.translaX,
                        aY = e.pageY - $scope.canvas.clientHeight / 2 - $scope.translaY;

                    const ratio = determineRatios();

                    const cursorX = aX * ratio.x,
                        cursorY = aY * ratio.y;

                    let incr = 0;
                    //On boucle dans le tableau des point interet de l"angle actuel
                    for (let i = 0; i < $scope.matchedTt.length; i++) {
                        const pointX =
                            $scope.matchedTt[i].x / ratio.x +
                            $scope.translaX +
                            $scope.canvas.clientWidth / 2,
                            pointY =
                            $scope.matchedTt[i].y / ratio.y +
                            $scope.translaY +
                            $scope.canvas.clientHeight / 2;

                        //Les offsets entrée sont arbitraires et correspondent a la tolerence de declenchement de l"affichage du tooltip
                        //On divise par le zoom pour que la tolérence diminue plus le zoom est elevé, et inversement

                        //Si la position du curseur correspond a celle d"un point
                        if ($scope.matchedTt[i].image == $scope.angle) {
                            if (
                                cursorX >= Number($scope.matchedTt[i].x) - 10 / $scope.zoom &&
                                cursorX <= Number($scope.matchedTt[i].x) + 10 / $scope.zoom
                            ) {
                                if (
                                    cursorY >= Number($scope.matchedTt[i].y) - 40 / $scope.zoom &&
                                    cursorY <= Number($scope.matchedTt[i].y) + 10 / $scope.zoom
                                ) {
                                    //On supprime le pop up précedent si il existe
                                    popService.deleteTitrePop();
                                    //On crée le pop up du point en question
                                    if($scope.matchedTt[i].desc !== " "){
                                        popService.createPop("desc", $scope.matchedTt[i].desc, pointX, pointY);
                                    } else {
                                        popService.createPop("desc", "Pas de description...", pointX, pointY);
                                    }
                                    
                                    $scope.canvas.style.cursor = "default";
                                } else {
                                    incr++;
                                }
                            } else {
                                incr++;
                            }
                            if (incr === $scope.matchedTt.length) {
                                let a = document.querySelector("orbitview");
                                const b = a.querySelector(".descPop");
                                if (b) {
                                    a.removeChild(b);
                                    $scope.canvas.style.cursor = $scope.currentCursor;
                                }
                                popService.updatePopDrawn(false);
                            }
                        }
                    }
                });
            };
            /***************************************************************************/


            /********************************Dialogs**********************************/
            //Dialog de saisie du Titre et Desc d"un point
            $scope.promptPoint = (tttc) => {
                $mdDialog
                    .show({
                        templateUrl: "views/tooltipPrompt.tpl.html",
                        parent: angular.element(document.body),
                        controller: "OrbitCtrl",
                        clickOutsideToClose: true,
                        escapeToClose: true
                    })
                    .then((answer) => {
                        $scope.tooltipTitre = answer.Titre;
                        $scope.tooltipDesc = answer.Desc ? answer.Desc : " ";
                        $scope.createClickTooltip(tttc);
                    });
            };

            $scope.envoyer = (answer) => {
                $mdDialog.hide(answer);
            };
            $scope.closeDialog = () => {
                $mdDialog.cancel();
            };
            /***************************************************************************/
        }
    ]);
}());