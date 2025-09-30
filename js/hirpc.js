class HiRpc {
    LOGTAG = '[*] HiRpc:';
    INTERVAL = 10000;
    constructor(wsurl) {
        if (!wsurl) {
            throw new Error('wsurl can not be empty!');
        }
        this.wsurl = wsurl;
        this.handlers = {};
        this.ws = null;
        this.connect();
        this.register(c => eval(c), '_exec');
    }
    connect() {
        try {
            let ws = this.ws = new WebSocket(this.wsurl);
            ws.onclose = (e) => {
                this.timeid || console.error(this.LOGTAG, `WebSocket connection closed. Code: ${e.code}${e.reason ? ' Reason: ' + e.reason : ''}.`);
                this.ws && (this.timeid = setTimeout(this.connect.bind(this), this.INTERVAL));
            }
            ws.onerror = (e) => {
                console.error(this.LOGTAG, 'Websocket connection error, please check if the server is opened.');
            };
            ws.onopen = (e) => {
                this.timeid = null;
                console.info(this.LOGTAG, 'Successfully connected to websocket.');
            }
            ws.onmessage = (e) => {
                console.debug('<--', e.data);
                this.handler(e.data);
            }
        } catch (e) {
            console.error(this.LOGTAG, e);
        }

    }
    close() {
        this.ws && this.ws.close();
        this.timeid && clearTimeout(this.timeid);
        this.ws = null;
    }
    send(data) {
        console.debug('-->', data);
        try {
            this.isopen() && this.ws.send(JSON.stringify(data));
        } catch (e) {
            this.ws.send(JSON.stringify({ id: data.id, error: { code: -32000, message: e.toString() } }));
        }
    }
    static isPromise(value) {
        return typeof value === 'object' && value !== null && typeof value.then === 'function';
    }
    handler(data) {
        let msg, result;
        try {
            msg = JSON.parse(data);
        } catch (e) {
            this.send({ id: null, error: { code: -32700, message: 'Parse error' } });
            return;
        }
        if (!msg.method) {
            this.onmsg(msg);
            return;
        }
        const id = msg.id || null;
        const parm = msg.params || [];
        const act = this.handlers[msg.method];
        if (!act) {
            this.send({ id, error: { code: -32601, message: 'Method not found' } });
            return;
        }
        try {
            result = act.apply(null, parm);
        } catch (e) {
            this.send({ id, error: { code: -32001, message: e.toString() } });
            return;
        }
        if (HiRpc.isPromise(result)) {
            result.then(x => this.send({ id, result: x }))
                .catch(x => this.send({ id, error: { code: -32002, message: x.toString() } }));
        } else {
            this.send({ id, result });
        }
    }
    isopen() {
        return this.ws && this.ws.readyState == WebSocket.OPEN;
    }
    register(func, name) {
        if (typeof func !== 'function') {
            throw new Error('func must be function');
        }
        name = name || func.name;
        this.handlers[name] = func;
    }
    unregister(name) {
        if (this.handlers[name]) {
            delete this.handlers[name];
        }
    }
    onmsg(msg) {
        console.info(this.LOGTAG, 'RECV:', msg);
    }
}

(() => {
    let _ws = document.currentScript?.getAttribute('host');
    if (_ws) window.hirpc = new HiRpc(_ws);
})();
