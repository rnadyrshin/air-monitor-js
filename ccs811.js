let CCS811_address = 0x5A;//0x5B;

let nwake = gpio.get("pa7");
nwake.write(true);
nwake.init({ direction: "out", outMode: "push_pull" });

({
    write: function (reg_addr, val, val_num) {
        nwake.write(false);

        i2c.start();

        let ack = i2c.write(CCS811_address << 1); // addr + WR
        if (!ack) {
            i2c.stop();
            print("addr ack error");
            return undefined;
        }
    
        i2c.write(reg_addr);

        for (let val_cnt = 0; val_cnt < val_num; val_cnt++) {
            i2c.write(val[val_cnt]);
        }

        i2c.stop();
        nwake.write(true);

        return ack;
    },

    read: function (reg_addr, val_num) {
        nwake.write(false);

        i2c.start();

        let ack = i2c.write(CCS811_address << 1); // addr + WR
        if (!ack) {
            i2c.stop();
            print("addr ack error");
            return undefined;
        }
    
        i2c.write(reg_addr);
    
        i2c.restart();
    
        let values = [];
        let buff;
        ack = i2c.write(CCS811_address << 1 | 1); // addr + RD
    
        for (let val_cnt = 0; val_cnt < val_num; val_cnt++) {

            if (val_cnt === (val_num - 1)) {
                buff = i2c.read(true);
            } else {
                buff = i2c.read(false);
            }
    
            values.push(buff);
        }
    
        i2c.stop();
        nwake.write(true);

        return values;    
    },

    get_status: function () {
        let values = this.read(0x00, 1);
        if (values === undefined) {
            return undefined;
        }
        return values[0];
    },

    sw_reset: function () {
        this.write(0xFF, [0x11, 0xE5, 0x72, 0x8A], 4);
    },

    set_drive_mode: function (mode) {
        this.write(0x01, [mode << 4], 1);
    },

    init: function () {
        // HW ID check
        let buff = this.read(0x20, 1);
        if (buff === undefined) {
            print("HWID read error");
            return undefined;
        }
        let hwid = buff[0];
        print("HWID:", hwid);
        if (hwid !== 0x81) {
            return false;
        }

        // Try to start the app
        this.write(0xF4, [], 0);
        delay(100);

        // make sure there are no errors and we have entered application mode
        let status = this.get_status();
        print("STATUS:", status);
        if ((status & 0x80) === 0) { // not app mode
            return false;
        }

        if ((status & 0x01) !== 0) { // error=1
            return false;
        }

        // default to read every second
        this.set_drive_mode(0x01);

        return true;
    },

    get_ready_flag: function () {
        let status = this.get_status();
        //print("STATUS:", status);

        if ((status & 0x08) === 0x08) {
            return true;
        } else {
            return false;
        }
    },

    read_meas: function () {
        let values = this.read(0x02, 5);
        if (values === undefined) {
            return [undefined, undefined]
        }

        let eCO2 = (values[0] << 8) | values[1];
        let tVOC = (values[2] << 8) | values[3];
        let status = values[3];
        return [eCO2, tVOC, status];
    },
})
