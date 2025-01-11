/** @odoo-module */

import {patch} from "@web/core/utils/patch";
import {Chrome} from "@point_of_sale/app/pos_app";
import {useState} from "@odoo/owl";

patch(Chrome.prototype, {

    setup() {
        super.setup()
        // this.env.bus.addEventListener("CLEAR-CACHES", this.clearCache(this, event));
    },

    // clearCache(event) {
    //     console.log("clearCache")
    // },

    get disableClass() {
        if (this.pos.pos_session.is_locked) {
            return "pos dvh-100 d-flex flex-column lock-page"
        } else {
            return "pos dvh-100 d-flex flex-column"
        }


    }
})