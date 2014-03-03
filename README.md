2D-Grid-System

Simple grid based collision system for browser and nodejs

Documentation:

```javascript
// create a new Grid
var width = 10;
var height = 15;
var grid = new OG.Grid(width,height);

var a = grid.spawnEntity({
    w : 3,   // width
    h : 3,   // height
    x : 1    // position (top-left)
    y : 0    // position (top-left)
});

// you cannot move to a field, if there is another entity already!
a.move(OG.Directions.se); // move south-east
a.move(OG.Directions.n); // move north
// also available: s, e, w, sw, ne, nw


// block a square that will not be enterable by an entity anymore
grid.block(8,8);

// gets a entity at the given position. If there is no entity, null is returned
var entity = grid.getEntityAt(1,0);

// get all Entities in the given area
// x, y, width, height
var list = grid.query(2,3,5,5);
```

If you use the Smila-Graphics-library, you can use the build-in Map of the library to create a Grid out of that:
 ```javascript

 ... Smila
 var map = Smila.DataStore.getMap("map01");

 OG.Grid.createFromSmilaMap(map, function(grid){

    ...

 });
 ```