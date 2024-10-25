let sda = gpio.get("pc1");
let scl = gpio.get("pc0");
sda.write(true);
scl.write(true);
scl.init({ direction: "out", outMode: "open_drain" });

({
    start: function () {
        sda.init({ direction: "out", outMode: "open_drain" });
        sda.write(false);
        scl.write(false);
    },

    restart: function () {
        sda.write(true);
        scl.write(true);
        this.start();
    },

    stop: function() {
        sda.init({ direction: "out", outMode: "open_drain" });
        sda.write(false);
        scl.write(true);
        sda.write(true);
    },

    write: function(data) {
        sda.init({ direction: "out", outMode: "open_drain" });

        for (let mask = 0x80; mask > 0; mask >>= 1) {
            if ((data & mask) > 0) {
                sda.write(true);
            }
            else {
                sda.write(false);
            }
    
            scl.write(true);
            scl.write(false);
        }
    
        sda.init({ direction: "in", pull: "up"});
        scl.write(true);
        let ack = !sda.read();
        scl.write(false);
        sda.write(false);

        return ack;
    },

    read: function(last) {
        let data = 0x00;
        sda.init({ direction: "in", pull: "up"});
    
        for (let mask = 0x80; mask > 0; mask >>= 1) {
            scl.write(true);

            if (sda.read()) {
                data |= mask;
            }

            scl.write(false);
        }

        sda.init({ direction: "out", outMode: "open_drain" });
        if (last) {
            sda.write(true);
        } else {
            sda.write(false);
        }
        scl.write(true);
        scl.write(false);

        return data;
    }
})
