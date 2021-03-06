(function() {
    "use strict";

    var POWERPLANT = 32;
    var HOUSE = 16;
    var LINE = 0;
    var N = 8;
    var E = 4;
    var S = 2;
    var W = 1;

    var Grid = function Grid__class() {
        var _rows = [],
            _domEl = document.getElementById("gameboard");

        this.appendRow = function Grid__appendRow(row) {
            _rows = _rows.concat(row);
            _domEl.appendChild(row.getDomEl());
        }
        this.getTile = function Grid__getTile(x, y) {
            return y > -1 && y < _rows.length ? _rows[y].getTile(x) : undefined;
        }
        this.getAllTiles = function Grid__getAllTiles() {
            return _rows.reduce(function(acc, row) {
                return acc.concat(row.getAllTiles());
            }, []);
        }
        this.clearDomEl = function Grid__clearDomEl() {
            _domEl.innerHTML = "";
        }
    };

    var Row = function Row__class() {
        var _tiles = [],
            _domEl;

        this.appendTile = function Row__appendTile(tile) {
            _tiles = _tiles.concat(tile);
            _domEl.appendChild(tile.getDomEl());
        }
        this.getTile = function Row__getTile(x) {
            return x > -1 && x < _tiles.length ? _tiles[x] : undefined;
        }
        this.getAllTiles = function Row__getAllTiles() {
            return _tiles;
        }
        this.getDomEl = function Row__getDomEl() {
            return _domEl;
        }

        _domEl = document.createElement("div");
        _domEl.classList.add("row");
    };
    var Tile = function Tile__class(x, y, data) {
        var _layout,
            _type = LINE,
            _power = false,
            _links = data & 15, // last 4 bits
            _dirty = true, // only update dom elements if necessary
            _domEl,
            _x = x,
            _y = y,
            _this = this;


        var _isConnectedTo = function _Tile__isConnectedTo(otherTile) {

            if(_this == otherTile) {
                return true;
            }

            var diffX = otherTile.getX() - _this.getX(),
                diffY = otherTile.getY() - _this.getY();

            // check if they have common edge
            if(Math.abs(diffX) + Math.abs(diffY) == 1) {

                // B is right of A
                if(diffX > 0) {
                    return _this.hasLinkTo(E) && otherTile.hasLinkTo(W);

                // B is left of A
                } else if(diffX < 0) {
                    return _this.hasLinkTo(W) && otherTile.hasLinkTo(E);

                // B is below A
                } else if(diffY > 0) {
                    return _this.hasLinkTo(S) && otherTile.hasLinkTo(N);

                // B is above A
                } else if(diffY < 0) {
                    return _this.hasLinkTo(N) && otherTile.hasLinkTo(S);
                }
            }

            return false;
        }

        var _getConnectedNeighbors = function _Tile__getConnectedNeighbors() {
            return [N,S,W,E].reduce(function(acc, direction) {
                var neighbor = _getNeighbor(direction);
                if(neighbor && _isConnectedTo(neighbor)) {
                    return acc.concat(neighbor);
                } else {
                    return acc;
                }
            }, []);
        };
        var _getNeighbor = function _Tile__getNeighbor(direction) {
            switch(direction) {
                case N:
                    return game.getTile(_x  , _y-1); break;
                case S:
                    return game.getTile(_x  , _y+1); break;
                case W:
                    return game.getTile(_x-1, _y  ); break;
                case E:
                    return game.getTile(_x+1, _y  ); break;
            }
        };

        var _rotateLeft = function _Tile__rotateLeft() {
            var turnover = (_links & 8) == 8;
            _links <<= 1;
            _links &= 15;
            if(turnover) {
              _links |= 1;
            }
            _dirty = true;
        }

        var _rotateRight = function _Tile__rotateRight() {
            var turnover = (_links & 1) == 1;
            _links >>= 1;
            if(turnover) {
              _links |= 8;
            }
            _dirty = true;
        }

        this.setPower = function Tile__setPower(power) {
            if(_dirty == false) {
                if(_power != power) {
                    _dirty = true;
                }
            }
            _power = power;
        }

        this.hasLinkTo = function _tileHasLinkInDirection(direction) {
            return (_links & direction) == direction;
        }

        this.isPoweredOn = function Tile__isPoweredOn() {
            return _power;
        }

        this.getLayout = function Tile__getLayout() {
            return _layout;
        }

        this.getX = function Tile__getX() {
            return _x;
        }

        this.getY = function Tile__getY() {
            return _y;
        }

        this.getRotation = function Tile__getRotation() {
            switch(_links) {
                case N: case N|S: case N|E: case N|S|E:
                    return 0; break;
                case E: case W|E: case S|E: case S|W|E:
                    return 90; break;
                case S: case S|W: case N|S|W:
                    return 180; break;
                case W: case N|W: case N|W|E:
                    return 270; break;
            }
        }
        this.getType = function Tile__getType() {
            return _type;
        }

        this.getDomEl = function Tile__getDomEl() {
            return _domEl;
        }

        this.lightUp = function Tile__lightUp(token) {
            token = token || [];
            token = token.concat(this);

            this.setPower(true);

            _getConnectedNeighbors().forEach(function(neighbor) {
                if(token.indexOf(neighbor) < 0) {
                    neighbor.lightUp(token);
                }
            });
        };

        this.updateDom = function Tile__updateDom() {
            if(_dirty) {
                _domEl.setAttribute("data-rotation", this.getRotation());
                _domEl.setAttribute("data-power", this.isPoweredOn() ? "1" : "0");
                _dirty = false;
            }
        };

        if(_links == 0) {
            throw new TypeError("Corrupt data. Cell " + x + "|" + y
                    + " has no lines");
        } else if(_links == 15) {
            throw new TypeError("Corrupt data. Cell " + x + "|" + y
                    + " is a cross");
        }

        // set _layout once
        switch(_links) {
            case N: case E: case S: case W:
                _layout = 'O'; break;
            case N|E: case S|E: case S|W: case N|W:
                _layout = 'L'; break;
            case N|S: case W|E:
                _layout = 'I'; break;
            case N|S|W: case N|S|E: case N|W|E: case S|W|E:
                _layout = 'T'; break;
        }

        // set _type once
        if((data & HOUSE) == HOUSE) {
            if((data & POWERPLANT) == POWERPLANT) { 
                throw new TypeError("Corrupt data. Cell " + x + "|" + y + 
                        " has set both house and factory");
            } else {
                _type = HOUSE;
            }
        } else if((data & POWERPLANT) == POWERPLANT) {
            _type = POWERPLANT;
        }

        // create tile element
        _domEl = document.createElement("div");
        _domEl.appendChild(document.createElement("div"));
        _domEl.appendChild(document.createElement("div"));
        _domEl.classList.add("tile");
        _domEl.setAttribute("data-layout", _layout);

        if(_type == HOUSE) {
            _domEl.classList.add("house");
        } else if(_type == POWERPLANT) {
            _domEl.classList.add("factory");
        }
        _domEl.oncontextmenu = function(e) {
            e.stopPropagation();
            e.preventDefault();
        };

        _domEl.onmouseup = function(e) {
            if(e.which == 3) {
                _rotateLeft();
                game.makeMove();
            } else if(e.which == 1) {
                _rotateRight();
                game.makeMove();
            }
        }
        _domEl.ontouchend = function(e) {
            e.preventDefault();
            _rotateRight();
            game.makeMove();
        }
        _domEl.ontouchmove = function(e) {
            e.preventDefault();
            return false;
        }
    };

    var Game = function Game__class() {

        var _grid = new Grid(),
            _powerplant,
            _moves = -1,
            _moveCountEl = document.getElementById("move-count");

        var _updatePowerState = function _Game__updatePowerState() {
            // power off all tiles
            _grid.getAllTiles().forEach(function(tile) {
                tile.setPower(0);
            });

            _powerplant.lightUp();

            _grid.getAllTiles().forEach(function(tile) {
                tile.updateDom();
            });

        };

        var _checkFinished = function _Game__checkFinished() {
            if(document.querySelector(".tile[data-power=\"0\"]") == null) {
                alert("Solved!");
            }
        };

        var _incrementMoveCount = function _Game__incrementMoveCount() {
            _moves++;
            _moveCountEl.textContent = _moves + " moves";
        };

        this.makeMove = function Game__makeMove() {
            _incrementMoveCount();
            _updatePowerState();
            _checkFinished();
        }

        this.getTile = function Game__getTile(x, y) {
            return _grid.getTile(x, y);
        }

        this.load = function Game__load(level) {
            var sizeX = level[0],
                sizeY = level[1],
                i = 2;

            if(level.length - 2 != sizeX * sizeY) {
                throw new TypeError("Corrupt data. Grid size specification " +
                        "does not match data size");
            }

            for(var y = 0; y < sizeY; y++) { // rows
                var row = new Row();
                for(var x = 0; x < sizeX; x++, i++) { // cells
                    row.appendTile(new Tile(x, y, level[i]));
                }
                _grid.appendRow(row);
            }

            _grid.getAllTiles().forEach(function(tile) {
                tile.updateDom();
                if(tile.getType() == POWERPLANT) {
                    _powerplant = tile;
                }
            });

            this.makeMove();
        }

        this.clear = function Game__clear() {
            _grid.clearDomEl();
            _grid = new Grid();
        }
    }

    // F  H  N E S W
    // 32 16 8 4 2 1
    var lvl1 = [
         5, 5,
        20, 12, 10, 20, 20,
        10,  5, 12, 18, 10,
        11,  6,  5,  9,  7,
        13, 18, 10,  5, 10,
         9, 42, 11,  6, 18
    ];

    var game = new Game();
    game.load(lvl1);
})();
