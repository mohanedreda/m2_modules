/** @odoo-module */

import {PartnerDetailsEdit} from "@point_of_sale/app/screens/partner_list/partner_editor/partner_editor";
import {patch} from "@web/core/utils/patch";
import {_t} from "@web/core/l10n/translation";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {NumberPopup} from "@point_of_sale/app/utils/input_popups/number_popup";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";
import {SelectionPopup} from "@point_of_sale/app/utils/input_popups/selection_popup";

patch(PartnerDetailsEdit.prototype, {
    setup() {
        super.setup(...arguments);
        this.pos = usePos();
        this.changes["phone"] = this.props.query
        this.changes["mobile"] = this.props.query
        if (this.pos.config.create_new_customer_default_country_id) {
            this.changes["country_id"] = this.pos.config.create_new_customer_default_country_id[0]
        }
    },

    saveChanges() {
        const processedChanges = {};
        for (const [key, value] of Object.entries(this.changes)) {
            if (this.intFields.includes(key)) {
                processedChanges[key] = parseInt(value) || false;
            } else {
                processedChanges[key] = value;
            }
        }
        if (processedChanges.state_id && this.pos.states.find((state) => state.id === processedChanges.state_id).country_id[0] !== processedChanges.country_id) {
            processedChanges.state_id = false;
        }

        if ((!this.props.partner.name && !processedChanges.name) || processedChanges.name === "") {
            return this.popup.add(ErrorPopup, {
                title: _t("A Customer Name Is Required"),
            });
        }
        processedChanges.id = this.props.partner.id || false;
        if (this.pos.config.customer_required_mobile && !processedChanges["mobile"]) {
            return this.popup.add(ErrorPopup, {
                title: _t("A Mobile of Customer Is Required"),
            });
        }
        if (this.pos.config.customer_required_email && !processedChanges["email"]) {
            return this.popup.add(ErrorPopup, {
                title: _t("A Email of Customer Is Required"),
            });
        }
        return super.saveChanges()
    }
});
