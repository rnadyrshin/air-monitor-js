let SCD4x_address = 0x62;

({
    calc_crc: function (data, count) {
        let CRC8_POLYNOMIAL = 0x31;
        let crc = 0xff;
        
        for (let cur_byte = 0; cur_byte < count; ++cur_byte) {
            crc ^= (data[cur_byte]);
            for (let bit = 8; bit > 0; --bit) {
                if (crc & 0x80) {
                    crc = (crc << 1) ^ CRC8_POLYNOMIAL;
                }
                else {
                    crc = (crc << 1);
                }
                crc = crc & 0xFF;
            }
        }
        return crc;
    },

    send_cmd: function (cmd) {
        i2c.start();

        let ack = i2c.write(SCD4x_address << 1); // addr + WR
        if (!ack) {
            i2c.stop();
            print("addr ack error");
            return undefined;
        }
    
        i2c.write(cmd >> 8);
        i2c.write(cmd & 0xFF);
    
        i2c.stop();
    
        return ack;
    },

    read: function (cmd, val_num) {
        i2c.start();

        let ack = i2c.write(SCD4x_address << 1); // addr + WR
        if (!ack) {
            i2c.stop();
            print("addr ack error");
            return undefined;
        }
    
        i2c.write(cmd >> 8);
        i2c.write(cmd & 0xFF);
    
        i2c.restart();
    
        let values = [];
        let buff = [0x00, 0x00, 0x00];
        ack = i2c.write(SCD4x_address << 1 | 1); // addr + RD
    
        for (let val_cnt = 0; val_cnt < val_num; val_cnt++) {
    
            buff[0] = i2c.read(false);
            buff[1] = i2c.read(false);
            if (val_cnt === (val_num - 1)) {
                buff[2] = i2c.read(true);
            } else {
                buff[2] = i2c.read(false);
            }
    
            let value = buff[0] << 8 | buff[1];
            let crc = this.calc_crc(buff, 2);
            if (crc === buff[2]) {
                values.push(value);
            }
            else {
                print("crc err,", buff[2], "!=", crc);
                values.push(undefined);
            }
        }
    
        i2c.stop();
    
        return values;    
    },

    get_sn: function () {
        let values = this.read(0x3682, 1);
        if (values === undefined) {
            return undefined;
        }

        return values[0];
    },

    start_periodic_meas: function () {
        this.send_cmd(0x21b1);
    },

    get_ready_flag: function () {
        let values = this.read(0xE4B8, 1);
        if (values === undefined || values[0] === undefined) {
            return false;
        }

        if ((values[0] & 0x07FF) !== 0) {
            return true;
        } else {
            return false;
        }
    },

    read_meas: function () {
        let values = this.read(0xEC05, 3);
        if (values === undefined) {
            return [undefined, undefined, undefined]
        }

        values[1] = values[1] * 175.0 / 65535.0 - 45.0;
        values[2] = values[2] * 100.0 / 65535.0;

        values[1] = math.floor((values[1] + 0.5) * 10) / 10;
        values[2] = math.floor((values[2] + 0.5) * 10) / 10;
        return values;
    },
})
