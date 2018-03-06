/* global ob, window, ActiveXObject */
"use strict";
(function () {
  ob.service("storageService", [
    "Images",
    "$mdToast",
    function (Images, $mdToast) {
      let xml = null;
      const self = this;

      this.getXml = () => {
        return xml;
      };

      this.setXml = (xmlDoc) => {
        xml = xmlDoc;
      };

      //Retourne titre, desc, et details du xml chargé si ils existent
      this.loadXml = (id, tooltips, angle, lookupAngle, dataXML) => {
        let titre, desc, details;

        if (window.DOMParser) {
          // Standard
          const tmp = new DOMParser();
          self.setXml(tmp.parseFromString(dataXML.data, "text/xml"));
        } else {
          // IE
          self.setXml(new ActiveXObject("Microsoft.XMLDOM"));
          xml.async = "false";
          xml.loadXML(dataXML);
        }
        if (xml) {
          //Si il existe les proprietes dans content.xml, on les prends
          if (xml.getElementsByTagName("property").length > 0) {
            const colProperties = xml.getElementsByTagName("property");

            for (let i = 0; i < colProperties.length; i++) {
              if (colProperties[i].getAttribute("name") === "titre") {
                titre = colProperties[i].textContent;
              }
              if (colProperties[i].getAttribute("name") === "description") {
                desc = colProperties[i].textContent;
              }
            }
          } else {
            //Si elles n"existe pas, on essaye de les prendre dans content2.xml
            Images.loadDetails().then((dataXML) => {
              if (window.DOMParser) {
                // Standard
                const tmp = new DOMParser();
                details = tmp.parseFromString(dataXML.data, "text/xml");
              } else {
                // IE
                details = new ActiveXObject("Microsoft.XMLDOM");
                details.async = "false";
                details.loadXML(dataXML);
              }
              const colProperties = details.getElementsByTagName("property");
              for (let i = 0; i < colProperties.length; i++) {
                if (
                  colProperties[i].getAttribute("name") === "titre" &&
                  !titre
                ) {
                  titre = colProperties[i].textContent;
                }

                if (
                  colProperties[i].getAttribute("name") === "description" &&
                  !desc
                ) {
                  desc = colProperties[i].textContent;
                }
              }
            });
          }
          self.setXml(xml);
        }

        const colPoints = xml.getElementsByTagName("PointInteret");

        for (let i = 0; i < colPoints.length; i++) {
          const titre = colPoints[i].getElementsByTagName("Titre"),
            description = colPoints[i].getElementsByTagName("Description"),
            angle = colPoints[i].attributes[0].value,
            coord = {
              x: colPoints[i]
                .getElementsByTagName("Coord")[0]
                .getAttribute("x"),
              y: colPoints[i].getElementsByTagName("Coord")[0].getAttribute("y")
            };

          let id = colPoints[i].attributes[1].value;

          const tooltip = {
            title: titre[0].textContent,
            desc: description[0].textContent,
            image: angle,
            x: coord.x,
            y: coord.y,
            id
          };

          id++;
          for (let i = 0, len = tooltips.length; i < len; i++) {
            lookupAngle[tooltips[i].image] = tooltips[i];
          }
          tooltips.push(tooltip);
        }
        document
          .querySelector("#descImage")
          .addEventListener("paste", (e) => {
            setTimeout(() => {
              const body = document.querySelector("#descImage");
              const regex = /(&nbsp;|<([^>]+)>)/gi;
              body.innerHTML = body.innerHTML.replace(regex, "");
            }, 0);
          });

        return {
          id,
          titre,
          description,
          details
        };
      };

      //Ecris un pin dans le xml
      this.writePin = (titre, desc, angle, coord, id) => {
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

      //Update un pin dans le xml
      this.updatePin = (id, champ, valeurDesc, valeurTitre, tooltip) => {
        const getPIByID = (colPI, id) => {
          for (let i = 0; i < colPI.length; i++) {
            if (colPI[i].getAttribute("ID") == id) {
              return i;
            }
          }
        };

        const colPI = xml.getElementsByTagName("PointInteret"),
          id2 = getPIByID(colPI, id),
          currentTooltip = colPI[id2],
          titreNode = currentTooltip.getElementsByTagName("Titre"),
          descNode = currentTooltip.getElementsByTagName("Description");

        if (champ == "desc") {
          tooltip.desc = valeurDesc;
          // ICI comme le texte dans le html est generer a partir de l"objet tooltip, en changeant l"objet, on change aussi le texte dans le html
          //On change donc le texte deux fois, d"ou le reset du curseur
          currentTooltip.removeChild(descNode[0]);
          const newDesc = xml.createElement("Description"),
            cdataDesc = xml.createCDATASection(valeurDesc);

          newDesc.appendChild(cdataDesc);
          xml.getElementsByTagName("PointInteret")[id2].appendChild(newDesc);
        }

        if (champ == "titre") {
          tooltip.title = valeurTitre;
          currentTooltip.removeChild(titreNode[0]);
          const newTitre = xml.createElement("Titre"),
            cdataTitre = xml.createCDATASection(valeurTitre);

          newTitre.appendChild(cdataTitre);
          xml.getElementsByTagName("PointInteret")[id2].appendChild(newTitre);
        }
      };

      //Supprime un pin dans le xml
      this.deletePin = (tooltip) => {
        const deleteToast = () => {
          const pinTo = "top right";

          $mdToast.show(
            $mdToast
            .simple()
            .textContent("Point d\'interet supprimé !")
            .position(pinTo)
            .hideDelay(3000)
          );
        }

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

      //Ouvre une fenetre avec un dump du XML
      // ATTENTION marche pas sur chrome
      this.exportXML = () => {
        const detectIE = () => {
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
        }
        const oldProperties = xml.getElementsByTagName("properties")[0];
        xml.getElementsByTagName("sequence")[0].removeChild(oldProperties);

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
        xml.getElementsByTagName("sequence")[0].appendChild(properties);

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

    }
  ]);
}());