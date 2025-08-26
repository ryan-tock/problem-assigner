export class RNG {
    constructor(seed) {
        this.m = 0x80000000;
        this.a = 1103515245;
        this.c = 12345;

        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    nextInt() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state;
    }

    range(m) {
        var mod = 1
        while (m > mod) {
            mod *= 2
        }

    
        var val;
        while ((val = (this.nextInt() >> 8) % mod) >= m);
        return val;
    }
}

export function generateList(date, questions) {
    var num = parseInt(date.replaceAll("-", ""))
    var rng = new RNG(num);

    var assignments = [];
    while (assignments.length < questions) {
        assignments.push([-1, -1, -1]);
    }

    var choices = [];

    while (choices.length < questions * 3) {
        choices.push(0);
        choices.push(1);
        choices.push(2);
        choices.push(3);
        choices.push(4);
        choices.push(5);
    }

    for (let i=0; i<assignments.length; i++) {
        for (let j=0; j<3; j++) {
            var ind = rng.range(choices.length);
            var val = choices[ind];
            choices.splice(ind, 1);

            assignments[i][j] = val;
        }
    }
    
    return assignments;
}