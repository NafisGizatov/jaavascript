/**
 * @author Nafis Gizatov
 * Ufa, 2016
 */
$(function() {
    var Battleship = {}; // инициализируем пространство имен


    /**
     * Объект игры Морской бой
     * @param humanContainer Контейнер для отображения поля человека
     * @param botContainer Контейнер для отображения поля компьютера
     * @param gameStatusContainer Контейнер для отображения статуса игры
     * @constructor
     */
    Battleship.Game = function(humanContainer, botContainer, gameStatusContainer) {

        this.humanContainer = humanContainer;
        this.botContainer = botContainer;
        this.gameStatusContainer = gameStatusContainer;


        //размерность поля
        this.DIMENSION = 10;
        //состояние атаки бота, разведка или добивание раненого корабля
        this.attackState = Battleship.AtackingType.RANDOM;

        // массив позиций для атаки в первую очередь
        this.OptimalFirstAttackCellsPositions = [];
        /**
         * Модель поля человека
         * @type {Battleship.Field}
         */
        this.humanField = null;

        /**
         * Модель поля компьютера
         * @type {Battleship.Field}
         */
        this.botField = null;



    };

    Battleship.Game.prototype = {

        /**
         * Стартует игру
         */
        start: function() {
            this.initHumanField();
            this.initBotField();
            this.initFirstAttackCellsPositions();
            $(this.gameStatusContainer).text("Ваш ход");
        },


        /**
         * Наделяем бота оптимальной стратегией начала игры, заполняем массив
         * позициями для поиска 4-палубного линкора
         */
        initFirstAttackCellsPositions: function () {
            var AttackPositionsArray = this.OptimalFirstAttackCellsPositions;
            var AttackCellsArray = Battleship.OptimalFirstAttackCells;

            for (var i = 0; i < AttackCellsArray.length; i++) {
                var x = AttackCellsArray[i][0];
                var y = AttackCellsArray[i][1];
                AttackPositionsArray.push(new Battleship.Position(x, y));
            }
        },



        /**
         * Инициализация представления поля компьютера
         */
        initBotField: function() {

            var table = this.createTable(this.botContainer);

            var self = this;

            var onShotMissedHandler = function(pos) {
                $(self.gameStatusContainer).text("Ход соперника");
                table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('fired_cell');
                self.botAttack();
            };

            var onShipDamagedHandler = function(pos) {
                self.markShipDamaged(table, pos);
            };

            var onShipDiedHandler = function(shipPositions) {
                self.markShipDied(table, shipPositions);
            };

            var onBotLostHandler = function() {
                $(self.gameStatusContainer).text('Вы победили!');
                alert("Вы победили!");
                window.location.reload();
            };

            this.botField = new Battleship.Field (onShotMissedHandler, onShipDamagedHandler, onShipDiedHandler, onBotLostHandler);

            table.on('click', 'td', function() {
                var xCoordinate = this.cellIndex;
                var yCoordinate = this.parentNode.rowIndex;
                self.botField.makeShot(new Battleship.Position(xCoordinate, yCoordinate));
            });
        },

        /**
         * Инициализация представления поля человека
         */
        initHumanField: function() {

            var table = this.createTable(this.humanContainer);

            var self = this;

            var onShotMissedHandler = function(pos) {
                $(self.gameStatusContainer).text("Ваш ход");
                table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('fired_cell');
            };

            var onShipDamagedHandler = function(pos) {
                self.markShipDamaged(table, pos);
                self.attackState = Battleship.AtackingType.KILL_DAMAGED;
                self.botAttack();
            };

            var onShipDiedHandler = function(shipPositions) {
                self.markShipDied(table, shipPositions);
                self.attackState = Battleship.AtackingType.RANDOM;
                self.botAttack();
            };

            var onHumanLostHandler = function() {
                $(self.gameStatusContainer).text('Вы проиграли.');
                alert("Вы проиграли.");
                window.location.reload();
            };

            this.humanField = new Battleship.Field(
                onShotMissedHandler,
                onShipDamagedHandler,
                onShipDiedHandler,
                onHumanLostHandler);

            // отображаем все корабли человека
            for (var i = 0; i < this.humanField.ships.length; i++) {
                var shipPositions = this.humanField.ships[i].getPositions();
                for (var j = 0; j < shipPositions.length; j++) {
                    var pos = shipPositions[j];
                    table.find('tr').eq(pos.y).find('td').eq(pos.x).addClass('intact_ship');
                }
            }
        },

        /**
         * Инициализирует визуальное представление поля игры
         * @param container родительский контейнер
         * @returns {*}
         */
        createTable: function(container) {
            var table = $('<table></table>').addClass('field');

            for(var i = 0; i < this.DIMENSION; i++) {
                var tr = $('<tr></tr>').appendTo(table);
                for (var j = 0; j < this.DIMENSION; j++) {
                    $('<td></td>').appendTo(tr);
                }
            }

           $(container).append(table);

           return table;
        },


        /**
         * Атака компьютера
         */
        botAttack: function() {
            var self = this;
            // делаем таймаут для эффекта обдумывания следующего хода компьютером
            setTimeout(function () {
                //создаем случайную позицию для атаки
                var pos = new Battleship.Position(randomInRange(self.DIMENSION + 1), randomInRange(self.DIMENSION + 1));

                //попробуем обстрелять поле по заданной сетке
                if (self.OptimalFirstAttackCellsPositions.length){

                    pos = self.OptimalFirstAttackCellsPositions.shift();

                }



                /**
                 * проверяем на наличие недобитого раненго корабля
                 *
                 */
                if(self.attackState == Battleship.AtackingType.KILL_DAMAGED){
                    var allDamagedShips = $('#human_field').find('.damaged_ship');

                    /* пробегаем по всем раненым клеткам
                     * ищем варианты для продолжения атаки
                     */
                     searchDamage:
                    for (var damSheep = 0; damSheep < allDamagedShips.length; damSheep++) {

                      var Xcoord = allDamagedShips.closest('td')[damSheep].cellIndex;
                      var Ycoord = allDamagedShips.closest('td')[damSheep].parentNode.rowIndex;
                        /**
                         * формируем массив возможных клеток для атаки рядом с раненой клеткой
                          * @type {Array}
                         */
                      var ShootingArray = [];
                        if (Ycoord) //сверху
                            ShootingArray.push(new Battleship.Position(Xcoord, Ycoord - 1));
                        if (Xcoord < self.DIMENSION - 1) //справа
                            ShootingArray.push(new Battleship.Position(Xcoord + 1, Ycoord));
                        if (Xcoord) // слева
                            ShootingArray.push(new Battleship.Position(Xcoord - 1, Ycoord));
                        if (Ycoord < self.DIMENSION - 1) //снизу
                            ShootingArray.push(new Battleship.Position(Xcoord, Ycoord + 1));

                        for (var i = 0; i< ShootingArray.length; i++) {
                            pos = ShootingArray[i];
                            if (self.tryShot(pos)) break searchDamage;
                        }
                    }
                }
                else
                //ищем варианты для атаки случайной клетки
                while (!self.tryShot(pos)) {
                    //попробуем обстрелять поле по заданной сетке
                    if (self.OptimalFirstAttackCellsPositions.length){

                        pos = self.OptimalFirstAttackCellsPositions.shift();

                    }
                    else
                    pos = new Battleship.Position(randomInRange(self.DIMENSION + 1), randomInRange(self.DIMENSION + 1));

                }

                self.humanField.makeShot(pos);
            }, 300);

        },
        /**
         * Исследуем клетку на рациональность выстрела
         * проверяем, нет ли в ближнем радиусе убитых ячеек
         * и исключаем лишние клетки для раненых кораблей
         * @param pos позиция на поле, координаты X и Y
         * @returns {boolean}
         */

        tryShot: function (pos){
            if ($('#human_field').find('table').find('tr').eq(pos.y).find('td').eq(pos.x).hasClass('fired_cell')) return false;
            var damagedCount = 0;
            var diedCount = 0;

            var xMin = pos.x > 0 ? pos.x - 1 : 0;
            var yMin = pos.y > 0 ? pos.y - 1 : 0;
            var xMax = pos.x > this.DIMENSION - 1 ?  this.DIMENSION - 1 : pos.x + 1;
            var yMax = pos.y > this.DIMENSION - 1 ?  this.DIMENSION - 1 : pos.y + 1;


            for (var i = xMin; i<= xMax; i++)
                for (var j = yMin; j<= yMax; j++) {

                    if ($('#human_field').find('table').find('tr').eq(j).find('td').eq(i).hasClass('damaged_ship'))
                        damagedCount++;

                    if ($('#human_field').find('table').find('tr').eq(j).find('td').eq(i).hasClass('died_ship'))
                        diedCount++;
                }

                if (diedCount || damagedCount > 1 ) return false;
            else return true;
        },
        /**
         * Закрашивает клетку раненого корабля
         * @param table элемент таблицы игрока или бота
         * @param pos позиция клетки
         */
        markShipDamaged: function(table, pos) {
            table.find('tr').eq(pos.y).find('td').eq(pos.x).removeClass('intact_ship').addClass('damaged_ship');
        },

        /**
         * Закрашивает клетки убитого корабля
         * @param table элемент таблицы игрока или бота игрока или бота
         * @param shipPositions позиции на которых был установлен корабль
         */
        markShipDied: function(table, shipPositions) {
            for (var i = 0; i < shipPositions.length; i++) {
                table.find('tr').eq(shipPositions[i].y).find('td').eq(shipPositions[i].x).removeClass('intact_ship').removeClass('damaged_ship').addClass('died_ship');
            }
        }
    };

    // Позиция на поле
    Battleship.Position = function(x, y) {
        this.x = x;
        this.y = y;
    };

    /**
     * Ячейка в поле
     * @param pos позиция ячейки
     * @param ship корабль, который установлен на ячейку
     * @constructor
     */
    Battleship.Cell = function(pos, ship) {
        this.pos = pos;
        this.ship = ship;
        this.isFired = false;
    };



    /**
     * Объект корабль
     * @constructor
     */
    Battleship.Ship = function() {
        this.cellArray = [];
    };

    Battleship.Ship.prototype = {

        /**
         * Метод возвращает true если корабль потоплен, иначе false
         * @returns {boolean}
         */
        isDead: function() {
            var isDead = true;
            for (var i =0; i < this.cellArray.length; i++) {
                if (!this.cellArray[i].isFired) {
                    isDead = false;
                    break;
                }
            }
            return isDead;
        },

        /**
         * Возвращает позиции ячеек на которых установлен корабль
         */
        getPositions: function() {
            var result = [];
            for (var i = 0; i < this.cellArray.length; i++) {
                result.push(this.cellArray[i].pos);
            }
            return result;
        }
    };


    /**
     *  статусы выстрела: ранен, убит, мимо
     * @type {{DAMAGED: string, KILLED: string, MISSED: string}}
     */
    Battleship.ShotStatus = {
        DAMAGED : "damaged",
        KILLED : "killed",
        MISSED : "missed"
    };


    /**
     * Клетки для начального обстрела
     * оптимально для поиска 4-палубного корабля
     * @type {*[]}
     */
    Battleship.OptimalFirstAttackCells =[
        [0, 3], [0,7], [1, 2], [1, 6],
        [2, 1], [2, 5], [2, 9], [3, 0],
        [3, 4], [3, 8], [4, 3], [4, 7],
        [5, 2], [5, 6], [6, 1], [6 ,5],
        [7, 0], [7, 4], [7, 8], [8, 3],
        [8, 7], [9, 2], [9, 6]
    ];

    /**
     * типы атаки бота: пальба по случайным клеткам или добивание раненого
     * @type {{RANDOM: string, KILL_DAMAGED: string}}
     */
    Battleship.AtackingType = {
        RANDOM : "random",
        KILL_DAMAGED : "kill_the_damaged_ship"
    };



    /**
     * Поле игры
     * @param onMissedCallback срабатываетсрабатывает при неточном выстреле
     * @param onShipDamagedCallback срабатываетсрабатывает при ранении корабля
     * @param onSheepDiedCallBack срабатывает при потоплении корабля
     * @param playerLostCallback колбэк срабатывающий при проигрыше игрока
     *
     * @constructor
     */
    Battleship.Field = function(onMissedCallback, onShipDamagedCallback, onSheepDiedCallBack, playerLostCallback) {

        // по умолчанию поле 10 * 10
        this.DIMENSION =  10;

        this.onMissedCallback = onMissedCallback;
        this.onShipDamagedCallback = onShipDamagedCallback;
        this.onSheepDiedCallBack = onSheepDiedCallBack;
        this.playerLostCallback = playerLostCallback;

        /**
         * Корабли на поле
         * @type {Array}
         */
        this.ships = [];

        /**
         * Ячейки поля
         * @type {Array}
         */
        this.cellArray = [];

        this.initCells();

        this.initShips();
    };

    Battleship.Field.prototype = {

        /**
         * Инициализирует ячейки поля
         */
        initCells: function() {
            for (var i = 0; i < this.DIMENSION; i++) {
                for (var j = 0; j < this.DIMENSION; j++) {
                    var pos = new Battleship.Position(i, j);
                    var cell = new Battleship.Cell(pos, null);
                    this.cellArray.push(cell);
                }
            }
        },


        initShips: function() {
            //размещаем все корабли
            //сначала размещаем четырехпалубник и тд
            this.placeShips(1, 4);
            this.placeShips(2, 3);
            this.placeShips(3, 2);
            this.placeShips(4, 1);



        },

        /**
         * Размещает несколько кораблей одной длины на поле
         * @param shipsCount количество кораблей
         * @param shipLength размер кораблей
         */
        placeShips: function(shipsCount, shipLength) {
            for (var i = 0; i < shipsCount; i++) {
                this.placeShip(shipLength);
            }
        },

        /**
         * Размещает корабль на поле
         * @param shipLength
         */
        placeShip: function(shipLength) {

            var shipIsPlaced = false;

            while (!shipIsPlaced) {
                var isVertical = Math.random() > 0.5 ? true : false;

                var xCoordinate = randomInRange(this.DIMENSION + 1);
                var yCoordinate = randomInRange(this.DIMENSION + 1);

                // вычисляем рандомные координаты до тех пор пока они не будут вписываться в размеры поля
                if (isVertical) {
                    while(yCoordinate + shipLength >= this.DIMENSION) {
                        yCoordinate = randomInRange(this.DIMENSION);
                    }
                } else { //horizontal
                    while(xCoordinate + shipLength >= this.DIMENSION) {
                        xCoordinate = randomInRange(this.DIMENSION);
                    }
                }


                // проверяем пространство вокруг создаваемого корабля
                var isOtherShipsInArea = this.isShipsPlacedAround(xCoordinate, yCoordinate, isVertical, shipLength);

                if (!isOtherShipsInArea) {
                    var shipPositions = [];

                    if (isVertical) {
                        for (var i = yCoordinate; i < (yCoordinate + shipLength); i++) {
                            shipPositions.push(new Battleship.Position(xCoordinate, i));
                        }
                    } else { // horizontal
                        for (var i = xCoordinate; i < (xCoordinate + shipLength); i++) {
                            shipPositions.push(new Battleship.Position(i, yCoordinate));
                        }
                    }

                    // создаем корабль и добавляем в него ячейки
                    var ship = new Battleship.Ship();
                    for (var i = 0; i < shipPositions.length; i++) {
                        var shipCell = this.getCellByPosition(shipPositions[i]);
                        ship.cellArray.push(shipCell);
                        shipCell.ship = ship;
                    }
                    this.ships.push(ship);
                    shipIsPlaced = true;
                }
            }



        },

        /**
         * Проверка на наличие кораблей в указанной зоне
         * @param xCoordinate координата по оси Х первой ячейки корабля
         * @param yCoordinate координата по оси Х первой ячейки корабля
         * @param isVertical выравнивание корабля является вертикальным
         * @param shipLength размер корабля
         * @returns {boolean}
         */
        isShipsPlacedAround: function(xCoordinate, yCoordinate, isVertical, shipLength) {
            var topLeftPos = new Battleship.Position(xCoordinate - 1, yCoordinate - 1);

            var bottomRightPos = null;
            if (isVertical) {
                bottomRightPos = new Battleship.Position(xCoordinate + 1, yCoordinate + shipLength);
            } else {
                bottomRightPos = new Battleship.Position(xCoordinate + shipLength, yCoordinate + 1);
            }

            var isShipExistInArea = false;

            for (var i = topLeftPos.x; i <= bottomRightPos.x; i++) {
                for (var j = topLeftPos.y; j <= bottomRightPos.y; j++) {
                    var cell = this.getCellByPosition(new Battleship.Position(i, j));
                    if (cell && cell.ship) {
                        isShipExistInArea = true;
                        break;
                    }
                }
            }
            return isShipExistInArea;
        },


        /**
         * Производит выстрел по указанной позиции и в ответ вызывает соответствующие колбэки
         * @param shotPosition
         */
        makeShot: function(shotPosition) {
            var cell = this.getCellByPosition(shotPosition);
            // если ранее по ячейке не стреляли
            if (!cell.isFired) {
                // делаем ячейку подбитой
                this.setCellFired(shotPosition);

                var shotStatus = this.getShotStatus(shotPosition);
                if (shotStatus) {
                    switch (shotStatus) {
                        case Battleship.ShotStatus.DAMAGED:
                            this.onShipDamagedCallback(shotPosition);
                            break;

                        case Battleship.ShotStatus.KILLED:
                            var ship = this.getShipByPosition(shotPosition);
                            this.onSheepDiedCallBack(ship.getPositions());

                            if (this.playerHasLost()) {
                                this.playerLostCallback();
                            }
                            break;

                        case Battleship.ShotStatus.MISSED:
                            this.onMissedCallback(shotPosition);
                            break;
                    }
                }
            }
        },

        /**
         * Получение информации об итоге выстрела (нанес урон / потопил корабль / выйграл игру)
         * @param shotPosition позиция выстрела
         * @returns {null}
         */
        getShotStatus: function(shotPosition) {

            var result = null;

            var ship = this.getShipByPosition(shotPosition);
            // выполняем только если есть корабль на данной позиции
            if (ship) {
                if (ship.isDead()) {
                    result = Battleship.ShotStatus.KILLED;
                } else {
                    result = Battleship.ShotStatus.DAMAGED;
                }
            } else {
                result =  Battleship.ShotStatus.MISSED;
            }
            return result;
        },

        /**
         * Проверка на проигрыш игры
         * @returns {boolean}
         */
        playerHasLost: function() {
            var hasLost = true;

            for (var i=0; i < this.ships.length; i++) {
                if (!this.ships[i].isDead()) {
                    hasLost = false;
                    break;
                }
            }
            return hasLost;
        },

        /**
         * Устанавливает ячейку подбитой
         * @param pos позиция ячейки
         */
        setCellFired: function(pos) {
            var cell = this.getCellByPosition(pos);
            if (cell) {
                cell.isFired = true;
            }
        },

        /**
         * Возвращает корабль котор. находится на переданной позиции
         * @param pos позиция корабля
         * @returns {*}
         */
        getShipByPosition: function(pos) {
            var cell = this.getCellByPosition(pos);
            return cell.ship;
        },

        /**
         * Возвращает ячейку по переданной позиции
         * @param pos позиция
         * @returns {null}
         */
        getCellByPosition: function(pos) {
            var result = null;

            for (var i = 0; i < this.cellArray.length; i++) {
                var cell = this.cellArray[i];
                if (cell.pos.x == pos.x && cell.pos.y == pos.y) {
                    result = cell;
                    break;
                }
            }
            return result;
        }
    };



    function randomInRange(max) {
        return Math.floor(Math.random() * (max - 1));
    }

    window.Battleship = Battleship;

});
