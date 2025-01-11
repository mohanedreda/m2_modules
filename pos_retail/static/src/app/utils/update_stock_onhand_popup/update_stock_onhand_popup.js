/** @odoo-module */

import {AbstractAwaitablePopup} from "@point_of_sale/app/popup/abstract_awaitable_popup";
import {_t} from "@web/core/l10n/translation";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {useService} from "@web/core/utils/hooks";
import {
    UpdateStockOnHandLocation
} from "@pos_retail/app/utils/update_stock_onhand_popup/update_stock_onhand_location_popup"

import {useState} from "@odoo/owl";



export class UpdateStockOnHand extends AbstractAwaitablePopup {

    static components = {UpdateStockOnHandLocation}
    static template = "pos_retail.UpdateStockOnHand"
    static defaultProps = {
        confirmText: _t("Save"), cancelText: _t("Close"), title: _t("Update stock on hand"), body: "", cancelKey: false,
    };

    setup() {
        super.setup();
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.currentOrder = this.pos.get_order();
        this._id = 0;
        this.state = useState({array: this._initialize(this.props.array)});
        this.currentOrder = this.pos.get_order();
        this.orderUiState = this.currentOrder.uiState.ReceiptScreen;
    }

    _nextId() {
        return this._id++;
    }

    _emptyItem() {
        return {
            lot_id: null, quantity: 0, location_id: 0, _id: this._nextId(),
        };
    }

    _initialize(array) {
        if (array.length === 0) return [this._emptyItem()];
        return array.map((item) => Object.assign({}, {_id: this._nextId()}, typeof item === 'object' ? item : {
            'quantity': item.quantity, 'location_id': item.location_id, 'lot_id': item.lot_id
        }));
    }

    removeItem(itemToRemove) {
        this.state.array.splice(this.state.array.findIndex(item => item._id == itemToRemove._id), 1);
        if (this.state.array.length === 0) {
            this.state.array.push(this._emptyItem());
        }
    }

    createNewItem() {
        if (this.props && this.props.isSingleItem) return;
        this.state.array.push(this._emptyItem());
        this.render()
    }

    getPayload() {
        return {
            newArray: this.state.array
                .filter((item) => item.quantity != 0 && item.location_id > 0)
                .map((item) => Object.assign({}, item)),
        };
    }
}
