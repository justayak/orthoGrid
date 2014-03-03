var OG = require("./orthoGrid");

var Grid = new OG.Grid(10,8);

var a = Grid.spawnEntity({
    w : 3,
    h : 3,
    x : 2,
    y : 2
});

var b = Grid.spawnEntity({
    w : 1,
    h : 1,
    x : 4,
    y : 6
});

var dir = OG.Directions;

//b.move(dir.s).move(dir.e).move(dir.e).move(dir.s);

a.move(dir.se).move(dir.nw).move(dir.sw).move(dir.ne);

Grid.print();