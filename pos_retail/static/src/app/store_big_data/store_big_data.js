/** @odoo-module */

import {patch} from "@web/core/utils/patch";
import {PosStore} from "@point_of_sale/app/store/pos_store";

const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
if (!indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB.")
}

patch(PosStore.prototype, {

    // --------------------------------------
    // todo: big datas feature
    // --------------------------------------

    // todo: this method define variables for big data feature, method include 2 functions _processData and after_load_server_data
    async load_server_data() {
        this.total_products = 0
        this.total_clients = 0
        this.max_load = 9999
        this.next_load = 10000
        this.first_load = 10000
        this.session_info = odoo.session_info
        this.db_name = odoo.session_info.db
        this.first_indexed = false
        const res = await super.load_server_data()
        if (this.config.index_db) {
            localStorage.setItem('Indexdb', 'loading')
            await this.get_datas("product.product", 10)
            await this.get_datas("res.partner", 10)
            localStorage.setItem('Indexdb', 'loaded')
            if (this.total_products == 0) {
                this.first_indexed = true
                await this.api_install_datas("product.product")
            }
            if (this.total_clients == 0) {
                await this.api_install_datas("res.partner")
            }
            if (!this.first_indexed) {
                // todo: after 5 seconds, we update new from backend to browse cache
                setTimeout(() => {
                    this._updateDatasBackground()
                    this._updateIndexedDatabase()
                }, 5000);
            }
        }
        return res
    },

    // todo: remove tax_id of another company, if have tax of another company, them have inside array is undefined
    compute_all(taxes, price_unit, quantity, currency_rounding, handle_price_include = true) {
        taxes = taxes.filter(t => t != undefined)
        return super.compute_all(taxes, price_unit, quantity, currency_rounding, handle_price_include)
    },


    // todo: any change from cron update date to now will sync
    async _updateDatasBackground() {
        console.log('_updateDatasBackground')
        let products = await this.orm.silent.call("pos.query.log", "get_new_update_by_write_date", [[], "product.product", this.db.product_write_date])
        if (products.length) {
            console.warn('updating products: ' + products.length)
            this.write("product.product", products);
            this.save_results("product.product", products)
        }
        let partners = await this.orm.silent.call("pos.query.log", "get_new_update_by_write_date", [[], "res.partner", this.db.partner_write_date])
        if (partners.length) {
            console.warn('updating partners: ' + products.length)
            this.write("res.partner", partners);
            this.save_results("res.partner", partners)

        }
    },

    // todo: update from cron data sync
    async _updateIndexedDatabase() {
        console.log('_updateIndexedDatabase')
        let datas = await this.orm.silent.call("pos.query.log", "get_all_datas", [[]])
        for (let i = 0; i < datas.length; i++) {
            let data = datas[i]
            if (data["result"].length > 0) {
                this.write(data["model"], data["result"]);
            }
        }
    },

    async api_install_datas(model_name) {
        let self = this;
        let installed = new Promise(function (resolve, reject) {
            function installing_data(model_name, min_id, max_id) {
                if (min_id == 0) {
                    max_id = self.max_load;
                }
                self.orm.call("pos.query.log", "install_data", [[], model_name, min_id, max_id]).then(function (results) {
                    const model = self.session_info["model_ids"][model_name]
                    min_id += self.next_load;
                    if (typeof results == "string") {
                        results = JSON.parse(results);
                    }
                    if (results.length > 0) {
                        max_id += self.next_load;
                        installing_data(model_name, min_id, max_id);
                        self.write(model_name, results);
                        self.save_results(model_name, results)
                    } else {
                        if (max_id < model['max_id']) {
                            max_id += self.next_load;
                            installing_data(model_name, min_id, max_id);
                        } else {
                            resolve()
                        }
                    }
                }, function (error) {
                    for (let i = 0; i <= 100; i++) {
                        indexedDB.deleteDatabase(self.db_name + '_' + i);
                    }
                })

            }

            installing_data(model_name, 0, self.first_load);
        });
        return installed;
    },


    // -------------------------------
    // todo: methods integration with indexDB
    // -------------------------------


    init(table_name, sequence) {
        var self = this;
        return new Promise(function (resolve, reject) {
            const request = indexedDB.open(self.db_name + '_' + sequence, 1);
            request.onerror = function (ev) {
                reject(ev);
            };
            request.onupgradeneeded = function (ev) {
                var db = ev.target.result;
                var os_product = db.createObjectStore('product.product', {keyPath: "id"});
                os_product.createIndex('bc_index', 'barcode', {unique: false});
                os_product.createIndex('dc_index', 'default_code', {unique: false});
                os_product.createIndex('name_index', 'name', {unique: false});
                var os_partner = db.createObjectStore('res.partner', {keyPath: "id"});
                os_partner.createIndex('barcode_index', 'barcode', {unique: false});
                os_partner.createIndex('mobile_index', 'mobile', {unique: false});
                os_partner.createIndex('phone_index', 'phone', {unique: false});
                os_partner.createIndex('email_index', 'email', {unique: false});
                db.createObjectStore('cached', {keyPath: "id"});
            };
            request.onsuccess = function (ev) {
                var db = ev.target.result;
                var transaction = db.transaction([table_name], "readwrite");
                transaction.oncomplete = function () {
                    db.close();
                };
                if (!transaction) {
                    reject('Cannot create transaction with ' + table_name)
                }
                var store = transaction.objectStore(table_name);
                if (!store) {
                    reject('Cannot get object store with ' + table_name)
                }
                resolve(store)
            };
        })
    },

    write(table_name, items, cached) {
        console.warn("saving to table: " + table_name + " with total rows: " + items.length)
        items = items.filter(i => !i['deleted'] && !i['removed'])
        const self = this;
        let max_id = items[items.length - 1]['id'];
        let sequence = Math.floor(max_id / 100000);
        if (cached) {
            sequence = 0
        }
        this.init(table_name, sequence).then(function (store) {
            var request = indexedDB.open(self.db_name + '_' + sequence, 1);
            request.onsuccess = function (ev) {
                var db = ev.target.result;
                var transaction = db.transaction([table_name], "readwrite");
                transaction.oncomplete = function () {
                    db.close();
                };
                if (!transaction) {
                    return;
                }
                var store = transaction.objectStore(table_name);
                if (!store) {
                    return;
                }
                try {
                    items.forEach(i => {
                        i.env = null;
                        i.pos = null;
                        var status = store.put(i);
                        status.onerror = function (e) {
                            console.error(e)
                        };
                        status.onsuccess = function (ev) {
                        };
                    })
                } catch (e) {
                    console.error(e);
                }

            };
        });
    },

    unlink(table_name, item) {
        console.warn('>>> deleted id ' + item['id'] + ' of table ' + table_name);
        let sequence = Math.floor(item['id'] / 100000);
        return this.init(table_name, sequence).then(function (store) {
            try {
                store.delete(item.id).onerror = function (e) {
                    console.error(e);
                };
            } catch (e) {
                console.error(e);
            }
        })
    },

    search_by_index(table_name, max_sequence, index_list, value) {
        const self = this;
        const loaded = new Promise(function (resolve, reject) {
            function load_data(sequence) {
                self.init(table_name, sequence).then(function (object_store) {
                    for (let i = 0; i < index_list.length; i++) {
                        let index = index_list[i];
                        let idb_index = object_store.index(index);
                        let request = idb_index.get(value);
                        request.onsuccess = function (ev) {
                            var item = ev.target.result || {};
                            if (item['id']) {
                                resolve(item)
                            }
                        };
                        request.onerror = function (error) {
                            console.error(error);
                            reject(error)
                        };
                    }
                }, function (error) {
                    reject(error)
                }).then(function () {
                    sequence += 1;
                    load_data(sequence);
                });
            }

            load_data(0);
        });
        return loaded
    },

    search_read(table_name, sequence) {
        const self = this;
        return new Promise(function (resolve, reject) {
            self.init(table_name, sequence).then(function (store) {
                let request = store.getAll();
                request.onsuccess = function (ev) {
                    let items = ev.target.result || [];
                    items = items.filter(i => !i.deleted && !i.removed)
                    resolve(items)
                };
                request.onerror = function (error) {
                    reject(error)
                };
            });
        })
    },

    save_results(model, results) {
        if (model == "product.product") {
            this.total_products += results.length
            this._loadProductProduct(results, true)
        }
        if (model == "res.partner") {
            this.total_clients += results.length
            this.addPartners(results)
        }
        console.log('save_results() from indexed db with model: ' + model + ' total rows: ' + results.length)
    },

    _loadProductProduct(products, from_indexed_db = false) {
        // todo: from_indexed_db => only filters data from indexdb, and by pass data of pos_loyalty
        if (this.config.products_display_only_categ && from_indexed_db) {
            products = products.filter(p => p.pos_categ_ids.length > 0)
        }
        if (this.config.limit_categories && this.config.iface_available_categ_ids.length > 0 && from_indexed_db) {
            products = products.filter(p => p.pos_categ_ids.length > 0)
            products = products.filter((p) => {
                if (p.pos_categ_ids.filter((pos_categ_id) => this.config.iface_available_categ_ids.indexOf(pos_categ_id) != -1)) {
                    return true
                } else {
                    return false
                }
            })

        }
        return super._loadProductProduct(products)
    },

    get_datas(model, max_sequence) {
        const self = this
        const loaded = new Promise(function (resolve, reject) {
            function load_data(sequence) {
                if (sequence < max_sequence) {
                    self.search_read(model, sequence).then(function (results) {
                        resolve(results)
                        if (results.length) {
                            self.save_results(model, results);
                        }
                    }).then(function () {
                        sequence += 1;
                        load_data(sequence);
                    });
                } else {
                    resolve(null);
                }
            }

            load_data(0);
        });
        return loaded;
    },
})