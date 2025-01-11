/** @odoo-module */

import {Component, useState} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {useService} from "@web/core/utils/hooks";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import {_t} from "@web/core/l10n/translation";

const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
if (!indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB.")
}

export class RemoveIndexDatabaseButton extends Component {
    static template = "pos_retail.RemoveIndexDatabaseButton";

    setup() {
        this.pos = usePos();
        this.ui = useState(useService("ui"));
        this.orm = useService("orm");
        this.popup = useService("popup");
    }

    get username() {
        const {name} = this.pos.get_cashier();
        return name ? name : "";
    }

    get avatar() {
        const user_id = this.pos.get_cashier_user_id();
        const id = user_id ? user_id : -1;
        return `/web/image/res.users/${id}/avatar_128`;
    }

    get cssClass() {
        return {"not-clickable": true};
    }

    async click() {
        const {confirmed} = await this.popup.add(ConfirmPopup, {
            title: _t("Need few times for install database, times need follow size of your products and customers inside system"),
        });
        if (confirmed) {
            for (let i = 0; i <= 100; i++) {
                indexedDB.deleteDatabase(this.pos.db_name + '_' + i);
            }
            await this.orm.call("pos.query.log", "renew_logs", [[]])
            location.reload();
        }
    }
}
