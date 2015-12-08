var socket = io();

function onControl(id) {
    socket.emit('control', id);
}
window.onload = function() {
    paper.install(window);
    paper.setup('myCanvas');
    var wallPath = new Path({
        segments: [
            [440, 640],
            [440, 40],
            [40, 40],
            [40, 640]
        ],
        strokeColor: 'black',
        strokeWidth: 3,
        closed: true
    });
    var wallPath1 = new Path({
        segments: [
            [380, 640],
            [380, 580],
            [100, 580],
            [100, 640]
        ],
        strokeColor: 'black',
        strokeWidth: 3,
        closed: false
    });
    var wallPath2 = new Path({
        segments: [
            [100, 100],
            [100, 520],
            [140, 520],
            [140, 440],
            [340, 440],
            [340, 520],
            [380, 520],
            [380, 100]
        ],
        strokeColor: 'black',
        strokeWidth: 3,
        closed: true
    });
    var beaconLocations = [
        [62, 62],
        [62, 558],
        [418, 558],
        [418, 62]
    ]
    var beaconPaths = beaconLocations.map(function(location) {
        var path = new Path.Star({
            center: location,
            points: 5,
            radius1: 8,
            radius2: 22,
            rotation: 35,
            fillColor: 'red'
        });
    });
    
    var secondLayer = new paper.Layer();
    socket.on('location', function(location) {
        secondLayer.removeChildren();
        secondLayer.addChild(Path.Circle({
            center: location,
            radius: 10,
            fillColor: 'red'
        }));
        paper.view.draw();
    });
}
