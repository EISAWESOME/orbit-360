/* global ob, window */
'use strict';
(function () {
  ob.service('popService', [
    'Images',
    function () {
      const self = this;
      let
        isPopDrawn = false;

      this.updatePopDrawn = (state) => {
        isPopDrawn = state;
      };

      //Cree un element pop (desc ou titre)
      this.createPop = (mode, popContent, pointX, pointY) => {
        if (!isPopDrawn) {
          const popContainer = document.createElement('div');
          const popText = document.createTextNode(popContent);

          let a = document.querySelector('orbitview');
          popContainer.appendChild(popText);
          popContainer.style.marginLeft = pointX + 'px';
          popContainer.style.marginTop = pointY + 'px';
          popContainer.className = mode + 'Pop';
          a.appendChild(popContainer);
          self.updatePopDrawn(true);
        }
      };

      //Supprime tout les elements pop
      this.deleteAllPop = () => {
        let a = document.querySelector('orbitview');
        let b = document.querySelector('.titrePop');
        let c = document.querySelector('.descPop');
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
        let a = document.querySelector('orbitview');
        let b = document.querySelector('.titrePop');
        if (b) {
          a.removeChild(b);
        }
      };
    }
  ]);
}());
