let eventLoop = require("event_loop");
let gpio = require("gpio");
let math = require("math");

let i2c = load("/ext/apps/Scripts/i2c.js");
//let scd4x = load("/ext/apps/Scripts/scd4x.js");
let ccs811 = load("/ext/apps/Scripts/ccs811.js");

let co2 = 0;
let t = 0;
let rh = 0;
let eco2 = 0;
let tvoc = 0;
let ccs_status = 0;

//let sn = scd4x.get_sn();
//if (sn !== undefined) {
//    print("scd41 SN:", values[0]);
//}

ccs811.reset();

let result = ccs811.init();
if (!result) {
    print("CCS811 init error");
}

//scd4x.start_periodic_meas();

delay(1000);

let ready;
while (true) {
    //ready = scd4x.get_ready_flag();
    //if (ready) {
    //    let values = scd4x.read_meas();
    //    co2 = values[0];
    //    t = values[1];
    //    rh = values[2];
    //}

    ready = ccs811.get_ready_flag();
    if (ready) {
        let values = ccs811.read_meas();
        eco2 = values[0];
        tvoc = values[1];
        ccs_status = values[2];
    }

    print("CO2:", co2);
    print("T:", t);
    print("RH:", rh);
    print("");
    print("eCO2:", eco2);
    print("TVOC:", tvoc);
    print("status:", ccs_status);
    print("");

    delay(200);
}
