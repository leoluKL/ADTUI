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