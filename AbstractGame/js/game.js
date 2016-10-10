/**
 * Created by nafisgizatov on 10.10.16.
 */

$(function () {
var redCar = new Car('А123CT', 'red', 0, 0);
var greenCar = new Car('А123CO', 'green', 100, 100);  
var ferrari = new Ferrari ('007', 'red', 200, 50);
ferrari.init();
    
    addEventListener("keypress", function(event) {
        switch (event.which){
            case 97:redCar.MoveToXY(redCar.x - redCar.speed, redCar.y); break;
            case 100:redCar.MoveToXY(redCar.x + redCar.speed, redCar.y); break;
            case 119:redCar.MoveToXY(redCar.x, redCar.y - redCar.speed); break;
            case 115:redCar.MoveToXY(redCar.x, redCar.y + redCar.speed); break;
            case 45: redCar.speed = (redCar.speed > 1) ? redCar.speed = redCar.speed - 1 : redCar.speed = 1; break;
            case 61: redCar.speed = (redCar.speed < 50) ? redCar.speed  = redCar.speed + 1 : redCar.speed = 50; break;
            default: alert (event.which);
        }
    });
});


Car = function (id, color, x, y){
    this._id = id;
    this.color = color;
    this._x = x;
    this._y = y;
    this._speed = 1;
    this.init();
    
};






Car.prototype = {
    get id(){
        return '#' + this._id;
    },
    
    
    get speed(){
        return  this._speed;
    },
    set speed(speed){
        this._speed = speed;
            $('#speed').html(speed);
    },
    
    
    
    get x(){
      return this._x;
    },
    set x(x){
        this._x = x;  
    },
    get y(){
      return this._y;
    },
    set y(y){
        this._y = y;  
    },
    

    init: function () {
      $('#game_container').append('<div id="' + this._id +'" class = "car"><div id="car-number">' + this._id + '</div></div>');
      $(this.id).css("left", this.x);
      $(this.id).css("top", this.y);
        switch(this.color){
          case 'red': $(this.id).css('background-image', 'url("img/redCar.png")'); break;
          case 'green': $(this.id).css('background-image', 'url("img/greenCar.png")'); break;
          default: $(this.id).css('background-image', 'url("img/car.png")');
        }
    },


    MoveToXY: function (x, y){
        this.x = x;
        this.y = y;
        $(this.id).css("left", x);
        $(this.id).css("top", y);
    }
};


Ferrari = function (id, color, x, y){
    Car.apply(this, arguments);
    
};

Ferrari.prototype = Object.create(Ferrari.prototype);
Ferrari.prototype.constructor = Ferrari;

Ferrari.prototype.init = function () {
    //Car.prototype.init.apply(this);
      
      $(this.id).css('background-image', 'url("img/ferrari.png")');  
    
};



