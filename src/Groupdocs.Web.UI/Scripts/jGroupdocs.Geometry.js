//
// Point class
//
groupdocs.Point = function (x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

$.extend(groupdocs.Point.prototype, {
    x: 0,
    y: 0,

    clone: function () {
        return new groupdocs.Point(this.x, this.y);
    },

    round: function () {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        return this;
    }
});


//
// Rectangle class
//
groupdocs.Rect = function (x1, y1, x2, y2, normalize) {
    this.set(x1, y1, x2, y2, normalize);
}

$.extend(groupdocs.Rect.prototype, {
    topLeft: null,
    bottomRight: null,

    clone: function () {
        return new groupdocs.Rect(this.topLeft.x, this.topLeft.y, this.bottomRight.x, this.bottomRight.y, false);
    },

    set: function (x1, y1, x2, y2, normalize) {
        if (!this.topLeft) {
            this.topLeft = new groupdocs.Point();
        }

        if (!this.bottomRight) {
            this.bottomRight = new groupdocs.Point();
        }

        this.topLeft.x = x1;
        this.topLeft.y = y1;

        this.bottomRight.x = x2;
        this.bottomRight.y = y2;

        return (normalize ? this.normalize() : this);
    },

    add: function (point) {
        this.topLeft.x += point.x;
        this.topLeft.y += point.y;

        this.bottomRight.x += point.x;
        this.bottomRight.y += point.y;

        return this;
    },

    subtract: function (point) {
        this.topLeft.x -= point.x;
        this.topLeft.y -= point.y;

        this.bottomRight.x -= point.x;
        this.bottomRight.y -= point.y;

        return this;
    },

    scale: function (factor) {
        this.topLeft.x *= factor;
        this.topLeft.y *= factor;

        this.bottomRight.x *= factor;
        this.bottomRight.y *= factor;

        return this;
    },

    round: function () {
        this.topLeft = this.topLeft.round();
        this.bottomRight = this.bottomRight.round();

        return this;
    },

    left: function () {
        return this.topLeft.x;
    },

    top: function () {
        return this.topLeft.y;
    },

    right: function () {
        return this.bottomRight.x;
    },

    bottom: function () {
        return this.bottomRight.y;
    },

    width: function () {
        return (this.bottomRight.x - this.topLeft.x);
    },

    height: function () {
        return (this.bottomRight.y - this.topLeft.y);
    },

    setLeft: function (x) {
        this.topLeft.x = x;
    },

    setTop: function (y) {
        this.topLeft.y = y;
    },

    setRight: function (x) {
        this.bottomRight.x = x;
    },

    setBottom: function (y) {
        this.bottomRight.y = y;
    },

    contains: function (point) {
        return (
            this.topLeft.x <= point.x && point.x <= this.bottomRight.x &&
            this.topLeft.y <= point.y && point.y <= this.bottomRight.y);
    },

    includes: function (rect) {
        return (
            this.contains(rect.topLeft) &&
            this.contains(rect.bottomRight));
    },

    intersects: function (rect) {
        return !(this.topLeft.x > rect.bottomRight.x ||
           this.bottomRight.x < rect.topLeft.x ||
           this.topLeft.y > rect.bottomRight.y ||
           this.bottomRight.y < rect.topLeft.y);
    },

    normalize: function () {
        if (this.topLeft.x > this.bottomRight.x)
            this.bottomRight.x = [this.topLeft.x, this.topLeft.x = this.bottomRight.x][0];

        if (this.topLeft.y > this.bottomRight.y)
            this.bottomRight.y = [this.topLeft.y, this.topLeft.y = this.bottomRight.y][0];

        return this;
    }
});
