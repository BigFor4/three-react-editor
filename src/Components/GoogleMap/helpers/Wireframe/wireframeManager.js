export function Wireframe(ROOF) {
  var FACES = ROOF['FACES'].FACE
  var LINES = ROOF['LINES'].LINE
  var POINTS = ROOF['POINTS'].POINT
  var DOWNSPOUTS = ROOF['DOWNSPOUTS']?.DOWNSPOUT
  this.PointCollections = {};
  this.LineCollections = {};
  this.FaceCollections = {};
  this.DownspoutCollections = {};
  POINTS?.map(x => {
    if (Object.keys(x).length > 0) {
      const point = new Point(x)
      const id = point.PointId
      this.PointCollections[id] = point
    }
  })
  if (DOWNSPOUTS) {
    [DOWNSPOUTS].flat().map(x => {
      if (Object.keys(x).length > 0) {
        const downspout = new Downspout(x);
        const id = downspout.DownspoutId;
        this.DownspoutCollections[id] = downspout;
      }
    });
  }
  LINES?.map(x => {
    if (Object.keys(x).length > 0) {
      const line = new Line(x, this.PointCollections, this.DownspoutCollections)
      const id = line.LineId
      this.LineCollections[id] = line
    }
  })
  if (FACES && FACES.map) {
    FACES.map(x => {
      if (Object.keys(x).length > 0) {
        const face = new Face(x, this.LineCollections)
        const id = face.FaceId
        this.FaceCollections[id] = face
      }
    })
  }
  else {
    const face = new Face(FACES, this.LineCollections)
    const id = face.FaceId
    this.FaceCollections[id] = face
  }
  return this
}
function Polygon(obj, LineCollections) {
  const attrs = obj['_attributes']
  const pathIndexs = attrs.path?.split(',').map(x => x.trim());
  this.PolygonId = attrs.id
  this.Positions = []
  this.Lines = []
  pathIndexs.map((x, index) => {
    if (LineCollections[x]) {
      this.Lines.push({
        points: [LineCollections[x].Points[0], LineCollections[x].Points[1]],
        data: LineCollections[x]
      })

      // only need first point to make close polygon
      this.Positions.push(LineCollections[x].Points[0])
    }
    else {
      throw 'missing index' + x
    }
  })
}

function Face(obj, LineCollections) {
  let attrs = obj['_attributes']
  let POLYGON = obj['POLYGON']
  this.FaceId = attrs.id
  this.Type = attrs.type
  if (POLYGON) {
    this.Polygon = new Polygon(POLYGON, LineCollections)
  }
  return this;
}
function Line(obj, PointCollections, DownspoutCollections) {
  const attrs = obj['_attributes']
  this.LineId = attrs.id
  const paths = attrs.path;
  const downspouts = attrs?.downspouts;
  this.Type = attrs.type
  this.TypeGutter = attrs.typeGutter
  this.PointIndexs = paths?.split(",").map(x => x.trim())
  this.Points = []
  this.PointIndexs.map(x => {
    if (PointCollections[x]) {
      this.Points.push(PointCollections[x])
    }
    else {
      throw 'missing index' + x
    }
  })
  //Downspouts
  if (downspouts && downspouts?.map) {
    this.DownspoutIndexs = downspouts?.split(",").map(x => x.trim());
    this.Downspouts = [];
    this.DownspoutIndexs.map(x => {
      if (DownspoutCollections[x]) {
        this.Downspouts.push(DownspoutCollections[x])
      }
      else {
        throw 'missing downspouts index' + x
      }
    })
  }
  return this
}
function Point(obj) {
  const attrs = obj['_attributes']
  const point = attrs.data?.split(",").map(x => x.trim())
  if (point.length === 3) {
    this.PointId = attrs.id
    this.lng = Number(point[0])
    this.lat = Number(point[1])
    this.height = Number(point[2])
    this.type = attrs.type;
    if (isNaN(this.lat * this.lng * this.height)) {
      throw 'invalid point ' + attrs.data
    }
  }
  if (point.length == 2) {
    this.PointId = attrs.id
    this.lng = Number(point[1])
    this.lat = Number(point[0])
    this.type = attrs.type;
    if (isNaN(this.lat * this.lng)) {
      throw 'invalid point ' + attrs.data
    }
  }
  return this;
}
function Downspout(obj) {
  const attrs = obj['_attributes'];
  const pointA = attrs.pointA?.split(",").map(x => x.trim());
  const pointB = attrs.pointB?.split(",").map(x => x.trim());
  if (pointA.length === 3) {
    this.pointA = {
      lat: Number(pointA[0]),
      lng: Number(pointA[1]),
      height: Number(pointA[2]),
    };
    if (isNaN(this.pointA.lat * this.pointA.lng * this.pointA.height)) {
      throw 'invalid point ' + attrs.data
    }
  };
  if (pointB.length === 3) {
    this.pointB = {
      lat: Number(pointB[0]),
      lng: Number(pointB[1]),
      height: Number(pointB[2]),
    };
    if (isNaN(this.pointB.lat * this.pointB.lng * this.pointB.height)) {
      throw 'invalid point ' + attrs.data
    }
  };
  this.DownspoutId = attrs.id;
  this.LineId = attrs.lineId;
  return this;
}