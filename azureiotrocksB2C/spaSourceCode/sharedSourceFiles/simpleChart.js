function simpleChart(parentDom,xLength,cssOptions,customDrawing){
    this.chartDOM=$("<div/>")
    parentDom.append(this.chartDOM)
    if(customDrawing){
        customDrawing(this.chartDOM)
    }
    this.canvas = $('<canvas></canvas>')
    this.canvas.css(cssOptions)
    this.chartDOM.append(this.canvas)
    
    this.chart=new Chart(this.canvas, {
        type: "line",
        data: {
            labels: [],
            datasets: [{stepped:true, data: []}]
        },
        options: {
            animation: false,
            datasets: {
                line: {
                    spanGaps:true,
                    borderColor: "rgba(0,0,255,0.7)",
                    borderWidth:1,
                    pointRadius:0
                }
            },
            plugins:{
                legend: { display: false },
                tooltip:{enabled:false}
            },
            scales: {
                x:{grid:{display:false},ticks:{display:false}}
                ,y:{grid:{tickLength:0},ticks:{font:{size:9}}}
                ,x2: {position:'top',grid:{display:false},ticks:{display:false}}
                ,y2: {position:'right',grid:{display:false},ticks:{display:false}}     
            }
            
        }
    });
    this.setXLength(xLength)
}

simpleChart.prototype.setDataArr=function(dataArr){
    this.chart.data.datasets[0].data=dataArr
    this.chart.update()
}

simpleChart.prototype.addDataValue=function(dataIndex,value){
    var dataArr=this.chart.data.datasets[0].data

    var totalPoints=dataArr.length

    if(this.lastDataIndex==null) this.lastDataIndex=dataIndex-1
    if(dataIndex<this.lastDataIndex){
        if(this.lastDataIndex-dataIndex>=totalPoints) return; //ignore receiving too old points
        var diff=this.lastDataIndex - dataIndex
        dataArr[totalPoints-1-diff]=value
    }else{
        var numOfPassedPoints=dataIndex-this.lastDataIndex
        dataArr=dataArr.slice(numOfPassedPoints)
        dataArr[totalPoints-1]=value
    }
    this.setDataArr(dataArr)
    this.lastDataIndex=dataIndex
}

simpleChart.prototype.setXLength=function(xlen){
    var labels=this.chart.data.labels
    labels.length=0
    for(var i=0;i<xlen;i++) labels.push(i)
    //shorten or expand the length of data array
    var dataArr=this.chart.data.datasets[0].data
    if(dataArr.length>xlen) dataArr=dataArr.slice(dataArr.length-xlen)
    else if(dataArr.length<xlen){
        var numberToAdd=xlen-dataArr.length
        var tmpArr=[]
        tmpArr[numberToAdd-1]=null
        dataArr=tmpArr.concat(dataArr)
    }
    this.chart.data.datasets[0].data=dataArr
    this.chart.update()
}

simpleChart.prototype.destroy=function(){
    this.chartDOM.remove()
}

module.exports = simpleChart;