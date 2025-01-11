/** @odoo-module */

import {usePos} from "@point_of_sale/app/store/pos_hook";
import {Component, onMounted, onWillUnmount, useExternalListener, useState} from "@odoo/owl";
import {_t} from "@web/core/l10n/translation";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import {UpdateStockOnHand} from "@pos_retail/app/utils/update_stock_onhand_popup/update_stock_onhand_popup"
import {useService} from "@web/core/utils/hooks";

export class ProductOnHand extends Component {
    static template = "pos_retail.ProductOnHand";

    setup() {
        this.pos = usePos();
        this.productId = this.props.productId
        this.product = this.pos.db.product_by_id[this.productId]
        this.state = useState({qty_available: this.product['stocks_by_location'][this.pos.default_location_src_id]});
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.notification = useService("pos_notification");
        onMounted(this.onMounted);
        onWillUnmount(this.onWillUnmount);
        useExternalListener(document, "keyup", this._onHotkeys);
    }

    _onHotkeys(event) {
        if (event.key === "Escape") {
            console.log(">>>>>>>>> Hello Escape")
        } else if (event.key === "Enter") {
            console.log(">>>>>>>>> Hello Enter")
        }
    }

    onMounted() {
        // posbus.on('pos.sync.stock', this, this._loadStock)
        this._loadStock()
        this.startPolling()
    }

    onWillUnmount() {
        // posbus.off('pos.sync.stock', null, null)
    }

    startPolling() {
        // const self = this
        // this.bus = bus.bus
        // this.bus.last = 0
        // this.bus.on("notification", this, this._busNotification);
        // this.bus.start_polling();
    }

    _busNotification(notifications) {
        const currentStock = this.pos.get_source_stock_location()
        if (notifications && notifications[0] && notifications[0][1]) {
            const type = notifications[0][1]['type']
            const payload = notifications[0][1]['payload']
            if (type == "pos.sync.stock") {
                if (payload.product_ids.indexOf(this.product.id) != -1 && currentStock['id'] == payload['location_id']) {
                    this._loadStock(true)
                }
            }
        }
    }

    get addedClasses() {
        if (this.state.qty_available > 0 && this.state.qty_available < 10) {
            return {
                'low-stock': true
            }
        } else if (this.state.qty_available >= 10) {
            return {
                'normal-stock': true
            }
        } else if (this.state.qty_available <= 0) {
            return {
                'out-of-stock': true
            }
        }
    }


    async _loadStock(message) {
        if (this.pos.get_order()) {
            let currentStockLocation = this.pos.self_stock_location
            const product_onhand_peer_location = await this.pos.get_stock_datas_by_locationIds([this.product.id], [currentStockLocation.id])
            if (product_onhand_peer_location && product_onhand_peer_location[currentStockLocation.id] && product_onhand_peer_location[currentStockLocation.id][this.product.id]) {
                this.state.qty_available = product_onhand_peer_location[currentStockLocation.id][this.product.id]
            }
        }
    }

    async updateStockEachLocation() {
        if (!this.pos.config.update_stock_onhand) {
            return this.popup.add(ErrorPopup, {
                title: _t('Error'), body: _t('Your POS not active feature Update Stock of Products')
            })
        }
        const product = this.product
        let stock_location_ids = this.pos.stock_location_ids
        let stock_datas = await this.pos.get_stock_datas_by_locationIds([product.id], stock_location_ids)
        if (stock_datas) {
            let items = [];
            let withLot = false
            if (product.tracking == 'lot') {
                withLot = true
            }
            if (!withLot) {
                for (let location_id in stock_datas) {
                    let location = this.pos.stock_location_by_id[location_id];
                    if (location) {
                        items.push({
                            id: location.id,
                            item: location,
                            location_id: location.id,
                            quantity: stock_datas[location_id][product.id]
                        })
                    }
                }
            } else {

                const args = {
                    domain: [["product_id", "=", product.id], ["location_id", "in", stock_location_ids]],
                    fields: ["lot_id", "location_id", "quantity"],
                    context: {
                        limit: 1
                    }
                }
                let stockQuants = await this.orm.call("stock.quant", "search_read", [], args);
                if (stockQuants) {
                    items = stockQuants.map((q) => ({
                        id: q.id,
                        item: q,
                        lot_id: q.lot_id[0],
                        lot_name: q.lot_id[1],
                        location_id: q.location_id[0],
                        location_name: q.location_id[1],
                        quantity: q.quantity
                    }));
                }
            }
            if (items.length) {
                let {confirmed, payload: result} = await this.popup.add(UpdateStockOnHand, {
                    title: _t('Summary Stock on Hand (Available - Reserved) each Stock Location of [ ') + product.display_name + ' ]',
                    withLot: withLot,
                    array: items,
                })
                if (confirmed) {
                    const newStockArray = result.newArray
                    for (let i = 0; i < newStockArray.length; i++) {
                        let newStock = newStockArray[i];
                        if (!withLot) {
                            let location_id = parseInt(newStock['location_id'])
                            let vals = {
                                product_id: product.id,
                                product_tmpl_id: product.product_tmpl_id,
                                quantity: parseFloat(newStock['quantity']),
                                location_id: location_id
                            }
                            await this.orm.call("stock.location", "pos_update_stock_on_hand_by_location_id", [[location_id], vals]);
                        } else {
                            let args = {
                                quantity: parseFloat(newStock['quantity']),
                            }
                            let location_id = parseInt(newStock['id'])
                            await this.orm.call("stock.quant", "write", [location_id], args);
                        }
                    }
                    this._loadStock()
                    this.notification.add(product.display_name + _t(' Successfully update stock on hand'));
                    return this.updateStockEachLocation(product)
                }
            } else {
                this.notification.add(_t('Warning. ') + product.display_name + _t(' not found stock on hand !!!'));
            }
        }
    }
}