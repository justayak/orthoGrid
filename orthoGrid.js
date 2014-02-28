(function(){

    "use strict";

    var OG = function(){};

    var INT_BYTE_SIZE = 2;

    var entityNumber = 1;

    /**
     * Integer-Matrix:
     *
     * 0 : No Trap
     * 1 : Non-Movable
     * n : User-Defined
     *
     * @type {Function}
     */
    var Grid = OG.Grid = function(width,height){
        this.h = height;
        this.w = width;
        var buffer = new ArrayBuffer(height * width);
        var userBuffer = new ArrayBuffer(height * width * INT_BYTE_SIZE);
        this.entities = [{name:"dummy"}];

        /**
         * static values
         * @type {Int8Array}
         */
        this.data = new Int8Array(buffer);

        /**
         * dynamic values (each entity will get a unique Number which will
         * be set on this matrix!
         * @type {Int16Array}
         */
        this.userData = new Int16Array(userBuffer);

        /**
         * key: x_y
         * @type {Object} {
         *      5_12 : { ... },
         *      15_4 : { ... }
         * }
         */
        this.trapLookup = {};
    };

    Grid.prototype.spawnEntity = function(entityOptions){
        var pos = entityNumber;
        entityNumber += 1;
        var e = new GridEntity(entityOptions,pos,this);
        this.entities[pos] = e;
        return e;
    };

    Grid.prototype.getEntityAt = function(x,y){

    };

    /**
     * @params options {Object} {
     *      w : {Integer} Defines, how many grids this element will consume
     *      h : {Integer} Defines, how many grids this element will consume
     *      x : {Integer} position on the grid
     *      Y : {Integer} position on the grid
     *      group : {Integer} {OPTIONAL}
     * }
     * @type {Function}
     */
    var GridEntity = OG.GridEntity = function(options, id, grid){
        if (typeof options === 'undefined') options = {};
        this.group = options.group || 1;
        this.w = options.w || 1;
        this.h = options.h || 1;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.id = id;
        this.grid = grid;

        // set initial position:
        if(this.w === 1 && this.h === 1){
            setValueToMatrix(this.grid.userData, this.x,this.y, this.grid.w, this.id);
        }else{
            var w = this.grid.w;
            var X = this.x + this.w;
            var Y = this.y + this.h;
            for(var x = this.x; x < X; x++){
                for(var y = this.y; y < Y; y++){
                    setValueToMatrix(this.grid.userData, x,y, w, this.id);
                }
            }
        }

    };

    GridEntity.prototype.forcePosition = function(x,y){
        if(this.w === 1 && this.h === 1){
            setValueToMatrix(this.grid.userData, this.x,this.y, this.grid.w, 0);
            setValueToMatrix(this.grid.userData, this.x,this.y, this.grid.w, this.id);
        }else{
            var w = this.grid.w;
            var X = this.x + this.w;
            var Y = this.y + this.h;
            for(var x = this.x; x < X; x++){
                for(var y = this.y; y < Y; y++){
                    setValueToMatrix(this.grid.userData, x,y, w, 0);
                }
            }
            X = x + this.w;
            Y = y + this.h;
            for(var x = this.x; x < X; x++){
                for(var y = this.y; y < Y; y++){
                    setValueToMatrix(this.grid.userData, x,y, w, this.id);
                }
            }
        }
    };



    function getValueFromMatrix(matrix, x, y, matrixW){
        return matrix[y * matrixW + x];
    };

    function setValueToMatrix(matrix, x, y, matrixW, value){
        matrix[y * matrixW + x] = value;
    }



    // ~~~~~~~~~~~~~~~~~~~~~~~~
    var root = this;
    if(typeof module !== 'undefined' && module.exports){
        module.exports = OG;
        if(root) root.OG = OG;
    }else{
        if (root) root.OG = OG;
        window.OG = OG;
    }
    // ~~~~~~~~~~~~~~~~~~~~~~~~
})();