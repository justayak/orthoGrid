var OG = require("./orthoGrid");

var Grid = new OG.Grid(10,8);

var a = Grid.spawnEntity({
    w : 2,
    h : 2,
    x : 3,
    y : 2
});

var b = Grid.spawnEntity({
    w : 1,
    h : 1,
    x : 1,
    y : 1
});

var dir = OG.Directions;

b.move(dir.s).move(dir.e).move(dir.e).move(dir.s);

a.move(dir.ne);

Grid.print();