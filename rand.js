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