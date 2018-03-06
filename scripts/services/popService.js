/* global ob, window */
"use strict";
(function () {
    ob.service("popService", [
        "Images",
        function (Images) {

            const self = this;
            let isPopDrawn = false;
            let canvas = null;
            let currentCursor = null;

            this.updateCurrentCursor = (cursor) => {
                currentCursor = cursor;
            };

            this.setCanvas = (currentCanvas) => {
                canvas = currentCanvas;
            };

            this.updatePopDrawn = (state) => {
                isPopDrawn = state;
            };


            //Cree un element pop (desc ou titre)
            this.createPop = (mode, popContent, pointX, pointY) => {
                if (!isPopDrawn) {
                    const popContainer = document.createElement("div"),
                        popText = document.createTextNode(popContent);

                    let a = document.querySelector("orbitview");
                    popContainer.appendChild(popText);
                    popContainer.style.marginLeft = pointX + "px";
                    popContainer.style.marginTop = pointY + "px";
                    popContainer.className = mode + "Pop";
                    a.appendChild(popContainer);
                    self.updatePopDrawn(true);
                }
            };

            //Supprime tout les elements pop
            this.deleteAllPop = () => {
                let a = document.querySelector("orbitview"),
                    b = document.querySelector(".titrePop"),
                    c = document.querySelector(".descPop");
                if (b) {
                    a.removeChild(b);
                }
                if (c) {
                    a.removeChild(c);
                }
                self.updatePopDrawn(false);
            };

            //Supprime les element titrePop
            this.deleteTitrePop = () => {
                let a = document.querySelector("orbitview"),
                    b = document.querySelector(".titrePop");
                if (b) {
                    a.removeChild(b);
                }
            };

            //Affiche le description du point quand on passe la souris dessus
            this.displayDesc = (tooltips, angle, level, zoom, transla = {x : 0, y : 0}, tile = {h : 0, w : 0}) => {
                //Retourne un tableau contenant tout les points de l"angle courant
                const matchAngle = (element) => {
                    return element.image == angle;
                }

                const matchedTt = tooltips.filter(matchAngle);

                canvas.addEventListener("mousemove", function (e) {
                    let lvl = level;

                    let aX = e.pageX - canvas.clientWidth / 2 - transla.x,
                        aY = e.pageY - canvas.clientHeight / 2 - transla.y;

                    const ratioX =
                        Images.level[0].width /
                        (tile.w * Images.level[lvl].cols),
                        ratioY =
                        Images.level[0].height /
                        (tile.h * Images.level[lvl].rows);

                    const cursorX = aX * ratioX,
                        cursorY = aY * ratioY;

                    let incr = 0;
                    //On boucle dans le tableau des point interet de l"angle actuel
                    for (let i = 0; i < matchedTt.length; i++) {
                        const pointX =
                            matchedTt[i].x / ratioX +
                            transla.x +
                            canvas.clientWidth / 2,
                            pointY =
                            matchedTt[i].y / ratioY +
                            transla.y +
                            canvas.clientHeight / 2;

                        //Les offsets entrée sont arbitraires et correspondent a la tolerence de declenchement de l"affichage du tooltip
                        //On divise par le zoom pour que la tolérence diminue plus le zoom est elevé, et inversement

                        //Si la position du curseur correspond a celle d"un point
                        if (matchedTt[i].image == angle) {
                            if (
                                cursorX >= Number(matchedTt[i].x) - 10 / zoom &&
                                cursorX <= Number(matchedTt[i].x) + 10 / zoom
                            ) {
                                if (
                                    cursorY >= Number(matchedTt[i].y) - 40 / zoom &&
                                    cursorY <= Number(matchedTt[i].y) + 10 / zoom
                                ) {
                                    //On supprime le pop up précedent si il existe
                                    self.deleteTitrePop();
                                    //On crée le pop up du point en question
                                    self.createPop("desc", matchedTt[i].desc, pointX, pointY);
                                    canvas.style.cursor = "default";
                                } else {
                                    incr++;
                                }
                            } else {
                                incr++;
                            }
                            if (incr === matchedTt.length) {
                                let a = document.querySelector("orbitview");
                                const b = a.querySelector(".descPop");
                                if (b) {
                                    a.removeChild(b);
                                    canvas.style.cursor = currentCursor;
                                }
                                self.updatePopDrawn(false);
                            }
                        }
                    }
                });
            };
        }
    ]);
}());