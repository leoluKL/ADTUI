(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var topologyDOM=require("./topologyDOM.js")

function initF() {
    console.log("init function.")

    var topologyInstance=new topologyDOM($('#canvas'))
    topologyInstance.init()

}



module.exports = initF
},{"./topologyDOM.js":3}],2:[function(require,module,exports){
const initF=require("./init.js")

$('document').ready(function(){
    initF()
});
},{"./init.js":1}],3:[function(require,module,exports){
'use strict';

function topologyDOM(DOM){
    this.DOM=DOM
}

topologyDOM.prototype.init=function(){
    this.core = cytoscape({
        container:  this.DOM[0], // container to render in

        elements: [ // list of graph elements to start with
            { // node a
                data: { id: 'a' }
            },
            { // node b
                data: { id: 'b' }
            },
            { // edge ab
                data: { id: 'ab', source: 'a', target: 'b' }
            },
            { // edge ab
                data: { id: 'ab2', source: 'a', target: 'b' }
            }
        ],

        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    'background-color': '#666',
                    'label': 'data(id)'
                }
            },

            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#888',
                    'target-arrow-color': '#000',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ],

        layout: {
            name: 'grid',
            rows: 1
        }

    });
}



topologyDOM.prototype.addNode=function(ID){
    
}



module.exports = topologyDOM;
},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL2luaXQuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21haW4uanMiLCJwb3J0YWxTb3VyY2VDb2RlL3RvcG9sb2d5RE9NLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIHRvcG9sb2d5RE9NPXJlcXVpcmUoXCIuL3RvcG9sb2d5RE9NLmpzXCIpXHJcblxyXG5mdW5jdGlvbiBpbml0RigpIHtcclxuICAgIGNvbnNvbGUubG9nKFwiaW5pdCBmdW5jdGlvbi5cIilcclxuXHJcbiAgICB2YXIgdG9wb2xvZ3lJbnN0YW5jZT1uZXcgdG9wb2xvZ3lET00oJCgnI2NhbnZhcycpKVxyXG4gICAgdG9wb2xvZ3lJbnN0YW5jZS5pbml0KClcclxuXHJcbn1cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBpbml0RiIsImNvbnN0IGluaXRGPXJlcXVpcmUoXCIuL2luaXQuanNcIilcclxuXHJcbiQoJ2RvY3VtZW50JykucmVhZHkoZnVuY3Rpb24oKXtcclxuICAgIGluaXRGKClcclxufSk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gdG9wb2xvZ3lET00oRE9NKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaW5pdD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5jb3JlID0gY3l0b3NjYXBlKHtcclxuICAgICAgICBjb250YWluZXI6ICB0aGlzLkRPTVswXSwgLy8gY29udGFpbmVyIHRvIHJlbmRlciBpblxyXG5cclxuICAgICAgICBlbGVtZW50czogWyAvLyBsaXN0IG9mIGdyYXBoIGVsZW1lbnRzIHRvIHN0YXJ0IHdpdGhcclxuICAgICAgICAgICAgeyAvLyBub2RlIGFcclxuICAgICAgICAgICAgICAgIGRhdGE6IHsgaWQ6ICdhJyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHsgLy8gbm9kZSBiXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7IGlkOiAnYicgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7IC8vIGVkZ2UgYWJcclxuICAgICAgICAgICAgICAgIGRhdGE6IHsgaWQ6ICdhYicsIHNvdXJjZTogJ2EnLCB0YXJnZXQ6ICdiJyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHsgLy8gZWRnZSBhYlxyXG4gICAgICAgICAgICAgICAgZGF0YTogeyBpZDogJ2FiMicsIHNvdXJjZTogJ2EnLCB0YXJnZXQ6ICdiJyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG5cclxuICAgICAgICBzdHlsZTogWyAvLyB0aGUgc3R5bGVzaGVldCBmb3IgdGhlIGdyYXBoXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJyM2NjYnLFxyXG4gICAgICAgICAgICAgICAgICAgICdsYWJlbCc6ICdkYXRhKGlkKSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnZWRnZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IDMsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzg4OCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjMDAwJyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LXNoYXBlJzogJ3RyaWFuZ2xlJyxcclxuICAgICAgICAgICAgICAgICAgICAnY3VydmUtc3R5bGUnOiAnYmV6aWVyJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuXHJcbiAgICAgICAgbGF5b3V0OiB7XHJcbiAgICAgICAgICAgIG5hbWU6ICdncmlkJyxcclxuICAgICAgICAgICAgcm93czogMVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWRkTm9kZT1mdW5jdGlvbihJRCl7XHJcbiAgICBcclxufVxyXG5cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHRvcG9sb2d5RE9NOyJdfQ==
