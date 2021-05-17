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
      pointPos: "bendPointPositions"
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
    if (srcPoint.y == tgtPoint.y && srcPoint.x < tgtPoint.x) {
      return 1;
    }
    if (srcPoint.y < tgtPoint.y && srcPoint.x < tgtPoint.x) {
      return 2;
    }
    if (srcPoint.y < tgtPoint.y && srcPoint.x == tgtPoint.x) {
      return 3;
    }
    if (srcPoint.y < tgtPoint.y && srcPoint.x > tgtPoint.x) {
      return 4;
    }
    if (srcPoint.y == tgtPoint.y && srcPoint.x > tgtPoint.x) {
      return 5;
    }
    if (srcPoint.y > tgtPoint.y && srcPoint.x > tgtPoint.x) {
      return 6;
    }
    if (srcPoint.y > tgtPoint.y && srcPoint.x == tgtPoint.x) {
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
    } else if (m1 == 0) {
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

    var srcPos = edge.source().position();
    var tgtPos = edge.target().position();

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

    for (var s = 0; s < minLengths; s++) {
      var w = weights[s];
      var d = distances[s];

      var w1 = 1 - w;
      var w2 = w;

      var posPts = {
        x1: srcPos.x,
        x2: tgtPos.x,
        y1: srcPos.y,
        y2: tgtPos.y
      };

      var midptPts = posPts;

      var adjustedMidpt = {
        x: midptPts.x1 * w1 + midptPts.x2 * w2,
        y: midptPts.y1 * w1 + midptPts.y2 * w2
      };

      anchorList.push(adjustedMidpt.x + vectorNormInverse.x * d, adjustedMidpt.y + vectorNormInverse.y * d);
    }

    return anchorList;
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
        if (parseFloat(edge.css('width')) <= 2.5) return 2.5 * factor;else return parseFloat(edge.css('width')) * factor;
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

        return { "costDistance": cost, "x": targetPointX, "y": targetPointY };
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
        if (judgePrev.costDistance < judgeNext.costDistance && judgePrev.costDistance * zoomLevel < opts.stickyAnchorTolerence) {
          decisionObj = { x: judgePrev.x, y: judgePrev.y, angleFromPoint: prevPointPosition };
        } else if (judgeNext.costDistance < judgePrev.costDistance && judgeNext.costDistance * zoomLevel < opts.stickyAnchorTolerence) {
          decisionObj = { x: judgeNext.x, y: judgeNext.y, angleFromPoint: nextPointPosition };
        }

        if (decisionObj != null) {
          position.x = decisionObj.x;
          position.y = decisionObj.y;
          //repeat one time for the other point, it might be able to match an angle from the other point as well 
          var judgeAgainPoint = prevPointPosition;
          if (judgeAgainPoint == decisionObj.angleFromPoint) judgeAgainPoint = nextPointPosition;
          var judgeAgain = _calcCostToPreferredPosition(judgeAgainPoint, position);
          var secondDecisionObj = null;
          if (judgeAgain.costDistance * zoomLevel < opts.stickyAnchorTolerence) secondDecisionObj = { x: judgeAgain.x, y: judgeAgain.y };
          if (secondDecisionObj != null) {
            position.x = secondDecisionObj.x;
            position.y = secondDecisionObj.y;
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

              if (nearToLine) {
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
      stickyAnchorTolerence: 20 //-1 actually disable this feature, change it to 20 to test the feature
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jeXRvc2NhcGVFZGdlRWRpdGluZy93ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24iLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvQW5jaG9yUG9pbnRVdGlsaXRpZXMuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvVUlVdGlsaXRpZXMuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvZGVib3VuY2UuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvLi9zcmMvcmVjb25uZWN0aW9uVXRpbGl0aWVzLmpzIiwid2VicGFjazovL2N5dG9zY2FwZUVkZ2VFZGl0aW5nLy4vc3JjL3JlZ2lzdGVyVW5kb1JlZG9GdW5jdGlvbnMuanMiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY3l0b3NjYXBlRWRnZUVkaXRpbmcvd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbImFuY2hvclBvaW50VXRpbGl0aWVzIiwiY3VycmVudEN0eEVkZ2UiLCJ1bmRlZmluZWQiLCJjdXJyZW50Q3R4UG9zIiwiY3VycmVudEFuY2hvckluZGV4IiwiaWdub3JlZENsYXNzZXMiLCJzZXRJZ25vcmVkQ2xhc3NlcyIsIl9pZ25vcmVkQ2xhc3NlcyIsInN5bnRheCIsImJlbmQiLCJlZGdlIiwiY2xhc3MiLCJtdWx0aUNsYXNzIiwid2VpZ2h0IiwiZGlzdGFuY2UiLCJ3ZWlnaHRDc3MiLCJkaXN0YW5jZUNzcyIsInBvaW50UG9zIiwiY29udHJvbCIsImdldEVkZ2VUeXBlIiwiaGFzQ2xhc3MiLCJjc3MiLCJkYXRhIiwibGVuZ3RoIiwiaW5pdEFuY2hvclBvaW50cyIsImJlbmRQb3NpdGlvbnNGY24iLCJjb250cm9sUG9zaXRpb25zRmNuIiwiZWRnZXMiLCJpIiwidHlwZSIsImlzSWdub3JlZEVkZ2UiLCJhbmNob3JQb3NpdGlvbnMiLCJhcHBseSIsInJlc3VsdCIsImNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb25zIiwiZGlzdGFuY2VzIiwid2VpZ2h0cyIsImFkZENsYXNzIiwic3RhcnRYIiwic291cmNlIiwicG9zaXRpb24iLCJzdGFydFkiLCJlbmRYIiwidGFyZ2V0IiwiZW5kWSIsImlkIiwiZ2V0TGluZURpcmVjdGlvbiIsInNyY1BvaW50IiwidGd0UG9pbnQiLCJ5IiwieCIsImdldFNyY1RndFBvaW50c0FuZFRhbmdlbnRzIiwic291cmNlTm9kZSIsInRhcmdldE5vZGUiLCJ0Z3RQb3NpdGlvbiIsInNyY1Bvc2l0aW9uIiwibTEiLCJtMiIsImdldEludGVyc2VjdGlvbiIsInBvaW50Iiwic3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMiLCJpbnRlcnNlY3RYIiwiaW50ZXJzZWN0WSIsIkluZmluaXR5IiwiYTEiLCJhMiIsImludGVyc2VjdGlvblBvaW50IiwiZ2V0QW5jaG9yc0FzQXJyYXkiLCJhbmNob3JMaXN0IiwicHN0eWxlIiwicGZWYWx1ZSIsIm1pbkxlbmd0aHMiLCJNYXRoIiwibWluIiwic3JjUG9zIiwidGd0UG9zIiwiZHkiLCJkeCIsImwiLCJzcXJ0IiwidmVjdG9yIiwidmVjdG9yTm9ybSIsInZlY3Rvck5vcm1JbnZlcnNlIiwicyIsInciLCJkIiwidzEiLCJ3MiIsInBvc1B0cyIsIngxIiwieDIiLCJ5MSIsInkyIiwibWlkcHRQdHMiLCJhZGp1c3RlZE1pZHB0IiwicHVzaCIsImNvbnZlcnRUb0FuY2hvckFic29sdXRlUG9zaXRpb25zIiwiYW5jaG9ySW5kZXgiLCJtaWRYIiwibWlkWSIsImFic29sdXRlWCIsImFic29sdXRlWSIsIm9idGFpblByZXZBbmNob3JBYnNvbHV0ZVBvc2l0aW9ucyIsIm9idGFpbk5leHRBbmNob3JBYnNvbHV0ZVBvc2l0aW9ucyIsImNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb24iLCJwb3ciLCJkaXJlY3Rpb24xIiwiZGlyZWN0aW9uMiIsImFuY2hvclBvaW50cyIsImFuY2hvciIsInJlbGF0aXZlQW5jaG9yUG9zaXRpb24iLCJnZXREaXN0YW5jZXNTdHJpbmciLCJzdHIiLCJnZXRXZWlnaHRzU3RyaW5nIiwiYWRkQW5jaG9yUG9pbnQiLCJuZXdBbmNob3JQb2ludCIsIndlaWdodFN0ciIsImRpc3RhbmNlU3RyIiwicmVsYXRpdmVQb3NpdGlvbiIsIm9yaWdpbmFsQW5jaG9yV2VpZ2h0Iiwic3RhcnRXZWlnaHQiLCJlbmRXZWlnaHQiLCJ3ZWlnaHRzV2l0aFRndFNyYyIsImNvbmNhdCIsImFuY2hvcnNMaXN0IiwibWluRGlzdCIsImludGVyc2VjdGlvbiIsInB0c1dpdGhUZ3RTcmMiLCJuZXdBbmNob3JJbmRleCIsImIxIiwiY29tcGFyZVdpdGhQcmVjaXNpb24iLCJiMiIsImIzIiwiYjQiLCJzdGFydCIsImVuZCIsImN1cnJlbnRJbnRlcnNlY3Rpb24iLCJkaXN0Iiwic3BsaWNlIiwicmVtb3ZlQW5jaG9yIiwiZWRnZVR5cGVJbmNvbmNsdXNpdmVTaG91bGRudEhhcHBlbiIsInBvc2l0aW9uRGF0YVN0ciIsInBvc2l0aW9ucyIsInJlbW92ZUNsYXNzIiwicmVtb3ZlQWxsQW5jaG9ycyIsImNhbGN1bGF0ZURpc3RhbmNlIiwicHQxIiwicHQyIiwiZGlmZlgiLCJkaWZmWSIsIm4xIiwibjIiLCJpc0xlc3NUaGVuT3JFcXVhbCIsInByZWNpc2lvbiIsImRpZmYiLCJhYnMiLCJwbGFjZSIsImNvbnNvbGUiLCJsb2ciLCJtb2R1bGUiLCJleHBvcnRzIiwiZGVib3VuY2UiLCJyZXF1aXJlIiwicmVjb25uZWN0aW9uVXRpbGl0aWVzIiwicmVnaXN0ZXJVbmRvUmVkb0Z1bmN0aW9ucyIsInN0YWdlSWQiLCJwYXJhbXMiLCJjeSIsImZuIiwiYWRkQmVuZFBvaW50Q3h0TWVudUlkIiwicmVtb3ZlQmVuZFBvaW50Q3h0TWVudUlkIiwicmVtb3ZlQWxsQmVuZFBvaW50Q3R4TWVudUlkIiwiYWRkQ29udHJvbFBvaW50Q3h0TWVudUlkIiwicmVtb3ZlQ29udHJvbFBvaW50Q3h0TWVudUlkIiwicmVtb3ZlQWxsQ29udHJvbFBvaW50Q3R4TWVudUlkIiwiZVN0eWxlIiwiZVJlbW92ZSIsImVBZGQiLCJlWm9vbSIsImVTZWxlY3QiLCJlVW5zZWxlY3QiLCJlVGFwU3RhcnQiLCJlVGFwU3RhcnRPbkVkZ2UiLCJlVGFwRHJhZyIsImVUYXBFbmQiLCJlQ3h0VGFwIiwiZURyYWciLCJsYXN0UGFubmluZ0VuYWJsZWQiLCJsYXN0Wm9vbWluZ0VuYWJsZWQiLCJsYXN0Qm94U2VsZWN0aW9uRW5hYmxlZCIsImxhc3RBY3RpdmVCZ09wYWNpdHkiLCJlZGdlVG9IaWdobGlnaHQiLCJudW1iZXJPZlNlbGVjdGVkRWRnZXMiLCJlbmRwb2ludFNoYXBlMSIsImVuZHBvaW50U2hhcGUyIiwiYW5jaG9yVG91Y2hlZCIsIm1vdXNlT3V0IiwiZnVuY3Rpb25zIiwiaW5pdCIsInNlbGYiLCJvcHRzIiwiJGNvbnRhaW5lciIsIiQiLCJjYW52YXNFbGVtZW50SWQiLCIkY2FudmFzRWxlbWVudCIsImZpbmQiLCJhcHBlbmQiLCJzdGFnZSIsIktvbnZhIiwic3RhZ2VzIiwiU3RhZ2UiLCJjb250YWluZXIiLCJ3aWR0aCIsImhlaWdodCIsImNhbnZhcyIsImdldENoaWxkcmVuIiwiTGF5ZXIiLCJhZGQiLCJhbmNob3JNYW5hZ2VyIiwiZWRnZVR5cGUiLCJhbmNob3JzIiwidG91Y2hlZEFuY2hvciIsInRvdWNoZWRBbmNob3JJbmRleCIsImJpbmRMaXN0ZW5lcnMiLCJvbiIsImVNb3VzZURvd24iLCJ1bmJpbmRMaXN0ZW5lcnMiLCJvZmYiLCJldmVudCIsImF1dG91bnNlbGVjdGlmeSIsInVuc2VsZWN0IiwibW92ZUFuY2hvclBhcmFtIiwidHVybk9mZkFjdGl2ZUJnQ29sb3IiLCJkaXNhYmxlR2VzdHVyZXMiLCJhdXRvdW5ncmFiaWZ5IiwiZ2V0U3RhZ2UiLCJlTW91c2VVcCIsImVNb3VzZU91dCIsInNlbGVjdCIsInJlc2V0QWN0aXZlQmdDb2xvciIsInJlc2V0R2VzdHVyZXMiLCJjbGVhckFuY2hvcnNFeGNlcHQiLCJkb250Q2xlYW4iLCJleGNlcHRpb25BcHBsaWVzIiwiZm9yRWFjaCIsImluZGV4IiwiZGVzdHJveSIsInJlbmRlckFuY2hvclNoYXBlcyIsImdldEFuY2hvclNoYXBlc0xlbmd0aCIsImFuY2hvclgiLCJhbmNob3JZIiwicmVuZGVyQW5jaG9yU2hhcGUiLCJkcmF3IiwidG9wTGVmdFgiLCJ0b3BMZWZ0WSIsInJlbmRlcmVkVG9wTGVmdFBvcyIsImNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24iLCJ6b29tIiwibmV3QW5jaG9yIiwiUmVjdCIsImZpbGwiLCJzdHJva2VXaWR0aCIsImRyYWdnYWJsZSIsImN4dEFkZEJlbmRGY24iLCJjeHRBZGRBbmNob3JGY24iLCJjeHRBZGRDb250cm9sRmNuIiwiYW5jaG9yVHlwZSIsImN5VGFyZ2V0IiwicGFyYW0iLCJvcHRpb25zIiwidW5kb2FibGUiLCJ1bmRvUmVkbyIsImRvIiwicmVmcmVzaERyYXdzIiwiY3h0UmVtb3ZlQW5jaG9yRmNuIiwic2V0VGltZW91dCIsImN4dFJlbW92ZUFsbEFuY2hvcnNGY24iLCJoYW5kbGVSZWNvbm5lY3RFZGdlIiwidmFsaWRhdGVFZGdlIiwiYWN0T25VbnN1Y2Nlc3NmdWxSZWNvbm5lY3Rpb24iLCJtZW51SXRlbXMiLCJjb250ZW50IiwiYWRkQmVuZE1lbnVJdGVtVGl0bGUiLCJzZWxlY3RvciIsIm9uQ2xpY2tGdW5jdGlvbiIsInJlbW92ZUJlbmRNZW51SXRlbVRpdGxlIiwicmVtb3ZlQWxsQmVuZE1lbnVJdGVtVGl0bGUiLCJlbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb24iLCJhZGRDb250cm9sTWVudUl0ZW1UaXRsZSIsImNvcmVBc1dlbGwiLCJyZW1vdmVDb250cm9sTWVudUl0ZW1UaXRsZSIsInJlbW92ZUFsbENvbnRyb2xNZW51SXRlbVRpdGxlIiwiY29udGV4dE1lbnVzIiwibWVudXMiLCJpc0FjdGl2ZSIsImFwcGVuZE1lbnVJdGVtcyIsIl9zaXplQ2FudmFzIiwiYXR0ciIsInpJbmRleCIsImNhbnZhc0JiIiwib2Zmc2V0IiwiY29udGFpbmVyQmIiLCJ0b3AiLCJsZWZ0Iiwic2V0V2lkdGgiLCJzZXRIZWlnaHQiLCJzaXplQ2FudmFzIiwid2luZG93IiwiYmluZCIsIm9wdENhY2hlIiwibW9kZWxQb3NpdGlvbiIsInBhbiIsInJlbmRlckVuZFBvaW50U2hhcGVzIiwiZWRnZV9wdHMiLCJzb3VyY2VQb3MiLCJzb3VyY2VFbmRwb2ludCIsInRhcmdldFBvcyIsInRhcmdldEVuZHBvaW50IiwidW5zaGlmdCIsInNyYyIsIm5leHRUb1NvdXJjZSIsIm5leHRUb1RhcmdldCIsInJlbmRlckVhY2hFbmRQb2ludFNoYXBlIiwic1RvcExlZnRYIiwic1RvcExlZnRZIiwidFRvcExlZnRYIiwidFRvcExlZnRZIiwibmV4dFRvU291cmNlWCIsIm5leHRUb1NvdXJjZVkiLCJuZXh0VG9UYXJnZXRYIiwibmV4dFRvVGFyZ2V0WSIsInJlbmRlcmVkU291cmNlUG9zIiwicmVuZGVyZWRUYXJnZXRQb3MiLCJyZW5kZXJlZE5leHRUb1NvdXJjZSIsInJlbmRlcmVkTmV4dFRvVGFyZ2V0IiwiZGlzdGFuY2VGcm9tTm9kZSIsImRpc3RhbmNlU291cmNlIiwic291cmNlRW5kUG9pbnRYIiwic291cmNlRW5kUG9pbnRZIiwiZGlzdGFuY2VUYXJnZXQiLCJ0YXJnZXRFbmRQb2ludFgiLCJ0YXJnZXRFbmRQb2ludFkiLCJDaXJjbGUiLCJyYWRpdXMiLCJmYWN0b3IiLCJhbmNob3JTaGFwZVNpemVGYWN0b3IiLCJwYXJzZUZsb2F0IiwiY2hlY2tJZkluc2lkZVNoYXBlIiwiY2VudGVyWCIsImNlbnRlclkiLCJtaW5YIiwibWF4WCIsIm1pblkiLCJtYXhZIiwiaW5zaWRlIiwiZ2V0Q29udGFpbmluZ1NoYXBlSW5kZXgiLCJnZXRDb250YWluaW5nRW5kUG9pbnQiLCJhbGxQdHMiLCJfcHJpdmF0ZSIsInJzY3JhdGNoIiwiYWxscHRzIiwicGFubmluZ0VuYWJsZWQiLCJ6b29taW5nRW5hYmxlZCIsImJveFNlbGVjdGlvbkVuYWJsZWQiLCJzdHlsZSIsImNvcmVTdHlsZSIsInZhbHVlIiwidXBkYXRlIiwibW92ZUFuY2hvclBvaW50cyIsInBvc2l0aW9uRGlmZiIsInByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uIiwibmV4dEFuY2hvclBvaW50c1Bvc2l0aW9uIiwiYmVuZFBvc2l0aW9uc0Z1bmN0aW9uIiwiY29udHJvbFBvc2l0aW9uc0Z1bmN0aW9uIiwidHJpZ2dlciIsIl9jYWxjQ29zdFRvUHJlZmVycmVkUG9zaXRpb24iLCJwMSIsInAyIiwiY3VycmVudEFuZ2xlIiwiYXRhbjIiLCJwZXJmZWN0QW5nbGUiLCJQSSIsImRlbHRhQW5nbGUiLCJhbmdsZSIsImluZGV4T2ZNaW4iLCJpbmRleE9mIiwiY29zdCIsInNpbiIsImNob3NlbkFuZ2xlIiwiZWRnZUwiLCJjb3MiLCJ0YXJnZXRQb2ludFgiLCJ0YXJnZXRQb2ludFkiLCJtb3ZlQW5jaG9yT25EcmFnIiwicHJldlBvaW50UG9zaXRpb24iLCJuZXh0UG9pbnRQb3NpdGlvbiIsIm1vdXNlUG9zaXRpb24iLCJqdWRnZVByZXYiLCJqdWRnZU5leHQiLCJkZWNpc2lvbk9iaiIsInpvb21MZXZlbCIsImNvc3REaXN0YW5jZSIsInN0aWNreUFuY2hvclRvbGVyZW5jZSIsImFuZ2xlRnJvbVBvaW50IiwianVkZ2VBZ2FpblBvaW50IiwianVkZ2VBZ2FpbiIsInNlY29uZERlY2lzaW9uT2JqIiwiX21vdmVBbmNob3JPbkRyYWciLCJzZWxlY3RlZEVkZ2VzIiwic2VsZWN0ZWQiLCJzdGFydEJhdGNoIiwiZW5kQmF0Y2giLCJjb25uZWN0ZWRFZGdlcyIsIm1vdmVkQW5jaG9ySW5kZXgiLCJ0YXBTdGFydFBvcyIsIm1vdmVkRWRnZSIsImNyZWF0ZUFuY2hvck9uRHJhZyIsIm1vdmVkRW5kUG9pbnQiLCJkdW1teU5vZGUiLCJkZXRhY2hlZE5vZGUiLCJub2RlVG9BdHRhY2giLCJhbmNob3JDcmVhdGVkQnlEcmFnIiwiY3lQb3NpdGlvbiIsImN5UG9zWCIsImN5UG9zWSIsImVuZFBvaW50IiwiZGlzY29ubmVjdGVkRW5kIiwiZGlzY29ubmVjdEVkZ2UiLCJyZW5kZXJlZFBvc2l0aW9uIiwibm9kZSIsIm5vZGVzIiwiZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnIiwiZXZlbnRQb3MiLCJpc05vZGUiLCJmaXJlIiwiYWxsQW5jaG9ycyIsInByZUluZGV4IiwicG9zSW5kZXgiLCJwcmVBbmNob3JQb2ludCIsInBvc0FuY2hvclBvaW50IiwibmVhclRvTGluZSIsImJlbmRSZW1vdmFsU2Vuc2l0aXZpdHkiLCJuZXdOb2RlIiwiaXNWYWxpZCIsImxvY2F0aW9uIiwibmV3U291cmNlIiwibmV3VGFyZ2V0IiwiY29ubmVjdEVkZ2UiLCJyZWNvbm5lY3RlZEVkZ2UiLCJjb3B5RWRnZSIsIm5ld0VkZ2UiLCJvbGRFZGdlIiwicmVtb3ZlIiwibG9jIiwib2xkTG9jIiwidG9TdHJpbmciLCJtb3ZlYW5jaG9ycGFyYW0iLCJmaXJzdEFuY2hvciIsImVkZ2VDb250YWluaW5nRmlyc3RBbmNob3IiLCJmaXJzdEFuY2hvclBvaW50Rm91bmQiLCJlIiwiZmlyc3RUaW1lIiwiZmlyc3RBbmNob3JQb3NpdGlvbiIsImluaXRpYWxQb3MiLCJtb3ZlZEZpcnN0QW5jaG9yIiwidGFyZ2V0SXNFZGdlIiwiaXNFZGdlIiwiZXJyIiwiaGlkZU1lbnVJdGVtIiwiY3lQb3MiLCJzZWxlY3RlZEluZGV4Iiwic2hvd01lbnVJdGVtIiwiYW5jaG9yc01vdmluZyIsImtleXMiLCJrZXlEb3duIiwic2hvdWxkTW92ZSIsIm1vdmVTZWxlY3RlZEFuY2hvcnNPbktleUV2ZW50cyIsInRuIiwiZG9jdW1lbnQiLCJhY3RpdmVFbGVtZW50IiwidGFnTmFtZSIsImtleUNvZGUiLCJwcmV2ZW50RGVmYXVsdCIsImVsZW1lbnRzIiwibW92ZVNwZWVkIiwiYWx0S2V5Iiwic2hpZnRLZXkiLCJ1cEFycm93Q29kZSIsImRvd25BcnJvd0NvZGUiLCJsZWZ0QXJyb3dDb2RlIiwicmlnaHRBcnJvd0NvZGUiLCJrZXlVcCIsImFkZEV2ZW50TGlzdGVuZXIiLCJ1bmJpbmQiLCJBcnJheSIsInByb3RvdHlwZSIsInNsaWNlIiwiY2FsbCIsImFyZ3VtZW50cyIsImVycm9yIiwiRlVOQ19FUlJPUl9URVhUIiwibmF0aXZlTWF4IiwibWF4IiwibmF0aXZlTm93IiwiRGF0ZSIsIm5vdyIsImdldFRpbWUiLCJmdW5jIiwid2FpdCIsImFyZ3MiLCJtYXhUaW1lb3V0SWQiLCJzdGFtcCIsInRoaXNBcmciLCJ0aW1lb3V0SWQiLCJ0cmFpbGluZ0NhbGwiLCJsYXN0Q2FsbGVkIiwibWF4V2FpdCIsInRyYWlsaW5nIiwiVHlwZUVycm9yIiwibGVhZGluZyIsImlzT2JqZWN0IiwiY2FuY2VsIiwiY2xlYXJUaW1lb3V0IiwiY29tcGxldGUiLCJpc0NhbGxlZCIsImRlbGF5ZWQiLCJyZW1haW5pbmciLCJtYXhEZWxheWVkIiwiZGVib3VuY2VkIiwibGVhZGluZ0NhbGwiLCJyZWdpc3RlciIsImN5dG9zY2FwZSIsInVpVXRpbGl0aWVzIiwiZGVmYXVsdHMiLCJlbGUiLCJpbml0QW5jaG9yc0F1dG9tYXRpY2FsbHkiLCJlbmFibGVkIiwiaW5pdGlhbGl6ZWQiLCJleHRlbmQiLCJvYmoiLCJpc05hTiIsImluc3RhbmNlIiwiZWxlcyIsImRlbGV0ZVNlbGVjdGVkQW5jaG9yIiwiZGVmaW5lIiwicG9ydHMiLCJtb3ZlIiwiY29weUFuY2hvcnMiLCJjb3B5U3R5bGUiLCJicERpc3RhbmNlcyIsImJwV2VpZ2h0cyIsInVyIiwiZGVmYXVsdEFjdGlvbnMiLCJpc0RlYnVnIiwiY2hhbmdlQW5jaG9yUG9pbnRzIiwiZ2V0RWxlbWVudEJ5SWQiLCJzZXQiLCJoYWRBbmNob3JQb2ludCIsImhhZE11bHRpcGxlQW5jaG9yUG9pbnRzIiwicmVtb3ZlRGF0YSIsInNpbmdsZUNsYXNzTmFtZSIsIm11bHRpQ2xhc3NOYW1lIiwibW92ZURvIiwiYXJnIiwibW92ZUFuY2hvcnNVbmRvYWJsZSIsIm5leHRBbmNob3JzUG9zaXRpb24iLCJyZWNvbm5lY3RFZGdlIiwicmVtb3ZlUmVjb25uZWN0ZWRFZGdlIiwidG1wIiwicmVtb3ZlZCIsInJlc3RvcmUiLCJhY3Rpb24iXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPOzs7Ozs7Ozs7QUNWQSxJQUFJQSx1QkFBdUI7QUFDekJDLGtCQUFnQkMsU0FEUztBQUV6QkMsaUJBQWVELFNBRlU7QUFHekJFLHNCQUFvQkYsU0FISztBQUl6Qkcsa0JBQWdCSCxTQUpTO0FBS3pCSSxxQkFBbUIsMkJBQVNDLGVBQVQsRUFBMEI7QUFDM0MsU0FBS0YsY0FBTCxHQUFzQkUsZUFBdEI7QUFDRCxHQVB3QjtBQVF6QkMsVUFBUTtBQUNOQyxVQUFNO0FBQ0pDLFlBQU0sVUFERjtBQUVKQyxhQUFPLCtCQUZIO0FBR0pDLGtCQUFZLHVDQUhSO0FBSUpDLGNBQVEsMEJBSko7QUFLSkMsZ0JBQVUsNEJBTE47QUFNSkMsaUJBQVcsaUJBTlA7QUFPSkMsbUJBQWEsbUJBUFQ7QUFRSkMsZ0JBQVU7QUFSTixLQURBO0FBV05DLGFBQVM7QUFDUFIsWUFBTSxrQkFEQztBQUVQQyxhQUFPLHFDQUZBO0FBR1BDLGtCQUFZLDZDQUhMO0FBSVBDLGNBQVEsNkJBSkQ7QUFLUEMsZ0JBQVUsK0JBTEg7QUFNUEMsaUJBQVcsdUJBTko7QUFPUEMsbUJBQWEseUJBUE47QUFRUEMsZ0JBQVU7QUFSSDtBQVhILEdBUmlCO0FBOEJ6QjtBQUNBO0FBQ0E7QUFDQUUsZUFBYSxxQkFBU1QsSUFBVCxFQUFjO0FBQ3pCLFFBQUcsQ0FBQ0EsSUFBSixFQUNFLE9BQU8sY0FBUCxDQURGLEtBRUssSUFBR0EsS0FBS1UsUUFBTCxDQUFjLEtBQUtaLE1BQUwsQ0FBWSxNQUFaLEVBQW9CLE9BQXBCLENBQWQsQ0FBSCxFQUNILE9BQU8sTUFBUCxDQURHLEtBRUEsSUFBR0UsS0FBS1UsUUFBTCxDQUFjLEtBQUtaLE1BQUwsQ0FBWSxTQUFaLEVBQXVCLE9BQXZCLENBQWQsQ0FBSCxFQUNILE9BQU8sU0FBUCxDQURHLEtBRUEsSUFBR0UsS0FBS1csR0FBTCxDQUFTLGFBQVQsTUFBNEIsS0FBS2IsTUFBTCxDQUFZLE1BQVosRUFBb0IsTUFBcEIsQ0FBL0IsRUFDSCxPQUFPLE1BQVAsQ0FERyxLQUVBLElBQUdFLEtBQUtXLEdBQUwsQ0FBUyxhQUFULE1BQTRCLEtBQUtiLE1BQUwsQ0FBWSxTQUFaLEVBQXVCLE1BQXZCLENBQS9CLEVBQ0gsT0FBTyxTQUFQLENBREcsS0FFQSxJQUFHRSxLQUFLWSxJQUFMLENBQVUsS0FBS2QsTUFBTCxDQUFZLE1BQVosRUFBb0IsVUFBcEIsQ0FBVixLQUNBRSxLQUFLWSxJQUFMLENBQVUsS0FBS2QsTUFBTCxDQUFZLE1BQVosRUFBb0IsVUFBcEIsQ0FBVixFQUEyQ2UsTUFBM0MsR0FBb0QsQ0FEdkQsRUFFSCxPQUFPLE1BQVAsQ0FGRyxLQUdBLElBQUdiLEtBQUtZLElBQUwsQ0FBVSxLQUFLZCxNQUFMLENBQVksU0FBWixFQUF1QixVQUF2QixDQUFWLEtBQ0FFLEtBQUtZLElBQUwsQ0FBVSxLQUFLZCxNQUFMLENBQVksU0FBWixFQUF1QixVQUF2QixDQUFWLEVBQThDZSxNQUE5QyxHQUF1RCxDQUQxRCxFQUVILE9BQU8sU0FBUDtBQUNGLFdBQU8sY0FBUDtBQUNELEdBbkR3QjtBQW9EekI7QUFDQUMsb0JBQWtCLDBCQUFTQyxnQkFBVCxFQUEyQkMsbUJBQTNCLEVBQWdEQyxLQUFoRCxFQUF1RDtBQUN2RSxTQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUQsTUFBTUosTUFBMUIsRUFBa0NLLEdBQWxDLEVBQXVDO0FBQ3JDLFVBQUlsQixPQUFPaUIsTUFBTUMsQ0FBTixDQUFYO0FBQ0EsVUFBSUMsT0FBTyxLQUFLVixXQUFMLENBQWlCVCxJQUFqQixDQUFYOztBQUVBLFVBQUltQixTQUFTLGNBQWIsRUFBNkI7QUFDM0I7QUFDRDs7QUFFRCxVQUFHLENBQUMsS0FBS0MsYUFBTCxDQUFtQnBCLElBQW5CLENBQUosRUFBOEI7O0FBRTVCLFlBQUlxQixlQUFKOztBQUVBO0FBQ0EsWUFBR0YsU0FBUyxNQUFaLEVBQ0VFLGtCQUFrQk4saUJBQWlCTyxLQUFqQixDQUF1QixJQUF2QixFQUE2QnRCLElBQTdCLENBQWxCLENBREYsS0FFSyxJQUFHbUIsU0FBUyxTQUFaLEVBQ0hFLGtCQUFrQkwsb0JBQW9CTSxLQUFwQixDQUEwQixJQUExQixFQUFnQ3RCLElBQWhDLENBQWxCOztBQUVGO0FBQ0EsWUFBSXVCLFNBQVMsS0FBS0MsMEJBQUwsQ0FBZ0N4QixJQUFoQyxFQUFzQ3FCLGVBQXRDLENBQWI7O0FBRUE7QUFDQSxZQUFJRSxPQUFPRSxTQUFQLENBQWlCWixNQUFqQixHQUEwQixDQUE5QixFQUFpQztBQUMvQmIsZUFBS1ksSUFBTCxDQUFVLEtBQUtkLE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsUUFBbEIsQ0FBVixFQUF1Q0ksT0FBT0csT0FBOUM7QUFDQTFCLGVBQUtZLElBQUwsQ0FBVSxLQUFLZCxNQUFMLENBQVlxQixJQUFaLEVBQWtCLFVBQWxCLENBQVYsRUFBeUNJLE9BQU9FLFNBQWhEO0FBQ0F6QixlQUFLMkIsUUFBTCxDQUFjLEtBQUs3QixNQUFMLENBQVlxQixJQUFaLEVBQWtCLE9BQWxCLENBQWQ7QUFDQSxjQUFJSSxPQUFPRSxTQUFQLENBQWlCWixNQUFqQixHQUEwQixDQUE5QixFQUFpQztBQUMvQmIsaUJBQUsyQixRQUFMLENBQWMsS0FBSzdCLE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsWUFBbEIsQ0FBZDtBQUNEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0YsR0F0RndCOztBQXdGekJDLGlCQUFlLHVCQUFTcEIsSUFBVCxFQUFlOztBQUU1QixRQUFJNEIsU0FBUzVCLEtBQUs2QixNQUFMLEdBQWNDLFFBQWQsQ0FBdUIsR0FBdkIsQ0FBYjtBQUNBLFFBQUlDLFNBQVMvQixLQUFLNkIsTUFBTCxHQUFjQyxRQUFkLENBQXVCLEdBQXZCLENBQWI7QUFDQSxRQUFJRSxPQUFPaEMsS0FBS2lDLE1BQUwsR0FBY0gsUUFBZCxDQUF1QixHQUF2QixDQUFYO0FBQ0EsUUFBSUksT0FBT2xDLEtBQUtpQyxNQUFMLEdBQWNILFFBQWQsQ0FBdUIsR0FBdkIsQ0FBWDs7QUFFQSxRQUFJRixVQUFVSSxJQUFWLElBQWtCRCxVQUFVRyxJQUE3QixJQUF3Q2xDLEtBQUs2QixNQUFMLEdBQWNNLEVBQWQsTUFBc0JuQyxLQUFLaUMsTUFBTCxHQUFjRSxFQUFkLEVBQWpFLEVBQXFGO0FBQ25GLGFBQU8sSUFBUDtBQUNEO0FBQ0QsU0FBSSxJQUFJakIsSUFBSSxDQUFaLEVBQWUsS0FBS3ZCLGNBQUwsSUFBdUJ1QixJQUFLLEtBQUt2QixjQUFMLENBQW9Ca0IsTUFBL0QsRUFBdUVLLEdBQXZFLEVBQTJFO0FBQ3pFLFVBQUdsQixLQUFLVSxRQUFMLENBQWMsS0FBS2YsY0FBTCxDQUFvQnVCLENBQXBCLENBQWQsQ0FBSCxFQUNFLE9BQU8sSUFBUDtBQUNIO0FBQ0QsV0FBTyxLQUFQO0FBQ0QsR0F2R3dCO0FBd0d6QjtBQUNBa0Isb0JBQWtCLDBCQUFTQyxRQUFULEVBQW1CQyxRQUFuQixFQUE0QjtBQUM1QyxRQUFHRCxTQUFTRSxDQUFULElBQWNELFNBQVNDLENBQXZCLElBQTRCRixTQUFTRyxDQUFULEdBQWFGLFNBQVNFLENBQXJELEVBQXVEO0FBQ3JELGFBQU8sQ0FBUDtBQUNEO0FBQ0QsUUFBR0gsU0FBU0UsQ0FBVCxHQUFhRCxTQUFTQyxDQUF0QixJQUEyQkYsU0FBU0csQ0FBVCxHQUFhRixTQUFTRSxDQUFwRCxFQUFzRDtBQUNwRCxhQUFPLENBQVA7QUFDRDtBQUNELFFBQUdILFNBQVNFLENBQVQsR0FBYUQsU0FBU0MsQ0FBdEIsSUFBMkJGLFNBQVNHLENBQVQsSUFBY0YsU0FBU0UsQ0FBckQsRUFBdUQ7QUFDckQsYUFBTyxDQUFQO0FBQ0Q7QUFDRCxRQUFHSCxTQUFTRSxDQUFULEdBQWFELFNBQVNDLENBQXRCLElBQTJCRixTQUFTRyxDQUFULEdBQWFGLFNBQVNFLENBQXBELEVBQXNEO0FBQ3BELGFBQU8sQ0FBUDtBQUNEO0FBQ0QsUUFBR0gsU0FBU0UsQ0FBVCxJQUFjRCxTQUFTQyxDQUF2QixJQUE0QkYsU0FBU0csQ0FBVCxHQUFhRixTQUFTRSxDQUFyRCxFQUF1RDtBQUNyRCxhQUFPLENBQVA7QUFDRDtBQUNELFFBQUdILFNBQVNFLENBQVQsR0FBYUQsU0FBU0MsQ0FBdEIsSUFBMkJGLFNBQVNHLENBQVQsR0FBYUYsU0FBU0UsQ0FBcEQsRUFBc0Q7QUFDcEQsYUFBTyxDQUFQO0FBQ0Q7QUFDRCxRQUFHSCxTQUFTRSxDQUFULEdBQWFELFNBQVNDLENBQXRCLElBQTJCRixTQUFTRyxDQUFULElBQWNGLFNBQVNFLENBQXJELEVBQXVEO0FBQ3JELGFBQU8sQ0FBUDtBQUNEO0FBQ0QsV0FBTyxDQUFQLENBdEI0QyxDQXNCbkM7QUFDVixHQWhJd0I7QUFpSXpCQyw4QkFBNEIsb0NBQVV6QyxJQUFWLEVBQWdCO0FBQzFDLFFBQUkwQyxhQUFhMUMsS0FBSzZCLE1BQUwsRUFBakI7QUFDQSxRQUFJYyxhQUFhM0MsS0FBS2lDLE1BQUwsRUFBakI7O0FBRUEsUUFBSVcsY0FBY0QsV0FBV2IsUUFBWCxFQUFsQjtBQUNBLFFBQUllLGNBQWNILFdBQVdaLFFBQVgsRUFBbEI7O0FBRUEsUUFBSU8sV0FBV0ssV0FBV1osUUFBWCxFQUFmO0FBQ0EsUUFBSVEsV0FBV0ssV0FBV2IsUUFBWCxFQUFmOztBQUdBLFFBQUlnQixLQUFLLENBQUNSLFNBQVNDLENBQVQsR0FBYUYsU0FBU0UsQ0FBdkIsS0FBNkJELFNBQVNFLENBQVQsR0FBYUgsU0FBU0csQ0FBbkQsQ0FBVDtBQUNBLFFBQUlPLEtBQUssQ0FBQyxDQUFELEdBQUtELEVBQWQ7O0FBRUEsV0FBTztBQUNMQSxVQUFJQSxFQURDO0FBRUxDLFVBQUlBLEVBRkM7QUFHTFYsZ0JBQVVBLFFBSEw7QUFJTEMsZ0JBQVVBO0FBSkwsS0FBUDtBQU1ELEdBckp3QjtBQXNKekJVLG1CQUFpQix5QkFBU2hELElBQVQsRUFBZWlELEtBQWYsRUFBc0JDLHVCQUF0QixFQUE4QztBQUM3RCxRQUFJQSw0QkFBNEIxRCxTQUFoQyxFQUEyQztBQUN6QzBELGdDQUEwQixLQUFLVCwwQkFBTCxDQUFnQ3pDLElBQWhDLENBQTFCO0FBQ0Q7O0FBRUQsUUFBSXFDLFdBQVdhLHdCQUF3QmIsUUFBdkM7QUFDQSxRQUFJQyxXQUFXWSx3QkFBd0JaLFFBQXZDO0FBQ0EsUUFBSVEsS0FBS0ksd0JBQXdCSixFQUFqQztBQUNBLFFBQUlDLEtBQUtHLHdCQUF3QkgsRUFBakM7O0FBRUEsUUFBSUksVUFBSjtBQUNBLFFBQUlDLFVBQUo7O0FBRUEsUUFBR04sTUFBTU8sUUFBTixJQUFrQlAsTUFBTSxDQUFDTyxRQUE1QixFQUFxQztBQUNuQ0YsbUJBQWFkLFNBQVNHLENBQXRCO0FBQ0FZLG1CQUFhSCxNQUFNVixDQUFuQjtBQUNELEtBSEQsTUFJSyxJQUFHTyxNQUFNLENBQVQsRUFBVztBQUNkSyxtQkFBYUYsTUFBTVQsQ0FBbkI7QUFDQVksbUJBQWFmLFNBQVNFLENBQXRCO0FBQ0QsS0FISSxNQUlBO0FBQ0gsVUFBSWUsS0FBS2pCLFNBQVNFLENBQVQsR0FBYU8sS0FBS1QsU0FBU0csQ0FBcEM7QUFDQSxVQUFJZSxLQUFLTixNQUFNVixDQUFOLEdBQVVRLEtBQUtFLE1BQU1ULENBQTlCOztBQUVBVyxtQkFBYSxDQUFDSSxLQUFLRCxFQUFOLEtBQWFSLEtBQUtDLEVBQWxCLENBQWI7QUFDQUssbUJBQWFOLEtBQUtLLFVBQUwsR0FBa0JHLEVBQS9CO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBLFFBQUlFLG9CQUFvQjtBQUN0QmhCLFNBQUdXLFVBRG1CO0FBRXRCWixTQUFHYTtBQUZtQixLQUF4Qjs7QUFLQSxXQUFPSSxpQkFBUDtBQUNELEdBM0x3QjtBQTRMekJDLHFCQUFtQiwyQkFBU3pELElBQVQsRUFBZTtBQUNoQyxRQUFJbUIsT0FBTyxLQUFLVixXQUFMLENBQWlCVCxJQUFqQixDQUFYOztBQUVBLFFBQUdtQixTQUFTLGNBQVosRUFBMkI7QUFDekIsYUFBTzNCLFNBQVA7QUFDRDs7QUFFRCxRQUFJUSxLQUFLVyxHQUFMLENBQVMsYUFBVCxNQUE0QixLQUFLYixNQUFMLENBQVlxQixJQUFaLEVBQWtCLE1BQWxCLENBQWhDLEVBQTREO0FBQzFELGFBQU8zQixTQUFQO0FBQ0Q7O0FBRUQsUUFBSWtFLGFBQWEsRUFBakI7O0FBRUEsUUFBSWhDLFVBQVUxQixLQUFLMkQsTUFBTCxDQUFhLEtBQUs3RCxNQUFMLENBQVlxQixJQUFaLEVBQWtCLFdBQWxCLENBQWIsSUFDQW5CLEtBQUsyRCxNQUFMLENBQWEsS0FBSzdELE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsV0FBbEIsQ0FBYixFQUE4Q3lDLE9BRDlDLEdBQ3dELEVBRHRFO0FBRUEsUUFBSW5DLFlBQVl6QixLQUFLMkQsTUFBTCxDQUFhLEtBQUs3RCxNQUFMLENBQVlxQixJQUFaLEVBQWtCLGFBQWxCLENBQWIsSUFDRm5CLEtBQUsyRCxNQUFMLENBQWEsS0FBSzdELE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsYUFBbEIsQ0FBYixFQUFnRHlDLE9BRDlDLEdBQ3dELEVBRHhFO0FBRUEsUUFBSUMsYUFBYUMsS0FBS0MsR0FBTCxDQUFVckMsUUFBUWIsTUFBbEIsRUFBMEJZLFVBQVVaLE1BQXBDLENBQWpCOztBQUVBLFFBQUltRCxTQUFTaEUsS0FBSzZCLE1BQUwsR0FBY0MsUUFBZCxFQUFiO0FBQ0EsUUFBSW1DLFNBQVNqRSxLQUFLaUMsTUFBTCxHQUFjSCxRQUFkLEVBQWI7O0FBRUEsUUFBSW9DLEtBQU9ELE9BQU8xQixDQUFQLEdBQVd5QixPQUFPekIsQ0FBN0I7QUFDQSxRQUFJNEIsS0FBT0YsT0FBT3pCLENBQVAsR0FBV3dCLE9BQU94QixDQUE3Qjs7QUFFQSxRQUFJNEIsSUFBSU4sS0FBS08sSUFBTCxDQUFXRixLQUFLQSxFQUFMLEdBQVVELEtBQUtBLEVBQTFCLENBQVI7O0FBRUEsUUFBSUksU0FBUztBQUNYOUIsU0FBRzJCLEVBRFE7QUFFWDVCLFNBQUcyQjtBQUZRLEtBQWI7O0FBS0EsUUFBSUssYUFBYTtBQUNmL0IsU0FBRzhCLE9BQU85QixDQUFQLEdBQVc0QixDQURDO0FBRWY3QixTQUFHK0IsT0FBTy9CLENBQVAsR0FBVzZCO0FBRkMsS0FBakI7O0FBS0EsUUFBSUksb0JBQW9CO0FBQ3RCaEMsU0FBRyxDQUFDK0IsV0FBV2hDLENBRE87QUFFdEJBLFNBQUdnQyxXQUFXL0I7QUFGUSxLQUF4Qjs7QUFLQSxTQUFLLElBQUlpQyxJQUFJLENBQWIsRUFBZ0JBLElBQUlaLFVBQXBCLEVBQWdDWSxHQUFoQyxFQUFxQztBQUNuQyxVQUFJQyxJQUFJaEQsUUFBUytDLENBQVQsQ0FBUjtBQUNBLFVBQUlFLElBQUlsRCxVQUFXZ0QsQ0FBWCxDQUFSOztBQUVBLFVBQUlHLEtBQU0sSUFBSUYsQ0FBZDtBQUNBLFVBQUlHLEtBQUtILENBQVQ7O0FBRUEsVUFBSUksU0FBUztBQUNYQyxZQUFJZixPQUFPeEIsQ0FEQTtBQUVYd0MsWUFBSWYsT0FBT3pCLENBRkE7QUFHWHlDLFlBQUlqQixPQUFPekIsQ0FIQTtBQUlYMkMsWUFBSWpCLE9BQU8xQjtBQUpBLE9BQWI7O0FBT0EsVUFBSTRDLFdBQVdMLE1BQWY7O0FBRUEsVUFBSU0sZ0JBQWdCO0FBQ2xCNUMsV0FBRzJDLFNBQVNKLEVBQVQsR0FBY0gsRUFBZCxHQUFtQk8sU0FBU0gsRUFBVCxHQUFjSCxFQURsQjtBQUVsQnRDLFdBQUc0QyxTQUFTRixFQUFULEdBQWNMLEVBQWQsR0FBbUJPLFNBQVNELEVBQVQsR0FBY0w7QUFGbEIsT0FBcEI7O0FBS0FuQixpQkFBVzJCLElBQVgsQ0FDRUQsY0FBYzVDLENBQWQsR0FBa0JnQyxrQkFBa0JoQyxDQUFsQixHQUFzQm1DLENBRDFDLEVBRUVTLGNBQWM3QyxDQUFkLEdBQWtCaUMsa0JBQWtCakMsQ0FBbEIsR0FBc0JvQyxDQUYxQztBQUlEOztBQUVELFdBQU9qQixVQUFQO0FBQ0QsR0FsUXdCO0FBbVF6QjRCLG9DQUFrQywwQ0FBVXRGLElBQVYsRUFBZ0JtQixJQUFoQixFQUFzQm9FLFdBQXRCLEVBQW1DO0FBQ25FLFFBQUl2QixTQUFTaEUsS0FBSzZCLE1BQUwsR0FBY0MsUUFBZCxFQUFiO0FBQ0EsUUFBSW1DLFNBQVNqRSxLQUFLaUMsTUFBTCxHQUFjSCxRQUFkLEVBQWI7QUFDQSxRQUFJSixVQUFVMUIsS0FBS1ksSUFBTCxDQUFVLEtBQUtkLE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsUUFBbEIsQ0FBVixDQUFkO0FBQ0EsUUFBSU0sWUFBWXpCLEtBQUtZLElBQUwsQ0FBVSxLQUFLZCxNQUFMLENBQVlxQixJQUFaLEVBQWtCLFVBQWxCLENBQVYsQ0FBaEI7QUFDQSxRQUFJdUQsSUFBSWhELFFBQVM2RCxXQUFULENBQVI7QUFDQSxRQUFJWixJQUFJbEQsVUFBVzhELFdBQVgsQ0FBUjtBQUNBLFFBQUlyQixLQUFPRCxPQUFPMUIsQ0FBUCxHQUFXeUIsT0FBT3pCLENBQTdCO0FBQ0EsUUFBSTRCLEtBQU9GLE9BQU96QixDQUFQLEdBQVd3QixPQUFPeEIsQ0FBN0I7QUFDQSxRQUFJNEIsSUFBSU4sS0FBS08sSUFBTCxDQUFXRixLQUFLQSxFQUFMLEdBQVVELEtBQUtBLEVBQTFCLENBQVI7QUFDQSxRQUFJSSxTQUFTO0FBQ1g5QixTQUFHMkIsRUFEUTtBQUVYNUIsU0FBRzJCO0FBRlEsS0FBYjtBQUlBLFFBQUlLLGFBQWE7QUFDZi9CLFNBQUc4QixPQUFPOUIsQ0FBUCxHQUFXNEIsQ0FEQztBQUVmN0IsU0FBRytCLE9BQU8vQixDQUFQLEdBQVc2QjtBQUZDLEtBQWpCO0FBSUEsUUFBSUksb0JBQW9CO0FBQ3RCaEMsU0FBRyxDQUFDK0IsV0FBV2hDLENBRE87QUFFdEJBLFNBQUdnQyxXQUFXL0I7QUFGUSxLQUF4Qjs7QUFLQSxRQUFJb0MsS0FBTSxJQUFJRixDQUFkO0FBQ0EsUUFBSUcsS0FBS0gsQ0FBVDtBQUNBLFFBQUljLE9BQU14QixPQUFPeEIsQ0FBUCxHQUFXb0MsRUFBWCxHQUFnQlgsT0FBT3pCLENBQVAsR0FBV3FDLEVBQXJDO0FBQ0EsUUFBSVksT0FBTXpCLE9BQU96QixDQUFQLEdBQVdxQyxFQUFYLEdBQWdCWCxPQUFPMUIsQ0FBUCxHQUFXc0MsRUFBckM7QUFDQSxRQUFJYSxZQUFXRixPQUFPaEIsa0JBQWtCaEMsQ0FBbEIsR0FBc0JtQyxDQUE1QztBQUNBLFFBQUlnQixZQUFXRixPQUFPakIsa0JBQWtCakMsQ0FBbEIsR0FBc0JvQyxDQUE1Qzs7QUFFQSxXQUFPLEVBQUNuQyxHQUFFa0QsU0FBSCxFQUFhbkQsR0FBRW9ELFNBQWYsRUFBUDtBQUNELEdBbFN3QjtBQW1TekJDLHFDQUFtQywyQ0FBVTVGLElBQVYsRUFBZ0JtQixJQUFoQixFQUFzQm9FLFdBQXRCLEVBQW1DO0FBQ3BFLFFBQUdBLGVBQWEsQ0FBaEIsRUFBa0I7QUFDaEIsYUFBT3ZGLEtBQUs2QixNQUFMLEdBQWNDLFFBQWQsRUFBUDtBQUNELEtBRkQsTUFFSztBQUNILGFBQU8sS0FBS3dELGdDQUFMLENBQXNDdEYsSUFBdEMsRUFBMkNtQixJQUEzQyxFQUFnRG9FLGNBQVksQ0FBNUQsQ0FBUDtBQUNEO0FBQ0YsR0F6U3dCO0FBMFN6Qk0scUNBQW1DLDJDQUFVN0YsSUFBVixFQUFnQm1CLElBQWhCLEVBQXNCb0UsV0FBdEIsRUFBbUM7QUFDcEUsUUFBSTdELFVBQVUxQixLQUFLWSxJQUFMLENBQVUsS0FBS2QsTUFBTCxDQUFZcUIsSUFBWixFQUFrQixRQUFsQixDQUFWLENBQWQ7QUFDQSxRQUFJTSxZQUFZekIsS0FBS1ksSUFBTCxDQUFVLEtBQUtkLE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsVUFBbEIsQ0FBVixDQUFoQjtBQUNBLFFBQUkwQyxhQUFhQyxLQUFLQyxHQUFMLENBQVVyQyxRQUFRYixNQUFsQixFQUEwQlksVUFBVVosTUFBcEMsQ0FBakI7QUFDQSxRQUFHMEUsZUFBYTFCLGFBQVcsQ0FBM0IsRUFBNkI7QUFDM0IsYUFBTzdELEtBQUtpQyxNQUFMLEdBQWNILFFBQWQsRUFBUDtBQUNELEtBRkQsTUFFSztBQUNILGFBQU8sS0FBS3dELGdDQUFMLENBQXNDdEYsSUFBdEMsRUFBMkNtQixJQUEzQyxFQUFnRG9FLGNBQVksQ0FBNUQsQ0FBUDtBQUNEO0FBQ0YsR0FuVHdCO0FBb1R6Qk8sNkJBQTJCLG1DQUFVOUYsSUFBVixFQUFnQmlELEtBQWhCLEVBQXVCQyx1QkFBdkIsRUFBZ0Q7QUFDekUsUUFBSUEsNEJBQTRCMUQsU0FBaEMsRUFBMkM7QUFDekMwRCxnQ0FBMEIsS0FBS1QsMEJBQUwsQ0FBZ0N6QyxJQUFoQyxDQUExQjtBQUNEOztBQUVELFFBQUl3RCxvQkFBb0IsS0FBS1IsZUFBTCxDQUFxQmhELElBQXJCLEVBQTJCaUQsS0FBM0IsRUFBa0NDLHVCQUFsQyxDQUF4QjtBQUNBLFFBQUlDLGFBQWFLLGtCQUFrQmhCLENBQW5DO0FBQ0EsUUFBSVksYUFBYUksa0JBQWtCakIsQ0FBbkM7O0FBRUEsUUFBSUYsV0FBV2Esd0JBQXdCYixRQUF2QztBQUNBLFFBQUlDLFdBQVdZLHdCQUF3QlosUUFBdkM7O0FBRUEsUUFBSW5DLE1BQUo7O0FBRUEsUUFBSWdELGNBQWNkLFNBQVNHLENBQTNCLEVBQStCO0FBQzdCckMsZUFBUyxDQUFDZ0QsYUFBYWQsU0FBU0csQ0FBdkIsS0FBNkJGLFNBQVNFLENBQVQsR0FBYUgsU0FBU0csQ0FBbkQsQ0FBVDtBQUNELEtBRkQsTUFHSyxJQUFJWSxjQUFjZixTQUFTRSxDQUEzQixFQUErQjtBQUNsQ3BDLGVBQVMsQ0FBQ2lELGFBQWFmLFNBQVNFLENBQXZCLEtBQTZCRCxTQUFTQyxDQUFULEdBQWFGLFNBQVNFLENBQW5ELENBQVQ7QUFDRCxLQUZJLE1BR0E7QUFDSHBDLGVBQVMsQ0FBVDtBQUNEOztBQUVELFFBQUlDLFdBQVcwRCxLQUFLTyxJQUFMLENBQVVQLEtBQUtpQyxHQUFMLENBQVUzQyxhQUFhSCxNQUFNVixDQUE3QixFQUFpQyxDQUFqQyxJQUNuQnVCLEtBQUtpQyxHQUFMLENBQVU1QyxhQUFhRixNQUFNVCxDQUE3QixFQUFpQyxDQUFqQyxDQURTLENBQWY7O0FBR0E7QUFDQSxRQUFJd0QsYUFBYSxLQUFLNUQsZ0JBQUwsQ0FBc0JDLFFBQXRCLEVBQWdDQyxRQUFoQyxDQUFqQjtBQUNBO0FBQ0EsUUFBSTJELGFBQWEsS0FBSzdELGdCQUFMLENBQXNCb0IsaUJBQXRCLEVBQXlDUCxLQUF6QyxDQUFqQjs7QUFFQTtBQUNBLFFBQUcrQyxhQUFhQyxVQUFiLElBQTJCLENBQUMsQ0FBNUIsSUFBaUNELGFBQWFDLFVBQWIsSUFBMkIsQ0FBL0QsRUFBaUU7QUFDL0QsVUFBRzdGLFlBQVksQ0FBZixFQUNFQSxXQUFXLENBQUMsQ0FBRCxHQUFLQSxRQUFoQjtBQUNIOztBQUVELFdBQU87QUFDTEQsY0FBUUEsTUFESDtBQUVMQyxnQkFBVUE7QUFGTCxLQUFQO0FBSUQsR0E5VndCO0FBK1Z6Qm9CLDhCQUE0QixvQ0FBVXhCLElBQVYsRUFBZ0JrRyxZQUFoQixFQUE4QjtBQUN4RCxRQUFJaEQsMEJBQTBCLEtBQUtULDBCQUFMLENBQWdDekMsSUFBaEMsQ0FBOUI7O0FBRUEsUUFBSTBCLFVBQVUsRUFBZDtBQUNBLFFBQUlELFlBQVksRUFBaEI7O0FBRUEsU0FBSyxJQUFJUCxJQUFJLENBQWIsRUFBZ0JnRixnQkFBZ0JoRixJQUFJZ0YsYUFBYXJGLE1BQWpELEVBQXlESyxHQUF6RCxFQUE4RDtBQUM1RCxVQUFJaUYsU0FBU0QsYUFBYWhGLENBQWIsQ0FBYjtBQUNBLFVBQUlrRix5QkFBeUIsS0FBS04seUJBQUwsQ0FBK0I5RixJQUEvQixFQUFxQ21HLE1BQXJDLEVBQTZDakQsdUJBQTdDLENBQTdCOztBQUVBeEIsY0FBUTJELElBQVIsQ0FBYWUsdUJBQXVCakcsTUFBcEM7QUFDQXNCLGdCQUFVNEQsSUFBVixDQUFlZSx1QkFBdUJoRyxRQUF0QztBQUNEOztBQUVELFdBQU87QUFDTHNCLGVBQVNBLE9BREo7QUFFTEQsaUJBQVdBO0FBRk4sS0FBUDtBQUlELEdBalh3QjtBQWtYekI0RSxzQkFBb0IsNEJBQVVyRyxJQUFWLEVBQWdCbUIsSUFBaEIsRUFBc0I7QUFDeEMsUUFBSW1GLE1BQU0sRUFBVjs7QUFFQSxRQUFJN0UsWUFBWXpCLEtBQUtZLElBQUwsQ0FBVSxLQUFLZCxNQUFMLENBQVlxQixJQUFaLEVBQWtCLFVBQWxCLENBQVYsQ0FBaEI7QUFDQSxTQUFLLElBQUlELElBQUksQ0FBYixFQUFnQk8sYUFBYVAsSUFBSU8sVUFBVVosTUFBM0MsRUFBbURLLEdBQW5ELEVBQXdEO0FBQ3REb0YsWUFBTUEsTUFBTSxHQUFOLEdBQVk3RSxVQUFVUCxDQUFWLENBQWxCO0FBQ0Q7O0FBRUQsV0FBT29GLEdBQVA7QUFDRCxHQTNYd0I7QUE0WHpCQyxvQkFBa0IsMEJBQVV2RyxJQUFWLEVBQWdCbUIsSUFBaEIsRUFBc0I7QUFDdEMsUUFBSW1GLE1BQU0sRUFBVjs7QUFFQSxRQUFJNUUsVUFBVTFCLEtBQUtZLElBQUwsQ0FBVSxLQUFLZCxNQUFMLENBQVlxQixJQUFaLEVBQWtCLFFBQWxCLENBQVYsQ0FBZDtBQUNBLFNBQUssSUFBSUQsSUFBSSxDQUFiLEVBQWdCUSxXQUFXUixJQUFJUSxRQUFRYixNQUF2QyxFQUErQ0ssR0FBL0MsRUFBb0Q7QUFDbERvRixZQUFNQSxNQUFNLEdBQU4sR0FBWTVFLFFBQVFSLENBQVIsQ0FBbEI7QUFDRDs7QUFFRCxXQUFPb0YsR0FBUDtBQUNELEdBcll3QjtBQXNZekJFLGtCQUFnQix3QkFBU3hHLElBQVQsRUFBZXlHLGNBQWYsRUFBaUQ7QUFBQSxRQUFsQnRGLElBQWtCLHVFQUFYM0IsU0FBVzs7QUFDL0QsUUFBR1EsU0FBU1IsU0FBVCxJQUFzQmlILG1CQUFtQmpILFNBQTVDLEVBQXNEO0FBQ3BEUSxhQUFPLEtBQUtULGNBQVo7QUFDQWtILHVCQUFpQixLQUFLaEgsYUFBdEI7QUFDRDs7QUFFRCxRQUFHMEIsU0FBUzNCLFNBQVosRUFDRTJCLE9BQU8sS0FBS1YsV0FBTCxDQUFpQlQsSUFBakIsQ0FBUDs7QUFFRixRQUFJMEcsWUFBWSxLQUFLNUcsTUFBTCxDQUFZcUIsSUFBWixFQUFrQixRQUFsQixDQUFoQjtBQUNBLFFBQUl3RixjQUFjLEtBQUs3RyxNQUFMLENBQVlxQixJQUFaLEVBQWtCLFVBQWxCLENBQWxCOztBQUVBLFFBQUl5RixtQkFBbUIsS0FBS2QseUJBQUwsQ0FBK0I5RixJQUEvQixFQUFxQ3lHLGNBQXJDLENBQXZCO0FBQ0EsUUFBSUksdUJBQXVCRCxpQkFBaUJ6RyxNQUE1Qzs7QUFFQSxRQUFJeUIsU0FBUzVCLEtBQUs2QixNQUFMLEdBQWNDLFFBQWQsQ0FBdUIsR0FBdkIsQ0FBYjtBQUNBLFFBQUlDLFNBQVMvQixLQUFLNkIsTUFBTCxHQUFjQyxRQUFkLENBQXVCLEdBQXZCLENBQWI7QUFDQSxRQUFJRSxPQUFPaEMsS0FBS2lDLE1BQUwsR0FBY0gsUUFBZCxDQUF1QixHQUF2QixDQUFYO0FBQ0EsUUFBSUksT0FBT2xDLEtBQUtpQyxNQUFMLEdBQWNILFFBQWQsQ0FBdUIsR0FBdkIsQ0FBWDtBQUNBLFFBQUlnRixjQUFjLEtBQUtoQix5QkFBTCxDQUErQjlGLElBQS9CLEVBQXFDLEVBQUN3QyxHQUFHWixNQUFKLEVBQVlXLEdBQUdSLE1BQWYsRUFBckMsRUFBNkQ1QixNQUEvRTtBQUNBLFFBQUk0RyxZQUFZLEtBQUtqQix5QkFBTCxDQUErQjlGLElBQS9CLEVBQXFDLEVBQUN3QyxHQUFHUixJQUFKLEVBQVVPLEdBQUdMLElBQWIsRUFBckMsRUFBeUQvQixNQUF6RTtBQUNBLFFBQUk2RyxvQkFBb0IsQ0FBQ0YsV0FBRCxFQUFjRyxNQUFkLENBQXFCakgsS0FBS1ksSUFBTCxDQUFVOEYsU0FBVixJQUFxQjFHLEtBQUtZLElBQUwsQ0FBVThGLFNBQVYsQ0FBckIsR0FBMEMsRUFBL0QsRUFBbUVPLE1BQW5FLENBQTBFLENBQUNGLFNBQUQsQ0FBMUUsQ0FBeEI7O0FBRUEsUUFBSUcsY0FBYyxLQUFLekQsaUJBQUwsQ0FBdUJ6RCxJQUF2QixDQUFsQjs7QUFFQSxRQUFJbUgsVUFBVTlELFFBQWQ7QUFDQSxRQUFJK0QsWUFBSjtBQUNBLFFBQUlDLGdCQUFnQixDQUFDekYsTUFBRCxFQUFTRyxNQUFULEVBQ1hrRixNQURXLENBQ0pDLGNBQVlBLFdBQVosR0FBd0IsRUFEcEIsRUFFWEQsTUFGVyxDQUVKLENBQUNqRixJQUFELEVBQU9FLElBQVAsQ0FGSSxDQUFwQjtBQUdBLFFBQUlvRixpQkFBaUIsQ0FBQyxDQUF0Qjs7QUFFQSxTQUFJLElBQUlwRyxJQUFJLENBQVosRUFBZUEsSUFBSThGLGtCQUFrQm5HLE1BQWxCLEdBQTJCLENBQTlDLEVBQWlESyxHQUFqRCxFQUFxRDtBQUNuRCxVQUFJMEQsS0FBS29DLGtCQUFrQjlGLENBQWxCLENBQVQ7QUFDQSxVQUFJMkQsS0FBS21DLGtCQUFrQjlGLElBQUksQ0FBdEIsQ0FBVDs7QUFFQTtBQUNBLFVBQU1xRyxLQUFLLEtBQUtDLG9CQUFMLENBQTBCWCxvQkFBMUIsRUFBZ0RqQyxFQUFoRCxFQUFvRCxJQUFwRCxDQUFYO0FBQ0EsVUFBTTZDLEtBQUssS0FBS0Qsb0JBQUwsQ0FBMEJYLG9CQUExQixFQUFnRGhDLEVBQWhELENBQVg7QUFDQSxVQUFNNkMsS0FBSyxLQUFLRixvQkFBTCxDQUEwQlgsb0JBQTFCLEVBQWdEaEMsRUFBaEQsRUFBb0QsSUFBcEQsQ0FBWDtBQUNBLFVBQU04QyxLQUFLLEtBQUtILG9CQUFMLENBQTBCWCxvQkFBMUIsRUFBZ0RqQyxFQUFoRCxDQUFYO0FBQ0EsVUFBSzJDLE1BQU1FLEVBQVAsSUFBZUMsTUFBTUMsRUFBekIsRUFBNkI7QUFDM0IsWUFBSS9GLFNBQVN5RixjQUFjLElBQUluRyxDQUFsQixDQUFiO0FBQ0EsWUFBSWEsU0FBU3NGLGNBQWMsSUFBSW5HLENBQUosR0FBUSxDQUF0QixDQUFiO0FBQ0EsWUFBSWMsT0FBT3FGLGNBQWMsSUFBSW5HLENBQUosR0FBUSxDQUF0QixDQUFYO0FBQ0EsWUFBSWdCLE9BQU9tRixjQUFjLElBQUluRyxDQUFKLEdBQVEsQ0FBdEIsQ0FBWDs7QUFFQSxZQUFJMEcsUUFBUTtBQUNWcEYsYUFBR1osTUFETztBQUVWVyxhQUFHUjtBQUZPLFNBQVo7O0FBS0EsWUFBSThGLE1BQU07QUFDUnJGLGFBQUdSLElBREs7QUFFUk8sYUFBR0w7QUFGSyxTQUFWOztBQUtBLFlBQUlZLEtBQUssQ0FBRWYsU0FBU0csSUFBWCxLQUFzQk4sU0FBU0ksSUFBL0IsQ0FBVDtBQUNBLFlBQUllLEtBQUssQ0FBQyxDQUFELEdBQUtELEVBQWQ7O0FBRUEsWUFBSUksMEJBQTBCO0FBQzVCYixvQkFBVXVGLEtBRGtCO0FBRTVCdEYsb0JBQVV1RixHQUZrQjtBQUc1Qi9FLGNBQUlBLEVBSHdCO0FBSTVCQyxjQUFJQTtBQUp3QixTQUE5Qjs7QUFPQSxZQUFJK0Usc0JBQXNCLEtBQUs5RSxlQUFMLENBQXFCaEQsSUFBckIsRUFBMkJ5RyxjQUEzQixFQUEyQ3ZELHVCQUEzQyxDQUExQjtBQUNBLFlBQUk2RSxPQUFPakUsS0FBS08sSUFBTCxDQUFXUCxLQUFLaUMsR0FBTCxDQUFXVSxlQUFlakUsQ0FBZixHQUFtQnNGLG9CQUFvQnRGLENBQWxELEVBQXNELENBQXRELElBQ1pzQixLQUFLaUMsR0FBTCxDQUFXVSxlQUFlbEUsQ0FBZixHQUFtQnVGLG9CQUFvQnZGLENBQWxELEVBQXNELENBQXRELENBREMsQ0FBWDs7QUFHQTtBQUNBLFlBQUd3RixPQUFPWixPQUFWLEVBQWtCO0FBQ2hCQSxvQkFBVVksSUFBVjtBQUNBWCx5QkFBZVUsbUJBQWY7QUFDQVIsMkJBQWlCcEcsQ0FBakI7QUFDRDtBQUNGO0FBQ0Y7O0FBRUQsUUFBR2tHLGlCQUFpQjVILFNBQXBCLEVBQThCO0FBQzVCaUgsdUJBQWlCVyxZQUFqQjtBQUNEOztBQUVEUix1QkFBbUIsS0FBS2QseUJBQUwsQ0FBK0I5RixJQUEvQixFQUFxQ3lHLGNBQXJDLENBQW5COztBQUVBLFFBQUdXLGlCQUFpQjVILFNBQXBCLEVBQThCO0FBQzVCb0gsdUJBQWlCeEcsUUFBakIsR0FBNEIsQ0FBNUI7QUFDRDs7QUFFRCxRQUFJc0IsVUFBVTFCLEtBQUtZLElBQUwsQ0FBVThGLFNBQVYsQ0FBZDtBQUNBLFFBQUlqRixZQUFZekIsS0FBS1ksSUFBTCxDQUFVK0YsV0FBVixDQUFoQjs7QUFFQWpGLGNBQVVBLFVBQVFBLE9BQVIsR0FBZ0IsRUFBMUI7QUFDQUQsZ0JBQVlBLFlBQVVBLFNBQVYsR0FBb0IsRUFBaEM7O0FBRUEsUUFBR0MsUUFBUWIsTUFBUixLQUFtQixDQUF0QixFQUF5QjtBQUN2QnlHLHVCQUFpQixDQUFqQjtBQUNEOztBQUVMO0FBQ0E7QUFDSSxRQUFHQSxrQkFBa0IsQ0FBQyxDQUF0QixFQUF3QjtBQUN0QjVGLGNBQVFzRyxNQUFSLENBQWVWLGNBQWYsRUFBK0IsQ0FBL0IsRUFBa0NWLGlCQUFpQnpHLE1BQW5EO0FBQ0FzQixnQkFBVXVHLE1BQVYsQ0FBaUJWLGNBQWpCLEVBQWlDLENBQWpDLEVBQW9DVixpQkFBaUJ4RyxRQUFyRDtBQUNEOztBQUVESixTQUFLWSxJQUFMLENBQVU4RixTQUFWLEVBQXFCaEYsT0FBckI7QUFDQTFCLFNBQUtZLElBQUwsQ0FBVStGLFdBQVYsRUFBdUJsRixTQUF2Qjs7QUFFQXpCLFNBQUsyQixRQUFMLENBQWMsS0FBSzdCLE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsT0FBbEIsQ0FBZDtBQUNBLFFBQUlPLFFBQVFiLE1BQVIsR0FBaUIsQ0FBakIsSUFBc0JZLFVBQVVaLE1BQVYsR0FBbUIsQ0FBN0MsRUFBZ0Q7QUFDOUNiLFdBQUsyQixRQUFMLENBQWMsS0FBSzdCLE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsWUFBbEIsQ0FBZDtBQUNEOztBQUVELFdBQU9tRyxjQUFQO0FBQ0QsR0ExZndCO0FBMmZ6QlcsZ0JBQWMsc0JBQVNqSSxJQUFULEVBQWV1RixXQUFmLEVBQTJCO0FBQ3ZDLFFBQUd2RixTQUFTUixTQUFULElBQXNCK0YsZ0JBQWdCL0YsU0FBekMsRUFBbUQ7QUFDakRRLGFBQU8sS0FBS1QsY0FBWjtBQUNBZ0csb0JBQWMsS0FBSzdGLGtCQUFuQjtBQUNEOztBQUVELFFBQUl5QixPQUFPLEtBQUtWLFdBQUwsQ0FBaUJULElBQWpCLENBQVg7O0FBRUEsUUFBRyxLQUFLa0ksa0NBQUwsQ0FBd0MvRyxJQUF4QyxFQUE4Qyx1Q0FBOUMsQ0FBSCxFQUEwRjtBQUN4RjtBQUNEOztBQUVELFFBQUl3RixjQUFjLEtBQUs3RyxNQUFMLENBQVlxQixJQUFaLEVBQWtCLFFBQWxCLENBQWxCO0FBQ0EsUUFBSXVGLFlBQVksS0FBSzVHLE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsVUFBbEIsQ0FBaEI7QUFDQSxRQUFJZ0gsa0JBQWtCLEtBQUtySSxNQUFMLENBQVlxQixJQUFaLEVBQWtCLFVBQWxCLENBQXRCOztBQUVBLFFBQUlNLFlBQVl6QixLQUFLWSxJQUFMLENBQVUrRixXQUFWLENBQWhCO0FBQ0EsUUFBSWpGLFVBQVUxQixLQUFLWSxJQUFMLENBQVU4RixTQUFWLENBQWQ7QUFDQSxRQUFJMEIsWUFBWXBJLEtBQUtZLElBQUwsQ0FBVXVILGVBQVYsQ0FBaEI7O0FBRUExRyxjQUFVdUcsTUFBVixDQUFpQnpDLFdBQWpCLEVBQThCLENBQTlCO0FBQ0E3RCxZQUFRc0csTUFBUixDQUFlekMsV0FBZixFQUE0QixDQUE1QjtBQUNBO0FBQ0E7QUFDQSxRQUFJNkMsU0FBSixFQUNFQSxVQUFVSixNQUFWLENBQWlCekMsV0FBakIsRUFBOEIsQ0FBOUI7O0FBRUY7QUFDQSxRQUFJOUQsVUFBVVosTUFBVixJQUFvQixDQUFwQixJQUF5QmEsUUFBUWIsTUFBUixJQUFrQixDQUEvQyxFQUFrRDtBQUNoRGIsV0FBS3FJLFdBQUwsQ0FBaUIsS0FBS3ZJLE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsWUFBbEIsQ0FBakI7QUFDRDtBQUNEO0FBSEEsU0FJSyxJQUFHTSxVQUFVWixNQUFWLElBQW9CLENBQXBCLElBQXlCYSxRQUFRYixNQUFSLElBQWtCLENBQTlDLEVBQWdEO0FBQ25EYixhQUFLcUksV0FBTCxDQUFpQixLQUFLdkksTUFBTCxDQUFZcUIsSUFBWixFQUFrQixPQUFsQixDQUFqQjtBQUNBbkIsYUFBS1ksSUFBTCxDQUFVK0YsV0FBVixFQUF1QixFQUF2QjtBQUNBM0csYUFBS1ksSUFBTCxDQUFVOEYsU0FBVixFQUFxQixFQUFyQjtBQUNELE9BSkksTUFLQTtBQUNIMUcsYUFBS1ksSUFBTCxDQUFVK0YsV0FBVixFQUF1QmxGLFNBQXZCO0FBQ0F6QixhQUFLWSxJQUFMLENBQVU4RixTQUFWLEVBQXFCaEYsT0FBckI7QUFDRDtBQUNGLEdBcGlCd0I7QUFxaUJ6QjRHLG9CQUFrQiwwQkFBU3RJLElBQVQsRUFBZTtBQUMvQixRQUFJQSxTQUFTUixTQUFiLEVBQXdCO0FBQ3RCUSxhQUFPLEtBQUtULGNBQVo7QUFDRDtBQUNELFFBQUk0QixPQUFPLEtBQUtWLFdBQUwsQ0FBaUJULElBQWpCLENBQVg7O0FBRUEsUUFBRyxLQUFLa0ksa0NBQUwsQ0FBd0MvRyxJQUF4QyxFQUE4QywyQ0FBOUMsQ0FBSCxFQUE4RjtBQUM1RjtBQUNEOztBQUVEO0FBQ0FuQixTQUFLcUksV0FBTCxDQUFpQixLQUFLdkksTUFBTCxDQUFZcUIsSUFBWixFQUFrQixPQUFsQixDQUFqQjtBQUNBbkIsU0FBS3FJLFdBQUwsQ0FBaUIsS0FBS3ZJLE1BQUwsQ0FBWXFCLElBQVosRUFBa0IsWUFBbEIsQ0FBakI7O0FBRUE7QUFDQSxRQUFJd0YsY0FBYyxLQUFLN0csTUFBTCxDQUFZcUIsSUFBWixFQUFrQixRQUFsQixDQUFsQjtBQUNBLFFBQUl1RixZQUFZLEtBQUs1RyxNQUFMLENBQVlxQixJQUFaLEVBQWtCLFVBQWxCLENBQWhCO0FBQ0EsUUFBSWdILGtCQUFrQixLQUFLckksTUFBTCxDQUFZcUIsSUFBWixFQUFrQixVQUFsQixDQUF0QjtBQUNBbkIsU0FBS1ksSUFBTCxDQUFVK0YsV0FBVixFQUF1QixFQUF2QjtBQUNBM0csU0FBS1ksSUFBTCxDQUFVOEYsU0FBVixFQUFxQixFQUFyQjtBQUNBO0FBQ0E7QUFDQSxRQUFJMUcsS0FBS1ksSUFBTCxDQUFVdUgsZUFBVixDQUFKLEVBQWdDO0FBQzlCbkksV0FBS1ksSUFBTCxDQUFVdUgsZUFBVixFQUEyQixFQUEzQjtBQUNEO0FBQ0YsR0E5akJ3QjtBQStqQnpCSSxxQkFBbUIsMkJBQVNDLEdBQVQsRUFBY0MsR0FBZCxFQUFtQjtBQUNwQyxRQUFJQyxRQUFRRixJQUFJaEcsQ0FBSixHQUFRaUcsSUFBSWpHLENBQXhCO0FBQ0EsUUFBSW1HLFFBQVFILElBQUlqRyxDQUFKLEdBQVFrRyxJQUFJbEcsQ0FBeEI7O0FBRUEsUUFBSXdGLE9BQU9qRSxLQUFLTyxJQUFMLENBQVdQLEtBQUtpQyxHQUFMLENBQVUyQyxLQUFWLEVBQWlCLENBQWpCLElBQXVCNUUsS0FBS2lDLEdBQUwsQ0FBVTRDLEtBQVYsRUFBaUIsQ0FBakIsQ0FBbEMsQ0FBWDtBQUNBLFdBQU9aLElBQVA7QUFDRCxHQXJrQndCO0FBc2tCekI7QUFDQVAsd0JBQXNCLDhCQUFVb0IsRUFBVixFQUFjQyxFQUFkLEVBQStEO0FBQUEsUUFBN0NDLGlCQUE2Qyx1RUFBekIsS0FBeUI7QUFBQSxRQUFsQkMsU0FBa0IsdUVBQU4sSUFBTTs7QUFDbkYsUUFBTUMsT0FBT0osS0FBS0MsRUFBbEI7QUFDQSxRQUFJL0UsS0FBS21GLEdBQUwsQ0FBU0QsSUFBVCxLQUFrQkQsU0FBdEIsRUFBaUM7QUFDL0IsYUFBTyxJQUFQO0FBQ0Q7QUFDRCxRQUFJRCxpQkFBSixFQUF1QjtBQUNyQixhQUFPRixLQUFLQyxFQUFaO0FBQ0QsS0FGRCxNQUVPO0FBQ0wsYUFBT0QsS0FBS0MsRUFBWjtBQUNEO0FBQ0YsR0FqbEJ3QjtBQWtsQnpCWCxzQ0FBb0MsNENBQVMvRyxJQUFULEVBQWUrSCxLQUFmLEVBQXFCO0FBQ3ZELFFBQUcvSCxTQUFTLGNBQVosRUFBNEI7QUFDMUJnSSxjQUFRQyxHQUFSLFNBQWtCRixLQUFsQjtBQUNBLGFBQU8sSUFBUDtBQUNEO0FBQ0QsV0FBTyxLQUFQO0FBQ0Q7QUF4bEJ3QixDQUEzQjs7QUEybEJBRyxPQUFPQyxPQUFQLEdBQWlCaEssb0JBQWpCLEM7Ozs7Ozs7Ozs7O0FDM2xCQSxJQUFJaUssV0FBV0MsbUJBQU9BLENBQUMsR0FBUixDQUFmO0FBQ0EsSUFBSWxLLHVCQUF1QmtLLG1CQUFPQSxDQUFDLEdBQVIsQ0FBM0I7QUFDQSxJQUFJQyx3QkFBd0JELG1CQUFPQSxDQUFDLEdBQVIsQ0FBNUI7QUFDQSxJQUFJRSw0QkFBNEJGLG1CQUFPQSxDQUFDLEdBQVIsQ0FBaEM7QUFDQSxJQUFJRyxVQUFVLENBQWQ7O0FBRUFOLE9BQU9DLE9BQVAsR0FBaUIsVUFBVU0sTUFBVixFQUFrQkMsRUFBbEIsRUFBc0I7QUFDckMsTUFBSUMsS0FBS0YsTUFBVDs7QUFFQSxNQUFJRyx3QkFBd0IsNENBQTRDSixPQUF4RTtBQUNBLE1BQUlLLDJCQUEyQiwrQ0FBK0NMLE9BQTlFO0FBQ0EsTUFBSU0sOEJBQThCLHdEQUF3RE4sT0FBMUY7QUFDQSxNQUFJTywyQkFBMkIsa0RBQWtEUCxPQUFqRjtBQUNBLE1BQUlRLDhCQUE4QixxREFBcURSLE9BQXZGO0FBQ0EsTUFBSVMsaUNBQWlDLDJEQUEyRFQsT0FBaEc7QUFDQSxNQUFJVSxNQUFKLEVBQVlDLE9BQVosRUFBcUJDLElBQXJCLEVBQTJCQyxLQUEzQixFQUFrQ0MsT0FBbEMsRUFBMkNDLFNBQTNDLEVBQXNEQyxTQUF0RCxFQUFpRUMsZUFBakUsRUFBa0ZDLFFBQWxGLEVBQTRGQyxPQUE1RixFQUFxR0MsT0FBckcsRUFBOEdDLEtBQTlHO0FBQ0E7QUFDQSxNQUFJQyxrQkFBSixFQUF3QkMsa0JBQXhCLEVBQTRDQyx1QkFBNUM7QUFDQSxNQUFJQyxtQkFBSjtBQUNBO0FBQ0EsTUFBSUMsZUFBSixFQUFxQkMscUJBQXJCOztBQUVBO0FBQ0EsTUFBSUMsaUJBQWlCLElBQXJCO0FBQUEsTUFBMkJDLGlCQUFpQixJQUE1QztBQUNBO0FBQ0EsTUFBSUMsZ0JBQWdCLEtBQXBCO0FBQ0E7QUFDQSxNQUFJQyxRQUFKOztBQUVBLE1BQUlDLFlBQVk7QUFDZEMsVUFBTSxnQkFBWTtBQUNoQjtBQUNBbEMsZ0NBQTBCRyxFQUExQixFQUE4QnZLLG9CQUE5QixFQUFvRHNLLE1BQXBEOztBQUVBLFVBQUlpQyxPQUFPLElBQVg7QUFDQSxVQUFJQyxPQUFPbEMsTUFBWDs7QUFFQTs7Ozs7OztBQU9BLFVBQUltQyxhQUFhQyxFQUFFLElBQUYsQ0FBakI7QUFDQSxVQUFJQyxrQkFBa0IsK0JBQStCdEMsT0FBckQ7QUFDQUE7QUFDQSxVQUFJdUMsaUJBQWlCRixFQUFFLGNBQWNDLGVBQWQsR0FBZ0MsVUFBbEMsQ0FBckI7O0FBRUEsVUFBSUYsV0FBV0ksSUFBWCxDQUFnQixNQUFNRixlQUF0QixFQUF1Q3BMLE1BQXZDLEdBQWdELENBQXBELEVBQXVEO0FBQ3JEa0wsbUJBQVdLLE1BQVgsQ0FBa0JGLGNBQWxCO0FBQ0Q7O0FBRUQ7Ozs7Ozs7O0FBUUEsVUFBSUcsS0FBSjtBQUNBLFVBQUlDLE1BQU1DLE1BQU4sQ0FBYTFMLE1BQWIsR0FBc0I4SSxPQUExQixFQUFtQztBQUNqQzBDLGdCQUFRLElBQUlDLE1BQU1FLEtBQVYsQ0FBZ0I7QUFDdEJySyxjQUFJLHlCQURrQjtBQUV0QnNLLHFCQUFXUixlQUZXLEVBRVE7QUFDOUJTLGlCQUFPWCxXQUFXVyxLQUFYLEVBSGU7QUFJdEJDLGtCQUFRWixXQUFXWSxNQUFYO0FBSmMsU0FBaEIsQ0FBUjtBQU1ELE9BUEQsTUFRSztBQUNITixnQkFBUUMsTUFBTUMsTUFBTixDQUFhNUMsVUFBVSxDQUF2QixDQUFSO0FBQ0Q7O0FBRUQsVUFBSWlELE1BQUo7QUFDQSxVQUFJUCxNQUFNUSxXQUFOLEdBQW9CaE0sTUFBcEIsR0FBNkIsQ0FBakMsRUFBb0M7QUFDbEMrTCxpQkFBUyxJQUFJTixNQUFNUSxLQUFWLEVBQVQ7QUFDQVQsY0FBTVUsR0FBTixDQUFVSCxNQUFWO0FBQ0QsT0FIRCxNQUlLO0FBQ0hBLGlCQUFTUCxNQUFNUSxXQUFOLEdBQW9CLENBQXBCLENBQVQ7QUFDRDs7QUFFRCxVQUFJRyxnQkFBZ0I7QUFDbEJoTixjQUFNUixTQURZO0FBRWxCeU4sa0JBQVUsY0FGUTtBQUdsQkMsaUJBQVMsRUFIUztBQUlsQjtBQUNBQyx1QkFBZTNOLFNBTEc7QUFNbEI7QUFDQTROLDRCQUFvQjVOLFNBUEY7QUFRbEI2Tix1QkFBZSx1QkFBU2xILE1BQVQsRUFBZ0I7QUFDN0JBLGlCQUFPbUgsRUFBUCxDQUFVLHNCQUFWLEVBQWtDLEtBQUtDLFVBQXZDO0FBQ0QsU0FWaUI7QUFXbEJDLHlCQUFpQix5QkFBU3JILE1BQVQsRUFBZ0I7QUFDL0JBLGlCQUFPc0gsR0FBUCxDQUFXLHNCQUFYLEVBQW1DLEtBQUtGLFVBQXhDO0FBQ0QsU0FiaUI7QUFjbEI7QUFDQTtBQUNBQSxvQkFBWSxvQkFBU0csS0FBVCxFQUFlO0FBQ3pCO0FBQ0E3RCxhQUFHOEQsZUFBSCxDQUFtQixLQUFuQjs7QUFFQTtBQUNBbEMsMEJBQWdCLElBQWhCO0FBQ0F1Qix3QkFBY0csYUFBZCxHQUE4Qk8sTUFBTXpMLE1BQXBDO0FBQ0F5SixxQkFBVyxLQUFYO0FBQ0FzQix3QkFBY2hOLElBQWQsQ0FBbUI0TixRQUFuQjs7QUFFQTtBQUNBLGNBQUlsSCxZQUFZcEgscUJBQXFCUSxNQUFyQixDQUE0QmtOLGNBQWNDLFFBQTFDLEVBQW9ELFFBQXBELENBQWhCO0FBQ0EsY0FBSXRHLGNBQWNySCxxQkFBcUJRLE1BQXJCLENBQTRCa04sY0FBY0MsUUFBMUMsRUFBb0QsVUFBcEQsQ0FBbEI7O0FBRUEsY0FBSWpOLE9BQU9nTixjQUFjaE4sSUFBekI7QUFDQTZOLDRCQUFrQjtBQUNoQjdOLGtCQUFNQSxJQURVO0FBRWhCbUIsa0JBQU02TCxjQUFjQyxRQUZKO0FBR2hCdkwscUJBQVMxQixLQUFLWSxJQUFMLENBQVU4RixTQUFWLElBQXVCLEdBQUdPLE1BQUgsQ0FBVWpILEtBQUtZLElBQUwsQ0FBVThGLFNBQVYsQ0FBVixDQUF2QixHQUF5RCxFQUhsRDtBQUloQmpGLHVCQUFXekIsS0FBS1ksSUFBTCxDQUFVK0YsV0FBVixJQUF5QixHQUFHTSxNQUFILENBQVVqSCxLQUFLWSxJQUFMLENBQVUrRixXQUFWLENBQVYsQ0FBekIsR0FBNkQ7QUFKeEQsV0FBbEI7O0FBT0FtSDtBQUNBQzs7QUFFQWxFLGFBQUdtRSxhQUFILENBQWlCLElBQWpCOztBQUVBcEIsaUJBQU9xQixRQUFQLEdBQWtCWCxFQUFsQixDQUFxQixnQ0FBckIsRUFBdUROLGNBQWNrQixRQUFyRTtBQUNBdEIsaUJBQU9xQixRQUFQLEdBQWtCWCxFQUFsQixDQUFxQixpQkFBckIsRUFBd0NOLGNBQWNtQixTQUF0RDtBQUNELFNBN0NpQjtBQThDbEI7QUFDQUQsa0JBQVUsa0JBQVNSLEtBQVQsRUFBZTtBQUN2QjtBQUNBakMsMEJBQWdCLEtBQWhCO0FBQ0F1Qix3QkFBY0csYUFBZCxHQUE4QjNOLFNBQTlCO0FBQ0FrTSxxQkFBVyxLQUFYO0FBQ0FzQix3QkFBY2hOLElBQWQsQ0FBbUJvTyxNQUFuQjs7QUFFQUM7QUFDQUM7O0FBRUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkF6RSxhQUFHOEQsZUFBSCxDQUFtQixJQUFuQjtBQUNBOUQsYUFBR21FLGFBQUgsQ0FBaUIsS0FBakI7O0FBRUFwQixpQkFBT3FCLFFBQVAsR0FBa0JSLEdBQWxCLENBQXNCLGdDQUF0QixFQUF3RFQsY0FBY2tCLFFBQXRFO0FBQ0F0QixpQkFBT3FCLFFBQVAsR0FBa0JSLEdBQWxCLENBQXNCLGlCQUF0QixFQUF5Q1QsY0FBY21CLFNBQXZEO0FBQ0QsU0FqRmlCO0FBa0ZsQjtBQUNBQSxtQkFBVyxtQkFBVVQsS0FBVixFQUFnQjtBQUN6QmhDLHFCQUFXLElBQVg7QUFDRCxTQXJGaUI7QUFzRmxCNkMsNEJBQW9CLDhCQUErQjtBQUFBOztBQUFBLGNBQXRCQyxTQUFzQix1RUFBVmhQLFNBQVU7O0FBQ2pELGNBQUlpUCxtQkFBbUIsS0FBdkI7O0FBRUEsZUFBS3ZCLE9BQUwsQ0FBYXdCLE9BQWIsQ0FBcUIsVUFBQ3ZJLE1BQUQsRUFBU3dJLEtBQVQsRUFBbUI7QUFDdEMsZ0JBQUdILGFBQWFySSxXQUFXcUksU0FBM0IsRUFBcUM7QUFDbkNDLGlDQUFtQixJQUFuQixDQURtQyxDQUNWO0FBQ3pCO0FBQ0Q7O0FBRUQsa0JBQUtqQixlQUFMLENBQXFCckgsTUFBckI7QUFDQUEsbUJBQU95SSxPQUFQO0FBQ0QsV0FSRDs7QUFVQSxjQUFHSCxnQkFBSCxFQUFvQjtBQUNsQixpQkFBS3ZCLE9BQUwsR0FBZSxDQUFDc0IsU0FBRCxDQUFmO0FBQ0QsV0FGRCxNQUdLO0FBQ0gsaUJBQUt0QixPQUFMLEdBQWUsRUFBZjtBQUNBLGlCQUFLbE4sSUFBTCxHQUFZUixTQUFaO0FBQ0EsaUJBQUt5TixRQUFMLEdBQWdCLGNBQWhCO0FBQ0Q7QUFDRixTQTNHaUI7QUE0R2xCO0FBQ0E0Qiw0QkFBb0IsNEJBQVM3TyxJQUFULEVBQWU7QUFDakMsZUFBS0EsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsZUFBS2lOLFFBQUwsR0FBZ0IzTixxQkFBcUJtQixXQUFyQixDQUFpQ1QsSUFBakMsQ0FBaEI7O0FBRUEsY0FBRyxDQUFDQSxLQUFLVSxRQUFMLENBQWMsK0JBQWQsQ0FBRCxJQUNDLENBQUNWLEtBQUtVLFFBQUwsQ0FBYyxxQ0FBZCxDQURMLEVBQzJEO0FBQ3pEO0FBQ0Q7O0FBRUQsY0FBSWdELGFBQWFwRSxxQkFBcUJtRSxpQkFBckIsQ0FBdUN6RCxJQUF2QyxDQUFqQixDQVRpQyxDQVM2QjtBQUM5RCxjQUFJYSxTQUFTaU8sc0JBQXNCOU8sSUFBdEIsSUFBOEIsSUFBM0M7O0FBRUEsY0FBSWdFLFNBQVNoRSxLQUFLNkIsTUFBTCxHQUFjQyxRQUFkLEVBQWI7QUFDQSxjQUFJbUMsU0FBU2pFLEtBQUtpQyxNQUFMLEdBQWNILFFBQWQsRUFBYjs7QUFFQSxlQUFJLElBQUlaLElBQUksQ0FBWixFQUFld0MsY0FBY3hDLElBQUl3QyxXQUFXN0MsTUFBNUMsRUFBb0RLLElBQUlBLElBQUksQ0FBNUQsRUFBOEQ7QUFDNUQsZ0JBQUk2TixVQUFVckwsV0FBV3hDLENBQVgsQ0FBZDtBQUNBLGdCQUFJOE4sVUFBVXRMLFdBQVd4QyxJQUFJLENBQWYsQ0FBZDs7QUFFQSxpQkFBSytOLGlCQUFMLENBQXVCRixPQUF2QixFQUFnQ0MsT0FBaEMsRUFBeUNuTyxNQUF6QztBQUNEOztBQUVEK0wsaUJBQU9zQyxJQUFQO0FBQ0QsU0FwSWlCO0FBcUlsQjtBQUNBRCwyQkFBbUIsMkJBQVNGLE9BQVQsRUFBa0JDLE9BQWxCLEVBQTJCbk8sTUFBM0IsRUFBbUM7QUFDcEQ7QUFDQSxjQUFJc08sV0FBV0osVUFBVWxPLFNBQVMsQ0FBbEM7QUFDQSxjQUFJdU8sV0FBV0osVUFBVW5PLFNBQVMsQ0FBbEM7O0FBRUE7QUFDQSxjQUFJd08scUJBQXFCQywwQkFBMEIsRUFBQzlNLEdBQUcyTSxRQUFKLEVBQWM1TSxHQUFHNk0sUUFBakIsRUFBMUIsQ0FBekI7QUFDQXZPLG9CQUFVZ0osR0FBRzBGLElBQUgsRUFBVjs7QUFFQSxjQUFJQyxZQUFZLElBQUlsRCxNQUFNbUQsSUFBVixDQUFlO0FBQzdCak4sZUFBRzZNLG1CQUFtQjdNLENBRE87QUFFN0JELGVBQUc4TSxtQkFBbUI5TSxDQUZPO0FBRzdCbUssbUJBQU83TCxNQUhzQjtBQUk3QjhMLG9CQUFROUwsTUFKcUI7QUFLN0I2TyxrQkFBTSxPQUx1QjtBQU03QkMseUJBQWEsQ0FOZ0I7QUFPN0JDLHVCQUFXO0FBUGtCLFdBQWYsQ0FBaEI7O0FBVUEsZUFBSzFDLE9BQUwsQ0FBYTdILElBQWIsQ0FBa0JtSyxTQUFsQjtBQUNBLGVBQUtuQyxhQUFMLENBQW1CbUMsU0FBbkI7QUFDQTVDLGlCQUFPRyxHQUFQLENBQVd5QyxTQUFYO0FBQ0Q7QUE1SmlCLE9BQXBCOztBQStKQSxVQUFJSyxnQkFBZ0IsU0FBaEJBLGFBQWdCLENBQVNuQyxLQUFULEVBQWU7QUFDakNvQyx3QkFBZ0JwQyxLQUFoQixFQUF1QixNQUF2QjtBQUNELE9BRkQ7O0FBSUEsVUFBSXFDLG1CQUFtQixTQUFuQkEsZ0JBQW1CLENBQVNyQyxLQUFULEVBQWdCO0FBQ3JDb0Msd0JBQWdCcEMsS0FBaEIsRUFBdUIsU0FBdkI7QUFDRCxPQUZEOztBQUlBLFVBQUlvQyxrQkFBa0IsU0FBbEJBLGVBQWtCLENBQVVwQyxLQUFWLEVBQWlCc0MsVUFBakIsRUFBNkI7QUFDakQsWUFBSWhRLE9BQU8wTixNQUFNekwsTUFBTixJQUFnQnlMLE1BQU11QyxRQUFqQztBQUNBLFlBQUcsQ0FBQzNRLHFCQUFxQjhCLGFBQXJCLENBQW1DcEIsSUFBbkMsQ0FBSixFQUE4Qzs7QUFFNUMsY0FBSW1CLE9BQU83QixxQkFBcUJtQixXQUFyQixDQUFpQ1QsSUFBakMsQ0FBWDtBQUNBLGNBQUkwQixPQUFKLEVBQWFELFNBQWIsRUFBd0JpRixTQUF4QixFQUFtQ0MsV0FBbkM7O0FBRUEsY0FBR3hGLFNBQVMsY0FBWixFQUEyQjtBQUN6Qk8sc0JBQVUsRUFBVjtBQUNBRCx3QkFBWSxFQUFaO0FBQ0QsV0FIRCxNQUlJO0FBQ0ZpRix3QkFBWXBILHFCQUFxQlEsTUFBckIsQ0FBNEJxQixJQUE1QixFQUFrQyxRQUFsQyxDQUFaO0FBQ0F3RiwwQkFBY3JILHFCQUFxQlEsTUFBckIsQ0FBNEJxQixJQUE1QixFQUFrQyxVQUFsQyxDQUFkOztBQUVBTyxzQkFBVTFCLEtBQUtZLElBQUwsQ0FBVThGLFNBQVYsSUFBdUIsR0FBR08sTUFBSCxDQUFVakgsS0FBS1ksSUFBTCxDQUFVOEYsU0FBVixDQUFWLENBQXZCLEdBQXlEMUcsS0FBS1ksSUFBTCxDQUFVOEYsU0FBVixDQUFuRTtBQUNBakYsd0JBQVl6QixLQUFLWSxJQUFMLENBQVUrRixXQUFWLElBQXlCLEdBQUdNLE1BQUgsQ0FBVWpILEtBQUtZLElBQUwsQ0FBVStGLFdBQVYsQ0FBVixDQUF6QixHQUE2RDNHLEtBQUtZLElBQUwsQ0FBVStGLFdBQVYsQ0FBekU7QUFDRDs7QUFFRCxjQUFJdUosUUFBUTtBQUNWbFEsa0JBQU1BLElBREk7QUFFVm1CLGtCQUFNQSxJQUZJO0FBR1ZPLHFCQUFTQSxPQUhDO0FBSVZELHVCQUFXQTtBQUpELFdBQVo7O0FBT0E7QUFDQW5DLCtCQUFxQmtILGNBQXJCLENBQW9DaEgsU0FBcEMsRUFBK0NBLFNBQS9DLEVBQTBEd1EsVUFBMUQ7O0FBRUEsY0FBSUcsVUFBVUMsUUFBZCxFQUF3QjtBQUN0QnZHLGVBQUd3RyxRQUFILEdBQWNDLEVBQWQsQ0FBaUIsb0JBQWpCLEVBQXVDSixLQUF2QztBQUNEO0FBQ0Y7O0FBRURLO0FBQ0F2USxhQUFLb08sTUFBTDtBQUNELE9BcENEOztBQXNDQSxVQUFJb0MscUJBQXFCLFNBQXJCQSxrQkFBcUIsQ0FBVTlDLEtBQVYsRUFBaUI7QUFDeEMsWUFBSTFOLE9BQU9nTixjQUFjaE4sSUFBekI7QUFDQSxZQUFJbUIsT0FBTzdCLHFCQUFxQm1CLFdBQXJCLENBQWlDVCxJQUFqQyxDQUFYOztBQUVBLFlBQUdWLHFCQUFxQjRJLGtDQUFyQixDQUF3RC9HLElBQXhELEVBQThELG9DQUE5RCxDQUFILEVBQXVHO0FBQ3JHO0FBQ0Q7O0FBRUQsWUFBSStPLFFBQVE7QUFDVmxRLGdCQUFNQSxJQURJO0FBRVZtQixnQkFBTUEsSUFGSTtBQUdWTyxtQkFBUyxHQUFHdUYsTUFBSCxDQUFVakgsS0FBS1ksSUFBTCxDQUFVdEIscUJBQXFCUSxNQUFyQixDQUE0QnFCLElBQTVCLEVBQWtDLFFBQWxDLENBQVYsQ0FBVixDQUhDO0FBSVZNLHFCQUFXLEdBQUd3RixNQUFILENBQVVqSCxLQUFLWSxJQUFMLENBQVV0QixxQkFBcUJRLE1BQXJCLENBQTRCcUIsSUFBNUIsRUFBa0MsVUFBbEMsQ0FBVixDQUFWO0FBSkQsU0FBWjs7QUFPQTdCLDZCQUFxQjJJLFlBQXJCOztBQUVBLFlBQUdrSSxVQUFVQyxRQUFiLEVBQXVCO0FBQ3JCdkcsYUFBR3dHLFFBQUgsR0FBY0MsRUFBZCxDQUFpQixvQkFBakIsRUFBdUNKLEtBQXZDO0FBQ0Q7O0FBRURPLG1CQUFXLFlBQVU7QUFBQ0YseUJBQWV2USxLQUFLb08sTUFBTDtBQUFlLFNBQXBELEVBQXNELEVBQXREO0FBRUQsT0F2QkQ7O0FBeUJBLFVBQUlzQyx5QkFBeUIsU0FBekJBLHNCQUF5QixDQUFVaEQsS0FBVixFQUFpQjtBQUM1QyxZQUFJMU4sT0FBT2dOLGNBQWNoTixJQUF6QjtBQUNBLFlBQUltQixPQUFPN0IscUJBQXFCbUIsV0FBckIsQ0FBaUNULElBQWpDLENBQVg7QUFDQSxZQUFJa1EsUUFBUTtBQUNWbFEsZ0JBQU1BLElBREk7QUFFVm1CLGdCQUFNQSxJQUZJO0FBR1ZPLG1CQUFTLEdBQUd1RixNQUFILENBQVVqSCxLQUFLWSxJQUFMLENBQVV0QixxQkFBcUJRLE1BQXJCLENBQTRCcUIsSUFBNUIsRUFBa0MsUUFBbEMsQ0FBVixDQUFWLENBSEM7QUFJVk0scUJBQVcsR0FBR3dGLE1BQUgsQ0FBVWpILEtBQUtZLElBQUwsQ0FBVXRCLHFCQUFxQlEsTUFBckIsQ0FBNEJxQixJQUE1QixFQUFrQyxVQUFsQyxDQUFWLENBQVY7QUFKRCxTQUFaOztBQU9BN0IsNkJBQXFCZ0osZ0JBQXJCOztBQUVBLFlBQUk2SCxVQUFVQyxRQUFkLEVBQXdCO0FBQ3RCdkcsYUFBR3dHLFFBQUgsR0FBY0MsRUFBZCxDQUFpQixvQkFBakIsRUFBdUNKLEtBQXZDO0FBQ0Q7QUFDRE8sbUJBQVcsWUFBVTtBQUFDRix5QkFBZXZRLEtBQUtvTyxNQUFMO0FBQWUsU0FBcEQsRUFBc0QsRUFBdEQ7QUFDRCxPQWhCRDs7QUFrQkE7QUFDQSxVQUFJdUMsc0JBQXNCN0UsS0FBSzZFLG1CQUEvQjtBQUNBO0FBQ0EsVUFBSUMsZUFBZTlFLEtBQUs4RSxZQUF4QjtBQUNBO0FBQ0EsVUFBSUMsZ0NBQWdDL0UsS0FBSytFLDZCQUF6Qzs7QUFFQSxVQUFJQyxZQUFZLENBQ2Q7QUFDRTNPLFlBQUk0SCxxQkFETjtBQUVFZ0gsaUJBQVNqRixLQUFLa0Ysb0JBRmhCO0FBR0VDLGtCQUFVLE1BSFo7QUFJRUMseUJBQWlCckI7QUFKbkIsT0FEYyxFQU9kO0FBQ0UxTixZQUFJNkgsd0JBRE47QUFFRStHLGlCQUFTakYsS0FBS3FGLHVCQUZoQjtBQUdFRixrQkFBVSxNQUhaO0FBSUVDLHlCQUFpQlY7QUFKbkIsT0FQYyxFQWFkO0FBQ0VyTyxZQUFJOEgsMkJBRE47QUFFRThHLGlCQUFTakYsS0FBS3NGLDBCQUZoQjtBQUdFSCxrQkFBVW5GLEtBQUt1RixpQ0FBTCxJQUEwQyxpREFIdEQ7QUFJRUgseUJBQWlCUjtBQUpuQixPQWJjLEVBbUJkO0FBQ0V2TyxZQUFJK0gsd0JBRE47QUFFRTZHLGlCQUFTakYsS0FBS3dGLHVCQUZoQjtBQUdFTCxrQkFBVSxNQUhaO0FBSUVNLG9CQUFZLElBSmQ7QUFLRUwseUJBQWlCbkI7QUFMbkIsT0FuQmMsRUEwQmQ7QUFDRTVOLFlBQUlnSSwyQkFETjtBQUVFNEcsaUJBQVNqRixLQUFLMEYsMEJBRmhCO0FBR0VQLGtCQUFVLE1BSFo7QUFJRU0sb0JBQVksSUFKZDtBQUtFTCx5QkFBaUJWO0FBTG5CLE9BMUJjLEVBaUNkO0FBQ0VyTyxZQUFJaUksOEJBRE47QUFFRTJHLGlCQUFTakYsS0FBSzJGLDZCQUZoQjtBQUdFUixrQkFBVW5GLEtBQUt1RixpQ0FBTCxJQUEwQyx1REFIdEQ7QUFJRUgseUJBQWlCUjtBQUpuQixPQWpDYyxDQUFoQjs7QUF5Q0EsVUFBRzdHLEdBQUc2SCxZQUFOLEVBQW9CO0FBQ2xCLFlBQUlDLFFBQVE5SCxHQUFHNkgsWUFBSCxDQUFnQixLQUFoQixDQUFaO0FBQ0E7QUFDQTtBQUNBLFlBQUlDLE1BQU1DLFFBQU4sRUFBSixFQUFzQjtBQUNwQkQsZ0JBQU1FLGVBQU4sQ0FBc0JmLFNBQXRCO0FBQ0QsU0FGRCxNQUdLO0FBQ0hqSCxhQUFHNkgsWUFBSCxDQUFnQjtBQUNkWix1QkFBV0E7QUFERyxXQUFoQjtBQUdEO0FBQ0Y7O0FBRUQsVUFBSWdCLGNBQWN2SSxTQUFTLFlBQVk7QUFDckMyQyx1QkFDRzZGLElBREgsQ0FDUSxRQURSLEVBQ2tCaEcsV0FBV1ksTUFBWCxFQURsQixFQUVHb0YsSUFGSCxDQUVRLE9BRlIsRUFFaUJoRyxXQUFXVyxLQUFYLEVBRmpCLEVBR0cvTCxHQUhILENBR087QUFDSCxzQkFBWSxVQURUO0FBRUgsaUJBQU8sQ0FGSjtBQUdILGtCQUFRLENBSEw7QUFJSCxxQkFBV3dQLFVBQVU2QjtBQUpsQixTQUhQOztBQVdBdkIsbUJBQVcsWUFBWTtBQUNyQixjQUFJd0IsV0FBVy9GLGVBQWVnRyxNQUFmLEVBQWY7QUFDQSxjQUFJQyxjQUFjcEcsV0FBV21HLE1BQVgsRUFBbEI7O0FBRUFoRyx5QkFDR3ZMLEdBREgsQ0FDTztBQUNILG1CQUFPLEVBQUVzUixTQUFTRyxHQUFULEdBQWVELFlBQVlDLEdBQTdCLENBREo7QUFFSCxvQkFBUSxFQUFFSCxTQUFTSSxJQUFULEdBQWdCRixZQUFZRSxJQUE5QjtBQUZMLFdBRFA7O0FBT0F6RixpQkFBT3FCLFFBQVAsR0FBa0JxRSxRQUFsQixDQUEyQnZHLFdBQVdXLEtBQVgsRUFBM0I7QUFDQUUsaUJBQU9xQixRQUFQLEdBQWtCc0UsU0FBbEIsQ0FBNEJ4RyxXQUFXWSxNQUFYLEVBQTVCOztBQUVBO0FBQ0EsY0FBRzlDLEVBQUgsRUFBTTtBQUNKMEc7QUFDRDtBQUNGLFNBbEJELEVBa0JHLENBbEJIO0FBb0JELE9BaENpQixFQWdDZixHQWhDZSxDQUFsQjs7QUFrQ0EsZUFBU2lDLFVBQVQsR0FBc0I7QUFDcEJWO0FBQ0Q7O0FBRURVOztBQUVBeEcsUUFBRXlHLE1BQUYsRUFBVUMsSUFBVixDQUFlLFFBQWYsRUFBeUIsWUFBWTtBQUNuQ0Y7QUFDRCxPQUZEOztBQUlBO0FBQ0EsVUFBSTVSLE9BQU9tTCxXQUFXbkwsSUFBWCxDQUFnQixlQUFoQixDQUFYO0FBQ0EsVUFBSUEsUUFBUSxJQUFaLEVBQWtCO0FBQ2hCQSxlQUFPLEVBQVA7QUFDRDtBQUNEQSxXQUFLdVAsT0FBTCxHQUFlckUsSUFBZjs7QUFFQSxVQUFJNkcsUUFBSjs7QUFFQSxlQUFTeEMsT0FBVCxHQUFtQjtBQUNqQixlQUFPd0MsYUFBYUEsV0FBVzVHLFdBQVduTCxJQUFYLENBQWdCLGVBQWhCLEVBQWlDdVAsT0FBekQsQ0FBUDtBQUNEOztBQUVEO0FBQ0EsZUFBU2IseUJBQVQsQ0FBbUNzRCxhQUFuQyxFQUFrRDtBQUNoRCxZQUFJQyxNQUFNaEosR0FBR2dKLEdBQUgsRUFBVjtBQUNBLFlBQUl0RCxPQUFPMUYsR0FBRzBGLElBQUgsRUFBWDs7QUFFQSxZQUFJL00sSUFBSW9RLGNBQWNwUSxDQUFkLEdBQWtCK00sSUFBbEIsR0FBeUJzRCxJQUFJclEsQ0FBckM7QUFDQSxZQUFJRCxJQUFJcVEsY0FBY3JRLENBQWQsR0FBa0JnTixJQUFsQixHQUF5QnNELElBQUl0USxDQUFyQzs7QUFFQSxlQUFPO0FBQ0xDLGFBQUdBLENBREU7QUFFTEQsYUFBR0E7QUFGRSxTQUFQO0FBSUQ7O0FBRUQsZUFBU2dPLFlBQVQsR0FBd0I7O0FBRXRCO0FBQ0F2RCxzQkFBY3VCLGtCQUFkLENBQWlDdkIsY0FBY0csYUFBL0M7O0FBRUEsWUFBRzVCLG1CQUFtQixJQUF0QixFQUEyQjtBQUN6QkEseUJBQWVxRCxPQUFmO0FBQ0FyRCwyQkFBaUIsSUFBakI7QUFDRDtBQUNELFlBQUdDLG1CQUFtQixJQUF0QixFQUEyQjtBQUN6QkEseUJBQWVvRCxPQUFmO0FBQ0FwRCwyQkFBaUIsSUFBakI7QUFDRDtBQUNEb0IsZUFBT3NDLElBQVA7O0FBRUEsWUFBSTdELGVBQUosRUFBc0I7QUFDcEIyQix3QkFBYzZCLGtCQUFkLENBQWlDeEQsZUFBakM7QUFDQXlILCtCQUFxQnpILGVBQXJCO0FBQ0Q7QUFDRjs7QUFFRDtBQUNBLGVBQVN5SCxvQkFBVCxDQUE4QjlTLElBQTlCLEVBQW9DO0FBQ2xDLFlBQUcsQ0FBQ0EsSUFBSixFQUFTO0FBQ1A7QUFDRDs7QUFFRCxZQUFJK1MsV0FBV3pULHFCQUFxQm1FLGlCQUFyQixDQUF1Q3pELElBQXZDLENBQWY7QUFDQSxZQUFHLE9BQU8rUyxRQUFQLEtBQW9CLFdBQXZCLEVBQW1DO0FBQ2pDQSxxQkFBVyxFQUFYO0FBQ0Q7QUFDRCxZQUFJQyxZQUFZaFQsS0FBS2lULGNBQUwsRUFBaEI7QUFDQSxZQUFJQyxZQUFZbFQsS0FBS21ULGNBQUwsRUFBaEI7QUFDQUosaUJBQVNLLE9BQVQsQ0FBaUJKLFVBQVV6USxDQUEzQjtBQUNBd1EsaUJBQVNLLE9BQVQsQ0FBaUJKLFVBQVV4USxDQUEzQjtBQUNBdVEsaUJBQVMxTixJQUFULENBQWM2TixVQUFVMVEsQ0FBeEI7QUFDQXVRLGlCQUFTMU4sSUFBVCxDQUFjNk4sVUFBVTNRLENBQXhCOztBQUdBLFlBQUcsQ0FBQ3dRLFFBQUosRUFDRTs7QUFFRixZQUFJTSxNQUFNO0FBQ1I3USxhQUFHdVEsU0FBUyxDQUFULENBREs7QUFFUnhRLGFBQUd3USxTQUFTLENBQVQ7QUFGSyxTQUFWOztBQUtBLFlBQUk5USxTQUFTO0FBQ1hPLGFBQUd1USxTQUFTQSxTQUFTbFMsTUFBVCxHQUFnQixDQUF6QixDQURRO0FBRVgwQixhQUFHd1EsU0FBU0EsU0FBU2xTLE1BQVQsR0FBZ0IsQ0FBekI7QUFGUSxTQUFiOztBQUtBLFlBQUl5UyxlQUFlO0FBQ2pCOVEsYUFBR3VRLFNBQVMsQ0FBVCxDQURjO0FBRWpCeFEsYUFBR3dRLFNBQVMsQ0FBVDtBQUZjLFNBQW5CO0FBSUEsWUFBSVEsZUFBZTtBQUNqQi9RLGFBQUd1USxTQUFTQSxTQUFTbFMsTUFBVCxHQUFnQixDQUF6QixDQURjO0FBRWpCMEIsYUFBR3dRLFNBQVNBLFNBQVNsUyxNQUFULEdBQWdCLENBQXpCO0FBRmMsU0FBbkI7QUFJQSxZQUFJQSxTQUFTaU8sc0JBQXNCOU8sSUFBdEIsSUFBOEIsSUFBM0M7O0FBRUF3VCxnQ0FBd0JILEdBQXhCLEVBQTZCcFIsTUFBN0IsRUFBcUNwQixNQUFyQyxFQUE0Q3lTLFlBQTVDLEVBQXlEQyxZQUF6RDtBQUVEOztBQUVELGVBQVNDLHVCQUFULENBQWlDM1IsTUFBakMsRUFBeUNJLE1BQXpDLEVBQWlEcEIsTUFBakQsRUFBd0R5UyxZQUF4RCxFQUFxRUMsWUFBckUsRUFBbUY7QUFDakY7QUFDQSxZQUFJRSxZQUFZNVIsT0FBT1csQ0FBUCxHQUFXM0IsU0FBUyxDQUFwQztBQUNBLFlBQUk2UyxZQUFZN1IsT0FBT1UsQ0FBUCxHQUFXMUIsU0FBUyxDQUFwQzs7QUFFQSxZQUFJOFMsWUFBWTFSLE9BQU9PLENBQVAsR0FBVzNCLFNBQVMsQ0FBcEM7QUFDQSxZQUFJK1MsWUFBWTNSLE9BQU9NLENBQVAsR0FBVzFCLFNBQVMsQ0FBcEM7O0FBRUEsWUFBSWdULGdCQUFnQlAsYUFBYTlRLENBQWIsR0FBaUIzQixTQUFRLENBQTdDO0FBQ0EsWUFBSWlULGdCQUFnQlIsYUFBYS9RLENBQWIsR0FBaUIxQixTQUFTLENBQTlDOztBQUVBLFlBQUlrVCxnQkFBZ0JSLGFBQWEvUSxDQUFiLEdBQWlCM0IsU0FBUSxDQUE3QztBQUNBLFlBQUltVCxnQkFBZ0JULGFBQWFoUixDQUFiLEdBQWlCMUIsU0FBUSxDQUE3Qzs7QUFHQTtBQUNBLFlBQUlvVCxvQkFBb0IzRSwwQkFBMEIsRUFBQzlNLEdBQUdpUixTQUFKLEVBQWVsUixHQUFHbVIsU0FBbEIsRUFBMUIsQ0FBeEI7QUFDQSxZQUFJUSxvQkFBb0I1RSwwQkFBMEIsRUFBQzlNLEdBQUdtUixTQUFKLEVBQWVwUixHQUFHcVIsU0FBbEIsRUFBMUIsQ0FBeEI7QUFDQS9TLGlCQUFTQSxTQUFTZ0osR0FBRzBGLElBQUgsRUFBVCxHQUFxQixDQUE5Qjs7QUFFQSxZQUFJNEUsdUJBQXVCN0UsMEJBQTBCLEVBQUM5TSxHQUFHcVIsYUFBSixFQUFtQnRSLEdBQUd1UixhQUF0QixFQUExQixDQUEzQjtBQUNBLFlBQUlNLHVCQUF1QjlFLDBCQUEwQixFQUFDOU0sR0FBR3VSLGFBQUosRUFBbUJ4UixHQUFHeVIsYUFBdEIsRUFBMUIsQ0FBM0I7O0FBRUE7QUFDQSxZQUFJSyxtQkFBbUJ4VCxNQUF2Qjs7QUFFQSxZQUFJeVQsaUJBQWlCeFEsS0FBS08sSUFBTCxDQUFVUCxLQUFLaUMsR0FBTCxDQUFTb08scUJBQXFCM1IsQ0FBckIsR0FBeUJ5UixrQkFBa0J6UixDQUFwRCxFQUFzRCxDQUF0RCxJQUEyRHNCLEtBQUtpQyxHQUFMLENBQVNvTyxxQkFBcUI1UixDQUFyQixHQUF5QjBSLGtCQUFrQjFSLENBQXBELEVBQXNELENBQXRELENBQXJFLENBQXJCO0FBQ0EsWUFBSWdTLGtCQUFrQk4sa0JBQWtCelIsQ0FBbEIsR0FBd0I2UixtQkFBa0JDLGNBQW5CLElBQXFDSCxxQkFBcUIzUixDQUFyQixHQUF5QnlSLGtCQUFrQnpSLENBQWhGLENBQTdDO0FBQ0EsWUFBSWdTLGtCQUFrQlAsa0JBQWtCMVIsQ0FBbEIsR0FBd0I4UixtQkFBa0JDLGNBQW5CLElBQXFDSCxxQkFBcUI1UixDQUFyQixHQUF5QjBSLGtCQUFrQjFSLENBQWhGLENBQTdDOztBQUdBLFlBQUlrUyxpQkFBaUIzUSxLQUFLTyxJQUFMLENBQVVQLEtBQUtpQyxHQUFMLENBQVNxTyxxQkFBcUI1UixDQUFyQixHQUF5QjBSLGtCQUFrQjFSLENBQXBELEVBQXNELENBQXRELElBQTJEc0IsS0FBS2lDLEdBQUwsQ0FBU3FPLHFCQUFxQjdSLENBQXJCLEdBQXlCMlIsa0JBQWtCM1IsQ0FBcEQsRUFBc0QsQ0FBdEQsQ0FBckUsQ0FBckI7QUFDQSxZQUFJbVMsa0JBQWtCUixrQkFBa0IxUixDQUFsQixHQUF3QjZSLG1CQUFrQkksY0FBbkIsSUFBcUNMLHFCQUFxQjVSLENBQXJCLEdBQXlCMFIsa0JBQWtCMVIsQ0FBaEYsQ0FBN0M7QUFDQSxZQUFJbVMsa0JBQWtCVCxrQkFBa0IzUixDQUFsQixHQUF3QjhSLG1CQUFrQkksY0FBbkIsSUFBcUNMLHFCQUFxQjdSLENBQXJCLEdBQXlCMlIsa0JBQWtCM1IsQ0FBaEYsQ0FBN0M7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsWUFBR2dKLG1CQUFtQixJQUF0QixFQUEyQjtBQUN6QkEsMkJBQWlCLElBQUllLE1BQU1zSSxNQUFWLENBQWlCO0FBQ2hDcFMsZUFBRytSLGtCQUFrQjFULE1BRFc7QUFFaEMwQixlQUFHaVMsa0JBQWtCM1QsTUFGVztBQUdoQ2dVLG9CQUFRaFUsTUFId0I7QUFJaEM2TyxrQkFBTTtBQUowQixXQUFqQixDQUFqQjtBQU1EOztBQUVELFlBQUdsRSxtQkFBbUIsSUFBdEIsRUFBMkI7QUFDekJBLDJCQUFpQixJQUFJYyxNQUFNc0ksTUFBVixDQUFpQjtBQUNoQ3BTLGVBQUdrUyxrQkFBa0I3VCxNQURXO0FBRWhDMEIsZUFBR29TLGtCQUFrQjlULE1BRlc7QUFHaENnVSxvQkFBUWhVLE1BSHdCO0FBSWhDNk8sa0JBQU07QUFKMEIsV0FBakIsQ0FBakI7QUFNRDs7QUFFRDlDLGVBQU9HLEdBQVAsQ0FBV3hCLGNBQVg7QUFDQXFCLGVBQU9HLEdBQVAsQ0FBV3ZCLGNBQVg7QUFDQW9CLGVBQU9zQyxJQUFQO0FBRUQ7O0FBRUQ7QUFDQSxlQUFTSixxQkFBVCxDQUErQjlPLElBQS9CLEVBQXFDO0FBQ25DLFlBQUk4VSxTQUFTM0UsVUFBVTRFLHFCQUF2QjtBQUNBLFlBQUlDLFdBQVdoVixLQUFLVyxHQUFMLENBQVMsT0FBVCxDQUFYLEtBQWlDLEdBQXJDLEVBQ0UsT0FBTyxNQUFNbVUsTUFBYixDQURGLEtBRUssT0FBT0UsV0FBV2hWLEtBQUtXLEdBQUwsQ0FBUyxPQUFULENBQVgsSUFBOEJtVSxNQUFyQztBQUNOOztBQUVEO0FBQ0EsZUFBU0csa0JBQVQsQ0FBNEJ6UyxDQUE1QixFQUErQkQsQ0FBL0IsRUFBa0MxQixNQUFsQyxFQUEwQ3FVLE9BQTFDLEVBQW1EQyxPQUFuRCxFQUEyRDtBQUN6RCxZQUFJQyxPQUFPRixVQUFVclUsU0FBUyxDQUE5QjtBQUNBLFlBQUl3VSxPQUFPSCxVQUFVclUsU0FBUyxDQUE5QjtBQUNBLFlBQUl5VSxPQUFPSCxVQUFVdFUsU0FBUyxDQUE5QjtBQUNBLFlBQUkwVSxPQUFPSixVQUFVdFUsU0FBUyxDQUE5Qjs7QUFFQSxZQUFJMlUsU0FBVWhULEtBQUs0UyxJQUFMLElBQWE1UyxLQUFLNlMsSUFBbkIsSUFBNkI5UyxLQUFLK1MsSUFBTCxJQUFhL1MsS0FBS2dULElBQTVEO0FBQ0EsZUFBT0MsTUFBUDtBQUNEOztBQUVEO0FBQ0EsZUFBU0MsdUJBQVQsQ0FBaUNqVCxDQUFqQyxFQUFvQ0QsQ0FBcEMsRUFBdUN2QyxJQUF2QyxFQUE2QztBQUMzQyxZQUFJbUIsT0FBTzdCLHFCQUFxQm1CLFdBQXJCLENBQWlDVCxJQUFqQyxDQUFYOztBQUVBLFlBQUdtQixTQUFTLGNBQVosRUFBMkI7QUFDekIsaUJBQU8sQ0FBQyxDQUFSO0FBQ0Q7O0FBRUQsWUFBR25CLEtBQUtZLElBQUwsQ0FBVXRCLHFCQUFxQlEsTUFBckIsQ0FBNEJxQixJQUE1QixFQUFrQyxRQUFsQyxDQUFWLEtBQTBELElBQTFELElBQ0RuQixLQUFLWSxJQUFMLENBQVV0QixxQkFBcUJRLE1BQXJCLENBQTRCcUIsSUFBNUIsRUFBa0MsUUFBbEMsQ0FBVixFQUF1RE4sTUFBdkQsSUFBaUUsQ0FEbkUsRUFDcUU7QUFDbkUsaUJBQU8sQ0FBQyxDQUFSO0FBQ0Q7O0FBRUQsWUFBSTZDLGFBQWFwRSxxQkFBcUJtRSxpQkFBckIsQ0FBdUN6RCxJQUF2QyxDQUFqQixDQVoyQyxDQVltQjtBQUM5RCxZQUFJYSxTQUFTaU8sc0JBQXNCOU8sSUFBdEIsQ0FBYjs7QUFFQSxhQUFJLElBQUlrQixJQUFJLENBQVosRUFBZXdDLGNBQWN4QyxJQUFJd0MsV0FBVzdDLE1BQTVDLEVBQW9ESyxJQUFJQSxJQUFJLENBQTVELEVBQThEO0FBQzVELGNBQUk2TixVQUFVckwsV0FBV3hDLENBQVgsQ0FBZDtBQUNBLGNBQUk4TixVQUFVdEwsV0FBV3hDLElBQUksQ0FBZixDQUFkOztBQUVBLGNBQUlzVSxTQUFTUCxtQkFBbUJ6UyxDQUFuQixFQUFzQkQsQ0FBdEIsRUFBeUIxQixNQUF6QixFQUFpQ2tPLE9BQWpDLEVBQTBDQyxPQUExQyxDQUFiO0FBQ0EsY0FBR3dHLE1BQUgsRUFBVTtBQUNSLG1CQUFPdFUsSUFBSSxDQUFYO0FBQ0Q7QUFDRjs7QUFFRCxlQUFPLENBQUMsQ0FBUjtBQUNEOztBQUVELGVBQVN3VSxxQkFBVCxDQUErQmxULENBQS9CLEVBQWtDRCxDQUFsQyxFQUFxQ3ZDLElBQXJDLEVBQTBDO0FBQ3hDLFlBQUlhLFNBQVNpTyxzQkFBc0I5TyxJQUF0QixDQUFiO0FBQ0EsWUFBSTJWLFNBQVMzVixLQUFLNFYsUUFBTCxDQUFjQyxRQUFkLENBQXVCQyxNQUFwQztBQUNBLFlBQUl6QyxNQUFNO0FBQ1I3USxhQUFHbVQsT0FBTyxDQUFQLENBREs7QUFFUnBULGFBQUdvVCxPQUFPLENBQVA7QUFGSyxTQUFWO0FBSUEsWUFBSTFULFNBQVM7QUFDWE8sYUFBR21ULE9BQU9BLE9BQU85VSxNQUFQLEdBQWMsQ0FBckIsQ0FEUTtBQUVYMEIsYUFBR29ULE9BQU9BLE9BQU85VSxNQUFQLEdBQWMsQ0FBckI7QUFGUSxTQUFiO0FBSUF5TyxrQ0FBMEIrRCxHQUExQjtBQUNBL0Qsa0NBQTBCck4sTUFBMUI7O0FBRUE7QUFDQSxZQUFHZ1QsbUJBQW1CelMsQ0FBbkIsRUFBc0JELENBQXRCLEVBQXlCMUIsTUFBekIsRUFBaUN3UyxJQUFJN1EsQ0FBckMsRUFBd0M2USxJQUFJOVEsQ0FBNUMsQ0FBSCxFQUNFLE9BQU8sQ0FBUCxDQURGLEtBRUssSUFBRzBTLG1CQUFtQnpTLENBQW5CLEVBQXNCRCxDQUF0QixFQUF5QjFCLE1BQXpCLEVBQWlDb0IsT0FBT08sQ0FBeEMsRUFBMkNQLE9BQU9NLENBQWxELENBQUgsRUFDSCxPQUFPLENBQVAsQ0FERyxLQUdILE9BQU8sQ0FBQyxDQUFSO0FBQ0g7O0FBRUQ7QUFDQSxlQUFTd0wsZUFBVCxHQUEyQjtBQUN6QjlDLDZCQUFxQnBCLEdBQUdrTSxjQUFILEVBQXJCO0FBQ0E3Syw2QkFBcUJyQixHQUFHbU0sY0FBSCxFQUFyQjtBQUNBN0ssa0NBQTBCdEIsR0FBR29NLG1CQUFILEVBQTFCOztBQUVBcE0sV0FBR21NLGNBQUgsQ0FBa0IsS0FBbEIsRUFDR0QsY0FESCxDQUNrQixLQURsQixFQUVHRSxtQkFGSCxDQUV1QixLQUZ2QjtBQUdEOztBQUVEO0FBQ0EsZUFBUzNILGFBQVQsR0FBeUI7QUFDdkJ6RSxXQUFHbU0sY0FBSCxDQUFrQjlLLGtCQUFsQixFQUNHNkssY0FESCxDQUNrQjlLLGtCQURsQixFQUVHZ0wsbUJBRkgsQ0FFdUI5Syx1QkFGdkI7QUFHRDs7QUFFRCxlQUFTMkMsb0JBQVQsR0FBK0I7QUFDN0I7QUFDQSxZQUFJakUsR0FBR3FNLEtBQUgsR0FBV04sUUFBWCxDQUFvQk8sU0FBcEIsQ0FBOEIsbUJBQTlCLENBQUosRUFBd0Q7QUFDdEQvSyxnQ0FBc0J2QixHQUFHcU0sS0FBSCxHQUFXTixRQUFYLENBQW9CTyxTQUFwQixDQUE4QixtQkFBOUIsRUFBbURDLEtBQXpFO0FBQ0QsU0FGRCxNQUdLO0FBQ0g7QUFDQTtBQUNBaEwsZ0NBQXNCLElBQXRCO0FBQ0Q7O0FBRUR2QixXQUFHcU0sS0FBSCxHQUNHakYsUUFESCxDQUNZLE1BRFosRUFFR2lGLEtBRkgsQ0FFUyxtQkFGVCxFQUU4QixDQUY5QixFQUdHRyxNQUhIO0FBSUQ7O0FBRUQsZUFBU2hJLGtCQUFULEdBQTZCO0FBQzNCeEUsV0FBR3FNLEtBQUgsR0FDR2pGLFFBREgsQ0FDWSxNQURaLEVBRUdpRixLQUZILENBRVMsbUJBRlQsRUFFOEI5SyxtQkFGOUIsRUFHR2lMLE1BSEg7QUFJRDs7QUFFRCxlQUFTQyxnQkFBVCxDQUEwQkMsWUFBMUIsRUFBd0N0VixLQUF4QyxFQUErQztBQUMzQ0EsY0FBTXlOLE9BQU4sQ0FBYyxVQUFVMU8sSUFBVixFQUFnQjtBQUMxQixjQUFJd1csMEJBQTBCbFgscUJBQXFCbUUsaUJBQXJCLENBQXVDekQsSUFBdkMsQ0FBOUI7QUFDQSxjQUFJeVcsMkJBQTJCLEVBQS9CO0FBQ0EsY0FBSUQsMkJBQTJCaFgsU0FBL0IsRUFDQTtBQUNFLGlCQUFLLElBQUkwQixJQUFFLENBQVgsRUFBY0EsSUFBRXNWLHdCQUF3QjNWLE1BQXhDLEVBQWdESyxLQUFHLENBQW5ELEVBQ0E7QUFDSXVWLHVDQUF5QnBSLElBQXpCLENBQThCLEVBQUM3QyxHQUFHZ1Usd0JBQXdCdFYsQ0FBeEIsSUFBMkJxVixhQUFhL1QsQ0FBNUMsRUFBK0NELEdBQUdpVSx3QkFBd0J0VixJQUFFLENBQTFCLElBQTZCcVYsYUFBYWhVLENBQTVGLEVBQTlCO0FBQ0g7QUFDRCxnQkFBSXBCLE9BQU83QixxQkFBcUJtQixXQUFyQixDQUFpQ1QsSUFBakMsQ0FBWDs7QUFFQSxnQkFBR1YscUJBQXFCNEksa0NBQXJCLENBQXdEL0csSUFBeEQsRUFBOEQsa0NBQTlELENBQUgsRUFBcUc7QUFDbkc7QUFDRDs7QUFFRG5CLGlCQUFLWSxJQUFMLENBQVV0QixxQkFBcUJRLE1BQXJCLENBQTRCcUIsSUFBNUIsRUFBa0MsVUFBbEMsQ0FBVixFQUF5RHNWLHdCQUF6RDtBQUNEO0FBQ0osU0FqQkQ7QUFrQkFuWCw2QkFBcUJ3QixnQkFBckIsQ0FBc0NxUCxVQUFVdUcscUJBQWhELEVBQXVFdkcsVUFBVXdHLHdCQUFqRixFQUEyRzFWLEtBQTNHOztBQUVBO0FBQ0E7QUFDQTRJLFdBQUcrTSxPQUFILENBQVcsbUJBQVg7QUFDSDs7QUFHRCxlQUFTQyw0QkFBVCxDQUFzQ0MsRUFBdEMsRUFBMENDLEVBQTFDLEVBQTZDO0FBQzNDLFlBQUlDLGVBQWVsVCxLQUFLbVQsS0FBTCxDQUFXRixHQUFHeFUsQ0FBSCxHQUFPdVUsR0FBR3ZVLENBQXJCLEVBQXdCd1UsR0FBR3ZVLENBQUgsR0FBT3NVLEdBQUd0VSxDQUFsQyxDQUFuQjtBQUNBLFlBQUkwVSxlQUFhLENBQUMsQ0FBQ3BULEtBQUtxVCxFQUFQLEVBQVUsQ0FBQ3JULEtBQUtxVCxFQUFOLEdBQVMsQ0FBVCxHQUFXLENBQXJCLEVBQXVCLENBQUNyVCxLQUFLcVQsRUFBTixHQUFTLENBQWhDLEVBQWtDLENBQUNyVCxLQUFLcVQsRUFBTixHQUFTLENBQTNDLEVBQTZDLENBQTdDLEVBQStDclQsS0FBS3FULEVBQUwsR0FBUSxDQUF2RCxFQUF5RHJULEtBQUtxVCxFQUFMLEdBQVEsQ0FBakUsRUFBbUVyVCxLQUFLcVQsRUFBTCxHQUFRLENBQVIsR0FBVSxDQUE3RSxFQUErRXJULEtBQUtxVCxFQUFMLEdBQVEsQ0FBdkYsQ0FBakI7QUFDQSxZQUFJQyxhQUFXLEVBQWY7QUFDQUYscUJBQWF4SSxPQUFiLENBQXFCLFVBQUMySSxLQUFELEVBQVM7QUFBQ0QscUJBQVcvUixJQUFYLENBQWdCdkIsS0FBS21GLEdBQUwsQ0FBUytOLGVBQWFLLEtBQXRCLENBQWhCO0FBQThDLFNBQTdFO0FBQ0EsWUFBSUMsYUFBWUYsV0FBV0csT0FBWCxDQUFtQnpULEtBQUtDLEdBQUwsYUFBWXFULFVBQVosQ0FBbkIsQ0FBaEI7QUFDQSxZQUFJbFQsS0FBTzZTLEdBQUd4VSxDQUFILEdBQU91VSxHQUFHdlUsQ0FBckI7QUFDQSxZQUFJNEIsS0FBTzRTLEdBQUd2VSxDQUFILEdBQU9zVSxHQUFHdFUsQ0FBckI7QUFDQSxZQUFJNEIsSUFBRU4sS0FBS08sSUFBTCxDQUFXRixLQUFLQSxFQUFMLEdBQVVELEtBQUtBLEVBQTFCLENBQU47QUFDQSxZQUFJc1QsT0FBSzFULEtBQUttRixHQUFMLENBQVM3RSxJQUFFTixLQUFLMlQsR0FBTCxDQUFTTCxXQUFXRSxVQUFYLENBQVQsQ0FBWCxDQUFUOztBQUVBLFlBQUlJLGNBQVlSLGFBQWFJLFVBQWIsQ0FBaEI7QUFDQSxZQUFJSyxRQUFNN1QsS0FBS21GLEdBQUwsQ0FBUzdFLElBQUVOLEtBQUs4VCxHQUFMLENBQVNSLFdBQVdFLFVBQVgsQ0FBVCxDQUFYLENBQVY7QUFDQSxZQUFJTyxlQUFhZixHQUFHdFUsQ0FBSCxHQUFPbVYsUUFBTTdULEtBQUs4VCxHQUFMLENBQVNGLFdBQVQsQ0FBOUI7QUFDQSxZQUFJSSxlQUFhaEIsR0FBR3ZVLENBQUgsR0FBT29WLFFBQU03VCxLQUFLMlQsR0FBTCxDQUFTQyxXQUFULENBQTlCOztBQUVBLGVBQU8sRUFBQyxnQkFBZUYsSUFBaEIsRUFBcUIsS0FBSUssWUFBekIsRUFBc0MsS0FBSUMsWUFBMUMsRUFBUDtBQUNEOztBQUVELGVBQVNDLGdCQUFULENBQTBCL1gsSUFBMUIsRUFBZ0NtQixJQUFoQyxFQUFzQ3dOLEtBQXRDLEVBQTZDN00sUUFBN0MsRUFBc0Q7QUFDcEQsWUFBSWtXLG9CQUFrQjFZLHFCQUFxQnNHLGlDQUFyQixDQUF1RDVGLElBQXZELEVBQTREbUIsSUFBNUQsRUFBaUV3TixLQUFqRSxDQUF0QjtBQUNBLFlBQUlzSixvQkFBa0IzWSxxQkFBcUJ1RyxpQ0FBckIsQ0FBdUQ3RixJQUF2RCxFQUE0RG1CLElBQTVELEVBQWlFd04sS0FBakUsQ0FBdEI7QUFDQSxZQUFJdUosZ0JBQWdCcFcsUUFBcEI7O0FBRUE7QUFDQSxZQUFJcVcsWUFBVXRCLDZCQUE2Qm1CLGlCQUE3QixFQUErQ0UsYUFBL0MsQ0FBZDtBQUNBLFlBQUlFLFlBQVV2Qiw2QkFBNkJvQixpQkFBN0IsRUFBK0NDLGFBQS9DLENBQWQ7QUFDQSxZQUFJRyxjQUFZLElBQWhCOztBQUVBLFlBQUlDLFlBQVV6TyxHQUFHMEYsSUFBSCxFQUFkO0FBQ0EsWUFBRzRJLFVBQVVJLFlBQVYsR0FBdUJILFVBQVVHLFlBQWpDLElBQWlESixVQUFVSSxZQUFWLEdBQXVCRCxTQUF2QixHQUFpQ3hNLEtBQUswTSxxQkFBMUYsRUFBZ0g7QUFDOUdILHdCQUFZLEVBQUM3VixHQUFFMlYsVUFBVTNWLENBQWIsRUFBZUQsR0FBRTRWLFVBQVU1VixDQUEzQixFQUE2QmtXLGdCQUFlVCxpQkFBNUMsRUFBWjtBQUNELFNBRkQsTUFFTSxJQUFHSSxVQUFVRyxZQUFWLEdBQXVCSixVQUFVSSxZQUFqQyxJQUFpREgsVUFBVUcsWUFBVixHQUF1QkQsU0FBdkIsR0FBaUN4TSxLQUFLME0scUJBQTFGLEVBQWdIO0FBQ3BISCx3QkFBWSxFQUFDN1YsR0FBRTRWLFVBQVU1VixDQUFiLEVBQWVELEdBQUU2VixVQUFVN1YsQ0FBM0IsRUFBNkJrVyxnQkFBZVIsaUJBQTVDLEVBQVo7QUFDRDs7QUFFRCxZQUFHSSxlQUFhLElBQWhCLEVBQXFCO0FBQ25CdlcsbUJBQVNVLENBQVQsR0FBVzZWLFlBQVk3VixDQUF2QjtBQUNBVixtQkFBU1MsQ0FBVCxHQUFXOFYsWUFBWTlWLENBQXZCO0FBQ0E7QUFDQSxjQUFJbVcsa0JBQWlCVixpQkFBckI7QUFDQSxjQUFHVSxtQkFBaUJMLFlBQVlJLGNBQWhDLEVBQWdEQyxrQkFBZ0JULGlCQUFoQjtBQUNoRCxjQUFJVSxhQUFXOUIsNkJBQTZCNkIsZUFBN0IsRUFBNkM1VyxRQUE3QyxDQUFmO0FBQ0EsY0FBSThXLG9CQUFrQixJQUF0QjtBQUNBLGNBQUdELFdBQVdKLFlBQVgsR0FBd0JELFNBQXhCLEdBQWtDeE0sS0FBSzBNLHFCQUExQyxFQUFpRUksb0JBQWtCLEVBQUNwVyxHQUFFbVcsV0FBV25XLENBQWQsRUFBZ0JELEdBQUVvVyxXQUFXcFcsQ0FBN0IsRUFBbEI7QUFDakUsY0FBR3FXLHFCQUFtQixJQUF0QixFQUEyQjtBQUN6QjlXLHFCQUFTVSxDQUFULEdBQVdvVyxrQkFBa0JwVyxDQUE3QjtBQUNBVixxQkFBU1MsQ0FBVCxHQUFXcVcsa0JBQWtCclcsQ0FBN0I7QUFDRDtBQUNGOztBQUVELFlBQUliLFVBQVUxQixLQUFLWSxJQUFMLENBQVV0QixxQkFBcUJRLE1BQXJCLENBQTRCcUIsSUFBNUIsRUFBa0MsUUFBbEMsQ0FBVixDQUFkO0FBQ0EsWUFBSU0sWUFBWXpCLEtBQUtZLElBQUwsQ0FBVXRCLHFCQUFxQlEsTUFBckIsQ0FBNEJxQixJQUE1QixFQUFrQyxVQUFsQyxDQUFWLENBQWhCOztBQUVBLFlBQUlpRix5QkFBeUI5RyxxQkFBcUJ3Ryx5QkFBckIsQ0FBK0M5RixJQUEvQyxFQUFxRDhCLFFBQXJELENBQTdCO0FBQ0FKLGdCQUFRaU4sS0FBUixJQUFpQnZJLHVCQUF1QmpHLE1BQXhDO0FBQ0FzQixrQkFBVWtOLEtBQVYsSUFBbUJ2SSx1QkFBdUJoRyxRQUExQzs7QUFFQUosYUFBS1ksSUFBTCxDQUFVdEIscUJBQXFCUSxNQUFyQixDQUE0QnFCLElBQTVCLEVBQWtDLFFBQWxDLENBQVYsRUFBdURPLE9BQXZEO0FBQ0ExQixhQUFLWSxJQUFMLENBQVV0QixxQkFBcUJRLE1BQXJCLENBQTRCcUIsSUFBNUIsRUFBa0MsVUFBbEMsQ0FBVixFQUF5RE0sU0FBekQ7QUFDRDs7QUFFRDtBQUNBLFVBQUlvWCxvQkFBb0J0UCxTQUFVd08sZ0JBQVYsRUFBNEIsQ0FBNUIsQ0FBeEI7O0FBRUE7QUFDRTlNLDZCQUFxQnBCLEdBQUdrTSxjQUFILEVBQXJCO0FBQ0E3Syw2QkFBcUJyQixHQUFHbU0sY0FBSCxFQUFyQjtBQUNBN0ssa0NBQTBCdEIsR0FBR29NLG1CQUFILEVBQTFCOztBQUVBO0FBQ0E7QUFDRSxjQUFJNkMsZ0JBQWdCalAsR0FBRzVJLEtBQUgsQ0FBUyxXQUFULENBQXBCO0FBQ0EsY0FBSXFLLHdCQUF3QndOLGNBQWNqWSxNQUExQzs7QUFFQSxjQUFLeUssMEJBQTBCLENBQS9CLEVBQW1DO0FBQ2pDRCw4QkFBa0J5TixjQUFjLENBQWQsQ0FBbEI7QUFDRDtBQUNGOztBQUVEalAsV0FBRzZJLElBQUgsQ0FBUSxVQUFSLEVBQW9CbEksUUFBUSxpQkFBWTtBQUN0QyxjQUFLLENBQUNhLGVBQU4sRUFBd0I7QUFDdEI7QUFDRDs7QUFFRGtGO0FBQ0QsU0FORDs7QUFRQTtBQUNBMUcsV0FBR3lELEVBQUgsQ0FBTSxNQUFOLEVBQWMsTUFBZCxFQUF1QixZQUFZO0FBQ2pDLGNBQUssQ0FBQ2pDLGVBQU4sRUFBd0I7QUFDdEI7QUFDRDs7QUFFRGtGO0FBQ0QsU0FORDs7QUFRQTFHLFdBQUd5RCxFQUFILENBQU0sT0FBTixFQUFlLGdHQUFmLEVBQWlIakQsU0FBUyxrQkFBWTtBQUNwSW9HLHFCQUFXLFlBQVU7QUFBQ0Y7QUFBZSxXQUFyQyxFQUF1QyxFQUF2QztBQUNELFNBRkQ7O0FBSUExRyxXQUFHeUQsRUFBSCxDQUFNLFFBQU4sRUFBZ0IsTUFBaEIsRUFBd0JoRCxVQUFVLG1CQUFZO0FBQzVDLGNBQUl0SyxPQUFPLElBQVg7QUFDQSxjQUFJQSxLQUFLK1ksUUFBTCxFQUFKLEVBQXFCO0FBQ25Cek4sb0NBQXdCQSx3QkFBd0IsQ0FBaEQ7O0FBRUF6QixlQUFHbVAsVUFBSDs7QUFFQSxnQkFBSTNOLGVBQUosRUFBcUI7QUFDbkJBLDhCQUFnQmhELFdBQWhCLENBQTRCLDJCQUE1QjtBQUNEOztBQUVELGdCQUFJaUQsMEJBQTBCLENBQTlCLEVBQWlDO0FBQy9CLGtCQUFJd04sZ0JBQWdCalAsR0FBRzVJLEtBQUgsQ0FBUyxXQUFULENBQXBCOztBQUVBO0FBQ0E7QUFDQSxrQkFBSTZYLGNBQWNqWSxNQUFkLEtBQXlCLENBQTdCLEVBQWdDO0FBQzlCd0ssa0NBQWtCeU4sY0FBYyxDQUFkLENBQWxCO0FBQ0F6TixnQ0FBZ0IxSixRQUFoQixDQUF5QiwyQkFBekI7QUFDRCxlQUhELE1BSUs7QUFDSDBKLGtDQUFrQjdMLFNBQWxCO0FBQ0Q7QUFDRixhQVpELE1BYUs7QUFDSDZMLGdDQUFrQjdMLFNBQWxCO0FBQ0Q7O0FBRURxSyxlQUFHb1AsUUFBSDtBQUNEO0FBQ0QxSTtBQUNELFNBL0JEOztBQWlDQzFHLFdBQUd5RCxFQUFILENBQU0sS0FBTixFQUFhLE1BQWIsRUFBcUIvQyxPQUFPLGdCQUFZO0FBQ3ZDLGNBQUl2SyxPQUFPLElBQVg7QUFDQSxjQUFJQSxLQUFLK1ksUUFBTCxFQUFKLEVBQXFCO0FBQ25Cek4sb0NBQXdCQSx3QkFBd0IsQ0FBaEQ7O0FBRUF6QixlQUFHbVAsVUFBSDs7QUFFQSxnQkFBSTNOLGVBQUosRUFBcUI7QUFDbkJBLDhCQUFnQmhELFdBQWhCLENBQTRCLDJCQUE1QjtBQUNEOztBQUVELGdCQUFJaUQsMEJBQTBCLENBQTlCLEVBQWlDO0FBQy9CRCxnQ0FBa0JyTCxJQUFsQjtBQUNBcUwsOEJBQWdCMUosUUFBaEIsQ0FBeUIsMkJBQXpCO0FBQ0QsYUFIRCxNQUlLO0FBQ0gwSixnQ0FBa0I3TCxTQUFsQjtBQUNEOztBQUVEcUssZUFBR29QLFFBQUg7QUFDRDtBQUNEMUk7QUFDRCxTQXRCQTs7QUF3QkQxRyxXQUFHeUQsRUFBSCxDQUFNLFFBQU4sRUFBZ0IsTUFBaEIsRUFBd0I3QyxVQUFVLG1CQUFZO0FBQzVDLGNBQUl6SyxPQUFPLElBQVg7O0FBRUEsY0FBR0EsS0FBS2lDLE1BQUwsR0FBY2lYLGNBQWQsR0FBK0JyWSxNQUEvQixJQUF5QyxDQUF6QyxJQUE4Q2IsS0FBSzZCLE1BQUwsR0FBY3FYLGNBQWQsR0FBK0JyWSxNQUEvQixJQUF5QyxDQUExRixFQUE0RjtBQUMxRjtBQUNEOztBQUdEeUssa0NBQXdCQSx3QkFBd0IsQ0FBaEQ7O0FBRUF6QixhQUFHbVAsVUFBSDs7QUFFQSxjQUFJM04sZUFBSixFQUFxQjtBQUNuQkEsNEJBQWdCaEQsV0FBaEIsQ0FBNEIsMkJBQTVCO0FBQ0Q7O0FBRUQsY0FBSWlELDBCQUEwQixDQUE5QixFQUFpQztBQUMvQkQsOEJBQWtCckwsSUFBbEI7QUFDQXFMLDRCQUFnQjFKLFFBQWhCLENBQXlCLDJCQUF6QjtBQUNELFdBSEQsTUFJSztBQUNIMEosOEJBQWtCN0wsU0FBbEI7QUFDRDs7QUFFRHFLLGFBQUdvUCxRQUFIO0FBQ0ExSTtBQUNELFNBMUJEOztBQTRCQTFHLFdBQUd5RCxFQUFILENBQU0sVUFBTixFQUFrQixNQUFsQixFQUEwQjVDLFlBQVkscUJBQVk7QUFDaERZLGtDQUF3QkEsd0JBQXdCLENBQWhEOztBQUVBekIsYUFBR21QLFVBQUg7O0FBRUEsY0FBSTNOLGVBQUosRUFBcUI7QUFDbkJBLDRCQUFnQmhELFdBQWhCLENBQTRCLDJCQUE1QjtBQUNEOztBQUVELGNBQUlpRCwwQkFBMEIsQ0FBOUIsRUFBaUM7QUFDL0IsZ0JBQUl3TixnQkFBZ0JqUCxHQUFHNUksS0FBSCxDQUFTLFdBQVQsQ0FBcEI7O0FBRUE7QUFDQTtBQUNBLGdCQUFJNlgsY0FBY2pZLE1BQWQsS0FBeUIsQ0FBN0IsRUFBZ0M7QUFDOUJ3SyxnQ0FBa0J5TixjQUFjLENBQWQsQ0FBbEI7QUFDQXpOLDhCQUFnQjFKLFFBQWhCLENBQXlCLDJCQUF6QjtBQUNELGFBSEQsTUFJSztBQUNIMEosZ0NBQWtCN0wsU0FBbEI7QUFDRDtBQUNGLFdBWkQsTUFhSztBQUNINkwsOEJBQWtCN0wsU0FBbEI7QUFDRDs7QUFFRHFLLGFBQUdvUCxRQUFIO0FBQ0ExSTtBQUNELFNBNUJEOztBQThCQSxZQUFJNEksZ0JBQUo7QUFDQSxZQUFJQyxXQUFKO0FBQ0EsWUFBSUMsU0FBSjtBQUNBLFlBQUl4TCxlQUFKO0FBQ0EsWUFBSXlMLGtCQUFKO0FBQ0EsWUFBSUMsYUFBSjtBQUNBLFlBQUlDLFNBQUo7QUFDQSxZQUFJQyxZQUFKO0FBQ0EsWUFBSUMsWUFBSjtBQUNBLFlBQUlDLHNCQUFzQixLQUExQjs7QUFFQTlQLFdBQUd5RCxFQUFILENBQU0sVUFBTixFQUFrQjNDLFlBQVksbUJBQVMrQyxLQUFULEVBQWdCO0FBQzVDMEwsd0JBQWMxTCxNQUFNNUwsUUFBTixJQUFrQjRMLE1BQU1rTSxVQUF0QztBQUNELFNBRkQ7O0FBSUEvUCxXQUFHeUQsRUFBSCxDQUFNLFVBQU4sRUFBa0IsTUFBbEIsRUFBMEIxQyxrQkFBa0IseUJBQVU4QyxLQUFWLEVBQWlCO0FBQzNELGNBQUkxTixPQUFPLElBQVg7O0FBRUEsY0FBSSxDQUFDcUwsZUFBRCxJQUFvQkEsZ0JBQWdCbEosRUFBaEIsT0FBeUJuQyxLQUFLbUMsRUFBTCxFQUFqRCxFQUE0RDtBQUMxRG1YLGlDQUFxQixLQUFyQjtBQUNBO0FBQ0Q7O0FBRURELHNCQUFZclosSUFBWjs7QUFFQSxjQUFJbUIsT0FBTzdCLHFCQUFxQm1CLFdBQXJCLENBQWlDVCxJQUFqQyxDQUFYOztBQUVBO0FBQ0EsY0FBR21CLFNBQVMsY0FBWixFQUNFQSxPQUFPLE1BQVA7O0FBRUYsY0FBSTBZLFNBQVNULFlBQVk1VyxDQUF6QjtBQUNBLGNBQUlzWCxTQUFTVixZQUFZN1csQ0FBekI7O0FBRUE7QUFDQSxjQUFJd1gsV0FBV3JFLHNCQUFzQm1FLE1BQXRCLEVBQThCQyxNQUE5QixFQUFzQzlaLElBQXRDLENBQWY7O0FBRUEsY0FBRytaLFlBQVksQ0FBWixJQUFpQkEsWUFBWSxDQUFoQyxFQUFrQztBQUNoQy9aLGlCQUFLNE4sUUFBTDtBQUNBMkwsNEJBQWdCUSxRQUFoQjtBQUNBTiwyQkFBZ0JNLFlBQVksQ0FBYixHQUFrQlYsVUFBVXhYLE1BQVYsRUFBbEIsR0FBdUN3WCxVQUFVcFgsTUFBVixFQUF0RDs7QUFFQSxnQkFBSStYLGtCQUFtQkQsWUFBWSxDQUFiLEdBQWtCLFFBQWxCLEdBQTZCLFFBQW5EO0FBQ0EsZ0JBQUl4WSxTQUFTa0ksc0JBQXNCd1EsY0FBdEIsQ0FBcUNaLFNBQXJDLEVBQWdEeFAsRUFBaEQsRUFBb0Q2RCxNQUFNd00sZ0JBQTFELEVBQTRFRixlQUE1RSxDQUFiOztBQUVBUix3QkFBWWpZLE9BQU9pWSxTQUFuQjtBQUNBSCx3QkFBWTlYLE9BQU92QixJQUFuQjs7QUFFQStOO0FBQ0QsV0FaRCxNQWFLO0FBQ0hvTCwrQkFBbUIzWixTQUFuQjtBQUNBOFosaUNBQXFCLElBQXJCO0FBQ0Q7QUFDRixTQXZDRDs7QUF5Q0F6UCxXQUFHeUQsRUFBSCxDQUFNLE1BQU4sRUFBYyxNQUFkLEVBQXNCdEMsUUFBUSxlQUFVMEMsS0FBVixFQUFpQjtBQUM3QyxjQUFJeU0sT0FBTyxJQUFYO0FBQ0F0USxhQUFHNUksS0FBSCxHQUFXMk0sUUFBWDtBQUNBLGNBQUcsQ0FBQ3VNLEtBQUtwQixRQUFMLEVBQUosRUFBb0I7QUFDbEJsUCxlQUFHdVEsS0FBSCxHQUFXeE0sUUFBWDtBQUNEO0FBQ0YsU0FORDtBQU9BL0QsV0FBR3lELEVBQUgsQ0FBTSxTQUFOLEVBQWlCekMsV0FBVyxrQkFBVTZDLEtBQVYsRUFBaUI7QUFDM0M7Ozs7O0FBS0EsY0FBSTdELEdBQUc1SSxLQUFILENBQVMsV0FBVCxFQUFzQkosTUFBdEIsR0FBK0IsQ0FBbkMsRUFBc0M7QUFDcENnSixlQUFHOEQsZUFBSCxDQUFtQixLQUFuQjtBQUNEO0FBQ0QsY0FBSTNOLE9BQU9xWixTQUFYOztBQUVBLGNBQUdBLGNBQWM3WixTQUFkLElBQTJCRixxQkFBcUI4QixhQUFyQixDQUFtQ3BCLElBQW5DLENBQTlCLEVBQXlFO0FBQ3ZFO0FBQ0Q7O0FBRUQsY0FBSW1CLE9BQU83QixxQkFBcUJtQixXQUFyQixDQUFpQ1QsSUFBakMsQ0FBWDs7QUFFQSxjQUFHc1osc0JBQXNCeE4sS0FBS3VPLHdCQUEzQixJQUF1RCxDQUFDNU8sYUFBeEQsSUFBeUV0SyxTQUFTLGNBQXJGLEVBQXFHO0FBQ25HO0FBQ0EsZ0JBQUl1RixZQUFZcEgscUJBQXFCUSxNQUFyQixDQUE0QnFCLElBQTVCLEVBQWtDLFFBQWxDLENBQWhCO0FBQ0EsZ0JBQUl3RixjQUFjckgscUJBQXFCUSxNQUFyQixDQUE0QnFCLElBQTVCLEVBQWtDLFVBQWxDLENBQWxCOztBQUVBME0sOEJBQWtCO0FBQ2hCN04sb0JBQU1BLElBRFU7QUFFaEJtQixvQkFBTUEsSUFGVTtBQUdoQk8sdUJBQVMxQixLQUFLWSxJQUFMLENBQVU4RixTQUFWLElBQXVCLEdBQUdPLE1BQUgsQ0FBVWpILEtBQUtZLElBQUwsQ0FBVThGLFNBQVYsQ0FBVixDQUF2QixHQUF5RCxFQUhsRDtBQUloQmpGLHlCQUFXekIsS0FBS1ksSUFBTCxDQUFVK0YsV0FBVixJQUF5QixHQUFHTSxNQUFILENBQVVqSCxLQUFLWSxJQUFMLENBQVUrRixXQUFWLENBQVYsQ0FBekIsR0FBNkQ7QUFKeEQsYUFBbEI7O0FBT0EzRyxpQkFBSzROLFFBQUw7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQXVMLCtCQUFtQjdaLHFCQUFxQmtILGNBQXJCLENBQW9DeEcsSUFBcEMsRUFBMENvWixXQUExQyxDQUFuQjtBQUNBQyx3QkFBWXJaLElBQVo7QUFDQXNaLGlDQUFxQjlaLFNBQXJCO0FBQ0FtYSxrQ0FBc0IsSUFBdEI7QUFDQTVMO0FBQ0Q7O0FBRUQ7QUFDQSxjQUFJLENBQUN0QyxhQUFELEtBQW1CNE4sY0FBYzdaLFNBQWQsSUFDcEIyWixxQkFBcUIzWixTQUFyQixJQUFrQytaLGtCQUFrQi9aLFNBRG5ELENBQUosRUFDb0U7QUFDbEU7QUFDRDs7QUFFRCxjQUFJOGEsV0FBVzVNLE1BQU01TCxRQUFOLElBQWtCNEwsTUFBTWtNLFVBQXZDOztBQUVBO0FBQ0EsY0FBR0wsaUJBQWlCLENBQUMsQ0FBbEIsSUFBdUJDLFNBQTFCLEVBQW9DO0FBQ2xDQSxzQkFBVTFYLFFBQVYsQ0FBbUJ3WSxRQUFuQjtBQUNEO0FBQ0Q7QUFIQSxlQUlLLElBQUduQixvQkFBb0IzWixTQUF2QixFQUFpQztBQUNwQ3FaLGdDQUFrQjdZLElBQWxCLEVBQXdCbUIsSUFBeEIsRUFBOEJnWSxnQkFBOUIsRUFBZ0RtQixRQUFoRDtBQUNEO0FBQ0Q7QUFISyxpQkFJQSxJQUFHN08sYUFBSCxFQUFpQjs7QUFFcEI7QUFDQTtBQUNBO0FBQ0Esb0JBQUd1QixjQUFjSSxrQkFBZCxLQUFxQzVOLFNBQXJDLElBQWtENFosV0FBckQsRUFBaUU7QUFDL0RwTSxnQ0FBY0ksa0JBQWQsR0FBbUNxSSx3QkFDakMyRCxZQUFZNVcsQ0FEcUIsRUFFakM0VyxZQUFZN1csQ0FGcUIsRUFHakN5SyxjQUFjaE4sSUFIbUIsQ0FBbkM7QUFJRDs7QUFFRCxvQkFBR2dOLGNBQWNJLGtCQUFkLEtBQXFDNU4sU0FBeEMsRUFBa0Q7QUFDaERxWixvQ0FDRTdMLGNBQWNoTixJQURoQixFQUVFZ04sY0FBY0MsUUFGaEIsRUFHRUQsY0FBY0ksa0JBSGhCLEVBSUVrTixRQUpGO0FBTUQ7QUFDRjs7QUFFRCxjQUFHNU0sTUFBTXpMLE1BQU4sSUFBZ0J5TCxNQUFNekwsTUFBTixDQUFhLENBQWIsQ0FBaEIsSUFBbUN5TCxNQUFNekwsTUFBTixDQUFhc1ksTUFBYixFQUF0QyxFQUE0RDtBQUMxRGIsMkJBQWVoTSxNQUFNekwsTUFBckI7QUFDRDtBQUVGLFNBckZEOztBQXVGQTRILFdBQUd5RCxFQUFILENBQU0sUUFBTixFQUFnQnhDLFVBQVUsaUJBQVU0QyxLQUFWLEVBQWlCOztBQUV6QyxjQUFHaEMsUUFBSCxFQUFZO0FBQ1ZrQixtQkFBT3FCLFFBQVAsR0FBa0J1TSxJQUFsQixDQUF1QixnQkFBdkI7QUFDRDs7QUFFRCxjQUFJeGEsT0FBT3FaLGFBQWFyTSxjQUFjaE4sSUFBdEM7O0FBRUEsY0FBSUEsU0FBU1IsU0FBYixFQUF5QjtBQUN2QixnQkFBSW1QLFFBQVEzQixjQUFjSSxrQkFBMUI7QUFDQSxnQkFBSXVCLFNBQVNuUCxTQUFiLEVBQXlCO0FBQ3ZCLGtCQUFJb0MsU0FBUzVCLEtBQUs2QixNQUFMLEdBQWNDLFFBQWQsQ0FBdUIsR0FBdkIsQ0FBYjtBQUNBLGtCQUFJQyxTQUFTL0IsS0FBSzZCLE1BQUwsR0FBY0MsUUFBZCxDQUF1QixHQUF2QixDQUFiO0FBQ0Esa0JBQUlFLE9BQU9oQyxLQUFLaUMsTUFBTCxHQUFjSCxRQUFkLENBQXVCLEdBQXZCLENBQVg7QUFDQSxrQkFBSUksT0FBT2xDLEtBQUtpQyxNQUFMLEdBQWNILFFBQWQsQ0FBdUIsR0FBdkIsQ0FBWDs7QUFFQSxrQkFBSTRCLGFBQWFwRSxxQkFBcUJtRSxpQkFBckIsQ0FBdUN6RCxJQUF2QyxDQUFqQjtBQUNBLGtCQUFJeWEsYUFBYSxDQUFDN1ksTUFBRCxFQUFTRyxNQUFULEVBQWlCa0YsTUFBakIsQ0FBd0J2RCxVQUF4QixFQUFvQ3VELE1BQXBDLENBQTJDLENBQUNqRixJQUFELEVBQU9FLElBQVAsQ0FBM0MsQ0FBakI7O0FBRUEsa0JBQUlxRCxjQUFjb0osUUFBUSxDQUExQjtBQUNBLGtCQUFJK0wsV0FBV25WLGNBQWMsQ0FBN0I7QUFDQSxrQkFBSW9WLFdBQVdwVixjQUFjLENBQTdCOztBQUVBLGtCQUFJWSxTQUFTO0FBQ1gzRCxtQkFBR2lZLFdBQVcsSUFBSWxWLFdBQWYsQ0FEUTtBQUVYaEQsbUJBQUdrWSxXQUFXLElBQUlsVixXQUFKLEdBQWtCLENBQTdCO0FBRlEsZUFBYjs7QUFLQSxrQkFBSXFWLGlCQUFpQjtBQUNuQnBZLG1CQUFHaVksV0FBVyxJQUFJQyxRQUFmLENBRGdCO0FBRW5CblksbUJBQUdrWSxXQUFXLElBQUlDLFFBQUosR0FBZSxDQUExQjtBQUZnQixlQUFyQjs7QUFLQSxrQkFBSUcsaUJBQWlCO0FBQ25CclksbUJBQUdpWSxXQUFXLElBQUlFLFFBQWYsQ0FEZ0I7QUFFbkJwWSxtQkFBR2tZLFdBQVcsSUFBSUUsUUFBSixHQUFlLENBQTFCO0FBRmdCLGVBQXJCOztBQUtBLGtCQUFJRyxVQUFKOztBQUVBLGtCQUFNM1UsT0FBTzNELENBQVAsS0FBYW9ZLGVBQWVwWSxDQUE1QixJQUFpQzJELE9BQU81RCxDQUFQLEtBQWFxWSxlQUFlclksQ0FBL0QsSUFBd0U0RCxPQUFPM0QsQ0FBUCxLQUFhb1ksZUFBZXBZLENBQTVCLElBQWlDMkQsT0FBTzVELENBQVAsS0FBYXFZLGVBQWVyWSxDQUF6SSxFQUErSTtBQUM3SXVZLDZCQUFhLElBQWI7QUFDRCxlQUZELE1BR0s7QUFDSCxvQkFBSWhZLEtBQUssQ0FBRThYLGVBQWVyWSxDQUFmLEdBQW1Cc1ksZUFBZXRZLENBQXBDLEtBQTRDcVksZUFBZXBZLENBQWYsR0FBbUJxWSxlQUFlclksQ0FBOUUsQ0FBVDtBQUNBLG9CQUFJTyxLQUFLLENBQUMsQ0FBRCxHQUFLRCxFQUFkOztBQUVBLG9CQUFJSSwwQkFBMEI7QUFDNUJiLDRCQUFVdVksY0FEa0I7QUFFNUJ0WSw0QkFBVXVZLGNBRmtCO0FBRzVCL1gsc0JBQUlBLEVBSHdCO0FBSTVCQyxzQkFBSUE7QUFKd0IsaUJBQTlCOztBQU9BLG9CQUFJK0Usc0JBQXNCeEkscUJBQXFCMEQsZUFBckIsQ0FBcUNoRCxJQUFyQyxFQUEyQ21HLE1BQTNDLEVBQW1EakQsdUJBQW5ELENBQTFCO0FBQ0Esb0JBQUk2RSxPQUFPakUsS0FBS08sSUFBTCxDQUFXUCxLQUFLaUMsR0FBTCxDQUFXSSxPQUFPM0QsQ0FBUCxHQUFXc0Ysb0JBQW9CdEYsQ0FBMUMsRUFBOEMsQ0FBOUMsSUFDWnNCLEtBQUtpQyxHQUFMLENBQVdJLE9BQU81RCxDQUFQLEdBQVd1RixvQkFBb0J2RixDQUExQyxFQUE4QyxDQUE5QyxDQURDLENBQVg7O0FBR0E7QUFDQSxvQkFBSXBCLE9BQU83QixxQkFBcUJtQixXQUFyQixDQUFpQ1QsSUFBakMsQ0FBWDtBQUNBLG9CQUFLbUIsU0FBUyxNQUFULElBQW1CNEcsT0FBUW9JLFVBQVU0SyxzQkFBMUMsRUFBbUU7QUFDakVELCtCQUFhLElBQWI7QUFDRDtBQUVGOztBQUVELGtCQUFJQSxVQUFKLEVBQ0E7QUFDRXhiLHFDQUFxQjJJLFlBQXJCLENBQWtDakksSUFBbEMsRUFBd0MyTyxLQUF4QztBQUNEO0FBRUYsYUE3REQsTUE4REssSUFBRzZLLGFBQWFoYSxTQUFiLEtBQTJCK1osaUJBQWlCLENBQWpCLElBQXNCQSxpQkFBaUIsQ0FBbEUsQ0FBSCxFQUF5RTs7QUFFNUUsa0JBQUl5QixVQUFVdkIsWUFBZDtBQUNBLGtCQUFJd0IsVUFBVSxPQUFkO0FBQ0Esa0JBQUlDLFdBQVkzQixpQkFBaUIsQ0FBbEIsR0FBdUIsUUFBdkIsR0FBa0MsUUFBakQ7O0FBRUE7QUFDQSxrQkFBR0csWUFBSCxFQUFnQjtBQUNkLG9CQUFJeUIsWUFBYTVCLGlCQUFpQixDQUFsQixHQUF1QkcsWUFBdkIsR0FBc0MxWixLQUFLNkIsTUFBTCxFQUF0RDtBQUNBLG9CQUFJdVosWUFBYTdCLGlCQUFpQixDQUFsQixHQUF1QkcsWUFBdkIsR0FBc0MxWixLQUFLaUMsTUFBTCxFQUF0RDtBQUNBLG9CQUFHLE9BQU8yTyxZQUFQLEtBQXdCLFVBQTNCLEVBQ0VxSyxVQUFVckssYUFBYTVRLElBQWIsRUFBbUJtYixTQUFuQixFQUE4QkMsU0FBOUIsQ0FBVjtBQUNGSiwwQkFBV0MsWUFBWSxPQUFiLEdBQXdCdkIsWUFBeEIsR0FBdUNELFlBQWpEO0FBQ0Q7O0FBRUQsa0JBQUkwQixZQUFhNUIsaUJBQWlCLENBQWxCLEdBQXVCeUIsT0FBdkIsR0FBaUNoYixLQUFLNkIsTUFBTCxFQUFqRDtBQUNBLGtCQUFJdVosWUFBYTdCLGlCQUFpQixDQUFsQixHQUF1QnlCLE9BQXZCLEdBQWlDaGIsS0FBS2lDLE1BQUwsRUFBakQ7QUFDQWpDLHFCQUFPeUosc0JBQXNCNFIsV0FBdEIsQ0FBa0NyYixJQUFsQyxFQUF3Q3laLFlBQXhDLEVBQXNEeUIsUUFBdEQsQ0FBUDs7QUFFQSxrQkFBR3pCLGFBQWF0WCxFQUFiLE9BQXNCNlksUUFBUTdZLEVBQVIsRUFBekIsRUFBc0M7QUFDcEM7QUFDQSxvQkFBRyxPQUFPd08sbUJBQVAsS0FBK0IsVUFBbEMsRUFBNkM7QUFDM0Msc0JBQUkySyxrQkFBa0IzSyxvQkFBb0J3SyxVQUFVaFosRUFBVixFQUFwQixFQUFvQ2laLFVBQVVqWixFQUFWLEVBQXBDLEVBQW9EbkMsS0FBS1ksSUFBTCxFQUFwRCxDQUF0Qjs7QUFFQSxzQkFBRzBhLGVBQUgsRUFBbUI7QUFDakI3UiwwQ0FBc0I4UixRQUF0QixDQUErQnZiLElBQS9CLEVBQXFDc2IsZUFBckM7QUFDQWhjLHlDQUFxQndCLGdCQUFyQixDQUFzQ3FQLFVBQVV1RyxxQkFBaEQsRUFDMEJ2RyxVQUFVd0csd0JBRHBDLEVBQzhELENBQUMyRSxlQUFELENBRDlEO0FBRUQ7O0FBRUQsc0JBQUdBLG1CQUFtQm5MLFVBQVVDLFFBQWhDLEVBQXlDO0FBQ3ZDLHdCQUFJeEcsU0FBUztBQUNYNFIsK0JBQVNGLGVBREU7QUFFWEcsK0JBQVN6YjtBQUZFLHFCQUFiO0FBSUE2Six1QkFBR3dHLFFBQUgsR0FBY0MsRUFBZCxDQUFpQix1QkFBakIsRUFBMEMxRyxNQUExQztBQUNBNUosMkJBQU9zYixlQUFQO0FBQ0QsbUJBUEQsTUFRSyxJQUFHQSxlQUFILEVBQW1CO0FBQ3RCelIsdUJBQUc2UixNQUFILENBQVUxYixJQUFWO0FBQ0FBLDJCQUFPc2IsZUFBUDtBQUNEO0FBQ0YsaUJBckJELE1Bc0JJO0FBQ0Ysc0JBQUlLLE1BQU9wQyxpQkFBaUIsQ0FBbEIsR0FBdUIsRUFBQzFYLFFBQVFtWixRQUFRN1ksRUFBUixFQUFULEVBQXZCLEdBQWdELEVBQUNGLFFBQVErWSxRQUFRN1ksRUFBUixFQUFULEVBQTFEO0FBQ0Esc0JBQUl5WixTQUFVckMsaUJBQWlCLENBQWxCLEdBQXVCLEVBQUMxWCxRQUFRNFgsYUFBYXRYLEVBQWIsRUFBVCxFQUF2QixHQUFxRCxFQUFDRixRQUFRd1gsYUFBYXRYLEVBQWIsRUFBVCxFQUFsRTs7QUFFQSxzQkFBR2dPLFVBQVVDLFFBQVYsSUFBc0I0SyxRQUFRN1ksRUFBUixPQUFpQnNYLGFBQWF0WCxFQUFiLEVBQTFDLEVBQTZEO0FBQzNELHdCQUFJK04sUUFBUTtBQUNWbFEsNEJBQU1BLElBREk7QUFFVmtiLGdDQUFVUyxHQUZBO0FBR1ZDLDhCQUFRQTtBQUhFLHFCQUFaO0FBS0Esd0JBQUlyYSxTQUFTc0ksR0FBR3dHLFFBQUgsR0FBY0MsRUFBZCxDQUFpQixlQUFqQixFQUFrQ0osS0FBbEMsQ0FBYjtBQUNBbFEsMkJBQU91QixPQUFPdkIsSUFBZDtBQUNBO0FBQ0Q7QUFDRjtBQUNGOztBQUVEO0FBQ0Esa0JBQUdpYixZQUFZLE9BQVosSUFBdUIsT0FBT3BLLDZCQUFQLEtBQXlDLFVBQW5FLEVBQThFO0FBQzVFQTtBQUNEO0FBQ0Q3USxtQkFBS29PLE1BQUw7QUFDQXZFLGlCQUFHNlIsTUFBSCxDQUFVbEMsU0FBVjtBQUNEO0FBQ0Y7QUFDRCxjQUFJclksT0FBTzdCLHFCQUFxQm1CLFdBQXJCLENBQWlDVCxJQUFqQyxDQUFYOztBQUVBO0FBQ0EsY0FBR21CLFNBQVMsY0FBWixFQUEyQjtBQUN6QkEsbUJBQU8sTUFBUDtBQUNEOztBQUVELGNBQUc2TCxjQUFjSSxrQkFBZCxLQUFxQzVOLFNBQXJDLElBQWtELENBQUNtYSxtQkFBdEQsRUFBMEU7QUFDeEU5TCw4QkFBa0JyTyxTQUFsQjtBQUNEOztBQUVELGNBQUlrSCxZQUFZcEgscUJBQXFCUSxNQUFyQixDQUE0QnFCLElBQTVCLEVBQWtDLFFBQWxDLENBQWhCO0FBQ0EsY0FBSW5CLFNBQVNSLFNBQVQsSUFBc0JxTyxvQkFBb0JyTyxTQUExQyxJQUNGLENBQUNRLEtBQUtZLElBQUwsQ0FBVThGLFNBQVYsSUFBdUIxRyxLQUFLWSxJQUFMLENBQVU4RixTQUFWLEVBQXFCbVYsUUFBckIsRUFBdkIsR0FBeUQsSUFBMUQsS0FBbUVoTyxnQkFBZ0JuTSxPQUFoQixDQUF3Qm1hLFFBQXhCLEVBRHJFLEVBQ3lHOztBQUV2RztBQUNBLGdCQUFHbEMsbUJBQUgsRUFBdUI7QUFDdkIzWixtQkFBS29PLE1BQUw7O0FBRUE7QUFDQXZFLGlCQUFHOEQsZUFBSCxDQUFtQixJQUFuQjtBQUNDOztBQUVELGdCQUFHd0MsVUFBVUMsUUFBYixFQUF1QjtBQUNyQnZHLGlCQUFHd0csUUFBSCxHQUFjQyxFQUFkLENBQWlCLG9CQUFqQixFQUF1Q3pDLGVBQXZDO0FBQ0Q7QUFDRjs7QUFFRHNMLDZCQUFtQjNaLFNBQW5CO0FBQ0E2WixzQkFBWTdaLFNBQVo7QUFDQXFPLDRCQUFrQnJPLFNBQWxCO0FBQ0E4WiwrQkFBcUI5WixTQUFyQjtBQUNBK1osMEJBQWdCL1osU0FBaEI7QUFDQWdhLHNCQUFZaGEsU0FBWjtBQUNBaWEseUJBQWVqYSxTQUFmO0FBQ0FrYSx5QkFBZWxhLFNBQWY7QUFDQTRaLHdCQUFjNVosU0FBZDtBQUNBbWEsZ0NBQXNCLEtBQXRCOztBQUVBM00sd0JBQWNJLGtCQUFkLEdBQW1DNU4sU0FBbkM7O0FBRUE4TztBQUNBbUMscUJBQVcsWUFBVTtBQUFDRjtBQUFlLFdBQXJDLEVBQXVDLEVBQXZDO0FBQ0QsU0F2TEQ7O0FBeUxBO0FBQ0EsWUFBSXVMLGVBQUo7QUFDQSxZQUFJQyxXQUFKO0FBQ0EsWUFBSUMseUJBQUo7QUFDQSxZQUFJQyxxQkFBSjtBQUNBcFMsV0FBR3lELEVBQUgsQ0FBTSx1QkFBTixFQUErQixVQUFVNE8sQ0FBVixFQUFhamIsS0FBYixFQUFvQjtBQUMvQ2diLGtDQUF3QixLQUF4QjtBQUNBLGNBQUloYixNQUFNLENBQU4sS0FBWXpCLFNBQWhCLEVBQ0E7QUFDSXlCLGtCQUFNeU4sT0FBTixDQUFjLFVBQVUxTyxJQUFWLEVBQWdCO0FBQzVCLGtCQUFJVixxQkFBcUJtRSxpQkFBckIsQ0FBdUN6RCxJQUF2QyxLQUFnRFIsU0FBaEQsSUFBNkQsQ0FBQ3ljLHFCQUFsRSxFQUNBO0FBQ0lGLDhCQUFjLEVBQUV2WixHQUFHbEQscUJBQXFCbUUsaUJBQXJCLENBQXVDekQsSUFBdkMsRUFBNkMsQ0FBN0MsQ0FBTCxFQUFzRHVDLEdBQUdqRCxxQkFBcUJtRSxpQkFBckIsQ0FBdUN6RCxJQUF2QyxFQUE2QyxDQUE3QyxDQUF6RCxFQUFkO0FBQ0E4YixrQ0FBa0I7QUFDZEssNkJBQVcsSUFERztBQUVkQyx1Q0FBcUI7QUFDakI1Wix1QkFBR3VaLFlBQVl2WixDQURFO0FBRWpCRCx1QkFBR3daLFlBQVl4WjtBQUZFLG1CQUZQO0FBTWR0Qix5QkFBT0E7QUFOTyxpQkFBbEI7QUFRQSthLDRDQUE0QmhjLElBQTVCO0FBQ0FpYyx3Q0FBd0IsSUFBeEI7QUFDSDtBQUNGLGFBZkQ7QUFnQkg7QUFDSixTQXJCRDs7QUF1QkFwUyxXQUFHeUQsRUFBSCxDQUFNLHFCQUFOLEVBQTZCLFVBQVU0TyxDQUFWLEVBQWFqYixLQUFiLEVBQW9CO0FBQzdDLGNBQUk2YSxtQkFBbUJ0YyxTQUF2QixFQUNBO0FBQ0ksZ0JBQUk2YyxhQUFhUCxnQkFBZ0JNLG1CQUFqQztBQUNBLGdCQUFJRSxtQkFBbUI7QUFDbkI5WixpQkFBR2xELHFCQUFxQm1FLGlCQUFyQixDQUF1Q3VZLHlCQUF2QyxFQUFrRSxDQUFsRSxDQURnQjtBQUVuQnpaLGlCQUFHakQscUJBQXFCbUUsaUJBQXJCLENBQXVDdVkseUJBQXZDLEVBQWtFLENBQWxFO0FBRmdCLGFBQXZCOztBQU1BRiw0QkFBZ0J2RixZQUFoQixHQUErQjtBQUMzQi9ULGlCQUFHLENBQUM4WixpQkFBaUI5WixDQUFsQixHQUFzQjZaLFdBQVc3WixDQURUO0FBRTNCRCxpQkFBRyxDQUFDK1osaUJBQWlCL1osQ0FBbEIsR0FBc0I4WixXQUFXOVo7QUFGVCxhQUEvQjs7QUFLQSxtQkFBT3VaLGdCQUFnQk0sbUJBQXZCOztBQUVBLGdCQUFHak0sVUFBVUMsUUFBYixFQUF1QjtBQUNuQnZHLGlCQUFHd0csUUFBSCxHQUFjQyxFQUFkLENBQWlCLGtCQUFqQixFQUFxQ3dMLGVBQXJDO0FBQ0g7O0FBRURBLDhCQUFrQnRjLFNBQWxCO0FBQ0g7QUFDSixTQXZCRDs7QUF5QkFxSyxXQUFHeUQsRUFBSCxDQUFNLFFBQU4sRUFBZ0J2QyxVQUFVLGlCQUFVMkMsS0FBVixFQUFpQjtBQUN6QyxjQUFJekwsU0FBU3lMLE1BQU16TCxNQUFOLElBQWdCeUwsTUFBTXVDLFFBQW5DO0FBQ0EsY0FBSXNNLGVBQWUsS0FBbkI7O0FBRUEsY0FBRztBQUNEQSwyQkFBZXRhLE9BQU91YSxNQUFQLEVBQWY7QUFDRCxXQUZELENBR0EsT0FBTUMsR0FBTixFQUFVO0FBQ1I7QUFDRDs7QUFFRCxjQUFJemMsSUFBSixFQUFVbUIsSUFBVjtBQUNBLGNBQUdvYixZQUFILEVBQWdCO0FBQ2R2YyxtQkFBT2lDLE1BQVA7QUFDQWQsbUJBQU83QixxQkFBcUJtQixXQUFyQixDQUFpQ1QsSUFBakMsQ0FBUDtBQUNELFdBSEQsTUFJSTtBQUNGQSxtQkFBT2dOLGNBQWNoTixJQUFyQjtBQUNBbUIsbUJBQU82TCxjQUFjQyxRQUFyQjtBQUNEOztBQUVELGNBQUkwRSxRQUFROUgsR0FBRzZILFlBQUgsQ0FBZ0IsS0FBaEIsQ0FBWixDQXJCeUMsQ0FxQkw7O0FBRXBDLGNBQUcsQ0FBQ3JHLGVBQUQsSUFBb0JBLGdCQUFnQmxKLEVBQWhCLE1BQXdCbkMsS0FBS21DLEVBQUwsRUFBNUMsSUFBeUQ3QyxxQkFBcUI4QixhQUFyQixDQUFtQ3BCLElBQW5DLENBQXpELElBQ0NxTCxvQkFBb0JyTCxJQUR4QixFQUM4QjtBQUM1QjJSLGtCQUFNK0ssWUFBTixDQUFtQjFTLHdCQUFuQjtBQUNBMkgsa0JBQU0rSyxZQUFOLENBQW1CM1MscUJBQW5CO0FBQ0E0SCxrQkFBTStLLFlBQU4sQ0FBbUJ2UywyQkFBbkI7QUFDQXdILGtCQUFNK0ssWUFBTixDQUFtQnhTLHdCQUFuQjtBQUNBO0FBQ0Q7O0FBRUQsY0FBSXlTLFFBQVFqUCxNQUFNNUwsUUFBTixJQUFrQjRMLE1BQU1rTSxVQUFwQztBQUNBLGNBQUlnRCxnQkFBZ0JuSCx3QkFBd0JrSCxNQUFNbmEsQ0FBOUIsRUFBaUNtYSxNQUFNcGEsQ0FBdkMsRUFBMEN2QyxJQUExQyxDQUFwQjtBQUNBO0FBQ0EsY0FBSTRjLGlCQUFpQixDQUFDLENBQXRCLEVBQXlCO0FBQ3ZCakwsa0JBQU0rSyxZQUFOLENBQW1CMVMsd0JBQW5CO0FBQ0EySCxrQkFBTStLLFlBQU4sQ0FBbUJ2UywyQkFBbkI7QUFDQSxnQkFBR2hKLFNBQVMsU0FBVCxJQUFzQm9iLFlBQXpCLEVBQXNDO0FBQ3BDNUssb0JBQU1rTCxZQUFOLENBQW1CM1Msd0JBQW5CO0FBQ0F5SCxvQkFBTStLLFlBQU4sQ0FBbUIzUyxxQkFBbkI7QUFDRCxhQUhELE1BSUssSUFBRzVJLFNBQVMsTUFBVCxJQUFtQm9iLFlBQXRCLEVBQW1DO0FBQ3RDNUssb0JBQU1rTCxZQUFOLENBQW1COVMscUJBQW5CO0FBQ0E0SCxvQkFBTStLLFlBQU4sQ0FBbUJ4Uyx3QkFBbkI7QUFDRCxhQUhJLE1BSUEsSUFBSXFTLFlBQUosRUFBaUI7QUFDcEI1SyxvQkFBTWtMLFlBQU4sQ0FBbUI5UyxxQkFBbkI7QUFDQTRILG9CQUFNa0wsWUFBTixDQUFtQjNTLHdCQUFuQjtBQUNELGFBSEksTUFJQTtBQUNIeUgsb0JBQU0rSyxZQUFOLENBQW1CM1MscUJBQW5CO0FBQ0E0SCxvQkFBTStLLFlBQU4sQ0FBbUJ4Uyx3QkFBbkI7QUFDRDtBQUNENUssaUNBQXFCRyxhQUFyQixHQUFxQ2tkLEtBQXJDO0FBQ0Q7QUFDRDtBQXJCQSxlQXNCSztBQUNIaEwsb0JBQU0rSyxZQUFOLENBQW1CM1MscUJBQW5CO0FBQ0E0SCxvQkFBTStLLFlBQU4sQ0FBbUJ4Uyx3QkFBbkI7QUFDQSxrQkFBRy9JLFNBQVMsU0FBWixFQUFzQjtBQUNwQndRLHNCQUFNa0wsWUFBTixDQUFtQjFTLDJCQUFuQjtBQUNBd0gsc0JBQU0rSyxZQUFOLENBQW1CMVMsd0JBQW5CO0FBQ0Esb0JBQUk4QixLQUFLdUYsaUNBQUwsSUFDQXJSLEtBQUtVLFFBQUwsQ0FBYyw2Q0FBZCxDQURKLEVBQ2tFO0FBQ2hFaVIsd0JBQU1rTCxZQUFOLENBQW1CelMsOEJBQW5CO0FBQ0Q7QUFDRixlQVBELE1BUUssSUFBR2pKLFNBQVMsTUFBWixFQUFtQjtBQUN0QndRLHNCQUFNa0wsWUFBTixDQUFtQjdTLHdCQUFuQjtBQUNBMkgsc0JBQU0rSyxZQUFOLENBQW1CdlMsMkJBQW5CO0FBQ0QsZUFISSxNQUlEO0FBQ0Z3SCxzQkFBTStLLFlBQU4sQ0FBbUIxUyx3QkFBbkI7QUFDQTJILHNCQUFNK0ssWUFBTixDQUFtQnZTLDJCQUFuQjtBQUNBd0gsc0JBQU0rSyxZQUFOLENBQW1CdFMsOEJBQW5CO0FBQ0Q7QUFDRDlLLG1DQUFxQkksa0JBQXJCLEdBQTBDa2QsYUFBMUM7QUFDRDs7QUFFRHRkLCtCQUFxQkMsY0FBckIsR0FBc0NTLElBQXRDO0FBQ0QsU0FqRkQ7O0FBbUZBNkosV0FBR3lELEVBQUgsQ0FBTSxrQ0FBTixFQUEwQyxNQUExQyxFQUFrRCxZQUFXO0FBQzNELGNBQUl0TixPQUFPLElBQVg7QUFDQTZKLGFBQUdtUCxVQUFIO0FBQ0FuUCxhQUFHNUksS0FBSCxHQUFXMk0sUUFBWDs7QUFFQTtBQUNBO0FBQ0EvRCxhQUFHK00sT0FBSCxDQUFXLG1CQUFYOztBQUVBL00sYUFBR29QLFFBQUg7QUFDQTFJO0FBR0QsU0FiRDtBQWNEOztBQUVELFVBQUl1SSxhQUFKO0FBQ0EsVUFBSWdFLGdCQUFnQixLQUFwQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxVQUFJQyxPQUFPO0FBQ1QsY0FBTSxLQURHO0FBRVQsY0FBTSxLQUZHO0FBR1QsY0FBTSxLQUhHO0FBSVQsY0FBTTtBQUpHLE9BQVg7O0FBT0EsZUFBU0MsT0FBVCxDQUFpQmQsQ0FBakIsRUFBb0I7O0FBRWhCLFlBQUllLGFBQWEsT0FBTzlNLFVBQVUrTSw4QkFBakIsS0FBb0QsVUFBcEQsR0FDWC9NLFVBQVUrTSw4QkFBVixFQURXLEdBQ2tDL00sVUFBVStNLDhCQUQ3RDs7QUFHQSxZQUFJLENBQUNELFVBQUwsRUFBaUI7QUFDYjtBQUNIOztBQUVEO0FBQ0EsWUFBSUUsS0FBS0MsU0FBU0MsYUFBVCxDQUF1QkMsT0FBaEM7QUFDQSxZQUFJSCxNQUFNLFVBQU4sSUFBb0JBLE1BQU0sT0FBOUIsRUFDQTtBQUNJLGtCQUFPakIsRUFBRXFCLE9BQVQ7QUFDSSxpQkFBSyxFQUFMLENBQVMsS0FBSyxFQUFMLENBQVMsS0FBSyxFQUFMLENBQVUsS0FBSyxFQUFMLENBRGhDLENBQ3lDO0FBQ3JDLGlCQUFLLEVBQUw7QUFBU3JCLGdCQUFFc0IsY0FBRixHQUFvQixNQUZqQyxDQUV3QztBQUNwQztBQUFTLG9CQUhiLENBR29CO0FBSHBCO0FBS0EsY0FBSXRCLEVBQUVxQixPQUFGLEdBQVksSUFBWixJQUFvQnJCLEVBQUVxQixPQUFGLEdBQVksSUFBcEMsRUFBMEM7QUFDdEM7QUFDSDtBQUNEUixlQUFLYixFQUFFcUIsT0FBUCxJQUFrQixJQUFsQjs7QUFFQTtBQUNBO0FBQ0EsY0FBSTFULEdBQUc1SSxLQUFILENBQVMsV0FBVCxFQUFzQkosTUFBdEIsSUFBZ0NnSixHQUFHNFQsUUFBSCxDQUFZLFdBQVosRUFBeUI1YyxNQUF6RCxJQUFtRWdKLEdBQUc1SSxLQUFILENBQVMsV0FBVCxFQUFzQkosTUFBdEIsSUFBZ0MsQ0FBdkcsRUFDQTtBQUNFO0FBQ0Q7QUFDRCxjQUFJLENBQUNpYyxhQUFMLEVBQ0E7QUFDSWhFLDRCQUFnQmpQLEdBQUc1SSxLQUFILENBQVMsV0FBVCxDQUFoQjtBQUNBNEksZUFBRytNLE9BQUgsQ0FBVyx1QkFBWCxFQUFvQyxDQUFDa0MsYUFBRCxDQUFwQztBQUNBZ0UsNEJBQWdCLElBQWhCO0FBQ0g7QUFDRCxjQUFJWSxZQUFZLENBQWhCOztBQUVBO0FBQ0EsY0FBR3hCLEVBQUV5QixNQUFGLElBQVl6QixFQUFFMEIsUUFBakIsRUFBMkI7QUFDekI7QUFDRCxXQUZELE1BR0ssSUFBSTFCLEVBQUV5QixNQUFOLEVBQWM7QUFDakJELHdCQUFZLENBQVo7QUFDRCxXQUZJLE1BR0EsSUFBSXhCLEVBQUUwQixRQUFOLEVBQWdCO0FBQ25CRix3QkFBWSxFQUFaO0FBQ0Q7O0FBRUQsY0FBSUcsY0FBYyxFQUFsQjtBQUNBLGNBQUlDLGdCQUFnQixFQUFwQjtBQUNBLGNBQUlDLGdCQUFnQixFQUFwQjtBQUNBLGNBQUlDLGlCQUFpQixFQUFyQjs7QUFFQSxjQUFJN1osS0FBSyxDQUFUO0FBQ0EsY0FBSUQsS0FBSyxDQUFUOztBQUVBQyxnQkFBTTRZLEtBQUtpQixjQUFMLElBQXVCTixTQUF2QixHQUFtQyxDQUF6QztBQUNBdlosZ0JBQU00WSxLQUFLZ0IsYUFBTCxJQUFzQkwsU0FBdEIsR0FBa0MsQ0FBeEM7QUFDQXhaLGdCQUFNNlksS0FBS2UsYUFBTCxJQUFzQkosU0FBdEIsR0FBa0MsQ0FBeEM7QUFDQXhaLGdCQUFNNlksS0FBS2MsV0FBTCxJQUFvQkgsU0FBcEIsR0FBZ0MsQ0FBdEM7O0FBRUFwSCwyQkFBaUIsRUFBQzlULEdBQUUyQixFQUFILEVBQU81QixHQUFFMkIsRUFBVCxFQUFqQixFQUErQjRVLGFBQS9CO0FBQ0g7QUFDSjtBQUNELGVBQVNtRixLQUFULENBQWUvQixDQUFmLEVBQWtCOztBQUVkLFlBQUlBLEVBQUVxQixPQUFGLEdBQVksSUFBWixJQUFvQnJCLEVBQUVxQixPQUFGLEdBQVksSUFBcEMsRUFBMEM7QUFDdEM7QUFDSDtBQUNEckIsVUFBRXNCLGNBQUY7QUFDQVQsYUFBS2IsRUFBRXFCLE9BQVAsSUFBa0IsS0FBbEI7QUFDQSxZQUFJTixhQUFhLE9BQU85TSxVQUFVK00sOEJBQWpCLEtBQW9ELFVBQXBELEdBQ1gvTSxVQUFVK00sOEJBQVYsRUFEVyxHQUNrQy9NLFVBQVUrTSw4QkFEN0Q7O0FBR0EsWUFBSSxDQUFDRCxVQUFMLEVBQWlCO0FBQ2I7QUFDSDs7QUFFRHBULFdBQUcrTSxPQUFILENBQVcscUJBQVgsRUFBa0MsQ0FBQ2tDLGFBQUQsQ0FBbEM7QUFDQUEsd0JBQWdCdFosU0FBaEI7QUFDQXNkLHdCQUFnQixLQUFoQjtBQUVIO0FBQ0RNLGVBQVNjLGdCQUFULENBQTBCLFNBQTFCLEVBQW9DbEIsT0FBcEMsRUFBNkMsSUFBN0M7QUFDQUksZUFBU2MsZ0JBQVQsQ0FBMEIsT0FBMUIsRUFBa0NELEtBQWxDLEVBQXlDLElBQXpDOztBQUVBbFMsaUJBQVduTCxJQUFYLENBQWdCLGVBQWhCLEVBQWlDQSxJQUFqQztBQUNELEtBbCtDYTtBQW0rQ2R1ZCxZQUFRLGtCQUFZO0FBQ2hCdFUsU0FBRzRELEdBQUgsQ0FBTyxRQUFQLEVBQWlCLE1BQWpCLEVBQXlCbkQsT0FBekIsRUFDR21ELEdBREgsQ0FDTyxLQURQLEVBQ2MsTUFEZCxFQUNzQmxELElBRHRCLEVBRUdrRCxHQUZILENBRU8sT0FGUCxFQUVnQixnR0FGaEIsRUFFa0hwRCxNQUZsSCxFQUdHb0QsR0FISCxDQUdPLFFBSFAsRUFHaUIsTUFIakIsRUFHeUJoRCxPQUh6QixFQUlHZ0QsR0FKSCxDQUlPLFVBSlAsRUFJbUIsTUFKbkIsRUFJMkIvQyxTQUozQixFQUtHK0MsR0FMSCxDQUtPLFVBTFAsRUFLbUI5QyxTQUxuQixFQU1HOEMsR0FOSCxDQU1PLFVBTlAsRUFNbUIsTUFObkIsRUFNMkI3QyxlQU4zQixFQU9HNkMsR0FQSCxDQU9PLFNBUFAsRUFPa0I1QyxRQVBsQixFQVFHNEMsR0FSSCxDQVFPLFFBUlAsRUFRaUIzQyxPQVJqQixFQVNHMkMsR0FUSCxDQVNPLFFBVFAsRUFTaUIxQyxPQVRqQixFQVVHMEMsR0FWSCxDQVVPLE1BVlAsRUFVZSxNQVZmLEVBVXNCekMsS0FWdEI7O0FBWUFuQixTQUFHc1UsTUFBSCxDQUFVLFVBQVYsRUFBc0IzVCxLQUF0QjtBQUNIO0FBai9DYSxHQUFoQjs7QUFvL0NBLE1BQUltQixVQUFVN0IsRUFBVixDQUFKLEVBQW1CO0FBQ2pCLFdBQU82QixVQUFVN0IsRUFBVixFQUFjeEksS0FBZCxDQUFvQjBLLEVBQUVuQyxHQUFHNEMsU0FBSCxFQUFGLENBQXBCLEVBQXVDMlIsTUFBTUMsU0FBTixDQUFnQkMsS0FBaEIsQ0FBc0JDLElBQXRCLENBQTJCQyxTQUEzQixFQUFzQyxDQUF0QyxDQUF2QyxDQUFQO0FBQ0QsR0FGRCxNQUVPLElBQUksUUFBTzFVLEVBQVAseUNBQU9BLEVBQVAsTUFBYSxRQUFiLElBQXlCLENBQUNBLEVBQTlCLEVBQWtDO0FBQ3ZDLFdBQU82QixVQUFVQyxJQUFWLENBQWV0SyxLQUFmLENBQXFCMEssRUFBRW5DLEdBQUc0QyxTQUFILEVBQUYsQ0FBckIsRUFBd0MrUixTQUF4QyxDQUFQO0FBQ0QsR0FGTSxNQUVBO0FBQ0x4UyxNQUFFeVMsS0FBRixDQUFRLHVCQUF1QjNVLEVBQXZCLEdBQTRCLGlDQUFwQztBQUNEOztBQUVELFNBQU9rQyxFQUFFLElBQUYsQ0FBUDtBQUNELENBcGhERCxDOzs7Ozs7Ozs7OztBQ05BLElBQUl6QyxXQUFZLFlBQVk7QUFDMUI7Ozs7Ozs7O0FBUUE7QUFDQSxNQUFJbVYsa0JBQWtCLHFCQUF0Qjs7QUFFQTtBQUNBLE1BQUlDLFlBQVk3YSxLQUFLOGEsR0FBckI7QUFBQSxNQUNRQyxZQUFZQyxLQUFLQyxHQUR6Qjs7QUFHQTs7Ozs7Ozs7Ozs7Ozs7QUFjQSxNQUFJQSxNQUFNRixhQUFhLFlBQVk7QUFDakMsV0FBTyxJQUFJQyxJQUFKLEdBQVdFLE9BQVgsRUFBUDtBQUNELEdBRkQ7O0FBSUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStEQSxXQUFTelYsUUFBVCxDQUFrQjBWLElBQWxCLEVBQXdCQyxJQUF4QixFQUE4Qi9PLE9BQTlCLEVBQXVDO0FBQ3JDLFFBQUlnUCxJQUFKO0FBQUEsUUFDUUMsWUFEUjtBQUFBLFFBRVE3ZCxNQUZSO0FBQUEsUUFHUThkLEtBSFI7QUFBQSxRQUlRQyxPQUpSO0FBQUEsUUFLUUMsU0FMUjtBQUFBLFFBTVFDLFlBTlI7QUFBQSxRQU9RQyxhQUFhLENBUHJCO0FBQUEsUUFRUUMsVUFBVSxLQVJsQjtBQUFBLFFBU1FDLFdBQVcsSUFUbkI7O0FBV0EsUUFBSSxPQUFPVixJQUFQLElBQWUsVUFBbkIsRUFBK0I7QUFDN0IsWUFBTSxJQUFJVyxTQUFKLENBQWNsQixlQUFkLENBQU47QUFDRDtBQUNEUSxXQUFPQSxPQUFPLENBQVAsR0FBVyxDQUFYLEdBQWdCLENBQUNBLElBQUQsSUFBUyxDQUFoQztBQUNBLFFBQUkvTyxZQUFZLElBQWhCLEVBQXNCO0FBQ3BCLFVBQUkwUCxVQUFVLElBQWQ7QUFDQUYsaUJBQVcsS0FBWDtBQUNELEtBSEQsTUFHTyxJQUFJRyxTQUFTM1AsT0FBVCxDQUFKLEVBQXVCO0FBQzVCMFAsZ0JBQVUsQ0FBQyxDQUFDMVAsUUFBUTBQLE9BQXBCO0FBQ0FILGdCQUFVLGFBQWF2UCxPQUFiLElBQXdCd08sVUFBVSxDQUFDeE8sUUFBUXVQLE9BQVQsSUFBb0IsQ0FBOUIsRUFBaUNSLElBQWpDLENBQWxDO0FBQ0FTLGlCQUFXLGNBQWN4UCxPQUFkLEdBQXdCLENBQUMsQ0FBQ0EsUUFBUXdQLFFBQWxDLEdBQTZDQSxRQUF4RDtBQUNEOztBQUVELGFBQVNJLE1BQVQsR0FBa0I7QUFDaEIsVUFBSVIsU0FBSixFQUFlO0FBQ2JTLHFCQUFhVCxTQUFiO0FBQ0Q7QUFDRCxVQUFJSCxZQUFKLEVBQWtCO0FBQ2hCWSxxQkFBYVosWUFBYjtBQUNEO0FBQ0RLLG1CQUFhLENBQWI7QUFDQUwscUJBQWVHLFlBQVlDLGVBQWVoZ0IsU0FBMUM7QUFDRDs7QUFFRCxhQUFTeWdCLFFBQVQsQ0FBa0JDLFFBQWxCLEVBQTRCL2QsRUFBNUIsRUFBZ0M7QUFDOUIsVUFBSUEsRUFBSixFQUFRO0FBQ042ZCxxQkFBYTdkLEVBQWI7QUFDRDtBQUNEaWQscUJBQWVHLFlBQVlDLGVBQWVoZ0IsU0FBMUM7QUFDQSxVQUFJMGdCLFFBQUosRUFBYztBQUNaVCxxQkFBYVYsS0FBYjtBQUNBeGQsaUJBQVMwZCxLQUFLM2QsS0FBTCxDQUFXZ2UsT0FBWCxFQUFvQkgsSUFBcEIsQ0FBVDtBQUNBLFlBQUksQ0FBQ0ksU0FBRCxJQUFjLENBQUNILFlBQW5CLEVBQWlDO0FBQy9CRCxpQkFBT0csVUFBVTlmLFNBQWpCO0FBQ0Q7QUFDRjtBQUNGOztBQUVELGFBQVMyZ0IsT0FBVCxHQUFtQjtBQUNqQixVQUFJQyxZQUFZbEIsUUFBUUgsUUFBUU0sS0FBaEIsQ0FBaEI7QUFDQSxVQUFJZSxhQUFhLENBQWIsSUFBa0JBLFlBQVlsQixJQUFsQyxFQUF3QztBQUN0Q2UsaUJBQVNULFlBQVQsRUFBdUJKLFlBQXZCO0FBQ0QsT0FGRCxNQUVPO0FBQ0xHLG9CQUFZOU8sV0FBVzBQLE9BQVgsRUFBb0JDLFNBQXBCLENBQVo7QUFDRDtBQUNGOztBQUVELGFBQVNDLFVBQVQsR0FBc0I7QUFDcEJKLGVBQVNOLFFBQVQsRUFBbUJKLFNBQW5CO0FBQ0Q7O0FBRUQsYUFBU2UsU0FBVCxHQUFxQjtBQUNuQm5CLGFBQU9YLFNBQVA7QUFDQWEsY0FBUU4sS0FBUjtBQUNBTyxnQkFBVSxJQUFWO0FBQ0FFLHFCQUFlRyxhQUFhSixhQUFhLENBQUNNLE9BQTNCLENBQWY7O0FBRUEsVUFBSUgsWUFBWSxLQUFoQixFQUF1QjtBQUNyQixZQUFJYSxjQUFjVixXQUFXLENBQUNOLFNBQTlCO0FBQ0QsT0FGRCxNQUVPO0FBQ0wsWUFBSSxDQUFDSCxZQUFELElBQWlCLENBQUNTLE9BQXRCLEVBQStCO0FBQzdCSix1QkFBYUosS0FBYjtBQUNEO0FBQ0QsWUFBSWUsWUFBWVYsV0FBV0wsUUFBUUksVUFBbkIsQ0FBaEI7QUFBQSxZQUNRUyxXQUFXRSxhQUFhLENBQWIsSUFBa0JBLFlBQVlWLE9BRGpEOztBQUdBLFlBQUlRLFFBQUosRUFBYztBQUNaLGNBQUlkLFlBQUosRUFBa0I7QUFDaEJBLDJCQUFlWSxhQUFhWixZQUFiLENBQWY7QUFDRDtBQUNESyx1QkFBYUosS0FBYjtBQUNBOWQsbUJBQVMwZCxLQUFLM2QsS0FBTCxDQUFXZ2UsT0FBWCxFQUFvQkgsSUFBcEIsQ0FBVDtBQUNELFNBTkQsTUFPSyxJQUFJLENBQUNDLFlBQUwsRUFBbUI7QUFDdEJBLHlCQUFlM08sV0FBVzRQLFVBQVgsRUFBdUJELFNBQXZCLENBQWY7QUFDRDtBQUNGO0FBQ0QsVUFBSUYsWUFBWVgsU0FBaEIsRUFBMkI7QUFDekJBLG9CQUFZUyxhQUFhVCxTQUFiLENBQVo7QUFDRCxPQUZELE1BR0ssSUFBSSxDQUFDQSxTQUFELElBQWNMLFNBQVNRLE9BQTNCLEVBQW9DO0FBQ3ZDSCxvQkFBWTlPLFdBQVcwUCxPQUFYLEVBQW9CakIsSUFBcEIsQ0FBWjtBQUNEO0FBQ0QsVUFBSXFCLFdBQUosRUFBaUI7QUFDZkwsbUJBQVcsSUFBWDtBQUNBM2UsaUJBQVMwZCxLQUFLM2QsS0FBTCxDQUFXZ2UsT0FBWCxFQUFvQkgsSUFBcEIsQ0FBVDtBQUNEO0FBQ0QsVUFBSWUsWUFBWSxDQUFDWCxTQUFiLElBQTBCLENBQUNILFlBQS9CLEVBQTZDO0FBQzNDRCxlQUFPRyxVQUFVOWYsU0FBakI7QUFDRDtBQUNELGFBQU8rQixNQUFQO0FBQ0Q7O0FBRUQrZSxjQUFVUCxNQUFWLEdBQW1CQSxNQUFuQjtBQUNBLFdBQU9PLFNBQVA7QUFDRDs7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvQkEsV0FBU1IsUUFBVCxDQUFrQjFKLEtBQWxCLEVBQXlCO0FBQ3ZCO0FBQ0E7QUFDQSxRQUFJalYsY0FBY2lWLEtBQWQseUNBQWNBLEtBQWQsQ0FBSjtBQUNBLFdBQU8sQ0FBQyxDQUFDQSxLQUFGLEtBQVlqVixRQUFRLFFBQVIsSUFBb0JBLFFBQVEsVUFBeEMsQ0FBUDtBQUNEOztBQUVELFNBQU9vSSxRQUFQO0FBRUQsQ0EzT2MsRUFBZjs7QUE2T0FGLE9BQU9DLE9BQVAsR0FBaUJDLFFBQWpCLEM7Ozs7Ozs7OztBQzdPQSxDQUFDLENBQUMsWUFBVTtBQUFFOztBQUVaLE1BQUlqSyx1QkFBdUJrSyxtQkFBT0EsQ0FBQyxHQUFSLENBQTNCO0FBQ0EsTUFBSUQsV0FBV0MsbUJBQU9BLENBQUMsR0FBUixDQUFmOztBQUVBO0FBQ0EsTUFBSWdYLFdBQVcsU0FBWEEsUUFBVyxDQUFVQyxTQUFWLEVBQXFCelUsQ0FBckIsRUFBd0JNLEtBQXhCLEVBQThCO0FBQzNDLFFBQUlvVSxjQUFjbFgsbUJBQU9BLENBQUMsR0FBUixDQUFsQjs7QUFFQSxRQUFJLENBQUNpWCxTQUFELElBQWMsQ0FBQ3pVLENBQWYsSUFBb0IsQ0FBQ00sS0FBekIsRUFBK0I7QUFBRTtBQUFTLEtBSEMsQ0FHQTs7QUFFM0MsUUFBSXFVLFdBQVc7QUFDYjtBQUNBO0FBQ0FqSyw2QkFBdUIsK0JBQVNrSyxHQUFULEVBQWM7QUFDbkMsZUFBT0EsSUFBSWhnQixJQUFKLENBQVMsb0JBQVQsQ0FBUDtBQUNELE9BTFk7QUFNYjtBQUNBO0FBQ0ErVixnQ0FBMEIsa0NBQVNpSyxHQUFULEVBQWM7QUFDdEMsZUFBT0EsSUFBSWhnQixJQUFKLENBQVMsdUJBQVQsQ0FBUDtBQUNELE9BVlk7QUFXYjtBQUNBaWdCLGdDQUEwQixJQVpiO0FBYWI7QUFDQWxoQixzQkFBZ0IsRUFkSDtBQWViO0FBQ0F5USxnQkFBVSxLQWhCRztBQWlCYjtBQUNBMkUsNkJBQXVCLENBbEJWO0FBbUJiO0FBQ0EvQyxjQUFRLEdBcEJLO0FBcUJiO0FBQ0E4TyxlQUFTLElBdEJJO0FBdUJiO0FBQ0EvRiw4QkFBeUIsQ0F4Qlo7QUF5QmI7QUFDQS9KLDRCQUFzQixnQkExQlQ7QUEyQmI7QUFDQUcsK0JBQXlCLG1CQTVCWjtBQTZCYjtBQUNBQyxrQ0FBNEIsd0JBOUJmO0FBK0JiO0FBQ0FFLCtCQUF5QixtQkFoQ1o7QUFpQ2I7QUFDQUUsa0NBQTRCLHNCQWxDZjtBQW1DYjtBQUNBQyxxQ0FBK0IsMkJBcENsQjtBQXFDYjtBQUNBeUwsc0NBQWdDLDBDQUFZO0FBQ3hDLGVBQU8sSUFBUDtBQUNILE9BeENZO0FBeUNiO0FBQ0E3TCx5Q0FBbUMsS0ExQ3RCO0FBMkNiO0FBQ0FnSixnQ0FBeUIsSUE1Q1o7QUE2Q2I7QUFDQTdCLDZCQUF1QixFQTlDVixDQThDYztBQTlDZCxLQUFmOztBQWlEQSxRQUFJckksT0FBSjtBQUNBLFFBQUk0USxjQUFjLEtBQWxCOztBQUVBO0FBQ0EsYUFBU0MsTUFBVCxDQUFnQkwsUUFBaEIsRUFBMEJ4USxPQUExQixFQUFtQztBQUNqQyxVQUFJOFEsTUFBTSxFQUFWOztBQUVBLFdBQUssSUFBSS9mLENBQVQsSUFBY3lmLFFBQWQsRUFBd0I7QUFDdEJNLFlBQUkvZixDQUFKLElBQVN5ZixTQUFTemYsQ0FBVCxDQUFUO0FBQ0Q7O0FBRUQsV0FBSyxJQUFJQSxDQUFULElBQWNpUCxPQUFkLEVBQXVCO0FBQ3JCO0FBQ0EsWUFBR2pQLEtBQUssd0JBQVIsRUFBaUM7QUFDL0IsY0FBSWtWLFFBQVFqRyxRQUFRalAsQ0FBUixDQUFaO0FBQ0MsY0FBRyxDQUFDZ2dCLE1BQU05SyxLQUFOLENBQUosRUFDQTtBQUNHLGdCQUFHQSxTQUFTLENBQVQsSUFBY0EsU0FBUyxFQUExQixFQUE2QjtBQUMzQjZLLGtCQUFJL2YsQ0FBSixJQUFTaVAsUUFBUWpQLENBQVIsQ0FBVDtBQUNELGFBRkQsTUFFTSxJQUFHa1YsUUFBUSxDQUFYLEVBQWE7QUFDakI2SyxrQkFBSS9mLENBQUosSUFBUyxDQUFUO0FBQ0QsYUFGSyxNQUVEO0FBQ0grZixrQkFBSS9mLENBQUosSUFBUyxFQUFUO0FBQ0Q7QUFDSDtBQUNILFNBWkQsTUFZSztBQUNIK2YsY0FBSS9mLENBQUosSUFBU2lQLFFBQVFqUCxDQUFSLENBQVQ7QUFDRDtBQUVGOztBQUVELGFBQU8rZixHQUFQO0FBQ0Q7O0FBRURSLGNBQVcsTUFBWCxFQUFtQixhQUFuQixFQUFrQyxVQUFTM1UsSUFBVCxFQUFjO0FBQzlDLFVBQUlqQyxLQUFLLElBQVQ7O0FBRUEsVUFBSWlDLFNBQVMsYUFBYixFQUE2QjtBQUMzQixlQUFPaVYsV0FBUDtBQUNEOztBQUVELFVBQUlqVixTQUFTLEtBQWIsRUFBcUI7QUFDbkI7QUFDQXFFLGtCQUFVNlEsT0FBT0wsUUFBUCxFQUFpQjdVLElBQWpCLENBQVY7QUFDQWlWLHNCQUFjLElBQWQ7O0FBRUE7QUFDQWxYLFdBQUdxTSxLQUFILEdBQVdqRixRQUFYLENBQW9CLGdDQUFwQixFQUFzRHRRLEdBQXRELENBQTBEO0FBQ3hELHlCQUFlLFVBRHlDO0FBRXhELCtCQUFxQiwwQkFBVWlnQixHQUFWLEVBQWU7QUFDbEMsbUJBQU90aEIscUJBQXFCK0csa0JBQXJCLENBQXdDdWEsR0FBeEMsRUFBNkMsTUFBN0MsQ0FBUDtBQUNELFdBSnVEO0FBS3hELDZCQUFtQix3QkFBVUEsR0FBVixFQUFlO0FBQ2hDLG1CQUFPdGhCLHFCQUFxQmlILGdCQUFyQixDQUFzQ3FhLEdBQXRDLEVBQTJDLE1BQTNDLENBQVA7QUFDRCxXQVB1RDtBQVF4RCw0QkFBa0I7QUFSc0MsU0FBMUQ7O0FBV0E7QUFDQS9XLFdBQUdxTSxLQUFILEdBQVdqRixRQUFYLENBQW9CLHNDQUFwQixFQUE0RHRRLEdBQTVELENBQWdFO0FBQzlELHlCQUFlLGtCQUQrQztBQUU5RCxxQ0FBMkIsK0JBQVVpZ0IsR0FBVixFQUFlO0FBQ3hDLG1CQUFPdGhCLHFCQUFxQitHLGtCQUFyQixDQUF3Q3VhLEdBQXhDLEVBQTZDLFNBQTdDLENBQVA7QUFDRCxXQUo2RDtBQUs5RCxtQ0FBeUIsNkJBQVVBLEdBQVYsRUFBZTtBQUN0QyxtQkFBT3RoQixxQkFBcUJpSCxnQkFBckIsQ0FBc0NxYSxHQUF0QyxFQUEyQyxTQUEzQyxDQUFQO0FBQ0QsV0FQNkQ7QUFROUQsNEJBQWtCO0FBUjRDLFNBQWhFOztBQVdBdGhCLDZCQUFxQk0saUJBQXJCLENBQXVDdVEsUUFBUXhRLGNBQS9DOztBQUVBO0FBQ0EsWUFBSXdRLFFBQVEwUSx3QkFBWixFQUFzQztBQUNwQztBQUNBdmhCLCtCQUFxQndCLGdCQUFyQixDQUFzQ3FQLFFBQVF1RyxxQkFBOUMsRUFBcUV2RyxRQUFRd0csd0JBQTdFLEVBQXVHOU0sR0FBRzVJLEtBQUgsRUFBdkcsRUFBbUhrUCxRQUFReFEsY0FBM0g7QUFDRDs7QUFFRCxZQUFHd1EsUUFBUTJRLE9BQVgsRUFDRUosWUFBWXZRLE9BQVosRUFBcUJ0RyxFQUFyQixFQURGLEtBR0U2VyxZQUFZLFFBQVosRUFBc0I3VyxFQUF0QjtBQUNIOztBQUVELFVBQUlzWCxXQUFXSixjQUFjO0FBQzNCOzs7OztBQUtBdGQsMkJBQW1CLDJCQUFTbWQsR0FBVCxFQUFjO0FBQy9CLGlCQUFPdGhCLHFCQUFxQm1FLGlCQUFyQixDQUF1Q21kLEdBQXZDLENBQVA7QUFDRCxTQVIwQjtBQVMzQjtBQUNBOWYsMEJBQWtCLDBCQUFTc2dCLElBQVQsRUFBZTtBQUMvQjloQiwrQkFBcUJ3QixnQkFBckIsQ0FBc0NxUCxRQUFRdUcscUJBQTlDLEVBQXFFdkcsUUFBUXdHLHdCQUE3RSxFQUF1R3lLLElBQXZHO0FBQ0QsU0FaMEI7QUFhM0JDLDhCQUFzQiw4QkFBU1QsR0FBVCxFQUFjalMsS0FBZCxFQUFxQjtBQUN6Q3JQLCtCQUFxQjJJLFlBQXJCLENBQWtDMlksR0FBbEMsRUFBdUNqUyxLQUF2QztBQUNEO0FBZjBCLE9BQWQsR0FnQlhuUCxTQWhCSjs7QUFrQkEsYUFBTzJoQixRQUFQLENBcEU4QyxDQW9FN0I7QUFDbEIsS0FyRUQ7QUF1RUQsR0EvSkQ7O0FBaUtBLE1BQUksU0FBaUM5WCxPQUFPQyxPQUE1QyxFQUFxRDtBQUFFO0FBQ3JERCxXQUFPQyxPQUFQLEdBQWlCa1gsUUFBakI7QUFDRDs7QUFFRCxNQUFJLElBQUosRUFBaUQ7QUFBRTtBQUNqRGMsdUNBQWlDLFlBQVU7QUFDekMsYUFBT2QsUUFBUDtBQUNELEtBRkQ7QUFBQTtBQUdEOztBQUVELE1BQUksT0FBT0MsU0FBUCxLQUFxQixXQUFyQixJQUFvQ3pVLENBQXBDLElBQXlDTSxLQUE3QyxFQUFtRDtBQUFFO0FBQ25Ea1UsYUFBVUMsU0FBVixFQUFxQnpVLENBQXJCLEVBQXdCTSxLQUF4QjtBQUNEO0FBRUYsQ0FyTEEsSTs7Ozs7Ozs7O0FDQUQsSUFBSTdDLHdCQUF3Qjs7QUFFeEI7QUFDQXdRLG9CQUFnQix3QkFBVWphLElBQVYsRUFBZ0I2SixFQUFoQixFQUFvQi9ILFFBQXBCLEVBQThCa1ksZUFBOUIsRUFBK0M7O0FBRTNELFlBQUlSLFlBQVk7QUFDWjVZLGtCQUFNO0FBQ0p1QixvQkFBSSx5QkFEQTtBQUVKb2YsdUJBQU87QUFGSCxhQURNO0FBS1pyTCxtQkFBTztBQUNMeEosdUJBQU8sQ0FERjtBQUVMQyx3QkFBUSxDQUZIO0FBR0wsOEJBQWM7QUFIVCxhQUxLO0FBVVp1Tiw4QkFBa0JwWTtBQVZOLFNBQWhCO0FBWUErSCxXQUFHa0QsR0FBSCxDQUFPeU0sU0FBUDs7QUFFQSxZQUFJbUMsTUFBTzNCLG9CQUFvQixRQUFyQixHQUNOLEVBQUNuWSxRQUFRMlgsVUFBVTVZLElBQVYsQ0FBZXVCLEVBQXhCLEVBRE0sR0FFTixFQUFDRixRQUFRdVgsVUFBVTVZLElBQVYsQ0FBZXVCLEVBQXhCLEVBRko7O0FBSUFuQyxlQUFPQSxLQUFLd2hCLElBQUwsQ0FBVTdGLEdBQVYsRUFBZSxDQUFmLENBQVA7O0FBRUEsZUFBTztBQUNIbkMsdUJBQVczUCxHQUFHdVEsS0FBSCxDQUFTLE1BQU1aLFVBQVU1WSxJQUFWLENBQWV1QixFQUE5QixFQUFrQyxDQUFsQyxDQURSO0FBRUhuQyxrQkFBTUE7QUFGSCxTQUFQO0FBSUgsS0E3QnVCOztBQStCeEJxYixpQkFBYSxxQkFBVXJiLElBQVYsRUFBZ0JtYSxJQUFoQixFQUFzQmUsUUFBdEIsRUFBZ0M7QUFDekMsWUFBRyxDQUFDbGIsS0FBS3djLE1BQUwsRUFBRCxJQUFrQixDQUFDckMsS0FBS0ksTUFBTCxFQUF0QixFQUNJOztBQUVKLFlBQUlvQixNQUFNLEVBQVY7QUFDQSxZQUFHVCxhQUFhLFFBQWhCLEVBQ0lTLElBQUk5WixNQUFKLEdBQWFzWSxLQUFLaFksRUFBTCxFQUFiLENBREosS0FHSyxJQUFHK1ksYUFBYSxRQUFoQixFQUNEUyxJQUFJMVosTUFBSixHQUFha1ksS0FBS2hZLEVBQUwsRUFBYixDQURDLEtBSUQ7O0FBRUosZUFBT25DLEtBQUt3aEIsSUFBTCxDQUFVN0YsR0FBVixFQUFlLENBQWYsQ0FBUDtBQUNILEtBOUN1Qjs7QUFnRHhCSixjQUFVLGtCQUFVRSxPQUFWLEVBQW1CRCxPQUFuQixFQUE0QjtBQUNsQyxhQUFLaUcsV0FBTCxDQUFpQmhHLE9BQWpCLEVBQTBCRCxPQUExQjtBQUNBLGFBQUtrRyxTQUFMLENBQWVqRyxPQUFmLEVBQXdCRCxPQUF4QjtBQUNILEtBbkR1Qjs7QUFxRHhCa0csZUFBVyxtQkFBVWpHLE9BQVYsRUFBbUJELE9BQW5CLEVBQTRCO0FBQ25DLFlBQUdDLFdBQVdELE9BQWQsRUFBc0I7QUFDbEJBLG9CQUFRNWEsSUFBUixDQUFhLFlBQWIsRUFBMkI2YSxRQUFRN2EsSUFBUixDQUFhLFlBQWIsQ0FBM0I7QUFDQTRhLG9CQUFRNWEsSUFBUixDQUFhLE9BQWIsRUFBc0I2YSxRQUFRN2EsSUFBUixDQUFhLE9BQWIsQ0FBdEI7QUFDQTRhLG9CQUFRNWEsSUFBUixDQUFhLGFBQWIsRUFBNEI2YSxRQUFRN2EsSUFBUixDQUFhLGFBQWIsQ0FBNUI7QUFDSDtBQUNKLEtBM0R1Qjs7QUE2RHhCNmdCLGlCQUFhLHFCQUFVaEcsT0FBVixFQUFtQkQsT0FBbkIsRUFBNEI7QUFDckMsWUFBR0MsUUFBUS9hLFFBQVIsQ0FBaUIsK0JBQWpCLENBQUgsRUFBcUQ7QUFDakQsZ0JBQUlpaEIsY0FBY2xHLFFBQVE3YSxJQUFSLENBQWEsNEJBQWIsQ0FBbEI7QUFDQSxnQkFBSWdoQixZQUFZbkcsUUFBUTdhLElBQVIsQ0FBYSwwQkFBYixDQUFoQjs7QUFFQTRhLG9CQUFRNWEsSUFBUixDQUFhLDRCQUFiLEVBQTJDK2dCLFdBQTNDO0FBQ0FuRyxvQkFBUTVhLElBQVIsQ0FBYSwwQkFBYixFQUF5Q2doQixTQUF6QztBQUNBcEcsb0JBQVE3WixRQUFSLENBQWlCLCtCQUFqQjtBQUNILFNBUEQsTUFRSyxJQUFHOFosUUFBUS9hLFFBQVIsQ0FBaUIscUNBQWpCLENBQUgsRUFBMkQ7QUFDNUQsZ0JBQUlpaEIsY0FBY2xHLFFBQVE3YSxJQUFSLENBQWEsK0JBQWIsQ0FBbEI7QUFDQSxnQkFBSWdoQixZQUFZbkcsUUFBUTdhLElBQVIsQ0FBYSw2QkFBYixDQUFoQjs7QUFFQTRhLG9CQUFRNWEsSUFBUixDQUFhLCtCQUFiLEVBQThDK2dCLFdBQTlDO0FBQ0FuRyxvQkFBUTVhLElBQVIsQ0FBYSw2QkFBYixFQUE0Q2doQixTQUE1QztBQUNBcEcsb0JBQVE3WixRQUFSLENBQWlCLHFDQUFqQjtBQUNIO0FBQ0QsWUFBSThaLFFBQVEvYSxRQUFSLENBQWlCLHVDQUFqQixDQUFKLEVBQStEO0FBQzNEOGEsb0JBQVE3WixRQUFSLENBQWlCLHVDQUFqQjtBQUNILFNBRkQsTUFHSyxJQUFJOFosUUFBUS9hLFFBQVIsQ0FBaUIsNkNBQWpCLENBQUosRUFBcUU7QUFDdEU4YSxvQkFBUTdaLFFBQVIsQ0FBaUIsNkNBQWpCO0FBQ0g7QUFDSjtBQXBGdUIsQ0FBNUI7O0FBdUZBMEgsT0FBT0MsT0FBUCxHQUFpQkcscUJBQWpCLEM7Ozs7Ozs7OztBQ3ZGQUosT0FBT0MsT0FBUCxHQUFpQixVQUFVTyxFQUFWLEVBQWN2SyxvQkFBZCxFQUFvQ3NLLE1BQXBDLEVBQTRDO0FBQzNELE1BQUlDLEdBQUd3RyxRQUFILElBQWUsSUFBbkIsRUFDRTs7QUFFRixNQUFJd1IsS0FBS2hZLEdBQUd3RyxRQUFILENBQVk7QUFDbkJ5UixvQkFBZ0IsS0FERztBQUVuQkMsYUFBUztBQUZVLEdBQVosQ0FBVDs7QUFLQSxXQUFTQyxrQkFBVCxDQUE0QjlSLEtBQTVCLEVBQW1DO0FBQ2pDLFFBQUlsUSxPQUFPNkosR0FBR29ZLGNBQUgsQ0FBa0IvUixNQUFNbFEsSUFBTixDQUFXbUMsRUFBWCxFQUFsQixDQUFYO0FBQ0EsUUFBSWhCLE9BQU8rTyxNQUFNL08sSUFBTixLQUFlLGNBQWYsR0FBZ0MrTyxNQUFNL08sSUFBdEMsR0FBNkM3QixxQkFBcUJtQixXQUFyQixDQUFpQ1QsSUFBakMsQ0FBeEQ7O0FBRUEsUUFBSTBCLE9BQUosRUFBYUQsU0FBYixFQUF3QmlGLFNBQXhCLEVBQW1DQyxXQUFuQzs7QUFFQSxRQUFHdUosTUFBTS9PLElBQU4sS0FBZSxjQUFmLElBQWlDLENBQUMrTyxNQUFNZ1MsR0FBM0MsRUFBK0M7QUFDN0N4Z0IsZ0JBQVUsRUFBVjtBQUNBRCxrQkFBWSxFQUFaO0FBQ0QsS0FIRCxNQUlLO0FBQ0hpRixrQkFBWXBILHFCQUFxQlEsTUFBckIsQ0FBNEJxQixJQUE1QixFQUFrQyxRQUFsQyxDQUFaO0FBQ0F3RixvQkFBY3JILHFCQUFxQlEsTUFBckIsQ0FBNEJxQixJQUE1QixFQUFrQyxVQUFsQyxDQUFkOztBQUVBTyxnQkFBVXdPLE1BQU1nUyxHQUFOLEdBQVlsaUIsS0FBS1ksSUFBTCxDQUFVOEYsU0FBVixDQUFaLEdBQW1Dd0osTUFBTXhPLE9BQW5EO0FBQ0FELGtCQUFZeU8sTUFBTWdTLEdBQU4sR0FBWWxpQixLQUFLWSxJQUFMLENBQVUrRixXQUFWLENBQVosR0FBcUN1SixNQUFNek8sU0FBdkQ7QUFDRDs7QUFFRCxRQUFJRixTQUFTO0FBQ1h2QixZQUFNQSxJQURLO0FBRVhtQixZQUFNQSxJQUZLO0FBR1hPLGVBQVNBLE9BSEU7QUFJWEQsaUJBQVdBLFNBSkE7QUFLWDtBQUNBeWdCLFdBQUs7QUFOTSxLQUFiOztBQVNBO0FBQ0EsUUFBSWhTLE1BQU1nUyxHQUFWLEVBQWU7QUFDYixVQUFJQyxpQkFBaUJqUyxNQUFNeE8sT0FBTixJQUFpQndPLE1BQU14TyxPQUFOLENBQWNiLE1BQWQsR0FBdUIsQ0FBN0Q7QUFDQSxVQUFJdWhCLDBCQUEwQkQsa0JBQWtCalMsTUFBTXhPLE9BQU4sQ0FBY2IsTUFBZCxHQUF1QixDQUF2RTs7QUFFQXNoQix1QkFBaUJuaUIsS0FBS1ksSUFBTCxDQUFVOEYsU0FBVixFQUFxQndKLE1BQU14TyxPQUEzQixDQUFqQixHQUF1RDFCLEtBQUtxaUIsVUFBTCxDQUFnQjNiLFNBQWhCLENBQXZEO0FBQ0F5Yix1QkFBaUJuaUIsS0FBS1ksSUFBTCxDQUFVK0YsV0FBVixFQUF1QnVKLE1BQU16TyxTQUE3QixDQUFqQixHQUEyRHpCLEtBQUtxaUIsVUFBTCxDQUFnQjFiLFdBQWhCLENBQTNEOztBQUVBLFVBQUkyYixrQkFBa0JoakIscUJBQXFCUSxNQUFyQixDQUE0QnFCLElBQTVCLEVBQWtDLE9BQWxDLENBQXRCO0FBQ0EsVUFBSW9oQixpQkFBaUJqakIscUJBQXFCUSxNQUFyQixDQUE0QnFCLElBQTVCLEVBQWtDLFlBQWxDLENBQXJCOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQUksQ0FBQ2doQixjQUFELElBQW1CLENBQUNDLHVCQUF4QixFQUFpRDtBQUMvQztBQUNBcGlCLGFBQUtxSSxXQUFMLENBQWlCaWEsa0JBQWtCLEdBQWxCLEdBQXdCQyxjQUF6QztBQUNELE9BSEQsTUFJSyxJQUFJSixrQkFBa0IsQ0FBQ0MsdUJBQXZCLEVBQWdEO0FBQUU7QUFDckRwaUIsYUFBSzJCLFFBQUwsQ0FBYzJnQixlQUFkO0FBQ0F0aUIsYUFBS3FJLFdBQUwsQ0FBaUJrYSxjQUFqQjtBQUNELE9BSEksTUFJQTtBQUNIO0FBQ0F2aUIsYUFBSzJCLFFBQUwsQ0FBYzJnQixrQkFBa0IsR0FBbEIsR0FBd0JDLGNBQXRDO0FBQ0Q7QUFDRCxVQUFJLENBQUN2aUIsS0FBSytZLFFBQUwsRUFBTCxFQUNFL1ksS0FBS29PLE1BQUwsR0FERixLQUVLO0FBQ0hwTyxhQUFLNE4sUUFBTDtBQUNBNU4sYUFBS29PLE1BQUw7QUFDRDtBQUNGOztBQUVEcE8sU0FBSzRXLE9BQUwsQ0FBYSxrQ0FBYjs7QUFFQSxXQUFPclYsTUFBUDtBQUNEOztBQUVELFdBQVNpaEIsTUFBVCxDQUFnQkMsR0FBaEIsRUFBcUI7QUFDakIsUUFBSUEsSUFBSXRHLFNBQVIsRUFBbUI7QUFDZixhQUFPc0csSUFBSXRHLFNBQVg7QUFDQSxhQUFPc0csR0FBUDtBQUNIOztBQUVELFFBQUl4aEIsUUFBUXdoQixJQUFJeGhCLEtBQWhCO0FBQ0EsUUFBSXNWLGVBQWVrTSxJQUFJbE0sWUFBdkI7QUFDQSxRQUFJaFYsU0FBUztBQUNUTixhQUFPQSxLQURFO0FBRVRzVixvQkFBYztBQUNWL1QsV0FBRyxDQUFDK1QsYUFBYS9ULENBRFA7QUFFVkQsV0FBRyxDQUFDZ1UsYUFBYWhVO0FBRlA7QUFGTCxLQUFiO0FBT0FtZ0Isd0JBQW9Cbk0sWUFBcEIsRUFBa0N0VixLQUFsQzs7QUFFQSxXQUFPTSxNQUFQO0FBQ0g7O0FBRUQsV0FBU21oQixtQkFBVCxDQUE2Qm5NLFlBQTdCLEVBQTJDdFYsS0FBM0MsRUFBa0Q7QUFDOUNBLFVBQU15TixPQUFOLENBQWMsVUFBVTFPLElBQVYsRUFBZ0I7QUFDMUIsVUFBSW1CLE9BQU83QixxQkFBcUJtQixXQUFyQixDQUFpQ1QsSUFBakMsQ0FBWDtBQUNBLFVBQUl3VywwQkFBMEJsWCxxQkFBcUJtRSxpQkFBckIsQ0FBdUN6RCxJQUF2QyxDQUE5QjtBQUNBLFVBQUkyaUIsc0JBQXNCLEVBQTFCO0FBQ0EsVUFBSW5NLDJCQUEyQmhYLFNBQS9CLEVBQ0E7QUFDSSxhQUFLLElBQUkwQixJQUFFLENBQVgsRUFBY0EsSUFBRXNWLHdCQUF3QjNWLE1BQXhDLEVBQWdESyxLQUFHLENBQW5ELEVBQ0E7QUFDSXloQiw4QkFBb0J0ZCxJQUFwQixDQUF5QixFQUFDN0MsR0FBR2dVLHdCQUF3QnRWLENBQXhCLElBQTJCcVYsYUFBYS9ULENBQTVDLEVBQStDRCxHQUFHaVUsd0JBQXdCdFYsSUFBRSxDQUExQixJQUE2QnFWLGFBQWFoVSxDQUE1RixFQUF6QjtBQUNIO0FBQ0R2QyxhQUFLWSxJQUFMLENBQVV0QixxQkFBcUJRLE1BQXJCLENBQTRCcUIsSUFBNUIsRUFBa0MsVUFBbEMsQ0FBVixFQUF5RHdoQixtQkFBekQ7QUFDSDtBQUNKLEtBWkQ7O0FBY0FyakIseUJBQXFCd0IsZ0JBQXJCLENBQXNDOEksT0FBTzhNLHFCQUE3QyxFQUFvRTlNLE9BQU8rTSx3QkFBM0UsRUFBcUcxVixLQUFyRztBQUNIOztBQUVELFdBQVMyaEIsYUFBVCxDQUF1QjFTLEtBQXZCLEVBQTZCO0FBQzNCLFFBQUlsUSxPQUFZa1EsTUFBTWxRLElBQXRCO0FBQ0EsUUFBSWtiLFdBQVloTCxNQUFNZ0wsUUFBdEI7QUFDQSxRQUFJVSxTQUFZMUwsTUFBTTBMLE1BQXRCOztBQUVBNWIsV0FBT0EsS0FBS3doQixJQUFMLENBQVV0RyxRQUFWLEVBQW9CLENBQXBCLENBQVA7O0FBRUEsUUFBSTNaLFNBQVM7QUFDWHZCLFlBQVVBLElBREM7QUFFWGtiLGdCQUFVVSxNQUZDO0FBR1hBLGNBQVVWO0FBSEMsS0FBYjtBQUtBbGIsU0FBSzROLFFBQUw7QUFDQSxXQUFPck0sTUFBUDtBQUNEOztBQUVELFdBQVNzaEIscUJBQVQsQ0FBK0IzUyxLQUEvQixFQUFxQztBQUNuQyxRQUFJdUwsVUFBVXZMLE1BQU11TCxPQUFwQjtBQUNBLFFBQUlxSCxNQUFNalosR0FBR29ZLGNBQUgsQ0FBa0J4RyxRQUFRN2EsSUFBUixDQUFhLElBQWIsQ0FBbEIsQ0FBVjtBQUNBLFFBQUdraUIsT0FBT0EsSUFBSWppQixNQUFKLEdBQWEsQ0FBdkIsRUFDRTRhLFVBQVVxSCxHQUFWOztBQUVGLFFBQUl0SCxVQUFVdEwsTUFBTXNMLE9BQXBCO0FBQ0EsUUFBSXNILE1BQU1qWixHQUFHb1ksY0FBSCxDQUFrQnpHLFFBQVE1YSxJQUFSLENBQWEsSUFBYixDQUFsQixDQUFWO0FBQ0EsUUFBR2tpQixPQUFPQSxJQUFJamlCLE1BQUosR0FBYSxDQUF2QixFQUNFMmEsVUFBVXNILEdBQVY7O0FBRUYsUUFBR3JILFFBQVFqRyxNQUFSLEVBQUgsRUFBb0I7QUFDbEJpRyxnQkFBVUEsUUFBUUMsTUFBUixHQUFpQixDQUFqQixDQUFWO0FBQ0Q7O0FBRUQsUUFBR0YsUUFBUXVILE9BQVIsRUFBSCxFQUFxQjtBQUNuQnZILGdCQUFVQSxRQUFRd0gsT0FBUixFQUFWO0FBQ0F4SCxjQUFRNU4sUUFBUjtBQUNEOztBQUVELFdBQU87QUFDTDZOLGVBQVNELE9BREo7QUFFTEEsZUFBU0M7QUFGSixLQUFQO0FBSUQ7O0FBRURvRyxLQUFHb0IsTUFBSCxDQUFVLG9CQUFWLEVBQWdDakIsa0JBQWhDLEVBQW9EQSxrQkFBcEQ7QUFDQUgsS0FBR29CLE1BQUgsQ0FBVSxrQkFBVixFQUE4QlQsTUFBOUIsRUFBc0NBLE1BQXRDO0FBQ0FYLEtBQUdvQixNQUFILENBQVUsZUFBVixFQUEyQkwsYUFBM0IsRUFBMENBLGFBQTFDO0FBQ0FmLEtBQUdvQixNQUFILENBQVUsdUJBQVYsRUFBbUNKLHFCQUFuQyxFQUEwREEscUJBQTFEO0FBQ0QsQ0EvSkQsQzs7Ozs7O1VDQUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7OztVQ3RCQTtVQUNBO1VBQ0E7VUFDQSIsImZpbGUiOiJjeXRvc2NhcGUtZWRnZS1lZGl0aW5nLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiY3l0b3NjYXBlRWRnZUVkaXRpbmdcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiY3l0b3NjYXBlRWRnZUVkaXRpbmdcIl0gPSBmYWN0b3J5KCk7XG59KShzZWxmLCBmdW5jdGlvbigpIHtcbnJldHVybiAiLCJ2YXIgYW5jaG9yUG9pbnRVdGlsaXRpZXMgPSB7XHJcbiAgY3VycmVudEN0eEVkZ2U6IHVuZGVmaW5lZCxcclxuICBjdXJyZW50Q3R4UG9zOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudEFuY2hvckluZGV4OiB1bmRlZmluZWQsXHJcbiAgaWdub3JlZENsYXNzZXM6IHVuZGVmaW5lZCxcclxuICBzZXRJZ25vcmVkQ2xhc3NlczogZnVuY3Rpb24oX2lnbm9yZWRDbGFzc2VzKSB7XHJcbiAgICB0aGlzLmlnbm9yZWRDbGFzc2VzID0gX2lnbm9yZWRDbGFzc2VzO1xyXG4gIH0sXHJcbiAgc3ludGF4OiB7XHJcbiAgICBiZW5kOiB7XHJcbiAgICAgIGVkZ2U6IFwic2VnbWVudHNcIixcclxuICAgICAgY2xhc3M6IFwiZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHNcIixcclxuICAgICAgbXVsdGlDbGFzczogXCJlZGdlYmVuZGVkaXRpbmctaGFzbXVsdGlwbGViZW5kcG9pbnRzXCIsXHJcbiAgICAgIHdlaWdodDogXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixcclxuICAgICAgZGlzdGFuY2U6IFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixcclxuICAgICAgd2VpZ2h0Q3NzOiBcInNlZ21lbnQtd2VpZ2h0c1wiLFxyXG4gICAgICBkaXN0YW5jZUNzczogXCJzZWdtZW50LWRpc3RhbmNlc1wiLFxyXG4gICAgICBwb2ludFBvczogXCJiZW5kUG9pbnRQb3NpdGlvbnNcIixcclxuICAgIH0sXHJcbiAgICBjb250cm9sOiB7XHJcbiAgICAgIGVkZ2U6IFwidW5idW5kbGVkLWJlemllclwiLFxyXG4gICAgICBjbGFzczogXCJlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50c1wiLFxyXG4gICAgICBtdWx0aUNsYXNzOiBcImVkZ2Vjb250cm9sZWRpdGluZy1oYXNtdWx0aXBsZWNvbnRyb2xwb2ludHNcIixcclxuICAgICAgd2VpZ2h0OiBcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLFxyXG4gICAgICBkaXN0YW5jZTogXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiLFxyXG4gICAgICB3ZWlnaHRDc3M6IFwiY29udHJvbC1wb2ludC13ZWlnaHRzXCIsXHJcbiAgICAgIGRpc3RhbmNlQ3NzOiBcImNvbnRyb2wtcG9pbnQtZGlzdGFuY2VzXCIsXHJcbiAgICAgIHBvaW50UG9zOiBcImNvbnRyb2xQb2ludFBvc2l0aW9uc1wiLFxyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gZ2V0cyBlZGdlIHR5cGUgYXMgJ2JlbmQnIG9yICdjb250cm9sJ1xyXG4gIC8vIHRoZSBpbnRlcmNoYW5naW5nIGlmLXMgYXJlIG5lY2Vzc2FyeSB0byBzZXQgdGhlIHByaW9yaXR5IG9mIHRoZSB0YWdzXHJcbiAgLy8gZXhhbXBsZTogYW4gZWRnZSB3aXRoIHR5cGUgc2VnbWVudCBhbmQgYSBjbGFzcyAnaGFzY29udHJvbHBvaW50cycgd2lsbCBiZSBjbGFzc2lmaWVkIGFzIHVuYnVuZGxlZCBiZXppZXJcclxuICBnZXRFZGdlVHlwZTogZnVuY3Rpb24oZWRnZSl7XHJcbiAgICBpZighZWRnZSlcclxuICAgICAgcmV0dXJuICdpbmNvbmNsdXNpdmUnO1xyXG4gICAgZWxzZSBpZihlZGdlLmhhc0NsYXNzKHRoaXMuc3ludGF4WydiZW5kJ11bJ2NsYXNzJ10pKVxyXG4gICAgICByZXR1cm4gJ2JlbmQnO1xyXG4gICAgZWxzZSBpZihlZGdlLmhhc0NsYXNzKHRoaXMuc3ludGF4Wydjb250cm9sJ11bJ2NsYXNzJ10pKVxyXG4gICAgICByZXR1cm4gJ2NvbnRyb2wnO1xyXG4gICAgZWxzZSBpZihlZGdlLmNzcygnY3VydmUtc3R5bGUnKSA9PT0gdGhpcy5zeW50YXhbJ2JlbmQnXVsnZWRnZSddKVxyXG4gICAgICByZXR1cm4gJ2JlbmQnO1xyXG4gICAgZWxzZSBpZihlZGdlLmNzcygnY3VydmUtc3R5bGUnKSA9PT0gdGhpcy5zeW50YXhbJ2NvbnRyb2wnXVsnZWRnZSddKVxyXG4gICAgICByZXR1cm4gJ2NvbnRyb2wnO1xyXG4gICAgZWxzZSBpZihlZGdlLmRhdGEodGhpcy5zeW50YXhbJ2JlbmQnXVsncG9pbnRQb3MnXSkgJiYgXHJcbiAgICAgICAgICAgIGVkZ2UuZGF0YSh0aGlzLnN5bnRheFsnYmVuZCddWydwb2ludFBvcyddKS5sZW5ndGggPiAwKVxyXG4gICAgICByZXR1cm4gJ2JlbmQnO1xyXG4gICAgZWxzZSBpZihlZGdlLmRhdGEodGhpcy5zeW50YXhbJ2NvbnRyb2wnXVsncG9pbnRQb3MnXSkgJiYgXHJcbiAgICAgICAgICAgIGVkZ2UuZGF0YSh0aGlzLnN5bnRheFsnY29udHJvbCddWydwb2ludFBvcyddKS5sZW5ndGggPiAwKVxyXG4gICAgICByZXR1cm4gJ2NvbnRyb2wnO1xyXG4gICAgcmV0dXJuICdpbmNvbmNsdXNpdmUnO1xyXG4gIH0sXHJcbiAgLy8gaW5pdGlsaXplIGFuY2hvciBwb2ludHMgYmFzZWQgb24gYmVuZFBvc2l0aW9uc0ZjbiBhbmQgY29udHJvbFBvc2l0aW9uRmNuXHJcbiAgaW5pdEFuY2hvclBvaW50czogZnVuY3Rpb24oYmVuZFBvc2l0aW9uc0ZjbiwgY29udHJvbFBvc2l0aW9uc0ZjbiwgZWRnZXMpIHtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWRnZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgdmFyIGVkZ2UgPSBlZGdlc1tpXTtcclxuICAgICAgdmFyIHR5cGUgPSB0aGlzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG4gICAgICBcclxuICAgICAgaWYgKHR5cGUgPT09ICdpbmNvbmNsdXNpdmUnKSB7IFxyXG4gICAgICAgIGNvbnRpbnVlOyBcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYoIXRoaXMuaXNJZ25vcmVkRWRnZShlZGdlKSkge1xyXG5cclxuICAgICAgICB2YXIgYW5jaG9yUG9zaXRpb25zO1xyXG5cclxuICAgICAgICAvLyBnZXQgdGhlIGFuY2hvciBwb3NpdGlvbnMgYnkgYXBwbHlpbmcgdGhlIGZ1bmN0aW9ucyBmb3IgdGhpcyBlZGdlXHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ2JlbmQnKVxyXG4gICAgICAgICAgYW5jaG9yUG9zaXRpb25zID0gYmVuZFBvc2l0aW9uc0Zjbi5hcHBseSh0aGlzLCBlZGdlKTtcclxuICAgICAgICBlbHNlIGlmKHR5cGUgPT09ICdjb250cm9sJylcclxuICAgICAgICAgIGFuY2hvclBvc2l0aW9ucyA9IGNvbnRyb2xQb3NpdGlvbnNGY24uYXBwbHkodGhpcywgZWRnZSk7XHJcblxyXG4gICAgICAgIC8vIGNhbGN1bGF0ZSByZWxhdGl2ZSBhbmNob3IgcG9zaXRpb25zXHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbnMoZWRnZSwgYW5jaG9yUG9zaXRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gaWYgdGhlcmUgYXJlIGFuY2hvcnMgc2V0IHdlaWdodHMgYW5kIGRpc3RhbmNlcyBhY2NvcmRpbmdseSBhbmQgYWRkIGNsYXNzIHRvIGVuYWJsZSBzdHlsZSBjaGFuZ2VzXHJcbiAgICAgICAgaWYgKHJlc3VsdC5kaXN0YW5jZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgZWRnZS5kYXRhKHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSwgcmVzdWx0LndlaWdodHMpO1xyXG4gICAgICAgICAgZWRnZS5kYXRhKHRoaXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddLCByZXN1bHQuZGlzdGFuY2VzKTtcclxuICAgICAgICAgIGVkZ2UuYWRkQ2xhc3ModGhpcy5zeW50YXhbdHlwZV1bJ2NsYXNzJ10pO1xyXG4gICAgICAgICAgaWYgKHJlc3VsdC5kaXN0YW5jZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICBlZGdlLmFkZENsYXNzKHRoaXMuc3ludGF4W3R5cGVdWydtdWx0aUNsYXNzJ10pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIGlzSWdub3JlZEVkZ2U6IGZ1bmN0aW9uKGVkZ2UpIHtcclxuXHJcbiAgICB2YXIgc3RhcnRYID0gZWRnZS5zb3VyY2UoKS5wb3NpdGlvbigneCcpO1xyXG4gICAgdmFyIHN0YXJ0WSA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oJ3knKTtcclxuICAgIHZhciBlbmRYID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigneCcpO1xyXG4gICAgdmFyIGVuZFkgPSBlZGdlLnRhcmdldCgpLnBvc2l0aW9uKCd5Jyk7XHJcbiAgIFxyXG4gICAgaWYoKHN0YXJ0WCA9PSBlbmRYICYmIHN0YXJ0WSA9PSBlbmRZKSAgfHwgKGVkZ2Uuc291cmNlKCkuaWQoKSA9PSBlZGdlLnRhcmdldCgpLmlkKCkpKXtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBmb3IodmFyIGkgPSAwOyB0aGlzLmlnbm9yZWRDbGFzc2VzICYmIGkgPCAgdGhpcy5pZ25vcmVkQ2xhc3Nlcy5sZW5ndGg7IGkrKyl7XHJcbiAgICAgIGlmKGVkZ2UuaGFzQ2xhc3ModGhpcy5pZ25vcmVkQ2xhc3Nlc1tpXSkpXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuICAvL0dldCB0aGUgZGlyZWN0aW9uIG9mIHRoZSBsaW5lIGZyb20gc291cmNlIHBvaW50IHRvIHRoZSB0YXJnZXQgcG9pbnRcclxuICBnZXRMaW5lRGlyZWN0aW9uOiBmdW5jdGlvbihzcmNQb2ludCwgdGd0UG9pbnQpe1xyXG4gICAgaWYoc3JjUG9pbnQueSA9PSB0Z3RQb2ludC55ICYmIHNyY1BvaW50LnggPCB0Z3RQb2ludC54KXtcclxuICAgICAgcmV0dXJuIDE7XHJcbiAgICB9XHJcbiAgICBpZihzcmNQb2ludC55IDwgdGd0UG9pbnQueSAmJiBzcmNQb2ludC54IDwgdGd0UG9pbnQueCl7XHJcbiAgICAgIHJldHVybiAyO1xyXG4gICAgfVxyXG4gICAgaWYoc3JjUG9pbnQueSA8IHRndFBvaW50LnkgJiYgc3JjUG9pbnQueCA9PSB0Z3RQb2ludC54KXtcclxuICAgICAgcmV0dXJuIDM7XHJcbiAgICB9XHJcbiAgICBpZihzcmNQb2ludC55IDwgdGd0UG9pbnQueSAmJiBzcmNQb2ludC54ID4gdGd0UG9pbnQueCl7XHJcbiAgICAgIHJldHVybiA0O1xyXG4gICAgfVxyXG4gICAgaWYoc3JjUG9pbnQueSA9PSB0Z3RQb2ludC55ICYmIHNyY1BvaW50LnggPiB0Z3RQb2ludC54KXtcclxuICAgICAgcmV0dXJuIDU7XHJcbiAgICB9XHJcbiAgICBpZihzcmNQb2ludC55ID4gdGd0UG9pbnQueSAmJiBzcmNQb2ludC54ID4gdGd0UG9pbnQueCl7XHJcbiAgICAgIHJldHVybiA2O1xyXG4gICAgfVxyXG4gICAgaWYoc3JjUG9pbnQueSA+IHRndFBvaW50LnkgJiYgc3JjUG9pbnQueCA9PSB0Z3RQb2ludC54KXtcclxuICAgICAgcmV0dXJuIDc7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gODsvL2lmIHNyY1BvaW50LnkgPiB0Z3RQb2ludC55IGFuZCBzcmNQb2ludC54IDwgdGd0UG9pbnQueFxyXG4gIH0sXHJcbiAgZ2V0U3JjVGd0UG9pbnRzQW5kVGFuZ2VudHM6IGZ1bmN0aW9uIChlZGdlKSB7XHJcbiAgICB2YXIgc291cmNlTm9kZSA9IGVkZ2Uuc291cmNlKCk7XHJcbiAgICB2YXIgdGFyZ2V0Tm9kZSA9IGVkZ2UudGFyZ2V0KCk7XHJcbiAgICBcclxuICAgIHZhciB0Z3RQb3NpdGlvbiA9IHRhcmdldE5vZGUucG9zaXRpb24oKTtcclxuICAgIHZhciBzcmNQb3NpdGlvbiA9IHNvdXJjZU5vZGUucG9zaXRpb24oKTtcclxuICAgIFxyXG4gICAgdmFyIHNyY1BvaW50ID0gc291cmNlTm9kZS5wb3NpdGlvbigpO1xyXG4gICAgdmFyIHRndFBvaW50ID0gdGFyZ2V0Tm9kZS5wb3NpdGlvbigpO1xyXG5cclxuXHJcbiAgICB2YXIgbTEgPSAodGd0UG9pbnQueSAtIHNyY1BvaW50LnkpIC8gKHRndFBvaW50LnggLSBzcmNQb2ludC54KTtcclxuICAgIHZhciBtMiA9IC0xIC8gbTE7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbTE6IG0xLFxyXG4gICAgICBtMjogbTIsXHJcbiAgICAgIHNyY1BvaW50OiBzcmNQb2ludCxcclxuICAgICAgdGd0UG9pbnQ6IHRndFBvaW50XHJcbiAgICB9O1xyXG4gIH0sXHJcbiAgZ2V0SW50ZXJzZWN0aW9uOiBmdW5jdGlvbihlZGdlLCBwb2ludCwgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMpe1xyXG4gICAgaWYgKHNyY1RndFBvaW50c0FuZFRhbmdlbnRzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMgPSB0aGlzLmdldFNyY1RndFBvaW50c0FuZFRhbmdlbnRzKGVkZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBzcmNQb2ludCA9IHNyY1RndFBvaW50c0FuZFRhbmdlbnRzLnNyY1BvaW50O1xyXG4gICAgdmFyIHRndFBvaW50ID0gc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMudGd0UG9pbnQ7XHJcbiAgICB2YXIgbTEgPSBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cy5tMTtcclxuICAgIHZhciBtMiA9IHNyY1RndFBvaW50c0FuZFRhbmdlbnRzLm0yO1xyXG5cclxuICAgIHZhciBpbnRlcnNlY3RYO1xyXG4gICAgdmFyIGludGVyc2VjdFk7XHJcblxyXG4gICAgaWYobTEgPT0gSW5maW5pdHkgfHwgbTEgPT0gLUluZmluaXR5KXtcclxuICAgICAgaW50ZXJzZWN0WCA9IHNyY1BvaW50Lng7XHJcbiAgICAgIGludGVyc2VjdFkgPSBwb2ludC55O1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZihtMSA9PSAwKXtcclxuICAgICAgaW50ZXJzZWN0WCA9IHBvaW50Lng7XHJcbiAgICAgIGludGVyc2VjdFkgPSBzcmNQb2ludC55O1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHZhciBhMSA9IHNyY1BvaW50LnkgLSBtMSAqIHNyY1BvaW50Lng7XHJcbiAgICAgIHZhciBhMiA9IHBvaW50LnkgLSBtMiAqIHBvaW50Lng7XHJcblxyXG4gICAgICBpbnRlcnNlY3RYID0gKGEyIC0gYTEpIC8gKG0xIC0gbTIpO1xyXG4gICAgICBpbnRlcnNlY3RZID0gbTEgKiBpbnRlcnNlY3RYICsgYTE7XHJcbiAgICB9XHJcblxyXG4gICAgLy9JbnRlcnNlY3Rpb24gcG9pbnQgaXMgdGhlIGludGVyc2VjdGlvbiBvZiB0aGUgbGluZXMgcGFzc2luZyB0aHJvdWdoIHRoZSBub2RlcyBhbmRcclxuICAgIC8vcGFzc2luZyB0aHJvdWdoIHRoZSBiZW5kIG9yIGNvbnRyb2wgcG9pbnQgYW5kIHBlcnBlbmRpY3VsYXIgdG8gdGhlIG90aGVyIGxpbmVcclxuICAgIHZhciBpbnRlcnNlY3Rpb25Qb2ludCA9IHtcclxuICAgICAgeDogaW50ZXJzZWN0WCxcclxuICAgICAgeTogaW50ZXJzZWN0WVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGludGVyc2VjdGlvblBvaW50O1xyXG4gIH0sXHJcbiAgZ2V0QW5jaG9yc0FzQXJyYXk6IGZ1bmN0aW9uKGVkZ2UpIHtcclxuICAgIHZhciB0eXBlID0gdGhpcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuXHJcbiAgICBpZih0eXBlID09PSAnaW5jb25jbHVzaXZlJyl7XHJcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmKCBlZGdlLmNzcygnY3VydmUtc3R5bGUnKSAhPT0gdGhpcy5zeW50YXhbdHlwZV1bJ2VkZ2UnXSApIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIGFuY2hvckxpc3QgPSBbXTtcclxuXHJcbiAgICB2YXIgd2VpZ2h0cyA9IGVkZ2UucHN0eWxlKCB0aGlzLnN5bnRheFt0eXBlXVsnd2VpZ2h0Q3NzJ10gKSA/IFxyXG4gICAgICAgICAgICAgICAgICBlZGdlLnBzdHlsZSggdGhpcy5zeW50YXhbdHlwZV1bJ3dlaWdodENzcyddICkucGZWYWx1ZSA6IFtdO1xyXG4gICAgdmFyIGRpc3RhbmNlcyA9IGVkZ2UucHN0eWxlKCB0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2VDc3MnXSApID8gXHJcbiAgICAgICAgICAgICAgICAgIGVkZ2UucHN0eWxlKCB0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2VDc3MnXSApLnBmVmFsdWUgOiBbXTtcclxuICAgIHZhciBtaW5MZW5ndGhzID0gTWF0aC5taW4oIHdlaWdodHMubGVuZ3RoLCBkaXN0YW5jZXMubGVuZ3RoICk7XHJcbiAgICBcclxuICAgIHZhciBzcmNQb3MgPSBlZGdlLnNvdXJjZSgpLnBvc2l0aW9uKCk7XHJcbiAgICB2YXIgdGd0UG9zID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigpO1xyXG5cclxuICAgIHZhciBkeSA9ICggdGd0UG9zLnkgLSBzcmNQb3MueSApO1xyXG4gICAgdmFyIGR4ID0gKCB0Z3RQb3MueCAtIHNyY1Bvcy54ICk7XHJcbiAgICBcclxuICAgIHZhciBsID0gTWF0aC5zcXJ0KCBkeCAqIGR4ICsgZHkgKiBkeSApO1xyXG5cclxuICAgIHZhciB2ZWN0b3IgPSB7XHJcbiAgICAgIHg6IGR4LFxyXG4gICAgICB5OiBkeVxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgdmVjdG9yTm9ybSA9IHtcclxuICAgICAgeDogdmVjdG9yLnggLyBsLFxyXG4gICAgICB5OiB2ZWN0b3IueSAvIGxcclxuICAgIH07XHJcbiAgICBcclxuICAgIHZhciB2ZWN0b3JOb3JtSW52ZXJzZSA9IHtcclxuICAgICAgeDogLXZlY3Rvck5vcm0ueSxcclxuICAgICAgeTogdmVjdG9yTm9ybS54XHJcbiAgICB9O1xyXG5cclxuICAgIGZvciggdmFyIHMgPSAwOyBzIDwgbWluTGVuZ3RoczsgcysrICl7XHJcbiAgICAgIHZhciB3ID0gd2VpZ2h0c1sgcyBdO1xyXG4gICAgICB2YXIgZCA9IGRpc3RhbmNlc1sgcyBdO1xyXG5cclxuICAgICAgdmFyIHcxID0gKDEgLSB3KTtcclxuICAgICAgdmFyIHcyID0gdztcclxuXHJcbiAgICAgIHZhciBwb3NQdHMgPSB7XHJcbiAgICAgICAgeDE6IHNyY1Bvcy54LFxyXG4gICAgICAgIHgyOiB0Z3RQb3MueCxcclxuICAgICAgICB5MTogc3JjUG9zLnksXHJcbiAgICAgICAgeTI6IHRndFBvcy55XHJcbiAgICAgIH07XHJcblxyXG4gICAgICB2YXIgbWlkcHRQdHMgPSBwb3NQdHM7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgYWRqdXN0ZWRNaWRwdCA9IHtcclxuICAgICAgICB4OiBtaWRwdFB0cy54MSAqIHcxICsgbWlkcHRQdHMueDIgKiB3MixcclxuICAgICAgICB5OiBtaWRwdFB0cy55MSAqIHcxICsgbWlkcHRQdHMueTIgKiB3MlxyXG4gICAgICB9O1xyXG5cclxuICAgICAgYW5jaG9yTGlzdC5wdXNoKFxyXG4gICAgICAgIGFkanVzdGVkTWlkcHQueCArIHZlY3Rvck5vcm1JbnZlcnNlLnggKiBkLFxyXG4gICAgICAgIGFkanVzdGVkTWlkcHQueSArIHZlY3Rvck5vcm1JbnZlcnNlLnkgKiBkXHJcbiAgICAgICk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBhbmNob3JMaXN0O1xyXG4gIH0sXHJcbiAgY29udmVydFRvQW5jaG9yQWJzb2x1dGVQb3NpdGlvbnM6IGZ1bmN0aW9uIChlZGdlLCB0eXBlLCBhbmNob3JJbmRleCkge1xyXG4gICAgdmFyIHNyY1BvcyA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oKTtcclxuICAgIHZhciB0Z3RQb3MgPSBlZGdlLnRhcmdldCgpLnBvc2l0aW9uKCk7XHJcbiAgICB2YXIgd2VpZ2h0cyA9IGVkZ2UuZGF0YSh0aGlzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10pO1xyXG4gICAgdmFyIGRpc3RhbmNlcyA9IGVkZ2UuZGF0YSh0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXSk7XHJcbiAgICB2YXIgdyA9IHdlaWdodHNbIGFuY2hvckluZGV4IF07XHJcbiAgICB2YXIgZCA9IGRpc3RhbmNlc1sgYW5jaG9ySW5kZXggXTtcclxuICAgIHZhciBkeSA9ICggdGd0UG9zLnkgLSBzcmNQb3MueSApO1xyXG4gICAgdmFyIGR4ID0gKCB0Z3RQb3MueCAtIHNyY1Bvcy54ICk7XHJcbiAgICB2YXIgbCA9IE1hdGguc3FydCggZHggKiBkeCArIGR5ICogZHkgKTtcclxuICAgIHZhciB2ZWN0b3IgPSB7XHJcbiAgICAgIHg6IGR4LFxyXG4gICAgICB5OiBkeVxyXG4gICAgfTtcclxuICAgIHZhciB2ZWN0b3JOb3JtID0ge1xyXG4gICAgICB4OiB2ZWN0b3IueCAvIGwsXHJcbiAgICAgIHk6IHZlY3Rvci55IC8gbFxyXG4gICAgfTtcclxuICAgIHZhciB2ZWN0b3JOb3JtSW52ZXJzZSA9IHtcclxuICAgICAgeDogLXZlY3Rvck5vcm0ueSxcclxuICAgICAgeTogdmVjdG9yTm9ybS54XHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB3MSA9ICgxIC0gdyk7XHJcbiAgICB2YXIgdzIgPSB3O1xyXG4gICAgdmFyIG1pZFg9IHNyY1Bvcy54ICogdzEgKyB0Z3RQb3MueCAqIHcyXHJcbiAgICB2YXIgbWlkWT0gc3JjUG9zLnkgKiB3MSArIHRndFBvcy55ICogdzJcclxuICAgIHZhciBhYnNvbHV0ZVg9IG1pZFggKyB2ZWN0b3JOb3JtSW52ZXJzZS54ICogZFxyXG4gICAgdmFyIGFic29sdXRlWT0gbWlkWSArIHZlY3Rvck5vcm1JbnZlcnNlLnkgKiBkXHJcblxyXG4gICAgcmV0dXJuIHt4OmFic29sdXRlWCx5OmFic29sdXRlWX1cclxuICB9LFxyXG4gIG9idGFpblByZXZBbmNob3JBYnNvbHV0ZVBvc2l0aW9uczogZnVuY3Rpb24gKGVkZ2UsIHR5cGUsIGFuY2hvckluZGV4KSB7XHJcbiAgICBpZihhbmNob3JJbmRleDw9MCl7XHJcbiAgICAgIHJldHVybiBlZGdlLnNvdXJjZSgpLnBvc2l0aW9uKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgcmV0dXJuIHRoaXMuY29udmVydFRvQW5jaG9yQWJzb2x1dGVQb3NpdGlvbnMoZWRnZSx0eXBlLGFuY2hvckluZGV4LTEpXHJcbiAgICB9XHJcbiAgfSxcclxuICBvYnRhaW5OZXh0QW5jaG9yQWJzb2x1dGVQb3NpdGlvbnM6IGZ1bmN0aW9uIChlZGdlLCB0eXBlLCBhbmNob3JJbmRleCkge1xyXG4gICAgdmFyIHdlaWdodHMgPSBlZGdlLmRhdGEodGhpcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddKTtcclxuICAgIHZhciBkaXN0YW5jZXMgPSBlZGdlLmRhdGEodGhpcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ10pO1xyXG4gICAgdmFyIG1pbkxlbmd0aHMgPSBNYXRoLm1pbiggd2VpZ2h0cy5sZW5ndGgsIGRpc3RhbmNlcy5sZW5ndGggKTtcclxuICAgIGlmKGFuY2hvckluZGV4Pj1taW5MZW5ndGhzLTEpe1xyXG4gICAgICByZXR1cm4gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbnZlcnRUb0FuY2hvckFic29sdXRlUG9zaXRpb25zKGVkZ2UsdHlwZSxhbmNob3JJbmRleCsxKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbjogZnVuY3Rpb24gKGVkZ2UsIHBvaW50LCBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cykge1xyXG4gICAgaWYgKHNyY1RndFBvaW50c0FuZFRhbmdlbnRzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMgPSB0aGlzLmdldFNyY1RndFBvaW50c0FuZFRhbmdlbnRzKGVkZ2UpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgaW50ZXJzZWN0aW9uUG9pbnQgPSB0aGlzLmdldEludGVyc2VjdGlvbihlZGdlLCBwb2ludCwgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMpO1xyXG4gICAgdmFyIGludGVyc2VjdFggPSBpbnRlcnNlY3Rpb25Qb2ludC54O1xyXG4gICAgdmFyIGludGVyc2VjdFkgPSBpbnRlcnNlY3Rpb25Qb2ludC55O1xyXG4gICAgXHJcbiAgICB2YXIgc3JjUG9pbnQgPSBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cy5zcmNQb2ludDtcclxuICAgIHZhciB0Z3RQb2ludCA9IHNyY1RndFBvaW50c0FuZFRhbmdlbnRzLnRndFBvaW50O1xyXG4gICAgXHJcbiAgICB2YXIgd2VpZ2h0O1xyXG4gICAgXHJcbiAgICBpZiggaW50ZXJzZWN0WCAhPSBzcmNQb2ludC54ICkge1xyXG4gICAgICB3ZWlnaHQgPSAoaW50ZXJzZWN0WCAtIHNyY1BvaW50LngpIC8gKHRndFBvaW50LnggLSBzcmNQb2ludC54KTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYoIGludGVyc2VjdFkgIT0gc3JjUG9pbnQueSApIHtcclxuICAgICAgd2VpZ2h0ID0gKGludGVyc2VjdFkgLSBzcmNQb2ludC55KSAvICh0Z3RQb2ludC55IC0gc3JjUG9pbnQueSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgd2VpZ2h0ID0gMDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIGRpc3RhbmNlID0gTWF0aC5zcXJ0KE1hdGgucG93KChpbnRlcnNlY3RZIC0gcG9pbnQueSksIDIpXHJcbiAgICAgICAgKyBNYXRoLnBvdygoaW50ZXJzZWN0WCAtIHBvaW50LngpLCAyKSk7XHJcbiAgICBcclxuICAgIC8vR2V0IHRoZSBkaXJlY3Rpb24gb2YgdGhlIGxpbmUgZm9ybSBzb3VyY2UgcG9pbnQgdG8gdGFyZ2V0IHBvaW50XHJcbiAgICB2YXIgZGlyZWN0aW9uMSA9IHRoaXMuZ2V0TGluZURpcmVjdGlvbihzcmNQb2ludCwgdGd0UG9pbnQpO1xyXG4gICAgLy9HZXQgdGhlIGRpcmVjdGlvbiBvZiB0aGUgbGluZSBmcm9tIGludGVzZWN0aW9uIHBvaW50IHRvIHRoZSBwb2ludFxyXG4gICAgdmFyIGRpcmVjdGlvbjIgPSB0aGlzLmdldExpbmVEaXJlY3Rpb24oaW50ZXJzZWN0aW9uUG9pbnQsIHBvaW50KTtcclxuICAgIFxyXG4gICAgLy9JZiB0aGUgZGlmZmVyZW5jZSBpcyBub3QgLTIgYW5kIG5vdCA2IHRoZW4gdGhlIGRpcmVjdGlvbiBvZiB0aGUgZGlzdGFuY2UgaXMgbmVnYXRpdmVcclxuICAgIGlmKGRpcmVjdGlvbjEgLSBkaXJlY3Rpb24yICE9IC0yICYmIGRpcmVjdGlvbjEgLSBkaXJlY3Rpb24yICE9IDYpe1xyXG4gICAgICBpZihkaXN0YW5jZSAhPSAwKVxyXG4gICAgICAgIGRpc3RhbmNlID0gLTEgKiBkaXN0YW5jZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgd2VpZ2h0OiB3ZWlnaHQsXHJcbiAgICAgIGRpc3RhbmNlOiBkaXN0YW5jZVxyXG4gICAgfTtcclxuICB9LFxyXG4gIGNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb25zOiBmdW5jdGlvbiAoZWRnZSwgYW5jaG9yUG9pbnRzKSB7XHJcbiAgICB2YXIgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMgPSB0aGlzLmdldFNyY1RndFBvaW50c0FuZFRhbmdlbnRzKGVkZ2UpO1xyXG5cclxuICAgIHZhciB3ZWlnaHRzID0gW107XHJcbiAgICB2YXIgZGlzdGFuY2VzID0gW107XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGFuY2hvclBvaW50cyAmJiBpIDwgYW5jaG9yUG9pbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBhbmNob3IgPSBhbmNob3JQb2ludHNbaV07XHJcbiAgICAgIHZhciByZWxhdGl2ZUFuY2hvclBvc2l0aW9uID0gdGhpcy5jb252ZXJ0VG9SZWxhdGl2ZVBvc2l0aW9uKGVkZ2UsIGFuY2hvciwgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMpO1xyXG5cclxuICAgICAgd2VpZ2h0cy5wdXNoKHJlbGF0aXZlQW5jaG9yUG9zaXRpb24ud2VpZ2h0KTtcclxuICAgICAgZGlzdGFuY2VzLnB1c2gocmVsYXRpdmVBbmNob3JQb3NpdGlvbi5kaXN0YW5jZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgd2VpZ2h0czogd2VpZ2h0cyxcclxuICAgICAgZGlzdGFuY2VzOiBkaXN0YW5jZXNcclxuICAgIH07XHJcbiAgfSxcclxuICBnZXREaXN0YW5jZXNTdHJpbmc6IGZ1bmN0aW9uIChlZGdlLCB0eXBlKSB7XHJcbiAgICB2YXIgc3RyID0gXCJcIjtcclxuXHJcbiAgICB2YXIgZGlzdGFuY2VzID0gZWRnZS5kYXRhKHRoaXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBkaXN0YW5jZXMgJiYgaSA8IGRpc3RhbmNlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBzdHIgPSBzdHIgKyBcIiBcIiArIGRpc3RhbmNlc1tpXTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHN0cjtcclxuICB9LFxyXG4gIGdldFdlaWdodHNTdHJpbmc6IGZ1bmN0aW9uIChlZGdlLCB0eXBlKSB7XHJcbiAgICB2YXIgc3RyID0gXCJcIjtcclxuXHJcbiAgICB2YXIgd2VpZ2h0cyA9IGVkZ2UuZGF0YSh0aGlzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10pO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IHdlaWdodHMgJiYgaSA8IHdlaWdodHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgc3RyID0gc3RyICsgXCIgXCIgKyB3ZWlnaHRzW2ldO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gc3RyO1xyXG4gIH0sXHJcbiAgYWRkQW5jaG9yUG9pbnQ6IGZ1bmN0aW9uKGVkZ2UsIG5ld0FuY2hvclBvaW50LCB0eXBlID0gdW5kZWZpbmVkKSB7XHJcbiAgICBpZihlZGdlID09PSB1bmRlZmluZWQgfHwgbmV3QW5jaG9yUG9pbnQgPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgIGVkZ2UgPSB0aGlzLmN1cnJlbnRDdHhFZGdlO1xyXG4gICAgICBuZXdBbmNob3JQb2ludCA9IHRoaXMuY3VycmVudEN0eFBvcztcclxuICAgIH1cclxuICBcclxuICAgIGlmKHR5cGUgPT09IHVuZGVmaW5lZClcclxuICAgICAgdHlwZSA9IHRoaXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgdmFyIHdlaWdodFN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXTtcclxuICAgIHZhciBkaXN0YW5jZVN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddO1xyXG5cclxuICAgIHZhciByZWxhdGl2ZVBvc2l0aW9uID0gdGhpcy5jb252ZXJ0VG9SZWxhdGl2ZVBvc2l0aW9uKGVkZ2UsIG5ld0FuY2hvclBvaW50KTtcclxuICAgIHZhciBvcmlnaW5hbEFuY2hvcldlaWdodCA9IHJlbGF0aXZlUG9zaXRpb24ud2VpZ2h0O1xyXG4gICAgXHJcbiAgICB2YXIgc3RhcnRYID0gZWRnZS5zb3VyY2UoKS5wb3NpdGlvbigneCcpO1xyXG4gICAgdmFyIHN0YXJ0WSA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oJ3knKTtcclxuICAgIHZhciBlbmRYID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigneCcpO1xyXG4gICAgdmFyIGVuZFkgPSBlZGdlLnRhcmdldCgpLnBvc2l0aW9uKCd5Jyk7XHJcbiAgICB2YXIgc3RhcnRXZWlnaHQgPSB0aGlzLmNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb24oZWRnZSwge3g6IHN0YXJ0WCwgeTogc3RhcnRZfSkud2VpZ2h0O1xyXG4gICAgdmFyIGVuZFdlaWdodCA9IHRoaXMuY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbihlZGdlLCB7eDogZW5kWCwgeTogZW5kWX0pLndlaWdodDtcclxuICAgIHZhciB3ZWlnaHRzV2l0aFRndFNyYyA9IFtzdGFydFdlaWdodF0uY29uY2F0KGVkZ2UuZGF0YSh3ZWlnaHRTdHIpP2VkZ2UuZGF0YSh3ZWlnaHRTdHIpOltdKS5jb25jYXQoW2VuZFdlaWdodF0pO1xyXG4gICAgXHJcbiAgICB2YXIgYW5jaG9yc0xpc3QgPSB0aGlzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpO1xyXG4gICAgXHJcbiAgICB2YXIgbWluRGlzdCA9IEluZmluaXR5O1xyXG4gICAgdmFyIGludGVyc2VjdGlvbjtcclxuICAgIHZhciBwdHNXaXRoVGd0U3JjID0gW3N0YXJ0WCwgc3RhcnRZXVxyXG4gICAgICAgICAgICAuY29uY2F0KGFuY2hvcnNMaXN0P2FuY2hvcnNMaXN0OltdKVxyXG4gICAgICAgICAgICAuY29uY2F0KFtlbmRYLCBlbmRZXSk7XHJcbiAgICB2YXIgbmV3QW5jaG9ySW5kZXggPSAtMTtcclxuICAgIFxyXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHdlaWdodHNXaXRoVGd0U3JjLmxlbmd0aCAtIDE7IGkrKyl7XHJcbiAgICAgIHZhciB3MSA9IHdlaWdodHNXaXRoVGd0U3JjW2ldO1xyXG4gICAgICB2YXIgdzIgPSB3ZWlnaHRzV2l0aFRndFNyY1tpICsgMV07XHJcbiAgICAgIFxyXG4gICAgICAvL2NoZWNrIGlmIHRoZSB3ZWlnaHQgaXMgYmV0d2VlbiB3MSBhbmQgdzJcclxuICAgICAgY29uc3QgYjEgPSB0aGlzLmNvbXBhcmVXaXRoUHJlY2lzaW9uKG9yaWdpbmFsQW5jaG9yV2VpZ2h0LCB3MSwgdHJ1ZSk7XHJcbiAgICAgIGNvbnN0IGIyID0gdGhpcy5jb21wYXJlV2l0aFByZWNpc2lvbihvcmlnaW5hbEFuY2hvcldlaWdodCwgdzIpO1xyXG4gICAgICBjb25zdCBiMyA9IHRoaXMuY29tcGFyZVdpdGhQcmVjaXNpb24ob3JpZ2luYWxBbmNob3JXZWlnaHQsIHcyLCB0cnVlKTtcclxuICAgICAgY29uc3QgYjQgPSB0aGlzLmNvbXBhcmVXaXRoUHJlY2lzaW9uKG9yaWdpbmFsQW5jaG9yV2VpZ2h0LCB3MSk7XHJcbiAgICAgIGlmKCAoYjEgJiYgYjIpIHx8IChiMyAmJiBiNCkpe1xyXG4gICAgICAgIHZhciBzdGFydFggPSBwdHNXaXRoVGd0U3JjWzIgKiBpXTtcclxuICAgICAgICB2YXIgc3RhcnRZID0gcHRzV2l0aFRndFNyY1syICogaSArIDFdO1xyXG4gICAgICAgIHZhciBlbmRYID0gcHRzV2l0aFRndFNyY1syICogaSArIDJdO1xyXG4gICAgICAgIHZhciBlbmRZID0gcHRzV2l0aFRndFNyY1syICogaSArIDNdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzdGFydCA9IHtcclxuICAgICAgICAgIHg6IHN0YXJ0WCxcclxuICAgICAgICAgIHk6IHN0YXJ0WVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGVuZCA9IHtcclxuICAgICAgICAgIHg6IGVuZFgsXHJcbiAgICAgICAgICB5OiBlbmRZXHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgbTEgPSAoIHN0YXJ0WSAtIGVuZFkgKSAvICggc3RhcnRYIC0gZW5kWCApO1xyXG4gICAgICAgIHZhciBtMiA9IC0xIC8gbTE7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHNyY1RndFBvaW50c0FuZFRhbmdlbnRzID0ge1xyXG4gICAgICAgICAgc3JjUG9pbnQ6IHN0YXJ0LFxyXG4gICAgICAgICAgdGd0UG9pbnQ6IGVuZCxcclxuICAgICAgICAgIG0xOiBtMSxcclxuICAgICAgICAgIG0yOiBtMlxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGN1cnJlbnRJbnRlcnNlY3Rpb24gPSB0aGlzLmdldEludGVyc2VjdGlvbihlZGdlLCBuZXdBbmNob3JQb2ludCwgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMpO1xyXG4gICAgICAgIHZhciBkaXN0ID0gTWF0aC5zcXJ0KCBNYXRoLnBvdyggKG5ld0FuY2hvclBvaW50LnggLSBjdXJyZW50SW50ZXJzZWN0aW9uLngpLCAyICkgXHJcbiAgICAgICAgICAgICAgICArIE1hdGgucG93KCAobmV3QW5jaG9yUG9pbnQueSAtIGN1cnJlbnRJbnRlcnNlY3Rpb24ueSksIDIgKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9VcGRhdGUgdGhlIG1pbmltdW0gZGlzdGFuY2VcclxuICAgICAgICBpZihkaXN0IDwgbWluRGlzdCl7XHJcbiAgICAgICAgICBtaW5EaXN0ID0gZGlzdDtcclxuICAgICAgICAgIGludGVyc2VjdGlvbiA9IGN1cnJlbnRJbnRlcnNlY3Rpb247XHJcbiAgICAgICAgICBuZXdBbmNob3JJbmRleCA9IGk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGlmKGludGVyc2VjdGlvbiAhPT0gdW5kZWZpbmVkKXtcclxuICAgICAgbmV3QW5jaG9yUG9pbnQgPSBpbnRlcnNlY3Rpb247XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlbGF0aXZlUG9zaXRpb24gPSB0aGlzLmNvbnZlcnRUb1JlbGF0aXZlUG9zaXRpb24oZWRnZSwgbmV3QW5jaG9yUG9pbnQpO1xyXG4gICAgXHJcbiAgICBpZihpbnRlcnNlY3Rpb24gPT09IHVuZGVmaW5lZCl7XHJcbiAgICAgIHJlbGF0aXZlUG9zaXRpb24uZGlzdGFuY2UgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB3ZWlnaHRzID0gZWRnZS5kYXRhKHdlaWdodFN0cik7XHJcbiAgICB2YXIgZGlzdGFuY2VzID0gZWRnZS5kYXRhKGRpc3RhbmNlU3RyKTtcclxuICAgIFxyXG4gICAgd2VpZ2h0cyA9IHdlaWdodHM/d2VpZ2h0czpbXTtcclxuICAgIGRpc3RhbmNlcyA9IGRpc3RhbmNlcz9kaXN0YW5jZXM6W107XHJcbiAgICBcclxuICAgIGlmKHdlaWdodHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgIG5ld0FuY2hvckluZGV4ID0gMDtcclxuICAgIH1cclxuICAgIFxyXG4vLyAgICB3ZWlnaHRzLnB1c2gocmVsYXRpdmVCZW5kUG9zaXRpb24ud2VpZ2h0KTtcclxuLy8gICAgZGlzdGFuY2VzLnB1c2gocmVsYXRpdmVCZW5kUG9zaXRpb24uZGlzdGFuY2UpO1xyXG4gICAgaWYobmV3QW5jaG9ySW5kZXggIT0gLTEpe1xyXG4gICAgICB3ZWlnaHRzLnNwbGljZShuZXdBbmNob3JJbmRleCwgMCwgcmVsYXRpdmVQb3NpdGlvbi53ZWlnaHQpO1xyXG4gICAgICBkaXN0YW5jZXMuc3BsaWNlKG5ld0FuY2hvckluZGV4LCAwLCByZWxhdGl2ZVBvc2l0aW9uLmRpc3RhbmNlKTtcclxuICAgIH1cclxuICAgXHJcbiAgICBlZGdlLmRhdGEod2VpZ2h0U3RyLCB3ZWlnaHRzKTtcclxuICAgIGVkZ2UuZGF0YShkaXN0YW5jZVN0ciwgZGlzdGFuY2VzKTtcclxuICAgIFxyXG4gICAgZWRnZS5hZGRDbGFzcyh0aGlzLnN5bnRheFt0eXBlXVsnY2xhc3MnXSk7XHJcbiAgICBpZiAod2VpZ2h0cy5sZW5ndGggPiAxIHx8IGRpc3RhbmNlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIGVkZ2UuYWRkQ2xhc3ModGhpcy5zeW50YXhbdHlwZV1bJ211bHRpQ2xhc3MnXSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBuZXdBbmNob3JJbmRleDtcclxuICB9LFxyXG4gIHJlbW92ZUFuY2hvcjogZnVuY3Rpb24oZWRnZSwgYW5jaG9ySW5kZXgpe1xyXG4gICAgaWYoZWRnZSA9PT0gdW5kZWZpbmVkIHx8IGFuY2hvckluZGV4ID09PSB1bmRlZmluZWQpe1xyXG4gICAgICBlZGdlID0gdGhpcy5jdXJyZW50Q3R4RWRnZTtcclxuICAgICAgYW5jaG9ySW5kZXggPSB0aGlzLmN1cnJlbnRBbmNob3JJbmRleDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIHR5cGUgPSB0aGlzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgIGlmKHRoaXMuZWRnZVR5cGVJbmNvbmNsdXNpdmVTaG91bGRudEhhcHBlbih0eXBlLCBcImFuY2hvclBvaW50VXRpbGl0aWVzLmpzLCByZW1vdmVBbmNob3JcIikpe1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGRpc3RhbmNlU3RyID0gdGhpcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddO1xyXG4gICAgdmFyIHdlaWdodFN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddO1xyXG4gICAgdmFyIHBvc2l0aW9uRGF0YVN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWydwb2ludFBvcyddO1xyXG5cclxuICAgIHZhciBkaXN0YW5jZXMgPSBlZGdlLmRhdGEoZGlzdGFuY2VTdHIpO1xyXG4gICAgdmFyIHdlaWdodHMgPSBlZGdlLmRhdGEod2VpZ2h0U3RyKTtcclxuICAgIHZhciBwb3NpdGlvbnMgPSBlZGdlLmRhdGEocG9zaXRpb25EYXRhU3RyKTtcclxuXHJcbiAgICBkaXN0YW5jZXMuc3BsaWNlKGFuY2hvckluZGV4LCAxKTtcclxuICAgIHdlaWdodHMuc3BsaWNlKGFuY2hvckluZGV4LCAxKTtcclxuICAgIC8vIHBvc2l0aW9uIGRhdGEgaXMgbm90IGdpdmVuIGluIGRlbW8gc28gaXQgdGhyb3dzIGVycm9yIGhlcmVcclxuICAgIC8vIGJ1dCBpdCBzaG91bGQgYmUgZnJvbSB0aGUgYmVnaW5uaW5nXHJcbiAgICBpZiAocG9zaXRpb25zKVxyXG4gICAgICBwb3NpdGlvbnMuc3BsaWNlKGFuY2hvckluZGV4LCAxKTtcclxuXHJcbiAgICAvLyBvbmx5IG9uZSBhbmNob3IgcG9pbnQgbGVmdCBvbiBlZGdlXHJcbiAgICBpZiAoZGlzdGFuY2VzLmxlbmd0aCA9PSAxIHx8IHdlaWdodHMubGVuZ3RoID09IDEpIHtcclxuICAgICAgZWRnZS5yZW1vdmVDbGFzcyh0aGlzLnN5bnRheFt0eXBlXVsnbXVsdGlDbGFzcyddKVxyXG4gICAgfVxyXG4gICAgLy8gbm8gbW9yZSBhbmNob3IgcG9pbnRzIG9uIGVkZ2VcclxuICAgIGVsc2UgaWYoZGlzdGFuY2VzLmxlbmd0aCA9PSAwIHx8IHdlaWdodHMubGVuZ3RoID09IDApe1xyXG4gICAgICBlZGdlLnJlbW92ZUNsYXNzKHRoaXMuc3ludGF4W3R5cGVdWydjbGFzcyddKTtcclxuICAgICAgZWRnZS5kYXRhKGRpc3RhbmNlU3RyLCBbXSk7XHJcbiAgICAgIGVkZ2UuZGF0YSh3ZWlnaHRTdHIsIFtdKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBlZGdlLmRhdGEoZGlzdGFuY2VTdHIsIGRpc3RhbmNlcyk7XHJcbiAgICAgIGVkZ2UuZGF0YSh3ZWlnaHRTdHIsIHdlaWdodHMpO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgcmVtb3ZlQWxsQW5jaG9yczogZnVuY3Rpb24oZWRnZSkge1xyXG4gICAgaWYgKGVkZ2UgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBlZGdlID0gdGhpcy5jdXJyZW50Q3R4RWRnZTtcclxuICAgIH1cclxuICAgIHZhciB0eXBlID0gdGhpcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgIFxyXG4gICAgaWYodGhpcy5lZGdlVHlwZUluY29uY2x1c2l2ZVNob3VsZG50SGFwcGVuKHR5cGUsIFwiYW5jaG9yUG9pbnRVdGlsaXRpZXMuanMsIHJlbW92ZUFsbEFuY2hvcnNcIikpe1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUmVtb3ZlIGNsYXNzZXMgZnJvbSBlZGdlXHJcbiAgICBlZGdlLnJlbW92ZUNsYXNzKHRoaXMuc3ludGF4W3R5cGVdWydjbGFzcyddKTtcclxuICAgIGVkZ2UucmVtb3ZlQ2xhc3ModGhpcy5zeW50YXhbdHlwZV1bJ211bHRpQ2xhc3MnXSk7XHJcblxyXG4gICAgLy8gUmVtb3ZlIGFsbCBhbmNob3IgcG9pbnQgZGF0YSBmcm9tIGVkZ2VcclxuICAgIHZhciBkaXN0YW5jZVN0ciA9IHRoaXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXTtcclxuICAgIHZhciB3ZWlnaHRTdHIgPSB0aGlzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXTtcclxuICAgIHZhciBwb3NpdGlvbkRhdGFTdHIgPSB0aGlzLnN5bnRheFt0eXBlXVsncG9pbnRQb3MnXTtcclxuICAgIGVkZ2UuZGF0YShkaXN0YW5jZVN0ciwgW10pO1xyXG4gICAgZWRnZS5kYXRhKHdlaWdodFN0ciwgW10pO1xyXG4gICAgLy8gcG9zaXRpb24gZGF0YSBpcyBub3QgZ2l2ZW4gaW4gZGVtbyBzbyBpdCB0aHJvd3MgZXJyb3IgaGVyZVxyXG4gICAgLy8gYnV0IGl0IHNob3VsZCBiZSBmcm9tIHRoZSBiZWdpbm5pbmdcclxuICAgIGlmIChlZGdlLmRhdGEocG9zaXRpb25EYXRhU3RyKSkge1xyXG4gICAgICBlZGdlLmRhdGEocG9zaXRpb25EYXRhU3RyLCBbXSk7XHJcbiAgICB9XHJcbiAgfSxcclxuICBjYWxjdWxhdGVEaXN0YW5jZTogZnVuY3Rpb24ocHQxLCBwdDIpIHtcclxuICAgIHZhciBkaWZmWCA9IHB0MS54IC0gcHQyLng7XHJcbiAgICB2YXIgZGlmZlkgPSBwdDEueSAtIHB0Mi55O1xyXG4gICAgXHJcbiAgICB2YXIgZGlzdCA9IE1hdGguc3FydCggTWF0aC5wb3coIGRpZmZYLCAyICkgKyBNYXRoLnBvdyggZGlmZlksIDIgKSApO1xyXG4gICAgcmV0dXJuIGRpc3Q7XHJcbiAgfSxcclxuICAvKiogKExlc3MgdGhhbiBvciBlcXVhbCB0bykgYW5kIChncmVhdGVyIHRoZW4gZXF1YWwgdG8pIGNvbXBhcmlzb25zIHdpdGggZmxvYXRpbmcgcG9pbnQgbnVtYmVycyAqL1xyXG4gIGNvbXBhcmVXaXRoUHJlY2lzaW9uOiBmdW5jdGlvbiAobjEsIG4yLCBpc0xlc3NUaGVuT3JFcXVhbCA9IGZhbHNlLCBwcmVjaXNpb24gPSAwLjAxKSB7XHJcbiAgICBjb25zdCBkaWZmID0gbjEgLSBuMjtcclxuICAgIGlmIChNYXRoLmFicyhkaWZmKSA8PSBwcmVjaXNpb24pIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAoaXNMZXNzVGhlbk9yRXF1YWwpIHtcclxuICAgICAgcmV0dXJuIG4xIDwgbjI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbjEgPiBuMjtcclxuICAgIH1cclxuICB9LFxyXG4gIGVkZ2VUeXBlSW5jb25jbHVzaXZlU2hvdWxkbnRIYXBwZW46IGZ1bmN0aW9uKHR5cGUsIHBsYWNlKXtcclxuICAgIGlmKHR5cGUgPT09ICdpbmNvbmNsdXNpdmUnKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGBJbiAke3BsYWNlfTogZWRnZSB0eXBlIGluY29uY2x1c2l2ZSBzaG91bGQgbmV2ZXIgaGFwcGVuIGhlcmUhIWApO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGFuY2hvclBvaW50VXRpbGl0aWVzO1xyXG4iLCJ2YXIgZGVib3VuY2UgPSByZXF1aXJlKCcuL2RlYm91bmNlJyk7XHJcbnZhciBhbmNob3JQb2ludFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vQW5jaG9yUG9pbnRVdGlsaXRpZXMnKTtcclxudmFyIHJlY29ubmVjdGlvblV0aWxpdGllcyA9IHJlcXVpcmUoJy4vcmVjb25uZWN0aW9uVXRpbGl0aWVzJyk7XHJcbnZhciByZWdpc3RlclVuZG9SZWRvRnVuY3Rpb25zID0gcmVxdWlyZSgnLi9yZWdpc3RlclVuZG9SZWRvRnVuY3Rpb25zJyk7XHJcbnZhciBzdGFnZUlkID0gMDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHBhcmFtcywgY3kpIHtcclxuICB2YXIgZm4gPSBwYXJhbXM7XHJcblxyXG4gIHZhciBhZGRCZW5kUG9pbnRDeHRNZW51SWQgPSAnY3ktZWRnZS1iZW5kLWVkaXRpbmctY3h0LWFkZC1iZW5kLXBvaW50JyArIHN0YWdlSWQ7XHJcbiAgdmFyIHJlbW92ZUJlbmRQb2ludEN4dE1lbnVJZCA9ICdjeS1lZGdlLWJlbmQtZWRpdGluZy1jeHQtcmVtb3ZlLWJlbmQtcG9pbnQnICsgc3RhZ2VJZDtcclxuICB2YXIgcmVtb3ZlQWxsQmVuZFBvaW50Q3R4TWVudUlkID0gJ2N5LWVkZ2UtYmVuZC1lZGl0aW5nLWN4dC1yZW1vdmUtbXVsdGlwbGUtYmVuZC1wb2ludCcgKyBzdGFnZUlkO1xyXG4gIHZhciBhZGRDb250cm9sUG9pbnRDeHRNZW51SWQgPSAnY3ktZWRnZS1jb250cm9sLWVkaXRpbmctY3h0LWFkZC1jb250cm9sLXBvaW50JyArIHN0YWdlSWQ7XHJcbiAgdmFyIHJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCA9ICdjeS1lZGdlLWNvbnRyb2wtZWRpdGluZy1jeHQtcmVtb3ZlLWNvbnRyb2wtcG9pbnQnICsgc3RhZ2VJZDtcclxuICB2YXIgcmVtb3ZlQWxsQ29udHJvbFBvaW50Q3R4TWVudUlkID0gJ2N5LWVkZ2UtYmVuZC1lZGl0aW5nLWN4dC1yZW1vdmUtbXVsdGlwbGUtY29udHJvbC1wb2ludCcgKyBzdGFnZUlkO1xyXG4gIHZhciBlU3R5bGUsIGVSZW1vdmUsIGVBZGQsIGVab29tLCBlU2VsZWN0LCBlVW5zZWxlY3QsIGVUYXBTdGFydCwgZVRhcFN0YXJ0T25FZGdlLCBlVGFwRHJhZywgZVRhcEVuZCwgZUN4dFRhcCwgZURyYWc7XHJcbiAgLy8gbGFzdCBzdGF0dXMgb2YgZ2VzdHVyZXNcclxuICB2YXIgbGFzdFBhbm5pbmdFbmFibGVkLCBsYXN0Wm9vbWluZ0VuYWJsZWQsIGxhc3RCb3hTZWxlY3Rpb25FbmFibGVkO1xyXG4gIHZhciBsYXN0QWN0aXZlQmdPcGFjaXR5O1xyXG4gIC8vIHN0YXR1cyBvZiBlZGdlIHRvIGhpZ2hsaWdodCBiZW5kcyBhbmQgc2VsZWN0ZWQgZWRnZXNcclxuICB2YXIgZWRnZVRvSGlnaGxpZ2h0LCBudW1iZXJPZlNlbGVjdGVkRWRnZXM7XHJcblxyXG4gIC8vIHRoZSBLYW52YS5zaGFwZSgpIGZvciB0aGUgZW5kcG9pbnRzXHJcbiAgdmFyIGVuZHBvaW50U2hhcGUxID0gbnVsbCwgZW5kcG9pbnRTaGFwZTIgPSBudWxsO1xyXG4gIC8vIHVzZWQgdG8gc3RvcCBjZXJ0YWluIGN5IGxpc3RlbmVycyB3aGVuIGludGVycmFjdGluZyB3aXRoIGFuY2hvcnNcclxuICB2YXIgYW5jaG9yVG91Y2hlZCA9IGZhbHNlO1xyXG4gIC8vIHVzZWQgY2FsbCBlTW91c2VEb3duIG9mIGFuY2hvck1hbmFnZXIgaWYgdGhlIG1vdXNlIGlzIG91dCBvZiB0aGUgY29udGVudCBvbiBjeS5vbih0YXBlbmQpXHJcbiAgdmFyIG1vdXNlT3V0O1xyXG4gIFxyXG4gIHZhciBmdW5jdGlvbnMgPSB7XHJcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vIHJlZ2lzdGVyIHVuZG8gcmVkbyBmdW5jdGlvbnNcclxuICAgICAgcmVnaXN0ZXJVbmRvUmVkb0Z1bmN0aW9ucyhjeSwgYW5jaG9yUG9pbnRVdGlsaXRpZXMsIHBhcmFtcyk7XHJcbiAgICAgIFxyXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICAgIHZhciBvcHRzID0gcGFyYW1zO1xyXG5cclxuICAgICAgLypcclxuICAgICAgICBNYWtlIHN1cmUgd2UgZG9uJ3QgYXBwZW5kIGFuIGVsZW1lbnQgdGhhdCBhbHJlYWR5IGV4aXN0cy5cclxuICAgICAgICBUaGlzIGV4dGVuc2lvbiBjYW52YXMgdXNlcyB0aGUgc2FtZSBodG1sIGVsZW1lbnQgYXMgZWRnZS1lZGl0aW5nLlxyXG4gICAgICAgIEl0IG1ha2VzIHNlbnNlIHNpbmNlIGl0IGFsc28gdXNlcyB0aGUgc2FtZSBLb252YSBzdGFnZS5cclxuICAgICAgICBXaXRob3V0IHRoZSBiZWxvdyBsb2dpYywgYW4gZW1wdHkgY2FudmFzRWxlbWVudCB3b3VsZCBiZSBjcmVhdGVkXHJcbiAgICAgICAgZm9yIG9uZSBvZiB0aGVzZSBleHRlbnNpb25zIGZvciBubyByZWFzb24uXHJcbiAgICAgICovXHJcbiAgICAgIHZhciAkY29udGFpbmVyID0gJCh0aGlzKTtcclxuICAgICAgdmFyIGNhbnZhc0VsZW1lbnRJZCA9ICdjeS1ub2RlLWVkZ2UtZWRpdGluZy1zdGFnZScgKyBzdGFnZUlkO1xyXG4gICAgICBzdGFnZUlkKys7XHJcbiAgICAgIHZhciAkY2FudmFzRWxlbWVudCA9ICQoJzxkaXYgaWQ9XCInICsgY2FudmFzRWxlbWVudElkICsgJ1wiPjwvZGl2PicpO1xyXG5cclxuICAgICAgaWYgKCRjb250YWluZXIuZmluZCgnIycgKyBjYW52YXNFbGVtZW50SWQpLmxlbmd0aCA8IDEpIHtcclxuICAgICAgICAkY29udGFpbmVyLmFwcGVuZCgkY2FudmFzRWxlbWVudCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8qIFxyXG4gICAgICAgIE1haW50YWluIGEgc2luZ2xlIEtvbnZhLnN0YWdlIG9iamVjdCB0aHJvdWdob3V0IHRoZSBhcHBsaWNhdGlvbiB0aGF0IHVzZXMgdGhpcyBleHRlbnNpb25cclxuICAgICAgICBzdWNoIGFzIE5ld3QuIFRoaXMgaXMgaW1wb3J0YW50IHNpbmNlIGhhdmluZyBkaWZmZXJlbnQgc3RhZ2VzIGNhdXNlcyB3ZWlyZCBiZWhhdmlvclxyXG4gICAgICAgIG9uIG90aGVyIGV4dGVuc2lvbnMgdGhhdCBhbHNvIHVzZSBLb252YSwgbGlrZSBub3QgbGlzdGVuaW5nIHRvIG1vdXNlIGNsaWNrcyBhbmQgc3VjaC5cclxuICAgICAgICBJZiB5b3UgYXJlIHNvbWVvbmUgdGhhdCBpcyBjcmVhdGluZyBhbiBleHRlbnNpb24gdGhhdCB1c2VzIEtvbnZhIGluIHRoZSBmdXR1cmUsIHlvdSBuZWVkIHRvXHJcbiAgICAgICAgYmUgY2FyZWZ1bCBhYm91dCBob3cgZXZlbnRzIHJlZ2lzdGVyLiBJZiB5b3UgdXNlIGEgZGlmZmVyZW50IHN0YWdlIGFsbW9zdCBjZXJ0YWlubHkgb25lXHJcbiAgICAgICAgb3IgYm90aCBvZiB0aGUgZXh0ZW5zaW9ucyB0aGF0IHVzZSB0aGUgc3RhZ2UgY3JlYXRlZCBiZWxvdyB3aWxsIGJyZWFrLlxyXG4gICAgICAqLyBcclxuICAgICAgdmFyIHN0YWdlO1xyXG4gICAgICBpZiAoS29udmEuc3RhZ2VzLmxlbmd0aCA8IHN0YWdlSWQpIHtcclxuICAgICAgICBzdGFnZSA9IG5ldyBLb252YS5TdGFnZSh7XHJcbiAgICAgICAgICBpZDogJ25vZGUtZWRnZS1lZGl0aW5nLXN0YWdlJyxcclxuICAgICAgICAgIGNvbnRhaW5lcjogY2FudmFzRWxlbWVudElkLCAgIC8vIGlkIG9mIGNvbnRhaW5lciA8ZGl2PlxyXG4gICAgICAgICAgd2lkdGg6ICRjb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgIGhlaWdodDogJGNvbnRhaW5lci5oZWlnaHQoKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIHN0YWdlID0gS29udmEuc3RhZ2VzW3N0YWdlSWQgLSAxXTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgdmFyIGNhbnZhcztcclxuICAgICAgaWYgKHN0YWdlLmdldENoaWxkcmVuKCkubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgIGNhbnZhcyA9IG5ldyBLb252YS5MYXllcigpO1xyXG4gICAgICAgIHN0YWdlLmFkZChjYW52YXMpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGNhbnZhcyA9IHN0YWdlLmdldENoaWxkcmVuKClbMF07XHJcbiAgICAgIH0gIFxyXG4gICAgICBcclxuICAgICAgdmFyIGFuY2hvck1hbmFnZXIgPSB7XHJcbiAgICAgICAgZWRnZTogdW5kZWZpbmVkLFxyXG4gICAgICAgIGVkZ2VUeXBlOiAnaW5jb25jbHVzaXZlJyxcclxuICAgICAgICBhbmNob3JzOiBbXSxcclxuICAgICAgICAvLyByZW1lbWJlcnMgdGhlIHRvdWNoZWQgYW5jaG9yIHRvIGF2b2lkIGNsZWFyaW5nIGl0IHdoZW4gZHJhZ2dpbmcgaGFwcGVuc1xyXG4gICAgICAgIHRvdWNoZWRBbmNob3I6IHVuZGVmaW5lZCxcclxuICAgICAgICAvLyByZW1lbWJlcnMgdGhlIGluZGV4IG9mIHRoZSBtb3ZpbmcgYW5jaG9yXHJcbiAgICAgICAgdG91Y2hlZEFuY2hvckluZGV4OiB1bmRlZmluZWQsXHJcbiAgICAgICAgYmluZExpc3RlbmVyczogZnVuY3Rpb24oYW5jaG9yKXtcclxuICAgICAgICAgIGFuY2hvci5vbihcIm1vdXNlZG93biB0b3VjaHN0YXJ0XCIsIHRoaXMuZU1vdXNlRG93bik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICB1bmJpbmRMaXN0ZW5lcnM6IGZ1bmN0aW9uKGFuY2hvcil7XHJcbiAgICAgICAgICBhbmNob3Iub2ZmKFwibW91c2Vkb3duIHRvdWNoc3RhcnRcIiwgdGhpcy5lTW91c2VEb3duKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIGdldHMgdHJpZ2dlciBvbiBjbGlja2luZyBvbiBjb250ZXh0IG1lbnVzLCB3aGlsZSBjeSBsaXN0ZW5lcnMgZG9uJ3QgZ2V0IHRyaWdnZXJlZFxyXG4gICAgICAgIC8vIGl0IGNhbiBjYXVzZSB3ZWlyZCBiZWhhdmlvdXIgaWYgbm90IGF3YXJlIG9mIHRoaXNcclxuICAgICAgICBlTW91c2VEb3duOiBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICAvLyBhbmNob3JNYW5hZ2VyLmVkZ2UudW5zZWxlY3QoKSB3b24ndCB3b3JrIHNvbWV0aW1lcyBpZiB0aGlzIHdhc24ndCBoZXJlXHJcbiAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG5cclxuICAgICAgICAgIC8vIGVNb3VzZURvd24oc2V0KSAtPiB0YXBkcmFnKHVzZWQpIC0+IGVNb3VzZVVwKHJlc2V0KVxyXG4gICAgICAgICAgYW5jaG9yVG91Y2hlZCA9IHRydWU7XHJcbiAgICAgICAgICBhbmNob3JNYW5hZ2VyLnRvdWNoZWRBbmNob3IgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICBtb3VzZU91dCA9IGZhbHNlO1xyXG4gICAgICAgICAgYW5jaG9yTWFuYWdlci5lZGdlLnVuc2VsZWN0KCk7XHJcblxyXG4gICAgICAgICAgLy8gcmVtZW1iZXIgc3RhdGUgYmVmb3JlIGNoYW5naW5nXHJcbiAgICAgICAgICB2YXIgd2VpZ2h0U3RyID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W2FuY2hvck1hbmFnZXIuZWRnZVR5cGVdWyd3ZWlnaHQnXTtcclxuICAgICAgICAgIHZhciBkaXN0YW5jZVN0ciA9IGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFthbmNob3JNYW5hZ2VyLmVkZ2VUeXBlXVsnZGlzdGFuY2UnXTtcclxuXHJcbiAgICAgICAgICB2YXIgZWRnZSA9IGFuY2hvck1hbmFnZXIuZWRnZTtcclxuICAgICAgICAgIG1vdmVBbmNob3JQYXJhbSA9IHtcclxuICAgICAgICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgICAgICAgdHlwZTogYW5jaG9yTWFuYWdlci5lZGdlVHlwZSxcclxuICAgICAgICAgICAgd2VpZ2h0czogZWRnZS5kYXRhKHdlaWdodFN0cikgPyBbXS5jb25jYXQoZWRnZS5kYXRhKHdlaWdodFN0cikpIDogW10sXHJcbiAgICAgICAgICAgIGRpc3RhbmNlczogZWRnZS5kYXRhKGRpc3RhbmNlU3RyKSA/IFtdLmNvbmNhdChlZGdlLmRhdGEoZGlzdGFuY2VTdHIpKSA6IFtdXHJcbiAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgIHR1cm5PZmZBY3RpdmVCZ0NvbG9yKCk7XHJcbiAgICAgICAgICBkaXNhYmxlR2VzdHVyZXMoKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY3kuYXV0b3VuZ3JhYmlmeSh0cnVlKTtcclxuXHJcbiAgICAgICAgICBjYW52YXMuZ2V0U3RhZ2UoKS5vbihcImNvbnRlbnRUb3VjaGVuZCBjb250ZW50TW91c2V1cFwiLCBhbmNob3JNYW5hZ2VyLmVNb3VzZVVwKTtcclxuICAgICAgICAgIGNhbnZhcy5nZXRTdGFnZSgpLm9uKFwiY29udGVudE1vdXNlb3V0XCIsIGFuY2hvck1hbmFnZXIuZU1vdXNlT3V0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIGdldHMgY2FsbGVkIGJlZm9yZSBjeS5vbigndGFwZW5kJylcclxuICAgICAgICBlTW91c2VVcDogZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgICAgLy8gd29uJ3QgYmUgY2FsbGVkIGlmIHRoZSBtb3VzZSBpcyByZWxlYXNlZCBvdXQgb2Ygc2NyZWVuXHJcbiAgICAgICAgICBhbmNob3JUb3VjaGVkID0gZmFsc2U7XHJcbiAgICAgICAgICBhbmNob3JNYW5hZ2VyLnRvdWNoZWRBbmNob3IgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBtb3VzZU91dCA9IGZhbHNlO1xyXG4gICAgICAgICAgYW5jaG9yTWFuYWdlci5lZGdlLnNlbGVjdCgpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICByZXNldEFjdGl2ZUJnQ29sb3IoKTtcclxuICAgICAgICAgIHJlc2V0R2VzdHVyZXMoKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLyogXHJcbiAgICAgICAgICAgKiBJTVBPUlRBTlRcclxuICAgICAgICAgICAqIEFueSBwcm9ncmFtbWF0aWMgY2FsbHMgdG8gLnNlbGVjdCgpLCAudW5zZWxlY3QoKSBhZnRlciB0aGlzIHN0YXRlbWVudCBhcmUgaWdub3JlZFxyXG4gICAgICAgICAgICogdW50aWwgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKSBpcyBjYWxsZWQgaW4gb25lIG9mIHRoZSBwcmV2aW91czpcclxuICAgICAgICAgICAqIFxyXG4gICAgICAgICAgICogY3kub24oJ3RhcHN0YXJ0JylcclxuICAgICAgICAgICAqIGFuY2hvci5vbignbW91c2Vkb3duIHRvdWNoc3RhcnQnKVxyXG4gICAgICAgICAgICogZG9jdW1lbnQub24oJ2tleWRvd24nKVxyXG4gICAgICAgICAgICogY3kub24oJ3RhcGRyYXAnKVxyXG4gICAgICAgICAgICogXHJcbiAgICAgICAgICAgKiBEb2Vzbid0IGFmZmVjdCBVWCwgYnV0IG1heSBjYXVzZSBjb25mdXNpbmcgYmVoYXZpb3VyIGlmIG5vdCBhd2FyZSBvZiB0aGlzIHdoZW4gY29kaW5nXHJcbiAgICAgICAgICAgKiBcclxuICAgICAgICAgICAqIFdoeSBpcyB0aGlzIGhlcmU/XHJcbiAgICAgICAgICAgKiBUaGlzIGlzIGltcG9ydGFudCB0byBrZWVwIGVkZ2VzIGZyb20gYmVpbmcgYXV0byBkZXNlbGVjdGVkIGZyb20gd29ya2luZ1xyXG4gICAgICAgICAgICogd2l0aCBhbmNob3JzIG91dCBvZiB0aGUgZWRnZSBib2R5IChmb3IgdW5idW5kbGVkIGJlemllciwgdGVjaG5pY2FsbHkgbm90IG5lY2Vzc2VyeSBmb3Igc2VnZW1lbnRzKS5cclxuICAgICAgICAgICAqIFxyXG4gICAgICAgICAgICogVGhlc2UgaXMgYW50aGVyIGN5LmF1dG9zZWxlY3RpZnkodHJ1ZSkgaW4gY3kub24oJ3RhcGVuZCcpIFxyXG4gICAgICAgICAgICogXHJcbiAgICAgICAgICAqLyBcclxuICAgICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICAgICAgICAgIGN5LmF1dG91bmdyYWJpZnkoZmFsc2UpO1xyXG5cclxuICAgICAgICAgIGNhbnZhcy5nZXRTdGFnZSgpLm9mZihcImNvbnRlbnRUb3VjaGVuZCBjb250ZW50TW91c2V1cFwiLCBhbmNob3JNYW5hZ2VyLmVNb3VzZVVwKTtcclxuICAgICAgICAgIGNhbnZhcy5nZXRTdGFnZSgpLm9mZihcImNvbnRlbnRNb3VzZW91dFwiLCBhbmNob3JNYW5hZ2VyLmVNb3VzZU91dCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBoYW5kbGUgbW91c2UgZ29pbmcgb3V0IG9mIGNhbnZhcyBcclxuICAgICAgICBlTW91c2VPdXQ6IGZ1bmN0aW9uIChldmVudCl7XHJcbiAgICAgICAgICBtb3VzZU91dCA9IHRydWU7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbGVhckFuY2hvcnNFeGNlcHQ6IGZ1bmN0aW9uKGRvbnRDbGVhbiA9IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICB2YXIgZXhjZXB0aW9uQXBwbGllcyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIHRoaXMuYW5jaG9ycy5mb3JFYWNoKChhbmNob3IsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGRvbnRDbGVhbiAmJiBhbmNob3IgPT09IGRvbnRDbGVhbil7XHJcbiAgICAgICAgICAgICAgZXhjZXB0aW9uQXBwbGllcyA9IHRydWU7IC8vIHRoZSBkb250Q2xlYW4gYW5jaG9yIGlzIG5vdCBjbGVhcmVkXHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVuYmluZExpc3RlbmVycyhhbmNob3IpO1xyXG4gICAgICAgICAgICBhbmNob3IuZGVzdHJveSgpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgaWYoZXhjZXB0aW9uQXBwbGllcyl7XHJcbiAgICAgICAgICAgIHRoaXMuYW5jaG9ycyA9IFtkb250Q2xlYW5dO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYW5jaG9ycyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmVkZ2UgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIHRoaXMuZWRnZVR5cGUgPSAnaW5jb25jbHVzaXZlJztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIHJlbmRlciB0aGUgYmVuZCBhbmQgY29udHJvbCBzaGFwZXMgb2YgdGhlIGdpdmVuIGVkZ2VcclxuICAgICAgICByZW5kZXJBbmNob3JTaGFwZXM6IGZ1bmN0aW9uKGVkZ2UpIHtcclxuICAgICAgICAgIHRoaXMuZWRnZSA9IGVkZ2U7XHJcbiAgICAgICAgICB0aGlzLmVkZ2VUeXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgICAgICAgaWYoIWVkZ2UuaGFzQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJykgJiZcclxuICAgICAgICAgICAgICAhZWRnZS5oYXNDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHZhciBhbmNob3JMaXN0ID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSk7Ly9lZGdlLl9wcml2YXRlLnJkYXRhLnNlZ3B0cztcclxuICAgICAgICAgIHZhciBsZW5ndGggPSBnZXRBbmNob3JTaGFwZXNMZW5ndGgoZWRnZSkgKiAwLjY1O1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB2YXIgc3JjUG9zID0gZWRnZS5zb3VyY2UoKS5wb3NpdGlvbigpO1xyXG4gICAgICAgICAgdmFyIHRndFBvcyA9IGVkZ2UudGFyZ2V0KCkucG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgICBmb3IodmFyIGkgPSAwOyBhbmNob3JMaXN0ICYmIGkgPCBhbmNob3JMaXN0Lmxlbmd0aDsgaSA9IGkgKyAyKXtcclxuICAgICAgICAgICAgdmFyIGFuY2hvclggPSBhbmNob3JMaXN0W2ldO1xyXG4gICAgICAgICAgICB2YXIgYW5jaG9yWSA9IGFuY2hvckxpc3RbaSArIDFdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5yZW5kZXJBbmNob3JTaGFwZShhbmNob3JYLCBhbmNob3JZLCBsZW5ndGgpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGNhbnZhcy5kcmF3KCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyByZW5kZXIgYSBhbmNob3Igc2hhcGUgd2l0aCB0aGUgZ2l2ZW4gcGFyYW1ldGVyc1xyXG4gICAgICAgIHJlbmRlckFuY2hvclNoYXBlOiBmdW5jdGlvbihhbmNob3JYLCBhbmNob3JZLCBsZW5ndGgpIHtcclxuICAgICAgICAgIC8vIGdldCB0aGUgdG9wIGxlZnQgY29vcmRpbmF0ZXNcclxuICAgICAgICAgIHZhciB0b3BMZWZ0WCA9IGFuY2hvclggLSBsZW5ndGggLyAyO1xyXG4gICAgICAgICAgdmFyIHRvcExlZnRZID0gYW5jaG9yWSAtIGxlbmd0aCAvIDI7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIGNvbnZlcnQgdG8gcmVuZGVyZWQgcGFyYW1ldGVyc1xyXG4gICAgICAgICAgdmFyIHJlbmRlcmVkVG9wTGVmdFBvcyA9IGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24oe3g6IHRvcExlZnRYLCB5OiB0b3BMZWZ0WX0pO1xyXG4gICAgICAgICAgbGVuZ3RoICo9IGN5Lnpvb20oKTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgdmFyIG5ld0FuY2hvciA9IG5ldyBLb252YS5SZWN0KHtcclxuICAgICAgICAgICAgeDogcmVuZGVyZWRUb3BMZWZ0UG9zLngsXHJcbiAgICAgICAgICAgIHk6IHJlbmRlcmVkVG9wTGVmdFBvcy55LFxyXG4gICAgICAgICAgICB3aWR0aDogbGVuZ3RoLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGxlbmd0aCxcclxuICAgICAgICAgICAgZmlsbDogJ2JsYWNrJyxcclxuICAgICAgICAgICAgc3Ryb2tlV2lkdGg6IDAsXHJcbiAgICAgICAgICAgIGRyYWdnYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgdGhpcy5hbmNob3JzLnB1c2gobmV3QW5jaG9yKTtcclxuICAgICAgICAgIHRoaXMuYmluZExpc3RlbmVycyhuZXdBbmNob3IpO1xyXG4gICAgICAgICAgY2FudmFzLmFkZChuZXdBbmNob3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIHZhciBjeHRBZGRCZW5kRmNuID0gZnVuY3Rpb24oZXZlbnQpe1xyXG4gICAgICAgIGN4dEFkZEFuY2hvckZjbihldmVudCwgJ2JlbmQnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGN4dEFkZENvbnRyb2xGY24gPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGN4dEFkZEFuY2hvckZjbihldmVudCwgJ2NvbnRyb2wnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGN4dEFkZEFuY2hvckZjbiA9IGZ1bmN0aW9uIChldmVudCwgYW5jaG9yVHlwZSkge1xyXG4gICAgICAgIHZhciBlZGdlID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgIGlmKCFhbmNob3JQb2ludFV0aWxpdGllcy5pc0lnbm9yZWRFZGdlKGVkZ2UpKSB7XHJcblxyXG4gICAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgICAgICAgIHZhciB3ZWlnaHRzLCBkaXN0YW5jZXMsIHdlaWdodFN0ciwgZGlzdGFuY2VTdHI7XHJcblxyXG4gICAgICAgICAgaWYodHlwZSA9PT0gJ2luY29uY2x1c2l2ZScpe1xyXG4gICAgICAgICAgICB3ZWlnaHRzID0gW107XHJcbiAgICAgICAgICAgIGRpc3RhbmNlcyA9IFtdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgd2VpZ2h0U3RyID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXTtcclxuICAgICAgICAgICAgZGlzdGFuY2VTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ107XHJcblxyXG4gICAgICAgICAgICB3ZWlnaHRzID0gZWRnZS5kYXRhKHdlaWdodFN0cikgPyBbXS5jb25jYXQoZWRnZS5kYXRhKHdlaWdodFN0cikpIDogZWRnZS5kYXRhKHdlaWdodFN0cik7XHJcbiAgICAgICAgICAgIGRpc3RhbmNlcyA9IGVkZ2UuZGF0YShkaXN0YW5jZVN0cikgPyBbXS5jb25jYXQoZWRnZS5kYXRhKGRpc3RhbmNlU3RyKSkgOiBlZGdlLmRhdGEoZGlzdGFuY2VTdHIpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBwYXJhbSA9IHtcclxuICAgICAgICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgd2VpZ2h0czogd2VpZ2h0cyxcclxuICAgICAgICAgICAgZGlzdGFuY2VzOiBkaXN0YW5jZXNcclxuICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgLy8gdGhlIHVuZGVmaW5lZCBnbyBmb3IgZWRnZSBhbmQgbmV3QW5jaG9yUG9pbnQgcGFyYW1ldGVyc1xyXG4gICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuYWRkQW5jaG9yUG9pbnQodW5kZWZpbmVkLCB1bmRlZmluZWQsIGFuY2hvclR5cGUpO1xyXG5cclxuICAgICAgICAgIGlmIChvcHRpb25zKCkudW5kb2FibGUpIHtcclxuICAgICAgICAgICAgY3kudW5kb1JlZG8oKS5kbygnY2hhbmdlQW5jaG9yUG9pbnRzJywgcGFyYW0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVmcmVzaERyYXdzKCk7XHJcbiAgICAgICAgZWRnZS5zZWxlY3QoKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIHZhciBjeHRSZW1vdmVBbmNob3JGY24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICB2YXIgZWRnZSA9IGFuY2hvck1hbmFnZXIuZWRnZTtcclxuICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG5cclxuICAgICAgICBpZihhbmNob3JQb2ludFV0aWxpdGllcy5lZGdlVHlwZUluY29uY2x1c2l2ZVNob3VsZG50SGFwcGVuKHR5cGUsIFwiVWlVdGlsaXRpZXMuanMsIGN4dFJlbW92ZUFuY2hvckZjblwiKSl7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcGFyYW0gPSB7XHJcbiAgICAgICAgICBlZGdlOiBlZGdlLFxyXG4gICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgIHdlaWdodHM6IFtdLmNvbmNhdChlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSkpLFxyXG4gICAgICAgICAgZGlzdGFuY2VzOiBbXS5jb25jYXQoZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXSkpXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMucmVtb3ZlQW5jaG9yKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYob3B0aW9ucygpLnVuZG9hYmxlKSB7XHJcbiAgICAgICAgICBjeS51bmRvUmVkbygpLmRvKCdjaGFuZ2VBbmNob3JQb2ludHMnLCBwYXJhbSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtyZWZyZXNoRHJhd3MoKTtlZGdlLnNlbGVjdCgpO30sIDUwKSA7XHJcblxyXG4gICAgICB9O1xyXG5cclxuICAgICAgdmFyIGN4dFJlbW92ZUFsbEFuY2hvcnNGY24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICB2YXIgZWRnZSA9IGFuY2hvck1hbmFnZXIuZWRnZTtcclxuICAgICAgICB2YXIgdHlwZSA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEVkZ2VUeXBlKGVkZ2UpO1xyXG4gICAgICAgIHZhciBwYXJhbSA9IHtcclxuICAgICAgICAgIGVkZ2U6IGVkZ2UsXHJcbiAgICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgICAgd2VpZ2h0czogW10uY29uY2F0KGVkZ2UuZGF0YShhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddKSksXHJcbiAgICAgICAgICBkaXN0YW5jZXM6IFtdLmNvbmNhdChlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWydkaXN0YW5jZSddKSlcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLnJlbW92ZUFsbEFuY2hvcnMoKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMoKS51bmRvYWJsZSkge1xyXG4gICAgICAgICAgY3kudW5kb1JlZG8oKS5kbygnY2hhbmdlQW5jaG9yUG9pbnRzJywgcGFyYW0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7cmVmcmVzaERyYXdzKCk7ZWRnZS5zZWxlY3QoKTt9LCA1MCk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIGZ1bmN0aW9uIHRvIHJlY29ubmVjdCBlZGdlXHJcbiAgICAgIHZhciBoYW5kbGVSZWNvbm5lY3RFZGdlID0gb3B0cy5oYW5kbGVSZWNvbm5lY3RFZGdlO1xyXG4gICAgICAvLyBmdW5jdGlvbiB0byB2YWxpZGF0ZSBlZGdlIHNvdXJjZSBhbmQgdGFyZ2V0IG9uIHJlY29ubmVjdGlvblxyXG4gICAgICB2YXIgdmFsaWRhdGVFZGdlID0gb3B0cy52YWxpZGF0ZUVkZ2U7IFxyXG4gICAgICAvLyBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gaW52YWxpZCBlZGdlIHJlY29ubmVjdGlvblxyXG4gICAgICB2YXIgYWN0T25VbnN1Y2Nlc3NmdWxSZWNvbm5lY3Rpb24gPSBvcHRzLmFjdE9uVW5zdWNjZXNzZnVsUmVjb25uZWN0aW9uO1xyXG4gICAgICBcclxuICAgICAgdmFyIG1lbnVJdGVtcyA9IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpZDogYWRkQmVuZFBvaW50Q3h0TWVudUlkLFxyXG4gICAgICAgICAgY29udGVudDogb3B0cy5hZGRCZW5kTWVudUl0ZW1UaXRsZSxcclxuICAgICAgICAgIHNlbGVjdG9yOiAnZWRnZScsXHJcbiAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IGN4dEFkZEJlbmRGY25cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGlkOiByZW1vdmVCZW5kUG9pbnRDeHRNZW51SWQsXHJcbiAgICAgICAgICBjb250ZW50OiBvcHRzLnJlbW92ZUJlbmRNZW51SXRlbVRpdGxlLFxyXG4gICAgICAgICAgc2VsZWN0b3I6ICdlZGdlJyxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0UmVtb3ZlQW5jaG9yRmNuXHJcbiAgICAgICAgfSwgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IHJlbW92ZUFsbEJlbmRQb2ludEN0eE1lbnVJZCxcclxuICAgICAgICAgIGNvbnRlbnQ6IG9wdHMucmVtb3ZlQWxsQmVuZE1lbnVJdGVtVGl0bGUsXHJcbiAgICAgICAgICBzZWxlY3Rvcjogb3B0cy5lbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb24gJiYgJzpzZWxlY3RlZC5lZGdlYmVuZGVkaXRpbmctaGFzbXVsdGlwbGViZW5kcG9pbnRzJyxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0UmVtb3ZlQWxsQW5jaG9yc0ZjblxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCxcclxuICAgICAgICAgIGNvbnRlbnQ6IG9wdHMuYWRkQ29udHJvbE1lbnVJdGVtVGl0bGUsXHJcbiAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgY29yZUFzV2VsbDogdHJ1ZSxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0QWRkQ29udHJvbEZjblxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IHJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCxcclxuICAgICAgICAgIGNvbnRlbnQ6IG9wdHMucmVtb3ZlQ29udHJvbE1lbnVJdGVtVGl0bGUsXHJcbiAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgY29yZUFzV2VsbDogdHJ1ZSxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0UmVtb3ZlQW5jaG9yRmNuXHJcbiAgICAgICAgfSwgXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgaWQ6IHJlbW92ZUFsbENvbnRyb2xQb2ludEN0eE1lbnVJZCxcclxuICAgICAgICAgIGNvbnRlbnQ6IG9wdHMucmVtb3ZlQWxsQ29udHJvbE1lbnVJdGVtVGl0bGUsXHJcbiAgICAgICAgICBzZWxlY3Rvcjogb3B0cy5lbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb24gJiYgJzpzZWxlY3RlZC5lZGdlY29udHJvbGVkaXRpbmctaGFzbXVsdGlwbGVjb250cm9scG9pbnRzJyxcclxuICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogY3h0UmVtb3ZlQWxsQW5jaG9yc0ZjblxyXG4gICAgICAgIH0sXHJcbiAgICAgIF07XHJcbiAgICAgIFxyXG4gICAgICBpZihjeS5jb250ZXh0TWVudXMpIHtcclxuICAgICAgICB2YXIgbWVudXMgPSBjeS5jb250ZXh0TWVudXMoJ2dldCcpO1xyXG4gICAgICAgIC8vIElmIGNvbnRleHQgbWVudXMgaXMgYWN0aXZlIGp1c3QgYXBwZW5kIG1lbnUgaXRlbXMgZWxzZSBhY3RpdmF0ZSB0aGUgZXh0ZW5zaW9uXHJcbiAgICAgICAgLy8gd2l0aCBpbml0aWFsIG1lbnUgaXRlbXNcclxuICAgICAgICBpZiAobWVudXMuaXNBY3RpdmUoKSkge1xyXG4gICAgICAgICAgbWVudXMuYXBwZW5kTWVudUl0ZW1zKG1lbnVJdGVtcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY3kuY29udGV4dE1lbnVzKHtcclxuICAgICAgICAgICAgbWVudUl0ZW1zOiBtZW51SXRlbXNcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgdmFyIF9zaXplQ2FudmFzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRjYW52YXNFbGVtZW50XHJcbiAgICAgICAgICAuYXR0cignaGVpZ2h0JywgJGNvbnRhaW5lci5oZWlnaHQoKSlcclxuICAgICAgICAgIC5hdHRyKCd3aWR0aCcsICRjb250YWluZXIud2lkdGgoKSlcclxuICAgICAgICAgIC5jc3Moe1xyXG4gICAgICAgICAgICAncG9zaXRpb24nOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICAndG9wJzogMCxcclxuICAgICAgICAgICAgJ2xlZnQnOiAwLFxyXG4gICAgICAgICAgICAnei1pbmRleCc6IG9wdGlvbnMoKS56SW5kZXhcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBjYW52YXNCYiA9ICRjYW52YXNFbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgICAgdmFyIGNvbnRhaW5lckJiID0gJGNvbnRhaW5lci5vZmZzZXQoKTtcclxuXHJcbiAgICAgICAgICAkY2FudmFzRWxlbWVudFxyXG4gICAgICAgICAgICAuY3NzKHtcclxuICAgICAgICAgICAgICAndG9wJzogLShjYW52YXNCYi50b3AgLSBjb250YWluZXJCYi50b3ApLFxyXG4gICAgICAgICAgICAgICdsZWZ0JzogLShjYW52YXNCYi5sZWZ0IC0gY29udGFpbmVyQmIubGVmdClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgIDtcclxuXHJcbiAgICAgICAgICBjYW52YXMuZ2V0U3RhZ2UoKS5zZXRXaWR0aCgkY29udGFpbmVyLndpZHRoKCkpO1xyXG4gICAgICAgICAgY2FudmFzLmdldFN0YWdlKCkuc2V0SGVpZ2h0KCRjb250YWluZXIuaGVpZ2h0KCkpO1xyXG5cclxuICAgICAgICAgIC8vIHJlZHJhdyBvbiBjYW52YXMgcmVzaXplXHJcbiAgICAgICAgICBpZihjeSl7XHJcbiAgICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIDApO1xyXG5cclxuICAgICAgfSwgMjUwKTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIHNpemVDYW52YXMoKSB7XHJcbiAgICAgICAgX3NpemVDYW52YXMoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgc2l6ZUNhbnZhcygpO1xyXG5cclxuICAgICAgJCh3aW5kb3cpLmJpbmQoJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBzaXplQ2FudmFzKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBcclxuICAgICAgLy8gd3JpdGUgb3B0aW9ucyB0byBkYXRhXHJcbiAgICAgIHZhciBkYXRhID0gJGNvbnRhaW5lci5kYXRhKCdjeWVkZ2VlZGl0aW5nJyk7XHJcbiAgICAgIGlmIChkYXRhID09IG51bGwpIHtcclxuICAgICAgICBkYXRhID0ge307XHJcbiAgICAgIH1cclxuICAgICAgZGF0YS5vcHRpb25zID0gb3B0cztcclxuXHJcbiAgICAgIHZhciBvcHRDYWNoZTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIG9wdGlvbnMoKSB7XHJcbiAgICAgICAgcmV0dXJuIG9wdENhY2hlIHx8IChvcHRDYWNoZSA9ICRjb250YWluZXIuZGF0YSgnY3llZGdlZWRpdGluZycpLm9wdGlvbnMpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB3ZSB3aWxsIG5lZWQgdG8gY29udmVydCBtb2RlbCBwb3NpdG9ucyB0byByZW5kZXJlZCBwb3NpdGlvbnNcclxuICAgICAgZnVuY3Rpb24gY29udmVydFRvUmVuZGVyZWRQb3NpdGlvbihtb2RlbFBvc2l0aW9uKSB7XHJcbiAgICAgICAgdmFyIHBhbiA9IGN5LnBhbigpO1xyXG4gICAgICAgIHZhciB6b29tID0gY3kuem9vbSgpO1xyXG5cclxuICAgICAgICB2YXIgeCA9IG1vZGVsUG9zaXRpb24ueCAqIHpvb20gKyBwYW4ueDtcclxuICAgICAgICB2YXIgeSA9IG1vZGVsUG9zaXRpb24ueSAqIHpvb20gKyBwYW4ueTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHg6IHgsXHJcbiAgICAgICAgICB5OiB5XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgZnVuY3Rpb24gcmVmcmVzaERyYXdzKCkge1xyXG5cclxuICAgICAgICAvLyBkb24ndCBjbGVhciBhbmNob3Igd2hpY2ggaXMgYmVpbmcgbW92ZWRcclxuICAgICAgICBhbmNob3JNYW5hZ2VyLmNsZWFyQW5jaG9yc0V4Y2VwdChhbmNob3JNYW5hZ2VyLnRvdWNoZWRBbmNob3IpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGVuZHBvaW50U2hhcGUxICE9PSBudWxsKXtcclxuICAgICAgICAgIGVuZHBvaW50U2hhcGUxLmRlc3Ryb3koKTtcclxuICAgICAgICAgIGVuZHBvaW50U2hhcGUxID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZW5kcG9pbnRTaGFwZTIgIT09IG51bGwpe1xyXG4gICAgICAgICAgZW5kcG9pbnRTaGFwZTIuZGVzdHJveSgpO1xyXG4gICAgICAgICAgZW5kcG9pbnRTaGFwZTIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYW52YXMuZHJhdygpO1xyXG5cclxuICAgICAgICBpZiggZWRnZVRvSGlnaGxpZ2h0ICkge1xyXG4gICAgICAgICAgYW5jaG9yTWFuYWdlci5yZW5kZXJBbmNob3JTaGFwZXMoZWRnZVRvSGlnaGxpZ2h0KTtcclxuICAgICAgICAgIHJlbmRlckVuZFBvaW50U2hhcGVzKGVkZ2VUb0hpZ2hsaWdodCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICAvLyByZW5kZXIgdGhlIGVuZCBwb2ludHMgc2hhcGVzIG9mIHRoZSBnaXZlbiBlZGdlXHJcbiAgICAgIGZ1bmN0aW9uIHJlbmRlckVuZFBvaW50U2hhcGVzKGVkZ2UpIHtcclxuICAgICAgICBpZighZWRnZSl7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZWRnZV9wdHMgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRBbmNob3JzQXNBcnJheShlZGdlKTtcclxuICAgICAgICBpZih0eXBlb2YgZWRnZV9wdHMgPT09ICd1bmRlZmluZWQnKXtcclxuICAgICAgICAgIGVkZ2VfcHRzID0gW107XHJcbiAgICAgICAgfSAgICAgICBcclxuICAgICAgICB2YXIgc291cmNlUG9zID0gZWRnZS5zb3VyY2VFbmRwb2ludCgpO1xyXG4gICAgICAgIHZhciB0YXJnZXRQb3MgPSBlZGdlLnRhcmdldEVuZHBvaW50KCk7XHJcbiAgICAgICAgZWRnZV9wdHMudW5zaGlmdChzb3VyY2VQb3MueSk7XHJcbiAgICAgICAgZWRnZV9wdHMudW5zaGlmdChzb3VyY2VQb3MueCk7XHJcbiAgICAgICAgZWRnZV9wdHMucHVzaCh0YXJnZXRQb3MueCk7XHJcbiAgICAgICAgZWRnZV9wdHMucHVzaCh0YXJnZXRQb3MueSk7IFxyXG5cclxuICAgICAgIFxyXG4gICAgICAgIGlmKCFlZGdlX3B0cylcclxuICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIHNyYyA9IHtcclxuICAgICAgICAgIHg6IGVkZ2VfcHRzWzBdLFxyXG4gICAgICAgICAgeTogZWRnZV9wdHNbMV1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciB0YXJnZXQgPSB7XHJcbiAgICAgICAgICB4OiBlZGdlX3B0c1tlZGdlX3B0cy5sZW5ndGgtMl0sXHJcbiAgICAgICAgICB5OiBlZGdlX3B0c1tlZGdlX3B0cy5sZW5ndGgtMV1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBuZXh0VG9Tb3VyY2UgPSB7XHJcbiAgICAgICAgICB4OiBlZGdlX3B0c1syXSxcclxuICAgICAgICAgIHk6IGVkZ2VfcHRzWzNdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBuZXh0VG9UYXJnZXQgPSB7XHJcbiAgICAgICAgICB4OiBlZGdlX3B0c1tlZGdlX3B0cy5sZW5ndGgtNF0sXHJcbiAgICAgICAgICB5OiBlZGdlX3B0c1tlZGdlX3B0cy5sZW5ndGgtM11cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IGdldEFuY2hvclNoYXBlc0xlbmd0aChlZGdlKSAqIDAuNjU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmVuZGVyRWFjaEVuZFBvaW50U2hhcGUoc3JjLCB0YXJnZXQsIGxlbmd0aCxuZXh0VG9Tb3VyY2UsbmV4dFRvVGFyZ2V0KTtcclxuICAgICAgICBcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gcmVuZGVyRWFjaEVuZFBvaW50U2hhcGUoc291cmNlLCB0YXJnZXQsIGxlbmd0aCxuZXh0VG9Tb3VyY2UsbmV4dFRvVGFyZ2V0KSB7XHJcbiAgICAgICAgLy8gZ2V0IHRoZSB0b3AgbGVmdCBjb29yZGluYXRlcyBvZiBzb3VyY2UgYW5kIHRhcmdldFxyXG4gICAgICAgIHZhciBzVG9wTGVmdFggPSBzb3VyY2UueCAtIGxlbmd0aCAvIDI7XHJcbiAgICAgICAgdmFyIHNUb3BMZWZ0WSA9IHNvdXJjZS55IC0gbGVuZ3RoIC8gMjtcclxuXHJcbiAgICAgICAgdmFyIHRUb3BMZWZ0WCA9IHRhcmdldC54IC0gbGVuZ3RoIC8gMjtcclxuICAgICAgICB2YXIgdFRvcExlZnRZID0gdGFyZ2V0LnkgLSBsZW5ndGggLyAyO1xyXG5cclxuICAgICAgICB2YXIgbmV4dFRvU291cmNlWCA9IG5leHRUb1NvdXJjZS54IC0gbGVuZ3RoIC8yO1xyXG4gICAgICAgIHZhciBuZXh0VG9Tb3VyY2VZID0gbmV4dFRvU291cmNlLnkgLSBsZW5ndGggLyAyO1xyXG5cclxuICAgICAgICB2YXIgbmV4dFRvVGFyZ2V0WCA9IG5leHRUb1RhcmdldC54IC0gbGVuZ3RoIC8yO1xyXG4gICAgICAgIHZhciBuZXh0VG9UYXJnZXRZID0gbmV4dFRvVGFyZ2V0LnkgLSBsZW5ndGggLzI7XHJcblxyXG5cclxuICAgICAgICAvLyBjb252ZXJ0IHRvIHJlbmRlcmVkIHBhcmFtZXRlcnNcclxuICAgICAgICB2YXIgcmVuZGVyZWRTb3VyY2VQb3MgPSBjb252ZXJ0VG9SZW5kZXJlZFBvc2l0aW9uKHt4OiBzVG9wTGVmdFgsIHk6IHNUb3BMZWZ0WX0pO1xyXG4gICAgICAgIHZhciByZW5kZXJlZFRhcmdldFBvcyA9IGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24oe3g6IHRUb3BMZWZ0WCwgeTogdFRvcExlZnRZfSk7XHJcbiAgICAgICAgbGVuZ3RoID0gbGVuZ3RoICogY3kuem9vbSgpIC8gMjtcclxuXHJcbiAgICAgICAgdmFyIHJlbmRlcmVkTmV4dFRvU291cmNlID0gY29udmVydFRvUmVuZGVyZWRQb3NpdGlvbih7eDogbmV4dFRvU291cmNlWCwgeTogbmV4dFRvU291cmNlWX0pO1xyXG4gICAgICAgIHZhciByZW5kZXJlZE5leHRUb1RhcmdldCA9IGNvbnZlcnRUb1JlbmRlcmVkUG9zaXRpb24oe3g6IG5leHRUb1RhcmdldFgsIHk6IG5leHRUb1RhcmdldFl9KTtcclxuICAgICAgICBcclxuICAgICAgICAvL2hvdyBmYXIgdG8gZ28gZnJvbSB0aGUgbm9kZSBhbG9uZyB0aGUgZWRnZVxyXG4gICAgICAgIHZhciBkaXN0YW5jZUZyb21Ob2RlID0gbGVuZ3RoO1xyXG5cclxuICAgICAgICB2YXIgZGlzdGFuY2VTb3VyY2UgPSBNYXRoLnNxcnQoTWF0aC5wb3cocmVuZGVyZWROZXh0VG9Tb3VyY2UueCAtIHJlbmRlcmVkU291cmNlUG9zLngsMikgKyBNYXRoLnBvdyhyZW5kZXJlZE5leHRUb1NvdXJjZS55IC0gcmVuZGVyZWRTb3VyY2VQb3MueSwyKSk7ICAgICAgICBcclxuICAgICAgICB2YXIgc291cmNlRW5kUG9pbnRYID0gcmVuZGVyZWRTb3VyY2VQb3MueCArICgoZGlzdGFuY2VGcm9tTm9kZS8gZGlzdGFuY2VTb3VyY2UpKiAocmVuZGVyZWROZXh0VG9Tb3VyY2UueCAtIHJlbmRlcmVkU291cmNlUG9zLngpKTtcclxuICAgICAgICB2YXIgc291cmNlRW5kUG9pbnRZID0gcmVuZGVyZWRTb3VyY2VQb3MueSArICgoZGlzdGFuY2VGcm9tTm9kZS8gZGlzdGFuY2VTb3VyY2UpKiAocmVuZGVyZWROZXh0VG9Tb3VyY2UueSAtIHJlbmRlcmVkU291cmNlUG9zLnkpKTtcclxuXHJcblxyXG4gICAgICAgIHZhciBkaXN0YW5jZVRhcmdldCA9IE1hdGguc3FydChNYXRoLnBvdyhyZW5kZXJlZE5leHRUb1RhcmdldC54IC0gcmVuZGVyZWRUYXJnZXRQb3MueCwyKSArIE1hdGgucG93KHJlbmRlcmVkTmV4dFRvVGFyZ2V0LnkgLSByZW5kZXJlZFRhcmdldFBvcy55LDIpKTsgICAgICAgIFxyXG4gICAgICAgIHZhciB0YXJnZXRFbmRQb2ludFggPSByZW5kZXJlZFRhcmdldFBvcy54ICsgKChkaXN0YW5jZUZyb21Ob2RlLyBkaXN0YW5jZVRhcmdldCkqIChyZW5kZXJlZE5leHRUb1RhcmdldC54IC0gcmVuZGVyZWRUYXJnZXRQb3MueCkpO1xyXG4gICAgICAgIHZhciB0YXJnZXRFbmRQb2ludFkgPSByZW5kZXJlZFRhcmdldFBvcy55ICsgKChkaXN0YW5jZUZyb21Ob2RlLyBkaXN0YW5jZVRhcmdldCkqIChyZW5kZXJlZE5leHRUb1RhcmdldC55IC0gcmVuZGVyZWRUYXJnZXRQb3MueSkpOyBcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyIGVuZCBwb2ludCBzaGFwZSBmb3Igc291cmNlIGFuZCB0YXJnZXRcclxuICAgICAgICAvLyB0aGUgbnVsbCBjaGVja3MgYXJlIG5vdCB0aGVvcmV0aWNhbGx5IHJlcXVpcmVkXHJcbiAgICAgICAgLy8gYnV0IHRoZXkgcHJvdGVjdCBmcm9tIGJhZCBzeW5jaHJvbmlvdXMgY2FsbHMgb2YgcmVmcmVzaERyYXdzKClcclxuICAgICAgICBpZihlbmRwb2ludFNoYXBlMSA9PT0gbnVsbCl7XHJcbiAgICAgICAgICBlbmRwb2ludFNoYXBlMSA9IG5ldyBLb252YS5DaXJjbGUoe1xyXG4gICAgICAgICAgICB4OiBzb3VyY2VFbmRQb2ludFggKyBsZW5ndGgsXHJcbiAgICAgICAgICAgIHk6IHNvdXJjZUVuZFBvaW50WSArIGxlbmd0aCxcclxuICAgICAgICAgICAgcmFkaXVzOiBsZW5ndGgsXHJcbiAgICAgICAgICAgIGZpbGw6ICdibGFjaycsXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGVuZHBvaW50U2hhcGUyID09PSBudWxsKXtcclxuICAgICAgICAgIGVuZHBvaW50U2hhcGUyID0gbmV3IEtvbnZhLkNpcmNsZSh7XHJcbiAgICAgICAgICAgIHg6IHRhcmdldEVuZFBvaW50WCArIGxlbmd0aCxcclxuICAgICAgICAgICAgeTogdGFyZ2V0RW5kUG9pbnRZICsgbGVuZ3RoLFxyXG4gICAgICAgICAgICByYWRpdXM6IGxlbmd0aCxcclxuICAgICAgICAgICAgZmlsbDogJ2JsYWNrJyxcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2FudmFzLmFkZChlbmRwb2ludFNoYXBlMSk7XHJcbiAgICAgICAgY2FudmFzLmFkZChlbmRwb2ludFNoYXBlMik7XHJcbiAgICAgICAgY2FudmFzLmRyYXcoKTtcclxuICAgICAgICBcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZ2V0IHRoZSBsZW5ndGggb2YgYW5jaG9yIHBvaW50cyB0byBiZSByZW5kZXJlZFxyXG4gICAgICBmdW5jdGlvbiBnZXRBbmNob3JTaGFwZXNMZW5ndGgoZWRnZSkge1xyXG4gICAgICAgIHZhciBmYWN0b3IgPSBvcHRpb25zKCkuYW5jaG9yU2hhcGVTaXplRmFjdG9yO1xyXG4gICAgICAgIGlmIChwYXJzZUZsb2F0KGVkZ2UuY3NzKCd3aWR0aCcpKSA8PSAyLjUpXHJcbiAgICAgICAgICByZXR1cm4gMi41ICogZmFjdG9yO1xyXG4gICAgICAgIGVsc2UgcmV0dXJuIHBhcnNlRmxvYXQoZWRnZS5jc3MoJ3dpZHRoJykpKmZhY3RvcjtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLy8gY2hlY2sgaWYgdGhlIGFuY2hvciByZXByZXNlbnRlZCBieSB7eCwgeX0gaXMgaW5zaWRlIHRoZSBwb2ludCBzaGFwZVxyXG4gICAgICBmdW5jdGlvbiBjaGVja0lmSW5zaWRlU2hhcGUoeCwgeSwgbGVuZ3RoLCBjZW50ZXJYLCBjZW50ZXJZKXtcclxuICAgICAgICB2YXIgbWluWCA9IGNlbnRlclggLSBsZW5ndGggLyAyO1xyXG4gICAgICAgIHZhciBtYXhYID0gY2VudGVyWCArIGxlbmd0aCAvIDI7XHJcbiAgICAgICAgdmFyIG1pblkgPSBjZW50ZXJZIC0gbGVuZ3RoIC8gMjtcclxuICAgICAgICB2YXIgbWF4WSA9IGNlbnRlclkgKyBsZW5ndGggLyAyO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBpbnNpZGUgPSAoeCA+PSBtaW5YICYmIHggPD0gbWF4WCkgJiYgKHkgPj0gbWluWSAmJiB5IDw9IG1heFkpO1xyXG4gICAgICAgIHJldHVybiBpbnNpZGU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGdldCB0aGUgaW5kZXggb2YgYW5jaG9yIGNvbnRhaW5pbmcgdGhlIHBvaW50IHJlcHJlc2VudGVkIGJ5IHt4LCB5fVxyXG4gICAgICBmdW5jdGlvbiBnZXRDb250YWluaW5nU2hhcGVJbmRleCh4LCB5LCBlZGdlKSB7XHJcbiAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuXHJcbiAgICAgICAgaWYodHlwZSA9PT0gJ2luY29uY2x1c2l2ZScpe1xyXG4gICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J10pID09IG51bGwgfHwgXHJcbiAgICAgICAgICBlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSkubGVuZ3RoID09IDApe1xyXG4gICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGFuY2hvckxpc3QgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRBbmNob3JzQXNBcnJheShlZGdlKTsvL2VkZ2UuX3ByaXZhdGUucmRhdGEuc2VncHRzO1xyXG4gICAgICAgIHZhciBsZW5ndGggPSBnZXRBbmNob3JTaGFwZXNMZW5ndGgoZWRnZSk7XHJcblxyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGFuY2hvckxpc3QgJiYgaSA8IGFuY2hvckxpc3QubGVuZ3RoOyBpID0gaSArIDIpe1xyXG4gICAgICAgICAgdmFyIGFuY2hvclggPSBhbmNob3JMaXN0W2ldO1xyXG4gICAgICAgICAgdmFyIGFuY2hvclkgPSBhbmNob3JMaXN0W2kgKyAxXTtcclxuXHJcbiAgICAgICAgICB2YXIgaW5zaWRlID0gY2hlY2tJZkluc2lkZVNoYXBlKHgsIHksIGxlbmd0aCwgYW5jaG9yWCwgYW5jaG9yWSk7XHJcbiAgICAgICAgICBpZihpbnNpZGUpe1xyXG4gICAgICAgICAgICByZXR1cm4gaSAvIDI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBmdW5jdGlvbiBnZXRDb250YWluaW5nRW5kUG9pbnQoeCwgeSwgZWRnZSl7XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IGdldEFuY2hvclNoYXBlc0xlbmd0aChlZGdlKTtcclxuICAgICAgICB2YXIgYWxsUHRzID0gZWRnZS5fcHJpdmF0ZS5yc2NyYXRjaC5hbGxwdHM7XHJcbiAgICAgICAgdmFyIHNyYyA9IHtcclxuICAgICAgICAgIHg6IGFsbFB0c1swXSxcclxuICAgICAgICAgIHk6IGFsbFB0c1sxXVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdGFyZ2V0ID0ge1xyXG4gICAgICAgICAgeDogYWxsUHRzW2FsbFB0cy5sZW5ndGgtMl0sXHJcbiAgICAgICAgICB5OiBhbGxQdHNbYWxsUHRzLmxlbmd0aC0xXVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb252ZXJ0VG9SZW5kZXJlZFBvc2l0aW9uKHNyYyk7XHJcbiAgICAgICAgY29udmVydFRvUmVuZGVyZWRQb3NpdGlvbih0YXJnZXQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFNvdXJjZTowLCBUYXJnZXQ6MSwgTm9uZTotMVxyXG4gICAgICAgIGlmKGNoZWNrSWZJbnNpZGVTaGFwZSh4LCB5LCBsZW5ndGgsIHNyYy54LCBzcmMueSkpXHJcbiAgICAgICAgICByZXR1cm4gMDtcclxuICAgICAgICBlbHNlIGlmKGNoZWNrSWZJbnNpZGVTaGFwZSh4LCB5LCBsZW5ndGgsIHRhcmdldC54LCB0YXJnZXQueSkpXHJcbiAgICAgICAgICByZXR1cm4gMTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICByZXR1cm4gLTE7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIHN0b3JlIHRoZSBjdXJyZW50IHN0YXR1cyBvZiBnZXN0dXJlcyBhbmQgc2V0IHRoZW0gdG8gZmFsc2VcclxuICAgICAgZnVuY3Rpb24gZGlzYWJsZUdlc3R1cmVzKCkge1xyXG4gICAgICAgIGxhc3RQYW5uaW5nRW5hYmxlZCA9IGN5LnBhbm5pbmdFbmFibGVkKCk7XHJcbiAgICAgICAgbGFzdFpvb21pbmdFbmFibGVkID0gY3kuem9vbWluZ0VuYWJsZWQoKTtcclxuICAgICAgICBsYXN0Qm94U2VsZWN0aW9uRW5hYmxlZCA9IGN5LmJveFNlbGVjdGlvbkVuYWJsZWQoKTtcclxuXHJcbiAgICAgICAgY3kuem9vbWluZ0VuYWJsZWQoZmFsc2UpXHJcbiAgICAgICAgICAucGFubmluZ0VuYWJsZWQoZmFsc2UpXHJcbiAgICAgICAgICAuYm94U2VsZWN0aW9uRW5hYmxlZChmYWxzZSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIHJlc2V0IHRoZSBnZXN0dXJlcyBieSB0aGVpciBsYXRlc3Qgc3RhdHVzXHJcbiAgICAgIGZ1bmN0aW9uIHJlc2V0R2VzdHVyZXMoKSB7XHJcbiAgICAgICAgY3kuem9vbWluZ0VuYWJsZWQobGFzdFpvb21pbmdFbmFibGVkKVxyXG4gICAgICAgICAgLnBhbm5pbmdFbmFibGVkKGxhc3RQYW5uaW5nRW5hYmxlZClcclxuICAgICAgICAgIC5ib3hTZWxlY3Rpb25FbmFibGVkKGxhc3RCb3hTZWxlY3Rpb25FbmFibGVkKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gdHVybk9mZkFjdGl2ZUJnQ29sb3IoKXtcclxuICAgICAgICAvLyBmb3VuZCB0aGlzIGF0IHRoZSBjeS1ub2RlLXJlc2l6ZSBjb2RlLCBidXQgZG9lc24ndCBzZWVtIHRvIGZpbmQgdGhlIG9iamVjdCBtb3N0IG9mIHRoZSB0aW1lXHJcbiAgICAgICAgaWYoIGN5LnN0eWxlKCkuX3ByaXZhdGUuY29yZVN0eWxlW1wiYWN0aXZlLWJnLW9wYWNpdHlcIl0pIHtcclxuICAgICAgICAgIGxhc3RBY3RpdmVCZ09wYWNpdHkgPSBjeS5zdHlsZSgpLl9wcml2YXRlLmNvcmVTdHlsZVtcImFjdGl2ZS1iZy1vcGFjaXR5XCJdLnZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIC8vIGFyYml0cmFyeSwgZmVlbCBmcmVlIHRvIGNoYW5nZVxyXG4gICAgICAgICAgLy8gdHJpYWwgYW5kIGVycm9yIHNob3dlZCB0aGF0IDAuMTUgd2FzIGNsb3Nlc3QgdG8gdGhlIG9sZCBjb2xvclxyXG4gICAgICAgICAgbGFzdEFjdGl2ZUJnT3BhY2l0eSA9IDAuMTU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjeS5zdHlsZSgpXHJcbiAgICAgICAgICAuc2VsZWN0b3IoXCJjb3JlXCIpXHJcbiAgICAgICAgICAuc3R5bGUoXCJhY3RpdmUtYmctb3BhY2l0eVwiLCAwKVxyXG4gICAgICAgICAgLnVwZGF0ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiByZXNldEFjdGl2ZUJnQ29sb3IoKXtcclxuICAgICAgICBjeS5zdHlsZSgpXHJcbiAgICAgICAgICAuc2VsZWN0b3IoXCJjb3JlXCIpXHJcbiAgICAgICAgICAuc3R5bGUoXCJhY3RpdmUtYmctb3BhY2l0eVwiLCBsYXN0QWN0aXZlQmdPcGFjaXR5KVxyXG4gICAgICAgICAgLnVwZGF0ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBtb3ZlQW5jaG9yUG9pbnRzKHBvc2l0aW9uRGlmZiwgZWRnZXMpIHtcclxuICAgICAgICAgIGVkZ2VzLmZvckVhY2goZnVuY3Rpb24oIGVkZ2UgKXtcclxuICAgICAgICAgICAgICB2YXIgcHJldmlvdXNBbmNob3JzUG9zaXRpb24gPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRBbmNob3JzQXNBcnJheShlZGdlKTtcclxuICAgICAgICAgICAgICB2YXIgbmV4dEFuY2hvclBvaW50c1Bvc2l0aW9uID0gW107XHJcbiAgICAgICAgICAgICAgaWYgKHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uICE9IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8cHJldmlvdXNBbmNob3JzUG9zaXRpb24ubGVuZ3RoOyBpKz0yKVxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIG5leHRBbmNob3JQb2ludHNQb3NpdGlvbi5wdXNoKHt4OiBwcmV2aW91c0FuY2hvcnNQb3NpdGlvbltpXStwb3NpdGlvbkRpZmYueCwgeTogcHJldmlvdXNBbmNob3JzUG9zaXRpb25baSsxXStwb3NpdGlvbkRpZmYueX0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZihhbmNob3JQb2ludFV0aWxpdGllcy5lZGdlVHlwZUluY29uY2x1c2l2ZVNob3VsZG50SGFwcGVuKHR5cGUsIFwiVWlVdGlsaXRpZXMuanMsIG1vdmVBbmNob3JQb2ludHNcIikpe1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsncG9pbnRQb3MnXSwgbmV4dEFuY2hvclBvaW50c1Bvc2l0aW9uKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLmluaXRBbmNob3JQb2ludHMob3B0aW9ucygpLmJlbmRQb3NpdGlvbnNGdW5jdGlvbiwgb3B0aW9ucygpLmNvbnRyb2xQb3NpdGlvbnNGdW5jdGlvbiwgZWRnZXMpO1xyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBMaXN0ZW5lciBkZWZpbmVkIGluIG90aGVyIGV4dGVuc2lvblxyXG4gICAgICAgICAgLy8gTWlnaHQgaGF2ZSBjb21wYXRpYmlsaXR5IGlzc3VlcyBhZnRlciB0aGUgdW5idW5kbGVkIGJlemllclxyXG4gICAgICAgICAgY3kudHJpZ2dlcignYmVuZFBvaW50TW92ZW1lbnQnKTsgXHJcbiAgICAgIH1cclxuXHJcblxyXG4gICAgICBmdW5jdGlvbiBfY2FsY0Nvc3RUb1ByZWZlcnJlZFBvc2l0aW9uKHAxLCBwMil7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRBbmdsZSA9IE1hdGguYXRhbjIocDIueSAtIHAxLnksIHAyLnggLSBwMS54KTtcclxuICAgICAgICB2YXIgcGVyZmVjdEFuZ2xlPVstTWF0aC5QSSwtTWF0aC5QSSozLzQsLU1hdGguUEkvMiwtTWF0aC5QSS80LDAsTWF0aC5QSS80LE1hdGguUEkvMixNYXRoLlBJKjMvNCxNYXRoLlBJLzRdXHJcbiAgICAgICAgdmFyIGRlbHRhQW5nbGU9W11cclxuICAgICAgICBwZXJmZWN0QW5nbGUuZm9yRWFjaCgoYW5nbGUpPT57ZGVsdGFBbmdsZS5wdXNoKE1hdGguYWJzKGN1cnJlbnRBbmdsZS1hbmdsZSkpfSlcclxuICAgICAgICB2YXIgaW5kZXhPZk1pbj0gZGVsdGFBbmdsZS5pbmRleE9mKE1hdGgubWluKC4uLmRlbHRhQW5nbGUpKVxyXG4gICAgICAgIHZhciBkeSA9ICggcDIueSAtIHAxLnkgKTtcclxuICAgICAgICB2YXIgZHggPSAoIHAyLnggLSBwMS54ICk7XHJcbiAgICAgICAgdmFyIGw9TWF0aC5zcXJ0KCBkeCAqIGR4ICsgZHkgKiBkeSApO1xyXG4gICAgICAgIHZhciBjb3N0PU1hdGguYWJzKGwqTWF0aC5zaW4oZGVsdGFBbmdsZVtpbmRleE9mTWluXSkpXHJcblxyXG4gICAgICAgIHZhciBjaG9zZW5BbmdsZT1wZXJmZWN0QW5nbGVbaW5kZXhPZk1pbl1cclxuICAgICAgICB2YXIgZWRnZUw9TWF0aC5hYnMobCpNYXRoLmNvcyhkZWx0YUFuZ2xlW2luZGV4T2ZNaW5dKSlcclxuICAgICAgICB2YXIgdGFyZ2V0UG9pbnRYPXAxLnggKyBlZGdlTCpNYXRoLmNvcyhjaG9zZW5BbmdsZSlcclxuICAgICAgICB2YXIgdGFyZ2V0UG9pbnRZPXAxLnkgKyBlZGdlTCpNYXRoLnNpbihjaG9zZW5BbmdsZSlcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcImNvc3REaXN0YW5jZVwiOmNvc3QsXCJ4XCI6dGFyZ2V0UG9pbnRYLFwieVwiOnRhcmdldFBvaW50WX1cclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gbW92ZUFuY2hvck9uRHJhZyhlZGdlLCB0eXBlLCBpbmRleCwgcG9zaXRpb24pe1xyXG4gICAgICAgIHZhciBwcmV2UG9pbnRQb3NpdGlvbj1hbmNob3JQb2ludFV0aWxpdGllcy5vYnRhaW5QcmV2QW5jaG9yQWJzb2x1dGVQb3NpdGlvbnMoZWRnZSx0eXBlLGluZGV4KVxyXG4gICAgICAgIHZhciBuZXh0UG9pbnRQb3NpdGlvbj1hbmNob3JQb2ludFV0aWxpdGllcy5vYnRhaW5OZXh0QW5jaG9yQWJzb2x1dGVQb3NpdGlvbnMoZWRnZSx0eXBlLGluZGV4KVxyXG4gICAgICAgIHZhciBtb3VzZVBvc2l0aW9uID0gcG9zaXRpb247XHJcblxyXG4gICAgICAgIC8vY2FsY3VhbHRlIHRoZSBjb3N0KG9yIG9mZnNldCBkaXN0YW5jZSkgdG8gZnVsZmlsbCBwZXJmZWN0IDAsIG9yIDQ1IG9yIDkwIGRlZ3JlZSBwb3NpdGlvbnMgYWNjb3JkaW5nIHRvIHByZXYgYW5kIG5leHQgcG9zaXRpb25cclxuICAgICAgICB2YXIganVkZ2VQcmV2PV9jYWxjQ29zdFRvUHJlZmVycmVkUG9zaXRpb24ocHJldlBvaW50UG9zaXRpb24sbW91c2VQb3NpdGlvbilcclxuICAgICAgICB2YXIganVkZ2VOZXh0PV9jYWxjQ29zdFRvUHJlZmVycmVkUG9zaXRpb24obmV4dFBvaW50UG9zaXRpb24sbW91c2VQb3NpdGlvbilcclxuICAgICAgICB2YXIgZGVjaXNpb25PYmo9bnVsbFxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB6b29tTGV2ZWw9Y3kuem9vbSgpXHJcbiAgICAgICAgaWYoanVkZ2VQcmV2LmNvc3REaXN0YW5jZTxqdWRnZU5leHQuY29zdERpc3RhbmNlICYmIGp1ZGdlUHJldi5jb3N0RGlzdGFuY2Uqem9vbUxldmVsPG9wdHMuc3RpY2t5QW5jaG9yVG9sZXJlbmNlKXtcclxuICAgICAgICAgIGRlY2lzaW9uT2JqPXt4Omp1ZGdlUHJldi54LHk6anVkZ2VQcmV2LnksYW5nbGVGcm9tUG9pbnQ6cHJldlBvaW50UG9zaXRpb259XHJcbiAgICAgICAgfWVsc2UgaWYoanVkZ2VOZXh0LmNvc3REaXN0YW5jZTxqdWRnZVByZXYuY29zdERpc3RhbmNlICYmIGp1ZGdlTmV4dC5jb3N0RGlzdGFuY2Uqem9vbUxldmVsPG9wdHMuc3RpY2t5QW5jaG9yVG9sZXJlbmNlKXtcclxuICAgICAgICAgIGRlY2lzaW9uT2JqPXt4Omp1ZGdlTmV4dC54LHk6anVkZ2VOZXh0LnksYW5nbGVGcm9tUG9pbnQ6bmV4dFBvaW50UG9zaXRpb259XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihkZWNpc2lvbk9iaiE9bnVsbCl7XHJcbiAgICAgICAgICBwb3NpdGlvbi54PWRlY2lzaW9uT2JqLnhcclxuICAgICAgICAgIHBvc2l0aW9uLnk9ZGVjaXNpb25PYmoueVxyXG4gICAgICAgICAgLy9yZXBlYXQgb25lIHRpbWUgZm9yIHRoZSBvdGhlciBwb2ludCwgaXQgbWlnaHQgYmUgYWJsZSB0byBtYXRjaCBhbiBhbmdsZSBmcm9tIHRoZSBvdGhlciBwb2ludCBhcyB3ZWxsIFxyXG4gICAgICAgICAgdmFyIGp1ZGdlQWdhaW5Qb2ludD0gcHJldlBvaW50UG9zaXRpb25cclxuICAgICAgICAgIGlmKGp1ZGdlQWdhaW5Qb2ludD09ZGVjaXNpb25PYmouYW5nbGVGcm9tUG9pbnQpIGp1ZGdlQWdhaW5Qb2ludD1uZXh0UG9pbnRQb3NpdGlvblxyXG4gICAgICAgICAgdmFyIGp1ZGdlQWdhaW49X2NhbGNDb3N0VG9QcmVmZXJyZWRQb3NpdGlvbihqdWRnZUFnYWluUG9pbnQscG9zaXRpb24pXHJcbiAgICAgICAgICB2YXIgc2Vjb25kRGVjaXNpb25PYmo9bnVsbFxyXG4gICAgICAgICAgaWYoanVkZ2VBZ2Fpbi5jb3N0RGlzdGFuY2Uqem9vbUxldmVsPG9wdHMuc3RpY2t5QW5jaG9yVG9sZXJlbmNlKSBzZWNvbmREZWNpc2lvbk9iaj17eDpqdWRnZUFnYWluLngseTpqdWRnZUFnYWluLnl9XHJcbiAgICAgICAgICBpZihzZWNvbmREZWNpc2lvbk9iaiE9bnVsbCl7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uLng9c2Vjb25kRGVjaXNpb25PYmoueFxyXG4gICAgICAgICAgICBwb3NpdGlvbi55PXNlY29uZERlY2lzaW9uT2JqLnlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHdlaWdodHMgPSBlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSk7XHJcbiAgICAgICAgdmFyIGRpc3RhbmNlcyA9IGVkZ2UuZGF0YShhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ2Rpc3RhbmNlJ10pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciByZWxhdGl2ZUFuY2hvclBvc2l0aW9uID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuY29udmVydFRvUmVsYXRpdmVQb3NpdGlvbihlZGdlLCBwb3NpdGlvbik7XHJcbiAgICAgICAgd2VpZ2h0c1tpbmRleF0gPSByZWxhdGl2ZUFuY2hvclBvc2l0aW9uLndlaWdodDtcclxuICAgICAgICBkaXN0YW5jZXNbaW5kZXhdID0gcmVsYXRpdmVBbmNob3JQb3NpdGlvbi5kaXN0YW5jZTtcclxuICAgICAgICBcclxuICAgICAgICBlZGdlLmRhdGEoYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWyd3ZWlnaHQnXSwgd2VpZ2h0cyk7XHJcbiAgICAgICAgZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXSwgZGlzdGFuY2VzKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZGVib3VuY2VkIGR1ZSB0byBsYXJnZSBhbW91dCBvZiBjYWxscyB0byB0YXBkcmFnXHJcbiAgICAgIHZhciBfbW92ZUFuY2hvck9uRHJhZyA9IGRlYm91bmNlKCBtb3ZlQW5jaG9yT25EcmFnLCA1KTtcclxuXHJcbiAgICAgIHsgIFxyXG4gICAgICAgIGxhc3RQYW5uaW5nRW5hYmxlZCA9IGN5LnBhbm5pbmdFbmFibGVkKCk7XHJcbiAgICAgICAgbGFzdFpvb21pbmdFbmFibGVkID0gY3kuem9vbWluZ0VuYWJsZWQoKTtcclxuICAgICAgICBsYXN0Qm94U2VsZWN0aW9uRW5hYmxlZCA9IGN5LmJveFNlbGVjdGlvbkVuYWJsZWQoKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBJbml0aWxpemUgdGhlIGVkZ2VUb0hpZ2hsaWdodEJlbmRzIGFuZCBudW1iZXJPZlNlbGVjdGVkRWRnZXNcclxuICAgICAgICB7XHJcbiAgICAgICAgICB2YXIgc2VsZWN0ZWRFZGdlcyA9IGN5LmVkZ2VzKCc6c2VsZWN0ZWQnKTtcclxuICAgICAgICAgIHZhciBudW1iZXJPZlNlbGVjdGVkRWRnZXMgPSBzZWxlY3RlZEVkZ2VzLmxlbmd0aDtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKCBudW1iZXJPZlNlbGVjdGVkRWRnZXMgPT09IDEgKSB7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHNlbGVjdGVkRWRnZXNbMF07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGN5LmJpbmQoJ3pvb20gcGFuJywgZVpvb20gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBpZiAoICFlZGdlVG9IaWdobGlnaHQgKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgcmVmcmVzaERyYXdzKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGN5Lm9mZiBpcyBuZXZlciBjYWxsZWQgb24gdGhpcyBsaXN0ZW5lclxyXG4gICAgICAgIGN5Lm9uKCdkYXRhJywgJ2VkZ2UnLCAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKCAhZWRnZVRvSGlnaGxpZ2h0ICkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjeS5vbignc3R5bGUnLCAnZWRnZS5lZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50czpzZWxlY3RlZCwgZWRnZS5lZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50czpzZWxlY3RlZCcsIGVTdHlsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtyZWZyZXNoRHJhd3MoKX0sIDUwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3kub24oJ3JlbW92ZScsICdlZGdlJywgZVJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBlZGdlID0gdGhpcztcclxuICAgICAgICAgIGlmIChlZGdlLnNlbGVjdGVkKCkpIHtcclxuICAgICAgICAgICAgbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID0gbnVtYmVyT2ZTZWxlY3RlZEVkZ2VzIC0gMTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGN5LnN0YXJ0QmF0Y2goKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChlZGdlVG9IaWdobGlnaHQpIHtcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQucmVtb3ZlQ2xhc3MoJ2N5LWVkZ2UtZWRpdGluZy1oaWdobGlnaHQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKG51bWJlck9mU2VsZWN0ZWRFZGdlcyA9PT0gMSkge1xyXG4gICAgICAgICAgICAgIHZhciBzZWxlY3RlZEVkZ2VzID0gY3kuZWRnZXMoJzpzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIC8vIElmIHVzZXIgcmVtb3ZlcyBhbGwgc2VsZWN0ZWQgZWRnZXMgYXQgYSBzaW5nbGUgb3BlcmF0aW9uIHRoZW4gb3VyICdudW1iZXJPZlNlbGVjdGVkRWRnZXMnXHJcbiAgICAgICAgICAgICAgLy8gbWF5IGJlIG1pc2xlYWRpbmcuIFRoZXJlZm9yZSB3ZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBudW1iZXIgb2YgZWRnZXMgdG8gaGlnaGxpZ2h0IGlzIHJlYWx5IDEgaGVyZS5cclxuICAgICAgICAgICAgICBpZiAoc2VsZWN0ZWRFZGdlcy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHNlbGVjdGVkRWRnZXNbMF07XHJcbiAgICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQuYWRkQ2xhc3MoJ2N5LWVkZ2UtZWRpdGluZy1oaWdobGlnaHQnKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY3kuZW5kQmF0Y2goKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJlZnJlc2hEcmF3cygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgICBjeS5vbignYWRkJywgJ2VkZ2UnLCBlQWRkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyIGVkZ2UgPSB0aGlzO1xyXG4gICAgICAgICAgaWYgKGVkZ2Uuc2VsZWN0ZWQoKSkge1xyXG4gICAgICAgICAgICBudW1iZXJPZlNlbGVjdGVkRWRnZXMgPSBudW1iZXJPZlNlbGVjdGVkRWRnZXMgKyAxO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY3kuc3RhcnRCYXRjaCgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGVkZ2VUb0hpZ2hsaWdodCkge1xyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodC5yZW1vdmVDbGFzcygnY3ktZWRnZS1lZGl0aW5nLWhpZ2hsaWdodCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAobnVtYmVyT2ZTZWxlY3RlZEVkZ2VzID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0ID0gZWRnZTtcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQuYWRkQ2xhc3MoJ2N5LWVkZ2UtZWRpdGluZy1oaWdobGlnaHQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBlZGdlVG9IaWdobGlnaHQgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGN5LmVuZEJhdGNoKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZWZyZXNoRHJhd3MoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBjeS5vbignc2VsZWN0JywgJ2VkZ2UnLCBlU2VsZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyIGVkZ2UgPSB0aGlzO1xyXG5cclxuICAgICAgICAgIGlmKGVkZ2UudGFyZ2V0KCkuY29ubmVjdGVkRWRnZXMoKS5sZW5ndGggPT0gMCB8fCBlZGdlLnNvdXJjZSgpLmNvbm5lY3RlZEVkZ2VzKCkubGVuZ3RoID09IDApe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICBcclxuICAgICAgICAgIG51bWJlck9mU2VsZWN0ZWRFZGdlcyA9IG51bWJlck9mU2VsZWN0ZWRFZGdlcyArIDE7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGN5LnN0YXJ0QmF0Y2goKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICBpZiAoZWRnZVRvSGlnaGxpZ2h0KSB7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodC5yZW1vdmVDbGFzcygnY3ktZWRnZS1lZGl0aW5nLWhpZ2hsaWdodCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIGlmIChudW1iZXJPZlNlbGVjdGVkRWRnZXMgPT09IDEpIHtcclxuICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0ID0gZWRnZTtcclxuICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0LmFkZENsYXNzKCdjeS1lZGdlLWVkaXRpbmctaGlnaGxpZ2h0Jyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBjeS5lbmRCYXRjaCgpO1xyXG4gICAgICAgICAgcmVmcmVzaERyYXdzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY3kub24oJ3Vuc2VsZWN0JywgJ2VkZ2UnLCBlVW5zZWxlY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBudW1iZXJPZlNlbGVjdGVkRWRnZXMgPSBudW1iZXJPZlNlbGVjdGVkRWRnZXMgLSAxO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIGN5LnN0YXJ0QmF0Y2goKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICBpZiAoZWRnZVRvSGlnaGxpZ2h0KSB7XHJcbiAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodC5yZW1vdmVDbGFzcygnY3ktZWRnZS1lZGl0aW5nLWhpZ2hsaWdodCcpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgIGlmIChudW1iZXJPZlNlbGVjdGVkRWRnZXMgPT09IDEpIHtcclxuICAgICAgICAgICAgdmFyIHNlbGVjdGVkRWRnZXMgPSBjeS5lZGdlcygnOnNlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBJZiB1c2VyIHVuc2VsZWN0cyBhbGwgZWRnZXMgYnkgdGFwcGluZyB0byB0aGUgY29yZSBldGMuIHRoZW4gb3VyICdudW1iZXJPZlNlbGVjdGVkRWRnZXMnXHJcbiAgICAgICAgICAgIC8vIG1heSBiZSBtaXNsZWFkaW5nLiBUaGVyZWZvcmUgd2UgbmVlZCB0byBjaGVjayBpZiB0aGUgbnVtYmVyIG9mIGVkZ2VzIHRvIGhpZ2hsaWdodCBpcyByZWFseSAxIGhlcmUuXHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RlZEVkZ2VzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCA9IHNlbGVjdGVkRWRnZXNbMF07XHJcbiAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0LmFkZENsYXNzKCdjeS1lZGdlLWVkaXRpbmctaGlnaGxpZ2h0Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZWRnZVRvSGlnaGxpZ2h0ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBjeS5lbmRCYXRjaCgpO1xyXG4gICAgICAgICAgcmVmcmVzaERyYXdzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIG1vdmVkQW5jaG9ySW5kZXg7XHJcbiAgICAgICAgdmFyIHRhcFN0YXJ0UG9zO1xyXG4gICAgICAgIHZhciBtb3ZlZEVkZ2U7XHJcbiAgICAgICAgdmFyIG1vdmVBbmNob3JQYXJhbTtcclxuICAgICAgICB2YXIgY3JlYXRlQW5jaG9yT25EcmFnO1xyXG4gICAgICAgIHZhciBtb3ZlZEVuZFBvaW50O1xyXG4gICAgICAgIHZhciBkdW1teU5vZGU7XHJcbiAgICAgICAgdmFyIGRldGFjaGVkTm9kZTtcclxuICAgICAgICB2YXIgbm9kZVRvQXR0YWNoO1xyXG4gICAgICAgIHZhciBhbmNob3JDcmVhdGVkQnlEcmFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGN5Lm9uKCd0YXBzdGFydCcsIGVUYXBTdGFydCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICB0YXBTdGFydFBvcyA9IGV2ZW50LnBvc2l0aW9uIHx8IGV2ZW50LmN5UG9zaXRpb247XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGN5Lm9uKCd0YXBzdGFydCcsICdlZGdlJywgZVRhcFN0YXJ0T25FZGdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZWRnZSA9IHRoaXM7XHJcblxyXG4gICAgICAgICAgaWYgKCFlZGdlVG9IaWdobGlnaHQgfHwgZWRnZVRvSGlnaGxpZ2h0LmlkKCkgIT09IGVkZ2UuaWQoKSkge1xyXG4gICAgICAgICAgICBjcmVhdGVBbmNob3JPbkRyYWcgPSBmYWxzZTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICBtb3ZlZEVkZ2UgPSBlZGdlO1xyXG5cclxuICAgICAgICAgIHZhciB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgICAgICAgLy8gdG8gYXZvaWQgZXJyb3JzXHJcbiAgICAgICAgICBpZih0eXBlID09PSAnaW5jb25jbHVzaXZlJylcclxuICAgICAgICAgICAgdHlwZSA9ICdiZW5kJztcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgdmFyIGN5UG9zWCA9IHRhcFN0YXJ0UG9zLng7XHJcbiAgICAgICAgICB2YXIgY3lQb3NZID0gdGFwU3RhcnRQb3MueTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gR2V0IHdoaWNoIGVuZCBwb2ludCBoYXMgYmVlbiBjbGlja2VkIChTb3VyY2U6MCwgVGFyZ2V0OjEsIE5vbmU6LTEpXHJcbiAgICAgICAgICB2YXIgZW5kUG9pbnQgPSBnZXRDb250YWluaW5nRW5kUG9pbnQoY3lQb3NYLCBjeVBvc1ksIGVkZ2UpO1xyXG5cclxuICAgICAgICAgIGlmKGVuZFBvaW50ID09IDAgfHwgZW5kUG9pbnQgPT0gMSl7XHJcbiAgICAgICAgICAgIGVkZ2UudW5zZWxlY3QoKTtcclxuICAgICAgICAgICAgbW92ZWRFbmRQb2ludCA9IGVuZFBvaW50O1xyXG4gICAgICAgICAgICBkZXRhY2hlZE5vZGUgPSAoZW5kUG9pbnQgPT0gMCkgPyBtb3ZlZEVkZ2Uuc291cmNlKCkgOiBtb3ZlZEVkZ2UudGFyZ2V0KCk7XHJcblxyXG4gICAgICAgICAgICB2YXIgZGlzY29ubmVjdGVkRW5kID0gKGVuZFBvaW50ID09IDApID8gJ3NvdXJjZScgOiAndGFyZ2V0JztcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHJlY29ubmVjdGlvblV0aWxpdGllcy5kaXNjb25uZWN0RWRnZShtb3ZlZEVkZ2UsIGN5LCBldmVudC5yZW5kZXJlZFBvc2l0aW9uLCBkaXNjb25uZWN0ZWRFbmQpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZHVtbXlOb2RlID0gcmVzdWx0LmR1bW15Tm9kZTtcclxuICAgICAgICAgICAgbW92ZWRFZGdlID0gcmVzdWx0LmVkZ2U7XHJcblxyXG4gICAgICAgICAgICBkaXNhYmxlR2VzdHVyZXMoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBtb3ZlZEFuY2hvckluZGV4ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICBjcmVhdGVBbmNob3JPbkRyYWcgPSB0cnVlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGN5Lm9uKCdkcmFnJywgJ25vZGUnLCBlRHJhZyA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgdmFyIG5vZGUgPSB0aGlzO1xyXG4gICAgICAgICAgY3kuZWRnZXMoKS51bnNlbGVjdCgpO1xyXG4gICAgICAgICAgaWYoIW5vZGUuc2VsZWN0ZWQoKSl7XHJcbiAgICAgICAgICAgIGN5Lm5vZGVzKCkudW5zZWxlY3QoKTtcclxuICAgICAgICAgIH0gICAgICAgICBcclxuICAgICAgICB9KTtcclxuICAgICAgICBjeS5vbigndGFwZHJhZycsIGVUYXBEcmFnID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAvKiogXHJcbiAgICAgICAgICAgKiBpZiB0aGVyZSBpcyBhIHNlbGVjdGVkIGVkZ2Ugc2V0IGF1dG91bnNlbGVjdGlmeSBmYWxzZVxyXG4gICAgICAgICAgICogZml4ZXMgdGhlIG5vZGUtZWRpdGluZyBwcm9ibGVtIHdoZXJlIG5vZGVzIHdvdWxkIGdldFxyXG4gICAgICAgICAgICogdW5zZWxlY3RlZCBhZnRlciByZXNpemUgZHJhZ1xyXG4gICAgICAgICAgKi9cclxuICAgICAgICAgIGlmIChjeS5lZGdlcygnOnNlbGVjdGVkJykubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdmFyIGVkZ2UgPSBtb3ZlZEVkZ2U7XHJcblxyXG4gICAgICAgICAgaWYobW92ZWRFZGdlICE9PSB1bmRlZmluZWQgJiYgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaXNJZ25vcmVkRWRnZShlZGdlKSApIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcblxyXG4gICAgICAgICAgaWYoY3JlYXRlQW5jaG9yT25EcmFnICYmIG9wdHMuZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnICYmICFhbmNob3JUb3VjaGVkICYmIHR5cGUgIT09ICdpbmNvbmNsdXNpdmUnKSB7XHJcbiAgICAgICAgICAgIC8vIHJlbWVtYmVyIHN0YXRlIGJlZm9yZSBjcmVhdGluZyBhbmNob3JcclxuICAgICAgICAgICAgdmFyIHdlaWdodFN0ciA9IGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnd2VpZ2h0J107XHJcbiAgICAgICAgICAgIHZhciBkaXN0YW5jZVN0ciA9IGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXTtcclxuXHJcbiAgICAgICAgICAgIG1vdmVBbmNob3JQYXJhbSA9IHtcclxuICAgICAgICAgICAgICBlZGdlOiBlZGdlLFxyXG4gICAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgd2VpZ2h0czogZWRnZS5kYXRhKHdlaWdodFN0cikgPyBbXS5jb25jYXQoZWRnZS5kYXRhKHdlaWdodFN0cikpIDogW10sXHJcbiAgICAgICAgICAgICAgZGlzdGFuY2VzOiBlZGdlLmRhdGEoZGlzdGFuY2VTdHIpID8gW10uY29uY2F0KGVkZ2UuZGF0YShkaXN0YW5jZVN0cikpIDogW11cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGVkZ2UudW5zZWxlY3QoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHVzaW5nIHRhcHN0YXJ0IHBvc2l0aW9uIGZpeGVzIGJ1ZyBvbiBxdWljayBkcmFnc1xyXG4gICAgICAgICAgICAvLyAtLS0gXHJcbiAgICAgICAgICAgIC8vIGFsc28gbW9kaWZpZWQgYWRkQW5jaG9yUG9pbnQgdG8gcmV0dXJuIHRoZSBpbmRleCBiZWNhdXNlXHJcbiAgICAgICAgICAgIC8vIGdldENvbnRhaW5pbmdTaGFwZUluZGV4IGZhaWxlZCB0byBmaW5kIHRoZSBjcmVhdGVkIGFuY2hvciBvbiBxdWljayBkcmFnc1xyXG4gICAgICAgICAgICBtb3ZlZEFuY2hvckluZGV4ID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuYWRkQW5jaG9yUG9pbnQoZWRnZSwgdGFwU3RhcnRQb3MpO1xyXG4gICAgICAgICAgICBtb3ZlZEVkZ2UgPSBlZGdlO1xyXG4gICAgICAgICAgICBjcmVhdGVBbmNob3JPbkRyYWcgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIGFuY2hvckNyZWF0ZWRCeURyYWcgPSB0cnVlO1xyXG4gICAgICAgICAgICBkaXNhYmxlR2VzdHVyZXMoKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBpZiB0aGUgdGFwc3RhcnQgZGlkIG5vdCBoaXQgYW4gZWRnZSBhbmQgaXQgZGlkIG5vdCBoaXQgYW4gYW5jaG9yXHJcbiAgICAgICAgICBpZiAoIWFuY2hvclRvdWNoZWQgJiYgKG1vdmVkRWRnZSA9PT0gdW5kZWZpbmVkIHx8IFxyXG4gICAgICAgICAgICAobW92ZWRBbmNob3JJbmRleCA9PT0gdW5kZWZpbmVkICYmIG1vdmVkRW5kUG9pbnQgPT09IHVuZGVmaW5lZCkpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgZXZlbnRQb3MgPSBldmVudC5wb3NpdGlvbiB8fCBldmVudC5jeVBvc2l0aW9uO1xyXG5cclxuICAgICAgICAgIC8vIFVwZGF0ZSBlbmQgcG9pbnQgbG9jYXRpb24gKFNvdXJjZTowLCBUYXJnZXQ6MSlcclxuICAgICAgICAgIGlmKG1vdmVkRW5kUG9pbnQgIT0gLTEgJiYgZHVtbXlOb2RlKXtcclxuICAgICAgICAgICAgZHVtbXlOb2RlLnBvc2l0aW9uKGV2ZW50UG9zKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGNoYW5nZSBsb2NhdGlvbiBvZiBhbmNob3IgY3JlYXRlZCBieSBkcmFnXHJcbiAgICAgICAgICBlbHNlIGlmKG1vdmVkQW5jaG9ySW5kZXggIT0gdW5kZWZpbmVkKXtcclxuICAgICAgICAgICAgX21vdmVBbmNob3JPbkRyYWcoZWRnZSwgdHlwZSwgbW92ZWRBbmNob3JJbmRleCwgZXZlbnRQb3MpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gY2hhbmdlIGxvY2F0aW9uIG9mIGRyYWcgYW5kIGRyb3BwZWQgYW5jaG9yXHJcbiAgICAgICAgICBlbHNlIGlmKGFuY2hvclRvdWNoZWQpe1xyXG5cclxuICAgICAgICAgICAgLy8gdGhlIHRhcFN0YXJ0UG9zIGNoZWNrIGlzIG5lY2Vzc2FyeSB3aGVuIHJpZ2ggY2xpY2tpbmcgYW5jaG9yIHBvaW50c1xyXG4gICAgICAgICAgICAvLyByaWdodCBjbGlja2luZyBhbmNob3IgcG9pbnRzIHRyaWdnZXJzIE1vdXNlRG93biBmb3IgS29udmEsIGJ1dCBub3QgdGFwc3RhcnQgZm9yIGN5XHJcbiAgICAgICAgICAgIC8vIHdoZW4gdGhhdCBoYXBwZW5zIHRhcFN0YXJ0UG9zIGlzIHVuZGVmaW5lZFxyXG4gICAgICAgICAgICBpZihhbmNob3JNYW5hZ2VyLnRvdWNoZWRBbmNob3JJbmRleCA9PT0gdW5kZWZpbmVkICYmIHRhcFN0YXJ0UG9zKXtcclxuICAgICAgICAgICAgICBhbmNob3JNYW5hZ2VyLnRvdWNoZWRBbmNob3JJbmRleCA9IGdldENvbnRhaW5pbmdTaGFwZUluZGV4KFxyXG4gICAgICAgICAgICAgICAgdGFwU3RhcnRQb3MueCwgXHJcbiAgICAgICAgICAgICAgICB0YXBTdGFydFBvcy55LFxyXG4gICAgICAgICAgICAgICAgYW5jaG9yTWFuYWdlci5lZGdlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYoYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXggIT09IHVuZGVmaW5lZCl7XHJcbiAgICAgICAgICAgICAgX21vdmVBbmNob3JPbkRyYWcoXHJcbiAgICAgICAgICAgICAgICBhbmNob3JNYW5hZ2VyLmVkZ2UsXHJcbiAgICAgICAgICAgICAgICBhbmNob3JNYW5hZ2VyLmVkZ2VUeXBlLFxyXG4gICAgICAgICAgICAgICAgYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXgsXHJcbiAgICAgICAgICAgICAgICBldmVudFBvc1xyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYoZXZlbnQudGFyZ2V0ICYmIGV2ZW50LnRhcmdldFswXSAmJiBldmVudC50YXJnZXQuaXNOb2RlKCkpe1xyXG4gICAgICAgICAgICBub2RlVG9BdHRhY2ggPSBldmVudC50YXJnZXQ7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGN5Lm9uKCd0YXBlbmQnLCBlVGFwRW5kID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcblxyXG4gICAgICAgICAgaWYobW91c2VPdXQpe1xyXG4gICAgICAgICAgICBjYW52YXMuZ2V0U3RhZ2UoKS5maXJlKFwiY29udGVudE1vdXNldXBcIik7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIGVkZ2UgPSBtb3ZlZEVkZ2UgfHwgYW5jaG9yTWFuYWdlci5lZGdlOyBcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYoIGVkZ2UgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgdmFyIGluZGV4ID0gYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXg7XHJcbiAgICAgICAgICAgIGlmKCBpbmRleCAhPSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgdmFyIHN0YXJ0WCA9IGVkZ2Uuc291cmNlKCkucG9zaXRpb24oJ3gnKTtcclxuICAgICAgICAgICAgICB2YXIgc3RhcnRZID0gZWRnZS5zb3VyY2UoKS5wb3NpdGlvbigneScpO1xyXG4gICAgICAgICAgICAgIHZhciBlbmRYID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigneCcpO1xyXG4gICAgICAgICAgICAgIHZhciBlbmRZID0gZWRnZS50YXJnZXQoKS5wb3NpdGlvbigneScpO1xyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIHZhciBhbmNob3JMaXN0ID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZSk7XHJcbiAgICAgICAgICAgICAgdmFyIGFsbEFuY2hvcnMgPSBbc3RhcnRYLCBzdGFydFldLmNvbmNhdChhbmNob3JMaXN0KS5jb25jYXQoW2VuZFgsIGVuZFldKTtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICB2YXIgYW5jaG9ySW5kZXggPSBpbmRleCArIDE7XHJcbiAgICAgICAgICAgICAgdmFyIHByZUluZGV4ID0gYW5jaG9ySW5kZXggLSAxO1xyXG4gICAgICAgICAgICAgIHZhciBwb3NJbmRleCA9IGFuY2hvckluZGV4ICsgMTtcclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICB2YXIgYW5jaG9yID0ge1xyXG4gICAgICAgICAgICAgICAgeDogYWxsQW5jaG9yc1syICogYW5jaG9ySW5kZXhdLFxyXG4gICAgICAgICAgICAgICAgeTogYWxsQW5jaG9yc1syICogYW5jaG9ySW5kZXggKyAxXVxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgdmFyIHByZUFuY2hvclBvaW50ID0ge1xyXG4gICAgICAgICAgICAgICAgeDogYWxsQW5jaG9yc1syICogcHJlSW5kZXhdLFxyXG4gICAgICAgICAgICAgICAgeTogYWxsQW5jaG9yc1syICogcHJlSW5kZXggKyAxXVxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgdmFyIHBvc0FuY2hvclBvaW50ID0ge1xyXG4gICAgICAgICAgICAgICAgeDogYWxsQW5jaG9yc1syICogcG9zSW5kZXhdLFxyXG4gICAgICAgICAgICAgICAgeTogYWxsQW5jaG9yc1syICogcG9zSW5kZXggKyAxXVxyXG4gICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgdmFyIG5lYXJUb0xpbmU7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgaWYoICggYW5jaG9yLnggPT09IHByZUFuY2hvclBvaW50LnggJiYgYW5jaG9yLnkgPT09IHByZUFuY2hvclBvaW50LnkgKSB8fCAoIGFuY2hvci54ID09PSBwcmVBbmNob3JQb2ludC54ICYmIGFuY2hvci55ID09PSBwcmVBbmNob3JQb2ludC55ICkgKSB7XHJcbiAgICAgICAgICAgICAgICBuZWFyVG9MaW5lID0gdHJ1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbTEgPSAoIHByZUFuY2hvclBvaW50LnkgLSBwb3NBbmNob3JQb2ludC55ICkgLyAoIHByZUFuY2hvclBvaW50LnggLSBwb3NBbmNob3JQb2ludC54ICk7XHJcbiAgICAgICAgICAgICAgICB2YXIgbTIgPSAtMSAvIG0xO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBzcmNUZ3RQb2ludHNBbmRUYW5nZW50cyA9IHtcclxuICAgICAgICAgICAgICAgICAgc3JjUG9pbnQ6IHByZUFuY2hvclBvaW50LFxyXG4gICAgICAgICAgICAgICAgICB0Z3RQb2ludDogcG9zQW5jaG9yUG9pbnQsXHJcbiAgICAgICAgICAgICAgICAgIG0xOiBtMSxcclxuICAgICAgICAgICAgICAgICAgbTI6IG0yXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjdXJyZW50SW50ZXJzZWN0aW9uID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0SW50ZXJzZWN0aW9uKGVkZ2UsIGFuY2hvciwgc3JjVGd0UG9pbnRzQW5kVGFuZ2VudHMpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGRpc3QgPSBNYXRoLnNxcnQoIE1hdGgucG93KCAoYW5jaG9yLnggLSBjdXJyZW50SW50ZXJzZWN0aW9uLngpLCAyICkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgTWF0aC5wb3coIChhbmNob3IueSAtIGN1cnJlbnRJbnRlcnNlY3Rpb24ueSksIDIgKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgYmVuZCBwb2ludCBpZiBzZWdtZW50IGVkZ2UgYmVjb21lcyBzdHJhaWdodFxyXG4gICAgICAgICAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgICAgICAgICAgICAgIGlmKCAodHlwZSA9PT0gJ2JlbmQnICYmIGRpc3QgIDwgb3B0aW9ucygpLmJlbmRSZW1vdmFsU2Vuc2l0aXZpdHkpKSB7XHJcbiAgICAgICAgICAgICAgICAgIG5lYXJUb0xpbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIGlmKCBuZWFyVG9MaW5lIClcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBhbmNob3JQb2ludFV0aWxpdGllcy5yZW1vdmVBbmNob3IoZWRnZSwgaW5kZXgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKGR1bW15Tm9kZSAhPSB1bmRlZmluZWQgJiYgKG1vdmVkRW5kUG9pbnQgPT0gMCB8fCBtb3ZlZEVuZFBvaW50ID09IDEpICl7XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgdmFyIG5ld05vZGUgPSBkZXRhY2hlZE5vZGU7XHJcbiAgICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSAndmFsaWQnO1xyXG4gICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IChtb3ZlZEVuZFBvaW50ID09IDApID8gJ3NvdXJjZScgOiAndGFyZ2V0JztcclxuXHJcbiAgICAgICAgICAgICAgLy8gdmFsaWRhdGUgZWRnZSByZWNvbm5lY3Rpb25cclxuICAgICAgICAgICAgICBpZihub2RlVG9BdHRhY2gpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld1NvdXJjZSA9IChtb3ZlZEVuZFBvaW50ID09IDApID8gbm9kZVRvQXR0YWNoIDogZWRnZS5zb3VyY2UoKTtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdUYXJnZXQgPSAobW92ZWRFbmRQb2ludCA9PSAxKSA/IG5vZGVUb0F0dGFjaCA6IGVkZ2UudGFyZ2V0KCk7XHJcbiAgICAgICAgICAgICAgICBpZih0eXBlb2YgdmFsaWRhdGVFZGdlID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgICAgICAgIGlzVmFsaWQgPSB2YWxpZGF0ZUVkZ2UoZWRnZSwgbmV3U291cmNlLCBuZXdUYXJnZXQpO1xyXG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IChpc1ZhbGlkID09PSAndmFsaWQnKSA/IG5vZGVUb0F0dGFjaCA6IGRldGFjaGVkTm9kZTtcclxuICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgIHZhciBuZXdTb3VyY2UgPSAobW92ZWRFbmRQb2ludCA9PSAwKSA/IG5ld05vZGUgOiBlZGdlLnNvdXJjZSgpO1xyXG4gICAgICAgICAgICAgIHZhciBuZXdUYXJnZXQgPSAobW92ZWRFbmRQb2ludCA9PSAxKSA/IG5ld05vZGUgOiBlZGdlLnRhcmdldCgpO1xyXG4gICAgICAgICAgICAgIGVkZ2UgPSByZWNvbm5lY3Rpb25VdGlsaXRpZXMuY29ubmVjdEVkZ2UoZWRnZSwgZGV0YWNoZWROb2RlLCBsb2NhdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgIGlmKGRldGFjaGVkTm9kZS5pZCgpICE9PSBuZXdOb2RlLmlkKCkpe1xyXG4gICAgICAgICAgICAgICAgLy8gdXNlIGdpdmVuIGhhbmRsZVJlY29ubmVjdEVkZ2UgZnVuY3Rpb24gXHJcbiAgICAgICAgICAgICAgICBpZih0eXBlb2YgaGFuZGxlUmVjb25uZWN0RWRnZSA9PT0gJ2Z1bmN0aW9uJyl7XHJcbiAgICAgICAgICAgICAgICAgIHZhciByZWNvbm5lY3RlZEVkZ2UgPSBoYW5kbGVSZWNvbm5lY3RFZGdlKG5ld1NvdXJjZS5pZCgpLCBuZXdUYXJnZXQuaWQoKSwgZWRnZS5kYXRhKCkpO1xyXG4gICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgaWYocmVjb25uZWN0ZWRFZGdlKXtcclxuICAgICAgICAgICAgICAgICAgICByZWNvbm5lY3Rpb25VdGlsaXRpZXMuY29weUVkZ2UoZWRnZSwgcmVjb25uZWN0ZWRFZGdlKTtcclxuICAgICAgICAgICAgICAgICAgICBhbmNob3JQb2ludFV0aWxpdGllcy5pbml0QW5jaG9yUG9pbnRzKG9wdGlvbnMoKS5iZW5kUG9zaXRpb25zRnVuY3Rpb24sIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucygpLmNvbnRyb2xQb3NpdGlvbnNGdW5jdGlvbiwgW3JlY29ubmVjdGVkRWRnZV0pO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICBpZihyZWNvbm5lY3RlZEVkZ2UgJiYgb3B0aW9ucygpLnVuZG9hYmxlKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyYW1zID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgbmV3RWRnZTogcmVjb25uZWN0ZWRFZGdlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgb2xkRWRnZTogZWRnZVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgY3kudW5kb1JlZG8oKS5kbygncmVtb3ZlUmVjb25uZWN0ZWRFZGdlJywgcGFyYW1zKTtcclxuICAgICAgICAgICAgICAgICAgICBlZGdlID0gcmVjb25uZWN0ZWRFZGdlO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGVsc2UgaWYocmVjb25uZWN0ZWRFZGdlKXtcclxuICAgICAgICAgICAgICAgICAgICBjeS5yZW1vdmUoZWRnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHJlY29ubmVjdGVkRWRnZTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgICAgdmFyIGxvYyA9IChtb3ZlZEVuZFBvaW50ID09IDApID8ge3NvdXJjZTogbmV3Tm9kZS5pZCgpfSA6IHt0YXJnZXQ6IG5ld05vZGUuaWQoKX07XHJcbiAgICAgICAgICAgICAgICAgIHZhciBvbGRMb2MgPSAobW92ZWRFbmRQb2ludCA9PSAwKSA/IHtzb3VyY2U6IGRldGFjaGVkTm9kZS5pZCgpfSA6IHt0YXJnZXQ6IGRldGFjaGVkTm9kZS5pZCgpfTtcclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMoKS51bmRvYWJsZSAmJiBuZXdOb2RlLmlkKCkgIT09IGRldGFjaGVkTm9kZS5pZCgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmFtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uOiBsb2MsXHJcbiAgICAgICAgICAgICAgICAgICAgICBvbGRMb2M6IG9sZExvY1xyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGN5LnVuZG9SZWRvKCkuZG8oJ3JlY29ubmVjdEVkZ2UnLCBwYXJhbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRnZSA9IHJlc3VsdC5lZGdlO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vZWRnZS5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSAgXHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAvLyBpbnZhbGlkIGVkZ2UgcmVjb25uZWN0aW9uIGNhbGxiYWNrXHJcbiAgICAgICAgICAgICAgaWYoaXNWYWxpZCAhPT0gJ3ZhbGlkJyAmJiB0eXBlb2YgYWN0T25VbnN1Y2Nlc3NmdWxSZWNvbm5lY3Rpb24gPT09ICdmdW5jdGlvbicpe1xyXG4gICAgICAgICAgICAgICAgYWN0T25VbnN1Y2Nlc3NmdWxSZWNvbm5lY3Rpb24oKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWRnZS5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICBjeS5yZW1vdmUoZHVtbXlOb2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuXHJcbiAgICAgICAgICAvLyB0byBhdm9pZCBlcnJvcnNcclxuICAgICAgICAgIGlmKHR5cGUgPT09ICdpbmNvbmNsdXNpdmUnKXtcclxuICAgICAgICAgICAgdHlwZSA9ICdiZW5kJztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZihhbmNob3JNYW5hZ2VyLnRvdWNoZWRBbmNob3JJbmRleCA9PT0gdW5kZWZpbmVkICYmICFhbmNob3JDcmVhdGVkQnlEcmFnKXtcclxuICAgICAgICAgICAgbW92ZUFuY2hvclBhcmFtID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciB3ZWlnaHRTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddO1xyXG4gICAgICAgICAgaWYgKGVkZ2UgIT09IHVuZGVmaW5lZCAmJiBtb3ZlQW5jaG9yUGFyYW0gIT09IHVuZGVmaW5lZCAmJiBcclxuICAgICAgICAgICAgKGVkZ2UuZGF0YSh3ZWlnaHRTdHIpID8gZWRnZS5kYXRhKHdlaWdodFN0cikudG9TdHJpbmcoKSA6IG51bGwpICE9IG1vdmVBbmNob3JQYXJhbS53ZWlnaHRzLnRvU3RyaW5nKCkpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIGFuY2hvciBjcmVhdGVkIGZyb20gZHJhZ1xyXG4gICAgICAgICAgICBpZihhbmNob3JDcmVhdGVkQnlEcmFnKXtcclxuICAgICAgICAgICAgZWRnZS5zZWxlY3QoKTsgXHJcblxyXG4gICAgICAgICAgICAvLyBzdG9wcyB0aGUgdW5idW5kbGVkIGJlemllciBlZGdlcyBmcm9tIGJlaW5nIHVuc2VsZWN0ZWRcclxuICAgICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZihvcHRpb25zKCkudW5kb2FibGUpIHtcclxuICAgICAgICAgICAgICBjeS51bmRvUmVkbygpLmRvKCdjaGFuZ2VBbmNob3JQb2ludHMnLCBtb3ZlQW5jaG9yUGFyYW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIG1vdmVkQW5jaG9ySW5kZXggPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBtb3ZlZEVkZ2UgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBtb3ZlQW5jaG9yUGFyYW0gPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBjcmVhdGVBbmNob3JPbkRyYWcgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBtb3ZlZEVuZFBvaW50ID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgZHVtbXlOb2RlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgZGV0YWNoZWROb2RlID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgbm9kZVRvQXR0YWNoID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgdGFwU3RhcnRQb3MgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICBhbmNob3JDcmVhdGVkQnlEcmFnID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgYW5jaG9yTWFuYWdlci50b3VjaGVkQW5jaG9ySW5kZXggPSB1bmRlZmluZWQ7IFxyXG5cclxuICAgICAgICAgIHJlc2V0R2VzdHVyZXMoKTtcclxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtyZWZyZXNoRHJhd3MoKX0sIDUwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy9WYXJpYWJsZXMgdXNlZCBmb3Igc3RhcnRpbmcgYW5kIGVuZGluZyB0aGUgbW92ZW1lbnQgb2YgYW5jaG9yIHBvaW50cyB3aXRoIGFycm93c1xyXG4gICAgICAgIHZhciBtb3ZlYW5jaG9ycGFyYW07XHJcbiAgICAgICAgdmFyIGZpcnN0QW5jaG9yO1xyXG4gICAgICAgIHZhciBlZGdlQ29udGFpbmluZ0ZpcnN0QW5jaG9yO1xyXG4gICAgICAgIHZhciBmaXJzdEFuY2hvclBvaW50Rm91bmQ7XHJcbiAgICAgICAgY3kub24oXCJlZGdlZWRpdGluZy5tb3Zlc3RhcnRcIiwgZnVuY3Rpb24gKGUsIGVkZ2VzKSB7XHJcbiAgICAgICAgICAgIGZpcnN0QW5jaG9yUG9pbnRGb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAoZWRnZXNbMF0gIT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBlZGdlcy5mb3JFYWNoKGZ1bmN0aW9uKCBlZGdlICl7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChhbmNob3JQb2ludFV0aWxpdGllcy5nZXRBbmNob3JzQXNBcnJheShlZGdlKSAhPSB1bmRlZmluZWQgJiYgIWZpcnN0QW5jaG9yUG9pbnRGb3VuZClcclxuICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgZmlyc3RBbmNob3IgPSB7IHg6IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpWzBdLCB5OiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRBbmNob3JzQXNBcnJheShlZGdlKVsxXX07XHJcbiAgICAgICAgICAgICAgICAgICAgICBtb3ZlYW5jaG9ycGFyYW0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RUaW1lOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0QW5jaG9yUG9zaXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogZmlyc3RBbmNob3IueCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogZmlyc3RBbmNob3IueVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWRnZXM6IGVkZ2VzXHJcbiAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgZWRnZUNvbnRhaW5pbmdGaXJzdEFuY2hvciA9IGVkZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICBmaXJzdEFuY2hvclBvaW50Rm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjeS5vbihcImVkZ2VlZGl0aW5nLm1vdmVlbmRcIiwgZnVuY3Rpb24gKGUsIGVkZ2VzKSB7XHJcbiAgICAgICAgICAgIGlmIChtb3ZlYW5jaG9ycGFyYW0gIT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5pdGlhbFBvcyA9IG1vdmVhbmNob3JwYXJhbS5maXJzdEFuY2hvclBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vdmVkRmlyc3RBbmNob3IgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeDogYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZUNvbnRhaW5pbmdGaXJzdEFuY2hvcilbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgeTogYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWRnZUNvbnRhaW5pbmdGaXJzdEFuY2hvcilbMV1cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIG1vdmVhbmNob3JwYXJhbS5wb3NpdGlvbkRpZmYgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgeDogLW1vdmVkRmlyc3RBbmNob3IueCArIGluaXRpYWxQb3MueCxcclxuICAgICAgICAgICAgICAgICAgICB5OiAtbW92ZWRGaXJzdEFuY2hvci55ICsgaW5pdGlhbFBvcy55XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIG1vdmVhbmNob3JwYXJhbS5maXJzdEFuY2hvclBvc2l0aW9uO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKG9wdGlvbnMoKS51bmRvYWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGN5LnVuZG9SZWRvKCkuZG8oXCJtb3ZlQW5jaG9yUG9pbnRzXCIsIG1vdmVhbmNob3JwYXJhbSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbW92ZWFuY2hvcnBhcmFtID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGN5Lm9uKCdjeHR0YXAnLCBlQ3h0VGFwID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgdmFyIHRhcmdldElzRWRnZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdGFyZ2V0SXNFZGdlID0gdGFyZ2V0LmlzRWRnZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgLy8gdGhpcyBpcyBoZXJlIGp1c3QgdG8gc3VwcHJlc3MgdGhlIGVycm9yXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIGVkZ2UsIHR5cGU7XHJcbiAgICAgICAgICBpZih0YXJnZXRJc0VkZ2Upe1xyXG4gICAgICAgICAgICBlZGdlID0gdGFyZ2V0O1xyXG4gICAgICAgICAgICB0eXBlID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0RWRnZVR5cGUoZWRnZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICBlZGdlID0gYW5jaG9yTWFuYWdlci5lZGdlOyAgICAgICAgICBcclxuICAgICAgICAgICAgdHlwZSA9IGFuY2hvck1hbmFnZXIuZWRnZVR5cGU7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIG1lbnVzID0gY3kuY29udGV4dE1lbnVzKCdnZXQnKTsgLy8gZ2V0IGNvbnRleHQgbWVudXMgaW5zdGFuY2VcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYoIWVkZ2VUb0hpZ2hsaWdodCB8fCBlZGdlVG9IaWdobGlnaHQuaWQoKSAhPSBlZGdlLmlkKCkgfHwgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaXNJZ25vcmVkRWRnZShlZGdlKSB8fFxyXG4gICAgICAgICAgICAgIGVkZ2VUb0hpZ2hsaWdodCAhPT0gZWRnZSkge1xyXG4gICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZEJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShyZW1vdmVDb250cm9sUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0oYWRkQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHZhciBjeVBvcyA9IGV2ZW50LnBvc2l0aW9uIHx8IGV2ZW50LmN5UG9zaXRpb247XHJcbiAgICAgICAgICB2YXIgc2VsZWN0ZWRJbmRleCA9IGdldENvbnRhaW5pbmdTaGFwZUluZGV4KGN5UG9zLngsIGN5UG9zLnksIGVkZ2UpO1xyXG4gICAgICAgICAgLy8gbm90IGNsaWNrZWQgb24gYW4gYW5jaG9yXHJcbiAgICAgICAgICBpZiAoc2VsZWN0ZWRJbmRleCA9PSAtMSkge1xyXG4gICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKHJlbW92ZUNvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIGlmKHR5cGUgPT09ICdjb250cm9sJyAmJiB0YXJnZXRJc0VkZ2Upe1xyXG4gICAgICAgICAgICAgIG1lbnVzLnNob3dNZW51SXRlbShhZGRDb250cm9sUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShhZGRCZW5kUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYodHlwZSA9PT0gJ2JlbmQnICYmIHRhcmdldElzRWRnZSl7XHJcbiAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKGFkZEJlbmRQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgbWVudXMuaGlkZU1lbnVJdGVtKGFkZENvbnRyb2xQb2ludEN4dE1lbnVJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodGFyZ2V0SXNFZGdlKXtcclxuICAgICAgICAgICAgICBtZW51cy5zaG93TWVudUl0ZW0oYWRkQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5zaG93TWVudUl0ZW0oYWRkQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0oYWRkQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0oYWRkQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBhbmNob3JQb2ludFV0aWxpdGllcy5jdXJyZW50Q3R4UG9zID0gY3lQb3M7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBjbGlja2VkIG9uIGFuIGFuY2hvclxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShhZGRCZW5kUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0oYWRkQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgaWYodHlwZSA9PT0gJ2NvbnRyb2wnKXtcclxuICAgICAgICAgICAgICBtZW51cy5zaG93TWVudUl0ZW0ocmVtb3ZlQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBpZiAob3B0cy5lbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb24gJiYgXHJcbiAgICAgICAgICAgICAgICAgIGVkZ2UuaGFzQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNtdWx0aXBsZWNvbnRyb2xwb2ludHMnKSkge1xyXG4gICAgICAgICAgICAgICAgbWVudXMuc2hvd01lbnVJdGVtKHJlbW92ZUFsbENvbnRyb2xQb2ludEN0eE1lbnVJZCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYodHlwZSA9PT0gJ2JlbmQnKXtcclxuICAgICAgICAgICAgICBtZW51cy5zaG93TWVudUl0ZW0ocmVtb3ZlQmVuZFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgICBtZW51cy5oaWRlTWVudUl0ZW0ocmVtb3ZlQ29udHJvbFBvaW50Q3h0TWVudUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShyZW1vdmVCZW5kUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShyZW1vdmVDb250cm9sUG9pbnRDeHRNZW51SWQpO1xyXG4gICAgICAgICAgICAgIG1lbnVzLmhpZGVNZW51SXRlbShyZW1vdmVBbGxDb250cm9sUG9pbnRDdHhNZW51SWQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLmN1cnJlbnRBbmNob3JJbmRleCA9IHNlbGVjdGVkSW5kZXg7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuY3VycmVudEN0eEVkZ2UgPSBlZGdlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGN5Lm9uKCdjeWVkZ2VlZGl0aW5nLmNoYW5nZUFuY2hvclBvaW50cycsICdlZGdlJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICB2YXIgZWRnZSA9IHRoaXM7XHJcbiAgICAgICAgICBjeS5zdGFydEJhdGNoKCk7XHJcbiAgICAgICAgICBjeS5lZGdlcygpLnVuc2VsZWN0KCk7IFxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgLy8gTGlzdGVuZXIgZGVmaW5lZCBpbiBvdGhlciBleHRlbnNpb25cclxuICAgICAgICAgIC8vIE1pZ2h0IGhhdmUgY29tcGF0aWJpbGl0eSBpc3N1ZXMgYWZ0ZXIgdGhlIHVuYnVuZGxlZCBiZXppZXIgICAgXHJcbiAgICAgICAgICBjeS50cmlnZ2VyKCdiZW5kUG9pbnRNb3ZlbWVudCcpOyAgICBcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY3kuZW5kQmF0Y2goKTsgICAgICAgICAgXHJcbiAgICAgICAgICByZWZyZXNoRHJhd3MoKTtcclxuICAgICAgICBcclxuICAgICAgICAgIFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgc2VsZWN0ZWRFZGdlcztcclxuICAgICAgdmFyIGFuY2hvcnNNb3ZpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgIC8vIHRyYWNrIGFycm93IGtleSBwcmVzc2VzLCBkZWZhdWx0IGZhbHNlXHJcbiAgICAgIC8vIGV2ZW50LmtleUNvZGUgbm9ybWFsbHkgcmV0dXJucyBudW1iZXJcclxuICAgICAgLy8gYnV0IEpTIHdpbGwgY29udmVydCB0byBzdHJpbmcgYW55d2F5XHJcbiAgICAgIHZhciBrZXlzID0ge1xyXG4gICAgICAgICczNyc6IGZhbHNlLFxyXG4gICAgICAgICczOCc6IGZhbHNlLFxyXG4gICAgICAgICczOSc6IGZhbHNlLFxyXG4gICAgICAgICc0MCc6IGZhbHNlXHJcbiAgICAgIH07XHJcblxyXG4gICAgICBmdW5jdGlvbiBrZXlEb3duKGUpIHtcclxuXHJcbiAgICAgICAgICB2YXIgc2hvdWxkTW92ZSA9IHR5cGVvZiBvcHRpb25zKCkubW92ZVNlbGVjdGVkQW5jaG9yc09uS2V5RXZlbnRzID09PSAnZnVuY3Rpb24nXHJcbiAgICAgICAgICAgICAgPyBvcHRpb25zKCkubW92ZVNlbGVjdGVkQW5jaG9yc09uS2V5RXZlbnRzKCkgOiBvcHRpb25zKCkubW92ZVNlbGVjdGVkQW5jaG9yc09uS2V5RXZlbnRzO1xyXG5cclxuICAgICAgICAgIGlmICghc2hvdWxkTW92ZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvL0NoZWNrcyBpZiB0aGUgdGFnbmFtZSBpcyB0ZXh0YXJlYSBvciBpbnB1dFxyXG4gICAgICAgICAgdmFyIHRuID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50YWdOYW1lO1xyXG4gICAgICAgICAgaWYgKHRuICE9IFwiVEVYVEFSRUFcIiAmJiB0biAhPSBcIklOUFVUXCIpXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc3dpdGNoKGUua2V5Q29kZSl7XHJcbiAgICAgICAgICAgICAgICAgIGNhc2UgMzc6IGNhc2UgMzk6IGNhc2UgMzg6ICBjYXNlIDQwOiAvLyBBcnJvdyBrZXlzXHJcbiAgICAgICAgICAgICAgICAgIGNhc2UgMzI6IGUucHJldmVudERlZmF1bHQoKTsgYnJlYWs7IC8vIFNwYWNlXHJcbiAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGJyZWFrOyAvLyBkbyBub3QgYmxvY2sgb3RoZXIga2V5c1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAoZS5rZXlDb2RlIDwgJzM3JyB8fCBlLmtleUNvZGUgPiAnNDAnKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAga2V5c1tlLmtleUNvZGVdID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgLy9DaGVja3MgaWYgb25seSBlZGdlcyBhcmUgc2VsZWN0ZWQgKG5vdCBhbnkgbm9kZSkgYW5kIGlmIG9ubHkgMSBlZGdlIGlzIHNlbGVjdGVkXHJcbiAgICAgICAgICAgICAgLy9JZiB0aGUgc2Vjb25kIGNoZWNraW5nIGlzIHJlbW92ZWQgdGhlIGFuY2hvcnMgb2YgbXVsdGlwbGUgZWRnZXMgd291bGQgbW92ZVxyXG4gICAgICAgICAgICAgIGlmIChjeS5lZGdlcyhcIjpzZWxlY3RlZFwiKS5sZW5ndGggIT0gY3kuZWxlbWVudHMoXCI6c2VsZWN0ZWRcIikubGVuZ3RoIHx8IGN5LmVkZ2VzKFwiOnNlbGVjdGVkXCIpLmxlbmd0aCAhPSAxKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKCFhbmNob3JzTW92aW5nKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRFZGdlcyA9IGN5LmVkZ2VzKCc6c2VsZWN0ZWQnKTtcclxuICAgICAgICAgICAgICAgICAgY3kudHJpZ2dlcihcImVkZ2VlZGl0aW5nLm1vdmVzdGFydFwiLCBbc2VsZWN0ZWRFZGdlc10pO1xyXG4gICAgICAgICAgICAgICAgICBhbmNob3JzTW92aW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdmFyIG1vdmVTcGVlZCA9IDM7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgLy8gZG9lc24ndCBtYWtlIHNlbnNlIGlmIGFsdCBhbmQgc2hpZnQgYm90aCBwcmVzc2VkXHJcbiAgICAgICAgICAgICAgaWYoZS5hbHRLZXkgJiYgZS5zaGlmdEtleSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBlbHNlIGlmIChlLmFsdEtleSkge1xyXG4gICAgICAgICAgICAgICAgbW92ZVNwZWVkID0gMTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSBpZiAoZS5zaGlmdEtleSkge1xyXG4gICAgICAgICAgICAgICAgbW92ZVNwZWVkID0gMTA7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICB2YXIgdXBBcnJvd0NvZGUgPSAzODtcclxuICAgICAgICAgICAgICB2YXIgZG93bkFycm93Q29kZSA9IDQwO1xyXG4gICAgICAgICAgICAgIHZhciBsZWZ0QXJyb3dDb2RlID0gMzc7XHJcbiAgICAgICAgICAgICAgdmFyIHJpZ2h0QXJyb3dDb2RlID0gMzk7XHJcblxyXG4gICAgICAgICAgICAgIHZhciBkeCA9IDA7XHJcbiAgICAgICAgICAgICAgdmFyIGR5ID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgZHggKz0ga2V5c1tyaWdodEFycm93Q29kZV0gPyBtb3ZlU3BlZWQgOiAwO1xyXG4gICAgICAgICAgICAgIGR4IC09IGtleXNbbGVmdEFycm93Q29kZV0gPyBtb3ZlU3BlZWQgOiAwO1xyXG4gICAgICAgICAgICAgIGR5ICs9IGtleXNbZG93bkFycm93Q29kZV0gPyBtb3ZlU3BlZWQgOiAwO1xyXG4gICAgICAgICAgICAgIGR5IC09IGtleXNbdXBBcnJvd0NvZGVdID8gbW92ZVNwZWVkIDogMDtcclxuXHJcbiAgICAgICAgICAgICAgbW92ZUFuY2hvclBvaW50cyh7eDpkeCwgeTpkeX0sIHNlbGVjdGVkRWRnZXMpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGZ1bmN0aW9uIGtleVVwKGUpIHtcclxuXHJcbiAgICAgICAgICBpZiAoZS5rZXlDb2RlIDwgJzM3JyB8fCBlLmtleUNvZGUgPiAnNDAnKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAga2V5c1tlLmtleUNvZGVdID0gZmFsc2U7XHJcbiAgICAgICAgICB2YXIgc2hvdWxkTW92ZSA9IHR5cGVvZiBvcHRpb25zKCkubW92ZVNlbGVjdGVkQW5jaG9yc09uS2V5RXZlbnRzID09PSAnZnVuY3Rpb24nXHJcbiAgICAgICAgICAgICAgPyBvcHRpb25zKCkubW92ZVNlbGVjdGVkQW5jaG9yc09uS2V5RXZlbnRzKCkgOiBvcHRpb25zKCkubW92ZVNlbGVjdGVkQW5jaG9yc09uS2V5RXZlbnRzO1xyXG5cclxuICAgICAgICAgIGlmICghc2hvdWxkTW92ZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBjeS50cmlnZ2VyKFwiZWRnZWVkaXRpbmcubW92ZWVuZFwiLCBbc2VsZWN0ZWRFZGdlc10pO1xyXG4gICAgICAgICAgc2VsZWN0ZWRFZGdlcyA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIGFuY2hvcnNNb3ZpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgIH1cclxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIixrZXlEb3duLCB0cnVlKTtcclxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsa2V5VXAsIHRydWUpO1xyXG5cclxuICAgICAgJGNvbnRhaW5lci5kYXRhKCdjeWVkZ2VlZGl0aW5nJywgZGF0YSk7XHJcbiAgICB9LFxyXG4gICAgdW5iaW5kOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY3kub2ZmKCdyZW1vdmUnLCAnbm9kZScsIGVSZW1vdmUpXHJcbiAgICAgICAgICAub2ZmKCdhZGQnLCAnbm9kZScsIGVBZGQpXHJcbiAgICAgICAgICAub2ZmKCdzdHlsZScsICdlZGdlLmVkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzOnNlbGVjdGVkLCBlZGdlLmVkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzOnNlbGVjdGVkJywgZVN0eWxlKVxyXG4gICAgICAgICAgLm9mZignc2VsZWN0JywgJ2VkZ2UnLCBlU2VsZWN0KVxyXG4gICAgICAgICAgLm9mZigndW5zZWxlY3QnLCAnZWRnZScsIGVVbnNlbGVjdClcclxuICAgICAgICAgIC5vZmYoJ3RhcHN0YXJ0JywgZVRhcFN0YXJ0KVxyXG4gICAgICAgICAgLm9mZigndGFwc3RhcnQnLCAnZWRnZScsIGVUYXBTdGFydE9uRWRnZSlcclxuICAgICAgICAgIC5vZmYoJ3RhcGRyYWcnLCBlVGFwRHJhZylcclxuICAgICAgICAgIC5vZmYoJ3RhcGVuZCcsIGVUYXBFbmQpXHJcbiAgICAgICAgICAub2ZmKCdjeHR0YXAnLCBlQ3h0VGFwKVxyXG4gICAgICAgICAgLm9mZignZHJhZycsICdub2RlJyxlRHJhZyk7XHJcblxyXG4gICAgICAgIGN5LnVuYmluZChcInpvb20gcGFuXCIsIGVab29tKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBpZiAoZnVuY3Rpb25zW2ZuXSkge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uc1tmbl0uYXBwbHkoJChjeS5jb250YWluZXIoKSksIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mIGZuID09ICdvYmplY3QnIHx8ICFmbikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9ucy5pbml0LmFwcGx5KCQoY3kuY29udGFpbmVyKCkpLCBhcmd1bWVudHMpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAkLmVycm9yKCdObyBzdWNoIGZ1bmN0aW9uIGAnICsgZm4gKyAnYCBmb3IgY3l0b3NjYXBlLmpzLWVkZ2UtZWRpdGluZycpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuICQodGhpcyk7XHJcbn07XHJcbiIsInZhciBkZWJvdW5jZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgLyoqXHJcbiAgICogbG9kYXNoIDMuMS4xIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxyXG4gICAqIEJ1aWxkOiBgbG9kYXNoIG1vZGVybiBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcclxuICAgKiBDb3B5cmlnaHQgMjAxMi0yMDE1IFRoZSBEb2pvIEZvdW5kYXRpb24gPGh0dHA6Ly9kb2pvZm91bmRhdGlvbi5vcmcvPlxyXG4gICAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XHJcbiAgICogQ29weXJpZ2h0IDIwMDktMjAxNSBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xyXG4gICAqIEF2YWlsYWJsZSB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XHJcbiAgICovXHJcbiAgLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cclxuICB2YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xyXG5cclxuICAvKiBOYXRpdmUgbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xyXG4gIHZhciBuYXRpdmVNYXggPSBNYXRoLm1heCxcclxuICAgICAgICAgIG5hdGl2ZU5vdyA9IERhdGUubm93O1xyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRoYXQgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBVbml4IGVwb2NoXHJcbiAgICogKDEgSmFudWFyeSAxOTcwIDAwOjAwOjAwIFVUQykuXHJcbiAgICpcclxuICAgKiBAc3RhdGljXHJcbiAgICogQG1lbWJlck9mIF9cclxuICAgKiBAY2F0ZWdvcnkgRGF0ZVxyXG4gICAqIEBleGFtcGxlXHJcbiAgICpcclxuICAgKiBfLmRlZmVyKGZ1bmN0aW9uKHN0YW1wKSB7XHJcbiAgICogICBjb25zb2xlLmxvZyhfLm5vdygpIC0gc3RhbXApO1xyXG4gICAqIH0sIF8ubm93KCkpO1xyXG4gICAqIC8vID0+IGxvZ3MgdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgaXQgdG9vayBmb3IgdGhlIGRlZmVycmVkIGZ1bmN0aW9uIHRvIGJlIGludm9rZWRcclxuICAgKi9cclxuICB2YXIgbm93ID0gbmF0aXZlTm93IHx8IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgZGVib3VuY2VkIGZ1bmN0aW9uIHRoYXQgZGVsYXlzIGludm9raW5nIGBmdW5jYCB1bnRpbCBhZnRlciBgd2FpdGBcclxuICAgKiBtaWxsaXNlY29uZHMgaGF2ZSBlbGFwc2VkIHNpbmNlIHRoZSBsYXN0IHRpbWUgdGhlIGRlYm91bmNlZCBmdW5jdGlvbiB3YXNcclxuICAgKiBpbnZva2VkLiBUaGUgZGVib3VuY2VkIGZ1bmN0aW9uIGNvbWVzIHdpdGggYSBgY2FuY2VsYCBtZXRob2QgdG8gY2FuY2VsXHJcbiAgICogZGVsYXllZCBpbnZvY2F0aW9ucy4gUHJvdmlkZSBhbiBvcHRpb25zIG9iamVjdCB0byBpbmRpY2F0ZSB0aGF0IGBmdW5jYFxyXG4gICAqIHNob3VsZCBiZSBpbnZva2VkIG9uIHRoZSBsZWFkaW5nIGFuZC9vciB0cmFpbGluZyBlZGdlIG9mIHRoZSBgd2FpdGAgdGltZW91dC5cclxuICAgKiBTdWJzZXF1ZW50IGNhbGxzIHRvIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gcmV0dXJuIHRoZSByZXN1bHQgb2YgdGhlIGxhc3RcclxuICAgKiBgZnVuY2AgaW52b2NhdGlvbi5cclxuICAgKlxyXG4gICAqICoqTm90ZToqKiBJZiBgbGVhZGluZ2AgYW5kIGB0cmFpbGluZ2Agb3B0aW9ucyBhcmUgYHRydWVgLCBgZnVuY2AgaXMgaW52b2tlZFxyXG4gICAqIG9uIHRoZSB0cmFpbGluZyBlZGdlIG9mIHRoZSB0aW1lb3V0IG9ubHkgaWYgdGhlIHRoZSBkZWJvdW5jZWQgZnVuY3Rpb24gaXNcclxuICAgKiBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIGR1cmluZyB0aGUgYHdhaXRgIHRpbWVvdXQuXHJcbiAgICpcclxuICAgKiBTZWUgW0RhdmlkIENvcmJhY2hvJ3MgYXJ0aWNsZV0oaHR0cDovL2RydXBhbG1vdGlvbi5jb20vYXJ0aWNsZS9kZWJvdW5jZS1hbmQtdGhyb3R0bGUtdmlzdWFsLWV4cGxhbmF0aW9uKVxyXG4gICAqIGZvciBkZXRhaWxzIG92ZXIgdGhlIGRpZmZlcmVuY2VzIGJldHdlZW4gYF8uZGVib3VuY2VgIGFuZCBgXy50aHJvdHRsZWAuXHJcbiAgICpcclxuICAgKiBAc3RhdGljXHJcbiAgICogQG1lbWJlck9mIF9cclxuICAgKiBAY2F0ZWdvcnkgRnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBkZWJvdW5jZS5cclxuICAgKiBAcGFyYW0ge251bWJlcn0gW3dhaXQ9MF0gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZGVsYXkuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBvYmplY3QuXHJcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5sZWFkaW5nPWZhbHNlXSBTcGVjaWZ5IGludm9raW5nIG9uIHRoZSBsZWFkaW5nXHJcbiAgICogIGVkZ2Ugb2YgdGhlIHRpbWVvdXQuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLm1heFdhaXRdIFRoZSBtYXhpbXVtIHRpbWUgYGZ1bmNgIGlzIGFsbG93ZWQgdG8gYmVcclxuICAgKiAgZGVsYXllZCBiZWZvcmUgaXQncyBpbnZva2VkLlxyXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMudHJhaWxpbmc9dHJ1ZV0gU3BlY2lmeSBpbnZva2luZyBvbiB0aGUgdHJhaWxpbmdcclxuICAgKiAgZWRnZSBvZiB0aGUgdGltZW91dC5cclxuICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBkZWJvdW5jZWQgZnVuY3Rpb24uXHJcbiAgICogQGV4YW1wbGVcclxuICAgKlxyXG4gICAqIC8vIGF2b2lkIGNvc3RseSBjYWxjdWxhdGlvbnMgd2hpbGUgdGhlIHdpbmRvdyBzaXplIGlzIGluIGZsdXhcclxuICAgKiBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgXy5kZWJvdW5jZShjYWxjdWxhdGVMYXlvdXQsIDE1MCkpO1xyXG4gICAqXHJcbiAgICogLy8gaW52b2tlIGBzZW5kTWFpbGAgd2hlbiB0aGUgY2xpY2sgZXZlbnQgaXMgZmlyZWQsIGRlYm91bmNpbmcgc3Vic2VxdWVudCBjYWxsc1xyXG4gICAqIGpRdWVyeSgnI3Bvc3Rib3gnKS5vbignY2xpY2snLCBfLmRlYm91bmNlKHNlbmRNYWlsLCAzMDAsIHtcclxuICAgKiAgICdsZWFkaW5nJzogdHJ1ZSxcclxuICAgKiAgICd0cmFpbGluZyc6IGZhbHNlXHJcbiAgICogfSkpO1xyXG4gICAqXHJcbiAgICogLy8gZW5zdXJlIGBiYXRjaExvZ2AgaXMgaW52b2tlZCBvbmNlIGFmdGVyIDEgc2Vjb25kIG9mIGRlYm91bmNlZCBjYWxsc1xyXG4gICAqIHZhciBzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoJy9zdHJlYW0nKTtcclxuICAgKiBqUXVlcnkoc291cmNlKS5vbignbWVzc2FnZScsIF8uZGVib3VuY2UoYmF0Y2hMb2csIDI1MCwge1xyXG4gICAqICAgJ21heFdhaXQnOiAxMDAwXHJcbiAgICogfSkpO1xyXG4gICAqXHJcbiAgICogLy8gY2FuY2VsIGEgZGVib3VuY2VkIGNhbGxcclxuICAgKiB2YXIgdG9kb0NoYW5nZXMgPSBfLmRlYm91bmNlKGJhdGNoTG9nLCAxMDAwKTtcclxuICAgKiBPYmplY3Qub2JzZXJ2ZShtb2RlbHMudG9kbywgdG9kb0NoYW5nZXMpO1xyXG4gICAqXHJcbiAgICogT2JqZWN0Lm9ic2VydmUobW9kZWxzLCBmdW5jdGlvbihjaGFuZ2VzKSB7XHJcbiAgICogICBpZiAoXy5maW5kKGNoYW5nZXMsIHsgJ3VzZXInOiAndG9kbycsICd0eXBlJzogJ2RlbGV0ZSd9KSkge1xyXG4gICAqICAgICB0b2RvQ2hhbmdlcy5jYW5jZWwoKTtcclxuICAgKiAgIH1cclxuICAgKiB9LCBbJ2RlbGV0ZSddKTtcclxuICAgKlxyXG4gICAqIC8vIC4uLmF0IHNvbWUgcG9pbnQgYG1vZGVscy50b2RvYCBpcyBjaGFuZ2VkXHJcbiAgICogbW9kZWxzLnRvZG8uY29tcGxldGVkID0gdHJ1ZTtcclxuICAgKlxyXG4gICAqIC8vIC4uLmJlZm9yZSAxIHNlY29uZCBoYXMgcGFzc2VkIGBtb2RlbHMudG9kb2AgaXMgZGVsZXRlZFxyXG4gICAqIC8vIHdoaWNoIGNhbmNlbHMgdGhlIGRlYm91bmNlZCBgdG9kb0NoYW5nZXNgIGNhbGxcclxuICAgKiBkZWxldGUgbW9kZWxzLnRvZG87XHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgb3B0aW9ucykge1xyXG4gICAgdmFyIGFyZ3MsXHJcbiAgICAgICAgICAgIG1heFRpbWVvdXRJZCxcclxuICAgICAgICAgICAgcmVzdWx0LFxyXG4gICAgICAgICAgICBzdGFtcCxcclxuICAgICAgICAgICAgdGhpc0FyZyxcclxuICAgICAgICAgICAgdGltZW91dElkLFxyXG4gICAgICAgICAgICB0cmFpbGluZ0NhbGwsXHJcbiAgICAgICAgICAgIGxhc3RDYWxsZWQgPSAwLFxyXG4gICAgICAgICAgICBtYXhXYWl0ID0gZmFsc2UsXHJcbiAgICAgICAgICAgIHRyYWlsaW5nID0gdHJ1ZTtcclxuXHJcbiAgICBpZiAodHlwZW9mIGZ1bmMgIT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XHJcbiAgICB9XHJcbiAgICB3YWl0ID0gd2FpdCA8IDAgPyAwIDogKCt3YWl0IHx8IDApO1xyXG4gICAgaWYgKG9wdGlvbnMgPT09IHRydWUpIHtcclxuICAgICAgdmFyIGxlYWRpbmcgPSB0cnVlO1xyXG4gICAgICB0cmFpbGluZyA9IGZhbHNlO1xyXG4gICAgfSBlbHNlIGlmIChpc09iamVjdChvcHRpb25zKSkge1xyXG4gICAgICBsZWFkaW5nID0gISFvcHRpb25zLmxlYWRpbmc7XHJcbiAgICAgIG1heFdhaXQgPSAnbWF4V2FpdCcgaW4gb3B0aW9ucyAmJiBuYXRpdmVNYXgoK29wdGlvbnMubWF4V2FpdCB8fCAwLCB3YWl0KTtcclxuICAgICAgdHJhaWxpbmcgPSAndHJhaWxpbmcnIGluIG9wdGlvbnMgPyAhIW9wdGlvbnMudHJhaWxpbmcgOiB0cmFpbGluZztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjYW5jZWwoKSB7XHJcbiAgICAgIGlmICh0aW1lb3V0SWQpIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAobWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KG1heFRpbWVvdXRJZCk7XHJcbiAgICAgIH1cclxuICAgICAgbGFzdENhbGxlZCA9IDA7XHJcbiAgICAgIG1heFRpbWVvdXRJZCA9IHRpbWVvdXRJZCA9IHRyYWlsaW5nQ2FsbCA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjb21wbGV0ZShpc0NhbGxlZCwgaWQpIHtcclxuICAgICAgaWYgKGlkKSB7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcclxuICAgICAgfVxyXG4gICAgICBtYXhUaW1lb3V0SWQgPSB0aW1lb3V0SWQgPSB0cmFpbGluZ0NhbGwgPSB1bmRlZmluZWQ7XHJcbiAgICAgIGlmIChpc0NhbGxlZCkge1xyXG4gICAgICAgIGxhc3RDYWxsZWQgPSBub3coKTtcclxuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xyXG4gICAgICAgIGlmICghdGltZW91dElkICYmICFtYXhUaW1lb3V0SWQpIHtcclxuICAgICAgICAgIGFyZ3MgPSB0aGlzQXJnID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGRlbGF5ZWQoKSB7XHJcbiAgICAgIHZhciByZW1haW5pbmcgPSB3YWl0IC0gKG5vdygpIC0gc3RhbXApO1xyXG4gICAgICBpZiAocmVtYWluaW5nIDw9IDAgfHwgcmVtYWluaW5nID4gd2FpdCkge1xyXG4gICAgICAgIGNvbXBsZXRlKHRyYWlsaW5nQ2FsbCwgbWF4VGltZW91dElkKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHJlbWFpbmluZyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtYXhEZWxheWVkKCkge1xyXG4gICAgICBjb21wbGV0ZSh0cmFpbGluZywgdGltZW91dElkKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XHJcbiAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgIHN0YW1wID0gbm93KCk7XHJcbiAgICAgIHRoaXNBcmcgPSB0aGlzO1xyXG4gICAgICB0cmFpbGluZ0NhbGwgPSB0cmFpbGluZyAmJiAodGltZW91dElkIHx8ICFsZWFkaW5nKTtcclxuXHJcbiAgICAgIGlmIChtYXhXYWl0ID09PSBmYWxzZSkge1xyXG4gICAgICAgIHZhciBsZWFkaW5nQ2FsbCA9IGxlYWRpbmcgJiYgIXRpbWVvdXRJZDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoIW1heFRpbWVvdXRJZCAmJiAhbGVhZGluZykge1xyXG4gICAgICAgICAgbGFzdENhbGxlZCA9IHN0YW1wO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcmVtYWluaW5nID0gbWF4V2FpdCAtIChzdGFtcCAtIGxhc3RDYWxsZWQpLFxyXG4gICAgICAgICAgICAgICAgaXNDYWxsZWQgPSByZW1haW5pbmcgPD0gMCB8fCByZW1haW5pbmcgPiBtYXhXYWl0O1xyXG5cclxuICAgICAgICBpZiAoaXNDYWxsZWQpIHtcclxuICAgICAgICAgIGlmIChtYXhUaW1lb3V0SWQpIHtcclxuICAgICAgICAgICAgbWF4VGltZW91dElkID0gY2xlYXJUaW1lb3V0KG1heFRpbWVvdXRJZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBsYXN0Q2FsbGVkID0gc3RhbXA7XHJcbiAgICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmICghbWF4VGltZW91dElkKSB7XHJcbiAgICAgICAgICBtYXhUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KG1heERlbGF5ZWQsIHJlbWFpbmluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmIChpc0NhbGxlZCAmJiB0aW1lb3V0SWQpIHtcclxuICAgICAgICB0aW1lb3V0SWQgPSBjbGVhclRpbWVvdXQodGltZW91dElkKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICghdGltZW91dElkICYmIHdhaXQgIT09IG1heFdhaXQpIHtcclxuICAgICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGRlbGF5ZWQsIHdhaXQpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChsZWFkaW5nQ2FsbCkge1xyXG4gICAgICAgIGlzQ2FsbGVkID0gdHJ1ZTtcclxuICAgICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXNBcmcsIGFyZ3MpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChpc0NhbGxlZCAmJiAhdGltZW91dElkICYmICFtYXhUaW1lb3V0SWQpIHtcclxuICAgICAgICBhcmdzID0gdGhpc0FyZyA9IHVuZGVmaW5lZDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGRlYm91bmNlZC5jYW5jZWwgPSBjYW5jZWw7XHJcbiAgICByZXR1cm4gZGVib3VuY2VkO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlIFtsYW5ndWFnZSB0eXBlXShodHRwczovL2VzNS5naXRodWIuaW8vI3g4KSBvZiBgT2JqZWN0YC5cclxuICAgKiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcclxuICAgKlxyXG4gICAqIEBzdGF0aWNcclxuICAgKiBAbWVtYmVyT2YgX1xyXG4gICAqIEBjYXRlZ29yeSBMYW5nXHJcbiAgICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXHJcbiAgICogQGV4YW1wbGVcclxuICAgKlxyXG4gICAqIF8uaXNPYmplY3Qoe30pO1xyXG4gICAqIC8vID0+IHRydWVcclxuICAgKlxyXG4gICAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcclxuICAgKiAvLyA9PiB0cnVlXHJcbiAgICpcclxuICAgKiBfLmlzT2JqZWN0KDEpO1xyXG4gICAqIC8vID0+IGZhbHNlXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcclxuICAgIC8vIEF2b2lkIGEgVjggSklUIGJ1ZyBpbiBDaHJvbWUgMTktMjAuXHJcbiAgICAvLyBTZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTIyOTEgZm9yIG1vcmUgZGV0YWlscy5cclxuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xyXG4gICAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBkZWJvdW5jZTtcclxuXHJcbn0pKCk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGRlYm91bmNlOyIsIjsoZnVuY3Rpb24oKXsgJ3VzZSBzdHJpY3QnO1xyXG4gIFxyXG4gIHZhciBhbmNob3JQb2ludFV0aWxpdGllcyA9IHJlcXVpcmUoJy4vQW5jaG9yUG9pbnRVdGlsaXRpZXMnKTtcclxuICB2YXIgZGVib3VuY2UgPSByZXF1aXJlKFwiLi9kZWJvdW5jZVwiKTtcclxuICBcclxuICAvLyByZWdpc3RlcnMgdGhlIGV4dGVuc2lvbiBvbiBhIGN5dG9zY2FwZSBsaWIgcmVmXHJcbiAgdmFyIHJlZ2lzdGVyID0gZnVuY3Rpb24oIGN5dG9zY2FwZSwgJCwgS29udmEpe1xyXG4gICAgdmFyIHVpVXRpbGl0aWVzID0gcmVxdWlyZSgnLi9VSVV0aWxpdGllcycpO1xyXG4gICAgXHJcbiAgICBpZiggIWN5dG9zY2FwZSB8fCAhJCB8fCAhS29udmEpeyByZXR1cm47IH0gLy8gY2FuJ3QgcmVnaXN0ZXIgaWYgcmVxdWlyZWQgbGlicmFyaWVzIHVuc3BlY2lmaWVkXHJcblxyXG4gICAgdmFyIGRlZmF1bHRzID0ge1xyXG4gICAgICAvLyB0aGlzIGZ1bmN0aW9uIHNwZWNpZmllcyB0aGUgcG9pdGlvbnMgb2YgYmVuZCBwb2ludHNcclxuICAgICAgLy8gc3RyaWN0bHkgbmFtZSB0aGUgcHJvcGVydHkgJ2JlbmRQb2ludFBvc2l0aW9ucycgZm9yIHRoZSBlZGdlIHRvIGJlIGRldGVjdGVkIGZvciBiZW5kIHBvaW50IGVkaXRpdG5nXHJcbiAgICAgIGJlbmRQb3NpdGlvbnNGdW5jdGlvbjogZnVuY3Rpb24oZWxlKSB7XHJcbiAgICAgICAgcmV0dXJuIGVsZS5kYXRhKCdiZW5kUG9pbnRQb3NpdGlvbnMnKTtcclxuICAgICAgfSxcclxuICAgICAgLy8gdGhpcyBmdW5jdGlvbiBzcGVjaWZpZXMgdGhlIHBvaXRpb25zIG9mIGNvbnRyb2wgcG9pbnRzXHJcbiAgICAgIC8vIHN0cmljdGx5IG5hbWUgdGhlIHByb3BlcnR5ICdjb250cm9sUG9pbnRQb3NpdGlvbnMnIGZvciB0aGUgZWRnZSB0byBiZSBkZXRlY3RlZCBmb3IgY29udHJvbCBwb2ludCBlZGl0aXRuZ1xyXG4gICAgICBjb250cm9sUG9zaXRpb25zRnVuY3Rpb246IGZ1bmN0aW9uKGVsZSkge1xyXG4gICAgICAgIHJldHVybiBlbGUuZGF0YSgnY29udHJvbFBvaW50UG9zaXRpb25zJyk7XHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIHdoZXRoZXIgdG8gaW5pdGlsaXplIGJlbmQgYW5kIGNvbnRyb2wgcG9pbnRzIG9uIGNyZWF0aW9uIG9mIHRoaXMgZXh0ZW5zaW9uIGF1dG9tYXRpY2FsbHlcclxuICAgICAgaW5pdEFuY2hvcnNBdXRvbWF0aWNhbGx5OiB0cnVlLFxyXG4gICAgICAvLyB0aGUgY2xhc3NlcyBvZiB0aG9zZSBlZGdlcyB0aGF0IHNob3VsZCBiZSBpZ25vcmVkXHJcbiAgICAgIGlnbm9yZWRDbGFzc2VzOiBbXSxcclxuICAgICAgLy8gd2hldGhlciB0aGUgYmVuZCBhbmQgY29udHJvbCBlZGl0aW5nIG9wZXJhdGlvbnMgYXJlIHVuZG9hYmxlIChyZXF1aXJlcyBjeXRvc2NhcGUtdW5kby1yZWRvLmpzKVxyXG4gICAgICB1bmRvYWJsZTogZmFsc2UsXHJcbiAgICAgIC8vIHRoZSBzaXplIG9mIGJlbmQgYW5kIGNvbnRyb2wgcG9pbnQgc2hhcGUgaXMgb2J0YWluZWQgYnkgbXVsdGlwbGluZyB3aWR0aCBvZiBlZGdlIHdpdGggdGhpcyBwYXJhbWV0ZXJcclxuICAgICAgYW5jaG9yU2hhcGVTaXplRmFjdG9yOiAzLFxyXG4gICAgICAvLyB6LWluZGV4IHZhbHVlIG9mIHRoZSBjYW52YXMgaW4gd2hpY2ggYmVuZCBhbmQgY29udHJvbCBwb2ludHMgYXJlIGRyYXduXHJcbiAgICAgIHpJbmRleDogOTk5LCAgICAgIFxyXG4gICAgICAvLyB3aGV0aGVyIHRvIHN0YXJ0IHRoZSBwbHVnaW4gaW4gdGhlIGVuYWJsZWQgc3RhdGVcclxuICAgICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgICAgLy9BbiBvcHRpb24gdGhhdCBjb250cm9scyB0aGUgZGlzdGFuY2Ugd2l0aGluIHdoaWNoIGEgYmVuZCBwb2ludCBpcyBjb25zaWRlcmVkIFwibmVhclwiIHRoZSBsaW5lIHNlZ21lbnQgYmV0d2VlbiBpdHMgdHdvIG5laWdoYm9ycyBhbmQgd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHJlbW92ZWRcclxuICAgICAgYmVuZFJlbW92YWxTZW5zaXRpdml0eSA6IDgsXHJcbiAgICAgIC8vIHRpdGxlIG9mIGFkZCBiZW5kIHBvaW50IG1lbnUgaXRlbSAoVXNlciBtYXkgbmVlZCB0byBhZGp1c3Qgd2lkdGggb2YgbWVudSBpdGVtcyBhY2NvcmRpbmcgdG8gbGVuZ3RoIG9mIHRoaXMgb3B0aW9uKVxyXG4gICAgICBhZGRCZW5kTWVudUl0ZW1UaXRsZTogXCJBZGQgQmVuZCBQb2ludFwiLFxyXG4gICAgICAvLyB0aXRsZSBvZiByZW1vdmUgYmVuZCBwb2ludCBtZW51IGl0ZW0gKFVzZXIgbWF5IG5lZWQgdG8gYWRqdXN0IHdpZHRoIG9mIG1lbnUgaXRlbXMgYWNjb3JkaW5nIHRvIGxlbmd0aCBvZiB0aGlzIG9wdGlvbilcclxuICAgICAgcmVtb3ZlQmVuZE1lbnVJdGVtVGl0bGU6IFwiUmVtb3ZlIEJlbmQgUG9pbnRcIixcclxuICAgICAgLy8gdGl0bGUgb2YgcmVtb3ZlIGFsbCBiZW5kIHBvaW50cyBtZW51IGl0ZW1cclxuICAgICAgcmVtb3ZlQWxsQmVuZE1lbnVJdGVtVGl0bGU6IFwiUmVtb3ZlIEFsbCBCZW5kIFBvaW50c1wiLFxyXG4gICAgICAvLyB0aXRsZSBvZiBhZGQgY29udHJvbCBwb2ludCBtZW51IGl0ZW0gKFVzZXIgbWF5IG5lZWQgdG8gYWRqdXN0IHdpZHRoIG9mIG1lbnUgaXRlbXMgYWNjb3JkaW5nIHRvIGxlbmd0aCBvZiB0aGlzIG9wdGlvbilcclxuICAgICAgYWRkQ29udHJvbE1lbnVJdGVtVGl0bGU6IFwiQWRkIENvbnRyb2wgUG9pbnRcIixcclxuICAgICAgLy8gdGl0bGUgb2YgcmVtb3ZlIGNvbnRyb2wgcG9pbnQgbWVudSBpdGVtIChVc2VyIG1heSBuZWVkIHRvIGFkanVzdCB3aWR0aCBvZiBtZW51IGl0ZW1zIGFjY29yZGluZyB0byBsZW5ndGggb2YgdGhpcyBvcHRpb24pXHJcbiAgICAgIHJlbW92ZUNvbnRyb2xNZW51SXRlbVRpdGxlOiBcIlJlbW92ZSBDb250cm9sIFBvaW50XCIsXHJcbiAgICAgIC8vIHRpdGxlIG9mIHJlbW92ZSBhbGwgY29udHJvbCBwb2ludHMgbWVudSBpdGVtXHJcbiAgICAgIHJlbW92ZUFsbENvbnRyb2xNZW51SXRlbVRpdGxlOiBcIlJlbW92ZSBBbGwgQ29udHJvbCBQb2ludHNcIixcclxuICAgICAgLy8gd2hldGhlciB0aGUgYmVuZCBhbmQgY29udHJvbCBwb2ludHMgY2FuIGJlIG1vdmVkIGJ5IGFycm93c1xyXG4gICAgICBtb3ZlU2VsZWN0ZWRBbmNob3JzT25LZXlFdmVudHM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9LFxyXG4gICAgICAvLyB3aGV0aGVyICdSZW1vdmUgYWxsIGJlbmQgcG9pbnRzJyBhbmQgJ1JlbW92ZSBhbGwgY29udHJvbCBwb2ludHMnIG9wdGlvbnMgc2hvdWxkIGJlIHByZXNlbnRlZFxyXG4gICAgICBlbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb246IGZhbHNlLFxyXG4gICAgICAvLyB3aGV0aGVyIGFsbG93cyBhZGRpbmcgYmVuZGluZyBwb2ludCBieSBkcmFnaW5nIGVkZ2Ugd2l0aG91dCB1c2VpbmcgY3R4bWVudSwgZGVmYXVsdCBpcyB0cnVlXHJcbiAgICAgIGVuYWJsZUNyZWF0ZUFuY2hvck9uRHJhZzp0cnVlLFxyXG4gICAgICAvLyBob3cgdG8gc21hcnRseSBtb3ZlIHRoZSBhbmNob3IgcG9pbnQgdG8gcGVyZmVjdCAwIDQ1IG9yIDkwIGRlZ3JlZSBwb3NpdGlvbiwgdW5pdCBpcyBweFxyXG4gICAgICBzdGlja3lBbmNob3JUb2xlcmVuY2U6IDIwICAvLy0xIGFjdHVhbGx5IGRpc2FibGUgdGhpcyBmZWF0dXJlLCBjaGFuZ2UgaXQgdG8gMjAgdG8gdGVzdCB0aGUgZmVhdHVyZVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgdmFyIG9wdGlvbnM7XHJcbiAgICB2YXIgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuICAgIFxyXG4gICAgLy8gTWVyZ2UgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIG9uZXMgY29taW5nIGZyb20gcGFyYW1ldGVyXHJcbiAgICBmdW5jdGlvbiBleHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMpIHtcclxuICAgICAgdmFyIG9iaiA9IHt9O1xyXG5cclxuICAgICAgZm9yICh2YXIgaSBpbiBkZWZhdWx0cykge1xyXG4gICAgICAgIG9ialtpXSA9IGRlZmF1bHRzW2ldO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IgKHZhciBpIGluIG9wdGlvbnMpIHtcclxuICAgICAgICAvLyBTUExJVCBGVU5DVElPTkFMSVRZP1xyXG4gICAgICAgIGlmKGkgPT0gXCJiZW5kUmVtb3ZhbFNlbnNpdGl2aXR5XCIpe1xyXG4gICAgICAgICAgdmFyIHZhbHVlID0gb3B0aW9uc1tpXTtcclxuICAgICAgICAgICBpZighaXNOYU4odmFsdWUpKVxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBpZih2YWx1ZSA+PSAwICYmIHZhbHVlIDw9IDIwKXtcclxuICAgICAgICAgICAgICAgIG9ialtpXSA9IG9wdGlvbnNbaV07XHJcbiAgICAgICAgICAgICAgfWVsc2UgaWYodmFsdWUgPCAwKXtcclxuICAgICAgICAgICAgICAgIG9ialtpXSA9IDBcclxuICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIG9ialtpXSA9IDIwXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIG9ialtpXSA9IG9wdGlvbnNbaV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG9iajtcclxuICAgIH07XHJcbiAgICBcclxuICAgIGN5dG9zY2FwZSggJ2NvcmUnLCAnZWRnZUVkaXRpbmcnLCBmdW5jdGlvbihvcHRzKXtcclxuICAgICAgdmFyIGN5ID0gdGhpcztcclxuICAgICAgXHJcbiAgICAgIGlmKCBvcHRzID09PSAnaW5pdGlhbGl6ZWQnICkge1xyXG4gICAgICAgIHJldHVybiBpbml0aWFsaXplZDtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgaWYoIG9wdHMgIT09ICdnZXQnICkge1xyXG4gICAgICAgIC8vIG1lcmdlIHRoZSBvcHRpb25zIHdpdGggZGVmYXVsdCBvbmVzXHJcbiAgICAgICAgb3B0aW9ucyA9IGV4dGVuZChkZWZhdWx0cywgb3B0cyk7XHJcbiAgICAgICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyBkZWZpbmUgZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHMgY3NzIGNsYXNzXHJcbiAgICAgICAgY3kuc3R5bGUoKS5zZWxlY3RvcignLmVkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJykuY3NzKHtcclxuICAgICAgICAgICdjdXJ2ZS1zdHlsZSc6ICdzZWdtZW50cycsXHJcbiAgICAgICAgICAnc2VnbWVudC1kaXN0YW5jZXMnOiBmdW5jdGlvbiAoZWxlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXREaXN0YW5jZXNTdHJpbmcoZWxlLCAnYmVuZCcpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgICdzZWdtZW50LXdlaWdodHMnOiBmdW5jdGlvbiAoZWxlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRXZWlnaHRzU3RyaW5nKGVsZSwgJ2JlbmQnKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAnZWRnZS1kaXN0YW5jZXMnOiAnbm9kZS1wb3NpdGlvbidcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIGVkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzIGNzcyBjbGFzc1xyXG4gICAgICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJy5lZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpLmNzcyh7XHJcbiAgICAgICAgICAnY3VydmUtc3R5bGUnOiAndW5idW5kbGVkLWJlemllcicsXHJcbiAgICAgICAgICAnY29udHJvbC1wb2ludC1kaXN0YW5jZXMnOiBmdW5jdGlvbiAoZWxlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXREaXN0YW5jZXNTdHJpbmcoZWxlLCAnY29udHJvbCcpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgICdjb250cm9sLXBvaW50LXdlaWdodHMnOiBmdW5jdGlvbiAoZWxlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRXZWlnaHRzU3RyaW5nKGVsZSwgJ2NvbnRyb2wnKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICAnZWRnZS1kaXN0YW5jZXMnOiAnbm9kZS1wb3NpdGlvbidcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuc2V0SWdub3JlZENsYXNzZXMob3B0aW9ucy5pZ25vcmVkQ2xhc3Nlcyk7XHJcblxyXG4gICAgICAgIC8vIGluaXQgYmVuZCBwb3NpdGlvbnMgY29uZGl0aW9uYWxseVxyXG4gICAgICAgIGlmIChvcHRpb25zLmluaXRBbmNob3JzQXV0b21hdGljYWxseSkge1xyXG4gICAgICAgICAgLy8gQ0hFQ0sgVEhJUywgb3B0aW9ucy5pZ25vcmVkQ2xhc3NlcyBVTlVTRURcclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLmluaXRBbmNob3JQb2ludHMob3B0aW9ucy5iZW5kUG9zaXRpb25zRnVuY3Rpb24sIG9wdGlvbnMuY29udHJvbFBvc2l0aW9uc0Z1bmN0aW9uLCBjeS5lZGdlcygpLCBvcHRpb25zLmlnbm9yZWRDbGFzc2VzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKG9wdGlvbnMuZW5hYmxlZClcclxuICAgICAgICAgIHVpVXRpbGl0aWVzKG9wdGlvbnMsIGN5KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICB1aVV0aWxpdGllcyhcInVuYmluZFwiLCBjeSk7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IGluaXRpYWxpemVkID8ge1xyXG4gICAgICAgIC8qXHJcbiAgICAgICAgKiBnZXQgYmVuZCBvciBjb250cm9sIHBvaW50cyBvZiB0aGUgZ2l2ZW4gZWRnZSBpbiBhbiBhcnJheSBBLFxyXG4gICAgICAgICogQVsyICogaV0gaXMgdGhlIHggY29vcmRpbmF0ZSBhbmQgQVsyICogaSArIDFdIGlzIHRoZSB5IGNvb3JkaW5hdGVcclxuICAgICAgICAqIG9mIHRoZSBpdGggYmVuZCBwb2ludC4gKFJldHVybnMgdW5kZWZpbmVkIGlmIHRoZSBjdXJ2ZSBzdHlsZSBpcyBub3Qgc2VnbWVudHMgbm9yIHVuYnVuZGxlZCBiZXppZXIpXHJcbiAgICAgICAgKi9cclxuICAgICAgICBnZXRBbmNob3JzQXNBcnJheTogZnVuY3Rpb24oZWxlKSB7XHJcbiAgICAgICAgICByZXR1cm4gYW5jaG9yUG9pbnRVdGlsaXRpZXMuZ2V0QW5jaG9yc0FzQXJyYXkoZWxlKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIEluaXRpbGl6ZSBwb2ludHMgZm9yIHRoZSBnaXZlbiBlZGdlcyB1c2luZyAnb3B0aW9ucy5iZW5kUG9zaXRpb25zRnVuY3Rpb24nXHJcbiAgICAgICAgaW5pdEFuY2hvclBvaW50czogZnVuY3Rpb24oZWxlcykge1xyXG4gICAgICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaW5pdEFuY2hvclBvaW50cyhvcHRpb25zLmJlbmRQb3NpdGlvbnNGdW5jdGlvbiwgb3B0aW9ucy5jb250cm9sUG9zaXRpb25zRnVuY3Rpb24sIGVsZXMpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGVsZXRlU2VsZWN0ZWRBbmNob3I6IGZ1bmN0aW9uKGVsZSwgaW5kZXgpIHtcclxuICAgICAgICAgIGFuY2hvclBvaW50VXRpbGl0aWVzLnJlbW92ZUFuY2hvcihlbGUsIGluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gOiB1bmRlZmluZWQ7XHJcblxyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7IC8vIGNoYWluYWJpbGl0eVxyXG4gICAgfSApO1xyXG5cclxuICB9O1xyXG5cclxuICBpZiggdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMgKXsgLy8gZXhwb3NlIGFzIGEgY29tbW9uanMgbW9kdWxlXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyO1xyXG4gIH1cclxuXHJcbiAgaWYoIHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQgKXsgLy8gZXhwb3NlIGFzIGFuIGFtZC9yZXF1aXJlanMgbW9kdWxlXHJcbiAgICBkZWZpbmUoJ2N5dG9zY2FwZS1lZGdlLWVkaXRpbmcnLCBmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4gcmVnaXN0ZXI7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGlmKCB0eXBlb2YgY3l0b3NjYXBlICE9PSAndW5kZWZpbmVkJyAmJiAkICYmIEtvbnZhKXsgLy8gZXhwb3NlIHRvIGdsb2JhbCBjeXRvc2NhcGUgKGkuZS4gd2luZG93LmN5dG9zY2FwZSlcclxuICAgIHJlZ2lzdGVyKCBjeXRvc2NhcGUsICQsIEtvbnZhICk7XHJcbiAgfVxyXG5cclxufSkoKTtcclxuIiwidmFyIHJlY29ubmVjdGlvblV0aWxpdGllcyA9IHtcclxuXHJcbiAgICAvLyBjcmVhdGVzIGFuZCByZXR1cm5zIGEgZHVtbXkgbm9kZSB3aGljaCBpcyBjb25uZWN0ZWQgdG8gdGhlIGRpc2Nvbm5lY3RlZCBlZGdlXHJcbiAgICBkaXNjb25uZWN0RWRnZTogZnVuY3Rpb24gKGVkZ2UsIGN5LCBwb3NpdGlvbiwgZGlzY29ubmVjdGVkRW5kKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGR1bW15Tm9kZSA9IHtcclxuICAgICAgICAgICAgZGF0YTogeyBcclxuICAgICAgICAgICAgICBpZDogJ253dF9yZWNvbm5lY3RFZGdlX2R1bW15JyxcclxuICAgICAgICAgICAgICBwb3J0czogW10sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgd2lkdGg6IDEsXHJcbiAgICAgICAgICAgICAgaGVpZ2h0OiAxLFxyXG4gICAgICAgICAgICAgICd2aXNpYmlsaXR5JzogJ2hpZGRlbidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVuZGVyZWRQb3NpdGlvbjogcG9zaXRpb25cclxuICAgICAgICB9O1xyXG4gICAgICAgIGN5LmFkZChkdW1teU5vZGUpO1xyXG5cclxuICAgICAgICB2YXIgbG9jID0gKGRpc2Nvbm5lY3RlZEVuZCA9PT0gJ3NvdXJjZScpID8gXHJcbiAgICAgICAgICAgIHtzb3VyY2U6IGR1bW15Tm9kZS5kYXRhLmlkfSA6IFxyXG4gICAgICAgICAgICB7dGFyZ2V0OiBkdW1teU5vZGUuZGF0YS5pZH07XHJcblxyXG4gICAgICAgIGVkZ2UgPSBlZGdlLm1vdmUobG9jKVswXTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZHVtbXlOb2RlOiBjeS5ub2RlcyhcIiNcIiArIGR1bW15Tm9kZS5kYXRhLmlkKVswXSxcclxuICAgICAgICAgICAgZWRnZTogZWRnZVxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvbm5lY3RFZGdlOiBmdW5jdGlvbiAoZWRnZSwgbm9kZSwgbG9jYXRpb24pIHtcclxuICAgICAgICBpZighZWRnZS5pc0VkZ2UoKSB8fCAhbm9kZS5pc05vZGUoKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgbG9jID0ge307XHJcbiAgICAgICAgaWYobG9jYXRpb24gPT09ICdzb3VyY2UnKVxyXG4gICAgICAgICAgICBsb2Muc291cmNlID0gbm9kZS5pZCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2UgaWYobG9jYXRpb24gPT09ICd0YXJnZXQnKVxyXG4gICAgICAgICAgICBsb2MudGFyZ2V0ID0gbm9kZS5pZCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICByZXR1cm4gZWRnZS5tb3ZlKGxvYylbMF07XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHlFZGdlOiBmdW5jdGlvbiAob2xkRWRnZSwgbmV3RWRnZSkge1xyXG4gICAgICAgIHRoaXMuY29weUFuY2hvcnMob2xkRWRnZSwgbmV3RWRnZSk7XHJcbiAgICAgICAgdGhpcy5jb3B5U3R5bGUob2xkRWRnZSwgbmV3RWRnZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHlTdHlsZTogZnVuY3Rpb24gKG9sZEVkZ2UsIG5ld0VkZ2UpIHtcclxuICAgICAgICBpZihvbGRFZGdlICYmIG5ld0VkZ2Upe1xyXG4gICAgICAgICAgICBuZXdFZGdlLmRhdGEoJ2xpbmUtY29sb3InLCBvbGRFZGdlLmRhdGEoJ2xpbmUtY29sb3InKSk7XHJcbiAgICAgICAgICAgIG5ld0VkZ2UuZGF0YSgnd2lkdGgnLCBvbGRFZGdlLmRhdGEoJ3dpZHRoJykpO1xyXG4gICAgICAgICAgICBuZXdFZGdlLmRhdGEoJ2NhcmRpbmFsaXR5Jywgb2xkRWRnZS5kYXRhKCdjYXJkaW5hbGl0eScpKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIGNvcHlBbmNob3JzOiBmdW5jdGlvbiAob2xkRWRnZSwgbmV3RWRnZSkge1xyXG4gICAgICAgIGlmKG9sZEVkZ2UuaGFzQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJykpe1xyXG4gICAgICAgICAgICB2YXIgYnBEaXN0YW5jZXMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzJyk7XHJcbiAgICAgICAgICAgIHZhciBicFdlaWdodHMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cycpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcycsIGJwRGlzdGFuY2VzKTtcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMnLCBicFdlaWdodHMpO1xyXG4gICAgICAgICAgICBuZXdFZGdlLmFkZENsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKG9sZEVkZ2UuaGFzQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJykpe1xyXG4gICAgICAgICAgICB2YXIgYnBEaXN0YW5jZXMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzJyk7XHJcbiAgICAgICAgICAgIHZhciBicFdlaWdodHMgPSBvbGRFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cycpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcycsIGJwRGlzdGFuY2VzKTtcclxuICAgICAgICAgICAgbmV3RWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMnLCBicFdlaWdodHMpO1xyXG4gICAgICAgICAgICBuZXdFZGdlLmFkZENsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob2xkRWRnZS5oYXNDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc211bHRpcGxlYmVuZHBvaW50cycpKSB7XHJcbiAgICAgICAgICAgIG5ld0VkZ2UuYWRkQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNtdWx0aXBsZWJlbmRwb2ludHMnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAob2xkRWRnZS5oYXNDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc211bHRpcGxlY29udHJvbHBvaW50cycpKSB7XHJcbiAgICAgICAgICAgIG5ld0VkZ2UuYWRkQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNtdWx0aXBsZWNvbnRyb2xwb2ludHMnKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG59O1xyXG4gIFxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlY29ubmVjdGlvblV0aWxpdGllcztcclxuICAiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeSwgYW5jaG9yUG9pbnRVdGlsaXRpZXMsIHBhcmFtcykge1xyXG4gIGlmIChjeS51bmRvUmVkbyA9PSBudWxsKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdXIgPSBjeS51bmRvUmVkbyh7XHJcbiAgICBkZWZhdWx0QWN0aW9uczogZmFsc2UsXHJcbiAgICBpc0RlYnVnOiB0cnVlXHJcbiAgfSk7XHJcblxyXG4gIGZ1bmN0aW9uIGNoYW5nZUFuY2hvclBvaW50cyhwYXJhbSkge1xyXG4gICAgdmFyIGVkZ2UgPSBjeS5nZXRFbGVtZW50QnlJZChwYXJhbS5lZGdlLmlkKCkpO1xyXG4gICAgdmFyIHR5cGUgPSBwYXJhbS50eXBlICE9PSAnaW5jb25jbHVzaXZlJyA/IHBhcmFtLnR5cGUgOiBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgIFxyXG4gICAgdmFyIHdlaWdodHMsIGRpc3RhbmNlcywgd2VpZ2h0U3RyLCBkaXN0YW5jZVN0cjtcclxuXHJcbiAgICBpZihwYXJhbS50eXBlID09PSAnaW5jb25jbHVzaXZlJyAmJiAhcGFyYW0uc2V0KXtcclxuICAgICAgd2VpZ2h0cyA9IFtdO1xyXG4gICAgICBkaXN0YW5jZXMgPSBbXTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB3ZWlnaHRTdHIgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ3dlaWdodCddO1xyXG4gICAgICBkaXN0YW5jZVN0ciA9IGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsnZGlzdGFuY2UnXTtcclxuXHJcbiAgICAgIHdlaWdodHMgPSBwYXJhbS5zZXQgPyBlZGdlLmRhdGEod2VpZ2h0U3RyKSA6IHBhcmFtLndlaWdodHM7XHJcbiAgICAgIGRpc3RhbmNlcyA9IHBhcmFtLnNldCA/IGVkZ2UuZGF0YShkaXN0YW5jZVN0cikgOiBwYXJhbS5kaXN0YW5jZXM7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgZWRnZTogZWRnZSxcclxuICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgd2VpZ2h0czogd2VpZ2h0cyxcclxuICAgICAgZGlzdGFuY2VzOiBkaXN0YW5jZXMsXHJcbiAgICAgIC8vQXMgdGhlIHJlc3VsdCB3aWxsIG5vdCBiZSB1c2VkIGZvciB0aGUgZmlyc3QgZnVuY3Rpb24gY2FsbCBwYXJhbXMgc2hvdWxkIGJlIHVzZWQgdG8gc2V0IHRoZSBkYXRhXHJcbiAgICAgIHNldDogdHJ1ZVxyXG4gICAgfTtcclxuXHJcbiAgICAvL0NoZWNrIGlmIHdlIG5lZWQgdG8gc2V0IHRoZSB3ZWlnaHRzIGFuZCBkaXN0YW5jZXMgYnkgdGhlIHBhcmFtIHZhbHVlc1xyXG4gICAgaWYgKHBhcmFtLnNldCkge1xyXG4gICAgICB2YXIgaGFkQW5jaG9yUG9pbnQgPSBwYXJhbS53ZWlnaHRzICYmIHBhcmFtLndlaWdodHMubGVuZ3RoID4gMDtcclxuICAgICAgdmFyIGhhZE11bHRpcGxlQW5jaG9yUG9pbnRzID0gaGFkQW5jaG9yUG9pbnQgJiYgcGFyYW0ud2VpZ2h0cy5sZW5ndGggPiAxO1xyXG5cclxuICAgICAgaGFkQW5jaG9yUG9pbnQgPyBlZGdlLmRhdGEod2VpZ2h0U3RyLCBwYXJhbS53ZWlnaHRzKSA6IGVkZ2UucmVtb3ZlRGF0YSh3ZWlnaHRTdHIpO1xyXG4gICAgICBoYWRBbmNob3JQb2ludCA/IGVkZ2UuZGF0YShkaXN0YW5jZVN0ciwgcGFyYW0uZGlzdGFuY2VzKSA6IGVkZ2UucmVtb3ZlRGF0YShkaXN0YW5jZVN0cik7XHJcblxyXG4gICAgICB2YXIgc2luZ2xlQ2xhc3NOYW1lID0gYW5jaG9yUG9pbnRVdGlsaXRpZXMuc3ludGF4W3R5cGVdWydjbGFzcyddO1xyXG4gICAgICB2YXIgbXVsdGlDbGFzc05hbWUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5zeW50YXhbdHlwZV1bJ211bHRpQ2xhc3MnXTtcclxuXHJcbiAgICAgIC8vIFJlZnJlc2ggdGhlIGN1cnZlIHN0eWxlIGFzIHRoZSBudW1iZXIgb2YgYW5jaG9yIHBvaW50IHdvdWxkIGJlIGNoYW5nZWQgYnkgdGhlIHByZXZpb3VzIG9wZXJhdGlvblxyXG4gICAgICAvLyBBZGRpbmcgb3IgcmVtb3ZpbmcgbXVsdGkgY2xhc3NlcyBhdCBvbmNlIGNhbiBjYXVzZSBlcnJvcnMuIElmIG11bHRpcGxlIGNsYXNzZXMgYXJlIHRvIGJlIGFkZGVkLFxyXG4gICAgICAvLyBqdXN0IGFkZCB0aGVtIHRvZ2V0aGVyIGluIHNwYWNlIGRlbGltZXRlZCBjbGFzcyBuYW1lcyBmb3JtYXQuXHJcbiAgICAgIGlmICghaGFkQW5jaG9yUG9pbnQgJiYgIWhhZE11bHRpcGxlQW5jaG9yUG9pbnRzKSB7XHJcbiAgICAgICAgLy8gUmVtb3ZlIG11bHRpcGxlIGNsYXNzZXMgZnJvbSBlZGdlIHdpdGggc3BhY2UgZGVsaW1ldGVkIHN0cmluZyBvZiBjbGFzcyBuYW1lcyBcclxuICAgICAgICBlZGdlLnJlbW92ZUNsYXNzKHNpbmdsZUNsYXNzTmFtZSArIFwiIFwiICsgbXVsdGlDbGFzc05hbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGhhZEFuY2hvclBvaW50ICYmICFoYWRNdWx0aXBsZUFuY2hvclBvaW50cykgeyAvLyBIYWQgc2luZ2xlIGFuY2hvclxyXG4gICAgICAgIGVkZ2UuYWRkQ2xhc3Moc2luZ2xlQ2xhc3NOYW1lKTtcclxuICAgICAgICBlZGdlLnJlbW92ZUNsYXNzKG11bHRpQ2xhc3NOYW1lKTsgICBcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBIYWQgbXVsdGlwbGUgYW5jaG9ycy4gQWRkIG11bHRpcGxlIGNsYXNzZXMgd2l0aCBzcGFjZSBkZWxpbWV0ZWQgc3RyaW5nIG9mIGNsYXNzIG5hbWVzXHJcbiAgICAgICAgZWRnZS5hZGRDbGFzcyhzaW5nbGVDbGFzc05hbWUgKyBcIiBcIiArIG11bHRpQ2xhc3NOYW1lKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIWVkZ2Uuc2VsZWN0ZWQoKSlcclxuICAgICAgICBlZGdlLnNlbGVjdCgpO1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBlZGdlLnVuc2VsZWN0KCk7XHJcbiAgICAgICAgZWRnZS5zZWxlY3QoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBlZGdlLnRyaWdnZXIoJ2N5ZWRnZWVkaXRpbmcuY2hhbmdlQW5jaG9yUG9pbnRzJyk7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG1vdmVEbyhhcmcpIHtcclxuICAgICAgaWYgKGFyZy5maXJzdFRpbWUpIHtcclxuICAgICAgICAgIGRlbGV0ZSBhcmcuZmlyc3RUaW1lO1xyXG4gICAgICAgICAgcmV0dXJuIGFyZztcclxuICAgICAgfVxyXG5cclxuICAgICAgdmFyIGVkZ2VzID0gYXJnLmVkZ2VzO1xyXG4gICAgICB2YXIgcG9zaXRpb25EaWZmID0gYXJnLnBvc2l0aW9uRGlmZjtcclxuICAgICAgdmFyIHJlc3VsdCA9IHtcclxuICAgICAgICAgIGVkZ2VzOiBlZGdlcyxcclxuICAgICAgICAgIHBvc2l0aW9uRGlmZjoge1xyXG4gICAgICAgICAgICAgIHg6IC1wb3NpdGlvbkRpZmYueCxcclxuICAgICAgICAgICAgICB5OiAtcG9zaXRpb25EaWZmLnlcclxuICAgICAgICAgIH1cclxuICAgICAgfTtcclxuICAgICAgbW92ZUFuY2hvcnNVbmRvYWJsZShwb3NpdGlvbkRpZmYsIGVkZ2VzKTtcclxuXHJcbiAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBtb3ZlQW5jaG9yc1VuZG9hYmxlKHBvc2l0aW9uRGlmZiwgZWRnZXMpIHtcclxuICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiggZWRnZSApe1xyXG4gICAgICAgICAgdmFyIHR5cGUgPSBhbmNob3JQb2ludFV0aWxpdGllcy5nZXRFZGdlVHlwZShlZGdlKTtcclxuICAgICAgICAgIHZhciBwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiA9IGFuY2hvclBvaW50VXRpbGl0aWVzLmdldEFuY2hvcnNBc0FycmF5KGVkZ2UpO1xyXG4gICAgICAgICAgdmFyIG5leHRBbmNob3JzUG9zaXRpb24gPSBbXTtcclxuICAgICAgICAgIGlmIChwcmV2aW91c0FuY2hvcnNQb3NpdGlvbiAhPSB1bmRlZmluZWQpXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgZm9yICh2YXIgaT0wOyBpPHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uLmxlbmd0aDsgaSs9MilcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIG5leHRBbmNob3JzUG9zaXRpb24ucHVzaCh7eDogcHJldmlvdXNBbmNob3JzUG9zaXRpb25baV0rcG9zaXRpb25EaWZmLngsIHk6IHByZXZpb3VzQW5jaG9yc1Bvc2l0aW9uW2krMV0rcG9zaXRpb25EaWZmLnl9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWRnZS5kYXRhKGFuY2hvclBvaW50VXRpbGl0aWVzLnN5bnRheFt0eXBlXVsncG9pbnRQb3MnXSwgbmV4dEFuY2hvcnNQb3NpdGlvbik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgYW5jaG9yUG9pbnRVdGlsaXRpZXMuaW5pdEFuY2hvclBvaW50cyhwYXJhbXMuYmVuZFBvc2l0aW9uc0Z1bmN0aW9uLCBwYXJhbXMuY29udHJvbFBvc2l0aW9uc0Z1bmN0aW9uLCBlZGdlcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiByZWNvbm5lY3RFZGdlKHBhcmFtKXtcclxuICAgIHZhciBlZGdlICAgICAgPSBwYXJhbS5lZGdlO1xyXG4gICAgdmFyIGxvY2F0aW9uICA9IHBhcmFtLmxvY2F0aW9uO1xyXG4gICAgdmFyIG9sZExvYyAgICA9IHBhcmFtLm9sZExvYztcclxuXHJcbiAgICBlZGdlID0gZWRnZS5tb3ZlKGxvY2F0aW9uKVswXTtcclxuXHJcbiAgICB2YXIgcmVzdWx0ID0ge1xyXG4gICAgICBlZGdlOiAgICAgZWRnZSxcclxuICAgICAgbG9jYXRpb246IG9sZExvYyxcclxuICAgICAgb2xkTG9jOiAgIGxvY2F0aW9uXHJcbiAgICB9XHJcbiAgICBlZGdlLnVuc2VsZWN0KCk7XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gcmVtb3ZlUmVjb25uZWN0ZWRFZGdlKHBhcmFtKXtcclxuICAgIHZhciBvbGRFZGdlID0gcGFyYW0ub2xkRWRnZTtcclxuICAgIHZhciB0bXAgPSBjeS5nZXRFbGVtZW50QnlJZChvbGRFZGdlLmRhdGEoJ2lkJykpO1xyXG4gICAgaWYodG1wICYmIHRtcC5sZW5ndGggPiAwKVxyXG4gICAgICBvbGRFZGdlID0gdG1wO1xyXG5cclxuICAgIHZhciBuZXdFZGdlID0gcGFyYW0ubmV3RWRnZTtcclxuICAgIHZhciB0bXAgPSBjeS5nZXRFbGVtZW50QnlJZChuZXdFZGdlLmRhdGEoJ2lkJykpO1xyXG4gICAgaWYodG1wICYmIHRtcC5sZW5ndGggPiAwKVxyXG4gICAgICBuZXdFZGdlID0gdG1wO1xyXG5cclxuICAgIGlmKG9sZEVkZ2UuaW5zaWRlKCkpe1xyXG4gICAgICBvbGRFZGdlID0gb2xkRWRnZS5yZW1vdmUoKVswXTtcclxuICAgIH0gXHJcbiAgICAgIFxyXG4gICAgaWYobmV3RWRnZS5yZW1vdmVkKCkpe1xyXG4gICAgICBuZXdFZGdlID0gbmV3RWRnZS5yZXN0b3JlKCk7XHJcbiAgICAgIG5ld0VkZ2UudW5zZWxlY3QoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgb2xkRWRnZTogbmV3RWRnZSxcclxuICAgICAgbmV3RWRnZTogb2xkRWRnZVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHVyLmFjdGlvbignY2hhbmdlQW5jaG9yUG9pbnRzJywgY2hhbmdlQW5jaG9yUG9pbnRzLCBjaGFuZ2VBbmNob3JQb2ludHMpO1xyXG4gIHVyLmFjdGlvbignbW92ZUFuY2hvclBvaW50cycsIG1vdmVEbywgbW92ZURvKTtcclxuICB1ci5hY3Rpb24oJ3JlY29ubmVjdEVkZ2UnLCByZWNvbm5lY3RFZGdlLCByZWNvbm5lY3RFZGdlKTtcclxuICB1ci5hY3Rpb24oJ3JlbW92ZVJlY29ubmVjdGVkRWRnZScsIHJlbW92ZVJlY29ubmVjdGVkRWRnZSwgcmVtb3ZlUmVjb25uZWN0ZWRFZGdlKTtcclxufTtcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIHN0YXJ0dXBcbi8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLy8gVGhpcyBlbnRyeSBtb2R1bGUgaXMgcmVmZXJlbmNlZCBieSBvdGhlciBtb2R1bGVzIHNvIGl0IGNhbid0IGJlIGlubGluZWRcbnZhciBfX3dlYnBhY2tfZXhwb3J0c19fID0gX193ZWJwYWNrX3JlcXVpcmVfXyg1NzkpO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==