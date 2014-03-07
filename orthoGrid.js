(function () {

    "use strict";

    var OG = function () {
    };

    OG.VERBOSE = false;

    var log = function (str) {
        if (OG.VERBOSE) console.log(str);
    };

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
    var Grid = OG.Grid = function (width, height) {
        this.h = height;
        this.w = width;
        var buffer = new ArrayBuffer(height * width);
        var userBuffer = new ArrayBuffer(height * width * INT_BYTE_SIZE);
        this.entities = [
            {name:"dummy"}
        ];

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

    /**
     *
     * @param map {Smila.Map}
     * @param callback {function}
     */
    Grid.createFromSmilaMap = function (map, callback) {
        log("[OG::Grid->createFromSmilaMap] beginning.. ");
        map.onReady(function () {
            var result = new Grid(map.w, map.h);
            if (typeof map.eventLayer !== 'undefined') {
                for (var x = 0; x < map.w; x++) {
                    for (var y = 0; y < map.h; y++) {
                        var event = map.eventLayer[x][y];
                        if (event !== 0) {
                            if (event.id !== 1) {
                                result.trapLookup[x + "_" + y] = event;
                            }
                            setValueToMatrix(result.data, x, y, map.w, event.id);
                        }
                    }
                }
            }
            callback(result);
        });
    };

    Grid.prototype.putToTrapLookup = function(x,y,data){
        this.trapLookup[x + "_" + y] = data;
    };

    /**
     *
     * @param entityOptions {Option}
     *      w : {Integer} Defines, how many grids this element will consume
     *      h : {Integer} Defines, how many grids this element will consume
     *      x : {Integer} position on the grid
     *      Y : {Integer} position on the grid
     *      group : {Integer} {OPTIONAL}
     * @return {*}
     */
    Grid.prototype.spawnEntity = function (entityOptions) {
        var pos = entityNumber;
        entityNumber += 1;
        var e = new GridEntity(entityOptions, pos, this);
        this.entities[pos] = e;
        return e;
    };

    Grid.prototype.getEntityAt = function (x, y) {
        var i = getValueFromMatrix(this.userData, x, y, this.w);
        if (i === 0) return null;
        return this.entities[i];
    };

    Grid.prototype.findAllTrapsById = function(trapID){
        var result = [];
        for(var i = 0; i < this.data.length; i++){
            if(this.data[i] === trapID){
                var x = i % this.w;
                var y = Math.floor(i/this.w);
                var key = x + "_" + y;
                var data = {};
                if(key in this.trapLookup){
                    data = this.trapLookup[key];
                }
                data.$x = x;
                data.$y = y;
                result.push(data);
            }
        }
        return result;
    };

    /**
     *
     * @param x
     * @param y
     */
    Grid.prototype.block = function(x,y){
        setValueToMatrix(this.data,x,y,this.w,1);
        return this;
    };

    Grid.prototype.event = function(x,y,eventID){
        setValueToMatrix(this.data,x,y,this.w,eventID);
        return this;
    };

    /**
     * Delivers the GridEntities in a certain area
     * @param x {Integer} upper left point
     * @param y {Integer} upper left point
     * @param w {Integer} width
     * @param h {Integer} height
     * @return {Array} of Grid-Entities inside the square
     */
    Grid.prototype.query = function (x, y, w, h) {
        var alreadyFoundLookup = {};
        var w = this.w;
        var data = this.userData;
        var result = [];
        var X = Math.min(x + w, this.w);
        var Y = Math.min(y + h, this.h);
        for (; x < X; x++) {
            for (var ny = y; ny < Y; ny++) {
                var entity = getValueFromMatrix(data, x, ny, w);
                if (entity !== 0) {
                    if (!(entity in alreadyFoundLookup)) {
                        alreadyFoundLookup[entity] = true;
                        result.push(this.entities[entity]);
                    }
                }
            }
        }
        return result;
    };

    /**
     * Delivers the GridEntities in a certain area
     * @param x {Integer} center point
     * @param y {Integer} center point
     * @param r {Integer} radius
     * @return {Array} of Grid-Entities inside the square
     */
    /*Grid.prototype.queryCircle = function(x,y,r){
     var result = [];

     return result;
     }*/

    Grid.prototype.print = function (toConsole) {
        var str = "\nEntities:\n";
        for (var y = 0; y < this.h; y++) {
            for (var x = 0; x < this.w; x++) {
                var v = getValueFromMatrix(this.userData, x, y, this.w);
                if (v === 0) str += "_"
                else str += v;
                str += "|";
            }
            str += "\n";
        }

        str += "\n\nTraps:\n"
        for (var y = 0; y < this.h; y++) {
            for (var x = 0; x < this.w; x++) {
                var v = getValueFromMatrix(this.data, x, y, this.w);
                if (v === 0) str += "_"
                else str += v;
                str += "|";
            }
            str += "\n";
        }

        if (toConsole == true) console.log(str);
        return str;
    };

    /**
     * @params options {Object} {
     *      w : {Integer} Defines, how many grids this element will consume
     *      h : {Integer} Defines, how many grids this element will consume
     *      x : {Integer} position on the grid
     *      Y : {Integer} position on the grid
     *      enterableEventIds : [{Integer}]
     *      group : {Integer} {OPTIONAL}
     * }
     * @type {Function}
     */
    var GridEntity = OG.GridEntity = function (options, id, grid) {
        if (typeof options === 'undefined') options = {};
        this.group = options.group || 1;
        this.w = options.w || 1;
        this.h = options.h || 1;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.id = id;
        this.enterableEventIds = options.enterableEventIds || [];
        this.grid = grid;
        this.eventListener = [];
        this.traps = [];

        // set initial position:
        if (this.w === 1 && this.h === 1) {
            setValueToMatrix(this.grid.userData, this.x, this.y, this.grid.w, this.id);
        } else {
            var w = this.grid.w;
            var X = this.x + this.w;
            var Y = this.y + this.h;
            for (var x = this.x; x < X; x++) {
                for (var y = this.y; y < Y; y++) {
                    setValueToMatrix(this.grid.userData, x, y, w, this.id);
                }
            }
        }

        // set events
        var X = this.x + this.w;
        var Y = this.y + this.h;
        for (var x = this.x; x < X; x++) {
            for (var y = this.y; y < Y; y++) {
                var event = getValueFromMatrix(grid.data, x, y, w);
                if (event !== 0) {
                    var elem = {};
                    var key = x + "_" + y;
                    if (key in grid.trapLookup) {
                        elem = grid.trapLookup[key];
                    }
                    this.traps.push(elem);
                }
            }
        }
    };

    /**
     * @param id
     */
    GridEntity.prototype.validateEventId = function (id) {
        if (id === 0) return true;
        if (id === 1) return false;
        if (this.enterableEventIds.length === 0) return true;
        for (var i = 0; i < this.enterableEventIds.length; i++) {
            if (this.enterableEventIds[i] === id) return true;
        }
        return false;
    };

    GridEntity.prototype.validatePosition = function (x, y) {
        if (getValueFromMatrix(this.grid.userData, x, y, this.grid.w) !== 0) return false;
        return this.validateEventId(getValueFromMatrix(this.grid.data, x, y, this.grid.w));
    };

    var Directions = OG.Directions = {
        n:0,
        s:1,
        w:2,
        e:3,
        ne:4,
        nw:5,
        se:6,
        sw:7
    };

    /**
     *
     * @param callback {function} with eventId, payload
     */
    GridEntity.prototype.onEvent = function (callback) {
        this.eventListener.push(callback);
    };

    /**
     *
     * @param dir
     */
    GridEntity.prototype.move = function (dir) {
        this.traps.length = 0;
        var x = this.x;
        var y = this.y;
        switch (dir) {
            case Directions.n:
                y -= 1;
                break;
            case Directions.s:
                y += 1;
                break;
            case Directions.w:
                x -= 1;
                break;
            case Directions.e:
                x += 1;
                break;
            case Directions.ne:
                x += 1;
                y -= 1;
                break;
            case Directions.nw:
                x -= 1;
                y -= 1;
                break;
            case Directions.se:
                x += 1;
                y += 1;
                break;
            case Directions.sw:
                x -= 1;
                y += 1;
                break;
        }
        x = Math.max(0, Math.min(x, this.grid.w - 1));
        y = Math.max(0, Math.min(y, this.grid.h - 1));
        var Y = y + this.h;
        var X = x + this.w;

        var userData = this.grid.userData;
        var data = this.grid.data;
        var trapLookup = this.grid.trapLookup;
        var w = this.grid.w;
        if (x !== this.x || y !== this.y) {
            if (this.w === 1 && this.h === 1) {
                // SINGLE ELEMENT
                var person = getValueFromMatrix(userData, x, y, w);
                if (person === 0) {
                    var event = getValueFromMatrix(data, x, y, w);
                    if (event !== 1) { // 1 means: total block!
                        if (event === 0 || this.validateEventId(event)) {
                            setValueToMatrix(userData, x, y, w, this.id);
                            setValueToMatrix(userData, this.x, this.y, w, 0);
                            this.x = x;
                            this.y = y;
                            if (event !== 0) {
                                //call event
                                var data = {};
                                var key = x + "_" + y;
                                if (key in trapLookup) {
                                    data = trapLookup[key];
                                }
                                for (var i = 0; i < this.eventListener.length; i++) {
                                    this.eventListener[i].call(this, event, data);
                                }
                            }
                        }
                    }
                }
            } else {
                // BIG ELEMENT | AWFUL CODE!!!
                var nx = 0;
                var ny = 0;
                var canmove = true;
                var ly = 0;
                var rx = 0;
                switch (dir) {
                    case Directions.n:
                        ly = y + this.h;
                        for (nx = x; nx < X; nx++) {
                            if (!this.validatePosition(nx, y)) {
                                canmove = false;
                                break;
                            }
                        }
                        if (canmove) {
                            for (nx = x; nx < X; nx++) {
                                setValueToMatrix(userData, nx, y, w, this.id);
                                setValueToMatrix(userData, nx, ly, w, 0);
                            }
                            this.y = y;
                        }
                        break;
                    case Directions.s:
                        ly = this.y + this.h;
                        for (nx = x; nx < X; nx++) {
                            if (!this.validatePosition(nx, ly)) {
                                canmove = false;
                                break;
                            }
                        }
                        if (canmove) {
                            for (nx = x; nx < X; nx++) {
                                setValueToMatrix(userData, nx, ly, w, this.id);
                                setValueToMatrix(userData, nx, this.y, w, 0);
                            }
                            this.y = y;
                        }
                        break;
                    case Directions.w:
                        for (ny = y; ny < Y; ny++) {
                            if (!this.validatePosition(x, ny)) {
                                canmove = false;
                                break;
                            }
                            if (canmove) {
                                rx = x + this.w;
                                for (ny = y; ny < Y; ny++) {
                                    setValueToMatrix(userData, x, ny, w, this.id);
                                    setValueToMatrix(userData, rx, ny, w, 0);
                                }
                                this.x = x;
                            }
                        }
                        break;
                    case Directions.e:
                        rx = this.x + this.w;
                        for (ny = y; ny < Y; ny++) {
                            if (!this.validatePosition(rx, ny)) {
                                canmove = false;
                                break;
                            }
                        }
                        if (canmove) {
                            for (ny = y; ny < Y; ny++) {
                                setValueToMatrix(userData, rx, ny, w, this.id);
                                setValueToMatrix(userData, this.x, ny, w, 0);
                            }
                            this.x = x;
                        }
                        break;
                    case Directions.ne:
                        for (nx = x; nx < X; nx++) {
                            if (!this.validatePosition(nx, y)) {
                                canmove = false;
                                break;
                            }
                        }
                        if (canmove) {
                            rx = this.x + this.w;
                            for (ny = y + 1; ny < Y; ny++) {
                                if (!this.validatePosition(rx, ny)) {
                                    canmove = false;
                                    break;
                                }
                            }
                            if (canmove) {
                                for (nx = x; nx < X; nx++) {
                                    setValueToMatrix(userData, nx, y, w, this.id);
                                    setValueToMatrix(userData, nx - 1, Y, w, 0);
                                }
                                for (ny = y + 1; ny < Y; ny++) {
                                    setValueToMatrix(userData, rx, ny, w, this.id);
                                    setValueToMatrix(userData, this.x, ny, w, 0);
                                }
                                this.x = x;
                                this.y = y;
                            }
                        }
                        break;
                    case Directions.nw:
                        for (nx = x; nx < X; nx++) {
                            if (!this.validatePosition(nx, y)) {
                                canmove = false;
                                break;
                            }
                        }
                        if (canmove) {
                            for (ny = y + 1; ny < Y; ny++) {
                                if (!this.validatePosition(x, ny)) {
                                    canmove = false;
                                    break;
                                }
                            }
                            if (canmove) {
                                var ly = y + this.h;
                                var rx = x + this.w;
                                for (nx = x; nx < X; nx++) {
                                    setValueToMatrix(userData, nx, y, w, this.id);
                                    setValueToMatrix(userData, nx + 1, ly, w, 0);
                                }
                                for (ny = y + 1; ny < Y; ny++) {
                                    setValueToMatrix(userData, x, ny, w, this.id);
                                    setValueToMatrix(userData, rx, ny, w, 0);
                                }
                                this.x = x;
                                this.y = y;
                            }
                        }
                        break;
                    case Directions.se:
                        ly = Y - 1;
                        rx = this.x + this.w;
                        for (nx = x; nx < X; nx++) {
                            if (!this.validatePosition(nx, ly)) {
                                canmove = false;
                                break;
                            }
                        }
                        if (canmove) {
                            for (ny = y + 1; ny < Y; ny++) {
                                if (!this.validatePosition(rx, ny - 1)) {
                                    canmove = false;
                                    break;
                                }
                            }
                            if (canmove) {
                                for (nx = x; nx < X; nx++) {
                                    setValueToMatrix(userData, nx, ly, w, this.id);
                                    setValueToMatrix(userData, nx - 1, this.y, w, 0);
                                }
                                for (ny = y + 1; ny < Y; ny++) {
                                    setValueToMatrix(userData, rx, ny - 1, w, this.id);
                                    setValueToMatrix(userData, this.x, ny - 1, w, 0);
                                }
                            }
                            this.x = x;
                            this.y = y;
                        }
                        break;
                    case Directions.sw:
                        ly = Y - 1;
                        for (nx = x; nx < X; nx++) {
                            if (!this.validatePosition(nx, ly)) {
                                canmove = false;
                                break;
                            }
                        }
                        if (canmove) {
                            for (ny = y + 1; ny < Y; ny++) {
                                if (!this.validatePosition(x, ny - 1)) {
                                    canmove = false;
                                    break;
                                }
                            }
                            if (canmove) {
                                for (nx = x; nx < X; nx++) {
                                    setValueToMatrix(userData, nx, ly, w, this.id);
                                    setValueToMatrix(userData, nx + 1, this.y, w, 0);
                                }
                                for (ny = y + 1; ny < Y; ny++) {
                                    setValueToMatrix(userData, x, ny - 1, w, this.id);
                                    setValueToMatrix(userData, X, ny - 1, w, 0);
                                }
                                this.x = x;
                                this.y = y;
                            }
                        }
                        break;
                }
            }
        }

        for (x = this.x; x < X; x++) {
            for (y = this.y; y < Y; y++) {
                var event = getValueFromMatrix(data, x, y, w);
                if (event !== 0) {
                    var elem = {};
                    var key = x + "_" + y;
                    if (key in trapLookup) {
                        elem = trapLookup[key];
                    }
                    this.traps.push(elem);
                }
            }
        }
        return this;
    };

    function handleEvent(array, x, y, w, trapLookup, entity) {
        var event = getValueFromMatrix(array, x, y, w);
        if (event !== 0) {
            var data = {};
            var key = x + "_" + y;
            if (key in trapLookup) {
                data = trapLookup[key];
            }
            for (var i = 0; i < entity.eventListener.length; i++) {
                entity.eventListener[i].call(entity, event, data);
            }
        }
    }

    GridEntity.prototype.forcePosition = function (x, y) {
        if (this.w === 1 && this.h === 1) {
            setValueToMatrix(this.grid.userData, this.x, this.y, this.grid.w, 0);
            setValueToMatrix(this.grid.userData, this.x, this.y, this.grid.w, this.id);
        } else {
            var w = this.grid.w;
            var X = this.x + this.w;
            var Y = this.y + this.h;
            for (var x = this.x; x < X; x++) {
                for (var y = this.y; y < Y; y++) {
                    setValueToMatrix(this.grid.userData, x, y, w, 0);
                }
            }
            X = x + this.w;
            Y = y + this.h;
            for (var x = this.x; x < X; x++) {
                for (var y = this.y; y < Y; y++) {
                    setValueToMatrix(this.grid.userData, x, y, w, this.id);
                }
            }
        }
    };


    function getValueFromMatrix(matrix, x, y, matrixW) {
        return matrix[y * matrixW + x];
    };

    function setValueToMatrix(matrix, x, y, matrixW, value) {
        matrix[y * matrixW + x] = value;
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~
    var root = this;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OG;
        if (root) root.OG = OG;
    } else {
        if (root) root.OG = OG;
        window.OG = OG;
    }
    // ~~~~~~~~~~~~~~~~~~~~~~~~
    return OG;
})();