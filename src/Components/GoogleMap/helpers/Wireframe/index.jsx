import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { xml2js } from 'xml-js';
import colorLineAndGuter from './listColorLineClassificationAndGutter.json';
import { Wireframe } from './wireframeManager';
const titles = [
  {
    title: 'ID',
  },
  {
    title: 'Area',
  },
  {
    title: 'Area(ft)',
  },
  {
    title: 'Perimeter',
  },
  {
    title: 'Perimeter(ft)',
  },
];
const getRandomColor = () => {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const parseData = async (responseData, map, maps) => {
  const parsedData = [];
  const polygons = []
  const bounds = []
  let layerMap = [];
  if (responseData.json && responseData.xml) {
    try {
      const response = await axios.get(responseData.json);
      const responseXml = await axios.get(responseData.xml);

      const { data } = response;
      const xmlString = responseXml.data;
      const xmlData = xml2js(xmlString, { compact: true });
      const ROOF = xmlData['STRUCTURES']['ROOF'];
      const wireFrameStructure = new Wireframe(ROOF);
      data.forEach(item => {
        const rowId = item.id;
        let face = undefined;

        face = wireFrameStructure.FaceCollections[`F${rowId}`];

        if (face) {

          const positions = face.Polygon.Positions.map(x => ({ lat: x.lat, lng: x.lng }))
          const lines = face.Polygon.Lines.map(line => {
            return {
              lineId: line.data?.LineId,
              color: colorLineAndGuter?.[line?.data?.Type] || colorLineAndGuter.default3D,
              positions: line.points.map(point => ({ lat: point.lat, lng: point.lng }))
            }
          })
          lines.forEach(line => {
            const flightPath = new maps.Polyline({
              path: line.positions,
              lineId: line.lineId,
              geodesic: true,
              strokeColor: line.color,
              strokeOpacity: 1.0,
              strokeWeight: 3,
            });
            layerMap.push(flightPath);
            // maps.event.addListener(flightPath, 'click', function (event) {
            //   console.log("click polygon: " + line.lineId)
            //   var randomColor = getRandomColor();
            //   flightPath.setOptions({
            //     strokeColor: randomColor,
            //   });
            // });
            flightPath.setMap(map);
          });
          const polygon = new maps.Polygon({
            paths: positions,
            polygonId: `F${rowId}`,
            strokeColor: '#1BC3D0',
            strokeOpacity: 0,
            strokeWeight: 3,
            fillColor: '#1BC3D0',
            fillOpacity: 0.35,
          });
          layerMap.push(polygon);
          // maps.event.addListener(polygon, 'click', function (event) {
          //   var randomColor = getRandomColor();
          //   console.log("click polygon: " + `F${rowId}`)
          //   polygon.setOptions({
          //     fillColor: randomColor,
          //   });
          // });
          polygons.push(polygon)
          polygon.setMap(map);

          parsedData.push({
            id: Number(item.id) + 1,
            area: parseFloat(item.area).toFixed(2),
            areaFt: parseFloat(item.area_in_feet).toFixed(2),
            perimeter: parseFloat(item.perimeter).toFixed(2),
            perimeterFt: parseFloat(item.perimeter_in_feet).toFixed(2),
            // polygon: polygon
          });

          positions.forEach((el) => {
            const bound = new maps.LatLngBounds()
            const myLatLng = new maps.LatLng(el)
            bound.extend(myLatLng)
            bounds.push(bound)
          })
        }
      });
    } catch (error) { }
  }
  return {
    parsedData,
    polygons,
    layerMap
  };
};
const WireframeInfo = ({ data, map, maps }) => {
  const [allLayerMap, setAllLayerMap] = useState([]);
  const [tableData, setTableData] = useState(null);
  useEffect(() => {
    const initialWireframe = async () => {
      if (data?.xml && data?.json) {
        allLayerMap.forEach(layer => {
          layer.setMap(null);
        })
        const wireframe = await parseData(data, map, maps)
        setTableData(wireframe.parsedData);
        setAllLayerMap(wireframe.layerMap)
      }
    }
    initialWireframe()
  }, [data, maps, map]);

  useEffect(() => {
    if (allLayerMap.length > 0) {
      allLayerMap.forEach((layer) => {
        layer.addListener('click', function (event) {
          let lat = event.latLng.lat();
          let lng = event.latLng.lng();
          const clickedLatLng = new maps.LatLng(lat, lng);
          const bounds = new maps.LatLngBounds(
            new maps.LatLng(lat - 0.01, lng - 0.01),
            new maps.LatLng(lat + 0.01, lng + 0.01)
          );
          const nearbyShapes = [];
          allLayerMap.map(item => {
            if (item.lineId) {
              if (maps.geometry.poly.containsLocation(clickedLatLng, item, bounds)) {
                nearbyShapes.push(item.lineId);
              }
            }
          })
          console.log(nearbyShapes)
        });
      });

    }
  }, [allLayerMap])

  const handleHightLight = (polygon) => {
    if (polygon) {
      polygon.setOptions({
        fillOpacity: 0.7
      })
    }
  }

  const handleRemoveHightLight = (polygon) => {
    if (polygon) {
      polygon.setOptions({
        fillOpacity: 0.35
      })
    }
  }

  const zoomToWireframe = (polygon) => {
    maps.Polygon.prototype.getBounds = function () {
      var bounds = new maps.LatLngBounds();
      var paths = this.getPaths();
      var path;
      for (var i = 0; i < paths.getLength(); i++) {
        path = paths.getAt(i);
        for (var ii = 0; ii < path.getLength(); ii++) {
          bounds.extend(path.getAt(ii));
        }
      }
      return bounds;
    }
    map.fitBounds(polygon.getBounds());
  }

  return (
    <div className="overlay-modal overlay-modal-500px google-map-modal scroll-wrapper" onScroll={() => { }}>
      <div className="overlay-modal-header">
        <span>Info</span>
        <div className="btn-group">
          <div className="info-close"></div>
        </div>
      </div>
      <table className="table-info-wireframe google-map-table">
        <thead>
          <tr>
            {titles.map(el => (
              <th key={el.title}>{el.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData &&
            tableData.map((el, index) => {
              return (
                <tr
                  id={`F${index}`}
                  key={`F${index}`}
                  onClick={() => zoomToWireframe(el.polygon)}
                  onMouseOver={() => handleHightLight(el.polygon)}
                  onMouseLeave={() => handleRemoveHightLight(el.polygon)}
                >
                  <td>{el.id}</td>
                  <td>{el.area}</td>
                  <td>{el.areaFt}</td>
                  <td>{el.perimeter}</td>
                  <td>{el.perimeterFt}</td>
                  <td>{el.pitch}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default WireframeInfo;
