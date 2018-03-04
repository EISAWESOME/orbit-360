'use strict';
ob.service('storageService', [ '$mdToast',
    function ($mdToast) {

        let xml = null;
        const self = this;

        this.setXml = function (xmlDoc) {
            xml = xmlDoc;
        };

        this.writePin = function (titre, desc, angle, coord, id) {
            if (xml) {

                const elmPoint = xml.createElement("PointInteret"),
                    elmTitre = xml.createElement("Titre"),
                    elmDesc = xml.createElement("Description"),
                    elmCoord = xml.createElement("Coord"),
                    cdataDesc = xml.createCDATASection(desc),
                    cdataTitre = xml.createCDATASection(titre);

                elmPoint.setAttribute("Angle", angle);
                elmPoint.setAttribute("ID", id);
                elmCoord.setAttribute("x", coord.x);
                elmCoord.setAttribute("y", coord.y);

                elmTitre.appendChild(cdataTitre);
                elmDesc.appendChild(cdataDesc);

                elmPoint.appendChild(elmTitre);
                elmPoint.appendChild(elmDesc);
                elmPoint.appendChild(elmCoord);

                xml.getElementsByTagName("sequence")[0].appendChild(elmPoint);

            }
        };

        this.exportXML = function(){

            function detectIE() {
                const ua = window.navigator.userAgent;
      
                const msie = ua.indexOf("MSIE ");
                if (msie > 0) {
                  // IE 10 or older => return version number
                  return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)), 10);
                }
      
                const trident = ua.indexOf("Trident/");
                if (trident > 0) {
                  // IE 11 => return version number
                  const rv = ua.indexOf("rv:");
                  return parseInt(ua.substring(rv + 3, ua.indexOf(".", rv)), 10);
                }
      
                const edge = ua.indexOf("Edge/");
                if (edge > 0) {
                  // Edge (IE 12+) => return version number
                  return parseInt(ua.substring(edge + 5, ua.indexOf(".", edge)), 10);
                }
      
                // other browser
                return false;
              };
            const oldProperties = xml.getElementsByTagName(
                "properties"
              )[0];
              xml
                .getElementsByTagName("sequence")[0]
                .removeChild(oldProperties);
    
              const properties = xml.createElement("properties"),
                propTitre = xml.createElement("property"),
                propDesc = propTitre.cloneNode(true);
    
              propTitre.setAttribute("name", "titre");
              propDesc.setAttribute("name", "description");
              const htmldataTitre = document.querySelector("#titreImage").innerHTML,
                htmldataDesc = document.querySelector("#descImage").innerHTML;
    
              const cdataTitre = xml.createCDATASection(htmldataTitre),
                cdataDesc = xml.createCDATASection(htmldataDesc);
    
              propTitre.appendChild(cdataTitre);
              propDesc.appendChild(cdataDesc);
    
              properties.appendChild(propTitre);
              properties.appendChild(propDesc);
              xml
                .getElementsByTagName("sequence")[0]
                .appendChild(properties);
    
              const content = new XMLSerializer().serializeToString(xml);
              if (content) {
                if (detectIE()) {
                  const popup = window.open();
                  //On wrap le content dans un textarea pour que les markups soient conservés
                  popup.document.write(
                    "<textarea style='width: 100%; height: 100%; border:none;'>" +
                    content +
                    "</textarea>"
                  );
                } else {
                  window.open(
                    "data:text/xml," + encodeURIComponent(content),
                    "Test",
                    "width=900,height=900,scrollbars=1,resizable=1"
                  );
                }
              }
        };

        this.deletePin = function(tooltip){

            function deleteToast() {
                const pinTo = "top right";
      
                $mdToast.show(
                  $mdToast
                  .simple()
                  .textContent("Point d'interet supprimé !")
                  .position(pinTo)
                  .hideDelay(3000)
                );
              };


            const points = xml.getElementsByTagName("PointInteret");
            for (let i = 0; i < points.length; i++) {
              if (
                points[i].getAttribute("Angle") == tooltip.image &&
                points[i].getElementsByTagName("Titre")[0].textContent ==
                tooltip.title
              ) {
                const coord = points[i].getElementsByTagName("Coord")[0];
  
                if (
                  coord.getAttribute("x") == tooltip.x &&
                  coord.getAttribute("y") == tooltip.y
                ) {
                  points[i].parentNode.removeChild(points[i]);
                  deleteToast();
                }
              }
            }
        };
    }
])