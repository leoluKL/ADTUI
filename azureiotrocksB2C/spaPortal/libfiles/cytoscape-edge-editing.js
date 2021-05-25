(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["cytoscapeEdgeEditing"] = factory();
	else
		root["cytoscapeEdgeEditing"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 964:
/***/ ((module) => {



var anchorPointUtilities = {
  currentCtxEdge: undefined,
  currentCtxPos: undefined,
  currentAnchorIndex: undefined,
  currentEdgesForFixAnchorPositions: undefined,
  ignoredClasses: undefined,
  setIgnoredClasses: function setIgnoredClasses(_ignoredClasses) {
    this.ignoredClasses = _ignoredClasses;
  },
  syntax: {
    bend: {
      edge: "segments",
      class: "edgebendediting-hasbendpoints",
      multiClass: "edgebendediting-hasmultiplebendpoints",
      weight: "cyedgebendeditingWeights",
      distance: "cyedgebendeditingDistances",
      weightCss: "segment-weights",
      distanceCss: "segment-distances",
      pointPos: "bendPointPositions",
      bendAnchorsAbsolutePosition: "bendAnchorsAbsolutePosition"
    },
    control: {
      edge: "unbundled-bezier",
      class: "edgecontrolediting-hascontrolpoints",
      multiClass: "edgecontrolediting-hasmultiplecontrolpoints",
      weight: "cyedgecontroleditingWeights",
      distance: "cyedgecontroleditingDistances",
      weightCss: "control-point-weights",
      distanceCss: "control-point-distances",
      pointPos: "controlPointPositions"
    }
  },
  // gets edge type as 'bend' or 'control'
  // the interchanging if-s are necessary to set the priority of the tags
  // example: an edge with type segment and a class 'hascontrolpoints' will be classified as unbundled bezier
  getEdgeType: function getEdgeType(edge) {
    if (!edge) return 'inconclusive';else if (edge.hasClass(this.syntax['bend']['class'])) return 'bend';else if (edge.hasClass(this.syntax['control']['class'])) return 'control';else if (edge.css('curve-style') === this.syntax['bend']['edge']) return 'bend';else if (edge.css('curve-style') === this.syntax['control']['edge']) return 'control';else if (edge.data(this.syntax['bend']['pointPos']) && edge.data(this.syntax['bend']['pointPos']).length > 0) return 'bend';else if (edge.data(this.syntax['control']['pointPos']) && edge.data(this.syntax['control']['pointPos']).length > 0) return 'control';
    return 'inconclusive';
  },
  // initilize anchor points based on bendPositionsFcn and controlPositionFcn
  initAnchorPoints: function initAnchorPoints(bendPositionsFcn, controlPositionsFcn, edges) {
    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      var type = this.getEdgeType(edge);

      if (type === 'inconclusive') {
        continue;
      }

      if (!this.isIgnoredEdge(edge)) {

        var anchorPositions;

        // get the anchor positions by applying the functions for this edge
        if (type === 'bend') anchorPositions = bendPositionsFcn.apply(this, edge);else if (type === 'control') anchorPositions = controlPositionsFcn.apply(this, edge);

        // calculate relative anchor positions
        var result = this.convertToRelativePositions(edge, anchorPositions);

        // if there are anchors set weights and distances accordingly and add class to enable style changes
        if (result.distances.length > 0) {
          edge.data(this.syntax[type]['weight'], result.weights);
          edge.data(this.syntax[type]['distance'], result.distances);
          edge.addClass(this.syntax[type]['class']);
          if (result.distances.length > 1) {
            edge.addClass(this.syntax[type]['multiClass']);
          }
        }
      }
    }
  },

  isIgnoredEdge: function isIgnoredEdge(edge) {

    var startX = edge.source().position('x');
    var startY = edge.source().position('y');
    var endX = edge.target().position('x');
    var endY = edge.target().position('y');

    if (startX == endX && startY == endY || edge.source().id() == edge.target().id()) {
      return true;
    }
    for (var i = 0; this.ignoredClasses && i < this.ignoredClasses.length; i++) {
      if (edge.hasClass(this.ignoredClasses[i])) return true;
    }
    return false;
  },
  //Get the direction of the line from source point to the target point
  getLineDirection: function getLineDirection(srcPoint, tgtPoint) {
    var srcY = srcPoint.y;
    var srcX = srcPoint.x;
    var tgtY = tgtPoint.y;
    var tgtX = tgtPoint.x;

    var compareEqual = function compareEqual(v1, v2) {
      if (Math.abs(v1 - v2) < 0.0001) return true;else return false;
    };

    if (compareEqual(srcPoint.y, tgtPoint.y) && srcPoint.x < tgtPoint.x) {
      return 1;
    }
    if (srcPoint.y < tgtPoint.y && srcPoint.x < tgtPoint.x) {
      return 2;
    }
    if (srcPoint.y < tgtPoint.y && compareEqual(srcPoint.x, tgtPoint.x)) {
      return 3;
    }
    if (srcPoint.y < tgtPoint.y && srcPoint.x > tgtPoint.x) {
      return 4;
    }
    if (compareEqual(srcPoint.y, tgtPoint.y) && srcPoint.x > tgtPoint.x) {
      return 5;
    }
    if (srcPoint.y > tgtPoint.y && srcPoint.x > tgtPoint.x) {
      return 6;
    }
    if (srcPoint.y > tgtPoint.y && compareEqual(srcPoint.x, tgtPoint.x)) {
      return 7;
    }
    return 8; //if srcPoint.y > tgtPoint.y and srcPoint.x < tgtPoint.x
  },
  getSrcTgtPointsAndTangents: function getSrcTgtPointsAndTangents(edge) {
    var sourceNode = edge.source();
    var targetNode = edge.target();

    var tgtPosition = targetNode.position();
    var srcPosition = sourceNode.position();

    var srcPoint = sourceNode.position();
    var tgtPoint = targetNode.position();

    var m1 = (tgtPoint.y - srcPoint.y) / (tgtPoint.x - srcPoint.x);
    var m2 = -1 / m1;

    return {
      m1: m1,
      m2: m2,
      srcPoint: srcPoint,
      tgtPoint: tgtPoint
    };
  },
  getIntersection: function getIntersection(edge, point, srcTgtPointsAndTangents) {
    if (srcTgtPointsAndTangents === undefined) {
      srcTgtPointsAndTangents = this.getSrcTgtPointsAndTangents(edge);
    }

    var srcPoint = srcTgtPointsAndTangents.srcPoint;
    var tgtPoint = srcTgtPointsAndTangents.tgtPoint;
    var m1 = srcTgtPointsAndTangents.m1;
    var m2 = srcTgtPointsAndTangents.m2;

    var intersectX;
    var intersectY;

    if (m1 == Infinity || m1 == -Infinity) {
      intersectX = srcPoint.x;
      intersectY = point.y;
    } else if (Math.abs(m1) < 0.0000001) {
      intersectX = point.x;
      intersectY = srcPoint.y;
    } else {
      var a1 = srcPoint.y - m1 * srcPoint.x;
      var a2 = point.y - m2 * point.x;

      intersectX = (a2 - a1) / (m1 - m2);
      intersectY = m1 * intersectX + a1;
    }

    //Intersection point is the intersection of the lines passing through the nodes and
    //passing through the bend or control point and perpendicular to the other line
    var intersectionPoint = {
      x: intersectX,
      y: intersectY
    };

    return intersectionPoint;
  },
  getAnchorsAsArray: function getAnchorsAsArray(edge) {
    var type = this.getEdgeType(edge);

    if (type === 'inconclusive') {
      return undefined;
    }

    if (edge.css('curve-style') !== this.syntax[type]['edge']) {
      return undefined;
    }

    var anchorList = [];

    var weights = edge.pstyle(this.syntax[type]['weightCss']) ? edge.pstyle(this.syntax[type]['weightCss']).pfValue : [];
    var distances = edge.pstyle(this.syntax[type]['distanceCss']) ? edge.pstyle(this.syntax[type]['distanceCss']).pfValue : [];
    var minLengths = Math.min(weights.length, distances.length);

    for (var s = 0; s < minLengths; s++) {
      var anAnchorPosition = this.convertToAnchorAbsolutePositions(edge, type, s);
      anchorList.push(anAnchorPosition.x, anAnchorPosition.y);
    }

    return anchorList;
  },
  resetAnchorsAbsolutePosition: function resetAnchorsAbsolutePosition() {
    this.currentEdgesForFixAnchorPositions = undefined;
  },
  storeAnchorsAbsolutePosition: function storeAnchorsAbsolutePosition(draggingNodes) {
    var _this = this;

    //find all edge to those dragging nodes
    var impactEdges = draggingNodes.connectedEdges();
    var excludeEdges = draggingNodes.edgesWith(draggingNodes);
    //exclude those edges whose source and target was in draggingnodes
    impactEdges = impactEdges.unmerge(excludeEdges);

    impactEdges.forEach(function (oneEdge) {
      var arr = _this.getAnchorsAsArray(oneEdge);
      if (arr === undefined) return;
      var positionsArr = [];
      for (var i = 0; i < arr.length; i += 2) {
        positionsArr.push({ x: arr[i], y: arr[i + 1] });
      }
      oneEdge.data(_this.syntax['bend']['bendAnchorsAbsolutePosition'], positionsArr);
    });
    this.currentEdgesForFixAnchorPositions = impactEdges;
  },
  keepAnchorsAbsolutePositionDuringMoving: function keepAnchorsAbsolutePositionDuringMoving() {
    var _this2 = this;

    if (this.currentEdgesForFixAnchorPositions === undefined) return;
    this.currentEdgesForFixAnchorPositions.forEach(function (oneEdge) {
      var storedPosition = oneEdge.data(_this2.syntax['bend']['bendAnchorsAbsolutePosition']);
      var result = _this2.convertToRelativePositions(oneEdge, storedPosition);
      if (result.distances < 0) {
        var result = _this2.convertToRelativePositions(oneEdge, storedPosition);
      }
      if (result.distances.length > 0) {
        oneEdge.data(_this2.syntax['bend']['weight'], result.weights);
        oneEdge.data(_this2.syntax['bend']['distance'], result.distances);
      }
    });
  },
  convertToAnchorAbsolutePositions: function convertToAnchorAbsolutePositions(edge, type, anchorIndex) {
    var srcPos = edge.source().position();
    var tgtPos = edge.target().position();
    var weights = edge.data(this.syntax[type]['weight']);
    var distances = edge.data(this.syntax[type]['distance']);
    var w = weights[anchorIndex];
    var d = distances[anchorIndex];
    var dy = tgtPos.y - srcPos.y;
    var dx = tgtPos.x - srcPos.x;
    var l = Math.sqrt(dx * dx + dy * dy);
    var vector = {
      x: dx,
      y: dy
    };
    var vectorNorm = {
      x: vector.x / l,
      y: vector.y / l
    };
    var vectorNormInverse = {
      x: -vectorNorm.y,
      y: vectorNorm.x
    };

    var w1 = 1 - w;
    var w2 = w;
    var midX = srcPos.x * w1 + tgtPos.x * w2;
    var midY = srcPos.y * w1 + tgtPos.y * w2;
    var absoluteX = midX + vectorNormInverse.x * d;
    var absoluteY = midY + vectorNormInverse.y * d;

    return { x: absoluteX, y: absoluteY };
  },
  obtainPrevAnchorAbsolutePositions: function obtainPrevAnchorAbsolutePositions(edge, type, anchorIndex) {
    if (anchorIndex <= 0) {
      return edge.source().position();
    } else {
      return this.convertToAnchorAbsolutePositions(edge, type, anchorIndex - 1);
    }
  },
  obtainNextAnchorAbsolutePositions: function obtainNextAnchorAbsolutePositions(edge, type, anchorIndex) {
    var weights = edge.data(this.syntax[type]['weight']);
    var distances = edge.data(this.syntax[type]['distance']);
    var minLengths = Math.min(weights.length, distances.length);
    if (anchorIndex >= minLengths - 1) {
      return edge.target().position();
    } else {
      return this.convertToAnchorAbsolutePositions(edge, type, anchorIndex + 1);
    }
  },
  convertToRelativePosition: function convertToRelativePosition(edge, point, srcTgtPointsAndTangents) {
    if (srcTgtPointsAndTangents === undefined) {
      srcTgtPointsAndTangents = this.getSrcTgtPointsAndTangents(edge);
    }

    var intersectionPoint = this.getIntersection(edge, point, srcTgtPointsAndTangents);
    var intersectX = intersectionPoint.x;
    var intersectY = intersectionPoint.y;

    var srcPoint = srcTgtPointsAndTangents.srcPoint;
    var tgtPoint = srcTgtPointsAndTangents.tgtPoint;

    var weight;

    if (intersectX != srcPoint.x) {
      weight = (intersectX - srcPoint.x) / (tgtPoint.x - srcPoint.x);
    } else if (intersectY != srcPoint.y) {
      weight = (intersectY - srcPoint.y) / (tgtPoint.y - srcPoint.y);
    } else {
      weight = 0;
    }

    var distance = Math.sqrt(Math.pow(intersectY - point.y, 2) + Math.pow(intersectX - point.x, 2));

    //Get the direction of the line form source point to target point
    var direction1 = this.getLineDirection(srcPoint, tgtPoint);
    //Get the direction of the line from intesection point to the point
    var direction2 = this.getLineDirection(intersectionPoint, point);

    //If the difference is not -2 and not 6 then the direction of the distance is negative
    if (direction1 - direction2 != -2 && direction1 - direction2 != 6) {
      if (distance != 0) distance = -1 * distance;
    }

    return {
      weight: weight,
      distance: distance
    };
  },
  convertToRelativePositions: function convertToRelativePositions(edge, anchorPoints) {
    var srcTgtPointsAndTangents = this.getSrcTgtPointsAndTangents(edge);

    var weights = [];
    var distances = [];

    for (var i = 0; anchorPoints && i < anchorPoints.length; i++) {
      var anchor = anchorPoints[i];
      var relativeAnchorPosition = this.convertToRelativePosition(edge, anchor, srcTgtPointsAndTangents);

      weights.push(relativeAnchorPosition.weight);
      distances.push(relativeAnchorPosition.distance);
    }

    return {
      weights: weights,
      distances: distances
    };
  },
  getDistancesString: function getDistancesString(edge, type) {
    var str = "";

    var distances = edge.data(this.syntax[type]['distance']);
    for (var i = 0; distances && i < distances.length; i++) {
      str = str + " " + distances[i];
    }

    return str;
  },
  getWeightsString: function getWeightsString(edge, type) {
    var str = "";

    var weights = edge.data(this.syntax[type]['weight']);
    for (var i = 0; weights && i < weights.length; i++) {
      str = str + " " + weights[i];
    }

    return str;
  },
  addAnchorPoint: function addAnchorPoint(edge, newAnchorPoint) {
    var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

    if (edge === undefined || newAnchorPoint === undefined) {
      edge = this.currentCtxEdge;
      newAnchorPoint = this.currentCtxPos;
    }

    if (type === undefined) type = this.getEdgeType(edge);

    var weightStr = this.syntax[type]['weight'];
    var distanceStr = this.syntax[type]['distance'];

    var relativePosition = this.convertToRelativePosition(edge, newAnchorPoint);
    var originalAnchorWeight = relativePosition.weight;

    var startX = edge.source().position('x');
    var startY = edge.source().position('y');
    var endX = edge.target().position('x');
    var endY = edge.target().position('y');
    var startWeight = this.convertToRelativePosition(edge, { x: startX, y: startY }).weight;
    var endWeight = this.convertToRelativePosition(edge, { x: endX, y: endY }).weight;
    var weightsWithTgtSrc = [startWeight].concat(edge.data(weightStr) ? edge.data(weightStr) : []).concat([endWeight]);

    var anchorsList = this.getAnchorsAsArray(edge);

    var minDist = Infinity;
    var intersection;
    var ptsWithTgtSrc = [startX, startY].concat(anchorsList ? anchorsList : []).concat([endX, endY]);
    var newAnchorIndex = -1;

    for (var i = 0; i < weightsWithTgtSrc.length - 1; i++) {
      var w1 = weightsWithTgtSrc[i];
      var w2 = weightsWithTgtSrc[i + 1];

      //check if the weight is between w1 and w2
      var b1 = this.compareWithPrecision(originalAnchorWeight, w1, true);
      var b2 = this.compareWithPrecision(originalAnchorWeight, w2);
      var b3 = this.compareWithPrecision(originalAnchorWeight, w2, true);
      var b4 = this.compareWithPrecision(originalAnchorWeight, w1);
      if (b1 && b2 || b3 && b4) {
        var startX = ptsWithTgtSrc[2 * i];
        var startY = ptsWithTgtSrc[2 * i + 1];
        var endX = ptsWithTgtSrc[2 * i + 2];
        var endY = ptsWithTgtSrc[2 * i + 3];

        var start = {
          x: startX,
          y: startY
        };

        var end = {
          x: endX,
          y: endY
        };

        var m1 = (startY - endY) / (startX - endX);
        var m2 = -1 / m1;

        var srcTgtPointsAndTangents = {
          srcPoint: start,
          tgtPoint: end,
          m1: m1,
          m2: m2
        };

        var currentIntersection = this.getIntersection(edge, newAnchorPoint, srcTgtPointsAndTangents);
        var dist = Math.sqrt(Math.pow(newAnchorPoint.x - currentIntersection.x, 2) + Math.pow(newAnchorPoint.y - currentIntersection.y, 2));

        //Update the minimum distance
        if (dist < minDist) {
          minDist = dist;
          intersection = currentIntersection;
          newAnchorIndex = i;
        }
      }
    }

    if (intersection !== undefined) {
      newAnchorPoint = intersection;
    }

    relativePosition = this.convertToRelativePosition(edge, newAnchorPoint);

    if (intersection === undefined) {
      relativePosition.distance = 0;
    }

    var weights = edge.data(weightStr);
    var distances = edge.data(distanceStr);

    weights = weights ? weights : [];
    distances = distances ? distances : [];

    if (weights.length === 0) {
      newAnchorIndex = 0;
    }

    //    weights.push(relativeBendPosition.weight);
    //    distances.push(relativeBendPosition.distance);
    if (newAnchorIndex != -1) {
      weights.splice(newAnchorIndex, 0, relativePosition.weight);
      distances.splice(newAnchorIndex, 0, relativePosition.distance);
    }

    edge.data(weightStr, weights);
    edge.data(distanceStr, distances);

    edge.addClass(this.syntax[type]['class']);
    if (weights.length > 1 || distances.length > 1) {
      edge.addClass(this.syntax[type]['multiClass']);
    }

    return newAnchorIndex;
  },
  removeAnchor: function removeAnchor(edge, anchorIndex) {
    if (edge === undefined || anchorIndex === undefined) {
      edge = this.currentCtxEdge;
      anchorIndex = this.currentAnchorIndex;
    }

    var type = this.getEdgeType(edge);

    if (this.edgeTypeInconclusiveShouldntHappen(type, "anchorPointUtilities.js, removeAnchor")) {
      return;
    }

    var distanceStr = this.syntax[type]['weight'];
    var weightStr = this.syntax[type]['distance'];
    var positionDataStr = this.syntax[type]['pointPos'];

    var distances = edge.data(distanceStr);
    var weights = edge.data(weightStr);
    var positions = edge.data(positionDataStr);

    distances.splice(anchorIndex, 1);
    weights.splice(anchorIndex, 1);
    // position data is not given in demo so it throws error here
    // but it should be from the beginning
    if (positions) positions.splice(anchorIndex, 1);

    // only one anchor point left on edge
    if (distances.length == 1 || weights.length == 1) {
      edge.removeClass(this.syntax[type]['multiClass']);
    }
    // no more anchor points on edge
    else if (distances.length == 0 || weights.length == 0) {
        edge.removeClass(this.syntax[type]['class']);
        edge.data(distanceStr, []);
        edge.data(weightStr, []);
      } else {
        edge.data(distanceStr, distances);
        edge.data(weightStr, weights);
      }
  },
  removeAllAnchors: function removeAllAnchors(edge) {
    if (edge === undefined) {
      edge = this.currentCtxEdge;
    }
    var type = this.getEdgeType(edge);

    if (this.edgeTypeInconclusiveShouldntHappen(type, "anchorPointUtilities.js, removeAllAnchors")) {
      return;
    }

    // Remove classes from edge
    edge.removeClass(this.syntax[type]['class']);
    edge.removeClass(this.syntax[type]['multiClass']);

    // Remove all anchor point data from edge
    var distanceStr = this.syntax[type]['weight'];
    var weightStr = this.syntax[type]['distance'];
    var positionDataStr = this.syntax[type]['pointPos'];
    edge.data(distanceStr, []);
    edge.data(weightStr, []);
    // position data is not given in demo so it throws error here
    // but it should be from the beginning
    if (edge.data(positionDataStr)) {
      edge.data(positionDataStr, []);
    }
  },
  calculateDistance: function calculateDistance(pt1, pt2) {
    var diffX = pt1.x - pt2.x;
    var diffY = pt1.y - pt2.y;

    var dist = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
    return dist;
  },
  /** (Less than or equal to) and (greater then equal to) comparisons with floating point numbers */
  compareWithPrecision: function compareWithPrecision(n1, n2) {
    var isLessThenOrEqual = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var precision = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0.01;

    var diff = n1 - n2;
    if (Math.abs(diff) <= precision) {
      return true;
    }
    if (isLessThenOrEqual) {
      return n1 < n2;
    } else {
      return n1 > n2;
    }
  },
  edgeTypeInconclusiveShouldntHappen: function edgeTypeInconclusiveShouldntHappen(type, place) {
    if (type === 'inconclusive') {
      console.log("In " + place + ": edge type inconclusive should never happen here!!");
      return true;
    }
    return false;
  }
};

module.exports = anchorPointUtilities;

/***/ }),

/***/ 347:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var debounce = __webpack_require__(218);
var anchorPointUtilities = __webpack_require__(964);
var reconnectionUtilities = __webpack_require__(171);
var registerUndoRedoFunctions = __webpack_require__(961);
var stageId = 0;

module.exports = function (params, cy) {
  var fn = params;

  var addBendPointCxtMenuId = 'cy-edge-bend-editing-cxt-add-bend-point' + stageId;
  var removeBendPointCxtMenuId = 'cy-edge-bend-editing-cxt-remove-bend-point' + stageId;
  var removeAllBendPointCtxMenuId = 'cy-edge-bend-editing-cxt-remove-multiple-bend-point' + stageId;
  var addControlPointCxtMenuId = 'cy-edge-control-editing-cxt-add-control-point' + stageId;
  var removeControlPointCxtMenuId = 'cy-edge-control-editing-cxt-remove-control-point' + stageId;
  var removeAllControlPointCtxMenuId = 'cy-edge-bend-editing-cxt-remove-multiple-control-point' + stageId;
  var eStyle, eRemove, eAdd, eZoom, eSelect, eUnselect, eTapStart, eTapStartOnEdge, eTapDrag, eTapEnd, eCxtTap, eDrag;
  // last status of gestures
  var lastPanningEnabled, lastZoomingEnabled, lastBoxSelectionEnabled;
  var lastActiveBgOpacity;
  // status of edge to highlight bends and selected edges
  var edgeToHighlight, numberOfSelectedEdges;

  // the Kanva.shape() for the endpoints
  var endpointShape1 = null,
      endpointShape2 = null;
  // used to stop certain cy listeners when interracting with anchors
  var anchorTouched = false;
  // used call eMouseDown of anchorManager if the mouse is out of the content on cy.on(tapend)
  var mouseOut;

  var functions = {
    init: function init() {
      // register undo redo functions
      registerUndoRedoFunctions(cy, anchorPointUtilities, params);

      var self = this;
      var opts = params;

      /*
        Make sure we don't append an element that already exists.
        This extension canvas uses the same html element as edge-editing.
        It makes sense since it also uses the same Konva stage.
        Without the below logic, an empty canvasElement would be created
        for one of these extensions for no reason.
      */
      var $container = $(this);
      var canvasElementId = 'cy-node-edge-editing-stage' + stageId;
      stageId++;
      var $canvasElement = $('<div id="' + canvasElementId + '"></div>');

      if ($container.find('#' + canvasElementId).length < 1) {
        $container.append($canvasElement);
      }

      /* 
        Maintain a single Konva.stage object throughout the application that uses this extension
        such as Newt. This is important since having different stages causes weird behavior
        on other extensions that also use Konva, like not listening to mouse clicks and such.
        If you are someone that is creating an extension that uses Konva in the future, you need to
        be careful about how events register. If you use a different stage almost certainly one
        or both of the extensions that use the stage created below will break.
      */
      var stage;
      if (Konva.stages.length < stageId) {
        stage = new Konva.Stage({
          id: 'node-edge-editing-stage',
          container: canvasElementId, // id of container <div>
          width: $container.width(),
          height: $container.height()
        });
      } else {
        stage = Konva.stages[stageId - 1];
      }

      var canvas;
      if (stage.getChildren().length < 1) {
        canvas = new Konva.Layer();
        stage.add(canvas);
      } else {
        canvas = stage.getChildren()[0];
      }

      var anchorManager = {
        edge: undefined,
        edgeType: 'inconclusive',
        anchors: [],
        // remembers the touched anchor to avoid clearing it when dragging happens
        touchedAnchor: undefined,
        // remembers the index of the moving anchor
        touchedAnchorIndex: undefined,
        bindListeners: function bindListeners(anchor) {
          anchor.on("mousedown touchstart", this.eMouseDown);
        },
        unbindListeners: function unbindListeners(anchor) {
          anchor.off("mousedown touchstart", this.eMouseDown);
        },
        // gets trigger on clicking on context menus, while cy listeners don't get triggered
        // it can cause weird behaviour if not aware of this
        eMouseDown: function eMouseDown(event) {
          // anchorManager.edge.unselect() won't work sometimes if this wasn't here
          cy.autounselectify(false);

          // eMouseDown(set) -> tapdrag(used) -> eMouseUp(reset)
          anchorTouched = true;
          anchorManager.touchedAnchor = event.target;
          mouseOut = false;
          anchorManager.edge.unselect();

          // remember state before changing
          var weightStr = anchorPointUtilities.syntax[anchorManager.edgeType]['weight'];
          var distanceStr = anchorPointUtilities.syntax[anchorManager.edgeType]['distance'];

          var edge = anchorManager.edge;
          moveAnchorParam = {
            edge: edge,
            type: anchorManager.edgeType,
            weights: edge.data(weightStr) ? [].concat(edge.data(weightStr)) : [],
            distances: edge.data(distanceStr) ? [].concat(edge.data(distanceStr)) : []
          };

          turnOffActiveBgColor();
          disableGestures();

          cy.autoungrabify(true);

          canvas.getStage().on("contentTouchend contentMouseup", anchorManager.eMouseUp);
          canvas.getStage().on("contentMouseout", anchorManager.eMouseOut);
        },
        // gets called before cy.on('tapend')
        eMouseUp: function eMouseUp(event) {
          // won't be called if the mouse is released out of screen
          anchorTouched = false;
          anchorManager.touchedAnchor = undefined;
          mouseOut = false;
          anchorManager.edge.select();

          resetActiveBgColor();
          resetGestures();

          /* 
           * IMPORTANT
           * Any programmatic calls to .select(), .unselect() after this statement are ignored
           * until cy.autounselectify(false) is called in one of the previous:
           * 
           * cy.on('tapstart')
           * anchor.on('mousedown touchstart')
           * document.on('keydown')
           * cy.on('tapdrap')
           * 
           * Doesn't affect UX, but may cause confusing behaviour if not aware of this when coding
           * 
           * Why is this here?
           * This is important to keep edges from being auto deselected from working
           * with anchors out of the edge body (for unbundled bezier, technically not necessery for segements).
           * 
           * These is anther cy.autoselectify(true) in cy.on('tapend') 
           * 
          */
          cy.autounselectify(true);
          cy.autoungrabify(false);

          canvas.getStage().off("contentTouchend contentMouseup", anchorManager.eMouseUp);
          canvas.getStage().off("contentMouseout", anchorManager.eMouseOut);
        },
        // handle mouse going out of canvas 
        eMouseOut: function eMouseOut(event) {
          mouseOut = true;
        },
        clearAnchorsExcept: function clearAnchorsExcept() {
          var _this = this;

          var dontClean = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

          var exceptionApplies = false;

          this.anchors.forEach(function (anchor, index) {
            if (dontClean && anchor === dontClean) {
              exceptionApplies = true; // the dontClean anchor is not cleared
              return;
            }

            _this.unbindListeners(anchor);
            anchor.destroy();
          });

          if (exceptionApplies) {
            this.anchors = [dontClean];
          } else {
            this.anchors = [];
            this.edge = undefined;
            this.edgeType = 'inconclusive';
          }
        },
        // render the bend and control shapes of the given edge
        renderAnchorShapes: function renderAnchorShapes(edge) {
          this.edge = edge;
          this.edgeType = anchorPointUtilities.getEdgeType(edge);

          if (!edge.hasClass('edgebendediting-hasbendpoints') && !edge.hasClass('edgecontrolediting-hascontrolpoints')) {
            return;
          }

          var anchorList = anchorPointUtilities.getAnchorsAsArray(edge); //edge._private.rdata.segpts;
          var length = getAnchorShapesLength(edge) * 0.65;

          var srcPos = edge.source().position();
          var tgtPos = edge.target().position();

          for (var i = 0; anchorList && i < anchorList.length; i = i + 2) {
            var anchorX = anchorList[i];
            var anchorY = anchorList[i + 1];

            this.renderAnchorShape(anchorX, anchorY, length);
          }

          canvas.draw();
        },
        // render a anchor shape with the given parameters
        renderAnchorShape: function renderAnchorShape(anchorX, anchorY, length) {
          // get the top left coordinates
          var topLeftX = anchorX - length / 2;
          var topLeftY = anchorY - length / 2;

          // convert to rendered parameters
          var renderedTopLeftPos = convertToRenderedPosition({ x: topLeftX, y: topLeftY });
          length *= cy.zoom();

          var newAnchor = new Konva.Rect({
            x: renderedTopLeftPos.x,
            y: renderedTopLeftPos.y,
            width: length,
            height: length,
            fill: 'black',
            strokeWidth: 0,
            draggable: true
          });

          this.anchors.push(newAnchor);
          this.bindListeners(newAnchor);
          canvas.add(newAnchor);
        }
      };

      var cxtAddBendFcn = function cxtAddBendFcn(event) {
        cxtAddAnchorFcn(event, 'bend');
      };

      var cxtAddControlFcn = function cxtAddControlFcn(event) {
        cxtAddAnchorFcn(event, 'control');
      };

      var cxtAddAnchorFcn = function cxtAddAnchorFcn(event, anchorType) {
        var edge = event.target || event.cyTarget;
        if (!anchorPointUtilities.isIgnoredEdge(edge)) {

          var type = anchorPointUtilities.getEdgeType(edge);
          var weights, distances, weightStr, distanceStr;

          if (type === 'inconclusive') {
            weights = [];
            distances = [];
          } else {
            weightStr = anchorPointUtilities.syntax[type]['weight'];
            distanceStr = anchorPointUtilities.syntax[type]['distance'];

            weights = edge.data(weightStr) ? [].concat(edge.data(weightStr)) : edge.data(weightStr);
            distances = edge.data(distanceStr) ? [].concat(edge.data(distanceStr)) : edge.data(distanceStr);
          }

          var param = {
            edge: edge,
            type: type,
            weights: weights,
            distances: distances
          };

          // the undefined go for edge and newAnchorPoint parameters
          anchorPointUtilities.addAnchorPoint(undefined, undefined, anchorType);

          if (options().undoable) {
            cy.undoRedo().do('changeAnchorPoints', param);
          }
        }

        refreshDraws();
        edge.select();
      };

      var cxtRemoveAnchorFcn = function cxtRemoveAnchorFcn(event) {
        var edge = anchorManager.edge;
        var type = anchorPointUtilities.getEdgeType(edge);

        if (anchorPointUtilities.edgeTypeInconclusiveShouldntHappen(type, "UiUtilities.js, cxtRemoveAnchorFcn")) {
          return;
        }

        var param = {
          edge: edge,
          type: type,
          weights: [].concat(edge.data(anchorPointUtilities.syntax[type]['weight'])),
          distances: [].concat(edge.data(anchorPointUtilities.syntax[type]['distance']))
        };

        anchorPointUtilities.removeAnchor();

        if (options().undoable) {
          cy.undoRedo().do('changeAnchorPoints', param);
        }

        setTimeout(function () {
          refreshDraws();edge.select();
        }, 50);
      };

      var cxtRemoveAllAnchorsFcn = function cxtRemoveAllAnchorsFcn(event) {
        var edge = anchorManager.edge;
        var type = anchorPointUtilities.getEdgeType(edge);
        var param = {
          edge: edge,
          type: type,
          weights: [].concat(edge.data(anchorPointUtilities.syntax[type]['weight'])),
          distances: [].concat(edge.data(anchorPointUtilities.syntax[type]['distance']))
        };

        anchorPointUtilities.removeAllAnchors();

        if (options().undoable) {
          cy.undoRedo().do('changeAnchorPoints', param);
        }
        setTimeout(function () {
          refreshDraws();edge.select();
        }, 50);
      };

      // function to reconnect edge
      var handleReconnectEdge = opts.handleReconnectEdge;
      // function to validate edge source and target on reconnection
      var validateEdge = opts.validateEdge;
      // function to be called on invalid edge reconnection
      var actOnUnsuccessfulReconnection = opts.actOnUnsuccessfulReconnection;

      var menuItems = [{
        id: addBendPointCxtMenuId,
        content: opts.addBendMenuItemTitle,
        selector: 'edge',
        onClickFunction: cxtAddBendFcn
      }, {
        id: removeBendPointCxtMenuId,
        content: opts.removeBendMenuItemTitle,
        selector: 'edge',
        onClickFunction: cxtRemoveAnchorFcn
      }, {
        id: removeAllBendPointCtxMenuId,
        content: opts.removeAllBendMenuItemTitle,
        selector: opts.enableMultipleAnchorRemovalOption && ':selected.edgebendediting-hasmultiplebendpoints',
        onClickFunction: cxtRemoveAllAnchorsFcn
      }, {
        id: addControlPointCxtMenuId,
        content: opts.addControlMenuItemTitle,
        selector: 'edge',
        coreAsWell: true,
        onClickFunction: cxtAddControlFcn
      }, {
        id: removeControlPointCxtMenuId,
        content: opts.removeControlMenuItemTitle,
        selector: 'edge',
        coreAsWell: true,
        onClickFunction: cxtRemoveAnchorFcn
      }, {
        id: removeAllControlPointCtxMenuId,
        content: opts.removeAllControlMenuItemTitle,
        selector: opts.enableMultipleAnchorRemovalOption && ':selected.edgecontrolediting-hasmultiplecontrolpoints',
        onClickFunction: cxtRemoveAllAnchorsFcn
      }];

      if (cy.contextMenus) {
        var menus = cy.contextMenus('get');
        // If context menus is active just append menu items else activate the extension
        // with initial menu items
        if (menus.isActive()) {
          menus.appendMenuItems(menuItems);
        } else {
          cy.contextMenus({
            menuItems: menuItems
          });
        }
      }

      var _sizeCanvas = debounce(function () {
        $canvasElement.attr('height', $container.height()).attr('width', $container.width()).css({
          'position': 'absolute',
          'top': 0,
          'left': 0,
          'z-index': options().zIndex
        });

        setTimeout(function () {
          var canvasBb = $canvasElement.offset();
          var containerBb = $container.offset();

          $canvasElement.css({
            'top': -(canvasBb.top - containerBb.top),
            'left': -(canvasBb.left - containerBb.left)
          });

          canvas.getStage().setWidth($container.width());
          canvas.getStage().setHeight($container.height());

          // redraw on canvas resize
          if (cy) {
            refreshDraws();
          }
        }, 0);
      }, 250);

      function sizeCanvas() {
        _sizeCanvas();
      }

      sizeCanvas();

      $(window).bind('resize', function () {
        sizeCanvas();
      });

      // write options to data
      var data = $container.data('cyedgeediting');
      if (data == null) {
        data = {};
      }
      data.options = opts;

      var optCache;

      function options() {
        return optCache || (optCache = $container.data('cyedgeediting').options);
      }

      // we will need to convert model positons to rendered positions
      function convertToRenderedPosition(modelPosition) {
        var pan = cy.pan();
        var zoom = cy.zoom();

        var x = modelPosition.x * zoom + pan.x;
        var y = modelPosition.y * zoom + pan.y;

        return {
          x: x,
          y: y
        };
      }

      function refreshDraws() {

        // don't clear anchor which is being moved
        anchorManager.clearAnchorsExcept(anchorManager.touchedAnchor);

        if (endpointShape1 !== null) {
          endpointShape1.destroy();
          endpointShape1 = null;
        }
        if (endpointShape2 !== null) {
          endpointShape2.destroy();
          endpointShape2 = null;
        }
        canvas.draw();

        if (edgeToHighlight) {
          anchorManager.renderAnchorShapes(edgeToHighlight);
          renderEndPointShapes(edgeToHighlight);
        }
      }

      // render the end points shapes of the given edge
      function renderEndPointShapes(edge) {
        if (!edge) {
          return;
        }

        var edge_pts = anchorPointUtilities.getAnchorsAsArray(edge);
        if (typeof edge_pts === 'undefined') {
          edge_pts = [];
        }
        var sourcePos = edge.sourceEndpoint();
        var targetPos = edge.targetEndpoint();
        edge_pts.unshift(sourcePos.y);
        edge_pts.unshift(sourcePos.x);
        edge_pts.push(targetPos.x);
        edge_pts.push(targetPos.y);

        if (!edge_pts) return;

        var src = {
          x: edge_pts[0],
          y: edge_pts[1]
        };

        var target = {
          x: edge_pts[edge_pts.length - 2],
          y: edge_pts[edge_pts.length - 1]
        };

        var nextToSource = {
          x: edge_pts[2],
          y: edge_pts[3]
        };
        var nextToTarget = {
          x: edge_pts[edge_pts.length - 4],
          y: edge_pts[edge_pts.length - 3]
        };
        var length = getAnchorShapesLength(edge) * 0.65;

        renderEachEndPointShape(src, target, length, nextToSource, nextToTarget);
      }

      function renderEachEndPointShape(source, target, length, nextToSource, nextToTarget) {
        // get the top left coordinates of source and target
        var sTopLeftX = source.x - length / 2;
        var sTopLeftY = source.y - length / 2;

        var tTopLeftX = target.x - length / 2;
        var tTopLeftY = target.y - length / 2;

        var nextToSourceX = nextToSource.x - length / 2;
        var nextToSourceY = nextToSource.y - length / 2;

        var nextToTargetX = nextToTarget.x - length / 2;
        var nextToTargetY = nextToTarget.y - length / 2;

        // convert to rendered parameters
        var renderedSourcePos = convertToRenderedPosition({ x: sTopLeftX, y: sTopLeftY });
        var renderedTargetPos = convertToRenderedPosition({ x: tTopLeftX, y: tTopLeftY });
        length = length * cy.zoom() / 2;

        var renderedNextToSource = convertToRenderedPosition({ x: nextToSourceX, y: nextToSourceY });
        var renderedNextToTarget = convertToRenderedPosition({ x: nextToTargetX, y: nextToTargetY });

        //how far to go from the node along the edge
        var distanceFromNode = length;

        var distanceSource = Math.sqrt(Math.pow(renderedNextToSource.x - renderedSourcePos.x, 2) + Math.pow(renderedNextToSource.y - renderedSourcePos.y, 2));
        var sourceEndPointX = renderedSourcePos.x + distanceFromNode / distanceSource * (renderedNextToSource.x - renderedSourcePos.x);
        var sourceEndPointY = renderedSourcePos.y + distanceFromNode / distanceSource * (renderedNextToSource.y - renderedSourcePos.y);

        var distanceTarget = Math.sqrt(Math.pow(renderedNextToTarget.x - renderedTargetPos.x, 2) + Math.pow(renderedNextToTarget.y - renderedTargetPos.y, 2));
        var targetEndPointX = renderedTargetPos.x + distanceFromNode / distanceTarget * (renderedNextToTarget.x - renderedTargetPos.x);
        var targetEndPointY = renderedTargetPos.y + distanceFromNode / distanceTarget * (renderedNextToTarget.y - renderedTargetPos.y);

        // render end point shape for source and target
        // the null checks are not theoretically required
        // but they protect from bad synchronious calls of refreshDraws()
        if (endpointShape1 === null) {
          endpointShape1 = new Konva.Circle({
            x: sourceEndPointX + length,
            y: sourceEndPointY + length,
            radius: length,
            fill: 'black'
          });
        }

        if (endpointShape2 === null) {
          endpointShape2 = new Konva.Circle({
            x: targetEndPointX + length,
            y: targetEndPointY + length,
            radius: length,
            fill: 'black'
          });
        }

        canvas.add(endpointShape1);
        canvas.add(endpointShape2);
        canvas.draw();
      }

      // get the length of anchor points to be rendered
      function getAnchorShapesLength(edge) {
        var factor = options().anchorShapeSizeFactor;
        if (options().enableAnchorSizeNotImpactByZoom) var actualFactor = factor / cy.zoom();else var actualFactor = factor;
        if (parseFloat(edge.css('width')) <= 2.5) return 2.5 * actualFactor;else return parseFloat(edge.css('width')) * actualFactor;
      }

      // check if the anchor represented by {x, y} is inside the point shape
      function checkIfInsideShape(x, y, length, centerX, centerY) {
        var minX = centerX - length / 2;
        var maxX = centerX + length / 2;
        var minY = centerY - length / 2;
        var maxY = centerY + length / 2;

        var inside = x >= minX && x <= maxX && y >= minY && y <= maxY;
        return inside;
      }

      // get the index of anchor containing the point represented by {x, y}
      function getContainingShapeIndex(x, y, edge) {
        var type = anchorPointUtilities.getEdgeType(edge);

        if (type === 'inconclusive') {
          return -1;
        }

        if (edge.data(anchorPointUtilities.syntax[type]['weight']) == null || edge.data(anchorPointUtilities.syntax[type]['weight']).length == 0) {
          return -1;
        }

        var anchorList = anchorPointUtilities.getAnchorsAsArray(edge); //edge._private.rdata.segpts;
        var length = getAnchorShapesLength(edge);

        for (var i = 0; anchorList && i < anchorList.length; i = i + 2) {
          var anchorX = anchorList[i];
          var anchorY = anchorList[i + 1];

          var inside = checkIfInsideShape(x, y, length, anchorX, anchorY);
          if (inside) {
            return i / 2;
          }
        }

        return -1;
      };

      function getContainingEndPoint(x, y, edge) {
        var length = getAnchorShapesLength(edge);
        var allPts = edge._private.rscratch.allpts;
        var src = {
          x: allPts[0],
          y: allPts[1]
        };
        var target = {
          x: allPts[allPts.length - 2],
          y: allPts[allPts.length - 1]
        };
        convertToRenderedPosition(src);
        convertToRenderedPosition(target);

        // Source:0, Target:1, None:-1
        if (checkIfInsideShape(x, y, length, src.x, src.y)) return 0;else if (checkIfInsideShape(x, y, length, target.x, target.y)) return 1;else return -1;
      }

      // store the current status of gestures and set them to false
      function disableGestures() {
        lastPanningEnabled = cy.panningEnabled();
        lastZoomingEnabled = cy.zoomingEnabled();
        lastBoxSelectionEnabled = cy.boxSelectionEnabled();

        cy.zoomingEnabled(false).panningEnabled(false).boxSelectionEnabled(false);
      }

      // reset the gestures by their latest status
      function resetGestures() {
        cy.zoomingEnabled(lastZoomingEnabled).panningEnabled(lastPanningEnabled).boxSelectionEnabled(lastBoxSelectionEnabled);
      }

      function turnOffActiveBgColor() {
        // found this at the cy-node-resize code, but doesn't seem to find the object most of the time
        if (cy.style()._private.coreStyle["active-bg-opacity"]) {
          lastActiveBgOpacity = cy.style()._private.coreStyle["active-bg-opacity"].value;
        } else {
          // arbitrary, feel free to change
          // trial and error showed that 0.15 was closest to the old color
          lastActiveBgOpacity = 0.15;
        }

        cy.style().selector("core").style("active-bg-opacity", 0).update();
      }

      function resetActiveBgColor() {
        cy.style().selector("core").style("active-bg-opacity", lastActiveBgOpacity).update();
      }

      function moveAnchorPoints(positionDiff, edges) {
        edges.forEach(function (edge) {
          var previousAnchorsPosition = anchorPointUtilities.getAnchorsAsArray(edge);
          var nextAnchorPointsPosition = [];
          if (previousAnchorsPosition != undefined) {
            for (var i = 0; i < previousAnchorsPosition.length; i += 2) {
              nextAnchorPointsPosition.push({ x: previousAnchorsPosition[i] + positionDiff.x, y: previousAnchorsPosition[i + 1] + positionDiff.y });
            }
            var type = anchorPointUtilities.getEdgeType(edge);

            if (anchorPointUtilities.edgeTypeInconclusiveShouldntHappen(type, "UiUtilities.js, moveAnchorPoints")) {
              return;
            }

            edge.data(anchorPointUtilities.syntax[type]['pointPos'], nextAnchorPointsPosition);
          }
        });
        anchorPointUtilities.initAnchorPoints(options().bendPositionsFunction, options().controlPositionsFunction, edges);

        // Listener defined in other extension
        // Might have compatibility issues after the unbundled bezier
        cy.trigger('bendPointMovement');
      }

      function _calcCostToPreferredPosition(p1, p2) {
        var currentAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        var perfectAngle = [-Math.PI, -Math.PI * 3 / 4, -Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4, Math.PI / 4];
        var deltaAngle = [];
        perfectAngle.forEach(function (angle) {
          deltaAngle.push(Math.abs(currentAngle - angle));
        });
        var indexOfMin = deltaAngle.indexOf(Math.min.apply(Math, deltaAngle));
        var dy = p2.y - p1.y;
        var dx = p2.x - p1.x;
        var l = Math.sqrt(dx * dx + dy * dy);
        var cost = Math.abs(l * Math.sin(deltaAngle[indexOfMin]));

        var chosenAngle = perfectAngle[indexOfMin];
        var edgeL = Math.abs(l * Math.cos(deltaAngle[indexOfMin]));
        var targetPointX = p1.x + edgeL * Math.cos(chosenAngle);
        var targetPointY = p1.y + edgeL * Math.sin(chosenAngle);

        return { "costDistance": cost, "x": targetPointX, "y": targetPointY, "angle": chosenAngle };
      }

      function moveAnchorOnDrag(edge, type, index, position) {
        var prevPointPosition = anchorPointUtilities.obtainPrevAnchorAbsolutePositions(edge, type, index);
        var nextPointPosition = anchorPointUtilities.obtainNextAnchorAbsolutePositions(edge, type, index);
        var mousePosition = position;

        //calcualte the cost(or offset distance) to fulfill perfect 0, or 45 or 90 degree positions according to prev and next position
        var judgePrev = _calcCostToPreferredPosition(prevPointPosition, mousePosition);
        var judgeNext = _calcCostToPreferredPosition(nextPointPosition, mousePosition);
        var decisionObj = null;

        var zoomLevel = cy.zoom();

        if (judgePrev.costDistance * zoomLevel < opts.stickyAnchorTolerence && judgeNext.costDistance * zoomLevel > opts.stickyAnchorTolerence) {
          //choose the perfect angle point from prev anchor
          position.x = judgePrev.x;
          position.y = judgePrev.y;
        } else if (judgePrev.costDistance * zoomLevel > opts.stickyAnchorTolerence && judgeNext.costDistance * zoomLevel < opts.stickyAnchorTolerence) {
          //choose the perfect angle point from next anchor
          position.x = judgeNext.x;
          position.y = judgeNext.y;
        } else if (judgePrev.costDistance * zoomLevel < opts.stickyAnchorTolerence && judgeNext.costDistance * zoomLevel < opts.stickyAnchorTolerence) {
          //check if the two angle lines are parallel or not
          var angle1 = judgePrev.angle;
          var angle2 = judgeNext.angle;
          if (angle1 == angle2 || Math.abs(angle1 - angle2) == Math.PI) {
            //there will be no intersection, so just choose the perfect angle point from prev anchor
            position.x = judgePrev.x;
            position.y = judgePrev.y;
          } else {
            //calculate the intersection as perfect anchor point
            var prevX = prevPointPosition.x;
            var prevY = prevPointPosition.y;
            var nexX = nextPointPosition.x;
            var nexY = nextPointPosition.y;
            var fx = judgePrev.x;
            var fy = judgePrev.y;
            var sx = judgeNext.x;
            var sy = judgeNext.y;

            if (Math.abs(fy - prevY) < 0.00001) {
              position.y = prevY;
              position.x = (sx - nexX) / (sy - nexY) * (position.y - nexY) + nexX;
            } else if (Math.abs(sy - nexY) < 0.00001) {
              position.y = nexY;
              position.x = (fx - prevX) / (fy - prevY) * (position.y - prevY) + prevX;
            } else {
              var a = (fx - prevX) / (fy - prevY);
              var b = (sx - nexX) / (sy - nexY);
              position.y = (a * prevY - prevX - b * nexY + nexX) / (a - b);
              position.x = a * (position.y - prevY) + prevX;
            }
          }
        }

        var weights = edge.data(anchorPointUtilities.syntax[type]['weight']);
        var distances = edge.data(anchorPointUtilities.syntax[type]['distance']);

        var relativeAnchorPosition = anchorPointUtilities.convertToRelativePosition(edge, position);
        weights[index] = relativeAnchorPosition.weight;
        distances[index] = relativeAnchorPosition.distance;

        edge.data(anchorPointUtilities.syntax[type]['weight'], weights);
        edge.data(anchorPointUtilities.syntax[type]['distance'], distances);
      }

      // debounced due to large amout of calls to tapdrag
      var _moveAnchorOnDrag = debounce(moveAnchorOnDrag, 5);

      {
        lastPanningEnabled = cy.panningEnabled();
        lastZoomingEnabled = cy.zoomingEnabled();
        lastBoxSelectionEnabled = cy.boxSelectionEnabled();

        // Initilize the edgeToHighlightBends and numberOfSelectedEdges
        {
          var selectedEdges = cy.edges(':selected');
          var numberOfSelectedEdges = selectedEdges.length;

          if (numberOfSelectedEdges === 1) {
            edgeToHighlight = selectedEdges[0];
          }
        }

        cy.bind('zoom pan', eZoom = function eZoom() {
          if (!edgeToHighlight) {
            return;
          }

          refreshDraws();
        });

        // cy.off is never called on this listener
        cy.on('data', 'edge', function () {
          if (!edgeToHighlight) {
            return;
          }

          refreshDraws();
        });

        cy.on('style', 'edge.edgebendediting-hasbendpoints:selected, edge.edgecontrolediting-hascontrolpoints:selected', eStyle = function eStyle() {
          setTimeout(function () {
            refreshDraws();
          }, 50);
        });

        cy.on('remove', 'edge', eRemove = function eRemove() {
          var edge = this;
          if (edge.selected()) {
            numberOfSelectedEdges = numberOfSelectedEdges - 1;

            cy.startBatch();

            if (edgeToHighlight) {
              edgeToHighlight.removeClass('cy-edge-editing-highlight');
            }

            if (numberOfSelectedEdges === 1) {
              var selectedEdges = cy.edges(':selected');

              // If user removes all selected edges at a single operation then our 'numberOfSelectedEdges'
              // may be misleading. Therefore we need to check if the number of edges to highlight is realy 1 here.
              if (selectedEdges.length === 1) {
                edgeToHighlight = selectedEdges[0];
                edgeToHighlight.addClass('cy-edge-editing-highlight');
              } else {
                edgeToHighlight = undefined;
              }
            } else {
              edgeToHighlight = undefined;
            }

            cy.endBatch();
          }
          refreshDraws();
        });

        cy.on('add', 'edge', eAdd = function eAdd() {
          var edge = this;
          if (edge.selected()) {
            numberOfSelectedEdges = numberOfSelectedEdges + 1;

            cy.startBatch();

            if (edgeToHighlight) {
              edgeToHighlight.removeClass('cy-edge-editing-highlight');
            }

            if (numberOfSelectedEdges === 1) {
              edgeToHighlight = edge;
              edgeToHighlight.addClass('cy-edge-editing-highlight');
            } else {
              edgeToHighlight = undefined;
            }

            cy.endBatch();
          }
          refreshDraws();
        });

        cy.on('select', 'edge', eSelect = function eSelect() {
          var edge = this;

          if (edge.target().connectedEdges().length == 0 || edge.source().connectedEdges().length == 0) {
            return;
          }

          numberOfSelectedEdges = numberOfSelectedEdges + 1;

          cy.startBatch();

          if (edgeToHighlight) {
            edgeToHighlight.removeClass('cy-edge-editing-highlight');
          }

          if (numberOfSelectedEdges === 1) {
            edgeToHighlight = edge;
            edgeToHighlight.addClass('cy-edge-editing-highlight');
          } else {
            edgeToHighlight = undefined;
          }

          cy.endBatch();
          refreshDraws();
        });

        cy.on('unselect', 'edge', eUnselect = function eUnselect() {
          numberOfSelectedEdges = numberOfSelectedEdges - 1;

          cy.startBatch();

          if (edgeToHighlight) {
            edgeToHighlight.removeClass('cy-edge-editing-highlight');
          }

          if (numberOfSelectedEdges === 1) {
            var selectedEdges = cy.edges(':selected');

            // If user unselects all edges by tapping to the core etc. then our 'numberOfSelectedEdges'
            // may be misleading. Therefore we need to check if the number of edges to highlight is realy 1 here.
            if (selectedEdges.length === 1) {
              edgeToHighlight = selectedEdges[0];
              edgeToHighlight.addClass('cy-edge-editing-highlight');
            } else {
              edgeToHighlight = undefined;
            }
          } else {
            edgeToHighlight = undefined;
          }

          cy.endBatch();
          refreshDraws();
        });

        var movedAnchorIndex;
        var tapStartPos;
        var movedEdge;
        var moveAnchorParam;
        var createAnchorOnDrag;
        var movedEndPoint;
        var dummyNode;
        var detachedNode;
        var nodeToAttach;
        var anchorCreatedByDrag = false;

        cy.on('tapstart', eTapStart = function eTapStart(event) {
          tapStartPos = event.position || event.cyPosition;
        });

        cy.on('tapstart', 'edge', eTapStartOnEdge = function eTapStartOnEdge(event) {
          var edge = this;

          if (!edgeToHighlight || edgeToHighlight.id() !== edge.id()) {
            createAnchorOnDrag = false;
            return;
          }

          movedEdge = edge;

          var type = anchorPointUtilities.getEdgeType(edge);

          // to avoid errors
          if (type === 'inconclusive') type = 'bend';

          var cyPosX = tapStartPos.x;
          var cyPosY = tapStartPos.y;

          // Get which end point has been clicked (Source:0, Target:1, None:-1)
          var endPoint = getContainingEndPoint(cyPosX, cyPosY, edge);

          if (endPoint == 0 || endPoint == 1) {
            edge.unselect();
            movedEndPoint = endPoint;
            detachedNode = endPoint == 0 ? movedEdge.source() : movedEdge.target();

            var disconnectedEnd = endPoint == 0 ? 'source' : 'target';
            var result = reconnectionUtilities.disconnectEdge(movedEdge, cy, event.renderedPosition, disconnectedEnd);

            dummyNode = result.dummyNode;
            movedEdge = result.edge;

            disableGestures();
          } else {
            movedAnchorIndex = undefined;
            createAnchorOnDrag = true;
          }
        });

        cy.on('drag', 'node', eDrag = function eDrag(event) {
          var node = this;
          cy.edges().unselect();
          if (!node.selected()) {
            cy.nodes().unselect();
          }
        });
        cy.on('tapdrag', eTapDrag = function eTapDrag(event) {
          /** 
           * if there is a selected edge set autounselectify false
           * fixes the node-editing problem where nodes would get
           * unselected after resize drag
          */
          if (cy.edges(':selected').length > 0) {
            cy.autounselectify(false);
          }
          var edge = movedEdge;

          if (movedEdge !== undefined && anchorPointUtilities.isIgnoredEdge(edge)) {
            return;
          }

          var type = anchorPointUtilities.getEdgeType(edge);

          if (createAnchorOnDrag && opts.enableCreateAnchorOnDrag && !anchorTouched && type !== 'inconclusive') {
            // remember state before creating anchor
            var weightStr = anchorPointUtilities.syntax[type]['weight'];
            var distanceStr = anchorPointUtilities.syntax[type]['distance'];

            moveAnchorParam = {
              edge: edge,
              type: type,
              weights: edge.data(weightStr) ? [].concat(edge.data(weightStr)) : [],
              distances: edge.data(distanceStr) ? [].concat(edge.data(distanceStr)) : []
            };

            edge.unselect();

            // using tapstart position fixes bug on quick drags
            // --- 
            // also modified addAnchorPoint to return the index because
            // getContainingShapeIndex failed to find the created anchor on quick drags
            movedAnchorIndex = anchorPointUtilities.addAnchorPoint(edge, tapStartPos);
            movedEdge = edge;
            createAnchorOnDrag = undefined;
            anchorCreatedByDrag = true;
            disableGestures();
          }

          // if the tapstart did not hit an edge and it did not hit an anchor
          if (!anchorTouched && (movedEdge === undefined || movedAnchorIndex === undefined && movedEndPoint === undefined)) {
            return;
          }

          var eventPos = event.position || event.cyPosition;

          // Update end point location (Source:0, Target:1)
          if (movedEndPoint != -1 && dummyNode) {
            dummyNode.position(eventPos);
          }
          // change location of anchor created by drag
          else if (movedAnchorIndex != undefined) {
              _moveAnchorOnDrag(edge, type, movedAnchorIndex, eventPos);
            }
            // change location of drag and dropped anchor
            else if (anchorTouched) {

                // the tapStartPos check is necessary when righ clicking anchor points
                // right clicking anchor points triggers MouseDown for Konva, but not tapstart for cy
                // when that happens tapStartPos is undefined
                if (anchorManager.touchedAnchorIndex === undefined && tapStartPos) {
                  anchorManager.touchedAnchorIndex = getContainingShapeIndex(tapStartPos.x, tapStartPos.y, anchorManager.edge);
                }

                if (anchorManager.touchedAnchorIndex !== undefined) {
                  _moveAnchorOnDrag(anchorManager.edge, anchorManager.edgeType, anchorManager.touchedAnchorIndex, eventPos);
                }
              }

          if (event.target && event.target[0] && event.target.isNode()) {
            nodeToAttach = event.target;
          }
        });

        cy.on('tapend', eTapEnd = function eTapEnd(event) {

          if (mouseOut) {
            canvas.getStage().fire("contentMouseup");
          }

          var edge = movedEdge || anchorManager.edge;

          if (edge !== undefined) {
            var index = anchorManager.touchedAnchorIndex;
            if (index != undefined) {
              var startX = edge.source().position('x');
              var startY = edge.source().position('y');
              var endX = edge.target().position('x');
              var endY = edge.target().position('y');

              var anchorList = anchorPointUtilities.getAnchorsAsArray(edge);
              var allAnchors = [startX, startY].concat(anchorList).concat([endX, endY]);

              var anchorIndex = index + 1;
              var preIndex = anchorIndex - 1;
              var posIndex = anchorIndex + 1;

              var anchor = {
                x: allAnchors[2 * anchorIndex],
                y: allAnchors[2 * anchorIndex + 1]
              };

              var preAnchorPoint = {
                x: allAnchors[2 * preIndex],
                y: allAnchors[2 * preIndex + 1]
              };

              var posAnchorPoint = {
                x: allAnchors[2 * posIndex],
                y: allAnchors[2 * posIndex + 1]
              };

              var nearToLine;

              if (anchor.x === preAnchorPoint.x && anchor.y === preAnchorPoint.y || anchor.x === preAnchorPoint.x && anchor.y === preAnchorPoint.y) {
                nearToLine = true;
              } else {
                var m1 = (preAnchorPoint.y - posAnchorPoint.y) / (preAnchorPoint.x - posAnchorPoint.x);
                var m2 = -1 / m1;

                var srcTgtPointsAndTangents = {
                  srcPoint: preAnchorPoint,
                  tgtPoint: posAnchorPoint,
                  m1: m1,
                  m2: m2
                };

                var currentIntersection = anchorPointUtilities.getIntersection(edge, anchor, srcTgtPointsAndTangents);
                var dist = Math.sqrt(Math.pow(anchor.x - currentIntersection.x, 2) + Math.pow(anchor.y - currentIntersection.y, 2));

                // remove the bend point if segment edge becomes straight
                var type = anchorPointUtilities.getEdgeType(edge);
                if (type === 'bend' && dist < options().bendRemovalSensitivity) {
                  nearToLine = true;
                }
              }

              if (opts.enableRemoveAnchorMidOfNearLine && nearToLine) {
                anchorPointUtilities.removeAnchor(edge, index);
              }
            } else if (dummyNode != undefined && (movedEndPoint == 0 || movedEndPoint == 1)) {

              var newNode = detachedNode;
              var isValid = 'valid';
              var location = movedEndPoint == 0 ? 'source' : 'target';

              // validate edge reconnection
              if (nodeToAttach) {
                var newSource = movedEndPoint == 0 ? nodeToAttach : edge.source();
                var newTarget = movedEndPoint == 1 ? nodeToAttach : edge.target();
                if (typeof validateEdge === "function") isValid = validateEdge(edge, newSource, newTarget);
                newNode = isValid === 'valid' ? nodeToAttach : detachedNode;
              }

              var newSource = movedEndPoint == 0 ? newNode : edge.source();
              var newTarget = movedEndPoint == 1 ? newNode : edge.target();
              edge = reconnectionUtilities.connectEdge(edge, detachedNode, location);

              if (detachedNode.id() !== newNode.id()) {
                // use given handleReconnectEdge function 
                if (typeof handleReconnectEdge === 'function') {
                  var reconnectedEdge = handleReconnectEdge(newSource.id(), newTarget.id(), edge.data());

                  if (reconnectedEdge) {
                    reconnectionUtilities.copyEdge(edge, reconnectedEdge);
                    anchorPointUtilities.initAnchorPoints(options().bendPositionsFunction, options().controlPositionsFunction, [reconnectedEdge]);
                  }

                  if (reconnectedEdge && options().undoable) {
                    var params = {
                      newEdge: reconnectedEdge,
                      oldEdge: edge
                    };
                    cy.undoRedo().do('removeReconnectedEdge', params);
                    edge = reconnectedEdge;
                  } else if (reconnectedEdge) {
                    cy.remove(edge);
                    edge = reconnectedEdge;
                  }
                } else {
                  var loc = movedEndPoint == 0 ? { source: newNode.id() } : { target: newNode.id() };
                  var oldLoc = movedEndPoint == 0 ? { source: detachedNode.id() } : { target: detachedNode.id() };

                  if (options().undoable && newNode.id() !== detachedNode.id()) {
                    var param = {
                      edge: edge,
                      location: loc,
                      oldLoc: oldLoc
                    };
                    var result = cy.undoRedo().do('reconnectEdge', param);
                    edge = result.edge;
                    //edge.select();
                  }
                }
              }

              // invalid edge reconnection callback
              if (isValid !== 'valid' && typeof actOnUnsuccessfulReconnection === 'function') {
                actOnUnsuccessfulReconnection();
              }
              edge.select();
              cy.remove(dummyNode);
            }
          }
          var type = anchorPointUtilities.getEdgeType(edge);

          // to avoid errors
          if (type === 'inconclusive') {
            type = 'bend';
          }

          if (anchorManager.touchedAnchorIndex === undefined && !anchorCreatedByDrag) {
            moveAnchorParam = undefined;
          }

          var weightStr = anchorPointUtilities.syntax[type]['weight'];
          if (edge !== undefined && moveAnchorParam !== undefined && (edge.data(weightStr) ? edge.data(weightStr).toString() : null) != moveAnchorParam.weights.toString()) {

            // anchor created from drag
            if (anchorCreatedByDrag) {
              edge.select();

              // stops the unbundled bezier edges from being unselected
              cy.autounselectify(true);
            }

            if (options().undoable) {
              cy.undoRedo().do('changeAnchorPoints', moveAnchorParam);
            }
          }

          movedAnchorIndex = undefined;
          movedEdge = undefined;
          moveAnchorParam = undefined;
          createAnchorOnDrag = undefined;
          movedEndPoint = undefined;
          dummyNode = undefined;
          detachedNode = undefined;
          nodeToAttach = undefined;
          tapStartPos = undefined;
          anchorCreatedByDrag = false;

          anchorManager.touchedAnchorIndex = undefined;

          resetGestures();
          setTimeout(function () {
            refreshDraws();
          }, 50);
        });

        //Variables used for starting and ending the movement of anchor points with arrows
        var moveanchorparam;
        var firstAnchor;
        var edgeContainingFirstAnchor;
        var firstAnchorPointFound;
        cy.on("edgeediting.movestart", function (e, edges) {
          firstAnchorPointFound = false;
          if (edges[0] != undefined) {
            edges.forEach(function (edge) {
              if (anchorPointUtilities.getAnchorsAsArray(edge) != undefined && !firstAnchorPointFound) {
                firstAnchor = { x: anchorPointUtilities.getAnchorsAsArray(edge)[0], y: anchorPointUtilities.getAnchorsAsArray(edge)[1] };
                moveanchorparam = {
                  firstTime: true,
                  firstAnchorPosition: {
                    x: firstAnchor.x,
                    y: firstAnchor.y
                  },
                  edges: edges
                };
                edgeContainingFirstAnchor = edge;
                firstAnchorPointFound = true;
              }
            });
          }
        });

        cy.on("edgeediting.moveend", function (e, edges) {
          if (moveanchorparam != undefined) {
            var initialPos = moveanchorparam.firstAnchorPosition;
            var movedFirstAnchor = {
              x: anchorPointUtilities.getAnchorsAsArray(edgeContainingFirstAnchor)[0],
              y: anchorPointUtilities.getAnchorsAsArray(edgeContainingFirstAnchor)[1]
            };

            moveanchorparam.positionDiff = {
              x: -movedFirstAnchor.x + initialPos.x,
              y: -movedFirstAnchor.y + initialPos.y
            };

            delete moveanchorparam.firstAnchorPosition;

            if (options().undoable) {
              cy.undoRedo().do("moveAnchorPoints", moveanchorparam);
            }

            moveanchorparam = undefined;
          }
        });

        cy.on('cxttap', eCxtTap = function eCxtTap(event) {
          var target = event.target || event.cyTarget;
          var targetIsEdge = false;

          try {
            targetIsEdge = target.isEdge();
          } catch (err) {
            // this is here just to suppress the error
          }

          var edge, type;
          if (targetIsEdge) {
            edge = target;
            type = anchorPointUtilities.getEdgeType(edge);
          } else {
            edge = anchorManager.edge;
            type = anchorManager.edgeType;
          }

          var menus = cy.contextMenus('get'); // get context menus instance

          if (!edgeToHighlight || edgeToHighlight.id() != edge.id() || anchorPointUtilities.isIgnoredEdge(edge) || edgeToHighlight !== edge) {
            menus.hideMenuItem(removeBendPointCxtMenuId);
            menus.hideMenuItem(addBendPointCxtMenuId);
            menus.hideMenuItem(removeControlPointCxtMenuId);
            menus.hideMenuItem(addControlPointCxtMenuId);
            return;
          }

          var cyPos = event.position || event.cyPosition;
          var selectedIndex = getContainingShapeIndex(cyPos.x, cyPos.y, edge);
          // not clicked on an anchor
          if (selectedIndex == -1) {
            menus.hideMenuItem(removeBendPointCxtMenuId);
            menus.hideMenuItem(removeControlPointCxtMenuId);
            if (type === 'control' && targetIsEdge) {
              menus.showMenuItem(addControlPointCxtMenuId);
              menus.hideMenuItem(addBendPointCxtMenuId);
            } else if (type === 'bend' && targetIsEdge) {
              menus.showMenuItem(addBendPointCxtMenuId);
              menus.hideMenuItem(addControlPointCxtMenuId);
            } else if (targetIsEdge) {
              menus.showMenuItem(addBendPointCxtMenuId);
              menus.showMenuItem(addControlPointCxtMenuId);
            } else {
              menus.hideMenuItem(addBendPointCxtMenuId);
              menus.hideMenuItem(addControlPointCxtMenuId);
            }
            anchorPointUtilities.currentCtxPos = cyPos;
          }
          // clicked on an anchor
          else {
              menus.hideMenuItem(addBendPointCxtMenuId);
              menus.hideMenuItem(addControlPointCxtMenuId);
              if (type === 'control') {
                menus.showMenuItem(removeControlPointCxtMenuId);
                menus.hideMenuItem(removeBendPointCxtMenuId);
                if (opts.enableMultipleAnchorRemovalOption && edge.hasClass('edgecontrolediting-hasmultiplecontrolpoints')) {
                  menus.showMenuItem(removeAllControlPointCtxMenuId);
                }
              } else if (type === 'bend') {
                menus.showMenuItem(removeBendPointCxtMenuId);
                menus.hideMenuItem(removeControlPointCxtMenuId);
              } else {
                menus.hideMenuItem(removeBendPointCxtMenuId);
                menus.hideMenuItem(removeControlPointCxtMenuId);
                menus.hideMenuItem(removeAllControlPointCtxMenuId);
              }
              anchorPointUtilities.currentAnchorIndex = selectedIndex;
            }

          anchorPointUtilities.currentCtxEdge = edge;
        });

        cy.on('cyedgeediting.changeAnchorPoints', 'edge', function () {
          var edge = this;
          cy.startBatch();
          cy.edges().unselect();

          // Listener defined in other extension
          // Might have compatibility issues after the unbundled bezier    
          cy.trigger('bendPointMovement');

          cy.endBatch();
          refreshDraws();
        });
      }

      var selectedEdges;
      var anchorsMoving = false;

      // track arrow key presses, default false
      // event.keyCode normally returns number
      // but JS will convert to string anyway
      var keys = {
        '37': false,
        '38': false,
        '39': false,
        '40': false
      };

      function keyDown(e) {

        var shouldMove = typeof options().moveSelectedAnchorsOnKeyEvents === 'function' ? options().moveSelectedAnchorsOnKeyEvents() : options().moveSelectedAnchorsOnKeyEvents;

        if (!shouldMove) {
          return;
        }

        //Checks if the tagname is textarea or input
        var tn = document.activeElement.tagName;
        if (tn != "TEXTAREA" && tn != "INPUT") {
          switch (e.keyCode) {
            case 37:case 39:case 38:case 40: // Arrow keys
            case 32:
              e.preventDefault();break; // Space
            default:
              break; // do not block other keys
          }
          if (e.keyCode < '37' || e.keyCode > '40') {
            return;
          }
          keys[e.keyCode] = true;

          //Checks if only edges are selected (not any node) and if only 1 edge is selected
          //If the second checking is removed the anchors of multiple edges would move
          if (cy.edges(":selected").length != cy.elements(":selected").length || cy.edges(":selected").length != 1) {
            return;
          }
          if (!anchorsMoving) {
            selectedEdges = cy.edges(':selected');
            cy.trigger("edgeediting.movestart", [selectedEdges]);
            anchorsMoving = true;
          }
          var moveSpeed = 3;

          // doesn't make sense if alt and shift both pressed
          if (e.altKey && e.shiftKey) {
            return;
          } else if (e.altKey) {
            moveSpeed = 1;
          } else if (e.shiftKey) {
            moveSpeed = 10;
          }

          var upArrowCode = 38;
          var downArrowCode = 40;
          var leftArrowCode = 37;
          var rightArrowCode = 39;

          var dx = 0;
          var dy = 0;

          dx += keys[rightArrowCode] ? moveSpeed : 0;
          dx -= keys[leftArrowCode] ? moveSpeed : 0;
          dy += keys[downArrowCode] ? moveSpeed : 0;
          dy -= keys[upArrowCode] ? moveSpeed : 0;

          moveAnchorPoints({ x: dx, y: dy }, selectedEdges);
        }
      }
      function keyUp(e) {

        if (e.keyCode < '37' || e.keyCode > '40') {
          return;
        }
        e.preventDefault();
        keys[e.keyCode] = false;
        var shouldMove = typeof options().moveSelectedAnchorsOnKeyEvents === 'function' ? options().moveSelectedAnchorsOnKeyEvents() : options().moveSelectedAnchorsOnKeyEvents;

        if (!shouldMove) {
          return;
        }

        cy.trigger("edgeediting.moveend", [selectedEdges]);
        selectedEdges = undefined;
        anchorsMoving = false;
      }
      document.addEventListener("keydown", keyDown, true);
      document.addEventListener("keyup", keyUp, true);

      $container.data('cyedgeediting', data);
    },
    unbind: function unbind() {
      cy.off('remove', 'node', eRemove).off('add', 'node', eAdd).off('style', 'edge.edgebendediting-hasbendpoints:selected, edge.edgecontrolediting-hascontrolpoints:selected', eStyle).off('select', 'edge', eSelect).off('unselect', 'edge', eUnselect).off('tapstart', eTapStart).off('tapstart', 'edge', eTapStartOnEdge).off('tapdrag', eTapDrag).off('tapend', eTapEnd).off('cxttap', eCxtTap).off('drag', 'node', eDrag);

      cy.unbind("zoom pan", eZoom);
    }
  };

  if (functions[fn]) {
    return functions[fn].apply($(cy.container()), Array.prototype.slice.call(arguments, 1));
  } else if ((typeof fn === 'undefined' ? 'undefined' : _typeof(fn)) == 'object' || !fn) {
    return functions.init.apply($(cy.container()), arguments);
  } else {
    $.error('No such function `' + fn + '` for cytoscape.js-edge-editing');
  }

  return $(this);
};

/***/ }),

/***/ 218:
/***/ ((module) => {



var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var debounce = function () {
  /**
   * lodash 3.1.1 (Custom Build) <https://lodash.com/>
   * Build: `lodash modern modularize exports="npm" -o ./`
   * Copyright 2012-2015 The Dojo Foundation <http://dojofoundation.org/>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   * Available under MIT license <https://lodash.com/license>
   */
  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /* Native method references for those with the same name as other `lodash` methods. */
  var nativeMax = Math.max,
      nativeNow = Date.now;

  /**
   * Gets the number of milliseconds that have elapsed since the Unix epoch
   * (1 January 1970 00:00:00 UTC).
   *
   * @static
   * @memberOf _
   * @category Date
   * @example
   *
   * _.defer(function(stamp) {
   *   console.log(_.now() - stamp);
   * }, _.now());
   * // => logs the number of milliseconds it took for the deferred function to be invoked
   */
  var now = nativeNow || function () {
    return new Date().getTime();
  };

  /**
   * Creates a debounced function that delays invoking `func` until after `wait`
   * milliseconds have elapsed since the last time the debounced function was
   * invoked. The debounced function comes with a `cancel` method to cancel
   * delayed invocations. Provide an options object to indicate that `func`
   * should be invoked on the leading and/or trailing edge of the `wait` timeout.
   * Subsequent calls to the debounced function return the result of the last
   * `func` invocation.
   *
   * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked
   * on the trailing edge of the timeout only if the the debounced function is
   * invoked more than once during the `wait` timeout.
   *
   * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)
   * for details over the differences between `_.debounce` and `_.throttle`.
   *
   * @static
   * @memberOf _
   * @category Function
   * @param {Function} func The function to debounce.
   * @param {number} [wait=0] The number of milliseconds to delay.
   * @param {Object} [options] The options object.
   * @param {boolean} [options.leading=false] Specify invoking on the leading
   *  edge of the timeout.
   * @param {number} [options.maxWait] The maximum time `func` is allowed to be
   *  delayed before it's invoked.
   * @param {boolean} [options.trailing=true] Specify invoking on the trailing
   *  edge of the timeout.
   * @returns {Function} Returns the new debounced function.
   * @example
   *
   * // avoid costly calculations while the window size is in flux
   * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
   *
   * // invoke `sendMail` when the click event is fired, debouncing subsequent calls
   * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {
   *   'leading': true,
   *   'trailing': false
   * }));
   *
   * // ensure `batchLog` is invoked once after 1 second of debounced calls
   * var source = new EventSource('/stream');
   * jQuery(source).on('message', _.debounce(batchLog, 250, {
   *   'maxWait': 1000
   * }));
   *
   * // cancel a debounced call
   * var todoChanges = _.debounce(batchLog, 1000);
   * Object.observe(models.todo, todoChanges);
   *
   * Object.observe(models, function(changes) {
   *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {
   *     todoChanges.cancel();
   *   }
   * }, ['delete']);
   *
   * // ...at some point `models.todo` is changed
   * models.todo.completed = true;
   *
   * // ...before 1 second has passed `models.todo` is deleted
   * // which cancels the debounced `todoChanges` call
   * delete models.todo;
   */
  function debounce(func, wait, options) {
    var args,
        maxTimeoutId,
        result,
        stamp,
        thisArg,
        timeoutId,
        trailingCall,
        lastCalled = 0,
        maxWait = false,
        trailing = true;

    if (typeof func != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    wait = wait < 0 ? 0 : +wait || 0;
    if (options === true) {
      var leading = true;
      trailing = false;
    } else if (isObject(options)) {
      leading = !!options.leading;
      maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);
      trailing = 'trailing' in options ? !!options.trailing : trailing;
    }

    function cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
      }
      lastCalled = 0;
      maxTimeoutId = timeoutId = trailingCall = undefined;
    }

    function complete(isCalled, id) {
      if (id) {
        clearTimeout(id);
      }
      maxTimeoutId = timeoutId = trailingCall = undefined;
      if (isCalled) {
        lastCalled = now();
        result = func.apply(thisArg, args);
        if (!timeoutId && !maxTimeoutId) {
          args = thisArg = undefined;
        }
      }
    }

    function delayed() {
      var remaining = wait - (now() - stamp);
      if (remaining <= 0 || remaining > wait) {
        complete(trailingCall, maxTimeoutId);
      } else {
        timeoutId = setTimeout(delayed, remaining);
      }
    }

    function maxDelayed() {
      complete(trailing, timeoutId);
    }

    function debounced() {
      args = arguments;
      stamp = now();
      thisArg = this;
      trailingCall = trailing && (timeoutId || !leading);

      if (maxWait === false) {
        var leadingCall = leading && !timeoutId;
      } else {
        if (!maxTimeoutId && !leading) {
          lastCalled = stamp;
        }
        var remaining = maxWait - (stamp - lastCalled),
            isCalled = remaining <= 0 || remaining > maxWait;

        if (isCalled) {
          if (maxTimeoutId) {
            maxTimeoutId = clearTimeout(maxTimeoutId);
          }
          lastCalled = stamp;
          result = func.apply(thisArg, args);
        } else if (!maxTimeoutId) {
          maxTimeoutId = setTimeout(maxDelayed, remaining);
        }
      }
      if (isCalled && timeoutId) {
        timeoutId = clearTimeout(timeoutId);
      } else if (!timeoutId && wait !== maxWait) {
        timeoutId = setTimeout(delayed, wait);
      }
      if (leadingCall) {
        isCalled = true;
        result = func.apply(thisArg, args);
      }
      if (isCalled && !timeoutId && !maxTimeoutId) {
        args = thisArg = undefined;
      }
      return result;
    }

    debounced.cancel = cancel;
    return debounced;
  }

  /**
   * Checks if `value` is the [language type](https://es5.github.io/#x8) of `Object`.
   * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(1);
   * // => false
   */
  function isObject(value) {
    // Avoid a V8 JIT bug in Chrome 19-20.
    // See https://code.google.com/p/v8/issues/detail?id=2291 for more details.
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    return !!value && (type == 'object' || type == 'function');
  }

  return debounce;
}();

module.exports = debounce;

/***/ }),

/***/ 579:
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;

;(function () {
  'use strict';

  var anchorPointUtilities = __webpack_require__(964);
  var debounce = __webpack_require__(218);

  // registers the extension on a cytoscape lib ref
  var register = function register(cytoscape, $, Konva) {
    var uiUtilities = __webpack_require__(347);

    if (!cytoscape || !$ || !Konva) {
      return;
    } // can't register if required libraries unspecified

    var defaults = {
      // this function specifies the poitions of bend points
      // strictly name the property 'bendPointPositions' for the edge to be detected for bend point edititng
      bendPositionsFunction: function bendPositionsFunction(ele) {
        return ele.data('bendPointPositions');
      },
      // this function specifies the poitions of control points
      // strictly name the property 'controlPointPositions' for the edge to be detected for control point edititng
      controlPositionsFunction: function controlPositionsFunction(ele) {
        return ele.data('controlPointPositions');
      },
      // whether to initilize bend and control points on creation of this extension automatically
      initAnchorsAutomatically: true,
      // the classes of those edges that should be ignored
      ignoredClasses: [],
      // whether the bend and control editing operations are undoable (requires cytoscape-undo-redo.js)
      undoable: false,
      // the size of bend and control point shape is obtained by multipling width of edge with this parameter
      anchorShapeSizeFactor: 3,
      //size of anchorpoint can be auto changed to compensate the impact of cy zooming level
      enableAnchorSizeNotImpactByZoom: false,
      // z-index value of the canvas in which bend and control points are drawn
      zIndex: 999,
      // whether to start the plugin in the enabled state
      enabled: true,
      //An option that controls the distance within which a bend point is considered "near" the line segment between its two neighbors and will be automatically removed
      bendRemovalSensitivity: 8,
      // title of add bend point menu item (User may need to adjust width of menu items according to length of this option)
      addBendMenuItemTitle: "Add Bend Point",
      // title of remove bend point menu item (User may need to adjust width of menu items according to length of this option)
      removeBendMenuItemTitle: "Remove Bend Point",
      // title of remove all bend points menu item
      removeAllBendMenuItemTitle: "Remove All Bend Points",
      // title of add control point menu item (User may need to adjust width of menu items according to length of this option)
      addControlMenuItemTitle: "Add Control Point",
      // title of remove control point menu item (User may need to adjust width of menu items according to length of this option)
      removeControlMenuItemTitle: "Remove Control Point",
      // title of remove all control points menu item
      removeAllControlMenuItemTitle: "Remove All Control Points",
      // whether the bend and control points can be moved by arrows
      moveSelectedAnchorsOnKeyEvents: function moveSelectedAnchorsOnKeyEvents() {
        return true;
      },
      // whether 'Remove all bend points' and 'Remove all control points' options should be presented
      enableMultipleAnchorRemovalOption: false,
      // whether allows adding bending point by draging edge without useing ctxmenu, default is true
      enableCreateAnchorOnDrag: true,
      // how to smartly move the anchor point to perfect 0 45 or 90 degree position, unit is px
      stickyAnchorTolerence: -1, //-1 actually disable this feature, change it to 20 to test the feature
      //automatically remove anchor if its prev segement and next segment is almost in a same line
      enableRemoveAnchorMidOfNearLine: true
    };

    var options;
    var initialized = false;

    // Merge default options with the ones coming from parameter
    function extend(defaults, options) {
      var obj = {};

      for (var i in defaults) {
        obj[i] = defaults[i];
      }

      for (var i in options) {
        // SPLIT FUNCTIONALITY?
        if (i == "bendRemovalSensitivity") {
          var value = options[i];
          if (!isNaN(value)) {
            if (value >= 0 && value <= 20) {
              obj[i] = options[i];
            } else if (value < 0) {
              obj[i] = 0;
            } else {
              obj[i] = 20;
            }
          }
        } else {
          obj[i] = options[i];
        }
      }

      return obj;
    };

    cytoscape('core', 'edgeEditing', function (opts) {
      var cy = this;

      if (opts === 'initialized') {
        return initialized;
      }

      if (opts !== 'get') {
        // merge the options with default ones
        options = extend(defaults, opts);
        initialized = true;

        // define edgebendediting-hasbendpoints css class
        cy.style().selector('.edgebendediting-hasbendpoints').css({
          'curve-style': 'segments',
          'segment-distances': function segmentDistances(ele) {
            return anchorPointUtilities.getDistancesString(ele, 'bend');
          },
          'segment-weights': function segmentWeights(ele) {
            return anchorPointUtilities.getWeightsString(ele, 'bend');
          },
          'edge-distances': 'node-position'
        });

        // define edgecontrolediting-hascontrolpoints css class
        cy.style().selector('.edgecontrolediting-hascontrolpoints').css({
          'curve-style': 'unbundled-bezier',
          'control-point-distances': function controlPointDistances(ele) {
            return anchorPointUtilities.getDistancesString(ele, 'control');
          },
          'control-point-weights': function controlPointWeights(ele) {
            return anchorPointUtilities.getWeightsString(ele, 'control');
          },
          'edge-distances': 'node-position'
        });

        anchorPointUtilities.setIgnoredClasses(options.ignoredClasses);

        // init bend positions conditionally
        if (options.initAnchorsAutomatically) {
          // CHECK THIS, options.ignoredClasses UNUSED
          anchorPointUtilities.initAnchorPoints(options.bendPositionsFunction, options.controlPositionsFunction, cy.edges(), options.ignoredClasses);
        }

        if (options.enabled) uiUtilities(options, cy);else uiUtilities("unbind", cy);
      }

      var instance = initialized ? {
        /*
        * get bend or control points of the given edge in an array A,
        * A[2 * i] is the x coordinate and A[2 * i + 1] is the y coordinate
        * of the ith bend point. (Returns undefined if the curve style is not segments nor unbundled bezier)
        */
        getAnchorsAsArray: function getAnchorsAsArray(ele) {
          return anchorPointUtilities.getAnchorsAsArray(ele);
        },
        storeAnchorsAbsolutePosition: function storeAnchorsAbsolutePosition(draggingNodes) {
          anchorPointUtilities.storeAnchorsAbsolutePosition(draggingNodes);
        },
        resetAnchorsAbsolutePosition: function resetAnchorsAbsolutePosition() {
          anchorPointUtilities.resetAnchorsAbsolutePosition();
        },
        keepAnchorsAbsolutePositionDuringMoving: function keepAnchorsAbsolutePositionDuringMoving() {
          anchorPointUtilities.keepAnchorsAbsolutePositionDuringMoving();
        },

        // Initilize points for the given edges using 'options.bendPositionsFunction'
        initAnchorPoints: function initAnchorPoints(eles) {
          anchorPointUtilities.initAnchorPoints(options.bendPositionsFunction, options.controlPositionsFunction, eles);
        },
        deleteSelectedAnchor: function deleteSelectedAnchor(ele, index) {
          anchorPointUtilities.removeAnchor(ele, index);
        }
      } : undefined;

      return instance; // chainability
    });
  };

  if ( true && module.exports) {
    // expose as a commonjs module
    module.exports = register;
  }

  if (true) {
    // expose as an amd/requirejs module
    !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
      return register;
    }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  }

  if (typeof cytoscape !== 'undefined' && $ && Konva) {
    // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape, $, Konva);
  }
})();

/***/ }),

/***/ 171:
/***/ ((module) => {



var reconnectionUtilities = {

    // creates and returns a dummy node which is connected to the disconnected edge
    disconnectEdge: function disconnectEdge(edge, cy, position, disconnectedEnd) {

        var dummyNode = {
            data: {
                id: 'nwt_reconnectEdge_dummy',
                ports: []
            },
            style: {
                width: 1,
                height: 1,
                'visibility': 'hidden'
            },
            renderedPosition: position
        };
        cy.add(dummyNode);

        var loc = disconnectedEnd === 'source' ? { source: dummyNode.data.id } : { target: dummyNode.data.id };

        edge = edge.move(loc)[0];

        return {
            dummyNode: cy.nodes("#" + dummyNode.data.id)[0],
            edge: edge
        };
    },

    connectEdge: function connectEdge(edge, node, location) {
        if (!edge.isEdge() || !node.isNode()) return;

        var loc = {};
        if (location === 'source') loc.source = node.id();else if (location === 'target') loc.target = node.id();else return;

        return edge.move(loc)[0];
    },

    copyEdge: function copyEdge(oldEdge, newEdge) {
        this.copyAnchors(oldEdge, newEdge);
        this.copyStyle(oldEdge, newEdge);
    },

    copyStyle: function copyStyle(oldEdge, newEdge) {
        if (oldEdge && newEdge) {
            newEdge.data('line-color', oldEdge.data('line-color'));
            newEdge.data('width', oldEdge.data('width'));
            newEdge.data('cardinality', oldEdge.data('cardinality'));
        }
    },

    copyAnchors: function copyAnchors(oldEdge, newEdge) {
        if (oldEdge.hasClass('edgebendediting-hasbendpoints')) {
            var bpDistances = oldEdge.data('cyedgebendeditingDistances');
            var bpWeights = oldEdge.data('cyedgebendeditingWeights');

            newEdge.data('cyedgebendeditingDistances', bpDistances);
            newEdge.data('cyedgebendeditingWeights', bpWeights);
            newEdge.addClass('edgebendediting-hasbendpoints');
        } else if (oldEdge.hasClass('edgecontrolediting-hascontrolpoints')) {
            var bpDistances = oldEdge.data('cyedgecontroleditingDistances');
            var bpWeights = oldEdge.data('cyedgecontroleditingWeights');

            newEdge.data('cyedgecontroleditingDistances', bpDistances);
            newEdge.data('cyedgecontroleditingWeights', bpWeights);
            newEdge.addClass('edgecontrolediting-hascontrolpoints');
        }
        if (oldEdge.hasClass('edgebendediting-hasmultiplebendpoints')) {
            newEdge.addClass('edgebendediting-hasmultiplebendpoints');
        } else if (oldEdge.hasClass('edgecontrolediting-hasmultiplecontrolpoints')) {
            newEdge.addClass('edgecontrolediting-hasmultiplecontrolpoints');
        }
    }
};

module.exports = reconnectionUtilities;

/***/ }),

/***/ 961:
/***/ ((module) => {



module.exports = function (cy, anchorPointUtilities, params) {
  if (cy.undoRedo == null) return;

  var ur = cy.undoRedo({
    defaultActions: false,
    isDebug: true
  });

  function changeAnchorPoints(param) {
    var edge = cy.getElementById(param.edge.id());
    var type = param.type !== 'inconclusive' ? param.type : anchorPointUtilities.getEdgeType(edge);

    var weights, distances, weightStr, distanceStr;

    if (param.type === 'inconclusive' && !param.set) {
      weights = [];
      distances = [];
    } else {
      weightStr = anchorPointUtilities.syntax[type]['weight'];
      distanceStr = anchorPointUtilities.syntax[type]['distance'];

      weights = param.set ? edge.data(weightStr) : param.weights;
      distances = param.set ? edge.data(distanceStr) : param.distances;
    }

    var result = {
      edge: edge,
      type: type,
      weights: weights,
      distances: distances,
      //As the result will not be used for the first function call params should be used to set the data
      set: true
    };

    //Check if we need to set the weights and distances by the param values
    if (param.set) {
      var hadAnchorPoint = param.weights && param.weights.length > 0;
      var hadMultipleAnchorPoints = hadAnchorPoint && param.weights.length > 1;

      hadAnchorPoint ? edge.data(weightStr, param.weights) : edge.removeData(weightStr);
      hadAnchorPoint ? edge.data(distanceStr, param.distances) : edge.removeData(distanceStr);

      var singleClassName = anchorPointUtilities.syntax[type]['class'];
      var multiClassName = anchorPointUtilities.syntax[type]['multiClass'];

      // Refresh the curve style as the number of anchor point would be changed by the previous operation
      // Adding or removing multi classes at once can cause errors. If multiple classes are to be added,
      // just add them together in space delimeted class names format.
      if (!hadAnchorPoint && !hadMultipleAnchorPoints) {
        // Remove multiple classes from edge with space delimeted string of class names 
        edge.removeClass(singleClassName + " " + multiClassName);
      } else if (hadAnchorPoint && !hadMultipleAnchorPoints) {
        // Had single anchor
        edge.addClass(singleClassName);
        edge.removeClass(multiClassName);
      } else {
        // Had multiple anchors. Add multiple classes with space delimeted string of class names
        edge.addClass(singleClassName + " " + multiClassName);
      }
      if (!edge.selected()) edge.select();else {
        edge.unselect();
        edge.select();
      }
    }

    edge.trigger('cyedgeediting.changeAnchorPoints');

    return result;
  }

  function moveDo(arg) {
    if (arg.firstTime) {
      delete arg.firstTime;
      return arg;
    }

    var edges = arg.edges;
    var positionDiff = arg.positionDiff;
    var result = {
      edges: edges,
      positionDiff: {
        x: -positionDiff.x,
        y: -positionDiff.y
      }
    };
    moveAnchorsUndoable(positionDiff, edges);

    return result;
  }

  function moveAnchorsUndoable(positionDiff, edges) {
    edges.forEach(function (edge) {
      var type = anchorPointUtilities.getEdgeType(edge);
      var previousAnchorsPosition = anchorPointUtilities.getAnchorsAsArray(edge);
      var nextAnchorsPosition = [];
      if (previousAnchorsPosition != undefined) {
        for (var i = 0; i < previousAnchorsPosition.length; i += 2) {
          nextAnchorsPosition.push({ x: previousAnchorsPosition[i] + positionDiff.x, y: previousAnchorsPosition[i + 1] + positionDiff.y });
        }
        edge.data(anchorPointUtilities.syntax[type]['pointPos'], nextAnchorsPosition);
      }
    });

    anchorPointUtilities.initAnchorPoints(params.bendPositionsFunction, params.controlPositionsFunction, edges);
  }

  function reconnectEdge(param) {
    var edge = param.edge;
    var location = param.location;
    var oldLoc = param.oldLoc;

    edge = edge.move(location)[0];

    var result = {
      edge: edge,
      location: oldLoc,
      oldLoc: location
    };
    edge.unselect();
    return result;
  }

  function removeReconnectedEdge(param) {
    var oldEdge = param.oldEdge;
    var tmp = cy.getElementById(oldEdge.data('id'));
    if (tmp && tmp.length > 0) oldEdge = tmp;

    var newEdge = param.newEdge;
    var tmp = cy.getElementById(newEdge.data('id'));
    if (tmp && tmp.length > 0) newEdge = tmp;

    if (oldEdge.inside()) {
      oldEdge = oldEdge.remove()[0];
    }

    if (newEdge.removed()) {
      newEdge = newEdge.restore();
      newEdge.unselect();
    }

    return {
      oldEdge: newEdge,
      newEdge: oldEdge
    };
  }

  ur.action('changeAnchorPoints', changeAnchorPoints, changeAnchorPoints);
  ur.action('moveAnchorPoints', moveDo, moveDo);
  ur.action('reconnectEdge', reconnectEdge, reconnectEdge);
  ur.action('removeReconnectedEdge', removeReconnectedEdge, removeReconnectedEdge);
};

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(579);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jeXRvc2NhcGVFZGdlRWRpdGluZy93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvQW5jaG9yUG9pbnRVdGlsaXRpZXMuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvVUlVdGlsaXRpZXMuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvZGVib3VuY2UuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvcmVjb25uZWN0aW9uVXRpbGl0aWVzLmpzIiwid2VicGFjazovL2N5dG9zY2FwZUVkZ2VFZGl0aW5nLy4vc3JjL3JlZ2lzdGVyVW5kb1JlZG9GdW5jdGlvbnMuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbImFuY2hvclBvaW50VXRpbGl0aWVzIiwiY3VycmVudEN0eEVkZ2UiLCJ1bmRlZmluZWQiLCJjdXJyZW50Q3R4UG9zIiwiY3VycmVudEFuY2hvckluZGV4IiwiY3VycmVudEVkZ2VzRm9yRml4QW5jaG9yUG9zaXRpb25zIiwiaWdub3JlZENsYXNzZXMiLCJzZXRJZ25vcmVkQ2xhc3NlcyIsIl9pZ25vcmVkQ2xhc3NlcyIsInN5bnRheCIsImJlbmQiLCJlZGdlIiwiY2xhc3MiLCJtdWx0aUNsYXNzIiwid2VpZ2h0IiwiZGlzdGFuY2UiLCJ3ZWlnaHRDc3MiLCJkaXN0YW5jZUNzcyIsInBvaW50UG9zIiwiYmVuZEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uIiwiY29udHJvbCIsImdldEVkZ2VUeXBlIiwiaGFzQ2xhc3MiLCJjc3MiLCJkYXRhIiwibGVuZ3RoIiwiaW5pdEFuY2hvclBvaW50cyIsImJlbmRQb3NpdGlvbnNGY24iLCJjb250cm9sUG9zaXRpb25zRmNuIiwiZWRnZXMiLCJpIiwidHlwZSIsImlzSWdub3JlZEVkZ2UiLCJhbmNob3JQb3NpdGlvbnMiLCJhcHBseSIsInJlc3VsdCIsImNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb25zIiwiZGlzdGFuY2VzIiwid2VpZ2h0cyIsImFkZENsYXNzIiwic3RhcnRYIiwic291cmNlIiwicG9zaXRpb24iLCJzdGFydFkiLCJlbmRYIiwidGFyZ2V0IiwiZW5kWSIsImlkIiwiZ2V0TGluZURpcmVjdGlvbiIsInNyY1BvaW50IiwidGd0UG9pbnQiLCJzcmNZIiwieSIsInNyY1giLCJ4IiwidGd0WSIsInRndFgiLCJjb21wYXJlRXF1YWwiLCJ2MSIsInYyIiwiTWF0aCIsImFicyIsImdldFNyY1RndFBvaW50c0FuZFRhbmdlbnRzIiwic291cmNlTm9kZSIsInRhcmdldE5vZGUiLCJ0Z3RQb3NpdGlvbiIsInNyY1Bvc2l0aW9uIiwibTEiLCJtMiIsImdldEludGVyc2VjdGlvbiIsInBvaW50Iiwic3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMiLCJpbnRlcnNlY3RYIiwiaW50ZXJzZWN0WSIsIkluZmluaXR5IiwiYTEiLCJhMiIsImludGVyc2VjdGlvblBvaW50IiwiZ2V0QW5jaG9yc0FzQXJyYXkiLCJhbmNob3JMaXN0IiwicHN0eWxlIiwicGZWYWx1ZSIsIm1pbkxlbmd0aHMiLCJtaW4iLCJzIiwiYW5BbmNob3JQb3NpdGlvbiIsImNvbnZlcnRUb0FuY2hvckFic29sdXRlUG9zaXRpb25zIiwicHVzaCIsInJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb24iLCJzdG9yZUFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uIiwiZHJhZ2dpbmdOb2RlcyIsImltcGFjdEVkZ2VzIiwiY29ubmVjdGVkRWRnZXMiLCJleGNsdWRlRWRnZXMiLCJlZGdlc1dpdGgiLCJ1bm1lcmdlIiwiZm9yRWFjaCIsImFyciIsIm9uZUVkZ2UiLCJwb3NpdGlvbnNBcnIiLCJrZWVwQW5jaG9yc0Fic29sdXRlUG9zaXRpb25EdXJpbmdNb3ZpbmciLCJzdG9yZWRQb3NpdGlvbiIsImFuY2hvckluZGV4Iiwic3JjUG9zIiwidGd0UG9zIiwidyIsImQiLCJkeSIsImR4IiwibCIsInNxcnQiLCJ2ZWN0b3IiLCJ2ZWN0b3JOb3JtIiwidmVjdG9yTm9ybUludmVyc2UiLCJ3MSIsIncyIiwibWlkWCIsIm1pZFkiLCJhYnNvbHV0ZVgiLCJhYnNvbHV0ZVkiLCJvYnRhaW5QcmV2QW5jaG9yQWJzb2x1dGVQb3NpdGlvbnMiLCJvYnRhaW5OZXh0QW5jaG9yQWJzb2x1dGVQb3NpdGlvbnMiLCJjb252ZXJ0VG9SZWxhdGl2ZVBvc2l0aW9uIiwicG93IiwiZGlyZWN0aW9uMSIsImRpcmVjdGlvbjIiLCJhbmNob3JQb2ludHMiLCJhbmNob3IiLCJyZWxhdGl2ZUFuY2hvclBvc2l0aW9uIiwiZ2V0RGlzdGFuY2VzU3RyaW5nIiwic3RyIiwiZ2V0V2VpZ2h0c1N0cmluZyIsImFkZEFuY2hvclBvaW50IiwibmV3QW5jaG9yUG9pbnQiLCJ3ZWlnaHRTdHIiLCJkaXN0YW5jZVN0ciIsInJlbGF0aXZlUG9zaXRpb24iLCJvcmlnaW5hbEFuY2hvcldlaWdodCIsInN0YXJ0V2VpZ2h0IiwiZW5kV2VpZ2h0Iiwid2VpZ2h0c1dpdGhUZ3RTcmMiLCJjb25jYXQiLCJhbmNob3JzTGlzdCIsIm1pbkRpc3QiLCJpbnRlcnNlY3Rpb24iLCJwdHNXaXRoVGd0U3JjIiwibmV3QW5jaG9ySW5kZXgiLCJiMSIsImNvbXBhcmVXaXRoUHJlY2lzaW9uIiwiYjIiLCJiMyIsImI0Iiwic3RhcnQiLCJlbmQiLCJjdXJyZW50SW50ZXJzZWN0aW9uIiwiZGlzdCIsInNwbGljZSIsInJlbW92ZUFuY2hvciIsImVkZ2VUeXBlSW5jb25jbHVzaXZlU2hvdWxkbnRIYXBwZW4iLCJwb3NpdGlvbkRhdGFTdHIiLCJwb3NpdGlvbnMiLCJyZW1vdmVDbGFzcyIsInJlbW92ZUFsbEFuY2hvcnMiLCJjYWxjdWxhdGVEaXN0YW5jZSIsInB0MSIsInB0MiIsImRpZmZYIiwiZGlmZlkiLCJuMSIsIm4yIiwiaXNMZXNzVGhlbk9yRXF1YWwiLCJwcmVjaXNpb24iLCJkaWZmIiwicGxhY2UiLCJjb25zb2xlIiwibG9nIiwibW9kdWxlIiwiZXhwb3J0cyIsImRlYm91bmNlIiwicmVxdWlyZSIsInJlY29ubmVjdGlvblV0aWxpdGllcyIsInJlZ2lzdGVyVW5kb1JlZG9GdW5jdGlvbnMiLCJzdGFnZUlkIiwicGFyYW1zIiwiY3kiLCJmbiIsImFkZEJlbmRQb2ludEN4dE1lbnVJZCIsInJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCIsInJlbW92ZUFsbEJlbmRQb2ludEN0eE1lbnVJZCIsImFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCIsInJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCIsInJlbW92ZUFsbENvbnRyb2xQb2ludEN0eE1lbnVJZCIsImVTdHlsZSIsImVSZW1vdmUiLCJlQWRkIiwiZVpvb20iLCJlU2VsZWN0IiwiZVVuc2VsZWN0IiwiZVRhcFN0YXJ0IiwiZVRhcFN0YXJ0T25FZGdlIiwiZVRhcERyYWciLCJlVGFwRW5kIiwiZUN4dFRhcCIsImVEcmFnIiwibGFzdFBhbm5pbmdFbmFibGVkIiwibGFzdFpvb21pbmdFbmFibGVkIiwibGFzdEJveFNlbGVjdGlvbkVuYWJsZWQiLCJsYXN0QWN0aXZlQmdPcGFjaXR5IiwiZWRnZVRvSGlnaGxpZ2h0IiwibnVtYmVyT2ZTZWxlY3RlZEVkZ2VzIiwiZW5kcG9pbnRTaGFwZTEiLCJlbmRwb2ludFNoYXBlMiIsImFuY2hvclRvdWNoZWQiLCJtb3VzZU91dCIsImZ1bmN0aW9ucyIsImluaXQiLCJzZWxmIiwib3B0cyIsIiRjb250YWluZXIiLCIkIiwiY2FudmFzRWxlbWVudElkIiwiJGNhbnZhc0VsZW1lbnQiLCJmaW5kIiwiYXBwZW5kIiwic3RhZ2UiLCJLb252YSIsInN0YWdlcyIsIlN0YWdlIiwiY29udGFpbmVyIiwid2lkdGgiLCJoZWlnaHQiLCJjYW52YXMiLCJnZXRDaGlsZHJlbiIsIkxheWVyIiwiYWRkIiwiYW5jaG9yTWFuYWdlciIsImVkZ2VUeXBlIiwiYW5jaG9ycyIsInRvdWNoZWRBbmNob3IiLCJ0b3VjaGVkQW5jaG9ySW5kZXgiLCJiaW5kTGlzdGVuZXJzIiwib24iLCJlTW91c2VEb3duIiwidW5iaW5kTGlzdGVuZXJzIiwib2ZmIiwiZXZlbnQiLCJhdXRvdW5zZWxlY3RpZnkiLCJ1bnNlbGVjdCIsIm1vdmVBbmNob3JQYXJhbSIsInR1cm5PZmZBY3RpdmVCZ0NvbG9yIiwiZGlzYWJsZUdlc3R1cmVzIiwiYXV0b3VuZ3JhYmlmeSIsImdldFN0YWdlIiwiZU1vdXNlVXAiLCJlTW91c2VPdXQiLCJzZWxlY3QiLCJyZXNldEFjdGl2ZUJnQ29sb3IiLCJyZXNldEdlc3R1cmVzIiwiY2xlYXJBbmNob3JzRXhjZXB0IiwiZG9udENsZWFuIiwiZXhjZXB0aW9uQXBwbGllcyIsImluZGV4IiwiZGVzdHJveSIsInJlbmRlckFuY2hvclNoYXBlcyIsImdldEFuY2hvclNoYXBlc0xlbmd0aCIsImFuY2hvclgiLCJhbmNob3JZIiwicmVuZGVyQW5jaG9yU2hhcGUiLCJkcmF3IiwidG9wTGVmdFgiLCJ0b3BMZWZ0WSIsInJlbmRlcmVkVG9wTGVmdFBvcyIsImNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24iLCJ6b29tIiwibmV3QW5jaG9yIiwiUmVjdCIsImZpbGwiLCJzdHJva2VXaWR0aCIsImRyYWdnYWJsZSIsImN4dEFkZEJlbmRGY24iLCJjeHRBZGRBbmNob3JGY24iLCJjeHRBZGRDb250cm9sRmNuIiwiYW5jaG9yVHlwZSIsImN5VGFyZ2V0IiwicGFyYW0iLCJvcHRpb25zIiwidW5kb2FibGUiLCJ1bmRvUmVkbyIsImRvIiwicmVmcmVzaERyYXdzIiwiY3h0UmVtb3ZlQW5jaG9yRmNuIiwic2V0VGltZW91dCIsImN4dFJlbW92ZUFsbEFuY2hvcnNGY24iLCJoYW5kbGVSZWNvbm5lY3RFZGdlIiwidmFsaWRhdGVFZGdlIiwiYWN0T25VbnN1Y2Nlc3NmdWxSZWNvbm5lY3Rpb24iLCJtZW51SXRlbXMiLCJjb250ZW50IiwiYWRkQmVuZE1lbnVJdGVtVGl0bGUiLCJzZWxlY3RvciIsIm9uQ2xpY2tGdW5jdGlvbiIsInJlbW92ZUJlbmRNZW51SXRlbVRpdGxlIiwicmVtb3ZlQWxsQmVuZE1lbnVJdGVtVGl0bGUiLCJlbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb24iLCJhZGRDb250cm9sTWVudUl0ZW1UaXRsZSIsImNvcmVBc1dlbGwiLCJyZW1vdmVDb250cm9sTWVudUl0ZW1UaXRsZSIsInJlbW92ZUFsbENvbnRyb2xNZW51SXRlbVRpdGxlIiwiY29udGV4dE1lbnVzIiwibWVudXMiLCJpc0FjdGl2ZSIsImFwcGVuZE1lbnVJdGVtcyIsIl9zaXplQ2FudmFzIiwiYXR0ciIsInpJbmRleCIsImNhbnZhc0JiIiwib2Zmc2V0IiwiY29udGFpbmVyQmIiLCJ0b3AiLCJsZWZ0Iiwic2V0V2lkdGgiLCJzZXRIZWlnaHQiLCJzaXplQ2FudmFzIiwid2luZG93IiwiYmluZCIsIm9wdENhY2hlIiwibW9kZWxQb3NpdGlvbiIsInBhbiIsInJlbmRlckVuZFBvaW50U2hhcGVzIiwiZWRnZV9wdHMiLCJzb3VyY2VQb3MiLCJzb3VyY2VFbmRwb2ludCIsInRhcmdldFBvcyIsInRhcmdldEVuZHBvaW50IiwidW5zaGlmdCIsInNyYyIsIm5leHRUb1NvdXJjZSIsIm5leHRUb1RhcmdldCIsInJlbmRlckVhY2hFbmRQb2ludFNoYXBlIiwic1RvcExlZnRYIiwic1RvcExlZnRZIiwidFRvcExlZnRYIiwidFRvcExlZnRZIiwibmV4dFRvU291cmNlWCIsIm5leHRUb1NvdXJjZVkiLCJuZXh0VG9UYXJnZXRYIiwibmV4dFRvVGFyZ2V0WSIsInJlbmRlcmVkU291cmNlUG9zIiwicmVuZGVyZWRUYXJnZXRQb3MiLCJyZW5kZXJlZE5leHRUb1NvdXJjZSIsInJlbmRlcmVkTmV4dFRvVGFyZ2V0IiwiZGlzdGFuY2VGcm9tTm9kZSIsImRpc3RhbmNlU291cmNlIiwic291cmNlRW5kUG9pbnRYIiwic291cmNlRW5kUG9pbnRZIiwiZGlzdGFuY2VUYXJnZXQiLCJ0YXJnZXRFbmRQb2ludFgiLCJ0YXJnZXRFbmRQb2ludFkiLCJDaXJjbGUiLCJyYWRpdXMiLCJmYWN0b3IiLCJhbmNob3JTaGFwZVNpemVGYWN0b3IiLCJlbmFibGVBbmNob3JTaXplTm90SW1wYWN0Qnlab29tIiwiYWN0dWFsRmFjdG9yIiwicGFyc2VGbG9hdCIsImNoZWNrSWZJbnNpZGVTaGFwZSIsImNlbnRlclgiLCJjZW50ZXJZIiwibWluWCIsIm1heFgiLCJtaW5ZIiwibWF4WSIsImluc2lkZSIsImdldENvbnRhaW5pbmdTaGFwZUluZGV4IiwiZ2V0Q29udGFpbmluZ0VuZFBvaW50IiwiYWxsUHRzIiwiX3ByaXZhdGUiLCJyc2NyYXRjaCIsImFsbHB0cyIsInBhbm5pbmdFbmFibGVkIiwiem9vbWluZ0VuYWJsZWQiLCJib3hTZWxlY3Rpb25FbmFibGVkIiwic3R5bGUiLCJjb3JlU3R5bGUiLCJ2YWx1ZSIsInVwZGF0ZSIsIm1vdmVBbmNob3JQb2ludHMiLCJwb3NpdGlvbkRpZmYiLCJwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiIsIm5leHRBbmNob3JQb2ludHNQb3NpdGlvbiIsImJlbmRQb3NpdGlvbnNGdW5jdGlvbiIsImNvbnRyb2xQb3NpdGlvbnNGdW5jdGlvbiIsInRyaWdnZXIiLCJfY2FsY0Nvc3RUb1ByZWZlcnJlZFBvc2l0aW9uIiwicDEiLCJwMiIsImN1cnJlbnRBbmdsZSIsImF0YW4yIiwicGVyZmVjdEFuZ2xlIiwiUEkiLCJkZWx0YUFuZ2xlIiwiYW5nbGUiLCJpbmRleE9mTWluIiwiaW5kZXhPZiIsImNvc3QiLCJzaW4iLCJjaG9zZW5BbmdsZSIsImVkZ2VMIiwiY29zIiwidGFyZ2V0UG9pbnRYIiwidGFyZ2V0UG9pbnRZIiwibW92ZUFuY2hvck9uRHJhZyIsInByZXZQb2ludFBvc2l0aW9uIiwibmV4dFBvaW50UG9zaXRpb24iLCJtb3VzZVBvc2l0aW9uIiwianVkZ2VQcmV2IiwianVkZ2VOZXh0IiwiZGVjaXNpb25PYmoiLCJ6b29tTGV2ZWwiLCJjb3N0RGlzdGFuY2UiLCJzdGlja3lBbmNob3JUb2xlcmVuY2UiLCJhbmdsZTEiLCJhbmdsZTIiLCJwcmV2WCIsInByZXZZIiwibmV4WCIsIm5leFkiLCJmeCIsImZ5Iiwic3giLCJzeSIsImEiLCJiIiwiX21vdmVBbmNob3JPbkRyYWciLCJzZWxlY3RlZEVkZ2VzIiwic2VsZWN0ZWQiLCJzdGFydEJhdGNoIiwiZW5kQmF0Y2giLCJtb3ZlZEFuY2hvckluZGV4IiwidGFwU3RhcnRQb3MiLCJtb3ZlZEVkZ2UiLCJjcmVhdGVBbmNob3JPbkRyYWciLCJtb3ZlZEVuZFBvaW50IiwiZHVtbXlOb2RlIiwiZGV0YWNoZWROb2RlIiwibm9kZVRvQXR0YWNoIiwiYW5jaG9yQ3JlYXRlZEJ5RHJhZyIsImN5UG9zaXRpb24iLCJjeVBvc1giLCJjeVBvc1kiLCJlbmRQb2ludCIsImRpc2Nvbm5lY3RlZEVuZCIsImRpc2Nvbm5lY3RFZGdlIiwicmVuZGVyZWRQb3NpdGlvbiIsIm5vZGUiLCJub2RlcyIsImVuYWJsZUNyZWF0ZUFuY2hvck9uRHJhZyIsImV2ZW50UG9zIiwiaXNOb2RlIiwiZmlyZSIsImFsbEFuY2hvcnMiLCJwcmVJbmRleCIsInBvc0luZGV4IiwicHJlQW5jaG9yUG9pbnQiLCJwb3NBbmNob3JQb2ludCIsIm5lYXJUb0xpbmUiLCJiZW5kUmVtb3ZhbFNlbnNpdGl2aXR5IiwiZW5hYmxlUmVtb3ZlQW5jaG9yTWlkT2ZOZWFyTGluZSIsIm5ld05vZGUiLCJpc1ZhbGlkIiwibG9jYXRpb24iLCJuZXdTb3VyY2UiLCJuZXdUYXJnZXQiLCJjb25uZWN0RWRnZSIsInJlY29ubmVjdGVkRWRnZSIsImNvcHlFZGdlIiwibmV3RWRnZSIsIm9sZEVkZ2UiLCJyZW1vdmUiLCJsb2MiLCJvbGRMb2MiLCJ0b1N0cmluZyIsIm1vdmVhbmNob3JwYXJhbSIsImZpcnN0QW5jaG9yIiwiZWRnZUNvbnRhaW5pbmdGaXJzdEFuY2hvciIsImZpcnN0QW5jaG9yUG9pbnRGb3VuZCIsImUiLCJmaXJzdFRpbWUiLCJmaXJzdEFuY2hvclBvc2l0aW9uIiwiaW5pdGlhbFBvcyIsIm1vdmVkRmlyc3RBbmNob3IiLCJ0YXJnZXRJc0VkZ2UiLCJpc0VkZ2UiLCJlcnIiLCJoaWRlTWVudUl0ZW0iLCJjeVBvcyIsInNlbGVjdGVkSW5kZXgiLCJzaG93TWVudUl0ZW0iLCJhbmNob3JzTW92aW5nIiwia2V5cyIsImtleURvd24iLCJzaG91bGRNb3ZlIiwibW92ZVNlbGVjdGVkQW5jaG9yc09uS2V5RXZlbnRzIiwidG4iLCJkb2N1bWVudCIsImFjdGl2ZUVsZW1lbnQiLCJ0YWdOYW1lIiwia2V5Q29kZSIsInByZXZlbnREZWZhdWx0IiwiZWxlbWVudHMiLCJtb3ZlU3BlZWQiLCJhbHRLZXkiLCJzaGlmdEtleSIsInVwQXJyb3dDb2RlIiwiZG93bkFycm93Q29kZSIsImxlZnRBcnJvd0NvZGUiLCJyaWdodEFycm93Q29kZSIsImtleVVwIiwiYWRkRXZlbnRMaXN0ZW5lciIsInVuYmluZCIsIkFycmF5IiwicHJvdG90eXBlIiwic2xpY2UiLCJjYWxsIiwiYXJndW1lbnRzIiwiZXJyb3IiLCJGVU5DX0VSUk9SX1RFWFQiLCJuYXRpdmVNYXgiLCJtYXgiLCJuYXRpdmVOb3ciLCJEYXRlIiwibm93IiwiZ2V0VGltZSIsImZ1bmMiLCJ3YWl0IiwiYXJncyIsIm1heFRpbWVvdXRJZCIsInN0YW1wIiwidGhpc0FyZyIsInRpbWVvdXRJZCIsInRyYWlsaW5nQ2FsbCIsImxhc3RDYWxsZWQiLCJtYXhXYWl0IiwidHJhaWxpbmciLCJUeXBlRXJyb3IiLCJsZWFkaW5nIiwiaXNPYmplY3QiLCJjYW5jZWwiLCJjbGVhclRpbWVvdXQiLCJjb21wbGV0ZSIsImlzQ2FsbGVkIiwiZGVsYXllZCIsInJlbWFpbmluZyIsIm1heERlbGF5ZWQiLCJkZWJvdW5jZWQiLCJsZWFkaW5nQ2FsbCIsInJlZ2lzdGVyIiwiY3l0b3NjYXBlIiwidWlVdGlsaXRpZXMiLCJkZWZhdWx0cyIsImVsZSIsImluaXRBbmNob3JzQXV0b21hdGljYWxseSIsImVuYWJsZWQiLCJpbml0aWFsaXplZCIsImV4dGVuZCIsIm9iaiIsImlzTmFOIiwiaW5zdGFuY2UiLCJlbGVzIiwiZGVsZXRlU2VsZWN0ZWRBbmNob3IiLCJkZWZpbmUiLCJwb3J0cyIsIm1vdmUiLCJjb3B5QW5jaG9ycyIsImNvcHlTdHlsZSIsImJwRGlzdGFuY2VzIiwiYnBXZWlnaHRzIiwidXIiLCJkZWZhdWx0QWN0aW9ucyIsImlzRGVidWciLCJjaGFuZ2VBbmNob3JQb2ludHMiLCJnZXRFbGVtZW50QnlJZCIsInNldCIsImhhZEFuY2hvclBvaW50IiwiaGFkTXVsdGlwbGVBbmNob3JQb2ludHMiLCJyZW1vdmVEYXRhIiwic2luZ2xlQ2xhc3NOYW1lIiwibXVsdGlDbGFzc05hbWUiLCJtb3ZlRG8iLCJhcmciLCJtb3ZlQW5jaG9yc1VuZG9hYmxlIiwibmV4dEFuY2hvcnNQb3NpdGlvbiIsInJlY29ubmVjdEVkZ2UiLCJyZW1vdmVSZWNvbm5lY3RlZEVkZ2UiLCJ0bXAiLCJyZW1vdmVkIiwicmVzdG9yZSIsImFjdGlvbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87Ozs7Ozs7OztBQ1ZBLElBQUlBLHVCQUF1QjtBQUN6QkMsa0JBQWdCQyxTQURTO0FBRXpCQyxpQkFBZUQsU0FGVTtBQUd6QkUsc0JBQW9CRixTQUhLO0FBSXpCRyxxQ0FBa0NILFNBSlQ7QUFLekJJLGtCQUFnQkosU0FMUztBQU16QksscUJBQW1CLDJCQUFTQyxlQUFULEVBQTBCO0FBQzNDLFNBQUtGLGNBQUwsR0FBc0JFLGVBQXRCO0FBQ0QsR0FSd0I7QUFTekJDLFVBQVE7QUFDTkMsVUFBTTtBQUNKQyxZQUFNLFVBREY7QUFFSkMsYUFBTywrQkFGSDtBQUdKQyxrQkFBWSx1Q0FIUjtBQUlKQyxjQUFRLDBCQUpKO0FBS0pDLGdCQUFVLDRCQUxOO0FBTUpDLGlCQUFXLGlCQU5QO0FBT0pDLG1CQUFhLG1CQVBUO0FBUUpDLGdCQUFVLG9CQVJOO0FBU0pDLG1DQUE0QjtBQVR4QixLQURBO0FBWU5DLGFBQVM7QUFDUFQsWUFBTSxrQkFEQztBQUVQQyxhQUFPLHFDQUZBO0FBR1BDLGtCQUFZLDZDQUhMO0FBSVBDLGNBQVEsNkJBSkQ7QUFLUEMsZ0JBQVUsK0JBTEg7QUFNUEMsaUJBQVcsdUJBTko7QUFPUEMsbUJBQWEseUJBUE47QUFRUEMsZ0JBQVU7QUFSSDtBQVpILEdBVGlCO0FBZ0N6QjtBQUNBO0FBQ0E7QUFDQUcsZUFBYSxxQkFBU1YsSUFBVCxFQUFjO0FBQ3pCLFFBQUcsQ0FBQ0EsSUFBSixFQUNFLE9BQU8sY0FBUCxDQURGLEtBRUssSUFBR0EsS0FBS1csUUFBTCxDQUFjLEtBQUtiLE1BQUwsQ0FBWSxNQUFaLEVBQW9CLE9BQXBCLENBQWQsQ0FBSCxFQUNILE9BQU8sTUFBUCxDQURHLEtBRUEsSUFBR0UsS0FBS1csUUFBTCxDQUFjLEtBQUtiLE1BQUwsQ0FBWSxTQUFaLEVBQXVCLE9BQXZCLENBQWQsQ0FBSCxFQUNILE9BQU8sU0FBUCxDQURHLEtBRUEsSUFBR0UsS0FBS1ksR0FBTCxDQUFTLGFBQVQsTUFBNEIsS0FBS2QsTUFBTCxDQUFZLE1BQVosRUFBb0IsTUFBcEIsQ0FBL0IsRUFDSCxPQUFPLE1BQVAsQ0FERyxLQUVBLElBQUdFLEtBQUtZLEdBQUwsQ0FBUyxhQUFULE1BQTRCLEtBQUtkLE1BQUwsQ0FBWSxTQUFaLEVBQXVCLE1BQXZCLENBQS9CLEVBQ0gsT0FBTyxTQUFQLENBREcsS0FFQSxJQUFHRSxLQUFLYSxJQUFMLENBQVUsS0FBS2YsTUFBTCxDQUFZLE1BQVosRUFBb0IsVUFBcEIsQ0FBVixLQUNBRSxLQUFLYSxJQUFMLENBQVUsS0FBS2YsTUFBTCxDQUFZLE1BQVosRUFBb0IsVUFBcEIsQ0FBVixFQUEyQ2dCLE1BQTNDLEdBQW9ELENBRHZELEVBRUgsT0FBTyxNQUFQLENBRkcsS0FHQSxJQUFHZCxLQUFLYSxJQUFMLENBQVUsS0FBS2YsTUFBTCxDQUFZLFNBQVosRUFBdUIsVUFBdkIsQ0FBVixLQUNBRSxLQUFLYSxJQUFMLENBQVUsS0FBS2YsTUFBTCxDQUFZLFNBQVosRUFBdUIsVUFBdkIsQ0FBVixFQUE4Q2dCLE1BQTlDLEdBQXVELENBRDFELEVBRUgsT0FBTyxTQUFQO0FBQ0YsV0FBTyxjQUFQO0FBQ0QsR0FyRHdCO0FBc0R6QjtBQUNBQyxvQkFBa0IsMEJBQVNDLGdCQUFULEVBQTJCQyxtQkFBM0IsRUFBZ0RDLEtBQWhELEVBQXVEO0FBQ3ZFLFNBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJRCxNQUFNSixNQUExQixFQUFrQ0ssR0FBbEMsRUFBdUM7QUFDckMsVUFBSW5CLE9BQU9rQixNQUFNQyxDQUFOLENBQVg7QUFDQSxVQUFJQyxPQUFPLEtBQUtWLFdBQUwsQ0FBaUJWLElBQWpCLENBQVg7O0FBRUEsVUFBSW9CLFNBQVMsY0FBYixFQUE2QjtBQUMzQjtBQUNEOztBQUVELFVBQUcsQ0FBQyxLQUFLQyxhQUFMLENBQW1CckIsSUFBbkIsQ0FBSixFQUE4Qjs7QUFFNUIsWUFBSXNCLGVBQUo7O0FBRUE7QUFDQSxZQUFHRixTQUFTLE1BQVosRUFDRUUsa0JBQWtCTixpQkFBaUJPLEtBQWpCLENBQXVCLElBQXZCLEVBQTZCdkIsSUFBN0IsQ0FBbEIsQ0FERixLQUVLLElBQUdvQixTQUFTLFNBQVosRUFDSEUsa0JBQWtCTCxvQkFBb0JNLEtBQXBCLENBQTBCLElBQTFCLEVBQWdDdkIsSUFBaEMsQ0FBbEI7O0FBRUY7QUFDQSxZQUFJd0IsU0FBUyxLQUFLQywwQkFBTCxDQUFnQ3pCLElBQWhDLEVBQXNDc0IsZUFBdEMsQ0FBYjs7QUFFQTtBQUNBLFlBQUlFLE9BQU9FLFNBQVAsQ0FBaUJaLE1BQWpCLEdBQTBCLENBQTlCLEVBQWlDO0FBQy9CZCxlQUFLYSxJQUFMLENBQVUsS0FBS2YsTUFBTCxDQUFZc0IsSUFBWixFQUFrQixRQUFsQixDQUFWLEVBQXVDSSxPQUFPRyxPQUE5QztBQUNBM0IsZUFBS2EsSUFBTCxDQUFVLEtBQUtmLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsVUFBbEIsQ0FBVixFQUF5Q0ksT0FBT0UsU0FBaEQ7QUFDQTFCLGVBQUs0QixRQUFMLENBQWMsS0FBSzlCLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsT0FBbEIsQ0FBZDtBQUNBLGNBQUlJLE9BQU9FLFNBQVAsQ0FBaUJaLE1BQWpCLEdBQTBCLENBQTlCLEVBQWlDO0FBQy9CZCxpQkFBSzRCLFFBQUwsQ0FBYyxLQUFLOUIsTUFBTCxDQUFZc0IsSUFBWixFQUFrQixZQUFsQixDQUFkO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Y7QUFDRixHQXhGd0I7O0FBMEZ6QkMsaUJBQWUsdUJBQVNyQixJQUFULEVBQWU7O0FBRTVCLFFBQUk2QixTQUFTN0IsS0FBSzhCLE1BQUwsR0FBY0MsUUFBZCxDQUF1QixHQUF2QixDQUFiO0FBQ0EsUUFBSUMsU0FBU2hDLEtBQUs4QixNQUFMLEdBQWNDLFFBQWQsQ0FBdUIsR0FBdkIsQ0FBYjtBQUNBLFFBQUlFLE9BQU9qQyxLQUFLa0MsTUFBTCxHQUFjSCxRQUFkLENBQXVCLEdBQXZCLENBQVg7QUFDQSxRQUFJSSxPQUFPbkMsS0FBS2tDLE1BQUwsR0FBY0gsUUFBZCxDQUF1QixHQUF2QixDQUFYOztBQUVBLFFBQUlGLFVBQVVJLElBQVYsSUFBa0JELFVBQVVHLElBQTdCLElBQXdDbkMsS0FBSzhCLE1BQUwsR0FBY00sRUFBZCxNQUFzQnBDLEtBQUtrQyxNQUFMLEdBQWNFLEVBQWQsRUFBakUsRUFBcUY7QUFDbkYsYUFBTyxJQUFQO0FBQ0Q7QUFDRCxTQUFJLElBQUlqQixJQUFJLENBQVosRUFBZSxLQUFLeEIsY0FBTCxJQUF1QndCLElBQUssS0FBS3hCLGNBQUwsQ0FBb0JtQixNQUEvRCxFQUF1RUssR0FBdkUsRUFBMkU7QUFDekUsVUFBR25CLEtBQUtXLFFBQUwsQ0FBYyxLQUFLaEIsY0FBTCxDQUFvQndCLENBQXBCLENBQWQsQ0FBSCxFQUNFLE9BQU8sSUFBUDtBQUNIO0FBQ0QsV0FBTyxLQUFQO0FBQ0QsR0F6R3dCO0FBMEd6QjtBQUNBa0Isb0JBQWtCLDBCQUFTQyxRQUFULEVBQW1CQyxRQUFuQixFQUE0QjtBQUM1QyxRQUFJQyxPQUFLRixTQUFTRyxDQUFsQjtBQUNBLFFBQUlDLE9BQUtKLFNBQVNLLENBQWxCO0FBQ0EsUUFBSUMsT0FBS0wsU0FBU0UsQ0FBbEI7QUFDQSxRQUFJSSxPQUFLTixTQUFTSSxDQUFsQjs7QUFFQSxRQUFJRyxlQUFhLFNBQWJBLFlBQWEsQ0FBQ0MsRUFBRCxFQUFJQyxFQUFKLEVBQVM7QUFDeEIsVUFBR0MsS0FBS0MsR0FBTCxDQUFTSCxLQUFHQyxFQUFaLElBQWdCLE1BQW5CLEVBQTJCLE9BQU8sSUFBUCxDQUEzQixLQUNLLE9BQU8sS0FBUDtBQUNOLEtBSEQ7O0FBS0EsUUFBSUYsYUFBYVIsU0FBU0csQ0FBdEIsRUFBd0JGLFNBQVNFLENBQWpDLEtBQXVDSCxTQUFTSyxDQUFULEdBQWFKLFNBQVNJLENBQWpFLEVBQW1FO0FBQ2pFLGFBQU8sQ0FBUDtBQUNEO0FBQ0QsUUFBR0wsU0FBU0csQ0FBVCxHQUFhRixTQUFTRSxDQUF0QixJQUEyQkgsU0FBU0ssQ0FBVCxHQUFhSixTQUFTSSxDQUFwRCxFQUFzRDtBQUNwRCxhQUFPLENBQVA7QUFDRDtBQUNELFFBQUdMLFNBQVNHLENBQVQsR0FBYUYsU0FBU0UsQ0FBdEIsSUFBMkJLLGFBQWFSLFNBQVNLLENBQXRCLEVBQXdCSixTQUFTSSxDQUFqQyxDQUE5QixFQUFrRTtBQUNoRSxhQUFPLENBQVA7QUFDRDtBQUNELFFBQUdMLFNBQVNHLENBQVQsR0FBYUYsU0FBU0UsQ0FBdEIsSUFBMkJILFNBQVNLLENBQVQsR0FBYUosU0FBU0ksQ0FBcEQsRUFBc0Q7QUFDcEQsYUFBTyxDQUFQO0FBQ0Q7QUFDRCxRQUFHRyxhQUFhUixTQUFTRyxDQUF0QixFQUF3QkYsU0FBU0UsQ0FBakMsS0FBdUNILFNBQVNLLENBQVQsR0FBYUosU0FBU0ksQ0FBaEUsRUFBa0U7QUFDaEUsYUFBTyxDQUFQO0FBQ0Q7QUFDRCxRQUFHTCxTQUFTRyxDQUFULEdBQWFGLFNBQVNFLENBQXRCLElBQTJCSCxTQUFTSyxDQUFULEdBQWFKLFNBQVNJLENBQXBELEVBQXNEO0FBQ3BELGFBQU8sQ0FBUDtBQUNEO0FBQ0QsUUFBR0wsU0FBU0csQ0FBVCxHQUFhRixTQUFTRSxDQUF0QixJQUEyQkssYUFBYVIsU0FBU0ssQ0FBdEIsRUFBeUJKLFNBQVNJLENBQWxDLENBQTlCLEVBQW1FO0FBQ2pFLGFBQU8sQ0FBUDtBQUNEO0FBQ0QsV0FBTyxDQUFQLENBaEM0QyxDQWdDbkM7QUFDVixHQTVJd0I7QUE2SXpCUSw4QkFBNEIsb0NBQVVuRCxJQUFWLEVBQWdCO0FBQzFDLFFBQUlvRCxhQUFhcEQsS0FBSzhCLE1BQUwsRUFBakI7QUFDQSxRQUFJdUIsYUFBYXJELEtBQUtrQyxNQUFMLEVBQWpCOztBQUVBLFFBQUlvQixjQUFjRCxXQUFXdEIsUUFBWCxFQUFsQjtBQUNBLFFBQUl3QixjQUFjSCxXQUFXckIsUUFBWCxFQUFsQjs7QUFFQSxRQUFJTyxXQUFXYyxXQUFXckIsUUFBWCxFQUFmO0FBQ0EsUUFBSVEsV0FBV2MsV0FBV3RCLFFBQVgsRUFBZjs7QUFHQSxRQUFJeUIsS0FBSyxDQUFDakIsU0FBU0UsQ0FBVCxHQUFhSCxTQUFTRyxDQUF2QixLQUE2QkYsU0FBU0ksQ0FBVCxHQUFhTCxTQUFTSyxDQUFuRCxDQUFUO0FBQ0EsUUFBSWMsS0FBSyxDQUFDLENBQUQsR0FBS0QsRUFBZDs7QUFFQSxXQUFPO0FBQ0xBLFVBQUlBLEVBREM7QUFFTEMsVUFBSUEsRUFGQztBQUdMbkIsZ0JBQVVBLFFBSEw7QUFJTEMsZ0JBQVVBO0FBSkwsS0FBUDtBQU1ELEdBakt3QjtBQWtLekJtQixtQkFBaUIseUJBQVMxRCxJQUFULEVBQWUyRCxLQUFmLEVBQXNCQyx1QkFBdEIsRUFBOEM7QUFDN0QsUUFBSUEsNEJBQTRCckUsU0FBaEMsRUFBMkM7QUFDekNxRSxnQ0FBMEIsS0FBS1QsMEJBQUwsQ0FBZ0NuRCxJQUFoQyxDQUExQjtBQUNEOztBQUVELFFBQUlzQyxXQUFXc0Isd0JBQXdCdEIsUUFBdkM7QUFDQSxRQUFJQyxXQUFXcUIsd0JBQXdCckIsUUFBdkM7QUFDQSxRQUFJaUIsS0FBS0ksd0JBQXdCSixFQUFqQztBQUNBLFFBQUlDLEtBQUtHLHdCQUF3QkgsRUFBakM7O0FBRUEsUUFBSUksVUFBSjtBQUNBLFFBQUlDLFVBQUo7O0FBRUEsUUFBR04sTUFBTU8sUUFBTixJQUFrQlAsTUFBTSxDQUFDTyxRQUE1QixFQUFxQztBQUNuQ0YsbUJBQWF2QixTQUFTSyxDQUF0QjtBQUNBbUIsbUJBQWFILE1BQU1sQixDQUFuQjtBQUNELEtBSEQsTUFJSyxJQUFHUSxLQUFLQyxHQUFMLENBQVNNLEVBQVQsSUFBZSxTQUFsQixFQUE0QjtBQUMvQkssbUJBQWFGLE1BQU1oQixDQUFuQjtBQUNBbUIsbUJBQWF4QixTQUFTRyxDQUF0QjtBQUNELEtBSEksTUFJQTtBQUNILFVBQUl1QixLQUFLMUIsU0FBU0csQ0FBVCxHQUFhZSxLQUFLbEIsU0FBU0ssQ0FBcEM7QUFDQSxVQUFJc0IsS0FBS04sTUFBTWxCLENBQU4sR0FBVWdCLEtBQUtFLE1BQU1oQixDQUE5Qjs7QUFFQWtCLG1CQUFhLENBQUNJLEtBQUtELEVBQU4sS0FBYVIsS0FBS0MsRUFBbEIsQ0FBYjtBQUNBSyxtQkFBYU4sS0FBS0ssVUFBTCxHQUFrQkcsRUFBL0I7QUFDRDs7QUFFRDtBQUNBO0FBQ0EsUUFBSUUsb0JBQW9CO0FBQ3RCdkIsU0FBR2tCLFVBRG1CO0FBRXRCcEIsU0FBR3FCO0FBRm1CLEtBQXhCOztBQUtBLFdBQU9JLGlCQUFQO0FBQ0QsR0F2TXdCO0FBd016QkMscUJBQW1CLDJCQUFTbkUsSUFBVCxFQUFlO0FBQ2hDLFFBQUlvQixPQUFPLEtBQUtWLFdBQUwsQ0FBaUJWLElBQWpCLENBQVg7O0FBRUEsUUFBR29CLFNBQVMsY0FBWixFQUEyQjtBQUN6QixhQUFPN0IsU0FBUDtBQUNEOztBQUVELFFBQUlTLEtBQUtZLEdBQUwsQ0FBUyxhQUFULE1BQTRCLEtBQUtkLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsTUFBbEIsQ0FBaEMsRUFBNEQ7QUFDMUQsYUFBTzdCLFNBQVA7QUFDRDs7QUFFRCxRQUFJNkUsYUFBYSxFQUFqQjs7QUFFQSxRQUFJekMsVUFBVTNCLEtBQUtxRSxNQUFMLENBQWEsS0FBS3ZFLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsV0FBbEIsQ0FBYixJQUNBcEIsS0FBS3FFLE1BQUwsQ0FBYSxLQUFLdkUsTUFBTCxDQUFZc0IsSUFBWixFQUFrQixXQUFsQixDQUFiLEVBQThDa0QsT0FEOUMsR0FDd0QsRUFEdEU7QUFFQSxRQUFJNUMsWUFBWTFCLEtBQUtxRSxNQUFMLENBQWEsS0FBS3ZFLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsYUFBbEIsQ0FBYixJQUNGcEIsS0FBS3FFLE1BQUwsQ0FBYSxLQUFLdkUsTUFBTCxDQUFZc0IsSUFBWixFQUFrQixhQUFsQixDQUFiLEVBQWdEa0QsT0FEOUMsR0FDd0QsRUFEeEU7QUFFQSxRQUFJQyxhQUFhdEIsS0FBS3VCLEdBQUwsQ0FBVTdDLFFBQVFiLE1BQWxCLEVBQTBCWSxVQUFVWixNQUFwQyxDQUFqQjs7QUFFQSxTQUFLLElBQUkyRCxJQUFJLENBQWIsRUFBZ0JBLElBQUlGLFVBQXBCLEVBQWdDRSxHQUFoQyxFQUFxQztBQUNuQyxVQUFJQyxtQkFBa0IsS0FBS0MsZ0NBQUwsQ0FBc0MzRSxJQUF0QyxFQUE0Q29CLElBQTVDLEVBQWtEcUQsQ0FBbEQsQ0FBdEI7QUFDQUwsaUJBQVdRLElBQVgsQ0FBZ0JGLGlCQUFpQi9CLENBQWpDLEVBQW1DK0IsaUJBQWlCakMsQ0FBcEQ7QUFDRDs7QUFFRCxXQUFPMkIsVUFBUDtBQUNELEdBak93QjtBQWtPekJTLGdDQUE4Qix3Q0FBWTtBQUN4QyxTQUFLbkYsaUNBQUwsR0FBdUNILFNBQXZDO0FBQ0QsR0FwT3dCO0FBcU96QnVGLGdDQUE4QixzQ0FBVUMsYUFBVixFQUF5QjtBQUFBOztBQUNyRDtBQUNBLFFBQUlDLGNBQWNELGNBQWNFLGNBQWQsRUFBbEI7QUFDQSxRQUFJQyxlQUFlSCxjQUFjSSxTQUFkLENBQXdCSixhQUF4QixDQUFuQjtBQUNBO0FBQ0FDLGtCQUFZQSxZQUFZSSxPQUFaLENBQW9CRixZQUFwQixDQUFaOztBQUVBRixnQkFBWUssT0FBWixDQUFvQixtQkFBVztBQUM3QixVQUFJQyxNQUFJLE1BQUtuQixpQkFBTCxDQUF1Qm9CLE9BQXZCLENBQVI7QUFDQSxVQUFHRCxRQUFPL0YsU0FBVixFQUFxQjtBQUNyQixVQUFJaUcsZUFBYSxFQUFqQjtBQUNBLFdBQUksSUFBSXJFLElBQUUsQ0FBVixFQUFZQSxJQUFFbUUsSUFBSXhFLE1BQWxCLEVBQXlCSyxLQUFHLENBQTVCLEVBQThCO0FBQzVCcUUscUJBQWFaLElBQWIsQ0FBa0IsRUFBQ2pDLEdBQUUyQyxJQUFJbkUsQ0FBSixDQUFILEVBQVVzQixHQUFFNkMsSUFBSW5FLElBQUUsQ0FBTixDQUFaLEVBQWxCO0FBQ0Q7QUFDRG9FLGNBQVExRSxJQUFSLENBQWEsTUFBS2YsTUFBTCxDQUFZLE1BQVosRUFBb0IsNkJBQXBCLENBQWIsRUFBZ0UwRixZQUFoRTtBQUNELEtBUkQ7QUFTQSxTQUFLOUYsaUNBQUwsR0FBdUNzRixXQUF2QztBQUNELEdBdFB3QjtBQXVQekJTLDJDQUF3QyxtREFBVTtBQUFBOztBQUNoRCxRQUFHLEtBQUsvRixpQ0FBTCxLQUF5Q0gsU0FBNUMsRUFBdUQ7QUFDdkQsU0FBS0csaUNBQUwsQ0FBdUMyRixPQUF2QyxDQUErQyxtQkFBUztBQUN0RCxVQUFJSyxpQkFBZUgsUUFBUTFFLElBQVIsQ0FBYSxPQUFLZixNQUFMLENBQVksTUFBWixFQUFvQiw2QkFBcEIsQ0FBYixDQUFuQjtBQUNBLFVBQUkwQixTQUFTLE9BQUtDLDBCQUFMLENBQWdDOEQsT0FBaEMsRUFBeUNHLGNBQXpDLENBQWI7QUFDQSxVQUFHbEUsT0FBT0UsU0FBUCxHQUFpQixDQUFwQixFQUFzQjtBQUNwQixZQUFJRixTQUFTLE9BQUtDLDBCQUFMLENBQWdDOEQsT0FBaEMsRUFBeUNHLGNBQXpDLENBQWI7QUFDRDtBQUNELFVBQUlsRSxPQUFPRSxTQUFQLENBQWlCWixNQUFqQixHQUEwQixDQUE5QixFQUFpQztBQUMvQnlFLGdCQUFRMUUsSUFBUixDQUFhLE9BQUtmLE1BQUwsQ0FBWSxNQUFaLEVBQW9CLFFBQXBCLENBQWIsRUFBNEMwQixPQUFPRyxPQUFuRDtBQUNBNEQsZ0JBQVExRSxJQUFSLENBQWEsT0FBS2YsTUFBTCxDQUFZLE1BQVosRUFBb0IsVUFBcEIsQ0FBYixFQUE4QzBCLE9BQU9FLFNBQXJEO0FBQ0Q7QUFDRixLQVZEO0FBV0QsR0FwUXdCO0FBcVF6QmlELG9DQUFrQywwQ0FBVTNFLElBQVYsRUFBZ0JvQixJQUFoQixFQUFzQnVFLFdBQXRCLEVBQW1DO0FBQ25FLFFBQUlDLFNBQVM1RixLQUFLOEIsTUFBTCxHQUFjQyxRQUFkLEVBQWI7QUFDQSxRQUFJOEQsU0FBUzdGLEtBQUtrQyxNQUFMLEdBQWNILFFBQWQsRUFBYjtBQUNBLFFBQUlKLFVBQVUzQixLQUFLYSxJQUFMLENBQVUsS0FBS2YsTUFBTCxDQUFZc0IsSUFBWixFQUFrQixRQUFsQixDQUFWLENBQWQ7QUFDQSxRQUFJTSxZQUFZMUIsS0FBS2EsSUFBTCxDQUFVLEtBQUtmLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsVUFBbEIsQ0FBVixDQUFoQjtBQUNBLFFBQUkwRSxJQUFJbkUsUUFBU2dFLFdBQVQsQ0FBUjtBQUNBLFFBQUlJLElBQUlyRSxVQUFXaUUsV0FBWCxDQUFSO0FBQ0EsUUFBSUssS0FBT0gsT0FBT3BELENBQVAsR0FBV21ELE9BQU9uRCxDQUE3QjtBQUNBLFFBQUl3RCxLQUFPSixPQUFPbEQsQ0FBUCxHQUFXaUQsT0FBT2pELENBQTdCO0FBQ0EsUUFBSXVELElBQUlqRCxLQUFLa0QsSUFBTCxDQUFXRixLQUFLQSxFQUFMLEdBQVVELEtBQUtBLEVBQTFCLENBQVI7QUFDQSxRQUFJSSxTQUFTO0FBQ1h6RCxTQUFHc0QsRUFEUTtBQUVYeEQsU0FBR3VEO0FBRlEsS0FBYjtBQUlBLFFBQUlLLGFBQWE7QUFDZjFELFNBQUd5RCxPQUFPekQsQ0FBUCxHQUFXdUQsQ0FEQztBQUVmekQsU0FBRzJELE9BQU8zRCxDQUFQLEdBQVd5RDtBQUZDLEtBQWpCO0FBSUEsUUFBSUksb0JBQW9CO0FBQ3RCM0QsU0FBRyxDQUFDMEQsV0FBVzVELENBRE87QUFFdEJBLFNBQUc0RCxXQUFXMUQ7QUFGUSxLQUF4Qjs7QUFLQSxRQUFJNEQsS0FBTSxJQUFJVCxDQUFkO0FBQ0EsUUFBSVUsS0FBS1YsQ0FBVDtBQUNBLFFBQUlXLE9BQU1iLE9BQU9qRCxDQUFQLEdBQVc0RCxFQUFYLEdBQWdCVixPQUFPbEQsQ0FBUCxHQUFXNkQsRUFBckM7QUFDQSxRQUFJRSxPQUFNZCxPQUFPbkQsQ0FBUCxHQUFXOEQsRUFBWCxHQUFnQlYsT0FBT3BELENBQVAsR0FBVytELEVBQXJDO0FBQ0EsUUFBSUcsWUFBV0YsT0FBT0gsa0JBQWtCM0QsQ0FBbEIsR0FBc0JvRCxDQUE1QztBQUNBLFFBQUlhLFlBQVdGLE9BQU9KLGtCQUFrQjdELENBQWxCLEdBQXNCc0QsQ0FBNUM7O0FBRUEsV0FBTyxFQUFDcEQsR0FBRWdFLFNBQUgsRUFBYWxFLEdBQUVtRSxTQUFmLEVBQVA7QUFDRCxHQXBTd0I7QUFxU3pCQyxxQ0FBbUMsMkNBQVU3RyxJQUFWLEVBQWdCb0IsSUFBaEIsRUFBc0J1RSxXQUF0QixFQUFtQztBQUNwRSxRQUFHQSxlQUFhLENBQWhCLEVBQWtCO0FBQ2hCLGFBQU8zRixLQUFLOEIsTUFBTCxHQUFjQyxRQUFkLEVBQVA7QUFDRCxLQUZELE1BRUs7QUFDSCxhQUFPLEtBQUs0QyxnQ0FBTCxDQUFzQzNFLElBQXRDLEVBQTJDb0IsSUFBM0MsRUFBZ0R1RSxjQUFZLENBQTVELENBQVA7QUFDRDtBQUNGLEdBM1N3QjtBQTRTekJtQixxQ0FBbUMsMkNBQVU5RyxJQUFWLEVBQWdCb0IsSUFBaEIsRUFBc0J1RSxXQUF0QixFQUFtQztBQUNwRSxRQUFJaEUsVUFBVTNCLEtBQUthLElBQUwsQ0FBVSxLQUFLZixNQUFMLENBQVlzQixJQUFaLEVBQWtCLFFBQWxCLENBQVYsQ0FBZDtBQUNBLFFBQUlNLFlBQVkxQixLQUFLYSxJQUFMLENBQVUsS0FBS2YsTUFBTCxDQUFZc0IsSUFBWixFQUFrQixVQUFsQixDQUFWLENBQWhCO0FBQ0EsUUFBSW1ELGFBQWF0QixLQUFLdUIsR0FBTCxDQUFVN0MsUUFBUWIsTUFBbEIsRUFBMEJZLFVBQVVaLE1BQXBDLENBQWpCO0FBQ0EsUUFBRzZFLGVBQWFwQixhQUFXLENBQTNCLEVBQTZCO0FBQzNCLGFBQU92RSxLQUFLa0MsTUFBTCxHQUFjSCxRQUFkLEVBQVA7QUFDRCxLQUZELE1BRUs7QUFDSCxhQUFPLEtBQUs0QyxnQ0FBTCxDQUFzQzNFLElBQXRDLEVBQTJDb0IsSUFBM0MsRUFBZ0R1RSxjQUFZLENBQTVELENBQVA7QUFDRDtBQUNGLEdBclR3QjtBQXNUekJvQiw2QkFBMkIsbUNBQVUvRyxJQUFWLEVBQWdCMkQsS0FBaEIsRUFBdUJDLHVCQUF2QixFQUFnRDtBQUN6RSxRQUFJQSw0QkFBNEJyRSxTQUFoQyxFQUEyQztBQUN6Q3FFLGdDQUEwQixLQUFLVCwwQkFBTCxDQUFnQ25ELElBQWhDLENBQTFCO0FBQ0Q7O0FBRUQsUUFBSWtFLG9CQUFvQixLQUFLUixlQUFMLENBQXFCMUQsSUFBckIsRUFBMkIyRCxLQUEzQixFQUFrQ0MsdUJBQWxDLENBQXhCO0FBQ0EsUUFBSUMsYUFBYUssa0JBQWtCdkIsQ0FBbkM7QUFDQSxRQUFJbUIsYUFBYUksa0JBQWtCekIsQ0FBbkM7O0FBRUEsUUFBSUgsV0FBV3NCLHdCQUF3QnRCLFFBQXZDO0FBQ0EsUUFBSUMsV0FBV3FCLHdCQUF3QnJCLFFBQXZDOztBQUVBLFFBQUlwQyxNQUFKOztBQUVBLFFBQUkwRCxjQUFjdkIsU0FBU0ssQ0FBM0IsRUFBK0I7QUFDN0J4QyxlQUFTLENBQUMwRCxhQUFhdkIsU0FBU0ssQ0FBdkIsS0FBNkJKLFNBQVNJLENBQVQsR0FBYUwsU0FBU0ssQ0FBbkQsQ0FBVDtBQUNELEtBRkQsTUFHSyxJQUFJbUIsY0FBY3hCLFNBQVNHLENBQTNCLEVBQStCO0FBQ2xDdEMsZUFBUyxDQUFDMkQsYUFBYXhCLFNBQVNHLENBQXZCLEtBQTZCRixTQUFTRSxDQUFULEdBQWFILFNBQVNHLENBQW5ELENBQVQ7QUFDRCxLQUZJLE1BR0E7QUFDSHRDLGVBQVMsQ0FBVDtBQUNEOztBQUVELFFBQUlDLFdBQVc2QyxLQUFLa0QsSUFBTCxDQUFVbEQsS0FBSytELEdBQUwsQ0FBVWxELGFBQWFILE1BQU1sQixDQUE3QixFQUFpQyxDQUFqQyxJQUNuQlEsS0FBSytELEdBQUwsQ0FBVW5ELGFBQWFGLE1BQU1oQixDQUE3QixFQUFpQyxDQUFqQyxDQURTLENBQWY7O0FBR0E7QUFDQSxRQUFJc0UsYUFBYSxLQUFLNUUsZ0JBQUwsQ0FBc0JDLFFBQXRCLEVBQWdDQyxRQUFoQyxDQUFqQjtBQUNBO0FBQ0EsUUFBSTJFLGFBQWEsS0FBSzdFLGdCQUFMLENBQXNCNkIsaUJBQXRCLEVBQXlDUCxLQUF6QyxDQUFqQjs7QUFFQTtBQUNBLFFBQUdzRCxhQUFhQyxVQUFiLElBQTJCLENBQUMsQ0FBNUIsSUFBaUNELGFBQWFDLFVBQWIsSUFBMkIsQ0FBL0QsRUFBaUU7QUFDL0QsVUFBRzlHLFlBQVksQ0FBZixFQUNFQSxXQUFXLENBQUMsQ0FBRCxHQUFLQSxRQUFoQjtBQUNIOztBQUVELFdBQU87QUFDTEQsY0FBUUEsTUFESDtBQUVMQyxnQkFBVUE7QUFGTCxLQUFQO0FBSUQsR0FoV3dCO0FBaVd6QnFCLDhCQUE0QixvQ0FBVXpCLElBQVYsRUFBZ0JtSCxZQUFoQixFQUE4QjtBQUN4RCxRQUFJdkQsMEJBQTBCLEtBQUtULDBCQUFMLENBQWdDbkQsSUFBaEMsQ0FBOUI7O0FBRUEsUUFBSTJCLFVBQVUsRUFBZDtBQUNBLFFBQUlELFlBQVksRUFBaEI7O0FBRUEsU0FBSyxJQUFJUCxJQUFJLENBQWIsRUFBZ0JnRyxnQkFBZ0JoRyxJQUFJZ0csYUFBYXJHLE1BQWpELEVBQXlESyxHQUF6RCxFQUE4RDtBQUM1RCxVQUFJaUcsU0FBU0QsYUFBYWhHLENBQWIsQ0FBYjtBQUNBLFVBQUlrRyx5QkFBeUIsS0FBS04seUJBQUwsQ0FBK0IvRyxJQUEvQixFQUFxQ29ILE1BQXJDLEVBQTZDeEQsdUJBQTdDLENBQTdCOztBQUVBakMsY0FBUWlELElBQVIsQ0FBYXlDLHVCQUF1QmxILE1BQXBDO0FBQ0F1QixnQkFBVWtELElBQVYsQ0FBZXlDLHVCQUF1QmpILFFBQXRDO0FBQ0Q7O0FBRUQsV0FBTztBQUNMdUIsZUFBU0EsT0FESjtBQUVMRCxpQkFBV0E7QUFGTixLQUFQO0FBSUQsR0FuWHdCO0FBb1h6QjRGLHNCQUFvQiw0QkFBVXRILElBQVYsRUFBZ0JvQixJQUFoQixFQUFzQjtBQUN4QyxRQUFJbUcsTUFBTSxFQUFWOztBQUVBLFFBQUk3RixZQUFZMUIsS0FBS2EsSUFBTCxDQUFVLEtBQUtmLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsVUFBbEIsQ0FBVixDQUFoQjtBQUNBLFNBQUssSUFBSUQsSUFBSSxDQUFiLEVBQWdCTyxhQUFhUCxJQUFJTyxVQUFVWixNQUEzQyxFQUFtREssR0FBbkQsRUFBd0Q7QUFDdERvRyxZQUFNQSxNQUFNLEdBQU4sR0FBWTdGLFVBQVVQLENBQVYsQ0FBbEI7QUFDRDs7QUFFRCxXQUFPb0csR0FBUDtBQUNELEdBN1h3QjtBQThYekJDLG9CQUFrQiwwQkFBVXhILElBQVYsRUFBZ0JvQixJQUFoQixFQUFzQjtBQUN0QyxRQUFJbUcsTUFBTSxFQUFWOztBQUVBLFFBQUk1RixVQUFVM0IsS0FBS2EsSUFBTCxDQUFVLEtBQUtmLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsUUFBbEIsQ0FBVixDQUFkO0FBQ0EsU0FBSyxJQUFJRCxJQUFJLENBQWIsRUFBZ0JRLFdBQVdSLElBQUlRLFFBQVFiLE1BQXZDLEVBQStDSyxHQUEvQyxFQUFvRDtBQUNsRG9HLFlBQU1BLE1BQU0sR0FBTixHQUFZNUYsUUFBUVIsQ0FBUixDQUFsQjtBQUNEOztBQUVELFdBQU9vRyxHQUFQO0FBQ0QsR0F2WXdCO0FBd1l6QkUsa0JBQWdCLHdCQUFTekgsSUFBVCxFQUFlMEgsY0FBZixFQUFpRDtBQUFBLFFBQWxCdEcsSUFBa0IsdUVBQVg3QixTQUFXOztBQUMvRCxRQUFHUyxTQUFTVCxTQUFULElBQXNCbUksbUJBQW1CbkksU0FBNUMsRUFBc0Q7QUFDcERTLGFBQU8sS0FBS1YsY0FBWjtBQUNBb0ksdUJBQWlCLEtBQUtsSSxhQUF0QjtBQUNEOztBQUVELFFBQUc0QixTQUFTN0IsU0FBWixFQUNFNkIsT0FBTyxLQUFLVixXQUFMLENBQWlCVixJQUFqQixDQUFQOztBQUVGLFFBQUkySCxZQUFZLEtBQUs3SCxNQUFMLENBQVlzQixJQUFaLEVBQWtCLFFBQWxCLENBQWhCO0FBQ0EsUUFBSXdHLGNBQWMsS0FBSzlILE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsVUFBbEIsQ0FBbEI7O0FBRUEsUUFBSXlHLG1CQUFtQixLQUFLZCx5QkFBTCxDQUErQi9HLElBQS9CLEVBQXFDMEgsY0FBckMsQ0FBdkI7QUFDQSxRQUFJSSx1QkFBdUJELGlCQUFpQjFILE1BQTVDOztBQUVBLFFBQUkwQixTQUFTN0IsS0FBSzhCLE1BQUwsR0FBY0MsUUFBZCxDQUF1QixHQUF2QixDQUFiO0FBQ0EsUUFBSUMsU0FBU2hDLEtBQUs4QixNQUFMLEdBQWNDLFFBQWQsQ0FBdUIsR0FBdkIsQ0FBYjtBQUNBLFFBQUlFLE9BQU9qQyxLQUFLa0MsTUFBTCxHQUFjSCxRQUFkLENBQXVCLEdBQXZCLENBQVg7QUFDQSxRQUFJSSxPQUFPbkMsS0FBS2tDLE1BQUwsR0FBY0gsUUFBZCxDQUF1QixHQUF2QixDQUFYO0FBQ0EsUUFBSWdHLGNBQWMsS0FBS2hCLHlCQUFMLENBQStCL0csSUFBL0IsRUFBcUMsRUFBQzJDLEdBQUdkLE1BQUosRUFBWVksR0FBR1QsTUFBZixFQUFyQyxFQUE2RDdCLE1BQS9FO0FBQ0EsUUFBSTZILFlBQVksS0FBS2pCLHlCQUFMLENBQStCL0csSUFBL0IsRUFBcUMsRUFBQzJDLEdBQUdWLElBQUosRUFBVVEsR0FBR04sSUFBYixFQUFyQyxFQUF5RGhDLE1BQXpFO0FBQ0EsUUFBSThILG9CQUFvQixDQUFDRixXQUFELEVBQWNHLE1BQWQsQ0FBcUJsSSxLQUFLYSxJQUFMLENBQVU4RyxTQUFWLElBQXFCM0gsS0FBS2EsSUFBTCxDQUFVOEcsU0FBVixDQUFyQixHQUEwQyxFQUEvRCxFQUFtRU8sTUFBbkUsQ0FBMEUsQ0FBQ0YsU0FBRCxDQUExRSxDQUF4Qjs7QUFFQSxRQUFJRyxjQUFjLEtBQUtoRSxpQkFBTCxDQUF1Qm5FLElBQXZCLENBQWxCOztBQUVBLFFBQUlvSSxVQUFVckUsUUFBZDtBQUNBLFFBQUlzRSxZQUFKO0FBQ0EsUUFBSUMsZ0JBQWdCLENBQUN6RyxNQUFELEVBQVNHLE1BQVQsRUFDWGtHLE1BRFcsQ0FDSkMsY0FBWUEsV0FBWixHQUF3QixFQURwQixFQUVYRCxNQUZXLENBRUosQ0FBQ2pHLElBQUQsRUFBT0UsSUFBUCxDQUZJLENBQXBCO0FBR0EsUUFBSW9HLGlCQUFpQixDQUFDLENBQXRCOztBQUVBLFNBQUksSUFBSXBILElBQUksQ0FBWixFQUFlQSxJQUFJOEcsa0JBQWtCbkgsTUFBbEIsR0FBMkIsQ0FBOUMsRUFBaURLLEdBQWpELEVBQXFEO0FBQ25ELFVBQUlvRixLQUFLMEIsa0JBQWtCOUcsQ0FBbEIsQ0FBVDtBQUNBLFVBQUlxRixLQUFLeUIsa0JBQWtCOUcsSUFBSSxDQUF0QixDQUFUOztBQUVBO0FBQ0EsVUFBTXFILEtBQUssS0FBS0Msb0JBQUwsQ0FBMEJYLG9CQUExQixFQUFnRHZCLEVBQWhELEVBQW9ELElBQXBELENBQVg7QUFDQSxVQUFNbUMsS0FBSyxLQUFLRCxvQkFBTCxDQUEwQlgsb0JBQTFCLEVBQWdEdEIsRUFBaEQsQ0FBWDtBQUNBLFVBQU1tQyxLQUFLLEtBQUtGLG9CQUFMLENBQTBCWCxvQkFBMUIsRUFBZ0R0QixFQUFoRCxFQUFvRCxJQUFwRCxDQUFYO0FBQ0EsVUFBTW9DLEtBQUssS0FBS0gsb0JBQUwsQ0FBMEJYLG9CQUExQixFQUFnRHZCLEVBQWhELENBQVg7QUFDQSxVQUFLaUMsTUFBTUUsRUFBUCxJQUFlQyxNQUFNQyxFQUF6QixFQUE2QjtBQUMzQixZQUFJL0csU0FBU3lHLGNBQWMsSUFBSW5ILENBQWxCLENBQWI7QUFDQSxZQUFJYSxTQUFTc0csY0FBYyxJQUFJbkgsQ0FBSixHQUFRLENBQXRCLENBQWI7QUFDQSxZQUFJYyxPQUFPcUcsY0FBYyxJQUFJbkgsQ0FBSixHQUFRLENBQXRCLENBQVg7QUFDQSxZQUFJZ0IsT0FBT21HLGNBQWMsSUFBSW5ILENBQUosR0FBUSxDQUF0QixDQUFYOztBQUVBLFlBQUkwSCxRQUFRO0FBQ1ZsRyxhQUFHZCxNQURPO0FBRVZZLGFBQUdUO0FBRk8sU0FBWjs7QUFLQSxZQUFJOEcsTUFBTTtBQUNSbkcsYUFBR1YsSUFESztBQUVSUSxhQUFHTjtBQUZLLFNBQVY7O0FBS0EsWUFBSXFCLEtBQUssQ0FBRXhCLFNBQVNHLElBQVgsS0FBc0JOLFNBQVNJLElBQS9CLENBQVQ7QUFDQSxZQUFJd0IsS0FBSyxDQUFDLENBQUQsR0FBS0QsRUFBZDs7QUFFQSxZQUFJSSwwQkFBMEI7QUFDNUJ0QixvQkFBVXVHLEtBRGtCO0FBRTVCdEcsb0JBQVV1RyxHQUZrQjtBQUc1QnRGLGNBQUlBLEVBSHdCO0FBSTVCQyxjQUFJQTtBQUp3QixTQUE5Qjs7QUFPQSxZQUFJc0Ysc0JBQXNCLEtBQUtyRixlQUFMLENBQXFCMUQsSUFBckIsRUFBMkIwSCxjQUEzQixFQUEyQzlELHVCQUEzQyxDQUExQjtBQUNBLFlBQUlvRixPQUFPL0YsS0FBS2tELElBQUwsQ0FBV2xELEtBQUsrRCxHQUFMLENBQVdVLGVBQWUvRSxDQUFmLEdBQW1Cb0csb0JBQW9CcEcsQ0FBbEQsRUFBc0QsQ0FBdEQsSUFDWk0sS0FBSytELEdBQUwsQ0FBV1UsZUFBZWpGLENBQWYsR0FBbUJzRyxvQkFBb0J0RyxDQUFsRCxFQUFzRCxDQUF0RCxDQURDLENBQVg7O0FBR0E7QUFDQSxZQUFHdUcsT0FBT1osT0FBVixFQUFrQjtBQUNoQkEsb0JBQVVZLElBQVY7QUFDQVgseUJBQWVVLG1CQUFmO0FBQ0FSLDJCQUFpQnBILENBQWpCO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFFBQUdrSCxpQkFBaUI5SSxTQUFwQixFQUE4QjtBQUM1Qm1JLHVCQUFpQlcsWUFBakI7QUFDRDs7QUFFRFIsdUJBQW1CLEtBQUtkLHlCQUFMLENBQStCL0csSUFBL0IsRUFBcUMwSCxjQUFyQyxDQUFuQjs7QUFFQSxRQUFHVyxpQkFBaUI5SSxTQUFwQixFQUE4QjtBQUM1QnNJLHVCQUFpQnpILFFBQWpCLEdBQTRCLENBQTVCO0FBQ0Q7O0FBRUQsUUFBSXVCLFVBQVUzQixLQUFLYSxJQUFMLENBQVU4RyxTQUFWLENBQWQ7QUFDQSxRQUFJakcsWUFBWTFCLEtBQUthLElBQUwsQ0FBVStHLFdBQVYsQ0FBaEI7O0FBRUFqRyxjQUFVQSxVQUFRQSxPQUFSLEdBQWdCLEVBQTFCO0FBQ0FELGdCQUFZQSxZQUFVQSxTQUFWLEdBQW9CLEVBQWhDOztBQUVBLFFBQUdDLFFBQVFiLE1BQVIsS0FBbUIsQ0FBdEIsRUFBeUI7QUFDdkJ5SCx1QkFBaUIsQ0FBakI7QUFDRDs7QUFFTDtBQUNBO0FBQ0ksUUFBR0Esa0JBQWtCLENBQUMsQ0FBdEIsRUFBd0I7QUFDdEI1RyxjQUFRc0gsTUFBUixDQUFlVixjQUFmLEVBQStCLENBQS9CLEVBQWtDVixpQkFBaUIxSCxNQUFuRDtBQUNBdUIsZ0JBQVV1SCxNQUFWLENBQWlCVixjQUFqQixFQUFpQyxDQUFqQyxFQUFvQ1YsaUJBQWlCekgsUUFBckQ7QUFDRDs7QUFFREosU0FBS2EsSUFBTCxDQUFVOEcsU0FBVixFQUFxQmhHLE9BQXJCO0FBQ0EzQixTQUFLYSxJQUFMLENBQVUrRyxXQUFWLEVBQXVCbEcsU0FBdkI7O0FBRUExQixTQUFLNEIsUUFBTCxDQUFjLEtBQUs5QixNQUFMLENBQVlzQixJQUFaLEVBQWtCLE9BQWxCLENBQWQ7QUFDQSxRQUFJTyxRQUFRYixNQUFSLEdBQWlCLENBQWpCLElBQXNCWSxVQUFVWixNQUFWLEdBQW1CLENBQTdDLEVBQWdEO0FBQzlDZCxXQUFLNEIsUUFBTCxDQUFjLEtBQUs5QixNQUFMLENBQVlzQixJQUFaLEVBQWtCLFlBQWxCLENBQWQ7QUFDRDs7QUFFRCxXQUFPbUgsY0FBUDtBQUNELEdBNWZ3QjtBQTZmekJXLGdCQUFjLHNCQUFTbEosSUFBVCxFQUFlMkYsV0FBZixFQUEyQjtBQUN2QyxRQUFHM0YsU0FBU1QsU0FBVCxJQUFzQm9HLGdCQUFnQnBHLFNBQXpDLEVBQW1EO0FBQ2pEUyxhQUFPLEtBQUtWLGNBQVo7QUFDQXFHLG9CQUFjLEtBQUtsRyxrQkFBbkI7QUFDRDs7QUFFRCxRQUFJMkIsT0FBTyxLQUFLVixXQUFMLENBQWlCVixJQUFqQixDQUFYOztBQUVBLFFBQUcsS0FBS21KLGtDQUFMLENBQXdDL0gsSUFBeEMsRUFBOEMsdUNBQTlDLENBQUgsRUFBMEY7QUFDeEY7QUFDRDs7QUFFRCxRQUFJd0csY0FBYyxLQUFLOUgsTUFBTCxDQUFZc0IsSUFBWixFQUFrQixRQUFsQixDQUFsQjtBQUNBLFFBQUl1RyxZQUFZLEtBQUs3SCxNQUFMLENBQVlzQixJQUFaLEVBQWtCLFVBQWxCLENBQWhCO0FBQ0EsUUFBSWdJLGtCQUFrQixLQUFLdEosTUFBTCxDQUFZc0IsSUFBWixFQUFrQixVQUFsQixDQUF0Qjs7QUFFQSxRQUFJTSxZQUFZMUIsS0FBS2EsSUFBTCxDQUFVK0csV0FBVixDQUFoQjtBQUNBLFFBQUlqRyxVQUFVM0IsS0FBS2EsSUFBTCxDQUFVOEcsU0FBVixDQUFkO0FBQ0EsUUFBSTBCLFlBQVlySixLQUFLYSxJQUFMLENBQVV1SSxlQUFWLENBQWhCOztBQUVBMUgsY0FBVXVILE1BQVYsQ0FBaUJ0RCxXQUFqQixFQUE4QixDQUE5QjtBQUNBaEUsWUFBUXNILE1BQVIsQ0FBZXRELFdBQWYsRUFBNEIsQ0FBNUI7QUFDQTtBQUNBO0FBQ0EsUUFBSTBELFNBQUosRUFDRUEsVUFBVUosTUFBVixDQUFpQnRELFdBQWpCLEVBQThCLENBQTlCOztBQUVGO0FBQ0EsUUFBSWpFLFVBQVVaLE1BQVYsSUFBb0IsQ0FBcEIsSUFBeUJhLFFBQVFiLE1BQVIsSUFBa0IsQ0FBL0MsRUFBa0Q7QUFDaERkLFdBQUtzSixXQUFMLENBQWlCLEtBQUt4SixNQUFMLENBQVlzQixJQUFaLEVBQWtCLFlBQWxCLENBQWpCO0FBQ0Q7QUFDRDtBQUhBLFNBSUssSUFBR00sVUFBVVosTUFBVixJQUFvQixDQUFwQixJQUF5QmEsUUFBUWIsTUFBUixJQUFrQixDQUE5QyxFQUFnRDtBQUNuRGQsYUFBS3NKLFdBQUwsQ0FBaUIsS0FBS3hKLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsT0FBbEIsQ0FBakI7QUFDQXBCLGFBQUthLElBQUwsQ0FBVStHLFdBQVYsRUFBdUIsRUFBdkI7QUFDQTVILGFBQUthLElBQUwsQ0FBVThHLFNBQVYsRUFBcUIsRUFBckI7QUFDRCxPQUpJLE1BS0E7QUFDSDNILGFBQUthLElBQUwsQ0FBVStHLFdBQVYsRUFBdUJsRyxTQUF2QjtBQUNBMUIsYUFBS2EsSUFBTCxDQUFVOEcsU0FBVixFQUFxQmhHLE9BQXJCO0FBQ0Q7QUFDRixHQXRpQndCO0FBdWlCekI0SCxvQkFBa0IsMEJBQVN2SixJQUFULEVBQWU7QUFDL0IsUUFBSUEsU0FBU1QsU0FBYixFQUF3QjtBQUN0QlMsYUFBTyxLQUFLVixjQUFaO0FBQ0Q7QUFDRCxRQUFJOEIsT0FBTyxLQUFLVixXQUFMLENBQWlCVixJQUFqQixDQUFYOztBQUVBLFFBQUcsS0FBS21KLGtDQUFMLENBQXdDL0gsSUFBeEMsRUFBOEMsMkNBQTlDLENBQUgsRUFBOEY7QUFDNUY7QUFDRDs7QUFFRDtBQUNBcEIsU0FBS3NKLFdBQUwsQ0FBaUIsS0FBS3hKLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsT0FBbEIsQ0FBakI7QUFDQXBCLFNBQUtzSixXQUFMLENBQWlCLEtBQUt4SixNQUFMLENBQVlzQixJQUFaLEVBQWtCLFlBQWxCLENBQWpCOztBQUVBO0FBQ0EsUUFBSXdHLGNBQWMsS0FBSzlILE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsUUFBbEIsQ0FBbEI7QUFDQSxRQUFJdUcsWUFBWSxLQUFLN0gsTUFBTCxDQUFZc0IsSUFBWixFQUFrQixVQUFsQixDQUFoQjtBQUNBLFFBQUlnSSxrQkFBa0IsS0FBS3RKLE1BQUwsQ0FBWXNCLElBQVosRUFBa0IsVUFBbEIsQ0FBdEI7QUFDQXBCLFNBQUthLElBQUwsQ0FBVStHLFdBQVYsRUFBdUIsRUFBdkI7QUFDQTVILFNBQUthLElBQUwsQ0FBVThHLFNBQVYsRUFBcUIsRUFBckI7QUFDQTtBQUNBO0FBQ0EsUUFBSTNILEtBQUthLElBQUwsQ0FBVXVJLGVBQVYsQ0FBSixFQUFnQztBQUM5QnBKLFdBQUthLElBQUwsQ0FBVXVJLGVBQVYsRUFBMkIsRUFBM0I7QUFDRDtBQUNGLEdBaGtCd0I7QUFpa0J6QkkscUJBQW1CLDJCQUFTQyxHQUFULEVBQWNDLEdBQWQsRUFBbUI7QUFDcEMsUUFBSUMsUUFBUUYsSUFBSTlHLENBQUosR0FBUStHLElBQUkvRyxDQUF4QjtBQUNBLFFBQUlpSCxRQUFRSCxJQUFJaEgsQ0FBSixHQUFRaUgsSUFBSWpILENBQXhCOztBQUVBLFFBQUl1RyxPQUFPL0YsS0FBS2tELElBQUwsQ0FBV2xELEtBQUsrRCxHQUFMLENBQVUyQyxLQUFWLEVBQWlCLENBQWpCLElBQXVCMUcsS0FBSytELEdBQUwsQ0FBVTRDLEtBQVYsRUFBaUIsQ0FBakIsQ0FBbEMsQ0FBWDtBQUNBLFdBQU9aLElBQVA7QUFDRCxHQXZrQndCO0FBd2tCekI7QUFDQVAsd0JBQXNCLDhCQUFVb0IsRUFBVixFQUFjQyxFQUFkLEVBQStEO0FBQUEsUUFBN0NDLGlCQUE2Qyx1RUFBekIsS0FBeUI7QUFBQSxRQUFsQkMsU0FBa0IsdUVBQU4sSUFBTTs7QUFDbkYsUUFBTUMsT0FBT0osS0FBS0MsRUFBbEI7QUFDQSxRQUFJN0csS0FBS0MsR0FBTCxDQUFTK0csSUFBVCxLQUFrQkQsU0FBdEIsRUFBaUM7QUFDL0IsYUFBTyxJQUFQO0FBQ0Q7QUFDRCxRQUFJRCxpQkFBSixFQUF1QjtBQUNyQixhQUFPRixLQUFLQyxFQUFaO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsYUFBT0QsS0FBS0MsRUFBWjtBQUNEO0FBQ0YsR0FubEJ3QjtBQW9sQnpCWCxzQ0FBb0MsNENBQVMvSCxJQUFULEVBQWU4SSxLQUFmLEVBQXFCO0FBQ3ZELFFBQUc5SSxTQUFTLGNBQVosRUFBNEI7QUFDMUIrSSxjQUFRQyxHQUFSLFNBQWtCRixLQUFsQjtBQUNBLGFBQU8sSUFBUDtBQUNEO0FBQ0QsV0FBTyxLQUFQO0FBQ0Q7QUExbEJ3QixDQUEzQjs7QUE2bEJBRyxPQUFPQyxPQUFQLEdBQWlCakwsb0JBQWpCLEM7Ozs7Ozs7Ozs7O0FDN2xCQSxJQUFJa0wsV0FBV0MsbUJBQU9BLENBQUMsR0FBUixDQUFmO0FBQ0EsSUFBSW5MLHVCQUF1Qm1MLG1CQUFPQSxDQUFDLEdBQVIsQ0FBM0I7QUFDQSxJQUFJQyx3QkFBd0JELG1CQUFPQSxDQUFDLEdBQVIsQ0FBNUI7QUFDQSxJQUFJRSw0QkFBNEJGLG1CQUFPQSxDQUFDLEdBQVIsQ0FBaEM7QUFDQSxJQUFJRyxVQUFVLENBQWQ7O0FBRUFOLE9BQU9DLE9BQVAsR0FBaUIsVUFBVU0sTUFBVixFQUFrQkMsRUFBbEIsRUFBc0I7QUFDckMsTUFBSUMsS0FBS0YsTUFBVDs7QUFFQSxNQUFJRyx3QkFBd0IsNENBQTRDSixPQUF4RTtBQUNBLE1BQUlLLDJCQUEyQiwrQ0FBK0NMLE9BQTlFO0FBQ0EsTUFBSU0sOEJBQThCLHdEQUF3RE4sT0FBMUY7QUFDQSxNQUFJTywyQkFBMkIsa0RBQWtEUCxPQUFqRjtBQUNBLE1BQUlRLDhCQUE4QixxREFBcURSLE9BQXZGO0FBQ0EsTUFBSVMsaUNBQWlDLDJEQUEyRFQsT0FBaEc7QUFDQSxNQUFJVSxNQUFKLEVBQVlDLE9BQVosRUFBcUJDLElBQXJCLEVBQTJCQyxLQUEzQixFQUFrQ0MsT0FBbEMsRUFBMkNDLFNBQTNDLEVBQXNEQyxTQUF0RCxFQUFpRUMsZUFBakUsRUFBa0ZDLFFBQWxGLEVBQTRGQyxPQUE1RixFQUFxR0MsT0FBckcsRUFBOEdDLEtBQTlHO0FBQ0E7QUFDQSxNQUFJQyxrQkFBSixFQUF3QkMsa0JBQXhCLEVBQTRDQyx1QkFBNUM7QUFDQSxNQUFJQyxtQkFBSjtBQUNBO0FBQ0EsTUFBSUMsZUFBSixFQUFxQkMscUJBQXJCOztBQUVBO0FBQ0EsTUFBSUMsaUJBQWlCLElBQXJCO0FBQUEsTUFBMkJDLGlCQUFpQixJQUE1QztBQUNBO0FBQ0EsTUFBSUMsZ0JBQWdCLEtBQXBCO0FBQ0E7QUFDQSxNQUFJQyxRQUFKOztBQUVBLE1BQUlDLFlBQVk7QUFDZEMsVUFBTSxnQkFBWTtBQUNoQjtBQUNBbEMsZ0NBQTBCRyxFQUExQixFQUE4QnhMLG9CQUE5QixFQUFvRHVMLE1BQXBEOztBQUVBLFVBQUlpQyxPQUFPLElBQVg7QUFDQSxVQUFJQyxPQUFPbEMsTUFBWDs7QUFFQTs7Ozs7OztBQU9BLFVBQUltQyxhQUFhQyxFQUFFLElBQUYsQ0FBakI7QUFDQSxVQUFJQyxrQkFBa0IsK0JBQStCdEMsT0FBckQ7QUFDQUE7QUFDQSxVQUFJdUMsaUJBQWlCRixFQUFFLGNBQWNDLGVBQWQsR0FBZ0MsVUFBbEMsQ0FBckI7O0FBRUEsVUFBSUYsV0FBV0ksSUFBWCxDQUFnQixNQUFNRixlQUF0QixFQUF1Q25NLE1BQXZDLEdBQWdELENBQXBELEVBQXVEO0FBQ3JEaU0sbUJBQVdLLE1BQVgsQ0FBa0JGLGNBQWxCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7O0FBUUEsVUFBSUcsS0FBSjtBQUNBLFVBQUlDLE1BQU1DLE1BQU4sQ0FBYXpNLE1BQWIsR0FBc0I2SixPQUExQixFQUFtQztBQUNqQzBDLGdCQUFRLElBQUlDLE1BQU1FLEtBQVYsQ0FBZ0I7QUFDdEJwTCxjQUFJLHlCQURrQjtBQUV0QnFMLHFCQUFXUixlQUZXLEVBRVE7QUFDOUJTLGlCQUFPWCxXQUFXVyxLQUFYLEVBSGU7QUFJdEJDLGtCQUFRWixXQUFXWSxNQUFYO0FBSmMsU0FBaEIsQ0FBUjtBQU1ELE9BUEQsTUFRSztBQUNITixnQkFBUUMsTUFBTUMsTUFBTixDQUFhNUMsVUFBVSxDQUF2QixDQUFSO0FBQ0Q7O0FBRUQsVUFBSWlELE1BQUo7QUFDQSxVQUFJUCxNQUFNUSxXQUFOLEdBQW9CL00sTUFBcEIsR0FBNkIsQ0FBakMsRUFBb0M7QUFDbEM4TSxpQkFBUyxJQUFJTixNQUFNUSxLQUFWLEVBQVQ7QUFDQVQsY0FBTVUsR0FBTixDQUFVSCxNQUFWO0FBQ0QsT0FIRCxNQUlLO0FBQ0hBLGlCQUFTUCxNQUFNUSxXQUFOLEdBQW9CLENBQXBCLENBQVQ7QUFDRDs7QUFFRCxVQUFJRyxnQkFBZ0I7QUFDbEJoTyxjQUFNVCxTQURZO0FBRWxCME8sa0JBQVUsY0FGUTtBQUdsQkMsaUJBQVMsRUFIUztBQUlsQjtBQUNBQyx1QkFBZTVPLFNBTEc7QUFNbEI7QUFDQTZPLDRCQUFvQjdPLFNBUEY7QUFRbEI4Tyx1QkFBZSx1QkFBU2pILE1BQVQsRUFBZ0I7QUFDN0JBLGlCQUFPa0gsRUFBUCxDQUFVLHNCQUFWLEVBQWtDLEtBQUtDLFVBQXZDO0FBQ0QsU0FWaUI7QUFXbEJDLHlCQUFpQix5QkFBU3BILE1BQVQsRUFBZ0I7QUFDL0JBLGlCQUFPcUgsR0FBUCxDQUFXLHNCQUFYLEVBQW1DLEtBQUtGLFVBQXhDO0FBQ0QsU0FiaUI7QUFjbEI7QUFDQTtBQUNBQSxvQkFBWSxvQkFBU0csS0FBVCxFQUFlO0FBQ3pCO0FBQ0E3RCxhQUFHOEQsZUFBSCxDQUFtQixLQUFuQjs7QUFFQTtBQUNBbEMsMEJBQWdCLElBQWhCO0FBQ0F1Qix3QkFBY0csYUFBZCxHQUE4Qk8sTUFBTXhNLE1BQXBDO0FBQ0F3SyxxQkFBVyxLQUFYO0FBQ0FzQix3QkFBY2hPLElBQWQsQ0FBbUI0TyxRQUFuQjs7QUFFQTtBQUNBLGNBQUlqSCxZQUFZdEkscUJBQXFCUyxNQUFyQixDQUE0QmtPLGNBQWNDLFFBQTFDLEVBQW9ELFFBQXBELENBQWhCO0FBQ0EsY0FBSXJHLGNBQWN2SSxxQkFBcUJTLE1BQXJCLENBQTRCa08sY0FBY0MsUUFBMUMsRUFBb0QsVUFBcEQsQ0FBbEI7O0FBRUEsY0FBSWpPLE9BQU9nTyxjQUFjaE8sSUFBekI7QUFDQTZPLDRCQUFrQjtBQUNoQjdPLGtCQUFNQSxJQURVO0FBRWhCb0Isa0JBQU00TSxjQUFjQyxRQUZKO0FBR2hCdE0scUJBQVMzQixLQUFLYSxJQUFMLENBQVU4RyxTQUFWLElBQXVCLEdBQUdPLE1BQUgsQ0FBVWxJLEtBQUthLElBQUwsQ0FBVThHLFNBQVYsQ0FBVixDQUF2QixHQUF5RCxFQUhsRDtBQUloQmpHLHVCQUFXMUIsS0FBS2EsSUFBTCxDQUFVK0csV0FBVixJQUF5QixHQUFHTSxNQUFILENBQVVsSSxLQUFLYSxJQUFMLENBQVUrRyxXQUFWLENBQVYsQ0FBekIsR0FBNkQ7QUFKeEQsV0FBbEI7O0FBT0FrSDtBQUNBQzs7QUFFQWxFLGFBQUdtRSxhQUFILENBQWlCLElBQWpCOztBQUVBcEIsaUJBQU9xQixRQUFQLEdBQWtCWCxFQUFsQixDQUFxQixnQ0FBckIsRUFBdUROLGNBQWNrQixRQUFyRTtBQUNBdEIsaUJBQU9xQixRQUFQLEdBQWtCWCxFQUFsQixDQUFxQixpQkFBckIsRUFBd0NOLGNBQWNtQixTQUF0RDtBQUNELFNBN0NpQjtBQThDbEI7QUFDQUQsa0JBQVUsa0JBQVNSLEtBQVQsRUFBZTtBQUN2QjtBQUNBakMsMEJBQWdCLEtBQWhCO0FBQ0F1Qix3QkFBY0csYUFBZCxHQUE4QjVPLFNBQTlCO0FBQ0FtTixxQkFBVyxLQUFYO0FBQ0FzQix3QkFBY2hPLElBQWQsQ0FBbUJvUCxNQUFuQjs7QUFFQUM7QUFDQUM7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkF6RSxhQUFHOEQsZUFBSCxDQUFtQixJQUFuQjtBQUNBOUQsYUFBR21FLGFBQUgsQ0FBaUIsS0FBakI7O0FBRUFwQixpQkFBT3FCLFFBQVAsR0FBa0JSLEdBQWxCLENBQXNCLGdDQUF0QixFQUF3RFQsY0FBY2tCLFFBQXRFO0FBQ0F0QixpQkFBT3FCLFFBQVAsR0FBa0JSLEdBQWxCLENBQXNCLGlCQUF0QixFQUF5Q1QsY0FBY21CLFNBQXZEO0FBQ0QsU0FqRmlCO0FBa0ZsQjtBQUNBQSxtQkFBVyxtQkFBVVQsS0FBVixFQUFnQjtBQUN6QmhDLHFCQUFXLElBQVg7QUFDRCxTQXJGaUI7QUFzRmxCNkMsNEJBQW9CLDhCQUErQjtBQUFBOztBQUFBLGNBQXRCQyxTQUFzQix1RUFBVmpRLFNBQVU7O0FBQ2pELGNBQUlrUSxtQkFBbUIsS0FBdkI7O0FBRUEsZUFBS3ZCLE9BQUwsQ0FBYTdJLE9BQWIsQ0FBcUIsVUFBQytCLE1BQUQsRUFBU3NJLEtBQVQsRUFBbUI7QUFDdEMsZ0JBQUdGLGFBQWFwSSxXQUFXb0ksU0FBM0IsRUFBcUM7QUFDbkNDLGlDQUFtQixJQUFuQixDQURtQyxDQUNWO0FBQ3pCO0FBQ0Q7O0FBRUQsa0JBQUtqQixlQUFMLENBQXFCcEgsTUFBckI7QUFDQUEsbUJBQU91SSxPQUFQO0FBQ0QsV0FSRDs7QUFVQSxjQUFHRixnQkFBSCxFQUFvQjtBQUNsQixpQkFBS3ZCLE9BQUwsR0FBZSxDQUFDc0IsU0FBRCxDQUFmO0FBQ0QsV0FGRCxNQUdLO0FBQ0gsaUJBQUt0QixPQUFMLEdBQWUsRUFBZjtBQUNBLGlCQUFLbE8sSUFBTCxHQUFZVCxTQUFaO0FBQ0EsaUJBQUswTyxRQUFMLEdBQWdCLGNBQWhCO0FBQ0Q7QUFDRixTQTNHaUI7QUE0R2xCO0FBQ0EyQiw0QkFBb0IsNEJBQVM1UCxJQUFULEVBQWU7QUFDakMsZUFBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsZUFBS2lPLFFBQUwsR0FBZ0I1TyxxQkFBcUJxQixXQUFyQixDQUFpQ1YsSUFBakMsQ0FBaEI7O0FBRUEsY0FBRyxDQUFDQSxLQUFLVyxRQUFMLENBQWMsK0JBQWQsQ0FBRCxJQUNDLENBQUNYLEtBQUtXLFFBQUwsQ0FBYyxxQ0FBZCxDQURMLEVBQzJEO0FBQ3pEO0FBQ0Q7O0FBRUQsY0FBSXlELGFBQWEvRSxxQkFBcUI4RSxpQkFBckIsQ0FBdUNuRSxJQUF2QyxDQUFqQixDQVRpQyxDQVM2QjtBQUM5RCxjQUFJYyxTQUFTK08sc0JBQXNCN1AsSUFBdEIsSUFBOEIsSUFBM0M7O0FBRUEsY0FBSTRGLFNBQVM1RixLQUFLOEIsTUFBTCxHQUFjQyxRQUFkLEVBQWI7QUFDQSxjQUFJOEQsU0FBUzdGLEtBQUtrQyxNQUFMLEdBQWNILFFBQWQsRUFBYjs7QUFFQSxlQUFJLElBQUlaLElBQUksQ0FBWixFQUFlaUQsY0FBY2pELElBQUlpRCxXQUFXdEQsTUFBNUMsRUFBb0RLLElBQUlBLElBQUksQ0FBNUQsRUFBOEQ7QUFDNUQsZ0JBQUkyTyxVQUFVMUwsV0FBV2pELENBQVgsQ0FBZDtBQUNBLGdCQUFJNE8sVUFBVTNMLFdBQVdqRCxJQUFJLENBQWYsQ0FBZDs7QUFFQSxpQkFBSzZPLGlCQUFMLENBQXVCRixPQUF2QixFQUFnQ0MsT0FBaEMsRUFBeUNqUCxNQUF6QztBQUNEOztBQUVEOE0saUJBQU9xQyxJQUFQO0FBQ0QsU0FwSWlCO0FBcUlsQjtBQUNBRCwyQkFBbUIsMkJBQVNGLE9BQVQsRUFBa0JDLE9BQWxCLEVBQTJCalAsTUFBM0IsRUFBbUM7QUFDcEQ7QUFDQSxjQUFJb1AsV0FBV0osVUFBVWhQLFNBQVMsQ0FBbEM7QUFDQSxjQUFJcVAsV0FBV0osVUFBVWpQLFNBQVMsQ0FBbEM7O0FBRUE7QUFDQSxjQUFJc1AscUJBQXFCQywwQkFBMEIsRUFBQzFOLEdBQUd1TixRQUFKLEVBQWN6TixHQUFHME4sUUFBakIsRUFBMUIsQ0FBekI7QUFDQXJQLG9CQUFVK0osR0FBR3lGLElBQUgsRUFBVjs7QUFFQSxjQUFJQyxZQUFZLElBQUlqRCxNQUFNa0QsSUFBVixDQUFlO0FBQzdCN04sZUFBR3lOLG1CQUFtQnpOLENBRE87QUFFN0JGLGVBQUcyTixtQkFBbUIzTixDQUZPO0FBRzdCaUwsbUJBQU81TSxNQUhzQjtBQUk3QjZNLG9CQUFRN00sTUFKcUI7QUFLN0IyUCxrQkFBTSxPQUx1QjtBQU03QkMseUJBQWEsQ0FOZ0I7QUFPN0JDLHVCQUFXO0FBUGtCLFdBQWYsQ0FBaEI7O0FBVUEsZUFBS3pDLE9BQUwsQ0FBYXRKLElBQWIsQ0FBa0IyTCxTQUFsQjtBQUNBLGVBQUtsQyxhQUFMLENBQW1Ca0MsU0FBbkI7QUFDQTNDLGlCQUFPRyxHQUFQLENBQVd3QyxTQUFYO0FBQ0Q7QUE1SmlCLE9BQXBCOztBQStKQSxVQUFJSyxnQkFBZ0IsU0FBaEJBLGFBQWdCLENBQVNsQyxLQUFULEVBQWU7QUFDakNtQyx3QkFBZ0JuQyxLQUFoQixFQUF1QixNQUF2QjtBQUNELE9BRkQ7O0FBSUEsVUFBSW9DLG1CQUFtQixTQUFuQkEsZ0JBQW1CLENBQVNwQyxLQUFULEVBQWdCO0FBQ3JDbUMsd0JBQWdCbkMsS0FBaEIsRUFBdUIsU0FBdkI7QUFDRCxPQUZEOztBQUlBLFVBQUltQyxrQkFBa0IsU0FBbEJBLGVBQWtCLENBQVVuQyxLQUFWLEVBQWlCcUMsVUFBakIsRUFBNkI7QUFDakQsWUFBSS9RLE9BQU8wTyxNQUFNeE0sTUFBTixJQUFnQndNLE1BQU1zQyxRQUFqQztBQUNBLFlBQUcsQ0FBQzNSLHFCQUFxQmdDLGFBQXJCLENBQW1DckIsSUFBbkMsQ0FBSixFQUE4Qzs7QUFFNUMsY0FBSW9CLE9BQU8vQixxQkFBcUJxQixXQUFyQixDQUFpQ1YsSUFBakMsQ0FBWDtBQUNBLGNBQUkyQixPQUFKLEVBQWFELFNBQWIsRUFBd0JpRyxTQUF4QixFQUFtQ0MsV0FBbkM7O0FBRUEsY0FBR3hHLFNBQVMsY0FBWixFQUEyQjtBQUN6Qk8sc0JBQVUsRUFBVjtBQUNBRCx3QkFBWSxFQUFaO0FBQ0QsV0FIRCxNQUlJO0FBQ0ZpRyx3QkFBWXRJLHFCQUFxQlMsTUFBckIsQ0FBNEJzQixJQUE1QixFQUFrQyxRQUFsQyxDQUFaO0FBQ0F3RywwQkFBY3ZJLHFCQUFxQlMsTUFBckIsQ0FBNEJzQixJQUE1QixFQUFrQyxVQUFsQyxDQUFkOztBQUVBTyxzQkFBVTNCLEtBQUthLElBQUwsQ0FBVThHLFNBQVYsSUFBdUIsR0FBR08sTUFBSCxDQUFVbEksS0FBS2EsSUFBTCxDQUFVOEcsU0FBVixDQUFWLENBQXZCLEdBQXlEM0gsS0FBS2EsSUFBTCxDQUFVOEcsU0FBVixDQUFuRTtBQUNBakcsd0JBQVkxQixLQUFLYSxJQUFMLENBQVUrRyxXQUFWLElBQXlCLEdBQUdNLE1BQUgsQ0FBVWxJLEtBQUthLElBQUwsQ0FBVStHLFdBQVYsQ0FBVixDQUF6QixHQUE2RDVILEtBQUthLElBQUwsQ0FBVStHLFdBQVYsQ0FBekU7QUFDRDs7QUFFRCxjQUFJcUosUUFBUTtBQUNWalIsa0JBQU1BLElBREk7QUFFVm9CLGtCQUFNQSxJQUZJO0FBR1ZPLHFCQUFTQSxPQUhDO0FBSVZELHVCQUFXQTtBQUpELFdBQVo7O0FBT0E7QUFDQXJDLCtCQUFxQm9JLGNBQXJCLENBQW9DbEksU0FBcEMsRUFBK0NBLFNBQS9DLEVBQTBEd1IsVUFBMUQ7O0FBRUEsY0FBSUcsVUFBVUMsUUFBZCxFQUF3QjtBQUN0QnRHLGVBQUd1RyxRQUFILEdBQWNDLEVBQWQsQ0FBaUIsb0JBQWpCLEVBQXVDSixLQUF2QztBQUNEO0FBQ0Y7O0FBRURLO0FBQ0F0UixhQUFLb1AsTUFBTDtBQUNELE9BcENEOztBQXNDQSxVQUFJbUMscUJBQXFCLFNBQXJCQSxrQkFBcUIsQ0FBVTdDLEtBQVYsRUFBaUI7QUFDeEMsWUFBSTFPLE9BQU9nTyxjQUFjaE8sSUFBekI7QUFDQSxZQUFJb0IsT0FBTy9CLHFCQUFxQnFCLFdBQXJCLENBQWlDVixJQUFqQyxDQUFYOztBQUVBLFlBQUdYLHFCQUFxQjhKLGtDQUFyQixDQUF3RC9ILElBQXhELEVBQThELG9DQUE5RCxDQUFILEVBQXVHO0FBQ3JHO0FBQ0Q7O0FBRUQsWUFBSTZQLFFBQVE7QUFDVmpSLGdCQUFNQSxJQURJO0FBRVZvQixnQkFBTUEsSUFGSTtBQUdWTyxtQkFBUyxHQUFHdUcsTUFBSCxDQUFVbEksS0FBS2EsSUFBTCxDQUFVeEIscUJBQXFCUyxNQUFyQixDQUE0QnNCLElBQTVCLEVBQWtDLFFBQWxDLENBQVYsQ0FBVixDQUhDO0FBSVZNLHFCQUFXLEdBQUd3RyxNQUFILENBQVVsSSxLQUFLYSxJQUFMLENBQVV4QixxQkFBcUJTLE1BQXJCLENBQTRCc0IsSUFBNUIsRUFBa0MsVUFBbEMsQ0FBVixDQUFWO0FBSkQsU0FBWjs7QUFPQS9CLDZCQUFxQjZKLFlBQXJCOztBQUVBLFlBQUdnSSxVQUFVQyxRQUFiLEVBQXVCO0FBQ3JCdEcsYUFBR3VHLFFBQUgsR0FBY0MsRUFBZCxDQUFpQixvQkFBakIsRUFBdUNKLEtBQXZDO0FBQ0Q7O0FBRURPLG1CQUFXLFlBQVU7QUFBQ0YseUJBQWV0UixLQUFLb1AsTUFBTDtBQUFlLFNBQXBELEVBQXNELEVBQXREO0FBRUQsT0F2QkQ7O0FBeUJBLFVBQUlxQyx5QkFBeUIsU0FBekJBLHNCQUF5QixDQUFVL0MsS0FBVixFQUFpQjtBQUM1QyxZQUFJMU8sT0FBT2dPLGNBQWNoTyxJQUF6QjtBQUNBLFlBQUlvQixPQUFPL0IscUJBQXFCcUIsV0FBckIsQ0FBaUNWLElBQWpDLENBQVg7QUFDQSxZQUFJaVIsUUFBUTtBQUNWalIsZ0JBQU1BLElBREk7QUFFVm9CLGdCQUFNQSxJQUZJO0FBR1ZPLG1CQUFTLEdBQUd1RyxNQUFILENBQVVsSSxLQUFLYSxJQUFMLENBQVV4QixxQkFBcUJTLE1BQXJCLENBQTRCc0IsSUFBNUIsRUFBa0MsUUFBbEMsQ0FBVixDQUFWLENBSEM7QUFJVk0scUJBQVcsR0FBR3dHLE1BQUgsQ0FBVWxJLEtBQUthLElBQUwsQ0FBVXhCLHFCQUFxQlMsTUFBckIsQ0FBNEJzQixJQUE1QixFQUFrQyxVQUFsQyxDQUFWLENBQVY7QUFKRCxTQUFaOztBQU9BL0IsNkJBQXFCa0ssZ0JBQXJCOztBQUVBLFlBQUkySCxVQUFVQyxRQUFkLEVBQXdCO0FBQ3RCdEcsYUFBR3VHLFFBQUgsR0FBY0MsRUFBZCxDQUFpQixvQkFBakIsRUFBdUNKLEtBQXZDO0FBQ0Q7QUFDRE8sbUJBQVcsWUFBVTtBQUFDRix5QkFBZXRSLEtBQUtvUCxNQUFMO0FBQWUsU0FBcEQsRUFBc0QsRUFBdEQ7QUFDRCxPQWhCRDs7QUFrQkE7QUFDQSxVQUFJc0Msc0JBQXNCNUUsS0FBSzRFLG1CQUEvQjtBQUNBO0FBQ0EsVUFBSUMsZUFBZTdFLEtBQUs2RSxZQUF4QjtBQUNBO0FBQ0EsVUFBSUMsZ0NBQWdDOUUsS0FBSzhFLDZCQUF6Qzs7QUFFQSxVQUFJQyxZQUFZLENBQ2Q7QUFDRXpQLFlBQUkySSxxQkFETjtBQUVFK0csaUJBQVNoRixLQUFLaUYsb0JBRmhCO0FBR0VDLGtCQUFVLE1BSFo7QUFJRUMseUJBQWlCckI7QUFKbkIsT0FEYyxFQU9kO0FBQ0V4TyxZQUFJNEksd0JBRE47QUFFRThHLGlCQUFTaEYsS0FBS29GLHVCQUZoQjtBQUdFRixrQkFBVSxNQUhaO0FBSUVDLHlCQUFpQlY7QUFKbkIsT0FQYyxFQWFkO0FBQ0VuUCxZQUFJNkksMkJBRE47QUFFRTZHLGlCQUFTaEYsS0FBS3FGLDBCQUZoQjtBQUdFSCxrQkFBVWxGLEtBQUtzRixpQ0FBTCxJQUEwQyxpREFIdEQ7QUFJRUgseUJBQWlCUjtBQUpuQixPQWJjLEVBbUJkO0FBQ0VyUCxZQUFJOEksd0JBRE47QUFFRTRHLGlCQUFTaEYsS0FBS3VGLHVCQUZoQjtBQUdFTCxrQkFBVSxNQUhaO0FBSUVNLG9CQUFZLElBSmQ7QUFLRUwseUJBQWlCbkI7QUFMbkIsT0FuQmMsRUEwQmQ7QUFDRTFPLFlBQUkrSSwyQkFETjtBQUVFMkcsaUJBQVNoRixLQUFLeUYsMEJBRmhCO0FBR0VQLGtCQUFVLE1BSFo7QUFJRU0sb0JBQVksSUFKZDtBQUtFTCx5QkFBaUJWO0FBTG5CLE9BMUJjLEVBaUNkO0FBQ0VuUCxZQUFJZ0osOEJBRE47QUFFRTBHLGlCQUFTaEYsS0FBSzBGLDZCQUZoQjtBQUdFUixrQkFBVWxGLEtBQUtzRixpQ0FBTCxJQUEwQyx1REFIdEQ7QUFJRUgseUJBQWlCUjtBQUpuQixPQWpDYyxDQUFoQjs7QUF5Q0EsVUFBRzVHLEdBQUc0SCxZQUFOLEVBQW9CO0FBQ2xCLFlBQUlDLFFBQVE3SCxHQUFHNEgsWUFBSCxDQUFnQixLQUFoQixDQUFaO0FBQ0E7QUFDQTtBQUNBLFlBQUlDLE1BQU1DLFFBQU4sRUFBSixFQUFzQjtBQUNwQkQsZ0JBQU1FLGVBQU4sQ0FBc0JmLFNBQXRCO0FBQ0QsU0FGRCxNQUdLO0FBQ0hoSCxhQUFHNEgsWUFBSCxDQUFnQjtBQUNkWix1QkFBV0E7QUFERyxXQUFoQjtBQUdEO0FBQ0Y7O0FBRUQsVUFBSWdCLGNBQWN0SSxTQUFTLFlBQVk7QUFDckMyQyx1QkFDRzRGLElBREgsQ0FDUSxRQURSLEVBQ2tCL0YsV0FBV1ksTUFBWCxFQURsQixFQUVHbUYsSUFGSCxDQUVRLE9BRlIsRUFFaUIvRixXQUFXVyxLQUFYLEVBRmpCLEVBR0c5TSxHQUhILENBR087QUFDSCxzQkFBWSxVQURUO0FBRUgsaUJBQU8sQ0FGSjtBQUdILGtCQUFRLENBSEw7QUFJSCxxQkFBV3NRLFVBQVU2QjtBQUpsQixTQUhQOztBQVdBdkIsbUJBQVcsWUFBWTtBQUNyQixjQUFJd0IsV0FBVzlGLGVBQWUrRixNQUFmLEVBQWY7QUFDQSxjQUFJQyxjQUFjbkcsV0FBV2tHLE1BQVgsRUFBbEI7O0FBRUEvRix5QkFDR3RNLEdBREgsQ0FDTztBQUNILG1CQUFPLEVBQUVvUyxTQUFTRyxHQUFULEdBQWVELFlBQVlDLEdBQTdCLENBREo7QUFFSCxvQkFBUSxFQUFFSCxTQUFTSSxJQUFULEdBQWdCRixZQUFZRSxJQUE5QjtBQUZMLFdBRFA7O0FBT0F4RixpQkFBT3FCLFFBQVAsR0FBa0JvRSxRQUFsQixDQUEyQnRHLFdBQVdXLEtBQVgsRUFBM0I7QUFDQUUsaUJBQU9xQixRQUFQLEdBQWtCcUUsU0FBbEIsQ0FBNEJ2RyxXQUFXWSxNQUFYLEVBQTVCOztBQUVBO0FBQ0EsY0FBRzlDLEVBQUgsRUFBTTtBQUNKeUc7QUFDRDtBQUNGLFNBbEJELEVBa0JHLENBbEJIO0FBb0JELE9BaENpQixFQWdDZixHQWhDZSxDQUFsQjs7QUFrQ0EsZUFBU2lDLFVBQVQsR0FBc0I7QUFDcEJWO0FBQ0Q7O0FBRURVOztBQUVBdkcsUUFBRXdHLE1BQUYsRUFBVUMsSUFBVixDQUFlLFFBQWYsRUFBeUIsWUFBWTtBQUNuQ0Y7QUFDRCxPQUZEOztBQUlBO0FBQ0EsVUFBSTFTLE9BQU9rTSxXQUFXbE0sSUFBWCxDQUFnQixlQUFoQixDQUFYO0FBQ0EsVUFBSUEsUUFBUSxJQUFaLEVBQWtCO0FBQ2hCQSxlQUFPLEVBQVA7QUFDRDtBQUNEQSxXQUFLcVEsT0FBTCxHQUFlcEUsSUFBZjs7QUFFQSxVQUFJNEcsUUFBSjs7QUFFQSxlQUFTeEMsT0FBVCxHQUFtQjtBQUNqQixlQUFPd0MsYUFBYUEsV0FBVzNHLFdBQVdsTSxJQUFYLENBQWdCLGVBQWhCLEVBQWlDcVEsT0FBekQsQ0FBUDtBQUNEOztBQUVEO0FBQ0EsZUFBU2IseUJBQVQsQ0FBbUNzRCxhQUFuQyxFQUFrRDtBQUNoRCxZQUFJQyxNQUFNL0ksR0FBRytJLEdBQUgsRUFBVjtBQUNBLFlBQUl0RCxPQUFPekYsR0FBR3lGLElBQUgsRUFBWDs7QUFFQSxZQUFJM04sSUFBSWdSLGNBQWNoUixDQUFkLEdBQWtCMk4sSUFBbEIsR0FBeUJzRCxJQUFJalIsQ0FBckM7QUFDQSxZQUFJRixJQUFJa1IsY0FBY2xSLENBQWQsR0FBa0I2TixJQUFsQixHQUF5QnNELElBQUluUixDQUFyQzs7QUFFQSxlQUFPO0FBQ0xFLGFBQUdBLENBREU7QUFFTEYsYUFBR0E7QUFGRSxTQUFQO0FBSUQ7O0FBRUQsZUFBUzZPLFlBQVQsR0FBd0I7O0FBRXRCO0FBQ0F0RCxzQkFBY3VCLGtCQUFkLENBQWlDdkIsY0FBY0csYUFBL0M7O0FBRUEsWUFBRzVCLG1CQUFtQixJQUF0QixFQUEyQjtBQUN6QkEseUJBQWVvRCxPQUFmO0FBQ0FwRCwyQkFBaUIsSUFBakI7QUFDRDtBQUNELFlBQUdDLG1CQUFtQixJQUF0QixFQUEyQjtBQUN6QkEseUJBQWVtRCxPQUFmO0FBQ0FuRCwyQkFBaUIsSUFBakI7QUFDRDtBQUNEb0IsZUFBT3FDLElBQVA7O0FBRUEsWUFBSTVELGVBQUosRUFBc0I7QUFDcEIyQix3QkFBYzRCLGtCQUFkLENBQWlDdkQsZUFBakM7QUFDQXdILCtCQUFxQnhILGVBQXJCO0FBQ0Q7QUFDRjs7QUFFRDtBQUNBLGVBQVN3SCxvQkFBVCxDQUE4QjdULElBQTlCLEVBQW9DO0FBQ2xDLFlBQUcsQ0FBQ0EsSUFBSixFQUFTO0FBQ1A7QUFDRDs7QUFFRCxZQUFJOFQsV0FBV3pVLHFCQUFxQjhFLGlCQUFyQixDQUF1Q25FLElBQXZDLENBQWY7QUFDQSxZQUFHLE9BQU84VCxRQUFQLEtBQW9CLFdBQXZCLEVBQW1DO0FBQ2pDQSxxQkFBVyxFQUFYO0FBQ0Q7QUFDRCxZQUFJQyxZQUFZL1QsS0FBS2dVLGNBQUwsRUFBaEI7QUFDQSxZQUFJQyxZQUFZalUsS0FBS2tVLGNBQUwsRUFBaEI7QUFDQUosaUJBQVNLLE9BQVQsQ0FBaUJKLFVBQVV0UixDQUEzQjtBQUNBcVIsaUJBQVNLLE9BQVQsQ0FBaUJKLFVBQVVwUixDQUEzQjtBQUNBbVIsaUJBQVNsUCxJQUFULENBQWNxUCxVQUFVdFIsQ0FBeEI7QUFDQW1SLGlCQUFTbFAsSUFBVCxDQUFjcVAsVUFBVXhSLENBQXhCOztBQUdBLFlBQUcsQ0FBQ3FSLFFBQUosRUFDRTs7QUFFRixZQUFJTSxNQUFNO0FBQ1J6UixhQUFHbVIsU0FBUyxDQUFULENBREs7QUFFUnJSLGFBQUdxUixTQUFTLENBQVQ7QUFGSyxTQUFWOztBQUtBLFlBQUk1UixTQUFTO0FBQ1hTLGFBQUdtUixTQUFTQSxTQUFTaFQsTUFBVCxHQUFnQixDQUF6QixDQURRO0FBRVgyQixhQUFHcVIsU0FBU0EsU0FBU2hULE1BQVQsR0FBZ0IsQ0FBekI7QUFGUSxTQUFiOztBQUtBLFlBQUl1VCxlQUFlO0FBQ2pCMVIsYUFBR21SLFNBQVMsQ0FBVCxDQURjO0FBRWpCclIsYUFBR3FSLFNBQVMsQ0FBVDtBQUZjLFNBQW5CO0FBSUEsWUFBSVEsZUFBZTtBQUNqQjNSLGFBQUdtUixTQUFTQSxTQUFTaFQsTUFBVCxHQUFnQixDQUF6QixDQURjO0FBRWpCMkIsYUFBR3FSLFNBQVNBLFNBQVNoVCxNQUFULEdBQWdCLENBQXpCO0FBRmMsU0FBbkI7QUFJQSxZQUFJQSxTQUFTK08sc0JBQXNCN1AsSUFBdEIsSUFBOEIsSUFBM0M7O0FBRUF1VSxnQ0FBd0JILEdBQXhCLEVBQTZCbFMsTUFBN0IsRUFBcUNwQixNQUFyQyxFQUE0Q3VULFlBQTVDLEVBQXlEQyxZQUF6RDtBQUVEOztBQUVELGVBQVNDLHVCQUFULENBQWlDelMsTUFBakMsRUFBeUNJLE1BQXpDLEVBQWlEcEIsTUFBakQsRUFBd0R1VCxZQUF4RCxFQUFxRUMsWUFBckUsRUFBbUY7QUFDakY7QUFDQSxZQUFJRSxZQUFZMVMsT0FBT2EsQ0FBUCxHQUFXN0IsU0FBUyxDQUFwQztBQUNBLFlBQUkyVCxZQUFZM1MsT0FBT1csQ0FBUCxHQUFXM0IsU0FBUyxDQUFwQzs7QUFFQSxZQUFJNFQsWUFBWXhTLE9BQU9TLENBQVAsR0FBVzdCLFNBQVMsQ0FBcEM7QUFDQSxZQUFJNlQsWUFBWXpTLE9BQU9PLENBQVAsR0FBVzNCLFNBQVMsQ0FBcEM7O0FBRUEsWUFBSThULGdCQUFnQlAsYUFBYTFSLENBQWIsR0FBaUI3QixTQUFRLENBQTdDO0FBQ0EsWUFBSStULGdCQUFnQlIsYUFBYTVSLENBQWIsR0FBaUIzQixTQUFTLENBQTlDOztBQUVBLFlBQUlnVSxnQkFBZ0JSLGFBQWEzUixDQUFiLEdBQWlCN0IsU0FBUSxDQUE3QztBQUNBLFlBQUlpVSxnQkFBZ0JULGFBQWE3UixDQUFiLEdBQWlCM0IsU0FBUSxDQUE3Qzs7QUFHQTtBQUNBLFlBQUlrVSxvQkFBb0IzRSwwQkFBMEIsRUFBQzFOLEdBQUc2UixTQUFKLEVBQWUvUixHQUFHZ1MsU0FBbEIsRUFBMUIsQ0FBeEI7QUFDQSxZQUFJUSxvQkFBb0I1RSwwQkFBMEIsRUFBQzFOLEdBQUcrUixTQUFKLEVBQWVqUyxHQUFHa1MsU0FBbEIsRUFBMUIsQ0FBeEI7QUFDQTdULGlCQUFTQSxTQUFTK0osR0FBR3lGLElBQUgsRUFBVCxHQUFxQixDQUE5Qjs7QUFFQSxZQUFJNEUsdUJBQXVCN0UsMEJBQTBCLEVBQUMxTixHQUFHaVMsYUFBSixFQUFtQm5TLEdBQUdvUyxhQUF0QixFQUExQixDQUEzQjtBQUNBLFlBQUlNLHVCQUF1QjlFLDBCQUEwQixFQUFDMU4sR0FBR21TLGFBQUosRUFBbUJyUyxHQUFHc1MsYUFBdEIsRUFBMUIsQ0FBM0I7O0FBRUE7QUFDQSxZQUFJSyxtQkFBbUJ0VSxNQUF2Qjs7QUFFQSxZQUFJdVUsaUJBQWlCcFMsS0FBS2tELElBQUwsQ0FBVWxELEtBQUsrRCxHQUFMLENBQVNrTyxxQkFBcUJ2UyxDQUFyQixHQUF5QnFTLGtCQUFrQnJTLENBQXBELEVBQXNELENBQXRELElBQTJETSxLQUFLK0QsR0FBTCxDQUFTa08scUJBQXFCelMsQ0FBckIsR0FBeUJ1UyxrQkFBa0J2UyxDQUFwRCxFQUFzRCxDQUF0RCxDQUFyRSxDQUFyQjtBQUNBLFlBQUk2UyxrQkFBa0JOLGtCQUFrQnJTLENBQWxCLEdBQXdCeVMsbUJBQWtCQyxjQUFuQixJQUFxQ0gscUJBQXFCdlMsQ0FBckIsR0FBeUJxUyxrQkFBa0JyUyxDQUFoRixDQUE3QztBQUNBLFlBQUk0UyxrQkFBa0JQLGtCQUFrQnZTLENBQWxCLEdBQXdCMlMsbUJBQWtCQyxjQUFuQixJQUFxQ0gscUJBQXFCelMsQ0FBckIsR0FBeUJ1UyxrQkFBa0J2UyxDQUFoRixDQUE3Qzs7QUFHQSxZQUFJK1MsaUJBQWlCdlMsS0FBS2tELElBQUwsQ0FBVWxELEtBQUsrRCxHQUFMLENBQVNtTyxxQkFBcUJ4UyxDQUFyQixHQUF5QnNTLGtCQUFrQnRTLENBQXBELEVBQXNELENBQXRELElBQTJETSxLQUFLK0QsR0FBTCxDQUFTbU8scUJBQXFCMVMsQ0FBckIsR0FBeUJ3UyxrQkFBa0J4UyxDQUFwRCxFQUFzRCxDQUF0RCxDQUFyRSxDQUFyQjtBQUNBLFlBQUlnVCxrQkFBa0JSLGtCQUFrQnRTLENBQWxCLEdBQXdCeVMsbUJBQWtCSSxjQUFuQixJQUFxQ0wscUJBQXFCeFMsQ0FBckIsR0FBeUJzUyxrQkFBa0J0UyxDQUFoRixDQUE3QztBQUNBLFlBQUkrUyxrQkFBa0JULGtCQUFrQnhTLENBQWxCLEdBQXdCMlMsbUJBQWtCSSxjQUFuQixJQUFxQ0wscUJBQXFCMVMsQ0FBckIsR0FBeUJ3UyxrQkFBa0J4UyxDQUFoRixDQUE3Qzs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxZQUFHOEosbUJBQW1CLElBQXRCLEVBQTJCO0FBQ3pCQSwyQkFBaUIsSUFBSWUsTUFBTXFJLE1BQVYsQ0FBaUI7QUFDaENoVCxlQUFHMlMsa0JBQWtCeFUsTUFEVztBQUVoQzJCLGVBQUc4UyxrQkFBa0J6VSxNQUZXO0FBR2hDOFUsb0JBQVE5VSxNQUh3QjtBQUloQzJQLGtCQUFNO0FBSjBCLFdBQWpCLENBQWpCO0FBTUQ7O0FBRUQsWUFBR2pFLG1CQUFtQixJQUF0QixFQUEyQjtBQUN6QkEsMkJBQWlCLElBQUljLE1BQU1xSSxNQUFWLENBQWlCO0FBQ2hDaFQsZUFBRzhTLGtCQUFrQjNVLE1BRFc7QUFFaEMyQixlQUFHaVQsa0JBQWtCNVUsTUFGVztBQUdoQzhVLG9CQUFROVUsTUFId0I7QUFJaEMyUCxrQkFBTTtBQUowQixXQUFqQixDQUFqQjtBQU1EOztBQUVEN0MsZUFBT0csR0FBUCxDQUFXeEIsY0FBWDtBQUNBcUIsZUFBT0csR0FBUCxDQUFXdkIsY0FBWDtBQUNBb0IsZUFBT3FDLElBQVA7QUFFRDs7QUFFRDtBQUNBLGVBQVNKLHFCQUFULENBQStCN1AsSUFBL0IsRUFBcUM7QUFDbkMsWUFBSTZWLFNBQVMzRSxVQUFVNEUscUJBQXZCO0FBQ0EsWUFBRzVFLFVBQVU2RSwrQkFBYixFQUE4QyxJQUFJQyxlQUFjSCxTQUFPaEwsR0FBR3lGLElBQUgsRUFBekIsQ0FBOUMsS0FDSyxJQUFJMEYsZUFBY0gsTUFBbEI7QUFDTCxZQUFJSSxXQUFXalcsS0FBS1ksR0FBTCxDQUFTLE9BQVQsQ0FBWCxLQUFpQyxHQUFyQyxFQUNFLE9BQU8sTUFBTW9WLFlBQWIsQ0FERixLQUVLLE9BQU9DLFdBQVdqVyxLQUFLWSxHQUFMLENBQVMsT0FBVCxDQUFYLElBQThCb1YsWUFBckM7QUFDTjs7QUFFRDtBQUNBLGVBQVNFLGtCQUFULENBQTRCdlQsQ0FBNUIsRUFBK0JGLENBQS9CLEVBQWtDM0IsTUFBbEMsRUFBMENxVixPQUExQyxFQUFtREMsT0FBbkQsRUFBMkQ7QUFDekQsWUFBSUMsT0FBT0YsVUFBVXJWLFNBQVMsQ0FBOUI7QUFDQSxZQUFJd1YsT0FBT0gsVUFBVXJWLFNBQVMsQ0FBOUI7QUFDQSxZQUFJeVYsT0FBT0gsVUFBVXRWLFNBQVMsQ0FBOUI7QUFDQSxZQUFJMFYsT0FBT0osVUFBVXRWLFNBQVMsQ0FBOUI7O0FBRUEsWUFBSTJWLFNBQVU5VCxLQUFLMFQsSUFBTCxJQUFhMVQsS0FBSzJULElBQW5CLElBQTZCN1QsS0FBSzhULElBQUwsSUFBYTlULEtBQUsrVCxJQUE1RDtBQUNBLGVBQU9DLE1BQVA7QUFDRDs7QUFFRDtBQUNBLGVBQVNDLHVCQUFULENBQWlDL1QsQ0FBakMsRUFBb0NGLENBQXBDLEVBQXVDekMsSUFBdkMsRUFBNkM7QUFDM0MsWUFBSW9CLE9BQU8vQixxQkFBcUJxQixXQUFyQixDQUFpQ1YsSUFBakMsQ0FBWDs7QUFFQSxZQUFHb0IsU0FBUyxjQUFaLEVBQTJCO0FBQ3pCLGlCQUFPLENBQUMsQ0FBUjtBQUNEOztBQUVELFlBQUdwQixLQUFLYSxJQUFMLENBQVV4QixxQkFBcUJTLE1BQXJCLENBQTRCc0IsSUFBNUIsRUFBa0MsUUFBbEMsQ0FBVixLQUEwRCxJQUExRCxJQUNEcEIsS0FBS2EsSUFBTCxDQUFVeEIscUJBQXFCUyxNQUFyQixDQUE0QnNCLElBQTVCLEVBQWtDLFFBQWxDLENBQVYsRUFBdUROLE1BQXZELElBQWlFLENBRG5FLEVBQ3FFO0FBQ25FLGlCQUFPLENBQUMsQ0FBUjtBQUNEOztBQUVELFlBQUlzRCxhQUFhL0UscUJBQXFCOEUsaUJBQXJCLENBQXVDbkUsSUFBdkMsQ0FBakIsQ0FaMkMsQ0FZbUI7QUFDOUQsWUFBSWMsU0FBUytPLHNCQUFzQjdQLElBQXRCLENBQWI7O0FBRUEsYUFBSSxJQUFJbUIsSUFBSSxDQUFaLEVBQWVpRCxjQUFjakQsSUFBSWlELFdBQVd0RCxNQUE1QyxFQUFvREssSUFBSUEsSUFBSSxDQUE1RCxFQUE4RDtBQUM1RCxjQUFJMk8sVUFBVTFMLFdBQVdqRCxDQUFYLENBQWQ7QUFDQSxjQUFJNE8sVUFBVTNMLFdBQVdqRCxJQUFJLENBQWYsQ0FBZDs7QUFFQSxjQUFJc1YsU0FBU1AsbUJBQW1CdlQsQ0FBbkIsRUFBc0JGLENBQXRCLEVBQXlCM0IsTUFBekIsRUFBaUNnUCxPQUFqQyxFQUEwQ0MsT0FBMUMsQ0FBYjtBQUNBLGNBQUcwRyxNQUFILEVBQVU7QUFDUixtQkFBT3RWLElBQUksQ0FBWDtBQUNEO0FBQ0Y7O0FBRUQsZUFBTyxDQUFDLENBQVI7QUFDRDs7QUFFRCxlQUFTd1YscUJBQVQsQ0FBK0JoVSxDQUEvQixFQUFrQ0YsQ0FBbEMsRUFBcUN6QyxJQUFyQyxFQUEwQztBQUN4QyxZQUFJYyxTQUFTK08sc0JBQXNCN1AsSUFBdEIsQ0FBYjtBQUNBLFlBQUk0VyxTQUFTNVcsS0FBSzZXLFFBQUwsQ0FBY0MsUUFBZCxDQUF1QkMsTUFBcEM7QUFDQSxZQUFJM0MsTUFBTTtBQUNSelIsYUFBR2lVLE9BQU8sQ0FBUCxDQURLO0FBRVJuVSxhQUFHbVUsT0FBTyxDQUFQO0FBRkssU0FBVjtBQUlBLFlBQUkxVSxTQUFTO0FBQ1hTLGFBQUdpVSxPQUFPQSxPQUFPOVYsTUFBUCxHQUFjLENBQXJCLENBRFE7QUFFWDJCLGFBQUdtVSxPQUFPQSxPQUFPOVYsTUFBUCxHQUFjLENBQXJCO0FBRlEsU0FBYjtBQUlBdVAsa0NBQTBCK0QsR0FBMUI7QUFDQS9ELGtDQUEwQm5PLE1BQTFCOztBQUVBO0FBQ0EsWUFBR2dVLG1CQUFtQnZULENBQW5CLEVBQXNCRixDQUF0QixFQUF5QjNCLE1BQXpCLEVBQWlDc1QsSUFBSXpSLENBQXJDLEVBQXdDeVIsSUFBSTNSLENBQTVDLENBQUgsRUFDRSxPQUFPLENBQVAsQ0FERixLQUVLLElBQUd5VCxtQkFBbUJ2VCxDQUFuQixFQUFzQkYsQ0FBdEIsRUFBeUIzQixNQUF6QixFQUFpQ29CLE9BQU9TLENBQXhDLEVBQTJDVCxPQUFPTyxDQUFsRCxDQUFILEVBQ0gsT0FBTyxDQUFQLENBREcsS0FHSCxPQUFPLENBQUMsQ0FBUjtBQUNIOztBQUVEO0FBQ0EsZUFBU3NNLGVBQVQsR0FBMkI7QUFDekI5Qyw2QkFBcUJwQixHQUFHbU0sY0FBSCxFQUFyQjtBQUNBOUssNkJBQXFCckIsR0FBR29NLGNBQUgsRUFBckI7QUFDQTlLLGtDQUEwQnRCLEdBQUdxTSxtQkFBSCxFQUExQjs7QUFFQXJNLFdBQUdvTSxjQUFILENBQWtCLEtBQWxCLEVBQ0dELGNBREgsQ0FDa0IsS0FEbEIsRUFFR0UsbUJBRkgsQ0FFdUIsS0FGdkI7QUFHRDs7QUFFRDtBQUNBLGVBQVM1SCxhQUFULEdBQXlCO0FBQ3ZCekUsV0FBR29NLGNBQUgsQ0FBa0IvSyxrQkFBbEIsRUFDRzhLLGNBREgsQ0FDa0IvSyxrQkFEbEIsRUFFR2lMLG1CQUZILENBRXVCL0ssdUJBRnZCO0FBR0Q7O0FBRUQsZUFBUzJDLG9CQUFULEdBQStCO0FBQzdCO0FBQ0EsWUFBSWpFLEdBQUdzTSxLQUFILEdBQVdOLFFBQVgsQ0FBb0JPLFNBQXBCLENBQThCLG1CQUE5QixDQUFKLEVBQXdEO0FBQ3REaEwsZ0NBQXNCdkIsR0FBR3NNLEtBQUgsR0FBV04sUUFBWCxDQUFvQk8sU0FBcEIsQ0FBOEIsbUJBQTlCLEVBQW1EQyxLQUF6RTtBQUNELFNBRkQsTUFHSztBQUNIO0FBQ0E7QUFDQWpMLGdDQUFzQixJQUF0QjtBQUNEOztBQUVEdkIsV0FBR3NNLEtBQUgsR0FDR25GLFFBREgsQ0FDWSxNQURaLEVBRUdtRixLQUZILENBRVMsbUJBRlQsRUFFOEIsQ0FGOUIsRUFHR0csTUFISDtBQUlEOztBQUVELGVBQVNqSSxrQkFBVCxHQUE2QjtBQUMzQnhFLFdBQUdzTSxLQUFILEdBQ0duRixRQURILENBQ1ksTUFEWixFQUVHbUYsS0FGSCxDQUVTLG1CQUZULEVBRThCL0ssbUJBRjlCLEVBR0drTCxNQUhIO0FBSUQ7O0FBRUQsZUFBU0MsZ0JBQVQsQ0FBMEJDLFlBQTFCLEVBQXdDdFcsS0FBeEMsRUFBK0M7QUFDM0NBLGNBQU1tRSxPQUFOLENBQWMsVUFBVXJGLElBQVYsRUFBZ0I7QUFDMUIsY0FBSXlYLDBCQUEwQnBZLHFCQUFxQjhFLGlCQUFyQixDQUF1Q25FLElBQXZDLENBQTlCO0FBQ0EsY0FBSTBYLDJCQUEyQixFQUEvQjtBQUNBLGNBQUlELDJCQUEyQmxZLFNBQS9CLEVBQ0E7QUFDRSxpQkFBSyxJQUFJNEIsSUFBRSxDQUFYLEVBQWNBLElBQUVzVyx3QkFBd0IzVyxNQUF4QyxFQUFnREssS0FBRyxDQUFuRCxFQUNBO0FBQ0l1Vyx1Q0FBeUI5UyxJQUF6QixDQUE4QixFQUFDakMsR0FBRzhVLHdCQUF3QnRXLENBQXhCLElBQTJCcVcsYUFBYTdVLENBQTVDLEVBQStDRixHQUFHZ1Ysd0JBQXdCdFcsSUFBRSxDQUExQixJQUE2QnFXLGFBQWEvVSxDQUE1RixFQUE5QjtBQUNIO0FBQ0QsZ0JBQUlyQixPQUFPL0IscUJBQXFCcUIsV0FBckIsQ0FBaUNWLElBQWpDLENBQVg7O0FBRUEsZ0JBQUdYLHFCQUFxQjhKLGtDQUFyQixDQUF3RC9ILElBQXhELEVBQThELGtDQUE5RCxDQUFILEVBQXFHO0FBQ25HO0FBQ0Q7O0FBRURwQixpQkFBS2EsSUFBTCxDQUFVeEIscUJBQXFCUyxNQUFyQixDQUE0QnNCLElBQTVCLEVBQWtDLFVBQWxDLENBQVYsRUFBeURzVyx3QkFBekQ7QUFDRDtBQUNKLFNBakJEO0FBa0JBclksNkJBQXFCMEIsZ0JBQXJCLENBQXNDbVEsVUFBVXlHLHFCQUFoRCxFQUF1RXpHLFVBQVUwRyx3QkFBakYsRUFBMkcxVyxLQUEzRzs7QUFFQTtBQUNBO0FBQ0EySixXQUFHZ04sT0FBSCxDQUFXLG1CQUFYO0FBQ0g7O0FBR0QsZUFBU0MsNEJBQVQsQ0FBc0NDLEVBQXRDLEVBQTBDQyxFQUExQyxFQUE2QztBQUMzQyxZQUFJQyxlQUFlaFYsS0FBS2lWLEtBQUwsQ0FBV0YsR0FBR3ZWLENBQUgsR0FBT3NWLEdBQUd0VixDQUFyQixFQUF3QnVWLEdBQUdyVixDQUFILEdBQU9vVixHQUFHcFYsQ0FBbEMsQ0FBbkI7QUFDQSxZQUFJd1YsZUFBYSxDQUFDLENBQUNsVixLQUFLbVYsRUFBUCxFQUFVLENBQUNuVixLQUFLbVYsRUFBTixHQUFTLENBQVQsR0FBVyxDQUFyQixFQUF1QixDQUFDblYsS0FBS21WLEVBQU4sR0FBUyxDQUFoQyxFQUFrQyxDQUFDblYsS0FBS21WLEVBQU4sR0FBUyxDQUEzQyxFQUE2QyxDQUE3QyxFQUErQ25WLEtBQUttVixFQUFMLEdBQVEsQ0FBdkQsRUFBeURuVixLQUFLbVYsRUFBTCxHQUFRLENBQWpFLEVBQW1FblYsS0FBS21WLEVBQUwsR0FBUSxDQUFSLEdBQVUsQ0FBN0UsRUFBK0VuVixLQUFLbVYsRUFBTCxHQUFRLENBQXZGLENBQWpCO0FBQ0EsWUFBSUMsYUFBVyxFQUFmO0FBQ0FGLHFCQUFhOVMsT0FBYixDQUFxQixVQUFDaVQsS0FBRCxFQUFTO0FBQUNELHFCQUFXelQsSUFBWCxDQUFnQjNCLEtBQUtDLEdBQUwsQ0FBUytVLGVBQWFLLEtBQXRCLENBQWhCO0FBQThDLFNBQTdFO0FBQ0EsWUFBSUMsYUFBWUYsV0FBV0csT0FBWCxDQUFtQnZWLEtBQUt1QixHQUFMLGFBQVk2VCxVQUFaLENBQW5CLENBQWhCO0FBQ0EsWUFBSXJTLEtBQU9nUyxHQUFHdlYsQ0FBSCxHQUFPc1YsR0FBR3RWLENBQXJCO0FBQ0EsWUFBSXdELEtBQU8rUixHQUFHclYsQ0FBSCxHQUFPb1YsR0FBR3BWLENBQXJCO0FBQ0EsWUFBSXVELElBQUVqRCxLQUFLa0QsSUFBTCxDQUFXRixLQUFLQSxFQUFMLEdBQVVELEtBQUtBLEVBQTFCLENBQU47QUFDQSxZQUFJeVMsT0FBS3hWLEtBQUtDLEdBQUwsQ0FBU2dELElBQUVqRCxLQUFLeVYsR0FBTCxDQUFTTCxXQUFXRSxVQUFYLENBQVQsQ0FBWCxDQUFUOztBQUVBLFlBQUlJLGNBQVlSLGFBQWFJLFVBQWIsQ0FBaEI7QUFDQSxZQUFJSyxRQUFNM1YsS0FBS0MsR0FBTCxDQUFTZ0QsSUFBRWpELEtBQUs0VixHQUFMLENBQVNSLFdBQVdFLFVBQVgsQ0FBVCxDQUFYLENBQVY7QUFDQSxZQUFJTyxlQUFhZixHQUFHcFYsQ0FBSCxHQUFPaVcsUUFBTTNWLEtBQUs0VixHQUFMLENBQVNGLFdBQVQsQ0FBOUI7QUFDQSxZQUFJSSxlQUFhaEIsR0FBR3RWLENBQUgsR0FBT21XLFFBQU0zVixLQUFLeVYsR0FBTCxDQUFTQyxXQUFULENBQTlCOztBQUVBLGVBQU8sRUFBQyxnQkFBZUYsSUFBaEIsRUFBcUIsS0FBSUssWUFBekIsRUFBc0MsS0FBSUMsWUFBMUMsRUFBdUQsU0FBUUosV0FBL0QsRUFBUDtBQUNEOztBQUVELGVBQVNLLGdCQUFULENBQTBCaFosSUFBMUIsRUFBZ0NvQixJQUFoQyxFQUFzQ3NPLEtBQXRDLEVBQTZDM04sUUFBN0MsRUFBc0Q7QUFDcEQsWUFBSWtYLG9CQUFrQjVaLHFCQUFxQndILGlDQUFyQixDQUF1RDdHLElBQXZELEVBQTREb0IsSUFBNUQsRUFBaUVzTyxLQUFqRSxDQUF0QjtBQUNBLFlBQUl3SixvQkFBa0I3WixxQkFBcUJ5SCxpQ0FBckIsQ0FBdUQ5RyxJQUF2RCxFQUE0RG9CLElBQTVELEVBQWlFc08sS0FBakUsQ0FBdEI7QUFDQSxZQUFJeUosZ0JBQWdCcFgsUUFBcEI7O0FBRUE7QUFDQSxZQUFJcVgsWUFBVXRCLDZCQUE2Qm1CLGlCQUE3QixFQUErQ0UsYUFBL0MsQ0FBZDtBQUNBLFlBQUlFLFlBQVV2Qiw2QkFBNkJvQixpQkFBN0IsRUFBK0NDLGFBQS9DLENBQWQ7QUFDQSxZQUFJRyxjQUFZLElBQWhCOztBQUVBLFlBQUlDLFlBQVUxTyxHQUFHeUYsSUFBSCxFQUFkOztBQUVBLFlBQUk4SSxVQUFVSSxZQUFWLEdBQXlCRCxTQUF6QixHQUFxQ3pNLEtBQUsyTSxxQkFBMUMsSUFDQ0osVUFBVUcsWUFBVixHQUF5QkQsU0FBekIsR0FBcUN6TSxLQUFLMk0scUJBRC9DLEVBQ3NFO0FBQ3BFO0FBQ0ExWCxtQkFBU1ksQ0FBVCxHQUFheVcsVUFBVXpXLENBQXZCO0FBQ0FaLG1CQUFTVSxDQUFULEdBQWEyVyxVQUFVM1csQ0FBdkI7QUFDRCxTQUxELE1BS00sSUFBRzJXLFVBQVVJLFlBQVYsR0FBeUJELFNBQXpCLEdBQXFDek0sS0FBSzJNLHFCQUExQyxJQUNKSixVQUFVRyxZQUFWLEdBQXlCRCxTQUF6QixHQUFxQ3pNLEtBQUsyTSxxQkFEekMsRUFDK0Q7QUFDakU7QUFDQTFYLG1CQUFTWSxDQUFULEdBQWEwVyxVQUFVMVcsQ0FBdkI7QUFDQVosbUJBQVNVLENBQVQsR0FBYTRXLFVBQVU1VyxDQUF2QjtBQUNILFNBTEssTUFLQSxJQUFHMlcsVUFBVUksWUFBVixHQUF5QkQsU0FBekIsR0FBcUN6TSxLQUFLMk0scUJBQTFDLElBQ0pKLFVBQVVHLFlBQVYsR0FBeUJELFNBQXpCLEdBQXFDek0sS0FBSzJNLHFCQUR6QyxFQUMrRDtBQUNqRTtBQUNBLGNBQUlDLFNBQU9OLFVBQVVkLEtBQXJCO0FBQ0EsY0FBSXFCLFNBQU9OLFVBQVVmLEtBQXJCO0FBQ0EsY0FBR29CLFVBQVFDLE1BQVIsSUFBa0IxVyxLQUFLQyxHQUFMLENBQVN3VyxTQUFPQyxNQUFoQixLQUF5QjFXLEtBQUttVixFQUFuRCxFQUFzRDtBQUNwRDtBQUNBclcscUJBQVNZLENBQVQsR0FBYXlXLFVBQVV6VyxDQUF2QjtBQUNBWixxQkFBU1UsQ0FBVCxHQUFhMlcsVUFBVTNXLENBQXZCO0FBQ0QsV0FKRCxNQUlLO0FBQ0g7QUFDQSxnQkFBSW1YLFFBQVFYLGtCQUFrQnRXLENBQTlCO0FBQ0EsZ0JBQUlrWCxRQUFRWixrQkFBa0J4VyxDQUE5QjtBQUNBLGdCQUFJcVgsT0FBT1osa0JBQWtCdlcsQ0FBN0I7QUFDQSxnQkFBSW9YLE9BQU9iLGtCQUFrQnpXLENBQTdCO0FBQ0EsZ0JBQUl1WCxLQUFJWixVQUFVelcsQ0FBbEI7QUFDQSxnQkFBSXNYLEtBQUtiLFVBQVUzVyxDQUFuQjtBQUNBLGdCQUFJeVgsS0FBS2IsVUFBVTFXLENBQW5CO0FBQ0EsZ0JBQUl3WCxLQUFLZCxVQUFVNVcsQ0FBbkI7O0FBRUEsZ0JBQUdRLEtBQUtDLEdBQUwsQ0FBUytXLEtBQUdKLEtBQVosSUFBbUIsT0FBdEIsRUFBOEI7QUFDNUI5WCx1QkFBU1UsQ0FBVCxHQUFXb1gsS0FBWDtBQUNBOVgsdUJBQVNZLENBQVQsR0FBVyxDQUFDdVgsS0FBR0osSUFBSixLQUFXSyxLQUFHSixJQUFkLEtBQXFCaFksU0FBU1UsQ0FBVCxHQUFXc1gsSUFBaEMsSUFBc0NELElBQWpEO0FBQ0QsYUFIRCxNQUdNLElBQUc3VyxLQUFLQyxHQUFMLENBQVNpWCxLQUFHSixJQUFaLElBQWtCLE9BQXJCLEVBQTZCO0FBQ2pDaFksdUJBQVNVLENBQVQsR0FBV3NYLElBQVg7QUFDQWhZLHVCQUFTWSxDQUFULEdBQVcsQ0FBQ3FYLEtBQUdKLEtBQUosS0FBWUssS0FBR0osS0FBZixLQUF1QjlYLFNBQVNVLENBQVQsR0FBV29YLEtBQWxDLElBQXlDRCxLQUFwRDtBQUNELGFBSEssTUFHRDtBQUNILGtCQUFJUSxJQUFJLENBQUNKLEtBQUdKLEtBQUosS0FBWUssS0FBR0osS0FBZixDQUFSO0FBQ0Esa0JBQUlRLElBQUksQ0FBQ0gsS0FBR0osSUFBSixLQUFXSyxLQUFHSixJQUFkLENBQVI7QUFDQWhZLHVCQUFTVSxDQUFULEdBQWEsQ0FBQzJYLElBQUVQLEtBQUYsR0FBUUQsS0FBUixHQUFjUyxJQUFFTixJQUFoQixHQUFxQkQsSUFBdEIsS0FBNkJNLElBQUVDLENBQS9CLENBQWI7QUFDQXRZLHVCQUFTWSxDQUFULEdBQWF5WCxLQUFHclksU0FBU1UsQ0FBVCxHQUFXb1gsS0FBZCxJQUFxQkQsS0FBbEM7QUFDRDtBQUNGO0FBQ0o7O0FBRUQsWUFBSWpZLFVBQVUzQixLQUFLYSxJQUFMLENBQVV4QixxQkFBcUJTLE1BQXJCLENBQTRCc0IsSUFBNUIsRUFBa0MsUUFBbEMsQ0FBVixDQUFkO0FBQ0EsWUFBSU0sWUFBWTFCLEtBQUthLElBQUwsQ0FBVXhCLHFCQUFxQlMsTUFBckIsQ0FBNEJzQixJQUE1QixFQUFrQyxVQUFsQyxDQUFWLENBQWhCOztBQUVBLFlBQUlpRyx5QkFBeUJoSSxxQkFBcUIwSCx5QkFBckIsQ0FBK0MvRyxJQUEvQyxFQUFxRCtCLFFBQXJELENBQTdCO0FBQ0FKLGdCQUFRK04sS0FBUixJQUFpQnJJLHVCQUF1QmxILE1BQXhDO0FBQ0F1QixrQkFBVWdPLEtBQVYsSUFBbUJySSx1QkFBdUJqSCxRQUExQzs7QUFFQUosYUFBS2EsSUFBTCxDQUFVeEIscUJBQXFCUyxNQUFyQixDQUE0QnNCLElBQTVCLEVBQWtDLFFBQWxDLENBQVYsRUFBdURPLE9BQXZEO0FBQ0EzQixhQUFLYSxJQUFMLENBQVV4QixxQkFBcUJTLE1BQXJCLENBQTRCc0IsSUFBNUIsRUFBa0MsVUFBbEMsQ0FBVixFQUF5RE0sU0FBekQ7QUFDRDs7QUFFRDtBQUNBLFVBQUk0WSxvQkFBb0IvUCxTQUFVeU8sZ0JBQVYsRUFBNEIsQ0FBNUIsQ0FBeEI7O0FBRUE7QUFDRS9NLDZCQUFxQnBCLEdBQUdtTSxjQUFILEVBQXJCO0FBQ0E5Syw2QkFBcUJyQixHQUFHb00sY0FBSCxFQUFyQjtBQUNBOUssa0NBQTBCdEIsR0FBR3FNLG1CQUFILEVBQTFCOztBQUVBO0FBQ0E7QUFDRSxjQUFJcUQsZ0JBQWdCMVAsR0FBRzNKLEtBQUgsQ0FBUyxXQUFULENBQXBCO0FBQ0EsY0FBSW9MLHdCQUF3QmlPLGNBQWN6WixNQUExQzs7QUFFQSxjQUFLd0wsMEJBQTBCLENBQS9CLEVBQW1DO0FBQ2pDRCw4QkFBa0JrTyxjQUFjLENBQWQsQ0FBbEI7QUFDRDtBQUNGOztBQUVEMVAsV0FBRzRJLElBQUgsQ0FBUSxVQUFSLEVBQW9CakksUUFBUSxpQkFBWTtBQUN0QyxjQUFLLENBQUNhLGVBQU4sRUFBd0I7QUFDdEI7QUFDRDs7QUFFRGlGO0FBQ0QsU0FORDs7QUFRQTtBQUNBekcsV0FBR3lELEVBQUgsQ0FBTSxNQUFOLEVBQWMsTUFBZCxFQUF1QixZQUFZO0FBQ2pDLGNBQUssQ0FBQ2pDLGVBQU4sRUFBd0I7QUFDdEI7QUFDRDs7QUFFRGlGO0FBQ0QsU0FORDs7QUFRQXpHLFdBQUd5RCxFQUFILENBQU0sT0FBTixFQUFlLGdHQUFmLEVBQWlIakQsU0FBUyxrQkFBWTtBQUNwSW1HLHFCQUFXLFlBQVU7QUFBQ0Y7QUFBZSxXQUFyQyxFQUF1QyxFQUF2QztBQUNELFNBRkQ7O0FBSUF6RyxXQUFHeUQsRUFBSCxDQUFNLFFBQU4sRUFBZ0IsTUFBaEIsRUFBd0JoRCxVQUFVLG1CQUFZO0FBQzVDLGNBQUl0TCxPQUFPLElBQVg7QUFDQSxjQUFJQSxLQUFLd2EsUUFBTCxFQUFKLEVBQXFCO0FBQ25CbE8sb0NBQXdCQSx3QkFBd0IsQ0FBaEQ7O0FBRUF6QixlQUFHNFAsVUFBSDs7QUFFQSxnQkFBSXBPLGVBQUosRUFBcUI7QUFDbkJBLDhCQUFnQi9DLFdBQWhCLENBQTRCLDJCQUE1QjtBQUNEOztBQUVELGdCQUFJZ0QsMEJBQTBCLENBQTlCLEVBQWlDO0FBQy9CLGtCQUFJaU8sZ0JBQWdCMVAsR0FBRzNKLEtBQUgsQ0FBUyxXQUFULENBQXBCOztBQUVBO0FBQ0E7QUFDQSxrQkFBSXFaLGNBQWN6WixNQUFkLEtBQXlCLENBQTdCLEVBQWdDO0FBQzlCdUwsa0NBQWtCa08sY0FBYyxDQUFkLENBQWxCO0FBQ0FsTyxnQ0FBZ0J6SyxRQUFoQixDQUF5QiwyQkFBekI7QUFDRCxlQUhELE1BSUs7QUFDSHlLLGtDQUFrQjlNLFNBQWxCO0FBQ0Q7QUFDRixhQVpELE1BYUs7QUFDSDhNLGdDQUFrQjlNLFNBQWxCO0FBQ0Q7O0FBRURzTCxlQUFHNlAsUUFBSDtBQUNEO0FBQ0RwSjtBQUNELFNBL0JEOztBQWlDQ3pHLFdBQUd5RCxFQUFILENBQU0sS0FBTixFQUFhLE1BQWIsRUFBcUIvQyxPQUFPLGdCQUFZO0FBQ3ZDLGNBQUl2TCxPQUFPLElBQVg7QUFDQSxjQUFJQSxLQUFLd2EsUUFBTCxFQUFKLEVBQXFCO0FBQ25CbE8sb0NBQXdCQSx3QkFBd0IsQ0FBaEQ7O0FBRUF6QixlQUFHNFAsVUFBSDs7QUFFQSxnQkFBSXBPLGVBQUosRUFBcUI7QUFDbkJBLDhCQUFnQi9DLFdBQWhCLENBQTRCLDJCQUE1QjtBQUNEOztBQUVELGdCQUFJZ0QsMEJBQTBCLENBQTlCLEVBQWlDO0FBQy9CRCxnQ0FBa0JyTSxJQUFsQjtBQUNBcU0sOEJBQWdCekssUUFBaEIsQ0FBeUIsMkJBQXpCO0FBQ0QsYUFIRCxNQUlLO0FBQ0h5SyxnQ0FBa0I5TSxTQUFsQjtBQUNEOztBQUVEc0wsZUFBRzZQLFFBQUg7QUFDRDtBQUNEcEo7QUFDRCxTQXRCQTs7QUF3QkR6RyxXQUFHeUQsRUFBSCxDQUFNLFFBQU4sRUFBZ0IsTUFBaEIsRUFBd0I3QyxVQUFVLG1CQUFZO0FBQzVDLGNBQUl6TCxPQUFPLElBQVg7O0FBRUEsY0FBR0EsS0FBS2tDLE1BQUwsR0FBYytDLGNBQWQsR0FBK0JuRSxNQUEvQixJQUF5QyxDQUF6QyxJQUE4Q2QsS0FBSzhCLE1BQUwsR0FBY21ELGNBQWQsR0FBK0JuRSxNQUEvQixJQUF5QyxDQUExRixFQUE0RjtBQUMxRjtBQUNEOztBQUdEd0wsa0NBQXdCQSx3QkFBd0IsQ0FBaEQ7O0FBRUF6QixhQUFHNFAsVUFBSDs7QUFFQSxjQUFJcE8sZUFBSixFQUFxQjtBQUNuQkEsNEJBQWdCL0MsV0FBaEIsQ0FBNEIsMkJBQTVCO0FBQ0Q7O0FBRUQsY0FBSWdELDBCQUEwQixDQUE5QixFQUFpQztBQUMvQkQsOEJBQWtCck0sSUFBbEI7QUFDQXFNLDRCQUFnQnpLLFFBQWhCLENBQXlCLDJCQUF6QjtBQUNELFdBSEQsTUFJSztBQUNIeUssOEJBQWtCOU0sU0FBbEI7QUFDRDs7QUFFRHNMLGFBQUc2UCxRQUFIO0FBQ0FwSjtBQUNELFNBMUJEOztBQTRCQXpHLFdBQUd5RCxFQUFILENBQU0sVUFBTixFQUFrQixNQUFsQixFQUEwQjVDLFlBQVkscUJBQVk7QUFDaERZLGtDQUF3QkEsd0JBQXdCLENBQWhEOztBQUVBekIsYUFBRzRQLFVBQUg7O0FBRUEsY0FBSXBPLGVBQUosRUFBcUI7QUFDbkJBLDRCQUFnQi9DLFdBQWhCLENBQTRCLDJCQUE1QjtBQUNEOztBQUVELGNBQUlnRCwwQkFBMEIsQ0FBOUIsRUFBaUM7QUFDL0IsZ0JBQUlpTyxnQkFBZ0IxUCxHQUFHM0osS0FBSCxDQUFTLFdBQVQsQ0FBcEI7O0FBRUE7QUFDQTtBQUNBLGdCQUFJcVosY0FBY3paLE1BQWQsS0FBeUIsQ0FBN0IsRUFBZ0M7QUFDOUJ1TCxnQ0FBa0JrTyxjQUFjLENBQWQsQ0FBbEI7QUFDQWxPLDhCQUFnQnpLLFFBQWhCLENBQXlCLDJCQUF6QjtBQUNELGFBSEQsTUFJSztBQUNIeUssZ0NBQWtCOU0sU0FBbEI7QUFDRDtBQUNGLFdBWkQsTUFhSztBQUNIOE0sOEJBQWtCOU0sU0FBbEI7QUFDRDs7QUFFRHNMLGFBQUc2UCxRQUFIO0FBQ0FwSjtBQUNELFNBNUJEOztBQThCQSxZQUFJcUosZ0JBQUo7QUFDQSxZQUFJQyxXQUFKO0FBQ0EsWUFBSUMsU0FBSjtBQUNBLFlBQUloTSxlQUFKO0FBQ0EsWUFBSWlNLGtCQUFKO0FBQ0EsWUFBSUMsYUFBSjtBQUNBLFlBQUlDLFNBQUo7QUFDQSxZQUFJQyxZQUFKO0FBQ0EsWUFBSUMsWUFBSjtBQUNBLFlBQUlDLHNCQUFzQixLQUExQjs7QUFFQXRRLFdBQUd5RCxFQUFILENBQU0sVUFBTixFQUFrQjNDLFlBQVksbUJBQVMrQyxLQUFULEVBQWdCO0FBQzVDa00sd0JBQWNsTSxNQUFNM00sUUFBTixJQUFrQjJNLE1BQU0wTSxVQUF0QztBQUNELFNBRkQ7O0FBSUF2USxXQUFHeUQsRUFBSCxDQUFNLFVBQU4sRUFBa0IsTUFBbEIsRUFBMEIxQyxrQkFBa0IseUJBQVU4QyxLQUFWLEVBQWlCO0FBQzNELGNBQUkxTyxPQUFPLElBQVg7O0FBRUEsY0FBSSxDQUFDcU0sZUFBRCxJQUFvQkEsZ0JBQWdCakssRUFBaEIsT0FBeUJwQyxLQUFLb0MsRUFBTCxFQUFqRCxFQUE0RDtBQUMxRDBZLGlDQUFxQixLQUFyQjtBQUNBO0FBQ0Q7O0FBRURELHNCQUFZN2EsSUFBWjs7QUFFQSxjQUFJb0IsT0FBTy9CLHFCQUFxQnFCLFdBQXJCLENBQWlDVixJQUFqQyxDQUFYOztBQUVBO0FBQ0EsY0FBR29CLFNBQVMsY0FBWixFQUNFQSxPQUFPLE1BQVA7O0FBRUYsY0FBSWlhLFNBQVNULFlBQVlqWSxDQUF6QjtBQUNBLGNBQUkyWSxTQUFTVixZQUFZblksQ0FBekI7O0FBRUE7QUFDQSxjQUFJOFksV0FBVzVFLHNCQUFzQjBFLE1BQXRCLEVBQThCQyxNQUE5QixFQUFzQ3RiLElBQXRDLENBQWY7O0FBRUEsY0FBR3ViLFlBQVksQ0FBWixJQUFpQkEsWUFBWSxDQUFoQyxFQUFrQztBQUNoQ3ZiLGlCQUFLNE8sUUFBTDtBQUNBbU0sNEJBQWdCUSxRQUFoQjtBQUNBTiwyQkFBZ0JNLFlBQVksQ0FBYixHQUFrQlYsVUFBVS9ZLE1BQVYsRUFBbEIsR0FBdUMrWSxVQUFVM1ksTUFBVixFQUF0RDs7QUFFQSxnQkFBSXNaLGtCQUFtQkQsWUFBWSxDQUFiLEdBQWtCLFFBQWxCLEdBQTZCLFFBQW5EO0FBQ0EsZ0JBQUkvWixTQUFTaUosc0JBQXNCZ1IsY0FBdEIsQ0FBcUNaLFNBQXJDLEVBQWdEaFEsRUFBaEQsRUFBb0Q2RCxNQUFNZ04sZ0JBQTFELEVBQTRFRixlQUE1RSxDQUFiOztBQUVBUix3QkFBWXhaLE9BQU93WixTQUFuQjtBQUNBSCx3QkFBWXJaLE9BQU94QixJQUFuQjs7QUFFQStPO0FBQ0QsV0FaRCxNQWFLO0FBQ0g0TCwrQkFBbUJwYixTQUFuQjtBQUNBdWIsaUNBQXFCLElBQXJCO0FBQ0Q7QUFDRixTQXZDRDs7QUF5Q0FqUSxXQUFHeUQsRUFBSCxDQUFNLE1BQU4sRUFBYyxNQUFkLEVBQXNCdEMsUUFBUSxlQUFVMEMsS0FBVixFQUFpQjtBQUM3QyxjQUFJaU4sT0FBTyxJQUFYO0FBQ0E5USxhQUFHM0osS0FBSCxHQUFXME4sUUFBWDtBQUNBLGNBQUcsQ0FBQytNLEtBQUtuQixRQUFMLEVBQUosRUFBb0I7QUFDbEIzUCxlQUFHK1EsS0FBSCxHQUFXaE4sUUFBWDtBQUNEO0FBQ0YsU0FORDtBQU9BL0QsV0FBR3lELEVBQUgsQ0FBTSxTQUFOLEVBQWlCekMsV0FBVyxrQkFBVTZDLEtBQVYsRUFBaUI7QUFDM0M7Ozs7O0FBS0EsY0FBSTdELEdBQUczSixLQUFILENBQVMsV0FBVCxFQUFzQkosTUFBdEIsR0FBK0IsQ0FBbkMsRUFBc0M7QUFDcEMrSixlQUFHOEQsZUFBSCxDQUFtQixLQUFuQjtBQUNEO0FBQ0QsY0FBSTNPLE9BQU82YSxTQUFYOztBQUVBLGNBQUdBLGNBQWN0YixTQUFkLElBQTJCRixxQkFBcUJnQyxhQUFyQixDQUFtQ3JCLElBQW5DLENBQTlCLEVBQXlFO0FBQ3ZFO0FBQ0Q7O0FBRUQsY0FBSW9CLE9BQU8vQixxQkFBcUJxQixXQUFyQixDQUFpQ1YsSUFBakMsQ0FBWDs7QUFFQSxjQUFHOGEsc0JBQXNCaE8sS0FBSytPLHdCQUEzQixJQUF1RCxDQUFDcFAsYUFBeEQsSUFBeUVyTCxTQUFTLGNBQXJGLEVBQXFHO0FBQ25HO0FBQ0EsZ0JBQUl1RyxZQUFZdEkscUJBQXFCUyxNQUFyQixDQUE0QnNCLElBQTVCLEVBQWtDLFFBQWxDLENBQWhCO0FBQ0EsZ0JBQUl3RyxjQUFjdkkscUJBQXFCUyxNQUFyQixDQUE0QnNCLElBQTVCLEVBQWtDLFVBQWxDLENBQWxCOztBQUVBeU4sOEJBQWtCO0FBQ2hCN08sb0JBQU1BLElBRFU7QUFFaEJvQixvQkFBTUEsSUFGVTtBQUdoQk8sdUJBQVMzQixLQUFLYSxJQUFMLENBQVU4RyxTQUFWLElBQXVCLEdBQUdPLE1BQUgsQ0FBVWxJLEtBQUthLElBQUwsQ0FBVThHLFNBQVYsQ0FBVixDQUF2QixHQUF5RCxFQUhsRDtBQUloQmpHLHlCQUFXMUIsS0FBS2EsSUFBTCxDQUFVK0csV0FBVixJQUF5QixHQUFHTSxNQUFILENBQVVsSSxLQUFLYSxJQUFMLENBQVUrRyxXQUFWLENBQVYsQ0FBekIsR0FBNkQ7QUFKeEQsYUFBbEI7O0FBT0E1SCxpQkFBSzRPLFFBQUw7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQStMLCtCQUFtQnRiLHFCQUFxQm9JLGNBQXJCLENBQW9DekgsSUFBcEMsRUFBMEM0YSxXQUExQyxDQUFuQjtBQUNBQyx3QkFBWTdhLElBQVo7QUFDQThhLGlDQUFxQnZiLFNBQXJCO0FBQ0E0YixrQ0FBc0IsSUFBdEI7QUFDQXBNO0FBQ0Q7O0FBRUQ7QUFDQSxjQUFJLENBQUN0QyxhQUFELEtBQW1Cb08sY0FBY3RiLFNBQWQsSUFDcEJvYixxQkFBcUJwYixTQUFyQixJQUFrQ3diLGtCQUFrQnhiLFNBRG5ELENBQUosRUFDb0U7QUFDbEU7QUFDRDs7QUFFRCxjQUFJdWMsV0FBV3BOLE1BQU0zTSxRQUFOLElBQWtCMk0sTUFBTTBNLFVBQXZDOztBQUVBO0FBQ0EsY0FBR0wsaUJBQWlCLENBQUMsQ0FBbEIsSUFBdUJDLFNBQTFCLEVBQW9DO0FBQ2xDQSxzQkFBVWpaLFFBQVYsQ0FBbUIrWixRQUFuQjtBQUNEO0FBQ0Q7QUFIQSxlQUlLLElBQUduQixvQkFBb0JwYixTQUF2QixFQUFpQztBQUNwQythLGdDQUFrQnRhLElBQWxCLEVBQXdCb0IsSUFBeEIsRUFBOEJ1WixnQkFBOUIsRUFBZ0RtQixRQUFoRDtBQUNEO0FBQ0Q7QUFISyxpQkFJQSxJQUFHclAsYUFBSCxFQUFpQjs7QUFFcEI7QUFDQTtBQUNBO0FBQ0Esb0JBQUd1QixjQUFjSSxrQkFBZCxLQUFxQzdPLFNBQXJDLElBQWtEcWIsV0FBckQsRUFBaUU7QUFDL0Q1TSxnQ0FBY0ksa0JBQWQsR0FBbUNzSSx3QkFDakNrRSxZQUFZalksQ0FEcUIsRUFFakNpWSxZQUFZblksQ0FGcUIsRUFHakN1TCxjQUFjaE8sSUFIbUIsQ0FBbkM7QUFJRDs7QUFFRCxvQkFBR2dPLGNBQWNJLGtCQUFkLEtBQXFDN08sU0FBeEMsRUFBa0Q7QUFDaEQrYSxvQ0FDRXRNLGNBQWNoTyxJQURoQixFQUVFZ08sY0FBY0MsUUFGaEIsRUFHRUQsY0FBY0ksa0JBSGhCLEVBSUUwTixRQUpGO0FBTUQ7QUFDRjs7QUFFRCxjQUFHcE4sTUFBTXhNLE1BQU4sSUFBZ0J3TSxNQUFNeE0sTUFBTixDQUFhLENBQWIsQ0FBaEIsSUFBbUN3TSxNQUFNeE0sTUFBTixDQUFhNlosTUFBYixFQUF0QyxFQUE0RDtBQUMxRGIsMkJBQWV4TSxNQUFNeE0sTUFBckI7QUFDRDtBQUVGLFNBckZEOztBQXVGQTJJLFdBQUd5RCxFQUFILENBQU0sUUFBTixFQUFnQnhDLFVBQVUsaUJBQVU0QyxLQUFWLEVBQWlCOztBQUV6QyxjQUFHaEMsUUFBSCxFQUFZO0FBQ1ZrQixtQkFBT3FCLFFBQVAsR0FBa0IrTSxJQUFsQixDQUF1QixnQkFBdkI7QUFDRDs7QUFFRCxjQUFJaGMsT0FBTzZhLGFBQWE3TSxjQUFjaE8sSUFBdEM7O0FBRUEsY0FBSUEsU0FBU1QsU0FBYixFQUF5QjtBQUN2QixnQkFBSW1RLFFBQVExQixjQUFjSSxrQkFBMUI7QUFDQSxnQkFBSXNCLFNBQVNuUSxTQUFiLEVBQXlCO0FBQ3ZCLGtCQUFJc0MsU0FBUzdCLEtBQUs4QixNQUFMLEdBQWNDLFFBQWQsQ0FBdUIsR0FBdkIsQ0FBYjtBQUNBLGtCQUFJQyxTQUFTaEMsS0FBSzhCLE1BQUwsR0FBY0MsUUFBZCxDQUF1QixHQUF2QixDQUFiO0FBQ0Esa0JBQUlFLE9BQU9qQyxLQUFLa0MsTUFBTCxHQUFjSCxRQUFkLENBQXVCLEdBQXZCLENBQVg7QUFDQSxrQkFBSUksT0FBT25DLEtBQUtrQyxNQUFMLEdBQWNILFFBQWQsQ0FBdUIsR0FBdkIsQ0FBWDs7QUFFQSxrQkFBSXFDLGFBQWEvRSxxQkFBcUI4RSxpQkFBckIsQ0FBdUNuRSxJQUF2QyxDQUFqQjtBQUNBLGtCQUFJaWMsYUFBYSxDQUFDcGEsTUFBRCxFQUFTRyxNQUFULEVBQWlCa0csTUFBakIsQ0FBd0I5RCxVQUF4QixFQUFvQzhELE1BQXBDLENBQTJDLENBQUNqRyxJQUFELEVBQU9FLElBQVAsQ0FBM0MsQ0FBakI7O0FBRUEsa0JBQUl3RCxjQUFjK0osUUFBUSxDQUExQjtBQUNBLGtCQUFJd00sV0FBV3ZXLGNBQWMsQ0FBN0I7QUFDQSxrQkFBSXdXLFdBQVd4VyxjQUFjLENBQTdCOztBQUVBLGtCQUFJeUIsU0FBUztBQUNYekUsbUJBQUdzWixXQUFXLElBQUl0VyxXQUFmLENBRFE7QUFFWGxELG1CQUFHd1osV0FBVyxJQUFJdFcsV0FBSixHQUFrQixDQUE3QjtBQUZRLGVBQWI7O0FBS0Esa0JBQUl5VyxpQkFBaUI7QUFDbkJ6WixtQkFBR3NaLFdBQVcsSUFBSUMsUUFBZixDQURnQjtBQUVuQnpaLG1CQUFHd1osV0FBVyxJQUFJQyxRQUFKLEdBQWUsQ0FBMUI7QUFGZ0IsZUFBckI7O0FBS0Esa0JBQUlHLGlCQUFpQjtBQUNuQjFaLG1CQUFHc1osV0FBVyxJQUFJRSxRQUFmLENBRGdCO0FBRW5CMVosbUJBQUd3WixXQUFXLElBQUlFLFFBQUosR0FBZSxDQUExQjtBQUZnQixlQUFyQjs7QUFLQSxrQkFBSUcsVUFBSjs7QUFFQSxrQkFBTWxWLE9BQU96RSxDQUFQLEtBQWF5WixlQUFlelosQ0FBNUIsSUFBaUN5RSxPQUFPM0UsQ0FBUCxLQUFhMlosZUFBZTNaLENBQS9ELElBQXdFMkUsT0FBT3pFLENBQVAsS0FBYXlaLGVBQWV6WixDQUE1QixJQUFpQ3lFLE9BQU8zRSxDQUFQLEtBQWEyWixlQUFlM1osQ0FBekksRUFBK0k7QUFDN0k2Wiw2QkFBYSxJQUFiO0FBQ0QsZUFGRCxNQUdLO0FBQ0gsb0JBQUk5WSxLQUFLLENBQUU0WSxlQUFlM1osQ0FBZixHQUFtQjRaLGVBQWU1WixDQUFwQyxLQUE0QzJaLGVBQWV6WixDQUFmLEdBQW1CMFosZUFBZTFaLENBQTlFLENBQVQ7QUFDQSxvQkFBSWMsS0FBSyxDQUFDLENBQUQsR0FBS0QsRUFBZDs7QUFFQSxvQkFBSUksMEJBQTBCO0FBQzVCdEIsNEJBQVU4WixjQURrQjtBQUU1QjdaLDRCQUFVOFosY0FGa0I7QUFHNUI3WSxzQkFBSUEsRUFId0I7QUFJNUJDLHNCQUFJQTtBQUp3QixpQkFBOUI7O0FBT0Esb0JBQUlzRixzQkFBc0IxSixxQkFBcUJxRSxlQUFyQixDQUFxQzFELElBQXJDLEVBQTJDb0gsTUFBM0MsRUFBbUR4RCx1QkFBbkQsQ0FBMUI7QUFDQSxvQkFBSW9GLE9BQU8vRixLQUFLa0QsSUFBTCxDQUFXbEQsS0FBSytELEdBQUwsQ0FBV0ksT0FBT3pFLENBQVAsR0FBV29HLG9CQUFvQnBHLENBQTFDLEVBQThDLENBQTlDLElBQ1pNLEtBQUsrRCxHQUFMLENBQVdJLE9BQU8zRSxDQUFQLEdBQVdzRyxvQkFBb0J0RyxDQUExQyxFQUE4QyxDQUE5QyxDQURDLENBQVg7O0FBR0E7QUFDQSxvQkFBSXJCLE9BQU8vQixxQkFBcUJxQixXQUFyQixDQUFpQ1YsSUFBakMsQ0FBWDtBQUNBLG9CQUFLb0IsU0FBUyxNQUFULElBQW1CNEgsT0FBUWtJLFVBQVVxTCxzQkFBMUMsRUFBbUU7QUFDakVELCtCQUFhLElBQWI7QUFDRDtBQUVGOztBQUVELGtCQUFHeFAsS0FBSzBQLCtCQUFMLElBQXdDRixVQUEzQyxFQUNBO0FBQ0VqZCxxQ0FBcUI2SixZQUFyQixDQUFrQ2xKLElBQWxDLEVBQXdDMFAsS0FBeEM7QUFDRDtBQUVGLGFBN0RELE1BOERLLElBQUdzTCxhQUFhemIsU0FBYixLQUEyQndiLGlCQUFpQixDQUFqQixJQUFzQkEsaUJBQWlCLENBQWxFLENBQUgsRUFBeUU7O0FBRTVFLGtCQUFJMEIsVUFBVXhCLFlBQWQ7QUFDQSxrQkFBSXlCLFVBQVUsT0FBZDtBQUNBLGtCQUFJQyxXQUFZNUIsaUJBQWlCLENBQWxCLEdBQXVCLFFBQXZCLEdBQWtDLFFBQWpEOztBQUVBO0FBQ0Esa0JBQUdHLFlBQUgsRUFBZ0I7QUFDZCxvQkFBSTBCLFlBQWE3QixpQkFBaUIsQ0FBbEIsR0FBdUJHLFlBQXZCLEdBQXNDbGIsS0FBSzhCLE1BQUwsRUFBdEQ7QUFDQSxvQkFBSSthLFlBQWE5QixpQkFBaUIsQ0FBbEIsR0FBdUJHLFlBQXZCLEdBQXNDbGIsS0FBS2tDLE1BQUwsRUFBdEQ7QUFDQSxvQkFBRyxPQUFPeVAsWUFBUCxLQUF3QixVQUEzQixFQUNFK0ssVUFBVS9LLGFBQWEzUixJQUFiLEVBQW1CNGMsU0FBbkIsRUFBOEJDLFNBQTlCLENBQVY7QUFDRkosMEJBQVdDLFlBQVksT0FBYixHQUF3QnhCLFlBQXhCLEdBQXVDRCxZQUFqRDtBQUNEOztBQUVELGtCQUFJMkIsWUFBYTdCLGlCQUFpQixDQUFsQixHQUF1QjBCLE9BQXZCLEdBQWlDemMsS0FBSzhCLE1BQUwsRUFBakQ7QUFDQSxrQkFBSSthLFlBQWE5QixpQkFBaUIsQ0FBbEIsR0FBdUIwQixPQUF2QixHQUFpQ3pjLEtBQUtrQyxNQUFMLEVBQWpEO0FBQ0FsQyxxQkFBT3lLLHNCQUFzQnFTLFdBQXRCLENBQWtDOWMsSUFBbEMsRUFBd0NpYixZQUF4QyxFQUFzRDBCLFFBQXRELENBQVA7O0FBRUEsa0JBQUcxQixhQUFhN1ksRUFBYixPQUFzQnFhLFFBQVFyYSxFQUFSLEVBQXpCLEVBQXNDO0FBQ3BDO0FBQ0Esb0JBQUcsT0FBT3NQLG1CQUFQLEtBQStCLFVBQWxDLEVBQTZDO0FBQzNDLHNCQUFJcUwsa0JBQWtCckwsb0JBQW9Ca0wsVUFBVXhhLEVBQVYsRUFBcEIsRUFBb0N5YSxVQUFVemEsRUFBVixFQUFwQyxFQUFvRHBDLEtBQUthLElBQUwsRUFBcEQsQ0FBdEI7O0FBRUEsc0JBQUdrYyxlQUFILEVBQW1CO0FBQ2pCdFMsMENBQXNCdVMsUUFBdEIsQ0FBK0JoZCxJQUEvQixFQUFxQytjLGVBQXJDO0FBQ0ExZCx5Q0FBcUIwQixnQkFBckIsQ0FBc0NtUSxVQUFVeUcscUJBQWhELEVBQzBCekcsVUFBVTBHLHdCQURwQyxFQUM4RCxDQUFDbUYsZUFBRCxDQUQ5RDtBQUVEOztBQUVELHNCQUFHQSxtQkFBbUI3TCxVQUFVQyxRQUFoQyxFQUF5QztBQUN2Qyx3QkFBSXZHLFNBQVM7QUFDWHFTLCtCQUFTRixlQURFO0FBRVhHLCtCQUFTbGQ7QUFGRSxxQkFBYjtBQUlBNkssdUJBQUd1RyxRQUFILEdBQWNDLEVBQWQsQ0FBaUIsdUJBQWpCLEVBQTBDekcsTUFBMUM7QUFDQTVLLDJCQUFPK2MsZUFBUDtBQUNELG1CQVBELE1BUUssSUFBR0EsZUFBSCxFQUFtQjtBQUN0QmxTLHVCQUFHc1MsTUFBSCxDQUFVbmQsSUFBVjtBQUNBQSwyQkFBTytjLGVBQVA7QUFDRDtBQUNGLGlCQXJCRCxNQXNCSTtBQUNGLHNCQUFJSyxNQUFPckMsaUJBQWlCLENBQWxCLEdBQXVCLEVBQUNqWixRQUFRMmEsUUFBUXJhLEVBQVIsRUFBVCxFQUF2QixHQUFnRCxFQUFDRixRQUFRdWEsUUFBUXJhLEVBQVIsRUFBVCxFQUExRDtBQUNBLHNCQUFJaWIsU0FBVXRDLGlCQUFpQixDQUFsQixHQUF1QixFQUFDalosUUFBUW1aLGFBQWE3WSxFQUFiLEVBQVQsRUFBdkIsR0FBcUQsRUFBQ0YsUUFBUStZLGFBQWE3WSxFQUFiLEVBQVQsRUFBbEU7O0FBRUEsc0JBQUc4TyxVQUFVQyxRQUFWLElBQXNCc0wsUUFBUXJhLEVBQVIsT0FBaUI2WSxhQUFhN1ksRUFBYixFQUExQyxFQUE2RDtBQUMzRCx3QkFBSTZPLFFBQVE7QUFDVmpSLDRCQUFNQSxJQURJO0FBRVYyYyxnQ0FBVVMsR0FGQTtBQUdWQyw4QkFBUUE7QUFIRSxxQkFBWjtBQUtBLHdCQUFJN2IsU0FBU3FKLEdBQUd1RyxRQUFILEdBQWNDLEVBQWQsQ0FBaUIsZUFBakIsRUFBa0NKLEtBQWxDLENBQWI7QUFDQWpSLDJCQUFPd0IsT0FBT3hCLElBQWQ7QUFDQTtBQUNEO0FBQ0Y7QUFDRjs7QUFFRDtBQUNBLGtCQUFHMGMsWUFBWSxPQUFaLElBQXVCLE9BQU85Syw2QkFBUCxLQUF5QyxVQUFuRSxFQUE4RTtBQUM1RUE7QUFDRDtBQUNENVIsbUJBQUtvUCxNQUFMO0FBQ0F2RSxpQkFBR3NTLE1BQUgsQ0FBVW5DLFNBQVY7QUFDRDtBQUNGO0FBQ0QsY0FBSTVaLE9BQU8vQixxQkFBcUJxQixXQUFyQixDQUFpQ1YsSUFBakMsQ0FBWDs7QUFFQTtBQUNBLGNBQUdvQixTQUFTLGNBQVosRUFBMkI7QUFDekJBLG1CQUFPLE1BQVA7QUFDRDs7QUFFRCxjQUFHNE0sY0FBY0ksa0JBQWQsS0FBcUM3TyxTQUFyQyxJQUFrRCxDQUFDNGIsbUJBQXRELEVBQTBFO0FBQ3hFdE0sOEJBQWtCdFAsU0FBbEI7QUFDRDs7QUFFRCxjQUFJb0ksWUFBWXRJLHFCQUFxQlMsTUFBckIsQ0FBNEJzQixJQUE1QixFQUFrQyxRQUFsQyxDQUFoQjtBQUNBLGNBQUlwQixTQUFTVCxTQUFULElBQXNCc1Asb0JBQW9CdFAsU0FBMUMsSUFDRixDQUFDUyxLQUFLYSxJQUFMLENBQVU4RyxTQUFWLElBQXVCM0gsS0FBS2EsSUFBTCxDQUFVOEcsU0FBVixFQUFxQjJWLFFBQXJCLEVBQXZCLEdBQXlELElBQTFELEtBQW1Fek8sZ0JBQWdCbE4sT0FBaEIsQ0FBd0IyYixRQUF4QixFQURyRSxFQUN5Rzs7QUFFdkc7QUFDQSxnQkFBR25DLG1CQUFILEVBQXVCO0FBQ3ZCbmIsbUJBQUtvUCxNQUFMOztBQUVBO0FBQ0F2RSxpQkFBRzhELGVBQUgsQ0FBbUIsSUFBbkI7QUFDQzs7QUFFRCxnQkFBR3VDLFVBQVVDLFFBQWIsRUFBdUI7QUFDckJ0RyxpQkFBR3VHLFFBQUgsR0FBY0MsRUFBZCxDQUFpQixvQkFBakIsRUFBdUN4QyxlQUF2QztBQUNEO0FBQ0Y7O0FBRUQ4TCw2QkFBbUJwYixTQUFuQjtBQUNBc2Isc0JBQVl0YixTQUFaO0FBQ0FzUCw0QkFBa0J0UCxTQUFsQjtBQUNBdWIsK0JBQXFCdmIsU0FBckI7QUFDQXdiLDBCQUFnQnhiLFNBQWhCO0FBQ0F5YixzQkFBWXpiLFNBQVo7QUFDQTBiLHlCQUFlMWIsU0FBZjtBQUNBMmIseUJBQWUzYixTQUFmO0FBQ0FxYix3QkFBY3JiLFNBQWQ7QUFDQTRiLGdDQUFzQixLQUF0Qjs7QUFFQW5OLHdCQUFjSSxrQkFBZCxHQUFtQzdPLFNBQW5DOztBQUVBK1A7QUFDQWtDLHFCQUFXLFlBQVU7QUFBQ0Y7QUFBZSxXQUFyQyxFQUF1QyxFQUF2QztBQUNELFNBdkxEOztBQXlMQTtBQUNBLFlBQUlpTSxlQUFKO0FBQ0EsWUFBSUMsV0FBSjtBQUNBLFlBQUlDLHlCQUFKO0FBQ0EsWUFBSUMscUJBQUo7QUFDQTdTLFdBQUd5RCxFQUFILENBQU0sdUJBQU4sRUFBK0IsVUFBVXFQLENBQVYsRUFBYXpjLEtBQWIsRUFBb0I7QUFDL0N3YyxrQ0FBd0IsS0FBeEI7QUFDQSxjQUFJeGMsTUFBTSxDQUFOLEtBQVkzQixTQUFoQixFQUNBO0FBQ0kyQixrQkFBTW1FLE9BQU4sQ0FBYyxVQUFVckYsSUFBVixFQUFnQjtBQUM1QixrQkFBSVgscUJBQXFCOEUsaUJBQXJCLENBQXVDbkUsSUFBdkMsS0FBZ0RULFNBQWhELElBQTZELENBQUNtZSxxQkFBbEUsRUFDQTtBQUNJRiw4QkFBYyxFQUFFN2EsR0FBR3RELHFCQUFxQjhFLGlCQUFyQixDQUF1Q25FLElBQXZDLEVBQTZDLENBQTdDLENBQUwsRUFBc0R5QyxHQUFHcEQscUJBQXFCOEUsaUJBQXJCLENBQXVDbkUsSUFBdkMsRUFBNkMsQ0FBN0MsQ0FBekQsRUFBZDtBQUNBdWQsa0NBQWtCO0FBQ2RLLDZCQUFXLElBREc7QUFFZEMsdUNBQXFCO0FBQ2pCbGIsdUJBQUc2YSxZQUFZN2EsQ0FERTtBQUVqQkYsdUJBQUcrYSxZQUFZL2E7QUFGRSxtQkFGUDtBQU1kdkIseUJBQU9BO0FBTk8saUJBQWxCO0FBUUF1Yyw0Q0FBNEJ6ZCxJQUE1QjtBQUNBMGQsd0NBQXdCLElBQXhCO0FBQ0g7QUFDRixhQWZEO0FBZ0JIO0FBQ0osU0FyQkQ7O0FBdUJBN1MsV0FBR3lELEVBQUgsQ0FBTSxxQkFBTixFQUE2QixVQUFVcVAsQ0FBVixFQUFhemMsS0FBYixFQUFvQjtBQUM3QyxjQUFJcWMsbUJBQW1CaGUsU0FBdkIsRUFDQTtBQUNJLGdCQUFJdWUsYUFBYVAsZ0JBQWdCTSxtQkFBakM7QUFDQSxnQkFBSUUsbUJBQW1CO0FBQ25CcGIsaUJBQUd0RCxxQkFBcUI4RSxpQkFBckIsQ0FBdUNzWix5QkFBdkMsRUFBa0UsQ0FBbEUsQ0FEZ0I7QUFFbkJoYixpQkFBR3BELHFCQUFxQjhFLGlCQUFyQixDQUF1Q3NaLHlCQUF2QyxFQUFrRSxDQUFsRTtBQUZnQixhQUF2Qjs7QUFNQUYsNEJBQWdCL0YsWUFBaEIsR0FBK0I7QUFDM0I3VSxpQkFBRyxDQUFDb2IsaUJBQWlCcGIsQ0FBbEIsR0FBc0JtYixXQUFXbmIsQ0FEVDtBQUUzQkYsaUJBQUcsQ0FBQ3NiLGlCQUFpQnRiLENBQWxCLEdBQXNCcWIsV0FBV3JiO0FBRlQsYUFBL0I7O0FBS0EsbUJBQU84YSxnQkFBZ0JNLG1CQUF2Qjs7QUFFQSxnQkFBRzNNLFVBQVVDLFFBQWIsRUFBdUI7QUFDbkJ0RyxpQkFBR3VHLFFBQUgsR0FBY0MsRUFBZCxDQUFpQixrQkFBakIsRUFBcUNrTSxlQUFyQztBQUNIOztBQUVEQSw4QkFBa0JoZSxTQUFsQjtBQUNIO0FBQ0osU0F2QkQ7O0FBeUJBc0wsV0FBR3lELEVBQUgsQ0FBTSxRQUFOLEVBQWdCdkMsVUFBVSxpQkFBVTJDLEtBQVYsRUFBaUI7QUFDekMsY0FBSXhNLFNBQVN3TSxNQUFNeE0sTUFBTixJQUFnQndNLE1BQU1zQyxRQUFuQztBQUNBLGNBQUlnTixlQUFlLEtBQW5COztBQUVBLGNBQUc7QUFDREEsMkJBQWU5YixPQUFPK2IsTUFBUCxFQUFmO0FBQ0QsV0FGRCxDQUdBLE9BQU1DLEdBQU4sRUFBVTtBQUNSO0FBQ0Q7O0FBRUQsY0FBSWxlLElBQUosRUFBVW9CLElBQVY7QUFDQSxjQUFHNGMsWUFBSCxFQUFnQjtBQUNkaGUsbUJBQU9rQyxNQUFQO0FBQ0FkLG1CQUFPL0IscUJBQXFCcUIsV0FBckIsQ0FBaUNWLElBQWpDLENBQVA7QUFDRCxXQUhELE1BSUk7QUFDRkEsbUJBQU9nTyxjQUFjaE8sSUFBckI7QUFDQW9CLG1CQUFPNE0sY0FBY0MsUUFBckI7QUFDRDs7QUFFRCxjQUFJeUUsUUFBUTdILEdBQUc0SCxZQUFILENBQWdCLEtBQWhCLENBQVosQ0FyQnlDLENBcUJMOztBQUVwQyxjQUFHLENBQUNwRyxlQUFELElBQW9CQSxnQkFBZ0JqSyxFQUFoQixNQUF3QnBDLEtBQUtvQyxFQUFMLEVBQTVDLElBQXlEL0MscUJBQXFCZ0MsYUFBckIsQ0FBbUNyQixJQUFuQyxDQUF6RCxJQUNDcU0sb0JBQW9Cck0sSUFEeEIsRUFDOEI7QUFDNUIwUyxrQkFBTXlMLFlBQU4sQ0FBbUJuVCx3QkFBbkI7QUFDQTBILGtCQUFNeUwsWUFBTixDQUFtQnBULHFCQUFuQjtBQUNBMkgsa0JBQU15TCxZQUFOLENBQW1CaFQsMkJBQW5CO0FBQ0F1SCxrQkFBTXlMLFlBQU4sQ0FBbUJqVCx3QkFBbkI7QUFDQTtBQUNEOztBQUVELGNBQUlrVCxRQUFRMVAsTUFBTTNNLFFBQU4sSUFBa0IyTSxNQUFNME0sVUFBcEM7QUFDQSxjQUFJaUQsZ0JBQWdCM0gsd0JBQXdCMEgsTUFBTXpiLENBQTlCLEVBQWlDeWIsTUFBTTNiLENBQXZDLEVBQTBDekMsSUFBMUMsQ0FBcEI7QUFDQTtBQUNBLGNBQUlxZSxpQkFBaUIsQ0FBQyxDQUF0QixFQUF5QjtBQUN2QjNMLGtCQUFNeUwsWUFBTixDQUFtQm5ULHdCQUFuQjtBQUNBMEgsa0JBQU15TCxZQUFOLENBQW1CaFQsMkJBQW5CO0FBQ0EsZ0JBQUcvSixTQUFTLFNBQVQsSUFBc0I0YyxZQUF6QixFQUFzQztBQUNwQ3RMLG9CQUFNNEwsWUFBTixDQUFtQnBULHdCQUFuQjtBQUNBd0gsb0JBQU15TCxZQUFOLENBQW1CcFQscUJBQW5CO0FBQ0QsYUFIRCxNQUlLLElBQUczSixTQUFTLE1BQVQsSUFBbUI0YyxZQUF0QixFQUFtQztBQUN0Q3RMLG9CQUFNNEwsWUFBTixDQUFtQnZULHFCQUFuQjtBQUNBMkgsb0JBQU15TCxZQUFOLENBQW1CalQsd0JBQW5CO0FBQ0QsYUFISSxNQUlBLElBQUk4UyxZQUFKLEVBQWlCO0FBQ3BCdEwsb0JBQU00TCxZQUFOLENBQW1CdlQscUJBQW5CO0FBQ0EySCxvQkFBTTRMLFlBQU4sQ0FBbUJwVCx3QkFBbkI7QUFDRCxhQUhJLE1BSUE7QUFDSHdILG9CQUFNeUwsWUFBTixDQUFtQnBULHFCQUFuQjtBQUNBMkgsb0JBQU15TCxZQUFOLENBQW1CalQsd0JBQW5CO0FBQ0Q7QUFDRDdMLGlDQUFxQkcsYUFBckIsR0FBcUM0ZSxLQUFyQztBQUNEO0FBQ0Q7QUFyQkEsZUFzQks7QUFDSDFMLG9CQUFNeUwsWUFBTixDQUFtQnBULHFCQUFuQjtBQUNBMkgsb0JBQU15TCxZQUFOLENBQW1CalQsd0JBQW5CO0FBQ0Esa0JBQUc5SixTQUFTLFNBQVosRUFBc0I7QUFDcEJzUixzQkFBTTRMLFlBQU4sQ0FBbUJuVCwyQkFBbkI7QUFDQXVILHNCQUFNeUwsWUFBTixDQUFtQm5ULHdCQUFuQjtBQUNBLG9CQUFJOEIsS0FBS3NGLGlDQUFMLElBQ0FwUyxLQUFLVyxRQUFMLENBQWMsNkNBQWQsQ0FESixFQUNrRTtBQUNoRStSLHdCQUFNNEwsWUFBTixDQUFtQmxULDhCQUFuQjtBQUNEO0FBQ0YsZUFQRCxNQVFLLElBQUdoSyxTQUFTLE1BQVosRUFBbUI7QUFDdEJzUixzQkFBTTRMLFlBQU4sQ0FBbUJ0VCx3QkFBbkI7QUFDQTBILHNCQUFNeUwsWUFBTixDQUFtQmhULDJCQUFuQjtBQUNELGVBSEksTUFJRDtBQUNGdUgsc0JBQU15TCxZQUFOLENBQW1CblQsd0JBQW5CO0FBQ0EwSCxzQkFBTXlMLFlBQU4sQ0FBbUJoVCwyQkFBbkI7QUFDQXVILHNCQUFNeUwsWUFBTixDQUFtQi9TLDhCQUFuQjtBQUNEO0FBQ0QvTCxtQ0FBcUJJLGtCQUFyQixHQUEwQzRlLGFBQTFDO0FBQ0Q7O0FBRURoZiwrQkFBcUJDLGNBQXJCLEdBQXNDVSxJQUF0QztBQUNELFNBakZEOztBQW1GQTZLLFdBQUd5RCxFQUFILENBQU0sa0NBQU4sRUFBMEMsTUFBMUMsRUFBa0QsWUFBVztBQUMzRCxjQUFJdE8sT0FBTyxJQUFYO0FBQ0E2SyxhQUFHNFAsVUFBSDtBQUNBNVAsYUFBRzNKLEtBQUgsR0FBVzBOLFFBQVg7O0FBRUE7QUFDQTtBQUNBL0QsYUFBR2dOLE9BQUgsQ0FBVyxtQkFBWDs7QUFFQWhOLGFBQUc2UCxRQUFIO0FBQ0FwSjtBQUdELFNBYkQ7QUFjRDs7QUFFRCxVQUFJaUosYUFBSjtBQUNBLFVBQUlnRSxnQkFBZ0IsS0FBcEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsVUFBSUMsT0FBTztBQUNULGNBQU0sS0FERztBQUVULGNBQU0sS0FGRztBQUdULGNBQU0sS0FIRztBQUlULGNBQU07QUFKRyxPQUFYOztBQU9BLGVBQVNDLE9BQVQsQ0FBaUJkLENBQWpCLEVBQW9COztBQUVoQixZQUFJZSxhQUFhLE9BQU94TixVQUFVeU4sOEJBQWpCLEtBQW9ELFVBQXBELEdBQ1h6TixVQUFVeU4sOEJBQVYsRUFEVyxHQUNrQ3pOLFVBQVV5Tiw4QkFEN0Q7O0FBR0EsWUFBSSxDQUFDRCxVQUFMLEVBQWlCO0FBQ2I7QUFDSDs7QUFFRDtBQUNBLFlBQUlFLEtBQUtDLFNBQVNDLGFBQVQsQ0FBdUJDLE9BQWhDO0FBQ0EsWUFBSUgsTUFBTSxVQUFOLElBQW9CQSxNQUFNLE9BQTlCLEVBQ0E7QUFDSSxrQkFBT2pCLEVBQUVxQixPQUFUO0FBQ0ksaUJBQUssRUFBTCxDQUFTLEtBQUssRUFBTCxDQUFTLEtBQUssRUFBTCxDQUFVLEtBQUssRUFBTCxDQURoQyxDQUN5QztBQUNyQyxpQkFBSyxFQUFMO0FBQVNyQixnQkFBRXNCLGNBQUYsR0FBb0IsTUFGakMsQ0FFd0M7QUFDcEM7QUFBUyxvQkFIYixDQUdvQjtBQUhwQjtBQUtBLGNBQUl0QixFQUFFcUIsT0FBRixHQUFZLElBQVosSUFBb0JyQixFQUFFcUIsT0FBRixHQUFZLElBQXBDLEVBQTBDO0FBQ3RDO0FBQ0g7QUFDRFIsZUFBS2IsRUFBRXFCLE9BQVAsSUFBa0IsSUFBbEI7O0FBRUE7QUFDQTtBQUNBLGNBQUluVSxHQUFHM0osS0FBSCxDQUFTLFdBQVQsRUFBc0JKLE1BQXRCLElBQWdDK0osR0FBR3FVLFFBQUgsQ0FBWSxXQUFaLEVBQXlCcGUsTUFBekQsSUFBbUUrSixHQUFHM0osS0FBSCxDQUFTLFdBQVQsRUFBc0JKLE1BQXRCLElBQWdDLENBQXZHLEVBQ0E7QUFDRTtBQUNEO0FBQ0QsY0FBSSxDQUFDeWQsYUFBTCxFQUNBO0FBQ0loRSw0QkFBZ0IxUCxHQUFHM0osS0FBSCxDQUFTLFdBQVQsQ0FBaEI7QUFDQTJKLGVBQUdnTixPQUFILENBQVcsdUJBQVgsRUFBb0MsQ0FBQzBDLGFBQUQsQ0FBcEM7QUFDQWdFLDRCQUFnQixJQUFoQjtBQUNIO0FBQ0QsY0FBSVksWUFBWSxDQUFoQjs7QUFFQTtBQUNBLGNBQUd4QixFQUFFeUIsTUFBRixJQUFZekIsRUFBRTBCLFFBQWpCLEVBQTJCO0FBQ3pCO0FBQ0QsV0FGRCxNQUdLLElBQUkxQixFQUFFeUIsTUFBTixFQUFjO0FBQ2pCRCx3QkFBWSxDQUFaO0FBQ0QsV0FGSSxNQUdBLElBQUl4QixFQUFFMEIsUUFBTixFQUFnQjtBQUNuQkYsd0JBQVksRUFBWjtBQUNEOztBQUVELGNBQUlHLGNBQWMsRUFBbEI7QUFDQSxjQUFJQyxnQkFBZ0IsRUFBcEI7QUFDQSxjQUFJQyxnQkFBZ0IsRUFBcEI7QUFDQSxjQUFJQyxpQkFBaUIsRUFBckI7O0FBRUEsY0FBSXhaLEtBQUssQ0FBVDtBQUNBLGNBQUlELEtBQUssQ0FBVDs7QUFFQUMsZ0JBQU11WSxLQUFLaUIsY0FBTCxJQUF1Qk4sU0FBdkIsR0FBbUMsQ0FBekM7QUFDQWxaLGdCQUFNdVksS0FBS2dCLGFBQUwsSUFBc0JMLFNBQXRCLEdBQWtDLENBQXhDO0FBQ0FuWixnQkFBTXdZLEtBQUtlLGFBQUwsSUFBc0JKLFNBQXRCLEdBQWtDLENBQXhDO0FBQ0FuWixnQkFBTXdZLEtBQUtjLFdBQUwsSUFBb0JILFNBQXBCLEdBQWdDLENBQXRDOztBQUVBNUgsMkJBQWlCLEVBQUM1VSxHQUFFc0QsRUFBSCxFQUFPeEQsR0FBRXVELEVBQVQsRUFBakIsRUFBK0J1VSxhQUEvQjtBQUNIO0FBQ0o7QUFDRCxlQUFTbUYsS0FBVCxDQUFlL0IsQ0FBZixFQUFrQjs7QUFFZCxZQUFJQSxFQUFFcUIsT0FBRixHQUFZLElBQVosSUFBb0JyQixFQUFFcUIsT0FBRixHQUFZLElBQXBDLEVBQTBDO0FBQ3RDO0FBQ0g7QUFDRHJCLFVBQUVzQixjQUFGO0FBQ0FULGFBQUtiLEVBQUVxQixPQUFQLElBQWtCLEtBQWxCO0FBQ0EsWUFBSU4sYUFBYSxPQUFPeE4sVUFBVXlOLDhCQUFqQixLQUFvRCxVQUFwRCxHQUNYek4sVUFBVXlOLDhCQUFWLEVBRFcsR0FDa0N6TixVQUFVeU4sOEJBRDdEOztBQUdBLFlBQUksQ0FBQ0QsVUFBTCxFQUFpQjtBQUNiO0FBQ0g7O0FBRUQ3VCxXQUFHZ04sT0FBSCxDQUFXLHFCQUFYLEVBQWtDLENBQUMwQyxhQUFELENBQWxDO0FBQ0FBLHdCQUFnQmhiLFNBQWhCO0FBQ0FnZix3QkFBZ0IsS0FBaEI7QUFFSDtBQUNETSxlQUFTYyxnQkFBVCxDQUEwQixTQUExQixFQUFvQ2xCLE9BQXBDLEVBQTZDLElBQTdDO0FBQ0FJLGVBQVNjLGdCQUFULENBQTBCLE9BQTFCLEVBQWtDRCxLQUFsQyxFQUF5QyxJQUF6Qzs7QUFFQTNTLGlCQUFXbE0sSUFBWCxDQUFnQixlQUFoQixFQUFpQ0EsSUFBakM7QUFDRCxLQTcvQ2E7QUE4L0NkK2UsWUFBUSxrQkFBWTtBQUNoQi9VLFNBQUc0RCxHQUFILENBQU8sUUFBUCxFQUFpQixNQUFqQixFQUF5Qm5ELE9BQXpCLEVBQ0dtRCxHQURILENBQ08sS0FEUCxFQUNjLE1BRGQsRUFDc0JsRCxJQUR0QixFQUVHa0QsR0FGSCxDQUVPLE9BRlAsRUFFZ0IsZ0dBRmhCLEVBRWtIcEQsTUFGbEgsRUFHR29ELEdBSEgsQ0FHTyxRQUhQLEVBR2lCLE1BSGpCLEVBR3lCaEQsT0FIekIsRUFJR2dELEdBSkgsQ0FJTyxVQUpQLEVBSW1CLE1BSm5CLEVBSTJCL0MsU0FKM0IsRUFLRytDLEdBTEgsQ0FLTyxVQUxQLEVBS21COUMsU0FMbkIsRUFNRzhDLEdBTkgsQ0FNTyxVQU5QLEVBTW1CLE1BTm5CLEVBTTJCN0MsZUFOM0IsRUFPRzZDLEdBUEgsQ0FPTyxTQVBQLEVBT2tCNUMsUUFQbEIsRUFRRzRDLEdBUkgsQ0FRTyxRQVJQLEVBUWlCM0MsT0FSakIsRUFTRzJDLEdBVEgsQ0FTTyxRQVRQLEVBU2lCMUMsT0FUakIsRUFVRzBDLEdBVkgsQ0FVTyxNQVZQLEVBVWUsTUFWZixFQVVzQnpDLEtBVnRCOztBQVlBbkIsU0FBRytVLE1BQUgsQ0FBVSxVQUFWLEVBQXNCcFUsS0FBdEI7QUFDSDtBQTVnRGEsR0FBaEI7O0FBK2dEQSxNQUFJbUIsVUFBVTdCLEVBQVYsQ0FBSixFQUFtQjtBQUNqQixXQUFPNkIsVUFBVTdCLEVBQVYsRUFBY3ZKLEtBQWQsQ0FBb0J5TCxFQUFFbkMsR0FBRzRDLFNBQUgsRUFBRixDQUFwQixFQUF1Q29TLE1BQU1DLFNBQU4sQ0FBZ0JDLEtBQWhCLENBQXNCQyxJQUF0QixDQUEyQkMsU0FBM0IsRUFBc0MsQ0FBdEMsQ0FBdkMsQ0FBUDtBQUNELEdBRkQsTUFFTyxJQUFJLFFBQU9uVixFQUFQLHlDQUFPQSxFQUFQLE1BQWEsUUFBYixJQUF5QixDQUFDQSxFQUE5QixFQUFrQztBQUN2QyxXQUFPNkIsVUFBVUMsSUFBVixDQUFlckwsS0FBZixDQUFxQnlMLEVBQUVuQyxHQUFHNEMsU0FBSCxFQUFGLENBQXJCLEVBQXdDd1MsU0FBeEMsQ0FBUDtBQUNELEdBRk0sTUFFQTtBQUNMalQsTUFBRWtULEtBQUYsQ0FBUSx1QkFBdUJwVixFQUF2QixHQUE0QixpQ0FBcEM7QUFDRDs7QUFFRCxTQUFPa0MsRUFBRSxJQUFGLENBQVA7QUFDRCxDQS9pREQsQzs7Ozs7Ozs7Ozs7QUNOQSxJQUFJekMsV0FBWSxZQUFZO0FBQzFCOzs7Ozs7OztBQVFBO0FBQ0EsTUFBSTRWLGtCQUFrQixxQkFBdEI7O0FBRUE7QUFDQSxNQUFJQyxZQUFZbmQsS0FBS29kLEdBQXJCO0FBQUEsTUFDUUMsWUFBWUMsS0FBS0MsR0FEekI7O0FBR0E7Ozs7Ozs7Ozs7Ozs7O0FBY0EsTUFBSUEsTUFBTUYsYUFBYSxZQUFZO0FBQ2pDLFdBQU8sSUFBSUMsSUFBSixHQUFXRSxPQUFYLEVBQVA7QUFDRCxHQUZEOztBQUlBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErREEsV0FBU2xXLFFBQVQsQ0FBa0JtVyxJQUFsQixFQUF3QkMsSUFBeEIsRUFBOEJ6UCxPQUE5QixFQUF1QztBQUNyQyxRQUFJMFAsSUFBSjtBQUFBLFFBQ1FDLFlBRFI7QUFBQSxRQUVRcmYsTUFGUjtBQUFBLFFBR1FzZixLQUhSO0FBQUEsUUFJUUMsT0FKUjtBQUFBLFFBS1FDLFNBTFI7QUFBQSxRQU1RQyxZQU5SO0FBQUEsUUFPUUMsYUFBYSxDQVByQjtBQUFBLFFBUVFDLFVBQVUsS0FSbEI7QUFBQSxRQVNRQyxXQUFXLElBVG5COztBQVdBLFFBQUksT0FBT1YsSUFBUCxJQUFlLFVBQW5CLEVBQStCO0FBQzdCLFlBQU0sSUFBSVcsU0FBSixDQUFjbEIsZUFBZCxDQUFOO0FBQ0Q7QUFDRFEsV0FBT0EsT0FBTyxDQUFQLEdBQVcsQ0FBWCxHQUFnQixDQUFDQSxJQUFELElBQVMsQ0FBaEM7QUFDQSxRQUFJelAsWUFBWSxJQUFoQixFQUFzQjtBQUNwQixVQUFJb1EsVUFBVSxJQUFkO0FBQ0FGLGlCQUFXLEtBQVg7QUFDRCxLQUhELE1BR08sSUFBSUcsU0FBU3JRLE9BQVQsQ0FBSixFQUF1QjtBQUM1Qm9RLGdCQUFVLENBQUMsQ0FBQ3BRLFFBQVFvUSxPQUFwQjtBQUNBSCxnQkFBVSxhQUFhalEsT0FBYixJQUF3QmtQLFVBQVUsQ0FBQ2xQLFFBQVFpUSxPQUFULElBQW9CLENBQTlCLEVBQWlDUixJQUFqQyxDQUFsQztBQUNBUyxpQkFBVyxjQUFjbFEsT0FBZCxHQUF3QixDQUFDLENBQUNBLFFBQVFrUSxRQUFsQyxHQUE2Q0EsUUFBeEQ7QUFDRDs7QUFFRCxhQUFTSSxNQUFULEdBQWtCO0FBQ2hCLFVBQUlSLFNBQUosRUFBZTtBQUNiUyxxQkFBYVQsU0FBYjtBQUNEO0FBQ0QsVUFBSUgsWUFBSixFQUFrQjtBQUNoQlkscUJBQWFaLFlBQWI7QUFDRDtBQUNESyxtQkFBYSxDQUFiO0FBQ0FMLHFCQUFlRyxZQUFZQyxlQUFlMWhCLFNBQTFDO0FBQ0Q7O0FBRUQsYUFBU21pQixRQUFULENBQWtCQyxRQUFsQixFQUE0QnZmLEVBQTVCLEVBQWdDO0FBQzlCLFVBQUlBLEVBQUosRUFBUTtBQUNOcWYscUJBQWFyZixFQUFiO0FBQ0Q7QUFDRHllLHFCQUFlRyxZQUFZQyxlQUFlMWhCLFNBQTFDO0FBQ0EsVUFBSW9pQixRQUFKLEVBQWM7QUFDWlQscUJBQWFWLEtBQWI7QUFDQWhmLGlCQUFTa2YsS0FBS25mLEtBQUwsQ0FBV3dmLE9BQVgsRUFBb0JILElBQXBCLENBQVQ7QUFDQSxZQUFJLENBQUNJLFNBQUQsSUFBYyxDQUFDSCxZQUFuQixFQUFpQztBQUMvQkQsaUJBQU9HLFVBQVV4aEIsU0FBakI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQsYUFBU3FpQixPQUFULEdBQW1CO0FBQ2pCLFVBQUlDLFlBQVlsQixRQUFRSCxRQUFRTSxLQUFoQixDQUFoQjtBQUNBLFVBQUllLGFBQWEsQ0FBYixJQUFrQkEsWUFBWWxCLElBQWxDLEVBQXdDO0FBQ3RDZSxpQkFBU1QsWUFBVCxFQUF1QkosWUFBdkI7QUFDRCxPQUZELE1BRU87QUFDTEcsb0JBQVl4UCxXQUFXb1EsT0FBWCxFQUFvQkMsU0FBcEIsQ0FBWjtBQUNEO0FBQ0Y7O0FBRUQsYUFBU0MsVUFBVCxHQUFzQjtBQUNwQkosZUFBU04sUUFBVCxFQUFtQkosU0FBbkI7QUFDRDs7QUFFRCxhQUFTZSxTQUFULEdBQXFCO0FBQ25CbkIsYUFBT1gsU0FBUDtBQUNBYSxjQUFRTixLQUFSO0FBQ0FPLGdCQUFVLElBQVY7QUFDQUUscUJBQWVHLGFBQWFKLGFBQWEsQ0FBQ00sT0FBM0IsQ0FBZjs7QUFFQSxVQUFJSCxZQUFZLEtBQWhCLEVBQXVCO0FBQ3JCLFlBQUlhLGNBQWNWLFdBQVcsQ0FBQ04sU0FBOUI7QUFDRCxPQUZELE1BRU87QUFDTCxZQUFJLENBQUNILFlBQUQsSUFBaUIsQ0FBQ1MsT0FBdEIsRUFBK0I7QUFDN0JKLHVCQUFhSixLQUFiO0FBQ0Q7QUFDRCxZQUFJZSxZQUFZVixXQUFXTCxRQUFRSSxVQUFuQixDQUFoQjtBQUFBLFlBQ1FTLFdBQVdFLGFBQWEsQ0FBYixJQUFrQkEsWUFBWVYsT0FEakQ7O0FBR0EsWUFBSVEsUUFBSixFQUFjO0FBQ1osY0FBSWQsWUFBSixFQUFrQjtBQUNoQkEsMkJBQWVZLGFBQWFaLFlBQWIsQ0FBZjtBQUNEO0FBQ0RLLHVCQUFhSixLQUFiO0FBQ0F0ZixtQkFBU2tmLEtBQUtuZixLQUFMLENBQVd3ZixPQUFYLEVBQW9CSCxJQUFwQixDQUFUO0FBQ0QsU0FORCxNQU9LLElBQUksQ0FBQ0MsWUFBTCxFQUFtQjtBQUN0QkEseUJBQWVyUCxXQUFXc1EsVUFBWCxFQUF1QkQsU0FBdkIsQ0FBZjtBQUNEO0FBQ0Y7QUFDRCxVQUFJRixZQUFZWCxTQUFoQixFQUEyQjtBQUN6QkEsb0JBQVlTLGFBQWFULFNBQWIsQ0FBWjtBQUNELE9BRkQsTUFHSyxJQUFJLENBQUNBLFNBQUQsSUFBY0wsU0FBU1EsT0FBM0IsRUFBb0M7QUFDdkNILG9CQUFZeFAsV0FBV29RLE9BQVgsRUFBb0JqQixJQUFwQixDQUFaO0FBQ0Q7QUFDRCxVQUFJcUIsV0FBSixFQUFpQjtBQUNmTCxtQkFBVyxJQUFYO0FBQ0FuZ0IsaUJBQVNrZixLQUFLbmYsS0FBTCxDQUFXd2YsT0FBWCxFQUFvQkgsSUFBcEIsQ0FBVDtBQUNEO0FBQ0QsVUFBSWUsWUFBWSxDQUFDWCxTQUFiLElBQTBCLENBQUNILFlBQS9CLEVBQTZDO0FBQzNDRCxlQUFPRyxVQUFVeGhCLFNBQWpCO0FBQ0Q7QUFDRCxhQUFPaUMsTUFBUDtBQUNEOztBQUVEdWdCLGNBQVVQLE1BQVYsR0FBbUJBLE1BQW5CO0FBQ0EsV0FBT08sU0FBUDtBQUNEOztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9CQSxXQUFTUixRQUFULENBQWtCbEssS0FBbEIsRUFBeUI7QUFDdkI7QUFDQTtBQUNBLFFBQUlqVyxjQUFjaVcsS0FBZCx5Q0FBY0EsS0FBZCxDQUFKO0FBQ0EsV0FBTyxDQUFDLENBQUNBLEtBQUYsS0FBWWpXLFFBQVEsUUFBUixJQUFvQkEsUUFBUSxVQUF4QyxDQUFQO0FBQ0Q7O0FBRUQsU0FBT21KLFFBQVA7QUFFRCxDQTNPYyxFQUFmOztBQTZPQUYsT0FBT0MsT0FBUCxHQUFpQkMsUUFBakIsQzs7Ozs7Ozs7O0FDN09BLENBQUMsQ0FBQyxZQUFVO0FBQUU7O0FBRVosTUFBSWxMLHVCQUF1Qm1MLG1CQUFPQSxDQUFDLEdBQVIsQ0FBM0I7QUFDQSxNQUFJRCxXQUFXQyxtQkFBT0EsQ0FBQyxHQUFSLENBQWY7O0FBRUE7QUFDQSxNQUFJeVgsV0FBVyxTQUFYQSxRQUFXLENBQVVDLFNBQVYsRUFBcUJsVixDQUFyQixFQUF3Qk0sS0FBeEIsRUFBOEI7QUFDM0MsUUFBSTZVLGNBQWMzWCxtQkFBT0EsQ0FBQyxHQUFSLENBQWxCOztBQUVBLFFBQUksQ0FBQzBYLFNBQUQsSUFBYyxDQUFDbFYsQ0FBZixJQUFvQixDQUFDTSxLQUF6QixFQUErQjtBQUFFO0FBQVMsS0FIQyxDQUdBOztBQUUzQyxRQUFJOFUsV0FBVztBQUNiO0FBQ0E7QUFDQXpLLDZCQUF1QiwrQkFBUzBLLEdBQVQsRUFBYztBQUNuQyxlQUFPQSxJQUFJeGhCLElBQUosQ0FBUyxvQkFBVCxDQUFQO0FBQ0QsT0FMWTtBQU1iO0FBQ0E7QUFDQStXLGdDQUEwQixrQ0FBU3lLLEdBQVQsRUFBYztBQUN0QyxlQUFPQSxJQUFJeGhCLElBQUosQ0FBUyx1QkFBVCxDQUFQO0FBQ0QsT0FWWTtBQVdiO0FBQ0F5aEIsZ0NBQTBCLElBWmI7QUFhYjtBQUNBM2lCLHNCQUFnQixFQWRIO0FBZWI7QUFDQXdSLGdCQUFVLEtBaEJHO0FBaUJiO0FBQ0EyRSw2QkFBdUIsQ0FsQlY7QUFtQmI7QUFDQUMsdUNBQWlDLEtBcEJwQjtBQXFCYjtBQUNBaEQsY0FBUSxHQXRCSztBQXVCYjtBQUNBd1AsZUFBUyxJQXhCSTtBQXlCYjtBQUNBaEcsOEJBQXlCLENBMUJaO0FBMkJiO0FBQ0F4Syw0QkFBc0IsZ0JBNUJUO0FBNkJiO0FBQ0FHLCtCQUF5QixtQkE5Qlo7QUErQmI7QUFDQUMsa0NBQTRCLHdCQWhDZjtBQWlDYjtBQUNBRSwrQkFBeUIsbUJBbENaO0FBbUNiO0FBQ0FFLGtDQUE0QixzQkFwQ2Y7QUFxQ2I7QUFDQUMscUNBQStCLDJCQXRDbEI7QUF1Q2I7QUFDQW1NLHNDQUFnQywwQ0FBWTtBQUN4QyxlQUFPLElBQVA7QUFDSCxPQTFDWTtBQTJDYjtBQUNBdk0seUNBQW1DLEtBNUN0QjtBQTZDYjtBQUNBeUosZ0NBQXlCLElBOUNaO0FBK0NiO0FBQ0FwQyw2QkFBdUIsQ0FBQyxDQWhEWCxFQWdEZTtBQUM1QjtBQUNBK0MsdUNBQWdDO0FBbERuQixLQUFmOztBQXFEQSxRQUFJdEwsT0FBSjtBQUNBLFFBQUlzUixjQUFjLEtBQWxCOztBQUVBO0FBQ0EsYUFBU0MsTUFBVCxDQUFnQkwsUUFBaEIsRUFBMEJsUixPQUExQixFQUFtQztBQUNqQyxVQUFJd1IsTUFBTSxFQUFWOztBQUVBLFdBQUssSUFBSXZoQixDQUFULElBQWNpaEIsUUFBZCxFQUF3QjtBQUN0Qk0sWUFBSXZoQixDQUFKLElBQVNpaEIsU0FBU2poQixDQUFULENBQVQ7QUFDRDs7QUFFRCxXQUFLLElBQUlBLENBQVQsSUFBYytQLE9BQWQsRUFBdUI7QUFDckI7QUFDQSxZQUFHL1AsS0FBSyx3QkFBUixFQUFpQztBQUMvQixjQUFJa1csUUFBUW5HLFFBQVEvUCxDQUFSLENBQVo7QUFDQyxjQUFHLENBQUN3aEIsTUFBTXRMLEtBQU4sQ0FBSixFQUNBO0FBQ0csZ0JBQUdBLFNBQVMsQ0FBVCxJQUFjQSxTQUFTLEVBQTFCLEVBQTZCO0FBQzNCcUwsa0JBQUl2aEIsQ0FBSixJQUFTK1AsUUFBUS9QLENBQVIsQ0FBVDtBQUNELGFBRkQsTUFFTSxJQUFHa1csUUFBUSxDQUFYLEVBQWE7QUFDakJxTCxrQkFBSXZoQixDQUFKLElBQVMsQ0FBVDtBQUNELGFBRkssTUFFRDtBQUNIdWhCLGtCQUFJdmhCLENBQUosSUFBUyxFQUFUO0FBQ0Q7QUFDSDtBQUNILFNBWkQsTUFZSztBQUNIdWhCLGNBQUl2aEIsQ0FBSixJQUFTK1AsUUFBUS9QLENBQVIsQ0FBVDtBQUNEO0FBRUY7O0FBRUQsYUFBT3VoQixHQUFQO0FBQ0Q7O0FBRURSLGNBQVcsTUFBWCxFQUFtQixhQUFuQixFQUFrQyxVQUFTcFYsSUFBVCxFQUFjO0FBQzlDLFVBQUlqQyxLQUFLLElBQVQ7O0FBRUEsVUFBSWlDLFNBQVMsYUFBYixFQUE2QjtBQUMzQixlQUFPMFYsV0FBUDtBQUNEOztBQUVELFVBQUkxVixTQUFTLEtBQWIsRUFBcUI7QUFDbkI7QUFDQW9FLGtCQUFVdVIsT0FBT0wsUUFBUCxFQUFpQnRWLElBQWpCLENBQVY7QUFDQTBWLHNCQUFjLElBQWQ7O0FBRUE7QUFDQTNYLFdBQUdzTSxLQUFILEdBQVduRixRQUFYLENBQW9CLGdDQUFwQixFQUFzRHBSLEdBQXRELENBQTBEO0FBQ3hELHlCQUFlLFVBRHlDO0FBRXhELCtCQUFxQiwwQkFBVXloQixHQUFWLEVBQWU7QUFDbEMsbUJBQU9oakIscUJBQXFCaUksa0JBQXJCLENBQXdDK2EsR0FBeEMsRUFBNkMsTUFBN0MsQ0FBUDtBQUNELFdBSnVEO0FBS3hELDZCQUFtQix3QkFBVUEsR0FBVixFQUFlO0FBQ2hDLG1CQUFPaGpCLHFCQUFxQm1JLGdCQUFyQixDQUFzQzZhLEdBQXRDLEVBQTJDLE1BQTNDLENBQVA7QUFDRCxXQVB1RDtBQVF4RCw0QkFBa0I7QUFSc0MsU0FBMUQ7O0FBV0E7QUFDQXhYLFdBQUdzTSxLQUFILEdBQVduRixRQUFYLENBQW9CLHNDQUFwQixFQUE0RHBSLEdBQTVELENBQWdFO0FBQzlELHlCQUFlLGtCQUQrQztBQUU5RCxxQ0FBMkIsK0JBQVV5aEIsR0FBVixFQUFlO0FBQ3hDLG1CQUFPaGpCLHFCQUFxQmlJLGtCQUFyQixDQUF3QythLEdBQXhDLEVBQTZDLFNBQTdDLENBQVA7QUFDRCxXQUo2RDtBQUs5RCxtQ0FBeUIsNkJBQVVBLEdBQVYsRUFBZTtBQUN0QyxtQkFBT2hqQixxQkFBcUJtSSxnQkFBckIsQ0FBc0M2YSxHQUF0QyxFQUEyQyxTQUEzQyxDQUFQO0FBQ0QsV0FQNkQ7QUFROUQsNEJBQWtCO0FBUjRDLFNBQWhFOztBQVdBaGpCLDZCQUFxQk8saUJBQXJCLENBQXVDc1IsUUFBUXZSLGNBQS9DOztBQUVBO0FBQ0EsWUFBSXVSLFFBQVFvUix3QkFBWixFQUFzQztBQUNwQztBQUNBampCLCtCQUFxQjBCLGdCQUFyQixDQUFzQ21RLFFBQVF5RyxxQkFBOUMsRUFBcUV6RyxRQUFRMEcsd0JBQTdFLEVBQXVHL00sR0FBRzNKLEtBQUgsRUFBdkcsRUFBbUhnUSxRQUFRdlIsY0FBM0g7QUFDRDs7QUFFRCxZQUFHdVIsUUFBUXFSLE9BQVgsRUFDRUosWUFBWWpSLE9BQVosRUFBcUJyRyxFQUFyQixFQURGLEtBR0VzWCxZQUFZLFFBQVosRUFBc0J0WCxFQUF0QjtBQUNIOztBQUVELFVBQUkrWCxXQUFXSixjQUFjO0FBQzNCOzs7OztBQUtBcmUsMkJBQW1CLDJCQUFTa2UsR0FBVCxFQUFjO0FBQy9CLGlCQUFPaGpCLHFCQUFxQjhFLGlCQUFyQixDQUF1Q2tlLEdBQXZDLENBQVA7QUFDRCxTQVIwQjtBQVMzQnZkLHNDQUE4QixzQ0FBU0MsYUFBVCxFQUF1QjtBQUNuRDFGLCtCQUFxQnlGLDRCQUFyQixDQUFrREMsYUFBbEQ7QUFDRCxTQVgwQjtBQVkzQkYsc0NBQTZCLHdDQUFVO0FBQ3JDeEYsK0JBQXFCd0YsNEJBQXJCO0FBQ0QsU0FkMEI7QUFlM0JZLGlEQUF5QyxtREFBVTtBQUNqRHBHLCtCQUFxQm9HLHVDQUFyQjtBQUNELFNBakIwQjs7QUFtQjNCO0FBQ0ExRSwwQkFBa0IsMEJBQVM4aEIsSUFBVCxFQUFlO0FBQy9CeGpCLCtCQUFxQjBCLGdCQUFyQixDQUFzQ21RLFFBQVF5RyxxQkFBOUMsRUFBcUV6RyxRQUFRMEcsd0JBQTdFLEVBQXVHaUwsSUFBdkc7QUFDRCxTQXRCMEI7QUF1QjNCQyw4QkFBc0IsOEJBQVNULEdBQVQsRUFBYzNTLEtBQWQsRUFBcUI7QUFDekNyUSwrQkFBcUI2SixZQUFyQixDQUFrQ21aLEdBQWxDLEVBQXVDM1MsS0FBdkM7QUFDRDtBQXpCMEIsT0FBZCxHQTBCWG5RLFNBMUJKOztBQTRCQSxhQUFPcWpCLFFBQVAsQ0E5RThDLENBOEU3QjtBQUNsQixLQS9FRDtBQWlGRCxHQTdLRDs7QUErS0EsTUFBSSxTQUFpQ3ZZLE9BQU9DLE9BQTVDLEVBQXFEO0FBQUU7QUFDckRELFdBQU9DLE9BQVAsR0FBaUIyWCxRQUFqQjtBQUNEOztBQUVELE1BQUksSUFBSixFQUFpRDtBQUFFO0FBQ2pEYyx1Q0FBaUMsWUFBVTtBQUN6QyxhQUFPZCxRQUFQO0FBQ0QsS0FGRDtBQUFBO0FBR0Q7O0FBRUQsTUFBSSxPQUFPQyxTQUFQLEtBQXFCLFdBQXJCLElBQW9DbFYsQ0FBcEMsSUFBeUNNLEtBQTdDLEVBQW1EO0FBQUU7QUFDbkQyVSxhQUFVQyxTQUFWLEVBQXFCbFYsQ0FBckIsRUFBd0JNLEtBQXhCO0FBQ0Q7QUFFRixDQW5NQSxJOzs7Ozs7Ozs7QUNBRCxJQUFJN0Msd0JBQXdCOztBQUV4QjtBQUNBZ1Isb0JBQWdCLHdCQUFVemIsSUFBVixFQUFnQjZLLEVBQWhCLEVBQW9COUksUUFBcEIsRUFBOEJ5WixlQUE5QixFQUErQzs7QUFFM0QsWUFBSVIsWUFBWTtBQUNabmEsa0JBQU07QUFDSnVCLG9CQUFJLHlCQURBO0FBRUo0Z0IsdUJBQU87QUFGSCxhQURNO0FBS1o3TCxtQkFBTztBQUNMekosdUJBQU8sQ0FERjtBQUVMQyx3QkFBUSxDQUZIO0FBR0wsOEJBQWM7QUFIVCxhQUxLO0FBVVorTiw4QkFBa0IzWjtBQVZOLFNBQWhCO0FBWUE4SSxXQUFHa0QsR0FBSCxDQUFPaU4sU0FBUDs7QUFFQSxZQUFJb0MsTUFBTzVCLG9CQUFvQixRQUFyQixHQUNOLEVBQUMxWixRQUFRa1osVUFBVW5hLElBQVYsQ0FBZXVCLEVBQXhCLEVBRE0sR0FFTixFQUFDRixRQUFROFksVUFBVW5hLElBQVYsQ0FBZXVCLEVBQXhCLEVBRko7O0FBSUFwQyxlQUFPQSxLQUFLaWpCLElBQUwsQ0FBVTdGLEdBQVYsRUFBZSxDQUFmLENBQVA7O0FBRUEsZUFBTztBQUNIcEMsdUJBQVduUSxHQUFHK1EsS0FBSCxDQUFTLE1BQU1aLFVBQVVuYSxJQUFWLENBQWV1QixFQUE5QixFQUFrQyxDQUFsQyxDQURSO0FBRUhwQyxrQkFBTUE7QUFGSCxTQUFQO0FBSUgsS0E3QnVCOztBQStCeEI4YyxpQkFBYSxxQkFBVTljLElBQVYsRUFBZ0IyYixJQUFoQixFQUFzQmdCLFFBQXRCLEVBQWdDO0FBQ3pDLFlBQUcsQ0FBQzNjLEtBQUtpZSxNQUFMLEVBQUQsSUFBa0IsQ0FBQ3RDLEtBQUtJLE1BQUwsRUFBdEIsRUFDSTs7QUFFSixZQUFJcUIsTUFBTSxFQUFWO0FBQ0EsWUFBR1QsYUFBYSxRQUFoQixFQUNJUyxJQUFJdGIsTUFBSixHQUFhNlosS0FBS3ZaLEVBQUwsRUFBYixDQURKLEtBR0ssSUFBR3VhLGFBQWEsUUFBaEIsRUFDRFMsSUFBSWxiLE1BQUosR0FBYXlaLEtBQUt2WixFQUFMLEVBQWIsQ0FEQyxLQUlEOztBQUVKLGVBQU9wQyxLQUFLaWpCLElBQUwsQ0FBVTdGLEdBQVYsRUFBZSxDQUFmLENBQVA7QUFDSCxLQTlDdUI7O0FBZ0R4QkosY0FBVSxrQkFBVUUsT0FBVixFQUFtQkQsT0FBbkIsRUFBNEI7QUFDbEMsYUFBS2lHLFdBQUwsQ0FBaUJoRyxPQUFqQixFQUEwQkQsT0FBMUI7QUFDQSxhQUFLa0csU0FBTCxDQUFlakcsT0FBZixFQUF3QkQsT0FBeEI7QUFDSCxLQW5EdUI7O0FBcUR4QmtHLGVBQVcsbUJBQVVqRyxPQUFWLEVBQW1CRCxPQUFuQixFQUE0QjtBQUNuQyxZQUFHQyxXQUFXRCxPQUFkLEVBQXNCO0FBQ2xCQSxvQkFBUXBjLElBQVIsQ0FBYSxZQUFiLEVBQTJCcWMsUUFBUXJjLElBQVIsQ0FBYSxZQUFiLENBQTNCO0FBQ0FvYyxvQkFBUXBjLElBQVIsQ0FBYSxPQUFiLEVBQXNCcWMsUUFBUXJjLElBQVIsQ0FBYSxPQUFiLENBQXRCO0FBQ0FvYyxvQkFBUXBjLElBQVIsQ0FBYSxhQUFiLEVBQTRCcWMsUUFBUXJjLElBQVIsQ0FBYSxhQUFiLENBQTVCO0FBQ0g7QUFDSixLQTNEdUI7O0FBNkR4QnFpQixpQkFBYSxxQkFBVWhHLE9BQVYsRUFBbUJELE9BQW5CLEVBQTRCO0FBQ3JDLFlBQUdDLFFBQVF2YyxRQUFSLENBQWlCLCtCQUFqQixDQUFILEVBQXFEO0FBQ2pELGdCQUFJeWlCLGNBQWNsRyxRQUFRcmMsSUFBUixDQUFhLDRCQUFiLENBQWxCO0FBQ0EsZ0JBQUl3aUIsWUFBWW5HLFFBQVFyYyxJQUFSLENBQWEsMEJBQWIsQ0FBaEI7O0FBRUFvYyxvQkFBUXBjLElBQVIsQ0FBYSw0QkFBYixFQUEyQ3VpQixXQUEzQztBQUNBbkcsb0JBQVFwYyxJQUFSLENBQWEsMEJBQWIsRUFBeUN3aUIsU0FBekM7QUFDQXBHLG9CQUFRcmIsUUFBUixDQUFpQiwrQkFBakI7QUFDSCxTQVBELE1BUUssSUFBR3NiLFFBQVF2YyxRQUFSLENBQWlCLHFDQUFqQixDQUFILEVBQTJEO0FBQzVELGdCQUFJeWlCLGNBQWNsRyxRQUFRcmMsSUFBUixDQUFhLCtCQUFiLENBQWxCO0FBQ0EsZ0JBQUl3aUIsWUFBWW5HLFFBQVFyYyxJQUFSLENBQWEsNkJBQWIsQ0FBaEI7O0FBRUFvYyxvQkFBUXBjLElBQVIsQ0FBYSwrQkFBYixFQUE4Q3VpQixXQUE5QztBQUNBbkcsb0JBQVFwYyxJQUFSLENBQWEsNkJBQWIsRUFBNEN3aUIsU0FBNUM7QUFDQXBHLG9CQUFRcmIsUUFBUixDQUFpQixxQ0FBakI7QUFDSDtBQUNELFlBQUlzYixRQUFRdmMsUUFBUixDQUFpQix1Q0FBakIsQ0FBSixFQUErRDtBQUMzRHNjLG9CQUFRcmIsUUFBUixDQUFpQix1Q0FBakI7QUFDSCxTQUZELE1BR0ssSUFBSXNiLFFBQVF2YyxRQUFSLENBQWlCLDZDQUFqQixDQUFKLEVBQXFFO0FBQ3RFc2Msb0JBQVFyYixRQUFSLENBQWlCLDZDQUFqQjtBQUNIO0FBQ0o7QUFwRnVCLENBQTVCOztBQXVGQXlJLE9BQU9DLE9BQVAsR0FBaUJHLHFCQUFqQixDOzs7Ozs7Ozs7QUN2RkFKLE9BQU9DLE9BQVAsR0FBaUIsVUFBVU8sRUFBVixFQUFjeEwsb0JBQWQsRUFBb0N1TCxNQUFwQyxFQUE0QztBQUMzRCxNQUFJQyxHQUFHdUcsUUFBSCxJQUFlLElBQW5CLEVBQ0U7O0FBRUYsTUFBSWtTLEtBQUt6WSxHQUFHdUcsUUFBSCxDQUFZO0FBQ25CbVMsb0JBQWdCLEtBREc7QUFFbkJDLGFBQVM7QUFGVSxHQUFaLENBQVQ7O0FBS0EsV0FBU0Msa0JBQVQsQ0FBNEJ4UyxLQUE1QixFQUFtQztBQUNqQyxRQUFJalIsT0FBTzZLLEdBQUc2WSxjQUFILENBQWtCelMsTUFBTWpSLElBQU4sQ0FBV29DLEVBQVgsRUFBbEIsQ0FBWDtBQUNBLFFBQUloQixPQUFPNlAsTUFBTTdQLElBQU4sS0FBZSxjQUFmLEdBQWdDNlAsTUFBTTdQLElBQXRDLEdBQTZDL0IscUJBQXFCcUIsV0FBckIsQ0FBaUNWLElBQWpDLENBQXhEOztBQUVBLFFBQUkyQixPQUFKLEVBQWFELFNBQWIsRUFBd0JpRyxTQUF4QixFQUFtQ0MsV0FBbkM7O0FBRUEsUUFBR3FKLE1BQU03UCxJQUFOLEtBQWUsY0FBZixJQUFpQyxDQUFDNlAsTUFBTTBTLEdBQTNDLEVBQStDO0FBQzdDaGlCLGdCQUFVLEVBQVY7QUFDQUQsa0JBQVksRUFBWjtBQUNELEtBSEQsTUFJSztBQUNIaUcsa0JBQVl0SSxxQkFBcUJTLE1BQXJCLENBQTRCc0IsSUFBNUIsRUFBa0MsUUFBbEMsQ0FBWjtBQUNBd0csb0JBQWN2SSxxQkFBcUJTLE1BQXJCLENBQTRCc0IsSUFBNUIsRUFBa0MsVUFBbEMsQ0FBZDs7QUFFQU8sZ0JBQVVzUCxNQUFNMFMsR0FBTixHQUFZM2pCLEtBQUthLElBQUwsQ0FBVThHLFNBQVYsQ0FBWixHQUFtQ3NKLE1BQU10UCxPQUFuRDtBQUNBRCxrQkFBWXVQLE1BQU0wUyxHQUFOLEdBQVkzakIsS0FBS2EsSUFBTCxDQUFVK0csV0FBVixDQUFaLEdBQXFDcUosTUFBTXZQLFNBQXZEO0FBQ0Q7O0FBRUQsUUFBSUYsU0FBUztBQUNYeEIsWUFBTUEsSUFESztBQUVYb0IsWUFBTUEsSUFGSztBQUdYTyxlQUFTQSxPQUhFO0FBSVhELGlCQUFXQSxTQUpBO0FBS1g7QUFDQWlpQixXQUFLO0FBTk0sS0FBYjs7QUFTQTtBQUNBLFFBQUkxUyxNQUFNMFMsR0FBVixFQUFlO0FBQ2IsVUFBSUMsaUJBQWlCM1MsTUFBTXRQLE9BQU4sSUFBaUJzUCxNQUFNdFAsT0FBTixDQUFjYixNQUFkLEdBQXVCLENBQTdEO0FBQ0EsVUFBSStpQiwwQkFBMEJELGtCQUFrQjNTLE1BQU10UCxPQUFOLENBQWNiLE1BQWQsR0FBdUIsQ0FBdkU7O0FBRUE4aUIsdUJBQWlCNWpCLEtBQUthLElBQUwsQ0FBVThHLFNBQVYsRUFBcUJzSixNQUFNdFAsT0FBM0IsQ0FBakIsR0FBdUQzQixLQUFLOGpCLFVBQUwsQ0FBZ0JuYyxTQUFoQixDQUF2RDtBQUNBaWMsdUJBQWlCNWpCLEtBQUthLElBQUwsQ0FBVStHLFdBQVYsRUFBdUJxSixNQUFNdlAsU0FBN0IsQ0FBakIsR0FBMkQxQixLQUFLOGpCLFVBQUwsQ0FBZ0JsYyxXQUFoQixDQUEzRDs7QUFFQSxVQUFJbWMsa0JBQWtCMWtCLHFCQUFxQlMsTUFBckIsQ0FBNEJzQixJQUE1QixFQUFrQyxPQUFsQyxDQUF0QjtBQUNBLFVBQUk0aUIsaUJBQWlCM2tCLHFCQUFxQlMsTUFBckIsQ0FBNEJzQixJQUE1QixFQUFrQyxZQUFsQyxDQUFyQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxVQUFJLENBQUN3aUIsY0FBRCxJQUFtQixDQUFDQyx1QkFBeEIsRUFBaUQ7QUFDL0M7QUFDQTdqQixhQUFLc0osV0FBTCxDQUFpQnlhLGtCQUFrQixHQUFsQixHQUF3QkMsY0FBekM7QUFDRCxPQUhELE1BSUssSUFBSUosa0JBQWtCLENBQUNDLHVCQUF2QixFQUFnRDtBQUFFO0FBQ3JEN2pCLGFBQUs0QixRQUFMLENBQWNtaUIsZUFBZDtBQUNBL2pCLGFBQUtzSixXQUFMLENBQWlCMGEsY0FBakI7QUFDRCxPQUhJLE1BSUE7QUFDSDtBQUNBaGtCLGFBQUs0QixRQUFMLENBQWNtaUIsa0JBQWtCLEdBQWxCLEdBQXdCQyxjQUF0QztBQUNEO0FBQ0QsVUFBSSxDQUFDaGtCLEtBQUt3YSxRQUFMLEVBQUwsRUFDRXhhLEtBQUtvUCxNQUFMLEdBREYsS0FFSztBQUNIcFAsYUFBSzRPLFFBQUw7QUFDQTVPLGFBQUtvUCxNQUFMO0FBQ0Q7QUFDRjs7QUFFRHBQLFNBQUs2WCxPQUFMLENBQWEsa0NBQWI7O0FBRUEsV0FBT3JXLE1BQVA7QUFDRDs7QUFFRCxXQUFTeWlCLE1BQVQsQ0FBZ0JDLEdBQWhCLEVBQXFCO0FBQ2pCLFFBQUlBLElBQUl0RyxTQUFSLEVBQW1CO0FBQ2YsYUFBT3NHLElBQUl0RyxTQUFYO0FBQ0EsYUFBT3NHLEdBQVA7QUFDSDs7QUFFRCxRQUFJaGpCLFFBQVFnakIsSUFBSWhqQixLQUFoQjtBQUNBLFFBQUlzVyxlQUFlME0sSUFBSTFNLFlBQXZCO0FBQ0EsUUFBSWhXLFNBQVM7QUFDVE4sYUFBT0EsS0FERTtBQUVUc1csb0JBQWM7QUFDVjdVLFdBQUcsQ0FBQzZVLGFBQWE3VSxDQURQO0FBRVZGLFdBQUcsQ0FBQytVLGFBQWEvVTtBQUZQO0FBRkwsS0FBYjtBQU9BMGhCLHdCQUFvQjNNLFlBQXBCLEVBQWtDdFcsS0FBbEM7O0FBRUEsV0FBT00sTUFBUDtBQUNIOztBQUVELFdBQVMyaUIsbUJBQVQsQ0FBNkIzTSxZQUE3QixFQUEyQ3RXLEtBQTNDLEVBQWtEO0FBQzlDQSxVQUFNbUUsT0FBTixDQUFjLFVBQVVyRixJQUFWLEVBQWdCO0FBQzFCLFVBQUlvQixPQUFPL0IscUJBQXFCcUIsV0FBckIsQ0FBaUNWLElBQWpDLENBQVg7QUFDQSxVQUFJeVgsMEJBQTBCcFkscUJBQXFCOEUsaUJBQXJCLENBQXVDbkUsSUFBdkMsQ0FBOUI7QUFDQSxVQUFJb2tCLHNCQUFzQixFQUExQjtBQUNBLFVBQUkzTSwyQkFBMkJsWSxTQUEvQixFQUNBO0FBQ0ksYUFBSyxJQUFJNEIsSUFBRSxDQUFYLEVBQWNBLElBQUVzVyx3QkFBd0IzVyxNQUF4QyxFQUFnREssS0FBRyxDQUFuRCxFQUNBO0FBQ0lpakIsOEJBQW9CeGYsSUFBcEIsQ0FBeUIsRUFBQ2pDLEdBQUc4VSx3QkFBd0J0VyxDQUF4QixJQUEyQnFXLGFBQWE3VSxDQUE1QyxFQUErQ0YsR0FBR2dWLHdCQUF3QnRXLElBQUUsQ0FBMUIsSUFBNkJxVyxhQUFhL1UsQ0FBNUYsRUFBekI7QUFDSDtBQUNEekMsYUFBS2EsSUFBTCxDQUFVeEIscUJBQXFCUyxNQUFyQixDQUE0QnNCLElBQTVCLEVBQWtDLFVBQWxDLENBQVYsRUFBeURnakIsbUJBQXpEO0FBQ0g7QUFDSixLQVpEOztBQWNBL2tCLHlCQUFxQjBCLGdCQUFyQixDQUFzQzZKLE9BQU8rTSxxQkFBN0MsRUFBb0UvTSxPQUFPZ04sd0JBQTNFLEVBQXFHMVcsS0FBckc7QUFDSDs7QUFFRCxXQUFTbWpCLGFBQVQsQ0FBdUJwVCxLQUF2QixFQUE2QjtBQUMzQixRQUFJalIsT0FBWWlSLE1BQU1qUixJQUF0QjtBQUNBLFFBQUkyYyxXQUFZMUwsTUFBTTBMLFFBQXRCO0FBQ0EsUUFBSVUsU0FBWXBNLE1BQU1vTSxNQUF0Qjs7QUFFQXJkLFdBQU9BLEtBQUtpakIsSUFBTCxDQUFVdEcsUUFBVixFQUFvQixDQUFwQixDQUFQOztBQUVBLFFBQUluYixTQUFTO0FBQ1h4QixZQUFVQSxJQURDO0FBRVgyYyxnQkFBVVUsTUFGQztBQUdYQSxjQUFVVjtBQUhDLEtBQWI7QUFLQTNjLFNBQUs0TyxRQUFMO0FBQ0EsV0FBT3BOLE1BQVA7QUFDRDs7QUFFRCxXQUFTOGlCLHFCQUFULENBQStCclQsS0FBL0IsRUFBcUM7QUFDbkMsUUFBSWlNLFVBQVVqTSxNQUFNaU0sT0FBcEI7QUFDQSxRQUFJcUgsTUFBTTFaLEdBQUc2WSxjQUFILENBQWtCeEcsUUFBUXJjLElBQVIsQ0FBYSxJQUFiLENBQWxCLENBQVY7QUFDQSxRQUFHMGpCLE9BQU9BLElBQUl6akIsTUFBSixHQUFhLENBQXZCLEVBQ0VvYyxVQUFVcUgsR0FBVjs7QUFFRixRQUFJdEgsVUFBVWhNLE1BQU1nTSxPQUFwQjtBQUNBLFFBQUlzSCxNQUFNMVosR0FBRzZZLGNBQUgsQ0FBa0J6RyxRQUFRcGMsSUFBUixDQUFhLElBQWIsQ0FBbEIsQ0FBVjtBQUNBLFFBQUcwakIsT0FBT0EsSUFBSXpqQixNQUFKLEdBQWEsQ0FBdkIsRUFDRW1jLFVBQVVzSCxHQUFWOztBQUVGLFFBQUdySCxRQUFRekcsTUFBUixFQUFILEVBQW9CO0FBQ2xCeUcsZ0JBQVVBLFFBQVFDLE1BQVIsR0FBaUIsQ0FBakIsQ0FBVjtBQUNEOztBQUVELFFBQUdGLFFBQVF1SCxPQUFSLEVBQUgsRUFBcUI7QUFDbkJ2SCxnQkFBVUEsUUFBUXdILE9BQVIsRUFBVjtBQUNBeEgsY0FBUXJPLFFBQVI7QUFDRDs7QUFFRCxXQUFPO0FBQ0xzTyxlQUFTRCxPQURKO0FBRUxBLGVBQVNDO0FBRkosS0FBUDtBQUlEOztBQUVEb0csS0FBR29CLE1BQUgsQ0FBVSxvQkFBVixFQUFnQ2pCLGtCQUFoQyxFQUFvREEsa0JBQXBEO0FBQ0FILEtBQUdvQixNQUFILENBQVUsa0JBQVYsRUFBOEJULE1BQTlCLEVBQXNDQSxNQUF0QztBQUNBWCxLQUFHb0IsTUFBSCxDQUFVLGVBQVYsRUFBMkJMLGFBQTNCLEVBQTBDQSxhQUExQztBQUNBZixLQUFHb0IsTUFBSCxDQUFVLHVCQUFWLEVBQW1DSixxQkFBbkMsRUFBMERBLHFCQUExRDtBQUNELENBL0pELEM7Ozs7OztVQ0FBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7VUN0QkE7VUFDQTtVQUNBO1VBQ0EiLCJmaWxlIjoiY3l0b3NjYXBlLWVkZ2UtZWRpdGluZy5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcImN5dG9zY2FwZUVkZ2VFZGl0aW5nXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcImN5dG9zY2FwZUVkZ2VFZGl0aW5nXCJdID0gZmFjdG9yeSgpO1xufSkoc2VsZiwgZnVuY3Rpb24oKSB7XG5yZXR1cm4gIiwidmFyIGFuY2hvclBvaW50VXRpbGl0aWVzID0ge1xyXG4gIGN1cnJlbnRDdHhFZGdlOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudEN0eFBvczogdW5kZWZpbmVkLFxyXG4gIGN1cnJlbnRBbmNob3JJbmRleDogdW5kZWZpbmVkLFxyXG4gIGN1cnJlbnRFZGdlc0ZvckZpeEFuY2hvclBvc2l0aW9uczp1bmRlZmluZWQsXHJcbiAgaWdub3JlZENsYXNzZXM6IHVuZGVmaW5lZCxcclxuICBzZXRJZ25vcmVkQ2xhc3NlczogZnVuY3Rpb24oX2lnbm9yZWRDbGFzc2VzKSB7XHJcbiAgICB0aGlzLmlnbm9yZWRDbGFzc2VzID0gX2lnbm9yZWRDbGFzc2VzO1xyXG4gIH0sXHJcbiAgc3ludGF4OiB7XHJcbiAgICBiZW5kOiB7XHJcbiAgICAgIGVkZ2U6IFwic2VnbWVudHNcIixcclxuICAgICAgY2xhc3M6IFwiZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHNcIixcclxuICAgICAgbXVsdGlDbGFzczogXCJlZGdlYmVuZGVkaXRpbmctaGFzbXVsdGlwbGViZW5kcG9pbnRzXCIsXHJcbiAgICAgIHdlaWdodDogXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixcclxuICAgICAgZGlzdGFuY2U6IFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixcclxuICAgICAgd2VpZ2h0Q3NzOiBcInNlZ21lbnQtd2VpZ2h0c1wiLFxyXG4gICAgICBkaXN0YW5jZUNzczogXCJzZWdtZW50LWRpc3RhbmNlc1wiLFxyXG4gICAgICBwb2ludFBvczogXCJiZW5kUG9pbnRQb3NpdGlvbnNcIixcclxuICAgICAgYmVuZEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uOlwiYmVuZEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uXCJcclxuICAgIH0sXHJcbiAgICBjb250cm9sOiB7XHJcbiAgICAgIGVkZ2U6IFwidW5idW5kbGVkLWJlemllclwiLFxyXG4gICAgICBjbGFzczogXCJlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50c1wiLFxyXG4gICAgICBtdWx0aUNsYXNzOiBcImVkZ2Vjb250cm9sZWRpdGluZy1oYXNtdWx0aXBsZWNvbnRyb2xwb2ludHNcIixcclxuICAgICAgd2VpZ2h0OiBcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLFxyXG4gICAgICBkaXN0YW5jZTogXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiLFxyXG4gICAgICB3ZWlnaHRDc3M6IFwiY29udHJvbC1wb2ludC13ZWlnaHRzXCIsXHJcbiAgICAgIGRpc3RhbmNlQ3NzOiBcImNvbnRyb2wtcG9pbnQtZGlzdGFuY2VzXCIsXHJcbiAgICAgIHBvaW50UG9zOiBcImNvbnRyb2xQb2ludFBvc2l0aW9uc1wiLFxyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gZ2V0cyBlZGdlIHR5cGUgYXMgJ2JlbmQnIG9yICdjb250cm9sJ1xyXG4gIC8vIHRoZSBpbnRlcmNoYW5naW5nIGlmLXMgYXJlIG5lY2Vzc2FyeSB0byBzZXQgdGhlIHByaW9yaXR5IG9mIHRoZSB0YWdzXHJcbiAgLy8gZXhhbXBsZTogYW4gZWRnZSB3aXRoIHR5cGUgc2VnbWVudCBhbmQgYSBjbGFzcyAnaGFzY29udHJvbHBvaW50cycgd2lsbCBiZSBjbGFzc2lmaWVkIGFzIHVuYnVuZGxlZCBiZXppZXJcclxuICBnZXRFZGdlVHlwZTogZnVuY3Rpb24oZWRnZSl7XHJcbiAgICBpZighZWRnZSlcclxuICAgICAgcmV0dXJuICdpbmNvbmNsdXNpdmUnO1xyXG4gICAgZWxzZSBpZihlZGdlLmhhc0NsYXNzKHRoaXMuc3ludGF4WydiZW5kJ11bJ2NsYXNzJ10pKVxyXG4gICAgICByZXR1cm4gJ2JlbmQnO1xyXG4gICAgZWxzZSBpZihlZGdlLmhhc0NsYXNzKHRoaXMuc3ludGF4Wydjb250cm9sJ11bJ2NsYXNzJ10pKVxyXG4gICAgICByZXR1cm4gJ2NvbnRyb2wnO1xyXG4gICAgZWxzZSBpZihlZGdlLmNzcygnY3VydmUtc3R5bGUnKSA9PT0gdGhpcy5zeW50YXhbJ2JlbmQnXVsnZWRnZSddKVxyXG4gICAgICByZXR1cm4gJ2JlbmQnO1xyXG4gICAgZWxzZSBpZihlZGdlLmNzcygnY3VydmUtc3R5bGUnKSA9PT0gdGhpcy5zeW50YXhbJ2NvbnRyb2wnXVsnZWRnZSddKVxyXG4gICAgICByZXR1cm4gJ2NvbnRyb2wnO1xyXG4gICAgZWxzZSBpZihlZGdlLmRhdGEodGhpcy5zeW50YXhbJ2JlbmQnXVsncG9pbnRQb3MnXSkgJiYgXHJcbiAgICAgICAgICAgIGVkZ2UuZGF0YSh0aGlzLnN5bnRheFsnYmVuZCddWydwb2ludFBvcyddKS5sZW5ndGggPiAwKVxyXG4gICAgICByZXR1cm4gJ2JlbmQnO1xyXG4gICAgZWxzZSBpZihlZGdlLmRhdGEodGhpcy5zeW50YXhbJ2NvbnRyb2wnXVsncG9pbnRQb3MnXSkgJiYgXHJcbiAgICAgICAgICAgIGVkZ2UuZGF0YSh0aGlzLnN5bnRheFsnY29udHJvbCddWydwb2ludFBvcyddKS5sZW5ndGggPiAwKVxyXG4gICAgICByZXR1cm4gJ2NvbnRyb2wnO1xyXG4gICAgcmV0dXJuICdpbmNvbmNsdXNpdmUnO1xyXG4gIH0sXHJcbiAgLy8gaW5pdGlsaXplIGFuY2hvciBwb2ludHMgYmFzZWQgb24gYmVuZFBvc2l0aW9uc0ZjbiBhbmQgY29udHJvbFBvc2l0aW9uRmNuXHJcbiAgaW5pdEFuY2hvclBvaW50czogZnVuY3Rpb24oYmVuZFBvc2l0aW9uc0ZjbiwgY29udHJvbFBvc2l0aW9uc0ZjbiwgZWRnZXMpIHtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWRnZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIGVkZ2UgPSBlZGdlc1tpXTtcclxuICAgICAgdmFyIHR5cGUgPSB0aGlzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG4gICAgICBcclxuICAgICAgaWYgKHR5cGUgPT09ICdpbmNvbmNsdXNpdmUnKSB7IFxyXG4gICAgICAgIGNvbnRpbnVlOyBcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYoIXRoaXMuaXNJZ25vcmVkRWRnZShlZGdlKSkge1xyXG5cclxuICAgICAgICB2YXIgYW5jaG9yUG9zaXRpb25zO1xyXG5cclxuICAgICAgICAvLyBnZXQgdGhlIGFuY2hvciBwb3NpdGlvbnMgYnkgYXBwbHlpbmcgdGhlIGZ1bmN0aW9ucyBmb3IgdGhpcyBlZGdlXHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ2JlbmQnKVxyXG4gICAgICAgICAgYW5jaG9yUG9zaXRpb25zID0gYmVuZFBvc2l0aW9uc0Zjbi5hcHBseSh0aGlzLCBlZGdlKTtcclxuICAgICAgICBlbHNlIGlmKHR5cGUgPT09ICdjb250cm9sJylcclxuICAgICAgICAgIGFuY2hvclBvc2l0aW9ucyA9IGNvbnRyb2xQb3NpdGlvbnNGY24uYXBwbHkodGhpcywgZWRnZSk7XHJcblxyXG4gICAgICAgIC8vIGNhbGN1bGF0ZSByZWxhdGl2ZSBhbmNob3IgcG9zaXRpb25zXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbnMoZWRnZSwgYW5jaG9yUG9zaXRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gaWYgdGhlcmUgYXJlIGFuY2hvcnMgc2V0IHdlaWdodHMgYW5kIGRpc3RhbmNlcyBhY2NvcmRpbmdseSBhbmQgYWRkIGNsYXNzIHRvIGVuYWJsZSBzdHlsZSBjaGFuZ2VzXHJcbiAgICAgICAgaWYgKHJlc3VsdC5kaXN0YW5jZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgZWRnZS5kYXRhKHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSwgcmVzdWx0LndlaWdodHMpO1xyXG4gICAgICAgICAgZWRnZS5kYXRhKHRoaXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddLCByZXN1bHQuZGlzdGFuY2VzKTtcclxuICAgICAgICAgIGVkZ2UuYWRkQ2xhc3ModGhpcy5zeW50YXhbdHlwZV1bJ2NsYXNzJ10pO1xyXG4gICAgICAgICAgaWYgKHJlc3VsdC5kaXN0YW5jZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICBlZGdlLmFkZENsYXNzKHRoaXMuc3ludGF4W3R5cGVdWydtdWx0aUNsYXNzJ10pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGlzSWdub3JlZEVkZ2U6IGZ1bmN0aW9uKGVkZ2UpIHtcclxuXHJcbiAgICB2YXIgc3RhcnRYID0gZWRnZS5zb3VyY2UoKS5wb3NpdGlvbigneCcpO1xyXG4gICAgdmFyIHN0YXJ0WSA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oJ3knKTtcclxuICAgIHZhciBlbmRYID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigneCcpO1xyXG4gICAgdmFyIGVuZFkgPSBlZGdlLnRhcmdldCgpLnBvc2l0aW9uKCd5Jyk7XHJcbiAgIFxyXG4gICAgaWYoKHN0YXJ0WCA9PSBlbmRYICYmIHN0YXJ0WSA9PSBlbmRZKSAgfHwgKGVkZ2Uuc291cmNlKCkuaWQoKSA9PSBlZGdlLnRhcmdldCgpLmlkKCkpKXtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBmb3IodmFyIGkgPSAwOyB0aGlzLmlnbm9yZWRDbGFzc2VzICYmIGkgPCAgdGhpcy5pZ25vcmVkQ2xhc3Nlcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgIGlmKGVkZ2UuaGFzQ2xhc3ModGhpcy5pZ25vcmVkQ2xhc3Nlc1tpXSkpXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuICAvL0dldCB0aGUgZGlyZWN0aW9uIG9mIHRoZSBsaW5lIGZyb20gc291cmNlIHBvaW50IHRvIHRoZSB0YXJnZXQgcG9pbnRcclxuICBnZXRMaW5lRGlyZWN0aW9uOiBmdW5jdGlvbihzcmNQb2ludCwgdGd0UG9pbnQpe1xyXG4gICAgdmFyIHNyY1k9c3JjUG9pbnQueVxyXG4gICAgdmFyIHNyY1g9c3JjUG9pbnQueFxyXG4gICAgdmFyIHRndFk9dGd0UG9pbnQueVxyXG4gICAgdmFyIHRndFg9dGd0UG9pbnQueFxyXG5cclxuICAgIHZhciBjb21wYXJlRXF1YWw9KHYxLHYyKT0+e1xyXG4gICAgICBpZihNYXRoLmFicyh2MS12Mik8MC4wMDAxKSByZXR1cm4gdHJ1ZVxyXG4gICAgICBlbHNlIHJldHVybiBmYWxzZVxyXG4gICAgfVxyXG5cclxuICAgIGlmKCBjb21wYXJlRXF1YWwoc3JjUG9pbnQueSx0Z3RQb2ludC55KSAmJiBzcmNQb2ludC54IDwgdGd0UG9pbnQueCl7XHJcbiAgICAgIHJldHVybiAxO1xyXG4gICAgfVxyXG4gICAgaWYoc3JjUG9pbnQueSA8IHRndFBvaW50LnkgJiYgc3JjUG9pbnQueCA8IHRndFBvaW50Lngpe1xyXG4gICAgICByZXR1cm4gMjtcclxuICAgIH1cclxuICAgIGlmKHNyY1BvaW50LnkgPCB0Z3RQb2ludC55ICYmIGNvbXBhcmVFcXVhbChzcmNQb2ludC54LHRndFBvaW50LngpKXtcclxuICAgICAgcmV0dXJuIDM7XHJcbiAgICB9XHJcbiAgICBpZihzcmNQb2ludC55IDwgdGd0UG9pbnQueSAmJiBzcmNQb2ludC54ID4gdGd0UG9pbnQueCl7XHJcbiAgICAgIHJldHVybiA0O1xyXG4gICAgfVxyXG4gICAgaWYoY29tcGFyZUVxdWFsKHNyY1BvaW50LnksdGd0UG9pbnQueSkgJiYgc3JjUG9pbnQueCA+IHRndFBvaW50Lngpe1xyXG4gICAgICByZXR1cm4gNTtcclxuICAgIH1cclxuICAgIGlmKHNyY1BvaW50LnkgPiB0Z3RQb2ludC55ICYmIHNyY1BvaW50LnggPiB0Z3RQb2ludC54KXtcclxuICAgICAgcmV0dXJuIDY7XHJcbiAgICB9XHJcbiAgICBpZihzcmNQb2ludC55ID4gdGd0UG9pbnQueSAmJiBjb21wYXJlRXF1YWwoc3JjUG9pbnQueCAsdGd0UG9pbnQueCkpe1xyXG4gICAgICByZXR1cm4gNztcclxuICAgIH1cclxuICAgIHJldHVybiA4Oy8vaWYgc3JjUG9pbnQueSA+IHRndFBvaW50LnkgYW5kIHNyY1BvaW50LnggPCB0Z3RQb2ludC54XHJcbiAgfSxcclxuICBnZXRTcmNUZ3RQb2ludHNBbmRUYW5nZW50czogZnVuY3Rpb24gKGVkZ2UpIHtcclxuICAgIHZhciBzb3VyY2VOb2RlID0gZWRnZS5zb3VyY2UoKTtcclxuICAgIHZhciB0YXJnZXROb2RlID0gZWRnZS50YXJnZXQoKTtcclxuICAgIFxyXG4gICAgdmFyIHRndFBvc2l0aW9uID0gdGFyZ2V0Tm9kZS5wb3NpdGlvbigpO1xyXG4gICAgdmFyIHNyY1Bvc2l0aW9uID0gc291cmNlTm9kZS5wb3NpdGlvbigpO1xyXG4gICAgXHJcbiAgICB2YXIgc3JjUG9pbnQgPSBzb3VyY2VOb2RlLnBvc2l0aW9uKCk7XHJcbiAgICB2YXIgdGd0UG9pbnQgPSB0YXJnZXROb2RlLnBvc2l0aW9uKCk7XHJcblxyXG5cclxuICAgIHZhciBtMSA9ICh0Z3RQb2ludC55IC0gc3JjUG9pbnQueSkgLyAodGd0UG9pbnQueCAtIHNyY1BvaW50LngpO1xyXG4gICAgdmFyIG0yID0gLTEgLyBtMTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBtMTogbTEsXHJcbiAgICAgIG0yOiBtMixcclxuICAgICAgc3JjUG9pbnQ6IHNyY1BvaW50LFxyXG4gICAgICB0Z3RQb2ludDogdGd0UG9pbnRcclxuICAgIH07XHJcbiAgfSxcclxuICBnZXRJbnRlcnNlY3Rpb246IGZ1bmN0aW9uKGVkZ2UsIHBvaW50LCBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cyl7XHJcbiAgICBpZiAoc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cyA9IHRoaXMuZ2V0U3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMoZWRnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNyY1BvaW50ID0gc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMuc3JjUG9pbnQ7XHJcbiAgICB2YXIgdGd0UG9pbnQgPSBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cy50Z3RQb2ludDtcclxuICAgIHZhciBtMSA9IHNyY1RndFBvaW50c0FuZFRhbmdlbnRzLm0xO1xyXG4gICAgdmFyIG0yID0gc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMubTI7XHJcblxyXG4gICAgdmFyIGludGVyc2VjdFg7XHJcbiAgICB2YXIgaW50ZXJzZWN0WTtcclxuXHJcbiAgICBpZihtMSA9PSBJbmZpbml0eSB8fCBtMSA9PSAtSW5maW5pdHkpe1xyXG4gICAgICBpbnRlcnNlY3RYID0gc3JjUG9pbnQueDtcclxuICAgICAgaW50ZXJzZWN0WSA9IHBvaW50Lnk7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKE1hdGguYWJzKG0xKSA8IDAuMDAwMDAwMSl7XHJcbiAgICAgIGludGVyc2VjdFggPSBwb2ludC54O1xyXG4gICAgICBpbnRlcnNlY3RZID0gc3JjUG9pbnQueTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB2YXIgYTEgPSBzcmNQb2ludC55IC0gbTEgKiBzcmNQb2ludC54O1xyXG4gICAgICB2YXIgYTIgPSBwb2ludC55IC0gbTIgKiBwb2ludC54O1xyXG5cclxuICAgICAgaW50ZXJzZWN0WCA9IChhMiAtIGExKSAvIChtMSAtIG0yKTtcclxuICAgICAgaW50ZXJzZWN0WSA9IG0xICogaW50ZXJzZWN0WCArIGExO1xyXG4gICAgfVxyXG5cclxuICAgIC8vSW50ZXJzZWN0aW9uIHBvaW50IGlzIHRoZSBpbnRlcnNlY3Rpb24gb2YgdGhlIGxpbmVzIHBhc3NpbmcgdGhyb3VnaCB0aGUgbm9kZXMgYW5kXHJcbiAgICAvL3Bhc3NpbmcgdGhyb3VnaCB0aGUgYmVuZCBvciBjb250cm9sIHBvaW50IGFuZCBwZXJwZW5kaWN1bGFyIHRvIHRoZSBvdGhlciBsaW5lXHJcbiAgICB2YXIgaW50ZXJzZWN0aW9uUG9pbnQgPSB7XHJcbiAgICAgIHg6IGludGVyc2VjdFgsXHJcbiAgICAgIHk6IGludGVyc2VjdFlcclxuICAgIH07XHJcbiAgICBcclxuICAgIHJldHVybiBpbnRlcnNlY3Rpb25Qb2ludDtcclxuICB9LFxyXG4gIGdldEFuY2hvcnNBc0FycmF5OiBmdW5jdGlvbihlZGdlKSB7XHJcbiAgICB2YXIgdHlwZSA9IHRoaXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgaWYodHlwZSA9PT0gJ2luY29uY2x1c2l2ZScpe1xyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZiggZWRnZS5jc3MoJ2N1cnZlLXN0eWxlJykgIT09IHRoaXMuc3ludGF4W3R5cGVdWydlZGdlJ10gKSB7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBhbmNob3JMaXN0ID0gW107XHJcblxyXG4gICAgdmFyIHdlaWdodHMgPSBlZGdlLnBzdHlsZSggdGhpcy5zeW50YXhbdHlwZV1bJ3dlaWdodENzcyddICkgPyBcclxuICAgICAgICAgICAgICAgICAgZWRnZS5wc3R5bGUoIHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHRDc3MnXSApLnBmVmFsdWUgOiBbXTtcclxuICAgIHZhciBkaXN0YW5jZXMgPSBlZGdlLnBzdHlsZSggdGhpcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlQ3NzJ10gKSA/IFxyXG4gICAgICAgICAgICAgICAgICBlZGdlLnBzdHlsZSggdGhpcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlQ3NzJ10gKS5wZlZhbHVlIDogW107XHJcbiAgICB2YXIgbWluTGVuZ3RocyA9IE1hdGgubWluKCB3ZWlnaHRzLmxlbmd0aCwgZGlzdGFuY2VzLmxlbmd0aCApO1xyXG4gICAgXHJcbiAgICBmb3IoIHZhciBzID0gMDsgcyA8IG1pbkxlbmd0aHM7IHMrKyApe1xyXG4gICAgICB2YXIgYW5BbmNob3JQb3NpdGlvbj0gdGhpcy5jb252ZXJ0VG9BbmNob3JBYnNvbHV0ZVBvc2l0aW9ucyhlZGdlLCB0eXBlLCBzKVxyXG4gICAgICBhbmNob3JMaXN0LnB1c2goYW5BbmNob3JQb3NpdGlvbi54LGFuQW5jaG9yUG9zaXRpb24ueSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBhbmNob3JMaXN0O1xyXG4gIH0sXHJcbiAgcmVzZXRBbmNob3JzQWJzb2x1dGVQb3NpdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5jdXJyZW50RWRnZXNGb3JGaXhBbmNob3JQb3NpdGlvbnM9dW5kZWZpbmVkXHJcbiAgfSxcclxuICBzdG9yZUFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uOiBmdW5jdGlvbiAoZHJhZ2dpbmdOb2Rlcykge1xyXG4gICAgLy9maW5kIGFsbCBlZGdlIHRvIHRob3NlIGRyYWdnaW5nIG5vZGVzXHJcbiAgICB2YXIgaW1wYWN0RWRnZXMgPSBkcmFnZ2luZ05vZGVzLmNvbm5lY3RlZEVkZ2VzKClcclxuICAgIHZhciBleGNsdWRlRWRnZXMgPSBkcmFnZ2luZ05vZGVzLmVkZ2VzV2l0aChkcmFnZ2luZ05vZGVzKVxyXG4gICAgLy9leGNsdWRlIHRob3NlIGVkZ2VzIHdob3NlIHNvdXJjZSBhbmQgdGFyZ2V0IHdhcyBpbiBkcmFnZ2luZ25vZGVzXHJcbiAgICBpbXBhY3RFZGdlcz1pbXBhY3RFZGdlcy51bm1lcmdlKGV4Y2x1ZGVFZGdlcylcclxuXHJcbiAgICBpbXBhY3RFZGdlcy5mb3JFYWNoKG9uZUVkZ2UgPT4ge1xyXG4gICAgICB2YXIgYXJyPXRoaXMuZ2V0QW5jaG9yc0FzQXJyYXkob25lRWRnZSlcclxuICAgICAgaWYoYXJyPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xyXG4gICAgICB2YXIgcG9zaXRpb25zQXJyPVtdXHJcbiAgICAgIGZvcih2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKz0yKXtcclxuICAgICAgICBwb3NpdGlvbnNBcnIucHVzaCh7eDphcnJbaV0seTphcnJbaSsxXX0pXHJcbiAgICAgIH1cclxuICAgICAgb25lRWRnZS5kYXRhKHRoaXMuc3ludGF4WydiZW5kJ11bJ2JlbmRBbmNob3JzQWJzb2x1dGVQb3NpdGlvbiddLHBvc2l0aW9uc0FyciApXHJcbiAgICB9KTtcclxuICAgIHRoaXMuY3VycmVudEVkZ2VzRm9yRml4QW5jaG9yUG9zaXRpb25zPWltcGFjdEVkZ2VzXHJcbiAgfSxcclxuICBrZWVwQW5jaG9yc0Fic29sdXRlUG9zaXRpb25EdXJpbmdNb3Zpbmc6ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuY3VycmVudEVkZ2VzRm9yRml4QW5jaG9yUG9zaXRpb25zPT09dW5kZWZpbmVkKSByZXR1cm47XHJcbiAgICB0aGlzLmN1cnJlbnRFZGdlc0ZvckZpeEFuY2hvclBvc2l0aW9ucy5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgdmFyIHN0b3JlZFBvc2l0aW9uPW9uZUVkZ2UuZGF0YSh0aGlzLnN5bnRheFsnYmVuZCddWydiZW5kQW5jaG9yc0Fic29sdXRlUG9zaXRpb24nXSlcclxuICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbnMob25lRWRnZSwgc3RvcmVkUG9zaXRpb24pO1xyXG4gICAgICBpZihyZXN1bHQuZGlzdGFuY2VzPDApe1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLmNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb25zKG9uZUVkZ2UsIHN0b3JlZFBvc2l0aW9uKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAocmVzdWx0LmRpc3RhbmNlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgb25lRWRnZS5kYXRhKHRoaXMuc3ludGF4WydiZW5kJ11bJ3dlaWdodCddLCByZXN1bHQud2VpZ2h0cyk7XHJcbiAgICAgICAgb25lRWRnZS5kYXRhKHRoaXMuc3ludGF4WydiZW5kJ11bJ2Rpc3RhbmNlJ10sIHJlc3VsdC5kaXN0YW5jZXMpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH0sXHJcbiAgY29udmVydFRvQW5jaG9yQWJzb2x1dGVQb3NpdGlvbnM6IGZ1bmN0aW9uIChlZGdlLCB0eXBlLCBhbmNob3JJbmRleCkge1xyXG4gICAgdmFyIHNyY1BvcyA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oKTtcclxuICAgIHZhciB0Z3RQb3MgPSBlZGdlLnRhcmdldCgpLnBvc2l0aW9uKCk7XHJcbiAgICB2YXIgd2VpZ2h0cyA9IGVkZ2UuZGF0YSh0aGlzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10pO1xyXG4gICAgdmFyIGRpc3RhbmNlcyA9IGVkZ2UuZGF0YSh0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXSk7XHJcbiAgICB2YXIgdyA9IHdlaWdodHNbIGFuY2hvckluZGV4IF07XHJcbiAgICB2YXIgZCA9IGRpc3RhbmNlc1sgYW5jaG9ySW5kZXggXTtcclxuICAgIHZhciBkeSA9ICggdGd0UG9zLnkgLSBzcmNQb3MueSApO1xyXG4gICAgdmFyIGR4ID0gKCB0Z3RQb3MueCAtIHNyY1Bvcy54ICk7XHJcbiAgICB2YXIgbCA9IE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcclxuICAgIHZhciB2ZWN0b3IgPSB7XHJcbiAgICAgIHg6IGR4LFxyXG4gICAgICB5OiBkeVxyXG4gICAgfTtcclxuICAgIHZhciB2ZWN0b3JOb3JtID0ge1xyXG4gICAgICB4OiB2ZWN0b3IueCAvIGwsXHJcbiAgICAgIHk6IHZlY3Rvci55IC8gbFxyXG4gICAgfTtcclxuICAgIHZhciB2ZWN0b3JOb3JtSW52ZXJzZSA9IHtcclxuICAgICAgeDogLXZlY3Rvck5vcm0ueSxcclxuICAgICAgeTogdmVjdG9yTm9ybS54XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB3MSA9ICgxIC0gdyk7XHJcbiAgICB2YXIgdzIgPSB3O1xyXG4gICAgdmFyIG1pZFg9IHNyY1Bvcy54ICogdzEgKyB0Z3RQb3MueCAqIHcyXHJcbiAgICB2YXIgbWlkWT0gc3JjUG9zLnkgKiB3MSArIHRndFBvcy55ICogdzJcclxuICAgIHZhciBhYnNvbHV0ZVg9IG1pZFggKyB2ZWN0b3JOb3JtSW52ZXJzZS54ICogZFxyXG4gICAgdmFyIGFic29sdXRlWT0gbWlkWSArIHZlY3Rvck5vcm1JbnZlcnNlLnkgKiBkXHJcblxyXG4gICAgcmV0dXJuIHt4OmFic29sdXRlWCx5OmFic29sdXRlWX1cclxuICB9LFxyXG4gIG9idGFpblByZXZBbmNob3JBYnNvbHV0ZVBvc2l0aW9uczogZnVuY3Rpb24gKGVkZ2UsIHR5cGUsIGFuY2hvckluZGV4KSB7XHJcbiAgICBpZihhbmNob3JJbmRleDw9MCl7XHJcbiAgICAgIHJldHVybiBlZGdlLnNvdXJjZSgpLnBvc2l0aW9uKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgcmV0dXJuIHRoaXMuY29udmVydFRvQW5jaG9yQWJzb2x1dGVQb3NpdGlvbnMoZWRnZSx0eXBlLGFuY2hvckluZGV4LTEpXHJcbiAgICB9XHJcbiAgfSxcclxuICBvYnRhaW5OZXh0QW5jaG9yQWJzb2x1dGVQb3NpdGlvbnM6IGZ1bmN0aW9uIChlZGdlLCB0eXBlLCBhbmNob3JJbmRleCkge1xyXG4gICAgdmFyIHdlaWdodHMgPSBlZGdlLmRhdGEodGhpcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddKTtcclxuICAgIHZhciBkaXN0YW5jZXMgPSBlZGdlLmRhdGEodGhpcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ10pO1xyXG4gICAgdmFyIG1pbkxlbmd0aHMgPSBNYXRoLm1pbiggd2VpZ2h0cy5sZW5ndGgsIGRpc3RhbmNlcy5sZW5ndGggKTtcclxuICAgIGlmKGFuY2hvckluZGV4Pj1taW5MZW5ndGhzLTEpe1xyXG4gICAgICByZXR1cm4gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRUb0FuY2hvckFic29sdXRlUG9zaXRpb25zKGVkZ2UsdHlwZSxhbmNob3JJbmRleCsxKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbjogZnVuY3Rpb24gKGVkZ2UsIHBvaW50LCBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cykge1xyXG4gICAgaWYgKHNyY1RndFBvaW50c0FuZFRhbmdlbnRzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMgPSB0aGlzLmdldFNyY1RndFBvaW50c0FuZFRhbmdlbnRzKGVkZ2UpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgaW50ZXJzZWN0aW9uUG9pbnQgPSB0aGlzLmdldEludGVyc2VjdGlvbihlZGdlLCBwb2ludCwgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMpO1xyXG4gICAgdmFyIGludGVyc2VjdFggPSBpbnRlcnNlY3Rpb25Qb2ludC54O1xyXG4gICAgdmFyIGludGVyc2VjdFkgPSBpbnRlcnNlY3Rpb25Qb2ludC55O1xyXG4gICAgXHJcbiAgICB2YXIgc3JjUG9pbnQgPSBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cy5zcmNQb2ludDtcclxuICAgIHZhciB0Z3RQb2ludCA9IHNyY1RndFBvaW50c0FuZFRhbmdlbnRzLnRndFBvaW50O1xyXG4gICAgXHJcbiAgICB2YXIgd2VpZ2h0O1xyXG4gICAgXHJcbiAgICBpZiggaW50ZXJzZWN0WCAhPSBzcmNQb2ludC54ICkge1xyXG4gICAgICB3ZWlnaHQgPSAoaW50ZXJzZWN0WCAtIHNyY1BvaW50LngpIC8gKHRndFBvaW50LnggLSBzcmNQb2ludC54KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYoIGludGVyc2VjdFkgIT0gc3JjUG9pbnQueSApIHtcclxuICAgICAgd2VpZ2h0ID0gKGludGVyc2VjdFkgLSBzcmNQb2ludC55KSAvICh0Z3RQb2ludC55IC0gc3JjUG9pbnQueSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgd2VpZ2h0ID0gMDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIGRpc3RhbmNlID0gTWF0aC5zcXJ0KE1hdGgucG93KChpbnRlcnNlY3RZIC0gcG9pbnQueSksIDIpXHJcbiAgICAgICAgKyBNYXRoLnBvdygoaW50ZXJzZWN0WCAtIHBvaW50LngpLCAyKSk7XHJcbiAgICBcclxuICAgIC8vR2V0IHRoZSBkaXJlY3Rpb24gb2YgdGhlIGxpbmUgZm9ybSBzb3VyY2UgcG9pbnQgdG8gdGFyZ2V0IHBvaW50XHJcbiAgICB2YXIgZGlyZWN0aW9uMSA9IHRoaXMuZ2V0TGluZURpcmVjdGlvbihzcmNQb2ludCwgdGd0UG9pbnQpO1xyXG4gICAgLy9HZXQgdGhlIGRpcmVjdGlvbiBvZiB0aGUgbGluZSBmcm9tIGludGVzZWN0aW9uIHBvaW50IHRvIHRoZSBwb2ludFxyXG4gICAgdmFyIGRpcmVjdGlvbjIgPSB0aGlzLmdldExpbmVEaXJlY3Rpb24oaW50ZXJzZWN0aW9uUG9pbnQsIHBvaW50KTtcclxuICAgIFxyXG4gICAgLy9JZiB0aGUgZGlmZmVyZW5jZSBpcyBub3QgLTIgYW5kIG5vdCA2IHRoZW4gdGhlIGRpcmVjdGlvbiBvZiB0aGUgZGlzdGFuY2UgaXMgbmVnYXRpdmVcclxuICAgIGlmKGRpcmVjdGlvbjEgLSBkaXJlY3Rpb24yICE9IC0yICYmIGRpcmVjdGlvbjEgLSBkaXJlY3Rpb24yICE9IDYpe1xyXG4gICAgICBpZihkaXN0YW5jZSAhPSAwKVxyXG4gICAgICAgIGRpc3RhbmNlID0gLTEgKiBkaXN0YW5jZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgd2VpZ2h0OiB3ZWlnaHQsXHJcbiAgICAgIGRpc3RhbmNlOiBkaXN0YW5jZVxyXG4gICAgfTtcclxuICB9LFxyXG4gIGNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb25zOiBmdW5jdGlvbiAoZWRnZSwgYW5jaG9yUG9pbnRzKSB7XHJcbiAgICB2YXIgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMgPSB0aGlzLmdldFNyY1RndFBvaW50c0FuZFRhbmdlbnRzKGVkZ2UpO1xyXG5cclxuICAgIHZhciB3ZWlnaHRzID0gW107XHJcbiAgICB2YXIgZGlzdGFuY2VzID0gW107XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGFuY2hvclBvaW50cyAmJiBpIDwgYW5jaG9yUG9pbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBhbmNob3IgPSBhbmNob3JQb2ludHNbaV07XHJcbiAgICAgIHZhciByZWxhdGl2ZUFuY2hvclBvc2l0aW9uID0gdGhpcy5jb252ZXJ0VG9SZWxhdGl2ZVBvc2l0aW9uKGVkZ2UsIGFuY2hvciwgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMpO1xyXG5cclxuICAgICAgd2VpZ2h0cy5wdXNoKHJlbGF0aXZlQW5jaG9yUG9zaXRpb24ud2VpZ2h0KTtcclxuICAgICAgZGlzdGFuY2VzLnB1c2gocmVsYXRpdmVBbmNob3JQb3NpdGlvbi5kaXN0YW5jZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgd2VpZ2h0czogd2VpZ2h0cyxcclxuICAgICAgZGlzdGFuY2VzOiBkaXN0YW5jZXNcclxuICAgIH07XHJcbiAgfSxcclxuICBnZXREaXN0YW5jZXNTdHJpbmc6IGZ1bmN0aW9uIChlZGdlLCB0eXBlKSB7XHJcbiAgICB2YXIgc3RyID0gXCJcIjtcclxuXHJcbiAgICB2YXIgZGlzdGFuY2VzID0gZWRnZS5kYXRhKHRoaXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBkaXN0YW5jZXMgJiYgaSA8IGRpc3RhbmNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBzdHIgPSBzdHIgKyBcIiBcIiArIGRpc3RhbmNlc1tpXTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHN0cjtcclxuICB9LFxyXG4gIGdldFdlaWdodHNTdHJpbmc6IGZ1bmN0aW9uIChlZGdlLCB0eXBlKSB7XHJcbiAgICB2YXIgc3RyID0gXCJcIjtcclxuXHJcbiAgICB2YXIgd2VpZ2h0cyA9IGVkZ2UuZGF0YSh0aGlzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10pO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IHdlaWdodHMgJiYgaSA8IHdlaWdodHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgc3RyID0gc3RyICsgXCIgXCIgKyB3ZWlnaHRzW2ldO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gc3RyO1xyXG4gIH0sXHJcbiAgYWRkQW5jaG9yUG9pbnQ6IGZ1bmN0aW9uKGVkZ2UsIG5ld0FuY2hvclBvaW50LCB0eXBlID0gdW5kZWZpbmVkKSB7XHJcbiAgICBpZihlZGdlID09PSB1bmRlZmluZWQgfHwgbmV3QW5jaG9yUG9pbnQgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgIGVkZ2UgPSB0aGlzLmN1cnJlbnRDdHhFZGdlO1xyXG4gICAgICBuZXdBbmNob3JQb2ludCA9IHRoaXMuY3VycmVudEN0eFBvcztcclxuICAgIH1cclxuICBcclxuICAgIGlmKHR5cGUgPT09IHVuZGVmaW5lZClcclxuICAgICAgdHlwZSA9IHRoaXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgdmFyIHdlaWdodFN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXTtcclxuICAgIHZhciBkaXN0YW5jZVN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddO1xyXG5cclxuICAgIHZhciByZWxhdGl2ZVBvc2l0aW9uID0gdGhpcy5jb252ZXJ0VG9SZWxhdGl2ZVBvc2l0aW9uKGVkZ2UsIG5ld0FuY2hvclBvaW50KTtcclxuICAgIHZhciBvcmlnaW5hbEFuY2hvcldlaWdodCA9IHJlbGF0aXZlUG9zaXRpb24ud2VpZ2h0O1xyXG4gICAgXHJcbiAgICB2YXIgc3RhcnRYID0gZWRnZS5zb3VyY2UoKS5wb3NpdGlvbigneCcpO1xyXG4gICAgdmFyIHN0YXJ0WSA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oJ3knKTtcclxuICAgIHZhciBlbmRYID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigneCcpO1xyXG4gICAgdmFyIGVuZFkgPSBlZGdlLnRhcmdldCgpLnBvc2l0aW9uKCd5Jyk7XHJcbiAgICB2YXIgc3RhcnRXZWlnaHQgPSB0aGlzLmNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb24oZWRnZSwge3g6IHN0YXJ0WCwgeTogc3RhcnRZfSkud2VpZ2h0O1xyXG4gICAgdmFyIGVuZFdlaWdodCA9IHRoaXMuY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbihlZGdlLCB7eDogZW5kWCwgeTogZW5kWX0pLndlaWdodDtcclxuICAgIHZhciB3ZWlnaHRzV2l0aFRndFNyYyA9IFtzdGFydFdlaWdodF0uY29uY2F0KGVkZ2UuZGF0YSh3ZWlnaHRTdHIpP2VkZ2UuZGF0YSh3ZWlnaHRTdHIpOltdKS5jb25jYXQoW2VuZFdlaWdodF0pO1xyXG4gICAgXHJcbiAgICB2YXIgYW5jaG9yc0xpc3QgPSB0aGlzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpO1xyXG4gICAgXHJcbiAgICB2YXIgbWluRGlzdCA9IEluZmluaXR5O1xyXG4gICAgdmFyIGludGVyc2VjdGlvbjtcclxuICAgIHZhciBwdHNXaXRoVGd0U3JjID0gW3N0YXJ0WCwgc3RhcnRZXVxyXG4gICAgICAgICAgICAuY29uY2F0KGFuY2hvcnNMaXN0P2FuY2hvcnNMaXN0OltdKVxyXG4gICAgICAgICAgICAuY29uY2F0KFtlbmRYLCBlbmRZXSk7XHJcbiAgICB2YXIgbmV3QW5jaG9ySW5kZXggPSAtMTtcclxuICAgIFxyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHdlaWdodHNXaXRoVGd0U3JjLmxlbmd0aCAtIDE7IGkrKyl7XHJcbiAgICAgIHZhciB3MSA9IHdlaWdodHNXaXRoVGd0U3JjW2ldO1xyXG4gICAgICB2YXIgdzIgPSB3ZWlnaHRzV2l0aFRndFNyY1tpICsgMV07XHJcbiAgICAgIFxyXG4gICAgICAvL2NoZWNrIGlmIHRoZSB3ZWlnaHQgaXMgYmV0d2VlbiB3MSBhbmQgdzJcclxuICAgICAgY29uc3QgYjEgPSB0aGlzLmNvbXBhcmVXaXRoUHJlY2lzaW9uKG9yaWdpbmFsQW5jaG9yV2VpZ2h0LCB3MSwgdHJ1ZSk7XHJcbiAgICAgIGNvbnN0IGIyID0gdGhpcy5jb21wYXJlV2l0aFByZWNpc2lvbihvcmlnaW5hbEFuY2hvcldlaWdodCwgdzIpO1xyXG4gICAgICBjb25zdCBiMyA9IHRoaXMuY29tcGFyZVdpdGhQcmVjaXNpb24ob3JpZ2luYWxBbmNob3JXZWlnaHQsIHcyLCB0cnVlKTtcclxuICAgICAgY29uc3QgYjQgPSB0aGlzLmNvbXBhcmVXaXRoUHJlY2lzaW9uKG9yaWdpbmFsQW5jaG9yV2VpZ2h0LCB3MSk7XHJcbiAgICAgIGlmKCAoYjEgJiYgYjIpIHx8IChiMyAmJiBiNCkpe1xyXG4gICAgICAgIHZhciBzdGFydFggPSBwdHNXaXRoVGd0U3JjWzIgKiBpXTtcclxuICAgICAgICB2YXIgc3RhcnRZID0gcHRzV2l0aFRndFNyY1syICogaSArIDFdO1xyXG4gICAgICAgIHZhciBlbmRYID0gcHRzV2l0aFRndFNyY1syICogaSArIDJdO1xyXG4gICAgICAgIHZhciBlbmRZID0gcHRzV2l0aFRndFNyY1syICogaSArIDNdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdGFydCA9IHtcclxuICAgICAgICAgIHg6IHN0YXJ0WCxcclxuICAgICAgICAgIHk6IHN0YXJ0WVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGVuZCA9IHtcclxuICAgICAgICAgIHg6IGVuZFgsXHJcbiAgICAgICAgICB5OiBlbmRZXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgbTEgPSAoIHN0YXJ0WSAtIGVuZFkgKSAvICggc3RhcnRYIC0gZW5kWCApO1xyXG4gICAgICAgIHZhciBtMiA9IC0xIC8gbTE7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzID0ge1xyXG4gICAgICAgICAgc3JjUG9pbnQ6IHN0YXJ0LFxyXG4gICAgICAgICAgdGd0UG9pbnQ6IGVuZCxcclxuICAgICAgICAgIG0xOiBtMSxcclxuICAgICAgICAgIG0yOiBtMlxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGN1cnJlbnRJbnRlcnNlY3Rpb24gPSB0aGlzLmdldEludGVyc2VjdGlvbihlZGdlLCBuZXdBbmNob3JQb2ludCwgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMpO1xyXG4gICAgICAgIHZhciBkaXN0ID0gTWF0aC5zcXJ0KCBNYXRoLnBvdyggKG5ld0FuY2hvclBvaW50LnggLSBjdXJyZW50SW50ZXJzZWN0aW9uLngpLCAyICkgXHJcbiAgICAgICAgICAgICAgICArIE1hdGgucG93KCAobmV3QW5jaG9yUG9pbnQueSAtIGN1cnJlbnRJbnRlcnNlY3Rpb24ueSksIDIgKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9VcGRhdGUgdGhlIG1pbmltdW0gZGlzdGFuY2VcclxuICAgICAgICBpZihkaXN0IDwgbWluRGlzdCl7XHJcbiAgICAgICAgICBtaW5EaXN0ID0gZGlzdDtcclxuICAgICAgICAgIGludGVyc2VjdGlvbiA9IGN1cnJlbnRJbnRlcnNlY3Rpb247XHJcbiAgICAgICAgICBuZXdBbmNob3JJbmRleCA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmKGludGVyc2VjdGlvbiAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgbmV3QW5jaG9yUG9pbnQgPSBpbnRlcnNlY3Rpb247XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlbGF0aXZlUG9zaXRpb24gPSB0aGlzLmNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb24oZWRnZSwgbmV3QW5jaG9yUG9pbnQpO1xyXG4gICAgXHJcbiAgICBpZihpbnRlcnNlY3Rpb24gPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgIHJlbGF0aXZlUG9zaXRpb24uZGlzdGFuY2UgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB3ZWlnaHRzID0gZWRnZS5kYXRhKHdlaWdodFN0cik7XHJcbiAgICB2YXIgZGlzdGFuY2VzID0gZWRnZS5kYXRhKGRpc3RhbmNlU3RyKTtcclxuICAgIFxyXG4gICAgd2VpZ2h0cyA9IHdlaWdodHM/d2VpZ2h0czpbXTtcclxuICAgIGRpc3RhbmNlcyA9IGRpc3RhbmNlcz9kaXN0YW5jZXM6W107XHJcbiAgICBcclxuICAgIGlmKHdlaWdodHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIG5ld0FuY2hvckluZGV4ID0gMDtcclxuICAgIH1cclxuICAgIFxyXG4vLyAgICB3ZWlnaHRzLnB1c2gocmVsYXRpdmVCZW5kUG9zaXRpb24ud2VpZ2h0KTtcclxuLy8gICAgZGlzdGFuY2VzLnB1c2gocmVsYXRpdmVCZW5kUG9zaXRpb24uZGlzdGFuY2UpO1xyXG4gICAgaWYobmV3QW5jaG9ySW5kZXggIT0gLTEpe1xyXG4gICAgICB3ZWlnaHRzLnNwbGljZShuZXdBbmNob3JJbmRleCwgMCwgcmVsYXRpdmVQb3NpdGlvbi53ZWlnaHQpO1xyXG4gICAgICBkaXN0YW5jZXMuc3BsaWNlKG5ld0FuY2hvckluZGV4LCAwLCByZWxhdGl2ZVBvc2l0aW9uLmRpc3RhbmNlKTtcclxuICAgIH1cclxuICAgXHJcbiAgICBlZGdlLmRhdGEod2VpZ2h0U3RyLCB3ZWlnaHRzKTtcclxuICAgIGVkZ2UuZGF0YShkaXN0YW5jZVN0ciwgZGlzdGFuY2VzKTtcclxuICAgIFxyXG4gICAgZWRnZS5hZGRDbGFzcyh0aGlzLnN5bnRheFt0eXBlXVsnY2xhc3MnXSk7XHJcbiAgICBpZiAod2VpZ2h0cy5sZW5ndGggPiAxIHx8IGRpc3RhbmNlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIGVkZ2UuYWRkQ2xhc3ModGhpcy5zeW50YXhbdHlwZV1bJ211bHRpQ2xhc3MnXSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBuZXdBbmNob3JJbmRleDtcclxuICB9LFxyXG4gIHJlbW92ZUFuY2hvcjogZnVuY3Rpb24oZWRnZSwgYW5jaG9ySW5kZXgpe1xyXG4gICAgaWYoZWRnZSA9PT0gdW5kZWZpbmVkIHx8IGFuY2hvckluZGV4ID09PSB1bmRlZmluZWQpe1xyXG4gICAgICBlZGdlID0gdGhpcy5jdXJyZW50Q3R4RWRnZTtcclxuICAgICAgYW5jaG9ySW5kZXggPSB0aGlzLmN1cnJlbnRBbmNob3JJbmRleDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIHR5cGUgPSB0aGlzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgIGlmKHRoaXMuZWRnZVR5cGVJbmNvbmNsdXNpdmVTaG91bGRudEhhcHBlbih0eXBlLCBcImFuY2hvclBvaW50VXRpbGl0aWVzLmpzLCByZW1vdmVBbmNob3JcIikpe1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGRpc3RhbmNlU3RyID0gdGhpcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddO1xyXG4gICAgdmFyIHdlaWdodFN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddO1xyXG4gICAgdmFyIHBvc2l0aW9uRGF0YVN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWydwb2ludFBvcyddO1xyXG5cclxuICAgIHZhciBkaXN0YW5jZXMgPSBlZGdlLmRhdGEoZGlzdGFuY2VTdHIpO1xyXG4gICAgdmFyIHdlaWdodHMgPSBlZGdlLmRhdGEod2VpZ2h0U3RyKTtcclxuICAgIHZhciBwb3NpdGlvbnMgPSBlZGdlLmRhdGEocG9zaXRpb25EYXRhU3RyKTtcclxuXHJcbiAgICBkaXN0YW5jZXMuc3BsaWNlKGFuY2hvckluZGV4LCAxKTtcclxuICAgIHdlaWdodHMuc3BsaWNlKGFuY2hvckluZGV4LCAxKTtcclxuICAgIC8vIHBvc2l0aW9uIGRhdGEgaXMgbm90IGdpdmVuIGluIGRlbW8gc28gaXQgdGhyb3dzIGVycm9yIGhlcmVcclxuICAgIC8vIGJ1dCBpdCBzaG91bGQgYmUgZnJvbSB0aGUgYmVnaW5uaW5nXHJcbiAgICBpZiAocG9zaXRpb25zKVxyXG4gICAgICBwb3NpdGlvbnMuc3BsaWNlKGFuY2hvckluZGV4LCAxKTtcclxuXHJcbiAgICAvLyBvbmx5IG9uZSBhbmNob3IgcG9pbnQgbGVmdCBvbiBlZGdlXHJcbiAgICBpZiAoZGlzdGFuY2VzLmxlbmd0aCA9PSAxIHx8IHdlaWdodHMubGVuZ3RoID09IDEpIHtcclxuICAgICAgZWRnZS5yZW1vdmVDbGFzcyh0aGlzLnN5bnRheFt0eXBlXVsnbXVsdGlDbGFzcyddKVxyXG4gICAgfVxyXG4gICAgLy8gbm8gbW9yZSBhbmNob3IgcG9pbnRzIG9uIGVkZ2VcclxuICAgIGVsc2UgaWYoZGlzdGFuY2VzLmxlbmd0aCA9PSAwIHx8IHdlaWdodHMubGVuZ3RoID09IDApe1xyXG4gICAgICBlZGdlLnJlbW92ZUNsYXNzKHRoaXMuc3ludGF4W3R5cGVdWydjbGFzcyddKTtcclxuICAgICAgZWRnZS5kYXRhKGRpc3RhbmNlU3RyLCBbXSk7XHJcbiAgICAgIGVkZ2UuZGF0YSh3ZWlnaHRTdHIsIFtdKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBlZGdlLmRhdGEoZGlzdGFuY2VTdHIsIGRpc3RhbmNlcyk7XHJcbiAgICAgIGVkZ2UuZGF0YSh3ZWlnaHRTdHIsIHdlaWdodHMpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgcmVtb3ZlQWxsQW5jaG9yczogZnVuY3Rpb24oZWRnZSkge1xyXG4gICAgaWYgKGVkZ2UgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBlZGdlID0gdGhpcy5jdXJyZW50Q3R4RWRnZTtcclxuICAgIH1cclxuICAgIHZhciB0eXBlID0gdGhpcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgIFxyXG4gICAgaWYodGhpcy5lZGdlVHlwZUluY29uY2x1c2l2ZVNob3VsZG50SGFwcGVuKHR5cGUsIFwiYW5jaG9yUG9pbnRVdGlsaXRpZXMuanMsIHJlbW92ZUFsbEFuY2hvcnNcIikpe1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIGNsYXNzZXMgZnJvbSBlZGdlXHJcbiAgICBlZGdlLnJlbW92ZUNsYXNzKHRoaXMuc3ludGF4W3R5cGVdWydjbGFzcyddKTtcclxuICAgIGVkZ2UucmVtb3ZlQ2xhc3ModGhpcy5zeW50YXhbdHlwZV1bJ211bHRpQ2xhc3MnXSk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIGFsbCBhbmNob3IgcG9pbnQgZGF0YSBmcm9tIGVkZ2VcclxuICAgIHZhciBkaXN0YW5jZVN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXTtcclxuICAgIHZhciB3ZWlnaHRTdHIgPSB0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXTtcclxuICAgIHZhciBwb3NpdGlvbkRhdGFTdHIgPSB0aGlzLnN5bnRheFt0eXBlXVsncG9pbnRQb3MnXTtcclxuICAgIGVkZ2UuZGF0YShkaXN0YW5jZVN0ciwgW10pO1xyXG4gICAgZWRnZS5kYXRhKHdlaWdodFN0ciwgW10pO1xyXG4gICAgLy8gcG9zaXRpb24gZGF0YSBpcyBub3QgZ2l2ZW4gaW4gZGVtbyBzbyBpdCB0aHJvd3MgZXJyb3IgaGVyZVxyXG4gICAgLy8gYnV0IGl0IHNob3VsZCBiZSBmcm9tIHRoZSBiZWdpbm5pbmdcclxuICAgIGlmIChlZGdlLmRhdGEocG9zaXRpb25EYXRhU3RyKSkge1xyXG4gICAgICBlZGdlLmRhdGEocG9zaXRpb25EYXRhU3RyLCBbXSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICBjYWxjdWxhdGVEaXN0YW5jZTogZnVuY3Rpb24ocHQxLCBwdDIpIHtcclxuICAgIHZhciBkaWZmWCA9IHB0MS54IC0gcHQyLng7XHJcbiAgICB2YXIgZGlmZlkgPSBwdDEueSAtIHB0Mi55O1xyXG4gICAgXHJcbiAgICB2YXIgZGlzdCA9IE1hdGguc3FydCggTWF0aC5wb3coIGRpZmZYLCAyICkgKyBNYXRoLnBvdyggZGlmZlksIDIgKSApO1xyXG4gICAgcmV0dXJuIGRpc3Q7XHJcbiAgfSxcclxuICAvKiogKExlc3MgdGhhbiBvciBlcXVhbCB0bykgYW5kIChncmVhdGVyIHRoZW4gZXF1YWwgdG8pIGNvbXBhcmlzb25zIHdpdGggZmxvYXRpbmcgcG9pbnQgbnVtYmVycyAqL1xyXG4gIGNvbXBhcmVXaXRoUHJlY2lzaW9uOiBmdW5jdGlvbiAobjEsIG4yLCBpc0xlc3NUaGVuT3JFcXVhbCA9IGZhbHNlLCBwcmVjaXNpb24gPSAwLjAxKSB7XHJcbiAgICBjb25zdCBkaWZmID0gbjEgLSBuMjtcclxuICAgIGlmIChNYXRoLmFicyhkaWZmKSA8PSBwcmVjaXNpb24pIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAoaXNMZXNzVGhlbk9yRXF1YWwpIHtcclxuICAgICAgcmV0dXJuIG4xIDwgbjI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbjEgPiBuMjtcclxuICAgIH1cclxuICB9LFxyXG4gIGVkZ2VUeXBlSW5jb25jbHVzaXZlU2hvdWxkbnRIYXBwZW46IGZ1bmN0aW9uKHR5cGUsIHBsYWNlKXtcclxuICAgIGlmKHR5cGUgPT09ICdpbmNvbmNsdXNpdmUnKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBJbiAke3BsYWNlfTogZWRnZSB0eXBlIGluY29uY2x1c2l2ZSBzaG91bGQgbmV2ZXIgaGFwcGVuIGhlcmUhIWApO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFuY2hvclBvaW50VXRpbGl0aWVzO1xyXG4iLCJ2YXIgZGVib3VuY2UgPSByZXF1aXJlKCcuL2RlYm91bmNlJyk7XHJcbnZhciBhbmNob3JQb2ludFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vQW5jaG9yUG9pbnRVdGlsaXRpZXMnKTtcclxudmFyIHJlY29ubmVjdGlvblV0aWxpdGllcyA9IHJlcXVpcmUoJy4vcmVjb25uZWN0aW9uVXRpbGl0aWVzJyk7XHJcbnZhciByZWdpc3RlclVuZG9SZWRvRnVuY3Rpb25zID0gcmVxdWlyZSgnLi9yZWdpc3RlclVuZG9SZWRvRnVuY3Rpb25zJyk7XHJcbnZhciBzdGFnZUlkID0gMDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBhcmFtcywgY3kpIHtcclxuICB2YXIgZm4gPSBwYXJhbXM7XHJcblxyXG4gIHZhciBhZGRCZW5kUG9pbnRDeHRNZW51SWQgPSAnY3ktZWRnZS1iZW5kLWVkaXRpbmctY3h0LWFkZC1iZW5kLXBvaW50JyArIHN0YWdlSWQ7XHJcbiAgdmFyIHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCA9ICdjeS1lZGdlLWJlbmQtZWRpdGluZy1jeHQtcmVtb3ZlLWJlbmQtcG9pbnQnICsgc3RhZ2VJZDtcclxuICB2YXIgcmVtb3ZlQWxsQmVuZFBvaW50Q3R4TWVudUlkID0gJ2N5LWVkZ2UtYmVuZC1lZGl0aW5nLWN4dC1yZW1vdmUtbXVsdGlwbGUtYmVuZC1wb2ludCcgKyBzdGFnZUlkO1xyXG4gIHZhciBhZGRDb250cm9sUG9pbnRDeHRNZW51SWQgPSAnY3ktZWRnZS1jb250cm9sLWVkaXRpbmctY3h0LWFkZC1jb250cm9sLXBvaW50JyArIHN0YWdlSWQ7XHJcbiAgdmFyIHJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCA9ICdjeS1lZGdlLWNvbnRyb2wtZWRpdGluZy1jeHQtcmVtb3ZlLWNvbnRyb2wtcG9pbnQnICsgc3RhZ2VJZDtcclxuICB2YXIgcmVtb3ZlQWxsQ29udHJvbFBvaW50Q3R4TWVudUlkID0gJ2N5LWVkZ2UtYmVuZC1lZGl0aW5nLWN4dC1yZW1vdmUtbXVsdGlwbGUtY29udHJvbC1wb2ludCcgKyBzdGFnZUlkO1xyXG4gIHZhciBlU3R5bGUsIGVSZW1vdmUsIGVBZGQsIGVab29tLCBlU2VsZWN0LCBlVW5zZWxlY3QsIGVUYXBTdGFydCwgZVRhcFN0YXJ0T25FZGdlLCBlVGFwRHJhZywgZVRhcEVuZCwgZUN4dFRhcCwgZURyYWc7XHJcbiAgLy8gbGFzdCBzdGF0dXMgb2YgZ2VzdHVyZXNcclxuICB2YXIgbGFzdFBhbm5pbmdFbmFibGVkLCBsYXN0Wm9vbWluZ0VuYWJsZWQsIGxhc3RCb3hTZWxlY3Rpb25FbmFibGVkO1xyXG4gIHZhciBsYXN0QWN0aXZlQmdPcGFjaXR5O1xyXG4gIC8vIHN0YXR1cyBvZiBlZGdlIHRvIGhpZ2hsaWdodCBiZW5kcyBhbmQgc2VsZWN0ZWQgZWRnZXNcclxuICB2YXIgZWRnZVRvSGlnaGxpZ2h0LCBudW1iZXJPZlNlbGVjdGVkRWRnZXM7XHJcblxyXG4gIC8vIHRoZSBLYW52YS5zaGFwZSgpIGZvciB0aGUgZW5kcG9pbnRzXHJcbiAgdmFyIGVuZHBvaW50U2hhcGUxID0gbnVsbCwgZW5kcG9pbnRTaGFwZTIgPSBudWxsO1xyXG4gIC8vIHVzZWQgdG8gc3RvcCBjZXJ0YWluIGN5IGxpc3RlbmVycyB3aGVuIGludGVycmFjdGluZyB3aXRoIGFuY2hvcnNcclxuICB2YXIgYW5jaG9yVG91Y2hlZCA9IGZhbHNlO1xyXG4gIC8vIHVzZWQgY2FsbCBlTW91c2VEb3duIG9mIGFuY2hvck1hbmFnZXIgaWYgdGhlIG1vdXNlIGlzIG91dCBvZiB0aGUgY29udGVudCBvbiBjeS5vbih0YXBlbmQpXHJcbiAgdmFyIG1vdXNlT3V0O1xyXG4gIFxyXG4gIHZhciBmdW5jdGlvbnMgPSB7XHJcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vIHJlZ2lzdGVyIHVuZG8gcmVkbyBmdW5jdGlvbnNcclxuICAgICAgcmVnaXN0ZXJVbmRvUmVkb0Z1bmN0aW9ucyhjeSwgYW5jaG9yUG9pbnRVdGlsaXRpZXMsIHBhcmFtcyk7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgIHZhciBvcHRzID0gcGFyYW1zO1xyXG5cclxuICAgICAgLypcclxuICAgICAgICBNYWtlIHN1cmUgd2UgZG9uJ3QgYXBwZW5kIGFuIGVsZW1lbnQgdGhhdCBhbHJlYWR5IGV4aXN0cy5cclxuICAgICAgICBUaGlzIGV4dGVuc2lvbiBjYW52YXMgdXNlcyB0aGUgc2FtZSBodG1sIGVsZW1lbnQgYXMgZWRnZS1lZGl0aW5nLlxyXG4gICAgICAgIEl0IG1ha2VzIHNlbnNlIHNpbmNlIGl0IGFsc28gdXNlcyB0aGUgc2FtZSBLb252YSBzdGFnZS5cclxuICAgICAgICBXaXRob3V0IHRoZSBiZWxvdyBsb2dpYywgYW4gZW1wdHkgY2FudmFzRWxlbWVudCB3b3VsZCBiZSBjcmVhdGVkXHJcbiAgICAgICAgZm9yIG9uZSBvZiB0aGVzZSBleHRlbnNpb25zIGZvciBubyByZWFzb24uXHJcbiAgICAgICovXHJcbiAgICAgIHZhciAkY29udGFpbmVyID0gJCh0aGlzKTtcclxuICAgICAgdmFyIGNhbnZhc0VsZW1lbnRJZCA9ICdjeS1ub2RlLWVkZ2UtZWRpdGluZy1zdGFnZScgKyBzdGFnZUlkO1xyXG4gICAgICBzdGFnZUlkKys7XHJcbiAgICAgIHZhciAkY2FudmFzRWxlbWVudCA9ICQoJzxkaXYgaWQ9XCInICsgY2FudmFzRWxlbWVudElkICsgJ1wiPjwvZGl2PicpO1xyXG5cclxuICAgICAgaWYgKCRjb250YWluZXIuZmluZCgnIycgKyBjYW52YXNFbGVtZW50SWQpLmxlbmd0aCA8IDEpIHtcclxuICAgICAgICAkY29udGFpbmVyLmFwcGVuZCgkY2FudmFzRWxlbWVudCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qIFxyXG4gICAgICAgIE1haW50YWluIGEgc2luZ2xlIEtvbnZhLnN0YWdlIG9iamVjdCB0aHJvdWdob3V0IHRoZSBhcHBsaWNhdGlvbiB0aGF0IHVzZXMgdGhpcyBleHRlbnNpb25cclxuICAgICAgICBzdWNoIGFzIE5ld3QuIFRoaXMgaXMgaW1wb3J0YW50IHNpbmNlIGhhdmluZyBkaWZmZXJlbnQgc3RhZ2VzIGNhdXNlcyB3ZWlyZCBiZWhhdmlvclxyXG4gICAgICAgIG9uIG90aGVyIGV4dGVuc2lvbnMgdGhhdCBhbHNvIHVzZSBLb252YSwgbGlrZSBub3QgbGlzdGVuaW5nIHRvIG1vdXNlIGNsaWNrcyBhbmQgc3VjaC5cclxuICAgICAgICBJZiB5b3UgYXJlIHNvbWVvbmUgdGhhdCBpcyBjcmVhdGluZyBhbiBleHRlbnNpb24gdGhhdCB1c2VzIEtvbnZhIGluIHRoZSBmdXR1cmUsIHlvdSBuZWVkIHRvXHJcbiAgICAgICAgYmUgY2FyZWZ1bCBhYm91dCBob3cgZXZlbnRzIHJlZ2lzdGVyLiBJZiB5b3UgdXNlIGEgZGlmZmVyZW50IHN0YWdlIGFsbW9zdCBjZXJ0YWlubHkgb25lXHJcbiAgICAgICAgb3IgYm90aCBvZiB0aGUgZXh0ZW5zaW9ucyB0aGF0IHVzZSB0aGUgc3RhZ2UgY3JlYXRlZCBiZWxvdyB3aWxsIGJyZWFrLlxyXG4gICAgICAqLyBcclxuICAgICAgdmFyIHN0YWdlO1xyXG4gICAgICBpZiAoS29udmEuc3RhZ2VzLmxlbmd0aCA8IHN0YWdlSWQpIHtcclxuICAgICAgICBzdGFnZSA9IG5ldyBLb252YS5TdGFnZSh7XHJcbiAgICAgICAgICBpZDogJ25vZGUtZWRnZS1lZGl0aW5nLXN0YWdlJyxcclxuICAgICAgICAgIGNvbnRhaW5lcjogY2FudmFzRWxlbWVudElkLCAgIC8vIGlkIG9mIGNvbnRhaW5lciA8ZGl2PlxyXG4gICAgICAgICAgd2lkdGg6ICRjb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgIGhlaWdodDogJGNvbnRhaW5lci5oZWlnaHQoKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHN0YWdlID0gS29udmEuc3RhZ2VzW3N0YWdlSWQgLSAxXTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgdmFyIGNhbnZhcztcclxuICAgICAgaWYgKHN0YWdlLmdldENoaWxkcmVuKCkubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgIGNhbnZhcyA9IG5ldyBLb252YS5MYXllcigpO1xyXG4gICAgICAgIHN0YWdlLmFkZChjYW52YXMpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGNhbnZhcyA9IHN0YWdlLmdldENoaWxkcmVuKClbMF07XHJcbiAgICAgIH0gIFxyXG4gICAgICBcclxuICAgICAgdmFyIGFuY2hvck1hbmFnZXIgPSB7XHJcbiAgICAgICAgZWRnZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIGVkZ2VUeXBlOiAnaW5jb25jbHVzaXZlJyxcclxuICAgICAgICBhbmNob3JzOiBbXSxcclxuICAgICAgICAvLyByZW1lbWJlcnMgdGhlIHRvdWNoZWQgYW5jaG9yIHRvIGF2b2lkIGNsZWFyaW5nIGl0IHdoZW4gZHJhZ2dpbmcgaGFwcGVuc1xyXG4gICAgICAgIHRvdWNoZWRBbmNob3I6IHVuZGVmaW5lZCxcclxuICAgICAgICAvLyByZW1lbWJlcnMgdGhlIGluZGV4IG9mIHRoZSBtb3ZpbmcgYW5jaG9yXHJcbiAgICAgICAgdG91Y2hlZEFuY2hvckluZGV4OiB1bmRlZmluZWQsXHJcbiAgICAgICAgYmluZExpc3RlbmVyczogZnVuY3Rpb24oYW5jaG9yKXtcclxuICAgICAgICAgIGFuY2hvci5vbihcIm1vdXNlZG93biB0b3VjaHN0YXJ0XCIsIHRoaXMuZU1vdXNlRG93bik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1bmJpbmRMaXN0ZW5lcnM6IGZ1bmN0aW9uKGFuY2hvcil7XHJcbiAgICAgICAgICBhbmNob3Iub2ZmKFwibW91c2Vkb3duIHRvdWNoc3RhcnRcIiwgdGhpcy5lTW91c2VEb3duKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIGdldHMgdHJpZ2dlciBvbiBjbGlja2luZyBvbiBjb250ZXh0IG1lbnVzLCB3aGlsZSBjeSBsaXN0ZW5lcnMgZG9uJ3QgZ2V0IHRyaWdnZXJlZFxyXG4gICAgICAgIC8vIGl0IGNhbiBjYXVzZSB3ZWlyZCBiZWhhdmlvdXIgaWYgbm90IGF3YXJlIG9mIHRoaXNcclxuICAgICAgICBlTW91c2VEb3duOiBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICAvLyBhbmNob3JNYW5hZ2VyLmVkZ2UudW5zZWxlY3QoKSB3b24ndCB3b3JrIHNvbWV0aW1lcyBpZiB0aGlzIHdhc24ndCBoZXJlXHJcbiAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG5cclxuICAgICAgICAgIC8vIGVNb3VzZURvd24oc2V0KSAtPiB0YXBkcmFnKHVzZWQpIC0+IGVNb3VzZVVwKHJlc2V0KVxyXG4gICAgICAgICAgYW5jaG9yVG91Y2hlZCA9IHRydWU7XHJcbiAgICAgICAgICBhbmNob3JNYW5hZ2VyLnRvdWNoZWRBbmNob3IgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICBtb3VzZU91dCA9IGZhbHNlO1xyXG4gICAgICAgICAgYW5jaG9yTWFuYWdlci5lZGdlLnVuc2VsZWN0KCk7XHJcblxyXG4gICAgICAgICAgLy8gcmVtZW1iZXIgc3RhdGUgYmVmb3JlIGNoYW5naW5nXHJcbiAgICAgICAgICB2YXIgd2VpZ2h0U3RyID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W2FuY2hvck1hbmFnZXIuZWRnZVR5cGVdWyd3ZWlnaHQnXTtcclxuICAgICAgICAgIHZhciBkaXN0YW5jZVN0ciA9IGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFthbmNob3JNYW5hZ2VyLmVkZ2VUeXBlXVsnZGlzdGFuY2UnXTtcclxuXHJcbiAgICAgICAgICB2YXIgZWRnZSA9IGFuY2hvck1hbmFnZXIuZWRnZTtcclxuICAgICAgICAgIG1vdmVBbmNob3JQYXJhbSA9IHtcclxuICAgICAgICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgICAgICAgdHlwZTogYW5jaG9yTWFuYWdlci5lZGdlVHlwZSxcclxuICAgICAgICAgICAgd2VpZ2h0czogZWRnZS5kYXRhKHdlaWdodFN0cikgPyBbXS5jb25jYXQoZWRnZS5kYXRhKHdlaWdodFN0cikpIDogW10sXHJcbiAgICAgICAgICAgIGRpc3RhbmNlczogZWRnZS5kYXRhKGRpc3RhbmNlU3RyKSA/IFtdLmNvbmNhdChlZGdlLmRhdGEoZGlzdGFuY2VTdHIpKSA6IFtdXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHR1cm5PZmZBY3RpdmVCZ0NvbG9yKCk7XHJcbiAgICAgICAgICBkaXNhYmxlR2VzdHVyZXMoKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY3kuYXV0b3VuZ3JhYmlmeSh0cnVlKTtcclxuXHJcbiAgICAgICAgICBjYW52YXMuZ2V0U3RhZ2UoKS5vbihcImNvbnRlbnRUb3VjaGVuZCBjb250ZW50TW91c2V1cFwiLCBhbmNob3JNYW5hZ2VyLmVNb3VzZVVwKTtcclxuICAgICAgICAgIGNhbnZhcy5nZXRTdGFnZSgpLm9uKFwiY29udGVudE1vdXNlb3V0XCIsIGFuY2hvck1hbmFnZXIuZU1vdXNlT3V0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIGdldHMgY2FsbGVkIGJlZm9yZSBjeS5vbigndGFwZW5kJylcclxuICAgICAgICBlTW91c2VVcDogZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgLy8gd29uJ3QgYmUgY2FsbGVkIGlmIHRoZSBtb3VzZSBpcyByZWxlYXNlZCBvdXQgb2Ygc2NyZWVuXHJcbiAgICAgICAgICBhbmNob3JUb3VjaGVkID0gZmFsc2U7XHJcbiAgICAgICAgICBhbmNob3JNYW5hZ2VyLnRvdWNoZWRBbmNob3IgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBtb3VzZU91dCA9IGZhbHNlO1xyXG4gICAgICAgICAgYW5jaG9yTWFuYWdlci5lZGdlLnNlbGVjdCgpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZXNldEFjdGl2ZUJnQ29sb3IoKTtcclxuICAgICAgICAgIHJlc2V0R2VzdHVyZXMoKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLyogXHJcbiAgICAgICAgICAgKiBJTVBPUlRBTlRcclxuICAgICAgICAgICAqIEFueSBwcm9ncmFtbWF0aWMgY2FsbHMgdG8gLnNlbGVjdCgpLCAudW5zZWxlY3QoKSBhZnRlciB0aGlzIHN0YXRlbWVudCBhcmUgaWdub3JlZFxyXG4gICAgICAgICAgICogdW50aWwgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKSBpcyBjYWxsZWQgaW4gb25lIG9mIHRoZSBwcmV2aW91czpcclxuICAgICAgICAgICAqIFxyXG4gICAgICAgICAgICogY3kub24oJ3RhcHN0YXJ0JylcclxuICAgICAgICAgICAqIGFuY2hvci5vbignbW91c2Vkb3duIHRvdWNoc3RhcnQnKVxyXG4gICAgICAgICAgICogZG9jdW1lbnQub24oJ2tleWRvd24nKVxyXG4gICAgICAgICAgICogY3kub24oJ3RhcGRyYXAnKVxyXG4gICAgICAgICAgICogXHJcbiAgICAgICAgICAgKiBEb2Vzbid0IGFmZmVjdCBVWCwgYnV0IG1heSBjYXVzZSBjb25mdXNpbmcgYmVoYXZpb3VyIGlmIG5vdCBhd2FyZSBvZiB0aGlzIHdoZW4gY29kaW5nXHJcbiAgICAgICAgICAgKiBcclxuICAgICAgICAgICAqIFdoeSBpcyB0aGlzIGhlcmU/XHJcbiAgICAgICAgICAgKiBUaGlzIGlzIGltcG9ydGFudCB0byBrZWVwIGVkZ2VzIGZyb20gYmVpbmcgYXV0byBkZXNlbGVjdGVkIGZyb20gd29ya2luZ1xyXG4gICAgICAgICAgICogd2l0aCBhbmNob3JzIG91dCBvZiB0aGUgZWRnZSBib2R5IChmb3IgdW5idW5kbGVkIGJlemllciwgdGVjaG5pY2FsbHkgbm90IG5lY2Vzc2VyeSBmb3Igc2VnZW1lbnRzKS5cclxuICAgICAgICAgICAqIFxyXG4gICAgICAgICAgICogVGhlc2UgaXMgYW50aGVyIGN5LmF1dG9zZWxlY3RpZnkodHJ1ZSkgaW4gY3kub24oJ3RhcGVuZCcpIFxyXG4gICAgICAgICAgICogXHJcbiAgICAgICAgICAqLyBcclxuICAgICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICAgICAgICAgIGN5LmF1dG91bmdyYWJpZnkoZmFsc2UpO1xyXG5cclxuICAgICAgICAgIGNhbnZhcy5nZXRTdGFnZSgpLm9mZihcImNvbnRlbnRUb3VjaGVuZCBjb250ZW50TW91c2V1cFwiLCBhbmNob3JNYW5hZ2VyLmVNb3VzZVVwKTtcclxuICAgICAgICAgIGNhbnZhcy5nZXRTdGFnZSgpLm9mZihcImNvbnRlbnRNb3VzZW91dFwiLCBhbmNob3JNYW5hZ2VyLmVNb3VzZU91dCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBoYW5kbGUgbW91c2UgZ29pbmcgb3V0IG9mIGNhbnZhcyBcclxuICAgICAgICBlTW91c2VPdXQ6IGZ1bmN0aW9uIChldmVudCl7XHJcbiAgICAgICAgICBtb3VzZU91dCA9IHRydWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbGVhckFuY2hvcnNFeGNlcHQ6IGZ1bmN0aW9uKGRvbnRDbGVhbiA9IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICB2YXIgZXhjZXB0aW9uQXBwbGllcyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIHRoaXMuYW5jaG9ycy5mb3JFYWNoKChhbmNob3IsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGRvbnRDbGVhbiAmJiBhbmNob3IgPT09IGRvbnRDbGVhbil7XHJcbiAgICAgICAgICAgICAgZXhjZXB0aW9uQXBwbGllcyA9IHRydWU7IC8vIHRoZSBkb250Q2xlYW4gYW5jaG9yIGlzIG5vdCBjbGVhcmVkXHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVuYmluZExpc3RlbmVycyhhbmNob3IpO1xyXG4gICAgICAgICAgICBhbmNob3IuZGVzdHJveSgpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgaWYoZXhjZXB0aW9uQXBwbGllcyl7XHJcbiAgICAgICAgICAgIHRoaXMuYW5jaG9ycyA9IFtkb250Q2xlYW5dO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYW5jaG9ycyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmVkZ2UgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuZWRnZVR5cGUgPSAnaW5jb25jbHVzaXZlJztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIHJlbmRlciB0aGUgYmVuZCBhbmQgY29udHJvbCBzaGFwZXMgb2YgdGhlIGdpdmVuIGVkZ2VcclxuICAgICAgICByZW5kZXJBbmNob3JTaGFwZXM6IGZ1bmN0aW9uKGVkZ2UpIHtcclxuICAgICAgICAgIHRoaXMuZWRnZSA9IGVkZ2U7XHJcbiAgICAgICAgICB0aGlzLmVkZ2VUeXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgICAgICAgaWYoIWVkZ2UuaGFzQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJykgJiZcclxuICAgICAgICAgICAgICAhZWRnZS5oYXNDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHZhciBhbmNob3JMaXN0ID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSk7Ly9lZGdlLl9wcml2YXRlLnJkYXRhLnNlZ3B0cztcclxuICAgICAgICAgIHZhciBsZW5ndGggPSBnZXRBbmNob3JTaGFwZXNMZW5ndGgoZWRnZSkgKiAwLjY1O1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB2YXIgc3JjUG9zID0gZWRnZS5zb3VyY2UoKS5wb3NpdGlvbigpO1xyXG4gICAgICAgICAgdmFyIHRndFBvcyA9IGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGkgPSAwOyBhbmNob3JMaXN0ICYmIGkgPCBhbmNob3JMaXN0Lmxlbmd0aDsgaSA9IGkgKyAyKXtcclxuICAgICAgICAgICAgdmFyIGFuY2hvclggPSBhbmNob3JMaXN0W2ldO1xyXG4gICAgICAgICAgICB2YXIgYW5jaG9yWSA9IGFuY2hvckxpc3RbaSArIDFdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJBbmNob3JTaGFwZShhbmNob3JYLCBhbmNob3JZLCBsZW5ndGgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNhbnZhcy5kcmF3KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyByZW5kZXIgYSBhbmNob3Igc2hhcGUgd2l0aCB0aGUgZ2l2ZW4gcGFyYW1ldGVyc1xyXG4gICAgICAgIHJlbmRlckFuY2hvclNoYXBlOiBmdW5jdGlvbihhbmNob3JYLCBhbmNob3JZLCBsZW5ndGgpIHtcclxuICAgICAgICAgIC8vIGdldCB0aGUgdG9wIGxlZnQgY29vcmRpbmF0ZXNcclxuICAgICAgICAgIHZhciB0b3BMZWZ0WCA9IGFuY2hvclggLSBsZW5ndGggLyAyO1xyXG4gICAgICAgICAgdmFyIHRvcExlZnRZID0gYW5jaG9yWSAtIGxlbmd0aCAvIDI7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIGNvbnZlcnQgdG8gcmVuZGVyZWQgcGFyYW1ldGVyc1xyXG4gICAgICAgICAgdmFyIHJlbmRlcmVkVG9wTGVmdFBvcyA9IGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24oe3g6IHRvcExlZnRYLCB5OiB0b3BMZWZ0WX0pO1xyXG4gICAgICAgICAgbGVuZ3RoICo9IGN5Lnpvb20oKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgdmFyIG5ld0FuY2hvciA9IG5ldyBLb252YS5SZWN0KHtcclxuICAgICAgICAgICAgeDogcmVuZGVyZWRUb3BMZWZ0UG9zLngsXHJcbiAgICAgICAgICAgIHk6IHJlbmRlcmVkVG9wTGVmdFBvcy55LFxyXG4gICAgICAgICAgICB3aWR0aDogbGVuZ3RoLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGxlbmd0aCxcclxuICAgICAgICAgICAgZmlsbDogJ2JsYWNrJyxcclxuICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IDAsXHJcbiAgICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgdGhpcy5hbmNob3JzLnB1c2gobmV3QW5jaG9yKTtcclxuICAgICAgICAgIHRoaXMuYmluZExpc3RlbmVycyhuZXdBbmNob3IpO1xyXG4gICAgICAgICAgY2FudmFzLmFkZChuZXdBbmNob3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHZhciBjeHRBZGRCZW5kRmNuID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgIGN4dEFkZEFuY2hvckZjbihldmVudCwgJ2JlbmQnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGN4dEFkZENvbnRyb2xGY24gPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGN4dEFkZEFuY2hvckZjbihldmVudCwgJ2NvbnRyb2wnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGN4dEFkZEFuY2hvckZjbiA9IGZ1bmN0aW9uIChldmVudCwgYW5jaG9yVHlwZSkge1xyXG4gICAgICAgIHZhciBlZGdlID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgIGlmKCFhbmNob3JQb2ludFV0aWxpdGllcy5pc0lnbm9yZWRFZGdlKGVkZ2UpKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgICAgICAgIHZhciB3ZWlnaHRzLCBkaXN0YW5jZXMsIHdlaWdodFN0ciwgZGlzdGFuY2VTdHI7XHJcblxyXG4gICAgICAgICAgaWYodHlwZSA9PT0gJ2luY29uY2x1c2l2ZScpe1xyXG4gICAgICAgICAgICB3ZWlnaHRzID0gW107XHJcbiAgICAgICAgICAgIGRpc3RhbmNlcyA9IFtdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgd2VpZ2h0U3RyID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXTtcclxuICAgICAgICAgICAgZGlzdGFuY2VTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ107XHJcblxyXG4gICAgICAgICAgICB3ZWlnaHRzID0gZWRnZS5kYXRhKHdlaWdodFN0cikgPyBbXS5jb25jYXQoZWRnZS5kYXRhKHdlaWdodFN0cikpIDogZWRnZS5kYXRhKHdlaWdodFN0cik7XHJcbiAgICAgICAgICAgIGRpc3RhbmNlcyA9IGVkZ2UuZGF0YShkaXN0YW5jZVN0cikgPyBbXS5jb25jYXQoZWRnZS5kYXRhKGRpc3RhbmNlU3RyKSkgOiBlZGdlLmRhdGEoZGlzdGFuY2VTdHIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBwYXJhbSA9IHtcclxuICAgICAgICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgd2VpZ2h0czogd2VpZ2h0cyxcclxuICAgICAgICAgICAgZGlzdGFuY2VzOiBkaXN0YW5jZXNcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgLy8gdGhlIHVuZGVmaW5lZCBnbyBmb3IgZWRnZSBhbmQgbmV3QW5jaG9yUG9pbnQgcGFyYW1ldGVyc1xyXG4gICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuYWRkQW5jaG9yUG9pbnQodW5kZWZpbmVkLCB1bmRlZmluZWQsIGFuY2hvclR5cGUpO1xyXG5cclxuICAgICAgICAgIGlmIChvcHRpb25zKCkudW5kb2FibGUpIHtcclxuICAgICAgICAgICAgY3kudW5kb1JlZG8oKS5kbygnY2hhbmdlQW5jaG9yUG9pbnRzJywgcGFyYW0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVmcmVzaERyYXdzKCk7XHJcbiAgICAgICAgZWRnZS5zZWxlY3QoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHZhciBjeHRSZW1vdmVBbmNob3JGY24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICB2YXIgZWRnZSA9IGFuY2hvck1hbmFnZXIuZWRnZTtcclxuICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgICAgICBpZihhbmNob3JQb2ludFV0aWxpdGllcy5lZGdlVHlwZUluY29uY2x1c2l2ZVNob3VsZG50SGFwcGVuKHR5cGUsIFwiVWlVdGlsaXRpZXMuanMsIGN4dFJlbW92ZUFuY2hvckZjblwiKSl7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcGFyYW0gPSB7XHJcbiAgICAgICAgICBlZGdlOiBlZGdlLFxyXG4gICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgIHdlaWdodHM6IFtdLmNvbmNhdChlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSkpLFxyXG4gICAgICAgICAgZGlzdGFuY2VzOiBbXS5jb25jYXQoZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXSkpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMucmVtb3ZlQW5jaG9yKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYob3B0aW9ucygpLnVuZG9hYmxlKSB7XHJcbiAgICAgICAgICBjeS51bmRvUmVkbygpLmRvKCdjaGFuZ2VBbmNob3JQb2ludHMnLCBwYXJhbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtyZWZyZXNoRHJhd3MoKTtlZGdlLnNlbGVjdCgpO30sIDUwKSA7XHJcblxyXG4gICAgICB9O1xyXG5cclxuICAgICAgdmFyIGN4dFJlbW92ZUFsbEFuY2hvcnNGY24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICB2YXIgZWRnZSA9IGFuY2hvck1hbmFnZXIuZWRnZTtcclxuICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG4gICAgICAgIHZhciBwYXJhbSA9IHtcclxuICAgICAgICAgIGVkZ2U6IGVkZ2UsXHJcbiAgICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgICAgd2VpZ2h0czogW10uY29uY2F0KGVkZ2UuZGF0YShhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddKSksXHJcbiAgICAgICAgICBkaXN0YW5jZXM6IFtdLmNvbmNhdChlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddKSlcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLnJlbW92ZUFsbEFuY2hvcnMoKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMoKS51bmRvYWJsZSkge1xyXG4gICAgICAgICAgY3kudW5kb1JlZG8oKS5kbygnY2hhbmdlQW5jaG9yUG9pbnRzJywgcGFyYW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7cmVmcmVzaERyYXdzKCk7ZWRnZS5zZWxlY3QoKTt9LCA1MCk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIGZ1bmN0aW9uIHRvIHJlY29ubmVjdCBlZGdlXHJcbiAgICAgIHZhciBoYW5kbGVSZWNvbm5lY3RFZGdlID0gb3B0cy5oYW5kbGVSZWNvbm5lY3RFZGdlO1xyXG4gICAgICAvLyBmdW5jdGlvbiB0byB2YWxpZGF0ZSBlZGdlIHNvdXJjZSBhbmQgdGFyZ2V0IG9uIHJlY29ubmVjdGlvblxyXG4gICAgICB2YXIgdmFsaWRhdGVFZGdlID0gb3B0cy52YWxpZGF0ZUVkZ2U7IFxyXG4gICAgICAvLyBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gaW52YWxpZCBlZGdlIHJlY29ubmVjdGlvblxyXG4gICAgICB2YXIgYWN0T25VbnN1Y2Nlc3NmdWxSZWNvbm5lY3Rpb24gPSBvcHRzLmFjdE9uVW5zdWNjZXNzZnVsUmVjb25uZWN0aW9uO1xyXG4gICAgICBcclxuICAgICAgdmFyIG1lbnVJdGVtcyA9IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogYWRkQmVuZFBvaW50Q3h0TWVudUlkLFxyXG4gICAgICAgICAgY29udGVudDogb3B0cy5hZGRCZW5kTWVudUl0ZW1UaXRsZSxcclxuICAgICAgICAgIHNlbGVjdG9yOiAnZWRnZScsXHJcbiAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IGN4dEFkZEJlbmRGY25cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiByZW1vdmVCZW5kUG9pbnRDeHRNZW51SWQsXHJcbiAgICAgICAgICBjb250ZW50OiBvcHRzLnJlbW92ZUJlbmRNZW51SXRlbVRpdGxlLFxyXG4gICAgICAgICAgc2VsZWN0b3I6ICdlZGdlJyxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0UmVtb3ZlQW5jaG9yRmNuXHJcbiAgICAgICAgfSwgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IHJlbW92ZUFsbEJlbmRQb2ludEN0eE1lbnVJZCxcclxuICAgICAgICAgIGNvbnRlbnQ6IG9wdHMucmVtb3ZlQWxsQmVuZE1lbnVJdGVtVGl0bGUsXHJcbiAgICAgICAgICBzZWxlY3Rvcjogb3B0cy5lbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb24gJiYgJzpzZWxlY3RlZC5lZGdlYmVuZGVkaXRpbmctaGFzbXVsdGlwbGViZW5kcG9pbnRzJyxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0UmVtb3ZlQWxsQW5jaG9yc0ZjblxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCxcclxuICAgICAgICAgIGNvbnRlbnQ6IG9wdHMuYWRkQ29udHJvbE1lbnVJdGVtVGl0bGUsXHJcbiAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgY29yZUFzV2VsbDogdHJ1ZSxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0QWRkQ29udHJvbEZjblxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IHJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCxcclxuICAgICAgICAgIGNvbnRlbnQ6IG9wdHMucmVtb3ZlQ29udHJvbE1lbnVJdGVtVGl0bGUsXHJcbiAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgY29yZUFzV2VsbDogdHJ1ZSxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0UmVtb3ZlQW5jaG9yRmNuXHJcbiAgICAgICAgfSwgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IHJlbW92ZUFsbENvbnRyb2xQb2ludEN0eE1lbnVJZCxcclxuICAgICAgICAgIGNvbnRlbnQ6IG9wdHMucmVtb3ZlQWxsQ29udHJvbE1lbnVJdGVtVGl0bGUsXHJcbiAgICAgICAgICBzZWxlY3Rvcjogb3B0cy5lbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb24gJiYgJzpzZWxlY3RlZC5lZGdlY29udHJvbGVkaXRpbmctaGFzbXVsdGlwbGVjb250cm9scG9pbnRzJyxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0UmVtb3ZlQWxsQW5jaG9yc0ZjblxyXG4gICAgICAgIH0sXHJcbiAgICAgIF07XHJcbiAgICAgIFxyXG4gICAgICBpZihjeS5jb250ZXh0TWVudXMpIHtcclxuICAgICAgICB2YXIgbWVudXMgPSBjeS5jb250ZXh0TWVudXMoJ2dldCcpO1xyXG4gICAgICAgIC8vIElmIGNvbnRleHQgbWVudXMgaXMgYWN0aXZlIGp1c3QgYXBwZW5kIG1lbnUgaXRlbXMgZWxzZSBhY3RpdmF0ZSB0aGUgZXh0ZW5zaW9uXHJcbiAgICAgICAgLy8gd2l0aCBpbml0aWFsIG1lbnUgaXRlbXNcclxuICAgICAgICBpZiAobWVudXMuaXNBY3RpdmUoKSkge1xyXG4gICAgICAgICAgbWVudXMuYXBwZW5kTWVudUl0ZW1zKG1lbnVJdGVtcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY3kuY29udGV4dE1lbnVzKHtcclxuICAgICAgICAgICAgbWVudUl0ZW1zOiBtZW51SXRlbXNcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgdmFyIF9zaXplQ2FudmFzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRjYW52YXNFbGVtZW50XHJcbiAgICAgICAgICAuYXR0cignaGVpZ2h0JywgJGNvbnRhaW5lci5oZWlnaHQoKSlcclxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsICRjb250YWluZXIud2lkdGgoKSlcclxuICAgICAgICAgIC5jc3Moe1xyXG4gICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgJ2xlZnQnOiAwLFxyXG4gICAgICAgICAgICAnei1pbmRleCc6IG9wdGlvbnMoKS56SW5kZXhcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBjYW52YXNCYiA9ICRjYW52YXNFbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgICAgdmFyIGNvbnRhaW5lckJiID0gJGNvbnRhaW5lci5vZmZzZXQoKTtcclxuXHJcbiAgICAgICAgICAkY2FudmFzRWxlbWVudFxyXG4gICAgICAgICAgICAuY3NzKHtcclxuICAgICAgICAgICAgICAndG9wJzogLShjYW52YXNCYi50b3AgLSBjb250YWluZXJCYi50b3ApLFxyXG4gICAgICAgICAgICAgICdsZWZ0JzogLShjYW52YXNCYi5sZWZ0IC0gY29udGFpbmVyQmIubGVmdClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIDtcclxuXHJcbiAgICAgICAgICBjYW52YXMuZ2V0U3RhZ2UoKS5zZXRXaWR0aCgkY29udGFpbmVyLndpZHRoKCkpO1xyXG4gICAgICAgICAgY2FudmFzLmdldFN0YWdlKCkuc2V0SGVpZ2h0KCRjb250YWluZXIuaGVpZ2h0KCkpO1xyXG5cclxuICAgICAgICAgIC8vIHJlZHJhdyBvbiBjYW52YXMgcmVzaXplXHJcbiAgICAgICAgICBpZihjeSl7XHJcbiAgICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIDApO1xyXG5cclxuICAgICAgfSwgMjUwKTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIHNpemVDYW52YXMoKSB7XHJcbiAgICAgICAgX3NpemVDYW52YXMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc2l6ZUNhbnZhcygpO1xyXG5cclxuICAgICAgJCh3aW5kb3cpLmJpbmQoJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBzaXplQ2FudmFzKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgLy8gd3JpdGUgb3B0aW9ucyB0byBkYXRhXHJcbiAgICAgIHZhciBkYXRhID0gJGNvbnRhaW5lci5kYXRhKCdjeWVkZ2VlZGl0aW5nJyk7XHJcbiAgICAgIGlmIChkYXRhID09IG51bGwpIHtcclxuICAgICAgICBkYXRhID0ge307XHJcbiAgICAgIH1cclxuICAgICAgZGF0YS5vcHRpb25zID0gb3B0cztcclxuXHJcbiAgICAgIHZhciBvcHRDYWNoZTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIG9wdGlvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIG9wdENhY2hlIHx8IChvcHRDYWNoZSA9ICRjb250YWluZXIuZGF0YSgnY3llZGdlZWRpdGluZycpLm9wdGlvbnMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB3ZSB3aWxsIG5lZWQgdG8gY29udmVydCBtb2RlbCBwb3NpdG9ucyB0byByZW5kZXJlZCBwb3NpdGlvbnNcclxuICAgICAgZnVuY3Rpb24gY29udmVydFRvUmVuZGVyZWRQb3NpdGlvbihtb2RlbFBvc2l0aW9uKSB7XHJcbiAgICAgICAgdmFyIHBhbiA9IGN5LnBhbigpO1xyXG4gICAgICAgIHZhciB6b29tID0gY3kuem9vbSgpO1xyXG5cclxuICAgICAgICB2YXIgeCA9IG1vZGVsUG9zaXRpb24ueCAqIHpvb20gKyBwYW4ueDtcclxuICAgICAgICB2YXIgeSA9IG1vZGVsUG9zaXRpb24ueSAqIHpvb20gKyBwYW4ueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHg6IHgsXHJcbiAgICAgICAgICB5OiB5XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgZnVuY3Rpb24gcmVmcmVzaERyYXdzKCkge1xyXG5cclxuICAgICAgICAvLyBkb24ndCBjbGVhciBhbmNob3Igd2hpY2ggaXMgYmVpbmcgbW92ZWRcclxuICAgICAgICBhbmNob3JNYW5hZ2VyLmNsZWFyQW5jaG9yc0V4Y2VwdChhbmNob3JNYW5hZ2VyLnRvdWNoZWRBbmNob3IpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGVuZHBvaW50U2hhcGUxICE9PSBudWxsKXtcclxuICAgICAgICAgIGVuZHBvaW50U2hhcGUxLmRlc3Ryb3koKTtcclxuICAgICAgICAgIGVuZHBvaW50U2hhcGUxID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZW5kcG9pbnRTaGFwZTIgIT09IG51bGwpe1xyXG4gICAgICAgICAgZW5kcG9pbnRTaGFwZTIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgZW5kcG9pbnRTaGFwZTIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYW52YXMuZHJhdygpO1xyXG5cclxuICAgICAgICBpZiggZWRnZVRvSGlnaGxpZ2h0ICkge1xyXG4gICAgICAgICAgYW5jaG9yTWFuYWdlci5yZW5kZXJBbmNob3JTaGFwZXMoZWRnZVRvSGlnaGxpZ2h0KTtcclxuICAgICAgICAgIHJlbmRlckVuZFBvaW50U2hhcGVzKGVkZ2VUb0hpZ2hsaWdodCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyByZW5kZXIgdGhlIGVuZCBwb2ludHMgc2hhcGVzIG9mIHRoZSBnaXZlbiBlZGdlXHJcbiAgICAgIGZ1bmN0aW9uIHJlbmRlckVuZFBvaW50U2hhcGVzKGVkZ2UpIHtcclxuICAgICAgICBpZighZWRnZSl7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZWRnZV9wdHMgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRBbmNob3JzQXNBcnJheShlZGdlKTtcclxuICAgICAgICBpZih0eXBlb2YgZWRnZV9wdHMgPT09ICd1bmRlZmluZWQnKXtcclxuICAgICAgICAgIGVkZ2VfcHRzID0gW107XHJcbiAgICAgICAgfSAgICAgICBcclxuICAgICAgICB2YXIgc291cmNlUG9zID0gZWRnZS5zb3VyY2VFbmRwb2ludCgpO1xyXG4gICAgICAgIHZhciB0YXJnZXRQb3MgPSBlZGdlLnRhcmdldEVuZHBvaW50KCk7XHJcbiAgICAgICAgZWRnZV9wdHMudW5zaGlmdChzb3VyY2VQb3MueSk7XHJcbiAgICAgICAgZWRnZV9wdHMudW5zaGlmdChzb3VyY2VQb3MueCk7XHJcbiAgICAgICAgZWRnZV9wdHMucHVzaCh0YXJnZXRQb3MueCk7XHJcbiAgICAgICAgZWRnZV9wdHMucHVzaCh0YXJnZXRQb3MueSk7IFxyXG5cclxuICAgICAgIFxyXG4gICAgICAgIGlmKCFlZGdlX3B0cylcclxuICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIHNyYyA9IHtcclxuICAgICAgICAgIHg6IGVkZ2VfcHRzWzBdLFxyXG4gICAgICAgICAgeTogZWRnZV9wdHNbMV1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0YXJnZXQgPSB7XHJcbiAgICAgICAgICB4OiBlZGdlX3B0c1tlZGdlX3B0cy5sZW5ndGgtMl0sXHJcbiAgICAgICAgICB5OiBlZGdlX3B0c1tlZGdlX3B0cy5sZW5ndGgtMV1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBuZXh0VG9Tb3VyY2UgPSB7XHJcbiAgICAgICAgICB4OiBlZGdlX3B0c1syXSxcclxuICAgICAgICAgIHk6IGVkZ2VfcHRzWzNdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBuZXh0VG9UYXJnZXQgPSB7XHJcbiAgICAgICAgICB4OiBlZGdlX3B0c1tlZGdlX3B0cy5sZW5ndGgtNF0sXHJcbiAgICAgICAgICB5OiBlZGdlX3B0c1tlZGdlX3B0cy5sZW5ndGgtM11cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IGdldEFuY2hvclNoYXBlc0xlbmd0aChlZGdlKSAqIDAuNjU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVuZGVyRWFjaEVuZFBvaW50U2hhcGUoc3JjLCB0YXJnZXQsIGxlbmd0aCxuZXh0VG9Tb3VyY2UsbmV4dFRvVGFyZ2V0KTtcclxuICAgICAgICBcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gcmVuZGVyRWFjaEVuZFBvaW50U2hhcGUoc291cmNlLCB0YXJnZXQsIGxlbmd0aCxuZXh0VG9Tb3VyY2UsbmV4dFRvVGFyZ2V0KSB7XHJcbiAgICAgICAgLy8gZ2V0IHRoZSB0b3AgbGVmdCBjb29yZGluYXRlcyBvZiBzb3VyY2UgYW5kIHRhcmdldFxyXG4gICAgICAgIHZhciBzVG9wTGVmdFggPSBzb3VyY2UueCAtIGxlbmd0aCAvIDI7XHJcbiAgICAgICAgdmFyIHNUb3BMZWZ0WSA9IHNvdXJjZS55IC0gbGVuZ3RoIC8gMjtcclxuXHJcbiAgICAgICAgdmFyIHRUb3BMZWZ0WCA9IHRhcmdldC54IC0gbGVuZ3RoIC8gMjtcclxuICAgICAgICB2YXIgdFRvcExlZnRZID0gdGFyZ2V0LnkgLSBsZW5ndGggLyAyO1xyXG5cclxuICAgICAgICB2YXIgbmV4dFRvU291cmNlWCA9IG5leHRUb1NvdXJjZS54IC0gbGVuZ3RoIC8yO1xyXG4gICAgICAgIHZhciBuZXh0VG9Tb3VyY2VZID0gbmV4dFRvU291cmNlLnkgLSBsZW5ndGggLyAyO1xyXG5cclxuICAgICAgICB2YXIgbmV4dFRvVGFyZ2V0WCA9IG5leHRUb1RhcmdldC54IC0gbGVuZ3RoIC8yO1xyXG4gICAgICAgIHZhciBuZXh0VG9UYXJnZXRZID0gbmV4dFRvVGFyZ2V0LnkgLSBsZW5ndGggLzI7XHJcblxyXG5cclxuICAgICAgICAvLyBjb252ZXJ0IHRvIHJlbmRlcmVkIHBhcmFtZXRlcnNcclxuICAgICAgICB2YXIgcmVuZGVyZWRTb3VyY2VQb3MgPSBjb252ZXJ0VG9SZW5kZXJlZFBvc2l0aW9uKHt4OiBzVG9wTGVmdFgsIHk6IHNUb3BMZWZ0WX0pO1xyXG4gICAgICAgIHZhciByZW5kZXJlZFRhcmdldFBvcyA9IGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24oe3g6IHRUb3BMZWZ0WCwgeTogdFRvcExlZnRZfSk7XHJcbiAgICAgICAgbGVuZ3RoID0gbGVuZ3RoICogY3kuem9vbSgpIC8gMjtcclxuXHJcbiAgICAgICAgdmFyIHJlbmRlcmVkTmV4dFRvU291cmNlID0gY29udmVydFRvUmVuZGVyZWRQb3NpdGlvbih7eDogbmV4dFRvU291cmNlWCwgeTogbmV4dFRvU291cmNlWX0pO1xyXG4gICAgICAgIHZhciByZW5kZXJlZE5leHRUb1RhcmdldCA9IGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24oe3g6IG5leHRUb1RhcmdldFgsIHk6IG5leHRUb1RhcmdldFl9KTtcclxuICAgICAgICBcclxuICAgICAgICAvL2hvdyBmYXIgdG8gZ28gZnJvbSB0aGUgbm9kZSBhbG9uZyB0aGUgZWRnZVxyXG4gICAgICAgIHZhciBkaXN0YW5jZUZyb21Ob2RlID0gbGVuZ3RoO1xyXG5cclxuICAgICAgICB2YXIgZGlzdGFuY2VTb3VyY2UgPSBNYXRoLnNxcnQoTWF0aC5wb3cocmVuZGVyZWROZXh0VG9Tb3VyY2UueCAtIHJlbmRlcmVkU291cmNlUG9zLngsMikgKyBNYXRoLnBvdyhyZW5kZXJlZE5leHRUb1NvdXJjZS55IC0gcmVuZGVyZWRTb3VyY2VQb3MueSwyKSk7ICAgICAgICBcclxuICAgICAgICB2YXIgc291cmNlRW5kUG9pbnRYID0gcmVuZGVyZWRTb3VyY2VQb3MueCArICgoZGlzdGFuY2VGcm9tTm9kZS8gZGlzdGFuY2VTb3VyY2UpKiAocmVuZGVyZWROZXh0VG9Tb3VyY2UueCAtIHJlbmRlcmVkU291cmNlUG9zLngpKTtcclxuICAgICAgICB2YXIgc291cmNlRW5kUG9pbnRZID0gcmVuZGVyZWRTb3VyY2VQb3MueSArICgoZGlzdGFuY2VGcm9tTm9kZS8gZGlzdGFuY2VTb3VyY2UpKiAocmVuZGVyZWROZXh0VG9Tb3VyY2UueSAtIHJlbmRlcmVkU291cmNlUG9zLnkpKTtcclxuXHJcblxyXG4gICAgICAgIHZhciBkaXN0YW5jZVRhcmdldCA9IE1hdGguc3FydChNYXRoLnBvdyhyZW5kZXJlZE5leHRUb1RhcmdldC54IC0gcmVuZGVyZWRUYXJnZXRQb3MueCwyKSArIE1hdGgucG93KHJlbmRlcmVkTmV4dFRvVGFyZ2V0LnkgLSByZW5kZXJlZFRhcmdldFBvcy55LDIpKTsgICAgICAgIFxyXG4gICAgICAgIHZhciB0YXJnZXRFbmRQb2ludFggPSByZW5kZXJlZFRhcmdldFBvcy54ICsgKChkaXN0YW5jZUZyb21Ob2RlLyBkaXN0YW5jZVRhcmdldCkqIChyZW5kZXJlZE5leHRUb1RhcmdldC54IC0gcmVuZGVyZWRUYXJnZXRQb3MueCkpO1xyXG4gICAgICAgIHZhciB0YXJnZXRFbmRQb2ludFkgPSByZW5kZXJlZFRhcmdldFBvcy55ICsgKChkaXN0YW5jZUZyb21Ob2RlLyBkaXN0YW5jZVRhcmdldCkqIChyZW5kZXJlZE5leHRUb1RhcmdldC55IC0gcmVuZGVyZWRUYXJnZXRQb3MueSkpOyBcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyIGVuZCBwb2ludCBzaGFwZSBmb3Igc291cmNlIGFuZCB0YXJnZXRcclxuICAgICAgICAvLyB0aGUgbnVsbCBjaGVja3MgYXJlIG5vdCB0aGVvcmV0aWNhbGx5IHJlcXVpcmVkXHJcbiAgICAgICAgLy8gYnV0IHRoZXkgcHJvdGVjdCBmcm9tIGJhZCBzeW5jaHJvbmlvdXMgY2FsbHMgb2YgcmVmcmVzaERyYXdzKClcclxuICAgICAgICBpZihlbmRwb2ludFNoYXBlMSA9PT0gbnVsbCl7XHJcbiAgICAgICAgICBlbmRwb2ludFNoYXBlMSA9IG5ldyBLb252YS5DaXJjbGUoe1xyXG4gICAgICAgICAgICB4OiBzb3VyY2VFbmRQb2ludFggKyBsZW5ndGgsXHJcbiAgICAgICAgICAgIHk6IHNvdXJjZUVuZFBvaW50WSArIGxlbmd0aCxcclxuICAgICAgICAgICAgcmFkaXVzOiBsZW5ndGgsXHJcbiAgICAgICAgICAgIGZpbGw6ICdibGFjaycsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGVuZHBvaW50U2hhcGUyID09PSBudWxsKXtcclxuICAgICAgICAgIGVuZHBvaW50U2hhcGUyID0gbmV3IEtvbnZhLkNpcmNsZSh7XHJcbiAgICAgICAgICAgIHg6IHRhcmdldEVuZFBvaW50WCArIGxlbmd0aCxcclxuICAgICAgICAgICAgeTogdGFyZ2V0RW5kUG9pbnRZICsgbGVuZ3RoLFxyXG4gICAgICAgICAgICByYWRpdXM6IGxlbmd0aCxcclxuICAgICAgICAgICAgZmlsbDogJ2JsYWNrJyxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2FudmFzLmFkZChlbmRwb2ludFNoYXBlMSk7XHJcbiAgICAgICAgY2FudmFzLmFkZChlbmRwb2ludFNoYXBlMik7XHJcbiAgICAgICAgY2FudmFzLmRyYXcoKTtcclxuICAgICAgICBcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZ2V0IHRoZSBsZW5ndGggb2YgYW5jaG9yIHBvaW50cyB0byBiZSByZW5kZXJlZFxyXG4gICAgICBmdW5jdGlvbiBnZXRBbmNob3JTaGFwZXNMZW5ndGgoZWRnZSkge1xyXG4gICAgICAgIHZhciBmYWN0b3IgPSBvcHRpb25zKCkuYW5jaG9yU2hhcGVTaXplRmFjdG9yO1xyXG4gICAgICAgIGlmKG9wdGlvbnMoKS5lbmFibGVBbmNob3JTaXplTm90SW1wYWN0Qnlab29tKSB2YXIgYWN0dWFsRmFjdG9yPSBmYWN0b3IvY3kuem9vbSgpXHJcbiAgICAgICAgZWxzZSB2YXIgYWN0dWFsRmFjdG9yPSBmYWN0b3JcclxuICAgICAgICBpZiAocGFyc2VGbG9hdChlZGdlLmNzcygnd2lkdGgnKSkgPD0gMi41KVxyXG4gICAgICAgICAgcmV0dXJuIDIuNSAqIGFjdHVhbEZhY3RvcjtcclxuICAgICAgICBlbHNlIHJldHVybiBwYXJzZUZsb2F0KGVkZ2UuY3NzKCd3aWR0aCcpKSphY3R1YWxGYWN0b3I7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIGNoZWNrIGlmIHRoZSBhbmNob3IgcmVwcmVzZW50ZWQgYnkge3gsIHl9IGlzIGluc2lkZSB0aGUgcG9pbnQgc2hhcGVcclxuICAgICAgZnVuY3Rpb24gY2hlY2tJZkluc2lkZVNoYXBlKHgsIHksIGxlbmd0aCwgY2VudGVyWCwgY2VudGVyWSl7XHJcbiAgICAgICAgdmFyIG1pblggPSBjZW50ZXJYIC0gbGVuZ3RoIC8gMjtcclxuICAgICAgICB2YXIgbWF4WCA9IGNlbnRlclggKyBsZW5ndGggLyAyO1xyXG4gICAgICAgIHZhciBtaW5ZID0gY2VudGVyWSAtIGxlbmd0aCAvIDI7XHJcbiAgICAgICAgdmFyIG1heFkgPSBjZW50ZXJZICsgbGVuZ3RoIC8gMjtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW5zaWRlID0gKHggPj0gbWluWCAmJiB4IDw9IG1heFgpICYmICh5ID49IG1pblkgJiYgeSA8PSBtYXhZKTtcclxuICAgICAgICByZXR1cm4gaW5zaWRlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBnZXQgdGhlIGluZGV4IG9mIGFuY2hvciBjb250YWluaW5nIHRoZSBwb2ludCByZXByZXNlbnRlZCBieSB7eCwgeX1cclxuICAgICAgZnVuY3Rpb24gZ2V0Q29udGFpbmluZ1NoYXBlSW5kZXgoeCwgeSwgZWRnZSkge1xyXG4gICAgICAgIHZhciB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgICAgIGlmKHR5cGUgPT09ICdpbmNvbmNsdXNpdmUnKXtcclxuICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGVkZ2UuZGF0YShhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddKSA9PSBudWxsIHx8IFxyXG4gICAgICAgICAgZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10pLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgIHJldHVybiAtMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBhbmNob3JMaXN0ID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSk7Ly9lZGdlLl9wcml2YXRlLnJkYXRhLnNlZ3B0cztcclxuICAgICAgICB2YXIgbGVuZ3RoID0gZ2V0QW5jaG9yU2hhcGVzTGVuZ3RoKGVkZ2UpO1xyXG5cclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBhbmNob3JMaXN0ICYmIGkgPCBhbmNob3JMaXN0Lmxlbmd0aDsgaSA9IGkgKyAyKXtcclxuICAgICAgICAgIHZhciBhbmNob3JYID0gYW5jaG9yTGlzdFtpXTtcclxuICAgICAgICAgIHZhciBhbmNob3JZID0gYW5jaG9yTGlzdFtpICsgMV07XHJcblxyXG4gICAgICAgICAgdmFyIGluc2lkZSA9IGNoZWNrSWZJbnNpZGVTaGFwZSh4LCB5LCBsZW5ndGgsIGFuY2hvclgsIGFuY2hvclkpO1xyXG4gICAgICAgICAgaWYoaW5zaWRlKXtcclxuICAgICAgICAgICAgcmV0dXJuIGkgLyAyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgZnVuY3Rpb24gZ2V0Q29udGFpbmluZ0VuZFBvaW50KHgsIHksIGVkZ2Upe1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBnZXRBbmNob3JTaGFwZXNMZW5ndGgoZWRnZSk7XHJcbiAgICAgICAgdmFyIGFsbFB0cyA9IGVkZ2UuX3ByaXZhdGUucnNjcmF0Y2guYWxscHRzO1xyXG4gICAgICAgIHZhciBzcmMgPSB7XHJcbiAgICAgICAgICB4OiBhbGxQdHNbMF0sXHJcbiAgICAgICAgICB5OiBhbGxQdHNbMV1cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IHtcclxuICAgICAgICAgIHg6IGFsbFB0c1thbGxQdHMubGVuZ3RoLTJdLFxyXG4gICAgICAgICAgeTogYWxsUHRzW2FsbFB0cy5sZW5ndGgtMV1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29udmVydFRvUmVuZGVyZWRQb3NpdGlvbihzcmMpO1xyXG4gICAgICAgIGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24odGFyZ2V0KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBTb3VyY2U6MCwgVGFyZ2V0OjEsIE5vbmU6LTFcclxuICAgICAgICBpZihjaGVja0lmSW5zaWRlU2hhcGUoeCwgeSwgbGVuZ3RoLCBzcmMueCwgc3JjLnkpKVxyXG4gICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgZWxzZSBpZihjaGVja0lmSW5zaWRlU2hhcGUoeCwgeSwgbGVuZ3RoLCB0YXJnZXQueCwgdGFyZ2V0LnkpKVxyXG4gICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyBzdG9yZSB0aGUgY3VycmVudCBzdGF0dXMgb2YgZ2VzdHVyZXMgYW5kIHNldCB0aGVtIHRvIGZhbHNlXHJcbiAgICAgIGZ1bmN0aW9uIGRpc2FibGVHZXN0dXJlcygpIHtcclxuICAgICAgICBsYXN0UGFubmluZ0VuYWJsZWQgPSBjeS5wYW5uaW5nRW5hYmxlZCgpO1xyXG4gICAgICAgIGxhc3Rab29taW5nRW5hYmxlZCA9IGN5Lnpvb21pbmdFbmFibGVkKCk7XHJcbiAgICAgICAgbGFzdEJveFNlbGVjdGlvbkVuYWJsZWQgPSBjeS5ib3hTZWxlY3Rpb25FbmFibGVkKCk7XHJcblxyXG4gICAgICAgIGN5Lnpvb21pbmdFbmFibGVkKGZhbHNlKVxyXG4gICAgICAgICAgLnBhbm5pbmdFbmFibGVkKGZhbHNlKVxyXG4gICAgICAgICAgLmJveFNlbGVjdGlvbkVuYWJsZWQoZmFsc2UpO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyByZXNldCB0aGUgZ2VzdHVyZXMgYnkgdGhlaXIgbGF0ZXN0IHN0YXR1c1xyXG4gICAgICBmdW5jdGlvbiByZXNldEdlc3R1cmVzKCkge1xyXG4gICAgICAgIGN5Lnpvb21pbmdFbmFibGVkKGxhc3Rab29taW5nRW5hYmxlZClcclxuICAgICAgICAgIC5wYW5uaW5nRW5hYmxlZChsYXN0UGFubmluZ0VuYWJsZWQpXHJcbiAgICAgICAgICAuYm94U2VsZWN0aW9uRW5hYmxlZChsYXN0Qm94U2VsZWN0aW9uRW5hYmxlZCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZ1bmN0aW9uIHR1cm5PZmZBY3RpdmVCZ0NvbG9yKCl7XHJcbiAgICAgICAgLy8gZm91bmQgdGhpcyBhdCB0aGUgY3ktbm9kZS1yZXNpemUgY29kZSwgYnV0IGRvZXNuJ3Qgc2VlbSB0byBmaW5kIHRoZSBvYmplY3QgbW9zdCBvZiB0aGUgdGltZVxyXG4gICAgICAgIGlmKCBjeS5zdHlsZSgpLl9wcml2YXRlLmNvcmVTdHlsZVtcImFjdGl2ZS1iZy1vcGFjaXR5XCJdKSB7XHJcbiAgICAgICAgICBsYXN0QWN0aXZlQmdPcGFjaXR5ID0gY3kuc3R5bGUoKS5fcHJpdmF0ZS5jb3JlU3R5bGVbXCJhY3RpdmUtYmctb3BhY2l0eVwiXS52YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAvLyBhcmJpdHJhcnksIGZlZWwgZnJlZSB0byBjaGFuZ2VcclxuICAgICAgICAgIC8vIHRyaWFsIGFuZCBlcnJvciBzaG93ZWQgdGhhdCAwLjE1IHdhcyBjbG9zZXN0IHRvIHRoZSBvbGQgY29sb3JcclxuICAgICAgICAgIGxhc3RBY3RpdmVCZ09wYWNpdHkgPSAwLjE1O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3kuc3R5bGUoKVxyXG4gICAgICAgICAgLnNlbGVjdG9yKFwiY29yZVwiKVxyXG4gICAgICAgICAgLnN0eWxlKFwiYWN0aXZlLWJnLW9wYWNpdHlcIiwgMClcclxuICAgICAgICAgIC51cGRhdGUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gcmVzZXRBY3RpdmVCZ0NvbG9yKCl7XHJcbiAgICAgICAgY3kuc3R5bGUoKVxyXG4gICAgICAgICAgLnNlbGVjdG9yKFwiY29yZVwiKVxyXG4gICAgICAgICAgLnN0eWxlKFwiYWN0aXZlLWJnLW9wYWNpdHlcIiwgbGFzdEFjdGl2ZUJnT3BhY2l0eSlcclxuICAgICAgICAgIC51cGRhdGUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gbW92ZUFuY2hvclBvaW50cyhwb3NpdGlvbkRpZmYsIGVkZ2VzKSB7XHJcbiAgICAgICAgICBlZGdlcy5mb3JFYWNoKGZ1bmN0aW9uKCBlZGdlICl7XHJcbiAgICAgICAgICAgICAgdmFyIHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSk7XHJcbiAgICAgICAgICAgICAgdmFyIG5leHRBbmNob3JQb2ludHNQb3NpdGlvbiA9IFtdO1xyXG4gICAgICAgICAgICAgIGlmIChwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiAhPSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uLmxlbmd0aDsgaSs9MilcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXh0QW5jaG9yUG9pbnRzUG9zaXRpb24ucHVzaCh7eDogcHJldmlvdXNBbmNob3JzUG9zaXRpb25baV0rcG9zaXRpb25EaWZmLngsIHk6IHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uW2krMV0rcG9zaXRpb25EaWZmLnl9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoYW5jaG9yUG9pbnRVdGlsaXRpZXMuZWRnZVR5cGVJbmNvbmNsdXNpdmVTaG91bGRudEhhcHBlbih0eXBlLCBcIlVpVXRpbGl0aWVzLmpzLCBtb3ZlQW5jaG9yUG9pbnRzXCIpKXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVkZ2UuZGF0YShhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3BvaW50UG9zJ10sIG5leHRBbmNob3JQb2ludHNQb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBhbmNob3JQb2ludFV0aWxpdGllcy5pbml0QW5jaG9yUG9pbnRzKG9wdGlvbnMoKS5iZW5kUG9zaXRpb25zRnVuY3Rpb24sIG9wdGlvbnMoKS5jb250cm9sUG9zaXRpb25zRnVuY3Rpb24sIGVkZ2VzKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gTGlzdGVuZXIgZGVmaW5lZCBpbiBvdGhlciBleHRlbnNpb25cclxuICAgICAgICAgIC8vIE1pZ2h0IGhhdmUgY29tcGF0aWJpbGl0eSBpc3N1ZXMgYWZ0ZXIgdGhlIHVuYnVuZGxlZCBiZXppZXJcclxuICAgICAgICAgIGN5LnRyaWdnZXIoJ2JlbmRQb2ludE1vdmVtZW50Jyk7IFxyXG4gICAgICB9XHJcblxyXG5cclxuICAgICAgZnVuY3Rpb24gX2NhbGNDb3N0VG9QcmVmZXJyZWRQb3NpdGlvbihwMSwgcDIpe1xyXG4gICAgICAgIHZhciBjdXJyZW50QW5nbGUgPSBNYXRoLmF0YW4yKHAyLnkgLSBwMS55LCBwMi54IC0gcDEueCk7XHJcbiAgICAgICAgdmFyIHBlcmZlY3RBbmdsZT1bLU1hdGguUEksLU1hdGguUEkqMy80LC1NYXRoLlBJLzIsLU1hdGguUEkvNCwwLE1hdGguUEkvNCxNYXRoLlBJLzIsTWF0aC5QSSozLzQsTWF0aC5QSS80XVxyXG4gICAgICAgIHZhciBkZWx0YUFuZ2xlPVtdXHJcbiAgICAgICAgcGVyZmVjdEFuZ2xlLmZvckVhY2goKGFuZ2xlKT0+e2RlbHRhQW5nbGUucHVzaChNYXRoLmFicyhjdXJyZW50QW5nbGUtYW5nbGUpKX0pXHJcbiAgICAgICAgdmFyIGluZGV4T2ZNaW49IGRlbHRhQW5nbGUuaW5kZXhPZihNYXRoLm1pbiguLi5kZWx0YUFuZ2xlKSlcclxuICAgICAgICB2YXIgZHkgPSAoIHAyLnkgLSBwMS55ICk7XHJcbiAgICAgICAgdmFyIGR4ID0gKCBwMi54IC0gcDEueCApO1xyXG4gICAgICAgIHZhciBsPU1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcclxuICAgICAgICB2YXIgY29zdD1NYXRoLmFicyhsKk1hdGguc2luKGRlbHRhQW5nbGVbaW5kZXhPZk1pbl0pKVxyXG5cclxuICAgICAgICB2YXIgY2hvc2VuQW5nbGU9cGVyZmVjdEFuZ2xlW2luZGV4T2ZNaW5dXHJcbiAgICAgICAgdmFyIGVkZ2VMPU1hdGguYWJzKGwqTWF0aC5jb3MoZGVsdGFBbmdsZVtpbmRleE9mTWluXSkpXHJcbiAgICAgICAgdmFyIHRhcmdldFBvaW50WD1wMS54ICsgZWRnZUwqTWF0aC5jb3MoY2hvc2VuQW5nbGUpXHJcbiAgICAgICAgdmFyIHRhcmdldFBvaW50WT1wMS55ICsgZWRnZUwqTWF0aC5zaW4oY2hvc2VuQW5nbGUpXHJcblxyXG4gICAgICAgIHJldHVybiB7XCJjb3N0RGlzdGFuY2VcIjpjb3N0LFwieFwiOnRhcmdldFBvaW50WCxcInlcIjp0YXJnZXRQb2ludFksXCJhbmdsZVwiOmNob3NlbkFuZ2xlfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBtb3ZlQW5jaG9yT25EcmFnKGVkZ2UsIHR5cGUsIGluZGV4LCBwb3NpdGlvbil7XHJcbiAgICAgICAgdmFyIHByZXZQb2ludFBvc2l0aW9uPWFuY2hvclBvaW50VXRpbGl0aWVzLm9idGFpblByZXZBbmNob3JBYnNvbHV0ZVBvc2l0aW9ucyhlZGdlLHR5cGUsaW5kZXgpXHJcbiAgICAgICAgdmFyIG5leHRQb2ludFBvc2l0aW9uPWFuY2hvclBvaW50VXRpbGl0aWVzLm9idGFpbk5leHRBbmNob3JBYnNvbHV0ZVBvc2l0aW9ucyhlZGdlLHR5cGUsaW5kZXgpXHJcbiAgICAgICAgdmFyIG1vdXNlUG9zaXRpb24gPSBwb3NpdGlvbjtcclxuXHJcbiAgICAgICAgLy9jYWxjdWFsdGUgdGhlIGNvc3Qob3Igb2Zmc2V0IGRpc3RhbmNlKSB0byBmdWxmaWxsIHBlcmZlY3QgMCwgb3IgNDUgb3IgOTAgZGVncmVlIHBvc2l0aW9ucyBhY2NvcmRpbmcgdG8gcHJldiBhbmQgbmV4dCBwb3NpdGlvblxyXG4gICAgICAgIHZhciBqdWRnZVByZXY9X2NhbGNDb3N0VG9QcmVmZXJyZWRQb3NpdGlvbihwcmV2UG9pbnRQb3NpdGlvbixtb3VzZVBvc2l0aW9uKVxyXG4gICAgICAgIHZhciBqdWRnZU5leHQ9X2NhbGNDb3N0VG9QcmVmZXJyZWRQb3NpdGlvbihuZXh0UG9pbnRQb3NpdGlvbixtb3VzZVBvc2l0aW9uKVxyXG4gICAgICAgIHZhciBkZWNpc2lvbk9iaj1udWxsXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHpvb21MZXZlbD1jeS56b29tKClcclxuXHJcbiAgICAgICAgaWYgKGp1ZGdlUHJldi5jb3N0RGlzdGFuY2UgKiB6b29tTGV2ZWwgPCBvcHRzLnN0aWNreUFuY2hvclRvbGVyZW5jZVxyXG4gICAgICAgICAgJiYganVkZ2VOZXh0LmNvc3REaXN0YW5jZSAqIHpvb21MZXZlbCA+IG9wdHMuc3RpY2t5QW5jaG9yVG9sZXJlbmNlKSB7XHJcbiAgICAgICAgICAvL2Nob29zZSB0aGUgcGVyZmVjdCBhbmdsZSBwb2ludCBmcm9tIHByZXYgYW5jaG9yXHJcbiAgICAgICAgICBwb3NpdGlvbi54ID0ganVkZ2VQcmV2LnhcclxuICAgICAgICAgIHBvc2l0aW9uLnkgPSBqdWRnZVByZXYueVxyXG4gICAgICAgIH1lbHNlIGlmKGp1ZGdlUHJldi5jb3N0RGlzdGFuY2UgKiB6b29tTGV2ZWwgPiBvcHRzLnN0aWNreUFuY2hvclRvbGVyZW5jZVxyXG4gICAgICAgICAgJiYganVkZ2VOZXh0LmNvc3REaXN0YW5jZSAqIHpvb21MZXZlbCA8IG9wdHMuc3RpY2t5QW5jaG9yVG9sZXJlbmNlKXtcclxuICAgICAgICAgICAgLy9jaG9vc2UgdGhlIHBlcmZlY3QgYW5nbGUgcG9pbnQgZnJvbSBuZXh0IGFuY2hvclxyXG4gICAgICAgICAgICBwb3NpdGlvbi54ID0ganVkZ2VOZXh0LnhcclxuICAgICAgICAgICAgcG9zaXRpb24ueSA9IGp1ZGdlTmV4dC55XHJcbiAgICAgICAgfWVsc2UgaWYoanVkZ2VQcmV2LmNvc3REaXN0YW5jZSAqIHpvb21MZXZlbCA8IG9wdHMuc3RpY2t5QW5jaG9yVG9sZXJlbmNlXHJcbiAgICAgICAgICAmJiBqdWRnZU5leHQuY29zdERpc3RhbmNlICogem9vbUxldmVsIDwgb3B0cy5zdGlja3lBbmNob3JUb2xlcmVuY2Upe1xyXG4gICAgICAgICAgICAvL2NoZWNrIGlmIHRoZSB0d28gYW5nbGUgbGluZXMgYXJlIHBhcmFsbGVsIG9yIG5vdFxyXG4gICAgICAgICAgICB2YXIgYW5nbGUxPWp1ZGdlUHJldi5hbmdsZVxyXG4gICAgICAgICAgICB2YXIgYW5nbGUyPWp1ZGdlTmV4dC5hbmdsZVxyXG4gICAgICAgICAgICBpZihhbmdsZTE9PWFuZ2xlMiB8fCBNYXRoLmFicyhhbmdsZTEtYW5nbGUyKT09TWF0aC5QSSl7XHJcbiAgICAgICAgICAgICAgLy90aGVyZSB3aWxsIGJlIG5vIGludGVyc2VjdGlvbiwgc28ganVzdCBjaG9vc2UgdGhlIHBlcmZlY3QgYW5nbGUgcG9pbnQgZnJvbSBwcmV2IGFuY2hvclxyXG4gICAgICAgICAgICAgIHBvc2l0aW9uLnggPSBqdWRnZVByZXYueFxyXG4gICAgICAgICAgICAgIHBvc2l0aW9uLnkgPSBqdWRnZVByZXYueVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAvL2NhbGN1bGF0ZSB0aGUgaW50ZXJzZWN0aW9uIGFzIHBlcmZlY3QgYW5jaG9yIHBvaW50XHJcbiAgICAgICAgICAgICAgdmFyIHByZXZYID0gcHJldlBvaW50UG9zaXRpb24ueFxyXG4gICAgICAgICAgICAgIHZhciBwcmV2WSA9IHByZXZQb2ludFBvc2l0aW9uLnlcclxuICAgICAgICAgICAgICB2YXIgbmV4WCA9IG5leHRQb2ludFBvc2l0aW9uLnhcclxuICAgICAgICAgICAgICB2YXIgbmV4WSA9IG5leHRQb2ludFBvc2l0aW9uLnlcclxuICAgICAgICAgICAgICB2YXIgZng9IGp1ZGdlUHJldi54XHJcbiAgICAgICAgICAgICAgdmFyIGZ5ID0ganVkZ2VQcmV2LnlcclxuICAgICAgICAgICAgICB2YXIgc3ggPSBqdWRnZU5leHQueFxyXG4gICAgICAgICAgICAgIHZhciBzeSA9IGp1ZGdlTmV4dC55XHJcblxyXG4gICAgICAgICAgICAgIGlmKE1hdGguYWJzKGZ5LXByZXZZKTwwLjAwMDAxKXtcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uLnk9cHJldllcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uLng9KHN4LW5leFgpLyhzeS1uZXhZKSoocG9zaXRpb24ueS1uZXhZKStuZXhYXHJcbiAgICAgICAgICAgICAgfWVsc2UgaWYoTWF0aC5hYnMoc3ktbmV4WSk8MC4wMDAwMSl7XHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbi55PW5leFlcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uLng9KGZ4LXByZXZYKS8oZnktcHJldlkpKihwb3NpdGlvbi55LXByZXZZKStwcmV2WFxyXG4gICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSAoZngtcHJldlgpLyhmeS1wcmV2WSlcclxuICAgICAgICAgICAgICAgIHZhciBiID0gKHN4LW5leFgpLyhzeS1uZXhZKVxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb24ueSA9IChhKnByZXZZLXByZXZYLWIqbmV4WStuZXhYKS8oYS1iKVxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb24ueCA9IGEqKHBvc2l0aW9uLnktcHJldlkpK3ByZXZYXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB3ZWlnaHRzID0gZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10pO1xyXG4gICAgICAgIHZhciBkaXN0YW5jZXMgPSBlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddKTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgcmVsYXRpdmVBbmNob3JQb3NpdGlvbiA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb24oZWRnZSwgcG9zaXRpb24pO1xyXG4gICAgICAgIHdlaWdodHNbaW5kZXhdID0gcmVsYXRpdmVBbmNob3JQb3NpdGlvbi53ZWlnaHQ7XHJcbiAgICAgICAgZGlzdGFuY2VzW2luZGV4XSA9IHJlbGF0aXZlQW5jaG9yUG9zaXRpb24uZGlzdGFuY2U7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10sIHdlaWdodHMpO1xyXG4gICAgICAgIGVkZ2UuZGF0YShhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ10sIGRpc3RhbmNlcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGRlYm91bmNlZCBkdWUgdG8gbGFyZ2UgYW1vdXQgb2YgY2FsbHMgdG8gdGFwZHJhZ1xyXG4gICAgICB2YXIgX21vdmVBbmNob3JPbkRyYWcgPSBkZWJvdW5jZSggbW92ZUFuY2hvck9uRHJhZywgNSk7XHJcblxyXG4gICAgICB7ICBcclxuICAgICAgICBsYXN0UGFubmluZ0VuYWJsZWQgPSBjeS5wYW5uaW5nRW5hYmxlZCgpO1xyXG4gICAgICAgIGxhc3Rab29taW5nRW5hYmxlZCA9IGN5Lnpvb21pbmdFbmFibGVkKCk7XHJcbiAgICAgICAgbGFzdEJveFNlbGVjdGlvbkVuYWJsZWQgPSBjeS5ib3hTZWxlY3Rpb25FbmFibGVkKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gSW5pdGlsaXplIHRoZSBlZGdlVG9IaWdobGlnaHRCZW5kcyBhbmQgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdmFyIHNlbGVjdGVkRWRnZXMgPSBjeS5lZGdlcygnOnNlbGVjdGVkJyk7XHJcbiAgICAgICAgICB2YXIgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID0gc2VsZWN0ZWRFZGdlcy5sZW5ndGg7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmICggbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID09PSAxICkge1xyXG4gICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSBzZWxlY3RlZEVkZ2VzWzBdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjeS5iaW5kKCd6b29tIHBhbicsIGVab29tID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCAhZWRnZVRvSGlnaGxpZ2h0ICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBjeS5vZmYgaXMgbmV2ZXIgY2FsbGVkIG9uIHRoaXMgbGlzdGVuZXJcclxuICAgICAgICBjeS5vbignZGF0YScsICdlZGdlJywgIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGlmICggIWVkZ2VUb0hpZ2hsaWdodCApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZWZyZXNoRHJhd3MoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3kub24oJ3N0eWxlJywgJ2VkZ2UuZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHM6c2VsZWN0ZWQsIGVkZ2UuZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHM6c2VsZWN0ZWQnLCBlU3R5bGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7cmVmcmVzaERyYXdzKCl9LCA1MCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGN5Lm9uKCdyZW1vdmUnLCAnZWRnZScsIGVSZW1vdmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgZWRnZSA9IHRoaXM7XHJcbiAgICAgICAgICBpZiAoZWRnZS5zZWxlY3RlZCgpKSB7XHJcbiAgICAgICAgICAgIG51bWJlck9mU2VsZWN0ZWRFZGdlcyA9IG51bWJlck9mU2VsZWN0ZWRFZGdlcyAtIDE7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoZWRnZVRvSGlnaGxpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0LnJlbW92ZUNsYXNzKCdjeS1lZGdlLWVkaXRpbmctaGlnaGxpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChudW1iZXJPZlNlbGVjdGVkRWRnZXMgPT09IDEpIHtcclxuICAgICAgICAgICAgICB2YXIgc2VsZWN0ZWRFZGdlcyA9IGN5LmVkZ2VzKCc6c2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAvLyBJZiB1c2VyIHJlbW92ZXMgYWxsIHNlbGVjdGVkIGVkZ2VzIGF0IGEgc2luZ2xlIG9wZXJhdGlvbiB0aGVuIG91ciAnbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzJ1xyXG4gICAgICAgICAgICAgIC8vIG1heSBiZSBtaXNsZWFkaW5nLiBUaGVyZWZvcmUgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgbnVtYmVyIG9mIGVkZ2VzIHRvIGhpZ2hsaWdodCBpcyByZWFseSAxIGhlcmUuXHJcbiAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkRWRnZXMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSBzZWxlY3RlZEVkZ2VzWzBdO1xyXG4gICAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0LmFkZENsYXNzKCdjeS1lZGdlLWVkaXRpbmctaGlnaGxpZ2h0Jyk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGN5LmVuZEJhdGNoKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZWZyZXNoRHJhd3MoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAgY3kub24oJ2FkZCcsICdlZGdlJywgZUFkZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBlZGdlID0gdGhpcztcclxuICAgICAgICAgIGlmIChlZGdlLnNlbGVjdGVkKCkpIHtcclxuICAgICAgICAgICAgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID0gbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzICsgMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGN5LnN0YXJ0QmF0Y2goKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChlZGdlVG9IaWdobGlnaHQpIHtcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQucmVtb3ZlQ2xhc3MoJ2N5LWVkZ2UtZWRpdGluZy1oaWdobGlnaHQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKG51bWJlck9mU2VsZWN0ZWRFZGdlcyA9PT0gMSkge1xyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IGVkZ2U7XHJcbiAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0LmFkZENsYXNzKCdjeS1lZGdlLWVkaXRpbmctaGlnaGxpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjeS5lbmRCYXRjaCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmVmcmVzaERyYXdzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY3kub24oJ3NlbGVjdCcsICdlZGdlJywgZVNlbGVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBlZGdlID0gdGhpcztcclxuXHJcbiAgICAgICAgICBpZihlZGdlLnRhcmdldCgpLmNvbm5lY3RlZEVkZ2VzKCkubGVuZ3RoID09IDAgfHwgZWRnZS5zb3VyY2UoKS5jb25uZWN0ZWRFZGdlcygpLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgXHJcbiAgICAgICAgICBudW1iZXJPZlNlbGVjdGVkRWRnZXMgPSBudW1iZXJPZlNlbGVjdGVkRWRnZXMgKyAxO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKGVkZ2VUb0hpZ2hsaWdodCkge1xyXG4gICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQucmVtb3ZlQ2xhc3MoJ2N5LWVkZ2UtZWRpdGluZy1oaWdobGlnaHQnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICBpZiAobnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID09PSAxKSB7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IGVkZ2U7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodC5hZGRDbGFzcygnY3ktZWRnZS1lZGl0aW5nLWhpZ2hsaWdodCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY3kuZW5kQmF0Y2goKTtcclxuICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGN5Lm9uKCd1bnNlbGVjdCcsICdlZGdlJywgZVVuc2VsZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID0gbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzIC0gMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKGVkZ2VUb0hpZ2hsaWdodCkge1xyXG4gICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQucmVtb3ZlQ2xhc3MoJ2N5LWVkZ2UtZWRpdGluZy1oaWdobGlnaHQnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICBpZiAobnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID09PSAxKSB7XHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZEVkZ2VzID0gY3kuZWRnZXMoJzpzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gSWYgdXNlciB1bnNlbGVjdHMgYWxsIGVkZ2VzIGJ5IHRhcHBpbmcgdG8gdGhlIGNvcmUgZXRjLiB0aGVuIG91ciAnbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzJ1xyXG4gICAgICAgICAgICAvLyBtYXkgYmUgbWlzbGVhZGluZy4gVGhlcmVmb3JlIHdlIG5lZWQgdG8gY2hlY2sgaWYgdGhlIG51bWJlciBvZiBlZGdlcyB0byBoaWdobGlnaHQgaXMgcmVhbHkgMSBoZXJlLlxyXG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWRFZGdlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSBzZWxlY3RlZEVkZ2VzWzBdO1xyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodC5hZGRDbGFzcygnY3ktZWRnZS1lZGl0aW5nLWhpZ2hsaWdodCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY3kuZW5kQmF0Y2goKTtcclxuICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBtb3ZlZEFuY2hvckluZGV4O1xyXG4gICAgICAgIHZhciB0YXBTdGFydFBvcztcclxuICAgICAgICB2YXIgbW92ZWRFZGdlO1xyXG4gICAgICAgIHZhciBtb3ZlQW5jaG9yUGFyYW07XHJcbiAgICAgICAgdmFyIGNyZWF0ZUFuY2hvck9uRHJhZztcclxuICAgICAgICB2YXIgbW92ZWRFbmRQb2ludDtcclxuICAgICAgICB2YXIgZHVtbXlOb2RlO1xyXG4gICAgICAgIHZhciBkZXRhY2hlZE5vZGU7XHJcbiAgICAgICAgdmFyIG5vZGVUb0F0dGFjaDtcclxuICAgICAgICB2YXIgYW5jaG9yQ3JlYXRlZEJ5RHJhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBjeS5vbigndGFwc3RhcnQnLCBlVGFwU3RhcnQgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgdGFwU3RhcnRQb3MgPSBldmVudC5wb3NpdGlvbiB8fCBldmVudC5jeVBvc2l0aW9uO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjeS5vbigndGFwc3RhcnQnLCAnZWRnZScsIGVUYXBTdGFydE9uRWRnZSA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgdmFyIGVkZ2UgPSB0aGlzO1xyXG5cclxuICAgICAgICAgIGlmICghZWRnZVRvSGlnaGxpZ2h0IHx8IGVkZ2VUb0hpZ2hsaWdodC5pZCgpICE9PSBlZGdlLmlkKCkpIHtcclxuICAgICAgICAgICAgY3JlYXRlQW5jaG9yT25EcmFnID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgbW92ZWRFZGdlID0gZWRnZTtcclxuXHJcbiAgICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgICAgICAgIC8vIHRvIGF2b2lkIGVycm9yc1xyXG4gICAgICAgICAgaWYodHlwZSA9PT0gJ2luY29uY2x1c2l2ZScpXHJcbiAgICAgICAgICAgIHR5cGUgPSAnYmVuZCc7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHZhciBjeVBvc1ggPSB0YXBTdGFydFBvcy54O1xyXG4gICAgICAgICAgdmFyIGN5UG9zWSA9IHRhcFN0YXJ0UG9zLnk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIEdldCB3aGljaCBlbmQgcG9pbnQgaGFzIGJlZW4gY2xpY2tlZCAoU291cmNlOjAsIFRhcmdldDoxLCBOb25lOi0xKVxyXG4gICAgICAgICAgdmFyIGVuZFBvaW50ID0gZ2V0Q29udGFpbmluZ0VuZFBvaW50KGN5UG9zWCwgY3lQb3NZLCBlZGdlKTtcclxuXHJcbiAgICAgICAgICBpZihlbmRQb2ludCA9PSAwIHx8IGVuZFBvaW50ID09IDEpe1xyXG4gICAgICAgICAgICBlZGdlLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgIG1vdmVkRW5kUG9pbnQgPSBlbmRQb2ludDtcclxuICAgICAgICAgICAgZGV0YWNoZWROb2RlID0gKGVuZFBvaW50ID09IDApID8gbW92ZWRFZGdlLnNvdXJjZSgpIDogbW92ZWRFZGdlLnRhcmdldCgpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGRpc2Nvbm5lY3RlZEVuZCA9IChlbmRQb2ludCA9PSAwKSA/ICdzb3VyY2UnIDogJ3RhcmdldCc7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSByZWNvbm5lY3Rpb25VdGlsaXRpZXMuZGlzY29ubmVjdEVkZ2UobW92ZWRFZGdlLCBjeSwgZXZlbnQucmVuZGVyZWRQb3NpdGlvbiwgZGlzY29ubmVjdGVkRW5kKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGR1bW15Tm9kZSA9IHJlc3VsdC5kdW1teU5vZGU7XHJcbiAgICAgICAgICAgIG1vdmVkRWRnZSA9IHJlc3VsdC5lZGdlO1xyXG5cclxuICAgICAgICAgICAgZGlzYWJsZUdlc3R1cmVzKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgbW92ZWRBbmNob3JJbmRleCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgY3JlYXRlQW5jaG9yT25EcmFnID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBjeS5vbignZHJhZycsICdub2RlJywgZURyYWcgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgIHZhciBub2RlID0gdGhpcztcclxuICAgICAgICAgIGN5LmVkZ2VzKCkudW5zZWxlY3QoKTtcclxuICAgICAgICAgIGlmKCFub2RlLnNlbGVjdGVkKCkpe1xyXG4gICAgICAgICAgICBjeS5ub2RlcygpLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgICB9ICAgICAgICAgXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY3kub24oJ3RhcGRyYWcnLCBlVGFwRHJhZyA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgLyoqIFxyXG4gICAgICAgICAgICogaWYgdGhlcmUgaXMgYSBzZWxlY3RlZCBlZGdlIHNldCBhdXRvdW5zZWxlY3RpZnkgZmFsc2VcclxuICAgICAgICAgICAqIGZpeGVzIHRoZSBub2RlLWVkaXRpbmcgcHJvYmxlbSB3aGVyZSBub2RlcyB3b3VsZCBnZXRcclxuICAgICAgICAgICAqIHVuc2VsZWN0ZWQgYWZ0ZXIgcmVzaXplIGRyYWdcclxuICAgICAgICAgICovXHJcbiAgICAgICAgICBpZiAoY3kuZWRnZXMoJzpzZWxlY3RlZCcpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHZhciBlZGdlID0gbW92ZWRFZGdlO1xyXG5cclxuICAgICAgICAgIGlmKG1vdmVkRWRnZSAhPT0gdW5kZWZpbmVkICYmIGFuY2hvclBvaW50VXRpbGl0aWVzLmlzSWdub3JlZEVkZ2UoZWRnZSkgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgICAgICAgIGlmKGNyZWF0ZUFuY2hvck9uRHJhZyAmJiBvcHRzLmVuYWJsZUNyZWF0ZUFuY2hvck9uRHJhZyAmJiAhYW5jaG9yVG91Y2hlZCAmJiB0eXBlICE9PSAnaW5jb25jbHVzaXZlJykge1xyXG4gICAgICAgICAgICAvLyByZW1lbWJlciBzdGF0ZSBiZWZvcmUgY3JlYXRpbmcgYW5jaG9yXHJcbiAgICAgICAgICAgIHZhciB3ZWlnaHRTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddO1xyXG4gICAgICAgICAgICB2YXIgZGlzdGFuY2VTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ107XHJcblxyXG4gICAgICAgICAgICBtb3ZlQW5jaG9yUGFyYW0gPSB7XHJcbiAgICAgICAgICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgICAgICAgIHdlaWdodHM6IGVkZ2UuZGF0YSh3ZWlnaHRTdHIpID8gW10uY29uY2F0KGVkZ2UuZGF0YSh3ZWlnaHRTdHIpKSA6IFtdLFxyXG4gICAgICAgICAgICAgIGRpc3RhbmNlczogZWRnZS5kYXRhKGRpc3RhbmNlU3RyKSA/IFtdLmNvbmNhdChlZGdlLmRhdGEoZGlzdGFuY2VTdHIpKSA6IFtdXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBlZGdlLnVuc2VsZWN0KCk7XHJcblxyXG4gICAgICAgICAgICAvLyB1c2luZyB0YXBzdGFydCBwb3NpdGlvbiBmaXhlcyBidWcgb24gcXVpY2sgZHJhZ3NcclxuICAgICAgICAgICAgLy8gLS0tIFxyXG4gICAgICAgICAgICAvLyBhbHNvIG1vZGlmaWVkIGFkZEFuY2hvclBvaW50IHRvIHJldHVybiB0aGUgaW5kZXggYmVjYXVzZVxyXG4gICAgICAgICAgICAvLyBnZXRDb250YWluaW5nU2hhcGVJbmRleCBmYWlsZWQgdG8gZmluZCB0aGUgY3JlYXRlZCBhbmNob3Igb24gcXVpY2sgZHJhZ3NcclxuICAgICAgICAgICAgbW92ZWRBbmNob3JJbmRleCA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmFkZEFuY2hvclBvaW50KGVkZ2UsIHRhcFN0YXJ0UG9zKTtcclxuICAgICAgICAgICAgbW92ZWRFZGdlID0gZWRnZTtcclxuICAgICAgICAgICAgY3JlYXRlQW5jaG9yT25EcmFnID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBhbmNob3JDcmVhdGVkQnlEcmFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgZGlzYWJsZUdlc3R1cmVzKCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gaWYgdGhlIHRhcHN0YXJ0IGRpZCBub3QgaGl0IGFuIGVkZ2UgYW5kIGl0IGRpZCBub3QgaGl0IGFuIGFuY2hvclxyXG4gICAgICAgICAgaWYgKCFhbmNob3JUb3VjaGVkICYmIChtb3ZlZEVkZ2UgPT09IHVuZGVmaW5lZCB8fCBcclxuICAgICAgICAgICAgKG1vdmVkQW5jaG9ySW5kZXggPT09IHVuZGVmaW5lZCAmJiBtb3ZlZEVuZFBvaW50ID09PSB1bmRlZmluZWQpKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIGV2ZW50UG9zID0gZXZlbnQucG9zaXRpb24gfHwgZXZlbnQuY3lQb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAvLyBVcGRhdGUgZW5kIHBvaW50IGxvY2F0aW9uIChTb3VyY2U6MCwgVGFyZ2V0OjEpXHJcbiAgICAgICAgICBpZihtb3ZlZEVuZFBvaW50ICE9IC0xICYmIGR1bW15Tm9kZSl7XHJcbiAgICAgICAgICAgIGR1bW15Tm9kZS5wb3NpdGlvbihldmVudFBvcyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBjaGFuZ2UgbG9jYXRpb24gb2YgYW5jaG9yIGNyZWF0ZWQgYnkgZHJhZ1xyXG4gICAgICAgICAgZWxzZSBpZihtb3ZlZEFuY2hvckluZGV4ICE9IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgIF9tb3ZlQW5jaG9yT25EcmFnKGVkZ2UsIHR5cGUsIG1vdmVkQW5jaG9ySW5kZXgsIGV2ZW50UG9zKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGNoYW5nZSBsb2NhdGlvbiBvZiBkcmFnIGFuZCBkcm9wcGVkIGFuY2hvclxyXG4gICAgICAgICAgZWxzZSBpZihhbmNob3JUb3VjaGVkKXtcclxuXHJcbiAgICAgICAgICAgIC8vIHRoZSB0YXBTdGFydFBvcyBjaGVjayBpcyBuZWNlc3Nhcnkgd2hlbiByaWdoIGNsaWNraW5nIGFuY2hvciBwb2ludHNcclxuICAgICAgICAgICAgLy8gcmlnaHQgY2xpY2tpbmcgYW5jaG9yIHBvaW50cyB0cmlnZ2VycyBNb3VzZURvd24gZm9yIEtvbnZhLCBidXQgbm90IHRhcHN0YXJ0IGZvciBjeVxyXG4gICAgICAgICAgICAvLyB3aGVuIHRoYXQgaGFwcGVucyB0YXBTdGFydFBvcyBpcyB1bmRlZmluZWRcclxuICAgICAgICAgICAgaWYoYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXggPT09IHVuZGVmaW5lZCAmJiB0YXBTdGFydFBvcyl7XHJcbiAgICAgICAgICAgICAgYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXggPSBnZXRDb250YWluaW5nU2hhcGVJbmRleChcclxuICAgICAgICAgICAgICAgIHRhcFN0YXJ0UG9zLngsIFxyXG4gICAgICAgICAgICAgICAgdGFwU3RhcnRQb3MueSxcclxuICAgICAgICAgICAgICAgIGFuY2hvck1hbmFnZXIuZWRnZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKGFuY2hvck1hbmFnZXIudG91Y2hlZEFuY2hvckluZGV4ICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAgICAgICAgIF9tb3ZlQW5jaG9yT25EcmFnKFxyXG4gICAgICAgICAgICAgICAgYW5jaG9yTWFuYWdlci5lZGdlLFxyXG4gICAgICAgICAgICAgICAgYW5jaG9yTWFuYWdlci5lZGdlVHlwZSxcclxuICAgICAgICAgICAgICAgIGFuY2hvck1hbmFnZXIudG91Y2hlZEFuY2hvckluZGV4LFxyXG4gICAgICAgICAgICAgICAgZXZlbnRQb3NcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmKGV2ZW50LnRhcmdldCAmJiBldmVudC50YXJnZXRbMF0gJiYgZXZlbnQudGFyZ2V0LmlzTm9kZSgpKXtcclxuICAgICAgICAgICAgbm9kZVRvQXR0YWNoID0gZXZlbnQudGFyZ2V0O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBjeS5vbigndGFwZW5kJywgZVRhcEVuZCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG5cclxuICAgICAgICAgIGlmKG1vdXNlT3V0KXtcclxuICAgICAgICAgICAgY2FudmFzLmdldFN0YWdlKCkuZmlyZShcImNvbnRlbnRNb3VzZXVwXCIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBlZGdlID0gbW92ZWRFZGdlIHx8IGFuY2hvck1hbmFnZXIuZWRnZTsgXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmKCBlZGdlICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGFuY2hvck1hbmFnZXIudG91Y2hlZEFuY2hvckluZGV4O1xyXG4gICAgICAgICAgICBpZiggaW5kZXggIT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgIHZhciBzdGFydFggPSBlZGdlLnNvdXJjZSgpLnBvc2l0aW9uKCd4Jyk7XHJcbiAgICAgICAgICAgICAgdmFyIHN0YXJ0WSA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oJ3knKTtcclxuICAgICAgICAgICAgICB2YXIgZW5kWCA9IGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oJ3gnKTtcclxuICAgICAgICAgICAgICB2YXIgZW5kWSA9IGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oJ3knKTtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICB2YXIgYW5jaG9yTGlzdCA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpO1xyXG4gICAgICAgICAgICAgIHZhciBhbGxBbmNob3JzID0gW3N0YXJ0WCwgc3RhcnRZXS5jb25jYXQoYW5jaG9yTGlzdCkuY29uY2F0KFtlbmRYLCBlbmRZXSk7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgdmFyIGFuY2hvckluZGV4ID0gaW5kZXggKyAxO1xyXG4gICAgICAgICAgICAgIHZhciBwcmVJbmRleCA9IGFuY2hvckluZGV4IC0gMTtcclxuICAgICAgICAgICAgICB2YXIgcG9zSW5kZXggPSBhbmNob3JJbmRleCArIDE7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgdmFyIGFuY2hvciA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGFsbEFuY2hvcnNbMiAqIGFuY2hvckluZGV4XSxcclxuICAgICAgICAgICAgICAgIHk6IGFsbEFuY2hvcnNbMiAqIGFuY2hvckluZGV4ICsgMV1cclxuICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciBwcmVBbmNob3JQb2ludCA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGFsbEFuY2hvcnNbMiAqIHByZUluZGV4XSxcclxuICAgICAgICAgICAgICAgIHk6IGFsbEFuY2hvcnNbMiAqIHByZUluZGV4ICsgMV1cclxuICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciBwb3NBbmNob3JQb2ludCA9IHtcclxuICAgICAgICAgICAgICAgIHg6IGFsbEFuY2hvcnNbMiAqIHBvc0luZGV4XSxcclxuICAgICAgICAgICAgICAgIHk6IGFsbEFuY2hvcnNbMiAqIHBvc0luZGV4ICsgMV1cclxuICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciBuZWFyVG9MaW5lO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIGlmKCAoIGFuY2hvci54ID09PSBwcmVBbmNob3JQb2ludC54ICYmIGFuY2hvci55ID09PSBwcmVBbmNob3JQb2ludC55ICkgfHwgKCBhbmNob3IueCA9PT0gcHJlQW5jaG9yUG9pbnQueCAmJiBhbmNob3IueSA9PT0gcHJlQW5jaG9yUG9pbnQueSApICkge1xyXG4gICAgICAgICAgICAgICAgbmVhclRvTGluZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIG0xID0gKCBwcmVBbmNob3JQb2ludC55IC0gcG9zQW5jaG9yUG9pbnQueSApIC8gKCBwcmVBbmNob3JQb2ludC54IC0gcG9zQW5jaG9yUG9pbnQueCApO1xyXG4gICAgICAgICAgICAgICAgdmFyIG0yID0gLTEgLyBtMTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgIHNyY1BvaW50OiBwcmVBbmNob3JQb2ludCxcclxuICAgICAgICAgICAgICAgICAgdGd0UG9pbnQ6IHBvc0FuY2hvclBvaW50LFxyXG4gICAgICAgICAgICAgICAgICBtMTogbTEsXHJcbiAgICAgICAgICAgICAgICAgIG0yOiBtMlxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudEludGVyc2VjdGlvbiA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEludGVyc2VjdGlvbihlZGdlLCBhbmNob3IsIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzKTtcclxuICAgICAgICAgICAgICAgIHZhciBkaXN0ID0gTWF0aC5zcXJ0KCBNYXRoLnBvdyggKGFuY2hvci54IC0gY3VycmVudEludGVyc2VjdGlvbi54KSwgMiApIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICArIE1hdGgucG93KCAoYW5jaG9yLnkgLSBjdXJyZW50SW50ZXJzZWN0aW9uLnkpLCAyICkpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyByZW1vdmUgdGhlIGJlbmQgcG9pbnQgaWYgc2VnbWVudCBlZGdlIGJlY29tZXMgc3RyYWlnaHRcclxuICAgICAgICAgICAgICAgIHZhciB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcbiAgICAgICAgICAgICAgICBpZiggKHR5cGUgPT09ICdiZW5kJyAmJiBkaXN0ICA8IG9wdGlvbnMoKS5iZW5kUmVtb3ZhbFNlbnNpdGl2aXR5KSkge1xyXG4gICAgICAgICAgICAgICAgICBuZWFyVG9MaW5lID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICBpZihvcHRzLmVuYWJsZVJlbW92ZUFuY2hvck1pZE9mTmVhckxpbmUgJiYgbmVhclRvTGluZSApXHJcbiAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMucmVtb3ZlQW5jaG9yKGVkZ2UsIGluZGV4KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZihkdW1teU5vZGUgIT0gdW5kZWZpbmVkICYmIChtb3ZlZEVuZFBvaW50ID09IDAgfHwgbW92ZWRFbmRQb2ludCA9PSAxKSApe1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciBuZXdOb2RlID0gZGV0YWNoZWROb2RlO1xyXG4gICAgICAgICAgICAgIHZhciBpc1ZhbGlkID0gJ3ZhbGlkJztcclxuICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSAobW92ZWRFbmRQb2ludCA9PSAwKSA/ICdzb3VyY2UnIDogJ3RhcmdldCc7XHJcblxyXG4gICAgICAgICAgICAgIC8vIHZhbGlkYXRlIGVkZ2UgcmVjb25uZWN0aW9uXHJcbiAgICAgICAgICAgICAgaWYobm9kZVRvQXR0YWNoKXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdTb3VyY2UgPSAobW92ZWRFbmRQb2ludCA9PSAwKSA/IG5vZGVUb0F0dGFjaCA6IGVkZ2Uuc291cmNlKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3VGFyZ2V0ID0gKG1vdmVkRW5kUG9pbnQgPT0gMSkgPyBub2RlVG9BdHRhY2ggOiBlZGdlLnRhcmdldCgpO1xyXG4gICAgICAgICAgICAgICAgaWYodHlwZW9mIHZhbGlkYXRlRWRnZSA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICAgICAgICBpc1ZhbGlkID0gdmFsaWRhdGVFZGdlKGVkZ2UsIG5ld1NvdXJjZSwgbmV3VGFyZ2V0KTtcclxuICAgICAgICAgICAgICAgIG5ld05vZGUgPSAoaXNWYWxpZCA9PT0gJ3ZhbGlkJykgPyBub2RlVG9BdHRhY2ggOiBkZXRhY2hlZE5vZGU7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICB2YXIgbmV3U291cmNlID0gKG1vdmVkRW5kUG9pbnQgPT0gMCkgPyBuZXdOb2RlIDogZWRnZS5zb3VyY2UoKTtcclxuICAgICAgICAgICAgICB2YXIgbmV3VGFyZ2V0ID0gKG1vdmVkRW5kUG9pbnQgPT0gMSkgPyBuZXdOb2RlIDogZWRnZS50YXJnZXQoKTtcclxuICAgICAgICAgICAgICBlZGdlID0gcmVjb25uZWN0aW9uVXRpbGl0aWVzLmNvbm5lY3RFZGdlKGVkZ2UsIGRldGFjaGVkTm9kZSwgbG9jYXRpb24pO1xyXG5cclxuICAgICAgICAgICAgICBpZihkZXRhY2hlZE5vZGUuaWQoKSAhPT0gbmV3Tm9kZS5pZCgpKXtcclxuICAgICAgICAgICAgICAgIC8vIHVzZSBnaXZlbiBoYW5kbGVSZWNvbm5lY3RFZGdlIGZ1bmN0aW9uIFxyXG4gICAgICAgICAgICAgICAgaWYodHlwZW9mIGhhbmRsZVJlY29ubmVjdEVkZ2UgPT09ICdmdW5jdGlvbicpe1xyXG4gICAgICAgICAgICAgICAgICB2YXIgcmVjb25uZWN0ZWRFZGdlID0gaGFuZGxlUmVjb25uZWN0RWRnZShuZXdTb3VyY2UuaWQoKSwgbmV3VGFyZ2V0LmlkKCksIGVkZ2UuZGF0YSgpKTtcclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIGlmKHJlY29ubmVjdGVkRWRnZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVjb25uZWN0aW9uVXRpbGl0aWVzLmNvcHlFZGdlKGVkZ2UsIHJlY29ubmVjdGVkRWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaW5pdEFuY2hvclBvaW50cyhvcHRpb25zKCkuYmVuZFBvc2l0aW9uc0Z1bmN0aW9uLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMoKS5jb250cm9sUG9zaXRpb25zRnVuY3Rpb24sIFtyZWNvbm5lY3RlZEVkZ2VdKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgaWYocmVjb25uZWN0ZWRFZGdlICYmIG9wdGlvbnMoKS51bmRvYWJsZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgIG5ld0VkZ2U6IHJlY29ubmVjdGVkRWRnZSxcclxuICAgICAgICAgICAgICAgICAgICAgIG9sZEVkZ2U6IGVkZ2VcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGN5LnVuZG9SZWRvKCkuZG8oJ3JlbW92ZVJlY29ubmVjdGVkRWRnZScsIHBhcmFtcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHJlY29ubmVjdGVkRWRnZTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBlbHNlIGlmKHJlY29ubmVjdGVkRWRnZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgY3kucmVtb3ZlKGVkZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVkZ2UgPSByZWNvbm5lY3RlZEVkZ2U7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICAgIHZhciBsb2MgPSAobW92ZWRFbmRQb2ludCA9PSAwKSA/IHtzb3VyY2U6IG5ld05vZGUuaWQoKX0gOiB7dGFyZ2V0OiBuZXdOb2RlLmlkKCl9O1xyXG4gICAgICAgICAgICAgICAgICB2YXIgb2xkTG9jID0gKG1vdmVkRW5kUG9pbnQgPT0gMCkgPyB7c291cmNlOiBkZXRhY2hlZE5vZGUuaWQoKX0gOiB7dGFyZ2V0OiBkZXRhY2hlZE5vZGUuaWQoKX07XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICBpZihvcHRpb25zKCkudW5kb2FibGUgJiYgbmV3Tm9kZS5pZCgpICE9PSBkZXRhY2hlZE5vZGUuaWQoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJhbSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGVkZ2U6IGVkZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbjogbG9jLFxyXG4gICAgICAgICAgICAgICAgICAgICAgb2xkTG9jOiBvbGRMb2NcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBjeS51bmRvUmVkbygpLmRvKCdyZWNvbm5lY3RFZGdlJywgcGFyYW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGVkZ2UgPSByZXN1bHQuZWRnZTtcclxuICAgICAgICAgICAgICAgICAgICAvL2VkZ2Uuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgLy8gaW52YWxpZCBlZGdlIHJlY29ubmVjdGlvbiBjYWxsYmFja1xyXG4gICAgICAgICAgICAgIGlmKGlzVmFsaWQgIT09ICd2YWxpZCcgJiYgdHlwZW9mIGFjdE9uVW5zdWNjZXNzZnVsUmVjb25uZWN0aW9uID09PSAnZnVuY3Rpb24nKXtcclxuICAgICAgICAgICAgICAgIGFjdE9uVW5zdWNjZXNzZnVsUmVjb25uZWN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVkZ2Uuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgY3kucmVtb3ZlKGR1bW15Tm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHZhciB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgICAgICAgLy8gdG8gYXZvaWQgZXJyb3JzXHJcbiAgICAgICAgICBpZih0eXBlID09PSAnaW5jb25jbHVzaXZlJyl7XHJcbiAgICAgICAgICAgIHR5cGUgPSAnYmVuZCc7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYoYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXggPT09IHVuZGVmaW5lZCAmJiAhYW5jaG9yQ3JlYXRlZEJ5RHJhZyl7XHJcbiAgICAgICAgICAgIG1vdmVBbmNob3JQYXJhbSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgd2VpZ2h0U3RyID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXTtcclxuICAgICAgICAgIGlmIChlZGdlICE9PSB1bmRlZmluZWQgJiYgbW92ZUFuY2hvclBhcmFtICE9PSB1bmRlZmluZWQgJiYgXHJcbiAgICAgICAgICAgIChlZGdlLmRhdGEod2VpZ2h0U3RyKSA/IGVkZ2UuZGF0YSh3ZWlnaHRTdHIpLnRvU3RyaW5nKCkgOiBudWxsKSAhPSBtb3ZlQW5jaG9yUGFyYW0ud2VpZ2h0cy50b1N0cmluZygpKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBhbmNob3IgY3JlYXRlZCBmcm9tIGRyYWdcclxuICAgICAgICAgICAgaWYoYW5jaG9yQ3JlYXRlZEJ5RHJhZyl7XHJcbiAgICAgICAgICAgIGVkZ2Uuc2VsZWN0KCk7IFxyXG5cclxuICAgICAgICAgICAgLy8gc3RvcHMgdGhlIHVuYnVuZGxlZCBiZXppZXIgZWRnZXMgZnJvbSBiZWluZyB1bnNlbGVjdGVkXHJcbiAgICAgICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYob3B0aW9ucygpLnVuZG9hYmxlKSB7XHJcbiAgICAgICAgICAgICAgY3kudW5kb1JlZG8oKS5kbygnY2hhbmdlQW5jaG9yUG9pbnRzJywgbW92ZUFuY2hvclBhcmFtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBtb3ZlZEFuY2hvckluZGV4ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgbW92ZWRFZGdlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgbW92ZUFuY2hvclBhcmFtID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgY3JlYXRlQW5jaG9yT25EcmFnID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgbW92ZWRFbmRQb2ludCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIGR1bW15Tm9kZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIGRldGFjaGVkTm9kZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIG5vZGVUb0F0dGFjaCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIHRhcFN0YXJ0UG9zID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgYW5jaG9yQ3JlYXRlZEJ5RHJhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIGFuY2hvck1hbmFnZXIudG91Y2hlZEFuY2hvckluZGV4ID0gdW5kZWZpbmVkOyBcclxuXHJcbiAgICAgICAgICByZXNldEdlc3R1cmVzKCk7XHJcbiAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7cmVmcmVzaERyYXdzKCl9LCA1MCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vVmFyaWFibGVzIHVzZWQgZm9yIHN0YXJ0aW5nIGFuZCBlbmRpbmcgdGhlIG1vdmVtZW50IG9mIGFuY2hvciBwb2ludHMgd2l0aCBhcnJvd3NcclxuICAgICAgICB2YXIgbW92ZWFuY2hvcnBhcmFtO1xyXG4gICAgICAgIHZhciBmaXJzdEFuY2hvcjtcclxuICAgICAgICB2YXIgZWRnZUNvbnRhaW5pbmdGaXJzdEFuY2hvcjtcclxuICAgICAgICB2YXIgZmlyc3RBbmNob3JQb2ludEZvdW5kO1xyXG4gICAgICAgIGN5Lm9uKFwiZWRnZWVkaXRpbmcubW92ZXN0YXJ0XCIsIGZ1bmN0aW9uIChlLCBlZGdlcykge1xyXG4gICAgICAgICAgICBmaXJzdEFuY2hvclBvaW50Rm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKGVkZ2VzWzBdICE9IHVuZGVmaW5lZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiggZWRnZSApe1xyXG4gICAgICAgICAgICAgICAgICBpZiAoYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSkgIT0gdW5kZWZpbmVkICYmICFmaXJzdEFuY2hvclBvaW50Rm91bmQpXHJcbiAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGZpcnN0QW5jaG9yID0geyB4OiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRBbmNob3JzQXNBcnJheShlZGdlKVswXSwgeTogYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSlbMV19O1xyXG4gICAgICAgICAgICAgICAgICAgICAgbW92ZWFuY2hvcnBhcmFtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0VGltZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdEFuY2hvclBvc2l0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGZpcnN0QW5jaG9yLngsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IGZpcnN0QW5jaG9yLnlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVkZ2VzOiBlZGdlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgIGVkZ2VDb250YWluaW5nRmlyc3RBbmNob3IgPSBlZGdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgZmlyc3RBbmNob3JQb2ludEZvdW5kID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3kub24oXCJlZGdlZWRpdGluZy5tb3ZlZW5kXCIsIGZ1bmN0aW9uIChlLCBlZGdlcykge1xyXG4gICAgICAgICAgICBpZiAobW92ZWFuY2hvcnBhcmFtICE9IHVuZGVmaW5lZClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluaXRpYWxQb3MgPSBtb3ZlYW5jaG9ycGFyYW0uZmlyc3RBbmNob3JQb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIHZhciBtb3ZlZEZpcnN0QW5jaG9yID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHg6IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2VDb250YWluaW5nRmlyc3RBbmNob3IpWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHk6IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2VDb250YWluaW5nRmlyc3RBbmNob3IpWzFdXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBtb3ZlYW5jaG9ycGFyYW0ucG9zaXRpb25EaWZmID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHg6IC1tb3ZlZEZpcnN0QW5jaG9yLnggKyBpbml0aWFsUG9zLngsXHJcbiAgICAgICAgICAgICAgICAgICAgeTogLW1vdmVkRmlyc3RBbmNob3IueSArIGluaXRpYWxQb3MueVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBtb3ZlYW5jaG9ycGFyYW0uZmlyc3RBbmNob3JQb3NpdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihvcHRpb25zKCkudW5kb2FibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBjeS51bmRvUmVkbygpLmRvKFwibW92ZUFuY2hvclBvaW50c1wiLCBtb3ZlYW5jaG9ycGFyYW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIG1vdmVhbmNob3JwYXJhbSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjeS5vbignY3h0dGFwJywgZUN4dFRhcCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgIHZhciB0YXJnZXRJc0VkZ2UgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHRhcmdldElzRWRnZSA9IHRhcmdldC5pc0VkZ2UoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGNhdGNoKGVycil7XHJcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgaGVyZSBqdXN0IHRvIHN1cHByZXNzIHRoZSBlcnJvclxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBlZGdlLCB0eXBlO1xyXG4gICAgICAgICAgaWYodGFyZ2V0SXNFZGdlKXtcclxuICAgICAgICAgICAgZWRnZSA9IHRhcmdldDtcclxuICAgICAgICAgICAgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgZWRnZSA9IGFuY2hvck1hbmFnZXIuZWRnZTsgICAgICAgICAgXHJcbiAgICAgICAgICAgIHR5cGUgPSBhbmNob3JNYW5hZ2VyLmVkZ2VUeXBlO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBtZW51cyA9IGN5LmNvbnRleHRNZW51cygnZ2V0Jyk7IC8vIGdldCBjb250ZXh0IG1lbnVzIGluc3RhbmNlXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmKCFlZGdlVG9IaWdobGlnaHQgfHwgZWRnZVRvSGlnaGxpZ2h0LmlkKCkgIT0gZWRnZS5pZCgpIHx8IGFuY2hvclBvaW50VXRpbGl0aWVzLmlzSWdub3JlZEVkZ2UoZWRnZSkgfHxcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgIT09IGVkZ2UpIHtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShhZGRCZW5kUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgY3lQb3MgPSBldmVudC5wb3NpdGlvbiB8fCBldmVudC5jeVBvc2l0aW9uO1xyXG4gICAgICAgICAgdmFyIHNlbGVjdGVkSW5kZXggPSBnZXRDb250YWluaW5nU2hhcGVJbmRleChjeVBvcy54LCBjeVBvcy55LCBlZGdlKTtcclxuICAgICAgICAgIC8vIG5vdCBjbGlja2VkIG9uIGFuIGFuY2hvclxyXG4gICAgICAgICAgaWYgKHNlbGVjdGVkSW5kZXggPT0gLTEpIHtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShyZW1vdmVDb250cm9sUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICBpZih0eXBlID09PSAnY29udHJvbCcgJiYgdGFyZ2V0SXNFZGdlKXtcclxuICAgICAgICAgICAgICBtZW51cy5zaG93TWVudUl0ZW0oYWRkQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0oYWRkQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHR5cGUgPT09ICdiZW5kJyAmJiB0YXJnZXRJc0VkZ2Upe1xyXG4gICAgICAgICAgICAgIG1lbnVzLnNob3dNZW51SXRlbShhZGRCZW5kUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShhZGRDb250cm9sUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHRhcmdldElzRWRnZSl7XHJcbiAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKGFkZEJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZEJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuY3VycmVudEN0eFBvcyA9IGN5UG9zO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gY2xpY2tlZCBvbiBhbiBhbmNob3JcclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0oYWRkQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIGlmKHR5cGUgPT09ICdjb250cm9sJyl7XHJcbiAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKHJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgaWYgKG9wdHMuZW5hYmxlTXVsdGlwbGVBbmNob3JSZW1vdmFsT3B0aW9uICYmIFxyXG4gICAgICAgICAgICAgICAgICBlZGdlLmhhc0NsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzbXVsdGlwbGVjb250cm9scG9pbnRzJykpIHtcclxuICAgICAgICAgICAgICAgIG1lbnVzLnNob3dNZW51SXRlbShyZW1vdmVBbGxDb250cm9sUG9pbnRDdHhNZW51SWQpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHR5cGUgPT09ICdiZW5kJyl7XHJcbiAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKHJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQWxsQ29udHJvbFBvaW50Q3R4TWVudUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhbmNob3JQb2ludFV0aWxpdGllcy5jdXJyZW50QW5jaG9ySW5kZXggPSBzZWxlY3RlZEluZGV4O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLmN1cnJlbnRDdHhFZGdlID0gZWRnZTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBjeS5vbignY3llZGdlZWRpdGluZy5jaGFuZ2VBbmNob3JQb2ludHMnLCAnZWRnZScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgdmFyIGVkZ2UgPSB0aGlzO1xyXG4gICAgICAgICAgY3kuc3RhcnRCYXRjaCgpO1xyXG4gICAgICAgICAgY3kuZWRnZXMoKS51bnNlbGVjdCgpOyBcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgIC8vIExpc3RlbmVyIGRlZmluZWQgaW4gb3RoZXIgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAvLyBNaWdodCBoYXZlIGNvbXBhdGliaWxpdHkgaXNzdWVzIGFmdGVyIHRoZSB1bmJ1bmRsZWQgYmV6aWVyICAgIFxyXG4gICAgICAgICAgY3kudHJpZ2dlcignYmVuZFBvaW50TW92ZW1lbnQnKTsgICAgXHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGN5LmVuZEJhdGNoKCk7ICAgICAgICAgIFxyXG4gICAgICAgICAgcmVmcmVzaERyYXdzKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICBcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIHNlbGVjdGVkRWRnZXM7XHJcbiAgICAgIHZhciBhbmNob3JzTW92aW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAvLyB0cmFjayBhcnJvdyBrZXkgcHJlc3NlcywgZGVmYXVsdCBmYWxzZVxyXG4gICAgICAvLyBldmVudC5rZXlDb2RlIG5vcm1hbGx5IHJldHVybnMgbnVtYmVyXHJcbiAgICAgIC8vIGJ1dCBKUyB3aWxsIGNvbnZlcnQgdG8gc3RyaW5nIGFueXdheVxyXG4gICAgICB2YXIga2V5cyA9IHtcclxuICAgICAgICAnMzcnOiBmYWxzZSxcclxuICAgICAgICAnMzgnOiBmYWxzZSxcclxuICAgICAgICAnMzknOiBmYWxzZSxcclxuICAgICAgICAnNDAnOiBmYWxzZVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgZnVuY3Rpb24ga2V5RG93bihlKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHNob3VsZE1vdmUgPSB0eXBlb2Ygb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cyA9PT0gJ2Z1bmN0aW9uJ1xyXG4gICAgICAgICAgICAgID8gb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cygpIDogb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cztcclxuXHJcbiAgICAgICAgICBpZiAoIXNob3VsZE1vdmUpIHtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy9DaGVja3MgaWYgdGhlIHRhZ25hbWUgaXMgdGV4dGFyZWEgb3IgaW5wdXRcclxuICAgICAgICAgIHZhciB0biA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQudGFnTmFtZTtcclxuICAgICAgICAgIGlmICh0biAhPSBcIlRFWFRBUkVBXCIgJiYgdG4gIT0gXCJJTlBVVFwiKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHN3aXRjaChlLmtleUNvZGUpe1xyXG4gICAgICAgICAgICAgICAgICBjYXNlIDM3OiBjYXNlIDM5OiBjYXNlIDM4OiAgY2FzZSA0MDogLy8gQXJyb3cga2V5c1xyXG4gICAgICAgICAgICAgICAgICBjYXNlIDMyOiBlLnByZXZlbnREZWZhdWx0KCk7IGJyZWFrOyAvLyBTcGFjZVxyXG4gICAgICAgICAgICAgICAgICBkZWZhdWx0OiBicmVhazsgLy8gZG8gbm90IGJsb2NrIG90aGVyIGtleXNcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKGUua2V5Q29kZSA8ICczNycgfHwgZS5rZXlDb2RlID4gJzQwJykge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGtleXNbZS5rZXlDb2RlXSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgIC8vQ2hlY2tzIGlmIG9ubHkgZWRnZXMgYXJlIHNlbGVjdGVkIChub3QgYW55IG5vZGUpIGFuZCBpZiBvbmx5IDEgZWRnZSBpcyBzZWxlY3RlZFxyXG4gICAgICAgICAgICAgIC8vSWYgdGhlIHNlY29uZCBjaGVja2luZyBpcyByZW1vdmVkIHRoZSBhbmNob3JzIG9mIG11bHRpcGxlIGVkZ2VzIHdvdWxkIG1vdmVcclxuICAgICAgICAgICAgICBpZiAoY3kuZWRnZXMoXCI6c2VsZWN0ZWRcIikubGVuZ3RoICE9IGN5LmVsZW1lbnRzKFwiOnNlbGVjdGVkXCIpLmxlbmd0aCB8fCBjeS5lZGdlcyhcIjpzZWxlY3RlZFwiKS5sZW5ndGggIT0gMSlcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmICghYW5jaG9yc01vdmluZylcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRWRnZXMgPSBjeS5lZGdlcygnOnNlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgIGN5LnRyaWdnZXIoXCJlZGdlZWRpdGluZy5tb3Zlc3RhcnRcIiwgW3NlbGVjdGVkRWRnZXNdKTtcclxuICAgICAgICAgICAgICAgICAgYW5jaG9yc01vdmluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHZhciBtb3ZlU3BlZWQgPSAzO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIC8vIGRvZXNuJ3QgbWFrZSBzZW5zZSBpZiBhbHQgYW5kIHNoaWZ0IGJvdGggcHJlc3NlZFxyXG4gICAgICAgICAgICAgIGlmKGUuYWx0S2V5ICYmIGUuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSBpZiAoZS5hbHRLZXkpIHtcclxuICAgICAgICAgICAgICAgIG1vdmVTcGVlZCA9IDE7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGVsc2UgaWYgKGUuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAgICAgIG1vdmVTcGVlZCA9IDEwO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgdmFyIHVwQXJyb3dDb2RlID0gMzg7XHJcbiAgICAgICAgICAgICAgdmFyIGRvd25BcnJvd0NvZGUgPSA0MDtcclxuICAgICAgICAgICAgICB2YXIgbGVmdEFycm93Q29kZSA9IDM3O1xyXG4gICAgICAgICAgICAgIHZhciByaWdodEFycm93Q29kZSA9IDM5O1xyXG5cclxuICAgICAgICAgICAgICB2YXIgZHggPSAwO1xyXG4gICAgICAgICAgICAgIHZhciBkeSA9IDA7XHJcblxyXG4gICAgICAgICAgICAgIGR4ICs9IGtleXNbcmlnaHRBcnJvd0NvZGVdID8gbW92ZVNwZWVkIDogMDtcclxuICAgICAgICAgICAgICBkeCAtPSBrZXlzW2xlZnRBcnJvd0NvZGVdID8gbW92ZVNwZWVkIDogMDtcclxuICAgICAgICAgICAgICBkeSArPSBrZXlzW2Rvd25BcnJvd0NvZGVdID8gbW92ZVNwZWVkIDogMDtcclxuICAgICAgICAgICAgICBkeSAtPSBrZXlzW3VwQXJyb3dDb2RlXSA/IG1vdmVTcGVlZCA6IDA7XHJcblxyXG4gICAgICAgICAgICAgIG1vdmVBbmNob3JQb2ludHMoe3g6ZHgsIHk6ZHl9LCBzZWxlY3RlZEVkZ2VzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBmdW5jdGlvbiBrZXlVcChlKSB7XHJcblxyXG4gICAgICAgICAgaWYgKGUua2V5Q29kZSA8ICczNycgfHwgZS5rZXlDb2RlID4gJzQwJykge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIGtleXNbZS5rZXlDb2RlXSA9IGZhbHNlO1xyXG4gICAgICAgICAgdmFyIHNob3VsZE1vdmUgPSB0eXBlb2Ygb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cyA9PT0gJ2Z1bmN0aW9uJ1xyXG4gICAgICAgICAgICAgID8gb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cygpIDogb3B0aW9ucygpLm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cztcclxuXHJcbiAgICAgICAgICBpZiAoIXNob3VsZE1vdmUpIHtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY3kudHJpZ2dlcihcImVkZ2VlZGl0aW5nLm1vdmVlbmRcIiwgW3NlbGVjdGVkRWRnZXNdKTtcclxuICAgICAgICAgIHNlbGVjdGVkRWRnZXMgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBhbmNob3JzTW92aW5nID0gZmFsc2U7XHJcblxyXG4gICAgICB9XHJcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsa2V5RG93biwgdHJ1ZSk7XHJcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLGtleVVwLCB0cnVlKTtcclxuXHJcbiAgICAgICRjb250YWluZXIuZGF0YSgnY3llZGdlZWRpdGluZycsIGRhdGEpO1xyXG4gICAgfSxcclxuICAgIHVuYmluZDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN5Lm9mZigncmVtb3ZlJywgJ25vZGUnLCBlUmVtb3ZlKVxyXG4gICAgICAgICAgLm9mZignYWRkJywgJ25vZGUnLCBlQWRkKVxyXG4gICAgICAgICAgLm9mZignc3R5bGUnLCAnZWRnZS5lZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50czpzZWxlY3RlZCwgZWRnZS5lZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50czpzZWxlY3RlZCcsIGVTdHlsZSlcclxuICAgICAgICAgIC5vZmYoJ3NlbGVjdCcsICdlZGdlJywgZVNlbGVjdClcclxuICAgICAgICAgIC5vZmYoJ3Vuc2VsZWN0JywgJ2VkZ2UnLCBlVW5zZWxlY3QpXHJcbiAgICAgICAgICAub2ZmKCd0YXBzdGFydCcsIGVUYXBTdGFydClcclxuICAgICAgICAgIC5vZmYoJ3RhcHN0YXJ0JywgJ2VkZ2UnLCBlVGFwU3RhcnRPbkVkZ2UpXHJcbiAgICAgICAgICAub2ZmKCd0YXBkcmFnJywgZVRhcERyYWcpXHJcbiAgICAgICAgICAub2ZmKCd0YXBlbmQnLCBlVGFwRW5kKVxyXG4gICAgICAgICAgLm9mZignY3h0dGFwJywgZUN4dFRhcClcclxuICAgICAgICAgIC5vZmYoJ2RyYWcnLCAnbm9kZScsZURyYWcpO1xyXG5cclxuICAgICAgICBjeS51bmJpbmQoXCJ6b29tIHBhblwiLCBlWm9vbSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgaWYgKGZ1bmN0aW9uc1tmbl0pIHtcclxuICAgIHJldHVybiBmdW5jdGlvbnNbZm5dLmFwcGx5KCQoY3kuY29udGFpbmVyKCkpLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBmbiA9PSAnb2JqZWN0JyB8fCAhZm4pIHtcclxuICAgIHJldHVybiBmdW5jdGlvbnMuaW5pdC5hcHBseSgkKGN5LmNvbnRhaW5lcigpKSwgYXJndW1lbnRzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgJC5lcnJvcignTm8gc3VjaCBmdW5jdGlvbiBgJyArIGZuICsgJ2AgZm9yIGN5dG9zY2FwZS5qcy1lZGdlLWVkaXRpbmcnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiAkKHRoaXMpO1xyXG59O1xyXG4iLCJ2YXIgZGVib3VuY2UgPSAoZnVuY3Rpb24gKCkge1xyXG4gIC8qKlxyXG4gICAqIGxvZGFzaCAzLjEuMSAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cclxuICAgKiBCdWlsZDogYGxvZGFzaCBtb2Rlcm4gbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXHJcbiAgICogQ29weXJpZ2h0IDIwMTItMjAxNSBUaGUgRG9qbyBGb3VuZGF0aW9uIDxodHRwOi8vZG9qb2ZvdW5kYXRpb24ub3JnLz5cclxuICAgKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxyXG4gICAqIENvcHlyaWdodCAyMDA5LTIwMTUgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcclxuICAgKiBBdmFpbGFibGUgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxyXG4gICAqL1xyXG4gIC8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXHJcbiAgdmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcclxuXHJcbiAgLyogTmF0aXZlIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cclxuICB2YXIgbmF0aXZlTWF4ID0gTWF0aC5tYXgsXHJcbiAgICAgICAgICBuYXRpdmVOb3cgPSBEYXRlLm5vdztcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0aGF0IGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgVW5peCBlcG9jaFxyXG4gICAqICgxIEphbnVhcnkgMTk3MCAwMDowMDowMCBVVEMpLlxyXG4gICAqXHJcbiAgICogQHN0YXRpY1xyXG4gICAqIEBtZW1iZXJPZiBfXHJcbiAgICogQGNhdGVnb3J5IERhdGVcclxuICAgKiBAZXhhbXBsZVxyXG4gICAqXHJcbiAgICogXy5kZWZlcihmdW5jdGlvbihzdGFtcCkge1xyXG4gICAqICAgY29uc29sZS5sb2coXy5ub3coKSAtIHN0YW1wKTtcclxuICAgKiB9LCBfLm5vdygpKTtcclxuICAgKiAvLyA9PiBsb2dzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGl0IHRvb2sgZm9yIHRoZSBkZWZlcnJlZCBmdW5jdGlvbiB0byBiZSBpbnZva2VkXHJcbiAgICovXHJcbiAgdmFyIG5vdyA9IG5hdGl2ZU5vdyB8fCBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIGRlYm91bmNlZCBmdW5jdGlvbiB0aGF0IGRlbGF5cyBpbnZva2luZyBgZnVuY2AgdW50aWwgYWZ0ZXIgYHdhaXRgXHJcbiAgICogbWlsbGlzZWNvbmRzIGhhdmUgZWxhcHNlZCBzaW5jZSB0aGUgbGFzdCB0aW1lIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gd2FzXHJcbiAgICogaW52b2tlZC4gVGhlIGRlYm91bmNlZCBmdW5jdGlvbiBjb21lcyB3aXRoIGEgYGNhbmNlbGAgbWV0aG9kIHRvIGNhbmNlbFxyXG4gICAqIGRlbGF5ZWQgaW52b2NhdGlvbnMuIFByb3ZpZGUgYW4gb3B0aW9ucyBvYmplY3QgdG8gaW5kaWNhdGUgdGhhdCBgZnVuY2BcclxuICAgKiBzaG91bGQgYmUgaW52b2tlZCBvbiB0aGUgbGVhZGluZyBhbmQvb3IgdHJhaWxpbmcgZWRnZSBvZiB0aGUgYHdhaXRgIHRpbWVvdXQuXHJcbiAgICogU3Vic2VxdWVudCBjYWxscyB0byB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBsYXN0XHJcbiAgICogYGZ1bmNgIGludm9jYXRpb24uXHJcbiAgICpcclxuICAgKiAqKk5vdGU6KiogSWYgYGxlYWRpbmdgIGFuZCBgdHJhaWxpbmdgIG9wdGlvbnMgYXJlIGB0cnVlYCwgYGZ1bmNgIGlzIGludm9rZWRcclxuICAgKiBvbiB0aGUgdHJhaWxpbmcgZWRnZSBvZiB0aGUgdGltZW91dCBvbmx5IGlmIHRoZSB0aGUgZGVib3VuY2VkIGZ1bmN0aW9uIGlzXHJcbiAgICogaW52b2tlZCBtb3JlIHRoYW4gb25jZSBkdXJpbmcgdGhlIGB3YWl0YCB0aW1lb3V0LlxyXG4gICAqXHJcbiAgICogU2VlIFtEYXZpZCBDb3JiYWNobydzIGFydGljbGVdKGh0dHA6Ly9kcnVwYWxtb3Rpb24uY29tL2FydGljbGUvZGVib3VuY2UtYW5kLXRocm90dGxlLXZpc3VhbC1leHBsYW5hdGlvbilcclxuICAgKiBmb3IgZGV0YWlscyBvdmVyIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIGBfLmRlYm91bmNlYCBhbmQgYF8udGhyb3R0bGVgLlxyXG4gICAqXHJcbiAgICogQHN0YXRpY1xyXG4gICAqIEBtZW1iZXJPZiBfXHJcbiAgICogQGNhdGVnb3J5IEZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gZGVib3VuY2UuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt3YWl0PTBdIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIGRlbGF5LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgb2JqZWN0LlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMubGVhZGluZz1mYWxzZV0gU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgbGVhZGluZ1xyXG4gICAqICBlZGdlIG9mIHRoZSB0aW1lb3V0LlxyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXYWl0XSBUaGUgbWF4aW11bSB0aW1lIGBmdW5jYCBpcyBhbGxvd2VkIHRvIGJlXHJcbiAgICogIGRlbGF5ZWQgYmVmb3JlIGl0J3MgaW52b2tlZC5cclxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpb25zLnRyYWlsaW5nPXRydWVdIFNwZWNpZnkgaW52b2tpbmcgb24gdGhlIHRyYWlsaW5nXHJcbiAgICogIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXHJcbiAgICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgZGVib3VuY2VkIGZ1bmN0aW9uLlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICpcclxuICAgKiAvLyBhdm9pZCBjb3N0bHkgY2FsY3VsYXRpb25zIHdoaWxlIHRoZSB3aW5kb3cgc2l6ZSBpcyBpbiBmbHV4XHJcbiAgICogalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIF8uZGVib3VuY2UoY2FsY3VsYXRlTGF5b3V0LCAxNTApKTtcclxuICAgKlxyXG4gICAqIC8vIGludm9rZSBgc2VuZE1haWxgIHdoZW4gdGhlIGNsaWNrIGV2ZW50IGlzIGZpcmVkLCBkZWJvdW5jaW5nIHN1YnNlcXVlbnQgY2FsbHNcclxuICAgKiBqUXVlcnkoJyNwb3N0Ym94Jykub24oJ2NsaWNrJywgXy5kZWJvdW5jZShzZW5kTWFpbCwgMzAwLCB7XHJcbiAgICogICAnbGVhZGluZyc6IHRydWUsXHJcbiAgICogICAndHJhaWxpbmcnOiBmYWxzZVxyXG4gICAqIH0pKTtcclxuICAgKlxyXG4gICAqIC8vIGVuc3VyZSBgYmF0Y2hMb2dgIGlzIGludm9rZWQgb25jZSBhZnRlciAxIHNlY29uZCBvZiBkZWJvdW5jZWQgY2FsbHNcclxuICAgKiB2YXIgc291cmNlID0gbmV3IEV2ZW50U291cmNlKCcvc3RyZWFtJyk7XHJcbiAgICogalF1ZXJ5KHNvdXJjZSkub24oJ21lc3NhZ2UnLCBfLmRlYm91bmNlKGJhdGNoTG9nLCAyNTAsIHtcclxuICAgKiAgICdtYXhXYWl0JzogMTAwMFxyXG4gICAqIH0pKTtcclxuICAgKlxyXG4gICAqIC8vIGNhbmNlbCBhIGRlYm91bmNlZCBjYWxsXHJcbiAgICogdmFyIHRvZG9DaGFuZ2VzID0gXy5kZWJvdW5jZShiYXRjaExvZywgMTAwMCk7XHJcbiAgICogT2JqZWN0Lm9ic2VydmUobW9kZWxzLnRvZG8sIHRvZG9DaGFuZ2VzKTtcclxuICAgKlxyXG4gICAqIE9iamVjdC5vYnNlcnZlKG1vZGVscywgZnVuY3Rpb24oY2hhbmdlcykge1xyXG4gICAqICAgaWYgKF8uZmluZChjaGFuZ2VzLCB7ICd1c2VyJzogJ3RvZG8nLCAndHlwZSc6ICdkZWxldGUnfSkpIHtcclxuICAgKiAgICAgdG9kb0NoYW5nZXMuY2FuY2VsKCk7XHJcbiAgICogICB9XHJcbiAgICogfSwgWydkZWxldGUnXSk7XHJcbiAgICpcclxuICAgKiAvLyAuLi5hdCBzb21lIHBvaW50IGBtb2RlbHMudG9kb2AgaXMgY2hhbmdlZFxyXG4gICAqIG1vZGVscy50b2RvLmNvbXBsZXRlZCA9IHRydWU7XHJcbiAgICpcclxuICAgKiAvLyAuLi5iZWZvcmUgMSBzZWNvbmQgaGFzIHBhc3NlZCBgbW9kZWxzLnRvZG9gIGlzIGRlbGV0ZWRcclxuICAgKiAvLyB3aGljaCBjYW5jZWxzIHRoZSBkZWJvdW5jZWQgYHRvZG9DaGFuZ2VzYCBjYWxsXHJcbiAgICogZGVsZXRlIG1vZGVscy50b2RvO1xyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBhcmdzLFxyXG4gICAgICAgICAgICBtYXhUaW1lb3V0SWQsXHJcbiAgICAgICAgICAgIHJlc3VsdCxcclxuICAgICAgICAgICAgc3RhbXAsXHJcbiAgICAgICAgICAgIHRoaXNBcmcsXHJcbiAgICAgICAgICAgIHRpbWVvdXRJZCxcclxuICAgICAgICAgICAgdHJhaWxpbmdDYWxsLFxyXG4gICAgICAgICAgICBsYXN0Q2FsbGVkID0gMCxcclxuICAgICAgICAgICAgbWF4V2FpdCA9IGZhbHNlLFxyXG4gICAgICAgICAgICB0cmFpbGluZyA9IHRydWU7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xyXG4gICAgfVxyXG4gICAgd2FpdCA9IHdhaXQgPCAwID8gMCA6ICgrd2FpdCB8fCAwKTtcclxuICAgIGlmIChvcHRpb25zID09PSB0cnVlKSB7XHJcbiAgICAgIHZhciBsZWFkaW5nID0gdHJ1ZTtcclxuICAgICAgdHJhaWxpbmcgPSBmYWxzZTtcclxuICAgIH0gZWxzZSBpZiAoaXNPYmplY3Qob3B0aW9ucykpIHtcclxuICAgICAgbGVhZGluZyA9ICEhb3B0aW9ucy5sZWFkaW5nO1xyXG4gICAgICBtYXhXYWl0ID0gJ21heFdhaXQnIGluIG9wdGlvbnMgJiYgbmF0aXZlTWF4KCtvcHRpb25zLm1heFdhaXQgfHwgMCwgd2FpdCk7XHJcbiAgICAgIHRyYWlsaW5nID0gJ3RyYWlsaW5nJyBpbiBvcHRpb25zID8gISFvcHRpb25zLnRyYWlsaW5nIDogdHJhaWxpbmc7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2FuY2VsKCkge1xyXG4gICAgICBpZiAodGltZW91dElkKSB7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG1heFRpbWVvdXRJZCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xyXG4gICAgICB9XHJcbiAgICAgIGxhc3RDYWxsZWQgPSAwO1xyXG4gICAgICBtYXhUaW1lb3V0SWQgPSB0aW1lb3V0SWQgPSB0cmFpbGluZ0NhbGwgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY29tcGxldGUoaXNDYWxsZWQsIGlkKSB7XHJcbiAgICAgIGlmIChpZCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dChpZCk7XHJcbiAgICAgIH1cclxuICAgICAgbWF4VGltZW91dElkID0gdGltZW91dElkID0gdHJhaWxpbmdDYWxsID0gdW5kZWZpbmVkO1xyXG4gICAgICBpZiAoaXNDYWxsZWQpIHtcclxuICAgICAgICBsYXN0Q2FsbGVkID0gbm93KCk7XHJcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcclxuICAgICAgICBpZiAoIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgICBhcmdzID0gdGhpc0FyZyA9IHVuZGVmaW5lZDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWxheWVkKCkge1xyXG4gICAgICB2YXIgcmVtYWluaW5nID0gd2FpdCAtIChub3coKSAtIHN0YW1wKTtcclxuICAgICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcclxuICAgICAgICBjb21wbGV0ZSh0cmFpbGluZ0NhbGwsIG1heFRpbWVvdXRJZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCByZW1haW5pbmcpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbWF4RGVsYXllZCgpIHtcclxuICAgICAgY29tcGxldGUodHJhaWxpbmcsIHRpbWVvdXRJZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZGVib3VuY2VkKCkge1xyXG4gICAgICBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICBzdGFtcCA9IG5vdygpO1xyXG4gICAgICB0aGlzQXJnID0gdGhpcztcclxuICAgICAgdHJhaWxpbmdDYWxsID0gdHJhaWxpbmcgJiYgKHRpbWVvdXRJZCB8fCAhbGVhZGluZyk7XHJcblxyXG4gICAgICBpZiAobWF4V2FpdCA9PT0gZmFsc2UpIHtcclxuICAgICAgICB2YXIgbGVhZGluZ0NhbGwgPSBsZWFkaW5nICYmICF0aW1lb3V0SWQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKCFtYXhUaW1lb3V0SWQgJiYgIWxlYWRpbmcpIHtcclxuICAgICAgICAgIGxhc3RDYWxsZWQgPSBzdGFtcDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJlbWFpbmluZyA9IG1heFdhaXQgLSAoc3RhbXAgLSBsYXN0Q2FsbGVkKSxcclxuICAgICAgICAgICAgICAgIGlzQ2FsbGVkID0gcmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gbWF4V2FpdDtcclxuXHJcbiAgICAgICAgaWYgKGlzQ2FsbGVkKSB7XHJcbiAgICAgICAgICBpZiAobWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgICAgIG1heFRpbWVvdXRJZCA9IGNsZWFyVGltZW91dChtYXhUaW1lb3V0SWQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgbGFzdENhbGxlZCA9IHN0YW1wO1xyXG4gICAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoIW1heFRpbWVvdXRJZCkge1xyXG4gICAgICAgICAgbWF4VGltZW91dElkID0gc2V0VGltZW91dChtYXhEZWxheWVkLCByZW1haW5pbmcpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAoaXNDYWxsZWQgJiYgdGltZW91dElkKSB7XHJcbiAgICAgICAgdGltZW91dElkID0gY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoIXRpbWVvdXRJZCAmJiB3YWl0ICE9PSBtYXhXYWl0KSB7XHJcbiAgICAgICAgdGltZW91dElkID0gc2V0VGltZW91dChkZWxheWVkLCB3YWl0KTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobGVhZGluZ0NhbGwpIHtcclxuICAgICAgICBpc0NhbGxlZCA9IHRydWU7XHJcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzQXJnLCBhcmdzKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoaXNDYWxsZWQgJiYgIXRpbWVvdXRJZCAmJiAhbWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgYXJncyA9IHRoaXNBcmcgPSB1bmRlZmluZWQ7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBkZWJvdW5jZWQuY2FuY2VsID0gY2FuY2VsO1xyXG4gICAgcmV0dXJuIGRlYm91bmNlZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZSBbbGFuZ3VhZ2UgdHlwZV0oaHR0cHM6Ly9lczUuZ2l0aHViLmlvLyN4OCkgb2YgYE9iamVjdGAuXHJcbiAgICogKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXHJcbiAgICpcclxuICAgKiBAc3RhdGljXHJcbiAgICogQG1lbWJlck9mIF9cclxuICAgKiBAY2F0ZWdvcnkgTGFuZ1xyXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxyXG4gICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxyXG4gICAqIEBleGFtcGxlXHJcbiAgICpcclxuICAgKiBfLmlzT2JqZWN0KHt9KTtcclxuICAgKiAvLyA9PiB0cnVlXHJcbiAgICpcclxuICAgKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XHJcbiAgICogLy8gPT4gdHJ1ZVxyXG4gICAqXHJcbiAgICogXy5pc09iamVjdCgxKTtcclxuICAgKiAvLyA9PiBmYWxzZVxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XHJcbiAgICAvLyBBdm9pZCBhIFY4IEpJVCBidWcgaW4gQ2hyb21lIDE5LTIwLlxyXG4gICAgLy8gU2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0yMjkxIGZvciBtb3JlIGRldGFpbHMuXHJcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcclxuICAgIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGVib3VuY2U7XHJcblxyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBkZWJvdW5jZTsiLCI7KGZ1bmN0aW9uKCl7ICd1c2Ugc3RyaWN0JztcclxuICBcclxuICB2YXIgYW5jaG9yUG9pbnRVdGlsaXRpZXMgPSByZXF1aXJlKCcuL0FuY2hvclBvaW50VXRpbGl0aWVzJyk7XHJcbiAgdmFyIGRlYm91bmNlID0gcmVxdWlyZShcIi4vZGVib3VuY2VcIik7XHJcbiAgXHJcbiAgLy8gcmVnaXN0ZXJzIHRoZSBleHRlbnNpb24gb24gYSBjeXRvc2NhcGUgbGliIHJlZlxyXG4gIHZhciByZWdpc3RlciA9IGZ1bmN0aW9uKCBjeXRvc2NhcGUsICQsIEtvbnZhKXtcclxuICAgIHZhciB1aVV0aWxpdGllcyA9IHJlcXVpcmUoJy4vVUlVdGlsaXRpZXMnKTtcclxuICAgIFxyXG4gICAgaWYoICFjeXRvc2NhcGUgfHwgISQgfHwgIUtvbnZhKXsgcmV0dXJuOyB9IC8vIGNhbid0IHJlZ2lzdGVyIGlmIHJlcXVpcmVkIGxpYnJhcmllcyB1bnNwZWNpZmllZFxyXG5cclxuICAgIHZhciBkZWZhdWx0cyA9IHtcclxuICAgICAgLy8gdGhpcyBmdW5jdGlvbiBzcGVjaWZpZXMgdGhlIHBvaXRpb25zIG9mIGJlbmQgcG9pbnRzXHJcbiAgICAgIC8vIHN0cmljdGx5IG5hbWUgdGhlIHByb3BlcnR5ICdiZW5kUG9pbnRQb3NpdGlvbnMnIGZvciB0aGUgZWRnZSB0byBiZSBkZXRlY3RlZCBmb3IgYmVuZCBwb2ludCBlZGl0aXRuZ1xyXG4gICAgICBiZW5kUG9zaXRpb25zRnVuY3Rpb246IGZ1bmN0aW9uKGVsZSkge1xyXG4gICAgICAgIHJldHVybiBlbGUuZGF0YSgnYmVuZFBvaW50UG9zaXRpb25zJyk7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIHRoaXMgZnVuY3Rpb24gc3BlY2lmaWVzIHRoZSBwb2l0aW9ucyBvZiBjb250cm9sIHBvaW50c1xyXG4gICAgICAvLyBzdHJpY3RseSBuYW1lIHRoZSBwcm9wZXJ0eSAnY29udHJvbFBvaW50UG9zaXRpb25zJyBmb3IgdGhlIGVkZ2UgdG8gYmUgZGV0ZWN0ZWQgZm9yIGNvbnRyb2wgcG9pbnQgZWRpdGl0bmdcclxuICAgICAgY29udHJvbFBvc2l0aW9uc0Z1bmN0aW9uOiBmdW5jdGlvbihlbGUpIHtcclxuICAgICAgICByZXR1cm4gZWxlLmRhdGEoJ2NvbnRyb2xQb2ludFBvc2l0aW9ucycpO1xyXG4gICAgICB9LFxyXG4gICAgICAvLyB3aGV0aGVyIHRvIGluaXRpbGl6ZSBiZW5kIGFuZCBjb250cm9sIHBvaW50cyBvbiBjcmVhdGlvbiBvZiB0aGlzIGV4dGVuc2lvbiBhdXRvbWF0aWNhbGx5XHJcbiAgICAgIGluaXRBbmNob3JzQXV0b21hdGljYWxseTogdHJ1ZSxcclxuICAgICAgLy8gdGhlIGNsYXNzZXMgb2YgdGhvc2UgZWRnZXMgdGhhdCBzaG91bGQgYmUgaWdub3JlZFxyXG4gICAgICBpZ25vcmVkQ2xhc3NlczogW10sXHJcbiAgICAgIC8vIHdoZXRoZXIgdGhlIGJlbmQgYW5kIGNvbnRyb2wgZWRpdGluZyBvcGVyYXRpb25zIGFyZSB1bmRvYWJsZSAocmVxdWlyZXMgY3l0b3NjYXBlLXVuZG8tcmVkby5qcylcclxuICAgICAgdW5kb2FibGU6IGZhbHNlLFxyXG4gICAgICAvLyB0aGUgc2l6ZSBvZiBiZW5kIGFuZCBjb250cm9sIHBvaW50IHNoYXBlIGlzIG9idGFpbmVkIGJ5IG11bHRpcGxpbmcgd2lkdGggb2YgZWRnZSB3aXRoIHRoaXMgcGFyYW1ldGVyXHJcbiAgICAgIGFuY2hvclNoYXBlU2l6ZUZhY3RvcjogMyxcclxuICAgICAgLy9zaXplIG9mIGFuY2hvcnBvaW50IGNhbiBiZSBhdXRvIGNoYW5nZWQgdG8gY29tcGVuc2F0ZSB0aGUgaW1wYWN0IG9mIGN5IHpvb21pbmcgbGV2ZWxcclxuICAgICAgZW5hYmxlQW5jaG9yU2l6ZU5vdEltcGFjdEJ5Wm9vbTogZmFsc2UsXHJcbiAgICAgIC8vIHotaW5kZXggdmFsdWUgb2YgdGhlIGNhbnZhcyBpbiB3aGljaCBiZW5kIGFuZCBjb250cm9sIHBvaW50cyBhcmUgZHJhd25cclxuICAgICAgekluZGV4OiA5OTksICAgICAgXHJcbiAgICAgIC8vIHdoZXRoZXIgdG8gc3RhcnQgdGhlIHBsdWdpbiBpbiB0aGUgZW5hYmxlZCBzdGF0ZVxyXG4gICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAvL0FuIG9wdGlvbiB0aGF0IGNvbnRyb2xzIHRoZSBkaXN0YW5jZSB3aXRoaW4gd2hpY2ggYSBiZW5kIHBvaW50IGlzIGNvbnNpZGVyZWQgXCJuZWFyXCIgdGhlIGxpbmUgc2VnbWVudCBiZXR3ZWVuIGl0cyB0d28gbmVpZ2hib3JzIGFuZCB3aWxsIGJlIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZFxyXG4gICAgICBiZW5kUmVtb3ZhbFNlbnNpdGl2aXR5IDogOCxcclxuICAgICAgLy8gdGl0bGUgb2YgYWRkIGJlbmQgcG9pbnQgbWVudSBpdGVtIChVc2VyIG1heSBuZWVkIHRvIGFkanVzdCB3aWR0aCBvZiBtZW51IGl0ZW1zIGFjY29yZGluZyB0byBsZW5ndGggb2YgdGhpcyBvcHRpb24pXHJcbiAgICAgIGFkZEJlbmRNZW51SXRlbVRpdGxlOiBcIkFkZCBCZW5kIFBvaW50XCIsXHJcbiAgICAgIC8vIHRpdGxlIG9mIHJlbW92ZSBiZW5kIHBvaW50IG1lbnUgaXRlbSAoVXNlciBtYXkgbmVlZCB0byBhZGp1c3Qgd2lkdGggb2YgbWVudSBpdGVtcyBhY2NvcmRpbmcgdG8gbGVuZ3RoIG9mIHRoaXMgb3B0aW9uKVxyXG4gICAgICByZW1vdmVCZW5kTWVudUl0ZW1UaXRsZTogXCJSZW1vdmUgQmVuZCBQb2ludFwiLFxyXG4gICAgICAvLyB0aXRsZSBvZiByZW1vdmUgYWxsIGJlbmQgcG9pbnRzIG1lbnUgaXRlbVxyXG4gICAgICByZW1vdmVBbGxCZW5kTWVudUl0ZW1UaXRsZTogXCJSZW1vdmUgQWxsIEJlbmQgUG9pbnRzXCIsXHJcbiAgICAgIC8vIHRpdGxlIG9mIGFkZCBjb250cm9sIHBvaW50IG1lbnUgaXRlbSAoVXNlciBtYXkgbmVlZCB0byBhZGp1c3Qgd2lkdGggb2YgbWVudSBpdGVtcyBhY2NvcmRpbmcgdG8gbGVuZ3RoIG9mIHRoaXMgb3B0aW9uKVxyXG4gICAgICBhZGRDb250cm9sTWVudUl0ZW1UaXRsZTogXCJBZGQgQ29udHJvbCBQb2ludFwiLFxyXG4gICAgICAvLyB0aXRsZSBvZiByZW1vdmUgY29udHJvbCBwb2ludCBtZW51IGl0ZW0gKFVzZXIgbWF5IG5lZWQgdG8gYWRqdXN0IHdpZHRoIG9mIG1lbnUgaXRlbXMgYWNjb3JkaW5nIHRvIGxlbmd0aCBvZiB0aGlzIG9wdGlvbilcclxuICAgICAgcmVtb3ZlQ29udHJvbE1lbnVJdGVtVGl0bGU6IFwiUmVtb3ZlIENvbnRyb2wgUG9pbnRcIixcclxuICAgICAgLy8gdGl0bGUgb2YgcmVtb3ZlIGFsbCBjb250cm9sIHBvaW50cyBtZW51IGl0ZW1cclxuICAgICAgcmVtb3ZlQWxsQ29udHJvbE1lbnVJdGVtVGl0bGU6IFwiUmVtb3ZlIEFsbCBDb250cm9sIFBvaW50c1wiLFxyXG4gICAgICAvLyB3aGV0aGVyIHRoZSBiZW5kIGFuZCBjb250cm9sIHBvaW50cyBjYW4gYmUgbW92ZWQgYnkgYXJyb3dzXHJcbiAgICAgIG1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50czogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIHdoZXRoZXIgJ1JlbW92ZSBhbGwgYmVuZCBwb2ludHMnIGFuZCAnUmVtb3ZlIGFsbCBjb250cm9sIHBvaW50cycgb3B0aW9ucyBzaG91bGQgYmUgcHJlc2VudGVkXHJcbiAgICAgIGVuYWJsZU11bHRpcGxlQW5jaG9yUmVtb3ZhbE9wdGlvbjogZmFsc2UsXHJcbiAgICAgIC8vIHdoZXRoZXIgYWxsb3dzIGFkZGluZyBiZW5kaW5nIHBvaW50IGJ5IGRyYWdpbmcgZWRnZSB3aXRob3V0IHVzZWluZyBjdHhtZW51LCBkZWZhdWx0IGlzIHRydWVcclxuICAgICAgZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnOnRydWUsXHJcbiAgICAgIC8vIGhvdyB0byBzbWFydGx5IG1vdmUgdGhlIGFuY2hvciBwb2ludCB0byBwZXJmZWN0IDAgNDUgb3IgOTAgZGVncmVlIHBvc2l0aW9uLCB1bml0IGlzIHB4XHJcbiAgICAgIHN0aWNreUFuY2hvclRvbGVyZW5jZTogLTEsICAvLy0xIGFjdHVhbGx5IGRpc2FibGUgdGhpcyBmZWF0dXJlLCBjaGFuZ2UgaXQgdG8gMjAgdG8gdGVzdCB0aGUgZmVhdHVyZVxyXG4gICAgICAvL2F1dG9tYXRpY2FsbHkgcmVtb3ZlIGFuY2hvciBpZiBpdHMgcHJldiBzZWdlbWVudCBhbmQgbmV4dCBzZWdtZW50IGlzIGFsbW9zdCBpbiBhIHNhbWUgbGluZVxyXG4gICAgICBlbmFibGVSZW1vdmVBbmNob3JNaWRPZk5lYXJMaW5lOnRydWVcclxuICAgIH07XHJcbiAgICBcclxuICAgIHZhciBvcHRpb25zO1xyXG4gICAgdmFyIGluaXRpYWxpemVkID0gZmFsc2U7XHJcbiAgICBcclxuICAgIC8vIE1lcmdlIGRlZmF1bHQgb3B0aW9ucyB3aXRoIHRoZSBvbmVzIGNvbWluZyBmcm9tIHBhcmFtZXRlclxyXG4gICAgZnVuY3Rpb24gZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKSB7XHJcbiAgICAgIHZhciBvYmogPSB7fTtcclxuXHJcbiAgICAgIGZvciAodmFyIGkgaW4gZGVmYXVsdHMpIHtcclxuICAgICAgICBvYmpbaV0gPSBkZWZhdWx0c1tpXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yICh2YXIgaSBpbiBvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gU1BMSVQgRlVOQ1RJT05BTElUWT9cclxuICAgICAgICBpZihpID09IFwiYmVuZFJlbW92YWxTZW5zaXRpdml0eVwiKXtcclxuICAgICAgICAgIHZhciB2YWx1ZSA9IG9wdGlvbnNbaV07XHJcbiAgICAgICAgICAgaWYoIWlzTmFOKHZhbHVlKSlcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaWYodmFsdWUgPj0gMCAmJiB2YWx1ZSA8PSAyMCl7XHJcbiAgICAgICAgICAgICAgICBvYmpbaV0gPSBvcHRpb25zW2ldO1xyXG4gICAgICAgICAgICAgIH1lbHNlIGlmKHZhbHVlIDwgMCl7XHJcbiAgICAgICAgICAgICAgICBvYmpbaV0gPSAwXHJcbiAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBvYmpbaV0gPSAyMFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBvYmpbaV0gPSBvcHRpb25zW2ldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBjeXRvc2NhcGUoICdjb3JlJywgJ2VkZ2VFZGl0aW5nJywgZnVuY3Rpb24ob3B0cyl7XHJcbiAgICAgIHZhciBjeSA9IHRoaXM7XHJcbiAgICAgIFxyXG4gICAgICBpZiggb3B0cyA9PT0gJ2luaXRpYWxpemVkJyApIHtcclxuICAgICAgICByZXR1cm4gaW5pdGlhbGl6ZWQ7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGlmKCBvcHRzICE9PSAnZ2V0JyApIHtcclxuICAgICAgICAvLyBtZXJnZSB0aGUgb3B0aW9ucyB3aXRoIGRlZmF1bHQgb25lc1xyXG4gICAgICAgIG9wdGlvbnMgPSBleHRlbmQoZGVmYXVsdHMsIG9wdHMpO1xyXG4gICAgICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIGVkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzIGNzcyBjbGFzc1xyXG4gICAgICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJy5lZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpLmNzcyh7XHJcbiAgICAgICAgICAnY3VydmUtc3R5bGUnOiAnc2VnbWVudHMnLFxyXG4gICAgICAgICAgJ3NlZ21lbnQtZGlzdGFuY2VzJzogZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RGlzdGFuY2VzU3RyaW5nKGVsZSwgJ2JlbmQnKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAnc2VnbWVudC13ZWlnaHRzJzogZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0V2VpZ2h0c1N0cmluZyhlbGUsICdiZW5kJyk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgJ2VkZ2UtZGlzdGFuY2VzJzogJ25vZGUtcG9zaXRpb24nXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGRlZmluZSBlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cyBjc3MgY2xhc3NcclxuICAgICAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCcuZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKS5jc3Moe1xyXG4gICAgICAgICAgJ2N1cnZlLXN0eWxlJzogJ3VuYnVuZGxlZC1iZXppZXInLFxyXG4gICAgICAgICAgJ2NvbnRyb2wtcG9pbnQtZGlzdGFuY2VzJzogZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RGlzdGFuY2VzU3RyaW5nKGVsZSwgJ2NvbnRyb2wnKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAnY29udHJvbC1wb2ludC13ZWlnaHRzJzogZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0V2VpZ2h0c1N0cmluZyhlbGUsICdjb250cm9sJyk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgJ2VkZ2UtZGlzdGFuY2VzJzogJ25vZGUtcG9zaXRpb24nXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLnNldElnbm9yZWRDbGFzc2VzKG9wdGlvbnMuaWdub3JlZENsYXNzZXMpO1xyXG5cclxuICAgICAgICAvLyBpbml0IGJlbmQgcG9zaXRpb25zIGNvbmRpdGlvbmFsbHlcclxuICAgICAgICBpZiAob3B0aW9ucy5pbml0QW5jaG9yc0F1dG9tYXRpY2FsbHkpIHtcclxuICAgICAgICAgIC8vIENIRUNLIFRISVMsIG9wdGlvbnMuaWdub3JlZENsYXNzZXMgVU5VU0VEXHJcbiAgICAgICAgICBhbmNob3JQb2ludFV0aWxpdGllcy5pbml0QW5jaG9yUG9pbnRzKG9wdGlvbnMuYmVuZFBvc2l0aW9uc0Z1bmN0aW9uLCBvcHRpb25zLmNvbnRyb2xQb3NpdGlvbnNGdW5jdGlvbiwgY3kuZWRnZXMoKSwgb3B0aW9ucy5pZ25vcmVkQ2xhc3Nlcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihvcHRpb25zLmVuYWJsZWQpIFxyXG4gICAgICAgICAgdWlVdGlsaXRpZXMob3B0aW9ucywgY3kpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHVpVXRpbGl0aWVzKFwidW5iaW5kXCIsIGN5KTtcclxuICAgICAgfVxyXG4gICAgXHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IGluaXRpYWxpemVkID8ge1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgKiBnZXQgYmVuZCBvciBjb250cm9sIHBvaW50cyBvZiB0aGUgZ2l2ZW4gZWRnZSBpbiBhbiBhcnJheSBBLFxyXG4gICAgICAgICogQVsyICogaV0gaXMgdGhlIHggY29vcmRpbmF0ZSBhbmQgQVsyICogaSArIDFdIGlzIHRoZSB5IGNvb3JkaW5hdGVcclxuICAgICAgICAqIG9mIHRoZSBpdGggYmVuZCBwb2ludC4gKFJldHVybnMgdW5kZWZpbmVkIGlmIHRoZSBjdXJ2ZSBzdHlsZSBpcyBub3Qgc2VnbWVudHMgbm9yIHVuYnVuZGxlZCBiZXppZXIpXHJcbiAgICAgICAgKi9cclxuICAgICAgICBnZXRBbmNob3JzQXNBcnJheTogZnVuY3Rpb24oZWxlKSB7XHJcbiAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWxlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN0b3JlQW5jaG9yc0Fic29sdXRlUG9zaXRpb246IGZ1bmN0aW9uKGRyYWdnaW5nTm9kZXMpe1xyXG4gICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3RvcmVBbmNob3JzQWJzb2x1dGVQb3NpdGlvbihkcmFnZ2luZ05vZGVzKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb246ZnVuY3Rpb24oKXtcclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLnJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb24oKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGtlZXBBbmNob3JzQWJzb2x1dGVQb3NpdGlvbkR1cmluZ01vdmluZzogZnVuY3Rpb24oKXtcclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLmtlZXBBbmNob3JzQWJzb2x1dGVQb3NpdGlvbkR1cmluZ01vdmluZygpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIC8vIEluaXRpbGl6ZSBwb2ludHMgZm9yIHRoZSBnaXZlbiBlZGdlcyB1c2luZyAnb3B0aW9ucy5iZW5kUG9zaXRpb25zRnVuY3Rpb24nXHJcbiAgICAgICAgaW5pdEFuY2hvclBvaW50czogZnVuY3Rpb24oZWxlcykge1xyXG4gICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaW5pdEFuY2hvclBvaW50cyhvcHRpb25zLmJlbmRQb3NpdGlvbnNGdW5jdGlvbiwgb3B0aW9ucy5jb250cm9sUG9zaXRpb25zRnVuY3Rpb24sIGVsZXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGVsZXRlU2VsZWN0ZWRBbmNob3I6IGZ1bmN0aW9uKGVsZSwgaW5kZXgpIHtcclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLnJlbW92ZUFuY2hvcihlbGUsIGluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7IC8vIGNoYWluYWJpbGl0eVxyXG4gICAgfSApO1xyXG5cclxuICB9O1xyXG5cclxuICBpZiggdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMgKXsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xyXG4gIH1cclxuXHJcbiAgaWYoIHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQgKXsgLy8gZXhwb3NlIGFzIGFuIGFtZC9yZXF1aXJlanMgbW9kdWxlXHJcbiAgICBkZWZpbmUoJ2N5dG9zY2FwZS1lZGdlLWVkaXRpbmcnLCBmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4gcmVnaXN0ZXI7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmKCB0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJyAmJiAkICYmIEtvbnZhKXsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcclxuICAgIHJlZ2lzdGVyKCBjeXRvc2NhcGUsICQsIEtvbnZhICk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuIiwidmFyIHJlY29ubmVjdGlvblV0aWxpdGllcyA9IHtcclxuXHJcbiAgICAvLyBjcmVhdGVzIGFuZCByZXR1cm5zIGEgZHVtbXkgbm9kZSB3aGljaCBpcyBjb25uZWN0ZWQgdG8gdGhlIGRpc2Nvbm5lY3RlZCBlZGdlXHJcbiAgICBkaXNjb25uZWN0RWRnZTogZnVuY3Rpb24gKGVkZ2UsIGN5LCBwb3NpdGlvbiwgZGlzY29ubmVjdGVkRW5kKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGR1bW15Tm9kZSA9IHtcclxuICAgICAgICAgICAgZGF0YTogeyBcclxuICAgICAgICAgICAgICBpZDogJ253dF9yZWNvbm5lY3RFZGdlX2R1bW15JyxcclxuICAgICAgICAgICAgICBwb3J0czogW10sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgd2lkdGg6IDEsXHJcbiAgICAgICAgICAgICAgaGVpZ2h0OiAxLFxyXG4gICAgICAgICAgICAgICd2aXNpYmlsaXR5JzogJ2hpZGRlbidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVuZGVyZWRQb3NpdGlvbjogcG9zaXRpb25cclxuICAgICAgICB9O1xyXG4gICAgICAgIGN5LmFkZChkdW1teU5vZGUpO1xyXG5cclxuICAgICAgICB2YXIgbG9jID0gKGRpc2Nvbm5lY3RlZEVuZCA9PT0gJ3NvdXJjZScpID8gXHJcbiAgICAgICAgICAgIHtzb3VyY2U6IGR1bW15Tm9kZS5kYXRhLmlkfSA6IFxyXG4gICAgICAgICAgICB7dGFyZ2V0OiBkdW1teU5vZGUuZGF0YS5pZH07XHJcblxyXG4gICAgICAgIGVkZ2UgPSBlZGdlLm1vdmUobG9jKVswXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZHVtbXlOb2RlOiBjeS5ub2RlcyhcIiNcIiArIGR1bW15Tm9kZS5kYXRhLmlkKVswXSxcclxuICAgICAgICAgICAgZWRnZTogZWRnZVxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbm5lY3RFZGdlOiBmdW5jdGlvbiAoZWRnZSwgbm9kZSwgbG9jYXRpb24pIHtcclxuICAgICAgICBpZighZWRnZS5pc0VkZ2UoKSB8fCAhbm9kZS5pc05vZGUoKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgbG9jID0ge307XHJcbiAgICAgICAgaWYobG9jYXRpb24gPT09ICdzb3VyY2UnKVxyXG4gICAgICAgICAgICBsb2Muc291cmNlID0gbm9kZS5pZCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYobG9jYXRpb24gPT09ICd0YXJnZXQnKVxyXG4gICAgICAgICAgICBsb2MudGFyZ2V0ID0gbm9kZS5pZCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICByZXR1cm4gZWRnZS5tb3ZlKGxvYylbMF07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHlFZGdlOiBmdW5jdGlvbiAob2xkRWRnZSwgbmV3RWRnZSkge1xyXG4gICAgICAgIHRoaXMuY29weUFuY2hvcnMob2xkRWRnZSwgbmV3RWRnZSk7XHJcbiAgICAgICAgdGhpcy5jb3B5U3R5bGUob2xkRWRnZSwgbmV3RWRnZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHlTdHlsZTogZnVuY3Rpb24gKG9sZEVkZ2UsIG5ld0VkZ2UpIHtcclxuICAgICAgICBpZihvbGRFZGdlICYmIG5ld0VkZ2Upe1xyXG4gICAgICAgICAgICBuZXdFZGdlLmRhdGEoJ2xpbmUtY29sb3InLCBvbGRFZGdlLmRhdGEoJ2xpbmUtY29sb3InKSk7XHJcbiAgICAgICAgICAgIG5ld0VkZ2UuZGF0YSgnd2lkdGgnLCBvbGRFZGdlLmRhdGEoJ3dpZHRoJykpO1xyXG4gICAgICAgICAgICBuZXdFZGdlLmRhdGEoJ2NhcmRpbmFsaXR5Jywgb2xkRWRnZS5kYXRhKCdjYXJkaW5hbGl0eScpKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHlBbmNob3JzOiBmdW5jdGlvbiAob2xkRWRnZSwgbmV3RWRnZSkge1xyXG4gICAgICAgIGlmKG9sZEVkZ2UuaGFzQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJykpe1xyXG4gICAgICAgICAgICB2YXIgYnBEaXN0YW5jZXMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzJyk7XHJcbiAgICAgICAgICAgIHZhciBicFdlaWdodHMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cycpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcycsIGJwRGlzdGFuY2VzKTtcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMnLCBicFdlaWdodHMpO1xyXG4gICAgICAgICAgICBuZXdFZGdlLmFkZENsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKG9sZEVkZ2UuaGFzQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJykpe1xyXG4gICAgICAgICAgICB2YXIgYnBEaXN0YW5jZXMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzJyk7XHJcbiAgICAgICAgICAgIHZhciBicFdlaWdodHMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cycpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcycsIGJwRGlzdGFuY2VzKTtcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMnLCBicFdlaWdodHMpO1xyXG4gICAgICAgICAgICBuZXdFZGdlLmFkZENsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob2xkRWRnZS5oYXNDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc211bHRpcGxlYmVuZHBvaW50cycpKSB7XHJcbiAgICAgICAgICAgIG5ld0VkZ2UuYWRkQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNtdWx0aXBsZWJlbmRwb2ludHMnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob2xkRWRnZS5oYXNDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc211bHRpcGxlY29udHJvbHBvaW50cycpKSB7XHJcbiAgICAgICAgICAgIG5ld0VkZ2UuYWRkQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNtdWx0aXBsZWNvbnRyb2xwb2ludHMnKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG59O1xyXG4gIFxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlY29ubmVjdGlvblV0aWxpdGllcztcclxuICAiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeSwgYW5jaG9yUG9pbnRVdGlsaXRpZXMsIHBhcmFtcykge1xyXG4gIGlmIChjeS51bmRvUmVkbyA9PSBudWxsKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdXIgPSBjeS51bmRvUmVkbyh7XHJcbiAgICBkZWZhdWx0QWN0aW9uczogZmFsc2UsXHJcbiAgICBpc0RlYnVnOiB0cnVlXHJcbiAgfSk7XHJcblxyXG4gIGZ1bmN0aW9uIGNoYW5nZUFuY2hvclBvaW50cyhwYXJhbSkge1xyXG4gICAgdmFyIGVkZ2UgPSBjeS5nZXRFbGVtZW50QnlJZChwYXJhbS5lZGdlLmlkKCkpO1xyXG4gICAgdmFyIHR5cGUgPSBwYXJhbS50eXBlICE9PSAnaW5jb25jbHVzaXZlJyA/IHBhcmFtLnR5cGUgOiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgIFxyXG4gICAgdmFyIHdlaWdodHMsIGRpc3RhbmNlcywgd2VpZ2h0U3RyLCBkaXN0YW5jZVN0cjtcclxuXHJcbiAgICBpZihwYXJhbS50eXBlID09PSAnaW5jb25jbHVzaXZlJyAmJiAhcGFyYW0uc2V0KXtcclxuICAgICAgd2VpZ2h0cyA9IFtdO1xyXG4gICAgICBkaXN0YW5jZXMgPSBbXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB3ZWlnaHRTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddO1xyXG4gICAgICBkaXN0YW5jZVN0ciA9IGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXTtcclxuXHJcbiAgICAgIHdlaWdodHMgPSBwYXJhbS5zZXQgPyBlZGdlLmRhdGEod2VpZ2h0U3RyKSA6IHBhcmFtLndlaWdodHM7XHJcbiAgICAgIGRpc3RhbmNlcyA9IHBhcmFtLnNldCA/IGVkZ2UuZGF0YShkaXN0YW5jZVN0cikgOiBwYXJhbS5kaXN0YW5jZXM7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgd2VpZ2h0czogd2VpZ2h0cyxcclxuICAgICAgZGlzdGFuY2VzOiBkaXN0YW5jZXMsXHJcbiAgICAgIC8vQXMgdGhlIHJlc3VsdCB3aWxsIG5vdCBiZSB1c2VkIGZvciB0aGUgZmlyc3QgZnVuY3Rpb24gY2FsbCBwYXJhbXMgc2hvdWxkIGJlIHVzZWQgdG8gc2V0IHRoZSBkYXRhXHJcbiAgICAgIHNldDogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICAvL0NoZWNrIGlmIHdlIG5lZWQgdG8gc2V0IHRoZSB3ZWlnaHRzIGFuZCBkaXN0YW5jZXMgYnkgdGhlIHBhcmFtIHZhbHVlc1xyXG4gICAgaWYgKHBhcmFtLnNldCkge1xyXG4gICAgICB2YXIgaGFkQW5jaG9yUG9pbnQgPSBwYXJhbS53ZWlnaHRzICYmIHBhcmFtLndlaWdodHMubGVuZ3RoID4gMDtcclxuICAgICAgdmFyIGhhZE11bHRpcGxlQW5jaG9yUG9pbnRzID0gaGFkQW5jaG9yUG9pbnQgJiYgcGFyYW0ud2VpZ2h0cy5sZW5ndGggPiAxO1xyXG5cclxuICAgICAgaGFkQW5jaG9yUG9pbnQgPyBlZGdlLmRhdGEod2VpZ2h0U3RyLCBwYXJhbS53ZWlnaHRzKSA6IGVkZ2UucmVtb3ZlRGF0YSh3ZWlnaHRTdHIpO1xyXG4gICAgICBoYWRBbmNob3JQb2ludCA/IGVkZ2UuZGF0YShkaXN0YW5jZVN0ciwgcGFyYW0uZGlzdGFuY2VzKSA6IGVkZ2UucmVtb3ZlRGF0YShkaXN0YW5jZVN0cik7XHJcblxyXG4gICAgICB2YXIgc2luZ2xlQ2xhc3NOYW1lID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWydjbGFzcyddO1xyXG4gICAgICB2YXIgbXVsdGlDbGFzc05hbWUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ211bHRpQ2xhc3MnXTtcclxuXHJcbiAgICAgIC8vIFJlZnJlc2ggdGhlIGN1cnZlIHN0eWxlIGFzIHRoZSBudW1iZXIgb2YgYW5jaG9yIHBvaW50IHdvdWxkIGJlIGNoYW5nZWQgYnkgdGhlIHByZXZpb3VzIG9wZXJhdGlvblxyXG4gICAgICAvLyBBZGRpbmcgb3IgcmVtb3ZpbmcgbXVsdGkgY2xhc3NlcyBhdCBvbmNlIGNhbiBjYXVzZSBlcnJvcnMuIElmIG11bHRpcGxlIGNsYXNzZXMgYXJlIHRvIGJlIGFkZGVkLFxyXG4gICAgICAvLyBqdXN0IGFkZCB0aGVtIHRvZ2V0aGVyIGluIHNwYWNlIGRlbGltZXRlZCBjbGFzcyBuYW1lcyBmb3JtYXQuXHJcbiAgICAgIGlmICghaGFkQW5jaG9yUG9pbnQgJiYgIWhhZE11bHRpcGxlQW5jaG9yUG9pbnRzKSB7XHJcbiAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGNsYXNzZXMgZnJvbSBlZGdlIHdpdGggc3BhY2UgZGVsaW1ldGVkIHN0cmluZyBvZiBjbGFzcyBuYW1lcyBcclxuICAgICAgICBlZGdlLnJlbW92ZUNsYXNzKHNpbmdsZUNsYXNzTmFtZSArIFwiIFwiICsgbXVsdGlDbGFzc05hbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGhhZEFuY2hvclBvaW50ICYmICFoYWRNdWx0aXBsZUFuY2hvclBvaW50cykgeyAvLyBIYWQgc2luZ2xlIGFuY2hvclxyXG4gICAgICAgIGVkZ2UuYWRkQ2xhc3Moc2luZ2xlQ2xhc3NOYW1lKTtcclxuICAgICAgICBlZGdlLnJlbW92ZUNsYXNzKG11bHRpQ2xhc3NOYW1lKTsgICBcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBIYWQgbXVsdGlwbGUgYW5jaG9ycy4gQWRkIG11bHRpcGxlIGNsYXNzZXMgd2l0aCBzcGFjZSBkZWxpbWV0ZWQgc3RyaW5nIG9mIGNsYXNzIG5hbWVzXHJcbiAgICAgICAgZWRnZS5hZGRDbGFzcyhzaW5nbGVDbGFzc05hbWUgKyBcIiBcIiArIG11bHRpQ2xhc3NOYW1lKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIWVkZ2Uuc2VsZWN0ZWQoKSlcclxuICAgICAgICBlZGdlLnNlbGVjdCgpO1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBlZGdlLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgZWRnZS5zZWxlY3QoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBlZGdlLnRyaWdnZXIoJ2N5ZWRnZWVkaXRpbmcuY2hhbmdlQW5jaG9yUG9pbnRzJyk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG1vdmVEbyhhcmcpIHtcclxuICAgICAgaWYgKGFyZy5maXJzdFRpbWUpIHtcclxuICAgICAgICAgIGRlbGV0ZSBhcmcuZmlyc3RUaW1lO1xyXG4gICAgICAgICAgcmV0dXJuIGFyZztcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGVkZ2VzID0gYXJnLmVkZ2VzO1xyXG4gICAgICB2YXIgcG9zaXRpb25EaWZmID0gYXJnLnBvc2l0aW9uRGlmZjtcclxuICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICAgIGVkZ2VzOiBlZGdlcyxcclxuICAgICAgICAgIHBvc2l0aW9uRGlmZjoge1xyXG4gICAgICAgICAgICAgIHg6IC1wb3NpdGlvbkRpZmYueCxcclxuICAgICAgICAgICAgICB5OiAtcG9zaXRpb25EaWZmLnlcclxuICAgICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgbW92ZUFuY2hvcnNVbmRvYWJsZShwb3NpdGlvbkRpZmYsIGVkZ2VzKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtb3ZlQW5jaG9yc1VuZG9hYmxlKHBvc2l0aW9uRGlmZiwgZWRnZXMpIHtcclxuICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiggZWRnZSApe1xyXG4gICAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgICAgICAgIHZhciBwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpO1xyXG4gICAgICAgICAgdmFyIG5leHRBbmNob3JzUG9zaXRpb24gPSBbXTtcclxuICAgICAgICAgIGlmIChwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiAhPSB1bmRlZmluZWQpXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uLmxlbmd0aDsgaSs9MilcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIG5leHRBbmNob3JzUG9zaXRpb24ucHVzaCh7eDogcHJldmlvdXNBbmNob3JzUG9zaXRpb25baV0rcG9zaXRpb25EaWZmLngsIHk6IHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uW2krMV0rcG9zaXRpb25EaWZmLnl9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsncG9pbnRQb3MnXSwgbmV4dEFuY2hvcnNQb3NpdGlvbik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaW5pdEFuY2hvclBvaW50cyhwYXJhbXMuYmVuZFBvc2l0aW9uc0Z1bmN0aW9uLCBwYXJhbXMuY29udHJvbFBvc2l0aW9uc0Z1bmN0aW9uLCBlZGdlcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByZWNvbm5lY3RFZGdlKHBhcmFtKXtcclxuICAgIHZhciBlZGdlICAgICAgPSBwYXJhbS5lZGdlO1xyXG4gICAgdmFyIGxvY2F0aW9uICA9IHBhcmFtLmxvY2F0aW9uO1xyXG4gICAgdmFyIG9sZExvYyAgICA9IHBhcmFtLm9sZExvYztcclxuXHJcbiAgICBlZGdlID0gZWRnZS5tb3ZlKGxvY2F0aW9uKVswXTtcclxuXHJcbiAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICBlZGdlOiAgICAgZWRnZSxcclxuICAgICAgbG9jYXRpb246IG9sZExvYyxcclxuICAgICAgb2xkTG9jOiAgIGxvY2F0aW9uXHJcbiAgICB9XHJcbiAgICBlZGdlLnVuc2VsZWN0KCk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcmVtb3ZlUmVjb25uZWN0ZWRFZGdlKHBhcmFtKXtcclxuICAgIHZhciBvbGRFZGdlID0gcGFyYW0ub2xkRWRnZTtcclxuICAgIHZhciB0bXAgPSBjeS5nZXRFbGVtZW50QnlJZChvbGRFZGdlLmRhdGEoJ2lkJykpO1xyXG4gICAgaWYodG1wICYmIHRtcC5sZW5ndGggPiAwKVxyXG4gICAgICBvbGRFZGdlID0gdG1wO1xyXG5cclxuICAgIHZhciBuZXdFZGdlID0gcGFyYW0ubmV3RWRnZTtcclxuICAgIHZhciB0bXAgPSBjeS5nZXRFbGVtZW50QnlJZChuZXdFZGdlLmRhdGEoJ2lkJykpO1xyXG4gICAgaWYodG1wICYmIHRtcC5sZW5ndGggPiAwKVxyXG4gICAgICBuZXdFZGdlID0gdG1wO1xyXG5cclxuICAgIGlmKG9sZEVkZ2UuaW5zaWRlKCkpe1xyXG4gICAgICBvbGRFZGdlID0gb2xkRWRnZS5yZW1vdmUoKVswXTtcclxuICAgIH0gXHJcbiAgICAgIFxyXG4gICAgaWYobmV3RWRnZS5yZW1vdmVkKCkpe1xyXG4gICAgICBuZXdFZGdlID0gbmV3RWRnZS5yZXN0b3JlKCk7XHJcbiAgICAgIG5ld0VkZ2UudW5zZWxlY3QoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgb2xkRWRnZTogbmV3RWRnZSxcclxuICAgICAgbmV3RWRnZTogb2xkRWRnZVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHVyLmFjdGlvbignY2hhbmdlQW5jaG9yUG9pbnRzJywgY2hhbmdlQW5jaG9yUG9pbnRzLCBjaGFuZ2VBbmNob3JQb2ludHMpO1xyXG4gIHVyLmFjdGlvbignbW92ZUFuY2hvclBvaW50cycsIG1vdmVEbywgbW92ZURvKTtcclxuICB1ci5hY3Rpb24oJ3JlY29ubmVjdEVkZ2UnLCByZWNvbm5lY3RFZGdlLCByZWNvbm5lY3RFZGdlKTtcclxuICB1ci5hY3Rpb24oJ3JlbW92ZVJlY29ubmVjdGVkRWRnZScsIHJlbW92ZVJlY29ubmVjdGVkRWRnZSwgcmVtb3ZlUmVjb25uZWN0ZWRFZGdlKTtcclxufTtcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyg1NzkpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==