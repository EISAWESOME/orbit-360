/* global ob, window, ActiveXObject, JSZip, saveAs */
'use strict';
(function () {
  ob.service('storageService', [
    '$http',
    '$location',
    '$mdToast',
    '$rootScope',
    'Images',
    function ($http, $location, $mdToast, $rootScope, Images) {
      let xml = null;
      let currentIdTooltip = 0;
      let tooltips = [];

      const self = this;

      this.getXml = () => {
        return xml;
      };

      this.setXml = (_xml) => {
        xml = _xml;
      };

      this.getId = () => {
        return currentIdTooltip;
      };

      /*
      this.setId = (_xml) => {
        xml = _xml;
      };*/

      this.getTooltips = () => {
        return tooltips;
      };

      /*
      this.setTooltips = (_xml) => {
        xml = _xml;
      };*/

      //url: '../hyracotherium_pied-a-4-doigts/',
      //url: '../Axinite_prenite_epidote/',
      this.determineUrl = () => {
        //Si la paremetre url est renseigné

        /*
        if ($location.search().model) {
          return '../' + $location.search().model + '/';
        }
        //Sinon on charge l'amonite par défaut
        else {
          */
        return '../amonite/';
        //}
      };

      //charge un xml, retoune une promesse
      this.loadXml = function () {
        return $http.get(self.determineUrl() + 'content.xml');
      };

      this.loadDetails = function () {
        return $http.get(self.determineUrl() + 'content2.xml');
      };

      //Retourne titre, desc, et details du xml chargé si ils existent
      this.readXml = (dataXML) => {
        let titre;
        let description;
        let details;
        let lookupAngle = [];

        if (window.DOMParser) {
          // Standard
          const tmp = new DOMParser();
          self.setXml(tmp.parseFromString(dataXML.data, 'text/xml'));
        } else {
          // IE
          self.setXml(new ActiveXObject('Microsoft.XMLDOM'));
          xml.async = 'false';
          xml.loadXML(dataXML);
        }
        if (xml) {
          self.loadLocalStorage(xml);
          //Si il existe les proprietes dans content.xml, on les prends
          if (xml.getElementsByTagName('property').length > 0) {
            const colProperties = xml.getElementsByTagName('property');

            for (let i = 0; i < colProperties.length; i++) {
              if (colProperties[i].getAttribute('name') === 'titre') {
                titre = colProperties[i].textContent;
              }
              if (colProperties[i].getAttribute('name') === 'description') {
                description = colProperties[i].textContent;
              }
            }
          } else {
            //Si elles n'existe pas, on essaye de les prendre dans content2.xml
            Images.loadDetails().then((dataXML) => {
              if (window.DOMParser) {
                // Standard
                const tmp = new DOMParser();
                details = tmp.parseFromString(dataXML.data, 'text/xml');
              } else {
                // IE
                details = new ActiveXObject('Microsoft.XMLDOM');
                details.async = 'false';
                details.loadXML(dataXML);
              }
              const colProperties = details.getElementsByTagName('property');
              for (let i = 0; i < colProperties.length; i++) {
                if (
                  colProperties[i].getAttribute('name') === 'titre' &&
                  !titre
                ) {
                  titre = colProperties[i].textContent;
                }

                if (
                  colProperties[i].getAttribute('name') === 'description' &&
                  !description
                ) {
                  description = colProperties[i].textContent;
                }
              }
            });
          }
          self.setXml(xml);
        }

        const colPoints = xml.getElementsByTagName('PointInteret');

        for (let i = 0; i < colPoints.length; i++) {
          const titre = colPoints[i].getElementsByTagName('Titre');
          const description = colPoints[i].getElementsByTagName('Description');
          const angle = colPoints[i].attributes[0].value;
          const coord = {
            x: colPoints[i]
              .getElementsByTagName('Coord')[0]
              .getAttribute('x'),
            y: colPoints[i].getElementsByTagName('Coord')[0].getAttribute('y')
          };

          let currentIdTooltip = colPoints[i].attributes[1].value;

          const tooltip = {
            title: titre[0].textContent,
            desc: description[0].textContent,
            image: angle,
            x: coord.x,
            y: coord.y,
            id: currentIdTooltip
          };

          currentIdTooltip++;
          for (let i = 0, len = tooltips.length; i < len; i++) {
            lookupAngle[tooltips[i].image] = tooltips[i];
          }
          tooltips.push(tooltip);
        }
        document
          .querySelector('#descImage')
          .addEventListener('paste', () => {
            setTimeout(() => {
              const body = document.querySelector('#descImage');
              const regex = /(&nbsp;|<([^>]+)>)/gi;
              body.innerHTML = body.innerHTML.replace(regex, '');
            }, 0);
          });

        return {
          id: currentIdTooltip,
          titre,
          description,
          details,
          lookupAngle
        };
      };

      this.loadLocalStorage = () => {
        if (typeof (Storage) !== 'undefined') {
          currentIdTooltip = 0;
          while (localStorage.getItem(`p${currentIdTooltip}`) && localStorage.getItem(`p${currentIdTooltip}`) != '') {
            let stringPi = localStorage.getItem(`p${currentIdTooltip}`);
            const parser = new DOMParser();
            const docPi = parser.parseFromString(stringPi, 'text/xml');
            const elmPi = docPi.getElementsByTagName('PointInteret')[0];

            //Ajoute le point dans le XML
            xml.getElementsByTagName('sequence')[0].appendChild(elmPi);
            currentIdTooltip++;
          }
        }
      };

      //Ecris un pin dans le xml
      this.writePin = (titre, desc, angle, coord, id) => {
        if (xml) {
          const elmPoint = xml.createElement('PointInteret');
          const elmTitre = xml.createElement('Titre');
          const elmDesc = xml.createElement('Description');
          const elmCoord = xml.createElement('Coord');
          const cdataDesc = xml.createCDATASection(desc);
          const cdataTitre = xml.createCDATASection(titre);

          elmPoint.setAttribute('Angle', angle);
          elmPoint.setAttribute('ID', id);
          elmCoord.setAttribute('x', coord.x);
          elmCoord.setAttribute('y', coord.y);

          elmTitre.appendChild(cdataTitre);
          elmDesc.appendChild(cdataDesc);

          elmPoint.appendChild(elmTitre);
          elmPoint.appendChild(elmDesc);
          elmPoint.appendChild(elmCoord);

          xml.getElementsByTagName('sequence')[0].appendChild(elmPoint);

          //Ecris / update le XML dans le localstorage
          if (typeof (Storage) !== 'undefined') {
            const parser = new XMLSerializer();
            const idPoint = elmPoint.getAttribute('ID');
            const stringPoint = parser.serializeToString(elmPoint);

            self.savePI(stringPoint, idPoint);
          }
        }
      };

      //Update un pin dans le xml
      this.updatePin = (id, champ, valeurDesc, valeurTitre, tooltip) => {
        const getPIByID = (colPI, id) => {
          for (let i = 0; i < colPI.length; i++) {
            if (colPI[i].getAttribute('ID') == id) {
              return i;
            }
          }
        };

        const colPI = xml.getElementsByTagName('PointInteret');
        const id2 = getPIByID(colPI, id);
        const currentTooltip = colPI[id2];
        const titreNode = currentTooltip.getElementsByTagName('Titre');
        const descNode = currentTooltip.getElementsByTagName('Description');

        if (champ == 'desc') {
          tooltip.desc = valeurDesc;
          // ICI comme le texte dans le html est generer a partir de l'objet tooltip, en changeant l'objet, on change aussi le texte dans le html
          //On change donc le texte deux fois, d'ou le reset du curseur
          currentTooltip.removeChild(descNode[0]);

          const newDesc = xml.createElement('Description');
          const cdataDesc = xml.createCDATASection(valeurDesc);

          newDesc.appendChild(cdataDesc);
          xml.getElementsByTagName('PointInteret')[id2].appendChild(newDesc);
        }

        if (champ == 'titre') {
          tooltip.title = valeurTitre;
          currentTooltip.removeChild(titreNode[0]);

          const newTitre = xml.createElement('Titre');
          const cdataTitre = xml.createCDATASection(valeurTitre);

          newTitre.appendChild(cdataTitre);
          xml.getElementsByTagName('PointInteret')[id2].appendChild(newTitre);
        }
      };

      //Supprime un pin dans le xml
      this.deletePin = (tooltip) => {
        const deleteToast = () => {
          const pinTo = 'top right';

          $mdToast.show(
            $mdToast
              .simple()
              .textContent('Point d\'interet supprimé !')
              .position(pinTo)
              .hideDelay(3000)
          );
        };

        const points = xml.getElementsByTagName('PointInteret');
        for (let i = 0; i < points.length; i++) {
          if (
            points[i].getAttribute('Angle') == tooltip.image &&
            points[i].getElementsByTagName('Titre')[0].textContent ==
            tooltip.title
          ) {
            const coord = points[i].getElementsByTagName('Coord')[0];

            if (
              coord.getAttribute('x') == tooltip.x &&
              coord.getAttribute('y') == tooltip.y
            ) {
              points[i].parentNode.removeChild(points[i]);
              deleteToast();
            }
          }
        }

        //Supprime le point d'interet dans le local storage
        if (typeof (Storage) !== 'undefined') {
          localStorage.removeItem(`p${tooltip.id}`);
        }

        currentIdTooltip--;
        $rootScope.$emit('tooltipChanged');
      };

      //Telecharge un zip contenant un readme, et le fichier XML
      this.exportXML = () => {
        const oldProperties = xml.getElementsByTagName('properties')[0];
        xml.getElementsByTagName('sequence')[0].removeChild(oldProperties);

        const properties = xml.createElement('properties');
        const propTitre = xml.createElement('property');
        const propDesc = propTitre.cloneNode(true);

        propTitre.setAttribute('name', 'titre');
        propDesc.setAttribute('name', 'description');

        const htmldataTitre = document.querySelector('#titreImage').innerHTML;
        const htmldataDesc = document.querySelector('#descImage').innerHTML;

        const cdataTitre = xml.createCDATASection(htmldataTitre);
        const cdataDesc = xml.createCDATASection(htmldataDesc);

        propTitre.appendChild(cdataTitre);
        propDesc.appendChild(cdataDesc);

        properties.appendChild(propTitre);
        properties.appendChild(propDesc);
        xml.getElementsByTagName('sequence')[0].appendChild(properties);

        const content = new XMLSerializer().serializeToString(xml);
        if (content) {
          const zip = new JSZip();
          zip.file('content.xml', content);
          const instruction = 'Pour réutiliser vos point d\'interets, remplacez le fichier content.xml du dossier "amonite" par le fichier generé';
          zip.file('README.txt', instruction);

          zip.generateAsync({
            type: 'blob'
          })
            .then((blob) => {
              saveAs(blob, 'o360export.zip');
            });
        }
      };

      this.savePI = (el, id) => {
        if (typeof (Storage) !== 'undefined') {
          localStorage.setItem(`p${id}`, el);
          console.log('Stocké !');
        }
      };

      this.clearStorage = () => {
        if (typeof (Storage) !== 'undefined') {
          localStorage.clear();
        }
        //Supprime les points d'interet du XML
        const axp = xml.getElementsByTagName('PointInteret');
        while (axp.length > 0) {
          axp[0].parentNode.removeChild(axp[0]);
        }

        //Supprime les tooltip
        tooltips = [];
        currentIdTooltip = 0;
        $rootScope.$emit('tooltipChanged');
      };
    }
  ]);
}());
