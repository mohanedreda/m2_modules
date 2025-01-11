/** @odoo-module **/

import {PartnerListScreen} from "@point_of_sale/app/screens/partner_list/partner_list";
import {patch} from "@web/core/utils/patch";
import {onMounted, onWillUnmount} from "@odoo/owl";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";
import {_t} from "@web/core/l10n/translation";
import {NumberPopup} from "@point_of_sale/app/utils/input_popups/number_popup";

patch(PartnerListScreen.prototype, {

    setup() {
        super.setup(...arguments);
        if (this.pos.config.offline_create_customer) {
            this.state.offline_partner_value = null
        }
    },

    // todo: dont care about internet connection, we return back partner without save to backend
    confirm() {
        if (this.state.offline_partner_value) {
            this.props.resolve({ confirmed: true, payload: this.state.offline_partner_value });
            this.pos.closeTempScreen();
        }
        return super.confirm()
    },

    async saveChanges(processedChanges) {
        if (this.pos.config.offline_create_customer) {
            this.state.offline_partner_value = processedChanges
            if (!this.state.offline_partner_value['id']) {
                this.state.offline_partner_value['__action_type__'] = 'create'
            } else {
                this.state.offline_partner_value['__action_type__'] = 'write'
            }
            this.confirm();
        } else {
            return await super.saveChanges(processedChanges)
        }
    },

    async _onPressEnterKey() {
        const res = await super._onPressEnterKey()
        if (!this.state.query) {
            return;
        }
        const result = await this.searchPartner();
        if (result.length == 0) {
            this.notification.add(_t('You can create new customer "%s".', this.state.query), 3000);
            return await this.createPartner()
        } else {
            return res
        }
    },

    async createPartner() {
        if (this.pos.config.create_new_customer) {
            return await super.createPartner()
        } else {
            return this.notification.add(_t('Your pos not allow create new customer'), 3000);
        }
    },

    async updatePartnerList(event) {
        await super.updatePartnerList(event)
        this.state.editModeProps["query"] = event.target.value
    }
});
